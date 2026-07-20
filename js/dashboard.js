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
      <div class="stats-grid" id="stats-grid"></div>
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
      <div class="bottom-grid">
        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-bell"></i> Recent Alerts</h3>
            <button class="btn btn-sm btn-secondary" onclick="DB.markAllAlertsRead(); loadAlerts();">Mark All Read</button>
          </div>
          <div class="card-body" id="alerts-panel"></div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-receipt"></i> Recent Sales</h3>
            <a href="sales.html" class="btn btn-sm btn-primary"><i class="fas fa-arrow-right"></i> View All</a>
          </div>
          <div class="card-body" style="padding:0">
            <div class="table-container">
              <table>
                <thead><tr><th>Medicine</th><th>Qty</th><th>Amount</th><th>Date</th></tr></thead>
                <tbody id="recent-sales-table"></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div class="card" style="margin-top:20px;">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <h3><i class="fas fa-pills"></i> Medicine Stock Overview</h3>
          <div style="display:flex;align-items:center;gap:12px;">
            <div class="search-box" style="margin:0;width:240px;">
              <i class="fas fa-search"></i>
              <input type="search" id="dashboard-med-search" placeholder="Search medicines..." enterkeyhint="search" />
            </div>
            <a href="inventory.html" class="btn btn-sm btn-primary"><i class="fas fa-arrow-right"></i> View All</a>
          </div>
        </div>
        <div class="card-body" style="padding:0">
          <div class="table-container">
            <table>
              <thead><tr><th>#</th><th>Medicine</th><th>Category</th><th>Batch</th><th>Stock</th><th>Unit Price</th><th>Stock Value</th><th>Expiry</th><th>Status</th></tr></thead>
              <tbody id="medicines-table"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;

  loadDashboard();
})();

function loadDashboard() {
  loadStats();
  renderSalesChart();
  renderCategoryChart();
  loadAlerts();
  loadRecentSales();
  loadMedicinesOverview();
}

