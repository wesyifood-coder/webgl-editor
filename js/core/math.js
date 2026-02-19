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
  static fromArray(a) { return new Vec3(a[0]||0, a[1]||0, a[2]||0); }
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
