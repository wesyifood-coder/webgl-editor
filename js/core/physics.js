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
