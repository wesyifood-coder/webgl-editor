/**
 * WebGL Engine - GitHub API Integration
 */

class GitHubSystem {
  constructor() {
    this.token = '';
    this.user = '';
    this.repo = '';
    this.folder = '';
    this.connected = false;
    this._statusEl = null;
  }
  
  configure(token, user, repo, folder = '') {
    this.token = token;
    this.user = user;
    this.repo = repo;
    this.folder = folder;
    this.connected = !!(token && user && repo);
    this._updateStatus();
    return this.connected;
  }
  
  _updateStatus() {
    const el = document.getElementById('github-status');
    if (el) {
      el.textContent = this.connected ? '🟢 GitHub' : '⚫ GitHub';
      el.title = this.connected ? `${this.user}/${this.repo}` : 'Não conectado';
    }
  }
  
  async _apiRequest(method, path, body) {
    if (!this.token) throw new Error('Token GitHub não configurado');
    const url = `https://api.github.com/repos/${this.user}/${this.repo}/${path}`;
    const opts = {
      method,
      headers: {
        'Authorization': `token ${this.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    if (body) opts.body = JSON.stringify(body);
    const resp = await fetch(url, opts);
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.message || `GitHub API error: ${resp.status}`);
    }
    return resp.json();
  }
  
  async getFile(path) {
    try {
      const fullPath = this.folder ? `${this.folder}/${path}` : path;
      const data = await this._apiRequest('GET', `contents/${fullPath}`);
      return { content: atob(data.content.replace(/\n/g, '')), sha: data.sha };
    } catch(e) {
      if (e.message.includes('404') || e.message.includes('Not Found')) return null;
      throw e;
    }
  }
  
  async putFile(path, content, message = 'Update from WebGL Engine') {
    const fullPath = this.folder ? `${this.folder}/${path}` : path;
    const existing = await this.getFile(path).catch(() => null);
    const body = {
      message,
      content: btoa(unescape(encodeURIComponent(content))),
    };
    if (existing) body.sha = existing.sha;
    return this._apiRequest('PUT', `contents/${fullPath}`, body);
  }
  
  async saveProject(projectData) {
    if (!this.connected) throw new Error('GitHub não conectado');
    const json = JSON.stringify(projectData, null, 2);
    await this.putFile('project.json', json, 'Save project - WebGL Engine');
    // Also save scene
    if (projectData.scene) {
      const sceneJson = JSON.stringify(projectData.scene, null, 2);
      await this.putFile(`scenes/${projectData.scene.name}.json`, sceneJson, 'Save scene');
    }
    return true;
  }
  
  async loadProject() {
    if (!this.connected) throw new Error('GitHub não conectado');
    const file = await this.getFile('project.json');
    if (!file) return null;
    return JSON.parse(file.content);
  }
  
  async listFiles(path = '') {
    const fullPath = this.folder ? (path ? `${this.folder}/${path}` : this.folder) : path;
    const endpoint = fullPath ? `contents/${fullPath}` : 'contents';
    return this._apiRequest('GET', endpoint);
  }
  
  async createRepo(name, description = 'WebGL Engine Project') {
    const url = 'https://api.github.com/user/repos';
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `token ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, auto_init: true })
    });
    if (!resp.ok) throw new Error('Erro ao criar repositório');
    return resp.json();
  }
}

const GitHub = new GitHubSystem();
