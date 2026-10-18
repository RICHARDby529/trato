// ============================================================
// TRATO - Client API
// Centralise tous les appels au backend
// ============================================================

const API = {
  // Récupérer le token stocké
  getToken(){
    return localStorage.getItem('trato_token');
  },

  // Récupérer l'utilisateur stocké
  getUser(){
    const user = localStorage.getItem('trato_user');
    return user ? JSON.parse(user) : null;
  },

  // Sauvegarder la session (token + user)
  setSession(token, user){
    localStorage.setItem('trato_token', token);
    localStorage.setItem('trato_user', JSON.stringify(user));
  },

  // Effacer la session (déconnexion)
  clearSession(){
    localStorage.removeItem('trato_token');
    localStorage.removeItem('trato_user');
  },

  // Vérifier si l'utilisateur est connecté
  isLoggedIn(){
    return !!this.getToken();
  },

  // Requête générique au backend
  async request(path, options = {}){
    const headers = { ...(options.headers || {}) };

    // Ajouter le Content-Type pour le JSON (sauf si c'est un FormData)
    if (!(options.body instanceof FormData)){
      headers['Content-Type'] = 'application/json';
    }

    // Ajouter le token d'authentification si présent
    const token = this.getToken();
    if (token){
      headers['Authorization'] = 'Bearer ' + token;
    }

    const res = await fetch(path, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok){
      throw new Error(data.error || 'Erreur réseau');
    }

    return data;
  },

  // ---------- Authentification ----------
  async register(payload){
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (data.success && data.token){
      this.setSession(data.token, data.user);
    }
    return data;
  },

  async login(payload){
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (data.success && data.token){
      this.setSession(data.token, data.user);
    }
    return data;
  },

  // Récupérer l'utilisateur courant depuis le backend
  async getMe(){
    return this.request('/api/auth/me');
  },

  // ---------- Upload d'images ----------
  async uploadImages(files){
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    return this.request('/api/upload', {
      method: 'POST',
      body: formData
    });
  },

  // ---------- Articles ----------
  async createListing(data){
    return this.request('/api/listings', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getMyListings(){
    return this.request('/api/listings?mine=1');
  },

  async getAllListings(){
    return this.request('/api/listings');
  },

  async deleteListing(id){
    return this.request('/api/listings/' + id, {
      method: 'DELETE'
    });
  },

  // ---------- Déconnexion ----------
  logout(){
    this.clearSession();
  }
};