/**
 * WebGL Engine - Timeline Editor
 */
class TimelineEditor {
  constructor(engine) {
    this.engine = engine;
    this.canvas = document.getElementById('timeline-canvas');
    this.ctx = this.canvas?.getContext('2d');
    this.tracks = [];
    this.currentTime = 0;
    this.duration = 5;
    this.fps = 30;
    this.playing = false;
    this.zoom = 100; // pixels per second
    this.selectedKeyframe = null;
    this._setupUI();
    this._setupCanvas();
  }
  
  _setupUI() {
    document.getElementById('btn-add-keyframe')?.addEventListener('click', () => this._addKeyframe());
    document.getElementById('btn-timeline-play')?.addEventListener('click', () => {
      this.playing = !this.playing;
      document.getElementById('btn-timeline-play').textContent = this.playing ? '⏸' : '▶';
    });
    document.getElementById('timeline-scrub')?.addEventListener('input', (e) => {
      this.currentTime = (parseFloat(e.target.value) / 100) * this.duration;
      this._updateTimeDisplay();
      this._scrubAnimation();
    });
    document.getElementById('timeline-fps')?.addEventListener('change', (e) => {
      this.fps = parseInt(e.target.value) || 30;
    });
  }
  
  _setupCanvas() {
    if (!this.canvas) return;
    const resizeObserver = new ResizeObserver(() => this._resize());
    resizeObserver.observe(this.canvas.parentElement || document.body);
    this._resize();
  }
  
  _resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (parent) { this.canvas.width = parent.clientWidth - 150; this.canvas.height = parent.clientHeight; }
    this._draw();
  }
  
  addTrack(label, clip, property) {
    this.tracks.push({ label, clip, property, keyframes: [] });
    this._renderTrackList();
    this._draw();
  }
  
  _renderTrackList() {
    const list = document.getElementById('timeline-tracks');
    if (!list) return;
    list.innerHTML = '';
    this.tracks.forEach(t => {
      const row = document.createElement('div');
      row.className = 'timeline-track';
      const name = document.createElement('div');
      name.className = 'timeline-track-name';
      name.textContent = t.label;
      row.appendChild(name);
      list.appendChild(row);
    });
  }
  
  _addKeyframe() {
    const obj = this.engine.selectedObject;
    if (!obj) return;
    
    // Add keyframe for current selection at current time
    this.tracks.forEach(t => {
      t.keyframes.push({ time: this.currentTime });
      if (t.clip) {
        const prop = t.clip.properties.find(p => p.property === t.property);
        if (prop) {
          const val = this._getPropertyValue(obj, t.property);
          prop.curve.addKey(this.currentTime, val);
        }
      }
    });
    this._draw();
  }
  
  _getPropertyValue(obj, property) {
    const parts = property.split('.');
    if (parts[0] === 'transform') {
      const t = obj.transform;
      if (parts[1] === 'position') return t.position[parts[2]] || 0;
      if (parts[1] === 'rotation') return t.rotation[parts[2]] || 0;
      if (parts[1] === 'scale') return t.scale[parts[2]] || 1;
    }
    return 0;
  }
  
  _scrubAnimation() {
    const obj = this.engine.selectedObject;
    if (!obj) return;
    for (const t of this.tracks) {
      if (t.clip) t.clip.sample(obj, this.currentTime);
    }
  }
  
  _updateTimeDisplay() {
    const s = Math.floor(this.currentTime);
    const f = Math.floor((this.currentTime - s) * this.fps);
    const el = document.getElementById('timeline-time');
    if (el) el.textContent = `${s}:${f.toString().padStart(2,'0')}`;
    const scrub = document.getElementById('timeline-scrub');
    if (scrub) scrub.value = (this.currentTime / this.duration * 100).toFixed(1);
  }
  
  update(dt) {
    if (!this.playing) return;
    this.currentTime += dt;
    if (this.currentTime > this.duration) this.currentTime = 0;
    this._updateTimeDisplay();
    this._scrubAnimation();
    this._draw();
  }
  
  _draw() {
    const canvas = this.canvas, ctx = this.ctx;
    if (!canvas || !ctx) return;
    const W = canvas.width, H = canvas.height;
    
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, W, H);
    
    // Time ruler
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, W, 20);
    ctx.strokeStyle = '#444';
    ctx.fillStyle = '#888';
    ctx.font = '9px monospace';
    
    const stepPx = this.zoom;
    const steps = Math.ceil(W / stepPx) + 1;
    for (let i = 0; i <= steps; i++) {
      const x = i * stepPx;
      ctx.strokeStyle = '#444';
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 20); ctx.stroke();
      ctx.fillStyle = '#888';
      ctx.fillText(`${i}s`, x + 2, 13);
      // Sub-divs
      const subStep = stepPx / this.fps;
      if (subStep > 5) {
        for (let f = 1; f < this.fps; f++) {
          const sx = x + f * subStep;
          ctx.strokeStyle = '#333';
          ctx.beginPath(); ctx.moveTo(sx, 15); ctx.lineTo(sx, 20); ctx.stroke();
        }
      }
    }
    
    // Track rows
    const trackH = 24;
    this.tracks.forEach((t, ti) => {
      const y = 20 + ti * trackH;
      ctx.fillStyle = ti % 2 === 0 ? '#252525' : '#222222';
      ctx.fillRect(0, y, W, trackH);
      ctx.strokeStyle = '#1a1a1a';
      ctx.beginPath(); ctx.moveTo(0, y+trackH); ctx.lineTo(W, y+trackH); ctx.stroke();
      
      // Keyframes
      t.keyframes.forEach(kf => {
        const kx = kf.time * this.zoom;
        const ky = y + trackH/2;
        ctx.fillStyle = kf === this.selectedKeyframe ? '#f39c12' : '#4a9eff';
        ctx.beginPath();
        ctx.moveTo(kx, ky-5); ctx.lineTo(kx+5, ky); ctx.lineTo(kx, ky+5); ctx.lineTo(kx-5, ky);
        ctx.closePath(); ctx.fill();
      });
    });
    
    // Playhead
    const px = this.currentTime * this.zoom;
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath(); ctx.moveTo(px-5, 0); ctx.lineTo(px+5, 0); ctx.lineTo(px, 8); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 1;
  }
}
