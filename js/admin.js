// ========== ZEESHAN HOSPITAL - Admin Portal (Full Control) ==========

let adminUser = null;

function initAdmin() {
  const storedRole = localStorage.getItem('zh_role');
  if (storedRole !== 'admin') { window.location.href = 'index.html'; return; }
  adminUser = getCurrentUser();
  if (adminUser) {
    document.getElementById('sidebarName').textContent = adminUser.name || 'System Admin';
    document.getElementById('sidebarEmail').textContent = adminUser.email || 'admin@zh.com';
    document.getElementById('sidebarAvatar').textContent = getInitials(adminUser.name || 'Admin');
  }
  setupAdminNav();
  switchTab('dashboard');
}

function setupAdminNav() {
  document.querySelectorAll('#adminNav a[data-tab]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelectorAll('#adminNav a').forEach(function(a) { a.classList.remove('active'); });
      link.classList.add('active');
      switchTab(link.dataset.tab);
    });
  });
}

function switchTab(tab) {
  var titles = {
    dashboard: ['Admin Dashboard', 'System Overview & Quick Actions'],
    patients: ['Patient Management', 'View, edit, add, or remove patients'],
    doctors: ['Doctor Management', 'View, edit, add, or remove doctors'],
    appointments: ['Appointment Management', 'View, confirm, complete, or cancel appointments'],
    pharmacy: ['Pharmacy Inventory', 'Full medicine inventory control'],
    lab: ['Lab Test Management', 'View, manage, and update lab tests'],
    messages: ['Contact Messages', 'View inquiries from the website'],
    system: ['System Settings', 'Database management, notifications, and config']
  };
  document.getElementById('pageTitle').textContent = titles[tab][0];
  document.getElementById('pageSubtitle').textContent = titles[tab][1];
  var renderers = {
    dashboard: renderDashboard,
    patients: renderAdminPatients,
    doctors: renderAdminDoctors,
    appointments: renderAdminAppointments,
    pharmacy: renderAdminPharmacy,
    lab: renderAdminLab,
    messages: renderAdminMessages,
    system: renderSystem
  };
  var content = document.getElementById('pageContent');
  content.innerHTML = '<div class="animate-fade-in">' + (renderers[tab] ? renderers[tab]() : '') + '</div>';
}

// ==================== DASHBOARD ====================

function renderDashboard() {
  var db = getDB();
  var patients = db.patients || [];
  var doctors = db.doctors || [];
  var appointments = db.appointments || [];
  var prescriptions = db.prescriptions || [];
  var labTests = db.labTests || [];
  var medicines = db.medicines || [];
  var messages = db.messages || [];

  var pendingApps = appointments.filter(function(a) { return a.status === 'pending'; }).length;
  var pendingLab = labTests.filter(function(l) { return l.status === 'pending'; }).length;
  var lowStock = medicines.filter(function(m) { return m.stock <= m.minStock; }).length;
  var unreadMsgs = messages.filter(function(m) { return !m.read; }).length;

  var stats = [
    { label: 'Total Patients', value: patients.length, icon: '&#128100;', bg: '#dbeafe', color: '#2563eb' },
    { label: 'Total Doctors', value: doctors.length, icon: '&#128137;', bg: '#d1fae5', color: '#059669' },
    { label: 'Appointments', value: appointments.length, icon: '&#128197;', bg: '#fef3c7', color: '#d97706' },
    { label: 'Prescriptions', value: prescriptions.length, icon: '&#9998;', bg: '#ede9fe', color: '#7c3aed' },
    { label: 'Lab Tests', value: labTests.length, icon: '&#128300;', bg: '#fce7f3', color: '#db2777' },
    { label: 'Medicines', value: medicines.length, icon: '&#127974;', bg: '#ccfbf1', color: '#0d9488' },
    { label: 'Pending Apps', value: pendingApps, icon: '&#9200;', bg: '#fef3c7', color: '#d97706' },
    { label: 'Pending Lab', value: pendingLab, icon: '&#9888;', bg: '#fee2e2', color: '#dc2626' }
  ];

  var html = '<div class="admin-stats">';
  stats.forEach(function(s) {
    html += '<div class="admin-stat-card"><div class="stat-icon" style="background:' + s.bg + ';color:' + s.color + ';">' + s.icon + '</div><div class="stat-label">' + s.label + '</div><div class="stat-value" style="color:' + s.color + ';">' + s.value + '</div></div>';
  });
  html += '</div>';

  // Quick Actions
  html += '<div class="admin-section"><h3>Quick Actions</h3><div style="display:flex;gap:10px;flex-wrap:wrap;">';
  var actions = [
    { label: '+ Add Patient', tab: 'patients', icon: '&#128100;' },
    { label: '+ Add Doctor', tab: 'doctors', icon: '&#128137;' },
    { label: '+ Add Medicine', tab: 'pharmacy', icon: '&#127974;' },
    { label: 'Broadcast Notification', tab: 'system', icon: '&#128276;' }
  ];
  actions.forEach(function(a) {
    html += '<button class="btn btn-outline btn-sm" onclick="switchTab(\'' + a.tab + '\')" style="gap:6px;">' + a.icon + ' ' + a.label + '</button>';
  });
  html += '</div></div>';

  // Alerts
  var alerts = [];
  if (pendingApps > 0) alerts.push({ icon: '&#128197;', bg: '#fef3c7', color: '#d97706', title: pendingApps + ' pending appointment' + (pendingApps > 1 ? 's' : ''), desc: 'Awaiting confirmation' });
  if (pendingLab > 0) alerts.push({ icon: '&#128300;', bg: '#fee2e2', color: '#dc2626', title: pendingLab + ' pending lab test' + (pendingLab > 1 ? 's' : ''), desc: 'Awaiting processing' });
  if (lowStock > 0) alerts.push({ icon: '&#9888;', bg: '#fef3c7', color: '#d97706', title: lowStock + ' low stock alert' + (lowStock > 1 ? 's' : ''), desc: 'Medicine needs restocking' });
  if (unreadMsgs > 0) alerts.push({ icon: '&#9993;', bg: '#dbeafe', color: '#2563eb', title: unreadMsgs + ' unread message' + (unreadMsgs > 1 ? 's' : ''), desc: 'From website contact form' });

  if (alerts.length > 0) {
    html += '<div class="admin-section" style="border-left:3px solid var(--primary);"><h3>&#9888; Alerts &amp; Notices</h3>';
    alerts.forEach(function(a) {
      html += '<div style="display:flex;align-items:center;gap:12px;padding:8px 0;"><div class="stat-icon" style="width:36px;height:36px;font-size:.85rem;background:' + a.bg + ';color:' + a.color + ';">' + a.icon + '</div><div><div style="font-weight:600;font-size:.9rem;">' + a.title + '</div><div style="font-size:.8rem;color:var(--text-light);">' + a.desc + '</div></div></div>';
    });
    html += '</div>';
  }

  // Recent Activity
  html += '<div class="admin-section"><h3>Recent System Activity</h3><div class="activity-list">';
  var activity = [];
  appointments.slice(-5).reverse().forEach(function(a) {
    activity.push({ icon: '&#128197;', bg: '#dbeafe', color: '#2563eb', title: a.patientName + ' - ' + a.status, desc: 'Dr. ' + (a.doctorName || 'N/A') + ' on ' + a.date, time: a.date });
  });
  prescriptions.slice(-5).reverse().forEach(function(p) {
    activity.push({ icon: '&#9998;', bg: '#d1fae5', color: '#059669', title: 'Rx issued for ' + p.patientName, desc: 'By ' + p.doctorName, time: p.date });
  });
  labTests.slice(-5).reverse().forEach(function(l) {
    activity.push({ icon: '&#128300;', bg: '#fef3c7', color: '#d97706', title: 'Lab: ' + (l.patientName || 'N/A'), desc: 'Status: ' + l.status, time: l.createdAt ? l.createdAt.split('T')[0] : '' });
  });
  activity.sort(function(a, b) { return (b.time || '').localeCompare(a.time || ''); });
  activity.slice(0, 10).forEach(function(a) {
    html += '<div class="activity-item"><div class="act-icon" style="background:' + a.bg + ';color:' + a.color + ';">' + a.icon + '</div><div class="act-content"><div class="act-title">' + a.title + '</div><div class="act-desc">' + a.desc + '</div></div><div class="act-time">' + formatDate(a.time) + '</div></div>';
  });
  html += '</div></div>';

  return html;
}

