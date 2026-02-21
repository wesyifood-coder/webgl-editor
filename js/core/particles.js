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
