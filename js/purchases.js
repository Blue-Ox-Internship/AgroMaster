/* =============================================
   AgroDrop - Purchase Management
   ============================================= */

(function () {
  const user = App.requireAuth();
  if (!user) return;

  renderSidebar('Purchases', 'Record medicine purchases from suppliers');

  document.getElementById('page-body').innerHTML = `
    <div class="page-content">
      <div class="stats-grid" id="purchase-stats" style="margin-bottom:20px;grid-template-columns:repeat(3,1fr);"></div>
      <div class="toolbar">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="search" id="search-input" placeholder="Search purchases..." enterkeyhint="search" />
        </div>
        <input type="date" class="filter-select" id="date-filter" style="min-width:150px;" />
        <button class="btn btn-primary" id="add-purchase-btn"><i class="fas fa-plus"></i> Record Purchase</button>
      </div>
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-shopping-cart"></i> Purchase Records</h3>
          <span id="pur-count" style="font-size:13px;color:#616161;font-weight:500;"></span>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr><th>Medicine</th><th>Supplier</th><th>Qty Purchased</th><th>Cost Per Unit</th><th>Total Cost</th><th>Purchase Date</th><th>Actions</th></tr>
            </thead>
            <tbody id="pur-table"></tbody>
          </table>
        </div>
        <div class="pagination" id="pagination"></div>
      </div>
    </div>`;

  document.getElementById('pur-date').value = App.today();
  document.getElementById('add-purchase-btn').addEventListener('click', openPurModal);
  document.getElementById('save-pur-btn').addEventListener('click', savePurchase);
  document.getElementById('search-input').addEventListener('input', App.debounce(applyFilters, 200));
  document.getElementById('date-filter').addEventListener('change', applyFilters);
  loadPurchaseStats();
  loadPurchases();
})();

let allPurchases = [], filteredPurchases = [], currentPage = 1;
const PAGE_SIZE = 10;

