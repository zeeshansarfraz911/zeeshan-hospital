// ========== Doctor Portal - Zeeshan Hospital ==========

let user = getCurrentUser();
const role = getCurrentRole();

if (!user || role !== 'doctor') {
  window.location.href = 'index.html';
}

let consultationPatientId = null;

function initDoctor() {
  document.getElementById('sidebarAvatar').textContent = user.name.charAt(0);
  document.getElementById('sidebarName').textContent = user.name;
  document.getElementById('sidebarEmail').textContent = user.email + ' • ' + user.spec;

  document.querySelectorAll('.sidebar-nav a[data-tab]').forEach(a => {
    a.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelectorAll('.sidebar-nav a').forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      showDoctorTab(this.dataset.tab);
      if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
    });
  });

  showDoctorTab('dashboard');
}

function showDoctorTab(tab) {
  const titles = {
    dashboard: 'Dashboard', appointments: 'Appointments', patients: 'My Patients',
    consultation: 'Consultation', prescriptions: 'Prescriptions', profile: 'My Profile'
  };
  document.getElementById('pageTitle').textContent = titles[tab] || 'Dashboard';
  document.getElementById('pageSubtitle').textContent = 'Manage your medical practice';

  const renderers = {
    dashboard: renderDashboard,
    appointments: renderAppointments,
    patients: renderPatients,
    consultation: renderConsultation,
    prescriptions: renderPrescriptions,
    profile: renderProfile
  };
  if (renderers[tab]) renderers[tab]();
}

// ─── Dashboard ─────────────────────────────────────────

