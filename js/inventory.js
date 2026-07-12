/* =============================================
   AgroDrop - Inventory Management
   ============================================= */

(function () {
  const user = App.requireAuth();
  if (!user) return;

  renderSidebar('Medicine Inventory', 'Manage your livestock medicines');

  document.getElementById('page-body').innerHTML = `
    <div class="page-content">
      <div class="toolbar">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="search" id="search-input" placeholder="Search medicines..." enterkeyhint="search" />
        </div>
        <select class="filter-select" id="category-filter">
          <option value="">All Categories</option>
        </select>
        <select class="filter-select" id="stock-filter">
          <option value="">All Stock Levels</option>
          <option value="low">Low Stock (&lt;10)</option>
          <option value="expiring">Expiring Soon</option>
          <option value="expired">Expired</option>
        </select>
        <button class="btn btn-primary" id="add-med-btn"><i class="fas fa-plus"></i> Add Medicine</button>
      </div>
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-pills"></i> Medicine Inventory</h3>
          <span id="med-count" style="font-size:13px;color:#616161;font-weight:500;"></span>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Medicine Name</th><th>Category</th><th>Batch No.</th>
                <th>Expiry Date</th><th>Quantity</th><th>Unit Price</th><th>Stock Value</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody id="meds-table"></tbody>
          </table>
        </div>
        <div class="pagination" id="pagination"></div>
      </div>
    </div>`;

  initInventory();
})();

let currentPage = 1;
const PAGE_SIZE = 10;
let allMeds = [];
let filteredMeds = [];
let editingId = null;

function populateCategoryFilter() {
  var cats = {};
  allMeds.forEach(function (m) { cats[m.category] = true; });
  var sel = document.getElementById('category-filter');
  var cur = sel.value;
  sel.innerHTML = '<option value="">All Categories</option>';
  Object.keys(cats).sort().forEach(function (c) {
    sel.innerHTML += '<option>' + c + '</option>';
  });
  if (cur) sel.value = cur;
}

function initInventory() {
  loadMeds();
  document.getElementById('add-med-btn').addEventListener('click', function () { openAddModal(); });
  document.getElementById('save-med-btn').addEventListener('click', saveMedicine);
  document.getElementById('search-input').addEventListener('input', App.debounce(applyFilters, 200));
  document.getElementById('category-filter').addEventListener('change', applyFilters);
  document.getElementById('stock-filter').addEventListener('change', applyFilters);
}

function loadMeds() { allMeds = DB.getMedicines(); populateCategoryFilter(); applyFilters(); }

function applyFilters() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const cat = document.getElementById('category-filter').value;
  const stockF = document.getElementById('stock-filter').value;
  filteredMeds = allMeds.filter(m => {
    const matchSearch = !search || m.medicine_name.toLowerCase().includes(search) || m.category.toLowerCase().includes(search) || (m.manufacturer || '').toLowerCase().includes(search) || (m.batch_number || '').toLowerCase().includes(search);
    const matchCat = !cat || m.category === cat;
    let matchStock = true;
    if (stockF === 'low') matchStock = m.quantity < 10;
    else if (stockF === 'expiring') matchStock = App.isExpiringSoon(m.expiry_date, 30);
    else if (stockF === 'expired') matchStock = App.isExpired(m.expiry_date);
    return matchSearch && matchCat && matchStock;
  });
  currentPage = 1;
  renderTable();
}

