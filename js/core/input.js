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
