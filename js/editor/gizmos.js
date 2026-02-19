/**
 * WebGL Engine - Transform Gizmos
 * Move, Rotate, Scale handles in 3D viewport
 */
class GizmoRenderer {
  constructor(engine) {
    this.engine = engine;
    this.mode = 'select'; // select, move, rotate, scale
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
    
    // Draw mini 3D axes
    const cx = W/2, cy = H/2;
    const view = renderer._editorViewMat;
    const axes = [
      { dir: new Vec3(1,0,0), color:'#e74c3c', label:'X' },
      { dir: new Vec3(0,1,0), color:'#2ecc71', label:'Y' },
      { dir: new Vec3(0,0,-1), color:'#4a9eff', label:'Z' },
    ];
    
    // Project axis vectors through view matrix
    const scale = 28;
    const projected = axes.map(ax => {
      const v = view.multiplyVec4(new Vec4(ax.dir.x, ax.dir.y, ax.dir.z, 0));
      return { ...ax, px: cx + v.x * scale, py: cy - v.y * scale };
    });
    
    // Sort by depth (draw farthest first)
    projected.sort((a,b) => {
      const va = view.multiplyVec4(new Vec4(a.dir.x, a.dir.y, a.dir.z, 0));
      const vb = view.multiplyVec4(new Vec4(b.dir.x, b.dir.y, b.dir.z, 0));
      return va.z - vb.z;
    });
    
    for (const ax of projected) {
      ctx.strokeStyle = ax.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy); ctx.lineTo(ax.px, ax.py);
      ctx.stroke();
      ctx.fillStyle = ax.color;
      ctx.beginPath(); ctx.arc(ax.px, ax.py, 5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'white'; ctx.font = 'bold 9px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(ax.label, ax.px, ax.py);
    }
  }
  
  _handleAxisClick(x, y) {
    const W = this._gizmoCanvas.width, H = this._gizmoCanvas.height;
    const cx = W/2, cy = H/2;
    // Simple face snapping
    if (x > cx+15) this.engine.renderer.editorCamera.yaw = -90;
    else if (x < cx-15) this.engine.renderer.editorCamera.yaw = 90;
    else if (y < cy-15) this.engine.renderer.editorCamera.pitch = 89;
    else if (y > cy+15) this.engine.renderer.editorCamera.pitch = -89;
  }
  
  // Handle mouse interaction for gizmos in scene view
  handleMouseDown(e, renderer, scene) {
    const obj = this.engine.selectedObject;
    if (!obj) return false;
    
    const canvas = renderer.canvas;
    const r = canvas.getBoundingClientRect();
    const sx = e.clientX - r.left, sy = e.clientY - r.top;
    
    if (this.mode === 'move') {
      // Check which axis handle was clicked
      const axis = this._pickMoveAxis(sx, sy, obj, renderer);
      if (axis) {
        this._dragging = true;
        this._dragAxis = axis;
        this._dragStart = { x: sx, y: sy };
        this._objStartPos = obj.transform.position.clone();
        return true;
      }
    } else if (this.mode === 'scale') {
      const axis = this._pickScaleAxis(sx, sy, obj, renderer);
      if (axis) {
        this._dragging = true;
        this._dragAxis = axis;
        this._dragStart = { x: sx, y: sy };
        this._objStartScale = obj.transform.scale.clone();
        return true;
      }
    } else if (this.mode === 'rotate') {
      this._dragging = true;
      this._dragAxis = 'y';
      this._dragStart = { x: sx, y: sy };
      this._objStartRot = obj.transform.rotation.clone();
      return false; // Don't consume - rotation check is loose
    }
    return false;
  }
  
  handleMouseMove(e, renderer) {
    if (!this._dragging) return false;
    const obj = this.engine.selectedObject;
    if (!obj) return false;
    
    const canvas = renderer.canvas;
    const r = canvas.getBoundingClientRect();
    const sx = e.clientX - r.left, sy = e.clientY - r.top;
    const dx = (sx - this._dragStart.x) * 0.01;
    const dy = (sy - this._dragStart.y) * 0.01;
    
    if (this.mode === 'move') {
      const pos = this._objStartPos.clone();
      if (this._dragAxis === 'x') pos.x += dx * 5;
      else if (this._dragAxis === 'y') pos.y -= dy * 5;
      else if (this._dragAxis === 'z') pos.z += dx * 5;
      else { pos.x += dx * 5; pos.z += dx * 5; }
      obj.transform.setPosition(pos);
    } else if (this.mode === 'scale') {
      const scale = this._objStartScale.clone();
      const delta = 1 + dx * 2;
      if (this._dragAxis === 'x') scale.x = Math.max(0.01, scale.x * delta);
      else if (this._dragAxis === 'y') scale.y = Math.max(0.01, scale.y * delta);
      else if (this._dragAxis === 'z') scale.z = Math.max(0.01, scale.z * delta);
      else { const d = Math.max(0.01, delta); scale.x*=d; scale.y*=d; scale.z*=d; }
      obj.transform.setScale(scale);
    } else if (this.mode === 'rotate') {
      const rot = this._objStartRot.clone();
      rot.y += dx * 100;
      rot.x -= dy * 100;
      obj.transform.setRotation(rot);
    }
    
    this.engine.inspector?.render(obj);
    return true;
  }
  
  handleMouseUp() {
    if (this._dragging) {
      this._dragging = false;
      this._dragAxis = null;
    }
  }
  