function renderDashboard() {
  const db = getDB();
  const myApps = db.appointments.filter(a => a.doctorId === user.id);
  const myRx = db.prescriptions.filter(p => p.doctorId === user.id);
  const pendingCount = myApps.filter(a => a.status === 'pending' || a.status === 'confirmed').length;
  const today = new Date().toISOString().split('T')[0];
  const todayApps = myApps.filter(a => a.date === today);
  const uniquePatients = new Set(myApps.map(a => a.patientId)).size;

  document.getElementById('pageContent').innerHTML = `
    <div class="dash-cards">
      <div class="dash-card">
        <div class="card-top">
          <div><div class="dash-card-label">Today's Appointments</div><div class="dash-card-value green">${todayApps.length}</div></div>
          <div class="card-icon green-bg">&#128197;</div>
        </div>
      </div>
      <div class="dash-card">
        <div class="card-top">
          <div><div class="dash-card-label">Pending / Confirmed</div><div class="dash-card-value blue">${pendingCount}</div></div>
          <div class="card-icon blue-bg">&#9888;</div>
        </div>
      </div>
      <div class="dash-card">
        <div class="card-top">
          <div><div class="dash-card-label">Total Patients</div><div class="dash-card-value amber">${uniquePatients}</div></div>
          <div class="card-icon amber-bg">&#9787;</div>
        </div>
      </div>
      <div class="dash-card">
        <div class="card-top">
          <div><div class="dash-card-label">Prescriptions Issued</div><div class="dash-card-value red">${myRx.length}</div></div>
          <div class="card-icon red-bg">&#9998;</div>
        </div>
      </div>
    </div>
    <div class="grid grid-2">
      <div>
        <div class="section-title-sm">Today's Schedule</div>
        ${todayApps.length === 0
          ? '<div class="empty-state"><div class="empty-icon">&#128197;</div><h3>No appointments today</h3></div>'
          : todayApps.map(a => {
              const pat = db.patients.find(p => p.id === a.patientId);
              return `<div class="card" style="padding:14px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <strong>${pat ? pat.name : 'Patient'}</strong>
                  <div class="text-sm text-muted">${a.time} • ${statusBadge(a.status)}</div>
                </div>
                <button class="btn btn-sm ${a.status === 'pending' ? 'btn-primary' : a.status === 'confirmed' ? 'btn-outline' : 'btn-ghost'}" onclick="handleAppointment('${a.id}')">${a.status === 'pending' ? 'Confirm' : a.status === 'confirmed' ? 'Start' : '—'}</button>
              </div>`;
            }).join('')
        }
      </div>
      <div>
        <div class="section-title-sm">Quick Actions</div>
        <div class="quick-actions">
          <div class="quick-action" onclick="showDoctorTab('appointments')">
            <div class="qa-icon green">&#128197;</div>
            <div><div class="qa-text">View Appointments</div><div class="qa-sub">Manage all bookings</div></div>
          </div>
          <div class="quick-action" onclick="showDoctorTab('consultation')">
            <div class="qa-icon blue">&#9881;</div>
            <div><div class="qa-text">Start Consultation</div><div class="qa-sub">See waiting patients</div></div>
          </div>
          <div class="quick-action" onclick="openPrescribeModal('')">
            <div class="qa-icon amber">&#9998;</div>
            <div><div class="qa-text">Write Prescription</div><div class="qa-sub">New prescription</div></div>
          </div>
          <div class="quick-action" onclick="showDoctorTab('patients')">
            <div class="qa-icon purple">&#9787;</div>
            <div><div class="qa-text">My Patients</div><div class="qa-sub">View patient list</div></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ─── Appointment Actions ───────────────────────────────

function handleAppointment(id) {
  const db = getDB();
  const app = db.appointments.find(a => a.id === id);
  if (!app) return;
  if (app.status === 'pending') {
    app.status = 'confirmed';
    app.notes = 'Confirmed by doctor';
    saveDB(db);
    showToast('Appointment confirmed', 'success');
    addNotification(app.patientId, 'Appointment Confirmed', 'Your appointment has been confirmed by ' + user.name + '.', 'success');
  } else if (app.status === 'confirmed') {
    startConsultation(app);
    return;
  }
  const activeTab = document.querySelector('.sidebar-nav a.active');
  if (activeTab) showDoctorTab(activeTab.dataset.tab);
}

function startConsultation(app) {
  consultationPatientId = app.patientId;
  const db = getDB();
  const pat = db.patients.find(p => p.id === app.patientId);
  document.getElementById('consultPatientName').textContent = pat ? pat.name : 'Patient';
  document.getElementById('consultModal').classList.add('active');
  document.getElementById('consultNotes').value = '';
  app.status = 'in-progress';
  saveDB(db);
  addNotification(app.patientId, 'Consultation Started', 'Your consultation with ' + user.name + ' has started.', 'info');
}

function startConsultationById(appId) {
  const db = getDB();
  const app = db.appointments.find(a => a.id === appId);
  if (app) startConsultation(app);
  else showToast('Appointment not found', 'error');
}

function endConsultation() {
  const db = getDB();
  const app = db.appointments.find(a => a.patientId === consultationPatientId && a.doctorId === user.id && a.status === 'in-progress');
  if (app) {
    app.status = 'completed';
    app.notes = document.getElementById('consultNotes').value || app.notes;
    saveDB(db);
    showToast('Consultation completed', 'success');
    closeModal('consultModal');
    openPrescribeModal(consultationPatientId);
  } else {
    closeModal('consultModal');
    showToast('No active consultation found', 'error');
  }
  consultationPatientId = null;
}

// ─── Prescription Modal ────────────────────────────────

function openPrescribeModal(patientId) {
  const db = getDB();
  const modal = document.getElementById('prescribeModal');
  modal.classList.add('active');
  const sel = document.getElementById('rxPatient');
  sel.innerHTML = '<option value="">Select patient</option>';
  db.patients.sort((a, b) => a.name.localeCompare(b.name)).forEach(p => {
    sel.insertAdjacentHTML('beforeend', `<option value="${p.id}" ${p.id === patientId ? 'selected' : ''}>${p.name} (${p.email})</option>`);
  });
  document.getElementById('rxDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('rxDiagnosis').value = '';
  document.getElementById('rxNotes').value = '';
  document.getElementById('rxMedications').innerHTML = createMedRowHTML();
}

function createMedRowHTML() {
  return `<div class="rx-med-row" style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 40px;gap:8px;margin-bottom:8px;align-items:end;">
    <div class="form-group"><label>Medicine</label><input type="text" class="rxName" placeholder="Medicine name"></div>
    <div class="form-group"><label>Dosage</label><input type="text" class="rxDose" placeholder="e.g. 500mg"></div>
    <div class="form-group"><label>Frequency</label><input type="text" class="rxFreq" placeholder="e.g. BD"></div>
    <div class="form-group"><label>Duration</label><input type="text" class="rxDur" placeholder="e.g. 7 days"></div>
    <button class="btn btn-sm" style="background:#fee2e2;color:#dc2626;padding:10px;" onclick="this.parentElement.remove()">X</button>
  </div>`;
}

function addMedRow() {
  document.getElementById('rxMedications').insertAdjacentHTML('beforeend', createMedRowHTML());
}

function savePrescription() {
  const db = getDB();
  const patientId = document.getElementById('rxPatient').value;
  const date = document.getElementById('rxDate').value;
  const diagnosis = document.getElementById('rxDiagnosis').value.trim();
  const notes = document.getElementById('rxNotes').value.trim();
  if (!patientId || !diagnosis) return showToast('Please select patient and enter diagnosis', 'error');

  const medRows = document.querySelectorAll('#prescribeModal .rx-med-row');
  const medications = [];
  medRows.forEach(row => {
    const name = row.querySelector('.rxName').value.trim();
    const dose = row.querySelector('.rxDose').value.trim();
    const freq = row.querySelector('.rxFreq').value.trim();
    const dur = row.querySelector('.rxDur').value.trim();
    if (name) medications.push({ name, dosage: dose, frequency: freq, duration: dur });
  });
  if (medications.length === 0) return showToast('Add at least one medication', 'error');

  const pat = db.patients.find(p => p.id === patientId);
  const rx = {
    id: 'ZH-' + (++db.nextId),
    patientId,
    patientName: pat ? pat.name : 'Patient',
    doctorId: user.id,
    doctorName: user.name,
    date,
    diagnosis,
    medications,
    notes,
    createdAt: new Date().toISOString()
  };
  db.prescriptions.push(rx);

  medications.forEach(m => {
    const existing = db.medicines.find(x => x.name.toLowerCase() === m.name.toLowerCase());
    if (!existing) {
      db.medicines.push({ id: 'ZH-' + (++db.nextId), name: m.name, price: 0, stock: 100 });
    }
  });
  saveDB(db);

  closeModal('prescribeModal');
  showToast('Prescription generated successfully!', 'success');
}

// ─── Appointments Tab ──────────────────────────────────

function renderAppointments() {
  const db = getDB();
  const apps = db.appointments.filter(a => a.doctorId === user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  document.getElementById('pageContent').innerHTML = `
    <div class="tab-bar" style="display:flex;gap:4px;background:#f1f5f9;padding:4px;border-radius:var(--radius-sm);margin-bottom:24px;flex-wrap:wrap;">
      <button class="active" onclick="filterDocApps(this,'all')" style="padding:8px 20px;border:none;border-radius:6px;background:white;cursor:pointer;font-size:0.85rem;font-weight:500;color:var(--primary);box-shadow:var(--shadow);">All</button>
      <button onclick="filterDocApps(this,'pending')" style="padding:8px 20px;border:none;border-radius:6px;background:transparent;cursor:pointer;font-size:0.85rem;font-weight:500;color:var(--text-light);">Pending</button>
      <button onclick="filterDocApps(this,'confirmed')" style="padding:8px 20px;border:none;border-radius:6px;background:transparent;cursor:pointer;font-size:0.85rem;font-weight:500;color:var(--text-light);">Confirmed</button>
      <button onclick="filterDocApps(this,'completed')" style="padding:8px 20px;border:none;border-radius:6px;background:transparent;cursor:pointer;font-size:0.85rem;font-weight:500;color:var(--text-light);">Completed</button>
      <button onclick="filterDocApps(this,'cancelled')" style="padding:8px 20px;border:none;border-radius:6px;background:transparent;cursor:pointer;font-size:0.85rem;font-weight:500;color:var(--text-light);">Cancelled</button>
    </div>
    <div id="docAppsList">${buildAppointmentsTable(apps)}</div>
  `;
}

function buildAppointmentsTable(apps) {
  if (apps.length === 0) return '<div class="empty-state"><div class="empty-icon">&#128197;</div><h3>No appointments</h3></div>';
  const db = getDB();
  return `<div class="table-container"><table>
    <tr><th>Patient</th><th>Date</th><th>Time</th><th>Status</th><th>Action</th></tr>
    ${apps.map(a => {
      const pat = db.patients.find(p => p.id === a.patientId);
      return `<tr>
        <td><strong>${pat ? pat.name : 'Patient'}</strong></td>
        <td>${formatDate(a.date)}</td>
        <td>${a.time}</td>
        <td>${statusBadge(a.status)}</td>
        <td>${a.status === 'pending' ? `<button class="btn btn-sm btn-primary" onclick="handleAppointment('${a.id}')">Confirm</button>` : a.status === 'confirmed' ? `<button class="btn btn-sm btn-primary" onclick="startConsultationById('${a.id}')">Start</button>` : '—'}</td>
      </tr>`;
    }).join('')}
  </table></div>`;
}

function filterDocApps(btn, filter) {
  document.querySelectorAll('.tab-bar button').forEach(b => {
    b.classList.remove('active');
    Object.assign(b.style, { background: 'transparent', color: 'var(--text-light)', boxShadow: 'none' });
  });
  btn.classList.add('active');
  Object.assign(btn.style, { background: 'white', color: 'var(--primary)', boxShadow: 'var(--shadow)' });

  const db = getDB();
  let apps = db.appointments.filter(a => a.doctorId === user.id);
  if (filter !== 'all') apps = apps.filter(a => a.status === filter);
  apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  document.getElementById('docAppsList').innerHTML = buildAppointmentsTable(apps);
}

// ─── Patients Tab ──────────────────────────────────────

function renderPatients() {
  const db = getDB();
  const patientIds = [...new Set(db.appointments.filter(a => a.doctorId === user.id).map(a => a.patientId))];
  const patients = patientIds.map(id => db.patients.find(p => p.id === id)).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));

  document.getElementById('pageContent').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div class="section-title-sm" style="margin:0;">My Patients (${patients.length})</div>
    </div>
    ${patients.length === 0
      ? '<div class="empty-state"><div class="empty-icon">&#9787;</div><h3>No patients yet</h3></div>'
      : `<div class="doctor-grid">${patients.map(p => {
          const lastApp = db.appointments.filter(a => a.patientId === p.id && a.doctorId === user.id).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
          return `<div class="doctor-card">
            <div class="doc-avatar">${p.name.charAt(0)}</div>
            <h4>${p.name}</h4>
            <div class="doc-spec">${p.email}</div>
            <div class="doc-meta">
              ${p.bloodGroup ? `<span><strong>Blood:</strong> ${p.bloodGroup}</span>` : ''}
              <span>Last visit: ${lastApp ? formatDate(lastApp.date) : 'N/A'}</span>
            </div>
            <div class="doc-footer">
              <button class="btn btn-primary btn-sm" style="width:100%;justify-content:center;" onclick="openPrescribeModal('${p.id}')">Write Prescription</button>
            </div>
          </div>`;
        }).join('')}</div>`
    }
  `;
}

