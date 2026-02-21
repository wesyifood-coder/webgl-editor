/* WebGL Engine Bundle - 2026-02-21T15:46:58.047Z */
/* Arquivo único para evitar problemas de ordem de carregamento */
'use strict';


/* ===== js/core/math.js ===== */
/**
 * WebGL Engine - Math Library
 * Vec2, Vec3, Vec4, Mat4, Quaternion
 */

class Vec2 {
  constructor(x=0, y=0) { this.x=x; this.y=y; }
  clone() { return new Vec2(this.x, this.y); }
  add(v) { return new Vec2(this.x+v.x, this.y+v.y); }
  sub(v) { return new Vec2(this.x-v.x, this.y-v.y); }
  mul(s) { return new Vec2(this.x*s, this.y*s); }
  dot(v) { return this.x*v.x + this.y*v.y; }
  length() { return Math.sqrt(this.x*this.x + this.y*this.y); }
  normalized() { const l=this.length(); return l>0?new Vec2(this.x/l,this.y/l):new Vec2(); }
  toArray() { return [this.x, this.y]; }
}

class Vec3 {
  constructor(x=0, y=0, z=0) { this.x=x; this.y=y; this.z=z; }
  clone() { return new Vec3(this.x, this.y, this.z); }
  set(x,y,z) { this.x=x; this.y=y; this.z=z; return this; }
  add(v) { return new Vec3(this.x+v.x, this.y+v.y, this.z+v.z); }
  sub(v) { return new Vec3(this.x-v.x, this.y-v.y, this.z-v.z); }
  mul(s) { return new Vec3(this.x*s, this.y*s, this.z*s); }
  div(s) { return new Vec3(this.x/s, this.y/s, this.z/s); }
  dot(v) { return this.x*v.x + this.y*v.y + this.z*v.z; }
  cross(v) { return new Vec3(this.y*v.z-this.z*v.y, this.z*v.x-this.x*v.z, this.x*v.y-this.y*v.x); }
  length() { return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z); }
  lengthSq() { return this.x*this.x + this.y*this.y + this.z*this.z; }
  normalized() { const l=this.length(); return l>0?this.div(l):new Vec3(); }
  negate() { return new Vec3(-this.x, -this.y, -this.z); }
  lerp(v, t) { return new Vec3(this.x+(v.x-this.x)*t, this.y+(v.y-this.y)*t, this.z+(v.z-this.z)*t); }
  distanceTo(v) { return this.sub(v).length(); }
  toArray() { return [this.x, this.y, this.z]; }
  toArray4(w=1) { return [this.x, this.y, this.z, w]; }
  equals(v) { return Math.abs(this.x-v.x)<1e-6 && Math.abs(this.y-v.y)<1e-6 && Math.abs(this.z-v.z)<1e-6; }
  static fromArray(a) { if(!Array.isArray(a)) return new Vec3(); return new Vec3(a[0]||0, a[1]||0, a[2]||0); }
  static up() { return new Vec3(0,1,0); }
  static forward() { return new Vec3(0,0,-1); }
  static right() { return new Vec3(1,0,0); }
  static zero() { return new Vec3(0,0,0); }
  static one() { return new Vec3(1,1,1); }
}

class Vec4 {
  constructor(x=0,y=0,z=0,w=1) { this.x=x; this.y=y; this.z=z; this.w=w; }
  clone() { return new Vec4(this.x,this.y,this.z,this.w); }
  toArray() { return [this.x,this.y,this.z,this.w]; }
}

class Quaternion {
  constructor(x=0,y=0,z=0,w=1) { this.x=x; this.y=y; this.z=z; this.w=w; }
  clone() { return new Quaternion(this.x,this.y,this.z,this.w); }
  
  static fromEuler(ex, ey, ez) {
    // ex,ey,ez in degrees
    const rx = ex*Math.PI/180;
    const ry = ey*Math.PI/180;
    const rz = ez*Math.PI/180;
    const cx=Math.cos(rx/2), sx=Math.sin(rx/2);
    const cy=Math.cos(ry/2), sy=Math.sin(ry/2);
    const cz=Math.cos(rz/2), sz=Math.sin(rz/2);
    return new Quaternion(
      sx*cy*cz + cx*sy*sz,
      cx*sy*cz - sx*cy*sz,
      cx*cy*sz + sx*sy*cz,
      cx*cy*cz - sx*sy*sz
    );
  }
  
  toEuler() {
    // Returns degrees
    const {x,y,z,w} = this;
    const sinr_cosp = 2*(w*x + y*z);
    const cosr_cosp = 1 - 2*(x*x + y*y);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);
    const sinp = 2*(w*y - z*x);
    const pitch = Math.abs(sinp)>=1 ? Math.sign(sinp)*Math.PI/2 : Math.asin(sinp);
    const siny_cosp = 2*(w*z + x*y);
    const cosy_cosp = 1 - 2*(y*y + z*z);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);
    return new Vec3(roll*180/Math.PI, yaw*180/Math.PI, pitch*180/Math.PI);
  }
  
  multiply(q) {
    return new Quaternion(
      this.w*q.x + this.x*q.w + this.y*q.z - this.z*q.y,
      this.w*q.y - this.x*q.z + this.y*q.w + this.z*q.x,
      this.w*q.z + this.x*q.y - this.y*q.x + this.z*q.w,
      this.w*q.w - this.x*q.x - this.y*q.y - this.z*q.z
    );
  }
  
  normalize() {
    const l = Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w);
    if(l>0) { this.x/=l; this.y/=l; this.z/=l; this.w/=l; }
    return this;
  }
  
  slerp(q, t) {
    let dot = this.x*q.x+this.y*q.y+this.z*q.z+this.w*q.w;
    if(dot<0) { q=new Quaternion(-q.x,-q.y,-q.z,-q.w); dot=-dot; }
    if(dot>0.9995) {
      return new Quaternion(
        this.x+(q.x-this.x)*t, this.y+(q.y-this.y)*t,
        this.z+(q.z-this.z)*t, this.w+(q.w-this.w)*t
      ).normalize();
    }
    const theta0=Math.acos(dot), theta=theta0*t;
    const s0=Math.cos(theta)-dot*Math.sin(theta)/Math.sin(theta0);
    const s1=Math.sin(theta)/Math.sin(theta0);
    return new Quaternion(
      s0*this.x+s1*q.x, s0*this.y+s1*q.y,
      s0*this.z+s1*q.z, s0*this.w+s1*q.w
    );
  }
  
  toMatrix() { return Mat4.fromQuaternion(this); }
  static identity() { return new Quaternion(0,0,0,1); }
}

class Mat4 {
  constructor() { this.elements = new Float32Array(16); this.identity(); }
  
  identity() {
    const e=this.elements;
    e[0]=1;e[1]=0;e[2]=0;e[3]=0;
    e[4]=0;e[5]=1;e[6]=0;e[7]=0;
    e[8]=0;e[9]=0;e[10]=1;e[11]=0;
    e[12]=0;e[13]=0;e[14]=0;e[15]=1;
    return this;
  }
  
  clone() { const m=new Mat4(); m.elements.set(this.elements); return m; }
  
  multiply(m) {
    const a=this.elements, b=m.elements;
    const r=new Mat4(); const c=r.elements;
    for(let i=0;i<4;i++) for(let j=0;j<4;j++) {
      c[i*4+j]=a[i*4+0]*b[0*4+j]+a[i*4+1]*b[1*4+j]+a[i*4+2]*b[2*4+j]+a[i*4+3]*b[3*4+j];
    }
    return r;
  }
  
  multiplyVec4(v) {
    const e=this.elements;
    const {x,y,z,w}=v;
    return new Vec4(
      e[0]*x+e[1]*y+e[2]*z+e[3]*w,
      e[4]*x+e[5]*y+e[6]*z+e[7]*w,
      e[8]*x+e[9]*y+e[10]*z+e[11]*w,
      e[12]*x+e[13]*y+e[14]*z+e[15]*w
    );
  }
  
  multiplyVec3(v) {
    const r = this.multiplyVec4(new Vec4(v.x,v.y,v.z,1));
    return new Vec3(r.x,r.y,r.z);
  }
  
  static translation(x,y,z) {
    const m=new Mat4(); const e=m.elements;
    e[3]=x; e[7]=y; e[11]=z;
    return m;
  }
  
  static scale(x,y,z) {
    const m=new Mat4(); const e=m.elements;
    e[0]=x; e[5]=y; e[10]=z;
    return m;
  }
  
  static rotationX(angle) {
    const m=new Mat4(); const e=m.elements;
    const c=Math.cos(angle), s=Math.sin(angle);
    e[5]=c; e[6]=-s; e[9]=s; e[10]=c;
    return m;
  }
  
  static rotationY(angle) {
    const m=new Mat4(); const e=m.elements;
    const c=Math.cos(angle), s=Math.sin(angle);
    e[0]=c; e[2]=s; e[8]=-s; e[10]=c;
    return m;
  }
  
  static rotationZ(angle) {
    const m=new Mat4(); const e=m.elements;
    const c=Math.cos(angle), s=Math.sin(angle);
    e[0]=c; e[1]=-s; e[4]=s; e[5]=c;
    return m;
  }
  
  static fromQuaternion(q) {
    const m=new Mat4(); const e=m.elements;
    const {x,y,z,w}=q;
    e[0]=1-2*(y*y+z*z); e[1]=2*(x*y-w*z); e[2]=2*(x*z+w*y); e[3]=0;
    e[4]=2*(x*y+w*z); e[5]=1-2*(x*x+z*z); e[6]=2*(y*z-w*x); e[7]=0;
    e[8]=2*(x*z-w*y); e[9]=2*(y*z+w*x); e[10]=1-2*(x*x+y*y); e[11]=0;
    e[12]=0; e[13]=0; e[14]=0; e[15]=1;
    return m;
  }
  
  static lookAt(eye, target, up) {
    const f = target.sub(eye).normalized();
    const r = f.cross(up).normalized();
    const u = r.cross(f);
    const m=new Mat4(); const e=m.elements;
    e[0]=r.x; e[1]=r.y; e[2]=r.z; e[3]=-r.dot(eye);
    e[4]=u.x; e[5]=u.y; e[6]=u.z; e[7]=-u.dot(eye);
    e[8]=-f.x; e[9]=-f.y; e[10]=-f.z; e[11]=f.dot(eye);
    e[12]=0; e[13]=0; e[14]=0; e[15]=1;
    return m;
  }
  
  static perspective(fov, aspect, near, far) {
    const m=new Mat4(); const e=m.elements;
    const f=1/Math.tan(fov*Math.PI/360);
    e[0]=f/aspect; e[5]=f;
    e[10]=(far+near)/(near-far); e[11]=(2*far*near)/(near-far);
    e[14]=-1; e[15]=0;
    return m;
  }
  
  static orthographic(left,right,bottom,top,near,far) {
    const m=new Mat4(); const e=m.elements;
    e[0]=2/(right-left); e[3]=-(right+left)/(right-left);
    e[5]=2/(top-bottom); e[7]=-(top+bottom)/(top-bottom);
    e[10]=-2/(far-near); e[11]=-(far+near)/(far-near);
    return m;
  }
  
  inverse() {
    const e=this.elements, inv=new Float32Array(16);
    inv[0]=e[5]*e[10]*e[15]-e[5]*e[11]*e[14]-e[9]*e[6]*e[15]+e[9]*e[7]*e[14]+e[13]*e[6]*e[11]-e[13]*e[7]*e[10];
    inv[4]=-e[4]*e[10]*e[15]+e[4]*e[11]*e[14]+e[8]*e[6]*e[15]-e[8]*e[7]*e[14]-e[12]*e[6]*e[11]+e[12]*e[7]*e[10];
    inv[8]=e[4]*e[9]*e[15]-e[4]*e[11]*e[13]-e[8]*e[5]*e[15]+e[8]*e[7]*e[13]+e[12]*e[5]*e[11]-e[12]*e[7]*e[9];
    inv[12]=-e[4]*e[9]*e[14]+e[4]*e[10]*e[13]+e[8]*e[5]*e[14]-e[8]*e[6]*e[13]-e[12]*e[5]*e[10]+e[12]*e[6]*e[9];
    inv[1]=-e[1]*e[10]*e[15]+e[1]*e[11]*e[14]+e[9]*e[2]*e[15]-e[9]*e[3]*e[14]-e[13]*e[2]*e[11]+e[13]*e[3]*e[10];
    inv[5]=e[0]*e[10]*e[15]-e[0]*e[11]*e[14]-e[8]*e[2]*e[15]+e[8]*e[3]*e[14]+e[12]*e[2]*e[11]-e[12]*e[3]*e[10];
    inv[9]=-e[0]*e[9]*e[15]+e[0]*e[11]*e[13]+e[8]*e[1]*e[15]-e[8]*e[3]*e[13]-e[12]*e[1]*e[11]+e[12]*e[3]*e[9];
    inv[13]=e[0]*e[9]*e[14]-e[0]*e[10]*e[13]-e[8]*e[1]*e[14]+e[8]*e[2]*e[13]+e[12]*e[1]*e[10]-e[12]*e[2]*e[9];
    inv[2]=e[1]*e[6]*e[15]-e[1]*e[7]*e[14]-e[5]*e[2]*e[15]+e[5]*e[3]*e[14]+e[13]*e[2]*e[7]-e[13]*e[3]*e[6];
    inv[6]=-e[0]*e[6]*e[15]+e[0]*e[7]*e[14]+e[4]*e[2]*e[15]-e[4]*e[3]*e[14]-e[12]*e[2]*e[7]+e[12]*e[3]*e[6];
    inv[10]=e[0]*e[5]*e[15]-e[0]*e[7]*e[13]-e[4]*e[1]*e[15]+e[4]*e[3]*e[13]+e[12]*e[1]*e[7]-e[12]*e[3]*e[5];
    inv[14]=-e[0]*e[5]*e[14]+e[0]*e[6]*e[13]+e[4]*e[1]*e[14]-e[4]*e[2]*e[13]-e[12]*e[1]*e[6]+e[12]*e[2]*e[5];
    inv[3]=-e[1]*e[6]*e[11]+e[1]*e[7]*e[10]+e[5]*e[2]*e[11]-e[5]*e[3]*e[10]-e[9]*e[2]*e[7]+e[9]*e[3]*e[6];
    inv[7]=e[0]*e[6]*e[11]-e[0]*e[7]*e[10]-e[4]*e[2]*e[11]+e[4]*e[3]*e[10]+e[8]*e[2]*e[7]-e[8]*e[3]*e[6];
    inv[11]=-e[0]*e[5]*e[11]+e[0]*e[7]*e[9]+e[4]*e[1]*e[11]-e[4]*e[3]*e[9]-e[8]*e[1]*e[7]+e[8]*e[3]*e[5];
    inv[15]=e[0]*e[5]*e[10]-e[0]*e[6]*e[9]-e[4]*e[1]*e[10]+e[4]*e[2]*e[9]+e[8]*e[1]*e[6]-e[8]*e[2]*e[5];
    let det=e[0]*inv[0]+e[1]*inv[4]+e[2]*inv[8]+e[3]*inv[12];
    if(det===0) return this.clone();
    det=1/det;
    const r=new Mat4(); for(let i=0;i<16;i++) r.elements[i]=inv[i]*det;
    return r;
  }
  
  transpose() {
    const e=this.elements, r=new Mat4(); const c=r.elements;
    c[0]=e[0]; c[1]=e[4]; c[2]=e[8]; c[3]=e[12];
    c[4]=e[1]; c[5]=e[5]; c[6]=e[9]; c[7]=e[13];
    c[8]=e[2]; c[9]=e[6]; c[10]=e[10]; c[11]=e[14];
    c[12]=e[3]; c[13]=e[7]; c[14]=e[11]; c[15]=e[15];
    return r;
  }
  
  toFloat32Array() { return this.elements; }
}

// MathUtils
const MathUtils = {
  DEG2RAD: Math.PI / 180,
  RAD2DEG: 180 / Math.PI,
  clamp: (v,min,max) => Math.min(Math.max(v,min),max),
  lerp: (a,b,t) => a+(b-a)*t,
  smoothstep: (a,b,t) => { t=MathUtils.clamp((t-a)/(b-a),0,1); return t*t*(3-2*t); },
  randomRange: (min,max) => Math.random()*(max-min)+min,
  map: (v,in1,in2,out1,out2) => out1+(v-in1)/(in2-in1)*(out2-out1),
  degToRad: (d) => d * Math.PI / 180,
  radToDeg: (r) => r * 180 / Math.PI,
};

// Color
class Color {
  constructor(r=1,g=1,b=1,a=1) { this.r=r; this.g=g; this.b=b; this.a=a; }
  toHex() {
    const toH=(v)=>Math.round(v*255).toString(16).padStart(2,'0');
    return '#'+toH(this.r)+toH(this.g)+toH(this.b);
  }
  static fromHex(hex) {
    const r=parseInt(hex.slice(1,3),16)/255;
    const g=parseInt(hex.slice(3,5),16)/255;
    const b=parseInt(hex.slice(5,7),16)/255;
    return new Color(r,g,b);
  }
  toArray() { return [this.r, this.g, this.b, this.a]; }
  static white() { return new Color(1,1,1); }
  static black() { return new Color(0,0,0); }
  static red() { return new Color(1,0,0); }
  static green() { return new Color(0,1,0); }
  static blue() { return new Color(0,0,1); }
  clone() { return new Color(this.r, this.g, this.b, this.a); }
  lerp(c, t) { return new Color(MathUtils.lerp(this.r,c.r,t),MathUtils.lerp(this.g,c.g,t),MathUtils.lerp(this.b,c.b,t),MathUtils.lerp(this.a,c.a,t)); }
}

// Ray
class Ray {
  constructor(origin, direction) {
    this.origin = origin;
    this.direction = direction.normalized();
  }
  getPoint(t) { return this.origin.add(this.direction.mul(t)); }
}


/* ===== js/core/webgl.js ===== */
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


/* ===== js/core/scene.js ===== */
/**
 * WebGL Engine - Scene Graph
 * GameObject, Component, Transform, Scene
 */

let _idCounter = 1;
function generateId() { return _idCounter++; }

class Component {
  constructor(type) {
    this.type = type;
    this.gameObject = null;
    this.enabled = true;
    this._started = false;
  }
  get transform() { return this.gameObject?.transform; }
  start() {}
  update(dt) {}
  fixedUpdate(dt) {}
  onDestroy() {}
  onEnable() {}
  onDisable() {}
  onCollisionEnter(other) {}
  onCollisionExit(other) {}
  onTriggerEnter(other) {}
  onTriggerExit(other) {}
  serialize() { return { type: this.type, enabled: this.enabled }; }
  deserialize(data) { this.enabled = data.enabled !== false; }
}

class Transform {
  constructor() {
    this.position = new Vec3(0, 0, 0);
    this.rotation = new Vec3(0, 0, 0); // Euler degrees
    this.scale = new Vec3(1, 1, 1);
    this._localMatrix = new Mat4();
    this._worldMatrix = new Mat4();
    this._dirty = true;
    this.parent = null;
    this.children = [];
  }
  
  setPosition(x, y, z) {
    if (x instanceof Vec3) { this.position.set(x.x, x.y, x.z); }
    else { this.position.set(x, y, z); }
    this._dirty = true;
  }
  
  setRotation(x, y, z) {
    if (x instanceof Vec3) { this.rotation.set(x.x, x.y, x.z); }
    else { this.rotation.set(x, y, z); }
    this._dirty = true;
  }
  
  setScale(x, y, z) {
    if (x instanceof Vec3) { this.scale.set(x.x, x.y, x.z); }
    else { this.scale.set(x, y, z); }
    this._dirty = true;
  }
  
  translate(dx, dy, dz) {
    this.position.x += dx; this.position.y += dy; this.position.z += dz;
    this._dirty = true;
  }
  
  rotate(dx, dy, dz) {
    this.rotation.x += dx; this.rotation.y += dy; this.rotation.z += dz;
    this._dirty = true;
  }
  
  getLocalMatrix() {
    if (!this._dirty) return this._localMatrix;
    const T = Mat4.translation(this.position.x, this.position.y, this.position.z);
    const rx = Mat4.rotationX(this.rotation.x * MathUtils.DEG2RAD);
    const ry = Mat4.rotationY(this.rotation.y * MathUtils.DEG2RAD);
    const rz = Mat4.rotationZ(this.rotation.z * MathUtils.DEG2RAD);
    const S = Mat4.scale(this.scale.x, this.scale.y, this.scale.z);
    this._localMatrix = T.multiply(ry).multiply(rx).multiply(rz).multiply(S);
    this._dirty = false;
    return this._localMatrix;
  }
  
  getWorldMatrix() {
    const local = this.getLocalMatrix();
    if (this.parent) {
      this._worldMatrix = this.parent.getWorldMatrix().multiply(local);
    } else {
      this._worldMatrix = local.clone();
    }
    return this._worldMatrix;
  }
  
  get worldPosition() {
    const m = this.getWorldMatrix().elements;
    return new Vec3(m[3], m[7], m[11]);
  }
  
  get forward() {
    const m = this.getWorldMatrix().elements;
    return new Vec3(-m[2], -m[6], -m[10]).normalized();
  }
  
  get right() {
    const m = this.getWorldMatrix().elements;
    return new Vec3(m[0], m[4], m[8]).normalized();
  }
  
  get up() {
    const m = this.getWorldMatrix().elements;
    return new Vec3(m[1], m[5], m[9]).normalized();
  }
  
  addChild(childTransform) {
    if (childTransform.parent) childTransform.parent.removeChild(childTransform);
    childTransform.parent = this;
    this.children.push(childTransform);
  }
  
  removeChild(childTransform) {
    const idx = this.children.indexOf(childTransform);
    if (idx >= 0) { this.children.splice(idx, 1); childTransform.parent = null; }
  }
  
  lookAt(target, up = Vec3.up()) {
    const dir = target.sub(this.worldPosition).normalized();
    const rot = Mat4.lookAt(this.worldPosition, target, up);
    // Extract euler from rotation matrix
    const e = rot.elements;
    this.rotation.y = Math.atan2(e[2], e[10]) * MathUtils.RAD2DEG;
    this.rotation.x = Math.asin(-e[6]) * MathUtils.RAD2DEG;
    this.rotation.z = Math.atan2(e[4], e[5]) * MathUtils.RAD2DEG;
    this._dirty = true;
  }
  
  markDirty() { this._dirty = true; this.children.forEach(c => c._dirty = true); }
  
  serialize() {
    return {
      position: [this.position.x, this.position.y, this.position.z],
      rotation: [this.rotation.x, this.rotation.y, this.rotation.z],
      scale: [this.scale.x, this.scale.y, this.scale.z]
    };
  }
  
  deserialize(data) {
    if (data.position) this.position = Vec3.fromArray(data.position);
    if (data.rotation) this.rotation = Vec3.fromArray(data.rotation);
    if (data.scale) this.scale = Vec3.fromArray(data.scale);
    this._dirty = true;
  }
}

class GameObject {
  constructor(name = 'GameObject') {
    this.id = generateId();
    this.name = name;
    this.active = true;
    this.transform = new Transform();
    this.transform.gameObject = this;
    this.components = [];
    this.children = [];
    this.parent = null;
    this.tags = [];
    this.layer = 0;
    this.prefabRef = null;
    this._scene = null;
    this._toDestroy = false;
  }
  
  addComponent(component) {
    component.gameObject = this;
    this.components.push(component);
    if (this._scene && this._scene.isPlaying) {
      component.start();
      component._started = true;
    }
    return component;
  }
  
  getComponent(type) {
    return this.components.find(c => c.type === type || c instanceof type || c.constructor.name === type) || null;
  }
  
  getComponents(type) {
    return this.components.filter(c => c.type === type || c instanceof type || c.constructor.name === type);
  }
  
  removeComponent(component) {
    const idx = this.components.indexOf(component);
    if (idx >= 0) {
      component.onDestroy();
      this.components.splice(idx, 1);
    }
  }
  
  addChild(child) {
    if (child.parent) child.parent.removeChild(child);
    child.parent = this;
    this.children.push(child);
    this.transform.addChild(child.transform);
    child._scene = this._scene;
  }
  
  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      child.parent = null;
      this.transform.removeChild(child.transform);
    }
  }
  
  setActive(v) { this.active = v; }
  
  hasTag(tag) { return this.tags.includes(tag); }
  
  destroy() { this._toDestroy = true; }
  
  _update(dt) {
    if (!this.active) return;
    for (const comp of this.components) {
      if (!comp.enabled) continue;
      if (!comp._started) { comp.start(); comp._started = true; }
      comp.update(dt);
    }
    for (const child of this.children) child._update(dt);
  }
  
  _fixedUpdate(dt) {
    if (!this.active) return;
    for (const comp of this.components) {
      if (comp.enabled) comp.fixedUpdate(dt);
    }
    for (const child of this.children) child._fixedUpdate(dt);
  }
  
  _start() {
    for (const comp of this.components) {
      if (!comp._started) { comp.start(); comp._started = true; }
    }
    for (const child of this.children) child._start();
  }
  
  serialize() {
    return {
      id: this.id,
      name: this.name,
      active: this.active,
      tags: [...this.tags],
      layer: this.layer,
      transform: this.transform.serialize(),
      components: this.components.map(c => c.serialize()),
      children: this.children.map(c => c.serialize())
    };
  }
  
  static deserialize(data, scene) {
    const go = new GameObject(data.name);
    go.id = data.id || generateId();
    go.active = data.active !== false;
    go.tags = data.tags || [];
    go.layer = data.layer || 0;
    go.transform.deserialize(data.transform || {});
    go._scene = scene;
    if (data.components) {
      for (const cd of data.components) {
        const comp = ComponentFactory.create(cd.type, cd, go);
        if (comp) go.addComponent(comp);
      }
    }
    if (data.children) {
      for (const cd of data.children) {
        const child = GameObject.deserialize(cd, scene);
        go.addChild(child);
      }
    }
    return go;
  }
}

class Scene {
  constructor(name = 'SampleScene') {
    this.name = name;
    this.objects = [];
    this.isPlaying = false;
    this.time = 0;
    this.fixedTime = 0;
    this.fixedDeltaTime = 1/50;
    this._fixedAccum = 0;
    this.gravity = new Vec3(0, -9.81, 0);
    this.skyboxTopColor = new Color(0.2, 0.4, 0.8);
    this.skyboxBottomColor = new Color(0.8, 0.7, 0.6);
    this.ambientColor = new Color(0.1, 0.1, 0.15);
    this.ambientIntensity = 0.3;
    this.fogEnabled = false;
    this.fogColor = new Color(0.5, 0.7, 0.9);
    this.fogDensity = 0.01;
    this._savedState = null;
  }
  
  add(obj) {
    obj._scene = this;
    this.objects.push(obj);
    if (this.isPlaying) obj._start();
    return obj;
  }
  
  remove(obj) {
    const idx = this.objects.indexOf(obj);
    if (idx >= 0) {
      obj.components.forEach(c => c.onDestroy());
      this.objects.splice(idx, 1);
    }
  }
  
  findById(id) {
    const search = (list) => {
      for (const o of list) {
        if (o.id === id) return o;
        const found = search(o.children);
        if (found) return found;
      }
      return null;
    };
    return search(this.objects);
  }
  
  findByName(name) {
    const search = (list) => {
      for (const o of list) {
        if (o.name === name) return o;
        const found = search(o.children);
        if (found) return found;
      }
      return null;
    };
    return search(this.objects);
  }
  
  findByTag(tag) {
    const results = [];
    const search = (list) => {
      for (const o of list) {
        if (o.tags.includes(tag)) results.push(o);
        search(o.children);
      }
    };
    search(this.objects);
    return results;
  }
  
  getRootObjects() { return this.objects; }
  
  getAllObjects() {
    const all = [];
    const collect = (list) => { for (const o of list) { all.push(o); collect(o.children); } };
    collect(this.objects);
    return all;
  }
  
  play() {
    this._savedState = this.serialize();
    this.isPlaying = true;
    this.time = 0;
    const allObjs = this.getAllObjects();
    for (const obj of allObjs) {
      obj._scene = this;
      for (const comp of obj.components) comp._started = false;
      obj._start();
    }
  }
  
  pause() { this.isPlaying = !this.isPlaying; }
  
  stop() {
    this.isPlaying = false;
    if (this._savedState) {
      const restored = Scene.deserialize(this._savedState);
      this.objects = restored.objects;
      this.objects.forEach(o => o._scene = this);
    }
  }
  
  update(dt) {
    if (!this.isPlaying) return;
    this.time += dt;
    this._fixedAccum += dt;
    while (this._fixedAccum >= this.fixedDeltaTime) {
      const allObjs = this.getAllObjects();
      for (const obj of allObjs) obj._fixedUpdate(this.fixedDeltaTime);
      this._fixedAccum -= this.fixedDeltaTime;
      this.fixedTime += this.fixedDeltaTime;
    }
    const allObjs = this.getAllObjects();
    for (const obj of allObjs) obj._update(dt);
    // Cleanup destroyed
    const toRemove = allObjs.filter(o => o._toDestroy);
    for (const o of toRemove) {
      if (o.parent) o.parent.removeChild(o);
      else this.remove(o);
    }
  }
  
  serialize() {
    return {
      name: this.name,
      skyboxTopColor: this.skyboxTopColor.toArray(),
      skyboxBottomColor: this.skyboxBottomColor.toArray(),
      ambientColor: this.ambientColor.toArray(),
      ambientIntensity: this.ambientIntensity,
      fogEnabled: this.fogEnabled,
      fogColor: this.fogColor.toArray(),
      fogDensity: this.fogDensity,
      gravity: this.gravity.toArray(),
      objects: this.objects.map(o => o.serialize())
    };
  }
  
  static deserialize(data) {
    const s = new Scene(data.name || 'Scene');
    if (data.skyboxTopColor) s.skyboxTopColor = new Color(...data.skyboxTopColor);
    if (data.skyboxBottomColor) s.skyboxBottomColor = new Color(...data.skyboxBottomColor);
    if (data.ambientColor) s.ambientColor = new Color(...data.ambientColor);
    s.ambientIntensity = data.ambientIntensity ?? 0.3;
    s.fogEnabled = data.fogEnabled ?? false;
    if (data.fogColor) s.fogColor = new Color(...data.fogColor);
    s.fogDensity = data.fogDensity ?? 0.01;
    if (data.gravity) s.gravity = Vec3.fromArray(data.gravity);
    if (data.objects) {
      for (const od of data.objects) {
        const obj = GameObject.deserialize(od, s);
        s.objects.push(obj);
      }
    }
    return s;
  }
}

// Component Factory for deserialization
class ComponentFactory {
  static _registry = {};
  
  static register(type, cls) {
    this._registry[type] = cls;
  }
  
  static create(type, data, go) {
    const Cls = this._registry[type];
    if (!Cls) return null;
    const comp = new Cls();
    comp.gameObject = go;
    comp.deserialize(data);
    return comp;
  }
}

// ── PATCH: fix getComponent to not crash when type is a class (typeof check) ──
// Patch applied at file end so it overrides the class method
(function patchScene() {
  // Fix GameObject.getComponent — old version crashes when type is a class
  // because `c instanceof type` is valid but `c.constructor.name === type` is
  // fine too, the real problem is when type is undefined or not a string/function
  const origGet = GameObject.prototype.getComponent;
  GameObject.prototype.getComponent = function(type) {
    if (!type) return null;
    try {
      if (typeof type === 'string') {
        return this.components.find(c => c && (c.type === type || (c.constructor && c.constructor.name === type))) || null;
      }
      if (typeof type === 'function') {
        return this.components.find(c => c instanceof type) || null;
      }
    } catch(e) {}
    return null;
  };

  // Fix Scene.update — isolate per-component errors
  Scene.prototype.update = function(dt) {
    if (!this.isPlaying) return;
    this.time += dt;
    this._fixedAccum += dt;
    while (this._fixedAccum >= this.fixedDeltaTime) {
      for (const obj of this.getAllObjects()) {
        if (obj && obj.active) {
          for (const comp of obj.components) {
            if (comp && comp.enabled) {
              try { comp.fixedUpdate(dt); } catch(e) { console.error('[fixedUpdate]', obj.name, comp.type, e.message); comp.enabled = false; }
            }
          }
          for (const child of obj.children) {
            if (child && child.active) {
              for (const comp of child.components) {
                if (comp && comp.enabled) {
                  try { comp.fixedUpdate(dt); } catch(e) { comp.enabled = false; }
                }
              }
            }
          }
        }
      }
      this._fixedAccum -= this.fixedDeltaTime;
      this.fixedTime += this.fixedDeltaTime;
    }
    for (const obj of this.getAllObjects()) {
      if (!obj || !obj.active) continue;
      for (const comp of [...obj.components]) {
        if (!comp || !comp.enabled) continue;
        try {
          if (!comp._started) { comp.start(); comp._started = true; }
          comp.update(dt);
        } catch(e) {
          console.error('[update]', obj.name, comp.type, ':', e.message);
          comp.enabled = false;
        }
      }
    }
    // Cleanup destroyed
    for (const o of this.getAllObjects().filter(o => o._toDestroy)) {
      if (o.parent) o.parent.removeChild(o);
      else this.remove(o);
    }
  };

  // Add missing worldScale getter to Transform
  if (!Object.getOwnPropertyDescriptor(Transform.prototype, 'worldScale')) {
    Object.defineProperty(Transform.prototype, 'worldScale', {
      get() {
        const e = this.getWorldMatrix().elements;
        return new Vec3(
          Math.sqrt(e[0]*e[0] + e[4]*e[4] + e[8]*e[8]),
          Math.sqrt(e[1]*e[1] + e[5]*e[5] + e[9]*e[9]),
          Math.sqrt(e[2]*e[2] + e[6]*e[6] + e[10]*e[10])
        );
      }
    });
  }

  // Fix ComponentFactory.create — better error handling and null guard
  ComponentFactory.create = function(type, data, go) {
    const Cls = this._registry[type];
    if (!Cls) { console.warn('[ComponentFactory] Unknown type:', type); return null; }
    try {
      const comp = new Cls();
      comp.gameObject = go;
      if (data && comp.deserialize) comp.deserialize(data);
      return comp;
    } catch(e) {
      console.error('[ComponentFactory] Failed to create', type, ':', e.message);
      return null;
    }
  };

  // Fix Scene.remove — null guard
  const origRemove = Scene.prototype.remove;
  Scene.prototype.remove = function(obj) {
    if (!obj) return;
    const idx = this.objects.indexOf(obj);
    if (idx >= 0) {
      try { obj.components.forEach(c => c && c.onDestroy && c.onDestroy()); } catch(e) {}
      this.objects.splice(idx, 1);
    }
  };
})();


/* ===== js/core/mesh.js ===== */
/**
 * WebGL Engine - Mesh System
 * Geometry generation for all primitives
 */