function renderTable() {
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageMeds = filteredMeds.slice(start, start + PAGE_SIZE);
  const tbody = document.getElementById('meds-table');
  document.getElementById('med-count').textContent = `${filteredMeds.length} of ${allMeds.length} medicines`;
  if (!pageMeds.length) {
    tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state"><i class="fas fa-search"></i><h3>No medicines found</h3></div></td></tr>`;
    document.getElementById('pagination').innerHTML = '';
    return;
  }
  tbody.innerHTML = pageMeds.map((m, i) => {
    const status = getStatus(m);
    const stockLevel = m.quantity > 30 ? 'high' : m.quantity > 10 ? 'medium' : 'low';
    const stockValue = m.quantity * m.unit_price;
    return `
      <tr class="clickable-row" onclick="viewMedicine('${m.medicine_id}')">
        <td style="color:#9e9e9e;font-size:12px;">${start + i + 1}</td>
        <td><strong>${m.medicine_name}</strong><div style="font-size:11px;color:#9e9e9e;">${m.manufacturer || ''}</div></td>
        <td><span class="category-pill">${m.category}</span></td>
        <td style="font-size:12px;color:#616161;">${m.batch_number || '—'}</td>
        <td>${formatExpiry(m.expiry_date)}</td>
        <td>
          <div class="stock-level">
            <span style="font-weight:600;min-width:30px;">${m.quantity}</span>
            <div class="stock-bar"><div class="stock-bar-fill ${stockLevel}" style="width:${Math.min(100, (m.quantity / 50) * 100)}%"></div></div>
          </div>
        </td>
        <td class="ugx">${App.formatCurrency(m.unit_price)}</td>
        <td class="ugx"><strong>${App.formatCurrency(stockValue)}</strong></td>
        <td>${status}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-icon" style="background:#e8f5e9;color:#2e7d32;" title="View" onclick="event.stopPropagation();viewMedicine('${m.medicine_id}')"><i class="fas fa-eye"></i></button>
            <button class="btn btn-icon btn-warning" title="Edit" onclick="event.stopPropagation();openEditModal('${m.medicine_id}')"><i class="fas fa-edit"></i></button>
            <button class="btn btn-icon btn-danger" title="Delete" onclick="event.stopPropagation();deleteMedicine('${m.medicine_id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>`;
  }).join('');
  renderPagination();
}

function formatExpiry(dateStr) {
  if (!dateStr) return '<span style="color:#9e9e9e">—</span>';
  const days = App.daysUntilExpiry(dateStr);
  if (days < 0) return `<span class="badge badge-danger"><i class="fas fa-times-circle"></i> Expired</span>`;
  if (days <= 30) return `<span class="badge badge-warning"><i class="fas fa-clock"></i> ${days}d left</span>`;
  return `<span style="font-size:13px;">${App.formatDate(dateStr)}</span>`;
}

function getStatus(m) {
  if (App.isExpired(m.expiry_date)) return '<span class="badge badge-danger">Expired</span>';
  if (App.isExpiringSoon(m.expiry_date, 30)) return '<span class="badge badge-warning">Expiring Soon</span>';
  if (m.quantity === 0) return '<span class="badge badge-danger">Out of Stock</span>';
  if (m.quantity < 10) return '<span class="badge badge-warning">Low Stock</span>';
  return '<span class="badge badge-success">In Stock</span>';
}

function renderPagination() {
  const total = filteredMeds.length, totalPages = Math.ceil(total / PAGE_SIZE);
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

function goPage(p) {
  const t = Math.ceil(filteredMeds.length / PAGE_SIZE);
  if (p < 1 || p > t) return;
  currentPage = p; renderTable();
}

function populateModalCategories(selected) {
  var cats = {};
  allMeds.forEach(function (m) { cats[m.category] = true; });
  var sel = document.getElementById('med-category');
  sel.innerHTML = '<option value="">Select category</option>';
  Object.keys(cats).sort().forEach(function (c) {
    sel.innerHTML += '<option' + (c === selected ? ' selected' : '') + '>' + c + '</option>';
  });
}

function openAddModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Add New Medicine';
  document.getElementById('med-form').reset();
  document.getElementById('med-id').value = '';
  populateModalCategories('');
  Modal.open('med-modal');
}

