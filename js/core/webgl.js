/**
 * WebGL Engine - WebGL Context & Shader Management
 */
class WebGLContext {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!this.gl) throw new Error('WebGL not supported');
    this.ext = {};
    this._initExtensions();
    this.programs = new Map();
    this.textures = new Map();
    this.buffers = new Map();
  }
  
  _initExtensions() {
    const gl = this.gl;
    this.ext.aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    this.ext.depthTexture = gl.getExtension('WEBGL_depth_texture');
    this.ext.floatTexture = gl.getExtension('OES_texture_float');
    this.ext.halfFloat = gl.getExtension('OES_texture_half_float');
    this.ext.vao = gl.getExtension('OES_vertex_array_object');
    this.ext.instanced = gl.getExtension('ANGLE_instanced_arrays');
  }
  
  resize() {
    const c = this.canvas;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth * dpr;
    const h = c.clientHeight * dpr;
    if (c.width !== w || c.height !== h) {
      c.width = w; c.height = h;
      return true;
    }
    return false;
  }
  
  compileShader(source, type) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const err = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error('Shader compile error: ' + err);
    }
    return shader;
  }
  
  createProgram(vertSrc, fragSrc, name='unnamed') {
    const gl = this.gl;
    const vert = this.compileShader(vertSrc, gl.VERTEX_SHADER);
    const frag = this.compileShader(fragSrc, gl.FRAGMENT_SHADER);
    const prog = gl.createProgram();
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    gl.deleteShader(vert);
    gl.deleteShader(frag);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const err = gl.getProgramInfoLog(prog);
      gl.deleteProgram(prog);
      throw new Error('Program link error: ' + err);
    }
    const wrapper = new ShaderProgram(gl, prog);
    this.programs.set(name, wrapper);
    return wrapper;
  }
  
  createTexture(width, height, data=null, opts={}) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const format = opts.format || gl.RGBA;
    const type = opts.type || gl.UNSIGNED_BYTE;
    gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, type, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, opts.minFilter || gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, opts.magFilter || gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, opts.wrapS || gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, opts.wrapT || gl.REPEAT);
    if (opts.mipmap !== false) gl.generateMipmap(gl.TEXTURE_2D);
    return tex;
  }
  
  loadTextureFromImage(image) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return tex;
  }
  
  loadTextureFromUrl(url) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // Placeholder pink texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255,0,255,255]));
    const img = new Image();
    img.crossOrigin = '';
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
    };
    img.src = url;
    return tex;
  }
  
  createFramebuffer(width, height) {
    const gl = this.gl;
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    
    const colorTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, colorTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTex, 0);
    
    const depthBuf = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuf);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuf);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fb, colorTex, depthBuf, width, height };
  }
  
  deleteFramebuffer(fbo) {
    const gl = this.gl;
    gl.deleteFramebuffer(fbo.fb);
    gl.deleteTexture(fbo.colorTex);
    gl.deleteRenderbuffer(fbo.depthBuf);
  }
  
  createBuffer(data, target, usage) {
    const gl = this.gl;
    target = target || gl.ARRAY_BUFFER;
    usage = usage || gl.STATIC_DRAW;
    const buf = gl.createBuffer();
    gl.bindBuffer(target, buf);
    gl.bufferData(target, data instanceof Float32Array ? data : new Float32Array(data), usage);
    return buf;
  }
  
  createIndexBuffer(data) {
    const gl = this.gl;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data instanceof Uint16Array ? data : new Uint16Array(data), gl.STATIC_DRAW);
    return buf;
  }
  
  get width() { return this.canvas.width; }
  get height() { return this.canvas.height; }
}

class ShaderProgram {
  constructor(gl, program) {
    this.gl = gl;
    this.program = program;
    this.uniforms = {};
    this.attribs = {};
    this._cacheLocations();
  }
  