class Mesh {
  constructor(name = 'Mesh') {
    this.name = name;
    this.vertices = [];   // vec3
    this.normals = [];    // vec3
    this.uvs = [];        // vec2
    this.tangents = [];   // vec4
    this.colors = [];     // vec4
    this.indices = [];    // uint16
    this._glBuffers = null;
    this._dirty = true;
    this.submeshes = [];
  }
  
  computeTangents() {
    this.tangents = new Array(this.vertices.length/3 * 4).fill(0);
    const tan1 = new Float32Array(this.vertices.length);
    const tan2 = new Float32Array(this.vertices.length);
    
    for (let i = 0; i < this.indices.length; i += 3) {
      const i0 = this.indices[i]*3, i1 = this.indices[i+1]*3, i2 = this.indices[i+2]*3;
      const u0 = this.indices[i]*2, u1 = this.indices[i+1]*2, u2 = this.indices[i+2]*2;
      
      const dx1 = this.vertices[i1]-this.vertices[i0];
      const dy1 = this.vertices[i1+1]-this.vertices[i0+1];
      const dz1 = this.vertices[i1+2]-this.vertices[i0+2];
      const dx2 = this.vertices[i2]-this.vertices[i0];
      const dy2 = this.vertices[i2+1]-this.vertices[i0+1];
      const dz2 = this.vertices[i2+2]-this.vertices[i0+2];
      
      const du1 = this.uvs[u1]-this.uvs[u0];
      const dv1 = this.uvs[u1+1]-this.uvs[u0+1];
      const du2 = this.uvs[u2]-this.uvs[u0];
      const dv2 = this.uvs[u2+1]-this.uvs[u0+1];
      
      const r = 1/(du1*dv2 - du2*dv1);
      if (!isFinite(r)) continue;
      
      const tx=(dv2*dx1-dv1*dx2)*r, ty=(dv2*dy1-dv1*dy2)*r, tz=(dv2*dz1-dv1*dz2)*r;
      const bx=(du1*dx2-du2*dx1)*r, by=(du1*dy2-du2*dy1)*r, bz=(du1*dz2-du2*dz2)*r;
      
      [i0,i1,i2].forEach(ii => {
        tan1[ii]+=tx; tan1[ii+1]+=ty; tan1[ii+2]+=tz;
        tan2[ii]+=bx; tan2[ii+1]+=by; tan2[ii+2]+=bz;
      });
    }
    
    const tv = []; // flat tangents array
    for (let i = 0; i < this.vertices.length/3; i++) {
      const ni=i*3, ti=i*3;
      const nx=this.normals[ni], ny=this.normals[ni+1], nz=this.normals[ni+2];
      const tx=tan1[ti], ty=tan1[ti+1], tz=tan1[ti+2];
      // Gram-Schmidt
      const dot = nx*tx+ny*ty+nz*tz;
      let lx=tx-dot*nx, ly=ty-dot*ny, lz=tz-dot*nz;
      const l = Math.sqrt(lx*lx+ly*ly+lz*lz);
      if(l>0){lx/=l;ly/=l;lz/=l;}
      // Handedness
      const cross = (ny*tan2[ti+2]-nz*tan2[ti+1])*lx + (nz*tan2[ti]-nx*tan2[ti+2])*ly + (nx*tan2[ti+1]-ny*tan2[ti])*lz;
      const w = cross < 0 ? -1 : 1;
      tv.push(lx,ly,lz,w);
    }
    this.tangents = tv;
    this._dirty = true;
  }
  
  upload(glCtx) {
    const gl = glCtx.gl;
    if (this._glBuffers) {
      Object.values(this._glBuffers).forEach(b => { if(b) gl.deleteBuffer(b); });
    }
    
    const verts = new Float32Array(this.vertices);
    const norms = new Float32Array(this.normals.length > 0 ? this.normals : new Array(this.vertices.length).fill(0));
    const uvs = new Float32Array(this.uvs.length > 0 ? this.uvs : new Array(this.vertices.length/3*2).fill(0));
    const tans = new Float32Array(this.tangents.length > 0 ? this.tangents : new Array(this.vertices.length/3*4).fill(0));
    
    const colorData = this.colors.length > 0 ? new Float32Array(this.colors)
      : new Float32Array(this.vertices.length/3*4).fill(1);
    if (this.colors.length === 0) for(let i=0;i<colorData.length;i++) colorData[i]=1;
    
    this._glBuffers = {
      position: gl.createBuffer(),
      normal: gl.createBuffer(),
      uv: gl.createBuffer(),
      tangent: gl.createBuffer(),
      color: gl.createBuffer(),
      index: gl.createBuffer(),
    };
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this._glBuffers.position);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._glBuffers.normal);
    gl.bufferData(gl.ARRAY_BUFFER, norms, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._glBuffers.uv);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._glBuffers.tangent);
    gl.bufferData(gl.ARRAY_BUFFER, tans, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._glBuffers.color);
    gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._glBuffers.index);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
    
    this.indexCount = this.indices.length;
    this._dirty = false;
  }
  
  draw(gl, prog) {
    if (!this._glBuffers) return;
    prog.setAttribute('aPosition', this._glBuffers.position, 3);
    prog.setAttribute('aNormal', this._glBuffers.normal, 3);
    prog.setAttribute('aUV', this._glBuffers.uv, 2);
    prog.setAttribute('aTangent', this._glBuffers.tangent, 4);
    prog.setAttribute('aColor', this._glBuffers.color, 4);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._glBuffers.index);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
  }
  
  drawWireframe(gl, prog) {
    if (!this._glBuffers) return;
    prog.setAttribute('aPosition', this._glBuffers.position, 3);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._glBuffers.index);
    gl.drawElements(gl.LINES, this.indexCount, gl.UNSIGNED_SHORT, 0);
  }
  
  clone() {
    const m = new Mesh(this.name);
    m.vertices = [...this.vertices];
    m.normals = [...this.normals];
    m.uvs = [...this.uvs];
    m.tangents = [...this.tangents];
    m.colors = [...this.colors];
    m.indices = [...this.indices];
    return m;
  }
}

// ===== PRIMITIVE GENERATORS =====
const Primitives = {
  cube(size = 1) {
    const s = size / 2;
    const mesh = new Mesh('Cube');
    // 6 faces, each 4 vertices (for correct normals)
    const faces = [
      // front
      {n:[0,0,1], v:[[-s,-s,s],[s,-s,s],[s,s,s],[-s,s,s]]},
      // back
      {n:[0,0,-1], v:[[s,-s,-s],[-s,-s,-s],[-s,s,-s],[s,s,-s]]},
      // left
      {n:[-1,0,0], v:[[-s,-s,-s],[-s,-s,s],[-s,s,s],[-s,s,-s]]},
      // right
      {n:[1,0,0], v:[[s,-s,s],[s,-s,-s],[s,s,-s],[s,s,s]]},
      // top
      {n:[0,1,0], v:[[-s,s,s],[s,s,s],[s,s,-s],[-s,s,-s]]},
      // bottom
      {n:[0,-1,0], v:[[-s,-s,-s],[s,-s,-s],[s,-s,s],[-s,-s,s]]}
    ];
    const verts=[],norms=[],uvs=[],idx=[];
    let vi=0;
    for(const f of faces) {
      for(const v of f.v) { verts.push(...v); norms.push(...f.n); }
      uvs.push(0,0, 1,0, 1,1, 0,1);
      idx.push(vi,vi+1,vi+2, vi,vi+2,vi+3);
      vi+=4;
    }
    mesh.vertices=verts; mesh.normals=norms; mesh.uvs=uvs; mesh.indices=idx;
    mesh.computeTangents();
    return mesh;
  },
  
  sphere(radius=0.5, segments=24, rings=16) {
    const mesh = new Mesh('Sphere');
    const verts=[],norms=[],uvs=[],idx=[];
    for(let r=0;r<=rings;r++) {
      const phi = Math.PI * r / rings;
      for(let s=0;s<=segments;s++) {
        const theta = 2*Math.PI * s / segments;
        const x = Math.sin(phi)*Math.cos(theta);
        const y = Math.cos(phi);
        const z = Math.sin(phi)*Math.sin(theta);
        verts.push(x*radius, y*radius, z*radius);
        norms.push(x,y,z);
        uvs.push(s/segments, 1-r/rings);
      }
    }
    for(let r=0;r<rings;r++) {
      for(let s=0;s<segments;s++) {
        const a=r*(segments+1)+s, b=a+segments+1;
        idx.push(a,b,a+1, b,b+1,a+1);
      }
    }
    mesh.vertices=verts; mesh.normals=norms; mesh.uvs=uvs; mesh.indices=idx;
    mesh.computeTangents();
    return mesh;
  },
  
  plane(size=1, divisions=1) {
    const mesh = new Mesh('Plane');
    const verts=[],norms=[],uvs=[],idx=[];
    const s = size/2;
    const step = size/divisions;
    for(let z=0;z<=divisions;z++) {
      for(let x=0;x<=divisions;x++) {
        verts.push(-s+x*step, 0, -s+z*step);
        norms.push(0,1,0);
        uvs.push(x/divisions, z/divisions);
      }
    }
    for(let z=0;z<divisions;z++) {
      for(let x=0;x<divisions;x++) {
        const a=z*(divisions+1)+x;
        const b=a+divisions+1;
        idx.push(a,a+1,b, a+1,b+1,b);
      }
    }
    mesh.vertices=verts; mesh.normals=norms; mesh.uvs=uvs; mesh.indices=idx;
    mesh.computeTangents();
    return mesh;
  },
  
  cylinder(radiusTop=0.5, radiusBottom=0.5, height=1, segments=24) {
    const mesh = new Mesh('Cylinder');
    const verts=[],norms=[],uvs=[],idx=[];
    const h = height/2;
    let vi=0;
    // Side
    for(let s=0;s<=segments;s++) {
      const theta = 2*Math.PI*s/segments;
      const x=Math.cos(theta), z=Math.sin(theta);
      verts.push(x*radiusTop, h, z*radiusTop);
      verts.push(x*radiusBottom, -h, z*radiusBottom);
      const nx=Math.cos(theta), nz=Math.sin(theta);
      norms.push(nx,0,nz, nx,0,nz);
      uvs.push(s/segments,1, s/segments,0);
    }
    for(let s=0;s<segments;s++) {
      const a=s*2, b=a+2;
      idx.push(a,b,a+1, b,b+1,a+1);
    }
    vi=(segments+1)*2;
    // Top cap
    verts.push(0,h,0); norms.push(0,1,0); uvs.push(0.5,0.5);
    const topCenter=vi++;
    for(let s=0;s<=segments;s++) {
      const theta=2*Math.PI*s/segments;
      verts.push(Math.cos(theta)*radiusTop, h, Math.sin(theta)*radiusTop);
      norms.push(0,1,0);
      uvs.push(0.5+Math.cos(theta)*0.5, 0.5+Math.sin(theta)*0.5);
      vi++;
    }
    for(let s=0;s<segments;s++) idx.push(topCenter, topCenter+s+1, topCenter+s+2);
    // Bottom cap
    verts.push(0,-h,0); norms.push(0,-1,0); uvs.push(0.5,0.5);
    const botCenter=vi++;
    for(let s=0;s<=segments;s++) {
      const theta=2*Math.PI*s/segments;
      verts.push(Math.cos(theta)*radiusBottom, -h, Math.sin(theta)*radiusBottom);
      norms.push(0,-1,0);
      uvs.push(0.5+Math.cos(theta)*0.5, 0.5+Math.sin(theta)*0.5);
      vi++;
    }
    for(let s=0;s<segments;s++) idx.push(botCenter, botCenter+s+2, botCenter+s+1);
    mesh.vertices=verts; mesh.normals=norms; mesh.uvs=uvs; mesh.indices=idx;
    mesh.computeTangents();
    return mesh;
  },
  
  capsule(radius=0.5, height=1, segments=16, rings=8) {
    const mesh = new Mesh('Capsule');
    // Cylinder + 2 hemisphere caps
    const verts=[],norms=[],uvs=[],idx=[];
    const h = height/2 - radius;
    let vi=0;
    // Top hemisphere
    for(let r=0;r<=rings/2;r++) {
      const phi=Math.PI/2 * r/(rings/2);
      for(let s=0;s<=segments;s++) {
        const theta=2*Math.PI*s/segments;
        const x=Math.cos(phi)*Math.cos(theta);
        const y=Math.sin(phi);
        const z=Math.cos(phi)*Math.sin(theta);
        verts.push(x*radius, y*radius+h, z*radius);
        norms.push(x,y,z);
        uvs.push(s/segments, 0.75-0.25*r/(rings/2));
      }
    }
    // Cylinder middle
    for(let r=0;r<=1;r++) {
      const yy = r===0?h:-h;
      for(let s=0;s<=segments;s++) {
        const theta=2*Math.PI*s/segments;
        verts.push(Math.cos(theta)*radius, yy, Math.sin(theta)*radius);
        norms.push(Math.cos(theta),0,Math.sin(theta));
        uvs.push(s/segments, r===0?0.5:0.25);
      }
    }
    // Bottom hemisphere
    for(let r=rings/2;r>=0;r--) {
      const phi=Math.PI/2*r/(rings/2);
      for(let s=0;s<=segments;s++) {
        const theta=2*Math.PI*s/segments;
        const x=Math.cos(phi)*Math.cos(theta);
        const y=-Math.sin(phi);
        const z=Math.cos(phi)*Math.sin(theta);
        verts.push(x*radius, y*radius-h, z*radius);
        norms.push(x,y,z);
        uvs.push(s/segments, 0.25-0.25*r/(rings/2));
      }
    }
    // Build indices
    const rows = rings/2 + 1 + 2 + rings/2 + 1;
    for(let r=0;r<rows-1;r++) {
      for(let s=0;s<segments;s++) {
        const a=r*(segments+1)+s;
        idx.push(a,a+segments+1,a+1, a+1,a+segments+1,a+segments+2);
      }
    }
    mesh.vertices=verts; mesh.normals=norms; mesh.uvs=uvs; mesh.indices=idx;
    mesh.computeTangents();
    return mesh;
  },
  
  quad(size=1) {
    const s=size/2;
    const mesh=new Mesh('Quad');
    mesh.vertices=[-s,-s,0, s,-s,0, s,s,0, -s,s,0];
    mesh.normals=[0,0,1, 0,0,1, 0,0,1, 0,0,1];
    mesh.uvs=[0,0, 1,0, 1,1, 0,1];
    mesh.indices=[0,1,2, 0,2,3];
    mesh.computeTangents();
    return mesh;
  },
  
  torus(R=0.5, r=0.2, tubeSeg=24, ringSeg=12) {
    const mesh=new Mesh('Torus');
    const verts=[],norms=[],uvs=[],idx=[];
    for(let i=0;i<=ringSeg;i++) {
      const phi=2*Math.PI*i/ringSeg;
      const cp=Math.cos(phi), sp=Math.sin(phi);
      for(let j=0;j<=tubeSeg;j++) {
        const theta=2*Math.PI*j/tubeSeg;
        const ct=Math.cos(theta), st=Math.sin(theta);
        const x=(R+r*ct)*cp, y=r*st, z=(R+r*ct)*sp;
        verts.push(x,y,z);
        norms.push(ct*cp, st, ct*sp);
        uvs.push(i/ringSeg, j/tubeSeg);
      }
    }
    for(let i=0;i<ringSeg;i++) {
      for(let j=0;j<tubeSeg;j++) {
        const a=i*(tubeSeg+1)+j;
        idx.push(a,a+tubeSeg+1,a+1, a+1,a+tubeSeg+1,a+tubeSeg+2);
      }
    }
    mesh.vertices=verts; mesh.normals=norms; mesh.uvs=uvs; mesh.indices=idx;
    mesh.computeTangents();
    return mesh;
  },
  
  // Skybox cube (inverted normals)
  skybox() {
    const s=1;
    const mesh=new Mesh('Skybox');
    mesh.vertices=[
      -s,-s,s, s,-s,s, s,s,s, -s,s,s,
      s,-s,-s, -s,-s,-s, -s,s,-s, s,s,-s,
      -s,-s,-s, -s,-s,s, -s,s,s, -s,s,-s,
      s,-s,s, s,-s,-s, s,s,-s, s,s,s,
      -s,s,s, s,s,s, s,s,-s, -s,s,-s,
      -s,-s,-s, s,-s,-s, s,-s,s, -s,-s,s,
    ].flat();
    mesh.normals=new Array(mesh.vertices.length).fill(0);
    mesh.uvs=new Array(mesh.vertices.length/3*2).fill(0);
    const f=[0,1,2,0,2,3];
    mesh.indices=Array.from({length:6},(_,i)=>f.map(j=>i*4+j)).flat();
    return mesh;
  },
};

// MeshRenderer Component
class MeshRenderer extends Component {
  constructor() {
    super('MeshRenderer');
    this.mesh = null;
    this.material = null;
    this.castShadows = true;
    this.receiveShadows = true;
    this.visible = true;
  }
  
  serialize() {
    return {
      ...super.serialize(),
      meshName: this.mesh?.name || null,
      castShadows: this.castShadows,
      receiveShadows: this.receiveShadows,
      visible: this.visible,
      material: this.material?.serialize() || null
    };
  }
  
  deserialize(data) {
    super.deserialize(data);
    this.castShadows = data.castShadows !== false;
    this.receiveShadows = data.receiveShadows !== false;
    this.visible = data.visible !== false;
    if (data.meshName) {
      this.mesh = Primitives[data.meshName.toLowerCase()]?.() || Primitives.cube();
    }
    if (data.material) {
      this.material = new Material();
      this.material.deserialize(data.material);
    }
  }
}

ComponentFactory.register('MeshRenderer', MeshRenderer);


/* ===== js/core/material.js ===== */
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


/* ===== js/core/physics.js ===== */
/**
 * WebGL Engine - Physics System
 * Basic rigid body physics with AABB and sphere collision
 */

class AABB {
  constructor(min, max) {
    this.min = min || new Vec3(-0.5,-0.5,-0.5);
    this.max = max || new Vec3(0.5,0.5,0.5);
  }
  get center() { return this.min.add(this.max).mul(0.5); }
  get halfSize() { return this.max.sub(this.min).mul(0.5); }
  intersects(other) {
    return this.min.x <= other.max.x && this.max.x >= other.min.x &&
           this.min.y <= other.max.y && this.max.y >= other.min.y &&
           this.min.z <= other.max.z && this.max.z >= other.min.z;
  }
  containsPoint(p) {
    return p.x>=this.min.x&&p.x<=this.max.x &&
           p.y>=this.min.y&&p.y<=this.max.y &&
           p.z>=this.min.z&&p.z<=this.max.z;
  }
  expand(amount) {
    return new AABB(this.min.sub(new Vec3(amount,amount,amount)), this.max.add(new Vec3(amount,amount,amount)));
  }
}

class Rigidbody extends Component {
  constructor() {
    super('Rigidbody');
    this.mass = 1.0;
    this.drag = 0.05;
    this.angularDrag = 0.05;
    this.useGravity = true;
    this.isKinematic = false;
    this.velocity = new Vec3();
    this.angularVelocity = new Vec3();
    this.constraints = {
      freezePositionX: false,
      freezePositionY: false,
      freezePositionZ: false,
      freezeRotationX: false,
      freezeRotationY: false,
      freezeRotationZ: false,
    };
    this._forces = new Vec3();
    this._impulses = new Vec3();
    this._sleeping = false;
    this._sleepTimer = 0;
  }
  
  addForce(force, mode = 'force') {
    if (this.isKinematic) return;
    if (mode === 'impulse') this._impulses = this._impulses.add(force);
    else this._forces = this._forces.add(force);
    this._sleeping = false;
  }
  
  addTorque(torque) {
    if (this.isKinematic) return;
    this.angularVelocity = this.angularVelocity.add(torque.div(this.mass));
  }
  
  fixedUpdate(dt) {
    if (this.isKinematic || !this.enabled) return;
    const scene = this.gameObject._scene;
    
    // Apply gravity
    if (this.useGravity && scene) {
      this._forces = this._forces.add(scene.gravity.mul(this.mass));
    }
    
    // Apply impulses
    this.velocity = this.velocity.add(this._impulses.div(this.mass));
    this._impulses = new Vec3();
    
    // Apply forces
    this.velocity = this.velocity.add(this._forces.mul(dt / this.mass));
    this._forces = new Vec3();
    
    // Drag
    this.velocity = this.velocity.mul(1 - Math.min(this.drag * dt, 1));
    this.angularVelocity = this.angularVelocity.mul(1 - Math.min(this.angularDrag * dt, 1));
    
    // Apply constraints
    if (this.constraints.freezePositionX) this.velocity.x = 0;
    if (this.constraints.freezePositionY) this.velocity.y = 0;
    if (this.constraints.freezePositionZ) this.velocity.z = 0;
    if (this.constraints.freezeRotationX) this.angularVelocity.x = 0;
    if (this.constraints.freezeRotationY) this.angularVelocity.y = 0;
    if (this.constraints.freezeRotationZ) this.angularVelocity.z = 0;
    
    // Integrate position
    this.transform.translate(this.velocity.x*dt, this.velocity.y*dt, this.velocity.z*dt);
    this.transform.rotate(
      this.angularVelocity.x*dt*MathUtils.RAD2DEG,
      this.angularVelocity.y*dt*MathUtils.RAD2DEG,
      this.angularVelocity.z*dt*MathUtils.RAD2DEG
    );
    
    // Sleep detection
    if (this.velocity.length() < 0.01 && this.angularVelocity.length() < 0.01) {
      this._sleepTimer += dt;
      if (this._sleepTimer > 0.5) this._sleeping = true;
    } else { this._sleepTimer = 0; this._sleeping = false; }
  }
  
  serialize() {
    return { ...super.serialize(), mass: this.mass, drag: this.drag, angularDrag: this.angularDrag,
      useGravity: this.useGravity, isKinematic: this.isKinematic, constraints: {...this.constraints} };
  }
  
  deserialize(data) {
    super.deserialize(data);
    this.mass = data.mass ?? 1;
    this.drag = data.drag ?? 0.05;
    this.angularDrag = data.angularDrag ?? 0.05;
    this.useGravity = data.useGravity !== false;
    this.isKinematic = data.isKinematic ?? false;
    if (data.constraints) Object.assign(this.constraints, data.constraints);
  }
}

class Collider extends Component {
  constructor(type) {
    super(type);
    this.isTrigger = false;
    this.material = { friction: 0.5, bounciness: 0.2 };
    this.center = new Vec3();
  }
  
  getWorldAABB() { return new AABB(); } // override in subclasses
  
  serialize() {
    return { ...super.serialize(), isTrigger: this.isTrigger, center: this.center.toArray() };
  }
  
  deserialize(data) {
    super.deserialize(data);
    this.isTrigger = data.isTrigger ?? false;
    if (data.center) this.center = Vec3.fromArray(data.center);
  }
}

class BoxCollider extends Collider {
  constructor() {
    super('BoxCollider');
    this.size = new Vec3(1, 1, 1);
  }
  
  getWorldAABB() {
    const wp = this.transform.worldPosition;
    const s = this.transform.scale;
    const hs = new Vec3(this.size.x*s.x/2, this.size.y*s.y/2, this.size.z*s.z/2);
    const center = wp.add(this.center);
    return new AABB(center.sub(hs), center.add(hs));
  }
  
  serialize() { return { ...super.serialize(), size: this.size.toArray() }; }
  
  deserialize(data) {
    super.deserialize(data);
    if (data.size) this.size = Vec3.fromArray(data.size);
  }
}

class SphereCollider extends Collider {
  constructor() {
    super('SphereCollider');
    this.radius = 0.5;
  }
  
  getWorldAABB() {
    const wp = this.transform.worldPosition.add(this.center);
    const r = this.radius * Math.max(this.transform.scale.x, this.transform.scale.y, this.transform.scale.z);
    return new AABB(wp.sub(new Vec3(r,r,r)), wp.add(new Vec3(r,r,r)));
  }
  
  serialize() { return { ...super.serialize(), radius: this.radius }; }
  
  deserialize(data) {
    super.deserialize(data);
    this.radius = data.radius ?? 0.5;
  }
}

class CapsuleCollider extends Collider {
  constructor() {
    super('CapsuleCollider');
    this.radius = 0.5;
    this.height = 2.0;
    this.direction = 1; // 0=x,1=y,2=z
  }
  
  getWorldAABB() {
    const wp = this.transform.worldPosition.add(this.center);
    const r = this.radius;
    const h = this.height / 2;
    return new AABB(wp.sub(new Vec3(r,h,r)), wp.add(new Vec3(r,h,r)));
  }
  
  serialize() { return { ...super.serialize(), radius: this.radius, height: this.height }; }
  
  deserialize(data) {
    super.deserialize(data);
    this.radius = data.radius ?? 0.5;
    this.height = data.height ?? 2;
  }
}

class MeshCollider extends Collider {
  constructor() {
    super('MeshCollider');
    this.convex = false;
  }
  
  getWorldAABB() {
    const mr = this.gameObject.getComponent('MeshRenderer');
    if (!mr || !mr.mesh) return new AABB();
    const wp = this.transform.worldPosition;
    const s = this.transform.scale;
    return new AABB(wp.sub(new Vec3(s.x/2,s.y/2,s.z/2)), wp.add(new Vec3(s.x/2,s.y/2,s.z/2)));
  }
  
  serialize() { return { ...super.serialize(), convex: this.convex }; }
  deserialize(data) { super.deserialize(data); this.convex = data.convex ?? false; }
}

// Physics World - manages all physics simulation
class PhysicsWorld {
  constructor() {
    this.gravity = new Vec3(0, -9.81, 0);
    this.enabled = true;
    this._collisionPairs = new Set();
  }
  
  step(scene, dt) {
    if (!this.enabled) return;
    
    const allObjs = scene.getAllObjects();
    const colliders = [];
    const rigidbodies = [];
    
    for (const obj of allObjs) {
      const rb = obj.getComponent('Rigidbody');
      if (rb && rb.enabled) rigidbodies.push(rb);
      
      const bc = obj.getComponent('BoxCollider');
      const sc = obj.getComponent('SphereCollider');
      const cc = obj.getComponent('CapsuleCollider');
      if (bc) colliders.push(bc);
      if (sc) colliders.push(sc);
      if (cc) colliders.push(cc);
    }
    
    // Broad phase - AABB pairs
    const potentialPairs = [];
    for (let i = 0; i < colliders.length; i++) {
      for (let j = i+1; j < colliders.length; j++) {
        const aabbA = colliders[i].getWorldAABB();
        const aabbB = colliders[j].getWorldAABB();
        if (aabbA.intersects(aabbB)) {
          potentialPairs.push([colliders[i], colliders[j]]);
        }
      }
    }
    
    // Narrow phase & resolve
    for (const [colA, colB] of potentialPairs) {
      const aabbA = colA.getWorldAABB();
      const aabbB = colB.getWorldAABB();
      const pairKey = [colA.gameObject.id, colB.gameObject.id].sort().join('-');
      
      const wasColliding = this._collisionPairs.has(pairKey);
      this._collisionPairs.add(pairKey);
      
      if (!wasColliding) {
        // Fire events
        if (colA.isTrigger || colB.isTrigger) {
          for (const comp of colA.gameObject.components) comp.onTriggerEnter?.(colB.gameObject);
          for (const comp of colB.gameObject.components) comp.onTriggerEnter?.(colA.gameObject);
        } else {
          for (const comp of colA.gameObject.components) comp.onCollisionEnter?.(colB.gameObject);
          for (const comp of colB.gameObject.components) comp.onCollisionEnter?.(colA.gameObject);
        }
      }
      
      // Resolve if not trigger
      if (!colA.isTrigger && !colB.isTrigger) {
        this._resolveCollision(colA, colB, aabbA, aabbB);
      }
    }
    
    // Clear pairs no longer colliding
    const currentPairs = new Set(potentialPairs.map(([a,b])=>[a.gameObject.id,b.gameObject.id].sort().join('-')));
    for (const key of this._collisionPairs) {
      if (!currentPairs.has(key)) {
        this._collisionPairs.delete(key);
        // Fire exit events
        const ids = key.split('-').map(Number);
        const objA = scene.findById(ids[0]);
        const objB = scene.findById(ids[1]);
        if (objA && objB) {
          for (const comp of objA.components) comp.onCollisionExit?.(objB);
          for (const comp of objB.components) comp.onCollisionExit?.(objA);
        }
      }
    }
  }
  
  _resolveCollision(colA, colB, aabbA, aabbB) {
    const rbA = colA.gameObject.getComponent('Rigidbody');
    const rbB = colB.gameObject.getComponent('Rigidbody');
    
    if (!rbA && !rbB) return;
    
    // Calculate overlap
    const overlapX = Math.min(aabbA.max.x,aabbB.max.x)-Math.max(aabbA.min.x,aabbB.min.x);
    const overlapY = Math.min(aabbA.max.y,aabbB.max.y)-Math.max(aabbA.min.y,aabbB.min.y);
    const overlapZ = Math.min(aabbA.max.z,aabbB.max.z)-Math.max(aabbA.min.z,aabbB.min.z);
    
    // Minimum separation axis
    let normal = new Vec3();
    let depth = 0;
    if (overlapX <= overlapY && overlapX <= overlapZ) { normal.x = aabbA.center.x < aabbB.center.x ? -1 : 1; depth = overlapX; }
    else if (overlapY <= overlapX && overlapY <= overlapZ) { normal.y = aabbA.center.y < aabbB.center.y ? -1 : 1; depth = overlapY; }
    else { normal.z = aabbA.center.z < aabbB.center.z ? -1 : 1; depth = overlapZ; }
    
    const massA = rbA ? rbA.mass : Infinity;
    const massB = rbB ? rbB.mass : Infinity;
    const totalMass = massA + massB;
    
    if (!isFinite(totalMass)) return;
    
    const ratioA = rbB ? massB/totalMass : 1;
    const ratioB = rbA ? massA/totalMass : 1;
    
    // Positional correction
    if (rbA && !rbA.isKinematic && rbA.enabled) {
      colA.transform.translate(normal.x*depth*ratioA, normal.y*depth*ratioA, normal.z*depth*ratioA);
    }
    if (rbB && !rbB.isKinematic && rbB.enabled) {
      colB.transform.translate(-normal.x*depth*ratioB, -normal.y*depth*ratioB, -normal.z*depth*ratioB);
    }
    
    // Impulse resolution
    const restitution = 0.2;
    const velA = rbA ? rbA.velocity : new Vec3();
    const velB = rbB ? rbB.velocity : new Vec3();
    const relVel = velA.sub(velB);
    const relVelN = relVel.dot(normal);
    
    if (relVelN > 0) return; // Moving apart
    
    const j = -(1+restitution) * relVelN / (1/massA + 1/massB);
    if (rbA && !rbA.isKinematic) rbA.velocity = rbA.velocity.add(normal.mul(j/massA));
    if (rbB && !rbB.isKinematic) rbB.velocity = rbB.velocity.sub(normal.mul(j/massB));
    
    // Friction
    const friction = 0.5;
    const tangent = relVel.sub(normal.mul(relVelN)).normalized();
    const jt = -relVel.dot(tangent) / (1/massA + 1/massB);
    const frictionImpulse = Math.abs(jt) < j*friction ? tangent.mul(jt) : tangent.mul(-j*friction);
    if (rbA && !rbA.isKinematic) rbA.velocity = rbA.velocity.add(frictionImpulse.mul(1/massA));
    if (rbB && !rbB.isKinematic) rbB.velocity = rbB.velocity.sub(frictionImpulse.mul(1/massB));
  }
  
  raycast(ray, maxDist = Infinity) {
    // Simple AABB raycast
    let hit = null;
    let minDist = maxDist;
    
    if (window.engine && window.engine.scene) {
      const allObjs = window.engine.scene.getAllObjects();
      for (const obj of allObjs) {
        const col = obj.getComponent('BoxCollider') || obj.getComponent('SphereCollider');
        if (!col) continue;
        const aabb = col.getWorldAABB();
        const t = this._rayAABB(ray, aabb);
        if (t !== null && t < minDist) {
          minDist = t;
          hit = { gameObject: obj, distance: t, point: ray.getPoint(t), collider: col };
        }
      }
    }
    return hit;
  }
  
  _rayAABB(ray, aabb) {
    const { origin: o, direction: d } = ray;
    let tmin = -Infinity, tmax = Infinity;
    
    for (const axis of ['x','y','z']) {
      if (Math.abs(d[axis]) < 1e-8) {
        if (o[axis] < aabb.min[axis] || o[axis] > aabb.max[axis]) return null;
      } else {
        const t1 = (aabb.min[axis]-o[axis])/d[axis];
        const t2 = (aabb.max[axis]-o[axis])/d[axis];
        tmin = Math.max(tmin, Math.min(t1,t2));
        tmax = Math.min(tmax, Math.max(t1,t2));
      }
    }
    return tmax >= Math.max(tmin, 0) ? tmin : null;
  }
}

// AudioSource Component
class AudioSource extends Component {
  constructor() {
    super('AudioSource');
    this.clip = null;
    this.volume = 1.0;
    this.pitch = 1.0;
    this.loop = false;
    this.playOnAwake = true;
    this.spatial = true;
    this.minDistance = 1;
    this.maxDistance = 50;
    this._source = null;
  }
  
  start() {
    if (this.playOnAwake && this.clip) this.play();
  }
  
  play() {
    if (!window.AudioEngine || !this.clip) return;
    this._source = window.AudioEngine.play(this.clip, { volume: this.volume, loop: this.loop, pitch: this.pitch });
  }
  
  stop() { if (this._source) this._source.stop?.(); }
  
  serialize() {
    return { ...super.serialize(), volume: this.volume, pitch: this.pitch, loop: this.loop, playOnAwake: this.playOnAwake };
  }
  
  deserialize(data) {
    super.deserialize(data);
    this.volume = data.volume ?? 1;
    this.pitch = data.pitch ?? 1;
    this.loop = data.loop ?? false;
    this.playOnAwake = data.playOnAwake !== false;
  }
}

ComponentFactory.register('Rigidbody', Rigidbody);
ComponentFactory.register('BoxCollider', BoxCollider);
ComponentFactory.register('SphereCollider', SphereCollider);
ComponentFactory.register('CapsuleCollider', CapsuleCollider);
ComponentFactory.register('MeshCollider', MeshCollider);
ComponentFactory.register('AudioSource', AudioSource);


/* ===== js/core/animation.js ===== */
/**
 * WebGL Engine - Animation System
 * AnimationClip, AnimationCurve, Animator, Skeleton/Rig
 */

class AnimationCurve {
  constructor() {
    this.keys = []; // [{time, value, inTangent, outTangent}]
  }
  
  addKey(time, value, inTan = 0, outTan = 0) {
    const key = { time, value, inTangent: inTan, outTangent: outTan };
    this.keys.push(key);
    this.keys.sort((a,b) => a.time - b.time);
    return key;
  }
  
  removeKey(index) { this.keys.splice(index, 1); }
  
