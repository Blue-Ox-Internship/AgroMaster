/* =============================================
   AgroMaster - Shared Sidebar + Layout Renderer
   ============================================= */

function renderSidebar(pageTitle, pageSubtitle) {
  const user = App.getCurrentUser();
  if (!user) return;

  const avatarLetter = user.full_name.charAt(0).toUpperCase();
  const avatarContent = user.avatar_url 
    ? `<img src="${user.avatar_url}" alt="${user.full_name}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" />`
    : avatarLetter;
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

  const isDashboard = page === 'dashboard' || pageTitle === 'Dashboard';
  let headerTitleHtml = '';
  if (isDashboard) {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
    
    headerTitleHtml = `
      <div class="dashboard-greeting-header" style="display: flex; align-items: center; gap: 16px;">
        <div class="greeting-avatar" style="width: 46px; height: 46px; border-radius: 50%; border: 2px solid var(--accent); overflow: hidden; box-shadow: var(--shadow); position: relative; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: var(--bg);">
          <img src="${user.avatar_url || 'images/arthur.jpg'}" alt="${user.full_name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=2e7d32&color=fff';" />
        </div>
        <div class="greeting-details" style="display: flex; flex-direction: column; gap: 3px;">
          <h2 style="font-size: 18px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 6px; margin: 0; line-height: 1.2;">
            Welcome back, ${user.full_name} 👋
          </h2>
          <div class="greeting-meta" style="font-size: 11px; color: var(--text-light); display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <span class="role-badge" style="background: var(--success-light); color: var(--primary); padding: 1px 8px; border-radius: 20px; font-weight: 600; font-size: 10.5px; border: 1px solid rgba(46, 125, 50, 0.15); display: inline-flex; align-items: center; gap: 4px;">
              <i class="fas fa-user-shield"></i> ${user.role}
            </span>
            <span class="phone-info" style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 500;">
              <i class="fas fa-phone-alt" style="color: var(--primary);"></i> ${user.phone || '0768537006'}
            </span>
            <span class="email-info" style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 500;">
              <i class="fas fa-envelope" style="color: var(--primary);"></i> ${user.email}
            </span>
            <span class="update-time" style="background: rgba(90, 60, 30, 0.05); padding: 1px 8px; border-radius: 6px; color: var(--text-light); font-size: 10.5px; display: inline-flex; align-items: center; gap: 4px;">
              <i class="fas fa-sync-alt" style="font-size: 9px; animation: spin 8s linear infinite;"></i> Last updated ${formattedTime}
            </span>
          </div>
        </div>
      </div>
    `;
  } else {
    headerTitleHtml = `
      <div class="page-title">
        <h2>${pageTitle}</h2>
        ${pageSubtitle ? `<p>${pageSubtitle}</p>` : ''}
      </div>
    `;
  }

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
        <button class="btn-logout sidebar-logout" id="logout-btn" style="width:100%; display:flex; align-items:center; justify-content:center; gap:8px;">
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
          ${headerTitleHtml}
        </div>
        <div class="topbar-right" style="display:flex; align-items:center; gap:16px;">
          <button class="topbar-icon-btn" title="Alerts" onclick="window.location.href='reports.html'">
            <i class="fas fa-bell"></i>
            ${alertCount > 0 ? `<span class="notification-badge"></span>` : ''}
          </button>
          <div class="topbar-avatar" style="width:36px; height:36px; border-radius:50%; overflow:hidden; display:flex; align-items:center; justify-content:center; border:2px solid rgba(46, 125, 50, 0.15); background:var(--bg); flex-shrink:0;">
            ${avatarContent}
          </div>
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