  _cacheLocations() {
    const gl = this.gl;
    const p = this.program;
    const numUniforms = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < numUniforms; i++) {
      const info = gl.getActiveUniform(p, i);
      this.uniforms[info.name] = gl.getUniformLocation(p, info.name);
    }
    const numAttribs = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < numAttribs; i++) {
      const info = gl.getActiveAttrib(p, i);
      this.attribs[info.name] = gl.getAttribLocation(p, info.name);
    }
  }
  
  use() { this.gl.useProgram(this.program); return this; }
  
  setMat4(name, mat) {
    const loc = this.uniforms[name];
    if (loc !== undefined) this.gl.uniformMatrix4fv(loc, false, mat instanceof Mat4 ? mat.elements : mat);
  }
  setVec3(name, v) {
    const loc = this.uniforms[name];
    if (loc !== undefined) this.gl.uniform3f(loc, v.x||v[0]||0, v.y||v[1]||0, v.z||v[2]||0);
  }
  setVec4(name, v) {
    const loc = this.uniforms[name];
    if (loc !== undefined) this.gl.uniform4f(loc, v.x||v[0]||0, v.y||v[1]||0, v.z||v[2]||0, v.w||v[3]||1);
  }
  setFloat(name, v) {
    const loc = this.uniforms[name];
    if (loc !== undefined) this.gl.uniform1f(loc, v);
  }
  setInt(name, v) {
    const loc = this.uniforms[name];
    if (loc !== undefined) this.gl.uniform1i(loc, v);
  }
  setBool(name, v) { this.setInt(name, v ? 1 : 0); }
  
  setAttribute(name, buf, size, stride=0, offset=0, type=null) {
    const gl = this.gl;
    const loc = this.attribs[name];
    if (loc === undefined || loc < 0) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, type || gl.FLOAT, false, stride, offset);
  }
}

