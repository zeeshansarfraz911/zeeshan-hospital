/* ============================================
   ZEESHAN HOSPITAL — Production Core System
   Professional Healthcare Ecosystem
   ============================================ */

let dbCache = null;

// ===================== SECURITY =====================

function sanitize(str) {
  if (typeof str !== 'string') return str;
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;' };
  return String(str).replace(/[&<>"'\/]/g, s => map[s]);
}

function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';
  const el = document.createElement('div');
  el.textContent = str;
  return el.innerHTML;
}

// ===================== LOADING STATE =====================

let loadingCount = 0;
function showLoading() {
  loadingCount++;
  let el = document.getElementById('globalLoader');
  if (!el) {
    el = document.createElement('div');
    el.id = 'globalLoader';
    el.innerHTML = '<div class="spinner-overlay"><div class="spinner-ring"></div></div>';
    document.body.appendChild(el);
  }
  el.style.display = 'flex';
}
function hideLoading() {
  loadingCount = Math.max(0, loadingCount - 1);
  const el = document.getElementById('globalLoader');
  if (el && loadingCount === 0) el.style.display = 'none';
}

// ===================== DATABASE (Firestore) =====================

function getDB() { return dbCache; }

async function fetchDB() {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const snap = await db.collection('meta').doc('config').get();
    if (snap.exists) {
      dbCache = snap.data();
    } else {
      // Initialize empty database for new organizations
      dbCache = {
        patients: [], doctors: [], appointments: [],
        prescriptions: [], labTests: [], medicines: [],
        pharmacists: [], labs: [], notifications: [],
        messages: [], testTypes: [], testCategories: [],
        nextId: 1, _version: 3
      };
      await saveDB(dbCache);
    }
  } catch (e) { console.warn('DB fetch issue:', e.message); }
}

async function saveDB(db) {
  dbCache = db;
  const user = auth.currentUser;
  if (!user) return;
  try {
    await db.collection('meta').doc('config').set(db);
  } catch (e) { console.warn('DB save issue:', e.message); }
}

function genId() {
  if (!dbCache) return 'ZH-' + Date.now();
  dbCache.nextId = (dbCache.nextId || 0) + 1;
  return 'ZH-' + (dbCache.nextId + 1000);
}

// ===================== NAVIGATION =====================

function toggleMenu() { document.getElementById('navLinks').classList.toggle('open'); }

// ===================== AUTHENTICATION =====================

let authRole = null;
let authUser = null;

function showAuth(role) {
  authRole = role;
  var m = document.getElementById('authModal');
  if (!m) return;
  m.classList.add('active');

  var titles = { patient: 'Patient Portal', doctor: 'Doctor Portal', pharmacy: 'Pharmacy Portal', lab: 'Lab Portal' };
  var t = document.getElementById('authTitle');
  if (t) t.textContent = titles[role] || 'Sign In';

  // Show login form by default
  var ab = document.getElementById('authBody');
  if (ab) ab.style.display = 'block';
  var rb = document.getElementById('registerBody');
  if (rb) rb.style.display = 'none';

  // Clear hint for non-patient roles (only patients can self-register)
  var hint = document.getElementById('authHint');
  var toggleText = document.getElementById('authToggleText');
  if (role === 'patient') {
    if (hint) hint.style.display = 'none';
    if (toggleText) toggleText.style.display = 'block';
  } else {
    if (hint) hint.style.display = 'none';
    if (rb) rb.style.display = 'none';
    if (ab) ab.style.display = 'block';
    if (toggleText) toggleText.style.display = 'none';
  }
}

function closeModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

function showRegister(e) {
  if (e) e.preventDefault();
  var ab = document.getElementById('authBody');
  if (ab) ab.style.display = 'none';
  var rb = document.getElementById('registerBody');
  if (rb) rb.style.display = 'block';
}

function showLogin(e) {
  if (e) e.preventDefault();
  var ab = document.getElementById('authBody');
  if (ab) ab.style.display = 'block';
  var rb = document.getElementById('registerBody');
  if (rb) rb.style.display = 'none';
}

