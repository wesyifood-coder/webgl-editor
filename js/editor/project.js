/**
 * WebGL Engine - Project Panel
 */
class ProjectPanel {
  constructor(engine) {
    this.engine = engine;
    this.el = document.getElementById('project-assets-grid');
    this.currentFolder = 'all';
    this._setupFolders();
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
  
  render() {
    if (!this.el) return;
    this.el.innerHTML = '';
    const assets = this.engine.assets || [];
    const filtered = this.currentFolder === 'all' ? assets : assets.filter(a => a.type === this.currentFolder.replace(/s$/,''));
    
    for (const asset of filtered) {
      const item = document.createElement('div');
      item.className = 'asset-item';
      item.dataset.type = asset.type;
      item.dataset.name = asset.name;
      
      const icon = document.createElement('div');
      icon.className = 'asset-icon';
      icon.textContent = this._getAssetIcon(asset.type);
      
      const name = document.createElement('div');
      name.className = 'asset-name';
      name.textContent = asset.name;
      name.title = asset.name;
      
      item.appendChild(icon);
      item.appendChild(name);
      
      item.addEventListener('click', () => {
        document.querySelectorAll('.asset-item').forEach(x=>x.classList.remove('selected'));
        item.classList.add('selected');
        this.engine.selectAsset(asset);
      });
      
      item.addEventListener('dblclick', () => {
        if (asset.type === 'script') this.engine.openScript(asset.name, asset.content);
        if (asset.type === 'scene') this.engine.loadScene(asset.name);
        if (asset.type === 'material') this.engine.openMaterialEditor(asset);
      });
      
      item.addEventListener('contextmenu', e => {
        e.preventDefault();
        // Show asset context menu
      });
      
      this.el.appendChild(item);
    }
    
    // Empty state
    if (filtered.length === 0) {
      this.el.innerHTML = '<div style="color:var(--text-dim);padding:20px;font-size:11px;text-align:center;">Nenhum asset</div>';
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
