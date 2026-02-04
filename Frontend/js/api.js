// API Configuration
// Automatically use production backend when deployed, localhost when developing
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'https://mindlog-backend.onrender.com/api'; // Update this with your actual Render backend URL

const api = {
    // Generic request handler
    async request(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json',
        };

        // Add token if it exists
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
                // If there are validation errors, format them nicely
                if (data.errors && Array.isArray(data.errors)) {
                    const errorMessages = data.errors.map(err => err.message).join(', ');
                    throw new Error(errorMessages);
                }
                // Otherwise throw the general message
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            // Re-throw to be caught by the calling function
            throw error;
        }
    },

    // Auth methods
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

    // Helper to check if user is logged in
    isAuthenticated() {
        return !!localStorage.getItem('token');
    }
};

// UI Helpers
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