  evaluate(time) {
    if (this.keys.length === 0) return 0;
    if (this.keys.length === 1) return this.keys[0].value;
    if (time <= this.keys[0].time) return this.keys[0].value;
    if (time >= this.keys[this.keys.length-1].time) return this.keys[this.keys.length-1].value;
    
    // Find bracket
    let i = 0;
    while (i < this.keys.length-1 && this.keys[i+1].time < time) i++;
    const k0 = this.keys[i], k1 = this.keys[i+1];
    const dt = k1.time - k0.time;
    const t = (time - k0.time) / dt;
    
    // Cubic hermite interpolation
    const t2 = t*t, t3 = t2*t;
    const h00 = 2*t3-3*t2+1;
    const h10 = t3-2*t2+t;
    const h01 = -2*t3+3*t2;
    const h11 = t3-t2;
    return h00*k0.value + h10*dt*k0.outTangent + h01*k1.value + h11*dt*k1.inTangent;
  }
  
  serialize() { return { keys: this.keys.map(k=>({...k})) }; }
  
  static deserialize(data) {
    const c = new AnimationCurve();
    if (data?.keys) c.keys = data.keys.map(k=>({...k}));
    return c;
  }
}

class AnimationProperty {
  constructor(path, property, curve) {
    this.path = path;       // e.g. "transform.position.x"
    this.property = property; // e.g. "position.x"
    this.curve = curve || new AnimationCurve();
  }
}

class AnimationClip {
  constructor(name = 'New Animation') {
    this.name = name;
    this.length = 1.0; // seconds
    this.frameRate = 30;
    this.loop = true;
    this.properties = []; // AnimationProperty[]
    this.events = []; // [{time, functionName}]
  }
  
  addProperty(path, property) {
    const prop = new AnimationProperty(path, property);
    this.properties.push(prop);
    return prop;
  }
  
  sample(gameObject, time) {
    for (const prop of this.properties) {
      const value = prop.curve.evaluate(time);
      this._applyValue(gameObject, prop.property, value);
    }
  }
  
  _applyValue(obj, property, value) {
    const parts = property.split('.');
    if (parts[0] === 'transform') {
      const t = obj.transform;
      if (parts[1] === 'position') { if(parts[2]==='x')t.position.x=value; else if(parts[2]==='y')t.position.y=value; else t.position.z=value; t._dirty=true; }
      else if (parts[1] === 'rotation') { if(parts[2]==='x')t.rotation.x=value; else if(parts[2]==='y')t.rotation.y=value; else t.rotation.z=value; t._dirty=true; }
      else if (parts[1] === 'scale') { if(parts[2]==='x')t.scale.x=value; else if(parts[2]==='y')t.scale.y=value; else t.scale.z=value; t._dirty=true; }
    }
  }
  
  serialize() {
    return {
      name: this.name, length: this.length, frameRate: this.frameRate, loop: this.loop,
      properties: this.properties.map(p => ({ path: p.path, property: p.property, curve: p.curve.serialize() }))
    };
  }
  
  static deserialize(data) {
    const c = new AnimationClip(data.name);
    c.length = data.length ?? 1;
    c.frameRate = data.frameRate ?? 30;
    c.loop = data.loop !== false;
    c.properties = (data.properties||[]).map(p => {
      const prop = new AnimationProperty(p.path, p.property, AnimationCurve.deserialize(p.curve));
      return prop;
    });
    return c;
  }
}

// Animator State Machine
class AnimatorState {
  constructor(name, clip) {
    this.name = name;
    this.clip = clip;
    this.speed = 1.0;
    this.transitions = [];
    this.x = 100; // graph position
    this.y = 100;
  }
}

class AnimatorTransition {
  constructor(from, to) {
    this.from = from;
    this.to = to;
    this.conditions = []; // [{parameter, comparison, value}]
    this.hasExitTime = false;
    this.exitTime = 1.0;
    this.transitionDuration = 0.25;
  }
  
  check(params) {
    if (!this.conditions.length && !this.hasExitTime) return false;
    return this.conditions.every(cond => {
      const val = params[cond.parameter];
      if (cond.comparison === 'true') return val === true || val > 0;
      if (cond.comparison === 'false') return val === false || val <= 0;
      if (cond.comparison === 'greater') return val > cond.value;
      if (cond.comparison === 'less') return val < cond.value;
      if (cond.comparison === 'equals') return val == cond.value;
      return false;
    });
  }
}

class AnimatorController {
  constructor() {
    this.states = [];
    this.defaultState = null;
    this.parameters = {}; // {name: {type, value}}
    this.anyStateTransitions = [];
  }
  
  addState(name, clip) {
    const state = new AnimatorState(name, clip);
    this.states.push(state);
    if (!this.defaultState) this.defaultState = state;
    return state;
  }
  
  addTransition(fromState, toState) {
    const t = new AnimatorTransition(fromState, toState);
    fromState.transitions.push(t);
    return t;
  }
  
  addParameter(name, type, defaultValue) {
    this.parameters[name] = { type, value: defaultValue };
  }
  
  setParameter(name, value) {
    if (this.parameters[name]) this.parameters[name].value = value;
  }
  
  getParameterValues() {
    const out = {};
    for (const [k,v] of Object.entries(this.parameters)) out[k] = v.value;
    return out;
  }
}

// Animator Component
class Animator extends Component {
  constructor() {
    super('Animator');
    this.controller = null;
    this.currentState = null;
    this.currentTime = 0;
    this.speed = 1.0;
    this.applyRootMotion = false;
    this._transitioning = false;
    this._transitionTime = 0;
    this._transitionDuration = 0;
    this._nextState = null;
    this._clips = {}; // name -> AnimationClip
  }
  
  start() {
    if (this.controller && this.controller.defaultState) {
      this.currentState = this.controller.defaultState;
      this.currentTime = 0;
    }
  }
  
  update(dt) {
    if (!this.controller || !this.currentState) return;
    
    const clip = this.currentState.clip;
    if (!clip) return;
    
    this.currentTime += dt * this.speed * this.currentState.speed;
    
    if (clip.loop) {
      this.currentTime %= clip.length;
    } else {
      this.currentTime = Math.min(this.currentTime, clip.length);
    }
    
    clip.sample(this.gameObject, this.currentTime);
    
    // Check transitions
    if (!this._transitioning && this.controller) {
      const params = this.controller.getParameterValues();
      // Check any-state transitions
      for (const t of this.controller.anyStateTransitions) {
        if (t.to !== this.currentState && t.check(params)) { this._startTransition(t); break; }
      }
      if (!this._transitioning) {
        for (const t of this.currentState.transitions) {
          const normalizedTime = this.currentTime / clip.length;
          const exitReady = !t.hasExitTime || normalizedTime >= t.exitTime;
          if (exitReady && t.check(params)) { this._startTransition(t); break; }
        }
      }
    }
    
    // Blend transition
    if (this._transitioning) {
      this._transitionTime += dt;
      const blend = Math.min(this._transitionTime / this._transitionDuration, 1);
      this._nextState?.clip?.sample(this.gameObject, this._transitionTime * this.speed);
      // TODO: proper blending of transforms
      if (blend >= 1) {
        this.currentState = this._nextState;
        this.currentTime = this._transitionTime;
        this._transitioning = false;
        this._nextState = null;
      }
    }
  }
  
  _startTransition(transition) {
    this._transitioning = true;
    this._transitionTime = 0;
    this._transitionDuration = transition.transitionDuration;
    this._nextState = transition.to;
  }
  
  play(stateName, layer=0) {
    if (!this.controller) return;
    const state = this.controller.states.find(s => s.name === stateName);
    if (state) { this.currentState = state; this.currentTime = 0; }
  }
  
  setTrigger(name) {
    if (this.controller) { this.controller.setParameter(name, true); setTimeout(()=>this.controller?.setParameter(name, false), 100); }
  }
  
  setBool(name, val) { this.controller?.setParameter(name, val); }
  setFloat(name, val) { this.controller?.setParameter(name, val); }
  setInt(name, val) { this.controller?.setParameter(name, Math.round(val)); }
  
  serialize() {
    return { ...super.serialize(), speed: this.speed, applyRootMotion: this.applyRootMotion };
  }
  
  deserialize(data) {
    super.deserialize(data);
    this.speed = data.speed ?? 1;
    this.applyRootMotion = data.applyRootMotion ?? false;
  }
}

// Bone/Skeleton for rigging
class Bone {
  constructor(name) {
    this.name = name;
    this.id = generateId();
    this.parent = null;
    this.children = [];
    this.transform = new Transform();
    this.bindPose = new Mat4(); // inverse bind pose matrix
    this.length = 0.3;
  }
  
  addChild(bone) {
    bone.parent = this;
    this.children.push(bone);
    this.transform.addChild(bone.transform);
  }
  
  getWorldMatrix() { return this.transform.getWorldMatrix(); }
}

class Skeleton {
  constructor() {
    this.bones = [];
    this.root = null;
  }
  
  addBone(name, parent = null) {
    const bone = new Bone(name);
    this.bones.push(bone);
    if (parent) parent.addChild(bone);
    else if (!this.root) this.root = bone;
    return bone;
  }
  
  getBone(name) { return this.bones.find(b => b.name === name); }
  
  computeBindPose() {
    for (const bone of this.bones) {
      bone.bindPose = bone.getWorldMatrix().inverse();
    }
  }
  
  getSkinMatrices() {
    return this.bones.map(b => b.getWorldMatrix().multiply(b.bindPose));
  }
}

// Skinned Mesh Renderer
class SkinnedMeshRenderer extends MeshRenderer {
  constructor() {
    super();
    this.type = 'SkinnedMeshRenderer';
    this.skeleton = null;
    this.bones = [];
    this.boneWeights = []; // per-vertex [{bone0,weight0,bone1,weight1,...}]
  }
}

ComponentFactory.register('Animator', Animator);
ComponentFactory.register('SkinnedMeshRenderer', SkinnedMeshRenderer);


/* ===== js/core/particles.js ===== */
/**
 * WebGL Engine - Particle System
 */

class Particle {
  constructor() {
    this.position = new Vec3();
    this.velocity = new Vec3();
    this.acceleration = new Vec3();
    this.color = new Color(1,1,1,1);
    this.startColor = new Color(1,1,1,1);
    this.endColor = new Color(1,1,1,0);
    this.size = 1.0;
    this.startSize = 1.0;
    this.endSize = 0.0;
    this.rotation = 0;
    this.angularVelocity = 0;
    this.lifetime = 1.0;
    this.age = 0;
    this.alive = false;
  }
  get normalizedAge() { return this.lifetime > 0 ? this.age/this.lifetime : 1; }
}

class ParticleSystem extends Component {
  constructor() {
    super('ParticleSystem');
    // Emission
    this.maxParticles = 100;
    this.emissionRate = 10; // particles/second
    this.duration = 5.0;
    this.loop = true;
    this.playOnAwake = true;
    this.prewarm = false;
    // Lifetime
    this.startLifetime = { min: 1, max: 2 };
    // Speed
    this.startSpeed = { min: 1, max: 3 };
    // Size
    this.startSize = { min: 0.1, max: 0.3 };
    this.endSize = 0.0;
    // Color
    this.startColor = new Color(1,1,1,1);
    this.endColor = new Color(1,1,1,0);
    // Gravity
    this.gravityModifier = 0;
    // Shape
    this.shape = 'sphere'; // sphere, cone, box, circle, point
    this.shapeRadius = 0.5;
    this.shapeAngle = 25;
    // Rotation
    this.startRotation = { min: 0, max: 360 };
    this.angularVelocity = { min: 0, max: 0 };
    // Renderer
    this.texture = null;
    this.blendMode = 'additive'; // additive, alpha
    // State
    this._particles = [];
    this._emitAccum = 0;
    this._age = 0;
    this._playing = false;
    this._buffersDirty = true;
  }
  
  start() {
    this._particles = Array.from({ length: this.maxParticles }, () => new Particle());
    if (this.playOnAwake) this.play();
  }
  
  play() { this._playing = true; this._age = 0; }
  stop() { this._playing = false; }
  
  update(dt) {
    if (!this._playing) return;
    this._age += dt;
    
    if (!this.loop && this._age > this.duration) {
      this._playing = false;
      return;
    }
    
    const scene = this.gameObject?._scene;
    const gravity = scene?.gravity || new Vec3(0,-9.81,0);
    
    // Update alive particles
    let aliveCount = 0;
    for (const p of this._particles) {
      if (!p.alive) continue;
      aliveCount++;
      p.age += dt;
      if (p.age >= p.lifetime) { p.alive = false; continue; }
      
      const t = p.normalizedAge;
      // Gravity
      p.velocity = p.velocity.add(gravity.mul(this.gravityModifier * dt));
      p.velocity = p.velocity.add(p.acceleration.mul(dt));
      p.position = p.position.add(p.velocity.mul(dt));
      p.rotation += p.angularVelocity * dt;
      // Interpolate color & size
      p.color = p.startColor.lerp(p.endColor, t);
      p.size = MathUtils.lerp(p.startSize, this.endSize, t);
    }
    
    // Emit new particles
    if (this._playing) {
      this._emitAccum += this.emissionRate * dt;
      while (this._emitAccum >= 1) {
        this._emitAccum -= 1;
        this._emit();
      }
    }
    
    this._buffersDirty = true;
  }
  
  _emit() {
    // Find dead particle
    const p = this._particles.find(p => !p.alive);
    if (!p) return;
    
    p.alive = true;
    p.age = 0;
    p.lifetime = MathUtils.randomRange(this.startLifetime.min, this.startLifetime.max);
    p.startSize = MathUtils.randomRange(this.startSize.min, this.startSize.max);
    p.size = p.startSize;
    p.startColor = this.startColor.clone();
    p.endColor = this.endColor.clone();
    p.color = p.startColor.clone();
    p.rotation = MathUtils.randomRange(this.startRotation.min, this.startRotation.max);
    p.angularVelocity = MathUtils.randomRange(this.angularVelocity.min, this.angularVelocity.max);
    
    const wp = this.transform ? this.transform.worldPosition : new Vec3();
    const speed = MathUtils.randomRange(this.startSpeed.min, this.startSpeed.max);
    
    let dir = new Vec3();
    switch (this.shape) {
      case 'sphere': {
        const theta = Math.random()*Math.PI*2, phi = Math.acos(2*Math.random()-1);
        const r = this.shapeRadius * Math.cbrt(Math.random());
        const ox = r*Math.sin(phi)*Math.cos(theta);
        const oy = r*Math.sin(phi)*Math.sin(theta);
        const oz = r*Math.cos(phi);
        p.position = wp.add(new Vec3(ox,oy,oz));
        dir = new Vec3(ox,oy,oz).normalized();
        break;
      }
      case 'cone': {
        const a = MathUtils.degToRad(this.shapeAngle);
        const theta = Math.random()*Math.PI*2;
        const r = Math.random()*Math.tan(a);
        dir = new Vec3(r*Math.cos(theta), 1, r*Math.sin(theta)).normalized();
        p.position = wp.clone();
        break;
      }
      case 'box': {
        const s = this.shapeRadius;
        p.position = wp.add(new Vec3(MathUtils.randomRange(-s,s),MathUtils.randomRange(-s,s),MathUtils.randomRange(-s,s)));
        dir = new Vec3(MathUtils.randomRange(-1,1),MathUtils.randomRange(-1,1),MathUtils.randomRange(-1,1)).normalized();
        break;
      }
      case 'circle': {
        const theta = Math.random()*Math.PI*2;
        const r = Math.random()*this.shapeRadius;
        p.position = wp.add(new Vec3(r*Math.cos(theta),0,r*Math.sin(theta)));
        dir = new Vec3(0,1,0);
        break;
      }
      default: // point
        p.position = wp.clone();
        dir = new Vec3(MathUtils.randomRange(-1,1),MathUtils.randomRange(-1,1),MathUtils.randomRange(-1,1)).normalized();
    }
    
    p.velocity = dir.mul(speed);
    p.acceleration = new Vec3();
  }
  
  // Returns data for GPU upload
  getParticleData() {
    const alive = this._particles.filter(p => p.alive);
    const positions = new Float32Array(alive.length * 3);
    const sizes = new Float32Array(alive.length);
    const colors = new Float32Array(alive.length * 4);
    alive.forEach((p,i) => {
      positions[i*3]=p.position.x; positions[i*3+1]=p.position.y; positions[i*3+2]=p.position.z;
      sizes[i]=p.size;
      colors[i*4]=p.color.r; colors[i*4+1]=p.color.g; colors[i*4+2]=p.color.b; colors[i*4+3]=p.color.a;
    });
    return { count: alive.length, positions, sizes, colors };
  }
  
  serialize() {
    return { ...super.serialize(), maxParticles: this.maxParticles, emissionRate: this.emissionRate,
      duration: this.duration, loop: this.loop, playOnAwake: this.playOnAwake,
      startLifetime: {...this.startLifetime}, startSpeed: {...this.startSpeed},
      startSize: {...this.startSize}, endSize: this.endSize,
      startColor: this.startColor.toArray(), endColor: this.endColor.toArray(),
      gravityModifier: this.gravityModifier, shape: this.shape, shapeRadius: this.shapeRadius };
  }
  
  deserialize(data) {
    super.deserialize(data);
    this.maxParticles = data.maxParticles ?? 100;
    this.emissionRate = data.emissionRate ?? 10;
    this.duration = data.duration ?? 5;
    this.loop = data.loop !== false;
    this.playOnAwake = data.playOnAwake !== false;
    if (data.startLifetime) this.startLifetime = {...data.startLifetime};
    if (data.startSpeed) this.startSpeed = {...data.startSpeed};
    if (data.startSize) this.startSize = {...data.startSize};
    this.endSize = data.endSize ?? 0;
    if (data.startColor) this.startColor = new Color(...data.startColor);
    if (data.endColor) this.endColor = new Color(...data.endColor);
    this.gravityModifier = data.gravityModifier ?? 0;
    this.shape = data.shape || 'sphere';
    this.shapeRadius = data.shapeRadius ?? 0.5;
  }
}

ComponentFactory.register('ParticleSystem', ParticleSystem);


/* ===== js/core/input.js ===== */
/**
 * WebGL Engine - Input System
 */

class InputSystem {
  constructor() {
    this._keys = {};
    this._keysDown = {};
    this._keysUp = {};
    this._mouse = { x:0, y:0, dx:0, dy:0, wheel:0, buttons:{0:false,1:false,2:false}, buttonsDown:{}, buttonsUp:{}, locked:false };
    this._touches = {};
    this._gamepad = null;
    this._virtualJoystick = { x:0, y:0, active:false };
    this._pointerLockEl = null;
    this._setupListeners();
  }
  
  _setupListeners() {
    window.addEventListener('keydown', e => {
      if (!this._keys[e.code]) this._keysDown[e.code] = true;
      this._keys[e.code] = true;
    });
    window.addEventListener('keyup', e => {
      this._keys[e.code] = false;
      this._keysUp[e.code] = true;
    });
    window.addEventListener('mousedown', e => {
      if (!this._mouse.buttons[e.button]) this._mouse.buttonsDown[e.button] = true;
      this._mouse.buttons[e.button] = true;
    });
    window.addEventListener('mouseup', e => {
      this._mouse.buttons[e.button] = false;
      this._mouse.buttonsUp[e.button] = true;
    });
    window.addEventListener('mousemove', e => {
      this._mouse.x = e.clientX;
      this._mouse.y = e.clientY;
      this._mouse.dx = e.movementX || 0;
      this._mouse.dy = e.movementY || 0;
    });
    window.addEventListener('wheel', e => {
      this._mouse.wheel = e.deltaY;
    }, { passive: true });
    window.addEventListener('touchstart', e => {
      for (const t of e.changedTouches) {
        this._touches[t.identifier] = { x:t.clientX, y:t.clientY, dx:0, dy:0 };
      }
    });
    window.addEventListener('touchmove', e => {
      for (const t of e.changedTouches) {
        const prev = this._touches[t.identifier];
        if (prev) { prev.dx=t.clientX-prev.x; prev.dy=t.clientY-prev.y; prev.x=t.clientX; prev.y=t.clientY; }
      }
    });
    window.addEventListener('touchend', e => {
      for (const t of e.changedTouches) delete this._touches[t.identifier];
    });
    window.addEventListener('gamepadconnected', e => { this._gamepad = e.gamepad; });
    window.addEventListener('gamepaddisconnected', () => { this._gamepad = null; });
    document.addEventListener('pointerlockchange', () => {
      this._mouse.locked = !!document.pointerLockElement;
    });
  }
  
  // ===== KEY METHODS =====
  getKey(key) { return !!this._keys[key] || !!this._keys['Key'+key.toUpperCase()] || !!this._keys['Arrow'+key]; }
  getKeyDown(key) { return !!this._keysDown[key] || !!this._keysDown['Key'+key.toUpperCase()]; }
  getKeyUp(key) { return !!this._keysUp[key]; }
  getKeyByCode(code) { return !!this._keys[code]; }
  getKeyDownByCode(code) { return !!this._keysDown[code]; }
  
  // ===== MOUSE METHODS =====
  getMouseButton(btn) { return !!this._mouse.buttons[btn]; }
  getMouseButtonDown(btn) { return !!this._mouse.buttonsDown[btn]; }
  getMouseButtonUp(btn) { return !!this._mouse.buttonsUp[btn]; }
  get mousePosition() { return new Vec2(this._mouse.x, this._mouse.y); }
  get mouseDelta() { return new Vec2(this._mouse.dx, this._mouse.dy); }
  get mouseScrollDelta() { return this._mouse.wheel; }
  
  lockMouse(el) { el?.requestPointerLock?.(); }
  unlockMouse() { document.exitPointerLock?.(); }
  
  // ===== AXIS METHODS (Unity-like) =====
  getAxis(name) {
    switch(name) {
      case 'Horizontal':
        let h = 0;
        if (this.getKey('a') || this.getKeyByCode('ArrowLeft')) h -= 1;
        if (this.getKey('d') || this.getKeyByCode('ArrowRight')) h += 1;
        h += this._virtualJoystick.x;
        if (this._gamepad) {
          const gp = navigator.getGamepads()[this._gamepad.index];
          if (gp) h += gp.axes[0] || 0;
        }
        return MathUtils.clamp(h, -1, 1);
      case 'Vertical':
        let v = 0;
        if (this.getKey('s') || this.getKeyByCode('ArrowDown')) v -= 1;
        if (this.getKey('w') || this.getKeyByCode('ArrowUp')) v += 1;
        v += this._virtualJoystick.y;
        if (this._gamepad) {
          const gp = navigator.getGamepads()[this._gamepad.index];
          if (gp) v -= gp.axes[1] || 0;
        }
        return MathUtils.clamp(v, -1, 1);
      case 'Mouse X': return this._mouse.dx;
      case 'Mouse Y': return this._mouse.dy;
      case 'Mouse ScrollWheel': return this._mouse.wheel / 100;
    }
    return 0;
  }
  
  // ===== TOUCH METHODS =====
  getTouches() { return Object.values(this._touches); }
  getTouchCount() { return Object.keys(this._touches).length; }
  getTouch(index) { return Object.values(this._touches)[index] || null; }
  
  // ===== VIRTUAL JOYSTICK =====
  setVirtualJoystick(x, y) { this._virtualJoystick.x = x; this._virtualJoystick.y = y; this._virtualJoystick.active = true; }
  clearVirtualJoystick() { this._virtualJoystick.x = 0; this._virtualJoystick.y = 0; this._virtualJoystick.active = false; }
  
  // Called each frame to clear transient state
  lateUpdate() {
    this._keysDown = {};
    this._keysUp = {};
    this._mouse.buttonsDown = {};
    this._mouse.buttonsUp = {};
    this._mouse.dx = 0;
    this._mouse.dy = 0;
    this._mouse.wheel = 0;
  }
}

// Global Input instance
const Input = new InputSystem();


/* ===== js/core/audio.js ===== */
/**
 * WebGL Engine - Audio System
 */

class AudioEngineSystem {
  constructor() {
    this._ctx = null;
    this._masterGain = null;
    this._clips = {};
    this._sources = [];
    this._initialized = false;
  }
  
  init() {
    if (this._initialized) return;
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._ctx.createGain();
      this._masterGain.connect(this._ctx.destination);
      this._initialized = true;
    } catch(e) { console.warn('Audio not available:', e); }
  }
  
  setMasterVolume(v) { if (this._masterGain) this._masterGain.gain.value = v; }
  
  async loadClip(name, url) {
    if (!this._initialized) this.init();
    if (!this._ctx) return null;
    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const audioBuffer = await this._ctx.decodeAudioData(buffer);
      this._clips[name] = audioBuffer;
      return audioBuffer;
    } catch(e) { console.warn('Audio load failed:', e); return null; }
  }
  
  async loadClipFromFile(name, file) {
    if (!this._initialized) this.init();
    if (!this._ctx) return null;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this._ctx.decodeAudioData(arrayBuffer);
      this._clips[name] = audioBuffer;
      return audioBuffer;
    } catch(e) { console.warn('Audio load failed:', e); return null; }
  }
  
  play(clipName, options = {}) {
    if (!this._initialized || !this._ctx) return null;
    if (this._ctx.state === 'suspended') this._ctx.resume();
    
    const buffer = typeof clipName === 'string' ? this._clips[clipName] : clipName;
    if (!buffer) return null;
    
    const source = this._ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = options.loop || false;
    source.playbackRate.value = options.pitch || 1;
    
    const gain = this._ctx.createGain();
    gain.gain.value = options.volume ?? 1;
    
    source.connect(gain);
    gain.connect(this._masterGain);
    source.start(0);
    
    const wrapper = {
      source, gain,
      stop: () => { try { source.stop(); } catch(e) {} },
      setVolume: (v) => { gain.gain.value = v; },
      setPitch: (p) => { source.playbackRate.value = p; }
    };
    
    this._sources.push(wrapper);
    source.onended = () => { const idx = this._sources.indexOf(wrapper); if(idx>=0)this._sources.splice(idx,1); };
    return wrapper;
  }
  
  playOneShot(clipName, volume = 1) {
    return this.play(clipName, { volume, loop: false });
  }
  
  stopAll() { [...this._sources].forEach(s => s.stop()); }
  
  generateBeep(freq=440, dur=0.1, vol=0.3) {
    if (!this._initialized) this.init();
    if (!this._ctx) return;
    if (this._ctx.state === 'suspended') this._ctx.resume();
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.value = vol;
    gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(this._masterGain);
    osc.start();
    osc.stop(this._ctx.currentTime + dur);
  }
}

window.AudioEngine = new AudioEngineSystem();


/* ===== js/systems/renderer.js ===== */
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


/* ===== js/systems/lighting.js ===== */
/** WebGL Engine - Lighting & Post-processing stub (settings live in renderer/inspector) */
class LightingSystem {
  constructor() {
    this.settings = {
      shadowType: 'soft', shadowDistance: 150,
      bloom: false, bloomIntensity: 1,
      ao: false, hdr: false, fog: false,
      fogColor: new Color(0.5,0.7,0.9), fogDensity: 0.01
    };
  }
  apply(renderer, scene) {
    renderer.fogEnabled = this.settings.fog;
    renderer.fogColor = this.settings.fogColor;
    renderer.fogDensity = this.settings.fogDensity;
    scene.fogEnabled = this.settings.fog;
    scene.fogColor = this.settings.fogColor;
    scene.fogDensity = this.settings.fogDensity;
  }
}


/* ===== js/systems/postprocess.js ===== */
/** WebGL Engine - Post-processing (placeholder, effects handled in renderer) */
class PostProcessingSystem { constructor() {} }


/* ===== js/systems/scripting.js ===== */
/**
 * WebGL Engine - Scripting System
 * Compiles custom "object Foo { start() {} update() {} }" syntax to JS classes
 */

class ScriptingEngine {
  constructor() {
    this._scripts = {}; // name -> class
    this._scriptSources = {}; // name -> source
    this._errors = {};
  }
  
  // Compile custom language to JS
  compile(source, name) {
    try {
      const js = this.transpile(source);
      this._errors[name] = null;
      return js;
    } catch(e) {
      this._errors[name] = e.message;
      throw e;
    }
  }
  
  transpile(source) {
    // Replace "object ClassName {" with class definition
    let js = source;
    
    // Transform: object Foo { ... }
    js = js.replace(/^object\s+(\w+)\s*\{/gm, (match, className) => {
      return `class ${className} extends ScriptComponent {
  constructor() { super('${className}'); }`;
    });
    
    // Transform: start() { -> start() {
    // (already valid JS methods)
    
    // Transform: print(...) -> console.log(...)
    js = js.replace(/\bprint\s*\(/g, 'console.log(');
    
    // Transform: log(...) -> Engine.console.log(...)
    js = js.replace(/\blog\s*\(/g, '_engineLog(');
    
    // Transform: destroy() -> this.gameObject.destroy()
    js = js.replace(/\bdestroy\(\)/g, 'this.gameObject.destroy()');
    
    // Transform: instantiate(prefab) -> Engine.instantiate(prefab)
    js = js.replace(/\binstantiate\s*\(/g, 'Engine.instantiate(');
    
    // Transform: findObject("name") -> Engine.scene.findByName("name")
    js = js.replace(/\bfindObject\s*\(/g, 'Engine.scene.findByName(');
    
    // Transform: Input.getKey("W") -> Input.getKey("w")
    // (already valid)
    
    // (explicit registration done in execute())
    
    return js;
  }
  
  execute(compiledJs, name) {
    try {
      // Extract the actual class name from the compiled JS (may differ from 'name' param)
      const classMatch = compiledJs.match(/class\s+(\w+)\s+extends\s+ScriptComponent/);
      const actualName = classMatch ? classMatch[1] : name;
      
      // Create a sandboxed function that returns the defined class
      const returnExpr = `
        typeof ${actualName} !== 'undefined' ? ${actualName} : null;
      `;
      
      const fn = new Function(
        'ScriptComponent', 'Vec3', 'Vec2', 'Vec4', 'Color', 'Mat4', 'Quaternion',
        'MathUtils', 'Input', 'Time', 'Engine', '_engineLog', 'ComponentFactory',
        compiledJs + '\nreturn ' + returnExpr
      );
      
      const engine = (typeof window !== 'undefined') ? window.engine : null;
      const cls = fn(
        ScriptComponent, Vec3, Vec2, Vec4, Color, Mat4, Quaternion,
        MathUtils, Input, Time,
        engine, (...args) => engine?.editorConsole?.log?.(...args),
        ComponentFactory
      );
      
      if (cls) {
        this._scripts[name] = cls;
        this._scripts[actualName] = cls;
        ComponentFactory.register(name, cls);
        if (actualName !== name) ComponentFactory.register(actualName, cls);
      }
      return cls;
    } catch(e) {
      this._errors[name] = e.message;
      console.error('Script error [' + name + ']:', e.message);
      return null;
    }
  }
  
  compileAndExecute(source, name) {
    try {
      const js = this.transpile(source);
      return this.execute(js, name);
    } catch(e) {
      this._errors[name] = e.message;
      return null;
    }
  }
  
  getError(name) { return this._errors[name]; }
  
  // Load a script source and compile it
  loadScript(name, source) {
    this._scriptSources[name] = source;
    return this.compileAndExecute(source, name);
  }
  
  getScriptClass(name) { return this._scripts[name]; }
}

// Script Component base class - user scripts extend this
class ScriptComponent extends Component {
  constructor(name) {
    super(name || 'Script');
    this._fields = {}; // exposed fields for inspector
    this._fieldTypes = {};
  }
  
  // Expose fields to inspector
  expose(name, type, defaultValue) {
    this._fields[name] = this[name] !== undefined ? this[name] : defaultValue;
    this._fieldTypes[name] = type;
    if (this[name] === undefined) this[name] = defaultValue;
  }
  
  // Unity-like API shortcuts
  getComponent(type) { return this.gameObject.getComponent(type); }
  addComponent(type) {
    const comp = ComponentFactory.create(type, { type }, this.gameObject);
    if (comp) this.gameObject.addComponent(comp);
    return comp;
  }
  findObjectOfType(type) {
    return window.engine?.scene?.getAllObjects().find(o => o.getComponent(type)) || null;
  }
  
  serialize() {
    const data = super.serialize();
    data.fields = {};
    for (const [k, t] of Object.entries(this._fieldTypes)) {
      const v = this[k];
      if (v instanceof Vec3) data.fields[k] = { type: 'vec3', value: v.toArray() };
      else if (v instanceof Color) data.fields[k] = { type: 'color', value: v.toArray() };
      else data.fields[k] = { type: t, value: v };
    }
    return data;
  }
  
  deserialize(data) {
    super.deserialize(data);
    if (data.fields) {
      for (const [k, fd] of Object.entries(data.fields)) {
        if (fd.type === 'vec3') this[k] = Vec3.fromArray(fd.value);
        else if (fd.type === 'color') this[k] = new Color(...fd.value);
        else this[k] = fd.value;
        this._fields[k] = this[k];
        this._fieldTypes[k] = fd.type;
      }
    }
  }
}

// Time singleton
const Time = {
  _time: 0, _deltaTime: 0, _fixedDeltaTime: 1/50, _timeScale: 1,
  get time() { return this._time; },
  get deltaTime() { return this._deltaTime * this._timeScale; },
  get fixedDeltaTime() { return this._fixedDeltaTime; },
  get timeScale() { return this._timeScale; },
  set timeScale(v) { this._timeScale = v; },
  get frameCount() { return this._frame || 0; },
};

// Default script template
const DEFAULT_SCRIPT_TEMPLATE = `object MyScript {
  // Called once when the object is created
  start() {
    console.log("Start: " + this.gameObject.name);
  }
  
  // Called every frame
  update(dt) {
    // Move with WASD
    const speed = 5 * dt;
    if (Input.getKey("w")) this.transform.translate(0, 0, -speed);
    if (Input.getKey("s")) this.transform.translate(0, 0,  speed);
    if (Input.getKey("a")) this.transform.translate(-speed, 0, 0);
    if (Input.getKey("d")) this.transform.translate( speed, 0, 0);
    
    // Rotate with mouse
    if (Input.getMouseButton(1)) {
      this.transform.rotate(Input.mouseDelta.y * 0.2, Input.mouseDelta.x * 0.2, 0);
    }
  }
  
  // Called when entering collision
  onCollisionEnter(other) {
    console.log("Collision with: " + other.name);
  }
}`;


/* ===== js/systems/storage.js ===== */
/**
 * WebGL Engine - IndexedDB Persistence System
 * Saves every project detail locally: scene, assets, scripts, settings
 * Falls back to localStorage for small data (GitHub credentials, prefs)
 */

const DB_NAME = 'WebGLEngine';
const DB_VERSION = 2;
const STORE_PROJECTS = 'projects';
const STORE_ASSETS = 'assets';
const STORE_META = 'meta';

class EngineStorage {
  constructor() {
    this._db = null;
    this._ready = this._open();
  }

  // ── Open / upgrade database ──────────────────────────────────────────
  _open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        // Projects store: key = project name, value = full project data
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          const ps = db.createObjectStore(STORE_PROJECTS, { keyPath: 'name' });
          ps.createIndex('lastModified', 'lastModified', { unique: false });
        }
        // Assets store: key = "projectName::assetType::assetName"
        if (!db.objectStoreNames.contains(STORE_ASSETS)) {
          const as = db.createObjectStore(STORE_ASSETS, { keyPath: '_key' });
          as.createIndex('project', 'project', { unique: false });
        }
        // Meta store: settings, prefs, last-opened project
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'key' });
        }
      };

