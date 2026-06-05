// ========== ZEESHAN HOSPITAL - Core System (API Backend) ==========

const API = window.location.origin + '/api';
let dbCache = null;

// ---------- Database (cached from server) ----------

function getDB() { return dbCache; }

async function fetchDB() {
  const token = localStorage.getItem('zh_token');
  if (!token) return;
  try {
    const res = await fetch(API + '/db', { headers: { 'Authorization': 'Bearer ' + token } });
    if (res.ok) dbCache = await res.json();
  } catch (e) { console.error('DB fetch failed', e); }
}

async function saveDB(db) {
  dbCache = db;
  const token = localStorage.getItem('zh_token');
  if (!token) return;
  try {
    await fetch(API + '/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(db)
    });
  } catch (e) { console.error('DB save failed', e); }
}

function genId() {
  if (!dbCache) return 'ZH-' + Date.now();
  dbCache.nextId++;
  return 'ZH-' + dbCache.nextId;
}

async function resetDB() {
  const token = localStorage.getItem('zh_token');
  if (!token) return location.reload();
  try {
    await fetch(API + '/db/reset', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } });
    await fetchDB();
    location.reload();
  } catch (e) { location.reload(); }
}

// ---------- Navigation ----------
function toggleMenu() { document.getElementById('navLinks').classList.toggle('open'); }

// ---------- Auth ----------
let authRole = null;
let authUser = null;

function showAuth(role) {
  authRole = role;
  var m = document.getElementById('authModal');
  if (!m) return;
  m.classList.add('active');
  var titles = { patient: 'Patient Portal', doctor: 'Doctor Portal', pharmacy: 'Pharmacy Portal', lab: 'Lab Portal' };
  var t = document.getElementById('authTitle');
  if (t) t.textContent = titles[role] || 'Login';
  var ab = document.getElementById('authBody');
  if (ab) ab.style.display = 'block';
  var rb = document.getElementById('registerBody');
  if (rb) rb.style.display = 'none';
  var hint = document.getElementById('authHint');
  var toggleText = document.getElementById('authToggleText');
  if (role === 'patient') {
    if (hint) hint.innerHTML = 'New user? Register below. Demo: <strong>ahmed@test.com</strong> / <strong>123</strong>';
    if (toggleText) toggleText.style.display = 'block';
  } else {
    var creds = { doctor: 'doctor@zh.com / 123', pharmacy: 'pharmacy@zh.com / 123', lab: 'lab@zh.com / 123' };
    if (hint) hint.innerHTML = 'Demo access: <strong>' + (creds[role] || '') + '</strong>';
    if (rb) rb.style.display = 'none';
    if (ab) ab.style.display = 'block';
    if (toggleText) toggleText.style.display = 'none';
  }
}

function closeModal(id) { var el = document.getElementById(id); if (el) el.classList.remove('active'); }

function showRegister(e) { e.preventDefault(); var ab = document.getElementById('authBody'); if (ab) ab.style.display = 'none'; var rb = document.getElementById('registerBody'); if (rb) rb.style.display = 'block'; }

function showLogin(e) { e.preventDefault(); var ab = document.getElementById('authBody'); if (ab) ab.style.display = 'block'; var rb = document.getElementById('registerBody'); if (rb) rb.style.display = 'none'; }

async function handleLogin() {
  var email = document.getElementById('authEmail').value.trim();
  var pass = document.getElementById('authPass').value.trim();
  if (!email || !pass) return showToast('Please enter email and password', 'error');
  try {
    var res = await fetch(API + '/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pass, role: authRole })
    });
    var data = await res.json();
    if (!res.ok) return showToast(data.error || 'Login failed', 'error');
    authUser = data.user;
    loginSuccess(data.token, data.user);
  } catch (e) { showToast('Server not reachable. Is the backend running?', 'error'); }
}

async function handleRegister() {
  var name = document.getElementById('regName').value.trim();
  var email = document.getElementById('regEmail').value.trim();
  var pass = document.getElementById('regPass').value.trim();
  if (!name || !email || !pass) return showToast('Please fill all fields', 'error');
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return showToast('Invalid email', 'error');
  if (pass.length < 3) return showToast('Password too short', 'error');
  try {
    var res = await fetch(API + '/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, pass })
    });
    var data = await res.json();
    if (!res.ok) return showToast(data.error || 'Registration failed', 'error');
    authUser = data.user;
    loginSuccess(data.token, data.user);
  } catch (e) { showToast('Server not reachable', 'error'); }
}

function loginSuccess(token, user) {
  closeModal('authModal');
  var rolePaths = { patient: 'patient.html', doctor: 'doctor.html', pharmacy: 'pharmacy.html', lab: 'lab.html' };
  localStorage.setItem('zh_token', token);
  localStorage.setItem('zh_user', JSON.stringify(user));
  localStorage.setItem('zh_role', user.role);
  localStorage.setItem('zh_login_time', Date.now().toString());
  window.location.href = rolePaths[user.role] || 'patient.html';
}

