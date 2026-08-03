const API_BASE_URL = (() => {
    if (typeof window !== 'undefined' && window.location) {
        return `${window.location.origin}/api`;
    }
    return '/api';
})();

const API = {
    token: localStorage.getItem('agrodrop_token') || null,

    async request(path, options = {}) {
        const url = `${API_BASE_URL}${path}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        const response = await fetch(url, { ...options, headers });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        return data;
    },

    async login(email, password) {
        try {
            const data = await this.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            if (data.status === 'success') {
                this.token = data.token;
                localStorage.setItem('agrodrop_token', data.token);
                localStorage.setItem('agrodrop_current_user', JSON.stringify(data.user));
            }
            return data;
        } catch (err) {
            console.warn('Login API failed, falling back to local DB', err);
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
    },

    // ---- Medicines ----
    async getMedicines() {
        try {
            const data = await this.request('/medicines');
            return data.medicines || [];
        } catch (err) {
            console.warn('API fallback to local DB:', err);
            return DB.getMedicines();
        }
    },
    async addMedicine(med) {
        try {
            const data = await this.request('/medicines', { method: 'POST', body: JSON.stringify(med) });
            return data.medicine;
        } catch (err) {
            console.warn('API fallback to local DB:', err);
            return DB.addMedicine(med);
        }
    },
    async updateMedicine(id, med) {
        try {
            const data = await this.request(`/medicines/${id}`, { method: 'PUT', body: JSON.stringify(med) });
            return data.medicine;
        } catch (err) {
            console.warn('API fallback to local DB:', err);
            return DB.updateMedicine(id, med);
        }
    },
    async deleteMedicine(id) {
        try {
            await this.request(`/medicines/${id}`, { method: 'DELETE' });
            return true;
        } catch (err) {
            console.warn('API fallback to local DB:', err);
            return DB.deleteMedicine(id);
        }
    },

    // ---- Suppliers ----
    async getSuppliers() {
        try {
            const data = await this.request('/suppliers');
            return data.suppliers || [];
        } catch (err) {
            console.warn('API fallback to local DB:', err);
            return DB.getSuppliers();
        }
    },
    async addSupplier(sup) {
        try {
            const data = await this.request('/suppliers', { method: 'POST', body: JSON.stringify(sup) });
            return data.supplier;
        } catch (err) {
            console.warn('API fallback to local DB:', err);
            return DB.addSupplier(sup);
        }
    },
    async updateSupplier(id, sup) {
        try {
            const data = await this.request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(sup) });
            return data.supplier;
        } catch (err) {
            console.warn('API fallback to local DB:', err);
            return DB.updateSupplier(id, sup);
        }
    },
    async deleteSupplier(id) {
        try {
            await this.request(`/suppliers/${id}`, { method: 'DELETE' });
            return true;
        } catch (err) {
            console.warn('API fallback to local DB:', err);
            return DB.deleteSupplier(id);
        }
    },

    // ---- Sales ----
    async getSales() {
        try {
            const data = await this.request('/sales');
            return data.sales || [];
        } catch (err) {
            console.warn('API fallback to local DB:', err);
            return DB.getSales();
        }
    },
    async addSale(sale) {
        try {
            const data = await this.request('/sales', { method: 'POST', body: JSON.stringify(sale) });
            return data.sale;
        } catch (err) {
            console.warn('API fallback to local DB:', err);
            return DB.addSale(sale);
        }
    },
    async deleteSale(id) {
        try {
            await this.request(`/sales/${id}`, { method: 'DELETE' });
            return true;
        } catch (err) {
            console.warn('API fallback to local DB:', err);
            return DB.deleteSale(id);
        }
    },

    // ---- Purchases ----
    async getPurchases() {
        try {
            const data = await this.request('/purchases');
            return data.purchases || [];
        } catch (err) {
            console.warn('API fallback to local DB:', err);
            return DB.getPurchases();
        }
    },
    async addPurchase(purchase) {
        try {
            const data = await this.request('/purchases', { method: 'POST', body: JSON.stringify(purchase) });
            return data.purchase;
        } catch (err) {
            console.warn('API fallback to local DB:', err);
            return DB.addPurchase(purchase);
        }
    },
    async deletePurchase(id) {
        try {
            await this.request(`/purchases/${id}`, { method: 'DELETE' });
            return true;
        } catch (err) {
            console.warn('API fallback to local DB:', err);
            return DB.deletePurchase(id);
        }
    },

    // ---- Alerts ----
    async getAlerts() {
        try {
            const data = await this.request('/alerts');
            return data.alerts || [];
        } catch (err) {
            console.warn('API fallback to local DB:', err);
            return DB.getAlerts();
        }
    },
    async markAlertRead(id) {
        try {
            await this.request(`/alerts/${id}/read`, { method: 'PATCH' });
            return true;
        } catch (err) {
            console.warn('API fallback to local DB:', err);
            return DB.markAlertRead(id);
        }
    },
    async markAllAlertsRead() {
        try {
            await this.request('/alerts/read-all', { method: 'PATCH' });
            return true;
        } catch (err) {
            console.warn('API fallback to local DB:', err);
            return DB.markAllAlertsRead();
        }
    }
};