// ==================== PATIENTS (Full CRUD) ====================

function renderAdminPatients() {
  var db = getDB();
  var patients = db.patients || [];
  var appointments = db.appointments || [];

  var html = '<div class="admin-section"><div class="section-header"><h3>All Patients <span class="count-badge">' + patients.length + '</span></h3><button class="btn btn-primary btn-sm" onclick="showAddPatientModal()">+ Add Patient</button></div>';
  html += '<div class="admin-filter-bar"><input type="text" id="patientSearch" placeholder="Search by name or email..." oninput="filterAdminPatients()" style="flex:1;max-width:300px;"></div>';
  html += '<div class="table-container"><table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Blood</th><th>Appts</th><th>Registered</th><th>Actions</th></tr></thead><tbody id="patientTableBody">';

  if (patients.length === 0) {
    html += '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-light);">No patients registered yet.</td></tr>';
  } else {
    patients.forEach(function(p) {
      var appCount = appointments.filter(function(a) { return a.patientId === p.id; }).length;
      html += '<tr class="patient-row" data-name="' + (p.name || '').toLowerCase() + '" data-email="' + (p.email || '').toLowerCase() + '"><td><strong>' + p.name + '</strong></td><td>' + p.email + '</td><td>' + (p.phone || '-') + '</td><td>' + (p.bloodGroup || '-') + '</td><td>' + appCount + '</td><td>' + formatDate(p.createdAt) + '</td><td><div style="display:flex;gap:4px;"><button class="view-btn" onclick="showPatientDetail(\'' + p.id + '\')">View</button><button class="view-btn" onclick="showEditPatientModal(\'' + p.id + '\')">Edit</button><button class="view-btn" style="border-color:#dc2626;color:#dc2626;" onclick="deletePatient(\'' + p.id + '\')">Delete</button></div></td></tr>';
    });
  }

  html += '</tbody></table></div></div>';
  return html;
}

function filterAdminPatients() {
  var q = document.getElementById('patientSearch').value.toLowerCase();
  document.querySelectorAll('.patient-row').forEach(function(row) {
    row.style.display = (!q || row.dataset.name.indexOf(q) > -1 || row.dataset.email.indexOf(q) > -1) ? '' : 'none';
  });
}

function showPatientDetail(id) {
  var db = getDB();
  var p = db.patients.find(function(x) { return x.id === id; });
  if (!p) return showToast('Patient not found', 'error');
  var appCount = db.appointments.filter(function(a) { return a.patientId === id; }).length;
  var rxCount = db.prescriptions.filter(function(r) { return r.patientId === id; }).length;
  var labCount = db.labTests.filter(function(l) { return l.patientId === id; }).length;
  var html = '<div class="modal active" id="patDetailModal"><div class="modal-content modal-lg"><div class="modal-header"><h3>' + p.name + '</h3><button class="modal-close" onclick="closeModal(\'patDetailModal\')">&times;</button></div><div class="modal-body"><div class="patient-modal-grid">';
  html += '<div class="pm-item"><label>ID</label><span>' + p.id + '</span></div>';
  html += '<div class="pm-item"><label>Email</label><span>' + p.email + '</span></div>';
  html += '<div class="pm-item"><label>Phone</label><span>' + (p.phone || '-') + '</span></div>';
  html += '<div class="pm-item"><label>Blood Group</label><span>' + (p.bloodGroup || '-') + '</span></div>';
  html += '<div class="pm-item"><label>Gender</label><span>' + (p.gender || '-') + '</span></div>';
  html += '<div class="pm-item"><label>DOB</label><span>' + (p.dob ? formatDate(p.dob) : '-') + '</span></div>';
  html += '<div class="pm-item"><label>Address</label><span>' + (p.address || '-') + '</span></div>';
  html += '<div class="pm-item"><label>Registered</label><span>' + formatDate(p.createdAt) + '</span></div>';
  html += '<div class="pm-item"><label>Appointments</label><span>' + appCount + '</span></div>';
  html += '<div class="pm-item"><label>Prescriptions</label><span>' + rxCount + '</span></div>';
  html += '<div class="pm-item"><label>Lab Tests</label><span>' + labCount + '</span></div>';
  html += '</div></div></div></div>';
  showModalFromHTML(html);
}

function showAddPatientModal() {
  var html = '<div class="modal active" id="addPatModal"><div class="modal-content" style="max-width:500px;"><div class="modal-header"><h3>Add New Patient</h3><button class="modal-close" onclick="closeModal(\'addPatModal\')">&times;</button></div><div class="modal-body">';
  html += '<div class="form-group"><label>Full Name</label><input type="text" id="apName" placeholder="Enter full name"></div>';
  html += '<div class="form-row"><div class="form-group"><label>Email</label><input type="email" id="apEmail" placeholder="Email"></div><div class="form-group"><label>Password</label><input type="text" id="apPass" value="123"></div></div>';
  html += '<div class="form-row"><div class="form-group"><label>Phone</label><input type="text" id="apPhone" placeholder="Phone"></div><div class="form-group"><label>Blood Group</label><select id="apBlood"><option value="">Select</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option></select></div></div>';
  html += '<div class="form-row"><div class="form-group"><label>Gender</label><select id="apGender"><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div><div class="form-group"><label>DOB</label><input type="date" id="apDob"></div></div>';
  html += '<div class="form-group"><label>Address</label><textarea id="apAddress" rows="2" placeholder="Address"></textarea></div>';
  html += '<button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="saveNewPatient()">Add Patient</button>';
  html += '</div></div></div>';
  showModalFromHTML(html);
}

