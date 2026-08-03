/* =============================================
   AgroDrop - Reports
   ============================================= */

(function () {
  const user = App.requireAuth();
  if (!user) return;

  renderSidebar('Operations Reports', 'Analytics and printable reports for AgroDrop operations');

  document.getElementById('page-body').innerHTML = `
    <div class="page-content">
      <div class="card" style="margin-bottom:16px;background:linear-gradient(135deg,#f1f8e9 0%,#ffffff 100%);border:1px solid #dcedc8;">
        <div class="card-header" style="padding-bottom:8px;">
          <h3><i class="fas fa-info-circle"></i> Report Source</h3>
        </div>
        <p style="margin:0;color:#5f6b7a;line-height:1.6;">Inventory items and stock details are entered in the Medicines tab. This dashboard only generates operational reports for AgroDrop using that data.</p>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
        <div class="report-tabs" id="report-tabs">
          <button class="report-tab active" data-tab="stock">📦 Stock Report</button>
          <button class="report-tab" data-tab="sales">💰 Sales Report</button>
          <button class="report-tab" data-tab="expiry">📅 Expiry Report</button>
          <button class="report-tab" data-tab="supplier">🚚 Supplier Report</button>
          <button class="report-tab" data-tab="alerts">🔔 Alerts</button>
        </div>
        <button class="btn btn-secondary" onclick="window.print()"><i class="fas fa-print"></i> Print Report</button>
      </div>

      <div class="report-section active" id="tab-stock">
        <h3 class="section-title"><i class="fas fa-boxes"></i> Stock Report</h3>
        <div class="report-summary" id="stock-summary"></div>
        <div class="toolbar" style="margin-bottom:16px;display:flex;gap:12px;align-items:center;">
          <div class="search-box" style="flex:1;max-width:320px;margin-bottom:0;">
            <i class="fas fa-search"></i>
            <input type="search" id="search-stock" placeholder="Search stock report..." />
          </div>
          <button class="btn btn-secondary btn-sm" id="export-stock-csv-btn"><i class="fas fa-file-csv"></i> Export CSV</button>
        </div>
        <div class="card">
          <div class="card-header"><h3>All Medicines – Stock Status</h3></div>
          <div class="table-container">
            <table>
              <thead><tr><th>#</th><th>Medicine</th><th>Category</th><th>Batch</th><th>Stock</th><th>Unit Price</th><th>Stock Value</th><th>Status</th></tr></thead>
              <tbody id="stock-table"></tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="report-section" id="tab-sales">
        <h3 class="section-title"><i class="fas fa-chart-bar"></i> Sales Report</h3>
        <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
          <div class="search-box" style="flex:1;min-width:200px;margin-bottom:0;">
            <i class="fas fa-search"></i>
            <input type="search" id="search-sales" placeholder="Search sales by medicine..." />
          </div>
          <input type="date" class="filter-select" id="sales-from" style="min-width:150px;" />
          <span style="font-size:13px;color:#9e9e9e">to</span>
          <input type="date" class="filter-select" id="sales-to" style="min-width:150px;" />
          <button class="btn btn-primary btn-sm" id="sales-filter-btn"><i class="fas fa-filter"></i> Filter</button>
          <button class="btn btn-secondary btn-sm" id="sales-clear-btn">Clear</button>
          <button class="btn btn-secondary btn-sm" id="export-sales-csv-btn"><i class="fas fa-file-csv"></i> Export CSV</button>
        </div>
        <div class="report-summary" id="sales-summary"></div>
        <div class="card">
          <div class="card-header"><h3>Sales Transactions</h3></div>
          <div class="table-container">
            <table>
              <thead><tr><th>#</th><th>Medicine</th><th>Category</th><th>Qty</th><th>Unit Price</th><th>Total</th><th>Date</th></tr></thead>
              <tbody id="sales-report-table"></tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="report-section" id="tab-expiry">
        <h3 class="section-title"><i class="fas fa-calendar-times"></i> Expiry Report</h3>
        <div class="report-summary" id="expiry-summary"></div>
        <div class="toolbar" style="margin-bottom:16px;display:flex;gap:12px;align-items:center;">
          <div class="search-box" style="flex:1;max-width:320px;margin-bottom:0;">
            <i class="fas fa-search"></i>
            <input type="search" id="search-expiry" placeholder="Search expiry report..." />
          </div>
          <button class="btn btn-secondary btn-sm" id="export-expiry-csv-btn"><i class="fas fa-file-csv"></i> Export CSV</button>
        </div>
        <div class="card">
          <div class="card-header"><h3>Medicines by Expiry Status</h3></div>
          <div class="table-container">
            <table>
              <thead><tr><th>#</th><th>Medicine</th><th>Category</th><th>Batch</th><th>Expiry Date</th><th>Days Left</th><th>Stock</th><th>Status</th></tr></thead>
              <tbody id="expiry-table"></tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="report-section" id="tab-supplier">
        <h3 class="section-title"><i class="fas fa-truck"></i> Supplier Report</h3>
        <div class="report-summary" id="sup-report-summary"></div>
        <div class="toolbar" style="margin-bottom:16px;display:flex;gap:12px;align-items:center;">
          <div class="search-box" style="flex:1;max-width:320px;margin-bottom:0;">
            <i class="fas fa-search"></i>
            <input type="search" id="search-supplier-report" placeholder="Search supplier report..." />
          </div>
          <button class="btn btn-secondary btn-sm" id="export-supplier-csv-btn"><i class="fas fa-file-csv"></i> Export CSV</button>
        </div>
        <div class="card">
          <div class="card-header"><h3>Supplier Purchase Summary</h3></div>
          <div class="table-container">
            <table>
              <thead><tr><th>#</th><th>Supplier</th><th>Contact</th><th>Purchases</th><th>Total Qty</th><th>Total Spent</th></tr></thead>
              <tbody id="sup-report-table"></tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="report-section" id="tab-alerts">
        <h3 class="section-title"><i class="fas fa-bell"></i> System Alerts</h3>
        <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
          <div class="search-box" style="flex:1;min-width:200px;margin-bottom:0;">
            <i class="fas fa-search"></i>
            <input type="search" id="search-alerts" placeholder="Search alerts..." />
          </div>
          <button class="btn btn-sm btn-primary" id="alerts-refresh-btn"><i class="fas fa-sync"></i> Refresh Alerts</button>
          <button class="btn btn-sm btn-secondary" id="alerts-readall-btn"><i class="fas fa-check-double"></i> Mark All Read</button>
          <button class="btn btn-secondary btn-sm" id="export-alerts-csv-btn"><i class="fas fa-file-csv"></i> Export CSV</button>
        </div>
        <div class="card">
          <div class="card-header"><h3>All Alerts</h3><span id="alert-stats" style="font-size:13px;color:#616161;"></span></div>
          <div class="table-container">
            <table>
              <thead><tr><th>#</th><th>Type</th><th>Message</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
              <tbody id="alerts-table"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;

  initReports();
})();

let allMeds = [], allSales = [], allPurchases = [], allSuppliers = [], allAlerts = [];
let filteredMedsReport = [], filteredSalesReport = [], filteredExpiryReport = [], filteredSupplierReport = [], filteredAlertsReport = [];

async function loadReportsData() {
  try {
    const results = await Promise.all([
      API.getMedicines(),
      API.getSales(),
      API.getPurchases(),
      API.getSuppliers(),
      API.getAlerts()
    ]);
    allMeds = results[0];
    allSales = results[1];
    allPurchases = results[2];
    allSuppliers = results[3];
    allAlerts = results[4];
  } catch (err) {
    console.error('Failed to load API data for reports, falling back to local DB', err);
    allMeds = DB.getMedicines();
    allSales = DB.getSales();
    allPurchases = DB.getPurchases();
    allSuppliers = DB.getSuppliers();
    allAlerts = DB.getAlerts();
  }
}

async function initReports() {
  document.querySelectorAll('.report-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.report-section').forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      const section = document.getElementById('tab-' + tab.dataset.tab);
      if (section) section.classList.add('active');
    });
  });
  const now = new Date();
  document.getElementById('sales-from').value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  document.getElementById('sales-to').value = App.today();

  // Bind report search inputs programmatically
  document.getElementById('search-stock').addEventListener('input', App.debounce(filterStockReport, 200));
  document.getElementById('search-sales').addEventListener('input', App.debounce(filterSalesReport, 200));
  document.getElementById('search-expiry').addEventListener('input', App.debounce(filterExpiryReport, 200));
  document.getElementById('search-supplier-report').addEventListener('input', App.debounce(filterSupplierReport, 200));
  document.getElementById('search-alerts').addEventListener('input', App.debounce(filterAlertsReport, 200));

  // Action buttons
  document.getElementById('sales-filter-btn').addEventListener('click', filterSalesReport);
  document.getElementById('sales-clear-btn').addEventListener('click', clearSalesFilter);
  document.getElementById('alerts-refresh-btn').addEventListener('click', async () => {
    await API.getAlerts(); // Force regenerates on DB client side or fetch from server
    await loadReportsData();
    filterAlertsReport();
  });
  document.getElementById('alerts-readall-btn').addEventListener('click', async () => {
    await API.markAllAlertsRead();
    await loadReportsData();
    filterAlertsReport();
  });

  // CSV Export binds
  document.getElementById('export-stock-csv-btn').addEventListener('click', () => {
    const headers = ['Medicine', 'Category', 'Batch', 'Stock Qty', 'Unit Price', 'Stock Value', 'Status'];
    const rows = filteredMedsReport.map(m => [
      m.medicine_name,
      m.category,
      m.batch_number || '',
      m.quantity,
      m.unit_price,
      m.quantity * m.unit_price,
      getReportStatusRaw(m)
    ]);
    App.exportToCSV('stock_report.csv', headers, rows);
  });

  document.getElementById('export-sales-csv-btn').addEventListener('click', () => {
    const headers = ['Medicine', 'Category', 'Qty Sold', 'Unit Price', 'Total', 'Sale Date'];
    const rows = filteredSalesReport.map(s => {
      const med = allMeds.find(m => m.medicine_id === s.medicine_id);
      return [
        med ? med.medicine_name : '(Deleted)',
        med ? med.category : '—',
        s.quantity,
        s.selling_price,
        s.total_amount,
        s.sale_date
      ];
    });
    App.exportToCSV('sales_report.csv', headers, rows);
  });

  document.getElementById('export-expiry-csv-btn').addEventListener('click', () => {
    const headers = ['Medicine', 'Category', 'Batch', 'Expiry Date', 'Days Left', 'Stock Qty', 'Status'];
    const rows = filteredExpiryReport.map(m => {
      const days = App.daysUntilExpiry(m.expiry_date);
      return [
        m.medicine_name,
        m.category,
        m.batch_number || '',
        m.expiry_date,
        days !== null ? days : '—',
        m.quantity,
        days < 0 ? 'Expired' : days <= 30 ? 'Expiring Soon' : 'Valid'
      ];
    });
    App.exportToCSV('expiry_report.csv', headers, rows);
  });

  document.getElementById('export-supplier-csv-btn').addEventListener('click', () => {
    const headers = ['Supplier Name', 'Contact', 'Purchases Count', 'Total Spent'];
    const rows = filteredSupplierReport.map(s => [
      s.supplier_name,
      s.phone || '',
      s.purchaseCount,
      s.totalSpent
    ]);
    App.exportToCSV('supplier_purchases_report.csv', headers, rows);
  });

  document.getElementById('export-alerts-csv-btn').addEventListener('click', () => {
    const headers = ['Type', 'Message', 'Status', 'Date'];
    const rows = filteredAlertsReport.map(a => [
      a.alert_type,
      a.message,
      a.status,
      a.created_at
    ]);
    App.exportToCSV('alerts_report.csv', headers, rows);
  });

  await loadReportsData();

  loadStockReport(); 
  loadSalesReport(); 
  loadExpiryReport(); 
  loadSupplierReport(); 
  loadAlertsReport();
}

function loadStockReport() {
  const totalValue = allMeds.reduce((sum, m) => sum + (m.quantity * m.unit_price), 0);
  const lowStock = allMeds.filter(m => m.quantity < 10).length;
  const outOfStock = allMeds.filter(m => m.quantity === 0).length;
  document.getElementById('stock-summary').innerHTML = `
    <div class="summary-card"><span class="value">${allMeds.length}</span><div class="label">Total Medicines</div></div>
    <div class="summary-card"><span class="value">${App.formatCurrency(totalValue)}</span><div class="label">Total Stock Value</div></div>
    <div class="summary-card"><span class="value" style="color:var(--warning)">${lowStock}</span><div class="label">Low Stock Items</div></div>
    <div class="summary-card"><span class="value" style="color:var(--danger)">${outOfStock}</span><div class="label">Out of Stock</div></div>`;
  filterStockReport();
}

function filterStockReport() {
  const search = document.getElementById('search-stock').value.toLowerCase();
  filteredMedsReport = allMeds.filter(m => 
    m.medicine_name.toLowerCase().includes(search) ||
    m.category.toLowerCase().includes(search) ||
    (m.manufacturer || '').toLowerCase().includes(search) ||
    (m.batch_number || '').toLowerCase().includes(search)
  );
  const sorted = [...filteredMedsReport].sort((a, b) => a.quantity - b.quantity);
  document.getElementById('stock-table').innerHTML = sorted.map((m, i) => `
    <tr class="clickable-row" onclick="window.location.href='inventory.html'">
      <td style="color:#9e9e9e;font-size:12px">${i + 1}</td>
      <td><strong>${m.medicine_name}</strong></td>
      <td><span class="category-pill">${m.category}</span></td>
      <td style="font-size:12px;color:#616161">${m.batch_number || '—'}</td>
      <td><strong style="font-size:15px">${m.quantity}</strong></td>
      <td>${App.formatCurrency(m.unit_price)}</td>
      <td class="ugx"><strong>${App.formatCurrency(m.quantity * m.unit_price)}</strong></td>
      <td>${getReportStatus(m)}</td>
    </tr>`).join('') || '<tr><td colspan="8" class="text-center" style="padding:30px;color:#9e9e9e">No matching medicines found.</td></tr>';
}

function getReportStatus(m) {
  if (App.isExpired(m.expiry_date)) return '<span class="badge badge-danger">Expired</span>';
  if (m.quantity === 0) return '<span class="badge badge-danger">Out of Stock</span>';
  if (m.quantity < 10) return '<span class="badge badge-warning">Low Stock</span>';
  if (App.isExpiringSoon(m.expiry_date, 30)) return '<span class="badge badge-warning">Expiring Soon</span>';
  return '<span class="badge badge-success">In Stock</span>';
}

function getReportStatusRaw(m) {
  if (App.isExpired(m.expiry_date)) return 'Expired';
  if (m.quantity === 0) return 'Out of Stock';
  if (m.quantity < 10) return 'Low Stock';
  if (App.isExpiringSoon(m.expiry_date, 30)) return 'Expiring Soon';
  return 'In Stock';
}

function loadSalesReport() { filterSalesReport(); }

function filterSalesReport() {
  const from = document.getElementById('sales-from').value;
  const to = document.getElementById('sales-to').value;
  const search = document.getElementById('search-sales').value.toLowerCase();
  
  filteredSalesReport = allSales;
  if (from) filteredSalesReport = filteredSalesReport.filter(s => s.sale_date >= from);
  if (to) filteredSalesReport = filteredSalesReport.filter(s => s.sale_date <= to);
  
  if (search) {
    filteredSalesReport = filteredSalesReport.filter(s => {
      const med = allMeds.find(m => m.medicine_id === s.medicine_id);
      return (med && med.medicine_name.toLowerCase().includes(search)) || (med && med.category.toLowerCase().includes(search));
    });
  }

  const total = filteredSalesReport.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const totalQty = filteredSalesReport.reduce((sum, s) => sum + (s.quantity || 0), 0);
  const medMap = {};
  filteredSalesReport.forEach(s => { medMap[s.medicine_id] = (medMap[s.medicine_id] || 0) + s.quantity; });
  const topMedId = Object.keys(medMap).sort((a, b) => medMap[b] - medMap[a])[0];
  const topMed = topMedId ? allMeds.find(m => m.medicine_id === topMedId) : null;
  
  document.getElementById('sales-summary').innerHTML = `
    <div class="summary-card"><span class="value">${filteredSalesReport.length}</span><div class="label">Total Transactions</div></div>
    <div class="summary-card"><span class="value">${App.formatCurrency(total)}</span><div class="label">Total Revenue</div></div>
    <div class="summary-card"><span class="value">${totalQty}</span><div class="label">Total Units Sold</div></div>
    <div class="summary-card"><span class="value" style="font-size:13px">${topMed ? topMed.medicine_name : '—'}</span><div class="label">Top Selling Medicine</div></div>`;
    
  const sorted = [...filteredSalesReport].sort((a, b) => b.sale_date.localeCompare(a.sale_date));
  document.getElementById('sales-report-table').innerHTML = sorted.map((s, i) => {
    const med = allMeds.find(m => m.medicine_id === s.medicine_id);
    return `<tr class="clickable-row" onclick="window.location.href='sales.html'">
      <td style="color:#9e9e9e;font-size:12px">${i + 1}</td>
      <td><strong>${med ? med.medicine_name : '—'}</strong></td>
      <td><span class="category-pill">${med ? med.category : '—'}</span></td>
      <td>${s.quantity}</td>
      <td>${App.formatCurrency(s.selling_price)}</td>
      <td class="ugx"><strong>${App.formatCurrency(s.total_amount)}</strong></td>
      <td>${App.formatDate(s.sale_date)}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="7" class="text-center" style="padding:30px;color:#9e9e9e">No sales in this period.</td></tr>';
}

function clearSalesFilter() {
  const now = new Date();
  document.getElementById('sales-from').value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  document.getElementById('sales-to').value = App.today();
  document.getElementById('search-sales').value = '';
  filterSalesReport();
}

function loadExpiryReport() {
  const expired = allMeds.filter(m => App.isExpired(m.expiry_date));
  const expiringSoon = allMeds.filter(m => App.isExpiringSoon(m.expiry_date, 30));
  const valid = allMeds.filter(m => !App.isExpired(m.expiry_date) && !App.isExpiringSoon(m.expiry_date, 30));
  document.getElementById('expiry-summary').innerHTML = `
    <div class="summary-card"><span class="value" style="color:var(--danger)">${expired.length}</span><div class="label">Expired Medicines</div></div>
    <div class="summary-card"><span class="value" style="color:var(--warning)">${expiringSoon.length}</span><div class="label">Expiring within 30 days</div></div>
    <div class="summary-card"><span class="value" style="color:var(--primary)">${valid.length}</span><div class="label">Valid Stock</div></div>
    <div class="summary-card"><span class="value">${allMeds.length}</span><div class="label">Total Medicines</div></div>`;
  filterExpiryReport();
}

function filterExpiryReport() {
  const search = document.getElementById('search-expiry').value.toLowerCase();
  filteredExpiryReport = allMeds.filter(m => 
    m.medicine_name.toLowerCase().includes(search) ||
    m.category.toLowerCase().includes(search) ||
    (m.manufacturer || '').toLowerCase().includes(search)
  );
  const sorted = [...filteredExpiryReport].sort((a, b) => { const da = App.daysUntilExpiry(a.expiry_date) ?? 9999, db2 = App.daysUntilExpiry(b.expiry_date) ?? 9999; return da - db2; });
  document.getElementById('expiry-table').innerHTML = sorted.map((m, i) => {
    const days = App.daysUntilExpiry(m.expiry_date);
    let daysLabel = '—', badge = '';
    if (days === null) { daysLabel = '—'; badge = '<span class="badge badge-secondary">Unknown</span>'; }
    else if (days < 0) { daysLabel = `<span style="color:var(--danger);font-weight:600">${Math.abs(days)} days ago</span>`; badge = '<span class="badge badge-danger">Expired</span>'; }
    else if (days <= 30) { daysLabel = `<span style="color:var(--warning);font-weight:600">${days} days</span>`; badge = '<span class="badge badge-warning">Expiring Soon</span>'; }
    else { daysLabel = `<span style="color:var(--primary)">${days} days</span>`; badge = '<span class="badge badge-success">Valid</span>'; }
    return `<tr class="clickable-row" onclick="window.location.href='inventory.html'">
      <td style="color:#9e9e9e;font-size:12px">${i + 1}</td>
      <td><strong>${m.medicine_name}</strong></td>
      <td><span class="category-pill">${m.category}</span></td>
      <td style="font-size:12px;color:#616161">${m.batch_number || '—'}</td>
      <td>${App.formatDate(m.expiry_date)}</td>
      <td>${daysLabel}</td>
      <td>${m.quantity}</td>
      <td>${badge}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="8" class="text-center" style="padding:30px;color:#9e9e9e">No matching medicines.</td></tr>';
}

function loadSupplierReport() {
  const supStats = allSuppliers.map(s => {
    const sp = allPurchases.filter(p => p.supplier_id === s.supplier_id);
    const totalQty = sp.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const totalSpent = sp.reduce((sum, p) => sum + (p.quantity * p.buying_price), 0);
    return { ...s, purchaseCount: sp.length, totalQty, totalSpent };
  }).sort((a, b) => b.totalSpent - a.totalSpent);
  const totalSpent = supStats.reduce((sum, s) => sum + s.totalSpent, 0);
  document.getElementById('sup-report-summary').innerHTML = `
    <div class="summary-card"><span class="value">${allSuppliers.length}</span><div class="label">Total Suppliers</div></div>
    <div class="summary-card"><span class="value">${allPurchases.length}</span><div class="label">Total Purchase Orders</div></div>
    <div class="summary-card"><span class="value">${App.formatCurrency(totalSpent)}</span><div class="label">Total Spent</div></div>`;
  filterSupplierReport();
}

function filterSupplierReport() {
  const search = document.getElementById('search-supplier-report').value.toLowerCase();
  const filtered = allSuppliers.filter(s => 
    s.supplier_name.toLowerCase().includes(search) ||
    (s.phone || '').toLowerCase().includes(search) ||
    (s.email || '').toLowerCase().includes(search) ||
    (s.address || '').toLowerCase().includes(search)
  );
  filteredSupplierReport = filtered.map(s => {
    const sp = allPurchases.filter(p => p.supplier_id === s.supplier_id);
    const totalQty = sp.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const totalSpent = sp.reduce((sum, p) => sum + (p.quantity * p.buying_price), 0);
    return { ...s, purchaseCount: sp.length, totalQty, totalSpent };
  }).sort((a, b) => b.totalSpent - a.totalSpent);
  document.getElementById('sup-report-table').innerHTML = filteredSupplierReport.map((s, i) => `
    <tr class="clickable-row" onclick="window.location.href='suppliers.html'">
      <td style="color:#9e9e9e;font-size:12px">${i + 1}</td>
      <td><strong>${s.supplier_name}</strong></td>
      <td style="font-size:13px">${s.phone || '—'}<br/><small style="color:var(--info)">${s.email || ''}</small></td>
      <td>${s.purchaseCount}</td>
      <td>${s.totalQty.toLocaleString()} units</td>
      <td class="ugx"><strong>${App.formatCurrency(s.totalSpent)}</strong></td>
    </tr>`).join('') || '<tr><td colspan="6" class="text-center" style="padding:30px;color:#9e9e9e">No matching supplier data.</td></tr>';
}

function loadAlertsReport() { filterAlertsReport(); }

function filterAlertsReport() {
  const search = document.getElementById('search-alerts').value.toLowerCase();
  const unread = allAlerts.filter(a => a.status === 'unread').length;
  document.getElementById('alert-stats').textContent = `${unread} unread • ${allAlerts.length} total`;
  
  filteredAlertsReport = allAlerts.filter(a => 
    a.message.toLowerCase().includes(search) ||
    a.alert_type.toLowerCase().includes(search)
  );

  const typeConfig = {
    low_stock: { label: 'Low Stock', badge: 'badge-warning', icon: 'fa-exclamation-triangle' },
    expiry: { label: 'Expiry Warning', badge: 'badge-warning', icon: 'fa-clock' },
    expired: { label: 'Expired', badge: 'badge-danger', icon: 'fa-times-circle' }
  };
  document.getElementById('alerts-table').innerHTML = filteredAlertsReport.map((a, i) => {
    const cfg = typeConfig[a.alert_type] || { label: a.alert_type, badge: 'badge-info', icon: 'fa-bell' };
    return `<tr style="${a.status === 'unread' ? 'background:#fffde7;' : ''}">
      <td style="color:#9e9e9e;font-size:12px">${i + 1}</td>
      <td><span class="badge ${cfg.badge}"><i class="fas ${cfg.icon}"></i> ${cfg.label}</span></td>
      <td style="font-size:13px">${a.message}</td>
      <td><span class="badge ${a.status === 'unread' ? 'badge-danger' : 'badge-success'}">${a.status}</span></td>
      <td style="font-size:12px;color:#9e9e9e">${App.formatDateTime(a.created_at)}</td>
      <td>${a.status === 'unread' ? `<button class="btn btn-sm btn-secondary" onclick="markRead('${a.alert_id}')">Mark Read</button>` : '<span style="color:#9e9e9e;font-size:12px">—</span>'}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="6" class="text-center" style="padding:30px;color:#9e9e9e">No alerts.</td></tr>';
}

async function markRead(id) { 
  await API.markAlertRead(id); 
  await loadReportsData();
  filterAlertsReport(); 
}
