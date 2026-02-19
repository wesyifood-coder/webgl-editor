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