function saveNewPatient() {
  var name = document.getElementById('apName').value.trim();
  var email = document.getElementById('apEmail').value.trim();
  var pass = document.getElementById('apPass').value.trim();
  if (!name || !email || !pass) return showToast('Name, email, and password required', 'error');
  var db = getDB();
  if (db.patients.find(function(p) { return p.email === email; })) return showToast('Email already exists', 'error');
  var patient = {
    id: genId(), name: name, email: email, pass: pass,
    phone: document.getElementById('apPhone').value.trim(),
    bloodGroup: document.getElementById('apBlood').value,
    gender: document.getElementById('apGender').value,
    dob: document.getElementById('apDob').value,
    address: document.getElementById('apAddress').value.trim(),
    createdAt: new Date().toISOString()
  };
  db.patients.push(patient);
  saveDB(db);
  closeModal('addPatModal');
  showToast('Patient added successfully', 'success');
  switchTab('patients');
}

function showEditPatientModal(id) {
  var db = getDB();
  var p = db.patients.find(function(x) { return x.id === id; });
  if (!p) return showToast('Patient not found', 'error');
  var html = '<div class="modal active" id="editPatModal"><div class="modal-content" style="max-width:500px;"><div class="modal-header"><h3>Edit Patient</h3><button class="modal-close" onclick="closeModal(\'editPatModal\')">&times;</button></div><div class="modal-body">';
  html += '<input type="hidden" id="epId" value="' + p.id + '">';
  html += '<div class="form-group"><label>Full Name</label><input type="text" id="epName" value="' + (p.name || '') + '"></div>';
  html += '<div class="form-row"><div class="form-group"><label>Email</label><input type="email" id="epEmail" value="' + (p.email || '') + '"></div><div class="form-group"><label>Password</label><input type="text" id="epPass" value="' + (p.pass || '123') + '"></div></div>';
  html += '<div class="form-row"><div class="form-group"><label>Phone</label><input type="text" id="epPhone" value="' + (p.phone || '') + '"></div><div class="form-group"><label>Blood Group</label><select id="epBlood"><option value="">Select</option>';
  ['A+','A-','B+','B-','AB+','AB-','O+','O-',''].forEach(function(b) {
    html += '<option value="' + b + '" ' + (p.bloodGroup === b ? 'selected' : '') + '>' + (b || 'Select') + '</option>';
  });
  html += '</select></div></div>';
  html += '<div class="form-row"><div class="form-group"><label>Gender</label><select id="epGender"><option value="">Select</option><option ' + (p.gender === 'Male' ? 'selected' : '') + '>Male</option><option ' + (p.gender === 'Female' ? 'selected' : '') + '>Female</option><option ' + (p.gender === 'Other' ? 'selected' : '') + '>Other</option></select></div><div class="form-group"><label>DOB</label><input type="date" id="epDob" value="' + (p.dob || '') + '"></div></div>';
  html += '<div class="form-group"><label>Address</label><textarea id="epAddress" rows="2">' + (p.address || '') + '</textarea></div>';
  html += '<button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="saveEditPatient()">Save Changes</button>';
  html += '</div></div></div>';
  showModalFromHTML(html);
}

function saveEditPatient() {
  var id = document.getElementById('epId').value;
  var db = getDB();
  var p = db.patients.find(function(x) { return x.id === id; });
  if (!p) return showToast('Patient not found', 'error');
  var name = document.getElementById('epName').value.trim();
  var email = document.getElementById('epEmail').value.trim();
  if (!name || !email) return showToast('Name and email required', 'error');
  var existing = db.patients.find(function(x) { return x.email === email && x.id !== id; });
  if (existing) return showToast('Email already in use', 'error');
  p.name = name;
  p.email = email;
  p.pass = document.getElementById('epPass').value.trim() || p.pass;
  p.phone = document.getElementById('epPhone').value.trim();
  p.bloodGroup = document.getElementById('epBlood').value;
  p.gender = document.getElementById('epGender').value;
  p.dob = document.getElementById('epDob').value;
  p.address = document.getElementById('epAddress').value.trim();
  saveDB(db);
  closeModal('editPatModal');
  showToast('Patient updated successfully', 'success');
  switchTab('patients');
}

function deletePatient(id) {
  showConfirm('Delete Patient', 'Are you sure you want to delete this patient? All their data will be permanently removed.', function() {
    var db = getDB();
    db.patients = db.patients.filter(function(p) { return p.id !== id; });
    saveDB(db);
    showToast('Patient deleted', 'success');
    switchTab('patients');
  });
}

// ==================== DOCTORS (Full CRUD) ====================

function renderAdminDoctors() {
  var db = getDB();
  var doctors = db.doctors || [];
  var appointments = db.appointments || [];

  var html = '<div class="admin-section"><div class="section-header"><h3>All Doctors <span class="count-badge">' + doctors.length + '</span></h3><button class="btn btn-primary btn-sm" onclick="showAddDoctorModal()">+ Add Doctor</button></div>';
  html += '<div class="admin-filter-bar"><input type="text" id="doctorSearch" placeholder="Search by name or specialty..." oninput="filterAdminDoctors()" style="flex:1;max-width:300px;"></div>';
  html += '<div class="table-container"><table><thead><tr><th>Name</th><th>Specialty</th><th>Email</th><th>License</th><th>Fee</th><th>Appts</th><th>Actions</th></tr></thead><tbody id="doctorTableBody">';

  if (doctors.length === 0) {
    html += '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-light);">No doctors registered yet.</td></tr>';
  } else {
    doctors.forEach(function(d) {
      var appCount = appointments.filter(function(a) { return a.doctorId === d.id; }).length;
      html += '<tr class="doctor-row" data-name="' + (d.name || '').toLowerCase() + '" data-spec="' + (d.spec || '').toLowerCase() + '"><td><strong>' + d.name + '</strong></td><td>' + d.spec + '</td><td>' + d.email + '</td><td>' + d.license + '</td><td>' + formatCurrency(d.consultationFee) + '</td><td>' + appCount + '</td><td><div style="display:flex;gap:4px;"><button class="view-btn" onclick="showEditDoctorModal(\'' + d.id + '\')">Edit</button><button class="view-btn" style="border-color:#dc2626;color:#dc2626;" onclick="deleteDoctor(\'' + d.id + '\')">Delete</button></div></td></tr>';
    });
  }

  html += '</tbody></table></div></div>';
  return html;
}

function filterAdminDoctors() {
  var q = document.getElementById('doctorSearch').value.toLowerCase();
  document.querySelectorAll('.doctor-row').forEach(function(row) {
    row.style.display = (!q || row.dataset.name.indexOf(q) > -1 || row.dataset.spec.indexOf(q) > -1) ? '' : 'none';
  });
}