      req.onsuccess = (e) => { this._db = e.target.result; resolve(); };
      req.onerror = () => {
        console.warn('[Storage] IndexedDB failed, will use localStorage fallback');
        resolve(); // don't reject — we degrade gracefully
      };
    });
  }

  async _tx(storeName, mode = 'readonly') {
    await this._ready;
    if (!this._db) return null;
    try {
      return this._db.transaction(storeName, mode).objectStore(storeName);
    } catch (e) { return null; }
  }

  _promisify(request) {
    return new Promise((resolve, reject) => {
      if (!request) { resolve(null); return; }
      request.onsuccess = () => resolve(request.result);
      request.onerror  = () => reject(request.error);
    });
  }

  // ── Project ──────────────────────────────────────────────────────────
  async saveProject(projectData) {
    if (!projectData || !projectData.name) return false;
    try {
      // Save core project data (scene, settings, metadata)
      // Assets with large binary content are stored separately
      const toSave = {
        ...projectData,
        lastModified: Date.now(),
        // Don't embed assets inline — store them in STORE_ASSETS
        assets: (projectData.assets || []).map(a => ({
          type: a.type,
          name: a.name,
          // Store asset ref only — blob/texture content saved separately
          _hasContent: !!a.content && typeof a.content === 'string',
        })),
      };

      const store = await this._tx(STORE_PROJECTS, 'readwrite');
      if (store) {
        await this._promisify(store.put(toSave));
      } else {
        // localStorage fallback (truncated)
        try {
          const mini = { ...toSave };
          localStorage.setItem('wge-project-' + projectData.name, JSON.stringify(mini).slice(0, 4_000_000));
        } catch (e) {}
      }

      // Save assets separately
      await this._saveAssets(projectData.name, projectData.assets || []);

      // Update project list in localStorage (lightweight index)
      this._updateProjectIndex(projectData.name, projectData.lastModified || Date.now(), projectData.template);
      return true;
    } catch (e) {
      console.error('[Storage] saveProject error:', e);
      return false;
    }
  }

  async _saveAssets(projectName, assets) {
    const store = await this._tx(STORE_ASSETS, 'readwrite');
    if (!store) return;
    for (const asset of assets) {
      if (!asset.name) continue;
      // Skip WebGL objects (textures etc) — can't serialize them
      let content = asset.content;
      if (content && typeof content === 'object' && !(content instanceof ArrayBuffer)) {
        try { content = JSON.stringify(content); } catch (e) { content = null; }
      }
      const rec = {
        _key: `${projectName}::${asset.type}::${asset.name}`,
        project: projectName,
        type: asset.type,
        name: asset.name,
        content,
        url: asset.url || null,
        savedAt: Date.now(),
      };
      try { await this._promisify(store.put(rec)); } catch (e) {}
    }
  }

  async loadProject(name) {
    try {
      const store = await this._tx(STORE_PROJECTS, 'readonly');
      let proj = null;
      if (store) {
        proj = await this._promisify(store.get(name));
      }
      if (!proj) {
        // Try localStorage fallback
        try {
          const raw = localStorage.getItem('wge-project-' + name);
          if (raw) proj = JSON.parse(raw);
        } catch (e) {}
      }
      if (!proj) return null;

      // Restore assets from asset store
      proj.assets = await this._loadAssets(name);
      return proj;
    } catch (e) {
      console.error('[Storage] loadProject error:', e);
      return null;
    }
  }

  async _loadAssets(projectName) {
    const store = await this._tx(STORE_ASSETS, 'readonly');
    if (!store) return [];
    try {
      const idx = store.index('project');
      const records = await this._promisify(idx.getAll(projectName));
      if (!records) return [];
      return records.map(r => ({
        type: r.type,
        name: r.name,
        content: r.content,
        url: r.url,
      }));
    } catch (e) { return []; }
  }

  async listProjects() {
    try {
      const store = await this._tx(STORE_PROJECTS, 'readonly');
      if (store) {
        const all = await this._promisify(store.getAll());
        if (all && all.length > 0) {
          return all.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
        }
      }
    } catch (e) {}
    // Fallback: localStorage index
    try {
      return JSON.parse(localStorage.getItem('wge-projects') || '[]');
    } catch (e) { return []; }
  }

  async deleteProject(name) {
    try {
      const projStore = await this._tx(STORE_PROJECTS, 'readwrite');
      if (projStore) await this._promisify(projStore.delete(name));

      // Delete all assets for this project
      const assetStore = await this._tx(STORE_ASSETS, 'readwrite');
      if (assetStore) {
        const idx = assetStore.index('project');
        const records = await this._promisify(idx.getAll(name));
        if (records) {
          for (const r of records) {
            try { await this._promisify(assetStore.delete(r._key)); } catch (e) {}
          }
        }
      }

      // Remove from localStorage index
      this._removeFromProjectIndex(name);
      return true;
    } catch (e) {
      console.error('[Storage] deleteProject error:', e);
      return false;
    }
  }

  // ── Meta / prefs ─────────────────────────────────────────────────────
  async setMeta(key, value) {
    try {
      const store = await this._tx(STORE_META, 'readwrite');
      if (store) await this._promisify(store.put({ key, value }));
      else localStorage.setItem('wge-meta-' + key, JSON.stringify(value));
    } catch (e) {}
  }

  async getMeta(key) {
    try {
      const store = await this._tx(STORE_META, 'readonly');
      if (store) {
        const rec = await this._promisify(store.get(key));
        if (rec) return rec.value;
      }
    } catch (e) {}
    try { return JSON.parse(localStorage.getItem('wge-meta-' + key)); } catch (e) { return null; }
  }

  // ── GitHub credentials (always localStorage — lightweight) ───────────
  saveGitHubCreds(creds) {
    try { localStorage.setItem('wge-github', JSON.stringify(creds)); } catch (e) {}
  }

  loadGitHubCreds() {
    try { return JSON.parse(localStorage.getItem('wge-github') || 'null'); } catch (e) { return null; }
  }

  // ── Project index helpers (lightweight localStorage index) ───────────
  _updateProjectIndex(name, lastModified, template) {
    try {
      const list = JSON.parse(localStorage.getItem('wge-projects') || '[]');
      const idx = list.findIndex(p => p.name === name);
      const entry = { name, lastModified, template: template || '3d' };
      if (idx >= 0) list[idx] = entry; else list.unshift(entry);
      localStorage.setItem('wge-projects', JSON.stringify(list.slice(0, 50)));
    } catch (e) {}
  }

  _removeFromProjectIndex(name) {
    try {
      const list = JSON.parse(localStorage.getItem('wge-projects') || '[]');
      localStorage.setItem('wge-projects', JSON.stringify(list.filter(p => p.name !== name)));
    } catch (e) {}
  }

  // ── Preferences (localStorage is fine — small) ───────────────────────
  savePrefs(prefs) {
    try { localStorage.setItem('wge-prefs', JSON.stringify(prefs)); } catch (e) {}
  }
  loadPrefs() {
    try { return JSON.parse(localStorage.getItem('wge-prefs') || '{}'); } catch (e) { return {}; }
  }
}

// Singleton
const Storage = new EngineStorage();


/* ===== js/systems/github.js ===== */
/**
 * WebGL Engine - GitHub API Integration
 * Fixed: Bearer auth, proper CORS mode, error diagnostics, chunked save
 */

class GitHubSystem {
  constructor() {
    this.token = '';
    this.user = '';
    this.repo = '';
    this.folder = '';
    this.connected = false;
  }

  configure(token, user, repo, folder) {
    this.token  = (token  || '').trim();
    this.user   = (user   || '').trim();
    this.repo   = (repo   || '').trim();
    this.folder = (folder || '').trim();
    this.connected = !!(this.token && this.user && this.repo);
    this._updateStatus();
    return this.connected;
  }

  _updateStatus() {
    const el = document.getElementById('github-status');
    if (el) {
      el.textContent = this.connected ? 'GitHub' : 'GitHub';
      el.style.color = this.connected ? '#2ecc71' : '#888';
      el.title = this.connected ? (this.user + '/' + this.repo) : 'Nao conectado';
    }
  }

  async _apiRequest(method, path, body) {
    if (!this.token) throw new Error('Token GitHub nao configurado');
    const url = 'https://api.github.com/repos/' + this.user + '/' + this.repo + '/' + path;
    const opts = {
      method: method,
      mode: 'cors',
      headers: {
        'Authorization': 'Bearer ' + this.token,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    };
    if (body) opts.body = JSON.stringify(body);

    let resp;
    try {
      resp = await fetch(url, opts);
    } catch (netErr) {
      // "Failed to fetch" means network/CORS blocked
      throw new Error(
        'Falha de rede ao acessar GitHub. Causas comuns: ' +
        '(1) abrir o arquivo via servidor web em vez de file://, ' +
        '(2) sem conexao com a internet, ' +
        '(3) repositorio inexistente. Detalhe: ' + netErr.message
      );
    }

    if (!resp.ok) {
      let msg = 'GitHub HTTP ' + resp.status;
      try { const b = await resp.json(); msg = b.message || msg; } catch(e) {}
      if (resp.status === 401) msg = 'Token invalido ou expirado. Verifique em GitHub > Settings > Developer settings > Personal access tokens';
      if (resp.status === 403) msg = 'Sem permissao. O token precisa do escopo "repo" (Contents: read/write)';
      if (resp.status === 404) msg = 'Repositorio nao encontrado: ' + this.user + '/' + this.repo;
      if (resp.status === 422) msg = 'Dados invalidos enviados ao GitHub (arquivo muito grande?)';
      throw new Error(msg);
    }
    return resp.json();
  }

  // Test connection
  async testConnection() {
    try {
      const resp = await fetch('https://api.github.com/user', {
        mode: 'cors',
        headers: {
          'Authorization': 'Bearer ' + this.token,
          'Accept': 'application/vnd.github+json'
        }
      });
      if (!resp.ok) {
        const b = await resp.json().catch(() => ({}));
        return { ok: false, error: b.message || ('HTTP ' + resp.status) };
      }
      const u = await resp.json();
      return { ok: true, login: u.login };
    } catch(e) {
      return { ok: false, error: e.message };
    }
  }

  async getFile(path) {
    try {
      const fullPath = this.folder ? (this.folder + '/' + path) : path;
      const data = await this._apiRequest('GET', 'contents/' + fullPath);
      return { content: atob(data.content.replace(/\n/g, '')), sha: data.sha };
    } catch(e) {
      if (e.message && (e.message.includes('404') || e.message.includes('Not Found') || e.message.includes('nao encontrado'))) return null;
      throw e;
    }
  }

  async putFile(path, content, message) {
    message = message || 'Update from WebGL Engine';
    const fullPath = this.folder ? (this.folder + '/' + path) : path;
    const existing = await this.getFile(path).catch(() => null);

    // UTF-8 safe base64
    let b64;
    try {
      b64 = btoa(unescape(encodeURIComponent(String(content))));
    } catch(e) {
      const bytes = new TextEncoder().encode(content);
      let bin = '';
      for (const byte of bytes) bin += String.fromCharCode(byte);
      b64 = btoa(bin);
    }

    const body = { message: message, content: b64 };
    if (existing && existing.sha) body.sha = existing.sha;
    return this._apiRequest('PUT', 'contents/' + fullPath, body);
  }

  async saveProject(projectData) {
    if (!this.connected) throw new Error('GitHub nao conectado');

    // Save scene file separately (avoid huge project.json)
    if (projectData.scene) {
      const sceneName = (projectData.scene.name || 'Scene').replace(/[^a-zA-Z0-9_-]/g, '_');
      await this.putFile('scenes/' + sceneName + '.json', JSON.stringify(projectData.scene, null, 2), 'Save scene: ' + sceneName);
    }

    // Save scripts individually
    for (const asset of (projectData.assets || [])) {
      if ((asset.type === 'script' || asset.type === 'shader') && asset.content && asset.name) {
        const ext = asset.type === 'shader' ? '.glsl' : '.js';
        try {
          await this.putFile('assets/' + asset.type + 's/' + asset.name + ext, String(asset.content), 'Save ' + asset.type + ': ' + asset.name);
        } catch(e) { /* non-fatal */ }
      }
    }

    // Save lightweight project index
    const meta = {
      name: projectData.name,
      template: projectData.template,
      version: projectData.version || '1.0',
      settings: projectData.settings || {},
      editorState: projectData.editorState || {},
      assets: (projectData.assets || []).map(function(a) { return { type: a.type, name: a.name }; }),
      sceneName: (projectData.scene && projectData.scene.name) || 'Scene',
      savedAt: new Date().toISOString(),
      engine: 'WebGL Engine v1.0'
    };
    await this.putFile('project.json', JSON.stringify(meta, null, 2), 'Save project: ' + (projectData.name || 'Unnamed'));
    return true;
  }

  async loadProject() {
    if (!this.connected) throw new Error('GitHub nao conectado');
    const file = await this.getFile('project.json');
    if (!file) return null;
    const proj = JSON.parse(file.content);

    // Load scene
    const sceneName = (proj.sceneName || 'Scene').replace(/[^a-zA-Z0-9_-]/g, '_');
    const sceneFile = await this.getFile('scenes/' + sceneName + '.json').catch(() => null);
    if (sceneFile) {
      try { proj.scene = JSON.parse(sceneFile.content); } catch(e) {}
    }

    // Load scripts
    if (proj.assets) {
      for (let i = 0; i < proj.assets.length; i++) {
        const asset = proj.assets[i];
        if ((asset.type === 'script' || asset.type === 'shader') && asset.name) {
          const ext = asset.type === 'shader' ? '.glsl' : '.js';
          try {
            const f = await this.getFile('assets/' + asset.type + 's/' + asset.name + ext);
            if (f) proj.assets[i].content = f.content;
          } catch(e) {}
        }
      }
    }
    return proj;
  }

  async listFiles(path) {
    path = path || '';
    const fullPath = this.folder ? (path ? this.folder + '/' + path : this.folder) : path;
    const endpoint = fullPath ? ('contents/' + fullPath) : 'contents';
    return this._apiRequest('GET', endpoint);
  }

  async createRepo(name, description) {
    description = description || 'WebGL Engine Project';
    const resp = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      mode: 'cors',
      headers: { 'Authorization': 'Bearer ' + this.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, description: description, auto_init: true })
    });
    if (!resp.ok) throw new Error('Erro ao criar repositorio');
    return resp.json();
  }
}

const GitHub = new GitHubSystem();


/* ===== js/systems/exporter.js ===== */
/**
 * WebGL Engine - Project Exporter
 * Generates a standalone HTML5 game ZIP
 */

class ProjectExporter {
  constructor(engine) {
    this.engine = engine;
  }
  
  async exportZip(options = {}) {
    const gameName = options.gameName || 'MeuJogo';
    const projectData = this.engine.getProjectData();
    const scripts = this.engine.scriptingEngine._scriptSources;
    
    // Generate all files
    const files = {};
    
    // Main HTML
    files['index.html'] = this._generateGameHTML(gameName, options);
    
    // Game runtime JS (embedded, standalone)
    files['game.js'] = this._generateGameRuntime(projectData, scripts);
    
    // Styles
    files['style.css'] = this._generateGameCSS(options);
    
    // README
    files['README.md'] = `# ${gameName}\n\nJogo criado com WebGL Engine\n\nAbra index.html em um servidor web para jogar.`;
    
    // Create ZIP
    return this._createZip(files);
  }
  
  _generateGameHTML(gameName, opts) {
    const mobileControls = opts.mobile !== false;
    const fullscreen = opts.fullscreen !== false;
    const [resW, resH] = (opts.resolution || '1280x720').split('x').map(Number);
    
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>${gameName}</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<div id="game-container">
  <canvas id="game-canvas" width="${resW}" height="${resH}"></canvas>
  ${mobileControls ? `
  <div id="mobile-controls">
    <div id="joystick-bg"><div id="joystick-knob"></div></div>
    <div id="action-btns">
      <button class="abtn" data-key="Space">↑</button>
      <button class="abtn" data-key="e">E</button>
    </div>
  </div>` : ''}
  <div id="loading-screen">
    <div class="loader-logo">${gameName}</div>
    <div class="loader-bar"><div class="loader-fill" id="loader-fill"></div></div>
    <div class="loader-text" id="loader-text">Carregando...</div>
  </div>
</div>
<script src="game.js"></script>
</body>
</html>`;
  }
  
  _generateGameCSS(opts) {
    return `
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#000; overflow:hidden; width:100vw; height:100vh; display:flex; align-items:center; justify-content:center; }
#game-container { position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center; }
#game-canvas { max-width:100%; max-height:100%; display:block; }
#loading-screen { position:absolute; inset:0; background:#111; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px; z-index:100; }
.loader-logo { font-size:48px; font-weight:700; color:#fff; font-family:system-ui; }
.loader-bar { width:300px; height:6px; background:#333; border-radius:3px; overflow:hidden; }
.loader-fill { height:100%; background:#4a9eff; border-radius:3px; transition:width 0.3s; }
.loader-text { color:#888; font-family:system-ui; font-size:14px; }
#mobile-controls { position:absolute; inset:0; pointer-events:none; }
#joystick-bg { position:absolute; left:60px; bottom:80px; width:100px; height:100px; background:rgba(255,255,255,0.15); border-radius:50%; border:2px solid rgba(255,255,255,0.3); pointer-events:all; touch-action:none; }
#joystick-knob { width:40px; height:40px; background:rgba(255,255,255,0.6); border-radius:50%; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); }
#action-btns { position:absolute; right:60px; bottom:80px; display:flex; gap:12px; pointer-events:all; }
.abtn { width:54px; height:54px; background:rgba(74,158,255,0.4); border:2px solid rgba(74,158,255,0.7); border-radius:50%; color:white; font-size:20px; cursor:pointer; touch-action:none; display:flex; align-items:center; justify-content:center; }
`;
  }
  
  _generateGameRuntime(projectData, scripts) {
    // Serialize scene to JSON string for embedding
    const sceneJson = JSON.stringify(projectData.scene || {});
    const assetsJson = JSON.stringify(projectData.assets || {});
    
    // Collect all script sources
    const scriptsSerialized = Object.entries(scripts).map(([name, src]) =>
      `// Script: ${name}\n${src}`
    ).join('\n\n');
    
    return `// WebGL Engine - Standalone Game Runtime
// Generated ${new Date().toISOString()}

'use strict';

// ===== EMBED SCENE DATA =====
const SCENE_DATA = ${sceneJson};
const ASSETS_DATA = ${assetsJson};

// ===== MATH LIBRARY =====
${this._getSourceFile('math')}

// ===== WEBGL =====
${this._getSourceFile('webgl')}

// ===== SCENE GRAPH =====
${this._getSourceFile('scene')}

// ===== MESH =====
${this._getSourceFile('mesh')}

// ===== MATERIAL =====
${this._getSourceFile('material')}

// ===== PHYSICS =====
${this._getSourceFile('physics')}

// ===== ANIMATION =====
${this._getSourceFile('animation')}

// ===== PARTICLES =====
${this._getSourceFile('particles')}

// ===== INPUT =====
${this._getSourceFile('input')}

// ===== RENDERER =====
${this._getSourceFile('renderer')}

// ===== SCRIPTING =====
${this._getSourceFile('scripting')}

// ===== USER SCRIPTS =====
${scriptsSerialized}

// ===== GAME BOOT =====
(function() {
  const canvas = document.getElementById('game-canvas');
  const renderer = new Renderer(canvas, true);
  const scene = Scene.deserialize(SCENE_DATA);
  const physics = new PhysicsWorld();
  const scriptEngine = new ScriptingEngine();
  
  // Load all user scripts
  const userScripts = ${JSON.stringify(scripts)};
  for (const [name, src] of Object.entries(userScripts)) {
    scriptEngine.loadScript(name, src);
  }
  
  // Resize canvas
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
  }
  window.addEventListener('resize', resize);
  resize();
  
  // Loading screen
  const loadingScreen = document.getElementById('loading-screen');
  const loaderFill = document.getElementById('loader-fill');
  let loaded = false;
  
  setTimeout(() => {
    if (loaderFill) loaderFill.style.width = '100%';
    setTimeout(() => {
      if (loadingScreen) loadingScreen.style.display = 'none';
      scene.play();
      loaded = true;
    }, 500);
  }, 300);
  
  // Mobile joystick
  const joystickBg = document.getElementById('joystick-bg');
  const joystickKnob = document.getElementById('joystick-knob');
  if (joystickBg) {
    let joystickActive = false, joystickId = -1, centerX = 0, centerY = 0;
    joystickBg.addEventListener('touchstart', e => {
      const t = e.targetTouches[0];
      const rect = joystickBg.getBoundingClientRect();
      centerX = rect.left + rect.width/2;
      centerY = rect.top + rect.height/2;
      joystickActive = true;
      joystickId = t.identifier;
      e.preventDefault();
    }, {passive:false});
    document.addEventListener('touchmove', e => {
      if (!joystickActive) return;
      for (const t of e.changedTouches) {
        if (t.identifier === joystickId) {
          const maxR = 40;
          let dx = t.clientX - centerX, dy = t.clientY - centerY;
          const dist = Math.sqrt(dx*dx+dy*dy);
          if (dist > maxR) { dx=dx/dist*maxR; dy=dy/dist*maxR; }
          if (joystickKnob) joystickKnob.style.transform = \`translate(calc(-50% + \${dx}px), calc(-50% + \${dy}px))\`;
          Input.setVirtualJoystick(dx/maxR, -dy/maxR);
          e.preventDefault();
        }
      }
    }, {passive:false});
    document.addEventListener('touchend', e => {
      for (const t of e.changedTouches) {
        if (t.identifier === joystickId) {
          joystickActive = false;
          if (joystickKnob) joystickKnob.style.transform = 'translate(-50%,-50%)';
          Input.clearVirtualJoystick();
        }
      }
    });
  }
  
  // Action buttons
  document.querySelectorAll('.abtn').forEach(btn => {
    const key = btn.dataset.key;
    btn.addEventListener('touchstart', e => { Input._keys[key] = true; e.preventDefault(); }, {passive:false});
    btn.addEventListener('touchend', e => { Input._keys[key] = false; e.preventDefault(); }, {passive:false});
  });
  
  // Game loop
  let lastTime = 0;
  function gameLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    
    if (loaded) {
      scene.update(dt);
      physics.step(scene, dt);
      Time._time += dt;
      Time._deltaTime = dt;
      Time._frame = (Time._frame || 0) + 1;
    }
    
    renderer.render(scene, dt);
    Input.lateUpdate();
    requestAnimationFrame(gameLoop);
  }
  requestAnimationFrame(gameLoop);
})();
`;
  }
  
  _getSourceFile(name) {
    // In a real implementation, these would be the actual source code
    // For the exported game, we reference the already-loaded code
    return `/* ${name} module - loaded from engine */`;
  }
  
  _createZip(files) {
    // Simple ZIP implementation using ArrayBuffer
    const zipWriter = new SimpleZip();
    for (const [name, content] of Object.entries(files)) {
      zipWriter.addFile(name, content);
    }
    return zipWriter.generate();
  }
}

class SimpleZip {
  constructor() {
    this._files = [];
    this._centralDir = [];
    this._offset = 0;
  }
  
  addFile(name, content) {
    const nameBytes = new TextEncoder().encode(name);
    const dataBytes = typeof content === 'string' ? new TextEncoder().encode(content) : content;
    
    const crc = this._crc32(dataBytes);
    const date = new Date();
    const dosDate = ((date.getFullYear()-1980)<<9)|((date.getMonth()+1)<<5)|date.getDate();
    const dosTime = (date.getHours()<<11)|(date.getMinutes()<<5)|(date.getSeconds()>>1);
    
    // Local file header
    const localHeader = new ArrayBuffer(30 + nameBytes.length);
    const view = new DataView(localHeader);
    view.setUint32(0, 0x04034b50, true); // signature
    view.setUint16(4, 20, true); // version needed
    view.setUint16(6, 0, true); // flags
    view.setUint16(8, 0, true); // compression (stored)
    view.setUint16(10, dosTime, true);
    view.setUint16(12, dosDate, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, dataBytes.length, true);
    view.setUint32(22, dataBytes.length, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true); // extra length
    new Uint8Array(localHeader, 30).set(nameBytes);
    
    this._files.push({ nameBytes, localHeader, data: dataBytes, crc, offset: this._offset });
    
    // Central dir entry
    const centralEntry = new ArrayBuffer(46 + nameBytes.length);
    const cv = new DataView(centralEntry);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0, true);  // flags
    cv.setUint16(10, 0, true); // compression
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, dataBytes.length, true);
    cv.setUint32(24, dataBytes.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true); cv.setUint16(32, 0, true); cv.setUint16(34, 0, true);
    cv.setUint32(36, 0, true); cv.setUint32(40, 0, true);
    cv.setUint32(42, this._offset, true); // local header offset
    new Uint8Array(centralEntry, 46).set(nameBytes);
    
    this._centralDir.push(centralEntry);
    this._offset += localHeader.byteLength + dataBytes.length;
  }
  
  generate() {
    const centralDirSize = this._centralDir.reduce((s,e) => s+e.byteLength, 0);
    const eocd = new ArrayBuffer(22);
    const ev = new DataView(eocd);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true); ev.setUint16(6, 0, true);
    ev.setUint16(8, this._files.length, true);
    ev.setUint16(10, this._files.length, true);
    ev.setUint32(12, centralDirSize, true);
    ev.setUint32(16, this._offset, true);
    ev.setUint16(20, 0, true);
    
    const parts = [];
    for (const f of this._files) { parts.push(f.localHeader, f.data); }
    for (const cd of this._centralDir) parts.push(cd);
    parts.push(eocd);
    
    const totalSize = parts.reduce((s,p) => s + (p instanceof ArrayBuffer ? p.byteLength : p.length), 0);
    const result = new Uint8Array(totalSize);
    let pos = 0;
    for (const p of parts) {
      const arr = p instanceof ArrayBuffer ? new Uint8Array(p) : p;
      result.set(arr, pos);
      pos += arr.length;
    }
    return result.buffer;
  }
  
  _crc32(data) {
    let crc = 0xFFFFFFFF;
    if (!SimpleZip._table) {
      SimpleZip._table = new Uint32Array(256);
      for (let i=0;i<256;i++) {
        let c=i;
        for(let j=0;j<8;j++) c=c&1?(0xEDB88320^(c>>>1)):(c>>>1);
        SimpleZip._table[i]=c;
      }
    }
    for (const b of data) crc = SimpleZip._table[(crc^b)&0xFF]^(crc>>>8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
}


/* ===== js/editor/hierarchy.js ===== */
/**
 * WebGL Engine - Hierarchy Panel
 */

class HierarchyPanel {
  constructor(engine) {
    this.engine = engine;
    this.el = document.getElementById('hierarchy-tree');
    this._dragging = null;
    this._dragTarget = null;
    this._renaming = null;
    this._setupContextMenu();
    this._setupSearch();
  }
  
  _setupSearch() {
    const search = document.getElementById('hierarchy-search');
    search?.addEventListener('input', () => this.render(this.engine.scene));
  }
  
  _setupContextMenu() {
    const menu = document.getElementById('hierarchy-context-menu');
    document.addEventListener('click', () => menu?.classList.add('hidden'));
    
    menu?.querySelectorAll('.ctx-item').forEach(item => {
      item.addEventListener('click', e => {
        const action = item.dataset.action;
        if (action) this.engine.executeAction(action, this.engine.selectedObject);
        menu.classList.add('hidden');
      });
    });
  }
  
  render(scene) {
    if (!scene) { this.el.innerHTML = '<div class="hierarchy-empty">Cena vazia</div>'; return; }
    const search = document.getElementById('hierarchy-search')?.value.toLowerCase() || '';
    this.el.innerHTML = '';
    
    for (const obj of scene.objects) {
      this._renderObject(obj, 0, search);
    }
    
    if (this.el.children.length === 0) {
      this.el.innerHTML = '<div class="hierarchy-empty">Nenhum objeto</div>';
    }
    
    this._setupDragDrop();
  }
  
  _renderObject(obj, depth, search) {
    // Filter by search
    if (search && !obj.name.toLowerCase().includes(search)) {
      for (const child of obj.children) this._renderObject(child, depth, search);
      return;
    }
    
    const item = document.createElement('div');
    item.className = 'hierarchy-item' + (obj === this.engine.selectedObject ? ' selected' : '') + (!obj.active ? ' inactive' : '');
    item.dataset.id = obj.id;
    item.draggable = true;
    
    // Indent
    const indent = document.createElement('div');
    indent.className = 'hierarchy-indent';
    indent.style.width = (depth * 16) + 'px';
    item.appendChild(indent);
    
    // Expand button
    if (obj.children.length > 0) {
      const expand = document.createElement('button');
      expand.className = 'hierarchy-expand';
      const isExpanded = !this.engine._collapsed?.has(obj.id);
      expand.textContent = isExpanded ? '▼' : '▶';
      expand.addEventListener('click', e => {
        e.stopPropagation();
        if (!this.engine._collapsed) this.engine._collapsed = new Set();
        if (this.engine._collapsed.has(obj.id)) this.engine._collapsed.delete(obj.id);
        else this.engine._collapsed.add(obj.id);
        this.render(this.engine.scene);
      });
      item.appendChild(expand);
    } else {
      const ph = document.createElement('div');
      ph.className = 'hierarchy-expand-placeholder';
      item.appendChild(ph);
    }
    
    // Icon
    const icon = document.createElement('span');
    icon.className = 'hierarchy-icon';
    icon.textContent = this._getIcon(obj);
    item.appendChild(icon);
    
    // Name
    if (this._renaming === obj.id) {
      const input = document.createElement('input');
      input.className = 'hierarchy-name-input';
      input.value = obj.name;
      input.addEventListener('blur', () => {
        obj.name = input.value || obj.name;
        this._renaming = null;
        this.render(this.engine.scene);
        this.engine.inspector?.render(obj);
      });
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') input.blur();
        if (e.key === 'Escape') { this._renaming = null; this.render(this.engine.scene); }
      });
      item.appendChild(input);
      setTimeout(() => input.focus(), 0);
    } else {
      const name = document.createElement('span');
      name.className = 'hierarchy-name';
      name.textContent = obj.name;
      item.appendChild(name);
    }
    
    // Events
    item.addEventListener('click', e => {
      e.stopPropagation();
      this.engine.selectObject(obj);
    });
    
    item.addEventListener('dblclick', e => {
      e.stopPropagation();
      this._renaming = obj.id;
      this.render(this.engine.scene);
    });
    
    item.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();
      this.engine.selectObject(obj);
      const menu = document.getElementById('hierarchy-context-menu');
      if (menu) {
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        menu.classList.remove('hidden');
      }
    });
    
    this.el.appendChild(item);
    
    // Children
    const isExpanded = !this.engine._collapsed?.has(obj.id);
    if (isExpanded) {
      for (const child of obj.children) {
        this._renderObject(child, depth + 1, search);
      }
    }
  }
  
  _getIcon(obj) {
    const light = obj.getComponent('Light');
    const cam = obj.getComponent('Camera');
    const ps = obj.getComponent('ParticleSystem');
    const mr = obj.getComponent('MeshRenderer');
    const mesh = mr?.mesh?.name || mr?.meshName || '';
    
    if (light) return light.lightType === 'directional' ? '☀' : light.lightType === 'spot' ? '🔦' : '💡';
    if (cam) return '🎥';
    if (ps) return '✨';
    if (mesh === 'Sphere') return '⚽';
    if (mesh === 'Plane') return '▬';
    if (mesh === 'Cylinder') return '⬤';
    if (obj.children.length > 0) return '📁';
    if (mr) return '📦';
    return '◽';
  }
  
  _setupDragDrop() {
    this.el.querySelectorAll('.hierarchy-item').forEach(item => {
      const id = parseInt(item.dataset.id);
      
      item.addEventListener('dragstart', e => {
        this._dragging = id;
        e.dataTransfer.effectAllowed = 'move';
      });
      
      item.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        this.el.querySelectorAll('.hierarchy-item').forEach(el => el.classList.remove('drop-target'));
        item.classList.add('drop-target');
        this._dragTarget = id;
      });
      
      item.addEventListener('drop', e => {
        e.preventDefault();
        item.classList.remove('drop-target');
        if (this._dragging && this._dragTarget && this._dragging !== this._dragTarget) {
          const scene = this.engine.scene;
          const src = scene.findById(this._dragging);
          const tgt = scene.findById(this._dragTarget);
          if (src && tgt && !this._isAncestor(src, tgt)) {
            if (src.parent) src.parent.removeChild(src);
            else { const idx = scene.objects.indexOf(src); if(idx>=0)scene.objects.splice(idx,1); }
            tgt.addChild(src);
            this.render(scene);
          }
        }
        this._dragging = null;
        this._dragTarget = null;
      });
      
      item.addEventListener('dragend', () => {
        this.el.querySelectorAll('.hierarchy-item').forEach(el => el.classList.remove('drop-target'));
        this._dragging = null;
        this._dragTarget = null;
      });
    });
  }
  
  _isAncestor(potentialAncestor, obj) {
    let p = obj.parent;
    while (p) { if (p === potentialAncestor) return true; p = p.parent; }
    return false;
  }
  
  selectItem(obj) {
    this.el.querySelectorAll('.hierarchy-item').forEach(el => {
      el.classList.toggle('selected', parseInt(el.dataset.id) === obj?.id);
    });
  }
}


/* ===== js/editor/inspector.js ===== */
/**
 * WebGL Engine - Inspector Panel
 * Renders component inspectors for all component types
 */

class InspectorPanel {
  constructor(engine) {
    this.engine = engine;
    this.el = document.getElementById('inspector-content');
    this.currentObject = null;
  }
  
  render(obj) {
    this.currentObject = obj;
    this.el.innerHTML = '';
    
    // Stop any existing preview
    if (this._previewAnim) { cancelAnimationFrame(this._previewAnim); this._previewAnim = null; }
    
    const addBtn = document.getElementById('btn-add-component');
    
    if (!obj) {
      this.el.innerHTML = '<div class="inspector-empty">Selecione um objeto</div>';
      addBtn?.classList.add('hidden');
      return;
    }
    
    addBtn?.classList.remove('hidden');
    
    // 3D Preview for objects with MeshRenderer
    const mr = obj.getComponent('MeshRenderer') || obj.getComponent('SkinnedMeshRenderer');
    if (mr) {
      const preview = this._make3DPreview(obj, mr);
      if (preview) this.el.appendChild(preview);
    }
    
    // Object header
    this.el.appendChild(this._makeObjectHeader(obj));
    
    // Transform
    this.el.appendChild(this._makeTransformBlock(obj));
    
    // Components
    for (const comp of obj.components) {
      const block = this._makeComponentBlock(comp, obj);
      if (block) this.el.appendChild(block);
    }
  }

