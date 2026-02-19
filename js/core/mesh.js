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