function showAddDoctorModal() {
  var html = '<div class="modal active" id="addDocModal"><div class="modal-content" style="max-width:550px;"><div class="modal-header"><h3>Add New Doctor</h3><button class="modal-close" onclick="closeModal(\'addDocModal\')">&times;</button></div><div class="modal-body">';
  html += '<div class="form-row"><div class="form-group"><label>Full Name</label><input type="text" id="adName" placeholder="Dr. ..."></div><div class="form-group"><label>Email</label><input type="email" id="adEmail" placeholder="Email"></div></div>';
  html += '<div class="form-row"><div class="form-group"><label>Password</label><input type="text" id="adPass" value="123"></div><div class="form-group"><label>Specialty</label><input type="text" id="adSpec" placeholder="e.g. Cardiology"></div></div>';
  html += '<div class="form-row"><div class="form-group"><label>License #</label><input type="text" id="adLicense" placeholder="PMC-XXXX"></div><div class="form-group"><label>Qualification</label><input type="text" id="adQual" placeholder="MBBS, FCPS"></div></div>';
  html += '<div class="form-row"><div class="form-group"><label>Experience (years)</label><input type="number" id="adExp" value="5"></div><div class="form-group"><label>Consultation Fee</label><input type="number" id="adFee" value="1000"></div></div>';
  html += '<button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="saveNewDoctor()">Add Doctor</button>';
  html += '</div></div></div>';
  showModalFromHTML(html);
}

function saveNewDoctor() {
  var name = document.getElementById('adName').value.trim();
  var email = document.getElementById('adEmail').value.trim();
  var pass = document.getElementById('adPass').value.trim();
  var spec = document.getElementById('adSpec').value.trim();
  if (!name || !email || !pass || !spec) return showToast('Name, email, password, and specialty required', 'error');
  var db = getDB();
  if (db.doctors.find(function(d) { return d.email === email; })) return showToast('Email already exists', 'error');
  var doctor = {
    id: genId(), name: name, email: email, pass: pass, spec: spec,
    license: document.getElementById('adLicense').value.trim() || 'PMC-0000',
    qualification: document.getElementById('adQual').value.trim() || 'MBBS',
    experience: parseInt(document.getElementById('adExp').value) || 5,
    consultationFee: parseInt(document.getElementById('adFee').value) || 1000,
    schedule: genDefaultSchedule(), createdAt: new Date().toISOString()
  };
  db.doctors.push(doctor);
  saveDB(db);
  closeModal('addDocModal');
  showToast('Doctor added successfully', 'success');
  switchTab('doctors');
}

function showEditDoctorModal(id) {
  var db = getDB();
  var d = db.doctors.find(function(x) { return x.id === id; });
  if (!d) return showToast('Doctor not found', 'error');
  var specList = ['Cardiology','Dermatology','General Medicine','Pediatrics','Orthopedics','Neurology','Ophthalmology','ENT','Psychiatry','Gynecology'];
  var html = '<div class="modal active" id="editDocModal"><div class="modal-content" style="max-width:550px;"><div class="modal-header"><h3>Edit Doctor</h3><button class="modal-close" onclick="closeModal(\'editDocModal\')">&times;</button></div><div class="modal-body">';
  html += '<input type="hidden" id="edId" value="' + d.id + '">';
  html += '<div class="form-row"><div class="form-group"><label>Name</label><input type="text" id="edName" value="' + (d.name || '') + '"></div><div class="form-group"><label>Email</label><input type="email" id="edEmail" value="' + (d.email || '') + '"></div></div>';
  html += '<div class="form-row"><div class="form-group"><label>Password</label><input type="text" id="edPass" value="' + (d.pass || '123') + '"></div><div class="form-group"><label>Specialty</label><select id="edSpec">';
  specList.forEach(function(s) { html += '<option value="' + s + '" ' + (d.spec === s ? 'selected' : '') + '>' + s + '</option>'; });
  html += '</select></div></div>';
  html += '<div class="form-row"><div class="form-group"><label>License</label><input type="text" id="edLicense" value="' + (d.license || '') + '"></div><div class="form-group"><label>Qualification</label><input type="text" id="edQual" value="' + (d.qualification || '') + '"></div></div>';
  html += '<div class="form-row"><div class="form-group"><label>Experience (yrs)</label><input type="number" id="edExp" value="' + (d.experience || 0) + '"></div><div class="form-group"><label>Fee (Rs)</label><input type="number" id="edFee" value="' + (d.consultationFee || 0) + '"></div></div>';
  html += '<button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="saveEditDoctor()">Save Changes</button>';
  html += '</div></div></div>';
  showModalFromHTML(html);
}

function saveEditDoctor() {
  var id = document.getElementById('edId').value;
  var db = getDB();
  var d = db.doctors.find(function(x) { return x.id === id; });
  if (!d) return showToast('Doctor not found', 'error');
  var name = document.getElementById('edName').value.trim();
  var email = document.getElementById('edEmail').value.trim();
  if (!name || !email) return showToast('Name and email required', 'error');
  var existing = db.doctors.find(function(x) { return x.email === email && x.id !== id; });
  if (existing) return showToast('Email already in use', 'error');
  d.name = name;
  d.email = email;
  d.pass = document.getElementById('edPass').value.trim() || d.pass;
  d.spec = document.getElementById('edSpec').value;
  d.license = document.getElementById('edLicense').value.trim();
  d.qualification = document.getElementById('edQual').value.trim();
  d.experience = parseInt(document.getElementById('edExp').value) || 0;
  d.consultationFee = parseInt(document.getElementById('edFee').value) || 0;
  saveDB(db);
  closeModal('editDocModal');
  showToast('Doctor updated successfully', 'success');
  switchTab('doctors');
}

function deleteDoctor(id) {
  showConfirm('Delete Doctor', 'Are you sure you want to delete this doctor?', function() {
    var db = getDB();
    db.doctors = db.doctors.filter(function(d) { return d.id !== id; });
    saveDB(db);
    showToast('Doctor deleted', 'success');
    switchTab('doctors');
  });
}

// ==================== APPOINTMENTS (Manage) ====================

