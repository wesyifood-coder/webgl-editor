/**
 * WebGL Engine - 3D Modeler
 * Vertex, Edge, Face editing modes
 */
class ModelerEditor {
  constructor(engine) {
    this.engine = engine;
    this.canvas = document.getElementById('modeler-canvas');
    this.ctx = null;
    this.glCtx = null;
    this.mode = 'vertex'; // vertex, edge, face
    this.mesh = null;
    this.selectedVerts = new Set();
    this.selectedEdges = new Set();
    this.selectedFaces = new Set();
    this.history = [];
    this._historyPtr = 0;
    this._camera = { yaw: -30, pitch: -20, distance: 5, target: new Vec3() };
    this._init();
    this._setupUI();
    this._setupModeButtons();
  }
  
  _init() {
    if (!this.canvas) return;
    try {
      this.glCtx = new WebGLContext(this.canvas);
      this._modProg = this.glCtx.createProgram(SHADERS.wireframeVert, SHADERS.wireframeFrag, 'modeler');
    } catch(e) {
      // Fallback to 2D canvas
      this.ctx = this.canvas.getContext('2d');
    }
    
    this._setupInteraction();
    const obs = new ResizeObserver(() => this._resize());
    obs.observe(this.canvas.parentElement || document.body);
    this._resize();
  }
  
  _resize() {
    if (!this.canvas) return;
    const p = this.canvas.parentElement;
    if (p) { this.canvas.width = p.clientWidth; this.canvas.height = p.clientHeight; }
    this._draw();
  }
  
  _setupUI() {
    document.getElementById('btn-extrude')?.addEventListener('click', () => this.extrude());
    document.getElementById('btn-bevel')?.addEventListener('click', () => this.bevel());
    document.getElementById('btn-loop-cut')?.addEventListener('click', () => this.loopCut());
    document.getElementById('btn-merge')?.addEventListener('click', () => this.mergeSelected());
    document.getElementById('btn-subdivide')?.addEventListener('click', () => this.subdivide());
    document.getElementById('btn-uv-unwrap')?.addEventListener('click', () => this.uvUnwrap());
  }
  