function loadPurchaseStats() {
  const all = DB.getPurchases();
  const total = all.reduce((sum, p) => sum + (p.quantity * p.buying_price), 0);
  const now = new Date();
  const monthP = all.filter(p => { if (!p.purchase_date) return false; const d = new Date(p.purchase_date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const monthTotal = monthP.reduce((sum, p) => sum + (p.quantity * p.buying_price), 0);
  document.getElementById('purchase-stats').innerHTML = `
    <div class="stat-card green"><div class="stat-icon green"><i class="fas fa-shopping-cart"></i></div><div class="stat-info"><h3>${all.length}</h3><p>Total Purchases</p></div></div>
    <div class="stat-card orange"><div class="stat-icon orange"><i class="fas fa-money-bill-wave"></i></div><div class="stat-info"><h3 style="font-size:15px;">${App.formatCurrency(total)}</h3><p>Total Spent</p></div></div>
    <div class="stat-card blue"><div class="stat-icon blue"><i class="fas fa-calendar-alt"></i></div><div class="stat-info"><h3 style="font-size:15px;">${App.formatCurrency(monthTotal)}</h3><p>This Month</p></div></div>`;
}

function loadPurchases() { allPurchases = DB.getPurchases().slice().reverse(); applyFilters(); }

function applyFilters() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const date = document.getElementById('date-filter').value;
  const meds = DB.getMedicines(), sups = DB.getSuppliers();
  filteredPurchases = allPurchases.filter(p => {
    const med = meds.find(m => m.medicine_id === p.medicine_id);
    const sup = sups.find(s => s.supplier_id === p.supplier_id);
    const matchSearch = !search || (med && med.medicine_name.toLowerCase().includes(search)) || (sup && sup.supplier_name.toLowerCase().includes(search));
    const matchDate = !date || p.purchase_date === date;
    return matchSearch && matchDate;
  });
  currentPage = 1; renderTable();
}

function renderTable() {
  const start = (currentPage - 1) * PAGE_SIZE;
  const page = filteredPurchases.slice(start, start + PAGE_SIZE);
  const meds = DB.getMedicines(), sups = DB.getSuppliers();
  const tbody = document.getElementById('pur-table');
  document.getElementById('pur-count').textContent = `${filteredPurchases.length} records`;
  if (!page.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i class="fas fa-shopping-cart"></i><h3>No purchases found</h3></div></td></tr>`;
    document.getElementById('pagination').innerHTML = ''; return;
  }
  tbody.innerHTML = page.map((p, i) => {
    const med = meds.find(m => m.medicine_id === p.medicine_id);
    const sup = sups.find(s => s.supplier_id === p.supplier_id);
    return `<tr class="clickable-row" onclick="viewPurchase('${p.purchase_id}')">
      <td><strong>${med ? med.medicine_name : '—'}</strong><br><span style="font-size:11px;color:#757575;">${med ? med.category : ''}</span></td>
      <td><strong>${sup ? sup.supplier_name : '—'}</strong><br><span style="font-size:11px;color:#757575;">${sup ? sup.phone : ''}</span></td>
      <td><strong>${p.quantity}</strong> units</td>
      <td>${App.formatCurrency(p.buying_price)}</td>
      <td><strong class="ugx" style="color:var(--primary)">${App.formatCurrency(p.quantity * p.buying_price)}</strong></td>
      <td>${App.formatDate(p.purchase_date)}</td>
      <td><button class="btn btn-icon btn-danger" title="Delete" onclick="event.stopPropagation();deletePurchase('${p.purchase_id}')"><i class="fas fa-trash"></i></button></td>
    </tr>`;
  }).join('');
  renderPagination();
}

function renderPagination() {
  const total = filteredPurchases.length, totalPages = Math.ceil(total / PAGE_SIZE);
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

function goPage(p) { const t = Math.ceil(filteredPurchases.length / PAGE_SIZE); if (p < 1 || p > t) return; currentPage = p; renderTable(); }

function openPurModal() {
  document.getElementById('pur-form').reset();
  document.getElementById('pur-date').value = App.today();
  const sups = DB.getSuppliers();
  document.getElementById('pur-supplier').innerHTML = '<option value="">Select supplier</option>' + sups.map(s => `<option value="${s.supplier_id}">${s.supplier_name}</option>`).join('');
  const meds = DB.getMedicines();
  document.getElementById('pur-medicine').innerHTML = '<option value="">Select medicine</option>' + meds.map(m => `<option value="${m.medicine_id}">${m.medicine_name} (Stock: ${m.quantity})</option>`).join('');
  Modal.open('pur-modal');
}

function calcPurTotal() {
  const qty = parseInt(document.getElementById('pur-qty').value) || 0;
  const price = parseFloat(document.getElementById('pur-price').value) || 0;
  const total = qty * price;
  document.getElementById('pur-total').value = total > 0 ? App.formatCurrency(total) : '';
}

function savePurchase() {
  const supId = document.getElementById('pur-supplier').value;
  const medId = document.getElementById('pur-medicine').value;
  const qty = parseInt(document.getElementById('pur-qty').value);
  const price = parseFloat(document.getElementById('pur-price').value);
  const date = document.getElementById('pur-date').value;
  if (!supId || !medId || !qty || !price || !date) { Toast.show('error', 'Validation Error', 'Please fill in all required fields.'); return; }
  const med = DB.getMedicineById(medId);
  DB.addPurchase({ supplier_id: supId, medicine_id: medId, quantity: qty, buying_price: price, purchase_date: date });
  Toast.show('success', 'Purchase Recorded!', `${qty} unit(s) of ${med ? med.medicine_name : 'medicine'} purchased. Stock updated.`);
  Modal.close('pur-modal'); loadPurchaseStats(); loadPurchases();
}

function viewPurchase(id) {
  const p = DB.getPurchases().find(x => x.purchase_id === id);
  if (!p) return;
  const med = DB.getMedicines().find(m => m.medicine_id === p.medicine_id);
  const sup = DB.getSuppliers().find(s => s.supplier_id === p.supplier_id);
  Toast.show('info', 'Purchase Details',
    (med ? med.medicine_name : '—') + ' from ' + (sup ? sup.supplier_name : '—') +
    ' — ' + p.quantity + ' units @ ' + App.formatCurrency(p.buying_price) +
    ' = ' + App.formatCurrency(p.quantity * p.buying_price));
}

async function deletePurchase(id) {
  const ok = await Confirm.show({ title: 'Delete Purchase?', message: 'Remove this purchase record? Stock will NOT be reversed.', confirmText: 'Yes, Delete' });
  if (!ok) return;
  DB.deletePurchase(id);
  Toast.show('success', 'Deleted', 'Purchase record removed.');
  loadPurchaseStats(); loadPurchases();
}
