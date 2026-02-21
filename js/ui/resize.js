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