async function handleLogin() {
  showLoading();
  var email = document.getElementById('authEmail').value.trim();
  var pass = document.getElementById('authPass').value.trim();
  if (!email || !pass) { hideLoading(); return showToast('Please enter your email and password.', 'error'); }
  try {
    var cred = await auth.signInWithEmailAndPassword(email, pass);
    var user = cred.user;

    // Require email verification for production
    if (!user.emailVerified) {
      await user.sendEmailVerification();
      hideLoading();
      showToast('Please verify your email first. A new verification link was sent.', 'error');
      return;
    }

    await fetchDB();
    var d = getDB();
    var found = null;
    var collections = ['patients', 'doctors', 'pharmacists', 'labs'];
    var roles = ['patient', 'doctor', 'pharmacy', 'lab'];
    for (var i = 0; i < collections.length; i++) {
      found = (d[collections[i]] || []).find(function(x) { return x.email === email; });
      if (found) { authUser = found; authUser.role = roles[i]; break; }
    }
    if (!found) {
      // New user without a Firestore profile — treat as patient
      authUser = { id: user.uid, name: user.displayName || user.email, email: user.email, role: 'patient' };
    }
    var token = await user.getIdToken();
    loginSuccess(token, authUser);
  } catch (e) {
    hideLoading();
    var msg = e.code === 'auth/user-not-found' ? 'No account found with this email. Please register.' :
              e.code === 'auth/wrong-password' ? 'Incorrect password. Please try again.' :
              e.code === 'auth/invalid-email' ? 'Invalid email format.' :
              e.code === 'auth/too-many-requests' ? 'Too many attempts. Please try again later.' :
              e.message || 'Login failed. Please try again.';
    showToast(msg, 'error');
  }
}

async function handleRegister() {
  showLoading();
  var name = sanitize(document.getElementById('regName').value.trim());
  var email = document.getElementById('regEmail').value.trim();
  var pass = document.getElementById('regPass').value.trim();

  if (!name || !email || !pass) { hideLoading(); return showToast('Please fill in all fields.', 'error'); }
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) { hideLoading(); return showToast('Please enter a valid email address.', 'error'); }
  if (pass.length < 8) { hideLoading(); return showToast('Password must be at least 8 characters.', 'error'); }
  if (!/[A-Z]/.test(pass)) { hideLoading(); return showToast('Password must contain an uppercase letter.', 'error'); }
  if (!/[0-9]/.test(pass)) { hideLoading(); return showToast('Password must contain a number.', 'error'); }

  try {
    var cred = await auth.createUserWithEmailAndPassword(email, pass);

    // Send verification email
    await cred.user.sendEmailVerification();

    // Create profile in Firestore
    var d = getDB();
    if (!d) d = { patients: [], doctors: [], appointments: [], prescriptions: [], labTests: [], medicines: [], pharmacists: [], labs: [], notifications: [], messages: [], testTypes: [], testCategories: [], nextId: 1, _version: 3 };

    var newUser = {
      id: genId(),
      name: name,
      email: email,
      phone: '',
      bloodGroup: '',
      gender: '',
      dob: '',
      address: '',
      emailVerified: false,
      createdAt: new Date().toISOString()
    };
    d.patients.push(newUser);
    await saveDB(d);

    authUser = newUser;
    authUser.role = 'patient';
    var token = await cred.user.getIdToken();

    closeModal('authModal');
    hideLoading();
    showToast('Account created! Please check your email to verify your account before logging in.', 'success');
    auth.signOut();

  } catch (e) {
    hideLoading();
    var msg = e.code === 'auth/email-already-in-use' ? 'This email is already registered. Please sign in.' :
              e.code === 'auth/weak-password' ? 'Password is too weak. Use at least 8 characters with uppercase and numbers.' :
              e.message || 'Registration failed. Please try again.';
    showToast(msg, 'error');
  }
}

function loginSuccess(token, user) {
  closeModal('authModal');
  hideLoading();
  var rolePaths = { patient: 'patient.html', doctor: 'doctor.html', pharmacy: 'pharmacy.html', lab: 'lab.html', admin: 'admin.html' };
  localStorage.setItem('zh_token', token);
  localStorage.setItem('zh_user', JSON.stringify(user));
  localStorage.setItem('zh_role', user.role);
  localStorage.setItem('zh_login_time', Date.now().toString());
  window.location.href = rolePaths[user.role] || 'patient.html';
}

