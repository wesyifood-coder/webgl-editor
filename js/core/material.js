/**
 * WebGL Engine - Material System
 */

class Material {
  constructor(name = 'Material') {
    this.name = name;
    this.shader = 'standard'; // standard, unlit, transparent, custom
    this.color = new Color(1, 1, 1, 1);
    this.metallic = 0.0;
    this.roughness = 0.5;
    this.emission = new Color(0, 0, 0, 0);
    this.emissionIntensity = 0;
    this.albedoTexture = null;   // WebGL texture
    this.normalTexture = null;
    this.metallicTexture = null;
    this.roughnessTexture = null;
    this.occlusionTexture = null;
    this.emissionTexture = null;
    this.albedoTextureName = null;
    this.normalTextureName = null;
    this.tiling = new Vec2(1, 1);
    this.offset = new Vec2(0, 0);
    this.wireframe = false;
    this.doubleSided = false;
    this.transparent = false;
    this.alphaCutoff = 0.5;
    this.customUniforms = {};
    this.customVertexShader = null;
    this.customFragmentShader = null;
    this._program = null; // cached shader program
  }
  
  apply(glCtx, prog, cameraPos) {
    const gl = glCtx.gl;
    prog.setVec4('uColor', this.color.toArray());
    prog.setFloat('uMetallic', this.metallic);
    prog.setFloat('uRoughness', this.roughness);
    prog.setVec3('uCameraPos', cameraPos);
    
    if (this.albedoTexture) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.albedoTexture);
      prog.setInt('uAlbedo', 0);
      prog.setBool('uUseTex', true);
    } else {
      prog.setBool('uUseTex', false);
    }
    
    if (this.normalTexture) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.normalTexture);
      prog.setInt('uNormalMap', 1);
      prog.setBool('uUseNormalMap', true);
    } else {
      prog.setBool('uUseNormalMap', false);
    }
    
    // Tiling/offset as UV transform
    prog.setVec4('uUVTransform', [this.tiling.x, this.tiling.y, this.offset.x, this.offset.y]);
    
    // Apply culling
    if (this.doubleSided) gl.disable(gl.CULL_FACE);
    else gl.enable(gl.CULL_FACE);
    
    // Transparency
    if (this.transparent) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    } else {
      gl.disable(gl.BLEND);
    }
    
    // Custom uniforms
    for (const [k, v] of Object.entries(this.customUniforms)) {
      if (typeof v === 'number') prog.setFloat(k, v);
      else if (Array.isArray(v)) {
        if(v.length===3) prog.setVec3(k, {x:v[0],y:v[1],z:v[2]});
        else if(v.length===4) prog.setVec4(k, {x:v[0],y:v[1],z:v[2],w:v[3]});
      }
    }
  }
  
  clone() {
    const m = new Material(this.name + ' (Copy)');
    m.shader = this.shader;
    m.color = this.color.clone();
    m.metallic = this.metallic;
    m.roughness = this.roughness;
    m.emission = this.emission.clone();
    m.emissionIntensity = this.emissionIntensity;
    m.albedoTexture = this.albedoTexture;
    m.normalTexture = this.normalTexture;
    m.tiling = this.tiling.clone();
    m.offset = this.offset.clone();
    m.wireframe = this.wireframe;
    m.doubleSided = this.doubleSided;
    m.transparent = this.transparent;
    return m;
  }
  
  serialize() {
    return {
      name: this.name,
      shader: this.shader,
      color: this.color.toArray(),
      metallic: this.metallic,
      roughness: this.roughness,
      emission: this.emission.toArray(),
      emissionIntensity: this.emissionIntensity,
      tiling: [this.tiling.x, this.tiling.y],
      offset: [this.offset.x, this.offset.y],
      wireframe: this.wireframe,
      doubleSided: this.doubleSided,
      transparent: this.transparent,
      albedoTextureName: this.albedoTextureName,
      normalTextureName: this.normalTextureName,
    };
  }
  
  deserialize(data) {
    if (!data) return;
    this.name = data.name || 'Material';
    this.shader = data.shader || 'standard';
    if (data.color) this.color = new Color(...data.color);
    this.metallic = data.metallic ?? 0;
    this.roughness = data.roughness ?? 0.5;
    if (data.emission) this.emission = new Color(...data.emission);
    this.emissionIntensity = data.emissionIntensity ?? 0;
    if (data.tiling) this.tiling = new Vec2(data.tiling[0], data.tiling[1]);
    if (data.offset) this.offset = new Vec2(data.offset[0], data.offset[1]);
    this.wireframe = data.wireframe ?? false;
    this.doubleSided = data.doubleSided ?? false;
    this.transparent = data.transparent ?? false;
    this.albedoTextureName = data.albedoTextureName || null;
    this.normalTextureName = data.normalTextureName || null;
  }
}

