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
