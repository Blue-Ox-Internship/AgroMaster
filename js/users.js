/* =============================================
   AgroDrop - User Management (Admin only)
   ============================================= */

(function () {
  const user = App.requireRole(['Administrator']);
  if (!user) return;

  renderSidebar('User Management', 'Manage system users and access roles');

  document.getElementById('page-body').innerHTML = `
    <div class="page-content">
      <div class="toolbar">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" id="search-input" placeholder="Search users..." />
        </div>
        <select class="filter-select" id="role-filter">
          <option value="">All Roles</option>
          <option>Administrator</option>
          <option>Store Manager</option>
          <option>Sales Attendant</option>
        </select>
        <button class="btn btn-primary" id="add-user-btn"><i class="fas fa-user-plus"></i> Add User</button>
      </div>
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-users"></i> System Users</h3>
          <span id="user-count" style="font-size:13px;color:#616161;font-weight:500;"></span>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr><th>#</th><th>User</th><th>Email</th><th>Phone</th><th>Role</th><th>Business</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody id="users-table"></tbody>
          </table>
        </div>
      </div>
    </div>`;

  initUsers();
})();

let allUsers = [], editingId = null;

function initUsers() {
  loadUsers();
  document.getElementById('add-user-btn').addEventListener('click', openAddModal);
  document.getElementById('save-user-btn').addEventListener('click', saveUser);
  document.getElementById('search-input').addEventListener('input', renderTable);
  document.getElementById('role-filter').addEventListener('change', renderTable);
}

function loadUsers() { allUsers = DB.getUsers(); renderTable(); }

function renderTable() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const role = document.getElementById('role-filter').value;
  const currentUser = App.getCurrentUser();
  const filtered = allUsers.filter(u => {
    const matchSearch = !search || u.full_name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search) || (u.phone || '').includes(search);
    const matchRole = !role || u.role === role;
    return matchSearch && matchRole;
  });
  document.getElementById('user-count').textContent = `${filtered.length} user${filtered.length !== 1 ? 's' : ''}`;
  const tbody = document.getElementById('users-table');
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><i class="fas fa-users"></i><h3>No users found</h3><p>Try adjusting your search or add a new user.</p></div></td></tr>`;
    return;
  }
  const roleClass = { 'Administrator': 'role-admin', 'Store Manager': 'role-manager', 'Sales Attendant': 'role-attendant' };
  tbody.innerHTML = filtered.map((u, i) => {
    const isMe = currentUser && u.user_id === currentUser.user_id;
    return `<tr ${isMe ? 'style="background:#f1f8e9;"' : ''}>
      <td style="color:#9e9e9e;font-size:12px;">${i + 1}</td>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:38px;height:38px;background:linear-gradient(135deg,var(--primary),var(--secondary));border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:700;color:white;font-size:15px;flex-shrink:0;">${u.full_name.charAt(0).toUpperCase()}</div>
          <div><strong>${u.full_name}</strong>${isMe ? '<span class="badge badge-success" style="margin-left:6px;font-size:9px;">You</span>' : ''}</div>
        </div>
      </td>
      <td>${u.email}</td>
      <td style="font-size:13px;">${u.phone || '—'}</td>
      <td><span class="role-badge ${roleClass[u.role] || ''}">${u.role}</span></td>
      <td style="font-size:13px;color:var(--text-light);">${u.business_name || '—'}</td>
      <td style="font-size:12px;color:var(--text-light);">${App.formatDate(u.created_at)}</td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-icon btn-warning" title="Edit" onclick="openEditModal('${u.user_id}')"><i class="fas fa-edit"></i></button>
          ${!isMe ? `<button class="btn btn-icon btn-danger" title="Delete" onclick="deleteUser('${u.user_id}')"><i class="fas fa-trash"></i></button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');
}

function openAddModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Add New User';
  document.getElementById('user-form').reset();
  document.getElementById('user-id').value = '';
  document.getElementById('pwd-hint').style.display = 'none';
  document.getElementById('pwd-req').style.display = 'inline';
  Modal.open('user-modal');
}

function openEditModal(id) {
  const u = DB.getUserById(id);
  if (!u) return;
  editingId = id;
  document.getElementById('modal-title').textContent = 'Edit User';
  document.getElementById('user-id').value = id;
  document.getElementById('u-name').value = u.full_name;
  document.getElementById('u-business').value = u.business_name || '';
  document.getElementById('u-email').value = u.email;
  document.getElementById('u-phone').value = u.phone || '';
  document.getElementById('u-role').value = u.role;
  document.getElementById('u-password').value = '';
  document.getElementById('pwd-hint').style.display = 'block';
  document.getElementById('pwd-req').style.display = 'none';
  Modal.open('user-modal');
}

function saveUser() {
  const name = document.getElementById('u-name').value.trim();
  const email = document.getElementById('u-email').value.trim();
  const role = document.getElementById('u-role').value;
  const password = document.getElementById('u-password').value;
  if (!name || !email || !role) { Toast.show('error', 'Validation Error', 'Full name, email, and role are required.'); return; }
  if (!editingId && !password) { Toast.show('error', 'Validation Error', 'Password is required for new users.'); return; }
  const existing = DB.getUserByEmail(email);
  if (existing && existing.user_id !== editingId) { Toast.show('error', 'Duplicate Email', 'A user with this email already exists.'); return; }
  const data = { full_name: name, business_name: document.getElementById('u-business').value.trim(), email, phone: document.getElementById('u-phone').value.trim(), role };
  if (password) data.password = password;
  if (editingId) {
    DB.updateUser(editingId, data);
    const cu = App.getCurrentUser();
    if (cu && cu.user_id === editingId) App.setCurrentUser({ ...cu, ...data });
    Toast.show('success', 'Updated!', `${name}'s account updated.`);
  } else {
    DB.addUser(data);
    Toast.show('success', 'User Created!', `${name} added to the system.`);
  }
  Modal.close('user-modal'); loadUsers();
}

async function deleteUser(id) {
  const u = DB.getUserById(id);
  if (!u) return;
  const ok = await Confirm.show({ title: 'Delete User?', message: `Delete <strong>${u.full_name}</strong>'s account? This cannot be undone.`, confirmText: 'Yes, Delete' });
  if (!ok) return;
  DB.deleteUser(id);
  Toast.show('success', 'Deleted', `${u.full_name}'s account removed.`);
  loadUsers();
}
