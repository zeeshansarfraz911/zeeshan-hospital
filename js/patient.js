// ---------- Patient Portal ----------
let user = getCurrentUser();
const role = getCurrentRole();

if (!user || role !== 'patient') {
  window.location.href = 'index.html';
}

const SPECIALTIES = [
  'General Medicine', 'Cardiology', 'Dermatology', 'Pediatrics', 'Gynecology',
  'Orthopedics', 'Neurology', 'Psychiatry', 'Ophthalmology', 'ENT', 'Dentistry', 'Urology'
];

function initPatient() {
  document.getElementById('sidebarAvatar').textContent = user.name.charAt(0);
  document.getElementById('sidebarName').textContent = user.name;
  document.getElementById('sidebarEmail').textContent = user.email;

  document.querySelectorAll('.sidebar-nav a[data-tab]').forEach(a => {
    a.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelectorAll('.sidebar-nav a').forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      showPatientTab(this.dataset.tab);
      if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
    });
  });

  showPatientTab('dashboard');
}

function showPatientTab(tab) {
  const titles = {
    dashboard: 'Dashboard', doctors: 'Find Doctors', appointments: 'My Appointments',
    prescriptions: 'My Prescriptions', lab: 'Lab Tests', records: 'Medical Records',
    pharmacy: 'Order Medicine', profile: 'My Profile'
  };
  document.getElementById('pageTitle').textContent = titles[tab] || 'Dashboard';
  document.getElementById('pageSubtitle').textContent = 'Manage your healthcare journey';

  const fns = {
    dashboard: renderPatientDashboard,
    doctors: renderDoctors,
    appointments: renderPatientAppointments,
    prescriptions: renderPatientPrescriptions,
    lab: renderPatientLab,
    records: renderMedicalRecords,
    pharmacy: renderPatientPharmacy,
    profile: renderPatientProfile
  };
  if (fns[tab]) fns[tab]();
}

function getBadgeForStatus(status) {
  const map = {
    pending: 'badge-amber', confirmed: 'badge-green', completed: 'badge-blue',
    cancelled: 'badge-red', collected: 'badge-blue', 'in-progress': 'badge-blue'
  };
  return map[status] || 'badge-amber';
}

