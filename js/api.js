const API_BASE_URL = (() => {
    if (typeof window !== 'undefined' && window.location) {
        return `${window.location.origin}/api`;
    }
    return '/api';
})();

const API = {
    token: localStorage.getItem('agrodrop_token') || null,

    async login(email, password) {
        try {
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
        } catch (err) {
            const users = DB.getUsers();
            const user = users.find(u =>
                u.email.toLowerCase() === email.toLowerCase() && u.password === password
            );
            if (user) {
                const safeUser = {
                    user_id: user.user_id,
                    full_name: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    business_name: user.business_name,
                    role: user.role
                };
                localStorage.setItem('agrodrop_current_user', JSON.stringify(safeUser));
                return { status: 'success', message: 'Login successful (offline)', user: safeUser };
            }
            return { status: 'error', message: 'Invalid email or password.' };
        }
    }
};
