/**
 * WebGL Engine - Menu & UI System
 */

class MenuSystem {
  constructor(engine) {
    this.engine = engine;
    this._setupMenus();
    this._setupToolbar();
    this._setupKeyboardShortcuts();
    this._setupTabSwitching();
    this._setupPlayButtons();
    this._setupBottomPanelTabs();
    this._setupAddComponent();
    this._setupQualitySelect();
    this._setupSceneOverlay();
    this._setupLightingModal();
    this._setupBuildModal();
    this._setupPreferences();
  }
  
  _setupMenus() {
    // Close menus when clicking outside
    document.addEventListener('click', e => {
      if (!e.target.closest('.menu-item')) {
        document.querySelectorAll('.dropdown').forEach(d => d.style.display = '');
      }
    });
    
    // Handle all dropdown actions
    document.querySelectorAll('[data-action]').forEach(el => {
      el.addEventListener('click', e => {
        const action = el.dataset.action;
        if (action) this.engine.executeAction(action);
      });
    });
  }
  
  _setupToolbar() {
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn[data-tool]').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        const tool = btn.dataset.tool;
        this.engine.gizmos.mode = tool;
        if (this.engine.currentView === 'modeler') {
          // handled by modeler
        }
      });
    });
    
    document.getElementById('btn-grid')?.addEventListener('click', () => {
      this.engine.renderer.showGrid = !this.engine.renderer.showGrid;
      document.getElementById('btn-grid').classList.toggle('active', this.engine.renderer.showGrid);
    });
    
    document.getElementById('btn-snap')?.addEventListener('click', () => {
      this.engine.snapEnabled = !this.engine.snapEnabled;
      document.getElementById('btn-snap').classList.toggle('active', this.engine.snapEnabled);
    });
    
    document.getElementById('btn-model-mode')?.addEventListener('click', () => {
      this.engine.switchView('modeler');
      if (this.engine.selectedObject) {
        const mr = this.engine.selectedObject.getComponent('MeshRenderer');
        if (mr?.mesh) this.engine.modeler.openMesh(mr.mesh);
      }
    });
    
    document.getElementById('btn-rig-mode')?.addEventListener('click', () => {
      this.engine.notification('Modo Rig: Adicione um Animator component primeiro', 'warning');
    });
    
    document.getElementById('btn-sculpt-mode')?.addEventListener('click', () => {
      this.engine.switchView('modeler');
    });
    
    document.getElementById('btn-pivot')?.addEventListener('click', () => {
      // Toggle pivot/center
    });
  }
  
  _setupKeyboardShortcuts() {
    window.addEventListener('keydown', e => {
      // Don't intercept when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.code) {
        case 'KeyQ': this._setTool('select'); break;
        case 'KeyW': this._setTool('move'); break;
        case 'KeyE': this._setTool('rotate'); break;
        case 'KeyR': this._setTool('scale'); break;
        case 'KeyF':
          if (this.engine.selectedObject) this.engine.renderer.focusOnObject(this.engine.selectedObject);
          break;
        case 'Delete': case 'Backspace':
          if (this.engine.selectedObject) { this.engine.executeAction('delete'); e.preventDefault(); }
          break;
        case 'KeyD': if (e.ctrlKey) { this.engine.executeAction('duplicate'); e.preventDefault(); } break;
        case 'KeyZ': if (e.ctrlKey) { this.engine.undo(); e.preventDefault(); } break;
        case 'KeyY': if (e.ctrlKey) { this.engine.redo(); e.preventDefault(); } break;
        case 'KeyS': if (e.ctrlKey) { this.engine.executeAction('save-scene'); e.preventDefault(); } break;
        case 'Space':
          if (e.target === document.body) { this.engine.togglePlay(); e.preventDefault(); }
          break;
        case 'KeyP': this.engine.togglePlay(); break;
        case 'Numpad5': this.engine.renderer.editorCamera.orthographic = !this.engine.renderer.editorCamera.orthographic; break;
        case 'Numpad1': this.engine.renderer.editorCamera.yaw=180; this.engine.renderer.editorCamera.pitch=0; break;
        case 'Numpad3': this.engine.renderer.editorCamera.yaw=-90; this.engine.renderer.editorCamera.pitch=0; break;
        case 'Numpad7': this.engine.renderer.editorCamera.pitch=-89; break;
        case 'F5': this.engine.togglePlay(); e.preventDefault(); break;
        case 'F2':
          if (this.engine.selectedObject) {
            this.engine.hierarchy._renaming = this.engine.selectedObject.id;
            this.engine.hierarchy.render(this.engine.scene);
            e.preventDefault();
          }
          break;
      }
    });
  }
  
  _setTool(tool) {
    const btn = document.querySelector(`.tool-btn[data-tool="${tool}"]`);
    if (btn) { document.querySelectorAll('.tool-btn[data-tool]').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); }
    this.engine.gizmos.mode = tool;
  }
  
  _setupTabSwitching() {
    document.querySelectorAll('.view-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.dataset.view;
        this.engine.switchView(view);
      });
    });
  }
  
  _setupPlayButtons() {
    document.getElementById('btn-play')?.addEventListener('click', () => this.engine.togglePlay());
    document.getElementById('btn-pause')?.addEventListener('click', () => {
      if (this.engine.isPlaying) this.engine.scene.pause();
    });
    document.getElementById('btn-step')?.addEventListener('click', () => {
      if (this.engine.isPlaying) {
        this.engine.scene.isPlaying = true;
        this.engine._stepFrame = true;
      }
    });
  }
  
  _setupBottomPanelTabs() {
    document.querySelectorAll('.bottom-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.dataset.tab + '-tab';
        document.querySelectorAll('.bottom-tab').forEach(t=>t.classList.remove('active'));
        document.querySelectorAll('.bottom-content').forEach(c=>{ c.classList.remove('active'); c.classList.add('hidden'); });
        tab.classList.add('active');
        const content = document.getElementById(targetId);
        if (content) { content.classList.add('active'); content.classList.remove('hidden'); }
      });
    });
  }
  
  _setupAddComponent() {
    const btn = document.getElementById('btn-add-component');
    const popup = document.getElementById('add-component-popup');
    const search = document.getElementById('component-search');
    
    btn?.addEventListener('click', e => {
      e.stopPropagation();
      popup?.classList.toggle('hidden');
      search?.focus();
    });
    
    document.addEventListener('click', e => {
      if (!e.target.closest('#add-component-popup') && !e.target.closest('#btn-add-component')) {
        popup?.classList.add('hidden');
      }
    });
    
    search?.addEventListener('input', () => {
      const q = search.value.toLowerCase();
      document.querySelectorAll('.comp-item').forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
    
    document.querySelectorAll('.comp-item').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.dataset.component;
        if (type && this.engine.selectedObject) {
          this.engine.addComponentToSelected(type);
          popup?.classList.add('hidden');
        }
      });
    });
  }
  
  _setupQualitySelect() {
    document.getElementById('render-quality')?.addEventListener('change', e => {
      this.engine.renderer.quality = e.target.value;
    });
  }
  
  _setupSceneOverlay() {
    document.getElementById('btn-persp')?.addEventListener('click', () => {
      this.engine.renderer.editorCamera.orthographic = !this.engine.renderer.editorCamera.orthographic;
      document.getElementById('btn-persp').textContent = this.engine.renderer.editorCamera.orthographic ? 'O' : 'P';
    });
    
    document.getElementById('btn-wireframe')?.addEventListener('click', () => {
      this.engine.renderer.showWireframe = !this.engine.renderer.showWireframe;
      document.getElementById('btn-wireframe')?.classList.toggle('active', this.engine.renderer.showWireframe);
    });
    
    document.getElementById('btn-shaded')?.addEventListener('click', () => {
      this.engine.renderer.showWireframe = false;
      document.getElementById('btn-wireframe')?.classList.remove('active');
    });
  }
  
  _setupLightingModal() {
    document.getElementById('btn-apply-lighting')?.addEventListener('click', () => {
      const engine = this.engine;
      const scene = engine.scene;
      if (!scene) return;
      scene.ambientColor = Color.fromHex(document.getElementById('ambient-color').value);
      scene.ambientIntensity = parseFloat(document.getElementById('ambient-intensity').value);
      scene.fogEnabled = document.getElementById('pp-fog').checked;
      scene.fogColor = Color.fromHex(document.getElementById('fog-color').value);
      scene.fogDensity = parseFloat(document.getElementById('fog-density').value);
      const topHex = document.getElementById('ambient-color').value;
      scene.skyboxTopColor = Color.fromHex(topHex);
      engine.notification('Iluminação aplicada!', 'success');
      document.getElementById('lighting-modal').classList.add('hidden');
    });
    
    document.getElementById('btn-close-lighting')?.addEventListener('click', () => {
      document.getElementById('lighting-modal').classList.add('hidden');
    });
  }
  
  _setupBuildModal() {
    document.getElementById('btn-build-export')?.addEventListener('click', () => {
      this.engine.executeAction('export-project');
    });
    
    document.getElementById('btn-close-build')?.addEventListener('click', () => {
      document.getElementById('build-modal').classList.add('hidden');
    });
  }
  
  _setupPreferences() {
    document.getElementById('btn-save-prefs')?.addEventListener('click', () => {
      const token = document.getElementById('pref-github-token')?.value;
      const user = document.getElementById('pref-github-user')?.value;
      const repo = document.getElementById('pref-github-repo')?.value;
      if (token && user && repo) {
        GitHub.configure(token, user, repo);
        this.engine.notification('Preferências salvas!', 'success');
      }
      document.getElementById('preferences-modal')?.classList.add('hidden');
      this.engine.savePreferences();
    });
    
    document.getElementById('btn-close-prefs')?.addEventListener('click', () => {
      document.getElementById('preferences-modal')?.classList.add('hidden');
    });
  }
}
