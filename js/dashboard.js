/* =============================================
   AgroDrop - Dashboard Logic
   ============================================= */

(function () {
  const user = App.requireAuth();
  if (!user) return;

  renderSidebar('Dashboard', 'Welcome, ' + user.full_name.split(' ')[0]);

  // Build page content and mount it
  const pb = document.getElementById('page-body');
  pb.innerHTML = `
    <div class="page-content">
      <!-- Stats KPI Cards Grid -->
      <div class="stats-grid" id="stats-grid"></div>

      <!-- Charts Section Grid -->
      <div class="charts-grid" style="margin-bottom:20px;">
        <div class="chart-card">
          <div class="card-header"><h3><i class="fas fa-chart-line"></i> Sales Trend</h3></div>
          <div class="chart-wrapper" style="height:260px;"><canvas id="salesChart"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="card-header"><h3><i class="fas fa-chart-pie"></i> Stock by Category</h3></div>
          <div class="chart-wrapper" style="height:260px;"><canvas id="categoryChart"></canvas></div>
        </div>
      </div>

      <!-- Row 3: Quick Actions & Recent Alerts Grid -->
      <div class="bottom-grid" style="margin-bottom:20px;">
        <!-- Quick Actions Panel -->
        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-bolt"></i> Quick Actions</h3>
          </div>
          <div class="card-body" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; height: calc(100% - 56px);">
            <a href="sales.html" class="btn btn-primary" style="justify-content:center; padding:15px; font-weight:600; display:flex; align-items:center; gap:8px;">
              <i class="fas fa-cash-register"></i> Record Sale
            </a>
            <a href="purchases.html" class="btn btn-secondary" style="justify-content:center; padding:15px; font-weight:600; border-color:var(--primary); color:var(--primary); background:var(--success-light); display:flex; align-items:center; gap:8px;">
              <i class="fas fa-shopping-cart"></i> Record Purchase
            </a>
            <a href="inventory.html" class="btn btn-secondary" style="justify-content:center; padding:15px; font-weight:600; display:flex; align-items:center; gap:8px;">
              <i class="fas fa-plus"></i> Add Medicine
            </a>
            <a href="reports.html" class="btn btn-secondary" style="justify-content:center; padding:15px; font-weight:600; display:flex; align-items:center; gap:8px;">
              <i class="fas fa-chart-bar"></i> Operations Reports
            </a>
          </div>
        </div>

        <!-- Recent Alerts Panel -->
        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-bell"></i> Recent Alerts</h3>
            <button class="btn btn-sm btn-secondary" id="mark-all-alerts-btn">Mark All Read</button>
          </div>
          <div class="card-body" id="alerts-panel"></div>
        </div>
      </div>

      <!-- Row 4: Recent Sales & Recent Purchases Grid -->
      <div class="bottom-grid">
        <!-- Recent Sales Card -->
        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-receipt"></i> Recent Sales</h3>
            <a href="sales.html" class="btn btn-sm btn-primary"><i class="fas fa-arrow-right"></i> View All</a>
          </div>
          <div class="card-body" style="padding:0">
            <div class="table-container">
              <table>
                <thead>
                  <tr><th>Medicine</th><th>Qty</th><th>Amount</th><th>Date</th></tr>
                </thead>
                <tbody id="recent-sales-table"></tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Recent Purchases Card -->
        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-shopping-cart"></i> Recent Purchases</h3>
            <a href="purchases.html" class="btn btn-sm btn-primary"><i class="fas fa-arrow-right"></i> View All</a>
          </div>
          <div class="card-body" style="padding:0">
            <div class="table-container">
              <table>
                <thead>
                  <tr><th>Medicine</th><th>Supplier</th><th>Qty</th><th>Cost</th><th>Date</th></tr>
                </thead>
                <tbody id="recent-purchases-table"></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  loadDashboard();
})();

let allMeds = [], allSales = [], allPurchases = [], allAlerts = [], allSups = [];

async function loadDashboard() {
  const alertsPanel = document.getElementById('alerts-panel');
  if (alertsPanel) alertsPanel.innerHTML = '<div style="text-align:center;padding:30px;color:#9e9e9e;"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
  document.getElementById('recent-sales-table').innerHTML = '<tr><td colspan="4" style="text-align:center;padding:30px;color:#9e9e9e;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
  document.getElementById('recent-purchases-table').innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:#9e9e9e;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';

  try {
    const results = await Promise.all([
      API.getMedicines(),
      API.getSales(),
      API.getPurchases(),
      API.getAlerts(),
      API.getSuppliers()
    ]);
    allMeds = results[0];
    allSales = results[1];
    allPurchases = results[2];
    allAlerts = results[3];
    allSups = results[4];
  } catch (err) {
    console.error('Failed to load dashboard data from API, using local storage fallback', err);
    allMeds = DB.getMedicines();
    allSales = DB.getSales();
    allPurchases = DB.getPurchases();
    allAlerts = DB.getAlerts();
    allSups = DB.getSuppliers();
  }

  loadStats();
  renderSalesChart();
  renderCategoryChart();
  loadAlerts();
  loadRecentSales();
  loadRecentPurchases();

  const markAlertsBtn = document.getElementById('mark-all-alerts-btn');
  if (markAlertsBtn) {
    markAlertsBtn.addEventListener('click', async () => {
      await API.markAllAlertsRead();
      loadDashboard();
    });
  }
}

function loadStats() {
  const lowStock = allMeds.filter(m => m.quantity < 10).length;
  const expiringSoon = allMeds.filter(m => App.isExpiringSoon(m.expiry_date, 30) || App.isExpired(m.expiry_date)).length;
  
  const today = App.today();
  const todaySales = allSales.filter(s => s.sale_date === today);
  const todaySalesTotal = todaySales.reduce((sum, s) => sum + (s.total_amount || 0), 0);

  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card green" onclick="window.location.href='inventory.html'" style="cursor:pointer">
      <div class="stat-icon green"><i class="fas fa-pills"></i></div>
      <div class="stat-info">
        <h3>${allMeds.length}</h3>
        <p>Medicines</p>
        <span class="stat-change up"><i class="fas fa-boxes"></i> In stock</span>
      </div>
    </div>
    <div class="stat-card orange" onclick="window.location.href='inventory.html?stock-level=low'" style="cursor:pointer">
      <div class="stat-icon orange"><i class="fas fa-exclamation-triangle"></i></div>
      <div class="stat-info">
        <h3>${lowStock}</h3>
        <p>Low Stock</p>
        <span class="stat-change ${lowStock > 0 ? 'down' : 'up'}">${lowStock > 0 ? '<i class="fas fa-arrow-down"></i> Reorder' : '<i class="fas fa-check"></i> Good'}</span>
      </div>
    </div>
    <div class="stat-card red" onclick="window.location.href='inventory.html?stock-level=expiring'" style="cursor:pointer">
      <div class="stat-icon red"><i class="fas fa-calendar-times"></i></div>
      <div class="stat-info">
        <h3>${expiringSoon}</h3>
        <p>Expiring</p>
        <span class="stat-change ${expiringSoon > 0 ? 'down' : 'up'}">${expiringSoon > 0 ? '<i class="fas fa-clock"></i> Check' : '<i class="fas fa-check"></i> Valid'}</span>
      </div>
    </div>
    <div class="stat-card blue" onclick="window.location.href='sales.html'" style="cursor:pointer">
      <div class="stat-icon blue"><i class="fas fa-cash-register"></i></div>
      <div class="stat-info">
        <h3 style="font-size:18px;">${App.formatCurrency(todaySalesTotal)}</h3>
        <p>Today's Sales</p>
        <span class="stat-change up"><i class="fas fa-shopping-bag"></i> ${todaySales.length} sales</span>
      </div>
    </div>`;
}

function renderSalesChart() {
  const labels = [], data = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    labels.push(d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
    data.push(allSales.filter(s => s.sale_date === dateStr).reduce((sum, s) => sum + (s.total_amount || 0), 0));
  }
  
  const ctx = document.getElementById('salesChart');
  if (!ctx) return;
  
  new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Sales (UGX)',
        data,
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46,125,50,0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: '#2e7d32',
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => 'UGX ' + ctx.parsed.y.toLocaleString() } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { size: 11 } } },
        y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 }, callback: v => 'UGX ' + (v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v) } }
      }
    }
  });
}