function renderAdminAppointments() {
  var db = getDB();
  var appointments = db.appointments || [];

  var html = '<div class="admin-section"><div class="section-header"><h3>All Appointments <span class="count-badge">' + appointments.length + '</span></h3></div>';
  html += '<div class="admin-filter-bar"><label style="font-size:0.85rem;font-weight:600;">Filter:</label>';
  html += '<select id="appFilter" onchange="filterAdminAppointments()"><option value="all">All</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>';
  html += '<div id="appTableWrap"><div class="table-container"><table><thead><tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead><tbody>';

  if (appointments.length === 0) {
    html += '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-light);">No appointments.</td></tr>';
  } else {
    appointments.forEach(function(a) {
      var statusActions = '';
      if (a.status === 'pending') {
        statusActions = '<button class="view-btn" style="border-color:#059669;color:#059669;" onclick="adminUpdateAppointment(\'' + a.id + '\',\'confirmed\')">Confirm</button> ';
        statusActions += '<button class="view-btn" style="border-color:#dc2626;color:#dc2626;" onclick="adminUpdateAppointment(\'' + a.id + '\',\'cancelled\')">Cancel</button>';
      } else if (a.status === 'confirmed') {
        statusActions = '<button class="view-btn" style="border-color:#2563eb;color:#2563eb;" onclick="adminUpdateAppointment(\'' + a.id + '\',\'completed\')">Complete</button> ';
        statusActions += '<button class="view-btn" style="border-color:#dc2626;color:#dc2626;" onclick="adminUpdateAppointment(\'' + a.id + '\',\'cancelled\')">Cancel</button>';
      } else {
        statusActions = '<span style="font-size:.75rem;color:var(--text-lighter);">-</span>';
      }
      html += '<tr class="app-row" data-status="' + a.status + '"><td><strong>' + a.patientName + '</strong></td><td>' + (a.doctorName || 'N/A') + '</td><td>' + formatDate(a.date) + '</td><td>' + a.time + '</td><td>' + (a.type || 'clinic') + '</td><td>' + statusBadge(a.status) + '</td><td>' + statusActions + '</td></tr>';
    });
  }

  html += '</tbody></table></div></div></div>';
  return html;
}

function filterAdminAppointments() {
  var filter = document.getElementById('appFilter').value;
  document.querySelectorAll('.app-row').forEach(function(row) {
    row.style.display = (filter === 'all' || row.dataset.status === filter) ? '' : 'none';
  });
}

function adminUpdateAppointment(id, newStatus) {
  var label = { confirmed: 'confirm', completed: 'complete', cancelled: 'cancel' };
  showConfirm(label[newStatus].charAt(0).toUpperCase() + label[newStatus].slice(1) + ' Appointment', 'Are you sure you want to ' + label[newStatus] + ' this appointment?', function() {
    var db = getDB();
    var appt = db.appointments.find(function(a) { return a.id === id; });
    if (!appt) return showToast('Appointment not found', 'error');
    appt.status = newStatus;
    saveDB(db);
    showToast('Appointment ' + label[newStatus] + 'ed', 'success');
    switchTab('appointments');
  });
}

// ==================== PHARMACY (Full Inventory Control) ====================

function renderAdminPharmacy() {
  var db = getDB();
  var medicines = db.medicines || [];

  var lowStock = medicines.filter(function(m) { return m.stock <= m.minStock; });
  var html = '';

  if (lowStock.length > 0) {
    html += '<div class="admin-section" style="border-color:#fecaca;"><h3 style="color:var(--danger);">&#9888; Low Stock Alert <span class="count-badge" style="background:#fee2e2;color:#dc2626;">' + lowStock.length + '</span></h3>';
    lowStock.forEach(function(m) {
      html += '<div class="low-stock-item"><span class="ls-name">' + m.name + '</span><span class="ls-stock">' + m.stock + ' / ' + m.minStock + ' min</span></div>';
    });
    html += '</div>';
  }

  html += '<div class="admin-section"><div class="section-header"><h3>Medicine Inventory <span class="count-badge">' + medicines.length + '</span></h3><div style="display:flex;gap:6px;"><input type="text" id="medSearch" placeholder="Search medicine..." oninput="filterAdminMeds()" style="padding:6px 10px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:.85rem;width:180px;"><button class="btn btn-primary btn-sm" onclick="showAddMedicineModal()">+ Add Medicine</button></div></div>';
  html += '<div class="table-container"><table><thead><tr><th>Medicine</th><th>Category</th><th>Price</th><th>Stock</th><th>Min Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody id="medTableBody">';

  if (medicines.length === 0) {
    html += '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-light);">No medicines in inventory.</td></tr>';
  } else {
    medicines.forEach(function(m) {
      var status = m.stock > m.minStock ? 'In Stock' : 'Low Stock';
      html += '<tr class="med-row" data-name="' + (m.name || '').toLowerCase() + '"><td><strong>' + m.name + '</strong></td><td>' + m.category + '</td><td>' + formatCurrency(m.price) + '</td><td>' + m.stock + '</td><td>' + m.minStock + '</td><td>' + (m.stock > m.minStock ? '<span class="badge badge-green">In Stock</span>' : '<span class="badge badge-amber">Low Stock</span>') + '</td><td><div style="display:flex;gap:4px;flex-wrap:wrap;"><button class="view-btn" onclick="quickRestock(\'' + m.id + '\',50)">+50</button><button class="view-btn" onclick="quickRestock(\'' + m.id + '\',100)">+100</button><button class="view-btn" onclick="quickRestock(\'' + m.id + '\',200)">+200</button><button class="view-btn" onclick="showEditMedicineModal(\'' + m.id + '\')">Edit</button><button class="view-btn" style="border-color:#dc2626;color:#dc2626;" onclick="deleteMedicine(\'' + m.id + '\')">Del</button></div></td></tr>';
    });
  }

  html += '</tbody></table></div></div>';
  return html;
}

function filterAdminMeds() {
  var q = document.getElementById('medSearch').value.toLowerCase();
  document.querySelectorAll('.med-row').forEach(function(row) {
    row.style.display = (!q || row.dataset.name.indexOf(q) > -1) ? '' : 'none';
  });
}

function quickRestock(id, amount) {
  var db = getDB();
  var med = db.medicines.find(function(m) { return m.id === id; });
  if (!med) return showToast('Medicine not found', 'error');
  med.stock += amount;
  saveDB(db);
  showToast('+' + amount + ' ' + med.name + ' added to stock', 'success');
  switchTab('pharmacy');
}

function showAddMedicineModal() {
  var categories = ['Analgesic','Antibiotic','PPI','Antidiabetic','Statin','Calcium Blocker','ARB','Thyroid Hormone','Antihistamine','NSAID','Antiplatelet','Bronchodilator','Topical Antibiotic','Antimigraine','Corticosteroid','Diuretic','Coronary Vasodilator','Other'];
  var html = '<div class="modal active" id="addMedModal"><div class="modal-content" style="max-width:500px;"><div class="modal-header"><h3>Add New Medicine</h3><button class="modal-close" onclick="closeModal(\'addMedModal\')">&times;</button></div><div class="modal-body">';
  html += '<div class="form-row"><div class="form-group"><label>Medicine Name</label><input type="text" id="amName" placeholder="e.g. Paracetamol 500mg"></div><div class="form-group"><label>Category</label><select id="amCat">';
  categories.forEach(function(c) { html += '<option value="' + c + '">' + c + '</option>'; });
  html += '</select></div></div>';
  html += '<div class="form-row"><div class="form-group"><label>Price (Rs)</label><input type="number" id="amPrice" value="100"></div><div class="form-group"><label>Initial Stock</label><input type="number" id="amStock" value="500"></div></div>';
  html += '<div class="form-row"><div class="form-group"><label>Min Stock Level</label><input type="number" id="amMin" value="50"></div><div class="form-group"><label>Manufacturer</label><input type="text" id="amMfr" placeholder="Manufacturer"></div></div>';
  html += '<button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="saveNewMedicine()">Add Medicine</button>';
  html += '</div></div></div>';
  showModalFromHTML(html);
}

