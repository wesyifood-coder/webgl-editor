/**
 * WebGL Engine - GitHub API Integration
 * Fixed: Bearer auth, proper CORS mode, error diagnostics, chunked save
 */

class GitHubSystem {
  constructor() {
    this.token = '';
    this.user = '';
    this.repo = '';
    this.folder = '';
    this.connected = false;
  }

  configure(token, user, repo, folder) {
    this.token  = (token  || '').trim();
    this.user   = (user   || '').trim();
    this.repo   = (repo   || '').trim();
    this.folder = (folder || '').trim();
    this.connected = !!(this.token && this.user && this.repo);
    this._updateStatus();
    return this.connected;
  }

  _updateStatus() {
    const el = document.getElementById('github-status');
    if (el) {
      el.textContent = this.connected ? 'GitHub' : 'GitHub';
      el.style.color = this.connected ? '#2ecc71' : '#888';
      el.title = this.connected ? (this.user + '/' + this.repo) : 'Nao conectado';
    }
  }

  async _apiRequest(method, path, body) {
    if (!this.token) throw new Error('Token GitHub nao configurado');
    const url = 'https://api.github.com/repos/' + this.user + '/' + this.repo + '/' + path;
    const opts = {
      method: method,
      mode: 'cors',
      headers: {
        'Authorization': 'Bearer ' + this.token,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    };
    if (body) opts.body = JSON.stringify(body);

    let resp;
    try {
      resp = await fetch(url, opts);
    } catch (netErr) {
      // "Failed to fetch" means network/CORS blocked
      throw new Error(
        'Falha de rede ao acessar GitHub. Causas comuns: ' +
        '(1) abrir o arquivo via servidor web em vez de file://, ' +
        '(2) sem conexao com a internet, ' +
        '(3) repositorio inexistente. Detalhe: ' + netErr.message
      );
    }

    if (!resp.ok) {
      let msg = 'GitHub HTTP ' + resp.status;
      try { const b = await resp.json(); msg = b.message || msg; } catch(e) {}
      if (resp.status === 401) msg = 'Token invalido ou expirado. Verifique em GitHub > Settings > Developer settings > Personal access tokens';
      if (resp.status === 403) msg = 'Sem permissao. O token precisa do escopo "repo" (Contents: read/write)';
      if (resp.status === 404) msg = 'Repositorio nao encontrado: ' + this.user + '/' + this.repo;
      if (resp.status === 422) msg = 'Dados invalidos enviados ao GitHub (arquivo muito grande?)';
      throw new Error(msg);
    }
    return resp.json();
  }

  // Test connection
  async testConnection() {
    try {
      const resp = await fetch('https://api.github.com/user', {
        mode: 'cors',
        headers: {
          'Authorization': 'Bearer ' + this.token,
          'Accept': 'application/vnd.github+json'
        }
      });
      if (!resp.ok) {
        const b = await resp.json().catch(() => ({}));
        return { ok: false, error: b.message || ('HTTP ' + resp.status) };
      }
      const u = await resp.json();
      return { ok: true, login: u.login };
    } catch(e) {
      return { ok: false, error: e.message };
    }
  }

  async getFile(path) {
    try {
      const fullPath = this.folder ? (this.folder + '/' + path) : path;
      const data = await this._apiRequest('GET', 'contents/' + fullPath);
      return { content: atob(data.content.replace(/\n/g, '')), sha: data.sha };
    } catch(e) {
      if (e.message && (e.message.includes('404') || e.message.includes('Not Found') || e.message.includes('nao encontrado'))) return null;
      throw e;
    }
  }

  async putFile(path, content, message) {
    message = message || 'Update from WebGL Engine';
    const fullPath = this.folder ? (this.folder + '/' + path) : path;
    const existing = await this.getFile(path).catch(() => null);

    // UTF-8 safe base64
    let b64;
    try {
      b64 = btoa(unescape(encodeURIComponent(String(content))));
    } catch(e) {
      const bytes = new TextEncoder().encode(content);
      let bin = '';
      for (const byte of bytes) bin += String.fromCharCode(byte);
      b64 = btoa(bin);
    }

    const body = { message: message, content: b64 };
    if (existing && existing.sha) body.sha = existing.sha;
    return this._apiRequest('PUT', 'contents/' + fullPath, body);
  }

  async saveProject(projectData) {
    if (!this.connected) throw new Error('GitHub nao conectado');

    // Save scene file separately (avoid huge project.json)
    if (projectData.scene) {
      const sceneName = (projectData.scene.name || 'Scene').replace(/[^a-zA-Z0-9_-]/g, '_');
      await this.putFile('scenes/' + sceneName + '.json', JSON.stringify(projectData.scene, null, 2), 'Save scene: ' + sceneName);
    }

    // Save scripts individually
    for (const asset of (projectData.assets || [])) {
      if ((asset.type === 'script' || asset.type === 'shader') && asset.content && asset.name) {
        const ext = asset.type === 'shader' ? '.glsl' : '.js';
        try {
          await this.putFile('assets/' + asset.type + 's/' + asset.name + ext, String(asset.content), 'Save ' + asset.type + ': ' + asset.name);
        } catch(e) { /* non-fatal */ }
      }
    }

    // Save lightweight project index
    const meta = {
      name: projectData.name,
      template: projectData.template,
      version: projectData.version || '1.0',
      settings: projectData.settings || {},
      editorState: projectData.editorState || {},
      assets: (projectData.assets || []).map(function(a) { return { type: a.type, name: a.name }; }),
      sceneName: (projectData.scene && projectData.scene.name) || 'Scene',
      savedAt: new Date().toISOString(),
      engine: 'WebGL Engine v1.0'
    };
    await this.putFile('project.json', JSON.stringify(meta, null, 2), 'Save project: ' + (projectData.name || 'Unnamed'));
    return true;
  }

  async loadProject() {
    if (!this.connected) throw new Error('GitHub nao conectado');
    const file = await this.getFile('project.json');
    if (!file) return null;
    const proj = JSON.parse(file.content);

    // Load scene
    const sceneName = (proj.sceneName || 'Scene').replace(/[^a-zA-Z0-9_-]/g, '_');
    const sceneFile = await this.getFile('scenes/' + sceneName + '.json').catch(() => null);
    if (sceneFile) {
      try { proj.scene = JSON.parse(sceneFile.content); } catch(e) {}
    }

    // Load scripts
    if (proj.assets) {
      for (let i = 0; i < proj.assets.length; i++) {
        const asset = proj.assets[i];
        if ((asset.type === 'script' || asset.type === 'shader') && asset.name) {
          const ext = asset.type === 'shader' ? '.glsl' : '.js';
          try {
            const f = await this.getFile('assets/' + asset.type + 's/' + asset.name + ext);
            if (f) proj.assets[i].content = f.content;
          } catch(e) {}
        }
      }
    }
    return proj;
  }

  async listFiles(path) {
    path = path || '';
    const fullPath = this.folder ? (path ? this.folder + '/' + path : this.folder) : path;
    const endpoint = fullPath ? ('contents/' + fullPath) : 'contents';
    return this._apiRequest('GET', endpoint);
  }

  async createRepo(name, description) {
    description = description || 'WebGL Engine Project';
    const resp = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      mode: 'cors',
      headers: { 'Authorization': 'Bearer ' + this.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, description: description, auto_init: true })
    });
    if (!resp.ok) throw new Error('Erro ao criar repositorio');
    return resp.json();
  }
}

const GitHub = new GitHubSystem();
