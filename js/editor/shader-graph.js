/**
 * WebGL Engine - Shader Graph Editor (Node-based)
 */
class ShaderGraphEditor {
  constructor(engine) {
    this.engine = engine;
    this.canvas = document.getElementById('shader-graph-canvas');
    this.ctx = this.canvas?.getContext('2d');
    this.nodes = [];
    this.connections = [];
    this.selectedNode = null;
    this._dragging = null;
    this._connecting = null;
    this._pan = { x: 200, y: 100 };
    this._currentShader = null;
    this._setupCanvas();
    this._setupUI();
    this._createDefaultGraph();
  }
  
  _setupUI() {
    document.getElementById('btn-add-node')?.addEventListener('click', () => {
      const type = prompt('Tipo de nó: (add/multiply/texture2d/time/sin/lerp/color-output)');
      if (type) this.addNode(type, 300 - this._pan.x, 200 - this._pan.y);
    });
    
    document.getElementById('btn-compile-shader')?.addEventListener('click', () => {
      const glsl = this.compile();
      if (glsl) { this.engine.notification('Shader compilado!', 'success'); }
    });
    
    document.getElementById('btn-compile-glsl')?.addEventListener('click', () => {
      this._compileGLSL();
    });
    
    // Node palette drag
    document.querySelectorAll('.node-item').forEach(item => {
      item.addEventListener('dragstart', e => {
        e.dataTransfer.setData('nodeType', item.dataset.node);
      });
    });
    
    this.canvas?.addEventListener('dragover', e => e.preventDefault());
    this.canvas?.addEventListener('drop', e => {
      e.preventDefault();
      const type = e.dataTransfer.getData('nodeType');
      if (type) {
        const r = this.canvas.getBoundingClientRect();
        this.addNode(type, e.clientX - r.left - this._pan.x, e.clientY - r.top - this._pan.y);
      }
    });
  }
  
  _setupCanvas() {
    if (!this.canvas) return;
    this.canvas.addEventListener('mousedown', e => this._onMouseDown(e));
    this.canvas.addEventListener('mousemove', e => this._onMouseMove(e));
    this.canvas.addEventListener('mouseup', e => this._onMouseUp(e));
    this.canvas.addEventListener('wheel', e => {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this._scale = Math.max(0.3, Math.min(3, (this._scale || 1) * delta));
      this._draw();
    }, { passive: true });
    
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
  
  _createDefaultGraph() {
    // Create initial nodes
    this.addNode('color-output', 400, 200);
    const uvNode = this.addNode('uv', 50, 200);
    const timeNode = this.addNode('time', 50, 350);
  }
  
  addNode(type, x, y) {
    const def = this._getNodeDef(type);
    const node = {
      id: generateId(), type, x, y,
      width: 140, height: 30 + def.inputs.length * 22 + def.outputs.length * 22 + 10,
      label: def.label, inputs: def.inputs.map(i=>({...i,value:i.default||0})),
      outputs: def.outputs.map(o=>({...o})),
      props: {...(def.props||{})}
    };
    this.nodes.push(node);
    this._draw();
    return node;
  }
  
  _getNodeDef(type) {
    const defs = {
      'uv': { label:'UV', inputs:[], outputs:[{name:'UV',type:'vec2'}] },
      'texture2d': { label:'Texture2D', inputs:[{name:'UV',type:'vec2'}], outputs:[{name:'RGBA',type:'vec4'},{name:'RGB',type:'vec3'},{name:'A',type:'float'}], props:{texture:null} },
      'time': { label:'Time', inputs:[], outputs:[{name:'Time',type:'float'},{name:'Sine',type:'float'}] },
      'position': { label:'Position', inputs:[], outputs:[{name:'World',type:'vec3'},{name:'Object',type:'vec3'}] },
      'normal': { label:'Normal', inputs:[], outputs:[{name:'World',type:'vec3'},{name:'Object',type:'vec3'}] },
      'add': { label:'Add', inputs:[{name:'A',type:'float',default:0},{name:'B',type:'float',default:0}], outputs:[{name:'Out',type:'float'}] },
      'multiply': { label:'Multiply', inputs:[{name:'A',type:'float',default:1},{name:'B',type:'float',default:1}], outputs:[{name:'Out',type:'float'}] },
      'lerp': { label:'Lerp', inputs:[{name:'A',type:'float',default:0},{name:'B',type:'float',default:1},{name:'T',type:'float',default:0.5}], outputs:[{name:'Out',type:'float'}] },
      'clamp': { label:'Clamp', inputs:[{name:'In',type:'float',default:0},{name:'Min',type:'float',default:0},{name:'Max',type:'float',default:1}], outputs:[{name:'Out',type:'float'}] },
      'sin': { label:'Sin', inputs:[{name:'In',type:'float',default:0}], outputs:[{name:'Out',type:'float'}] },
      'abs': { label:'Abs', inputs:[{name:'In',type:'float',default:0}], outputs:[{name:'Out',type:'float'}] },
      'color-output': { label:'Color Output', inputs:[{name:'Color',type:'vec4'},{name:'Alpha',type:'float',default:1}], outputs:[], props:{isOutput:true} },
    };
    return defs[type] || { label:type, inputs:[{name:'In',type:'float',default:0}], outputs:[{name:'Out',type:'float'}] };
  }
  
  _onMouseDown(e) {
    const pos = this._screenToGraph(e);
    const node = this._hitNode(pos);
    if (node) {
      this.selectedNode = node;
      this._dragging = { node, ox: pos.x - node.x, oy: pos.y - node.y };
    } else {
      this._panStart = { x: e.clientX - this._pan.x, y: e.clientY - this._pan.y };
      this.selectedNode = null;
    }
    this._draw();
  }
  
  _onMouseMove(e) {
    if (this._dragging) {
      const pos = this._screenToGraph(e);
      this._dragging.node.x = pos.x - this._dragging.ox;
      this._dragging.node.y = pos.y - this._dragging.oy;
      this._draw();
    } else if (this._panStart) {
      this._pan.x = e.clientX - this._panStart.x;
      this._pan.y = e.clientY - this._panStart.y;
      this._draw();
    }
  }
  
  _onMouseUp(e) {
    this._dragging = null;
    this._panStart = null;
  }
  
  _screenToGraph(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left - this._pan.x, y: e.clientY - r.top - this._pan.y };
  }
  
