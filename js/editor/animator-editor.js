/**
 * WebGL Engine - Animator Editor
 */
class AnimatorEditor {
  constructor(engine) {
    this.engine = engine;
    this.canvas = document.getElementById('animator-canvas');
    this.ctx = this.canvas?.getContext('2d');
    this.controller = null;
    this.selectedState = null;
    this._draggingState = null;
    this._offset = { x: 0, y: 0 };
    this._scale = 1;
    this._pan = { x: 50, y: 50 };
    this._setupInteraction();
    this._setupUI();
  }
  
  _setupUI() {
    document.getElementById('btn-add-state')?.addEventListener('click', () => {
      if (!this.controller) this.controller = new AnimatorController();
      const clip = new AnimationClip('New Clip');
      const state = this.controller.addState('New State', clip);
      state.x = 100 + Math.random()*200;
      state.y = 100 + Math.random()*200;
      this._draw();
    });
    
    document.getElementById('btn-add-parameter')?.addEventListener('click', () => {
      if (!this.controller) return;
      const name = prompt('Nome do parâmetro:');
      if (!name) return;
      const type = 'float';
      this.controller.addParameter(name, type, 0);
      this._renderParams();
    });
  }
  
  _renderParams() {
    const list = document.getElementById('param-list');
    if (!list || !this.controller) return;
    list.innerHTML = '';
    for (const [name, param] of Object.entries(this.controller.parameters)) {
      const item = document.createElement('div');
      item.className = 'param-item';
      const nameEl = document.createElement('span');
      nameEl.textContent = name;
      nameEl.style.flex = '1';
      const valInp = document.createElement('input');
      valInp.type = 'number'; valInp.value = param.value; valInp.style.width='50px';
      valInp.addEventListener('change', () => this.controller.setParameter(name, parseFloat(valInp.value)));
      item.appendChild(nameEl); item.appendChild(valInp);
      list.appendChild(item);
    }
  }
  
  _setupInteraction() {
    if (!this.canvas) return;
    this.canvas.addEventListener('mousedown', e => {
      const pos = this._canvasPos(e);
      const state = this._hitTest(pos);
      if (state) {
        this.selectedState = state;
        this._draggingState = state;
        this._dragOffset = { x: pos.x - state.x, y: pos.y - state.y };
      } else {
        this._panStart = pos;
        this._panPrev = {...this._pan};
      }
      this._draw();
    });
    
    this.canvas.addEventListener('mousemove', e => {
      const pos = this._canvasPos(e);
      if (this._draggingState) {
        this._draggingState.x = pos.x - this._dragOffset.x;
        this._draggingState.y = pos.y - this._dragOffset.y;
        this._draw();
      } else if (this._panStart) {
        this._pan.x = this._panPrev.x + (pos.x - this._panStart.x);
        this._pan.y = this._panPrev.y + (pos.y - this._panStart.y);
        this._draw();
      }
    });
    
    this.canvas.addEventListener('mouseup', () => {
      this._draggingState = null;
      this._panStart = null;
    });
    
    const obs = new ResizeObserver(() => this._resize());
    obs.observe(this.canvas.parentElement || document.body);
    this._resize();
  }
  
  _resize() {
    if (!this.canvas) return;
    const p = this.canvas.parentElement;
    if (p) { this.canvas.width = p.clientWidth; this.canvas.height = p.clientHeight; }
    this._draw();
  }
  
  _canvasPos(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left - this._pan.x, y: e.clientY - r.top - this._pan.y };
  }
  
  _hitTest(pos) {
    if (!this.controller) return null;
    return this.controller.states.find(s =>
      pos.x >= s.x && pos.x <= s.x+160 && pos.y >= s.y && pos.y <= s.y+60
    ) || null;
  }
  
  _draw() {
    const canvas = this.canvas, ctx = this.ctx;
    if (!canvas || !ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    
    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, W, H);
    
    // Grid
    ctx.strokeStyle = '#252525';
    const gs = 40;
    for (let x = this._pan.x % gs; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = this._pan.y % gs; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    
    ctx.save();
    ctx.translate(this._pan.x, this._pan.y);
    
    if (!this.controller) {
      ctx.fillStyle = '#555';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Selecione um Animator Component para editar', 200, 200);
      ctx.restore();
      return;
    }
    
    // Draw transitions
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    for (const state of this.controller.states) {
      for (const trans of state.transitions) {
        const fx = state.x+80, fy = state.y+30;
        const tx = trans.to.x+80, ty = trans.to.y+30;
        ctx.beginPath(); ctx.moveTo(fx,fy); ctx.lineTo(tx,ty); ctx.stroke();
        // Arrow
        const angle = Math.atan2(ty-fy, tx-fx);
        const ax = tx-15*Math.cos(angle), ay = ty-15*Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(ax+7*Math.sin(angle), ay-7*Math.cos(angle));
        ctx.lineTo(ax-7*Math.sin(angle), ay+7*Math.cos(angle));
        ctx.closePath(); ctx.fillStyle='#666'; ctx.fill();
      }
    }
    
    // Draw states
    for (const state of this.controller.states) {
      const isSelected = state === this.selectedState;
      const isDefault = state === this.controller.defaultState;
      
      ctx.fillStyle = isSelected ? '#4a9eff' : isDefault ? '#2ecc71' : '#3c3c3c';
      ctx.strokeStyle = isSelected ? '#6ab8ff' : isDefault ? '#27ae60' : '#555';
      ctx.lineWidth = 2;
      this._roundRect(ctx, state.x, state.y, 160, 60, 8);
      ctx.fill(); ctx.stroke();
      
      ctx.fillStyle = isSelected ? 'white' : '#ddd';
      ctx.font = 'bold 13px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(state.name, state.x+80, state.y+25);
      ctx.font = '10px system-ui';
      ctx.fillStyle = isSelected ? '#cce' : '#888';
      ctx.fillText(state.clip?.name || '(no clip)', state.x+80, state.y+42);
    }
    
    ctx.restore();
    ctx.lineWidth = 1;
  }
  
  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
    ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
    ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r);
    ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
    ctx.closePath();
  }
  
  open(animatorComp) {
    if (!animatorComp.controller) {
      animatorComp.controller = new AnimatorController();
    }
    this.controller = animatorComp.controller;
    this._renderParams();
    this._draw();
  }
}
