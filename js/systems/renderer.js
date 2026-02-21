/**
 * WebGL Engine - Renderer
 * FIXED: null checks everywhere, Color→setVec3, grid drawing without fwidth,
 *        outline works even without uploaded mesh, pickObject uses world scale
 */
class Renderer {
  constructor(canvas, isGameView = false) {
    this.canvas = canvas;
    this.isGameView = isGameView;

    try {
      this.glCtx = new WebGLContext(canvas);
    } catch (e) {
      console.error('WebGL init failed:', e.message);
      this.glCtx = null;
      return;
    }

    const gl = this.glCtx.gl;

    // Compile all shader programs
    this.programs = {};
    const shaderDefs = {
      standard:  [SHADERS.standardVert,  SHADERS.standardFrag],
      unlit:     [SHADERS.unlitVert,     SHADERS.unlitFrag],
      wireframe: [SHADERS.wireframeVert, SHADERS.wireframeFrag],
      grid:      [SHADERS.gridVert,      SHADERS.gridFrag],
      skybox:    [SHADERS.skyboxVert,    SHADERS.skyboxFrag],
      outline:   [SHADERS.outlineVert,   SHADERS.outlineFrag],
      particle:  [SHADERS.particleVert,  SHADERS.particleFrag],
    };
    for (const [name, [vert, frag]] of Object.entries(shaderDefs)) {
      try {
        this.programs[name] = this.glCtx.createProgram(vert, frag, name);
      } catch (e) {
        console.error('Shader compile failed [' + name + ']:', e.message);
      }
    }

    // Mesh cache
    this._meshCache = {};

    // Grid: simple CPU-generated line mesh (no fwidth needed)
    this._gridMesh = this._createGridMesh(50, 1);

    // Skybox
    this._skyboxMesh = Primitives.skybox();
    this._skyboxMesh.upload(this.glCtx);

    // Particle buffers keyed by object id
    this._particleBuffers = {};

    // Editor camera state
    this.editorCamera = {
      target: new Vec3(0, 0, 0),
      distance: 15,
      yaw: -30,
      pitch: -20,
      fov: 60,
      near: 0.01,
      far: 2000,
      orthographic: false,
      orthoSize: 5,
    };

    // Rendering settings
    this.showGrid = true;
    this.showWireframe = false;
    this.showSkybox = true;
    this.selectedObject = null;
    this.ambientColor = new Color(0.1, 0.1, 0.15);
    this.ambientIntensity = 0.3;
    this.fogEnabled = false;
    this.fogColor = new Color(0.5, 0.7, 0.9);
    this.fogDensity = 0.01;

    // GL global state
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);

