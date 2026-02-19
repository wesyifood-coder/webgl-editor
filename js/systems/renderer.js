/**
 * WebGL Engine - Renderer
 * Main rendering pipeline with PBR, shadows, skybox
 */

class Renderer {
  constructor(canvas, isGameView = false) {
    this.canvas = canvas;
    this.isGameView = isGameView;
    this.glCtx = new WebGLContext(canvas);
    const gl = this.glCtx.gl;
    
    // Compile shaders
    this.programs = {
      standard: this.glCtx.createProgram(SHADERS.standardVert, SHADERS.standardFrag, 'standard'),
      unlit: this.glCtx.createProgram(SHADERS.unlitVert, SHADERS.unlitFrag, 'unlit'),
      wireframe: this.glCtx.createProgram(SHADERS.wireframeVert, SHADERS.wireframeFrag, 'wireframe'),
      grid: this.glCtx.createProgram(SHADERS.gridVert, SHADERS.gridFrag, 'grid'),
      skybox: this.glCtx.createProgram(SHADERS.skyboxVert, SHADERS.skyboxFrag, 'skybox'),
      outline: this.glCtx.createProgram(SHADERS.outlineVert, SHADERS.outlineFrag, 'outline'),
      particle: this.glCtx.createProgram(SHADERS.particleVert, SHADERS.particleFrag, 'particle'),
    };
    
    // Mesh cache
    this._meshCache = {};
    
    // Grid mesh
    this._gridMesh = this._createGridMesh(50, 1);
    
    // Skybox mesh
    this._skyboxMesh = Primitives.skybox();
    this._skyboxMesh.upload(this.glCtx);
    
    // Particle buffers
    this._particleBuffers = {};
    
    // Camera state (editor)
    this.editorCamera = {
      position: new Vec3(5, 5, 10),
      target: new Vec3(0, 0, 0),
      fov: 60,
      near: 0.01,
      far: 2000,
      distance: 15,
      yaw: -30,
      pitch: -20,
      orthographic: false,
      orthoSize: 5,
    };
    
    // Settings
    this.showGrid = true;
    this.showWireframe = false;
    this.showSkybox = true;
    this.gridSize = 1;
    this.selectedObject = null;
    this.quality = 'medium';
    this.ambientColor = new Color(0.1,0.1,0.15);
    this.ambientIntensity = 0.3;
    this.fogEnabled = false;
    this.fogColor = new Color(0.5,0.7,0.9);
    this.fogDensity = 0.01;
    
    // GL state
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);
    
