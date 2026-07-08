/* =============================================
   AgroDrop - Supplier Management
   ============================================= */

(function () {
  const user = App.requireAuth();
  if (!user) return;

  renderSidebar('Suppliers', 'Manage your medicine suppliers');

  document.getElementById('page-body').innerHTML = `
    <div class="page-content">
      <div class="toolbar">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="search" id="search-input" placeholder="Search suppliers..." enterkeyhint="search" />
        </div>
        <button class="btn btn-primary" id="add-sup-btn"><i class="fas fa-plus"></i> Add Supplier</button>
      </div>
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-truck"></i> Suppliers</h3>
          <span id="sup-count" style="font-size:13px;color:#616161;font-weight:500;"></span>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Supplier Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Date Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="sup-table"></tbody>
          </table>
        </div>
      </div>
    </div>`;

  initSuppliers();
})();

let allSups = [], editingId = null;

function initSuppliers() {
  loadSuppliers();
  document.getElementById('add-sup-btn').addEventListener('click', openAddModal);
  document.getElementById('save-sup-btn').addEventListener('click', saveSupplier);
  document.getElementById('search-input').addEventListener('input', App.debounce(renderTable, 150));
}

function loadSuppliers() { allSups = DB.getSuppliers(); renderTable(); }

function renderTable() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const filtered = allSups.filter(s =>
    s.supplier_name.toLowerCase().includes(search) ||
    (s.phone || '').toLowerCase().includes(search) ||
    (s.email || '').toLowerCase().includes(search) ||
    (s.address || '').toLowerCase().includes(search)
  );
  document.getElementById('sup-count').textContent = `${filtered.length} supplier${filtered.length !== 1 ? 's' : ''}`;
  const tbody = document.getElementById('sup-table');
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i class="fas fa-truck"></i><h3>No suppliers found</h3></div></td></tr>`;
    return;
  }
  const purchases = DB.getPurchases();
  tbody.innerHTML = filtered.map((s, i) => {
    const purchaseCount = purchases.filter(p => p.supplier_id === s.supplier_id).length;
    // Format added date cleanly
    const addedDate = s.created_at
      ? new Date(s.created_at).toLocaleDateString('en-UG', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';
    return `
      <tr>
        <td style="color:#9e9e9e;font-size:12px;">${i + 1}</td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;background:var(--success-light);border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--primary);flex-shrink:0;">${s.supplier_name.charAt(0).toUpperCase()}</div>
            <div>
              <strong>${s.supplier_name}</strong>
              <div style="font-size:11px;color:var(--text-light);">${purchaseCount} purchase${purchaseCount !== 1 ? 's' : ''}</div>
            </div>
          </div>
        </td>
        <td>${s.phone || '—'}</td>
        <td>${s.email ? `<a href="mailto:${s.email}" style="color:var(--info)">${s.email}</a>` : '—'}</td>
        <td style="font-size:13px;color:var(--text-light);">${s.address || '—'}</td>
        <td>
          <div style="display:flex;align-items:center;gap:4px;">
            <i class="fas fa-calendar-alt" style="color:var(--text-light);font-size:11px;"></i>
            <span style="font-size:12px;color:var(--text-light);">${addedDate}</span>
          </div>
        </td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-icon" title="View Details" onclick="viewSupplier('${s.supplier_id}')"
              style="background:#e3f2fd;color:#1565c0;border:none;border-radius:8px;width:32px;height:32px;cursor:pointer;">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-icon btn-warning" title="Edit Supplier" onclick="openEditModal('${s.supplier_id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-icon btn-danger" title="Delete Supplier" onclick="deleteSupplier('${s.supplier_id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function openAddModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Add New Supplier';
  document.getElementById('sup-form').reset();
  document.getElementById('sup-id').value = '';
  Modal.open('sup-modal');
}

function openEditModal(id) {
  const sup = DB.getSupplierById(id);
  if (!sup) return;
  editingId = id;
  document.getElementById('modal-title').textContent = 'Edit Supplier';
  document.getElementById('sup-id').value = id;
  document.getElementById('sup-name').value = sup.supplier_name;
  document.getElementById('sup-phone').value = sup.phone || '';
  document.getElementById('sup-email').value = sup.email || '';
  document.getElementById('sup-address').value = sup.address || '';
  Modal.open('sup-modal');
}

function saveSupplier() {
  const name = document.getElementById('sup-name').value.trim();
  const phone = document.getElementById('sup-phone').value.trim();
  if (!name || !phone) {
    Toast.show('error', 'Validation Error', 'Supplier name and phone are required.');
    return;
  }
  const data = {
    supplier_name: name,
    phone,
    email: document.getElementById('sup-email').value.trim(),
    address: document.getElementById('sup-address').value.trim()
  };
  if (editingId) {
    DB.updateSupplier(editingId, data);
    Toast.show('success', 'Updated!', `${name} has been updated.`);
  } else {
    DB.addSupplier(data);
    Toast.show('success', 'Added!', `${name} added to suppliers.`);
  }
  Modal.close('sup-modal');
  loadSuppliers();
}

function viewSupplier(id) {
  const sup = DB.getSupplierById(id);
  if (!sup) return;
  const purchases = DB.getPurchases().filter(p => p.supplier_id === id);
  const totalSpent = purchases.reduce((sum, p) => sum + (parseInt(p.quantity) * parseFloat(p.buying_price || 0)), 0);
  const addedDate = sup.created_at
    ? new Date(sup.created_at).toLocaleDateString('en-UG', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  document.getElementById('view-sup-body').innerHTML = `
    <div style="text-align:center;margin-bottom:20px;">
      <div style="width:64px;height:64px;background:var(--success-light);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:var(--primary);margin:0 auto 12px;">
        ${sup.supplier_name.charAt(0).toUpperCase()}
      </div>
      <h2 style="margin:0;font-size:20px;">${sup.supplier_name}</h2>
      <span style="font-size:12px;color:var(--text-light);">Supplier ID: ${sup.supplier_id}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">
      <div style="background:var(--bg);border-radius:10px;padding:12px;">
        <div style="font-size:11px;color:var(--text-light);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;"><i class="fas fa-phone" style="margin-right:5px;"></i>Phone</div>
        <div style="font-weight:600;">${sup.phone || '—'}</div>
      </div>
      <div style="background:var(--bg);border-radius:10px;padding:12px;">
        <div style="font-size:11px;color:var(--text-light);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;"><i class="fas fa-envelope" style="margin-right:5px;"></i>Email</div>
        <div style="font-weight:600;word-break:break-all;">${sup.email ? `<a href="mailto:${sup.email}" style="color:var(--info)">${sup.email}</a>` : '—'}</div>
      </div>
      <div style="background:var(--bg);border-radius:10px;padding:12px;">
        <div style="font-size:11px;color:var(--text-light);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;"><i class="fas fa-map-marker-alt" style="margin-right:5px;"></i>Address</div>
        <div style="font-weight:600;">${sup.address || '—'}</div>
      </div>
      <div style="background:var(--bg);border-radius:10px;padding:12px;">
        <div style="font-size:11px;color:var(--text-light);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;"><i class="fas fa-calendar" style="margin-right:5px;"></i>Date Added</div>
        <div style="font-weight:600;">${addedDate}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div style="background:linear-gradient(135deg,#e8f5e9,#c8e6c9);border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:var(--primary);">${purchases.length}</div>
        <div style="font-size:12px;color:#388e3c;">Total Purchases</div>
      </div>
      <div style="background:linear-gradient(135deg,#e3f2fd,#bbdefb);border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:20px;font-weight:800;color:#1565c0;">UGX ${totalSpent.toLocaleString()}</div>
        <div style="font-size:12px;color:#1565c0;">Total Spent</div>
      </div>
    </div>`;
  Modal.open('view-sup-modal');
}

async function deleteSupplier(id) {
  const sup = DB.getSupplierById(id);
  if (!sup) return;
  const ok = await Confirm.show({
    title: 'Delete Supplier?',
    message: `Delete <strong>${sup.supplier_name}</strong>? This cannot be undone.`,
    confirmText: 'Yes, Delete'
  });
  if (!ok) return;
  DB.deleteSupplier(id);
  Toast.show('success', 'Deleted', `${sup.supplier_name} removed.`);
  loadSuppliers();
}
