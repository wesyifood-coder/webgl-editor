/**
 * WebGL Engine - Hierarchy Panel
 */

class HierarchyPanel {
  constructor(engine) {
    this.engine = engine;
    this.el = document.getElementById('hierarchy-tree');
    this._dragging = null;
    this._dragTarget = null;
    this._renaming = null;
    this._setupContextMenu();
    this._setupSearch();
  }
  
  _setupSearch() {
    const search = document.getElementById('hierarchy-search');
    search?.addEventListener('input', () => this.render(this.engine.scene));
  }
  
  _setupContextMenu() {
    const menu = document.getElementById('hierarchy-context-menu');
    document.addEventListener('click', () => menu?.classList.add('hidden'));
    
    menu?.querySelectorAll('.ctx-item').forEach(item => {
      item.addEventListener('click', e => {
        const action = item.dataset.action;
        if (action) this.engine.executeAction(action, this.engine.selectedObject);
        menu.classList.add('hidden');
      });
    });
  }
  
  render(scene) {
    if (!scene) { this.el.innerHTML = '<div class="hierarchy-empty">Cena vazia</div>'; return; }
    const search = document.getElementById('hierarchy-search')?.value.toLowerCase() || '';
    this.el.innerHTML = '';
    
    for (const obj of scene.objects) {
      this._renderObject(obj, 0, search);
    }
    
    if (this.el.children.length === 0) {
      this.el.innerHTML = '<div class="hierarchy-empty">Nenhum objeto</div>';
    }
    
    this._setupDragDrop();
  }
  
  _renderObject(obj, depth, search) {
    // Filter by search
    if (search && !obj.name.toLowerCase().includes(search)) {
      for (const child of obj.children) this._renderObject(child, depth, search);
      return;
    }
    
    const item = document.createElement('div');
    item.className = 'hierarchy-item' + (obj === this.engine.selectedObject ? ' selected' : '') + (!obj.active ? ' inactive' : '');
    item.dataset.id = obj.id;
    item.draggable = true;
    
    // Indent
    const indent = document.createElement('div');
    indent.className = 'hierarchy-indent';
    indent.style.width = (depth * 16) + 'px';
    item.appendChild(indent);
    
    // Expand button
    if (obj.children.length > 0) {
      const expand = document.createElement('button');
      expand.className = 'hierarchy-expand';
      const isExpanded = !this.engine._collapsed?.has(obj.id);
      expand.textContent = isExpanded ? '▼' : '▶';
      expand.addEventListener('click', e => {
        e.stopPropagation();
        if (!this.engine._collapsed) this.engine._collapsed = new Set();
        if (this.engine._collapsed.has(obj.id)) this.engine._collapsed.delete(obj.id);
        else this.engine._collapsed.add(obj.id);
        this.render(this.engine.scene);
      });
      item.appendChild(expand);
    } else {
      const ph = document.createElement('div');
      ph.className = 'hierarchy-expand-placeholder';
      item.appendChild(ph);
    }
    
    // Icon
    const icon = document.createElement('span');
    icon.className = 'hierarchy-icon';
    icon.textContent = this._getIcon(obj);
    item.appendChild(icon);
    
    // Name
    if (this._renaming === obj.id) {
      const input = document.createElement('input');
      input.className = 'hierarchy-name-input';
      input.value = obj.name;
      input.addEventListener('blur', () => {
        obj.name = input.value || obj.name;
        this._renaming = null;
        this.render(this.engine.scene);
        this.engine.inspector?.render(obj);
      });
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') input.blur();
        if (e.key === 'Escape') { this._renaming = null; this.render(this.engine.scene); }
      });
      item.appendChild(input);
      setTimeout(() => input.focus(), 0);
    } else {
      const name = document.createElement('span');
      name.className = 'hierarchy-name';
      name.textContent = obj.name;
      item.appendChild(name);
    }
    
    // Events
    item.addEventListener('click', e => {
      e.stopPropagation();
      this.engine.selectObject(obj);
    });
    
    item.addEventListener('dblclick', e => {
      e.stopPropagation();
      this._renaming = obj.id;
      this.render(this.engine.scene);
    });
    
    item.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();
      this.engine.selectObject(obj);
      const menu = document.getElementById('hierarchy-context-menu');
      if (menu) {
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        menu.classList.remove('hidden');
      }
    });
    
    this.el.appendChild(item);
    
    // Children
    const isExpanded = !this.engine._collapsed?.has(obj.id);
    if (isExpanded) {
      for (const child of obj.children) {
        this._renderObject(child, depth + 1, search);
      }
    }
  }
  
  _getIcon(obj) {
    const light = obj.getComponent('Light');
    const cam = obj.getComponent('Camera');
    const ps = obj.getComponent('ParticleSystem');
    const mr = obj.getComponent('MeshRenderer');
    const mesh = mr?.mesh?.name || mr?.meshName || '';
    
    if (light) return light.lightType === 'directional' ? '☀' : light.lightType === 'spot' ? '🔦' : '💡';
    if (cam) return '🎥';
    if (ps) return '✨';
    if (mesh === 'Sphere') return '⚽';
    if (mesh === 'Plane') return '▬';
    if (mesh === 'Cylinder') return '⬤';
    if (obj.children.length > 0) return '📁';
    if (mr) return '📦';
    return '◽';
  }
  
  _setupDragDrop() {
    this.el.querySelectorAll('.hierarchy-item').forEach(item => {
      const id = parseInt(item.dataset.id);
      
      item.addEventListener('dragstart', e => {
        this._dragging = id;
        e.dataTransfer.effectAllowed = 'move';
      });
      
      item.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        this.el.querySelectorAll('.hierarchy-item').forEach(el => el.classList.remove('drop-target'));
        item.classList.add('drop-target');
        this._dragTarget = id;
      });
      
      item.addEventListener('drop', e => {
        e.preventDefault();
        item.classList.remove('drop-target');
        if (this._dragging && this._dragTarget && this._dragging !== this._dragTarget) {
          const scene = this.engine.scene;
          const src = scene.findById(this._dragging);
          const tgt = scene.findById(this._dragTarget);
          if (src && tgt && !this._isAncestor(src, tgt)) {
            if (src.parent) src.parent.removeChild(src);
            else { const idx = scene.objects.indexOf(src); if(idx>=0)scene.objects.splice(idx,1); }
            tgt.addChild(src);
            this.render(scene);
          }
        }
        this._dragging = null;
        this._dragTarget = null;
      });
      
      item.addEventListener('dragend', () => {
        this.el.querySelectorAll('.hierarchy-item').forEach(el => el.classList.remove('drop-target'));
        this._dragging = null;
        this._dragTarget = null;
      });
    });
  }
  
  _isAncestor(potentialAncestor, obj) {
    let p = obj.parent;
    while (p) { if (p === potentialAncestor) return true; p = p.parent; }
    return false;
  }
  
  selectItem(obj) {
    this.el.querySelectorAll('.hierarchy-item').forEach(el => {
      el.classList.toggle('selected', parseInt(el.dataset.id) === obj?.id);
    });
  }
}
