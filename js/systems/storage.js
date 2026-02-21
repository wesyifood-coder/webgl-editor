/**
 * WebGL Engine - IndexedDB Persistence System
 * Saves every project detail locally: scene, assets, scripts, settings
 * Falls back to localStorage for small data (GitHub credentials, prefs)
 */

const DB_NAME = 'WebGLEngine';
const DB_VERSION = 2;
const STORE_PROJECTS = 'projects';
const STORE_ASSETS = 'assets';
const STORE_META = 'meta';

class EngineStorage {
  constructor() {
    this._db = null;
    this._ready = this._open();
  }

  // ── Open / upgrade database ──────────────────────────────────────────
  _open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        // Projects store: key = project name, value = full project data
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          const ps = db.createObjectStore(STORE_PROJECTS, { keyPath: 'name' });
          ps.createIndex('lastModified', 'lastModified', { unique: false });
        }
        // Assets store: key = "projectName::assetType::assetName"
        if (!db.objectStoreNames.contains(STORE_ASSETS)) {
          const as = db.createObjectStore(STORE_ASSETS, { keyPath: '_key' });
          as.createIndex('project', 'project', { unique: false });
        }
        // Meta store: settings, prefs, last-opened project
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'key' });
        }
      };

      req.onsuccess = (e) => { this._db = e.target.result; resolve(); };
      req.onerror = () => {
        console.warn('[Storage] IndexedDB failed, will use localStorage fallback');
        resolve(); // don't reject — we degrade gracefully
      };
    });
  }

  async _tx(storeName, mode = 'readonly') {
    await this._ready;
    if (!this._db) return null;
    try {
      return this._db.transaction(storeName, mode).objectStore(storeName);
    } catch (e) { return null; }
  }

  _promisify(request) {
    return new Promise((resolve, reject) => {
      if (!request) { resolve(null); return; }
      request.onsuccess = () => resolve(request.result);
      request.onerror  = () => reject(request.error);
    });
  }

  // ── Project ──────────────────────────────────────────────────────────
  async saveProject(projectData) {
    if (!projectData || !projectData.name) return false;
    try {
      // Save core project data (scene, settings, metadata)
      // Assets with large binary content are stored separately
      const toSave = {
        ...projectData,
        lastModified: Date.now(),
        // Don't embed assets inline — store them in STORE_ASSETS
        assets: (projectData.assets || []).map(a => ({
          type: a.type,
          name: a.name,
          // Store asset ref only — blob/texture content saved separately
          _hasContent: !!a.content && typeof a.content === 'string',
        })),
      };

      const store = await this._tx(STORE_PROJECTS, 'readwrite');
      if (store) {
        await this._promisify(store.put(toSave));
      } else {
        // localStorage fallback (truncated)
        try {
          const mini = { ...toSave };
          localStorage.setItem('wge-project-' + projectData.name, JSON.stringify(mini).slice(0, 4_000_000));
        } catch (e) {}
      }

      // Save assets separately
      await this._saveAssets(projectData.name, projectData.assets || []);

      // Update project list in localStorage (lightweight index)
      this._updateProjectIndex(projectData.name, projectData.lastModified || Date.now(), projectData.template);
      return true;
    } catch (e) {
      console.error('[Storage] saveProject error:', e);
      return false;
    }
  }

  async _saveAssets(projectName, assets) {
    const store = await this._tx(STORE_ASSETS, 'readwrite');
    if (!store) return;
    for (const asset of assets) {
      if (!asset.name) continue;
      // Skip WebGL objects (textures etc) — can't serialize them
      let content = asset.content;
      if (content && typeof content === 'object' && !(content instanceof ArrayBuffer)) {
        try { content = JSON.stringify(content); } catch (e) { content = null; }
      }
      const rec = {
        _key: `${projectName}::${asset.type}::${asset.name}`,
        project: projectName,
        type: asset.type,
        name: asset.name,
        content,
        url: asset.url || null,
        savedAt: Date.now(),
      };
      try { await this._promisify(store.put(rec)); } catch (e) {}
    }
  }

  async loadProject(name) {
    try {
      const store = await this._tx(STORE_PROJECTS, 'readonly');
      let proj = null;
      if (store) {
        proj = await this._promisify(store.get(name));
      }
      if (!proj) {
        // Try localStorage fallback
        try {
          const raw = localStorage.getItem('wge-project-' + name);
          if (raw) proj = JSON.parse(raw);
        } catch (e) {}
      }
      if (!proj) return null;

      // Restore assets from asset store
      proj.assets = await this._loadAssets(name);
      return proj;
    } catch (e) {
      console.error('[Storage] loadProject error:', e);
      return null;
    }
  }

  async _loadAssets(projectName) {
    const store = await this._tx(STORE_ASSETS, 'readonly');
    if (!store) return [];
    try {
      const idx = store.index('project');
      const records = await this._promisify(idx.getAll(projectName));
      if (!records) return [];
      return records.map(r => ({
        type: r.type,
        name: r.name,
        content: r.content,
        url: r.url,
      }));
    } catch (e) { return []; }
  }

  async listProjects() {
    try {
      const store = await this._tx(STORE_PROJECTS, 'readonly');
      if (store) {
        const all = await this._promisify(store.getAll());
        if (all && all.length > 0) {
          return all.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
        }
      }
    } catch (e) {}
    // Fallback: localStorage index
    try {
      return JSON.parse(localStorage.getItem('wge-projects') || '[]');
    } catch (e) { return []; }
  }

  async deleteProject(name) {
    try {
      const projStore = await this._tx(STORE_PROJECTS, 'readwrite');
      if (projStore) await this._promisify(projStore.delete(name));

      // Delete all assets for this project
      const assetStore = await this._tx(STORE_ASSETS, 'readwrite');
      if (assetStore) {
        const idx = assetStore.index('project');
        const records = await this._promisify(idx.getAll(name));
        if (records) {
          for (const r of records) {
            try { await this._promisify(assetStore.delete(r._key)); } catch (e) {}
          }
        }
      }

      // Remove from localStorage index
      this._removeFromProjectIndex(name);
      return true;
    } catch (e) {
      console.error('[Storage] deleteProject error:', e);
      return false;
    }
  }

  // ── Meta / prefs ─────────────────────────────────────────────────────
  async setMeta(key, value) {
    try {
      const store = await this._tx(STORE_META, 'readwrite');
      if (store) await this._promisify(store.put({ key, value }));
      else localStorage.setItem('wge-meta-' + key, JSON.stringify(value));
    } catch (e) {}
  }

  async getMeta(key) {
    try {
      const store = await this._tx(STORE_META, 'readonly');
      if (store) {
        const rec = await this._promisify(store.get(key));
        if (rec) return rec.value;
      }
    } catch (e) {}
    try { return JSON.parse(localStorage.getItem('wge-meta-' + key)); } catch (e) { return null; }
  }

  // ── GitHub credentials (always localStorage — lightweight) ───────────
  saveGitHubCreds(creds) {
    try { localStorage.setItem('wge-github', JSON.stringify(creds)); } catch (e) {}
  }

  loadGitHubCreds() {
    try { return JSON.parse(localStorage.getItem('wge-github') || 'null'); } catch (e) { return null; }
  }

  // ── Project index helpers (lightweight localStorage index) ───────────
  _updateProjectIndex(name, lastModified, template) {
    try {
      const list = JSON.parse(localStorage.getItem('wge-projects') || '[]');
      const idx = list.findIndex(p => p.name === name);
      const entry = { name, lastModified, template: template || '3d' };
      if (idx >= 0) list[idx] = entry; else list.unshift(entry);
      localStorage.setItem('wge-projects', JSON.stringify(list.slice(0, 50)));
    } catch (e) {}
  }

  _removeFromProjectIndex(name) {
    try {
      const list = JSON.parse(localStorage.getItem('wge-projects') || '[]');
      localStorage.setItem('wge-projects', JSON.stringify(list.filter(p => p.name !== name)));
    } catch (e) {}
  }

  // ── Preferences (localStorage is fine — small) ───────────────────────
  savePrefs(prefs) {
    try { localStorage.setItem('wge-prefs', JSON.stringify(prefs)); } catch (e) {}
  }
  loadPrefs() {
    try { return JSON.parse(localStorage.getItem('wge-prefs') || '{}'); } catch (e) { return {}; }
  }
}

// Singleton
const Storage = new EngineStorage();
