/**
 * WebGL Engine - WebGL Context & Shader Management
 * FIXED: fwidth/OES_standard_derivatives, setVec3 Color bug, uniform array caching,
 *        dynamic loop indexing (unrolled for WebGL1 compat), zero-value uniforms
 */
class WebGLContext {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2') ||
              canvas.getContext('webgl') ||
              canvas.getContext('experimental-webgl');
    if (!this.gl) throw new Error('WebGL not supported');
    this.isWebGL2 = !!canvas.getContext('webgl2');
    this.ext = {};
    this._initExtensions();
  }

  _initExtensions() {
    const gl = this.gl;
    // OES_standard_derivatives enables dFdx/dFdy/fwidth in WebGL1
    // In WebGL2 these are always built-in - no extension needed
    if (!this.isWebGL2) {
      this.ext.standardDerivatives = gl.getExtension('OES_standard_derivatives');
    }
    this.ext.aniso = gl.getExtension('EXT_texture_filter_anisotropic') ||
                     gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
    this.ext.depthTexture = gl.getExtension('WEBGL_depth_texture');
    this.ext.floatTexture = gl.getExtension('OES_texture_float');
    this.ext.vao = gl.getExtension('OES_vertex_array_object');
    this.ext.instanced = gl.getExtension('ANGLE_instanced_arrays');
  }

  resize() {
    const c = this.canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(c.clientWidth * dpr);
    const h = Math.floor(c.clientHeight * dpr);
    if (w > 0 && h > 0 && (c.width !== w || c.height !== h)) {
      c.width = w; c.height = h; return true;
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

  createProgram(vertSrc, fragSrc, name = 'unnamed') {
    const gl = this.gl;
    try {
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
      return wrapper;
    } catch (e) {
      console.error('[Shader ' + name + ']', e.message);
      throw e;
    }
  }

  createTexture(width, height, data = null, opts = {}) {
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
    if (!image) return null;
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
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255,0,255,255]));
    const img = new Image();
    img.crossOrigin = 'anonymous';
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
    if (fbo.fb) gl.deleteFramebuffer(fbo.fb);
    if (fbo.colorTex) gl.deleteTexture(fbo.colorTex);
    if (fbo.depthBuf) gl.deleteRenderbuffer(fbo.depthBuf);
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
      if (!info) continue;
      const name = info.name;
      const loc = gl.getUniformLocation(p, name);
      this.uniforms[name] = loc;
      // FIXED: arrays - cache uFoo[0] AND uFoo[1..n] individually
      if (name.endsWith('[0]')) {
        const base = name.slice(0, -3);
        this.uniforms[base] = loc;
        for (let j = 1; j < info.size; j++) {
          const n2 = base + '[' + j + ']';
          this.uniforms[n2] = gl.getUniformLocation(p, n2);
        }
      }
    }
    const numAttribs = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < numAttribs; i++) {
      const info = gl.getActiveAttrib(p, i);
      if (!info) continue;
      this.attribs[info.name] = gl.getAttribLocation(p, info.name);
    }
  }

  use() { this.gl.useProgram(this.program); return this; }

  setMat4(name, mat) {
    const loc = this.uniforms[name];
    if (loc == null) return;
    this.gl.uniformMatrix4fv(loc, false, mat instanceof Mat4 ? mat.elements : mat);
  }

  // FIXED: supports Vec3 (.x/.y/.z), Color (.r/.g/.b), array, and handles 0 values correctly
  setVec3(name, v) {
    const loc = this.uniforms[name];
    if (loc == null || v == null) return;
    let x = 0, y = 0, z = 0;
    if (Array.isArray(v))        { x = v[0]; y = v[1]; z = v[2]; }
    else if (v.r !== undefined)  { x = v.r;  y = v.g;  z = v.b;  } // Color
    else                         { x = v.x;  y = v.y;  z = v.z;  } // Vec3
    this.gl.uniform3f(loc, x || 0, y || 0, z || 0);
  }

  setVec4(name, v) {
    const loc = this.uniforms[name];
    if (loc == null || v == null) return;
    let x = 0, y = 0, z = 0, w = 1;
    if (Array.isArray(v)) {
      x = v[0]; y = v[1]; z = v[2]; w = (v[3] !== undefined) ? v[3] : 1;
    } else if (v.r !== undefined) {
      x = v.r; y = v.g; z = v.b; w = (v.a !== undefined) ? v.a : 1;
    } else {
      x = v.x; y = v.y; z = v.z; w = (v.w !== undefined) ? v.w : 1;
    }
    this.gl.uniform4f(loc, x || 0, y || 0, z || 0, w !== undefined ? w : 1);
  }

  setFloat(name, v) {
    const loc = this.uniforms[name];
    if (loc != null) this.gl.uniform1f(loc, v);
  }

  setInt(name, v) {
    const loc = this.uniforms[name];
    if (loc != null) this.gl.uniform1i(loc, v);
  }

  setBool(name, v) { this.setInt(name, v ? 1 : 0); }

  setAttribute(name, buf, size, stride = 0, offset = 0, type = null) {
    const gl = this.gl;
    const loc = this.attribs[name];
    if (loc === undefined || loc < 0) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, type || gl.FLOAT, false, stride, offset);
  }
}