async function adminLogin() {
  try {
    var res = await fetch(API + '/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@zh.com', pass: '123', role: 'admin' })
    });
    var data = await res.json();
    if (!res.ok) { showToast('Backend not running. Open index.html locally for demo.', 'error'); return; }
    localStorage.setItem('zh_token', data.token);
    localStorage.setItem('zh_user', JSON.stringify(data.user));
    localStorage.setItem('zh_role', 'admin');
    localStorage.setItem('zh_login_time', Date.now().toString());
    window.location.href = 'admin.html';
  } catch (e) { showToast('Backend not reachable', 'error'); }
}

function logout() {
  localStorage.removeItem('zh_token');
  localStorage.removeItem('zh_user');
  localStorage.removeItem('zh_role');
  localStorage.removeItem('zh_login_time');
  window.location.href = 'index.html';
}

function getCurrentUser() {
  var raw = localStorage.getItem('zh_user');
  return raw ? JSON.parse(raw) : null;
}

function getCurrentRole() { return localStorage.getItem('zh_role') || null; }

function checkSession() {
  var user = getCurrentUser();
  var role = getCurrentRole();
  if (!user || !role) { window.location.href = 'index.html'; return false; }
  var loginTime = localStorage.getItem('zh_login_time');
  if (loginTime) {
    var elapsed = Date.now() - parseInt(loginTime);
    if (elapsed > 24 * 60 * 60 * 1000) { logout(); return false; }
  }
  localStorage.setItem('zh_login_time', Date.now().toString());
  return true;
}

// ---------- Toast ----------
function showToast(msg, type) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show ' + (type || '');
  clearTimeout(t._timer);
  t._timer = setTimeout(function() { t.classList.remove('show'); }, 4000);
}

// ---------- Confirm Dialog ----------
function showConfirm(title, message, onConfirm) {
  var id = 'confirmModal_' + Date.now();
  var html = '<div class="modal active" id="' + id + '"><div class="modal-content" style="max-width:400px;"><div class="modal-header"><h3>' + title + '</h3></div><p style="margin:16px 0;color:var(--text-light);">' + message + '</p><div style="display:flex;gap:8px;justify-content:flex-end;"><button class="btn btn-outline" onclick="closeModal(\'' + id + '\')">Cancel</button><button class="btn btn-primary" style="background:#dc2626;" onclick="closeModal(\'' + id + '\');(' + onConfirm.toString() + ')()">Confirm</button></div></div></div>';
  showModalFromHTML(html);
}

// ---------- Modal Helpers ----------
function openModal(id) { var el = document.getElementById(id); if (el) el.classList.add('active'); }

function showModalFromHTML(html) {
  var temp = document.createElement('div');
  temp.innerHTML = html;
  while (temp.children.length > 0) document.body.appendChild(temp.firstElementChild);
}

// ---------- Utilities ----------
function formatDate(d) { if (!d) return ''; return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }

function formatTime(d) { if (!d) return ''; return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }

function formatDateTime(d) { return formatDate(d) + ' ' + formatTime(d); }

function formatCurrency(amount) { return 'Rs. ' + Number(amount).toLocaleString('en-PK'); }

function formatRelativeDate(dateStr) {
  if (!dateStr) return '';
  var now = new Date();
  var date = new Date(dateStr);
  var diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 0) return diffDays + ' days ago';
  if (diffDays === -1) return 'Tomorrow';
  return 'In ' + Math.abs(diffDays) + ' days';
}

function statusBadge(status) {
  var colors = { pending: 'badge-amber', confirmed: 'badge-green', completed: 'badge-blue', cancelled: 'badge-red', collected: 'badge-blue', 'in-progress': 'badge-blue', normal: 'badge-green', abnormal: 'badge-amber', critical: 'badge-red' };
  return '<span class="badge ' + (colors[status] || 'badge-amber') + '">' + status + '</span>';
}

function loadScript(src) {
  return new Promise(function(resolve, reject) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function getInitials(name) { return name ? name.charAt(0).toUpperCase() : '?'; }

// ---------- Notification System ----------
function addNotification(userId, title, message, type) {
  if (!dbCache) return;
  dbCache.notifications.push({
    id: 'NOT-' + dbCache.nextId++, userId: userId, title: title,
    message: message, type: type || 'info', read: false,
    createdAt: new Date().toISOString()
  });
  saveDB(dbCache);
}

function getNotifications(userId) {
  if (!dbCache || !dbCache.notifications) return [];
  return dbCache.notifications.filter(function(n) { return n.userId === userId; }).sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
}

function getUnreadNotificationCount(userId) {
  return getNotifications(userId).filter(function(n) { return !n.read; }).length;
}

function markNotificationRead(notifId) {
  if (!dbCache || !dbCache.notifications) return;
  var n = dbCache.notifications.find(function(x) { return x.id === notifId; });
  if (n) n.read = true;
  saveDB(dbCache);
}

function markAllNotificationsRead(userId) {
  if (!dbCache || !dbCache.notifications) return;
  dbCache.notifications.filter(function(n) { return n.userId === userId; }).forEach(function(n) { n.read = true; });
  saveDB(dbCache);
}

// ---------- DB Init ----------
window.dbPromise = (async function() {
  await fetchDB();
})();

// ---------- Close modal on outside click ----------
document.addEventListener('click', function(e) {
  document.querySelectorAll('.modal.active').forEach(function(m) {
    if (e.target === m) closeModal(m.id);
  });
});