// Default materials
const DefaultMaterials = {
  standard: () => new Material('Standard'),
  metal: () => { const m=new Material('Metal'); m.metallic=1; m.roughness=0.2; return m; },
  plastic: () => { const m=new Material('Plastic'); m.metallic=0; m.roughness=0.8; return m; },
  glass: () => { const m=new Material('Glass'); m.color=new Color(0.9,0.9,1,0.3); m.transparent=true; m.roughness=0; return m; },
  emissive: () => { const m=new Material('Emissive'); m.emission=new Color(1,0.5,0); m.emissionIntensity=3; return m; },
  checkerboard: () => { const m=new Material('Checkerboard'); m.color=new Color(1,1,1); return m; },
};

// Light Component
class Light extends Component {
  constructor() {
    super('Light');
    this.lightType = 'directional'; // directional, point, spot, area
    this.color = new Color(1, 1, 1);
    this.intensity = 1.0;
    this.range = 10.0;
    this.spotAngle = 30;
    this.castShadows = true;
    this.shadowBias = 0.005;
    this.shadowNear = 0.1;
    this.shadowFar = 50;
    this._shadowMap = null;
  }
  
  serialize() {
    return {
      ...super.serialize(),
      lightType: this.lightType,
      color: this.color.toArray(),
      intensity: this.intensity,
      range: this.range,
      spotAngle: this.spotAngle,
      castShadows: this.castShadows,
    };
  }
  
  deserialize(data) {
    super.deserialize(data);
    this.lightType = data.lightType || 'directional';
    if (data.color) this.color = new Color(...data.color);
    this.intensity = data.intensity ?? 1;
    this.range = data.range ?? 10;
    this.spotAngle = data.spotAngle ?? 30;
    this.castShadows = data.castShadows !== false;
  }
}

ComponentFactory.register('Light', Light);

// Camera Component
class CameraComponent extends Component {
  constructor() {
    super('Camera');
    this.fov = 60;
    this.near = 0.1;
    this.far = 1000;
    this.orthographic = false;
    this.orthoSize = 5;
    this.clearColor = new Color(0.2, 0.4, 0.8);
    this.clearDepth = true;
    this.cullingMask = 0xFFFFFFFF;
    this.renderTarget = null;
    this.depth = 0; // render order
  }
  
  getProjectionMatrix(aspect) {
    if (this.orthographic) {
      const s = this.orthoSize;
      return Mat4.orthographic(-s*aspect, s*aspect, -s, s, this.near, this.far);
    }
    return Mat4.perspective(this.fov, aspect, this.near, this.far);
  }
  
  getViewMatrix() {
    const pos = this.transform.worldPosition;
    const fwd = this.transform.forward;
    const up = this.transform.up;
    const target = pos.add(fwd);
    return Mat4.lookAt(pos, target, up);
  }
  
  screenToWorldRay(sx, sy, sw, sh) {
    const aspect = sw / sh;
    const proj = this.getProjectionMatrix(aspect);
    const view = this.getViewMatrix();
    // NDC coords
    const ndcX = (sx / sw) * 2 - 1;
    const ndcY = 1 - (sy / sh) * 2;
    const projInv = proj.inverse();
    const viewInv = view.inverse();
    const nearPoint = projInv.multiplyVec4(new Vec4(ndcX, ndcY, -1, 1));
    const farPoint = projInv.multiplyVec4(new Vec4(ndcX, ndcY, 1, 1));
    const np = viewInv.multiplyVec3(new Vec3(nearPoint.x/nearPoint.w, nearPoint.y/nearPoint.w, nearPoint.z/nearPoint.w));
    const fp = viewInv.multiplyVec3(new Vec3(farPoint.x/farPoint.w, farPoint.y/farPoint.w, farPoint.z/farPoint.w));
    return new Ray(np, fp.sub(np));
  }
  
  serialize() {
    return {
      ...super.serialize(),
      fov: this.fov,
      near: this.near,
      far: this.far,
      orthographic: this.orthographic,
      orthoSize: this.orthoSize,
      clearColor: this.clearColor.toArray(),
      depth: this.depth,
    };
  }
  
  deserialize(data) {
    super.deserialize(data);
    this.fov = data.fov ?? 60;
    this.near = data.near ?? 0.1;
    this.far = data.far ?? 1000;
    this.orthographic = data.orthographic ?? false;
    this.orthoSize = data.orthoSize ?? 5;
    if (data.clearColor) this.clearColor = new Color(...data.clearColor);
    this.depth = data.depth ?? 0;
  }
}

ComponentFactory.register('Camera', CameraComponent);
