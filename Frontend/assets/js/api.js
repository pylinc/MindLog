const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'https://mindlog-wb66.onrender.com/api'; 

const api = {
    async request(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json',
        };

        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    if (!window.location.pathname.includes('login.html')) {
                        window.location.href = '../auth/login.html';
                    }
                }

                if (data.errors && Array.isArray(data.errors)) {
                    const errorMessages = data.errors.map(err => err.message).join(', ');
                    throw new Error(errorMessages);
                }
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    async login(identifier, password) {
        return this.request('/auth/login', 'POST', { identifier, password });
    },

    async register(firstName, lastName, username, email, password) {
        return this.request('/auth/register', 'POST', { firstName, lastName, username, email, password });
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    },

    isAuthenticated() {
        return !!localStorage.getItem('token');
    },

    async getRandomPrompt(excludeId) {
        const url = excludeId ? `/prompt/random?exclude=${excludeId}` : '/prompt/random';
        return this.request(url, 'GET');
    },

    async getMoodStats() {
        return this.request('/journal/stats/mood', 'GET');
    }
};

const ui = {
    showError(elementId, message) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = message;
            el.classList.remove('hidden');
            el.classList.add('animate-pulse');
            setTimeout(() => el.classList.remove('animate-pulse'), 500);
        }
    },
    
    hideError(elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.classList.add('hidden');
            el.textContent = '';
        }
    },

    setLoading(buttonId, isLoading, originalText = 'Submit') {
        const btn = document.getElementById(buttonId);
        if (btn) {
            btn.disabled = isLoading;
            btn.textContent = isLoading ? 'Processing...' : originalText;
            btn.classList.toggle('opacity-70', isLoading);
            btn.classList.toggle('cursor-not-allowed', isLoading);
        }
    }
};