// ============================================================
// Built-in GLSL shaders — WebGL1 + WebGL2 compatible
// KEY FIXES:
//  - No fwidth (requires extension not always available)
//  - No dynamic loop termination with uniform int (WebGL1 forbids it)
//    → loops are unrolled with if(uNumX > i) guards
//  - Grid uses simple line-based drawing from CPU (no fragment math)
// ============================================================
const SHADERS = {

  // ===== STANDARD PBR SHADER =====
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
    uniform vec4  uColor;
    uniform float uMetallic;
    uniform float uRoughness;
    uniform vec3  uCameraPos;
    uniform bool  uUseTex;
    uniform sampler2D uAlbedo;
    uniform bool  uUseNormalMap;
    uniform sampler2D uNormalMap;
    uniform vec4  uUVTransform;

    uniform int   uNumDirLights;
    uniform vec3  uDirLightDir[4];
    uniform vec3  uDirLightColor[4];
    uniform float uDirLightIntensity[4];

    uniform int   uNumPointLights;
    uniform vec3  uPointLightPos[8];
    uniform vec3  uPointLightColor[8];
    uniform float uPointLightIntensity[8];
    uniform float uPointLightRange[8];

    uniform vec3  uAmbientColor;
    uniform float uAmbientIntensity;
    uniform bool  uFogEnabled;
    uniform vec4  uFogColor;
    uniform float uFogDensity;

    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying vec2 vUV;
    varying vec3 vTangent;
    varying vec3 vBitangent;

    const float PI = 3.14159265359;

    float distGGX(float NdH, float r) {
      float a = r*r; float a2 = a*a;
      float d = NdH*NdH*(a2-1.0)+1.0;
      return a2 / max(PI*d*d, 0.0001);
    }
    float geomSchlick(float NdV, float k) { return NdV/(NdV*(1.0-k)+k+0.0001); }
    float geomSmith(float NdV, float NdL, float r) {
      float k=(r+1.0); k=k*k/8.0;
      return geomSchlick(NdV,k)*geomSchlick(NdL,k);
    }
    vec3 fresnel(float cosT, vec3 F0) {
      return F0+(1.0-F0)*pow(clamp(1.0-cosT,0.0,1.0),5.0);
    }
    vec3 pbr(vec3 N, vec3 V, vec3 L, vec3 lc, float li, vec3 alb) {
      vec3 H=normalize(V+L);
      float NdV=max(dot(N,V),0.0), NdL=max(dot(N,L),0.0);
      float NdH=max(dot(N,H),0.0), HdV=max(dot(H,V),0.0);
      vec3 F0=mix(vec3(0.04),alb,uMetallic);
      float D=distGGX(NdH,uRoughness);
      float G=geomSmith(NdV,NdL,uRoughness);
      vec3  F=fresnel(HdV,F0);
      vec3 spec=D*G*F/max(4.0*NdV*NdL,0.001);
      vec3 kD=(1.0-F)*(1.0-uMetallic);
      return (kD*alb/PI+spec)*lc*li*NdL;
    }

    void main() {
      vec2 uv = vUV * uUVTransform.xy + uUVTransform.zw;
      vec4 samp = uUseTex ? texture2D(uAlbedo, uv) : vec4(1.0);
      vec4 base = uColor * samp;
      if (base.a < 0.01) discard;
      vec3 alb = pow(clamp(base.rgb, 0.0, 1.0), vec3(2.2));

      vec3 N = normalize(vNormal);
      if (uUseNormalMap) {
        vec3 nm = texture2D(uNormalMap, uv).xyz * 2.0 - 1.0;
        mat3 TBN = mat3(normalize(vTangent), normalize(vBitangent), N);
        N = normalize(TBN * nm);
      }
      vec3 V = normalize(uCameraPos - vWorldPos);
      vec3 Lo = vec3(0.0);

      // FIXED: loops unrolled — WebGL1 forbids breaking on uniform int
      if (uNumDirLights > 0) Lo += pbr(N,V,normalize(-uDirLightDir[0]),uDirLightColor[0],uDirLightIntensity[0],alb);
      if (uNumDirLights > 1) Lo += pbr(N,V,normalize(-uDirLightDir[1]),uDirLightColor[1],uDirLightIntensity[1],alb);
      if (uNumDirLights > 2) Lo += pbr(N,V,normalize(-uDirLightDir[2]),uDirLightColor[2],uDirLightIntensity[2],alb);
      if (uNumDirLights > 3) Lo += pbr(N,V,normalize(-uDirLightDir[3]),uDirLightColor[3],uDirLightIntensity[3],alb);

      if (uNumPointLights > 0) { vec3 Lv=uPointLightPos[0]-vWorldPos; float d=length(Lv); if(d<uPointLightRange[0]){ float a=pow(1.0-d/uPointLightRange[0],2.0); Lo+=pbr(N,V,normalize(Lv),uPointLightColor[0],uPointLightIntensity[0]*a,alb); } }
      if (uNumPointLights > 1) { vec3 Lv=uPointLightPos[1]-vWorldPos; float d=length(Lv); if(d<uPointLightRange[1]){ float a=pow(1.0-d/uPointLightRange[1],2.0); Lo+=pbr(N,V,normalize(Lv),uPointLightColor[1],uPointLightIntensity[1]*a,alb); } }
      if (uNumPointLights > 2) { vec3 Lv=uPointLightPos[2]-vWorldPos; float d=length(Lv); if(d<uPointLightRange[2]){ float a=pow(1.0-d/uPointLightRange[2],2.0); Lo+=pbr(N,V,normalize(Lv),uPointLightColor[2],uPointLightIntensity[2]*a,alb); } }
      if (uNumPointLights > 3) { vec3 Lv=uPointLightPos[3]-vWorldPos; float d=length(Lv); if(d<uPointLightRange[3]){ float a=pow(1.0-d/uPointLightRange[3],2.0); Lo+=pbr(N,V,normalize(Lv),uPointLightColor[3],uPointLightIntensity[3]*a,alb); } }
      if (uNumPointLights > 4) { vec3 Lv=uPointLightPos[4]-vWorldPos; float d=length(Lv); if(d<uPointLightRange[4]){ float a=pow(1.0-d/uPointLightRange[4],2.0); Lo+=pbr(N,V,normalize(Lv),uPointLightColor[4],uPointLightIntensity[4]*a,alb); } }
      if (uNumPointLights > 5) { vec3 Lv=uPointLightPos[5]-vWorldPos; float d=length(Lv); if(d<uPointLightRange[5]){ float a=pow(1.0-d/uPointLightRange[5],2.0); Lo+=pbr(N,V,normalize(Lv),uPointLightColor[5],uPointLightIntensity[5]*a,alb); } }
      if (uNumPointLights > 6) { vec3 Lv=uPointLightPos[6]-vWorldPos; float d=length(Lv); if(d<uPointLightRange[6]){ float a=pow(1.0-d/uPointLightRange[6],2.0); Lo+=pbr(N,V,normalize(Lv),uPointLightColor[6],uPointLightIntensity[6]*a,alb); } }
      if (uNumPointLights > 7) { vec3 Lv=uPointLightPos[7]-vWorldPos; float d=length(Lv); if(d<uPointLightRange[7]){ float a=pow(1.0-d/uPointLightRange[7],2.0); Lo+=pbr(N,V,normalize(Lv),uPointLightColor[7],uPointLightIntensity[7]*a,alb); } }

      vec3 ambient = uAmbientColor * uAmbientIntensity * alb;
      vec3 color = ambient + Lo;
      color = color / (color + vec3(1.0));
      color = pow(color, vec3(1.0/2.2));
      if (uFogEnabled) {
        float fd = length(uCameraPos - vWorldPos);
        float ff = clamp(exp(-uFogDensity * fd), 0.0, 1.0);
        color = mix(uFogColor.rgb, color, ff);
      }
      gl_FragColor = vec4(color, base.a);
    }
  `,

  // ===== UNLIT =====
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
      vUV = aUV; vColor = aColor;
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
      if (uUseTex) c *= texture2D(uAlbedo, vUV);
      if (c.a < 0.01) discard;
      gl_FragColor = c;
    }
  `,

  // ===== WIREFRAME / SOLID COLOR =====
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

  // ===== GRID — no fwidth! Simple vertex-colored lines drawn from CPU =====
  gridVert: `
    precision mediump float;
    attribute vec3 aPosition;
    uniform mat4 uView;
    uniform mat4 uProjection;
    void main() {
      gl_Position = uProjection * uView * vec4(aPosition, 1.0);
    }
  `,
  gridFrag: `
    precision mediump float;
    uniform vec4 uColor;
    void main() { gl_FragColor = uColor; }
  `,

  // ===== SKYBOX =====
  skyboxVert: `
    precision mediump float;
    attribute vec3 aPosition;
    uniform mat4 uView;
    uniform mat4 uProjection;
    varying vec3 vDir;
    void main() {
      vDir = aPosition;
      mat4 rv = uView;
      rv[3] = vec4(0.0, 0.0, 0.0, 1.0);
      vec4 pos = uProjection * rv * vec4(aPosition, 1.0);
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
      gl_FragColor = vec4(mix(uBottomColor, uTopColor, t), 1.0);
    }
  `,

  // ===== DEPTH =====
  depthVert: `
    precision mediump float;
    attribute vec3 aPosition;
    uniform mat4 uModel;
    uniform mat4 uLightMatrix;
    void main() { gl_Position = uLightMatrix * uModel * vec4(aPosition, 1.0); }
  `,
  depthFrag: `
    precision mediump float;
    void main() { gl_FragColor = vec4(vec3(gl_FragCoord.z), 1.0); }
  `,

  // ===== PARTICLES =====
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
      vec4 vp = uView * vec4(aPosition, 1.0);
      gl_Position = uProjection * vp;
      gl_PointSize = clamp(aSize * 100.0 / max(-vp.z, 0.1), 1.0, 128.0);
    }
  `,
  particleFrag: `
    precision mediump float;
    varying vec4 vColor;
    uniform sampler2D uTex;
    uniform bool uUseTex;
    void main() {
      vec4 c = vColor;
      if (uUseTex) {
        c *= texture2D(uTex, gl_PointCoord);
      } else {
        float d = length(gl_PointCoord - vec2(0.5)) * 2.0;
        if (d > 1.0) discard;
        c.a *= 1.0 - d * d;
      }
      if (c.a < 0.01) discard;
      gl_FragColor = c;
    }
  `,

  // ===== OUTLINE =====
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