  _setupModeButtons() {
    document.querySelectorAll('.model-btn[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.model-btn[data-mode]').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        this.mode = btn.dataset.mode;
        this.selectedVerts.clear(); this.selectedEdges.clear(); this.selectedFaces.clear();
        this._draw();
      });
    });
  }
  
  _setupInteraction() {
    if (!this.canvas) return;
    let mouseBtn = -1, lastX = 0, lastY = 0;
    
    this.canvas.addEventListener('mousedown', e => {
      mouseBtn = e.button; lastX = e.clientX; lastY = e.clientY;
      if (e.button === 0) this._selectAt(e);
    });
    
    this.canvas.addEventListener('mousemove', e => {
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      if (mouseBtn === 1 || (mouseBtn === 0 && e.altKey)) {
        this._camera.yaw -= dx * 0.3;
        this._camera.pitch = MathUtils.clamp(this._camera.pitch - dy * 0.3, -89, 89);
        this._draw();
      }
      lastX = e.clientX; lastY = e.clientY;
    });
    
    this.canvas.addEventListener('mouseup', () => mouseBtn = -1);
    this.canvas.addEventListener('wheel', e => {
      this._camera.distance *= e.deltaY > 0 ? 1.1 : 0.9;
      this._camera.distance = MathUtils.clamp(this._camera.distance, 0.5, 50);
      this._draw();
    }, { passive: true });
  }
  
  openMesh(mesh) {
    this.mesh = mesh.clone ? mesh.clone() : mesh;
    this.selectedVerts.clear();
    this._draw();
  }
  
  _selectAt(e) {
    if (!this.mesh) return;
    const r = this.canvas.getBoundingClientRect();
    const sx = e.clientX - r.left, sy = e.clientY - r.top;
    // Simple vertex picking
    if (this.mode === 'vertex') {
      const projected = this._projectVertices();
      let closest = -1, minDist = 15;
      projected.forEach((p, i) => {
        const dist = Math.sqrt((p.x-sx)**2+(p.y-sy)**2);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      if (closest >= 0) {
        if (e.shiftKey) {
          if (this.selectedVerts.has(closest)) this.selectedVerts.delete(closest);
          else this.selectedVerts.add(closest);
        } else {
          this.selectedVerts.clear();
          this.selectedVerts.add(closest);
        }
        this._draw();
      }
    }
  }
  
  _projectVertices() {
    if (!this.mesh) return [];
    const W = this.canvas.width, H = this.canvas.height;
    const cam = this._camera;
    const pitch = cam.pitch * MathUtils.DEG2RAD;
    const yaw = cam.yaw * MathUtils.DEG2RAD;
    const eye = new Vec3(
      cam.distance*Math.cos(pitch)*Math.sin(yaw),
      cam.distance*Math.sin(pitch),
      cam.distance*Math.cos(pitch)*Math.cos(yaw)
    ).add(cam.target);
    const view = Mat4.lookAt(eye, cam.target, Vec3.up());
    const proj = Mat4.perspective(60, W/H, 0.01, 100);
    
    const results = [];
    const verts = this.mesh.vertices;
    for (let i=0;i<verts.length;i+=3) {
      const v = new Vec3(verts[i],verts[i+1],verts[i+2]);
      const clip = proj.multiplyVec4(view.multiplyVec4(new Vec4(v.x,v.y,v.z,1)));
      if (clip.w <= 0) { results.push({x:-9999,y:-9999,z:0,visible:false}); continue; }
      const ndcX = clip.x/clip.w, ndcY = clip.y/clip.w;
      results.push({ x:(ndcX*0.5+0.5)*W, y:(1-(ndcY*0.5+0.5))*H, z:clip.z/clip.w, visible:true });
    }
    return results;
  }
  
  _draw() {
    if (!this.canvas) return;
    // Use 2D canvas drawing for simplicity
    const canvas = this.canvas;
    let ctx = this.ctx;
    if (!ctx) {
      // Try to get 2D context for overlay
      const overlay = document.createElement('canvas');
      overlay.width = canvas.width; overlay.height = canvas.height;
      ctx = overlay.getContext('2d');
      if (!ctx) return;
      canvas._overlayCtx = ctx;
      canvas._overlay = overlay;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (!this.mesh) {
      ctx.fillStyle = '#555';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Selecione um objeto com Mesh para editar', canvas.width/2, canvas.height/2);
      return;
    }
    
    const projected = this._projectVertices();
    const verts = this.mesh.vertices;
    const indices = this.mesh.indices;
    
    // Draw edges (wireframe)
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    for (let i=0;i<indices.length;i+=3) {
      const a=projected[indices[i]], b=projected[indices[i+1]], c=projected[indices[i+2]];
      if (!a.visible||!b.visible||!c.visible) continue;
      ctx.beginPath();
      ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
      ctx.lineTo(c.x,c.y); ctx.lineTo(a.x,a.y);
      ctx.stroke();
    }
    
    // Draw vertices
    if (this.mode === 'vertex') {
      projected.forEach((p, i) => {
        if (!p.visible) return;
        const selected = this.selectedVerts.has(i);
        ctx.fillStyle = selected ? '#f39c12' : '#4a9eff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, selected ? 5 : 3, 0, Math.PI*2);
        ctx.fill();
      });
    }
    
    // Axes gizmo
    ctx.font='11px system-ui';
    ctx.textAlign='center';
    ctx.fillStyle='red'; ctx.fillText('X', canvas.width-30, canvas.height-50);
    ctx.fillStyle='#2ecc71'; ctx.fillText('Y', canvas.width-20, canvas.height-65);
    ctx.fillStyle='#4a9eff'; ctx.fillText('Z', canvas.width-40, canvas.height-60);
    
    // Draw mode label
    ctx.fillStyle = '#888'; ctx.font='11px system-ui'; ctx.textAlign='left';
    ctx.fillText(`Modo: ${this.mode.toUpperCase()} | Verts: ${verts.length/3} | Selecionados: ${this.selectedVerts.size}`, 10, 20);
    
    if (canvas._overlay) {
      const realCtx = canvas.getContext('2d');
      if (realCtx) realCtx.drawImage(canvas._overlay, 0, 0);
    }
  }
  
  // ===== MESH OPERATIONS =====
  extrude() {
    if (!this.mesh || this.selectedVerts.size === 0) return;
    this._saveHistory();
    const verts = this.mesh.vertices;
    const newVerts = [];
    this.selectedVerts.forEach(vi => {
      const x=verts[vi*3], y=verts[vi*3+1], z=verts[vi*3+2];
      newVerts.push(x, y+0.5, z); // Extrude upward
    });
    // Add new vertices and indices
    const startIdx = verts.length / 3;
    this.mesh.vertices = [...verts, ...newVerts];
    const newNorms = new Array(newVerts.length).fill(0);
    this.mesh.normals = [...this.mesh.normals, ...newNorms];
    this.mesh.uvs = [...this.mesh.uvs, ...new Array(newVerts.length/3*2).fill(0)];
    this._draw();
    this.engine.notification('Extrude realizado', 'success');
  }
  
  bevel() {
    this.engine.notification('Bevel: selecione arestas para bevel', 'warning');
  }
  
  loopCut() {
    this.engine.notification('Loop Cut: clique em uma aresta', 'warning');
  }
  
  mergeSelected() {
    if (this.selectedVerts.size < 2) return;
    this._saveHistory();
    const verts = this.mesh.vertices;
    let cx=0, cy=0, cz=0;
    this.selectedVerts.forEach(vi => { cx+=verts[vi*3]; cy+=verts[vi*3+1]; cz+=verts[vi*3+2]; });
    cx/=this.selectedVerts.size; cy/=this.selectedVerts.size; cz/=this.selectedVerts.size;
    const first = [...this.selectedVerts][0];
    verts[first*3]=cx; verts[first*3+1]=cy; verts[first*3+2]=cz;
    // Redirect all selected vert indices to first
    const remap = {};
    this.selectedVerts.forEach(vi => { remap[vi]=first; });
    this.mesh.indices = this.mesh.indices.map(i => remap[i]!==undefined ? remap[i] : i);
    this.selectedVerts.clear(); this.selectedVerts.add(first);
    this._draw();
  }
  
  subdivide() {
    if (!this.mesh) return;
    this._saveHistory();
    // Midpoint subdivision
    const verts = [...this.mesh.vertices];
    const indices = [...this.mesh.indices];
    const newVerts = [...verts];
    const newIndices = [];
    const midpoints = {};
    
    const getMid = (a, b) => {
      const key = [Math.min(a,b), Math.max(a,b)].join('-');
      if (midpoints[key] === undefined) {
        const mi = newVerts.length / 3;
        newVerts.push(
          (verts[a*3]+verts[b*3])/2,
          (verts[a*3+1]+verts[b*3+1])/2,
          (verts[a*3+2]+verts[b*3+2])/2
        );
        midpoints[key] = mi;
      }
      return midpoints[key];
    };
    
    for (let i=0;i<indices.length;i+=3) {
      const a=indices[i], b=indices[i+1], c=indices[i+2];
      const ab=getMid(a,b), bc=getMid(b,c), ca=getMid(c,a);
      newIndices.push(a,ab,ca, b,bc,ab, c,ca,bc, ab,bc,ca);
    }
    
    this.mesh.vertices = newVerts;
    this.mesh.indices = newIndices;
    this.mesh.normals = new Array(newVerts.length).fill(0);
    this.mesh.uvs = new Array(newVerts.length/3*2).fill(0);
    this.mesh.computeTangents();
    this._draw();
    this.engine.notification(`Subdividido: ${newVerts.length/3} vértices`);
  }
  
  uvUnwrap() {
    if (!this.mesh) return;
    // Simple spherical UV unwrap
    const verts = this.mesh.vertices;
    const uvs = [];
    for (let i=0;i<verts.length;i+=3) {
      const x=verts[i], y=verts[i+1], z=verts[i+2];
      const len = Math.sqrt(x*x+y*y+z*z);
      const nx=x/len, ny=y/len, nz=z/len;
      uvs.push(0.5+Math.atan2(nz,nx)/(2*Math.PI), 0.5-Math.asin(ny)/Math.PI);
    }
    this.mesh.uvs = uvs;
    this.engine.notification('UV Unwrap realizado (esférico)');
  }
  
  _saveHistory() {
    const state = { vertices: [...this.mesh.vertices], indices: [...this.mesh.indices], normals: [...this.mesh.normals] };
    this.history = this.history.slice(0, this._historyPtr);
    this.history.push(state);
    this._historyPtr = this.history.length;
  }
  
  undo() {
    if (this._historyPtr <= 0) return;
    this._historyPtr--;
    const state = this.history[this._historyPtr];
    this.mesh.vertices = [...state.vertices];
    this.mesh.indices = [...state.indices];
    this.mesh.normals = [...state.normals];
    this._draw();
  }
  
  applyToObject(obj) {
    if (!this.mesh) return;
    const mr = obj.getComponent('MeshRenderer');
    if (mr) {
      mr.mesh = this.mesh;
      mr.mesh.upload(this.engine.renderer.glCtx);
    }
  }
}