    this.fps = 0;
    this._frameCount = 0;
    this._editorCamPos = new Vec3(5, 5, 10);
    this._editorViewMat = new Mat4();
    this._editorProjMat = new Mat4();
  }

  // ─────────────────────────────────────────────
  _createGridMesh(halfSize, step) {
    const gl = this.glCtx.gl;
    // Fine grid (step=1)
    const vertsF = [];
    for (let i = -halfSize; i <= halfSize; i += step) {
      vertsF.push(-halfSize, 0, i,  halfSize, 0, i);
      vertsF.push(i, 0, -halfSize,  i, 0, halfSize);
    }
    const bufFine = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufFine);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertsF), gl.STATIC_DRAW);

    // Coarse grid (step=5) — drawn brighter
    const vertsC = [];
    for (let i = -halfSize; i <= halfSize; i += 5) {
      vertsC.push(-halfSize, 0, i,  halfSize, 0, i);
      vertsC.push(i, 0, -halfSize,  i, 0, halfSize);
    }
    const bufCoarse = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufCoarse);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertsC), gl.STATIC_DRAW);

    return {
      _posBuffer: bufFine,  _lineCount: vertsF.length / 3,
      _coarseBuffer: bufCoarse, _coarseLineCount: vertsC.length / 3,
    };
  }

  getMesh(name) {
    if (!this._meshCache[name]) {
      let mesh;
      switch (name) {
        case 'Cube':     mesh = Primitives.cube();         break;
        case 'Sphere':   mesh = Primitives.sphere();       break;
        case 'Plane':    mesh = Primitives.plane(10, 10);  break;
        case 'Cylinder': mesh = Primitives.cylinder();     break;
        case 'Capsule':  mesh = Primitives.capsule();      break;
        case 'Quad':     mesh = Primitives.quad();         break;
        case 'Torus':    mesh = Primitives.torus();        break;
        default:         mesh = Primitives.cube();
      }
      mesh.upload(this.glCtx);
      this._meshCache[name] = mesh;
    }
    return this._meshCache[name];
  }

  // ─────────────────────────────────────────────
  render(scene, dt) {
    if (!this.glCtx) return;
    const gl = this.glCtx.gl;

    try { this.glCtx.resize(); } catch (e) {}

    const W = this.glCtx.width;
    const H = this.glCtx.height;
    if (W === 0 || H === 0) return;

    gl.viewport(0, 0, W, H);

    if (dt > 0) this.fps = Math.round(1 / dt);

    // ── Camera ──
    let camPos, viewMat, projMat;
    if (this.isGameView && scene) {
      const camObjs = scene.getAllObjects().filter(o => o.getComponent('Camera'));
      if (camObjs.length > 0) {
        const camComp = camObjs[0].getComponent('Camera');
        camPos  = camObjs[0].transform.worldPosition;
        viewMat = camComp.getViewMatrix();
        projMat = camComp.getProjectionMatrix(W / H);
        const cc = camComp.clearColor || new Color(0.15, 0.15, 0.15);
        gl.clearColor(cc.r, cc.g, cc.b, 1);
      } else {
        this._calcEditorCamera(W, H);
        camPos = this._editorCamPos; viewMat = this._editorViewMat; projMat = this._editorProjMat;
        gl.clearColor(0.15, 0.15, 0.15, 1);
      }
    } else {
      this._calcEditorCamera(W, H);
      camPos = this._editorCamPos; viewMat = this._editorViewMat; projMat = this._editorProjMat;
      gl.clearColor(0.22, 0.22, 0.22, 1);
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (!scene) return;

    const lights = this._collectLights(scene);

    if (this.showSkybox) this._drawSkybox(scene, viewMat, projMat);
    if (!this.isGameView && this.showGrid) this._drawGrid(viewMat, projMat);

    // Draw all objects
    const allObjs = scene.getAllObjects();
    for (const obj of allObjs) {
      if (!obj || !obj.active) continue;
      try {
        this._drawObject(gl, obj, viewMat, projMat, camPos, lights, scene);
      } catch (e) {
        // swallow per-object errors so the rest renders
      }
    }

    // Selected object outline
    if (this.selectedObject && !this.isGameView) {
      try { this._drawOutline(this.selectedObject, viewMat, projMat); } catch (e) {}
    }
  }

  _calcEditorCamera(W, H) {
    const cam = this.editorCamera;
    const pitch = cam.pitch * MathUtils.DEG2RAD;
    const yaw   = cam.yaw   * MathUtils.DEG2RAD;
    const x = cam.target.x + cam.distance * Math.cos(pitch) * Math.sin(yaw);
    const y = cam.target.y + cam.distance * Math.sin(pitch);
    const z = cam.target.z + cam.distance * Math.cos(pitch) * Math.cos(yaw);
    this._editorCamPos = new Vec3(x, y, z);
    this._editorViewMat = Mat4.lookAt(this._editorCamPos, cam.target, Vec3.up());
    if (cam.orthographic) {
      const s = cam.orthoSize;
      this._editorProjMat = Mat4.orthographic(-s * (W / H), s * (W / H), -s, s, cam.near, cam.far);
    } else {
      this._editorProjMat = Mat4.perspective(cam.fov, W / H, cam.near, cam.far);
    }
  }

  _collectLights(scene) {
    const lights = { directional: [], point: [], spot: [] };
    for (const obj of scene.getAllObjects()) {
      if (!obj.active) continue;
      const light = obj.getComponent('Light');
      if (!light || !light.enabled) continue;
      const entry = {
        color: light.color,
        intensity: light.intensity,
        position: obj.transform.worldPosition,
        direction: obj.transform.forward,
        range: light.range || 10,
        spotAngle: light.spotAngle || 30,
      };
      if (light.lightType === 'directional') lights.directional.push(entry);
      else if (light.lightType === 'point')   lights.point.push(entry);
      else if (light.lightType === 'spot')    lights.spot.push(entry);
    }
    return lights;
  }

  _drawObject(gl, obj, viewMat, projMat, camPos, lights, scene) {
    const mr = obj.getComponent('MeshRenderer') || obj.getComponent('SkinnedMeshRenderer');
    if (!mr || !mr.enabled) {
      // Still draw particles even without mesh
      const ps = obj.getComponent('ParticleSystem');
      if (ps && ps.enabled) this._drawParticles(gl, ps, viewMat, projMat);
      return;
    }

    let mesh = mr.mesh;
    if (!mesh && mr.meshName) mesh = this.getMesh(mr.meshName);
    if (!mesh) mesh = this.getMesh('Cube');

    if (mesh._dirty || !mesh._glBuffers) mesh.upload(this.glCtx);
    if (!mesh._glBuffers) return;

    const material = mr.material || new Material();
    const shaderName = material.shader === 'unlit' ? 'unlit' : 'standard';
    const prog = this.programs[shaderName];
    if (!prog) return;
    prog.use();

    const modelMat  = obj.transform.getWorldMatrix();
    const normalMat = modelMat.inverse().transpose();

    prog.setMat4('uModel',        modelMat);
    prog.setMat4('uView',         viewMat);
    prog.setMat4('uProjection',   projMat);
    prog.setMat4('uNormalMatrix', normalMat);

    this._applyLights(prog, lights, scene);

    const fogEnabled = scene.fogEnabled || this.fogEnabled;
    prog.setBool('uFogEnabled', fogEnabled);
    if (fogEnabled) {
      prog.setVec4('uFogColor',    scene.fogColor  || this.fogColor);
      prog.setFloat('uFogDensity', scene.fogDensity != null ? scene.fogDensity : this.fogDensity);
    }

    material.apply(this.glCtx, prog, camPos);
    mesh.draw(gl, prog);

    // Wireframe overlay
    if (this.showWireframe && this.programs.wireframe) {
      const wp = this.programs.wireframe.use();
      wp.setMat4('uModel',      modelMat);
      wp.setMat4('uView',       viewMat);
      wp.setMat4('uProjection', projMat);
      wp.setVec4('uColor', [0, 0, 0, 0.4]);
      mesh.drawWireframe(gl, wp);
    }

    // Particles on same object
    const ps = obj.getComponent('ParticleSystem');
    if (ps && ps.enabled) this._drawParticles(gl, ps, viewMat, projMat);
  }

  _applyLights(prog, lights, scene) {
    // FIXED: scene.ambientColor is a Color (.r/.g/.b) — setVec3 now handles it
    const amb = scene.ambientColor || this.ambientColor;
    prog.setVec3('uAmbientColor', amb);
    prog.setFloat('uAmbientIntensity', scene.ambientIntensity != null ? scene.ambientIntensity : this.ambientIntensity);

    const dirs = lights.directional.slice(0, 4);
    prog.setInt('uNumDirLights', dirs.length);
    dirs.forEach((l, i) => {
      // l.direction is Vec3 (.x/.y/.z), l.color is Color (.r/.g/.b) — both handled
      prog.setVec3(`uDirLightDir[${i}]`,       l.direction);
      prog.setVec3(`uDirLightColor[${i}]`,     l.color);
      prog.setFloat(`uDirLightIntensity[${i}]`, l.intensity);
    });

    const pts = lights.point.slice(0, 8);
    prog.setInt('uNumPointLights', pts.length);
    pts.forEach((l, i) => {
      prog.setVec3(`uPointLightPos[${i}]`,       l.position);
      prog.setVec3(`uPointLightColor[${i}]`,     l.color);
      prog.setFloat(`uPointLightIntensity[${i}]`, l.intensity);
      prog.setFloat(`uPointLightRange[${i}]`,    l.range);
    });
  }

  _drawSkybox(scene, viewMat, projMat) {
    const gl  = this.glCtx.gl;
    const prog = this.programs.skybox;
    if (!prog) return;
    gl.depthMask(false);
    prog.use();

    // Remove translation from view matrix
    const sv = viewMat.clone();
    sv.elements[3] = 0; sv.elements[7] = 0; sv.elements[11] = 0;

    prog.setMat4('uView',       sv);
    prog.setMat4('uProjection', projMat);
    prog.setVec3('uTopColor',    scene.skyboxTopColor    || new Color(0.2, 0.4, 0.8));
    prog.setVec3('uBottomColor', scene.skyboxBottomColor || new Color(0.8, 0.7, 0.6));

    this._skyboxMesh.draw(gl, prog);
    gl.depthMask(true);
  }

  _drawGrid(viewMat, projMat) {
    const gl  = this.glCtx.gl;
    const prog = this.programs.grid;
    if (!prog || !this._gridMesh || !this._gridMesh._posBuffer) return;

    prog.use();
    prog.setMat4('uView',       viewMat);
    prog.setMat4('uProjection', projMat);

    const posLoc = prog.attribs['aPosition'];
    if (posLoc === undefined || posLoc < 0) return;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Adaptive opacity based on camera distance
    const dist = this.editorCamera.distance;
    const fineAlpha  = Math.max(0.1, Math.min(0.5, 0.5 - dist * 0.003));
    const coarseAlpha = Math.max(0.25, Math.min(0.7, 0.7 - dist * 0.004));

    // Draw fine grid lines
    gl.bindBuffer(gl.ARRAY_BUFFER, this._gridMesh._posBuffer);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    prog.setVec4('uColor', [0.4, 0.4, 0.42, fineAlpha]);
    gl.drawArrays(gl.LINES, 0, this._gridMesh._lineCount);

    // Draw coarse grid lines (every 5 units, brighter)
    if (this._gridMesh._coarseBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this._gridMesh._coarseBuffer);
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
      prog.setVec4('uColor', [0.55, 0.55, 0.58, coarseAlpha]);
      gl.drawArrays(gl.LINES, 0, this._gridMesh._coarseLineCount);
    }

    // Draw world axis lines — always bright, full length
    const axes = new Float32Array([
      -500, 0, 0,   500, 0, 0,   // X
         0, 0,-500,   0, 0, 500, // Z
         0,-500, 0,   0, 500, 0, // Y
    ]);
    const axisBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, axisBuf);
    gl.bufferData(gl.ARRAY_BUFFER, axes, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    prog.setVec4('uColor', [0.85, 0.2, 0.2, 0.9]); gl.drawArrays(gl.LINES, 0, 2); // X red
    prog.setVec4('uColor', [0.2, 0.2, 0.85, 0.9]); gl.drawArrays(gl.LINES, 2, 2); // Z blue
    prog.setVec4('uColor', [0.2, 0.85, 0.2, 0.85]); gl.drawArrays(gl.LINES, 4, 2); // Y green

    gl.deleteBuffer(axisBuf);
    gl.disable(gl.BLEND);
  }

  _drawOutline(obj, viewMat, projMat) {
    if (!obj) return;
    const gl   = this.glCtx.gl;
    const prog  = this.programs.outline;
    if (!prog) return;

    const mr = obj.getComponent('MeshRenderer');
    if (!mr) return;

    let mesh = mr.mesh;
    if (!mesh && mr.meshName) mesh = this._meshCache[mr.meshName] || this.getMesh(mr.meshName);
    if (!mesh || !mesh._glBuffers) return;

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);
    prog.use();
    prog.setMat4('uModel',        obj.transform.getWorldMatrix());
    prog.setMat4('uView',         viewMat);
    prog.setMat4('uProjection',   projMat);
    prog.setFloat('uOutlineWidth', 0.02);
    prog.setVec4('uColor',        [0.3, 0.6, 1.0, 1.0]);
    mesh.draw(gl, prog);
    gl.cullFace(gl.BACK);
  }

  _drawParticles(gl, ps, viewMat, projMat) {
    const prog = this.programs.particle;
    if (!prog || !ps || !ps.enabled) return;

    let data;
    try { data = ps.getParticleData(); } catch (e) { return; }
    if (!data || data.count === 0) return;

    prog.use();
    prog.setMat4('uView',       viewMat);
    prog.setMat4('uProjection', projMat);
    prog.setBool('uUseTex',     !!ps.texture);

    const id = (ps.gameObject && ps.gameObject.id) ? ps.gameObject.id : 0;
    if (!this._particleBuffers[id]) {
      this._particleBuffers[id] = {
        pos:   gl.createBuffer(),
        size:  gl.createBuffer(),
        color: gl.createBuffer(),
      };
    }
    const bufs = this._particleBuffers[id];

    gl.bindBuffer(gl.ARRAY_BUFFER, bufs.pos);
    gl.bufferData(gl.ARRAY_BUFFER, data.positions, gl.DYNAMIC_DRAW);
    const posLoc = prog.attribs['aPosition'];
    if (posLoc >= 0) { gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0); }

    gl.bindBuffer(gl.ARRAY_BUFFER, bufs.size);
    gl.bufferData(gl.ARRAY_BUFFER, data.sizes, gl.DYNAMIC_DRAW);
    const sizeLoc = prog.attribs['aSize'];
    if (sizeLoc >= 0) { gl.enableVertexAttribArray(sizeLoc); gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 0, 0); }

    gl.bindBuffer(gl.ARRAY_BUFFER, bufs.color);
    gl.bufferData(gl.ARRAY_BUFFER, data.colors, gl.DYNAMIC_DRAW);
    const colLoc = prog.attribs['aColor'];
    if (colLoc >= 0) { gl.enableVertexAttribArray(colLoc); gl.vertexAttribPointer(colLoc, 4, gl.FLOAT, false, 0, 0); }

    gl.enable(gl.BLEND);
    gl.blendFunc(ps.blendMode === 'additive' ? gl.ONE : gl.SRC_ALPHA,
                 ps.blendMode === 'additive' ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.drawArrays(gl.POINTS, 0, data.count);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }

  // ─────────────────────────────────────────────
  // Camera controls
  orbitCamera(dx, dy) {
    const cam = this.editorCamera;
    cam.yaw   -= dx * 0.3;
    cam.pitch -= dy * 0.3;
    cam.pitch = MathUtils.clamp(cam.pitch, -89, 89);
  }

  panCamera(dx, dy) {
    const cam = this.editorCamera;
    const speed = cam.distance * 0.002;
    const yaw   = cam.yaw   * MathUtils.DEG2RAD;
    const pitch = cam.pitch * MathUtils.DEG2RAD;
    const right = new Vec3( Math.cos(yaw), 0, -Math.sin(yaw));
    const up    = new Vec3( Math.sin(yaw) * Math.sin(pitch), Math.cos(pitch), Math.cos(yaw) * Math.sin(pitch));
    cam.target = cam.target.sub(right.mul(dx * speed)).add(up.mul(dy * speed));
  }

  zoomCamera(delta) {
    const cam = this.editorCamera;
    // Proportional zoom: fast when far, slow when close
    const zoomFactor = 1 + delta * 0.0012 * Math.max(0.1, cam.distance * 0.05);
    cam.distance = MathUtils.clamp(cam.distance * zoomFactor, 0.05, 2000);
  }

  focusOnObject(obj) {
    if (!obj) return;
    const pos = obj.transform.worldPosition;
    this.editorCamera.target = pos.clone();
    // Compute good distance from object scale
    const s = obj.transform.scale;
    const maxScale = Math.max(Math.abs(s.x), Math.abs(s.y), Math.abs(s.z), 0.5);
    this.editorCamera.distance = Math.max(1.5, maxScale * 3.5);
  }

  screenToWorldRay(sx, sy) {
    const W = this.glCtx.width, H = this.glCtx.height;
    if (!this._editorProjMat || !this._editorViewMat) return null;
    const ndcX = (sx / W) * 2 - 1;
    const ndcY = 1 - (sy / H) * 2;
    const projInv = this._editorProjMat.inverse();
    const viewInv = this._editorViewMat.inverse();
    const nearH   = projInv.multiplyVec4(new Vec4(ndcX, ndcY, -1, 1));
    const np      = viewInv.multiplyVec3(new Vec3(nearH.x / nearH.w, nearH.y / nearH.w, -1));
    const dir     = np.sub(this._editorCamPos).normalized();
    return new Ray(this._editorCamPos.clone(), dir);
  }

  pickObject(sx, sy, scene) {
    if (!scene) return null;
    try {
      const ray = this.screenToWorldRay(sx, sy);
      if (!ray) return null;
      let closest = null, minDist = Infinity;
      const physics = new PhysicsWorld();
      for (const obj of scene.getAllObjects()) {
        if (!obj || !obj.active) continue;
        if (!obj.getComponent('MeshRenderer')) continue;
        const wpos  = obj.transform.worldPosition;
        // Use worldScale for correct pick (handles parenting)
        let ws;
        try { ws = obj.transform.worldScale; } catch(e) { ws = obj.transform.scale; }
        const hx = Math.max(Math.abs(ws.x), 0.05) * 0.5;
        const hy = Math.max(Math.abs(ws.y), 0.05) * 0.5;
        const hz = Math.max(Math.abs(ws.z), 0.05) * 0.5;
        const aabb = new AABB(
          new Vec3(wpos.x - hx, wpos.y - hy, wpos.z - hz),
          new Vec3(wpos.x + hx, wpos.y + hy, wpos.z + hz)
        );
        const t = physics._rayAABB(ray, aabb);
        if (t !== null && t >= 0 && t < minDist) { minDist = t; closest = obj; }
      }
      return closest;
    } catch (e) { return null; }
  }
}
