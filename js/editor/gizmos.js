/**
 * WebGL Engine - Transform Gizmos
 * FIXED: always on selected object, mode-aware, correct hit detection, touch support
 */
class GizmoRenderer {
  constructor(engine) {
    this.engine = engine;
    this.mode = 'select';
    this._dragging = false;
    this._dragAxis = null;
    this._dragStart = null;
    this._objStartPos = null;
    this._objStartRot = null;
    this._objStartScale = null;
    this._setupAxisGizmo();
  }

  _setupAxisGizmo() {
    const canvas = document.getElementById('gizmo-canvas');
    if (!canvas) return;
    this._gizmoCanvas = canvas;
    this._gizmoCtx = canvas.getContext('2d');
    canvas.addEventListener('click', e => {
      const r = canvas.getBoundingClientRect();
      this._handleAxisClick(e.clientX - r.left, e.clientY - r.top);
    });
  }

  drawAxisGizmo(renderer) {
    const canvas = this._gizmoCanvas, ctx = this._gizmoCtx;
    if (!canvas || !ctx || !renderer._editorViewMat) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.beginPath();
    ctx.arc(W/2, H/2, W/2-1, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(18,18,28,0.6)';
    ctx.fill();

    const cx = W/2, cy = H/2, scale = 26;
    const view = renderer._editorViewMat;
    const axes = [
      { dir: [1,0,0],  neg: [-1,0,0],  color:'#e74c3c', nc:'#6a1010', label:'X' },
      { dir: [0,1,0],  neg: [0,-1,0],  color:'#2ecc71', nc:'#0a4a20', label:'Y' },
      { dir: [0,0,-1], neg: [0,0,1],   color:'#4a9eff', nc:'#0a205a', label:'Z' },
    ];

    const project = (d) => {
      const v = view.multiplyVec4(new Vec4(d[0], d[1], d[2], 0));
      return { x: cx + v.x*scale, y: cy - v.y*scale, z: v.z };
    };

    const proj = axes.map(ax => ({
      ...ax,
      p: project(ax.dir),
      n: project(ax.neg),
    })).sort((a,b) => a.p.z - b.p.z);

    // Negative (dashed)
    ctx.setLineDash([3,3]);
    for (const ax of proj) {
      ctx.strokeStyle = ax.nc; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(ax.n.x,ax.n.y); ctx.stroke();
    }
    ctx.setLineDash([]);
    // Positive
    for (const ax of [...proj].reverse()) {
      ctx.strokeStyle = ax.color; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(ax.p.x,ax.p.y); ctx.stroke();
      ctx.fillStyle = ax.color;
      ctx.beginPath(); ctx.arc(ax.p.x,ax.p.y,5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff'; ctx.font='bold 8px system-ui';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(ax.label,ax.p.x,ax.p.y);
    }
  }

  _handleAxisClick(x, y) {
    if (!this.engine.renderer) return;
    const W=this._gizmoCanvas.width, H=this._gizmoCanvas.height;
    const cx=W/2, cy=H/2, cam=this.engine.renderer.editorCamera;
    const dx=x-cx, dy=y-cy;
    if (Math.abs(dx)>Math.abs(dy)) { cam.yaw = dx>0 ? -90 : 90; }
    else { cam.pitch = dy>0 ? 89 : -89; }
  }

  // Returns client coords from mouse or touch event
  _evtXY(e, canvas) {
    const r = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - r.left, y: src.clientY - r.top };
  }

  handleMouseDown(e, renderer, scene) {
    const obj = this.engine.selectedObject;
    if (!obj || this.mode === 'select') return false;
    if (e.altKey) return false;

    const { x: sx, y: sy } = this._evtXY(e, renderer.canvas);
    let axis = null;
    if (this.mode === 'move' || this.mode === 'scale') axis = this._pickMoveAxis(sx,sy,obj,renderer);
    else if (this.mode === 'rotate') axis = this._pickRotateAxis(sx,sy,obj,renderer);
    if (!axis) return false;

    this._dragging = true;
    this._dragAxis = axis;
    this._dragStart = { x: sx, y: sy };
    this._objStartPos   = obj.transform.position.clone();
    this._objStartRot   = obj.transform.rotation.clone();
    this._objStartScale = obj.transform.scale.clone();
    this.engine._saveUndoState();
    return true;
  }

  handleMouseMove(e, renderer) {
    if (!this._dragging) return false;
    const obj = this.engine.selectedObject;
    if (!obj) { this._dragging = false; return false; }

    const { x: sx, y: sy } = this._evtXY(e, renderer.canvas);
    const dx = sx - this._dragStart.x;
    const dy = sy - this._dragStart.y;
    const dist = renderer.editorCamera.distance;
    const sens = Math.max(0.001, dist * 0.0025);

    if (this.mode === 'move') {
      const p = this._objStartPos.clone();
      if (this._dragAxis === 'x')        p.x += dx * sens;
      else if (this._dragAxis === 'y')   p.y -= dy * sens;
      else if (this._dragAxis === 'z')   p.z += dx * sens;
      else { p.x += dx*sens*0.6; p.z += dx*sens*0.6; }
      obj.transform.setPosition(p.x, p.y, p.z);

    } else if (this.mode === 'scale') {
      const delta = 1 + dx * 0.008;
      const s = this._objStartScale.clone();
      if (this._dragAxis === 'x')        s.x = Math.max(0.001, s.x*delta);
      else if (this._dragAxis === 'y')   s.y = Math.max(0.001, s.y*delta);
      else if (this._dragAxis === 'z')   s.z = Math.max(0.001, s.z*delta);
      else { const d=Math.max(0.001,delta); s.x*=d; s.y*=d; s.z*=d; }
      obj.transform.setScale(s.x, s.y, s.z);

    } else if (this.mode === 'rotate') {
      const r = this._objStartRot.clone();
      const deg = 180;
      const W = renderer.canvas.width, H = renderer.canvas.height;
      if (this._dragAxis === 'y')        r.y += dx/W*deg;
      else if (this._dragAxis === 'x')   r.x -= dy/H*deg;
      else if (this._dragAxis === 'z')   r.z += dx/W*deg;
      else { r.y += dx/W*deg; r.x -= dy/H*deg; }
      obj.transform.setRotation(r.x, r.y, r.z);
    }

    this.engine.inspector?.render(obj);
    this.engine._scheduleSave();
    return true;
  }

  handleMouseUp() {
    this._dragging = false;
    this._dragAxis = null;
  }

  // ── Projection ──────────────────────────────────────────────────────────
  _project(pos, renderer) {
    if (!renderer._editorViewMat || !renderer._editorProjMat) return null;
    const W = renderer.canvas.width, H = renderer.canvas.height;
    const clip = renderer._editorProjMat.multiplyVec4(
      renderer._editorViewMat.multiplyVec4(new Vec4(pos.x, pos.y, pos.z, 1))
    );
    if (clip.w <= 0) return null;
    return {
      x: (clip.x/clip.w * 0.5 + 0.5) * W,
      y: (1 - (clip.y/clip.w * 0.5 + 0.5)) * H,
    };
  }

  _gizmoLen(renderer) {
    return Math.max(0.3, renderer.editorCamera.distance * 0.14);
  }

  _pickMoveAxis(sx, sy, obj, renderer) {
    const p = obj.transform.worldPosition;
    const len = this._gizmoLen(renderer);
    const c  = this._project(p, renderer); if (!c) return null;
    const ex = this._project(new Vec3(p.x+len,p.y,p.z),   renderer);
    const ey = this._project(new Vec3(p.x,p.y+len,p.z),   renderer);
    const ez = this._project(new Vec3(p.x,p.y,p.z-len),   renderer);
    const TC=16, TL=13;
    if (Math.hypot(sx-c.x,sy-c.y) < TC)              return 'xyz';
    if (ex && this._nearSeg(sx,sy,c,ex,TL))           return 'x';
    if (ey && this._nearSeg(sx,sy,c,ey,TL))           return 'y';
    if (ez && this._nearSeg(sx,sy,c,ez,TL))           return 'z';
    return null;
  }

  _pickRotateAxis(sx, sy, obj, renderer) {
    const p = obj.transform.worldPosition;
    const len = this._gizmoLen(renderer);
    const c = this._project(p, renderer); if (!c) return null;
    const ref = this._project(new Vec3(p.x+len,p.y,p.z), renderer);
    const R = ref ? Math.hypot(ref.x-c.x,ref.y-c.y) : 60;
    const d = Math.hypot(sx-c.x,sy-c.y);
    const TOL = 15;
    if (Math.abs(d - R)        < TOL) return 'y';
    if (Math.abs(d - R * 0.80) < TOL) return 'x';
    if (Math.abs(d - R * 0.60) < TOL) return 'z';
    return null;
  }

  _nearSeg(px, py, a, b, tol) {
    const dx=b.x-a.x, dy=b.y-a.y, l2=dx*dx+dy*dy;
    if (l2<0.01) return false;
    const t=Math.max(0,Math.min(1,((px-a.x)*dx+(py-a.y)*dy)/l2));
    return Math.hypot(px-(a.x+t*dx), py-(a.y+t*dy)) < tol;
  }

  // ── WebGL drawing ────────────────────────────────────────────────────────
  drawGizmos(renderer, scene) {
    if (!renderer || !renderer.programs) return;
    this.drawAxisGizmo(renderer);
    const obj = this.engine.selectedObject;
    if (!obj || this.mode === 'select') return;
    if (!renderer._editorViewMat) return;

    const gl  = renderer.glCtx.gl;
    const prog = renderer.programs.wireframe;
    if (!prog) return;
    prog.use();
    prog.setMat4('uView', renderer._editorViewMat);
    prog.setMat4('uProjection', renderer._editorProjMat);
    prog.setMat4('uModel', new Mat4());
    gl.disable(gl.DEPTH_TEST);

    const p = obj.transform.worldPosition;
    const len = this._gizmoLen(renderer);

    if (this.mode === 'move' || this.mode === 'scale') {
      const ts = len * 0.09;
      // Axes
      this._line(gl,prog, p, new Vec3(p.x+len,p.y,p.z),   [0.95,0.2,0.2,1]);
      this._line(gl,prog, p, new Vec3(p.x,p.y+len,p.z),   [0.2,0.95,0.2,1]);
      this._line(gl,prog, p, new Vec3(p.x,p.y,p.z-len),   [0.3,0.5,1.0,1]);
      // Tips
      this._cube(gl,prog, new Vec3(p.x+len,p.y,p.z),   ts, [0.95,0.2,0.2,1]);
      this._cube(gl,prog, new Vec3(p.x,p.y+len,p.z),   ts, [0.2,0.95,0.2,1]);
      this._cube(gl,prog, new Vec3(p.x,p.y,p.z-len),   ts, [0.3,0.5,1.0,1]);
      // Center
      this._cube(gl,prog, p, ts*1.3, [1,1,1,0.95]);

    } else if (this.mode === 'rotate') {
      this._ring(gl,prog, p, len,       'y', [0.2,0.95,0.2,1]);
      this._ring(gl,prog, p, len*0.80,  'x', [0.95,0.2,0.2,1]);
      this._ring(gl,prog, p, len*0.60,  'z', [0.3,0.5,1.0,1]);
    }

    gl.enable(gl.DEPTH_TEST);
  }

  _line(gl, prog, a, b, color) {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([a.x,a.y,a.z, b.x,b.y,b.z]), gl.DYNAMIC_DRAW);
    const loc = prog.attribs['aPosition'];
    if (loc>=0){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);}
    prog.setVec4('uColor', color);
    gl.drawArrays(gl.LINES, 0, 2);
    gl.deleteBuffer(buf);
  }

  _cube(gl, prog, c, s, color) {
    const vx=[c.x-s,c.y-s,c.z-s, c.x+s,c.y-s,c.z-s, c.x+s,c.y+s,c.z-s, c.x-s,c.y+s,c.z-s,
              c.x-s,c.y-s,c.z+s, c.x+s,c.y-s,c.z+s, c.x+s,c.y+s,c.z+s, c.x-s,c.y+s,c.z+s];
    const idx=[0,1,1,2,2,3,3,0, 4,5,5,6,6,7,7,4, 0,4,1,5,2,6,3,7];
    const verts=[]; for(const i of idx) verts.push(vx[i*3],vx[i*3+1],vx[i*3+2]);
    const buf=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.DYNAMIC_DRAW);
    const loc=prog.attribs['aPosition'];
    if(loc>=0){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);}
    prog.setVec4('uColor',color);
    gl.drawArrays(gl.LINES,0,verts.length/3);
    gl.deleteBuffer(buf);
  }

  _ring(gl, prog, center, r, plane, color) {
    const N=48, verts=[];
    for(let i=0;i<=N;i++){
      const a=2*Math.PI*i/N, co=Math.cos(a)*r, si=Math.sin(a)*r;
      if(plane==='y')      verts.push(center.x+co, center.y,     center.z+si);
      else if(plane==='x') verts.push(center.x,    center.y+co, center.z+si);
      else                 verts.push(center.x+co, center.y+si,  center.z);
    }
    const buf=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.DYNAMIC_DRAW);
    const loc=prog.attribs['aPosition'];
    if(loc>=0){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);}
    prog.setVec4('uColor',color);
    gl.drawArrays(gl.LINE_STRIP,0,N+1);
    gl.deleteBuffer(buf);
  }
}
