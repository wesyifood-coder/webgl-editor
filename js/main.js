/**
 * WebGL Engine - Main Entry Point
 * Ties everything together and boots the engine
 */

class Engine {
  constructor() {
    this.scene = null;
    this.selectedObject = null;
    this.selectedAsset = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentView = 'scene';
    this.assets = [];
    this.projects = [];
    this.currentProject = null;
    this.snapEnabled = false;
    this._collapsed = new Set();
    this._undoStack = [];
    this._redoStack = [];
    this._stepFrame = false;

    // Systems
    this.renderer = null;
    this.gameRenderer = null;
    this.physics = new PhysicsWorld();
    this.scriptingEngine = new ScriptingEngine();
    this.lightingSystem = new LightingSystem();

    // Editor panels
    this.hierarchy = null;
    this.inspector = null;
    this.projectPanel = null;
    this.timeline = null;
    this.animatorEditor = null;
    this.shaderGraph = null;
    this.modeler = null;
    this.gizmos = null;
    this.menus = null;
    this.mobileUI = null;

    this._lastTime = 0;
    this._animFrame = null;

    // Console bridge
    this.editorConsole = {
      log: (...a) => this._consoleLog('log', ...a),
      warn: (...a) => this._consoleLog('warn', ...a),
      error: (...a) => this._consoleLog('error', ...a),
    };

    const origLog = console.log.bind(console);
    const origWarn = console.warn.bind(console);
    const origError = console.error.bind(console);
    console.log = (...a) => { origLog(...a); this._consoleLog('log', ...a); };
    console.warn = (...a) => { origWarn(...a); this._consoleLog('warn', ...a); };
    console.error = (...a) => { origError(...a); this._consoleLog('error', ...a); };

    window.engine = this;
    window.Engine = { scene: null, instantiate: (p, pos, rot) => this.instantiate(p, pos, rot) };
    window.Time = Time;
  }

  async init() {
    this._showStartupScreen();
  }

  _showStartupScreen() {
    const startup = document.getElementById('startup-screen');
    const editor = document.getElementById('editor');
    if (startup) startup.style.display = 'flex';
    if (editor) editor.classList.add('hidden');
    this._loadProjects().then ? this._loadProjects() : this._loadProjects();
    this._setupStartupUI();
  }

