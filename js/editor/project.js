/**
 * WebGL Engine - Project Panel
 */
class ProjectPanel {
  constructor(engine) {
    this.engine = engine;
    this.el = document.getElementById('project-assets-grid');
    this.currentFolder = 'all';
    this._setupFolders();
    this._setupGlobalContextClose();
  }

  _setupFolders() {
    document.querySelectorAll('.asset-folder').forEach(f => {
      f.addEventListener('click', () => {
        document.querySelectorAll('.asset-folder').forEach(x=>x.classList.remove('active'));
        f.classList.add('active');
        this.currentFolder = f.dataset.folder;
        this.render();
      });
    });
  }

  _setupGlobalContextClose() {
    document.addEventListener('click', () => this._closeContextMenu());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this._closeContextMenu(); });
  }

  _closeContextMenu() {
    document.getElementById('asset-ctx-menu')?.remove();
  }

  _showContextMenu(x, y, asset) {
    this._closeContextMenu();

    const menu = document.createElement('div');
    menu.id = 'asset-ctx-menu';
    menu.style.cssText = `position:fixed;left:${x}px;top:${y}px;background:#2a2a2e;border:1px solid #444;
      border-radius:5px;z-index:99999;min-width:160px;box-shadow:0 4px 16px rgba(0,0,0,0.6);padding:4px 0;`;

    const addItem = (label, icon, action, danger = false) => {
      const el = document.createElement('div');
      el.style.cssText = `padding:7px 14px;cursor:pointer;font-size:12px;color:${danger ? '#e74c3c' : '#ddd'};
        display:flex;align-items:center;gap:8px;`;
      el.innerHTML = `<span style="font-size:13px;">${icon}</span>${label}`;
      el.addEventListener('mouseenter', () => el.style.background = danger ? 'rgba(231,76,60,0.15)' : '#3a3a5a');
      el.addEventListener('mouseleave', () => el.style.background = '');
      el.addEventListener('click', () => { this._closeContextMenu(); action(); });
      menu.appendChild(el);
    };

    const addSep = () => {
      const s = document.createElement('div');
      s.style.cssText = 'height:1px;background:#333;margin:3px 0;';
      menu.appendChild(s);
    };

    // Open / edit
    if (asset.type === 'script' || asset.type === 'shader') {
      addItem('Abrir Editor', '✏️', () => {
        if (asset.type === 'script') this.engine.openScript(asset.name, asset.content);
        else {
          document.getElementById('shader-code-modal')?.classList.remove('hidden');
          document.getElementById('vertex-shader-code').value = SHADERS.standardVert;
          document.getElementById('fragment-shader-code').value = asset.content || SHADERS.standardFrag;
        }
      });
      addSep();
    }

    if (asset.type === 'material') {
      addItem('Editar Material', '🎨', () => this.engine.openMaterialEditor?.(asset));
      addSep();
    }

    // Rename
    addItem('Renomear', '✏', () => {
      const newName = prompt(`Renomear "${asset.name}":`, asset.name);
      if (newName && newName !== asset.name && newName.trim()) {
        // Update any references in components
        this.engine.scene?.getAllObjects().forEach(obj => {
          obj.components.forEach(c => {
            if (c.scriptName === asset.name) c.scriptName = newName.trim();
          });
        });
        asset.name = newName.trim();
        this.render();
        this.engine.notification(`Renomeado para: ${newName.trim()}`);
      }
    });

    // Duplicate
    addItem('Duplicar', '📋', () => {
      const copy = { ...asset, name: asset.name + '_Copy' };
      this.engine.assets.push(copy);
      this.render();
      this.engine.notification(`Duplicado: ${copy.name}`);
    });

    addSep();

    // Delete
    addItem('Deletar', '🗑', () => {
      if (confirm(`Deletar asset "${asset.name}"?\nEsta ação não pode ser desfeita.`)) {
        const idx = this.engine.assets.indexOf(asset);
        if (idx >= 0) this.engine.assets.splice(idx, 1);
        this.render();
        this.engine.notification(`Asset deletado: ${asset.name}`, 'warning');
      }
    }, true);

    // Clamp to viewport
    document.body.appendChild(menu);
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth)  menu.style.left = (x - rect.width)  + 'px';
    if (rect.bottom > window.innerHeight) menu.style.top = (y - rect.height) + 'px';
  }

  render() {
    if (!this.el) return;
    this.el.innerHTML = '';
    const assets = this.engine.assets || [];
    const filtered = this.currentFolder === 'all'
      ? assets
      : assets.filter(a => a.type === this.currentFolder.replace(/s$/, ''));

    for (const asset of filtered) {
      const item = document.createElement('div');
      item.className = 'asset-item';
      item.dataset.type = asset.type;
      item.dataset.name = asset.name;
      item.title = `${asset.name}\nTipo: ${asset.type}\nClique duplo para abrir • Clique direito para opções`;

      const icon = document.createElement('div');
      icon.className = 'asset-icon';
      icon.textContent = this._getAssetIcon(asset.type);

      const name = document.createElement('div');
      name.className = 'asset-name';
      name.textContent = asset.name;

      item.appendChild(icon);
      item.appendChild(name);

      item.addEventListener('click', () => {
        document.querySelectorAll('.asset-item').forEach(x => x.classList.remove('selected'));
        item.classList.add('selected');
        this.engine.selectAsset(asset);
      });

      item.addEventListener('dblclick', () => {
        if (asset.type === 'script')   this.engine.openScript(asset.name, asset.content);
        if (asset.type === 'scene')    this.engine.loadScene?.(asset.name);
        if (asset.type === 'material') this.engine.openMaterialEditor?.(asset);
        if (asset.type === 'shader') {
          document.getElementById('shader-code-modal')?.classList.remove('hidden');
          const frag = document.getElementById('fragment-shader-code');
          if (frag) frag.value = asset.content || SHADERS.standardFrag;
        }
      });

      // Right-click context menu
      item.addEventListener('contextmenu', e => {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll('.asset-item').forEach(x => x.classList.remove('selected'));
        item.classList.add('selected');
        this.engine.selectAsset(asset);
        this._showContextMenu(e.clientX, e.clientY, asset);
      });

      this.el.appendChild(item);
    }

    if (filtered.length === 0) {
      this.el.innerHTML = '<div style="color:var(--text-dim);padding:20px;font-size:11px;text-align:center;">Nenhum asset<br><span style="font-size:10px;opacity:0.6;">Crie ou importe assets via menu Assets</span></div>';
    }
  }
  
  _getAssetIcon(type) {
    switch(type) {
      case 'script': return '📄';
      case 'material': return '🎨';
      case 'texture': return '🖼';
      case 'model': return '📦';
      case 'animation': return '🎬';
      case 'scene': return '🌐';
      case 'audio': return '🔊';
      case 'shader': return '⚡';
      case 'prefab': return '💠';
      default: return '📁';
    }
  }
  
  addAsset(asset) {
    if (!this.engine.assets) this.engine.assets = [];
    this.engine.assets.push(asset);
    this.render();
  }
}