function renderCategoryChart() {
  const catMap = {};
  allMeds.forEach(m => { catMap[m.category] = (catMap[m.category] || 0) + m.quantity; });
  
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;
  
  const colors = ['#2e7d32', '#43a047', '#66bb6a', '#0288d1', '#f57c00', '#c62828', '#8e24aa', '#00838f'];
  new Chart(ctx.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(catMap),
      datasets: [{
        data: Object.values(catMap),
        backgroundColor: colors.slice(0, Object.keys(catMap).length),
        borderWidth: 3,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12, usePointStyle: true } }
      },
      cutout: '60%'
    }
  });
}

function loadAlerts() {
  const alerts = allAlerts.slice(0, 6);
  const panel = document.getElementById('alerts-panel');
  if (!panel) return;
  if (!alerts.length) {
    panel.innerHTML = `<div class="empty-state"><i class="fas fa-check-circle" style="color:#66bb6a;font-size:40px;"></i><h3>All Clear!</h3></div>`;
    return;
  }
  const typeColor = { low_stock: 'warning', expiry: 'warning', expired: 'danger' };
  panel.innerHTML = alerts.map(a => `
    <div class="alert-item clickable-row" onclick="window.location.href='inventory.html?view=${a.medicine_id}'" style="cursor:pointer">
      <div class="alert-dot ${typeColor[a.alert_type] || 'info'}"></div>
      <div class="alert-item-content">
        <p>${a.message}</p>
        <span>${App.formatDateTime(a.created_at)} &bull; <span class="badge badge-${a.status === 'unread' ? 'danger' : 'secondary'}">${a.status}</span></span>
      </div>
    </div>`).join('');
}