    this._frameCount = 0;
    this._lastTime = 0;
    this.fps = 0;
  }
  
  _createGridMesh(size, step) {
    const verts = [];
    const count = Math.floor(size / step);
    for (let i = -count; i <= count; i++) {
      verts.push(-count*step, 0, i*step, count*step, 0, i*step);
      verts.push(i*step, 0, -count*step, i*step, 0, count*step);
    }
    const mesh = new Mesh('Grid');
    mesh.vertices = verts;
    mesh.normals = new Array(verts.length).fill(0);
    mesh.uvs = new Array(verts.length/3*2).fill(0);
    mesh.indices = Array.from({length:verts.length/3}, (_,i) => i);
    mesh._glBuffers = null;
    
    const gl = this.glCtx.gl;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    mesh._posBuffer = buf;
    mesh._lineCount = verts.length / 3;
    return mesh;
  }
  
  getMesh(name) {
    if (!this._meshCache[name]) {
      let mesh;
      switch(name) {
        case 'Cube': mesh = Primitives.cube(); break;
        case 'Sphere': mesh = Primitives.sphere(); break;
        case 'Plane': mesh = Primitives.plane(10, 10); break;
        case 'Cylinder': mesh = Primitives.cylinder(); break;
        case 'Capsule': mesh = Primitives.capsule(); break;
        case 'Quad': mesh = Primitives.quad(); break;
        case 'Torus': mesh = Primitives.torus(); break;
        default: mesh = Primitives.cube();
      }
      mesh.upload(this.glCtx);
      this._meshCache[name] = mesh;
    }
    return this._meshCache[name];
  }
  
  render(scene, dt) {
    const gl = this.glCtx.gl;
    this.glCtx.resize();
    const W = this.glCtx.width, H = this.glCtx.height;
    gl.viewport(0, 0, W, H);
    
    // Calculate FPS
    this._frameCount++;
    if (dt > 0) this.fps = Math.round(1/dt);
    
    // Get camera
    let camPos, viewMat, projMat;
    if (this.isGameView && scene) {
      const camObjs = scene.getAllObjects().filter(o => o.getComponent('Camera'));
      if (camObjs.length > 0) {
        const camComp = camObjs[0].getComponent('Camera');
        camPos = camObjs[0].transform.worldPosition;
        viewMat = camComp.getViewMatrix();
        projMat = camComp.getProjectionMatrix(W/H);
        // Clear with camera color
        const cc = camComp.clearColor;
        gl.clearColor(cc.r, cc.g, cc.b, 1);
      } else {
        this._useEditorCamera(W, H);
        camPos = this._editorCamPos;
        viewMat = this._editorViewMat;
        projMat = this._editorProjMat;
        gl.clearColor(0.15, 0.15, 0.15, 1);
      }
    } else {
      this._useEditorCamera(W, H);
      camPos = this._editorCamPos;
      viewMat = this._editorViewMat;
      projMat = this._editorProjMat;
      gl.clearColor(0.22, 0.22, 0.22, 1);
    }
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    if (!scene) return;
    
    // Collect lights
    const lights = this._collectLights(scene);
    
    // Draw skybox
    if (this.showSkybox) this._drawSkybox(scene, viewMat, projMat);
    
    // Draw grid (editor only)
    if (!this.isGameView && this.showGrid) this._drawGrid(viewMat, projMat);
    
    // Draw scene objects
    const allObjs = scene.getAllObjects();
    for (const obj of allObjs) {
      if (!obj.active) continue;
      this._drawObject(gl, obj, viewMat, projMat, camPos, lights, scene);
    }
    
    // Draw selected object outline
    if (this.selectedObject && !this.isGameView) {
      this._drawOutline(this.selectedObject, viewMat, projMat);
    }
  }
  
  _useEditorCamera(W, H) {
    const cam = this.editorCamera;
    // Orbit camera
    const pitch = cam.pitch * MathUtils.DEG2RAD;
    const yaw = cam.yaw * MathUtils.DEG2RAD;
    const x = cam.target.x + cam.distance * Math.cos(pitch) * Math.sin(yaw);
    const y = cam.target.y + cam.distance * Math.sin(pitch);
    const z = cam.target.z + cam.distance * Math.cos(pitch) * Math.cos(yaw);
    this._editorCamPos = new Vec3(x, y, z);
    this._editorViewMat = Mat4.lookAt(this._editorCamPos, cam.target, Vec3.up());
    if (cam.orthographic) {
      const s = cam.orthoSize;
      this._editorProjMat = Mat4.orthographic(-s*(W/H), s*(W/H), -s, s, cam.near, cam.far);
    } else {
      this._editorProjMat = Mat4.perspective(cam.fov, W/H, cam.near, cam.far);
    }
  }
  
  _collectLights(scene) {
    const lights = { directional: [], point: [], spot: [] };
    const allObjs = scene.getAllObjects();
    for (const obj of allObjs) {
      if (!obj.active) continue;
      const light = obj.getComponent('Light');
      if (light && light.enabled) {
        const entry = {
          color: light.color, intensity: light.intensity,
          position: obj.transform.worldPosition,
          direction: obj.transform.forward,
          range: light.range, spotAngle: light.spotAngle,
        };
        if (light.lightType === 'directional') lights.directional.push(entry);
        else if (light.lightType === 'point') lights.point.push(entry);
        else if (light.lightType === 'spot') lights.spot.push(entry);
      }
    }
    return lights;
  }
  
  _drawObject(gl, obj, viewMat, projMat, camPos, lights, scene) {
    const mr = obj.getComponent('MeshRenderer') || obj.getComponent('SkinnedMeshRenderer');
    if (!mr || !mr.enabled || !mr.visible) {
      // Check particles
      const ps = obj.getComponent('ParticleSystem');
      if (ps) this._drawParticles(gl, ps, viewMat, projMat);
      return;
    }
    
    let mesh = mr.mesh;
    if (!mesh && mr.meshName) mesh = this.getMesh(mr.meshName);
    if (!mesh) { mr.mesh = mesh = this.getMesh('Cube'); }
    
    if (mesh._dirty || !mesh._glBuffers) mesh.upload(this.glCtx);
    
    const material = mr.material || new Material();
    const shader = material.shader === 'unlit' ? 'unlit' : 'standard';
    const prog = this.programs[shader];
    prog.use();
    
    const modelMat = obj.transform.getWorldMatrix();
    const normalMat = modelMat.inverse().transpose();
    
    prog.setMat4('uModel', modelMat);
    prog.setMat4('uView', viewMat);
    prog.setMat4('uProjection', projMat);
    prog.setMat4('uNormalMatrix', normalMat);
    
    // Apply lights
    this._applyLights(prog, lights, scene);
    
    // Apply fog
    prog.setBool('uFogEnabled', scene.fogEnabled || this.fogEnabled);
    if (scene.fogEnabled || this.fogEnabled) {
      const fc = scene.fogColor || this.fogColor;
      prog.setVec4('uFogColor', fc.toArray());
      prog.setFloat('uFogDensity', scene.fogDensity || this.fogDensity);
    }
    
    // Apply material
    material.apply(this.glCtx, prog, camPos);
    
    mesh.draw(gl, prog);
    
    // Draw wireframe overlay in editor
    if (this.showWireframe) {
      const wp = this.programs.wireframe.use();
      wp.setMat4('uModel', modelMat);
      wp.setMat4('uView', viewMat);
      wp.setMat4('uProjection', projMat);
      wp.setVec4('uColor', [0,0,0,0.5]);
      gl.lineWidth?.(1);
      mesh.drawWireframe(gl, wp);
    }
    
    // Draw particles
    const ps = obj.getComponent('ParticleSystem');
    if (ps) this._drawParticles(gl, ps, viewMat, projMat);
  }
  
  _applyLights(prog, lights, scene) {
    const gl = this.glCtx.gl;
    
    // Ambient
    const amb = scene.ambientColor || this.ambientColor;
    prog.setVec3('uAmbientColor', amb);
    prog.setFloat('uAmbientIntensity', scene.ambientIntensity || this.ambientIntensity);
    
    // Directional lights (max 4)
    const dirs = lights.directional.slice(0,4);
    prog.setInt('uNumDirLights', dirs.length);
    dirs.forEach((l,i) => {
      prog.setVec3(`uDirLightDir[${i}]`, l.direction);
      prog.setVec3(`uDirLightColor[${i}]`, l.color);
      prog.setFloat(`uDirLightIntensity[${i}]`, l.intensity);
    });
    
    // Point lights (max 8)
    const pts = lights.point.slice(0,8);
    prog.setInt('uNumPointLights', pts.length);
    pts.forEach((l,i) => {
      prog.setVec3(`uPointLightPos[${i}]`, l.position);
      prog.setVec3(`uPointLightColor[${i}]`, l.color);
      prog.setFloat(`uPointLightIntensity[${i}]`, l.intensity);
      prog.setFloat(`uPointLightRange[${i}]`, l.range);
    });
  }
  
  _drawSkybox(scene, viewMat, projMat) {
    const gl = this.glCtx.gl;
    gl.depthMask(false);
    const prog = this.programs.skybox.use();
    
    // Remove translation from view
    const skyView = viewMat.clone();
    skyView.elements[3]=0; skyView.elements[7]=0; skyView.elements[11]=0;
    
    prog.setMat4('uView', skyView);
    prog.setMat4('uProjection', projMat);
    
    const top = scene.skyboxTopColor || new Color(0.2,0.4,0.8);
    const bot = scene.skyboxBottomColor || new Color(0.8,0.7,0.6);
    prog.setVec3('uTopColor', top);
    prog.setVec3('uBottomColor', bot);
    
    this._skyboxMesh.draw(gl, prog);
    gl.depthMask(true);
  }
  
  _drawGrid(viewMat, projMat) {
    const gl = this.glCtx.gl;
    const prog = this.programs.wireframe.use();
    
    const identity = new Mat4();
    prog.setMat4('uModel', identity);
    prog.setMat4('uView', viewMat);
    prog.setMat4('uProjection', projMat);
    
    const mesh = this._gridMesh;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh._posBuffer);
    const loc = this.programs.wireframe.attribs['aPosition'];
    if (loc >= 0) {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
    }
    
    // Minor grid lines
    prog.setVec4('uColor', [0.3, 0.3, 0.3, 0.5]);
    gl.drawArrays(gl.LINES, 0, mesh._lineCount);
    
    // Main axes
    const axisVerts = new Float32Array([
      -50, 0, 0,  50, 0, 0,
       0, 0, -50,  0, 0, 50,
       0, -50, 0,  0, 50, 0,
    ]);
    const axisBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, axisBuf);
    gl.bufferData(gl.ARRAY_BUFFER, axisVerts, gl.DYNAMIC_DRAW);
    if (loc >= 0) gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
    
    // X axis red
    prog.setVec4('uColor', [0.8, 0.2, 0.2, 0.9]);
    gl.drawArrays(gl.LINES, 0, 2);
    // Z axis blue
    prog.setVec4('uColor', [0.2, 0.2, 0.8, 0.9]);
    gl.drawArrays(gl.LINES, 2, 2);
    // Y axis green
    prog.setVec4('uColor', [0.2, 0.8, 0.2, 0.9]);
    gl.drawArrays(gl.LINES, 4, 2);
    
    gl.deleteBuffer(axisBuf);
    gl.enable(gl.DEPTH_TEST);
  }
  
  _drawOutline(obj, viewMat, projMat) {
    const gl = this.glCtx.gl;
    const mr = obj.getComponent('MeshRenderer');
    if (!mr || !mr.mesh) return;
    
    const mesh = mr.mesh;
    if (!mesh._glBuffers) return;
    
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);
    
    const prog = this.programs.outline.use();
    prog.setMat4('uModel', obj.transform.getWorldMatrix());
    prog.setMat4('uView', viewMat);
    prog.setMat4('uProjection', projMat);
    prog.setFloat('uOutlineWidth', 0.02);
    prog.setVec4('uColor', [0.3, 0.6, 1.0, 1.0]);
    
    mesh.draw(gl, prog);
    
    gl.cullFace(gl.BACK);
  }
  
  _drawParticles(gl, ps, viewMat, projMat) {
    if (!ps.enabled) return;
    const data = ps.getParticleData();
    if (data.count === 0) return;
    
    const prog = this.programs.particle.use();
    prog.setMat4('uView', viewMat);
    prog.setMat4('uProjection', projMat);
    prog.setBool('uUseTex', !!ps.texture);
    
    // Upload particle data
    const id = ps.gameObject?.id || 0;
    if (!this._particleBuffers[id]) {
      this._particleBuffers[id] = {
        pos: gl.createBuffer(), size: gl.createBuffer(), color: gl.createBuffer()
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
    
    // Blending
    gl.enable(gl.BLEND);
    if (ps.blendMode === 'additive') gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    else gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    
    gl.drawArrays(gl.POINTS, 0, data.count);
    
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }
  
  // ===== CAMERA CONTROLS =====
  orbitCamera(dx, dy) {
    const cam = this.editorCamera;
    cam.yaw -= dx * 0.3;
    cam.pitch -= dy * 0.3;
    cam.pitch = MathUtils.clamp(cam.pitch, -89, 89);
  }
  
  panCamera(dx, dy) {
    const cam = this.editorCamera;
    const speed = cam.distance * 0.002;
    // Get right and up vectors from yaw/pitch
    const yaw = cam.yaw * MathUtils.DEG2RAD;
    const pitch = cam.pitch * MathUtils.DEG2RAD;
    const right = new Vec3(Math.cos(yaw), 0, -Math.sin(yaw));
    const up = new Vec3(Math.sin(yaw)*Math.sin(pitch), Math.cos(pitch), Math.cos(yaw)*Math.sin(pitch));
    cam.target = cam.target.sub(right.mul(dx*speed)).add(up.mul(dy*speed));
  }
  
  zoomCamera(delta) {
    const cam = this.editorCamera;
    cam.distance *= (1 + delta * 0.001);
    cam.distance = MathUtils.clamp(cam.distance, 0.1, 1000);
  }
  
  focusOnObject(obj) {
    if (!obj) return;
    const pos = obj.transform.worldPosition;
    this.editorCamera.target = pos.clone();
    this.editorCamera.distance = 5;
  }
  
  screenToWorldRay(sx, sy) {
    const W = this.glCtx.width, H = this.glCtx.height;
    const cam = this.editorCamera;
    const ndcX = (sx / W) * 2 - 1;
    const ndcY = 1 - (sy / H) * 2;
    const proj = this._editorProjMat;
    const view = this._editorViewMat;
    if (!proj || !view) return null;
    const projInv = proj.inverse();
    const viewInv = view.inverse();
    const near = projInv.multiplyVec4(new Vec4(ndcX, ndcY, -1, 1));
    const np = viewInv.multiplyVec3(new Vec3(near.x/near.w, near.y/near.w, -1));
    const dir = np.sub(this._editorCamPos).normalized();
    return new Ray(this._editorCamPos, dir);
  }
  
  pickObject(sx, sy, scene) {
    const ray = this.screenToWorldRay(sx, sy);
    if (!ray) return null;
    let closest = null, minDist = Infinity;
    const allObjs = scene.getAllObjects();
    for (const obj of allObjs) {
      const mr = obj.getComponent('MeshRenderer');
      if (!mr) continue;
      const wpos = obj.transform.worldPosition;
      const scale = obj.transform.scale;
      const maxScale = Math.max(scale.x, scale.y, scale.z);
      const aabb = new AABB(wpos.sub(new Vec3(maxScale/2,maxScale/2,maxScale/2)), wpos.add(new Vec3(maxScale/2,maxScale/2,maxScale/2)));
      const physics = new PhysicsWorld();
      const t = physics._rayAABB(ray, aabb);
      if (t !== null && t < minDist) { minDist = t; closest = obj; }
    }
    return closest;
  }
}