  _make3DPreview(obj, mr) {
    // Create a small WebGL canvas for the inspector preview
    const wrap = document.createElement('div');
    wrap.className = 'inspector-preview-wrap';
    wrap.style.cssText = 'width:100%;height:120px;background:#1a1a1a;border-bottom:1px solid #333;position:relative;overflow:hidden;cursor:grab;';

    const canvas = document.createElement('canvas');
    canvas.width = 240; canvas.height = 120;
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    wrap.appendChild(canvas);

    const label = document.createElement('div');
    label.style.cssText = 'position:absolute;bottom:4px;left:6px;color:#888;font-size:9px;pointer-events:none;';
    label.textContent = (mr.meshName || mr.mesh?.name || 'Mesh') + ' Preview';
    wrap.appendChild(label);

    // Gear icon to indicate preview area
    // Zoom buttons
    const zoomWrap = document.createElement('div');
    zoomWrap.style.cssText = 'position:absolute;top:4px;right:4px;display:flex;flex-direction:column;gap:2px;';

    const mkZBtn = (lbl, delta) => {
      const b = document.createElement('button');
      b.textContent = lbl;
      b.title = delta < 0 ? 'Aproximar (zoom +)' : 'Afastar (zoom -)';
      b.style.cssText = 'background:rgba(0,0,0,0.65);border:1px solid #555;color:#eee;width:28px;height:28px;border-radius:4px;cursor:pointer;font-size:16px;font-weight:bold;line-height:1;display:flex;align-items:center;justify-content:center;touch-action:manipulation;-webkit-tap-highlight-color:transparent;';
      b.addEventListener('mouseenter', () => b.style.background = 'rgba(74,158,255,0.45)');
      b.addEventListener('mouseleave', () => b.style.background = 'rgba(0,0,0,0.65)');
      const doZoom = (e) => {
        e.stopPropagation();
        e.preventDefault();
        cam.dist = Math.max(0.2, Math.min(15, cam.dist + delta));
        autoRotate = false;
      };
      b.addEventListener('click', doZoom);
      b.addEventListener('touchstart', doZoom, { passive: false });
      return b;
    };
    zoomWrap.appendChild(mkZBtn('+', -0.4));
    zoomWrap.appendChild(mkZBtn('−', +0.4));
    zoomWrap.style.zIndex = '10';
    zoomWrap.style.pointerEvents = 'auto';
    wrap.appendChild(zoomWrap);

    // Double-click to reset view
    wrap.addEventListener('dblclick', () => {
      cam.yaw = 30; cam.pitch = -15; cam.dist = 2.2;
      autoRotate = true;
    });

    const hint = document.createElement('div');
    hint.style.cssText = 'position:absolute;bottom:4px;right:4px;color:#555;font-size:9px;pointer-events:none;';
    hint.textContent = 'Arrastar: orbitar | Scroll: zoom | Dbl: reset';
    wrap.appendChild(hint);

    // Init WebGL for preview
    let glCtx = null, previewProg = null, mesh = null;
    try {
      glCtx = new WebGLContext(canvas);
      previewProg = glCtx.createProgram(SHADERS.standardVert, SHADERS.standardFrag, 'preview');
    } catch(e) { return null; }

    // Get mesh from renderer cache (correct shape per type)
    const meshName = mr.meshName || mr.mesh?.name || 'Cube';
    if (this.engine.renderer) {
      mesh = this.engine.renderer.getMesh(meshName);
    }
    if (!mesh) {
      try {
        switch(meshName.toLowerCase()) {
          case 'sphere':   mesh = Primitives.sphere(24,24); break;
          case 'plane':    mesh = Primitives.plane(1,1); break;
          case 'cylinder': mesh = Primitives.cylinder(16); break;
          case 'capsule':  mesh = Primitives.capsule ? Primitives.capsule(16) : Primitives.cylinder(16); break;
          case 'quad':     mesh = Primitives.quad ? Primitives.quad() : Primitives.plane(1,1); break;
          case 'torus':    mesh = Primitives.torus ? Primitives.torus(24,12) : Primitives.sphere(24,24); break;
          default:         mesh = Primitives.cube(); break;
        }
      } catch(e) { mesh = Primitives.cube(); }
    }
    if (!mesh._glBuffers) {
      try { mesh.upload(glCtx); } catch(e) {}
    }

    // Preview camera state (orbit)
    const cam = { yaw: 30, pitch: -15, dist: 2.2 };
    let dragging = false, lastX = 0, lastY = 0;
    let autoRotate = true;

    wrap.addEventListener('mousedown', e => {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      autoRotate = false;
      wrap.style.cursor = 'grabbing';
      e.preventDefault();
    });
    window.addEventListener('mousemove', e => {
      if (!dragging) return;
      cam.yaw   += (e.clientX - lastX) * 0.5;
      cam.pitch -= (e.clientY - lastY) * 0.5;
      cam.pitch = Math.max(-89, Math.min(89, cam.pitch));
      lastX = e.clientX; lastY = e.clientY;
    });
    window.addEventListener('mouseup', () => { dragging = false; wrap.style.cursor = 'grab'; });
    wrap.addEventListener('wheel', e => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      cam.dist = Math.max(0.2, Math.min(15, cam.dist * factor));
      autoRotate = false;
    }, { passive: false });

    const gl = glCtx.gl;
    // Touch zoom for preview
    let previewPinch = 0;
    let touchLast = null;
    wrap.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        touchLast = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        autoRotate = false;
      } else if (e.touches.length === 2) {
        previewPinch = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
        touchLast = null;
      }
      e.preventDefault();
    }, { passive: false });
    wrap.addEventListener('touchmove', e => {
      if (e.touches.length === 1 && touchLast) {
        const t = e.touches[0];
        cam.yaw   += (t.clientX - touchLast.x) * 0.5;
        cam.pitch -= (t.clientY - touchLast.y) * 0.5;
        cam.pitch = Math.max(-89, Math.min(89, cam.pitch));
        touchLast = { x: t.clientX, y: t.clientY };
      } else if (e.touches.length === 2) {
        const d = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
        if (previewPinch > 0) {
          cam.dist = Math.max(0.2, Math.min(15, cam.dist * (previewPinch / d)));
          autoRotate = false;
        }
        previewPinch = d;
      }
      e.preventDefault();
    }, { passive: false });
    wrap.addEventListener('touchend', () => { touchLast = null; });

    const renderPreview = () => {
      if (!this._previewAnim) return;
      if (autoRotate) cam.yaw += 0.4;
      try { glCtx.resize(); } catch(e) {}
      const W = canvas.width, H = canvas.height;
      if (!W || !H) { this._previewAnim = requestAnimationFrame(renderPreview); return; }

      gl.viewport(0, 0, W, H);
      gl.clearColor(0.1, 0.1, 0.12, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);

      const DEG = Math.PI / 180;
      const pitch = cam.pitch * DEG, yaw = cam.yaw * DEG;
      const cx = cam.dist * Math.cos(pitch) * Math.sin(yaw);
      const cy = cam.dist * Math.sin(pitch);
      const cz = cam.dist * Math.cos(pitch) * Math.cos(yaw);
      const camPos = new Vec3(cx, cy, cz);
      const view = Mat4.lookAt(camPos, new Vec3(0,0,0), Vec3.up());
      const proj = Mat4.perspective(40, W/H, 0.01, 100);
      const model = new Mat4();
      const normalMat = model.inverse().transpose();

      previewProg.use();
      previewProg.setMat4('uModel', model);
      previewProg.setMat4('uView', view);
      previewProg.setMat4('uProjection', proj);
      previewProg.setMat4('uNormalMatrix', normalMat);
      previewProg.setVec3('uCameraPos', camPos);

      const mat = mr.material || new Material('preview');
      previewProg.setVec4('uColor', [mat.color?.r ?? 0.8, mat.color?.g ?? 0.8, mat.color?.b ?? 0.8, 1]);
      previewProg.setFloat('uMetallic', mat.metallic ?? 0);
      previewProg.setFloat('uRoughness', mat.roughness ?? 0.5);
      previewProg.setBool('uUseTex', false);
      previewProg.setBool('uUseNormalMap', false);
      previewProg.setVec4('uUVTransform', [1,1,0,0]);
      previewProg.setVec3('uAmbientColor', [0.15, 0.15, 0.2]);
      previewProg.setFloat('uAmbientIntensity', 0.4);
      previewProg.setInt('uNumDirLights', 2);
      previewProg.setVec3('uDirLightDir[0]', [-0.5, -1.0, -0.5]);
      previewProg.setVec3('uDirLightColor[0]', [1, 0.95, 0.85]);
      previewProg.setFloat('uDirLightIntensity[0]', 1.1);
      previewProg.setVec3('uDirLightDir[1]', [1, 0.2, 0.3]);
      previewProg.setVec3('uDirLightColor[1]', [0.3, 0.4, 0.6]);
      previewProg.setFloat('uDirLightIntensity[1]', 0.4);
      previewProg.setInt('uNumPointLights', 0);
      previewProg.setBool('uFogEnabled', false);

      try {
        if (mesh._dirty || !mesh._glBuffers) mesh.upload(glCtx);
        mesh.draw(gl, previewProg);
      } catch(e) {}

      this._previewAnim = requestAnimationFrame(renderPreview);
    };

    // Start preview loop
    this._previewAnim = requestAnimationFrame(renderPreview);
    return wrap;
  }
  
  _makeObjectHeader(obj) {
    const div = document.createElement('div');
    div.className = 'obj-header';
    
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.className = 'obj-active-check';
    check.checked = obj.active;
    check.addEventListener('change', () => { obj.setActive(check.checked); this.engine.hierarchy.render(this.engine.scene); });
    
    const nameInput = document.createElement('input');
    nameInput.className = 'obj-name-input';
    nameInput.value = obj.name;
    nameInput.addEventListener('change', () => {
      obj.name = nameInput.value;
      this.engine.hierarchy.render(this.engine.scene);
      this.engine._scheduleSave();
    });
    
    const meta = document.createElement('div');
    meta.className = 'obj-meta';
    
    const tagSel = document.createElement('select');
    tagSel.className = 'obj-tag-select';
    ['Untagged','Player','Enemy','Ground','UI','Camera'].forEach(t => {
      const opt = document.createElement('option');
      opt.value = t; opt.textContent = t;
      opt.selected = obj.tags.includes(t);
      tagSel.appendChild(opt);
    });
    tagSel.addEventListener('change', () => { obj.tags = [tagSel.value]; });
    
    const layerSel = document.createElement('select');
    layerSel.className = 'obj-layer-select';
    ['Default','UI','Ignore Raycast','Water','PostProcessing'].forEach((l,i) => {
      const opt = document.createElement('option');
      opt.value = i; opt.textContent = l;
      opt.selected = obj.layer === i;
      layerSel.appendChild(opt);
    });
    layerSel.addEventListener('change', () => { obj.layer = parseInt(layerSel.value); });
    
    meta.appendChild(tagSel);
    meta.appendChild(layerSel);
    div.appendChild(check);
    div.appendChild(nameInput);
    div.appendChild(meta);
    return div;
  }
  
  _makeTransformBlock(obj) {
    const t = obj.transform;
    const block = this._makeCollapsibleBlock('Transform', '⊞');
    const body = block.querySelector('.component-body');

    const onPosChange = (axis, val) => {
      t.position[axis] = val;
      t.markDirty();
      this.engine._scheduleSave();
    };
    const onRotChange = (axis, val) => {
      t.rotation[axis] = val;
      t.markDirty();
      this.engine._scheduleSave();
    };
    const onScaleChange = (axis, val) => {
      t.scale[axis] = Math.max(0.0001, val);
      t.markDirty();
      this.engine._scheduleSave();
    };

    body.appendChild(this._makeVec3Row('Posição',  t.position, onPosChange));
    body.appendChild(this._makeVec3Row('Rotação',  t.rotation, onRotChange));
    body.appendChild(this._makeVec3Row('Escala',   t.scale,    onScaleChange));

    // Reset buttons row
    const resetRow = document.createElement('div');
    resetRow.style.cssText = 'display:flex;gap:4px;padding:4px 8px;';
    const mkReset = (label, fn) => {
      const b = document.createElement('button');
      b.textContent = label; b.title = 'Resetar ' + label;
      b.style.cssText = 'flex:1;font-size:10px;padding:2px;background:#333;border:1px solid #555;color:#aaa;border-radius:3px;cursor:pointer;';
      b.addEventListener('mouseover', () => b.style.background='#444');
      b.addEventListener('mouseout', () => b.style.background='#333');
      b.addEventListener('click', () => { fn(); this.render(obj); this.engine._scheduleSave(); });
      return b;
    };
    resetRow.appendChild(mkReset('Pos', () => t.setPosition(0,0,0)));
    resetRow.appendChild(mkReset('Rot', () => t.setRotation(0,0,0)));
    resetRow.appendChild(mkReset('Esc', () => t.setScale(1,1,1)));
    body.appendChild(resetRow);

    return block;
  }
  
  _makeComponentBlock(comp, obj) {
    switch(comp.type) {
      case 'MeshRenderer': return this._makeMeshRendererBlock(comp, obj);
      case 'Light': return this._makeLightBlock(comp);
      case 'Camera': return this._makeCameraBlock(comp);
      case 'Rigidbody': return this._makeRigidbodyBlock(comp);
      case 'BoxCollider': return this._makeBoxColliderBlock(comp);
      case 'SphereCollider': return this._makeSphereColliderBlock(comp);
      case 'CapsuleCollider': return this._makeCapsuleColliderBlock(comp);
      case 'ParticleSystem': return this._makeParticleBlock(comp);
      case 'Animator': return this._makeAnimatorBlock(comp);
      case 'AudioSource': return this._makeAudioSourceBlock(comp);
      default: return this._makeGenericScriptBlock(comp, obj);
    }
  }
  
  _makeCollapsibleBlock(title, icon = '▦') {
    const block = document.createElement('div');
    block.className = 'component-block';
    
    const header = document.createElement('div');
    header.className = 'component-header';
    
    const toggle = document.createElement('span');
    toggle.className = 'component-toggle';
    toggle.textContent = '▼';
    
    const t = document.createElement('span');
    t.className = 'component-title';
    t.textContent = title;
    
    const menuBtn = document.createElement('button');
    menuBtn.className = 'component-menu-btn';
    menuBtn.textContent = '⋮';
    
    header.appendChild(toggle);
    header.appendChild(t);
    header.appendChild(menuBtn);
    
    const body = document.createElement('div');
    body.className = 'component-body';
    
    header.addEventListener('click', e => {
      if (e.target === menuBtn) return;
      body.classList.toggle('collapsed');
      toggle.textContent = body.classList.contains('collapsed') ? '▶' : '▼';
    });
    
    block.appendChild(header);
    block.appendChild(body);
    return block;
  }
  
  _makeVec3Row(label, vec, onChange) {
    const row = document.createElement('div');
    row.className = 'prop-row';
    
    const l = document.createElement('span');
    l.className = 'prop-label'; l.textContent = label;
    
    const vals = document.createElement('div');
    vals.className = 'prop-value';
    const inputs = document.createElement('div');
    inputs.className = 'vec-inputs';
    
    ['x','y','z'].forEach((axis, i) => {
      const g = document.createElement('div');
      g.className = 'vec-group';
      const lbl = document.createElement('span');
      lbl.className = `vec-label vec-${axis}-label`;
      lbl.textContent = axis.toUpperCase();
      const inp = document.createElement('input');
      inp.type = 'number';
      inp.step = '0.01';
      inp.value = (vec[axis] || 0).toFixed(3);
      inp.addEventListener('input', () => {
        const v = parseFloat(inp.value);
        if (!isNaN(v)) onChange(axis, v);
      });
      inp.addEventListener('change', () => {
        const v = parseFloat(inp.value);
        if (!isNaN(v)) onChange(axis, v);
      });
      // Click and drag to change value
      let dragging = false, startY = 0, startVal = 0;
      lbl.style.cursor = 'ns-resize';
      lbl.addEventListener('mousedown', e => {
        dragging = true; startY = e.clientY; startVal = parseFloat(inp.value) || 0;
        const onMove = (e) => {
          if (!dragging) return;
          const delta = (startY - e.clientY) * 0.05;
          const newVal = startVal + delta;
          inp.value = newVal.toFixed(3);
          onChange(axis, newVal);
          startY = e.clientY; startVal = newVal;
        };
        const onUp = () => { dragging = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
      g.appendChild(lbl); g.appendChild(inp);
      inputs.appendChild(g);
    });
    
    vals.appendChild(inputs);
    row.appendChild(l); row.appendChild(vals);
    
    // Update values periodically
    const updateVals = () => {
      if (!document.body.contains(row)) return;
      inputs.querySelectorAll('input').forEach((inp, i) => {
        const axis = ['x','y','z'][i];
        if (document.activeElement !== inp) inp.value = (vec[axis] || 0).toFixed(3);
      });
      requestAnimationFrame(updateVals);
    };
    requestAnimationFrame(updateVals);
    
    return row;
  }
  
  _makePropRow(label, valueEl) {
    const row = document.createElement('div');
    row.className = 'prop-row';
    const l = document.createElement('span');
    l.className = 'prop-label'; l.textContent = label;
    const v = document.createElement('div');
    v.className = 'prop-value';
    v.appendChild(valueEl);
    row.appendChild(l); row.appendChild(v);
    return row;
  }
  
  _makeNumberInput(val, onChange, step=0.01, min=null, max=null) {
    const inp = document.createElement('input');
    inp.type = 'number'; inp.className = 'prop-input';
    inp.value = val; inp.step = step;
    if (min !== null) inp.min = min;
    if (max !== null) inp.max = max;
    inp.addEventListener('change', () => onChange(parseFloat(inp.value)));
    return inp;
  }
  
  _makeCheckbox(val, onChange) {
    const wrap = document.createElement('div');
    wrap.className = 'prop-checkbox';
    const inp = document.createElement('input');
    inp.type = 'checkbox'; inp.checked = val;
    inp.addEventListener('change', () => onChange(inp.checked));
    wrap.appendChild(inp);
    return wrap;
  }
  
  _makeSelect(options, val, onChange) {
    const sel = document.createElement('select');
    sel.className = 'prop-select';
    options.forEach(o => {
      const opt = document.createElement('option');
      opt.value = typeof o === 'object' ? o.value : o;
      opt.textContent = typeof o === 'object' ? o.label : o;
      opt.selected = opt.value === String(val);
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => onChange(sel.value));
    return sel;
  }
  
  _makeColorInput(color, onChange) {
    const wrap = document.createElement('div');
    wrap.className = 'prop-color';
    const inp = document.createElement('input');
    inp.type = 'color';
    inp.value = color.toHex?.() || '#ffffff';
    inp.addEventListener('change', () => onChange(Color.fromHex(inp.value)));
    const aLabel = document.createElement('span');
    aLabel.style.color='var(--text-dim)'; aLabel.style.fontSize='10px'; aLabel.textContent='A';
    const aInp = document.createElement('input');
    aInp.type='number'; aInp.min='0'; aInp.max='1'; aInp.step='0.01';
    aInp.value = color.a ?? 1;
    aInp.style.width='50px'; aInp.className='prop-input';
    aInp.addEventListener('change', () => { const c=Color.fromHex(inp.value); c.a=parseFloat(aInp.value)||1; onChange(c); });
    wrap.appendChild(inp); wrap.appendChild(aLabel); wrap.appendChild(aInp);
    return wrap;
  }
  
  _makeSliderRow(label, val, min, max, step, onChange) {
    const row = document.createElement('div');
    row.className = 'prop-row';
    const l = document.createElement('span'); l.className='prop-label'; l.textContent=label;
    const wrap = document.createElement('div'); wrap.className='prop-value';
    const slider = document.createElement('div'); slider.className='prop-slider';
    const range = document.createElement('input'); range.type='range'; range.min=min; range.max=max; range.step=step; range.value=val;
    const num = document.createElement('input'); num.type='number'; num.min=min; num.max=max; num.step=step; num.value=val; num.className='prop-input'; num.style.width='60px';
    range.addEventListener('input', ()=>{num.value=range.value;onChange(parseFloat(range.value));});
    num.addEventListener('change',()=>{range.value=num.value;onChange(parseFloat(num.value));});
    slider.appendChild(range); slider.appendChild(num); wrap.appendChild(slider);
    row.appendChild(l); row.appendChild(wrap);
    return row;
  }
  
  // ===== COMPONENT INSPECTORS =====
  
  _makeMeshRendererBlock(comp, obj) {
    const block = this._makeCollapsibleBlock('Mesh Renderer', '📦');
    const body = block.querySelector('.component-body');
    
    // Mesh selector
    const meshSel = this._makeSelect(
      ['Cube','Sphere','Plane','Cylinder','Capsule','Quad','Torus'],
      comp.mesh?.name || comp.meshName || 'Cube',
      (v) => {
        comp.meshName = v;
        if (this.engine.renderer) comp.mesh = this.engine.renderer.getMesh(v);
        this.engine._scheduleSave();
        // Refresh preview
        if (this.currentObject) this.render(this.currentObject);
      }
    );
    body.appendChild(this._makePropRow('Mesh', meshSel));
    
    // Material
    if (comp.material) {
      const mat = comp.material;
      const colorInput = this._makeColorInput(mat.color, (c) => { mat.color = c; });
      body.appendChild(this._makePropRow('Albedo Color', colorInput));
      body.appendChild(this._makeSliderRow('Metallic',  mat.metallic,  0,1,0.01, v => { mat.metallic=v;  this.engine._scheduleSave(); }));
      body.appendChild(this._makeSliderRow('Roughness', mat.roughness, 0,1,0.01, v => { mat.roughness=v; this.engine._scheduleSave(); }));
      const shaderSel = this._makeSelect(['standard','unlit','transparent'], mat.shader, v => { mat.shader=v; this.engine._scheduleSave(); });
      body.appendChild(this._makePropRow('Shader', shaderSel));
      body.appendChild(this._makePropRow('Double Sided', this._makeCheckbox(mat.doubleSided, v=>mat.doubleSided=v)));
      body.appendChild(this._makePropRow('Wireframe', this._makeCheckbox(mat.wireframe, v=>mat.wireframe=v)));
    } else {
      const btn = document.createElement('button');
      btn.textContent = 'Criar Material'; btn.className='btn-open-script';
      btn.addEventListener('click', () => {
        comp.material = new Material('Material');
        this.render(obj);
      });
      body.appendChild(btn);
    }
    
    body.appendChild(this._makePropRow('Cast Shadows', this._makeCheckbox(comp.castShadows, v=>comp.castShadows=v)));
    body.appendChild(this._makePropRow('Receive Shadows', this._makeCheckbox(comp.receiveShadows, v=>comp.receiveShadows=v)));
    
    return block;
  }
  
  _makeLightBlock(comp) {
    const block = this._makeCollapsibleBlock('Light', '💡');
    const body = block.querySelector('.component-body');
    
    const typeSel = this._makeSelect(['directional','point','spot','area'], comp.lightType, v=>{ comp.lightType=v; this.render(this.currentObject); });
    body.appendChild(this._makePropRow('Type', typeSel));
    body.appendChild(this._makePropRow('Color', this._makeColorInput(comp.color, c=>comp.color=c)));
    body.appendChild(this._makeSliderRow('Intensity', comp.intensity, 0, 10, 0.01, v=>comp.intensity=v));
    
    if (comp.lightType === 'point' || comp.lightType === 'spot') {
      body.appendChild(this._makeSliderRow('Range', comp.range, 0, 100, 0.1, v=>comp.range=v));
    }
    if (comp.lightType === 'spot') {
      body.appendChild(this._makeSliderRow('Spot Angle', comp.spotAngle, 1, 179, 1, v=>comp.spotAngle=v));
    }
    body.appendChild(this._makePropRow('Cast Shadows', this._makeCheckbox(comp.castShadows, v=>comp.castShadows=v)));
    
    return block;
  }
  
  _makeCameraBlock(comp) {
    const block = this._makeCollapsibleBlock('Camera', '🎥');
    const body = block.querySelector('.component-body');
    
    body.appendChild(this._makePropRow('Orthographic', this._makeCheckbox(comp.orthographic, v=>{ comp.orthographic=v; this.render(this.currentObject); })));
    if (!comp.orthographic) {
      body.appendChild(this._makeSliderRow('FOV', comp.fov, 1, 180, 1, v=>comp.fov=v));
    } else {
      body.appendChild(this._makeSliderRow('Ortho Size', comp.orthoSize, 0.1, 100, 0.1, v=>comp.orthoSize=v));
    }
    body.appendChild(this._makePropRow('Near', this._makeNumberInput(comp.near, v=>comp.near=v, 0.001, 0.001)));
    body.appendChild(this._makePropRow('Far', this._makeNumberInput(comp.far, v=>comp.far=v, 1, 0.1)));
    body.appendChild(this._makePropRow('Clear Color', this._makeColorInput(comp.clearColor, c=>comp.clearColor=c)));
    body.appendChild(this._makePropRow('Depth', this._makeNumberInput(comp.depth, v=>comp.depth=v, 1)));
    
    const setMainBtn = document.createElement('button');
    setMainBtn.className = 'btn-open-script';
    setMainBtn.textContent = 'Definir como Câmera Principal';
    setMainBtn.addEventListener('click', () => { /* engine will use first camera component */ });
    body.appendChild(setMainBtn);
    
    return block;
  }
  
  _makeRigidbodyBlock(comp) {
    const block = this._makeCollapsibleBlock('Rigidbody', '⚙');
    const body = block.querySelector('.component-body');
    
    body.appendChild(this._makePropRow('Mass', this._makeNumberInput(comp.mass, v=>comp.mass=Math.max(0.001,v), 0.01, 0.001)));
    body.appendChild(this._makeSliderRow('Drag', comp.drag, 0, 1, 0.001, v=>comp.drag=v));
    body.appendChild(this._makeSliderRow('Angular Drag', comp.angularDrag, 0, 1, 0.001, v=>comp.angularDrag=v));
    body.appendChild(this._makePropRow('Use Gravity', this._makeCheckbox(comp.useGravity, v=>comp.useGravity=v)));
    body.appendChild(this._makePropRow('Is Kinematic', this._makeCheckbox(comp.isKinematic, v=>comp.isKinematic=v)));
    
    // Constraints
    const conLabel = document.createElement('div');
    conLabel.style.cssText='font-size:10px;color:var(--text-dim);text-transform:uppercase;margin:8px 0 4px;letter-spacing:1px;';
    conLabel.textContent='Freeze Position';
    body.appendChild(conLabel);
    
    const posWrap = document.createElement('div');
    posWrap.style.cssText='display:flex;gap:8px;';
    ['X','Y','Z'].forEach(axis => {
      const lbl = document.createElement('label');
      lbl.style.cssText='display:flex;align-items:center;gap:3px;font-size:11px;';
      const cb = document.createElement('input'); cb.type='checkbox';
      const key = 'freezePosition'+axis;
      cb.checked = comp.constraints[key] || false;
      cb.addEventListener('change', () => comp.constraints[key]=cb.checked);
      lbl.appendChild(cb); lbl.appendChild(document.createTextNode(axis));
      posWrap.appendChild(lbl);
    });
    body.appendChild(posWrap);
    
    const rotLabel = document.createElement('div');
    rotLabel.style.cssText='font-size:10px;color:var(--text-dim);text-transform:uppercase;margin:8px 0 4px;letter-spacing:1px;';
    rotLabel.textContent='Freeze Rotation';
    body.appendChild(rotLabel);
    
    const rotWrap = document.createElement('div');
    rotWrap.style.cssText='display:flex;gap:8px;';
    ['X','Y','Z'].forEach(axis => {
      const lbl = document.createElement('label');
      lbl.style.cssText='display:flex;align-items:center;gap:3px;font-size:11px;';
      const cb = document.createElement('input'); cb.type='checkbox';
      const key = 'freezeRotation'+axis;
      cb.checked = comp.constraints[key] || false;
      cb.addEventListener('change', () => comp.constraints[key]=cb.checked);
      lbl.appendChild(cb); lbl.appendChild(document.createTextNode(axis));
      rotWrap.appendChild(lbl);
    });
    body.appendChild(rotWrap);
    
    return block;
  }
  
  _makeBoxColliderBlock(comp) {
    const block = this._makeCollapsibleBlock('Box Collider', '⬜');
    const body = block.querySelector('.component-body');
    body.appendChild(this._makePropRow('Is Trigger', this._makeCheckbox(comp.isTrigger, v=>comp.isTrigger=v)));
    body.appendChild(this._makeVec3Row('Center', comp.center, (ax,v)=>{comp.center[ax]=v;}));
    body.appendChild(this._makeVec3Row('Size', comp.size, (ax,v)=>{comp.size[ax]=v;}));
    return block;
  }
  
  _makeSphereColliderBlock(comp) {
    const block = this._makeCollapsibleBlock('Sphere Collider', '🔵');
    const body = block.querySelector('.component-body');
    body.appendChild(this._makePropRow('Is Trigger', this._makeCheckbox(comp.isTrigger, v=>comp.isTrigger=v)));
    body.appendChild(this._makeVec3Row('Center', comp.center, (ax,v)=>{comp.center[ax]=v;}));
    body.appendChild(this._makePropRow('Radius', this._makeNumberInput(comp.radius, v=>comp.radius=v, 0.01, 0)));
    return block;
  }
  
  _makeCapsuleColliderBlock(comp) {
    const block = this._makeCollapsibleBlock('Capsule Collider', '💊');
    const body = block.querySelector('.component-body');
    body.appendChild(this._makePropRow('Is Trigger', this._makeCheckbox(comp.isTrigger, v=>comp.isTrigger=v)));
    body.appendChild(this._makePropRow('Radius', this._makeNumberInput(comp.radius, v=>comp.radius=v, 0.01, 0)));
    body.appendChild(this._makePropRow('Height', this._makeNumberInput(comp.height, v=>comp.height=v, 0.1, 0)));
    return block;
  }
  
  _makeParticleBlock(comp) {
    const block = this._makeCollapsibleBlock('Particle System', '✨');
    const body = block.querySelector('.component-body');
    
    body.appendChild(this._makePropRow('Max Particles', this._makeNumberInput(comp.maxParticles, v=>comp.maxParticles=Math.round(v), 1, 1)));
    body.appendChild(this._makePropRow('Emission Rate', this._makeNumberInput(comp.emissionRate, v=>comp.emissionRate=v, 1, 0)));
    body.appendChild(this._makePropRow('Duration', this._makeNumberInput(comp.duration, v=>comp.duration=v, 0.1, 0)));
    body.appendChild(this._makePropRow('Loop', this._makeCheckbox(comp.loop, v=>comp.loop=v)));
    body.appendChild(this._makePropRow('Play On Awake', this._makeCheckbox(comp.playOnAwake, v=>comp.playOnAwake=v)));
    body.appendChild(this._makeSliderRow('Gravity Modifier', comp.gravityModifier, -5, 5, 0.01, v=>comp.gravityModifier=v));
    
    const shapeSel = this._makeSelect(['sphere','cone','box','circle','point'], comp.shape, v=>comp.shape=v);
    body.appendChild(this._makePropRow('Shape', shapeSel));
    body.appendChild(this._makePropRow('Shape Radius', this._makeNumberInput(comp.shapeRadius, v=>comp.shapeRadius=v, 0.1, 0)));
    
    body.appendChild(this._makePropRow('Start Color', this._makeColorInput(comp.startColor, c=>comp.startColor=c)));
    body.appendChild(this._makePropRow('End Color', this._makeColorInput(comp.endColor, c=>comp.endColor=c)));
    
    const playBtn = document.createElement('button');
    playBtn.className='btn-open-script'; playBtn.textContent='▶ Play / Stop';
    playBtn.addEventListener('click',()=>{ if(comp._playing)comp.stop(); else comp.play(); });
    body.appendChild(playBtn);
    
    return block;
  }
  
  _makeAnimatorBlock(comp) {
    const block = this._makeCollapsibleBlock('Animator', '🎬');
    const body = block.querySelector('.component-body');
    body.appendChild(this._makePropRow('Speed', this._makeNumberInput(comp.speed, v=>comp.speed=v, 0.01)));
    body.appendChild(this._makePropRow('Apply Root Motion', this._makeCheckbox(comp.applyRootMotion, v=>comp.applyRootMotion=v)));
    const btn = document.createElement('button'); btn.className='btn-open-script'; btn.textContent='Abrir Animator Controller';
    btn.addEventListener('click', ()=>this.engine.openAnimator(comp));
    body.appendChild(btn);
    return block;
  }
  
  _makeAudioSourceBlock(comp) {
    const block = this._makeCollapsibleBlock('Audio Source', '🔊');
    const body = block.querySelector('.component-body');
    body.appendChild(this._makeSliderRow('Volume', comp.volume, 0, 1, 0.01, v=>comp.volume=v));
    body.appendChild(this._makeSliderRow('Pitch', comp.pitch, 0.1, 3, 0.01, v=>comp.pitch=v));
    body.appendChild(this._makePropRow('Loop', this._makeCheckbox(comp.loop, v=>comp.loop=v)));
    body.appendChild(this._makePropRow('Play On Awake', this._makeCheckbox(comp.playOnAwake, v=>comp.playOnAwake=v)));
    const btn = document.createElement('button'); btn.className='btn-open-script'; btn.textContent='▶ Play';
    btn.addEventListener('click',()=>comp.play());
    body.appendChild(btn);
    return block;
  }
  
  _makeGenericScriptBlock(comp, obj) {
    const block = this._makeCollapsibleBlock(comp.type || comp.constructor?.name || 'Script', '📄');
    const header = block.querySelector('.component-header');
    const body = block.querySelector('.component-body');
    
    // Enable checkbox
    const enableCb = document.createElement('input');
    enableCb.type='checkbox'; enableCb.checked=comp.enabled;
    enableCb.addEventListener('change',()=>{ comp.enabled=enableCb.checked; if(comp.enabled)comp.onEnable?.(); else comp.onDisable?.(); });
    header.insertBefore(enableCb, header.firstChild);
    
    // Remove button
    const removeBtn = block.querySelector('.component-menu-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (confirm(`Remover ${comp.type}?`)) {
          obj.removeComponent(comp);
          this.render(obj);
        }
      });
    }
    
    // Show exposed fields
    if (comp._fields) {
      for (const [fieldName, fieldType] of Object.entries(comp._fieldTypes || {})) {
        let inputEl;
        const val = comp[fieldName];
        if (val instanceof Vec3) {
          inputEl = this._makeVec3Row(fieldName, val, (ax,v)=>val[ax]=v);
          body.appendChild(inputEl);
          continue;
        } else if (val instanceof Color) {
          inputEl = this._makeColorInput(val, c=>comp[fieldName]=c);
        } else if (fieldType === 'boolean' || typeof val === 'boolean') {
          inputEl = this._makeCheckbox(val, v=>comp[fieldName]=v);
        } else if (fieldType === 'float' || fieldType === 'int' || typeof val === 'number') {
          inputEl = this._makeNumberInput(val, v=>comp[fieldName]=v);
        } else {
          inputEl = document.createElement('input');
          inputEl.className='prop-input'; inputEl.value=String(val||'');
          inputEl.addEventListener('change',()=>comp[fieldName]=inputEl.value);
        }
        body.appendChild(this._makePropRow(fieldName, inputEl));
      }
    }
    
    // Open script button
    const openBtn = document.createElement('button');
    openBtn.className='btn-open-script';
    openBtn.textContent='Editar Script: ' + (comp.type||'Script');
    openBtn.addEventListener('click',()=>this.engine.openScript(comp.type));
    body.appendChild(openBtn);
    
    return block;
  }
}