function logout() {
  auth.signOut();
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
  var token = localStorage.getItem('zh_token');
  if (!user || !role || !token) { window.location.href = 'index.html'; return false; }
  var loginTime = localStorage.getItem('zh_login_time');
  if (loginTime) {
    var elapsed = Date.now() - parseInt(loginTime);
    if (elapsed > 24 * 60 * 60 * 1000) { logout(); return false; }
  }
  localStorage.setItem('zh_login_time', Date.now().toString());
  return true;
}

// ===================== ADMIN LOGIN (Protected) =====================

async function adminLogin() {
  // Prompt for admin credentials instead of hardcoding
  var email = prompt('Admin Email:', 'admin@zh.com');
  if (!email) return;
  var pass = prompt('Admin Password:');
  if (!pass) return;
  showLoading();
  try {
    await auth.signInWithEmailAndPassword(email, pass);
    await fetchDB();
    authUser = { id: 'ADMIN', name: 'System Admin', email: email, role: 'admin' };
    localStorage.setItem('zh_token', await auth.currentUser.getIdToken());
    localStorage.setItem('zh_user', JSON.stringify(authUser));
    localStorage.setItem('zh_role', 'admin');
    localStorage.setItem('zh_login_time', Date.now().toString());
    window.location.href = 'admin.html';
  } catch (e) {
    hideLoading();
    showToast('Admin access requires a valid admin account in Firebase Auth. Error: ' + (e.message || 'Invalid credentials'), 'error');
  }
}

// ===================== TOAST NOTIFICATIONS =====================

function showToast(msg, type) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = sanitizeHTML(msg);
  t.className = 'toast show ' + (type || '');
  clearTimeout(t._timer);
  t._timer = setTimeout(function() { t.classList.remove('show'); }, 4000);
}

// ===================== CONFIRM DIALOG =====================

function showConfirm(title, message, onConfirm) {
  var id = 'confirmModal_' + Date.now();
  var safeTitle = sanitizeHTML(title);
  var safeMsg = sanitizeHTML(message);
  var html = '<div class="modal active" id="' + id + '"><div class="modal-content" style="max-width:400px;"><div class="modal-header"><h3>' + safeTitle + '</h3></div><p style="margin:16px 0;color:var(--text-light);">' + safeMsg + '</p><div style="display:flex;gap:8px;justify-content:flex-end;"><button class="btn btn-outline" onclick="closeModal(\'' + id + '\')">Cancel</button><button class="btn btn-primary" style="background:#dc2626;" onclick="closeModal(\'' + id + '\');(' + onConfirm.toString() + ')()">Confirm</button></div></div></div>';
  showModalFromHTML(html);
}

// ===================== MODAL HELPERS =====================

function openModal(id) { var el = document.getElementById(id); if (el) el.classList.add('active'); }

function showModalFromHTML(html) {
  var temp = document.createElement('div');
  temp.innerHTML = html;
  while (temp.children.length > 0) document.body.appendChild(temp.firstElementChild);
}

// ===================== UTILITIES =====================

