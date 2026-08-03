/* =============================================
   AgroDrop - Sales Management
   ============================================= */

(function () {
  const user = App.requireAuth();
  if (!user) return;

  renderSidebar('Sales Management', 'Record and track medicine sales');

  document.getElementById('page-body').innerHTML = `
    <div class="page-content">
      <div class="stats-grid" id="sales-stats" style="margin-bottom:20px;"></div>
      <div class="toolbar">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="search" id="search-input" placeholder="Search sales..." enterkeyhint="search" />
        </div>
        <input type="date" class="filter-select" id="date-filter" style="min-width:150px;" />
        <button class="btn btn-primary" id="add-sale-btn"><i class="fas fa-plus"></i> Record Sale</button>
      </div>
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-cash-register"></i> Sales Records</h3>
          <span id="sale-count" style="font-size:13px;color:#616161;font-weight:500;"></span>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr><th>#</th><th>Medicine</th><th>Category</th><th>Qty Sold</th><th>Unit Price</th><th>Total Amount</th><th>Sale Date</th><th>Actions</th></tr>
            </thead>
            <tbody id="sales-table"></tbody>
          </table>
        </div>
        <div class="pagination" id="pagination"></div>
      </div>
    </div>`;
  document.getElementById('sale-date').value = App.today();
  document.getElementById('add-sale-btn').addEventListener('click', openSaleModal);
  document.getElementById('save-sale-btn').addEventListener('click', saveSale);
  document.getElementById('search-input').addEventListener('input', App.debounce(applyFilters, 200));
  document.getElementById('date-filter').addEventListener('change', applyFilters);

  // Bind modal input handlers programmatically
  document.getElementById('sale-medicine').addEventListener('change', onMedicineSelect);
  document.getElementById('sale-qty').addEventListener('input', calcTotal);
  document.getElementById('sale-price').addEventListener('input', calcTotal);
  loadSalesStats();
  loadSales();

  // Handle URL deep links for viewing sale details
  const urlParams = new URLSearchParams(window.location.search);
  const viewId = urlParams.get('view');
  if (viewId) {
    viewSale(viewId);
  }
})();

let allSales = [], filteredSales = [], currentPage = 1;
const PAGE_SIZE = 10;