function openEditModal(id) {
  const med = DB.getMedicineById(id);
  if (!med) return;
  editingId = id;
  document.getElementById('modal-title').textContent = 'Edit Medicine';
  document.getElementById('med-id').value = id;
  document.getElementById('med-name').value = med.medicine_name;
  populateModalCategories(med.category);
  document.getElementById('med-manufacturer').value = med.manufacturer || '';
  document.getElementById('med-batch').value = med.batch_number || '';
  document.getElementById('med-expiry').value = med.expiry_date || '';
  document.getElementById('med-quantity').value = med.quantity;
  document.getElementById('med-price').value = med.unit_price;
  document.getElementById('med-desc').value = med.description || '';
  Modal.open('med-modal');
}

function saveMedicine() {
  const name = document.getElementById('med-name').value.trim();
  const category = document.getElementById('med-category').value;
  const expiry = document.getElementById('med-expiry').value;
  const qty = parseInt(document.getElementById('med-quantity').value);
  const price = parseFloat(document.getElementById('med-price').value);
  if (!name || !category || !expiry || isNaN(qty) || isNaN(price)) {
    Toast.show('error', 'Validation Error', 'Please fill in all required fields.'); return;
  }
  const data = { medicine_name: name, category, manufacturer: document.getElementById('med-manufacturer').value.trim(), batch_number: document.getElementById('med-batch').value.trim(), expiry_date: expiry, quantity: qty, unit_price: price, description: document.getElementById('med-desc').value.trim() };
  if (editingId) { DB.updateMedicine(editingId, data); Toast.show('success', 'Updated!', `${name} has been updated.`); }
  else { DB.addMedicine(data); Toast.show('success', 'Added!', `${name} added to inventory.`); }
  Modal.close('med-modal'); loadMeds();
}

function viewMedicine(id) {
  const med = DB.getMedicineById(id);
  if (!med) return;
  const days = App.daysUntilExpiry(med.expiry_date);
  document.getElementById('view-modal-body').innerHTML = `
    <div style="display:grid;gap:14px;">
      <div style="background:var(--bg);border-radius:10px;padding:16px;">
        <h2 style="font-size:18px;font-weight:700;color:var(--primary)">${med.medicine_name}</h2>
        <p style="font-size:13px;color:var(--text-light);margin-top:4px;">${med.description || 'No description.'}</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div><span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text-light);font-weight:600;">Category</span><br/><span class="category-pill" style="margin-top:4px;display:inline-block;">${med.category}</span></div>
        <div><span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text-light);font-weight:600;">Manufacturer</span><br/><strong>${med.manufacturer || '—'}</strong></div>
        <div><span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text-light);font-weight:600;">Batch Number</span><br/><strong>${med.batch_number || '—'}</strong></div>
        <div><span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text-light);font-weight:600;">Expiry Date</span><br/><strong>${App.formatDate(med.expiry_date)}</strong> ${days !== null ? `<small style="color:${days < 0 ? 'var(--danger)' : days < 30 ? 'var(--warning)' : 'var(--primary)'}">(${days < 0 ? 'Expired' : days + ' days left'})</small>` : ''}</div>
        <div><span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text-light);font-weight:600;">Current Stock</span><br/><strong style="font-size:20px;color:var(--primary)">${med.quantity}</strong> units</div>
        <div><span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text-light);font-weight:600;">Unit Price</span><br/><strong class="ugx">${App.formatCurrency(med.unit_price)}</strong></div>
        <div><span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text-light);font-weight:600;">Status</span><br/>${getStatus(med)}</div>
        <div><span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text-light);font-weight:600;">Added On</span><br/><small>${App.formatDate(med.created_at)}</small></div>
      </div>
    </div>`;
  Modal.open('view-modal');
}

async function deleteMedicine(id) {
  const med = DB.getMedicineById(id);
  if (!med) return;
  const ok = await Confirm.show({ title: 'Delete Medicine?', message: `Delete <strong>${med.medicine_name}</strong>? This cannot be undone.`, confirmText: 'Yes, Delete' });
  if (!ok) return;
  DB.deleteMedicine(id);
  Toast.show('success', 'Deleted', `${med.medicine_name} removed from inventory.`);
  loadMeds();
}
