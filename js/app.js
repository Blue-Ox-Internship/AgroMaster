/* =============================================
   AgroDrop - Core App Utilities
   ============================================= */

const App = {
    // ---- Auth ----
    getCurrentUser() {
        try { return JSON.parse(localStorage.getItem('agrodrop_current_user')); }
        catch { return null; }
    },

    setCurrentUser(user) {
        localStorage.setItem('agrodrop_current_user', JSON.stringify(user));
    },

    logout() {
        localStorage.removeItem('agrodrop_current_user');
        window.location.href = 'index.html';
    },

    requireAuth() {
        const user = this.getCurrentUser();
        if (!user) { window.location.href = 'index.html'; return null; }
        return user;
    },

    requireRole(roles) {
        const user = this.requireAuth();
        if (!user) return null;
        if (roles && !roles.includes(user.role)) {
            Toast.show('error', 'Access Denied', 'You do not have permission to view this page.');
            setTimeout(() => window.location.href = 'dashboard.html', 1500);
            return null;
        }
        return user;
    },

    // ---- Format Helpers ----
    formatCurrency(amount) {
        return 'UGX ' + Number(amount).toLocaleString('en-UG');
    },

    formatDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    },

    formatDateTime(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
            ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    },

    daysUntilExpiry(dateStr) {
        if (!dateStr) return null;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const expiry = new Date(dateStr); expiry.setHours(0, 0, 0, 0);
        return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    },

    isExpired(dateStr) {
        return this.daysUntilExpiry(dateStr) < 0;
    },

    isExpiringSoon(dateStr, days = 30) {
        const d = this.daysUntilExpiry(dateStr);
        return d !== null && d >= 0 && d <= days;
    },

    generateId(prefix) {
        return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    },

    today() {
        return new Date().toISOString().split('T')[0];
    },

    // ---- Utility ----
    debounce(fn, delay) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

};

// ---- Toast Notifications ----
const Toast = {
    container: null,

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    show(type, title, message, duration = 4000) {
        this.init();
        const icons = { success: 'fa-check', error: 'fa-times', warning: 'fa-exclamation', info: 'fa-info' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
      <div class="toast-icon"><i class="fas ${icons[type] || 'fa-bell'}"></i></div>
      <div class="toast-content">
        <h4>${title}</h4>
        ${message ? `<p>${message}</p>` : ''}
      </div>
      <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
        toast.querySelector('.toast-close').addEventListener('click', () => this.remove(toast));
        this.container.appendChild(toast);
        setTimeout(() => this.remove(toast), duration);
    },

    remove(toast) {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }
};

// ---- Confirm Dialog ----
const Confirm = {
    show(options) {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'confirm-overlay';
            overlay.innerHTML = `
        <div class="confirm-dialog">
          <div class="confirm-icon"><i class="fas fa-exclamation-triangle"></i></div>
          <h3>${options.title || 'Are you sure?'}</h3>
          <p>${options.message || 'This action cannot be undone.'}</p>
          <div class="confirm-actions">
            <button class="btn btn-secondary" id="confirm-cancel">${options.cancelText || 'Cancel'}</button>
            <button class="btn btn-danger" id="confirm-ok">${options.confirmText || 'Delete'}</button>
          </div>
        </div>
      `;
            document.body.appendChild(overlay);
            setTimeout(() => overlay.classList.add('active'), 10);

            overlay.querySelector('#confirm-cancel').addEventListener('click', () => {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 300);
                resolve(false);
            });

            overlay.querySelector('#confirm-ok').addEventListener('click', () => {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 300);
                resolve(true);
            });
        });
    }
};

// ---- Modal Helpers ----
const Modal = {
    open(id) {
        const overlay = document.getElementById(id);
        if (overlay) {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    close(id) {
        const overlay = document.getElementById(id);
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    closeAll() {
        document.querySelectorAll('.modal-overlay.active').forEach(o => {
            o.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
};

// ---- Close modals on overlay click ----
document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) Modal.closeAll();
    if (e.target.classList.contains('modal-close')) {
        const overlay = e.target.closest('.modal-overlay');
        if (overlay) { overlay.classList.remove('active'); document.body.style.overflow = ''; }
    }
});

// ---- Escape key closes modals ----
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') Modal.closeAll();
});

// ---- Seed database ----
seedDatabase();