/* ===== js/editor/project.js ===== */
/**
 * WebGL Engine - Project Panel
 */
class ProjectPanel {
  constructor(engine) {
    this.engine = engine;
    this.el = document.getElementById('project-assets-grid');
    this.currentFolder = 'all';
    this._setupFolders();
    this._setupGlobalContextClose();
  }

  _setupFolders() {
    document.querySelectorAll('.asset-folder').forEach(f => {
      f.addEventListener('click', () => {
        document.querySelectorAll('.asset-folder').forEach(x=>x.classList.remove('active'));
        f.classList.add('active');
        this.currentFolder = f.dataset.folder;
        this.render();
      });
    });
  }

  _setupGlobalContextClose() {
    document.addEventListener('click', () => this._closeContextMenu());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this._closeContextMenu(); });
  }

  _closeContextMenu() {
    document.getElementById('asset-ctx-menu')?.remove();
  }

  _showContextMenu(x, y, asset) {
    this._closeContextMenu();

    const menu = document.createElement('div');
    menu.id = 'asset-ctx-menu';
    menu.style.cssText = `position:fixed;left:${x}px;top:${y}px;background:#2a2a2e;border:1px solid #444;
      border-radius:5px;z-index:99999;min-width:160px;box-shadow:0 4px 16px rgba(0,0,0,0.6);padding:4px 0;`;

    const addItem = (label, icon, action, danger = false) => {
      const el = document.createElement('div');
      el.style.cssText = `padding:7px 14px;cursor:pointer;font-size:12px;color:${danger ? '#e74c3c' : '#ddd'};
        display:flex;align-items:center;gap:8px;`;
      el.innerHTML = `<span style="font-size:13px;">${icon}</span>${label}`;
      el.addEventListener('mouseenter', () => el.style.background = danger ? 'rgba(231,76,60,0.15)' : '#3a3a5a');
      el.addEventListener('mouseleave', () => el.style.background = '');
      el.addEventListener('click', () => { this._closeContextMenu(); action(); });
      menu.appendChild(el);
    };

    const addSep = () => {
      const s = document.createElement('div');
      s.style.cssText = 'height:1px;background:#333;margin:3px 0;';
      menu.appendChild(s);
    };

    // Open / edit
    if (asset.type === 'script' || asset.type === 'shader') {
      addItem('Abrir Editor', '✏️', () => {
        if (asset.type === 'script') this.engine.openScript(asset.name, asset.content);
        else {
          document.getElementById('shader-code-modal')?.classList.remove('hidden');
          document.getElementById('vertex-shader-code').value = SHADERS.standardVert;
          document.getElementById('fragment-shader-code').value = asset.content || SHADERS.standardFrag;
        }
      });
      addSep();
    }

    if (asset.type === 'material') {
      addItem('Editar Material', '🎨', () => this.engine.openMaterialEditor?.(asset));
      addSep();
    }

    // Rename
    addItem('Renomear', '✏', () => {
      const newName = prompt(`Renomear "${asset.name}":`, asset.name);
      if (newName && newName !== asset.name && newName.trim()) {
        // Update any references in components
        this.engine.scene?.getAllObjects().forEach(obj => {
          obj.components.forEach(c => {
            if (c.scriptName === asset.name) c.scriptName = newName.trim();
          });
        });
        asset.name = newName.trim();
        this.render();
        this.engine.notification(`Renomeado para: ${newName.trim()}`);
      }
    });

    // Duplicate
    addItem('Duplicar', '📋', () => {
      const copy = { ...asset, name: asset.name + '_Copy' };
      this.engine.assets.push(copy);
      this.render();
      this.engine.notification(`Duplicado: ${copy.name}`);
    });

    addSep();

    // Delete
    addItem('Deletar', '🗑', () => {
      if (confirm(`Deletar asset "${asset.name}"?\nEsta ação não pode ser desfeita.`)) {
        const idx = this.engine.assets.indexOf(asset);
        if (idx >= 0) this.engine.assets.splice(idx, 1);
        this.render();
        this.engine.notification(`Asset deletado: ${asset.name}`, 'warning');
      }
    }, true);

    // Clamp to viewport
    document.body.appendChild(menu);
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth)  menu.style.left = (x - rect.width)  + 'px';
    if (rect.bottom > window.innerHeight) menu.style.top = (y - rect.height) + 'px';
  }

  render() {
    if (!this.el) return;
    this.el.innerHTML = '';
    const assets = this.engine.assets || [];
    const filtered = this.currentFolder === 'all'
      ? assets
      : assets.filter(a => a.type === this.currentFolder.replace(/s$/, ''));

    for (const asset of filtered) {
      const item = document.createElement('div');
      item.className = 'asset-item';
      item.dataset.type = asset.type;
      item.dataset.name = asset.name;
      item.title = `${asset.name}\nTipo: ${asset.type}\nClique duplo para abrir • Clique direito para opções`;

      const icon = document.createElement('div');
      icon.className = 'asset-icon';
      icon.textContent = this._getAssetIcon(asset.type);

      const name = document.createElement('div');
      name.className = 'asset-name';
      name.textContent = asset.name;

      item.appendChild(icon);
      item.appendChild(name);

      item.addEventListener('click', () => {
        document.querySelectorAll('.asset-item').forEach(x => x.classList.remove('selected'));
        item.classList.add('selected');
        this.engine.selectAsset(asset);
      });

      item.addEventListener('dblclick', () => {
        if (asset.type === 'script')   this.engine.openScript(asset.name, asset.content);
        if (asset.type === 'scene')    this.engine.loadScene?.(asset.name);
        if (asset.type === 'material') this.engine.openMaterialEditor?.(asset);
        if (asset.type === 'shader') {
          document.getElementById('shader-code-modal')?.classList.remove('hidden');
          const frag = document.getElementById('fragment-shader-code');
          if (frag) frag.value = asset.content || SHADERS.standardFrag;
        }
      });

      // Right-click context menu
      item.addEventListener('contextmenu', e => {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll('.asset-item').forEach(x => x.classList.remove('selected'));
        item.classList.add('selected');
        this.engine.selectAsset(asset);
        this._showContextMenu(e.clientX, e.clientY, asset);
      });

      this.el.appendChild(item);
    }

    if (filtered.length === 0) {
      this.el.innerHTML = '<div style="color:var(--text-dim);padding:20px;font-size:11px;text-align:center;">Nenhum asset<br><span style="font-size:10px;opacity:0.6;">Crie ou importe assets via menu Assets</span></div>';
    }
  }
  
  _getAssetIcon(type) {
    switch(type) {
      case 'script': return '📄';
      case 'material': return '🎨';
      case 'texture': return '🖼';
      case 'model': return '📦';
      case 'animation': return '🎬';
      case 'scene': return '🌐';
      case 'audio': return '🔊';
      case 'shader': return '⚡';
      case 'prefab': return '💠';
      default: return '📁';
    }
  }
  
  addAsset(asset) {
    if (!this.engine.assets) this.engine.assets = [];
    this.engine.assets.push(asset);
    this.render();
  }
}


/* ===== js/editor/timeline.js ===== */
/**
 * WebGL Engine - Timeline Editor
 */
class TimelineEditor {
  constructor(engine) {
    this.engine = engine;
    this.canvas = document.getElementById('timeline-canvas');
    this.ctx = this.canvas?.getContext('2d');
    this.tracks = [];
    this.currentTime = 0;
    this.duration = 5;
    this.fps = 30;
    this.playing = false;
    this.zoom = 100; // pixels per second
    this.selectedKeyframe = null;
    this._setupUI();
    this._setupCanvas();
  }
  
  _setupUI() {
    document.getElementById('btn-add-keyframe')?.addEventListener('click', () => this._addKeyframe());
    document.getElementById('btn-timeline-play')?.addEventListener('click', () => {
      this.playing = !this.playing;
      document.getElementById('btn-timeline-play').textContent = this.playing ? '⏸' : '▶';
    });
    document.getElementById('timeline-scrub')?.addEventListener('input', (e) => {
      this.currentTime = (parseFloat(e.target.value) / 100) * this.duration;
      this._updateTimeDisplay();
      this._scrubAnimation();
    });
    document.getElementById('timeline-fps')?.addEventListener('change', (e) => {
      this.fps = parseInt(e.target.value) || 30;
    });
  }
  
  _setupCanvas() {
    if (!this.canvas) return;
    const resizeObserver = new ResizeObserver(() => this._resize());
    resizeObserver.observe(this.canvas.parentElement || document.body);
    this._resize();
  }
  
  _resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (parent) { this.canvas.width = parent.clientWidth - 150; this.canvas.height = parent.clientHeight; }
    this._draw();
  }
  
  addTrack(label, clip, property) {
    this.tracks.push({ label, clip, property, keyframes: [] });
    this._renderTrackList();
    this._draw();
  }
  
  _renderTrackList() {
    const list = document.getElementById('timeline-tracks');
    if (!list) return;
    list.innerHTML = '';
    this.tracks.forEach(t => {
      const row = document.createElement('div');
      row.className = 'timeline-track';
      const name = document.createElement('div');
      name.className = 'timeline-track-name';
      name.textContent = t.label;
      row.appendChild(name);
      list.appendChild(row);
    });
  }
  
  _addKeyframe() {
    const obj = this.engine.selectedObject;
    if (!obj) return;
    
    // Add keyframe for current selection at current time
    this.tracks.forEach(t => {
      t.keyframes.push({ time: this.currentTime });
      if (t.clip) {
        const prop = t.clip.properties.find(p => p.property === t.property);
        if (prop) {
          const val = this._getPropertyValue(obj, t.property);
          prop.curve.addKey(this.currentTime, val);
        }
      }
    });
    this._draw();
  }
  
  _getPropertyValue(obj, property) {
    const parts = property.split('.');
    if (parts[0] === 'transform') {
      const t = obj.transform;
      if (parts[1] === 'position') return t.position[parts[2]] || 0;
      if (parts[1] === 'rotation') return t.rotation[parts[2]] || 0;
      if (parts[1] === 'scale') return t.scale[parts[2]] || 1;
    }
    return 0;
  }
  
  _scrubAnimation() {
    const obj = this.engine.selectedObject;
    if (!obj) return;
    for (const t of this.tracks) {
      if (t.clip) t.clip.sample(obj, this.currentTime);
    }
  }
  
  _updateTimeDisplay() {
    const s = Math.floor(this.currentTime);
    const f = Math.floor((this.currentTime - s) * this.fps);
    const el = document.getElementById('timeline-time');
    if (el) el.textContent = `${s}:${f.toString().padStart(2,'0')}`;
    const scrub = document.getElementById('timeline-scrub');
    if (scrub) scrub.value = (this.currentTime / this.duration * 100).toFixed(1);
  }
  
  update(dt) {
    if (!this.playing) return;
    this.currentTime += dt;
    if (this.currentTime > this.duration) this.currentTime = 0;
    this._updateTimeDisplay();
    this._scrubAnimation();
    this._draw();
  }
  
  _draw() {
    const canvas = this.canvas, ctx = this.ctx;
    if (!canvas || !ctx) return;
    const W = canvas.width, H = canvas.height;
    
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, W, H);
    
    // Time ruler
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, W, 20);
    ctx.strokeStyle = '#444';
    ctx.fillStyle = '#888';
    ctx.font = '9px monospace';
    
    const stepPx = this.zoom;
    const steps = Math.ceil(W / stepPx) + 1;
    for (let i = 0; i <= steps; i++) {
      const x = i * stepPx;
      ctx.strokeStyle = '#444';
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 20); ctx.stroke();
      ctx.fillStyle = '#888';
      ctx.fillText(`${i}s`, x + 2, 13);
      // Sub-divs
      const subStep = stepPx / this.fps;
      if (subStep > 5) {
        for (let f = 1; f < this.fps; f++) {
          const sx = x + f * subStep;
          ctx.strokeStyle = '#333';
          ctx.beginPath(); ctx.moveTo(sx, 15); ctx.lineTo(sx, 20); ctx.stroke();
        }
      }
    }
    
    // Track rows
    const trackH = 24;
    this.tracks.forEach((t, ti) => {
      const y = 20 + ti * trackH;
      ctx.fillStyle = ti % 2 === 0 ? '#252525' : '#222222';
      ctx.fillRect(0, y, W, trackH);
      ctx.strokeStyle = '#1a1a1a';
      ctx.beginPath(); ctx.moveTo(0, y+trackH); ctx.lineTo(W, y+trackH); ctx.stroke();
      
      // Keyframes
      t.keyframes.forEach(kf => {
        const kx = kf.time * this.zoom;
        const ky = y + trackH/2;
        ctx.fillStyle = kf === this.selectedKeyframe ? '#f39c12' : '#4a9eff';
        ctx.beginPath();
        ctx.moveTo(kx, ky-5); ctx.lineTo(kx+5, ky); ctx.lineTo(kx, ky+5); ctx.lineTo(kx-5, ky);
        ctx.closePath(); ctx.fill();
      });
    });
    
    // Playhead
    const px = this.currentTime * this.zoom;
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath(); ctx.moveTo(px-5, 0); ctx.lineTo(px+5, 0); ctx.lineTo(px, 8); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 1;
  }
}


/* ===== js/editor/animator-editor.js ===== */
/**
 * WebGL Engine - Animator Editor
 */
class AnimatorEditor {
  constructor(engine) {
    this.engine = engine;
    this.canvas = document.getElementById('animator-canvas');
    this.ctx = this.canvas?.getContext('2d');
    this.controller = null;
    this.selectedState = null;
    this._draggingState = null;
    this._offset = { x: 0, y: 0 };
    this._scale = 1;
    this._pan = { x: 50, y: 50 };
    this._setupInteraction();
    this._setupUI();
  }
  
  _setupUI() {
    document.getElementById('btn-add-state')?.addEventListener('click', () => {
      if (!this.controller) this.controller = new AnimatorController();
      const clip = new AnimationClip('New Clip');
      const state = this.controller.addState('New State', clip);
      state.x = 100 + Math.random()*200;
      state.y = 100 + Math.random()*200;
      this._draw();
    });
    
    document.getElementById('btn-add-parameter')?.addEventListener('click', () => {
      if (!this.controller) return;
      const name = prompt('Nome do parâmetro:');
      if (!name) return;
      const type = 'float';
      this.controller.addParameter(name, type, 0);
      this._renderParams();
    });
  }
  
  _renderParams() {
    const list = document.getElementById('param-list');
    if (!list || !this.controller) return;
    list.innerHTML = '';
    for (const [name, param] of Object.entries(this.controller.parameters)) {
      const item = document.createElement('div');
      item.className = 'param-item';
      const nameEl = document.createElement('span');
      nameEl.textContent = name;
      nameEl.style.flex = '1';
      const valInp = document.createElement('input');
      valInp.type = 'number'; valInp.value = param.value; valInp.style.width='50px';
      valInp.addEventListener('change', () => this.controller.setParameter(name, parseFloat(valInp.value)));
      item.appendChild(nameEl); item.appendChild(valInp);
      list.appendChild(item);
    }
  }
  
  _setupInteraction() {
    if (!this.canvas) return;
    this.canvas.addEventListener('mousedown', e => {
      const pos = this._canvasPos(e);
      const state = this._hitTest(pos);
      if (state) {
        this.selectedState = state;
        this._draggingState = state;
        this._dragOffset = { x: pos.x - state.x, y: pos.y - state.y };
      } else {
        this._panStart = pos;
        this._panPrev = {...this._pan};
      }
      this._draw();
    });
    
    this.canvas.addEventListener('mousemove', e => {
      const pos = this._canvasPos(e);
      if (this._draggingState) {
        this._draggingState.x = pos.x - this._dragOffset.x;
        this._draggingState.y = pos.y - this._dragOffset.y;
        this._draw();
      } else if (this._panStart) {
        this._pan.x = this._panPrev.x + (pos.x - this._panStart.x);
        this._pan.y = this._panPrev.y + (pos.y - this._panStart.y);
        this._draw();
      }
    });
    
    this.canvas.addEventListener('mouseup', () => {
      this._draggingState = null;
      this._panStart = null;
    });
    
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
  
  _canvasPos(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left - this._pan.x, y: e.clientY - r.top - this._pan.y };
  }
  
  _hitTest(pos) {
    if (!this.controller) return null;
    return this.controller.states.find(s =>
      pos.x >= s.x && pos.x <= s.x+160 && pos.y >= s.y && pos.y <= s.y+60
    ) || null;
  }
  
  _draw() {
    const canvas = this.canvas, ctx = this.ctx;
    if (!canvas || !ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    
    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, W, H);
    
    // Grid
    ctx.strokeStyle = '#252525';
    const gs = 40;
    for (let x = this._pan.x % gs; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = this._pan.y % gs; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    
    ctx.save();
    ctx.translate(this._pan.x, this._pan.y);
    
    if (!this.controller) {
      ctx.fillStyle = '#555';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Selecione um Animator Component para editar', 200, 200);
      ctx.restore();
      return;
    }
    
    // Draw transitions
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    for (const state of this.controller.states) {
      for (const trans of state.transitions) {
        const fx = state.x+80, fy = state.y+30;
        const tx = trans.to.x+80, ty = trans.to.y+30;
        ctx.beginPath(); ctx.moveTo(fx,fy); ctx.lineTo(tx,ty); ctx.stroke();
        // Arrow
        const angle = Math.atan2(ty-fy, tx-fx);
        const ax = tx-15*Math.cos(angle), ay = ty-15*Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(ax+7*Math.sin(angle), ay-7*Math.cos(angle));
        ctx.lineTo(ax-7*Math.sin(angle), ay+7*Math.cos(angle));
        ctx.closePath(); ctx.fillStyle='#666'; ctx.fill();
      }
    }
    
    // Draw states
    for (const state of this.controller.states) {
      const isSelected = state === this.selectedState;
      const isDefault = state === this.controller.defaultState;
      
      ctx.fillStyle = isSelected ? '#4a9eff' : isDefault ? '#2ecc71' : '#3c3c3c';
      ctx.strokeStyle = isSelected ? '#6ab8ff' : isDefault ? '#27ae60' : '#555';
      ctx.lineWidth = 2;
      this._roundRect(ctx, state.x, state.y, 160, 60, 8);
      ctx.fill(); ctx.stroke();
      
      ctx.fillStyle = isSelected ? 'white' : '#ddd';
      ctx.font = 'bold 13px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(state.name, state.x+80, state.y+25);
      ctx.font = '10px system-ui';
      ctx.fillStyle = isSelected ? '#cce' : '#888';
      ctx.fillText(state.clip?.name || '(no clip)', state.x+80, state.y+42);
    }
    
    ctx.restore();
    ctx.lineWidth = 1;
  }
  
  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
    ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
    ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r);
    ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
    ctx.closePath();
  }
  
  open(animatorComp) {
    if (!animatorComp.controller) {
      animatorComp.controller = new AnimatorController();
    }
    this.controller = animatorComp.controller;
    this._renderParams();
    this._draw();
  }
}


/* ===== js/editor/shader-graph.js ===== */
/**
 * WebGL Engine - Shader Graph Editor (Node-based)
 */
class ShaderGraphEditor {
  constructor(engine) {
    this.engine = engine;
    this.canvas = document.getElementById('shader-graph-canvas');
    this.ctx = this.canvas?.getContext('2d');
    this.nodes = [];
    this.connections = [];
    this.selectedNode = null;
    this._dragging = null;
    this._connecting = null;
    this._pan = { x: 200, y: 100 };
    this._currentShader = null;
    this._setupCanvas();
    this._setupUI();
    this._createDefaultGraph();
  }
  
  _setupUI() {
    document.getElementById('btn-add-node')?.addEventListener('click', () => {
      const type = prompt('Tipo de nó: (add/multiply/texture2d/time/sin/lerp/color-output)');
      if (type) this.addNode(type, 300 - this._pan.x, 200 - this._pan.y);
    });
    
    document.getElementById('btn-compile-shader')?.addEventListener('click', () => {
      const glsl = this.compile();
      if (glsl) { this.engine.notification('Shader compilado!', 'success'); }
    });
    
    document.getElementById('btn-compile-glsl')?.addEventListener('click', () => {
      this._compileGLSL();
    });
    
    // Node palette drag
    document.querySelectorAll('.node-item').forEach(item => {
      item.addEventListener('dragstart', e => {
        e.dataTransfer.setData('nodeType', item.dataset.node);
      });
    });
    
    this.canvas?.addEventListener('dragover', e => e.preventDefault());
    this.canvas?.addEventListener('drop', e => {
      e.preventDefault();
      const type = e.dataTransfer.getData('nodeType');
      if (type) {
        const r = this.canvas.getBoundingClientRect();
        this.addNode(type, e.clientX - r.left - this._pan.x, e.clientY - r.top - this._pan.y);
      }
    });
  }
  
  _setupCanvas() {
    if (!this.canvas) return;
    this.canvas.addEventListener('mousedown', e => this._onMouseDown(e));
    this.canvas.addEventListener('mousemove', e => this._onMouseMove(e));
    this.canvas.addEventListener('mouseup', e => this._onMouseUp(e));
    this.canvas.addEventListener('wheel', e => {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this._scale = Math.max(0.3, Math.min(3, (this._scale || 1) * delta));
      this._draw();
    }, { passive: true });
    
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
  
  _createDefaultGraph() {
    // Create initial nodes
    this.addNode('color-output', 400, 200);
    const uvNode = this.addNode('uv', 50, 200);
    const timeNode = this.addNode('time', 50, 350);
  }
  
  addNode(type, x, y) {
    const def = this._getNodeDef(type);
    const node = {
      id: generateId(), type, x, y,
      width: 140, height: 30 + def.inputs.length * 22 + def.outputs.length * 22 + 10,
      label: def.label, inputs: def.inputs.map(i=>({...i,value:i.default||0})),
      outputs: def.outputs.map(o=>({...o})),
      props: {...(def.props||{})}
    };
    this.nodes.push(node);
    this._draw();
    return node;
  }
  
  _getNodeDef(type) {
    const defs = {
      'uv': { label:'UV', inputs:[], outputs:[{name:'UV',type:'vec2'}] },
      'texture2d': { label:'Texture2D', inputs:[{name:'UV',type:'vec2'}], outputs:[{name:'RGBA',type:'vec4'},{name:'RGB',type:'vec3'},{name:'A',type:'float'}], props:{texture:null} },
      'time': { label:'Time', inputs:[], outputs:[{name:'Time',type:'float'},{name:'Sine',type:'float'}] },
      'position': { label:'Position', inputs:[], outputs:[{name:'World',type:'vec3'},{name:'Object',type:'vec3'}] },
      'normal': { label:'Normal', inputs:[], outputs:[{name:'World',type:'vec3'},{name:'Object',type:'vec3'}] },
      'add': { label:'Add', inputs:[{name:'A',type:'float',default:0},{name:'B',type:'float',default:0}], outputs:[{name:'Out',type:'float'}] },
      'multiply': { label:'Multiply', inputs:[{name:'A',type:'float',default:1},{name:'B',type:'float',default:1}], outputs:[{name:'Out',type:'float'}] },
      'lerp': { label:'Lerp', inputs:[{name:'A',type:'float',default:0},{name:'B',type:'float',default:1},{name:'T',type:'float',default:0.5}], outputs:[{name:'Out',type:'float'}] },
      'clamp': { label:'Clamp', inputs:[{name:'In',type:'float',default:0},{name:'Min',type:'float',default:0},{name:'Max',type:'float',default:1}], outputs:[{name:'Out',type:'float'}] },
      'sin': { label:'Sin', inputs:[{name:'In',type:'float',default:0}], outputs:[{name:'Out',type:'float'}] },
      'abs': { label:'Abs', inputs:[{name:'In',type:'float',default:0}], outputs:[{name:'Out',type:'float'}] },
      'color-output': { label:'Color Output', inputs:[{name:'Color',type:'vec4'},{name:'Alpha',type:'float',default:1}], outputs:[], props:{isOutput:true} },
    };
    return defs[type] || { label:type, inputs:[{name:'In',type:'float',default:0}], outputs:[{name:'Out',type:'float'}] };
  }
  
  _onMouseDown(e) {
    const pos = this._screenToGraph(e);
    const node = this._hitNode(pos);
    if (node) {
      this.selectedNode = node;
      this._dragging = { node, ox: pos.x - node.x, oy: pos.y - node.y };
    } else {
      this._panStart = { x: e.clientX - this._pan.x, y: e.clientY - this._pan.y };
      this.selectedNode = null;
    }
    this._draw();
  }
  
  _onMouseMove(e) {
    if (this._dragging) {
      const pos = this._screenToGraph(e);
      this._dragging.node.x = pos.x - this._dragging.ox;
      this._dragging.node.y = pos.y - this._dragging.oy;
      this._draw();
    } else if (this._panStart) {
      this._pan.x = e.clientX - this._panStart.x;
      this._pan.y = e.clientY - this._panStart.y;
      this._draw();
    }
  }
  
  _onMouseUp(e) {
    this._dragging = null;
    this._panStart = null;
  }
  
  _screenToGraph(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left - this._pan.x, y: e.clientY - r.top - this._pan.y };
  }
  
  _hitNode(pos) {
    return this.nodes.find(n => pos.x >= n.x && pos.x <= n.x+n.width && pos.y >= n.y && pos.y <= n.y+n.height) || null;
  }
  
  _draw() {
    const canvas = this.canvas, ctx = this.ctx;
    if (!canvas || !ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, W, H);
    
    // Grid
    ctx.strokeStyle = '#222';
    const gs = 40;
    for (let x=(this._pan.x%gs+gs)%gs; x<W; x+=gs) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y=(this._pan.y%gs+gs)%gs; y<H; y+=gs) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    
    ctx.save();
    ctx.translate(this._pan.x, this._pan.y);
    
    // Draw connections
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 2;
    for (const conn of this.connections) {
      const srcPort = this._getPortPos(conn.srcNode, 'output', conn.srcPort);
      const dstPort = this._getPortPos(conn.dstNode, 'input', conn.dstPort);
      if (srcPort && dstPort) {
        ctx.beginPath();
        ctx.moveTo(srcPort.x, srcPort.y);
        ctx.bezierCurveTo(srcPort.x+60, srcPort.y, dstPort.x-60, dstPort.y, dstPort.x, dstPort.y);
        ctx.stroke();
      }
    }
    
    // Draw nodes
    for (const node of this.nodes) {
      const isSelected = node === this.selectedNode;
      const isOutput = node.props?.isOutput;
      
      // Shadow
      ctx.shadowColor = isSelected ? '#4a9eff' : 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = isSelected ? 12 : 6;
      
      // Body
      ctx.fillStyle = isOutput ? '#2d3d2d' : '#2a2a3a';
      ctx.strokeStyle = isSelected ? '#4a9eff' : (isOutput ? '#2ecc71' : '#444');
      ctx.lineWidth = isSelected ? 2 : 1;
      this._roundRect(ctx, node.x, node.y, node.width, node.height, 6);
      ctx.fill(); ctx.stroke();
      
      ctx.shadowBlur = 0;
      
      // Header
      ctx.fillStyle = isOutput ? '#27ae60' : '#3a3a5a';
      this._roundRectTop(ctx, node.x, node.y, node.width, 26, 6);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x + node.width/2, node.y + 17);
      
      // Inputs
      node.inputs.forEach((inp, i) => {
        const py = node.y + 36 + i * 22;
        // Port circle
        ctx.fillStyle = '#4a9eff';
        ctx.beginPath(); ctx.arc(node.x, py, 5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#bbb'; ctx.font='10px system-ui'; ctx.textAlign='left';
        ctx.fillText(inp.name, node.x + 10, py + 4);
        if (inp.value !== undefined && typeof inp.value === 'number') {
          ctx.fillStyle = '#666'; ctx.textAlign='right';
          ctx.fillText(inp.value.toFixed(2), node.x + node.width - 5, py + 4);
        }
      });
      
      // Outputs
      node.outputs.forEach((out, i) => {
        const py = node.y + 36 + node.inputs.length * 22 + i * 22;
        ctx.fillStyle = '#f39c12';
        ctx.beginPath(); ctx.arc(node.x + node.width, py, 5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#bbb'; ctx.font='10px system-ui'; ctx.textAlign='right';
        ctx.fillText(out.name, node.x + node.width - 10, py + 4);
      });
    }
    
    ctx.restore();
    ctx.lineWidth = 1;
  }
  
  _getPortPos(nodeId, type, portIdx) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return null;
    const y = node.y + 36 + (type==='input' ? portIdx*22 : node.inputs.length*22 + portIdx*22);
    const x = type === 'input' ? node.x : node.x + node.width;
    return { x, y };
  }
  
  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
    ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
    ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r);
    ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
    ctx.closePath();
  }
  
  _roundRectTop(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
    ctx.lineTo(x+w, y+h); ctx.lineTo(x, y+h);
    ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
    ctx.closePath();
  }
  
  compile() {
    // Generate GLSL from node graph
    let fragCode = 'void main() {\n  vec4 color = vec4(1.0);\n';
    // TODO: traverse node graph and generate GLSL
    fragCode += '  gl_FragColor = color;\n}';
    return fragCode;
  }
  
  _compileGLSL() {
    const vertSrc = document.getElementById('vertex-shader-code')?.value;
    const fragSrc = document.getElementById('fragment-shader-code')?.value;
    if (!vertSrc || !fragSrc) return;
    try {
      this.engine.renderer.glCtx.createProgram(vertSrc, fragSrc, 'custom_' + Date.now());
      this.engine.notification('GLSL compilado com sucesso!', 'success');
    } catch(e) {
      this.engine.notification('Erro GLSL: ' + e.message, 'error');
    }
  }
}


/* ===== js/editor/modeler.js ===== */
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


/* ===== js/editor/gizmos.js ===== */
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


/* ===== js/ui/menus.js ===== */
/**
 * WebGL Engine - Menu & UI System
 */

class MenuSystem {
  constructor(engine) {
    this.engine = engine;
    this._setupMenus();
    this._setupToolbar();
    this._setupKeyboardShortcuts();
    this._setupTabSwitching();
    this._setupPlayButtons();
    this._setupBottomPanelTabs();
    this._setupAddComponent();
    this._setupQualitySelect();
    this._setupSceneOverlay();
    this._setupLightingModal();
    this._setupBuildModal();
    this._setupPreferences();
  }
  
  _setupMenus() {
    // Close menus when clicking outside
    document.addEventListener('click', e => {
      if (!e.target.closest('.menu-item')) {
        document.querySelectorAll('.dropdown').forEach(d => d.style.display = '');
      }
    });
    
    // Handle all dropdown actions
    document.querySelectorAll('[data-action]').forEach(el => {
      el.addEventListener('click', e => {
        const action = el.dataset.action;
        if (action) { try { this.engine.executeAction(action); } catch(e) { console.error('Action error:', action, e.message); } }
      });
    });
  }
  
