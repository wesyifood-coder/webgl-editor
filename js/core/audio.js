/**
 * WebGL Engine - Audio System
 */

class AudioEngineSystem {
  constructor() {
    this._ctx = null;
    this._masterGain = null;
    this._clips = {};
    this._sources = [];
    this._initialized = false;
  }
  
  init() {
    if (this._initialized) return;
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._ctx.createGain();
      this._masterGain.connect(this._ctx.destination);
      this._initialized = true;
    } catch(e) { console.warn('Audio not available:', e); }
  }
  
  setMasterVolume(v) { if (this._masterGain) this._masterGain.gain.value = v; }
  
  async loadClip(name, url) {
    if (!this._initialized) this.init();
    if (!this._ctx) return null;
    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const audioBuffer = await this._ctx.decodeAudioData(buffer);
      this._clips[name] = audioBuffer;
      return audioBuffer;
    } catch(e) { console.warn('Audio load failed:', e); return null; }
  }
  
  async loadClipFromFile(name, file) {
    if (!this._initialized) this.init();
    if (!this._ctx) return null;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this._ctx.decodeAudioData(arrayBuffer);
      this._clips[name] = audioBuffer;
      return audioBuffer;
    } catch(e) { console.warn('Audio load failed:', e); return null; }
  }
  
  play(clipName, options = {}) {
    if (!this._initialized || !this._ctx) return null;
    if (this._ctx.state === 'suspended') this._ctx.resume();
    
    const buffer = typeof clipName === 'string' ? this._clips[clipName] : clipName;
    if (!buffer) return null;
    
    const source = this._ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = options.loop || false;
    source.playbackRate.value = options.pitch || 1;
    
    const gain = this._ctx.createGain();
    gain.gain.value = options.volume ?? 1;
    
    source.connect(gain);
    gain.connect(this._masterGain);
    source.start(0);
    
    const wrapper = {
      source, gain,
      stop: () => { try { source.stop(); } catch(e) {} },
      setVolume: (v) => { gain.gain.value = v; },
      setPitch: (p) => { source.playbackRate.value = p; }
    };
    
    this._sources.push(wrapper);
    source.onended = () => { const idx = this._sources.indexOf(wrapper); if(idx>=0)this._sources.splice(idx,1); };
    return wrapper;
  }
  
  playOneShot(clipName, volume = 1) {
    return this.play(clipName, { volume, loop: false });
  }
  
  stopAll() { [...this._sources].forEach(s => s.stop()); }
  
  generateBeep(freq=440, dur=0.1, vol=0.3) {
    if (!this._initialized) this.init();
    if (!this._ctx) return;
    if (this._ctx.state === 'suspended') this._ctx.resume();
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.value = vol;
    gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(this._masterGain);
    osc.start();
    osc.stop(this._ctx.currentTime + dur);
  }
}

window.AudioEngine = new AudioEngineSystem();
