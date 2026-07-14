const API_BASE_URL = (() => {
    if (typeof window !== 'undefined' && window.location) {
        return `${window.location.origin}/api`;
    }
    return '/api';
})();

const API = {
    token: localStorage.getItem('agrodrop_token') || null,

    async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (data.status === 'success') {
            this.token = data.token;
            localStorage.setItem('agrodrop_token', data.token);
            localStorage.setItem('agrodrop_current_user', JSON.stringify(data.user));
        }
        return data;
    }
};