function loadRecentSales() {
  const sales = allSales.slice(0, 5); // Last 5 sales
  const tbody = document.getElementById('recent-sales-table');
  if (!tbody) return;
  if (!sales.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding:30px;color:#9e9e9e">No sales recorded yet.</td></tr>';
    return;
  }
  tbody.innerHTML = sales.map(s => {
    const med = allMeds.find(m => m.medicine_id === s.medicine_id);
    return `<tr class="clickable-row" onclick="window.location.href='sales.html?view=${s.sale_id}'" style="cursor:pointer">
      <td><strong>${med ? med.medicine_name : '(Deleted)'}</strong></td>
      <td>${s.quantity} units</td>
      <td class="ugx">${App.formatCurrency(s.total_amount)}</td>
      <td>${App.formatDate(s.sale_date)}</td>
    </tr>`;
  }).join('');
}

function loadRecentPurchases() {
  const purchases = allPurchases.slice(0, 5); // Last 5 purchases
  const tbody = document.getElementById('recent-purchases-table');
  if (!tbody) return;
  if (!purchases.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:30px;color:#9e9e9e">No purchases recorded yet.</td></tr>';
    return;
  }
  tbody.innerHTML = purchases.map(p => {
    const med = allMeds.find(m => m.medicine_id === p.medicine_id);
    const sup = allSups.find(s => s.supplier_id === p.supplier_id);
    return `<tr class="clickable-row" onclick="window.location.href='purchases.html'" style="cursor:pointer">
      <td><strong>${med ? med.medicine_name : '(Deleted)'}</strong></td>
      <td>${sup ? sup.supplier_name : '—'}</td>
      <td>${p.quantity} units</td>
      <td class="ugx">${App.formatCurrency(p.quantity * p.buying_price)}</td>
      <td>${App.formatDate(p.purchase_date)}</td>
    </tr>`;
  }).join('');
}
