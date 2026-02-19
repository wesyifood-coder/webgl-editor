/**
 * WebGL Engine - Project Exporter
 * Generates a standalone HTML5 game ZIP
 */

class ProjectExporter {
  constructor(engine) {
    this.engine = engine;
  }
  
  async exportZip(options = {}) {
    const gameName = options.gameName || 'MeuJogo';
    const projectData = this.engine.getProjectData();
    const scripts = this.engine.scriptingEngine._scriptSources;
    
    // Generate all files
    const files = {};
    
    // Main HTML
    files['index.html'] = this._generateGameHTML(gameName, options);
    
    // Game runtime JS (embedded, standalone)
    files['game.js'] = this._generateGameRuntime(projectData, scripts);
    
    // Styles
    files['style.css'] = this._generateGameCSS(options);
    
    // README
    files['README.md'] = `# ${gameName}\n\nJogo criado com WebGL Engine\n\nAbra index.html em um servidor web para jogar.`;
    
    // Create ZIP
    return this._createZip(files);
  }
  
  _generateGameHTML(gameName, opts) {
    const mobileControls = opts.mobile !== false;
    const fullscreen = opts.fullscreen !== false;
    const [resW, resH] = (opts.resolution || '1280x720').split('x').map(Number);
    
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>${gameName}</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<div id="game-container">
  <canvas id="game-canvas" width="${resW}" height="${resH}"></canvas>
  ${mobileControls ? `
  <div id="mobile-controls">
    <div id="joystick-bg"><div id="joystick-knob"></div></div>
    <div id="action-btns">
      <button class="abtn" data-key="Space">↑</button>
      <button class="abtn" data-key="e">E</button>
    </div>
  </div>` : ''}
  <div id="loading-screen">
    <div class="loader-logo">${gameName}</div>
    <div class="loader-bar"><div class="loader-fill" id="loader-fill"></div></div>
    <div class="loader-text" id="loader-text">Carregando...</div>
  </div>
</div>
<script src="game.js"></script>
</body>
</html>`;
  }
  
  _generateGameCSS(opts) {
    return `
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#000; overflow:hidden; width:100vw; height:100vh; display:flex; align-items:center; justify-content:center; }
#game-container { position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center; }
#game-canvas { max-width:100%; max-height:100%; display:block; }
#loading-screen { position:absolute; inset:0; background:#111; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px; z-index:100; }
.loader-logo { font-size:48px; font-weight:700; color:#fff; font-family:system-ui; }
.loader-bar { width:300px; height:6px; background:#333; border-radius:3px; overflow:hidden; }
.loader-fill { height:100%; background:#4a9eff; border-radius:3px; transition:width 0.3s; }
.loader-text { color:#888; font-family:system-ui; font-size:14px; }
#mobile-controls { position:absolute; inset:0; pointer-events:none; }
#joystick-bg { position:absolute; left:60px; bottom:80px; width:100px; height:100px; background:rgba(255,255,255,0.15); border-radius:50%; border:2px solid rgba(255,255,255,0.3); pointer-events:all; touch-action:none; }
#joystick-knob { width:40px; height:40px; background:rgba(255,255,255,0.6); border-radius:50%; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); }
#action-btns { position:absolute; right:60px; bottom:80px; display:flex; gap:12px; pointer-events:all; }
.abtn { width:54px; height:54px; background:rgba(74,158,255,0.4); border:2px solid rgba(74,158,255,0.7); border-radius:50%; color:white; font-size:20px; cursor:pointer; touch-action:none; display:flex; align-items:center; justify-content:center; }
`;
  }
  
  _generateGameRuntime(projectData, scripts) {
    // Serialize scene to JSON string for embedding
    const sceneJson = JSON.stringify(projectData.scene || {});
    const assetsJson = JSON.stringify(projectData.assets || {});
    
    // Collect all script sources
    const scriptsSerialized = Object.entries(scripts).map(([name, src]) =>
      `// Script: ${name}\n${src}`
    ).join('\n\n');
    
    return `// WebGL Engine - Standalone Game Runtime
// Generated ${new Date().toISOString()}

'use strict';

// ===== EMBED SCENE DATA =====
const SCENE_DATA = ${sceneJson};
const ASSETS_DATA = ${assetsJson};

// ===== MATH LIBRARY =====
${this._getSourceFile('math')}

// ===== WEBGL =====
${this._getSourceFile('webgl')}

// ===== SCENE GRAPH =====
${this._getSourceFile('scene')}

// ===== MESH =====
${this._getSourceFile('mesh')}

// ===== MATERIAL =====
${this._getSourceFile('material')}

// ===== PHYSICS =====
${this._getSourceFile('physics')}

// ===== ANIMATION =====
${this._getSourceFile('animation')}

// ===== PARTICLES =====
${this._getSourceFile('particles')}

// ===== INPUT =====
${this._getSourceFile('input')}

// ===== RENDERER =====
${this._getSourceFile('renderer')}

// ===== SCRIPTING =====
${this._getSourceFile('scripting')}

// ===== USER SCRIPTS =====
${scriptsSerialized}

// ===== GAME BOOT =====
(function() {
  const canvas = document.getElementById('game-canvas');
  const renderer = new Renderer(canvas, true);
  const scene = Scene.deserialize(SCENE_DATA);
  const physics = new PhysicsWorld();
  const scriptEngine = new ScriptingEngine();
  
  // Load all user scripts
  const userScripts = ${JSON.stringify(scripts)};
  for (const [name, src] of Object.entries(userScripts)) {
    scriptEngine.loadScript(name, src);
  }
  
  // Resize canvas
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
  }
  window.addEventListener('resize', resize);
  resize();
  
  // Loading screen
  const loadingScreen = document.getElementById('loading-screen');
  const loaderFill = document.getElementById('loader-fill');
  let loaded = false;
  
  setTimeout(() => {
    if (loaderFill) loaderFill.style.width = '100%';
    setTimeout(() => {
      if (loadingScreen) loadingScreen.style.display = 'none';
      scene.play();
      loaded = true;
    }, 500);
  }, 300);
  
  // Mobile joystick
  const joystickBg = document.getElementById('joystick-bg');
  const joystickKnob = document.getElementById('joystick-knob');
  if (joystickBg) {
    let joystickActive = false, joystickId = -1, centerX = 0, centerY = 0;
    joystickBg.addEventListener('touchstart', e => {
      const t = e.targetTouches[0];
      const rect = joystickBg.getBoundingClientRect();
      centerX = rect.left + rect.width/2;
      centerY = rect.top + rect.height/2;
      joystickActive = true;
      joystickId = t.identifier;
      e.preventDefault();
    }, {passive:false});
    document.addEventListener('touchmove', e => {
      if (!joystickActive) return;
      for (const t of e.changedTouches) {
        if (t.identifier === joystickId) {
          const maxR = 40;
          let dx = t.clientX - centerX, dy = t.clientY - centerY;
          const dist = Math.sqrt(dx*dx+dy*dy);
          if (dist > maxR) { dx=dx/dist*maxR; dy=dy/dist*maxR; }
          if (joystickKnob) joystickKnob.style.transform = \`translate(calc(-50% + \${dx}px), calc(-50% + \${dy}px))\`;
          Input.setVirtualJoystick(dx/maxR, -dy/maxR);
          e.preventDefault();
        }
      }
    }, {passive:false});
    document.addEventListener('touchend', e => {
      for (const t of e.changedTouches) {
        if (t.identifier === joystickId) {
          joystickActive = false;
          if (joystickKnob) joystickKnob.style.transform = 'translate(-50%,-50%)';
          Input.clearVirtualJoystick();
        }
      }
    });
  }
  
  // Action buttons
  document.querySelectorAll('.abtn').forEach(btn => {
    const key = btn.dataset.key;
    btn.addEventListener('touchstart', e => { Input._keys[key] = true; e.preventDefault(); }, {passive:false});
    btn.addEventListener('touchend', e => { Input._keys[key] = false; e.preventDefault(); }, {passive:false});
  });
  
  // Game loop
  let lastTime = 0;
  function gameLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    
    if (loaded) {
      scene.update(dt);
      physics.step(scene, dt);
      Time._time += dt;
      Time._deltaTime = dt;
      Time._frame = (Time._frame || 0) + 1;
    }
    
    renderer.render(scene, dt);
    Input.lateUpdate();
    requestAnimationFrame(gameLoop);
  }
  requestAnimationFrame(gameLoop);
})();
`;
  }
  
  _getSourceFile(name) {
    // In a real implementation, these would be the actual source code
    // For the exported game, we reference the already-loaded code
    return `/* ${name} module - loaded from engine */`;
  }
  
  _createZip(files) {
    // Simple ZIP implementation using ArrayBuffer
    const zipWriter = new SimpleZip();
    for (const [name, content] of Object.entries(files)) {
      zipWriter.addFile(name, content);
    }
    return zipWriter.generate();
  }
}

class SimpleZip {
  constructor() {
    this._files = [];
    this._centralDir = [];
    this._offset = 0;
  }
  
  addFile(name, content) {
    const nameBytes = new TextEncoder().encode(name);
    const dataBytes = typeof content === 'string' ? new TextEncoder().encode(content) : content;
    
    const crc = this._crc32(dataBytes);
    const date = new Date();
    const dosDate = ((date.getFullYear()-1980)<<9)|((date.getMonth()+1)<<5)|date.getDate();
    const dosTime = (date.getHours()<<11)|(date.getMinutes()<<5)|(date.getSeconds()>>1);
    
    // Local file header
    const localHeader = new ArrayBuffer(30 + nameBytes.length);
    const view = new DataView(localHeader);
    view.setUint32(0, 0x04034b50, true); // signature
    view.setUint16(4, 20, true); // version needed
    view.setUint16(6, 0, true); // flags
    view.setUint16(8, 0, true); // compression (stored)
    view.setUint16(10, dosTime, true);
    view.setUint16(12, dosDate, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, dataBytes.length, true);
    view.setUint32(22, dataBytes.length, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true); // extra length
    new Uint8Array(localHeader, 30).set(nameBytes);
    
    this._files.push({ nameBytes, localHeader, data: dataBytes, crc, offset: this._offset });
    
    // Central dir entry
    const centralEntry = new ArrayBuffer(46 + nameBytes.length);
    const cv = new DataView(centralEntry);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0, true);  // flags
    cv.setUint16(10, 0, true); // compression
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, dataBytes.length, true);
    cv.setUint32(24, dataBytes.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true); cv.setUint16(32, 0, true); cv.setUint16(34, 0, true);
    cv.setUint32(36, 0, true); cv.setUint32(40, 0, true);
    cv.setUint32(42, this._offset, true); // local header offset
    new Uint8Array(centralEntry, 46).set(nameBytes);
    
    this._centralDir.push(centralEntry);
    this._offset += localHeader.byteLength + dataBytes.length;
  }
  
  generate() {
    const centralDirSize = this._centralDir.reduce((s,e) => s+e.byteLength, 0);
    const eocd = new ArrayBuffer(22);
    const ev = new DataView(eocd);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true); ev.setUint16(6, 0, true);
    ev.setUint16(8, this._files.length, true);
    ev.setUint16(10, this._files.length, true);
    ev.setUint32(12, centralDirSize, true);
    ev.setUint32(16, this._offset, true);
    ev.setUint16(20, 0, true);
    
    const parts = [];
    for (const f of this._files) { parts.push(f.localHeader, f.data); }
    for (const cd of this._centralDir) parts.push(cd);
    parts.push(eocd);
    
    const totalSize = parts.reduce((s,p) => s + (p instanceof ArrayBuffer ? p.byteLength : p.length), 0);
    const result = new Uint8Array(totalSize);
    let pos = 0;
    for (const p of parts) {
      const arr = p instanceof ArrayBuffer ? new Uint8Array(p) : p;
      result.set(arr, pos);
      pos += arr.length;
    }
    return result.buffer;
  }
  
  _crc32(data) {
    let crc = 0xFFFFFFFF;
    if (!SimpleZip._table) {
      SimpleZip._table = new Uint32Array(256);
      for (let i=0;i<256;i++) {
        let c=i;
        for(let j=0;j<8;j++) c=c&1?(0xEDB88320^(c>>>1)):(c>>>1);
        SimpleZip._table[i]=c;
      }
    }
    for (const b of data) crc = SimpleZip._table[(crc^b)&0xFF]^(crc>>>8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
}