// ----- Dashboard -----
function renderPatientDashboard() {
  const db = getDB();
  const myApps = db.appointments.filter(a => a.patientId === user.id);
  const myRx = db.prescriptions.filter(p => p.patientId === user.id);
  const myTests = db.labTests.filter(t => t.patientId === user.id);
  const upcomingApps = myApps.filter(a => a.status === 'pending' || a.status === 'confirmed');
  const pendingResults = myTests.filter(t => t.status === 'pending' || t.status === 'collected');

  document.getElementById('pageContent').innerHTML = `
    <div class="dash-cards">
      <div class="dash-card">
        <div class="card-top">
          <div class="dash-card-label">Upcoming Appointments</div>
          <div class="card-icon green-bg">&#128197;</div>
        </div>
        <div class="dash-card-value green">${upcomingApps.length}</div>
      </div>
      <div class="dash-card">
        <div class="card-top">
          <div class="dash-card-label">Prescriptions</div>
          <div class="card-icon blue-bg">&#9998;</div>
        </div>
        <div class="dash-card-value blue">${myRx.length}</div>
      </div>
      <div class="dash-card">
        <div class="card-top">
          <div class="dash-card-label">Lab Tests</div>
          <div class="card-icon amber-bg">&#9776;</div>
        </div>
        <div class="dash-card-value amber">${myTests.length}</div>
      </div>
      <div class="dash-card">
        <div class="card-top">
          <div class="dash-card-label">Pending Results</div>
          <div class="card-icon red-bg">&#9888;</div>
        </div>
        <div class="dash-card-value red">${pendingResults.length}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <div>
        <div class="section-title-sm">Quick Actions</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="service-card" onclick="showPatientTab('doctors')" style="cursor:pointer;padding:20px;">
            <div class="service-icon" style="width:44px;height:44px;font-size:1.2rem;background:#dbeafe;color:#2563eb;">&#9881;</div>
            <h3 style="font-size:.95rem;">Book Appointment</h3>
          </div>
          <div class="service-card" onclick="showPatientTab('lab')" style="cursor:pointer;padding:20px;">
            <div class="service-icon" style="width:44px;height:44px;font-size:1.2rem;background:#d1fae5;color:#059669;">&#9776;</div>
            <h3 style="font-size:.95rem;">Book Lab Test</h3>
          </div>
          <div class="service-card" onclick="showPatientTab('pharmacy')" style="cursor:pointer;padding:20px;">
            <div class="service-icon" style="width:44px;height:44px;font-size:1.2rem;background:#fef3c7;color:#d97706;">&#9766;</div>
            <h3 style="font-size:.95rem;">Order Medicine</h3>
          </div>
          <div class="service-card" onclick="showPatientTab('prescriptions')" style="cursor:pointer;padding:20px;">
            <div class="service-icon" style="width:44px;height:44px;font-size:1.2rem;background:#fce7f3;color:#db2777;">&#9998;</div>
            <h3 style="font-size:.95rem;">View Prescriptions</h3>
          </div>
        </div>
      </div>
      <div>
        <div class="section-title-sm">Upcoming Appointments</div>
        ${upcomingApps.length === 0
          ? '<div class="empty-state"><div class="empty-icon">&#128197;</div><h3>No upcoming appointments</h3><p>Book your first appointment today</p></div>'
          : `<div style="display:flex;flex-direction:column;gap:12px;">${upcomingApps.slice(0, 5).map(a => {
            const doc = db.doctors.find(d => d.id === a.doctorId);
            return `<div style="background:white;border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px;display:flex;justify-content:space-between;align-items:center;">
              <div><strong>${doc ? doc.name : 'Doctor'}</strong><br><span style="font-size:.85rem;color:var(--text-light);">${formatDate(a.date)} at ${a.time}</span></div>
              <span class="badge ${getBadgeForStatus(a.status)}">${a.status}</span>
            </div>`;
          }).join('')}</div>`
        }
      </div>
    </div>
  `;
}

// ----- Find Doctors -----
function renderDoctors() {
  const db = getDB();
  document.getElementById('pageContent').innerHTML = `
    <div class="dash-header-left" style="margin-bottom:20px;">
      <h2>Find a Specialist</h2>
      <p>Browse our doctors and book an appointment</p>
    </div>
    <div class="form-group" style="max-width:300px;">
      <label>Filter by Specialty</label>
      <select id="specFilter" onchange="renderDoctorGrid()" class="form-control">
        <option value="">All Specialties</option>
        ${SPECIALTIES.map(s => `<option value="${s}">${s}</option>`).join('')}
      </select>
    </div>
    <div id="doctorList" class="doctor-grid"></div>
  `;
  renderDoctorGrid();
}

function renderDoctorGrid() {
  const db = getDB();
  const filter = document.getElementById('specFilter').value;
  let docs = db.doctors;
  if (filter) docs = docs.filter(d => d.spec === filter);
  const list = document.getElementById('doctorList');
  if (docs.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">&#9881;</div><h3>No doctors found</h3><p>Try a different specialty filter</p></div>';
    return;
  }
  const today = new Date().toISOString().split('T')[0];
  const slots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'];
  list.innerHTML = docs.map(d => `
    <div class="doctor-card">
      <div class="doc-avatar">${d.name.charAt(0)}</div>
      <h4>${d.name}</h4>
      <div class="doc-spec">${d.spec}</div>
      <div class="doc-meta">
        <span>&#128220; License: ${d.license}</span>
        <span>&#127891; ${d.qualification}</span>
        <span>&#128197; ${d.experience} years experience</span>
        <span>&#128176; Fee: Rs. ${d.consultationFee}</span>
      </div>
      <div class="form-group">
        <label style="font-size:.8rem;">Select Date</label>
        <input type="date" id="date_${d.id}" value="${today}" min="${today}" class="form-control" style="padding:8px;font-size:.85rem;">
      </div>
      <div class="form-group">
        <label style="font-size:.8rem;">Select Time</label>
        <select id="time_${d.id}" class="form-control" style="padding:8px;font-size:.85rem;">
          ${slots.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-primary btn-sm" style="width:100%;justify-content:center;" onclick="bookAppointment('${d.id}')">Book Appointment</button>
    </div>
  `).join('');
}

