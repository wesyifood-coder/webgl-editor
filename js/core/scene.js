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