function loadStats() {
  const meds = DB.getMedicines();
  const lowStock = meds.filter(m => m.quantity < 10).length;
  const expiringSoon = meds.filter(m => App.isExpiringSoon(m.expiry_date, 30) || App.isExpired(m.expiry_date)).length;
  const todaySalesTotal = DB.getTodaySalesTotal();

  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card green" onclick="window.location.href='inventory.html'" style="cursor:pointer">
      <div class="stat-icon green"><i class="fas fa-pills"></i></div>
      <div class="stat-info"><h3>${meds.length}</h3><p>Medicines</p><span class="stat-change up"><i class="fas fa-boxes"></i> In stock</span></div>
    </div>
    <div class="stat-card orange" onclick="window.location.href='inventory.html'" style="cursor:pointer">
      <div class="stat-icon orange"><i class="fas fa-exclamation-triangle"></i></div>
      <div class="stat-info"><h3>${lowStock}</h3><p>Low Stock</p>
        <span class="stat-change ${lowStock > 0 ? 'down' : 'up'}">${lowStock > 0 ? '<i class="fas fa-arrow-down"></i> Reorder' : '<i class="fas fa-check"></i> Good'}</span>
      </div>
    </div>
    <div class="stat-card red" onclick="window.location.href='inventory.html'" style="cursor:pointer">
      <div class="stat-icon red"><i class="fas fa-calendar-times"></i></div>
      <div class="stat-info"><h3>${expiringSoon}</h3><p>Expiring</p>
        <span class="stat-change ${expiringSoon > 0 ? 'down' : 'up'}">${expiringSoon > 0 ? '<i class="fas fa-clock"></i> Check' : '<i class="fas fa-check"></i> Valid'}</span>
      </div>
    </div>
    <div class="stat-card blue" onclick="window.location.href='sales.html'" style="cursor:pointer">
      <div class="stat-icon blue"><i class="fas fa-cash-register"></i></div>
      <div class="stat-info"><h3 style="font-size:18px;">${App.formatCurrency(todaySalesTotal)}</h3><p>Today</p>
        <span class="stat-change up"><i class="fas fa-shopping-bag"></i> ${DB.getTodaySales().length} sales</span>
      </div>
    </div>`;
}

function renderSalesChart() {
  const sales = DB.getSales();
  const labels = [], data = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    labels.push(d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
    data.push(sales.filter(s => s.sale_date === dateStr).reduce((sum, s) => sum + (s.total_amount || 0), 0));
  }
  new Chart(document.getElementById('salesChart').getContext('2d'), {
    type: 'line',
    data: { labels, datasets: [{ label: 'Sales (UGX)', data, borderColor: '#2e7d32', backgroundColor: 'rgba(46,125,50,0.08)', borderWidth: 2.5, pointBackgroundColor: '#2e7d32', pointRadius: 3, pointHoverRadius: 5, fill: true, tension: 0.4 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => 'UGX ' + ctx.parsed.y.toLocaleString() } } },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { size: 11 } } },
        y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 }, callback: v => 'UGX ' + (v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v) } }
      }
    }
  });
}

function renderCategoryChart() {
  const meds = DB.getMedicines();
  const catMap = {};
  meds.forEach(m => { catMap[m.category] = (catMap[m.category] || 0) + m.quantity; });
  const colors = ['#2e7d32', '#43a047', '#66bb6a', '#0288d1', '#f57c00', '#c62828', '#8e24aa', '#00838f'];
  new Chart(document.getElementById('categoryChart').getContext('2d'), {
    type: 'doughnut',
    data: { labels: Object.keys(catMap), datasets: [{ data: Object.values(catMap), backgroundColor: colors.slice(0, Object.keys(catMap).length), borderWidth: 3, borderColor: '#fff' }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12, usePointStyle: true } } }, cutout: '60%' }
  });
}

function loadAlerts() {
  const alerts = DB.getAlerts().slice(0, 6);
  const panel = document.getElementById('alerts-panel');
  if (!panel) return;
  if (!alerts.length) {
    panel.innerHTML = `<div class="empty-state"><i class="fas fa-check-circle" style="color:#66bb6a;font-size:40px;"></i><h3>All Clear!</h3></div>`;
    return;
  }
  const typeColor = { low_stock: 'warning', expiry: 'warning', expired: 'danger' };
  panel.innerHTML = alerts.map(a => `
    <div class="alert-item">
      <div class="alert-dot ${typeColor[a.alert_type] || 'info'}"></div>
      <div class="alert-item-content">
        <p>${a.message}</p>
        <span>${App.formatDateTime(a.created_at)} &bull; <span class="badge badge-${a.status === 'unread' ? 'danger' : 'secondary'}">${a.status}</span></span>
      </div>
    </div>`).join('');
}

function loadMedicinesOverview() {
  const meds = DB.getMedicines();
  const tbody = document.getElementById('medicines-table');
  if (!tbody) return;
  if (!meds.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:30px;color:#9e9e9e">No medicines in inventory.</td></tr>';
    return;
  }
  const display = meds.slice(0, 10);
  tbody.innerHTML = display.map((m, i) => {
    let badge = '';
    if (App.isExpired(m.expiry_date)) badge = '<span class="badge badge-danger">Expired</span>';
    else if (m.quantity === 0) badge = '<span class="badge badge-danger">Out of Stock</span>';
    else if (m.quantity < 10) badge = '<span class="badge badge-warning">Low Stock</span>';
    else if (App.isExpiringSoon(m.expiry_date, 30)) badge = '<span class="badge badge-warning">Expiring</span>';
    else badge = '<span class="badge badge-success">In Stock</span>';
    const days = App.daysUntilExpiry(m.expiry_date);
    let expiryLabel = App.formatDate(m.expiry_date);
    if (days !== null && days < 0) expiryLabel = '<span style="color:var(--danger);font-weight:600">Expired</span>';
    else if (days !== null && days <= 30) expiryLabel = '<span style="color:var(--warning);font-weight:600">' + days + 'd left</span>';
    return '<tr class="clickable-row" onclick="window.location.href=\'inventory.html\'">' +
      '<td style="color:#9e9e9e;font-size:12px">' + (i + 1) + '</td>' +
      '<td><strong>' + m.medicine_name + '</strong></td>' +
      '<td><span class="category-pill">' + m.category + '</span></td>' +
      '<td style="font-size:12px;color:#616161">' + (m.batch_number || '—') + '</td>' +
      '<td><strong style="font-size:15px">' + m.quantity + '</strong></td>' +
      '<td>' + expiryLabel + '</td>' +
      '<td>' + badge + '</td>' +
      '</tr>';
  }).join('');
}

function loadRecentSales() {
  const sales = DB.getSales().slice(-8).reverse();
  const meds = DB.getMedicines();
  const tbody = document.getElementById('recent-sales-table');
  if (!tbody) return;
  if (!sales.length) { tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding:30px;color:#9e9e9e">No sales recorded yet.</td></tr>'; return; }
  tbody.innerHTML = sales.map(s => {
    const med = meds.find(m => m.medicine_id === s.medicine_id);
    return `<tr class="clickable-row" onclick="window.location.href='sales.html'"><td><strong>${med ? med.medicine_name : '—'}</strong></td><td>${s.quantity}</td><td class="ugx">${App.formatCurrency(s.total_amount)}</td><td>${App.formatDate(s.sale_date)}</td></tr>`;
  }).join('');
}
