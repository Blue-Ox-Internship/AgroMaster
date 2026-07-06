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

  function navLink(href, icon, label, adminOnly) {
    const pageName = href.replace('.html', '');
    const active = pageName === page ? 'active' : '';
    const cls = adminOnly ? 'nav-item admin-only' : 'nav-item';
    return `
      <div class="${cls}">
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
            <circle cx="85" cy="22" r="8" fill="#FDD835"/>
            <line x1="85" y1="10" x2="85" y2="7" stroke="#FDD835" stroke-width="2" stroke-linecap="round"/>
            <line x1="85" y1="34" x2="85" y2="37" stroke="#FDD835" stroke-width="2" stroke-linecap="round"/>
            <line x1="73" y1="22" x2="70" y2="22" stroke="#FDD835" stroke-width="2" stroke-linecap="round"/>
            <line x1="97" y1="22" x2="100" y2="22" stroke="#FDD835" stroke-width="2" stroke-linecap="round"/>
            <ellipse cx="60" cy="82" rx="44" ry="10" fill="#8B6914"/>
            <rect x="16" y="75" width="88" height="10" fill="#8B6914" rx="2"/>
            <line x1="28" y1="75" x2="28" y2="48" stroke="#7CB342" stroke-width="2.5"/>
            <ellipse cx="28" cy="44" rx="4" ry="7" fill="#AED581" transform="rotate(-15 28 44)"/>
            <ellipse cx="28" cy="44" rx="4" ry="7" fill="#C5E1A5" transform="rotate(15 28 44)"/>
            <circle cx="28" cy="40" r="3" fill="#FDD835"/>
            <path d="M28 60 Q20 55 18 50" stroke="#7CB342" stroke-width="1.8" fill="none"/>
            <path d="M28 55 Q36 50 38 45" stroke="#7CB342" stroke-width="1.8" fill="none"/>
            <line x1="52" y1="75" x2="52" y2="42" stroke="#388E3C" stroke-width="2.5"/>
            <ellipse cx="52" cy="37" rx="5" ry="9" fill="#66BB6A"/>
            <ellipse cx="52" cy="37" rx="5" ry="9" fill="#81C784" transform="rotate(20 52 37)"/>
            <circle cx="52" cy="32" r="3.5" fill="#FFA000"/>
            <path d="M52 58 Q43 52 40 46" stroke="#388E3C" stroke-width="1.8" fill="none"/>
            <path d="M52 52 Q61 46 63 40" stroke="#388E3C" stroke-width="1.8" fill="none"/>
            <ellipse cx="82" cy="67" rx="14" ry="9" fill="white" stroke="#795548" stroke-width="1.2"/>
            <ellipse cx="78" cy="65" rx="4" ry="3" fill="#795548" opacity="0.5"/>
            <rect x="71" y="74" width="3" height="6" fill="#795548" rx="1"/>
            <rect x="76" y="74" width="3" height="6" fill="#795548" rx="1"/>
            <rect x="83" y="74" width="3" height="6" fill="#795548" rx="1"/>
            <rect x="88" y="74" width="3" height="6" fill="#795548" rx="1"/>
            <ellipse cx="70" cy="63" rx="6" ry="5" fill="white" stroke="#795548" stroke-width="1.2"/>
            <ellipse cx="66" cy="59" rx="2" ry="3" fill="#f8bbd0" stroke="#795548" stroke-width="1"/>
            <circle cx="68" cy="62" r="1.2" fill="#333"/>
            <ellipse cx="70" cy="66" rx="3" ry="1.8" fill="#f8bbd0"/>
            <circle cx="69" cy="66" r="0.6" fill="#795548"/>
            <circle cx="71" cy="66" r="0.6" fill="#795548"/>
            <path d="M67 59 Q63 54 65 52" stroke="#795548" stroke-width="1.5" fill="none"/>
            <path d="M70 58 Q70 53 73 52" stroke="#795548" stroke-width="1.5" fill="none"/>
            <ellipse cx="38" cy="70" rx="5" ry="4" fill="#FFA000"/>
            <circle cx="34" cy="67" r="3.5" fill="#FF8F00"/>
            <path d="M38 68 Q44 65 43 70" fill="#FFB300" stroke="#E65100" stroke-width="0.8"/>
            <polygon points="31,67 29,66 31,68" fill="#FF5722"/>
            <circle cx="33" cy="66" r="0.8" fill="#333"/>
            <line x1="36" y1="74" x2="35" y2="78" stroke="#FF8F00" stroke-width="1.5"/>
            <line x1="39" y1="74" x2="40" y2="78" stroke="#FF8F00" stroke-width="1.5"/>
          </svg>
        </div>
        <div class="logo-text"><h2>AgroMaster</h2><span>Inventory System</span></div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section-title">Main Menu</div>
        ${navLink('dashboard.html', 'fa-th-large', 'Dashboard')}
        ${navLink('inventory.html', 'fa-pills', 'Medicines')}
        ${navLink('suppliers.html', 'fa-truck', 'Suppliers')}
        <div class="nav-section-title">Transactions</div>
        ${navLink('sales.html', 'fa-cash-register', 'Sales')}
        ${navLink('purchases.html', 'fa-shopping-cart', 'Purchases')}
        <div class="nav-section-title">System</div>
        ${navLink('reports.html', 'fa-chart-bar', 'Operations Reports')}
        ${navLink('users.html', 'fa-users', 'Users', true)}
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="avatar">${avatarLetter}</div>
          <div class="user-info">
            <h4>${user.full_name}</h4>
            <span>${user.role}</span>
          </div>
        </div>
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
          <div class="topbar-user">
            <div class="avatar">${avatarLetter}</div>
            <div class="user-info">
              <h4>${user.full_name}</h4>
              <span>${user.role}</span>
            </div>
          </div>
          <button class="btn-logout" id="logout-btn">
            <i class="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </header>
      <div id="page-body"></div>
    </div>
  `;

  const app = document.getElementById('app');
  app.innerHTML = html;

  // Hide admin-only items
  if (user.role !== 'Administrator') {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  }

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