function saveNewMedicine() {
  var name = document.getElementById('amName').value.trim();
  if (!name) return showToast('Medicine name required', 'error');
  var db = getDB();
  if (db.medicines.find(function(m) { return m.name.toLowerCase() === name.toLowerCase(); })) return showToast('Medicine already exists', 'error');
  var med = {
    id: genId(), name: name, category: document.getElementById('amCat').value,
    price: parseInt(document.getElementById('amPrice').value) || 0,
    stock: parseInt(document.getElementById('amStock').value) || 0,
    minStock: parseInt(document.getElementById('amMin').value) || 10,
    manufacturer: document.getElementById('amMfr').value.trim() || 'Zeeshan Pharma'
  };
  db.medicines.push(med);
  saveDB(db);
  closeModal('addMedModal');
  showToast('Medicine added successfully', 'success');
  switchTab('pharmacy');
}

function showEditMedicineModal(id) {
  var categories = ['Analgesic','Antibiotic','PPI','Antidiabetic','Statin','Calcium Blocker','ARB','Thyroid Hormone','Antihistamine','NSAID','Antiplatelet','Bronchodilator','Topical Antibiotic','Antimigraine','Corticosteroid','Diuretic','Coronary Vasodilator','Other'];
  var db = getDB();
  var m = db.medicines.find(function(x) { return x.id === id; });
  if (!m) return showToast('Medicine not found', 'error');
  var html = '<div class="modal active" id="editMedModal"><div class="modal-content" style="max-width:500px;"><div class="modal-header"><h3>Edit Medicine</h3><button class="modal-close" onclick="closeModal(\'editMedModal\')">&times;</button></div><div class="modal-body">';
  html += '<input type="hidden" id="emId" value="' + m.id + '">';
  html += '<div class="form-row"><div class="form-group"><label>Name</label><input type="text" id="emName" value="' + (m.name || '') + '"></div><div class="form-group"><label>Category</label><select id="emCat">';
  categories.forEach(function(c) { html += '<option value="' + c + '" ' + (m.category === c ? 'selected' : '') + '>' + c + '</option>'; });
  html += '</select></div></div>';
  html += '<div class="form-row"><div class="form-group"><label>Price</label><input type="number" id="emPrice" value="' + (m.price || 0) + '"></div><div class="form-group"><label>Stock</label><input type="number" id="emStock" value="' + (m.stock || 0) + '"></div></div>';
  html += '<div class="form-row"><div class="form-group"><label>Min Stock</label><input type="number" id="emMin" value="' + (m.minStock || 10) + '"></div><div class="form-group"><label>Manufacturer</label><input type="text" id="emMfr" value="' + (m.manufacturer || '') + '"></div></div>';
  html += '<button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="saveEditMedicine()">Save Changes</button>';
  html += '</div></div></div>';
  showModalFromHTML(html);
}

function saveEditMedicine() {
  var id = document.getElementById('emId').value;
  var db = getDB();
  var m = db.medicines.find(function(x) { return x.id === id; });
  if (!m) return showToast('Medicine not found', 'error');
  var name = document.getElementById('emName').value.trim();
  if (!name) return showToast('Name required', 'error');
  m.name = name;
  m.category = document.getElementById('emCat').value;
  m.price = parseInt(document.getElementById('emPrice').value) || 0;
  m.stock = parseInt(document.getElementById('emStock').value) || 0;
  m.minStock = parseInt(document.getElementById('emMin').value) || 10;
  m.manufacturer = document.getElementById('emMfr').value.trim();
  saveDB(db);
  closeModal('editMedModal');
  showToast('Medicine updated', 'success');
  switchTab('pharmacy');
}

function deleteMedicine(id) {
  showConfirm('Delete Medicine', 'Remove this medicine from inventory permanently?', function() {
    var db = getDB();
    db.medicines = db.medicines.filter(function(m) { return m.id !== id; });
    saveDB(db);
    showToast('Medicine deleted', 'success');
    switchTab('pharmacy');
  });
}

// ==================== LAB (Full Management) ====================

function renderAdminLab() {
  var db = getDB();
  var labTests = db.labTests || [];

  var html = '<div class="admin-section"><div class="section-header"><h3>All Lab Tests <span class="count-badge">' + labTests.length + '</span></h3></div>';
  html += '<div class="admin-filter-bar"><label style="font-size:0.85rem;font-weight:600;">Filter:</label>';
  html += '<select id="labFilter" onchange="filterAdminLab()"><option value="all">All</option><option value="pending">Pending</option><option value="collected">Collected</option><option value="completed">Completed</option></select></div>';
  html += '<div class="table-container"><table><thead><tr><th>Patient</th><th>Test</th><th>Status</th><th>Type</th><th>Date</th><th>Actions</th></tr></thead><tbody id="labTableBody">';

  if (labTests.length === 0) {
    html += '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-light);">No lab tests yet.</td></tr>';
  } else {
    labTests.forEach(function(l) {
      var testType = db.testTypes.find(function(t) { return t.id === l.testTypeId; });
      var typeLabel = l.isHomeCollection ? 'Home Collection' : 'Lab Visit';
      var actions = '';
      if (l.status === 'pending') {
        actions = '<button class="view-btn" onclick="adminMarkCollected(\'' + l.id + '\')">Mark Collected</button> ';
        actions += '<button class="view-btn" style="border-color:#dc2626;color:#dc2626;" onclick="deleteLabTest(\'' + l.id + '\')">Delete</button>';
      } else if (l.status === 'collected') {
        actions = '<button class="view-btn" onclick="adminUploadResult(\'' + l.id + '\')">Upload Result</button> ';
        actions += '<button class="view-btn" style="border-color:#dc2626;color:#dc2626;" onclick="deleteLabTest(\'' + l.id + '\')">Delete</button>';
      } else {
        actions = '<button class="view-btn" onclick="adminViewResult(\'' + l.id + '\')">View Result</button> ';
        actions += '<button class="view-btn" style="border-color:#dc2626;color:#dc2626;" onclick="deleteLabTest(\'' + l.id + '\')">Delete</button>';
      }
      html += '<tr class="lab-row" data-status="' + l.status + '"><td><strong>' + (l.patientName || 'N/A') + '</strong></td><td>' + (testType ? testType.name : 'N/A') + '</td><td>' + statusBadge(l.status) + '</td><td>' + typeLabel + '</td><td>' + formatDate(l.createdAt) + '</td><td>' + actions + '</td></tr>';
    });
  }

  html += '</tbody></table></div></div>';
  return html;
}