function bookAppointment(docId) {
  const db = getDB();
  const date = document.getElementById('date_' + docId).value;
  const time = document.getElementById('time_' + docId).value;
  if (!date || !time) return showToast('Please select date and time', 'error');
  if (date < new Date().toISOString().split('T')[0]) return showToast('Cannot book appointment in the past', 'error');
  const app = {
    id: genId(),
    patientId: user.id,
    patientName: user.name,
    doctorId: docId,
    date, time,
    status: 'pending',
    type: 'video',
    notes: '',
    createdAt: new Date().toISOString()
  };
  db.appointments.push(app);
  saveDB(db);
  showToast('Appointment booked successfully!', 'success');
}

// ----- My Appointments -----
function renderPatientAppointments() {
  const db = getDB();
  document.getElementById('pageContent').innerHTML = `
    <div class="dash-header-left" style="margin-bottom:20px;">
      <h2>My Appointments</h2>
      <p>Manage your appointments and bookings</p>
    </div>
    <div class="tab-bar">
      <button class="active" onclick="filterPatientApps(this,'all')">All</button>
      <button onclick="filterPatientApps(this,'pending')">Pending</button>
      <button onclick="filterPatientApps(this,'confirmed')">Confirmed</button>
      <button onclick="filterPatientApps(this,'completed')">Completed</button>
      <button onclick="filterPatientApps(this,'cancelled')">Cancelled</button>
    </div>
    <div id="appsList"></div>
  `;
  filterPatientApps(document.querySelector('.tab-bar .active'), 'all');
}