function formatDate(d) { if (!d) return ''; return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
function formatTime(d) { if (!d) return ''; return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
function formatDateTime(d) { return formatDate(d) + ' ' + formatTime(d); }
function formatCurrency(amount) { return 'Rs. ' + Number(amount).toLocaleString('en-PK'); }

// ===================== DEFAULT SCHEDULE =====================

function genDefaultSchedule() {
  var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var schedule = {};
  days.forEach(function(day) {
    schedule[day] = { start: '09:00', end: '17:00', active: day !== 'Saturday' };
  });
  schedule.Saturday = { start: '09:00', end: '13:00', active: true };
  return schedule;
}

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
  var colors = {
    pending: 'badge-amber', confirmed: 'badge-green', completed: 'badge-blue',
    cancelled: 'badge-red', collected: 'badge-blue', 'in-progress': 'badge-blue',
    normal: 'badge-green', abnormal: 'badge-amber', critical: 'badge-red'
  };
  return '<span class="badge ' + (colors[status] || 'badge-amber') + '">' + sanitizeHTML(status) + '</span>';
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

// ===================== NOTIFICATION SYSTEM =====================

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
  return dbCache.notifications.filter(function(n) { return n.userId === userId; })
    .sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
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

// ===================== DATABASE INIT =====================
window.dbPromise = new Promise(function(resolve) {
  auth.onAuthStateChanged(async function(user) {
    if (user) {
      try {
        var snap = await db.collection('meta').doc('config').get();
        dbCache = snap.exists ? snap.data() : null;
        if (!dbCache) {
          dbCache = {
            patients: [], doctors: [], appointments: [],
            prescriptions: [], labTests: [], medicines: [],
            pharmacists: [], labs: [], notifications: [],
            messages: [], testTypes: [], testCategories: [],
            nextId: 1, _version: 3
          };
        }
      } catch (e) { console.warn('DB fetch error:', e.message); }
    }
    resolve();
  });
});

// ===================== GOOGLE SIGN-IN (shared) =====================

function handleGoogleSignIn() {
  // Find the visible Google button (login or register view)
  var registerBody = document.getElementById('registerBody');
  var isRegister = registerBody && registerBody.style.display !== 'none';
  var btn = isRegister ? document.querySelector('#registerBody .google-btn') : document.getElementById('googleModalBtn');
  
  if (!btn) { window.location.href = 'login.html'; return; }
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-sm"></span> ' + (isRegister ? 'Creating account...' : 'Signing in...');

  var provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  auth.signInWithPopup(provider)
    .then(function(result) {
      var user = result.user;
      return db.collection('meta').doc('config').get().then(function(snap) {
        var d = snap.exists ? snap.data() : null;
        if (!d) {
          d = { patients: [], doctors: [], appointments: [], prescriptions: [],
                labTests: [], medicines: [], pharmacists: [], labs: [],
                notifications: [], messages: [], testTypes: [], testCategories: [],
                nextId: 1, _version: 3 };
        }
        var existing = (d.patients || []).find(function(p) { return p.email === user.email; });
        if (!existing) {
          var newUser = {
            id: 'ZH-' + ((d.nextId || 0) + 1000),
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            phone: user.phoneNumber || '',
            photoURL: user.photoURL || '',
            bloodGroup: '', gender: '', dob: '', address: '',
            emailVerified: user.emailVerified,
            createdAt: new Date().toISOString()
          };
          d.nextId = (d.nextId || 0) + 1;
          d.patients.push(newUser);
          db.collection('meta').doc('config').set(d);
          existing = newUser;
        }
        var authUser = existing;
        authUser.role = 'patient';
        return user.getIdToken().then(function(token) {
          localStorage.setItem('zh_token', token);
          localStorage.setItem('zh_user', JSON.stringify(authUser));
          localStorage.setItem('zh_role', 'patient');
          localStorage.setItem('zh_login_time', Date.now().toString());
          window.location.href = 'patient.html';
        });
      });
    })
    .catch(function(error) {
      if (btn) { btn.disabled = false; btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> ' + (isRegister ? 'Sign up with Google' : 'Sign in with Google'); }
      if (error.code !== 'auth/popup-closed-by-user') {
        showToast(error.message || 'Google sign-in failed', 'error');
      }
    });
};

// ===================== FORGOT PASSWORD (shared) =====================

function handleForgotPassword(e) {
  if (e) e.preventDefault();
  var emailInput = document.getElementById('authEmail');
  var email = emailInput ? emailInput.value.trim() : '';
  if (!email) { showToast('Please enter your email address first', 'error'); return; }
  auth.sendPasswordResetEmail(email)
    .then(function() { showToast('Password reset email sent! Check your inbox.', 'success'); })
    .catch(function(error) {
      var msg = error.code === 'auth/user-not-found' ? 'No account found with this email.' :
                'Failed to send reset email. Please try again.';
      showToast(msg, 'error');
    });
};

// ===================== CLOSE MODALS ON OUTSIDE CLICK =====================
document.addEventListener('click', function(e) {
  document.querySelectorAll('.modal.active').forEach(function(m) {
    if (e.target === m) closeModal(m.id);
  });
});