function filterAdminLab() {
  var filter = document.getElementById('labFilter').value;
  document.querySelectorAll('.lab-row').forEach(function(row) {
    row.style.display = (filter === 'all' || row.dataset.status === filter) ? '' : 'none';
  });
}

function adminMarkCollected(id) {
  showConfirm('Mark Collected', 'Mark this sample as collected?', function() {
    var db = getDB();
    var test = db.labTests.find(function(l) { return l.id === id; });
    if (!test) return showToast('Lab test not found', 'error');
    test.status = 'collected';
    test.collectedAt = new Date().toISOString();
    saveDB(db);
    showToast('Sample marked as collected', 'success');
    switchTab('lab');
  });
}

function adminUploadResult(id) {
  var db = getDB();
  var test = db.labTests.find(function(l) { return l.id === id; });
  if (!test) return showToast('Lab test not found', 'error');
  var testType = db.testTypes.find(function(t) { return t.id === test.testTypeId; });
  var html = '<div class="modal active" id="uploadResultModal"><div class="modal-content" style="max-width:550px;"><div class="modal-header"><h3>Upload Result: ' + (testType ? testType.name : 'Test') + '</h3><button class="modal-close" onclick="closeModal(\'uploadResultModal\')">&times;</button></div><div class="modal-body">';
  html += '<input type="hidden" id="urId" value="' + id + '">';
  html += '<div class="form-group"><label>Patient</label><input type="text" value="' + (test.patientName || '') + '" disabled style="background:#f8fafc;"></div>';
  html += '<div class="form-group"><label>Findings Status</label><select id="urStatus"><option value="normal">Normal</option><option value="abnormal">Abnormal</option><option value="critical">Critical</option></select></div>';
  html += '<div class="form-group"><label>Result Details</label><textarea id="urDetails" rows="8" placeholder="Enter test result details with values and reference ranges..."></textarea></div>';
  html += '<button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="saveLabResult()">Save Result</button>';
  html += '</div></div></div>';
  showModalFromHTML(html);
}

function saveLabResult() {
  var id = document.getElementById('urId').value;
  var status = document.getElementById('urStatus').value;
  var details = document.getElementById('urDetails').value.trim();
  if (!details) return showToast('Please enter result details', 'error');
  var db = getDB();
  var test = db.labTests.find(function(l) { return l.id === id; });
  if (!test) return showToast('Lab test not found', 'error');
  var statusLabel = { normal: 'Normal', abnormal: 'Abnormal', critical: 'Critical' };
  test.status = 'completed';
  test.result = '<p><strong>Findings:</strong> ' + statusLabel[status] + '</p><pre style="white-space:pre-wrap;font-family:inherit;">' + details + '</pre><p><em>Reported on ' + new Date().toISOString().split('T')[0] + '</em></p>';
  test.completedAt = new Date().toISOString();
  saveDB(db);
  closeModal('uploadResultModal');
  showToast('Lab result saved successfully', 'success');
  switchTab('lab');
}

function adminViewResult(id) {
  var db = getDB();
  var test = db.labTests.find(function(l) { return l.id === id; });
  if (!test || !test.result) return showToast('No result available', 'error');
  var testType = db.testTypes.find(function(t) { return t.id === test.testTypeId; });
  var html = '<div class="modal active" id="viewResultModal"><div class="modal-content modal-lg"><div class="modal-header"><h3>Lab Result: ' + (testType ? testType.name : 'Test') + '</h3><button class="modal-close" onclick="closeModal(\'viewResultModal\')">&times;</button></div><div class="modal-body">';
  html += '<div style="margin-bottom:16px;padding:12px 16px;background:#f8fafc;border-radius:var(--radius-sm);display:flex;gap:24px;flex-wrap:wrap;">';
  html += '<div><strong>Patient:</strong> ' + (test.patientName || 'N/A') + '</div>';
  html += '<div><strong>Test:</strong> ' + (testType ? testType.name : 'N/A') + '</div>';
  html += '<div><strong>Status:</strong> ' + statusBadge(test.status) + '</div>';
  html += '</div>';
  html += '<div style="background:#f0fdfa;border:1px solid rgba(13,148,136,0.15);border-radius:var(--radius-sm);padding:20px;">' + test.result + '</div>';
  html += '</div></div></div>';
  showModalFromHTML(html);
}

function deleteLabTest(id) {
  showConfirm('Delete Lab Test', 'Remove this lab test record permanently?', function() {
    var db = getDB();
    db.labTests = db.labTests.filter(function(l) { return l.id !== id; });
    saveDB(db);
    showToast('Lab test deleted', 'success');
    switchTab('lab');
  });
}

// ==================== MESSAGES (Contact Inquiries) ====================

function renderAdminMessages() {
  var db = getDB();
  var messages = db.messages || [];

  var html = '<div class="admin-section"><div class="section-header"><h3>Contact Messages <span class="count-badge">' + messages.length + '</span></h3><button class="btn btn-outline btn-sm" onclick="addTestMessage()">+ Add Test Message</button></div>';

  if (messages.length === 0) {
    html += '<div style="text-align:center;padding:40px;color:var(--text-lighter);">No messages from the website contact form yet.</div>';
  } else {
    messages.slice().reverse().forEach(function(m) {
      var readClass = m.read ? '' : ' style="background:#f0fdfa;border-left:3px solid var(--primary);"';
      html += '<div class="activity-item"' + readClass + '><div class="act-icon" style="background:#dbeafe;color:#2563eb;">&#9993;</div><div class="act-content"><div class="act-title">' + (m.name || 'Anonymous') + ' &lt;' + (m.email || '') + '&gt;</div><div class="act-desc">' + (m.message || '') + '</div></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;"><div class="act-time">' + formatDate(m.createdAt) + '</div>' + (m.read ? '<span style="font-size:.68rem;color:var(--text-lighter);">Read</span>' : '<button class="view-btn" style="font-size:.7rem;padding:2px 8px;" onclick="markMessageRead(\'' + m.id + '\')">Mark Read</button>') + '</div></div>';
    });
  }

  html += '</div>';
  return html;
}

function addTestMessage() {
  var names = ['Ali Ahmed','Sara Khan','Usman Javed','Fatima Raza'];
  var subjects = ['Booking Inquiry','Partnership Request','Technical Support','Feedback'];
  var msgs = ['I would like to book an appointment with a cardiologist.','Interested in partnering my clinic with ZH platform.','Need help with prescription download feature.','Great platform! Love the video consultation feature.'];
  var db = getDB();
  db.messages.push({
    id: genId(),
    name: names[Math.floor(Math.random() * names.length)],
    email: 'user@test.com',
    subject: subjects[Math.floor(Math.random() * subjects.length)],
    message: msgs[Math.floor(Math.random() * msgs.length)],
    read: false,
    createdAt: new Date().toISOString()
  });
  saveDB(db);
  showToast('Test message added', 'success');
  switchTab('messages');
}