  _setupToolbar() {
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn[data-tool]').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        const tool = btn.dataset.tool;
        this.engine.gizmos.mode = tool;
        if (this.engine.currentView === 'modeler') {
          // handled by modeler
        }
      });
    });
    
    document.getElementById('btn-grid')?.addEventListener('click', () => {
      this.engine.renderer.showGrid = !this.engine.renderer.showGrid;
      document.getElementById('btn-grid').classList.toggle('active', this.engine.renderer.showGrid);
    });
    
    document.getElementById('btn-snap')?.addEventListener('click', () => {
      this.engine.snapEnabled = !this.engine.snapEnabled;
      document.getElementById('btn-snap').classList.toggle('active', this.engine.snapEnabled);
    });
    
    document.getElementById('btn-model-mode')?.addEventListener('click', () => {
      this.engine.switchView('modeler');
      if (this.engine.selectedObject) {
        const mr = this.engine.selectedObject.getComponent('MeshRenderer');
        if (mr?.mesh) this.engine.modeler.openMesh(mr.mesh);
      }
    });
    
    document.getElementById('btn-rig-mode')?.addEventListener('click', () => {
      this.engine.notification('Modo Rig: Adicione um Animator component primeiro', 'warning');
    });
    
    document.getElementById('btn-sculpt-mode')?.addEventListener('click', () => {
      this.engine.switchView('modeler');
    });
    
    document.getElementById('btn-pivot')?.addEventListener('click', () => {
      // Toggle pivot/center
    });
  }
  
  _setupKeyboardShortcuts() {
    window.addEventListener('keydown', e => {
      // Don't intercept when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.code) {
        case 'KeyQ': this._setTool('select'); break;
        case 'KeyW': this._setTool('move'); break;
        case 'KeyE': this._setTool('rotate'); break;
        case 'KeyR': this._setTool('scale'); break;
        case 'KeyF':
          if (this.engine.selectedObject) this.engine.renderer.focusOnObject(this.engine.selectedObject);
          break;
        case 'Delete': case 'Backspace':
          if (this.engine.selectedObject) { this.engine.executeAction('delete'); e.preventDefault(); }
          break;
        case 'KeyD': if (e.ctrlKey) { this.engine.executeAction('duplicate'); e.preventDefault(); } break;
        case 'KeyZ': if (e.ctrlKey) { this.engine.undo(); e.preventDefault(); } break;
        case 'KeyY': if (e.ctrlKey) { this.engine.redo(); e.preventDefault(); } break;
        case 'KeyS': if (e.ctrlKey) { this.engine.executeAction('save-scene'); e.preventDefault(); } break;
        case 'Space':
          if (e.target === document.body) { this.engine.togglePlay(); e.preventDefault(); }
          break;
        case 'KeyP': this.engine.togglePlay(); break;
        case 'Numpad5': this.engine.renderer.editorCamera.orthographic = !this.engine.renderer.editorCamera.orthographic; break;
        case 'Numpad1': this.engine.renderer.editorCamera.yaw=180; this.engine.renderer.editorCamera.pitch=0; break;
        case 'Numpad3': this.engine.renderer.editorCamera.yaw=-90; this.engine.renderer.editorCamera.pitch=0; break;
        case 'Numpad7': this.engine.renderer.editorCamera.pitch=-89; break;
        case 'F5': this.engine.togglePlay(); e.preventDefault(); break;
        case 'F2':
          if (this.engine.selectedObject) {
            this.engine.hierarchy._renaming = this.engine.selectedObject.id;
            this.engine.hierarchy.render(this.engine.scene);
            e.preventDefault();
          }
          break;
      }
    });
  }
  
  _setTool(tool) {
    const btn = document.querySelector(`.tool-btn[data-tool="${tool}"]`);
    if (btn) { document.querySelectorAll('.tool-btn[data-tool]').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); }
    this.engine.gizmos.mode = tool;
  }
  
  _setupTabSwitching() {
    document.querySelectorAll('.view-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.dataset.view;
        this.engine.switchView(view);
      });
    });
  }
  
  _setupPlayButtons() {
    document.getElementById('btn-play')?.addEventListener('click', () => this.engine.togglePlay());
    document.getElementById('btn-pause')?.addEventListener('click', () => {
      if (this.engine.isPlaying) this.engine.scene.pause();
    });
    document.getElementById('btn-step')?.addEventListener('click', () => {
      if (this.engine.isPlaying) {
        this.engine.scene.isPlaying = true;
        this.engine._stepFrame = true;
      }
    });
  }
  
  _setupBottomPanelTabs() {
    document.querySelectorAll('.bottom-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.dataset.tab + '-tab';
        document.querySelectorAll('.bottom-tab').forEach(t=>t.classList.remove('active'));
        document.querySelectorAll('.bottom-content').forEach(c=>{ c.classList.remove('active'); c.classList.add('hidden'); });
        tab.classList.add('active');
        const content = document.getElementById(targetId);
        if (content) { content.classList.add('active'); content.classList.remove('hidden'); }
      });
    });
  }
  
  _setupAddComponent() {
    const btn = document.getElementById('btn-add-component');
    const popup = document.getElementById('add-component-popup');
    const search = document.getElementById('component-search');
    
    btn?.addEventListener('click', e => {
      e.stopPropagation();
      popup?.classList.toggle('hidden');
      search?.focus();
    });
    
    document.addEventListener('click', e => {
      if (!e.target.closest('#add-component-popup') && !e.target.closest('#btn-add-component')) {
        popup?.classList.add('hidden');
      }
    });
    
    search?.addEventListener('input', () => {
      const q = search.value.toLowerCase();
      document.querySelectorAll('.comp-item').forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
    
    document.querySelectorAll('.comp-item').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.dataset.component;
        if (type && this.engine.selectedObject) {
          this.engine.addComponentToSelected(type);
          popup?.classList.add('hidden');
        }
      });
    });
  }
  
  _setupQualitySelect() {
    document.getElementById('render-quality')?.addEventListener('change', e => {
      this.engine.renderer.quality = e.target.value;
    });
  }
  
  _setupSceneOverlay() {
    document.getElementById('btn-persp')?.addEventListener('click', () => {
      this.engine.renderer.editorCamera.orthographic = !this.engine.renderer.editorCamera.orthographic;
      document.getElementById('btn-persp').textContent = this.engine.renderer.editorCamera.orthographic ? 'O' : 'P';
    });
    
    document.getElementById('btn-wireframe')?.addEventListener('click', () => {
      this.engine.renderer.showWireframe = !this.engine.renderer.showWireframe;
      document.getElementById('btn-wireframe')?.classList.toggle('active', this.engine.renderer.showWireframe);
    });
    
    document.getElementById('btn-shaded')?.addEventListener('click', () => {
      this.engine.renderer.showWireframe = false;
      document.getElementById('btn-wireframe')?.classList.remove('active');
    });
  }
  
  _setupLightingModal() {
    document.getElementById('btn-apply-lighting')?.addEventListener('click', () => {
      const engine = this.engine;
      const scene = engine.scene;
      if (!scene) return;
      scene.ambientColor = Color.fromHex(document.getElementById('ambient-color').value);
      scene.ambientIntensity = parseFloat(document.getElementById('ambient-intensity').value);
      scene.fogEnabled = document.getElementById('pp-fog').checked;
      scene.fogColor = Color.fromHex(document.getElementById('fog-color').value);
      scene.fogDensity = parseFloat(document.getElementById('fog-density').value);
      const topHex = document.getElementById('ambient-color').value;
      scene.skyboxTopColor = Color.fromHex(topHex);
      engine.notification('Iluminação aplicada!', 'success');
      document.getElementById('lighting-modal').classList.add('hidden');
    });
    
    document.getElementById('btn-close-lighting')?.addEventListener('click', () => {
      document.getElementById('lighting-modal').classList.add('hidden');
    });
  }
  
  _setupBuildModal() {
    document.getElementById('btn-build-export')?.addEventListener('click', () => {
      this.engine.executeAction('export-project');
    });
    
    document.getElementById('btn-close-build')?.addEventListener('click', () => {
      document.getElementById('build-modal').classList.add('hidden');
    });
  }
  
  _setupPreferences() {
    // Populate prefs form with saved values when modal opens
    document.getElementById('preferences-modal')?.addEventListener('transitionend', () => {}, { once: false });
    
    // Open prefs modal: populate fields from saved credentials
    const prefModal = document.getElementById('preferences-modal');
    if (prefModal) {
      const observer = new MutationObserver(() => {
        if (!prefModal.classList.contains('hidden')) {
          this.engine.loadPreferences();
        }
      });
      observer.observe(prefModal, { attributes: true, attributeFilter: ['class'] });
    }

    document.getElementById('btn-save-prefs')?.addEventListener('click', () => {
      this.engine.savePreferences();
      document.getElementById('preferences-modal')?.classList.add('hidden');
    });

    document.getElementById('btn-close-prefs')?.addEventListener('click', () => {
      document.getElementById('preferences-modal')?.classList.add('hidden');
    });
  }
}


/* ===== js/ui/resize.js ===== */
/**
 * WebGL Engine - Panel Resize Handles
 */
class ResizeSystem {
  constructor() {
    this._setupHandles();
  }
  
  _setupHandles() {
    const leftHandle = document.getElementById('resize-left');
    const rightHandle = document.getElementById('resize-right');
    const bottomHandle = document.getElementById('resize-bottom');
    
    this._setupHorizontalResize(leftHandle, 'hierarchy-panel', true);
    this._setupHorizontalResize(rightHandle, 'inspector-panel', false);
    this._setupVerticalResize(bottomHandle, 'bottom-panel');
  }
  
  _setupHorizontalResize(handle, panelId, isLeft) {
    if (!handle) return;
    let dragging = false, startX = 0, startW = 0;
    
    handle.addEventListener('mousedown', e => {
      dragging = true;
      startX = e.clientX;
      const panel = document.getElementById(panelId);
      startW = panel ? panel.offsetWidth : 220;
      document.body.style.cursor = 'ew-resize';
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const panel = document.getElementById(panelId);
      if (!panel) return;
      const newW = isLeft ? startW + dx : startW - dx;
      const clamped = Math.max(100, Math.min(500, newW));
      panel.style.width = clamped + 'px';
      // Update handle position
      if (handle) {
        if (isLeft) handle.style.left = clamped + 'px';
        else handle.style.right = clamped + 'px';
      }
    });
    
    document.addEventListener('mouseup', () => {
      if (dragging) { dragging = false; document.body.style.cursor = ''; }
    });
  }
  
  _setupVerticalResize(handle, panelId) {
    if (!handle) return;
    let dragging = false, startY = 0, startH = 0;
    
    handle.addEventListener('mousedown', e => {
      dragging = true;
      startY = e.clientY;
      const panel = document.getElementById(panelId);
      startH = panel ? panel.offsetHeight : 180;
      document.body.style.cursor = 'ns-resize';
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      const dy = e.clientY - startY;
      const panel = document.getElementById(panelId);
      if (!panel) return;
      const newH = startH - dy;
      const clamped = Math.max(80, Math.min(400, newH));
      panel.style.height = clamped + 'px';
      if (handle) handle.style.bottom = clamped + 'px';
    });
    
    document.addEventListener('mouseup', () => {
      if (dragging) { dragging = false; document.body.style.cursor = ''; }
    });
  }
}


/* ===== js/ui/mobile.js ===== */
/**
 * WebGL Engine - Mobile UI Controls
 */
class MobileUI {
  constructor() {
    this._joystickActive = false;
    this._joystickId = -1;
    this._joystickCenter = { x: 0, y: 0 };
    this._setupJoystick();
    this._setupActionButtons();
    this._detectOrientation();
  }
  
  _setupJoystick() {
    const bg = document.getElementById('virtual-joystick-bg');
    const knob = document.getElementById('virtual-joystick-knob');
    if (!bg || !knob) return;
    
    const maxRadius = 30;
    
    bg.addEventListener('touchstart', e => {
      const t = e.targetTouches[0];
      const rect = bg.getBoundingClientRect();
      this._joystickCenter = { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
      this._joystickActive = true;
      this._joystickId = t.identifier;
      e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('touchmove', e => {
      if (!this._joystickActive) return;
      for (const touch of e.changedTouches) {
        if (touch.identifier === this._joystickId) {
          let dx = touch.clientX - this._joystickCenter.x;
          let dy = touch.clientY - this._joystickCenter.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist > maxRadius) { dx = dx/dist*maxRadius; dy = dy/dist*maxRadius; }
          knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
          Input.setVirtualJoystick(dx/maxRadius, -dy/maxRadius);
          e.preventDefault();
        }
      }
    }, { passive: false });
    
    document.addEventListener('touchend', e => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this._joystickId) {
          this._joystickActive = false;
          this._joystickId = -1;
          knob.style.transform = 'translate(-50%, -50%)';
          Input.clearVirtualJoystick();
        }
      }
    });
  }
  
  _setupActionButtons() {
    document.querySelectorAll('.action-btn').forEach(btn => {
      const key = btn.dataset.key;
      btn.addEventListener('touchstart', e => { Input._keys[key] = true; Input._keysDown[key] = true; e.preventDefault(); }, { passive: false });
      btn.addEventListener('touchend', e => { Input._keys[key] = false; Input._keysUp[key] = true; e.preventDefault(); }, { passive: false });
    });
  }
  
  _detectOrientation() {
    const check = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      // Show landscape hint on portrait mobile
      if (isPortrait && /Mobi|Android/i.test(navigator.userAgent)) {
        // Could show rotation hint
      }
    };
    window.addEventListener('orientationchange', check);
    window.addEventListener('resize', check);
    check();
  }
  
  showMobileControls(show) {
    const controls = document.getElementById('mobile-controls');
    if (controls) {
      if (show) controls.classList.remove('hidden');
      else controls.classList.add('hidden');
    }
  }
  
  isMobile() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }
}


/* ===== js/main.js ===== */
/**
 * WebGL Engine - Main Entry Point
 * Ties everything together and boots the engine
 */

class Engine {
  constructor() {
    this.scene = null;
    this.selectedObject = null;
    this.selectedAsset = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentView = 'scene';
    this.assets = [];
    this.projects = [];
    this.currentProject = null;
    this.snapEnabled = false;
    this._collapsed = new Set();
    this._undoStack = [];
    this._redoStack = [];
    this._stepFrame = false;

    // Systems
    this.renderer = null;
    this.gameRenderer = null;
    this.physics = new PhysicsWorld();
    this.scriptingEngine = new ScriptingEngine();
    this.lightingSystem = new LightingSystem();

    // Editor panels
    this.hierarchy = null;
    this.inspector = null;
    this.projectPanel = null;
    this.timeline = null;
    this.animatorEditor = null;
    this.shaderGraph = null;
    this.modeler = null;
    this.gizmos = null;
    this.menus = null;
    this.mobileUI = null;

    this._lastTime = 0;
    this._animFrame = null;

    // Console bridge
    this.editorConsole = {
      log: (...a) => this._consoleLog('log', ...a),
      warn: (...a) => this._consoleLog('warn', ...a),
      error: (...a) => this._consoleLog('error', ...a),
    };

    const origLog = console.log.bind(console);
    const origWarn = console.warn.bind(console);
    const origError = console.error.bind(console);
    console.log = (...a) => { origLog(...a); this._consoleLog('log', ...a); };
    console.warn = (...a) => { origWarn(...a); this._consoleLog('warn', ...a); };
    console.error = (...a) => { origError(...a); this._consoleLog('error', ...a); };

    window.engine = this;
    window.Engine = { scene: null, instantiate: (p, pos, rot) => this.instantiate(p, pos, rot) };
    window.Time = Time;
  }

  async init() {
    this._showStartupScreen();
  }

  _showStartupScreen() {
    const startup = document.getElementById('startup-screen');
    const editor = document.getElementById('editor');
    if (startup) startup.style.display = 'flex';
    if (editor) editor.classList.add('hidden');
    this._loadProjects().then ? this._loadProjects() : this._loadProjects();
    this._setupStartupUI();
  }

