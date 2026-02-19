/**
 * WebGL Engine - Inspector Panel
 * Renders component inspectors for all component types
 */

class InspectorPanel {
  constructor(engine) {
    this.engine = engine;
    this.el = document.getElementById('inspector-content');
    this.currentObject = null;
  }
  
  render(obj) {
    this.currentObject = obj;
    this.el.innerHTML = '';
    
    const addBtn = document.getElementById('btn-add-component');
    
    if (!obj) {
      this.el.innerHTML = '<div class="inspector-empty">Selecione um objeto</div>';
      addBtn?.classList.add('hidden');
      return;
    }
    
    addBtn?.classList.remove('hidden');
    
    // Object header
    this.el.appendChild(this._makeObjectHeader(obj));
    
    // Transform
    this.el.appendChild(this._makeTransformBlock(obj));
    
    // Components
    for (const comp of obj.components) {
      const block = this._makeComponentBlock(comp, obj);
      if (block) this.el.appendChild(block);
    }
  }
  
  _makeObjectHeader(obj) {
    const div = document.createElement('div');
    div.className = 'obj-header';
    
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.className = 'obj-active-check';
    check.checked = obj.active;
    check.addEventListener('change', () => { obj.setActive(check.checked); this.engine.hierarchy.render(this.engine.scene); });
    
    const nameInput = document.createElement('input');
    nameInput.className = 'obj-name-input';
    nameInput.value = obj.name;
    nameInput.addEventListener('change', () => { obj.name = nameInput.value; this.engine.hierarchy.render(this.engine.scene); });
    
    const meta = document.createElement('div');
    meta.className = 'obj-meta';
    
    const tagSel = document.createElement('select');
    tagSel.className = 'obj-tag-select';
    ['Untagged','Player','Enemy','Ground','UI','Camera'].forEach(t => {
      const opt = document.createElement('option');
      opt.value = t; opt.textContent = t;
      opt.selected = obj.tags.includes(t);
      tagSel.appendChild(opt);
    });
    tagSel.addEventListener('change', () => { obj.tags = [tagSel.value]; });
    
    const layerSel = document.createElement('select');
    layerSel.className = 'obj-layer-select';
    ['Default','UI','Ignore Raycast','Water','PostProcessing'].forEach((l,i) => {
      const opt = document.createElement('option');
      opt.value = i; opt.textContent = l;
      opt.selected = obj.layer === i;
      layerSel.appendChild(opt);
    });
    layerSel.addEventListener('change', () => { obj.layer = parseInt(layerSel.value); });
    
    meta.appendChild(tagSel);
    meta.appendChild(layerSel);
    div.appendChild(check);
    div.appendChild(nameInput);
    div.appendChild(meta);
    return div;
  }
  
  _makeTransformBlock(obj) {
    const t = obj.transform;
    const block = this._makeCollapsibleBlock('Transform', '⊞');
    const body = block.querySelector('.component-body');
    
    body.appendChild(this._makeVec3Row('Position', t.position, (axis, val) => {
      t.position[axis] = val; t.markDirty();
    }));
    body.appendChild(this._makeVec3Row('Rotation', t.rotation, (axis, val) => {
      t.rotation[axis] = val; t.markDirty();
    }));
    body.appendChild(this._makeVec3Row('Scale', t.scale, (axis, val) => {
      t.scale[axis] = val; t.markDirty();
    }));
    
    return block;
  }
  
  _makeComponentBlock(comp, obj) {
    switch(comp.type) {
      case 'MeshRenderer': return this._makeMeshRendererBlock(comp, obj);
      case 'Light': return this._makeLightBlock(comp);
      case 'Camera': return this._makeCameraBlock(comp);
      case 'Rigidbody': return this._makeRigidbodyBlock(comp);
      case 'BoxCollider': return this._makeBoxColliderBlock(comp);
      case 'SphereCollider': return this._makeSphereColliderBlock(comp);
      case 'CapsuleCollider': return this._makeCapsuleColliderBlock(comp);
      case 'ParticleSystem': return this._makeParticleBlock(comp);
      case 'Animator': return this._makeAnimatorBlock(comp);
      case 'AudioSource': return this._makeAudioSourceBlock(comp);
      default: return this._makeGenericScriptBlock(comp, obj);
    }
  }
  