  _projectPoint(pos, renderer) {
    if (!renderer._editorViewMat || !renderer._editorProjMat) return null;
    const canvas = renderer.canvas;
    const W = canvas.width, H = canvas.height;
    const clip = renderer._editorProjMat.multiplyVec4(renderer._editorViewMat.multiplyVec4(new Vec4(pos.x,pos.y,pos.z,1)));
    if (clip.w <= 0) return null;
    return { x: (clip.x/clip.w*0.5+0.5)*W, y: (1-clip.y/clip.w*0.5-0.5)*H };
  }
  
  _pickMoveAxis(sx, sy, obj, renderer) {
    const pos = obj.transform.worldPosition;
    const dist = renderer.editorCamera.distance;
    const arrowLen = dist * 0.15;
    
    const endX = this._projectPoint(pos.add(new Vec3(arrowLen,0,0)), renderer);
    const endY = this._projectPoint(pos.add(new Vec3(0,arrowLen,0)), renderer);
    const endZ = this._projectPoint(pos.add(new Vec3(0,0,-arrowLen)), renderer);
    const center = this._projectPoint(pos, renderer);
    
    if (!center) return null;
    
    const hitRadius = 12;
    const lineTol = 8;
    
    if (endX && this._pointNearLine(sx,sy, center.x,center.y, endX.x,endX.y, lineTol)) return 'x';
    if (endY && this._pointNearLine(sx,sy, center.x,center.y, endY.x,endY.y, lineTol)) return 'y';
    if (endZ && this._pointNearLine(sx,sy, center.x,center.y, endZ.x,endZ.y, lineTol)) return 'z';
    if (Math.sqrt((sx-center.x)**2+(sy-center.y)**2) < hitRadius) return 'xyz';
    return null;
  }
  
  _pickScaleAxis(sx, sy, obj, renderer) { return this._pickMoveAxis(sx,sy,obj,renderer); }
  
  _pointNearLine(px,py, x1,y1, x2,y2, tol) {
    const dx=x2-x1, dy=y2-y1;
    const len = Math.sqrt(dx*dx+dy*dy);
    if (len < 0.01) return false;
    const t = MathUtils.clamp(((px-x1)*dx+(py-y1)*dy)/(len*len), 0, 1);
    const cx=x1+t*dx, cy=y1+t*dy;
    return Math.sqrt((px-cx)**2+(py-cy)**2) < tol;
  }
  
  drawGizmos(renderer, scene) {
    const obj = this.engine.selectedObject;
    if (!obj || this.mode === 'select') {
      this.drawAxisGizmo(renderer);
      return;
    }
    
    // Draw gizmo lines using WebGL
    const gl = renderer.glCtx.gl;
    const pos = obj.transform.worldPosition;
    const dist = renderer.editorCamera.distance;
    const len = dist * 0.15;
    
    if (!renderer._editorViewMat) { this.drawAxisGizmo(renderer); return; }
    
    const prog = renderer.programs.wireframe.use();
    prog.setMat4('uView', renderer._editorViewMat);
    prog.setMat4('uProjection', renderer._editorProjMat);
    
    const identity = new Mat4();
    prog.setMat4('uModel', identity);
    
    const drawArrow = (end, color) => {
      const verts = new Float32Array([pos.x, pos.y, pos.z, end.x, end.y, end.z]);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
      const loc = prog.attribs['aPosition'];
      if (loc>=0) { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0); }
      prog.setVec4('uColor', color);
      gl.lineWidth?.(3);
      gl.drawArrays(gl.LINES, 0, 2);
      gl.deleteBuffer(buf);
    };
    
    if (this.mode === 'move' || this.mode === 'scale') {
      gl.disable(gl.DEPTH_TEST);
      drawArrow(pos.add(new Vec3(len,0,0)), [0.9,0.2,0.2,1]); // X red
      drawArrow(pos.add(new Vec3(0,len,0)), [0.2,0.9,0.2,1]); // Y green
      drawArrow(pos.add(new Vec3(0,0,-len)), [0.2,0.2,0.9,1]); // Z blue
      gl.enable(gl.DEPTH_TEST);
    } else if (this.mode === 'rotate') {
      // Draw rotation rings (simplified as lines)
      gl.disable(gl.DEPTH_TEST);
      const segs = 32;
      const drawRing = (plane, color) => {
        const verts = [];
        for (let i=0;i<=segs;i++) {
          const a=2*Math.PI*i/segs;
          if (plane==='y') verts.push(pos.x+len*Math.cos(a), pos.y, pos.z+len*Math.sin(a));
          else if (plane==='x') verts.push(pos.x, pos.y+len*Math.cos(a), pos.z+len*Math.sin(a));
          else verts.push(pos.x+len*Math.cos(a), pos.y+len*Math.sin(a), pos.z);
        }
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
        const loc = prog.attribs['aPosition'];
        if(loc>=0){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);}
        prog.setVec4('uColor', color);
        gl.drawArrays(gl.LINE_STRIP, 0, segs+1);
        gl.deleteBuffer(buf);
      };
      drawRing('y', [0.2,0.9,0.2,1]);
      drawRing('x', [0.9,0.2,0.2,1]);
      drawRing('z', [0.2,0.2,0.9,1]);
      gl.enable(gl.DEPTH_TEST);
    }
    
    gl.lineWidth?.(1);
    this.drawAxisGizmo(renderer);
  }
}