  _setupStartupUI() {
    document.getElementById('btn-new-project')?.addEventListener('click', () => {
      document.getElementById('new-project-dialog')?.classList.remove('hidden');
    });

    document.getElementById('btn-cancel-project')?.addEventListener('click', () => {
      document.getElementById('new-project-dialog')?.classList.add('hidden');
    });

    document.getElementById('btn-create-project')?.addEventListener('click', () => {
      const name = document.getElementById('project-name')?.value.trim() || 'MeuProjeto';
      const template = document.getElementById('project-template')?.value || '3d';
      this._createProject(name, template);
      document.getElementById('new-project-dialog')?.classList.add('hidden');
    });

    document.getElementById('btn-open-project')?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,.wgproj';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          const text = await file.text();
          try {
            const data = JSON.parse(text);
            this._loadProjectData(data);
          } catch (err) {
            alert('Arquivo de projeto inválido');
          }
        }
      };
      input.click();
    });

    document.getElementById('btn-github-connect')?.addEventListener('click', async () => {
      const token = document.getElementById('github-token')?.value.trim();
      const user = document.getElementById('github-user')?.value.trim();
      const repo = document.getElementById('github-repo')?.value.trim();
      const folder = document.getElementById('github-folder')?.value.trim() || '';
      if (token && user && repo) {
        GitHub.configure(token, user, repo, folder);
        const creds = { token, user, repo, folder };
        Storage.saveGitHubCreds(creds);
        try { localStorage.setItem('wge-github', JSON.stringify(creds)); } catch(e) {}
        
        // Try to load project from GitHub
        this.notification('GitHub conectado! Verificando projeto...', 'success');
        try {
          const ghProj = await GitHub.loadProject();
          if (ghProj) {
            if (confirm(`Projeto encontrado no GitHub: "${ghProj.name}". Carregar agora?`)) {
              this._loadProjectData(ghProj);
              return;
            }
          }
        } catch(e) {}
        alert('GitHub conectado: ' + user + '/' + repo);
      } else {
        alert('Preencha Token, Usuário e Repositório');
      }
    });

    // Restore saved GitHub credentials (localStorage is fine for small creds)
    try {
      const creds = Storage.loadGitHubCreds() || JSON.parse(localStorage.getItem('wge-github') || 'null');
      if (creds && creds.token) {
        if (document.getElementById('github-token')) document.getElementById('github-token').value = creds.token;
        if (document.getElementById('github-user')) document.getElementById('github-user').value = creds.user || '';
        if (document.getElementById('github-repo')) document.getElementById('github-repo').value = creds.repo || '';
        if (document.getElementById('github-folder')) document.getElementById('github-folder').value = creds.folder || '';
        GitHub.configure(creds.token, creds.user, creds.repo, creds.folder);
      }
    } catch (e) {}
  }

  async _loadProjects() {
    try {
      this.projects = await Storage.listProjects();
    } catch (e) {
      try { this.projects = JSON.parse(localStorage.getItem('wge-projects') || '[]'); } catch(e2) { this.projects = []; }
    }

    const list = document.getElementById('recent-projects-list');
    if (!list) return;
    list.innerHTML = '';

    if (this.projects.length === 0) {
      list.innerHTML = '<div style="color:#555;font-size:12px;padding:20px;text-align:center;">Nenhum projeto recente</div>';
      return;
    }

    for (const proj of this.projects.slice(0, 10)) {
      const item = document.createElement('div');
      item.className = 'project-item';

      const info = document.createElement('div');
      info.innerHTML = `<div class="project-name">${proj.name}</div><div class="project-meta">${proj.template || '3d'} &bull; ${new Date(proj.lastModified || Date.now()).toLocaleDateString()}</div>`;
      
      const delBtn = document.createElement('button');
      delBtn.title = 'Excluir projeto';
      delBtn.textContent = '🗑';
      delBtn.style.cssText = 'background:none;border:none;color:#e74c3c;cursor:pointer;font-size:14px;padding:2px 6px;border-radius:3px;flex-shrink:0;';
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Excluir projeto "${proj.name}"? Esta ação não pode ser desfeita.`)) {
          await Storage.deleteProject(proj.name);
          await this._loadProjects();
        }
      });
      delBtn.addEventListener('mouseover', () => delBtn.style.background = 'rgba(231,76,60,0.15)');
      delBtn.addEventListener('mouseout', () => delBtn.style.background = 'none');

      item.style.cssText += 'display:flex;align-items:center;justify-content:space-between;';
      item.appendChild(info);
      item.appendChild(delBtn);
      info.addEventListener('click', () => this._openProjectByName(proj.name));
      list.appendChild(item);
    }
  }

  async _openProjectByName(name) {
    const proj = await Storage.loadProject(name);
    if (proj) {
      this._loadProjectData(proj);
    } else {
      // Fallback: use lightweight index entry
      const entry = this.projects.find(p => p.name === name);
      if (entry) this._loadProjectData(entry);
      else alert('Projeto não encontrado no armazenamento local.');
    }
  }

  async _saveProjectLocally(project) {
    if (!project) return;
    project.lastModified = Date.now();
    try {
      await Storage.saveProject(project);
    } catch (e) {
      // Fallback localStorage
      try {
        const list = JSON.parse(localStorage.getItem('wge-projects') || '[]');
        const idx = list.findIndex(p => p.name === project.name);
        const entry = { name: project.name, lastModified: project.lastModified, template: project.template };
        if (idx >= 0) list[idx] = entry; else list.unshift(entry);
        localStorage.setItem('wge-projects', JSON.stringify(list.slice(0, 20)));
      } catch (e2) {}
    }
  }

  _createProject(name, template) {
    const scene = new Scene(name + '_Scene');

    // Build scene from template
    if (template === '3d' || template === 'platformer' || template === 'fps') {
      // Directional light
      const lightObj = new GameObject('Directional Light');
      lightObj.transform.setPosition(0, 5, 0);
      lightObj.transform.setRotation(-45, -45, 0);
      const light = new Light();
      light.lightType = 'directional';
      light.color = new Color(1, 0.95, 0.85);
      light.intensity = 1.2;
      lightObj.addComponent(light);
      scene.add(lightObj);

      // Main camera
      const camObj = new GameObject('Main Camera');
      camObj.transform.setPosition(0, 2, 8);
      camObj.transform.setRotation(-10, 0, 0);
      camObj.addComponent(new CameraComponent());
      scene.add(camObj);

      // Ground
      const ground = new GameObject('Ground');
      ground.transform.setPosition(0, -0.05, 0);
      ground.transform.setScale(20, 0.1, 20);
      const gmr = new MeshRenderer();
      gmr.meshName = 'Cube';
      gmr.material = new Material('Ground_Mat');
      gmr.material.color = new Color(0.45, 0.65, 0.3);
      gmr.material.roughness = 0.9;
      ground.addComponent(gmr);
      ground.addComponent(new BoxCollider());
      scene.add(ground);

      // Sample cube
      const cube = new GameObject('Cube');
      cube.transform.setPosition(0, 0.5, 0);
      const cmr = new MeshRenderer();
      cmr.meshName = 'Cube';
      cmr.material = new Material('Cube_Mat');
      cmr.material.color = new Color(0.6, 0.3, 0.9);
      cmr.material.roughness = 0.4;
      cmr.material.metallic = 0.1;
      cube.addComponent(cmr);
      scene.add(cube);

      if (template === 'fps') {
        // Add FPS player controller
        const player = new GameObject('Player');
        player.transform.setPosition(0, 1, 3);
        player.addComponent(new Rigidbody());
        player.addComponent(new CapsuleCollider());
        scene.add(player);
      }
    } else if (template === '2d') {
      // Orthographic camera
      const camObj = new GameObject('Main Camera');
      camObj.transform.setPosition(0, 0, 5);
      const cam = new CameraComponent();
      cam.orthographic = true;
      cam.orthoSize = 5;
      camObj.addComponent(cam);
      scene.add(camObj);

      // Sprite-like quad
      const quad = new GameObject('Sprite');
      const qmr = new MeshRenderer();
      qmr.meshName = 'Quad';
      qmr.material = new Material('Sprite_Mat');
      qmr.material.color = new Color(1, 0.5, 0.1);
      quad.addComponent(qmr);
      scene.add(quad);
    }

    const project = {
      name, template, version: '1.0',
      lastModified: Date.now(),
      scene: scene.serialize(),
      assets: [],
      settings: { quality: 'medium', gravity: [0, -9.81, 0] }
    };

    this.currentProject = project;
    this._openEditor(scene, project);
    this._saveProjectLocally(project); // async, fire and forget
  }

  _loadProjectData(data) {
    this.currentProject = data;
    let scene;
    try {
      scene = data.scene ? Scene.deserialize(data.scene) : new Scene(data.name || 'Scene');
    } catch (e) {
      scene = new Scene(data.name || 'Scene');
      console.error('Failed to deserialize scene:', e);
    }
    this.assets = data.assets || [];
    this._openEditor(scene, data);
  }

  _openEditor(scene, project) {
    this.scene = scene;
    window.Engine.scene = scene;

    const startup = document.getElementById('startup-screen');
    const editor = document.getElementById('editor');
    if (startup) startup.style.display = 'none';
    if (editor) editor.classList.remove('hidden');

    if (!this.renderer) {
      this._initEditorSystems();
    } else {
      // Re-render with new scene
      this.hierarchy.render(scene);
      this.projectPanel.render();
    }

    // Select first object
    if (scene.objects.length > 0) {
      this.selectObject(scene.objects[0]);
    } else {
      this.inspector.render(null);
    }

    document.title = project.name + ' - WebGL Engine';
    // Restore every UI state after systems are ready
    if (project.editorState) {
      // Defer slightly so renderer is fully initialized
      requestAnimationFrame(() => this.restoreEditorState(project.editorState));
    }
    this.notification('Projeto "' + project.name + '" aberto!', 'success');
  }

  _initEditorSystems() {
    const sceneCanvas = document.getElementById('scene-canvas');
    const gameCanvas = document.getElementById('game-canvas');

    if (!sceneCanvas || !gameCanvas) {
      console.error('Canvas elements not found!');
      return;
    }

    this.renderer = new Renderer(sceneCanvas, false);
    this.gameRenderer = new Renderer(gameCanvas, true);

    this.hierarchy = new HierarchyPanel(this);
    this.inspector = new InspectorPanel(this);
    this.projectPanel = new ProjectPanel(this);
    this.timeline = new TimelineEditor(this);
    this.animatorEditor = new AnimatorEditor(this);
    this.shaderGraph = new ShaderGraphEditor(this);
    this.modeler = new ModelerEditor(this);
    this.gizmos = new GizmoRenderer(this);
    this.menus = new MenuSystem(this);
    this.mobileUI = new MobileUI();
    new ResizeSystem();

    this._setupSceneViewInteraction();
    this._setupAssetImport();
    this._addDefaultAssets();
    this._setupGlobalButtons();
    this.loadPreferences();

    this.hierarchy.render(this.scene);
    this.projectPanel.render();

    // Start render loop
    this._startLoop();
  }

  _addDefaultAssets() {
    this.assets.push({ type: 'script', name: 'PlayerController', content: DEFAULT_SCRIPT_TEMPLATE });
    // Preload script
    this.scriptingEngine.loadScript('PlayerController', DEFAULT_SCRIPT_TEMPLATE);
    this.projectPanel.render();
  }

  _setupGlobalButtons() {
    // Tool buttons (Q=select, W=move, E=rotate, R=scale)
    const toolMap = {
      'btn-tool-select': 'select',
      'btn-tool-move':   'move',
      'btn-tool-rotate': 'rotate',
      'btn-tool-scale':  'scale',
    };
    for (const [btnId, toolName] of Object.entries(toolMap)) {
      document.getElementById(btnId)?.addEventListener('click', () => this._setTool(toolName));
    }
    // Also support data-tool attribute buttons
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => this._setTool(btn.dataset.tool));
    });

    // Console
    document.getElementById('btn-clear-console')?.addEventListener('click', () => {
      const out = document.getElementById('console-output');
      if (out) out.innerHTML = '';
    });

    // Hierarchy add
    document.getElementById('btn-hierarchy-add')?.addEventListener('click', (e) => {
      e.stopPropagation();
      // Show create menu
      const actions = [
        ['Empty Object', 'create-empty'],
        ['Cube', 'create-cube'],
        ['Sphere', 'create-sphere'],
        ['Plane', 'create-plane'],
        ['Cylinder', 'create-cylinder'],
        ['Capsule', 'create-capsule'],
        ['Directional Light', 'create-dir-light'],
        ['Point Light', 'create-point-light'],
        ['Camera', 'create-camera'],
        ['Particle System', 'create-particles'],
      ];
      this._showContextMenu(e.clientX, e.clientY, actions);
    });

    // View buttons
    document.getElementById('btn-persp')?.addEventListener('click', () => {
      this.renderer.editorCamera.orthographic = !this.renderer.editorCamera.orthographic;
      document.getElementById('btn-persp').textContent = this.renderer.editorCamera.orthographic ? 'Ortho' : 'Persp';
    });

    document.getElementById('btn-wireframe')?.addEventListener('click', () => {
      this.renderer.showWireframe = !this.renderer.showWireframe;
    });

    document.getElementById('btn-shaded')?.addEventListener('click', () => {
      this.renderer.showWireframe = false;
    });

    // Reference grid toggle button (scene overlay)
    const btnGrid = document.getElementById('btn-toggle-grid');
    btnGrid?.addEventListener('click', () => {
      this.renderer.showGrid = !this.renderer.showGrid;
      btnGrid.classList.toggle('active', this.renderer.showGrid);
      this.notification(this.renderer.showGrid ? 'Grade: Ativada' : 'Grade: Desativada');
    });

    // Skybox toggle button
    const btnSkybox = document.getElementById('btn-toggle-skybox');
    btnSkybox?.addEventListener('click', () => {
      this.renderer.showSkybox = !this.renderer.showSkybox;
      btnSkybox.classList.toggle('active', this.renderer.showSkybox);
      this.notification(this.renderer.showSkybox ? 'Skybox: Ativo' : 'Skybox: Desativado');
    });

    // Script editor modal
    document.getElementById('btn-close-script')?.addEventListener('click', () => {
      document.getElementById('script-editor-modal')?.classList.add('hidden');
    });

    document.getElementById('btn-compile')?.addEventListener('click', () => {
      this._compileCurrentScript();
    });

    document.getElementById('btn-save-script')?.addEventListener('click', () => {
      this._saveCurrentScript();
    });

    // Shader code editor
    document.getElementById('btn-close-shader-code')?.addEventListener('click', () => {
      document.getElementById('shader-code-modal')?.classList.add('hidden');
    });

    document.getElementById('btn-compile-glsl')?.addEventListener('click', () => {
      this.shaderGraph._compileGLSL();
    });

    // Lighting modal
    document.getElementById('btn-apply-lighting')?.addEventListener('click', () => {
      this._applyLighting();
    });
    document.getElementById('btn-close-lighting')?.addEventListener('click', () => {
      document.getElementById('lighting-modal')?.classList.add('hidden');
    });

    // Build modal
    document.getElementById('btn-build-export')?.addEventListener('click', () => {
      this._exportProject();
    });
    document.getElementById('btn-close-build')?.addEventListener('click', () => {
      document.getElementById('build-modal')?.classList.add('hidden');
    });

    // Preferences
    document.getElementById('btn-save-prefs')?.addEventListener('click', () => {
      this.savePreferences();
      document.getElementById('preferences-modal')?.classList.add('hidden');
    });
    document.getElementById('btn-close-prefs')?.addEventListener('click', () => {
      document.getElementById('preferences-modal')?.classList.add('hidden');
    });

    // Add component popup
    document.getElementById('btn-add-component')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const popup = document.getElementById('add-component-popup');
      popup?.classList.toggle('hidden');
      document.getElementById('component-search')?.focus();
    });

    document.getElementById('component-search')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.comp-item').forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });

    document.querySelectorAll('.comp-item').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.dataset.component;
        if (type && this.selectedObject) {
          this.addComponentToSelected(type);
          document.getElementById('add-component-popup')?.classList.add('hidden');
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#add-component-popup') && !e.target.closest('#btn-add-component')) {
        document.getElementById('add-component-popup')?.classList.add('hidden');
      }
    });

    // Import asset button
    document.querySelector('[data-action="import-asset"]')?.addEventListener('click', () => {
      this._showImportAssetDialog();
    });

    // Resolution selector game view
    document.getElementById('resolution-selector')?.addEventListener('change', (e) => {
      const [w, h] = e.target.value.split('x').map(Number);
      const canvas = document.getElementById('game-canvas');
      if (canvas && w && h) { canvas.width = w; canvas.height = h; }
    });

    // Model mode buttons
    document.querySelectorAll('.model-btn[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.model-btn[data-mode]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Keyboard shortcuts
    this._setupKeyboardShortcuts();
  }

  _showContextMenu(x, y, actions) {
    const existing = document.getElementById('engine-ctx-menu');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.id = 'engine-ctx-menu';
    menu.style.cssText = `position:fixed;left:${x}px;top:${y}px;background:#2a2a2a;border:1px solid #444;border-radius:4px;z-index:10000;min-width:180px;box-shadow:0 4px 12px rgba(0,0,0,0.5);`;

    for (const [label, action] of actions) {
      const item = document.createElement('div');
      item.textContent = label;
      item.style.cssText = 'padding:6px 12px;cursor:pointer;font-size:12px;color:#ddd;';
      item.addEventListener('mouseover', () => item.style.background = '#3a3a5a');
      item.addEventListener('mouseout', () => item.style.background = '');
      item.addEventListener('click', () => { this.executeAction(action); menu.remove(); });
      menu.appendChild(item);
    }

    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 0);
  }

  _setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's': this._saveScene(); e.preventDefault(); break;
          case 'z': this.undo(); e.preventDefault(); break;
          case 'y': this.redo(); e.preventDefault(); break;
          case 'd': this._duplicateSelected(); e.preventDefault(); break;
          case 'n': this._newScene(); e.preventDefault(); break;
        }
        return;
      }

      switch (e.code) {
        case 'KeyQ': this._setTool('select'); break;
        case 'KeyW': this._setTool('move'); break;
        case 'KeyE': this._setTool('rotate'); break;
        case 'KeyR': this._setTool('scale'); break;
        case 'KeyF':
          if (this.selectedObject) this.renderer.focusOnObject(this.selectedObject);
          break;
        case 'Delete': case 'Backspace':
          if (this.selectedObject && document.activeElement === document.body) { this._deleteSelected(); e.preventDefault(); }
          break;
        case 'KeyP': this.togglePlay(); break;
        case 'F2':
          if (this.selectedObject) {
            this.hierarchy._renaming = this.selectedObject.id;
            this.hierarchy.render(this.scene);
            e.preventDefault();
          }
          break;
        case 'Numpad1': this.renderer.editorCamera.yaw = 180; this.renderer.editorCamera.pitch = 0; break;
        case 'Numpad3': this.renderer.editorCamera.yaw = -90; this.renderer.editorCamera.pitch = 0; break;
        case 'Numpad7': this.renderer.editorCamera.pitch = -89; break;
        case 'Numpad5':
          this.renderer.editorCamera.orthographic = !this.renderer.editorCamera.orthographic;
          break;
      }
    });
  }

  _setTool(tool) {
    if (this.gizmos) this.gizmos.mode = tool;
    document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
    document.querySelector(`.tool-btn[data-tool="${tool}"]`)?.classList.add('active');
    this._scheduleSave();
  }

  _setupSceneViewInteraction() {
    const canvas = document.getElementById('scene-canvas');
    if (!canvas) return;

    let mouseButtons = {};
    let lastX = 0, lastY = 0;

    canvas.addEventListener('mousedown', (e) => {
      mouseButtons[e.button] = true;
      lastX = e.clientX;
      lastY = e.clientY;

      if (e.button === 0 && !e.altKey) {
        const consumed = this.gizmos?.handleMouseDown(e, this.renderer, this.scene);
        if (!consumed) {
          const r = canvas.getBoundingClientRect();
          const picked = this.renderer.pickObject(e.clientX - r.left, e.clientY - r.top, this.scene);
          if (picked) this.selectObject(picked);
          else if (!e.shiftKey) this.selectObject(null);
        }
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      if (this.gizmos?.handleMouseMove(e, this.renderer)) return;

      if (mouseButtons[2] || (mouseButtons[1] && !e.shiftKey)) {
        this.renderer.orbitCamera(dx, dy);
      } else if (mouseButtons[1] && e.shiftKey) {
        this.renderer.panCamera(dx, dy);
      } else if (mouseButtons[0] && e.altKey) {
        if (e.shiftKey) this.renderer.panCamera(dx, dy);
        else this.renderer.orbitCamera(dx, dy);
      }
    });

    canvas.addEventListener('mouseup', (e) => {
      mouseButtons[e.button] = false;
      this.gizmos?.handleMouseUp();
    });

    canvas.addEventListener('wheel', (e) => {
      this.renderer.zoomCamera(e.deltaY);
    }, { passive: true });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('dblclick', () => {
      if (this.selectedObject) this.renderer.focusOnObject(this.selectedObject);
    });

    // Touch: orbit with 1 finger, pinch to zoom, 2-finger pan
    let touches = {};
    let pinchDist = 0;

    canvas.addEventListener('touchstart', (e) => {
      for (const t of e.changedTouches) touches[t.identifier] = { x: t.clientX, y: t.clientY };
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        // Try gizmo first
        if (this.gizmos && !touch.force) {
          const fakeEvt = { clientX: touch.clientX, clientY: touch.clientY, altKey: false, touches: e.touches, button: 0 };
          const consumed = this.gizmos.handleMouseDown(fakeEvt, this.renderer, this.scene);
          if (consumed) { e.preventDefault(); return; }
        }
      }
      if (e.touches.length === 2) {
        const a = e.touches[0], b = e.touches[1];
        pinchDist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      }
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        // Try gizmo drag first
        if (this.gizmos?._dragging) {
          const fakeEvt = { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY, touches: e.touches };
          if (this.gizmos.handleMouseMove(fakeEvt, this.renderer)) { e.preventDefault(); return; }
        }
        const t = e.touches[0];
        const prev = touches[t.identifier];
        if (prev) {
          this.renderer.orbitCamera(t.clientX - prev.x, t.clientY - prev.y);
          touches[t.identifier] = { x: t.clientX, y: t.clientY };
        }
      } else if (e.touches.length === 2) {
        const a = e.touches[0], b = e.touches[1];
        const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
        this.renderer.zoomCamera((pinchDist - dist) * 3);
        pinchDist = dist;

        const cx = (a.clientX + b.clientX) / 2;
        const cy = (a.clientY + b.clientY) / 2;
        const pc = touches['_pan'] || { x: cx, y: cy };
        this.renderer.panCamera(cx - pc.x, cy - pc.y);
        touches['_pan'] = { x: cx, y: cy };
      }
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      for (const t of e.changedTouches) delete touches[t.identifier];
      delete touches['_pan'];
    });
  }

  _setupAssetImport() {
    // File drag-drop onto project panel
    const projectPanel = document.getElementById('project-panel');
    projectPanel?.addEventListener('dragover', (e) => { e.preventDefault(); projectPanel.style.outline = '2px dashed #4a9eff'; });
    projectPanel?.addEventListener('dragleave', () => { projectPanel.style.outline = ''; });
    projectPanel?.addEventListener('drop', (e) => {
      e.preventDefault();
      projectPanel.style.outline = '';
      for (const file of e.dataTransfer.files) this._importFile(file);
    });
  }

  _showImportAssetDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,.js,.glsl,.json,.mp3,.ogg,.wav,.fbx,.obj,.gltf,.glb';
    input.onchange = (e) => {
      for (const file of e.target.files) this._importFile(file);
    };
    input.click();
  }

  async _importFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    let type = 'other';
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) type = 'texture';
    else if (['js'].includes(ext)) type = 'script';
    else if (['mp3', 'ogg', 'wav'].includes(ext)) type = 'audio';
    else if (['json', 'gltf', 'glb', 'obj'].includes(ext)) type = 'model';
    else if (['glsl'].includes(ext)) type = 'shader';

    const baseName = file.name.replace(/\.[^.]+$/, '');

    if (type === 'texture') {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        if (this.renderer) {
          const tex = this.renderer.glCtx.loadTextureFromImage?.(img);
          this.assets.push({ type: 'texture', name: baseName, content: tex, url });
        } else {
          this.assets.push({ type: 'texture', name: baseName, content: null, url });
        }
        this.projectPanel.render();
        this.notification('Textura importada: ' + file.name);
      };
      img.src = url;
    } else if (type === 'audio') {
      const clip = await AudioEngine.loadClipFromFile(baseName, file).catch(() => null);
      this.assets.push({ type: 'audio', name: baseName, content: clip });
      this.projectPanel.render();
      this.notification('Áudio importado: ' + file.name);
    } else if (type === 'script') {
      const text = await file.text();
      this.assets.push({ type: 'script', name: baseName, content: text });
      this.scriptingEngine.loadScript(baseName, text);
      this.projectPanel.render();
      this.notification('Script importado: ' + file.name);
    } else {
      const text = await file.text().catch(() => null);
      this.assets.push({ type, name: baseName, content: text });
      this.projectPanel.render();
      this.notification('Asset importado: ' + file.name);
    }
  }

  _startLoop() {
    const loop = (now) => {
      const dt = Math.min((now - (this._lastTime || now)) / 1000, 0.1);
      this._lastTime = now;

      Time._time += dt;
      Time._deltaTime = dt;
      Time._frame = (Time._frame || 0) + 1;

      if (this.scene) {
        this.scene.update(dt);
        if (this.isPlaying && !this.isPaused) {
          this.physics.step(this.scene, dt);
        }
        if (this._stepFrame) {
          this.scene.isPlaying = false;
          this._stepFrame = false;
        }
      }

      // Scene view render
      this.renderer?.render(this.scene, dt);
      if (this.gizmos && this.renderer) this.gizmos.drawGizmos(this.renderer, this.scene);

      // Game view render (if active or playing)
      if (this.currentView === 'game' || this.isPlaying) {
        this.gameRenderer?.render(this.scene, dt);
      }

      // Timeline update
      if (this.currentView === 'timeline') this.timeline?.update(dt);

      // FPS display
      this._fpsAccum = (this._fpsAccum || 0) + dt;
      if (this._fpsAccum > 0.5) {
        this._fpsAccum = 0;
        const fpsEl = document.getElementById('fps-counter');
        if (fpsEl) fpsEl.textContent = (this.renderer?.fps || 0) + ' FPS';
        const objEl = document.getElementById('object-count');
        if (objEl) objEl.textContent = (this.scene?.getAllObjects().length || 0) + ' Objetos';
      }

      Input.lateUpdate();
      this._animFrame = requestAnimationFrame(loop);
    };
    this._animFrame = requestAnimationFrame(loop);
  }

  // ===== VIEW MANAGEMENT =====
  switchView(viewName) {
    this.currentView = viewName;

    document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.view-content').forEach(c => {
      c.classList.remove('active');
      c.classList.add('hidden');
    });

    const tab = document.querySelector(`.view-tab[data-view="${viewName}"]`);
    const content = document.getElementById(viewName + '-view');
    tab?.classList.add('active');
    if (content) { content.classList.remove('hidden'); content.classList.add('active'); }

    if (viewName === 'game' && this.isPlaying && this.mobileUI?.isMobile()) {
      this.mobileUI.showMobileControls(true);
    }
  }

  // ===== PLAY MODE =====
  togglePlay() {
    if (!this.isPlaying) this._startPlay();
    else this._stopPlay();
  }

  _startPlay() {
    if (!this.scene) return;
    AudioEngine.init();
    this.isPlaying = true;
    this.scene.play();
    const btn = document.getElementById('btn-play');
    if (btn) { btn.classList.add('playing'); btn.textContent = '⏹'; }
    const status = document.getElementById('game-status');
    if (status) status.style.display = 'none';
    this.switchView('game');
    if (this.mobileUI?.isMobile()) this.mobileUI.showMobileControls(true);
    this.notification('▶ Play Mode', 'success');
  }

  _stopPlay() {
    this.isPlaying = false;
    this.isPaused = false;
    this.scene?.stop();
    const btn = document.getElementById('btn-play');
    if (btn) { btn.classList.remove('playing'); btn.textContent = '▶'; }
    const status = document.getElementById('game-status');
    if (status) { status.style.display = 'block'; status.textContent = 'Pressione Play para iniciar'; }
    this.mobileUI?.showMobileControls(false);
    this.switchView('scene');
    this.hierarchy?.render(this.scene);
    if (this.selectedObject) {
      const found = this.scene?.findById(this.selectedObject.id);
      this.selectedObject = found || null;
      this.inspector?.render(this.selectedObject);
    }
    this.notification('⏹ Editor Mode');
  }

  // ===== OBJECT SELECTION =====
  selectObject(obj) {
    this.selectedObject = obj;
    this.hierarchy?.selectItem(obj);
    this.inspector?.render(obj);
    if (this.renderer) this.renderer.selectedObject = obj;
    this._scheduleSave();
  }

  selectAsset(asset) { this.selectedAsset = asset; }

  // ===== ACTION DISPATCH =====
  executeAction(action) {
    switch (action) {
      // File
      case 'new-scene': this._newScene(); break;
      case 'save-scene': this._saveScene(); break;
      case 'save-scene-as': this._saveSceneAs(); break;
      case 'export-project': document.getElementById('build-modal')?.classList.remove('hidden'); break;
      case 'save-github': this._saveToGitHub(); break;
      case 'exit': this._showStartupScreen(); break;
      case 'import-asset': this._showImportAssetDialog(); break;
      // Edit
      case 'undo': this.undo(); break;
      case 'redo': this.redo(); break;
      case 'duplicate': this._duplicateSelected(); break;
      case 'delete': this._deleteSelected(); break;
      case 'rename-object':
        if (this.selectedObject) { this.hierarchy._renaming = this.selectedObject.id; this.hierarchy.render(this.scene); }
        break;
      case 'select-all': break;
      // GameObject
      case 'create-empty': this._createObject('Empty Object'); break;
      case 'create-cube': this._createMesh('Cube'); break;
      case 'create-sphere': this._createMesh('Sphere'); break;
      case 'create-plane': this._createMesh('Plane'); break;
      case 'create-cylinder': this._createMesh('Cylinder'); break;
      case 'create-capsule': this._createMesh('Capsule'); break;
      case 'create-quad': this._createMesh('Quad'); break;
      case 'create-torus': this._createMesh('Torus'); break;
      case 'create-dir-light': this._createLight('directional'); break;
      case 'create-point-light': this._createLight('point'); break;
      case 'create-spot-light': this._createLight('spot'); break;
      case 'create-area-light': this._createLight('area'); break;
      case 'create-camera': this._createCameraObj(); break;
      case 'create-particles': this._createParticles(); break;
      // Assets
      case 'create-script': this._createScript(); break;
      case 'create-material': this._createMaterial(); break;
      case 'create-shader': this._createShader(); break;
      // Components
      case 'add-rigidbody': this.addComponentToSelected('Rigidbody'); break;
      case 'add-collider-box': this.addComponentToSelected('BoxCollider'); break;
      case 'add-collider-sphere': this.addComponentToSelected('SphereCollider'); break;
      case 'add-script': this._createAndAddScript(); break;
      case 'add-animator': this.addComponentToSelected('Animator'); break;
      case 'add-audio': this.addComponentToSelected('AudioSource'); break;
      case 'add-camera': this.addComponentToSelected('Camera'); break;
      case 'create-anim': { const n = prompt('Nome do AnimationClip:') || 'Clip'; this.assets.push({type:'animation',name:n,content:{}}); this.projectPanel?.render(); this.notification('AnimationClip criado: '+n); } break;
      case 'create-canvas': this._createObject('Canvas UI'); break;
      case 'create-folder': this.notification('Pasta criada'); break;
      case 'refresh': this.projectPanel?.render(); this.hierarchy?.render(this.scene); break;
      case 'cut': case 'copy': case 'paste': break;
      case 'open-scene': break;
      case 'show-hierarchy': document.querySelector('.panel-tabs .tab[data-panel="hierarchy"]')?.click(); break;
      case 'documentation': window.open('https://github.com', '_blank'); break;
      case 'about': this.notification('WebGL Engine v1.0 - Powered by Anthropic Claude'); break;
      // Window
      case 'show-scene': this.switchView('scene'); break;
      case 'show-game': this.switchView('game'); break;
      case 'show-animator': this.switchView('animator'); break;
      case 'show-shader-editor': this.switchView('shader-editor'); break;
      case 'show-lighting': document.getElementById('lighting-modal')?.classList.remove('hidden'); break;
      case 'build-settings': document.getElementById('build-modal')?.classList.remove('hidden'); break;
      case 'preferences': document.getElementById('preferences-modal')?.classList.remove('hidden'); break;
      case 'show-console':
        document.querySelector('.bottom-tab[data-tab="console"]')?.click();
        break;
      case 'show-project':
        document.querySelector('.bottom-tab[data-tab="project"]')?.click();
        break;
    }
  }

  // ===== OBJECT CREATION =====
  _createObject(name) {
    this._saveUndoState();
    const obj = new GameObject(name || 'GameObject');
    // Always start at world origin
    obj.transform.setPosition(0, 0, 0);
    obj.transform.setRotation(0, 0, 0);
    obj.transform.setScale(1, 1, 1);
    this.scene.add(obj);
    this.hierarchy.render(this.scene);
    this.selectObject(obj);           // Auto-select new object
    this._scheduleSave();
    return obj;
  }

  _createMesh(meshType) {
    const obj = this._createObject(meshType);
    const mr = new MeshRenderer();
    mr.mesh = this.renderer?.getMesh(meshType);
    mr.meshName = meshType;
    mr.material = new Material(meshType + '_Mat');
    mr.material.color = new Color(0.7, 0.7, 0.75);
    mr.material.roughness = 0.5;
    mr.material.metallic = 0.0;
    obj.addComponent(mr);
    this.inspector?.render(obj);
    // Focus editor camera on new object
    if (this.renderer) this.renderer.focusOnObject(obj);
    return obj;
  }

  _createLight(type) {
    const names = { directional: 'Directional Light', point: 'Point Light', spot: 'Spot Light', area: 'Area Light' };
    const obj = this._createObject(names[type] || 'Light');
    // Lights start at origin (0,0,0) - user can position afterwards
    const light = new Light();
    light.lightType = type;
    obj.addComponent(light);
    this.inspector?.render(obj);
    if (this.renderer) this.renderer.focusOnObject(obj);
    return obj;
  }

  _createCameraObj() {
    const obj = this._createObject('Camera');
    obj.addComponent(new CameraComponent());
    this.inspector?.render(obj);
    return obj;
  }

  _createParticles() {
    const obj = this._createObject('Particle System');
    obj.addComponent(new ParticleSystem());
    this.inspector.render(obj);
    return obj;
  }

  addComponentToSelected(type) {
    if (!this.selectedObject) { this.notification('Selecione um objeto primeiro', 'warning'); return; }
    this._saveUndoState();

    let comp;
    const typeMap = {
      'Rigidbody': Rigidbody, 'BoxCollider': BoxCollider, 'SphereCollider': SphereCollider,
      'CapsuleCollider': CapsuleCollider, 'MeshCollider': MeshCollider, 'Light': Light,
      'Camera': CameraComponent, 'Animator': Animator, 'AudioSource': AudioSource,
      'ParticleSystem': ParticleSystem,
    };

    if (type === 'MeshRenderer') {
      comp = new MeshRenderer();
      comp.mesh = this.renderer.getMesh('Cube');
      comp.meshName = 'Cube';
      comp.material = new Material('Material');
    } else if (type === 'Script') {
      const scriptName = prompt('Nome do script:') || 'MyScript';
      this._createScript(scriptName);
      const Cls = this.scriptingEngine.getScriptClass(scriptName);
      comp = Cls ? new Cls() : new ScriptComponent(scriptName);
    } else if (typeMap[type]) {
      comp = new typeMap[type]();
    } else {
      const Cls = this.scriptingEngine.getScriptClass(type);
      if (Cls) comp = new Cls();
      else { this.notification('Tipo desconhecido: ' + type, 'error'); return; }
    }

    if (comp) {
      this.selectedObject.addComponent(comp);
      this.inspector.render(this.selectedObject);
      this.notification('Adicionado: ' + comp.type);
    }
  }

  instantiate(prefab, position, rotation) {
    let obj;
    if (typeof prefab === 'string') obj = this._createMesh(prefab);
    else if (prefab instanceof GameObject) {
      const data = prefab.serialize();
      data.id = generateId();
      obj = GameObject.deserialize(data, this.scene);
      this.scene.add(obj);
    } else {
      obj = new GameObject('Instance');
      this.scene.add(obj);
    }
    if (position) obj.transform.setPosition(position);
    if (rotation) obj.transform.setRotation(rotation);
    this.hierarchy?.render(this.scene);
    return obj;
  }

  // ===== EDIT OPS =====
  _duplicateSelected() {
    if (!this.selectedObject) return;
    this._saveUndoState();
    const data = this.selectedObject.serialize();
    data.name += ' (Copy)';
    data.id = generateId();
    const copy = GameObject.deserialize(data, this.scene);
    copy.transform.position.x += 1;
    copy.transform.markDirty();
    this.scene.add(copy);
    this.hierarchy.render(this.scene);
    this.selectObject(copy);
    this._scheduleSave();
  }

  _deleteSelected() {
    if (!this.selectedObject) return;
    if (!confirm('Deletar "' + this.selectedObject.name + '"?')) return;
    this._saveUndoState();
    this.scene.remove(this.selectedObject);
    this.selectObject(null);
    this.hierarchy.render(this.scene);
    this._scheduleSave();
  }

  // ===== SCENE MANAGEMENT =====
  _newScene() {
    if (confirm('Criar nova cena? Alterações não salvas serão perdidas.')) {
      this.scene = new Scene('New Scene');
      window.Engine.scene = this.scene;
      this.selectObject(null);
      this.hierarchy.render(this.scene);
      this.notification('Nova cena criada');
    }
  }

  async _saveScene() {
    if (!this.currentProject) {
      this.currentProject = { name: 'Projeto', template: '3d', version: '1.0', lastModified: Date.now() };
    }
    this.currentProject.scene = this.scene?.serialize();
    this.currentProject.assets = (this.assets || []).map(a => ({
      type: a.type, name: a.name,
      content: (a.content && typeof a.content !== 'object') ? a.content : null,
      url: a.url || null,
    }));
    this.currentProject.lastModified = Date.now();

    // Save to IndexedDB (offline) 
    await this._saveProjectLocally(this.currentProject);

    // Also save to GitHub if connected
    if (GitHub.connected) {
      try {
        await GitHub.saveProject(this.currentProject);
        this.notification('Salvo localmente e no GitHub! ✓', 'success');
      } catch (e) {
        this.notification('Salvo localmente. Erro GitHub: ' + e.message, 'warning');
      }
    } else {
      this.notification('Cena salva localmente! ✓', 'success');
    }
  }

  _saveSceneAs() {
    const name = prompt('Nome da cena:', this.scene?.name || 'Scene');
    if (!name) return;
    if (this.scene) this.scene.name = name;
    this._saveScene();
  }

  async _saveToGitHub() {
    if (!GitHub.connected) {
      this.notification('Configure o GitHub nas Preferências primeiro', 'warning');
      document.getElementById('preferences-modal')?.classList.remove('hidden');
      return;
    }
    try {
      this.notification('Salvando...', 'info');
      if (this.currentProject) {
        this.currentProject.scene = this.scene?.serialize();
        this.currentProject.assets = (this.assets || []).map(a => ({
          type: a.type, name: a.name,
          content: (a.content && typeof a.content !== 'object') ? a.content : null,
        }));
        this.currentProject.lastModified = Date.now();
      }
      const projectData = this.currentProject || { name: 'Projeto', scene: this.scene?.serialize(), assets: this.assets || [] };

      // Save locally first
      await this._saveProjectLocally(projectData);
      // Then GitHub
      await GitHub.saveProject(projectData);
      this.notification('Salvo localmente e no GitHub! ✓', 'success');
    } catch (e) {
      this.notification('Erro GitHub: ' + e.message, 'error');
    }
  }

  // ===== EXPORT =====
  async _exportProject() {
    const name = document.getElementById('build-game-name')?.value || this.currentProject?.name || 'MeuJogo';
    const opts = {
      gameName: name,
      resolution: document.getElementById('build-resolution')?.value || '1280x720',
      mobile: document.getElementById('build-mobile')?.checked !== false,
      fullscreen: document.getElementById('build-fullscreen')?.checked !== false,
    };
    this.notification('Gerando ZIP...', 'info');
    try {
      const exporter = new ProjectExporter(this);
      const zipData = await exporter.exportZip(opts);
      const blob = new Blob([zipData], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = opts.gameName + '.zip';
      a.click();
      URL.revokeObjectURL(url);
      this.notification('ZIP exportado: ' + opts.gameName + '.zip', 'success');
      document.getElementById('build-modal')?.classList.add('hidden');
    } catch (e) {
      this.notification('Erro ao exportar: ' + e.message, 'error');
    }
  }

  // Collect EVERY piece of UI state that should be persisted
  collectEditorState() {
    const cam = this.renderer?.editorCamera || {};
    return {
      // Render settings
      renderQuality: document.getElementById('render-quality')?.value || 'medium',
      showGrid:      this.renderer?.showGrid ?? true,
      showWireframe: this.renderer?.showWireframe ?? false,
      showSkybox:    this.renderer?.showSkybox ?? true,
      snapEnabled:   this.snapEnabled ?? false,
      // Editor camera
      camera: {
        yaw:          cam.yaw ?? -30,
        pitch:        cam.pitch ?? -20,
        distance:     cam.distance ?? 15,
        targetX:      cam.target?.x ?? 0,
        targetY:      cam.target?.y ?? 0,
        targetZ:      cam.target?.z ?? 0,
        orthographic: cam.orthographic ?? false,
        orthoSize:    cam.orthoSize ?? 5,
        fov:          cam.fov ?? 60,
      },
      // Viewport / game view
      gameResolution: document.getElementById('game-res-select')?.value || 'free',
      // Timeline
      timelineFps:    parseInt(document.getElementById('timeline-fps')?.value || 30),
      // Lighting (scene values are in scene.serialize; these are modal UI defaults)
      lightingAmbientColor:     document.getElementById('ambient-color')?.value     || '#1a1a2e',
      lightingAmbientIntensity: document.getElementById('ambient-intensity')?.value || '0.3',
      lightingFog:              document.getElementById('pp-fog')?.checked ?? false,
      lightingFogColor:         document.getElementById('fog-color')?.value         || '#87ceeb',
      lightingFogDensity:       document.getElementById('fog-density')?.value       || '0.01',
      lightingBloom:            document.getElementById('pp-bloom')?.checked        ?? false,
      lightingBloomIntensity:   document.getElementById('bloom-intensity')?.value   || '1',
      lightingHDR:              document.getElementById('pp-hdr')?.checked          ?? false,
      lightingShadowType:       document.getElementById('shadow-type')?.value       || 'hard',
      lightingShadowDistance:   document.getElementById('shadow-distance')?.value   || '150',
      // Build settings
      buildGameName:   document.getElementById('build-game-name')?.value  || '',
      buildVersion:    document.getElementById('build-version')?.value    || '1.0.0',
      buildResolution: document.getElementById('build-resolution')?.value || '1280x720',
      buildFullscreen: document.getElementById('build-fullscreen')?.checked ?? true,
      buildMobile:     document.getElementById('build-mobile')?.checked    ?? true,
      // Active tool
      activeTool: this.gizmos?.mode || 'select',
      // Selected object id (restore selection)
      selectedObjectId: this.selectedObject?.id || null,
      // Current view
      currentView: this.currentView || 'scene',
      // Bottom panel active tab
      activeBottomTab: document.querySelector('.bottom-tab.active')?.dataset.tab || 'project',
    };
  }

  // Restore all UI state from saved editorState
  restoreEditorState(state) {
    if (!state) return;

    // Render quality
    const rq = document.getElementById('render-quality');
    if (rq && state.renderQuality) rq.value = state.renderQuality;
    if (this.renderer) {
      this.renderer.quality = state.renderQuality || 'medium';

      // Grid / wireframe / skybox
      if (state.showGrid !== undefined)      this.renderer.showGrid      = state.showGrid;
      if (state.showWireframe !== undefined) this.renderer.showWireframe = state.showWireframe;
      if (state.showSkybox !== undefined)    this.renderer.showSkybox    = state.showSkybox;

      // Sync toolbar buttons
      document.getElementById('btn-toggle-grid')?.classList.toggle('active', !!state.showGrid);
      document.getElementById('btn-toggle-skybox')?.classList.toggle('active', !!state.showSkybox);
      document.getElementById('btn-wireframe')?.classList.toggle('active', !!state.showWireframe);

      // Perspective/ortho label
      const btnPersp = document.getElementById('btn-persp');
      if (btnPersp) btnPersp.textContent = state.camera?.orthographic ? 'Ortho' : 'Persp';

      // Restore editor camera
      if (state.camera) {
        const cam = this.renderer.editorCamera;
        cam.yaw          = state.camera.yaw ?? cam.yaw;
        cam.pitch        = state.camera.pitch ?? cam.pitch;
        cam.distance     = state.camera.distance ?? cam.distance;
        cam.orthographic = state.camera.orthographic ?? cam.orthographic;
        cam.orthoSize    = state.camera.orthoSize ?? cam.orthoSize;
        cam.fov          = state.camera.fov ?? cam.fov;
        if (state.camera.targetX !== undefined) {
          cam.target.x = state.camera.targetX;
          cam.target.y = state.camera.targetY;
          cam.target.z = state.camera.targetZ;
        }
      }
    }

    // Snap
    if (state.snapEnabled !== undefined) {
      this.snapEnabled = state.snapEnabled;
      document.getElementById('btn-snap')?.classList.toggle('active', state.snapEnabled);
    }

    // Game resolution
    const gRes = document.getElementById('game-res-select');
    if (gRes && state.gameResolution) gRes.value = state.gameResolution;

    // Timeline FPS
    const tfps = document.getElementById('timeline-fps');
    if (tfps && state.timelineFps) {
      tfps.value = state.timelineFps;
      if (this.timeline) this.timeline.fps = state.timelineFps;
    }

    // Lighting modal values
    const setEl = (id, val) => { if (val !== undefined && val !== null) { const el = document.getElementById(id); if (el) el.value = val; } };
    const setChk = (id, val) => { if (val !== undefined && val !== null) { const el = document.getElementById(id); if (el) el.checked = !!val; } };
    setEl('ambient-color',       state.lightingAmbientColor);
    setEl('ambient-intensity',   state.lightingAmbientIntensity);
    setChk('pp-fog',             state.lightingFog);
    setEl('fog-color',           state.lightingFogColor);
    setEl('fog-density',         state.lightingFogDensity);
    setChk('pp-bloom',           state.lightingBloom);
    setEl('bloom-intensity',     state.lightingBloomIntensity);
    setChk('pp-hdr',             state.lightingHDR);
    setEl('shadow-type',         state.lightingShadowType);
    setEl('shadow-distance',     state.lightingShadowDistance);

    // Build settings
    setEl('build-game-name',   state.buildGameName   || this.currentProject?.name || '');
    setEl('build-version',     state.buildVersion);
    setEl('build-resolution',  state.buildResolution);
    setChk('build-fullscreen', state.buildFullscreen);
    setChk('build-mobile',     state.buildMobile);

    // Restore view
    if (state.currentView) this.switchView(state.currentView);

    // Restore active bottom tab
    if (state.activeBottomTab) {
      const tab = document.querySelector('.bottom-tab[data-tab="' + state.activeBottomTab + '"]');
      tab?.click();
    }

    // Restore active tool
    if (state.activeTool) this._setTool(state.activeTool);

    // Restore selection (deferred so scene objects are ready)
    if (state.selectedObjectId && this.scene) {
      const found = this.scene.findById(state.selectedObjectId);
      if (found) this.selectObject(found);
    }
  }

  getProjectData() {
    return { ...(this.currentProject || {}), scene: this.scene?.serialize(), assets: this.assets };
  }

  // ===== ASSET CREATION =====
  _createScript(name) {
    const scriptName = name || prompt('Nome do Script:') || 'MyScript';
    const content = DEFAULT_SCRIPT_TEMPLATE.replace(/MyScript/g, scriptName);
    this.assets.push({ type: 'script', name: scriptName, content });
    this.scriptingEngine.loadScript(scriptName, content);
    this.projectPanel.render();
    this.openScript(scriptName, content);
    return scriptName;
  }

  _createAndAddScript() {
    const name = prompt('Nome do Script:') || 'MyScript';
    this._createScript(name);
    if (this.selectedObject) this.addComponentToSelected(name);
  }

  _createMaterial() {
    const name = prompt('Nome do Material:') || 'New Material';
    const mat = new Material(name);
    this.assets.push({ type: 'material', name, content: mat.serialize() });
    this.projectPanel.render();
    this.notification('Material criado: ' + name);
  }

  _createShader() {
    const name = prompt('Nome do Shader:') || 'New Shader';
    this.assets.push({ type: 'shader', name, content: SHADERS.standardFrag });
    this.projectPanel.render();
    document.getElementById('shader-code-modal')?.classList.remove('hidden');
    document.getElementById('vertex-shader-code').value = SHADERS.standardVert;
    document.getElementById('fragment-shader-code').value = SHADERS.standardFrag;
    this.switchView('shader-editor');
  }

  // ===== SCRIPT EDITOR =====
  openScript(name, content) {
    const modal = document.getElementById('script-editor-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    const title = document.getElementById('script-editor-title');
    if (title) title.textContent = name + '.js';
    const editor = document.getElementById('script-editor');
    const asset = this.assets.find(a => a.name === name && a.type === 'script');
    if (editor) editor.value = content || asset?.content || DEFAULT_SCRIPT_TEMPLATE.replace(/MyScript/g, name);
    this._currentScriptName = name;
  }

  _compileCurrentScript() {
    const editor = document.getElementById('script-editor');
    const output = document.getElementById('script-output');
    if (!editor) return;
    try {
      const cls = this.scriptingEngine.compileAndExecute(editor.value, this._currentScriptName);
      if (output) { output.textContent = cls ? '✓ Compilado com sucesso' : '⚠ Classe não encontrada'; output.style.color = cls ? '#2ecc71' : '#f39c12'; }
    } catch (e) {
      if (output) { output.textContent = '✕ ' + e.message; output.style.color = '#e74c3c'; }
    }
  }

  _saveCurrentScript() {
    const editor = document.getElementById('script-editor');
    if (!editor) return;
    const src = editor.value;
    const name = this._currentScriptName;
    const asset = this.assets.find(a => a.name === name && a.type === 'script');
    if (asset) asset.content = src;
    else this.assets.push({ type: 'script', name, content: src });
    this.scriptingEngine.loadScript(name, src);
    this.projectPanel.render();
    this.notification('Script salvo: ' + name, 'success');
  }

  openAnimator(animComp) {
    this.switchView('animator');
    this.animatorEditor.open(animComp);
  }

  // ===== LIGHTING =====
  _applyLighting() {
    if (!this.scene) return;
    const ambColor = document.getElementById('ambient-color')?.value;
    const ambInt = document.getElementById('ambient-intensity')?.value;
    const fogEnabled = document.getElementById('pp-fog')?.checked;
    const fogColor = document.getElementById('fog-color')?.value;
    const fogDensity = document.getElementById('fog-density')?.value;
    const skyTop = document.getElementById('skybox-top-color')?.value;
    const skyBot = document.getElementById('skybox-bottom-color')?.value;

    if (ambColor) this.scene.ambientColor = Color.fromHex(ambColor);
    if (ambInt) this.scene.ambientIntensity = parseFloat(ambInt);
    this.scene.fogEnabled = !!fogEnabled;
    if (fogColor) this.scene.fogColor = Color.fromHex(fogColor);
    if (fogDensity) this.scene.fogDensity = parseFloat(fogDensity);
    if (skyTop) this.scene.skyboxTopColor = Color.fromHex(skyTop);
    if (skyBot) this.scene.skyboxBottomColor = Color.fromHex(skyBot);

    this.notification('Iluminação aplicada!', 'success');
    document.getElementById('lighting-modal')?.classList.add('hidden');
  }

  // ===== UNDO/REDO =====
  _saveUndoState() {
    if (!this.scene) return;
    this._undoStack.push(this.scene.serialize());
    if (this._undoStack.length > 50) this._undoStack.shift();
    this._redoStack = [];
  }

  undo() {
    if (this._undoStack.length === 0) { this.notification('Nada para desfazer'); return; }
    this._redoStack.push(this.scene.serialize());
    this.scene = Scene.deserialize(this._undoStack.pop());
    window.Engine.scene = this.scene;
    this.selectObject(null);
    this.hierarchy.render(this.scene);
    this.notification('Undo');
  }

  redo() {
    if (this._redoStack.length === 0) { this.notification('Nada para refazer'); return; }
    this._undoStack.push(this.scene.serialize());
    this.scene = Scene.deserialize(this._redoStack.pop());
    window.Engine.scene = this.scene;
    this.selectObject(null);
    this.hierarchy.render(this.scene);
    this.notification('Redo');
  }

  // ===== CONSOLE =====
  _consoleLog(level, ...args) {
    const output = document.getElementById('console-output');
    if (!output) return;
    const entry = document.createElement('div');
    entry.className = 'console-entry ' + level;
    const time = new Date().toLocaleTimeString();
    entry.textContent = '[' + time + '] ' + args.map(a => {
      try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch(e) { return String(a); }
    }).join(' ');
    output.appendChild(entry);
    output.scrollTop = output.scrollHeight;
    while (output.children.length > 500) output.removeChild(output.firstChild);
  }

  // ===== NOTIFICATIONS =====
  notification(msg, type = '') {
    const toast = document.getElementById('notification-toast');
    if (!toast) { console.log('[Notification]', msg); return; }
    toast.textContent = msg;
    toast.className = 'toast show ' + type;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
    this._consoleLog('log', '[Engine] ' + msg);
  }

  // ===== PREFERENCES =====
  savePreferences() {
    const prefs = {
      gridSize: parseFloat(document.getElementById('pref-grid-size')?.value || 1),
      snapSize: parseFloat(document.getElementById('pref-snap-size')?.value || 0.25),
      theme: document.getElementById('pref-theme')?.value || 'dark',
      cameraSpeed: parseFloat(document.getElementById('pref-camera-speed')?.value || 10),
    };
    const token = document.getElementById('pref-github-token')?.value?.trim();
    const user = document.getElementById('pref-github-user')?.value?.trim();
    const repo = document.getElementById('pref-github-repo')?.value?.trim();
    const folder = document.getElementById('pref-github-folder')?.value?.trim() || '';
    if (token && user && repo) {
      GitHub.configure(token, user, repo, folder);
      const creds = { token, user, repo, folder };
      Storage.saveGitHubCreds(creds);
      try { localStorage.setItem('wge-github', JSON.stringify(creds)); } catch(e) {}
    }
    Storage.savePrefs(prefs);
    try { localStorage.setItem('wge-prefs', JSON.stringify(prefs)); } catch (e) {}
    this.notification('Preferências salvas!', 'success');
  }

  loadPreferences() {
    const prefs = Storage.loadPrefs() || {};
    try {
      const lsPrefs = JSON.parse(localStorage.getItem('wge-prefs') || '{}');
      Object.assign(prefs, lsPrefs);
    } catch (e) {}
    if (prefs.gridSize && this.renderer) this.renderer.gridSize = parseFloat(prefs.gridSize);
    if (prefs.cameraSpeed && this.renderer) this.renderer.editorCamera.speed = parseFloat(prefs.cameraSpeed);
    // Fill prefs form if open
    if (document.getElementById('pref-grid-size') && prefs.gridSize) document.getElementById('pref-grid-size').value = prefs.gridSize;
  }
}

// Debounced autosave: fires 800ms after last change
Engine.prototype._scheduleSave = function() {
  clearTimeout(this._saveTimer);
  this._saveTimer = setTimeout(() => {
    if (!this.currentProject || !this.scene) return;
    this.currentProject.scene = this.scene.serialize();
    this.currentProject.editorState = this.collectEditorState();
    this.currentProject.assets = (this.assets||[]).map(a=>({
      type:a.type, name:a.name,
      content:(a.content && typeof a.content!=='object') ? a.content : null,
      url: a.url||null,
    }));
    this.currentProject.lastModified = Date.now();
    this._saveProjectLocally(this.currentProject);
  }, 800);
};

// ===== BOOT =====
window.addEventListener('DOMContentLoaded', () => {
  console.log('WebGL Engine booting...');
  const engine = new Engine();
  window.engine = engine;
  engine.init().catch(e => console.error('Engine init error:', e));
});

