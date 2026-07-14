/* =============================================
   AgroMaster - Shared Sidebar + Layout Renderer
   ============================================= */

function renderSidebar(pageTitle, pageSubtitle) {
  const user = App.getCurrentUser();
  if (!user) return;

  const avatarLetter = user.full_name.charAt(0).toUpperCase();
  const alerts = DB.getAlerts().filter(a => a.status === 'unread');
  const alertCount = alerts.length;
  const page = window.location.pathname.split('/').pop().replace('.html', '') || 'dashboard';

  function navLink(href, icon, label) {
    const pageName = href.replace('.html', '');
    const active = pageName === page ? 'active' : '';
    return `
      <div class="nav-item">
        <a href="${href}" class="nav-link ${active}" data-page="${pageName}">
          <i class="fas ${icon}"></i><span>${label}</span>
        </a>
      </div>`;
  }

  const roleClass = { 'Administrator': 'role-admin', 'Store Manager': 'role-manager', 'Sales Attendant': 'role-attendant' };

  const html = `
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100" width="38" height="32" style="display:block;">
            <circle cx="60" cy="50" r="48" fill="#e8f5e9" stroke="#2e7d32" stroke-width="2.5"/>
            <path d="M60 20 L86 34 V52 Q86 70 60 84 Q34 70 34 52 V34 Z" fill="#2e7d32"/>
            <path d="M60 26 L78 36 V52 Q78 66 60 77 Q42 66 42 52 V36 Z" fill="#43a047"/>
            <rect x="54" y="36" width="12" height="26" rx="3" fill="white"/>
            <rect x="46" y="44" width="28" height="10" rx="3" fill="white"/>
            <rect x="56" y="40" width="8" height="18" rx="1.5" fill="rgba(255,255,255,0.3)"/>
            <rect x="50" y="46" width="20" height="6" rx="1.5" fill="rgba(255,255,255,0.3)"/>
            <circle cx="60" cy="50" r="3.5" fill="rgba(255,255,255,0.5)"/>
            <g transform="translate(82, 22) rotate(35)">
              <rect x="0" y="0" width="18" height="6" rx="2" fill="#66bb6a"/>
              <line x1="18" y1="3" x2="26" y2="3" stroke="#43a047" stroke-width="2.5"/>
              <line x1="26" y1="0" x2="28" y2="3" stroke="#43a047" stroke-width="1.5"/>
              <line x1="26" y1="6" x2="28" y2="3" stroke="#43a047" stroke-width="1.5"/>
              <rect x="3" y="-1" width="3" height="8" rx="1" fill="#a5d6a7"/>
            </g>
            <ellipse cx="34" cy="42" rx="6" ry="3.5" fill="#66bb6a" transform="rotate(-15 34 42)"/>
            <ellipse cx="34" cy="42" rx="2.5" ry="3.5" fill="white" transform="rotate(-15 34 42)"/>
          </svg>
        </div>
        <div class="logo-text"><h2>AgroMaster</h2><span>Inventory System</span></div>
      </div>
      <nav class="sidebar-nav">
        ${navLink('dashboard.html', 'fa-th-large', 'Dashboard')}
        ${navLink('inventory.html', 'fa-pills', 'Medicines')}
        ${navLink('suppliers.html', 'fa-truck', 'Suppliers')}
        ${navLink('sales.html', 'fa-cash-register', 'Sales')}
        ${navLink('purchases.html', 'fa-shopping-cart', 'Purchases')}
        ${navLink('reports.html', 'fa-chart-bar', 'Operations Reports')}
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="avatar">${avatarLetter}</div>
          <div class="user-info">
            <h4>${user.full_name}</h4>
            <span>${user.role}</span>
          </div>
        </div>
        <button class="btn-logout sidebar-logout" id="logout-btn">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    </aside>

    <div class="main-content" id="main-content">
      <header class="topbar">
        <div class="topbar-left">
          <button class="sidebar-toggle" id="sidebar-toggle" style="display:flex;">
            <i class="fas fa-bars"></i>
          </button>
          <div class="page-title">
            <h2>${pageTitle}</h2>
            ${pageSubtitle ? `<p>${pageSubtitle}</p>` : ''}
          </div>
        </div>
        <div class="topbar-right">
          <button class="topbar-icon-btn" title="Alerts" onclick="window.location.href='reports.html'">
            <i class="fas fa-bell"></i>
            ${alertCount > 0 ? `<span class="notification-badge"></span>` : ''}
          </button>

        </div>
      </header>
      <div id="page-body"></div>
    </div>
  `;

  const app = document.getElementById('app');
  app.innerHTML = html;

  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => App.logout());

  // Sidebar toggle
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  });
}

// Helper: move a page-content element into #page-body
function mountPageContent(el) {
  const pb = document.getElementById('page-body');
  if (pb && el) {
    el.style.width = '';
    pb.appendChild(el);
  }
}