// Built-in shader sources
const SHADERS = {
  // === STANDARD LIT SHADER ===
  standardVert: `
    precision highp float;
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec2 aUV;
    attribute vec4 aTangent;
    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uProjection;
    uniform mat4 uNormalMatrix;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying vec2 vUV;
    varying vec3 vTangent;
    varying vec3 vBitangent;
    void main() {
      vec4 worldPos = uModel * vec4(aPosition, 1.0);
      vWorldPos = worldPos.xyz;
      vNormal = normalize((uNormalMatrix * vec4(aNormal, 0.0)).xyz);
      vUV = aUV;
      vTangent = normalize((uModel * vec4(aTangent.xyz, 0.0)).xyz);
      vBitangent = cross(vNormal, vTangent) * aTangent.w;
      gl_Position = uProjection * uView * worldPos;
    }
  `,
  standardFrag: `
    precision highp float;
    uniform vec4 uColor;
    uniform float uMetallic;
    uniform float uRoughness;
    uniform vec3 uCameraPos;
    uniform bool uUseTex;
    uniform sampler2D uAlbedo;
    uniform sampler2D uNormalMap;
    uniform bool uUseNormalMap;
    // Lights
    uniform int uNumDirLights;
    uniform vec3 uDirLightDir[4];
    uniform vec3 uDirLightColor[4];
    uniform float uDirLightIntensity[4];
    uniform int uNumPointLights;
    uniform vec3 uPointLightPos[8];
    uniform vec3 uPointLightColor[8];
    uniform float uPointLightIntensity[8];
    uniform float uPointLightRange[8];
    uniform vec3 uAmbientColor;
    uniform float uAmbientIntensity;
    // Fog
    uniform bool uFogEnabled;
    uniform vec4 uFogColor;
    uniform float uFogDensity;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying vec2 vUV;
    varying vec3 vTangent;
    varying vec3 vBitangent;
    
    const float PI = 3.14159265;
    
    float DistributionGGX(vec3 N, vec3 H, float roughness) {
      float a=roughness*roughness;
      float a2=a*a;
      float NdotH=max(dot(N,H),0.0);
      float d=(NdotH*NdotH*(a2-1.0)+1.0);
      return a2/(PI*d*d);
    }
    float GeometrySchlick(float NdotV, float k) {
      return NdotV/(NdotV*(1.0-k)+k);
    }
    float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
      float r=roughness+1.0; float k=(r*r)/8.0;
      return GeometrySchlick(max(dot(N,V),0.0),k)*GeometrySchlick(max(dot(N,L),0.0),k);
    }
    vec3 fresnelSchlick(float cosTheta, vec3 F0) {
      return F0+(1.0-F0)*pow(max(1.0-cosTheta,0.0),5.0);
    }
    
    vec3 calcLight(vec3 N, vec3 V, vec3 L, vec3 lightColor, float intensity, vec3 albedo) {
      vec3 H=normalize(V+L);
      vec3 F0=mix(vec3(0.04),albedo,uMetallic);
      float NDF=DistributionGGX(N,H,uRoughness);
      float G=GeometrySmith(N,V,L,uRoughness);
      vec3 F=fresnelSchlick(max(dot(H,V),0.0),F0);
      vec3 num=NDF*G*F;
      float denom=4.0*max(dot(N,V),0.0)*max(dot(N,L),0.0)+0.001;
      vec3 spec=num/denom;
      vec3 kD=(1.0-F)*(1.0-uMetallic);
      float NdotL=max(dot(N,L),0.0);
      return (kD*albedo/PI+spec)*lightColor*intensity*NdotL;
    }
    
    void main() {
      vec4 albedoSample = uUseTex ? texture2D(uAlbedo, vUV) : vec4(1.0);
      vec4 baseColor = uColor * albedoSample;
      vec3 albedo = pow(baseColor.rgb, vec3(2.2)); // gamma to linear
      
      vec3 N = normalize(vNormal);
      if (uUseNormalMap) {
        vec3 nm = texture2D(uNormalMap, vUV).xyz * 2.0 - 1.0;
        mat3 TBN = mat3(normalize(vTangent), normalize(vBitangent), N);
        N = normalize(TBN * nm);
      }
      vec3 V = normalize(uCameraPos - vWorldPos);
      
      vec3 Lo = vec3(0.0);
      // Directional lights
      for(int i=0; i<4; i++) {
        if(i >= uNumDirLights) break;
        vec3 L = normalize(-uDirLightDir[i]);
        Lo += calcLight(N, V, L, uDirLightColor[i], uDirLightIntensity[i], albedo);
      }
      // Point lights
      for(int i=0; i<8; i++) {
        if(i >= uNumPointLights) break;
        vec3 L = uPointLightPos[i] - vWorldPos;
        float dist = length(L);
        if(dist > uPointLightRange[i]) continue;
        L = normalize(L);
        float atten = 1.0 - (dist / uPointLightRange[i]);
        atten = atten * atten;
        Lo += calcLight(N, V, L, uPointLightColor[i], uPointLightIntensity[i] * atten, albedo);
      }
      
      vec3 ambient = uAmbientColor * uAmbientIntensity * albedo;
      vec3 color = ambient + Lo;
      
      // HDR tonemapping
      color = color / (color + vec3(1.0));
      // Gamma correction
      color = pow(color, vec3(1.0/2.2));
      
      // Fog
      if(uFogEnabled) {
        float dist = length(uCameraPos - vWorldPos);
        float fogFactor = exp(-uFogDensity * dist);
        fogFactor = clamp(fogFactor, 0.0, 1.0);
        color = mix(uFogColor.rgb, color, fogFactor);
      }
      
      gl_FragColor = vec4(color, baseColor.a);
    }
  `,
  
  // === UNLIT SHADER ===
  unlitVert: `
    precision mediump float;
    attribute vec3 aPosition;
    attribute vec2 aUV;
    attribute vec4 aColor;
    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uProjection;
    varying vec2 vUV;
    varying vec4 vColor;
    void main() {
      vUV = aUV;
      vColor = aColor;
      gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
    }
  `,
  unlitFrag: `
    precision mediump float;
    uniform vec4 uColor;
    uniform bool uUseTex;
    uniform sampler2D uAlbedo;
    varying vec2 vUV;
    varying vec4 vColor;
    void main() {
      vec4 c = uColor * vColor;
      if(uUseTex) c *= texture2D(uAlbedo, vUV);
      gl_FragColor = c;
    }
  `,
  
  // === WIREFRAME SHADER ===
  wireframeVert: `
    precision mediump float;
    attribute vec3 aPosition;
    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uProjection;
    void main() {
      gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
    }
  `,
  wireframeFrag: `
    precision mediump float;
    uniform vec4 uColor;
    void main() { gl_FragColor = uColor; }
  `,
  
  // === GRID SHADER ===
  gridVert: `
    precision mediump float;
    attribute vec3 aPosition;
    uniform mat4 uView;
    uniform mat4 uProjection;
    varying vec3 vPos;
    void main() {
      vPos = aPosition;
      gl_Position = uProjection * uView * vec4(aPosition, 1.0);
    }
  `,
  gridFrag: `
    precision mediump float;
    varying vec3 vPos;
    uniform vec4 uColor;
    uniform float uSize;
    void main() {
      vec2 coord = vPos.xz / uSize;
      vec2 grid = abs(fract(coord-0.5)-0.5)/fwidth(coord);
      float line = min(grid.x, grid.y);
      float alpha = 1.0-min(line, 1.0);
      if(alpha < 0.01) discard;
      gl_FragColor = vec4(uColor.rgb, alpha * uColor.a);
    }
  `,
  
  // === SKYBOX SHADER ===
  skyboxVert: `
    precision mediump float;
    attribute vec3 aPosition;
    uniform mat4 uView;
    uniform mat4 uProjection;
    varying vec3 vDir;
    void main() {
      vDir = aPosition;
      mat4 rotView = uView;
      rotView[3] = vec4(0,0,0,1);
      vec4 pos = uProjection * rotView * vec4(aPosition, 1.0);
      gl_Position = pos.xyww;
    }
  `,
  skyboxFrag: `
    precision mediump float;
    varying vec3 vDir;
    uniform vec3 uTopColor;
    uniform vec3 uBottomColor;
    void main() {
      float t = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
      vec3 sky = mix(uBottomColor, uTopColor, t);
      gl_FragColor = vec4(sky, 1.0);
    }
  `,
  
  // === DEPTH / SHADOW SHADER ===
  depthVert: `
    precision mediump float;
    attribute vec3 aPosition;
    uniform mat4 uModel;
    uniform mat4 uLightMatrix;
    void main() {
      gl_Position = uLightMatrix * uModel * vec4(aPosition, 1.0);
    }
  `,
  depthFrag: `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(gl_FragCoord.z, gl_FragCoord.z, gl_FragCoord.z, 1.0);
    }
  `,
  
  // === PARTICLE SHADER ===
  particleVert: `
    precision mediump float;
    attribute vec3 aPosition;
    attribute float aSize;
    attribute vec4 aColor;
    uniform mat4 uView;
    uniform mat4 uProjection;
    varying vec4 vColor;
    void main() {
      vColor = aColor;
      vec4 viewPos = uView * vec4(aPosition, 1.0);
      gl_Position = uProjection * viewPos;
      gl_PointSize = aSize / -viewPos.z;
    }
  `,
  particleFrag: `
    precision mediump float;
    varying vec4 vColor;
    uniform sampler2D uTex;
    uniform bool uUseTex;
    void main() {
      vec4 c = vColor;
      if(uUseTex) {
        c *= texture2D(uTex, gl_PointCoord);
      } else {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if(d > 1.0) discard;
        c.a *= 1.0 - d;
      }
      gl_FragColor = c;
    }
  `,
  
  // === SELECTION OUTLINE ===
  outlineVert: `
    precision mediump float;
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uProjection;
    uniform float uOutlineWidth;
    void main() {
      vec3 pos = aPosition + aNormal * uOutlineWidth;
      gl_Position = uProjection * uView * uModel * vec4(pos, 1.0);
    }
  `,
  outlineFrag: `
    precision mediump float;
    uniform vec4 uColor;
    void main() { gl_FragColor = uColor; }
  `,
};