  _hitNode(pos) {
    return this.nodes.find(n => pos.x >= n.x && pos.x <= n.x+n.width && pos.y >= n.y && pos.y <= n.y+n.height) || null;
  }
  
  _draw() {
    const canvas = this.canvas, ctx = this.ctx;
    if (!canvas || !ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, W, H);
    
    // Grid
    ctx.strokeStyle = '#222';
    const gs = 40;
    for (let x=(this._pan.x%gs+gs)%gs; x<W; x+=gs) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y=(this._pan.y%gs+gs)%gs; y<H; y+=gs) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    
    ctx.save();
    ctx.translate(this._pan.x, this._pan.y);
    
    // Draw connections
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 2;
    for (const conn of this.connections) {
      const srcPort = this._getPortPos(conn.srcNode, 'output', conn.srcPort);
      const dstPort = this._getPortPos(conn.dstNode, 'input', conn.dstPort);
      if (srcPort && dstPort) {
        ctx.beginPath();
        ctx.moveTo(srcPort.x, srcPort.y);
        ctx.bezierCurveTo(srcPort.x+60, srcPort.y, dstPort.x-60, dstPort.y, dstPort.x, dstPort.y);
        ctx.stroke();
      }
    }
    
    // Draw nodes
    for (const node of this.nodes) {
      const isSelected = node === this.selectedNode;
      const isOutput = node.props?.isOutput;
      
      // Shadow
      ctx.shadowColor = isSelected ? '#4a9eff' : 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = isSelected ? 12 : 6;
      
      // Body
      ctx.fillStyle = isOutput ? '#2d3d2d' : '#2a2a3a';
      ctx.strokeStyle = isSelected ? '#4a9eff' : (isOutput ? '#2ecc71' : '#444');
      ctx.lineWidth = isSelected ? 2 : 1;
      this._roundRect(ctx, node.x, node.y, node.width, node.height, 6);
      ctx.fill(); ctx.stroke();
      
      ctx.shadowBlur = 0;
      
      // Header
      ctx.fillStyle = isOutput ? '#27ae60' : '#3a3a5a';
      this._roundRectTop(ctx, node.x, node.y, node.width, 26, 6);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x + node.width/2, node.y + 17);
      
      // Inputs
      node.inputs.forEach((inp, i) => {
        const py = node.y + 36 + i * 22;
        // Port circle
        ctx.fillStyle = '#4a9eff';
        ctx.beginPath(); ctx.arc(node.x, py, 5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#bbb'; ctx.font='10px system-ui'; ctx.textAlign='left';
        ctx.fillText(inp.name, node.x + 10, py + 4);
        if (inp.value !== undefined && typeof inp.value === 'number') {
          ctx.fillStyle = '#666'; ctx.textAlign='right';
          ctx.fillText(inp.value.toFixed(2), node.x + node.width - 5, py + 4);
        }
      });
      
      // Outputs
      node.outputs.forEach((out, i) => {
        const py = node.y + 36 + node.inputs.length * 22 + i * 22;
        ctx.fillStyle = '#f39c12';
        ctx.beginPath(); ctx.arc(node.x + node.width, py, 5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#bbb'; ctx.font='10px system-ui'; ctx.textAlign='right';
        ctx.fillText(out.name, node.x + node.width - 10, py + 4);
      });
    }
    
    ctx.restore();
    ctx.lineWidth = 1;
  }
  
  _getPortPos(nodeId, type, portIdx) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return null;
    const y = node.y + 36 + (type==='input' ? portIdx*22 : node.inputs.length*22 + portIdx*22);
    const x = type === 'input' ? node.x : node.x + node.width;
    return { x, y };
  }
  
  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
    ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
    ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r);
    ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
    ctx.closePath();
  }
  
  _roundRectTop(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
    ctx.lineTo(x+w, y+h); ctx.lineTo(x, y+h);
    ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
    ctx.closePath();
  }
  
  compile() {
    // Generate GLSL from node graph
    let fragCode = 'void main() {\n  vec4 color = vec4(1.0);\n';
    // TODO: traverse node graph and generate GLSL
    fragCode += '  gl_FragColor = color;\n}';
    return fragCode;
  }
  
  _compileGLSL() {
    const vertSrc = document.getElementById('vertex-shader-code')?.value;
    const fragSrc = document.getElementById('fragment-shader-code')?.value;
    if (!vertSrc || !fragSrc) return;
    try {
      this.engine.renderer.glCtx.createProgram(vertSrc, fragSrc, 'custom_' + Date.now());
      this.engine.notification('GLSL compilado com sucesso!', 'success');
    } catch(e) {
      this.engine.notification('Erro GLSL: ' + e.message, 'error');
    }
  }
}
