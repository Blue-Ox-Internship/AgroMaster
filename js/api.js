/* =============================================
   AgroDrop - Frontend API Wrapper
   Replaces localStorage with backend API calls
   ============================================= */

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://agrodrop.pages.dev/api';

const API = {
    token: localStorage.getItem('agrodrop_token') || null,

    // ===== AUTHENTICATION =====
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
    },

    async register(userData) {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return await response.json();
    },

    async getCurrentUser() {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        return await response.json();
    },

    // ===== USERS =====
    async getUsers() {
        const response = await fetch(`${API_BASE_URL}/users`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        const data = await response.json();
        return data.status === 'success' ? data.users : [];
    },

    async addUser(userData) {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify(userData)
        });
        return await response.json();
    },

    async updateUser(userId, userData) {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify(userData)
        });
        return await response.json();
    },

    async deleteUser(userId) {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        return await response.json();
    },

    // ===== MEDICINES =====
    async getMedicines(category = '', search = '') {
        let url = `${API_BASE_URL}/medicines`;
        const params = [];
        if (category) params.push(`category=${category}`);
        if (search) params.push(`search=${search}`);
        if (params.length) url += '?' + params.join('&');

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        const data = await response.json();
        return data.status === 'success' ? data.medicines : [];
    },

    async getMedicineById(id) {
        const response = await fetch(`${API_BASE_URL}/medicines/${id}`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        const data = await response.json();
        return data.status === 'success' ? data.medicine : null;
    },

    async addMedicine(medicineData) {
        const response = await fetch(`${API_BASE_URL}/medicines`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify(medicineData)
        });
        return await response.json();
    },

    async updateMedicine(medicineId, medicineData) {
        const response = await fetch(`${API_BASE_URL}/medicines/${medicineId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify(medicineData)
        });
        return await response.json();
    },

    async deleteMedicine(medicineId) {
        const response = await fetch(`${API_BASE_URL}/medicines/${medicineId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        return await response.json();
    },

    // ===== SUPPLIERS =====
    async getSuppliers() {
        const response = await fetch(`${API_BASE_URL}/suppliers`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        const data = await response.json();
        return data.status === 'success' ? data.suppliers : [];
    },

    async getSupplierById(id) {
        const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        const data = await response.json();
        return data.status === 'success' ? data.supplier : null;
    },

    async addSupplier(supplierData) {
        const response = await fetch(`${API_BASE_URL}/suppliers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify(supplierData)
        });
        return await response.json();
    },

    async updateSupplier(supplierId, supplierData) {
        const response = await fetch(`${API_BASE_URL}/suppliers/${supplierId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify(supplierData)
        });
        return await response.json();
    },

    async deleteSupplier(supplierId) {
        const response = await fetch(`${API_BASE_URL}/suppliers/${supplierId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        return await response.json();
    },

    // ===== PURCHASES =====
    async getPurchases() {
        const response = await fetch(`${API_BASE_URL}/purchases`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        const data = await response.json();
        return data.status === 'success' ? data.purchases : [];
    },

    async addPurchase(purchaseData) {
        const response = await fetch(`${API_BASE_URL}/purchases`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify(purchaseData)
        });
        return await response.json();
    },

    async deletePurchase(purchaseId) {
        const response = await fetch(`${API_BASE_URL}/purchases/${purchaseId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        return await response.json();
    },

    // ===== SALES =====
    async getSales() {
        const response = await fetch(`${API_BASE_URL}/sales`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        const data = await response.json();
        return data.status === 'success' ? data.sales : [];
    },

    async addSale(saleData) {
        const response = await fetch(`${API_BASE_URL}/sales`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify(saleData)
        });
        return await response.json();
    },

    async deleteSale(saleId) {
        const response = await fetch(`${API_BASE_URL}/sales/${saleId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        return await response.json();
    },

    // ===== ALERTS =====
    async getAlerts() {
        const response = await fetch(`${API_BASE_URL}/alerts`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        const data = await response.json();
        return data.status === 'success' ? data.alerts : [];
    },

    async markAlertRead(alertId) {
        const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/read`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        return await response.json();
    },

    async markAllAlertsRead() {
        const response = await fetch(`${API_BASE_URL}/alerts/all/read`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        return await response.json();
    },

    // ===== REPORTS =====
    async getReports(type) {
        const response = await fetch(`${API_BASE_URL}/reports/${type}`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        return await response.json();
    }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}