  _makeCollapsibleBlock(title, icon = '▦') {
    const block = document.createElement('div');
    block.className = 'component-block';
    
    const header = document.createElement('div');
    header.className = 'component-header';
    
    const toggle = document.createElement('span');
    toggle.className = 'component-toggle';
    toggle.textContent = '▼';
    
    const t = document.createElement('span');
    t.className = 'component-title';
    t.textContent = title;
    
    const menuBtn = document.createElement('button');
    menuBtn.className = 'component-menu-btn';
    menuBtn.textContent = '⋮';
    
    header.appendChild(toggle);
    header.appendChild(t);
    header.appendChild(menuBtn);
    
    const body = document.createElement('div');
    body.className = 'component-body';
    
    header.addEventListener('click', e => {
      if (e.target === menuBtn) return;
      body.classList.toggle('collapsed');
      toggle.textContent = body.classList.contains('collapsed') ? '▶' : '▼';
    });
    
    block.appendChild(header);
    block.appendChild(body);
    return block;
  }
  
  _makeVec3Row(label, vec, onChange) {
    const row = document.createElement('div');
    row.className = 'prop-row';
    
    const l = document.createElement('span');
    l.className = 'prop-label'; l.textContent = label;
    
    const vals = document.createElement('div');
    vals.className = 'prop-value';
    const inputs = document.createElement('div');
    inputs.className = 'vec-inputs';
    
    ['x','y','z'].forEach((axis, i) => {
      const g = document.createElement('div');
      g.className = 'vec-group';
      const lbl = document.createElement('span');
      lbl.className = `vec-label vec-${axis}-label`;
      lbl.textContent = axis.toUpperCase();
      const inp = document.createElement('input');
      inp.type = 'number';
      inp.step = '0.01';
      inp.value = (vec[axis] || 0).toFixed(3);
      inp.addEventListener('change', () => onChange(axis, parseFloat(inp.value) || 0));
      inp.addEventListener('input', () => onChange(axis, parseFloat(inp.value) || 0));
      // Click and drag to change value
      let dragging = false, startY = 0, startVal = 0;
      lbl.style.cursor = 'ns-resize';
      lbl.addEventListener('mousedown', e => {
        dragging = true; startY = e.clientY; startVal = parseFloat(inp.value) || 0;
        const onMove = (e) => {
          if (!dragging) return;
          const delta = (startY - e.clientY) * 0.01;
          const newVal = startVal + delta;
          inp.value = newVal.toFixed(3);
          onChange(axis, newVal);
        };
        const onUp = () => { dragging = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
      g.appendChild(lbl); g.appendChild(inp);
      inputs.appendChild(g);
    });
    
    vals.appendChild(inputs);
    row.appendChild(l); row.appendChild(vals);
    
    // Update values periodically
    const updateVals = () => {
      if (!document.body.contains(row)) return;
      inputs.querySelectorAll('input').forEach((inp, i) => {
        const axis = ['x','y','z'][i];
        if (document.activeElement !== inp) inp.value = (vec[axis] || 0).toFixed(3);
      });
      requestAnimationFrame(updateVals);
    };
    requestAnimationFrame(updateVals);
    
    return row;
  }
  
  _makePropRow(label, valueEl) {
    const row = document.createElement('div');
    row.className = 'prop-row';
    const l = document.createElement('span');
    l.className = 'prop-label'; l.textContent = label;
    const v = document.createElement('div');
    v.className = 'prop-value';
    v.appendChild(valueEl);
    row.appendChild(l); row.appendChild(v);
    return row;
  }
  
  _makeNumberInput(val, onChange, step=0.01, min=null, max=null) {
    const inp = document.createElement('input');
    inp.type = 'number'; inp.className = 'prop-input';
    inp.value = val; inp.step = step;
    if (min !== null) inp.min = min;
    if (max !== null) inp.max = max;
    inp.addEventListener('change', () => onChange(parseFloat(inp.value)));
    return inp;
  }
  
  _makeCheckbox(val, onChange) {
    const wrap = document.createElement('div');
    wrap.className = 'prop-checkbox';
    const inp = document.createElement('input');
    inp.type = 'checkbox'; inp.checked = val;
    inp.addEventListener('change', () => onChange(inp.checked));
    wrap.appendChild(inp);
    return wrap;
  }
  
  _makeSelect(options, val, onChange) {
    const sel = document.createElement('select');
    sel.className = 'prop-select';
    options.forEach(o => {
      const opt = document.createElement('option');
      opt.value = typeof o === 'object' ? o.value : o;
      opt.textContent = typeof o === 'object' ? o.label : o;
      opt.selected = opt.value === String(val);
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => onChange(sel.value));
    return sel;
  }
  
  _makeColorInput(color, onChange) {
    const wrap = document.createElement('div');
    wrap.className = 'prop-color';
    const inp = document.createElement('input');
    inp.type = 'color';
    inp.value = color.toHex?.() || '#ffffff';
    inp.addEventListener('change', () => onChange(Color.fromHex(inp.value)));
    const aLabel = document.createElement('span');
    aLabel.style.color='var(--text-dim)'; aLabel.style.fontSize='10px'; aLabel.textContent='A';
    const aInp = document.createElement('input');
    aInp.type='number'; aInp.min='0'; aInp.max='1'; aInp.step='0.01';
    aInp.value = color.a ?? 1;
    aInp.style.width='50px'; aInp.className='prop-input';
    aInp.addEventListener('change', () => { const c=Color.fromHex(inp.value); c.a=parseFloat(aInp.value)||1; onChange(c); });
    wrap.appendChild(inp); wrap.appendChild(aLabel); wrap.appendChild(aInp);
    return wrap;
  }
  
  _makeSliderRow(label, val, min, max, step, onChange) {
    const row = document.createElement('div');
    row.className = 'prop-row';
    const l = document.createElement('span'); l.className='prop-label'; l.textContent=label;
    const wrap = document.createElement('div'); wrap.className='prop-value';
    const slider = document.createElement('div'); slider.className='prop-slider';
    const range = document.createElement('input'); range.type='range'; range.min=min; range.max=max; range.step=step; range.value=val;
    const num = document.createElement('input'); num.type='number'; num.min=min; num.max=max; num.step=step; num.value=val; num.className='prop-input'; num.style.width='60px';
    range.addEventListener('input', ()=>{num.value=range.value;onChange(parseFloat(range.value));});
    num.addEventListener('change',()=>{range.value=num.value;onChange(parseFloat(num.value));});
    slider.appendChild(range); slider.appendChild(num); wrap.appendChild(slider);
    row.appendChild(l); row.appendChild(wrap);
    return row;
  }
  
  // ===== COMPONENT INSPECTORS =====
  
  _makeMeshRendererBlock(comp, obj) {
    const block = this._makeCollapsibleBlock('Mesh Renderer', '📦');
    const body = block.querySelector('.component-body');
    
    // Mesh selector
    const meshSel = this._makeSelect(
      ['Cube','Sphere','Plane','Cylinder','Capsule','Quad','Torus'],
      comp.mesh?.name || comp.meshName || 'Cube',
      (v) => { comp.meshName = v; comp.mesh = this.engine.renderer.getMesh(v); }
    );
    body.appendChild(this._makePropRow('Mesh', meshSel));
    
    // Material
    if (comp.material) {
      const mat = comp.material;
      const colorInput = this._makeColorInput(mat.color, (c) => { mat.color = c; });
      body.appendChild(this._makePropRow('Albedo Color', colorInput));
      body.appendChild(this._makeSliderRow('Metallic', mat.metallic, 0, 1, 0.01, v => mat.metallic=v));
      body.appendChild(this._makeSliderRow('Roughness', mat.roughness, 0, 1, 0.01, v => mat.roughness=v));
      const shaderSel = this._makeSelect(['standard','unlit','transparent'], mat.shader, v => mat.shader=v);
      body.appendChild(this._makePropRow('Shader', shaderSel));
      body.appendChild(this._makePropRow('Double Sided', this._makeCheckbox(mat.doubleSided, v=>mat.doubleSided=v)));
      body.appendChild(this._makePropRow('Wireframe', this._makeCheckbox(mat.wireframe, v=>mat.wireframe=v)));
    } else {
      const btn = document.createElement('button');
      btn.textContent = 'Criar Material'; btn.className='btn-open-script';
      btn.addEventListener('click', () => {
        comp.material = new Material('Material');
        this.render(obj);
      });
      body.appendChild(btn);
    }
    
    body.appendChild(this._makePropRow('Cast Shadows', this._makeCheckbox(comp.castShadows, v=>comp.castShadows=v)));
    body.appendChild(this._makePropRow('Receive Shadows', this._makeCheckbox(comp.receiveShadows, v=>comp.receiveShadows=v)));
    
    return block;
  }
  
  _makeLightBlock(comp) {
    const block = this._makeCollapsibleBlock('Light', '💡');
    const body = block.querySelector('.component-body');
    
    const typeSel = this._makeSelect(['directional','point','spot','area'], comp.lightType, v=>{ comp.lightType=v; this.render(this.currentObject); });
    body.appendChild(this._makePropRow('Type', typeSel));
    body.appendChild(this._makePropRow('Color', this._makeColorInput(comp.color, c=>comp.color=c)));
    body.appendChild(this._makeSliderRow('Intensity', comp.intensity, 0, 10, 0.01, v=>comp.intensity=v));
    
    if (comp.lightType === 'point' || comp.lightType === 'spot') {
      body.appendChild(this._makeSliderRow('Range', comp.range, 0, 100, 0.1, v=>comp.range=v));
    }
    if (comp.lightType === 'spot') {
      body.appendChild(this._makeSliderRow('Spot Angle', comp.spotAngle, 1, 179, 1, v=>comp.spotAngle=v));
    }
    body.appendChild(this._makePropRow('Cast Shadows', this._makeCheckbox(comp.castShadows, v=>comp.castShadows=v)));
    
    return block;
  }
  
  _makeCameraBlock(comp) {
    const block = this._makeCollapsibleBlock('Camera', '🎥');
    const body = block.querySelector('.component-body');
    
    body.appendChild(this._makePropRow('Orthographic', this._makeCheckbox(comp.orthographic, v=>{ comp.orthographic=v; this.render(this.currentObject); })));
    if (!comp.orthographic) {
      body.appendChild(this._makeSliderRow('FOV', comp.fov, 1, 180, 1, v=>comp.fov=v));
    } else {
      body.appendChild(this._makeSliderRow('Ortho Size', comp.orthoSize, 0.1, 100, 0.1, v=>comp.orthoSize=v));
    }
    body.appendChild(this._makePropRow('Near', this._makeNumberInput(comp.near, v=>comp.near=v, 0.001, 0.001)));
    body.appendChild(this._makePropRow('Far', this._makeNumberInput(comp.far, v=>comp.far=v, 1, 0.1)));
    body.appendChild(this._makePropRow('Clear Color', this._makeColorInput(comp.clearColor, c=>comp.clearColor=c)));
    body.appendChild(this._makePropRow('Depth', this._makeNumberInput(comp.depth, v=>comp.depth=v, 1)));
    
    const setMainBtn = document.createElement('button');
    setMainBtn.className = 'btn-open-script';
    setMainBtn.textContent = 'Definir como Câmera Principal';
    setMainBtn.addEventListener('click', () => { /* engine will use first camera component */ });
    body.appendChild(setMainBtn);
    
    return block;
  }
  
  _makeRigidbodyBlock(comp) {
    const block = this._makeCollapsibleBlock('Rigidbody', '⚙');
    const body = block.querySelector('.component-body');
    
    body.appendChild(this._makePropRow('Mass', this._makeNumberInput(comp.mass, v=>comp.mass=Math.max(0.001,v), 0.01, 0.001)));
    body.appendChild(this._makeSliderRow('Drag', comp.drag, 0, 1, 0.001, v=>comp.drag=v));
    body.appendChild(this._makeSliderRow('Angular Drag', comp.angularDrag, 0, 1, 0.001, v=>comp.angularDrag=v));
    body.appendChild(this._makePropRow('Use Gravity', this._makeCheckbox(comp.useGravity, v=>comp.useGravity=v)));
    body.appendChild(this._makePropRow('Is Kinematic', this._makeCheckbox(comp.isKinematic, v=>comp.isKinematic=v)));
    
    // Constraints
    const conLabel = document.createElement('div');
    conLabel.style.cssText='font-size:10px;color:var(--text-dim);text-transform:uppercase;margin:8px 0 4px;letter-spacing:1px;';
    conLabel.textContent='Freeze Position';
    body.appendChild(conLabel);
    
    const posWrap = document.createElement('div');
    posWrap.style.cssText='display:flex;gap:8px;';
    ['X','Y','Z'].forEach(axis => {
      const lbl = document.createElement('label');
      lbl.style.cssText='display:flex;align-items:center;gap:3px;font-size:11px;';
      const cb = document.createElement('input'); cb.type='checkbox';
      const key = 'freezePosition'+axis;
      cb.checked = comp.constraints[key] || false;
      cb.addEventListener('change', () => comp.constraints[key]=cb.checked);
      lbl.appendChild(cb); lbl.appendChild(document.createTextNode(axis));
      posWrap.appendChild(lbl);
    });
    body.appendChild(posWrap);
    
    const rotLabel = document.createElement('div');
    rotLabel.style.cssText='font-size:10px;color:var(--text-dim);text-transform:uppercase;margin:8px 0 4px;letter-spacing:1px;';
    rotLabel.textContent='Freeze Rotation';
    body.appendChild(rotLabel);
    
    const rotWrap = document.createElement('div');
    rotWrap.style.cssText='display:flex;gap:8px;';
    ['X','Y','Z'].forEach(axis => {
      const lbl = document.createElement('label');
      lbl.style.cssText='display:flex;align-items:center;gap:3px;font-size:11px;';
      const cb = document.createElement('input'); cb.type='checkbox';
      const key = 'freezeRotation'+axis;
      cb.checked = comp.constraints[key] || false;
      cb.addEventListener('change', () => comp.constraints[key]=cb.checked);
      lbl.appendChild(cb); lbl.appendChild(document.createTextNode(axis));
      rotWrap.appendChild(lbl);
    });
    body.appendChild(rotWrap);
    
    return block;
  }
  
  _makeBoxColliderBlock(comp) {
    const block = this._makeCollapsibleBlock('Box Collider', '⬜');
    const body = block.querySelector('.component-body');
    body.appendChild(this._makePropRow('Is Trigger', this._makeCheckbox(comp.isTrigger, v=>comp.isTrigger=v)));
    body.appendChild(this._makeVec3Row('Center', comp.center, (ax,v)=>{comp.center[ax]=v;}));
    body.appendChild(this._makeVec3Row('Size', comp.size, (ax,v)=>{comp.size[ax]=v;}));
    return block;
  }
  
  _makeSphereColliderBlock(comp) {
    const block = this._makeCollapsibleBlock('Sphere Collider', '🔵');
    const body = block.querySelector('.component-body');
    body.appendChild(this._makePropRow('Is Trigger', this._makeCheckbox(comp.isTrigger, v=>comp.isTrigger=v)));
    body.appendChild(this._makeVec3Row('Center', comp.center, (ax,v)=>{comp.center[ax]=v;}));
    body.appendChild(this._makePropRow('Radius', this._makeNumberInput(comp.radius, v=>comp.radius=v, 0.01, 0)));
    return block;
  }
  
  _makeCapsuleColliderBlock(comp) {
    const block = this._makeCollapsibleBlock('Capsule Collider', '💊');
    const body = block.querySelector('.component-body');
    body.appendChild(this._makePropRow('Is Trigger', this._makeCheckbox(comp.isTrigger, v=>comp.isTrigger=v)));
    body.appendChild(this._makePropRow('Radius', this._makeNumberInput(comp.radius, v=>comp.radius=v, 0.01, 0)));
    body.appendChild(this._makePropRow('Height', this._makeNumberInput(comp.height, v=>comp.height=v, 0.1, 0)));
    return block;
  }
  
  _makeParticleBlock(comp) {
    const block = this._makeCollapsibleBlock('Particle System', '✨');
    const body = block.querySelector('.component-body');
    
    body.appendChild(this._makePropRow('Max Particles', this._makeNumberInput(comp.maxParticles, v=>comp.maxParticles=Math.round(v), 1, 1)));
    body.appendChild(this._makePropRow('Emission Rate', this._makeNumberInput(comp.emissionRate, v=>comp.emissionRate=v, 1, 0)));
    body.appendChild(this._makePropRow('Duration', this._makeNumberInput(comp.duration, v=>comp.duration=v, 0.1, 0)));
    body.appendChild(this._makePropRow('Loop', this._makeCheckbox(comp.loop, v=>comp.loop=v)));
    body.appendChild(this._makePropRow('Play On Awake', this._makeCheckbox(comp.playOnAwake, v=>comp.playOnAwake=v)));
    body.appendChild(this._makeSliderRow('Gravity Modifier', comp.gravityModifier, -5, 5, 0.01, v=>comp.gravityModifier=v));
    
    const shapeSel = this._makeSelect(['sphere','cone','box','circle','point'], comp.shape, v=>comp.shape=v);
    body.appendChild(this._makePropRow('Shape', shapeSel));
    body.appendChild(this._makePropRow('Shape Radius', this._makeNumberInput(comp.shapeRadius, v=>comp.shapeRadius=v, 0.1, 0)));
    
    body.appendChild(this._makePropRow('Start Color', this._makeColorInput(comp.startColor, c=>comp.startColor=c)));
    body.appendChild(this._makePropRow('End Color', this._makeColorInput(comp.endColor, c=>comp.endColor=c)));
    
    const playBtn = document.createElement('button');
    playBtn.className='btn-open-script'; playBtn.textContent='▶ Play / Stop';
    playBtn.addEventListener('click',()=>{ if(comp._playing)comp.stop(); else comp.play(); });
    body.appendChild(playBtn);
    
    return block;
  }
  
  _makeAnimatorBlock(comp) {
    const block = this._makeCollapsibleBlock('Animator', '🎬');
    const body = block.querySelector('.component-body');
    body.appendChild(this._makePropRow('Speed', this._makeNumberInput(comp.speed, v=>comp.speed=v, 0.01)));
    body.appendChild(this._makePropRow('Apply Root Motion', this._makeCheckbox(comp.applyRootMotion, v=>comp.applyRootMotion=v)));
    const btn = document.createElement('button'); btn.className='btn-open-script'; btn.textContent='Abrir Animator Controller';
    btn.addEventListener('click', ()=>this.engine.openAnimator(comp));
    body.appendChild(btn);
    return block;
  }
  
  _makeAudioSourceBlock(comp) {
    const block = this._makeCollapsibleBlock('Audio Source', '🔊');
    const body = block.querySelector('.component-body');
    body.appendChild(this._makeSliderRow('Volume', comp.volume, 0, 1, 0.01, v=>comp.volume=v));
    body.appendChild(this._makeSliderRow('Pitch', comp.pitch, 0.1, 3, 0.01, v=>comp.pitch=v));
    body.appendChild(this._makePropRow('Loop', this._makeCheckbox(comp.loop, v=>comp.loop=v)));
    body.appendChild(this._makePropRow('Play On Awake', this._makeCheckbox(comp.playOnAwake, v=>comp.playOnAwake=v)));
    const btn = document.createElement('button'); btn.className='btn-open-script'; btn.textContent='▶ Play';
    btn.addEventListener('click',()=>comp.play());
    body.appendChild(btn);
    return block;
  }
  
  _makeGenericScriptBlock(comp, obj) {
    const block = this._makeCollapsibleBlock(comp.type || comp.constructor?.name || 'Script', '📄');
    const header = block.querySelector('.component-header');
    const body = block.querySelector('.component-body');
    
    // Enable checkbox
    const enableCb = document.createElement('input');
    enableCb.type='checkbox'; enableCb.checked=comp.enabled;
    enableCb.addEventListener('change',()=>{ comp.enabled=enableCb.checked; if(comp.enabled)comp.onEnable?.(); else comp.onDisable?.(); });
    header.insertBefore(enableCb, header.firstChild);
    
    // Remove button
    const removeBtn = block.querySelector('.component-menu-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (confirm(`Remover ${comp.type}?`)) {
          obj.removeComponent(comp);
          this.render(obj);
        }
      });
    }
    
    // Show exposed fields
    if (comp._fields) {
      for (const [fieldName, fieldType] of Object.entries(comp._fieldTypes || {})) {
        let inputEl;
        const val = comp[fieldName];
        if (val instanceof Vec3) {
          inputEl = this._makeVec3Row(fieldName, val, (ax,v)=>val[ax]=v);
          body.appendChild(inputEl);
          continue;
        } else if (val instanceof Color) {
          inputEl = this._makeColorInput(val, c=>comp[fieldName]=c);
        } else if (fieldType === 'boolean' || typeof val === 'boolean') {
          inputEl = this._makeCheckbox(val, v=>comp[fieldName]=v);
        } else if (fieldType === 'float' || fieldType === 'int' || typeof val === 'number') {
          inputEl = this._makeNumberInput(val, v=>comp[fieldName]=v);
        } else {
          inputEl = document.createElement('input');
          inputEl.className='prop-input'; inputEl.value=String(val||'');
          inputEl.addEventListener('change',()=>comp[fieldName]=inputEl.value);
        }
        body.appendChild(this._makePropRow(fieldName, inputEl));
      }
    }
    
    // Open script button
    const openBtn = document.createElement('button');
    openBtn.className='btn-open-script';
    openBtn.textContent='Editar Script: ' + (comp.type||'Script');
    openBtn.addEventListener('click',()=>this.engine.openScript(comp.type));
    body.appendChild(openBtn);
    
    return block;
  }
}