function filterPatientApps(btn, filter) {
  document.querySelectorAll('.tab-bar button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const db = getDB();
  let apps = db.appointments.filter(a => a.patientId === user.id);
  if (filter !== 'all') apps = apps.filter(a => a.status === filter);
  apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const el = document.getElementById('appsList');
  if (apps.length === 0) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128197;</div><h3>No appointments found</h3><p>No appointments match the selected filter</p></div>';
    return;
  }
  el.innerHTML = `<div class="table-container"><table>
    <thead><tr><th>Doctor</th><th>Specialty</th><th>Date</th><th>Time</th><th>Status</th><th>Action</th></tr></thead>
    <tbody>${apps.map(a => {
      const doc = db.doctors.find(d => d.id === a.doctorId);
      return `<tr>
        <td><strong>${doc ? doc.name : 'N/A'}</strong></td>
        <td>${doc ? doc.spec : 'N/A'}</td>
        <td>${formatDate(a.date)}</td>
        <td>${a.time}</td>
        <td><span class="badge ${getBadgeForStatus(a.status)}">${a.status}</span></td>
        <td>${a.status === 'pending' || a.status === 'confirmed' ? `<button class="btn btn-sm" style="background:#fee2e2;color:#dc2626;" onclick="cancelAppointment('${a.id}')">Cancel</button>` : '—'}</td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

function cancelAppointment(id) {
  const db = getDB();
  const app = db.appointments.find(a => a.id === id);
  if (!app) return showToast('Appointment not found', 'error');
  app.status = 'cancelled';
  saveDB(db);
  showToast('Appointment cancelled successfully', 'success');
  const activeBtn = document.querySelector('.tab-bar .active') || document.querySelector('.tab-bar button');
  filterPatientApps(activeBtn, activeBtn.textContent.toLowerCase());
}

// ----- Prescriptions -----
function renderPatientPrescriptions() {
  const db = getDB();
  const rx = db.prescriptions.filter(p => p.patientId === user.id).sort((a, b) => new Date(b.date) - new Date(a.date));
  document.getElementById('pageContent').innerHTML = `
    <div class="dash-header-left" style="margin-bottom:20px;">
      <h2>My Prescriptions</h2>
      <p>View and print your prescriptions</p>
    </div>
    ${rx.length === 0
      ? '<div class="empty-state"><div class="empty-icon">&#9998;</div><h3>No prescriptions yet</h3><p>Your doctor will issue prescriptions after consultation</p></div>'
      : `<div style="display:flex;flex-direction:column;gap:16px;">${rx.map(p => {
        const doc = db.doctors.find(d => d.id === p.doctorId);
        return `<div class="card" style="padding:24px;">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
            <div>
              <strong style="font-size:1.05rem;">${doc ? doc.name : 'Doctor'}</strong>
              <span style="color:var(--text-light);font-size:.85rem;"> • ${doc ? doc.spec : ''}</span>
            </div>
            <div style="text-align:right;">
              <span style="font-size:.85rem;color:var(--text-light);">${formatDate(p.date)}</span>
              <br><span class="badge badge-green">#${p.id}</span>
            </div>
          </div>
          <p style="font-size:.9rem;margin-bottom:12px;"><strong>Diagnosis:</strong> ${p.diagnosis}</p>
          <div style="background:var(--bg);border-radius:var(--radius-sm);padding:12px;margin-bottom:12px;">
            <table style="width:100%;font-size:.85rem;">
              <thead><tr><th style="background:transparent;padding:6px 8px;font-size:.75rem;">Medicine</th><th style="background:transparent;padding:6px 8px;font-size:.75rem;">Dosage</th><th style="background:transparent;padding:6px 8px;font-size:.75rem;">Frequency</th><th style="background:transparent;padding:6px 8px;font-size:.75rem;">Duration</th></tr></thead>
              <tbody>${p.medications.map(m => `<tr><td style="padding:4px 8px;"><strong>${m.name}</strong></td><td style="padding:4px 8px;">${m.dosage}</td><td style="padding:4px 8px;">${m.frequency}</td><td style="padding:4px 8px;">${m.duration}</td></tr>`).join('')}</tbody>
            </table>
          </div>
          ${p.notes ? `<p style="font-size:.85rem;color:var(--text-light);margin-bottom:12px;"><strong>Notes:</strong> ${p.notes}</p>` : ''}
          <div class="prescription-actions" style="display:flex;gap:8px;padding-top:12px;border-top:1px solid var(--border-light);">
            <button class="btn btn-primary btn-sm" onclick="downloadPrescriptionPDF('${p.id}')">&#128196; Download PDF</button>
            <button class="btn btn-outline btn-sm" onclick="printPrescription('${p.id}')">&#128424; Print</button>
          </div>
        </div>`;
      }).join('')}</div>`
    }
  `;
}

function downloadPrescriptionPDF(id) {
  const db = getDB();
  const p = db.prescriptions.find(rx => rx.id === id);
  if (!p) return showToast('Prescription not found', 'error');
  const doc = db.doctors.find(d => d.id === p.doctorId);
  openPrintWindow(p, doc);
}

function printPrescription(id) {
  const db = getDB();
  const p = db.prescriptions.find(rx => rx.id === id);
  if (!p) return showToast('Prescription not found', 'error');
  const doc = db.doctors.find(d => d.id === p.doctorId);
  openPrintWindow(p, doc);
}

function openPrintWindow(p, doc) {
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>Prescription - ${p.id}</title>
    <style>
      body { font-family: 'Courier New', monospace; padding: 40px; max-width: 700px; margin: 0 auto; color: #000; }
      .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 24px; }
      .header h1 { font-size: 1.4rem; margin: 0; }
      .header p { margin: 4px 0; font-size: .85rem; color: #555; }
      .info { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: .9rem; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      th, td { border: 1px solid #000; padding: 8px 12px; text-align: left; font-size: .9rem; }
      th { background: #f0f0f0; }
      .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: .85rem; }
      .signature { border-top: 1px solid #000; padding-top: 4px; margin-top: 40px; text-align: right; }
      @media print { body { padding: 20px; } }
    </style></head><body>
    <div class="header">
      <h1>ZEESHAN HOSPITAL</h1>
      <p>Complete Healthcare Ecosystem</p>
      <p>Karachi, Pakistan | Tel: +92 300 1234567</p>
    </div>
    <div class="info">
      <div><strong>Patient:</strong> ${p.patientName}<br><strong>ID:</strong> ${p.patientId}</div>
      <div style="text-align:right;"><strong>Prescription #:</strong> ${p.id}<br><strong>Date:</strong> ${formatDate(p.date)}</div>
    </div>
    <p><strong>Diagnosis:</strong> ${p.diagnosis}</p>
    <table>
      <tr><th>#</th><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr>
      ${p.medications.map((m, i) => `<tr><td>${i+1}</td><td>${m.name}</td><td>${m.dosage}</td><td>${m.frequency}</td><td>${m.duration}</td></tr>`).join('')}
    </table>
    ${p.notes ? `<p><strong>Notes:</strong> ${p.notes}</p>` : ''}
    <div class="footer">
      <div>Prescribed by: <strong>${doc ? doc.name : 'Doctor'}</strong><br>${doc ? doc.spec : ''} | License: ${doc ? doc.license : 'N/A'}</div>
    </div>
    <div class="signature">________________________<br>Doctor's Signature</div>
    <p style="text-align:center;margin-top:30px;font-size:.75rem;color:#999;">This is a computer-generated prescription</p>
    <script>window.print();<\/script>
  </body></html>`);
  w.document.close();
}

// ----- Lab Tests -----
function renderPatientLab() {
  const db = getDB();
  const myTests = db.labTests.filter(t => t.patientId === user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  document.getElementById('pageContent').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
      <div class="dash-header-left" style="margin:0;">
        <h2>Lab Tests</h2>
        <p>Book tests and view your results</p>
      </div>
      <button class="btn btn-primary" onclick="showBookTest()">+ Book New Test</button>
    </div>
    <div class="section-title-sm">My Lab Tests</div>
    <div id="labTestsList">
      ${myTests.length === 0
        ? '<div class="empty-state"><div class="empty-icon">&#9776;</div><h3>No lab tests yet</h3><p>Book a lab test or request home blood collection</p></div>'
        : `<div class="table-container"><table>
          <thead><tr><th>Test</th><th>Date</th><th>Status</th><th>Type</th><th>Result</th></tr></thead>
          <tbody>${myTests.map(t => {
            const tt = db.testTypes.find(x => x.id === t.testTypeId);
            return `<tr>
              <td><strong>${tt ? tt.name : 'Test'}</strong></td>
              <td>${formatDate(t.createdAt)}</td>
              <td><span class="badge ${getBadgeForStatus(t.status)}">${t.status}</span></td>
              <td>${t.isHomeCollection ? '<span class="badge badge-green">Home Collection</span>' : '<span class="badge badge-blue">At Lab</span>'}</td>
              <td>${t.status === 'completed' && t.result ? `<button class="btn btn-sm btn-primary" onclick="viewTestResult('${t.id}')">View</button>` : '<span style="color:var(--text-lighter);font-size:.85rem;">Pending</span>'}</td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>`
      }
    </div>
  `;
}

function showBookTest() {
  const db = getDB();
  if (!db.testTypes || db.testTypes.length === 0) return showToast('No test types available', 'error');
  const html = `
    <div class="modal active" id="bookTestModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Book New Lab Test</h3>
          <button class="modal-close" onclick="closeModal('bookTestModal')">&times;</button>
        </div>
        <div class="form-group">
          <label>Select Test Type</label>
          <select id="testTypeSelect" class="form-control">
            ${db.testTypes.map(t => `<option value="${t.id}">${t.name} - Rs. ${t.price}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="display:flex;align-items:center;gap:8px;">
          <input type="checkbox" id="homeCollectCheck" style="width:auto;height:18px;accent-color:var(--primary);">
          <label for="homeCollectCheck" style="margin:0;font-weight:500;">Request Home Blood Collection (+ Rs. 200)</label>
        </div>
        <div id="homeCollectFields" style="display:none;">
          <div class="form-group">
            <label>Home Address</label>
            <textarea id="homeAddress" class="form-control" rows="2" placeholder="Enter your full address for collection"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Preferred Date</label>
              <input type="date" id="collectDate" class="form-control">
            </div>
            <div class="form-group">
              <label>Preferred Time</label>
              <select id="collectTime" class="form-control">
                <option value="09:00-11:00">9:00 AM - 11:00 AM</option>
                <option value="11:00-13:00">11:00 AM - 1:00 PM</option>
                <option value="14:00-16:00">2:00 PM - 4:00 PM</option>
                <option value="16:00-18:00">4:00 PM - 6:00 PM</option>
              </select>
            </div>
          </div>
        </div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="bookLabTest()">Book Test</button>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('homeCollectCheck').addEventListener('change', function() {
    const fields = document.getElementById('homeCollectFields');
    if (fields) fields.style.display = this.checked ? 'block' : 'none';
  });
}

function bookLabTest() {
  const db = getDB();
  const testTypeId = document.getElementById('testTypeSelect').value;
  const isHome = document.getElementById('homeCollectCheck').checked;
  if (isHome) {
    const addr = document.getElementById('homeAddress').value.trim();
    const date = document.getElementById('collectDate').value;
    if (!addr) return showToast('Please enter your home address', 'error');
    if (!date) return showToast('Please select a collection date', 'error');
  }
  const test = {
    id: genId(),
    patientId: user.id,
    patientName: user.name,
    testTypeId,
    isHomeCollection: isHome,
    status: 'pending',
    result: null,
    homeAddress: isHome ? document.getElementById('homeAddress').value.trim() : '',
    preferredDate: isHome ? document.getElementById('collectDate').value : '',
    preferredTime: isHome ? document.getElementById('collectTime').value : '',
    createdAt: new Date().toISOString()
  };
  db.labTests.push(test);
  saveDB(db);
  closeModal('bookTestModal');
  showToast('Lab test booked successfully!', 'success');
  renderPatientLab();
}

function viewTestResult(id) {
  const db = getDB();
  const t = db.labTests.find(x => x.id === id);
  if (!t || !t.result) return showToast('Result not available', 'error');
  const tt = db.testTypes.find(x => x.id === t.testTypeId);
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>Lab Result - ${t.id}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; max-width: 700px; margin: 0 auto; }
      .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 24px; }
      .header h1 { color: #0d9488; margin: 0; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      th, td { border: 1px solid #ddd; padding: 10px 14px; text-align: left; }
      th { background: #f0fdfa; }
    </style></head><body>
    <div class="header"><h1>ZEESHAN HOSPITAL - LABORATORY</h1><p>Diagnostic Test Result</p></div>
    <p><strong>Patient:</strong> ${t.patientName} (${t.patientId})</p>
    <p><strong>Test:</strong> ${tt ? tt.name : 'N/A'}</p>
    <p><strong>Date:</strong> ${formatDate(t.createdAt)}</p>
    <p><strong>Status:</strong> Completed</p>
    <hr>
    <div style="margin-top:20px;">${t.result}</div>
    <p style="text-align:center;margin-top:40px;font-size:.8rem;color:#999;">Generated by Zeeshan Hospital System</p>
    <script>window.print();<\/script>
  </body></html>`);
  w.document.close();
}

// ----- Medical Records -----
function renderMedicalRecords() {
  const db = getDB();
  const rx = db.prescriptions.filter(p => p.patientId === user.id).sort((a, b) => new Date(b.date) - new Date(a.date));
  const tests = db.labTests.filter(t => t.patientId === user.id && t.status === 'completed').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  document.getElementById('pageContent').innerHTML = `
    <div class="dash-header-left" style="margin-bottom:20px;">
      <h2>Medical Records</h2>
      <p>All your health records in one place</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <div class="card" style="padding:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h4>Recent Prescriptions</h4>
          <span class="badge badge-blue">${rx.length} total</span>
        </div>
        ${rx.length === 0
          ? '<div class="empty-state" style="padding:30px 20px;"><div class="empty-icon">&#9998;</div><h3>No prescriptions</h3><p style="font-size:.85rem;">Your prescriptions will appear here</p></div>'
          : `<div style="display:flex;flex-direction:column;gap:8px;">${rx.slice(0, 8).map(p => {
            const doc = db.doctors.find(d => d.id === p.doctorId);
            return `<div style="background:var(--bg);border:1px solid var(--border-light);border-radius:var(--radius-sm);padding:12px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <strong style="font-size:.9rem;">${formatDate(p.date)}</strong>
                <span class="badge badge-green" style="font-size:.65rem;">${p.id}</span>
              </div>
              <p style="font-size:.82rem;color:var(--text-light);margin-bottom:8px;">${doc ? doc.name : 'Doctor'} • ${p.diagnosis}</p>
              <button class="btn btn-sm btn-primary" onclick="printPrescription('${p.id}')" style="font-size:.75rem;">View</button>
            </div>`;
          }).join('')}</div>`
        }
      </div>
      <div class="card" style="padding:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h4>Lab Results</h4>
          <span class="badge badge-blue">${tests.length} total</span>
        </div>
        ${tests.length === 0
          ? '<div class="empty-state" style="padding:30px 20px;"><div class="empty-icon">&#9776;</div><h3>No lab results</h3><p style="font-size:.85rem;">Completed lab test results will appear here</p></div>'
          : `<div style="display:flex;flex-direction:column;gap:8px;">${tests.slice(0, 8).map(t => {
            const tt = db.testTypes.find(x => x.id === t.testTypeId);
            return `<div style="background:var(--bg);border:1px solid var(--border-light);border-radius:var(--radius-sm);padding:12px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <strong style="font-size:.9rem;">${tt ? tt.name : 'Test'}</strong>
                <span class="badge badge-green" style="font-size:.65rem;">Completed</span>
              </div>
              <p style="font-size:.82rem;color:var(--text-light);margin-bottom:8px;">${formatDate(t.createdAt)}</p>
              <button class="btn btn-sm btn-primary" onclick="viewTestResult('${t.id}')" style="font-size:.75rem;">View Result</button>
            </div>`;
          }).join('')}</div>`
        }
      </div>
    </div>
  `;
}

// ----- Pharmacy / Order Medicine -----
function renderPatientPharmacy() {
  const db = getDB();
  const availMeds = db.medicines.filter(m => m.stock > 0);
  const orders = db.prescriptions.filter(p => p.patientId === user.id && p.medications.length > 0).slice(0, 5);
  document.getElementById('pageContent').innerHTML = `
    <div class="dash-header-left" style="margin-bottom:20px;">
      <h2>Order Medicine</h2>
      <p>Browse our pharmacy catalog and place orders</p>
    </div>
    <div class="section-title-sm">Available Medicines (${availMeds.length})</div>
    ${availMeds.length === 0
      ? '<div class="empty-state"><div class="empty-icon">&#9766;</div><h3>No medicines available</h3><p>Check back later for stock updates</p></div>'
      : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;margin-bottom:32px;">
        ${availMeds.map(m => `
          <div class="card" style="padding:20px;text-align:center;">
            <div style="font-size:2.2rem;margin-bottom:8px;opacity:0.7;">&#9766;</div>
            <h4 style="font-size:1rem;margin-bottom:4px;">${m.name}</h4>
            <p style="font-size:.78rem;color:var(--text-lighter);margin-bottom:4px;">${m.manufacturer}</p>
            <div style="font-size:1.3rem;font-weight:700;color:var(--primary);margin:8px 0;">Rs. ${m.price}</div>
            <p style="font-size:.78rem;margin-bottom:12px;">
              <span class="badge ${m.stock > 50 ? 'badge-green' : 'badge-amber'}">Stock: ${m.stock}</span>
            </p>
            <button class="btn btn-primary btn-sm" style="width:100%;justify-content:center;" onclick="orderMedicine('${m.id}')">Order Now</button>
          </div>
        `).join('')}
      </div>`
    }
    <div class="section-title-sm">Recent Orders</div>
    ${orders.length === 0
      ? '<p style="color:var(--text-lighter);font-size:.9rem;">No order history yet</p>'
      : `<div class="table-container"><table>
        <thead><tr><th>Prescription</th><th>Doctor</th><th>Date</th><th>Items</th></tr></thead>
        <tbody>${orders.map(o => {
          const doc = db.doctors.find(d => d.id === o.doctorId);
          return `<tr><td><strong>#${o.id}</strong></td><td>${doc ? doc.name : 'N/A'}</td><td>${formatDate(o.date)}</td><td>${o.medications.length} medicines</td></tr>`;
        }).join('')}</tbody>
      </table></div>`
    }
  `;
}

function orderMedicine(medId) {
  const db = getDB();
  const med = db.medicines.find(m => m.id === medId);
  if (!med) return showToast('Medicine not found', 'error');
  if (med.stock <= 0) return showToast('Medicine is out of stock', 'error');
  if (!window.confirm(`Order ${med.name} (Rs. ${med.price})?`)) return;
  med.stock--;
  saveDB(db);
  showToast(`Ordered ${med.name}. Pharmacy will process your order.`, 'success');
  renderPatientPharmacy();
}

// ----- Profile -----
function renderPatientProfile() {
  document.getElementById('pageContent').innerHTML = `
    <div class="dash-header-left" style="margin-bottom:20px;">
      <h2>My Profile</h2>
      <p>Update your personal information</p>
    </div>
    <div style="max-width:600px;">
      <div class="card" style="padding:32px;">
        <div style="text-align:center;margin-bottom:28px;">
          <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--primary-light));color:white;display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:700;margin:0 auto 12px;">${user.name.charAt(0)}</div>
          <h3>${user.name}</h3>
          <p style="color:var(--text-light);font-size:.9rem;">${user.email}</p>
        </div>
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" id="profName" class="form-control" value="${user.name}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Phone Number</label>
            <input type="text" id="profPhone" class="form-control" value="${user.phone || ''}" placeholder="+92 XXX XXXXXXX">
          </div>
          <div class="form-group">
            <label>Date of Birth</label>
            <input type="date" id="profDob" class="form-control" value="${user.dob || ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Blood Group</label>
            <select id="profBlood" class="form-control">
              <option value="">Select Blood Group</option>
              ${['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => `<option value="${g}" ${user.bloodGroup === g ? 'selected' : ''}>${g}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Gender</label>
            <select id="profGender" class="form-control">
              <option value="">Select Gender</option>
              <option value="Male" ${user.gender === 'Male' ? 'selected' : ''}>Male</option>
              <option value="Female" ${user.gender === 'Female' ? 'selected' : ''}>Female</option>
              <option value="Other" ${user.gender === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Address</label>
          <textarea id="profAddr" class="form-control" rows="2" placeholder="Enter your address">${user.address || ''}</textarea>
        </div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="updateProfile()">Update Profile</button>
      </div>
    </div>
  `;
}

function updateProfile() {
  const db = getDB();
  const u = db.patients.find(p => p.id === user.id);
  if (!u) return showToast('User not found', 'error');
  const name = document.getElementById('profName').value.trim();
  if (!name) return showToast('Name is required', 'error');
  u.name = name;
  u.phone = document.getElementById('profPhone').value.trim();
  u.dob = document.getElementById('profDob').value;
  u.bloodGroup = document.getElementById('profBlood').value;
  u.gender = document.getElementById('profGender').value;
  u.address = document.getElementById('profAddr').value.trim();
  saveDB(db);
  user = u;
  localStorage.setItem('zh_user', JSON.stringify(u));
  document.getElementById('sidebarName').textContent = u.name;
  document.getElementById('sidebarAvatar').textContent = u.name.charAt(0);
  showToast('Profile updated successfully', 'success');
}

// ---------- Init ----------
// (init called from HTML after dbPromise resolves)