// ─── Consultation Tab ──────────────────────────────────

function renderConsultation() {
  const db = getDB();
  const ready = db.appointments.filter(a => a.doctorId === user.id && a.status === 'confirmed');
  document.getElementById('pageContent').innerHTML = `
    <div class="section-title-sm">Ready for Consultation</div>
    ${ready.length === 0
      ? '<div class="empty-state"><div class="empty-icon">&#9881;</div><h3>No pending consultations</h3><p>Confirm appointments first before starting consultation</p></div>'
      : `<div style="display:flex;flex-direction:column;gap:12px;">${ready.map(a => {
          const pat = db.patients.find(p => p.id === a.patientId);
          return `<div class="card" style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <h4>${pat ? pat.name : 'Patient'}</h4>
              <p class="text-sm text-muted">${formatDate(a.date)} at ${a.time} • ${statusBadge(a.status)}</p>
            </div>
            <button class="btn btn-primary" onclick="startConsultationById('${a.id}')">&#128252; Start</button>
          </div>`;
        }).join('')}</div>`
    }
  `;
}

// ─── Prescriptions Tab ─────────────────────────────────

function renderPrescriptions() {
  const db = getDB();
  const rxList = db.prescriptions.filter(p => p.doctorId === user.id).sort((a, b) => new Date(b.date) - new Date(a.date));
  document.getElementById('pageContent').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
      <div class="section-title-sm" style="margin:0;">Prescription History</div>
      <button class="btn btn-primary" onclick="openPrescribeModal('')">+ New Prescription</button>
    </div>
    ${rxList.length === 0
      ? '<div class="empty-state"><div class="empty-icon">&#9998;</div><h3>No prescriptions yet</h3></div>'
      : `<div class="table-container"><table>
        <tr><th>#</th><th>Patient</th><th>Date</th><th>Diagnosis</th><th>Medications</th><th>Action</th></tr>
        ${rxList.map(p => `<tr>
          <td><span class="text-sm text-muted">${p.id}</span></td>
          <td><strong>${p.patientName}</strong></td>
          <td>${formatDate(p.date)}</td>
          <td>${p.diagnosis}</td>
          <td>${p.medications.length} items</td>
          <td><button class="btn btn-sm btn-primary" onclick="printPrescription('${p.id}')">Print</button></td>
        </tr>`).join('')}
      </table></div>`
    }
  `;
}

function printPrescription(id) {
  const db = getDB();
  const rx = db.prescriptions.find(p => p.id === id);
  if (!rx) return showToast('Prescription not found', 'error');

  const pat = db.patients.find(p => p.id === rx.patientId);
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>Prescription - ${rx.id}</title>
    <style>
      body { font-family: 'Courier New', monospace; padding: 40px; max-width: 700px; margin: 0 auto; }
      .rx-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 24px; }
      .rx-header h2 { margin: 0; font-size: 1.4rem; }
      .rx-header p { margin: 4px 0 0; color: #555; font-size: 0.85rem; }
      .rx-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; font-size: 0.88rem; }
      .rx-meta .label { font-weight: 600; }
      .rx-meta .value { color: #555; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      th, td { border: 1px solid #333; padding: 8px 12px; font-size: 0.85rem; text-align: left; }
      th { background: #f5f5f5; }
      .rx-footer { margin-top: 24px; display: flex; justify-content: space-between; font-size: 0.85rem; }
      .rx-signature { text-align: right; }
      .rx-signature .line { width: 200px; height: 1px; background: #333; margin: 30px 0 4px auto; }
      .notes { margin-top: 20px; padding: 12px; background: #f9f9f9; border-radius: 6px; font-size: 0.85rem; }
      @media print { body { padding: 20px; } }
    </style></head><body>
      <div class="rx-header">
        <h2>ZEESHAN HOSPITAL</h2>
        <p>Medical Prescription</p>
      </div>
      <div class="rx-meta">
        <div><span class="label">Patient:</span> <span class="value">${rx.patientName}</span></div>
        <div><span class="label">Date:</span> <span class="value">${formatDate(rx.date)}</span></div>
        <div><span class="label">Doctor:</span> <span class="value">${rx.doctorName}</span></div>
        <div><span class="label">Patient ID:</span> <span class="value">${rx.patientId}</span></div>
      </div>
      <div style="margin-bottom:12px;"><span class="label">Diagnosis:</span> ${rx.diagnosis}</div>
      <table>
        <tr><th>#</th><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr>
        ${rx.medications.map((m, i) => `<tr><td>${i+1}</td><td>${m.name}</td><td>${m.dosage}</td><td>${m.frequency}</td><td>${m.duration}</td></tr>`).join('')}
      </table>
      ${rx.notes ? `<div class="notes"><strong>Notes:</strong><br>${rx.notes}</div>` : ''}
      <div class="rx-footer">
        <div></div>
        <div class="rx-signature">
          <div>________________________</div>
          <div style="font-weight:600;">${rx.doctorName}</div>
          <div class="text-sm">${pat ? user.spec : ''}</div>
        </div>
      </div>
    </body></html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 300);
}

// ─── Profile Tab ───────────────────────────────────────

function renderProfile() {
  document.getElementById('pageContent').innerHTML = `
    <div style="max-width:560px;">
      <div class="profile-section">
        <div class="profile-cover"></div>
        <div class="profile-info">
          <div class="profile-avatar-lg">${user.name.charAt(0)}</div>
          <div class="profile-name">${user.name}</div>
          <div class="profile-role">${user.spec}</div>
          <div class="profile-meta">
            <div class="profile-meta-item">
              <span class="meta-label">License</span>
              <span class="meta-value">${user.license || 'N/A'}</span>
            </div>
            <div class="profile-meta-item">
              <span class="meta-label">Email</span>
              <span class="meta-value">${user.email}</span>
            </div>
            <div class="profile-meta-item">
              <span class="meta-label">Qualification</span>
              <span class="meta-value">${user.qualification || 'N/A'}</span>
            </div>
            <div class="profile-meta-item">
              <span class="meta-label">Experience</span>
              <span class="meta-value">${user.experience || 0} years</span>
            </div>
          </div>
        </div>
      </div>
      <div class="card" style="margin-top:20px;">
        <div class="form-group"><label>Full Name</label><input class="form-control" type="text" value="${user.name}" disabled></div>
        <div class="form-group"><label>Specialty</label><input class="form-control" type="text" value="${user.spec}" disabled></div>
        <div class="form-group"><label>License #</label><input class="form-control" type="text" value="${user.license || ''}" disabled></div>
        <div class="form-group"><label>Email</label><input class="form-control" type="text" value="${user.email}" disabled></div>
      </div>
    </div>
  `;
}

// (init called from HTML after dbPromise resolves)