  _setupStartupUI() {
    document.getElementById('btn-new-project')?.addEventListener('click', () => {
      document.getElementById('new-project-dialog')?.classList.remove('hidden');
    });

    document.getElementById('btn-cancel-project')?.addEventListener('click', () => {
      document.getElementById('new-project-dialog')?.classList.add('hidden');
    });

    document.getElementById('btn-create-project')?.addEventListener('click', () => {
      const name = document.getElementById('project-name')?.value.trim() || 'MeuProjeto';
      const template = document.getElementById('project-template')?.value || '3d';
      this._createProject(name, template);
      document.getElementById('new-project-dialog')?.classList.add('hidden');
    });

    document.getElementById('btn-open-project')?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,.wgproj';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          const text = await file.text();
          try {
            const data = JSON.parse(text);
            this._loadProjectData(data);
          } catch (err) {
            alert('Arquivo de projeto inválido');
          }
        }
      };
      input.click();
    });

    document.getElementById('btn-github-connect')?.addEventListener('click', async () => {
      const token = document.getElementById('github-token')?.value.trim();
      const user = document.getElementById('github-user')?.value.trim();
      const repo = document.getElementById('github-repo')?.value.trim();
      const folder = document.getElementById('github-folder')?.value.trim() || '';
      if (token && user && repo) {
        GitHub.configure(token, user, repo, folder);
        const creds = { token, user, repo, folder };
        Storage.saveGitHubCreds(creds);
        try { localStorage.setItem('wge-github', JSON.stringify(creds)); } catch(e) {}
        
        // Try to load project from GitHub
        this.notification('GitHub conectado! Verificando projeto...', 'success');
        try {
          const ghProj = await GitHub.loadProject();
          if (ghProj) {
            if (confirm(`Projeto encontrado no GitHub: "${ghProj.name}". Carregar agora?`)) {
              this._loadProjectData(ghProj);
              return;
            }
          }
        } catch(e) {}
        alert('GitHub conectado: ' + user + '/' + repo);
      } else {
        alert('Preencha Token, Usuário e Repositório');
      }
    });

    // Restore saved GitHub credentials (localStorage is fine for small creds)
    try {
      const creds = Storage.loadGitHubCreds() || JSON.parse(localStorage.getItem('wge-github') || 'null');
      if (creds && creds.token) {
        if (document.getElementById('github-token')) document.getElementById('github-token').value = creds.token;
        if (document.getElementById('github-user')) document.getElementById('github-user').value = creds.user || '';
        if (document.getElementById('github-repo')) document.getElementById('github-repo').value = creds.repo || '';
        if (document.getElementById('github-folder')) document.getElementById('github-folder').value = creds.folder || '';
        GitHub.configure(creds.token, creds.user, creds.repo, creds.folder);
      }
    } catch (e) {}
  }

  async _loadProjects() {
    try {
      this.projects = await Storage.listProjects();
    } catch (e) {
      try { this.projects = JSON.parse(localStorage.getItem('wge-projects') || '[]'); } catch(e2) { this.projects = []; }
    }

    const list = document.getElementById('recent-projects-list');
    if (!list) return;
    list.innerHTML = '';

    if (this.projects.length === 0) {
      list.innerHTML = '<div style="color:#555;font-size:12px;padding:20px;text-align:center;">Nenhum projeto recente</div>';
      return;
    }

    for (const proj of this.projects.slice(0, 10)) {
      const item = document.createElement('div');
      item.className = 'project-item';

      const info = document.createElement('div');
      info.innerHTML = `<div class="project-name">${proj.name}</div><div class="project-meta">${proj.template || '3d'} &bull; ${new Date(proj.lastModified || Date.now()).toLocaleDateString()}</div>`;
      
      const delBtn = document.createElement('button');
      delBtn.title = 'Excluir projeto';
      delBtn.textContent = '🗑';
      delBtn.style.cssText = 'background:none;border:none;color:#e74c3c;cursor:pointer;font-size:14px;padding:2px 6px;border-radius:3px;flex-shrink:0;';
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Excluir projeto "${proj.name}"? Esta ação não pode ser desfeita.`)) {
          await Storage.deleteProject(proj.name);
          await this._loadProjects();
        }
      });
      delBtn.addEventListener('mouseover', () => delBtn.style.background = 'rgba(231,76,60,0.15)');
      delBtn.addEventListener('mouseout', () => delBtn.style.background = 'none');

      item.style.cssText += 'display:flex;align-items:center;justify-content:space-between;';
      item.appendChild(info);
      item.appendChild(delBtn);
      info.addEventListener('click', () => this._openProjectByName(proj.name));
      list.appendChild(item);
    }
  }

  async _openProjectByName(name) {
    const proj = await Storage.loadProject(name);
    if (proj) {
      this._loadProjectData(proj);
    } else {
      // Fallback: use lightweight index entry
      const entry = this.projects.find(p => p.name === name);
      if (entry) this._loadProjectData(entry);
      else alert('Projeto não encontrado no armazenamento local.');
    }
  }

  async _saveProjectLocally(project) {
    if (!project) return;
    project.lastModified = Date.now();
    try {
      await Storage.saveProject(project);
    } catch (e) {
      // Fallback localStorage
      try {
        const list = JSON.parse(localStorage.getItem('wge-projects') || '[]');
        const idx = list.findIndex(p => p.name === project.name);
        const entry = { name: project.name, lastModified: project.lastModified, template: project.template };
        if (idx >= 0) list[idx] = entry; else list.unshift(entry);
        localStorage.setItem('wge-projects', JSON.stringify(list.slice(0, 20)));
      } catch (e2) {}
    }
  }

  _createProject(name, template) {
    const scene = new Scene(name + '_Scene');

    // Build scene from template
    if (template === '3d' || template === 'platformer' || template === 'fps') {
      // Directional light
      const lightObj = new GameObject('Directional Light');
      lightObj.transform.setPosition(0, 5, 0);
      lightObj.transform.setRotation(-45, -45, 0);
      const light = new Light();
      light.lightType = 'directional';
      light.color = new Color(1, 0.95, 0.85);
      light.intensity = 1.2;
      lightObj.addComponent(light);
      scene.add(lightObj);

      // Main camera
      const camObj = new GameObject('Main Camera');
      camObj.transform.setPosition(0, 2, 8);
      camObj.transform.setRotation(-10, 0, 0);
      camObj.addComponent(new CameraComponent());
      scene.add(camObj);

      // Ground
      const ground = new GameObject('Ground');
      ground.transform.setPosition(0, -0.05, 0);
      ground.transform.setScale(20, 0.1, 20);
      const gmr = new MeshRenderer();
      gmr.meshName = 'Cube';
      gmr.material = new Material('Ground_Mat');
      gmr.material.color = new Color(0.45, 0.65, 0.3);
      gmr.material.roughness = 0.9;
      ground.addComponent(gmr);
      ground.addComponent(new BoxCollider());
      scene.add(ground);

      // Sample cube
      const cube = new GameObject('Cube');
      cube.transform.setPosition(0, 0.5, 0);
      const cmr = new MeshRenderer();
      cmr.meshName = 'Cube';
      cmr.material = new Material('Cube_Mat');
      cmr.material.color = new Color(0.6, 0.3, 0.9);
      cmr.material.roughness = 0.4;
      cmr.material.metallic = 0.1;
      cube.addComponent(cmr);
      scene.add(cube);

      if (template === 'fps') {
        // Add FPS player controller
        const player = new GameObject('Player');
        player.transform.setPosition(0, 1, 3);
        player.addComponent(new Rigidbody());
        player.addComponent(new CapsuleCollider());
        scene.add(player);
      }
    } else if (template === '2d') {
      // Orthographic camera
      const camObj = new GameObject('Main Camera');
      camObj.transform.setPosition(0, 0, 5);
      const cam = new CameraComponent();
      cam.orthographic = true;
      cam.orthoSize = 5;
      camObj.addComponent(cam);
      scene.add(camObj);

      // Sprite-like quad
      const quad = new GameObject('Sprite');
      const qmr = new MeshRenderer();
      qmr.meshName = 'Quad';
      qmr.material = new Material('Sprite_Mat');
      qmr.material.color = new Color(1, 0.5, 0.1);
      quad.addComponent(qmr);
      scene.add(quad);
    }

    const project = {
      name, template, version: '1.0',
      lastModified: Date.now(),
      scene: scene.serialize(),
      assets: [],
      settings: { quality: 'medium', gravity: [0, -9.81, 0] }
    };

    this.currentProject = project;
    this._openEditor(scene, project);
    this._saveProjectLocally(project); // async, fire and forget
  }

  _loadProjectData(data) {
    this.currentProject = data;
    let scene;
    try {
      scene = data.scene ? Scene.deserialize(data.scene) : new Scene(data.name || 'Scene');
    } catch (e) {
      scene = new Scene(data.name || 'Scene');
      console.error('Failed to deserialize scene:', e);
    }
    this.assets = data.assets || [];
    this._openEditor(scene, data);
  }

  _openEditor(scene, project) {
    this.scene = scene;
    window.Engine.scene = scene;

    const startup = document.getElementById('startup-screen');
    const editor = document.getElementById('editor');
    if (startup) startup.style.display = 'none';
    if (editor) editor.classList.remove('hidden');

    if (!this.renderer) {
      this._initEditorSystems();
    } else {
      // Re-render with new scene
      this.hierarchy.render(scene);
      this.projectPanel.render();
    }

    // Select first object
    if (scene.objects.length > 0) {
      this.selectObject(scene.objects[0]);
    } else {
      this.inspector.render(null);
    }

    document.title = project.name + ' - WebGL Engine';
    // Restore every UI state after systems are ready
    if (project.editorState) {
      // Defer slightly so renderer is fully initialized
      requestAnimationFrame(() => this.restoreEditorState(project.editorState));
    }
    this.notification('Projeto "' + project.name + '" aberto!', 'success');
  }

  _initEditorSystems() {
    const sceneCanvas = document.getElementById('scene-canvas');
    const gameCanvas = document.getElementById('game-canvas');

    if (!sceneCanvas || !gameCanvas) {
      console.error('Canvas elements not found!');
      return;
    }

    this.renderer = new Renderer(sceneCanvas, false);
    this.gameRenderer = new Renderer(gameCanvas, true);

    this.hierarchy = new HierarchyPanel(this);
    this.inspector = new InspectorPanel(this);
    this.projectPanel = new ProjectPanel(this);
    this.timeline = new TimelineEditor(this);
    this.animatorEditor = new AnimatorEditor(this);
    this.shaderGraph = new ShaderGraphEditor(this);
    this.modeler = new ModelerEditor(this);
    this.gizmos = new GizmoRenderer(this);
    this.menus = new MenuSystem(this);
    this.mobileUI = new MobileUI();
    new ResizeSystem();

    this._setupSceneViewInteraction();
    this._setupAssetImport();
    this._addDefaultAssets();
    this._setupGlobalButtons();
    this.loadPreferences();

    this.hierarchy.render(this.scene);
    this.projectPanel.render();

    // Start render loop
    this._startLoop();
  }

  _addDefaultAssets() {
    this.assets.push({ type: 'script', name: 'PlayerController', content: DEFAULT_SCRIPT_TEMPLATE });
    // Preload script
    this.scriptingEngine.loadScript('PlayerController', DEFAULT_SCRIPT_TEMPLATE);
    this.projectPanel.render();
  }

  _setupGlobalButtons() {
    // Tool buttons (Q=select, W=move, E=rotate, R=scale)
    const toolMap = {
      'btn-tool-select': 'select',
      'btn-tool-move':   'move',
      'btn-tool-rotate': 'rotate',
      'btn-tool-scale':  'scale',
    };
    for (const [btnId, toolName] of Object.entries(toolMap)) {
      document.getElementById(btnId)?.addEventListener('click', () => this._setTool(toolName));
    }
    // Also support data-tool attribute buttons
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => this._setTool(btn.dataset.tool));
    });

    // Console
    document.getElementById('btn-clear-console')?.addEventListener('click', () => {
      const out = document.getElementById('console-output');
      if (out) out.innerHTML = '';
    });

    // Hierarchy add
    document.getElementById('btn-hierarchy-add')?.addEventListener('click', (e) => {
      e.stopPropagation();
      // Show create menu
      const actions = [
        ['Empty Object', 'create-empty'],
        ['Cube', 'create-cube'],
        ['Sphere', 'create-sphere'],
        ['Plane', 'create-plane'],
        ['Cylinder', 'create-cylinder'],
        ['Capsule', 'create-capsule'],
        ['Directional Light', 'create-dir-light'],
        ['Point Light', 'create-point-light'],
        ['Camera', 'create-camera'],
        ['Particle System', 'create-particles'],
      ];
      this._showContextMenu(e.clientX, e.clientY, actions);
    });

    // View buttons
    document.getElementById('btn-persp')?.addEventListener('click', () => {
      this.renderer.editorCamera.orthographic = !this.renderer.editorCamera.orthographic;
      document.getElementById('btn-persp').textContent = this.renderer.editorCamera.orthographic ? 'Ortho' : 'Persp';
    });

    document.getElementById('btn-wireframe')?.addEventListener('click', () => {
      this.renderer.showWireframe = !this.renderer.showWireframe;
    });

    document.getElementById('btn-shaded')?.addEventListener('click', () => {
      this.renderer.showWireframe = false;
    });

    // Reference grid toggle button (scene overlay)
    const btnGrid = document.getElementById('btn-toggle-grid');
    btnGrid?.addEventListener('click', () => {
      this.renderer.showGrid = !this.renderer.showGrid;
      btnGrid.classList.toggle('active', this.renderer.showGrid);
      this.notification(this.renderer.showGrid ? 'Grade: Ativada' : 'Grade: Desativada');
    });

    // Skybox toggle button
    const btnSkybox = document.getElementById('btn-toggle-skybox');
    btnSkybox?.addEventListener('click', () => {
      this.renderer.showSkybox = !this.renderer.showSkybox;
      btnSkybox.classList.toggle('active', this.renderer.showSkybox);
      this.notification(this.renderer.showSkybox ? 'Skybox: Ativo' : 'Skybox: Desativado');
    });

    // Script editor modal
    document.getElementById('btn-close-script')?.addEventListener('click', () => {
      document.getElementById('script-editor-modal')?.classList.add('hidden');
    });

    document.getElementById('btn-compile')?.addEventListener('click', () => {
      this._compileCurrentScript();
    });

    document.getElementById('btn-save-script')?.addEventListener('click', () => {
      this._saveCurrentScript();
    });

    // Shader code editor
    document.getElementById('btn-close-shader-code')?.addEventListener('click', () => {
      document.getElementById('shader-code-modal')?.classList.add('hidden');
    });

    document.getElementById('btn-compile-glsl')?.addEventListener('click', () => {
      this.shaderGraph._compileGLSL();
    });

    // Lighting modal
    document.getElementById('btn-apply-lighting')?.addEventListener('click', () => {
      this._applyLighting();
    });
    document.getElementById('btn-close-lighting')?.addEventListener('click', () => {
      document.getElementById('lighting-modal')?.classList.add('hidden');
    });

    // Build modal
    document.getElementById('btn-build-export')?.addEventListener('click', () => {
      this._exportProject();
    });
    document.getElementById('btn-close-build')?.addEventListener('click', () => {
      document.getElementById('build-modal')?.classList.add('hidden');
    });

    // Preferences
    document.getElementById('btn-save-prefs')?.addEventListener('click', () => {
      this.savePreferences();
      document.getElementById('preferences-modal')?.classList.add('hidden');
    });
    document.getElementById('btn-close-prefs')?.addEventListener('click', () => {
      document.getElementById('preferences-modal')?.classList.add('hidden');
    });

    // Add component popup
    document.getElementById('btn-add-component')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const popup = document.getElementById('add-component-popup');
      popup?.classList.toggle('hidden');
      document.getElementById('component-search')?.focus();
    });

    document.getElementById('component-search')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.comp-item').forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });

    document.querySelectorAll('.comp-item').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.dataset.component;
        if (type && this.selectedObject) {
          this.addComponentToSelected(type);
          document.getElementById('add-component-popup')?.classList.add('hidden');
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#add-component-popup') && !e.target.closest('#btn-add-component')) {
        document.getElementById('add-component-popup')?.classList.add('hidden');
      }
    });

    // Import asset button
    document.querySelector('[data-action="import-asset"]')?.addEventListener('click', () => {
      this._showImportAssetDialog();
    });

    // Resolution selector game view
    document.getElementById('resolution-selector')?.addEventListener('change', (e) => {
      const [w, h] = e.target.value.split('x').map(Number);
      const canvas = document.getElementById('game-canvas');
      if (canvas && w && h) { canvas.width = w; canvas.height = h; }
    });

    // Model mode buttons
    document.querySelectorAll('.model-btn[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.model-btn[data-mode]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Keyboard shortcuts
    this._setupKeyboardShortcuts();
  }

  _showContextMenu(x, y, actions) {
    const existing = document.getElementById('engine-ctx-menu');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.id = 'engine-ctx-menu';
    menu.style.cssText = `position:fixed;left:${x}px;top:${y}px;background:#2a2a2a;border:1px solid #444;border-radius:4px;z-index:10000;min-width:180px;box-shadow:0 4px 12px rgba(0,0,0,0.5);`;

    for (const [label, action] of actions) {
      const item = document.createElement('div');
      item.textContent = label;
      item.style.cssText = 'padding:6px 12px;cursor:pointer;font-size:12px;color:#ddd;';
      item.addEventListener('mouseover', () => item.style.background = '#3a3a5a');
      item.addEventListener('mouseout', () => item.style.background = '');
      item.addEventListener('click', () => { this.executeAction(action); menu.remove(); });
      menu.appendChild(item);
    }

    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 0);
  }

  _setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's': this._saveScene(); e.preventDefault(); break;
          case 'z': this.undo(); e.preventDefault(); break;
          case 'y': this.redo(); e.preventDefault(); break;
          case 'd': this._duplicateSelected(); e.preventDefault(); break;
          case 'n': this._newScene(); e.preventDefault(); break;
        }
        return;
      }

      switch (e.code) {
        case 'KeyQ': this._setTool('select'); break;
        case 'KeyW': this._setTool('move'); break;
        case 'KeyE': this._setTool('rotate'); break;
        case 'KeyR': this._setTool('scale'); break;
        case 'KeyF':
          if (this.selectedObject) this.renderer.focusOnObject(this.selectedObject);
          break;
        case 'Delete': case 'Backspace':
          if (this.selectedObject && document.activeElement === document.body) { this._deleteSelected(); e.preventDefault(); }
          break;
        case 'KeyP': this.togglePlay(); break;
        case 'F2':
          if (this.selectedObject) {
            this.hierarchy._renaming = this.selectedObject.id;
            this.hierarchy.render(this.scene);
            e.preventDefault();
          }
          break;
        case 'Numpad1': this.renderer.editorCamera.yaw = 180; this.renderer.editorCamera.pitch = 0; break;
        case 'Numpad3': this.renderer.editorCamera.yaw = -90; this.renderer.editorCamera.pitch = 0; break;
        case 'Numpad7': this.renderer.editorCamera.pitch = -89; break;
        case 'Numpad5':
          this.renderer.editorCamera.orthographic = !this.renderer.editorCamera.orthographic;
          break;
      }
    });
  }

  _setTool(tool) {
    if (this.gizmos) this.gizmos.mode = tool;
    document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
    document.querySelector(`.tool-btn[data-tool="${tool}"]`)?.classList.add('active');
    this._scheduleSave();
  }

  _setupSceneViewInteraction() {
    const canvas = document.getElementById('scene-canvas');
    if (!canvas) return;

    let mouseButtons = {};
    let lastX = 0, lastY = 0;

    canvas.addEventListener('mousedown', (e) => {
      mouseButtons[e.button] = true;
      lastX = e.clientX;
      lastY = e.clientY;

      if (e.button === 0 && !e.altKey) {
        const consumed = this.gizmos?.handleMouseDown(e, this.renderer, this.scene);
        if (!consumed) {
          const r = canvas.getBoundingClientRect();
          const picked = this.renderer.pickObject(e.clientX - r.left, e.clientY - r.top, this.scene);
          if (picked) this.selectObject(picked);
          else if (!e.shiftKey) this.selectObject(null);
        }
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      if (this.gizmos?.handleMouseMove(e, this.renderer)) return;

      if (mouseButtons[2] || (mouseButtons[1] && !e.shiftKey)) {
        this.renderer.orbitCamera(dx, dy);
      } else if (mouseButtons[1] && e.shiftKey) {
        this.renderer.panCamera(dx, dy);
      } else if (mouseButtons[0] && e.altKey) {
        if (e.shiftKey) this.renderer.panCamera(dx, dy);
        else this.renderer.orbitCamera(dx, dy);
      }
    });

    canvas.addEventListener('mouseup', (e) => {
      mouseButtons[e.button] = false;
      this.gizmos?.handleMouseUp();
    });

    canvas.addEventListener('wheel', (e) => {
      this.renderer.zoomCamera(e.deltaY);
    }, { passive: true });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('dblclick', () => {
      if (this.selectedObject) this.renderer.focusOnObject(this.selectedObject);
    });

    // Touch: orbit with 1 finger, pinch to zoom, 2-finger pan
    let touches = {};
    let pinchDist = 0;

    canvas.addEventListener('touchstart', (e) => {
      for (const t of e.changedTouches) touches[t.identifier] = { x: t.clientX, y: t.clientY };
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        // Try gizmo first
        if (this.gizmos && !touch.force) {
          const fakeEvt = { clientX: touch.clientX, clientY: touch.clientY, altKey: false, touches: e.touches, button: 0 };
          const consumed = this.gizmos.handleMouseDown(fakeEvt, this.renderer, this.scene);
          if (consumed) { e.preventDefault(); return; }
        }
      }
      if (e.touches.length === 2) {
        const a = e.touches[0], b = e.touches[1];
        pinchDist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      }
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        // Try gizmo drag first
        if (this.gizmos?._dragging) {
          const fakeEvt = { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY, touches: e.touches };
          if (this.gizmos.handleMouseMove(fakeEvt, this.renderer)) { e.preventDefault(); return; }
        }
        const t = e.touches[0];
        const prev = touches[t.identifier];
        if (prev) {
          this.renderer.orbitCamera(t.clientX - prev.x, t.clientY - prev.y);
          touches[t.identifier] = { x: t.clientX, y: t.clientY };
        }
      } else if (e.touches.length === 2) {
        const a = e.touches[0], b = e.touches[1];
        const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
        this.renderer.zoomCamera((pinchDist - dist) * 3);
        pinchDist = dist;

        const cx = (a.clientX + b.clientX) / 2;
        const cy = (a.clientY + b.clientY) / 2;
        const pc = touches['_pan'] || { x: cx, y: cy };
        this.renderer.panCamera(cx - pc.x, cy - pc.y);
        touches['_pan'] = { x: cx, y: cy };
      }
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      for (const t of e.changedTouches) delete touches[t.identifier];
      delete touches['_pan'];
    });
  }

  _setupAssetImport() {
    // File drag-drop onto project panel
    const projectPanel = document.getElementById('project-panel');
    projectPanel?.addEventListener('dragover', (e) => { e.preventDefault(); projectPanel.style.outline = '2px dashed #4a9eff'; });
    projectPanel?.addEventListener('dragleave', () => { projectPanel.style.outline = ''; });
    projectPanel?.addEventListener('drop', (e) => {
      e.preventDefault();
      projectPanel.style.outline = '';
      for (const file of e.dataTransfer.files) this._importFile(file);
    });
  }

  _showImportAssetDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,.js,.glsl,.json,.mp3,.ogg,.wav,.fbx,.obj,.gltf,.glb';
    input.onchange = (e) => {
      for (const file of e.target.files) this._importFile(file);
    };
    input.click();
  }

  async _importFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    let type = 'other';
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) type = 'texture';
    else if (['js'].includes(ext)) type = 'script';
    else if (['mp3', 'ogg', 'wav'].includes(ext)) type = 'audio';
    else if (['json', 'gltf', 'glb', 'obj'].includes(ext)) type = 'model';
    else if (['glsl'].includes(ext)) type = 'shader';

    const baseName = file.name.replace(/\.[^.]+$/, '');

    if (type === 'texture') {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        if (this.renderer) {
          const tex = this.renderer.glCtx.loadTextureFromImage?.(img);
          this.assets.push({ type: 'texture', name: baseName, content: tex, url });
        } else {
          this.assets.push({ type: 'texture', name: baseName, content: null, url });
        }
        this.projectPanel.render();
        this.notification('Textura importada: ' + file.name);
      };
      img.src = url;
    } else if (type === 'audio') {
      const clip = await AudioEngine.loadClipFromFile(baseName, file).catch(() => null);
      this.assets.push({ type: 'audio', name: baseName, content: clip });
      this.projectPanel.render();
      this.notification('Áudio importado: ' + file.name);
    } else if (type === 'script') {
      const text = await file.text();
      this.assets.push({ type: 'script', name: baseName, content: text });
      this.scriptingEngine.loadScript(baseName, text);
      this.projectPanel.render();
      this.notification('Script importado: ' + file.name);
    } else {
      const text = await file.text().catch(() => null);
      this.assets.push({ type, name: baseName, content: text });
      this.projectPanel.render();
      this.notification('Asset importado: ' + file.name);
    }
  }

  _startLoop() {
    const loop = (now) => {
      const dt = Math.min((now - (this._lastTime || now)) / 1000, 0.1);
      this._lastTime = now;

      Time._time += dt;
      Time._deltaTime = dt;
      Time._frame = (Time._frame || 0) + 1;

      if (this.scene) {
        this.scene.update(dt);
        if (this.isPlaying && !this.isPaused) {
          this.physics.step(this.scene, dt);
        }
        if (this._stepFrame) {
          this.scene.isPlaying = false;
          this._stepFrame = false;
        }
      }

      // Scene view render
      this.renderer?.render(this.scene, dt);
      if (this.gizmos && this.renderer) this.gizmos.drawGizmos(this.renderer, this.scene);

      // Game view render (if active or playing)
      if (this.currentView === 'game' || this.isPlaying) {
        this.gameRenderer?.render(this.scene, dt);
      }

      // Timeline update
      if (this.currentView === 'timeline') this.timeline?.update(dt);

      // FPS display
      this._fpsAccum = (this._fpsAccum || 0) + dt;
      if (this._fpsAccum > 0.5) {
        this._fpsAccum = 0;
        const fpsEl = document.getElementById('fps-counter');
        if (fpsEl) fpsEl.textContent = (this.renderer?.fps || 0) + ' FPS';
        const objEl = document.getElementById('object-count');
        if (objEl) objEl.textContent = (this.scene?.getAllObjects().length || 0) + ' Objetos';
      }

      Input.lateUpdate();
      this._animFrame = requestAnimationFrame(loop);
    };
    this._animFrame = requestAnimationFrame(loop);
  }

  // ===== VIEW MANAGEMENT =====
  switchView(viewName) {
    this.currentView = viewName;

    document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.view-content').forEach(c => {
      c.classList.remove('active');
      c.classList.add('hidden');
    });

    const tab = document.querySelector(`.view-tab[data-view="${viewName}"]`);
    const content = document.getElementById(viewName + '-view');
    tab?.classList.add('active');
    if (content) { content.classList.remove('hidden'); content.classList.add('active'); }

    if (viewName === 'game' && this.isPlaying && this.mobileUI?.isMobile()) {
      this.mobileUI.showMobileControls(true);
    }
  }

  // ===== PLAY MODE =====
  togglePlay() {
    if (!this.isPlaying) this._startPlay();
    else this._stopPlay();
  }

  _startPlay() {
    if (!this.scene) return;
    AudioEngine.init();
    this.isPlaying = true;
    this.scene.play();
    const btn = document.getElementById('btn-play');
    if (btn) { btn.classList.add('playing'); btn.textContent = '⏹'; }
    const status = document.getElementById('game-status');
    if (status) status.style.display = 'none';
    this.switchView('game');
    if (this.mobileUI?.isMobile()) this.mobileUI.showMobileControls(true);
    this.notification('▶ Play Mode', 'success');
  }

  _stopPlay() {
    this.isPlaying = false;
    this.isPaused = false;
    this.scene?.stop();
    const btn = document.getElementById('btn-play');
    if (btn) { btn.classList.remove('playing'); btn.textContent = '▶'; }
    const status = document.getElementById('game-status');
    if (status) { status.style.display = 'block'; status.textContent = 'Pressione Play para iniciar'; }
    this.mobileUI?.showMobileControls(false);
    this.switchView('scene');
    this.hierarchy?.render(this.scene);
    if (this.selectedObject) {
      const found = this.scene?.findById(this.selectedObject.id);
      this.selectedObject = found || null;
      this.inspector?.render(this.selectedObject);
    }
    this.notification('⏹ Editor Mode');
  }

  // ===== OBJECT SELECTION =====
  selectObject(obj) {
    this.selectedObject = obj;
    this.hierarchy?.selectItem(obj);
    this.inspector?.render(obj);
    if (this.renderer) this.renderer.selectedObject = obj;
    this._scheduleSave();
  }

  selectAsset(asset) { this.selectedAsset = asset; }

  // ===== ACTION DISPATCH =====
  executeAction(action) {
    switch (action) {
      // File
      case 'new-scene': this._newScene(); break;
      case 'save-scene': this._saveScene(); break;
      case 'save-scene-as': this._saveSceneAs(); break;
      case 'export-project': document.getElementById('build-modal')?.classList.remove('hidden'); break;
      case 'save-github': this._saveToGitHub(); break;
      case 'exit': this._showStartupScreen(); break;
      case 'import-asset': this._showImportAssetDialog(); break;
      // Edit
      case 'undo': this.undo(); break;
      case 'redo': this.redo(); break;
      case 'duplicate': this._duplicateSelected(); break;
      case 'delete': this._deleteSelected(); break;
      case 'rename-object':
        if (this.selectedObject) { this.hierarchy._renaming = this.selectedObject.id; this.hierarchy.render(this.scene); }
        break;
      case 'select-all': break;
      // GameObject
      case 'create-empty': this._createObject('Empty Object'); break;
      case 'create-cube': this._createMesh('Cube'); break;
      case 'create-sphere': this._createMesh('Sphere'); break;
      case 'create-plane': this._createMesh('Plane'); break;
      case 'create-cylinder': this._createMesh('Cylinder'); break;
      case 'create-capsule': this._createMesh('Capsule'); break;
      case 'create-quad': this._createMesh('Quad'); break;
      case 'create-torus': this._createMesh('Torus'); break;
      case 'create-dir-light': this._createLight('directional'); break;
      case 'create-point-light': this._createLight('point'); break;
      case 'create-spot-light': this._createLight('spot'); break;
      case 'create-area-light': this._createLight('area'); break;
      case 'create-camera': this._createCameraObj(); break;
      case 'create-particles': this._createParticles(); break;
      // Assets
      case 'create-script': this._createScript(); break;
      case 'create-material': this._createMaterial(); break;
      case 'create-shader': this._createShader(); break;
      // Components
      case 'add-rigidbody': this.addComponentToSelected('Rigidbody'); break;
      case 'add-collider-box': this.addComponentToSelected('BoxCollider'); break;
      case 'add-collider-sphere': this.addComponentToSelected('SphereCollider'); break;
      case 'add-script': this._createAndAddScript(); break;
      case 'add-animator': this.addComponentToSelected('Animator'); break;
      case 'add-audio': this.addComponentToSelected('AudioSource'); break;
      case 'add-camera': this.addComponentToSelected('Camera'); break;
      case 'create-anim': { const n = prompt('Nome do AnimationClip:') || 'Clip'; this.assets.push({type:'animation',name:n,content:{}}); this.projectPanel?.render(); this.notification('AnimationClip criado: '+n); } break;
      case 'create-canvas': this._createObject('Canvas UI'); break;
      case 'create-folder': this.notification('Pasta criada'); break;
      case 'refresh': this.projectPanel?.render(); this.hierarchy?.render(this.scene); break;
      case 'cut': case 'copy': case 'paste': break;
      case 'open-scene': break;
      case 'show-hierarchy': document.querySelector('.panel-tabs .tab[data-panel="hierarchy"]')?.click(); break;
      case 'documentation': window.open('https://github.com', '_blank'); break;
      case 'about': this.notification('WebGL Engine v1.0 - Powered by Anthropic Claude'); break;
      // Window
      case 'show-scene': this.switchView('scene'); break;
      case 'show-game': this.switchView('game'); break;
      case 'show-animator': this.switchView('animator'); break;
      case 'show-shader-editor': this.switchView('shader-editor'); break;
      case 'show-lighting': document.getElementById('lighting-modal')?.classList.remove('hidden'); break;
      case 'build-settings': document.getElementById('build-modal')?.classList.remove('hidden'); break;
      case 'preferences': document.getElementById('preferences-modal')?.classList.remove('hidden'); break;
      case 'show-console':
        document.querySelector('.bottom-tab[data-tab="console"]')?.click();
        break;
      case 'show-project':
        document.querySelector('.bottom-tab[data-tab="project"]')?.click();
        break;
    }
  }

  // ===== OBJECT CREATION =====
  _createObject(name) {
    this._saveUndoState();
    const obj = new GameObject(name || 'GameObject');
    // Always start at world origin
    obj.transform.setPosition(0, 0, 0);
    obj.transform.setRotation(0, 0, 0);
    obj.transform.setScale(1, 1, 1);
    this.scene.add(obj);
    this.hierarchy.render(this.scene);
    this.selectObject(obj);           // Auto-select new object
    this._scheduleSave();
    return obj;
  }

  _createMesh(meshType) {
    const obj = this._createObject(meshType);
    const mr = new MeshRenderer();
    mr.mesh = this.renderer?.getMesh(meshType);
    mr.meshName = meshType;
    mr.material = new Material(meshType + '_Mat');
    mr.material.color = new Color(0.7, 0.7, 0.75);
    mr.material.roughness = 0.5;
    mr.material.metallic = 0.0;
    obj.addComponent(mr);
    this.inspector?.render(obj);
    // Focus editor camera on new object
    if (this.renderer) this.renderer.focusOnObject(obj);
    return obj;
  }

  _createLight(type) {
    const names = { directional: 'Directional Light', point: 'Point Light', spot: 'Spot Light', area: 'Area Light' };
    const obj = this._createObject(names[type] || 'Light');
    // Lights start at origin (0,0,0) - user can position afterwards
    const light = new Light();
    light.lightType = type;
    obj.addComponent(light);
    this.inspector?.render(obj);
    if (this.renderer) this.renderer.focusOnObject(obj);
    return obj;
  }

  _createCameraObj() {
    const obj = this._createObject('Camera');
    obj.addComponent(new CameraComponent());
    this.inspector?.render(obj);
    return obj;
  }

  _createParticles() {
    const obj = this._createObject('Particle System');
    obj.addComponent(new ParticleSystem());
    this.inspector.render(obj);
    return obj;
  }

  addComponentToSelected(type) {
    if (!this.selectedObject) { this.notification('Selecione um objeto primeiro', 'warning'); return; }
    this._saveUndoState();

    let comp;
    const typeMap = {
      'Rigidbody': Rigidbody, 'BoxCollider': BoxCollider, 'SphereCollider': SphereCollider,
      'CapsuleCollider': CapsuleCollider, 'MeshCollider': MeshCollider, 'Light': Light,
      'Camera': CameraComponent, 'Animator': Animator, 'AudioSource': AudioSource,
      'ParticleSystem': ParticleSystem,
    };

    if (type === 'MeshRenderer') {
      comp = new MeshRenderer();
      comp.mesh = this.renderer.getMesh('Cube');
      comp.meshName = 'Cube';
      comp.material = new Material('Material');
    } else if (type === 'Script') {
      const scriptName = prompt('Nome do script:') || 'MyScript';
      this._createScript(scriptName);
      const Cls = this.scriptingEngine.getScriptClass(scriptName);
      comp = Cls ? new Cls() : new ScriptComponent(scriptName);
    } else if (typeMap[type]) {
      comp = new typeMap[type]();
    } else {
      const Cls = this.scriptingEngine.getScriptClass(type);
      if (Cls) comp = new Cls();
      else { this.notification('Tipo desconhecido: ' + type, 'error'); return; }
    }

    if (comp) {
      this.selectedObject.addComponent(comp);
      this.inspector.render(this.selectedObject);
      this.notification('Adicionado: ' + comp.type);
    }
  }

  instantiate(prefab, position, rotation) {
    let obj;
    if (typeof prefab === 'string') obj = this._createMesh(prefab);
    else if (prefab instanceof GameObject) {
      const data = prefab.serialize();
      data.id = generateId();
      obj = GameObject.deserialize(data, this.scene);
      this.scene.add(obj);
    } else {
      obj = new GameObject('Instance');
      this.scene.add(obj);
    }
    if (position) obj.transform.setPosition(position);
    if (rotation) obj.transform.setRotation(rotation);
    this.hierarchy?.render(this.scene);
    return obj;
  }

  // ===== EDIT OPS =====
  _duplicateSelected() {
    if (!this.selectedObject) return;
    this._saveUndoState();
    const data = this.selectedObject.serialize();
    data.name += ' (Copy)';
    data.id = generateId();
    const copy = GameObject.deserialize(data, this.scene);
    copy.transform.position.x += 1;
    copy.transform.markDirty();
    this.scene.add(copy);
    this.hierarchy.render(this.scene);
    this.selectObject(copy);
    this._scheduleSave();
  }

  _deleteSelected() {
    if (!this.selectedObject) return;
    if (!confirm('Deletar "' + this.selectedObject.name + '"?')) return;
    this._saveUndoState();
    this.scene.remove(this.selectedObject);
    this.selectObject(null);
    this.hierarchy.render(this.scene);
    this._scheduleSave();
  }

  // ===== SCENE MANAGEMENT =====
  _newScene() {
    if (confirm('Criar nova cena? Alterações não salvas serão perdidas.')) {
      this.scene = new Scene('New Scene');
      window.Engine.scene = this.scene;
      this.selectObject(null);
      this.hierarchy.render(this.scene);
      this.notification('Nova cena criada');
    }
  }

  async _saveScene() {
    if (!this.currentProject) {
      this.currentProject = { name: 'Projeto', template: '3d', version: '1.0', lastModified: Date.now() };
    }
    this.currentProject.scene = this.scene?.serialize();
    this.currentProject.assets = (this.assets || []).map(a => ({
      type: a.type, name: a.name,
      content: (a.content && typeof a.content !== 'object') ? a.content : null,
      url: a.url || null,
    }));
    this.currentProject.lastModified = Date.now();

    // Save to IndexedDB (offline) 
    await this._saveProjectLocally(this.currentProject);

    // Also save to GitHub if connected
    if (GitHub.connected) {
      try {
        await GitHub.saveProject(this.currentProject);
        this.notification('Salvo localmente e no GitHub! ✓', 'success');
      } catch (e) {
        this.notification('Salvo localmente. Erro GitHub: ' + e.message, 'warning');
      }
    } else {
      this.notification('Cena salva localmente! ✓', 'success');
    }
  }

  _saveSceneAs() {
    const name = prompt('Nome da cena:', this.scene?.name || 'Scene');
    if (!name) return;
    if (this.scene) this.scene.name = name;
    this._saveScene();
  }

  async _saveToGitHub() {
    if (!GitHub.connected) {
      this.notification('Configure o GitHub nas Preferências primeiro', 'warning');
      document.getElementById('preferences-modal')?.classList.remove('hidden');
      return;
    }
    try {
      this.notification('Salvando...', 'info');
      if (this.currentProject) {
        this.currentProject.scene = this.scene?.serialize();
        this.currentProject.assets = (this.assets || []).map(a => ({
          type: a.type, name: a.name,
          content: (a.content && typeof a.content !== 'object') ? a.content : null,
        }));
        this.currentProject.lastModified = Date.now();
      }
      const projectData = this.currentProject || { name: 'Projeto', scene: this.scene?.serialize(), assets: this.assets || [] };

      // Save locally first
      await this._saveProjectLocally(projectData);
      // Then GitHub
      await GitHub.saveProject(projectData);
      this.notification('Salvo localmente e no GitHub! ✓', 'success');
    } catch (e) {
      this.notification('Erro GitHub: ' + e.message, 'error');
    }
  }

  // ===== EXPORT =====
  async _exportProject() {
    const name = document.getElementById('build-game-name')?.value || this.currentProject?.name || 'MeuJogo';
    const opts = {
      gameName: name,
      resolution: document.getElementById('build-resolution')?.value || '1280x720',
      mobile: document.getElementById('build-mobile')?.checked !== false,
      fullscreen: document.getElementById('build-fullscreen')?.checked !== false,
    };
    this.notification('Gerando ZIP...', 'info');
    try {
      const exporter = new ProjectExporter(this);
      const zipData = await exporter.exportZip(opts);
      const blob = new Blob([zipData], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = opts.gameName + '.zip';
      a.click();
      URL.revokeObjectURL(url);
      this.notification('ZIP exportado: ' + opts.gameName + '.zip', 'success');
      document.getElementById('build-modal')?.classList.add('hidden');
    } catch (e) {
      this.notification('Erro ao exportar: ' + e.message, 'error');
    }
  }

  // Collect EVERY piece of UI state that should be persisted
  collectEditorState() {
    const cam = this.renderer?.editorCamera || {};
    return {
      // Render settings
      renderQuality: document.getElementById('render-quality')?.value || 'medium',
      showGrid:      this.renderer?.showGrid ?? true,
      showWireframe: this.renderer?.showWireframe ?? false,
      showSkybox:    this.renderer?.showSkybox ?? true,
      snapEnabled:   this.snapEnabled ?? false,
      // Editor camera
      camera: {
        yaw:          cam.yaw ?? -30,
        pitch:        cam.pitch ?? -20,
        distance:     cam.distance ?? 15,
        targetX:      cam.target?.x ?? 0,
        targetY:      cam.target?.y ?? 0,
        targetZ:      cam.target?.z ?? 0,
        orthographic: cam.orthographic ?? false,
        orthoSize:    cam.orthoSize ?? 5,
        fov:          cam.fov ?? 60,
      },
      // Viewport / game view
      gameResolution: document.getElementById('game-res-select')?.value || 'free',
      // Timeline
      timelineFps:    parseInt(document.getElementById('timeline-fps')?.value || 30),
      // Lighting (scene values are in scene.serialize; these are modal UI defaults)
      lightingAmbientColor:     document.getElementById('ambient-color')?.value     || '#1a1a2e',
      lightingAmbientIntensity: document.getElementById('ambient-intensity')?.value || '0.3',
      lightingFog:              document.getElementById('pp-fog')?.checked ?? false,
      lightingFogColor:         document.getElementById('fog-color')?.value         || '#87ceeb',
      lightingFogDensity:       document.getElementById('fog-density')?.value       || '0.01',
      lightingBloom:            document.getElementById('pp-bloom')?.checked        ?? false,
      lightingBloomIntensity:   document.getElementById('bloom-intensity')?.value   || '1',
      lightingHDR:              document.getElementById('pp-hdr')?.checked          ?? false,
      lightingShadowType:       document.getElementById('shadow-type')?.value       || 'hard',
      lightingShadowDistance:   document.getElementById('shadow-distance')?.value   || '150',
      // Build settings
      buildGameName:   document.getElementById('build-game-name')?.value  || '',
      buildVersion:    document.getElementById('build-version')?.value    || '1.0.0',
      buildResolution: document.getElementById('build-resolution')?.value || '1280x720',
      buildFullscreen: document.getElementById('build-fullscreen')?.checked ?? true,
      buildMobile:     document.getElementById('build-mobile')?.checked    ?? true,
      // Active tool
      activeTool: this.gizmos?.mode || 'select',
      // Selected object id (restore selection)
      selectedObjectId: this.selectedObject?.id || null,
      // Current view
      currentView: this.currentView || 'scene',
      // Bottom panel active tab
      activeBottomTab: document.querySelector('.bottom-tab.active')?.dataset.tab || 'project',
    };
  }

  // Restore all UI state from saved editorState
  restoreEditorState(state) {
    if (!state) return;

    // Render quality
    const rq = document.getElementById('render-quality');
    if (rq && state.renderQuality) rq.value = state.renderQuality;
    if (this.renderer) {
      this.renderer.quality = state.renderQuality || 'medium';

      // Grid / wireframe / skybox
      if (state.showGrid !== undefined)      this.renderer.showGrid      = state.showGrid;
      if (state.showWireframe !== undefined) this.renderer.showWireframe = state.showWireframe;
      if (state.showSkybox !== undefined)    this.renderer.showSkybox    = state.showSkybox;

      // Sync toolbar buttons
      document.getElementById('btn-toggle-grid')?.classList.toggle('active', !!state.showGrid);
      document.getElementById('btn-toggle-skybox')?.classList.toggle('active', !!state.showSkybox);
      document.getElementById('btn-wireframe')?.classList.toggle('active', !!state.showWireframe);

      // Perspective/ortho label
      const btnPersp = document.getElementById('btn-persp');
      if (btnPersp) btnPersp.textContent = state.camera?.orthographic ? 'Ortho' : 'Persp';

      // Restore editor camera
      if (state.camera) {
        const cam = this.renderer.editorCamera;
        cam.yaw          = state.camera.yaw ?? cam.yaw;
        cam.pitch        = state.camera.pitch ?? cam.pitch;
        cam.distance     = state.camera.distance ?? cam.distance;
        cam.orthographic = state.camera.orthographic ?? cam.orthographic;
        cam.orthoSize    = state.camera.orthoSize ?? cam.orthoSize;
        cam.fov          = state.camera.fov ?? cam.fov;
        if (state.camera.targetX !== undefined) {
          cam.target.x = state.camera.targetX;
          cam.target.y = state.camera.targetY;
          cam.target.z = state.camera.targetZ;
        }
      }
    }

    // Snap
    if (state.snapEnabled !== undefined) {
      this.snapEnabled = state.snapEnabled;
      document.getElementById('btn-snap')?.classList.toggle('active', state.snapEnabled);
    }

    // Game resolution
    const gRes = document.getElementById('game-res-select');
    if (gRes && state.gameResolution) gRes.value = state.gameResolution;

    // Timeline FPS
    const tfps = document.getElementById('timeline-fps');
    if (tfps && state.timelineFps) {
      tfps.value = state.timelineFps;
      if (this.timeline) this.timeline.fps = state.timelineFps;
    }

    // Lighting modal values
    const setEl = (id, val) => { if (val !== undefined && val !== null) { const el = document.getElementById(id); if (el) el.value = val; } };
    const setChk = (id, val) => { if (val !== undefined && val !== null) { const el = document.getElementById(id); if (el) el.checked = !!val; } };
    setEl('ambient-color',       state.lightingAmbientColor);
    setEl('ambient-intensity',   state.lightingAmbientIntensity);
    setChk('pp-fog',             state.lightingFog);
    setEl('fog-color',           state.lightingFogColor);
    setEl('fog-density',         state.lightingFogDensity);
    setChk('pp-bloom',           state.lightingBloom);
    setEl('bloom-intensity',     state.lightingBloomIntensity);
    setChk('pp-hdr',             state.lightingHDR);
    setEl('shadow-type',         state.lightingShadowType);
    setEl('shadow-distance',     state.lightingShadowDistance);

    // Build settings
    setEl('build-game-name',   state.buildGameName   || this.currentProject?.name || '');
    setEl('build-version',     state.buildVersion);
    setEl('build-resolution',  state.buildResolution);
    setChk('build-fullscreen', state.buildFullscreen);
    setChk('build-mobile',     state.buildMobile);

    // Restore view
    if (state.currentView) this.switchView(state.currentView);

    // Restore active bottom tab
    if (state.activeBottomTab) {
      const tab = document.querySelector('.bottom-tab[data-tab="' + state.activeBottomTab + '"]');
      tab?.click();
    }

    // Restore active tool
    if (state.activeTool) this._setTool(state.activeTool);

    // Restore selection (deferred so scene objects are ready)
    if (state.selectedObjectId && this.scene) {
      const found = this.scene.findById(state.selectedObjectId);
      if (found) this.selectObject(found);
    }
  }

  getProjectData() {
    return { ...(this.currentProject || {}), scene: this.scene?.serialize(), assets: this.assets };
  }

  // ===== ASSET CREATION =====
  _createScript(name) {
    const scriptName = name || prompt('Nome do Script:') || 'MyScript';
    const content = DEFAULT_SCRIPT_TEMPLATE.replace(/MyScript/g, scriptName);
    this.assets.push({ type: 'script', name: scriptName, content });
    this.scriptingEngine.loadScript(scriptName, content);
    this.projectPanel.render();
    this.openScript(scriptName, content);
    return scriptName;
  }

  _createAndAddScript() {
    const name = prompt('Nome do Script:') || 'MyScript';
    this._createScript(name);
    if (this.selectedObject) this.addComponentToSelected(name);
  }

  _createMaterial() {
    const name = prompt('Nome do Material:') || 'New Material';
    const mat = new Material(name);
    this.assets.push({ type: 'material', name, content: mat.serialize() });
    this.projectPanel.render();
    this.notification('Material criado: ' + name);
  }

  _createShader() {
    const name = prompt('Nome do Shader:') || 'New Shader';
    this.assets.push({ type: 'shader', name, content: SHADERS.standardFrag });
    this.projectPanel.render();
    document.getElementById('shader-code-modal')?.classList.remove('hidden');
    document.getElementById('vertex-shader-code').value = SHADERS.standardVert;
    document.getElementById('fragment-shader-code').value = SHADERS.standardFrag;
    this.switchView('shader-editor');
  }

  // ===== SCRIPT EDITOR =====
  openScript(name, content) {
    const modal = document.getElementById('script-editor-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    const title = document.getElementById('script-editor-title');
    if (title) title.textContent = name + '.js';
    const editor = document.getElementById('script-editor');
    const asset = this.assets.find(a => a.name === name && a.type === 'script');
    if (editor) editor.value = content || asset?.content || DEFAULT_SCRIPT_TEMPLATE.replace(/MyScript/g, name);
    this._currentScriptName = name;
  }

  _compileCurrentScript() {
    const editor = document.getElementById('script-editor');
    const output = document.getElementById('script-output');
    if (!editor) return;
    try {
      const cls = this.scriptingEngine.compileAndExecute(editor.value, this._currentScriptName);
      if (output) { output.textContent = cls ? '✓ Compilado com sucesso' : '⚠ Classe não encontrada'; output.style.color = cls ? '#2ecc71' : '#f39c12'; }
    } catch (e) {
      if (output) { output.textContent = '✕ ' + e.message; output.style.color = '#e74c3c'; }
    }
  }

  _saveCurrentScript() {
    const editor = document.getElementById('script-editor');
    if (!editor) return;
    const src = editor.value;
    const name = this._currentScriptName;
    const asset = this.assets.find(a => a.name === name && a.type === 'script');
    if (asset) asset.content = src;
    else this.assets.push({ type: 'script', name, content: src });
    this.scriptingEngine.loadScript(name, src);
    this.projectPanel.render();
    this.notification('Script salvo: ' + name, 'success');
  }

  openAnimator(animComp) {
    this.switchView('animator');
    this.animatorEditor.open(animComp);
  }

  // ===== LIGHTING =====
  _applyLighting() {
    if (!this.scene) return;
    const ambColor = document.getElementById('ambient-color')?.value;
    const ambInt = document.getElementById('ambient-intensity')?.value;
    const fogEnabled = document.getElementById('pp-fog')?.checked;
    const fogColor = document.getElementById('fog-color')?.value;
    const fogDensity = document.getElementById('fog-density')?.value;
    const skyTop = document.getElementById('skybox-top-color')?.value;
    const skyBot = document.getElementById('skybox-bottom-color')?.value;

    if (ambColor) this.scene.ambientColor = Color.fromHex(ambColor);
    if (ambInt) this.scene.ambientIntensity = parseFloat(ambInt);
    this.scene.fogEnabled = !!fogEnabled;
    if (fogColor) this.scene.fogColor = Color.fromHex(fogColor);
    if (fogDensity) this.scene.fogDensity = parseFloat(fogDensity);
    if (skyTop) this.scene.skyboxTopColor = Color.fromHex(skyTop);
    if (skyBot) this.scene.skyboxBottomColor = Color.fromHex(skyBot);

    this.notification('Iluminação aplicada!', 'success');
    document.getElementById('lighting-modal')?.classList.add('hidden');
  }

  // ===== UNDO/REDO =====
  _saveUndoState() {
    if (!this.scene) return;
    this._undoStack.push(this.scene.serialize());
    if (this._undoStack.length > 50) this._undoStack.shift();
    this._redoStack = [];
  }

  undo() {
    if (this._undoStack.length === 0) { this.notification('Nada para desfazer'); return; }
    this._redoStack.push(this.scene.serialize());
    this.scene = Scene.deserialize(this._undoStack.pop());
    window.Engine.scene = this.scene;
    this.selectObject(null);
    this.hierarchy.render(this.scene);
    this.notification('Undo');
  }

  redo() {
    if (this._redoStack.length === 0) { this.notification('Nada para refazer'); return; }
    this._undoStack.push(this.scene.serialize());
    this.scene = Scene.deserialize(this._redoStack.pop());
    window.Engine.scene = this.scene;
    this.selectObject(null);
    this.hierarchy.render(this.scene);
    this.notification('Redo');
  }

  // ===== CONSOLE =====
  _consoleLog(level, ...args) {
    const output = document.getElementById('console-output');
    if (!output) return;
    const entry = document.createElement('div');
    entry.className = 'console-entry ' + level;
    const time = new Date().toLocaleTimeString();
    entry.textContent = '[' + time + '] ' + args.map(a => {
      try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch(e) { return String(a); }
    }).join(' ');
    output.appendChild(entry);
    output.scrollTop = output.scrollHeight;
    while (output.children.length > 500) output.removeChild(output.firstChild);
  }

  // ===== NOTIFICATIONS =====
  notification(msg, type = '') {
    const toast = document.getElementById('notification-toast');
    if (!toast) { console.log('[Notification]', msg); return; }
    toast.textContent = msg;
    toast.className = 'toast show ' + type;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
    this._consoleLog('log', '[Engine] ' + msg);
  }

  // ===== PREFERENCES =====
  savePreferences() {
    const prefs = {
      gridSize: parseFloat(document.getElementById('pref-grid-size')?.value || 1),
      snapSize: parseFloat(document.getElementById('pref-snap-size')?.value || 0.25),
      theme: document.getElementById('pref-theme')?.value || 'dark',
      cameraSpeed: parseFloat(document.getElementById('pref-camera-speed')?.value || 10),
    };
    const token = document.getElementById('pref-github-token')?.value?.trim();
    const user = document.getElementById('pref-github-user')?.value?.trim();
    const repo = document.getElementById('pref-github-repo')?.value?.trim();
    const folder = document.getElementById('pref-github-folder')?.value?.trim() || '';
    if (token && user && repo) {
      GitHub.configure(token, user, repo, folder);
      const creds = { token, user, repo, folder };
      Storage.saveGitHubCreds(creds);
      try { localStorage.setItem('wge-github', JSON.stringify(creds)); } catch(e) {}
    }
    Storage.savePrefs(prefs);
    try { localStorage.setItem('wge-prefs', JSON.stringify(prefs)); } catch (e) {}
    this.notification('Preferências salvas!', 'success');
  }

  loadPreferences() {
    const prefs = Storage.loadPrefs() || {};
    try {
      const lsPrefs = JSON.parse(localStorage.getItem('wge-prefs') || '{}');
      Object.assign(prefs, lsPrefs);
    } catch (e) {}
    if (prefs.gridSize && this.renderer) this.renderer.gridSize = parseFloat(prefs.gridSize);
    if (prefs.cameraSpeed && this.renderer) this.renderer.editorCamera.speed = parseFloat(prefs.cameraSpeed);
    // Fill prefs form if open
    if (document.getElementById('pref-grid-size') && prefs.gridSize) document.getElementById('pref-grid-size').value = prefs.gridSize;
  }
}

// Debounced autosave: fires 800ms after last change
Engine.prototype._scheduleSave = function() {
  clearTimeout(this._saveTimer);
  this._saveTimer = setTimeout(() => {
    if (!this.currentProject || !this.scene) return;
    this.currentProject.scene = this.scene.serialize();
    this.currentProject.editorState = this.collectEditorState();
    this.currentProject.assets = (this.assets||[]).map(a=>({
      type:a.type, name:a.name,
      content:(a.content && typeof a.content!=='object') ? a.content : null,
      url: a.url||null,
    }));
    this.currentProject.lastModified = Date.now();
    this._saveProjectLocally(this.currentProject);
  }, 800);
};

// ===== BOOT =====
window.addEventListener('DOMContentLoaded', () => {
  console.log('WebGL Engine booting...');
  const engine = new Engine();
  window.engine = engine;
  engine.init().catch(e => console.error('Engine init error:', e));
});
