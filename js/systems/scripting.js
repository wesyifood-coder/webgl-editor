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
    
    // Wrap in IIFE to register the class
    js += `
// Auto-registration
if (typeof window !== 'undefined') {
  const classes = Object.getOwnPropertyNames(window).filter(k => {
    try { return window[k] && window[k].prototype instanceof ScriptComponent; } catch { return false; }
  });
}`;
    
    return js;
  }
  
  execute(compiledJs, name) {
    try {
      // Create a sandboxed function
      const fn = new Function(
        'ScriptComponent', 'Vec3', 'Vec2', 'Color', 'Mat4', 'Quaternion', 'MathUtils', 'Input', 'Time',
        'Engine', '_engineLog', 'ComponentFactory',
        compiledJs + `\nreturn typeof ${name} !== 'undefined' ? ${name} : null;`
      );
      
      const cls = fn(
        ScriptComponent, Vec3, Vec2, Color, Mat4, Quaternion, MathUtils, Input, Time,
        window.engine, (...args) => window.engine?.editorConsole?.log(...args),
        ComponentFactory
      );
      
      if (cls) {
        this._scripts[name] = cls;
        ComponentFactory.register(name, cls);
      }
      return cls;
    } catch(e) {
      this._errors[name] = e.message;
      console.error('Script error:', e);
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