function loadSalesStats() {
  const allS = DB.getSales();
  const todayS = DB.getTodaySales();
  const todayTotal = DB.getTodaySalesTotal();
  const now = new Date();
  const monthS = allS.filter(s => { const d = new Date(s.sale_date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const monthTotal = monthS.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  document.getElementById('sales-stats').innerHTML = `
    <div class="stat-card blue"><div class="stat-icon blue"><i class="fas fa-shopping-bag"></i></div><div class="stat-info"><h3>${todayS.length}</h3><p>Today's Transactions</p></div></div>
    <div class="stat-card green"><div class="stat-icon green"><i class="fas fa-money-bill-wave"></i></div><div class="stat-info"><h3 style="font-size:16px;">${App.formatCurrency(todayTotal)}</h3><p>Today's Revenue</p></div></div>
    <div class="stat-card green"><div class="stat-icon green"><i class="fas fa-chart-line"></i></div><div class="stat-info"><h3 style="font-size:16px;">${App.formatCurrency(monthTotal)}</h3><p>This Month's Revenue</p></div></div>
    <div class="stat-card blue"><div class="stat-icon blue"><i class="fas fa-receipt"></i></div><div class="stat-info"><h3>${allS.length}</h3><p>Total Sales Records</p></div></div>`;
}

function loadSales() { allSales = DB.getSales().slice().reverse(); applyFilters(); }

function applyFilters() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const date = document.getElementById('date-filter').value;
  const meds = DB.getMedicines();
  filteredSales = allSales.filter(s => {
    const med = meds.find(m => m.medicine_id === s.medicine_id);
    const matchSearch = !search || (med && med.medicine_name.toLowerCase().includes(search)) || (med && med.category.toLowerCase().includes(search));
    const matchDate = !date || s.sale_date === date;
    return matchSearch && matchDate;
  });
  currentPage = 1; renderTable();
}

function renderTable() {
  const start = (currentPage - 1) * PAGE_SIZE;
  const page = filteredSales.slice(start, start + PAGE_SIZE);
  const meds = DB.getMedicines();
  const tbody = document.getElementById('sales-table');
  document.getElementById('sale-count').textContent = `${filteredSales.length} records`;
  if (!page.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><i class="fas fa-receipt"></i><h3>No sales found</h3></div></td></tr>`;
    document.getElementById('pagination').innerHTML = ''; return;
  }
  tbody.innerHTML = page.map((s, i) => {
    const med = meds.find(m => m.medicine_id === s.medicine_id);
    return `<tr class="clickable-row" onclick="viewSale('${s.sale_id}')">
      <td style="color:#9e9e9e;font-size:12px;">${start + i + 1}</td>
      <td><strong>${med ? med.medicine_name : '(Deleted)'}</strong></td>
      <td><span class="category-pill">${med ? med.category : '—'}</span></td>
      <td><strong>${s.quantity}</strong> units</td>
      <td>${App.formatCurrency(s.selling_price)}</td>
      <td><strong class="ugx" style="color:var(--primary)">${App.formatCurrency(s.total_amount)}</strong></td>
      <td>${App.formatDate(s.sale_date)}</td>
      <td><button class="btn btn-icon btn-danger" title="Delete" onclick="event.stopPropagation();deleteSale('${s.sale_id}')"><i class="fas fa-trash"></i></button></td>
    </tr>`;
  }).join('');
  renderPagination();
}

function renderPagination() {
  const total = filteredSales.length, totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) { document.getElementById('pagination').innerHTML = ''; return; }
  const start = (currentPage - 1) * PAGE_SIZE + 1, end = Math.min(currentPage * PAGE_SIZE, total);
  let pages = '';
  for (let p = 1; p <= totalPages; p++) pages += `<button class="page-btn ${p === currentPage ? 'active' : ''}" onclick="goPage(${p})">${p}</button>`;
  document.getElementById('pagination').innerHTML = `
    <span class="pagination-info">Showing ${start}–${end} of ${total}</span>
    <div class="pagination-controls">
      <button class="page-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>
      ${pages}
      <button class="page-btn" onclick="goPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>
    </div>`;
}

function goPage(p) { const t = Math.ceil(filteredSales.length / PAGE_SIZE); if (p < 1 || p > t) return; currentPage = p; renderTable(); }

function openSaleModal() {
  document.getElementById('sale-form').reset();
  document.getElementById('sale-date').value = App.today();
  document.getElementById('med-info-box').style.display = 'none';
  const meds = DB.getMedicines().filter(m => m.quantity > 0 && !App.isExpired(m.expiry_date));
  document.getElementById('sale-medicine').innerHTML = '<option value="">Select medicine</option>' +
    meds.map(m => `<option value="${m.medicine_id}" data-stock="${m.quantity}" data-price="${m.unit_price}">${m.medicine_name} (${m.quantity} left)</option>`).join('');
  Modal.open('sale-modal');
}

function onMedicineSelect() {
  const sel = document.getElementById('sale-medicine');
  const opt = sel.options[sel.selectedIndex];
  const box = document.getElementById('med-info-box');
  if (!opt.value) { box.style.display = 'none'; return; }
  document.getElementById('info-stock').textContent = opt.getAttribute('data-stock') + ' units';
  document.getElementById('info-price').textContent = App.formatCurrency(opt.getAttribute('data-price'));
  document.getElementById('sale-price').value = opt.getAttribute('data-price');
  box.style.display = 'block';
  calcTotal();
}

function calcTotal() {
  const qty = parseInt(document.getElementById('sale-qty').value) || 0;
  const price = parseFloat(document.getElementById('sale-price').value) || 0;
  const total = qty * price;
  document.getElementById('sale-total').value = total > 0 ? App.formatCurrency(total) : '';
}

function saveSale() {
  const medId = document.getElementById('sale-medicine').value;
  const qty = parseInt(document.getElementById('sale-qty').value);
  const price = parseFloat(document.getElementById('sale-price').value);
  const date = document.getElementById('sale-date').value;
  if (!medId || !qty || !price || !date) { Toast.show('error', 'Validation Error', 'Please fill in all required fields.'); return; }
  const med = DB.getMedicineById(medId);
  if (!med) { Toast.show('error', 'Error', 'Medicine not found.'); return; }
  if (qty > med.quantity) { Toast.show('error', 'Insufficient Stock', `Only ${med.quantity} units available.`); return; }
  DB.addSale({ medicine_id: medId, quantity: qty, selling_price: price, sale_date: date });
  Toast.show('success', 'Sale Recorded!', `${qty} unit(s) of ${med.medicine_name} sold for ${App.formatCurrency(qty * price)}.`);
  Modal.close('sale-modal'); loadSalesStats(); loadSales();
}

function viewSale(id) {
  const s = DB.getSales().find(x => x.sale_id === id);
  if (!s) return;
  const med = DB.getMedicines().find(m => m.medicine_id === s.medicine_id);
  Toast.show('info', 'Sale Details',
    (med ? med.medicine_name : 'Deleted medicine') + ' — ' + s.quantity + ' units @ ' + App.formatCurrency(s.selling_price) +
    ' = ' + App.formatCurrency(s.total_amount) + ' on ' + App.formatDate(s.sale_date));
}

async function deleteSale(id) {
  const ok = await Confirm.show({ title: 'Delete Sale Record?', message: 'This will permanently remove this sale record. Stock will NOT be reversed.', confirmText: 'Yes, Delete' });
  if (!ok) return;
  DB.deleteSale(id);
  Toast.show('success', 'Deleted', 'Sale record removed.');
  loadSalesStats(); loadSales();
}