function markMessageRead(id) {
  var db = getDB();
  var m = db.messages.find(function(x) { return x.id === id; });
  if (m) m.read = true;
  saveDB(db);
  switchTab('messages');
}

// ==================== SYSTEM ====================

function renderSystem() {
  var db = getDB();
  var storageSize = new Blob([JSON.stringify(db)]).size;
  var sizeKB = (storageSize / 1024).toFixed(1);
  var sizeMB = (storageSize / (1024 * 1024)).toFixed(2);

  var collections = [
    { name: 'Patients', count: db.patients.length },
    { name: 'Doctors', count: db.doctors.length },
    { name: 'Pharmacists', count: db.pharmacists.length },
    { name: 'Labs', count: db.labs.length },
    { name: 'Appointments', count: db.appointments.length },
    { name: 'Prescriptions', count: db.prescriptions.length },
    { name: 'Lab Tests', count: db.labTests.length },
    { name: 'Medicines', count: db.medicines.length },
    { name: 'Test Types', count: db.testTypes.length },
    { name: 'Notifications', count: db.notifications.length },
    { name: 'Messages', count: db.messages.length }
  ];

  var html = '';

  html += '<div class="admin-section"><h3>Database Info</h3><div class="db-info-grid">';
  html += '<div class="db-info-card"><div class="db-label">Storage</div><div class="db-value">' + sizeKB + ' KB</div><div style="font-size:0.78rem;color:var(--text-lighter);">' + sizeMB + ' MB</div></div>';
  html += '<div class="db-info-card"><div class="db-label">DB Version</div><div class="db-value">' + (db._version || '1') + '</div></div>';
  html += '<div class="db-info-card"><div class="db-label">Total Records</div><div class="db-value">' + collections.reduce(function(s, c) { return s + c.count; }, 0) + '</div></div>';
  html += '<div class="db-info-card"><div class="db-label">Seeded</div><div class="db-value">' + (db._seeded ? 'Yes' : 'No') + '</div></div>';
  html += '</div></div>';

  // Collection Breakdown
  html += '<div class="admin-section"><h3>Collection Breakdown</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;">';
  collections.forEach(function(c) {
    html += '<div style="background:var(--bg);padding:12px 16px;border-radius:var(--radius-sm);border:1px solid var(--border);text-align:center;"><div style="font-weight:700;font-size:1.3rem;color:var(--primary);">' + c.count + '</div><div style="font-size:.78rem;color:var(--text-light);">' + c.name + '</div></div>';
  });
  html += '</div></div>';

  // Broadcast Notification
  html += '<div class="admin-section"><h3>&#128276; Broadcast Notification</h3>';
  html += '<div class="form-group"><label>Send to all users</label>';
  html += '<div class="form-row"><div class="form-group"><input type="text" id="broadcastTitle" placeholder="Notification title" style="width:100%;"></div></div>';
  html += '<div class="form-group"><textarea id="broadcastMsg" rows="2" placeholder="Notification message"></textarea></div>';
  html += '<button class="btn btn-primary btn-sm" onclick="broadcastNotification()">Send Broadcast</button>';
  html += '</div></div>';

  // Danger Zone
  html += '<div class="admin-section" style="border-color:#fecaca;"><h3 style="color:var(--danger);">&#9888; Danger Zone</h3>';
  html += '<p style="font-size:.85rem;color:var(--text-light);margin-bottom:12px;">Resetting will delete ALL data and reload default seed data. This cannot be undone.</p>';
  html += '<button class="btn btn-danger" onclick="showConfirm(\'Reset Database\', \'This will permanently delete all data and reset to defaults. Continue?\', resetDB)">&#9888; Reset Database Now</button>';
  html += '</div>';

  // Demo Accounts
  html += '<div class="admin-section"><h3>Demo Accounts Reference</h3>';
  var accounts = [
    { portal: 'Admin', email: 'admin@zh.com', password: '123', role: 'admin' },
    { portal: 'Patient', email: 'ahmed@test.com', password: '123', role: 'patient' },
    { portal: 'Patient', email: 'sara@test.com', password: '123', role: 'patient' },
    { portal: 'Patient', email: 'ali@test.com', password: '123', role: 'patient' },
    { portal: 'Patient', email: 'fatima@test.com', password: '123', role: 'patient' },
    { portal: 'Patient', email: 'usman@test.com', password: '123', role: 'patient' },
    { portal: 'Doctor', email: 'doctor@zh.com', password: '123', role: 'doctor', spec: 'Cardiology' },
    { portal: 'Doctor', email: 'sara@zh.com', password: '123', role: 'doctor', spec: 'Dermatology' },
    { portal: 'Doctor', email: 'ahmed@zh.com', password: '123', role: 'doctor', spec: 'General Medicine' },
    { portal: 'Doctor', email: 'fatima.doc@zh.com', password: '123', role: 'doctor', spec: 'Pediatrics' },
    { portal: 'Pharmacy', email: 'pharmacy@zh.com', password: '123', role: 'pharmacy' },
    { portal: 'Lab', email: 'lab@zh.com', password: '123', role: 'lab' }
  ];
  html += '<table class="demo-table"><thead><tr><th>Portal</th><th>Email</th><th>Password</th><th>Details</th></tr></thead><tbody>';
  accounts.forEach(function(a) {
    var badgeClass = { admin: 'badge-red', doctor: 'badge-green', patient: 'badge-blue', pharmacy: 'badge-amber', lab: 'badge-purple' };
    html += '<tr><td><span class="badge ' + (badgeClass[a.role] || '') + '">' + a.portal + '</span></td><td>' + a.email + '</td><td>' + a.password + '</td><td>' + (a.spec || a.role) + '</td></tr>';
  });
  html += '</tbody></table></div>';

  return html;
}

function broadcastNotification() {
  var title = document.getElementById('broadcastTitle').value.trim();
  var msg = document.getElementById('broadcastMsg').value.trim();
  if (!title || !msg) return showToast('Please enter both title and message', 'error');
  var db = getDB();
  var allUsers = []
    .concat(db.patients || [])
    .concat(db.doctors || [])
    .concat(db.pharmacists || [])
    .concat(db.labs || []);
  if (allUsers.length === 0) return showToast('No users to notify', 'error');
  allUsers.forEach(function(u) {
    db.notifications.push({
      id: 'NOT-' + (db.nextId++),
      userId: u.id, title: title, message: msg,
      type: 'info', read: false,
      createdAt: new Date().toISOString()
    });
  });
  saveDB(db);
  document.getElementById('broadcastTitle').value = '';
  document.getElementById('broadcastMsg').value = '';
  showToast('Notification sent to ' + allUsers.length + ' users', 'success');
}

// ==================== INIT ====================
// (init is called from HTML after dbPromise resolves)
