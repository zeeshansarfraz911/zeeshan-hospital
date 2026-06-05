// ---------- Lab / Testing Facility Portal ----------
let user = getCurrentUser();
const role = getCurrentRole();

if (!user || role !== 'lab') {
  window.location.href = 'index.html';
}

function initLab() {
  document.getElementById('sidebarAvatar').textContent = getInitials(user.name);
  document.getElementById('sidebarName').textContent = user.name;
  document.getElementById('sidebarEmail').textContent = user.email;

  document.querySelectorAll('.sidebar-nav a[data-tab]').forEach(a => {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelectorAll('.sidebar-nav a').forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      showLabTab(this.dataset.tab);
      if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
    });
  });

  showLabTab('dashboard');
}

function showLabTab(tab) {
  const titles = {
    dashboard: 'Dashboard', requests: 'Test Requests',
    homeCollection: 'Home Collection', results: 'Upload Results',
    patients: 'Patients', profile: 'Profile'
  };
  document.getElementById('pageTitle').textContent = titles[tab] || 'Dashboard';
  document.getElementById('pageSubtitle').textContent = 'Manage diagnostic testing';

  const fns = {
    dashboard: renderLabDashboard,
    requests: renderLabRequests,
    homeCollection: renderHomeCollection,
    results: renderUploadResults,
    patients: renderLabPatients,
    profile: renderLabProfile
  };
  if (fns[tab]) fns[tab]();
}

function getPatientName(db, id) {
  const p = db.patients.find(x => x.id === id);
  return p ? p.name : 'Unknown Patient';
}

function getTestName(db, id) {
  const t = db.testTypes.find(x => x.id === id);
  return t ? t.name : 'Unknown Test';
}

function getTestType(db, id) {
  return db.testTypes.find(x => x.id === id);
}

function getPatient(db, id) {
  return db.patients.find(p => p.id === id);
}

function typeBadge(isHome) {
  return isHome
    ? '<span class="badge badge-green">Home</span>'
    : '<span class="badge badge-blue">Lab</span>';
}

function labStatCard(label, value, cls) {
  return `<div class="dash-card"><div class="dash-card-label">${label}</div><div class="dash-card-value ${cls}">${value}</div></div>`;
}

function emptyState(icon, title, sub) {
  return `<div class="empty-state"><div class="empty-icon">${icon}</div><h3>${title}</h3>${sub ? '<p>' + sub + '</p>' : ''}</div>`;
}

function labCard(inner) {
  return `<div style="background:white;border:1px solid var(--border);border-radius:var(--radius);padding:20px;">${inner}</div>`;
}

// ───────────────────── Dashboard ─────────────────────

function renderLabDashboard() {
  const db = getDB();
  const all = db.labTests || [];
  const pending = all.filter(t => t.status === 'pending');
  const collected = all.filter(t => t.status === 'collected');
  const completed = all.filter(t => t.status === 'completed');
  const homeScheduled = all.filter(t => t.isHomeCollection && t.status !== 'completed');

  const pendingList = pending.length === 0
    ? emptyState('&#9776;', 'No pending requests')
    : pending.slice(0, 5).map(t => `
      <div style="background:white;border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
        <div><strong>${getPatientName(db, t.patientId)}</strong><br><span style="font-size:.85rem;color:var(--text-light);">${getTestName(db, t.testTypeId)} &bull; ${formatDate(t.createdAt)}</span></div>
        <button class="btn btn-sm btn-primary" onclick="markCollected('${t.id}')">Collect</button>
      </div>`
    ).join('');

  const homeList = homeScheduled.length === 0
    ? emptyState('&#127968;', 'No home collections scheduled')
    : homeScheduled.slice(0, 5).map(t => {
      const pat = getPatientName(db, t.patientId);
      return `<div style="background:white;border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div><strong>${pat}</strong><br><span style="font-size:.85rem;color:var(--text-light);">${t.preferredDate || formatDate(t.createdAt)}${t.preferredTime ? ' &bull; ' + t.preferredTime : ''}</span></div>
          <span class="badge badge-green">Scheduled</span>
        </div>
        ${t.homeAddress ? `<p style="font-size:.85rem;color:var(--text-light);margin-top:4px;">&#9873; ${t.homeAddress}</p>` : ''}
      </div>`;
    }).join('');

  document.getElementById('pageContent').innerHTML = `
    <div class="dash-cards">
      ${labStatCard('Pending Tests', pending.length, 'amber')}
      ${labStatCard('Collected', collected.length, 'blue')}
      ${labStatCard('Completed', completed.length, 'green')}
      ${labStatCard('Home Collections', homeScheduled.length, 'amber')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <div><div class="section-title-sm">Pending Requests</div>${pendingList}</div>
      <div><div class="section-title-sm">Home Collections Scheduled</div>${homeList}</div>
    </div>`;
}

// ───────────────────── Test Requests ─────────────────────

function requestsTable(tests) {
  if (tests.length === 0) return emptyState('&#9776;', 'No test requests');
  const db = getDB();
  return `<div class="table-container"><table>
    <tr><th>Patient</th><th>Test</th><th>Date</th><th>Type</th><th>Status</th><th>Action</th></tr>
    ${tests.map(t => {
      const action = t.status === 'pending'
        ? `<button class="btn btn-sm btn-primary" onclick="markCollected('${t.id}')">Mark Collected</button>`
        : t.status === 'collected'
          ? `<button class="btn btn-sm btn-primary" onclick="openUploadResult('${t.id}')">Upload Result</button>`
          : t.result
            ? `<button class="btn btn-sm btn-outline" onclick="viewLabResult('${t.id}')">View</button>`
            : '&mdash;';
      return `<tr>
        <td><strong>${getPatientName(db, t.patientId)}</strong></td>
        <td>${getTestName(db, t.testTypeId)}</td>
        <td>${formatDate(t.createdAt)}</td>
        <td>${typeBadge(t.isHomeCollection)}</td>
        <td>${statusBadge(t.status)}</td>
        <td>${action}</td>
      </tr>`;
    }).join('')}
  </table></div>`;
}

function renderLabRequests() {
  const db = getDB();
  const tests = [...(db.labTests || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  document.getElementById('pageContent').innerHTML = `
    <div class="tab-bar">
      <button class="active" onclick="filterLabTests(this,'all')">All</button>
      <button onclick="filterLabTests(this,'pending')">Pending</button>
      <button onclick="filterLabTests(this,'collected')">Collected</button>
      <button onclick="filterLabTests(this,'completed')">Completed</button>
    </div>
    <div id="labRequestsList">${requestsTable(tests)}</div>`;
}

function filterLabTests(btn, filter) {
  document.querySelectorAll('.tab-bar button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const db = getDB();
  let tests = [...(db.labTests || [])];
  if (filter !== 'all') tests = tests.filter(t => t.status === filter);
  tests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  document.getElementById('labRequestsList').innerHTML = requestsTable(tests);
}

// ───────────────────── Collect & Upload ─────────────────────

function markCollected(testId) {
  const db = getDB();
  const test = db.labTests.find(t => t.id === testId);
  if (test) {
    test.collectedAt = new Date().toISOString();
    test.status = 'collected';
    saveDB(db);
    showToast('Sample marked as collected', 'success');
  }
  renderCurrentTab();
}

function openUploadResult(testId) {
  const existing = document.getElementById('uploadResultModal');
  if (existing) existing.remove();

  const db = getDB();
  const test = db.labTests.find(t => t.id === testId);
  if (!test) return;
  const patName = getPatientName(db, test.patientId);
  const tstName = getTestName(db, test.testTypeId);

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal active" id="uploadResultModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Upload Test Result</h3>
          <button class="modal-close" onclick="closeModal('uploadResultModal')">&times;</button>
        </div>
        <p><strong>Patient:</strong> ${patName}</p>
        <p><strong>Test:</strong> ${tstName}</p>
        <div class="form-group" style="margin-top:16px;">
          <label>Test Result</label>
          <textarea id="testResult" rows="6" placeholder="Enter detailed test results...&#10;&#10;Example:&#10;Hemoglobin: 14.2 g/dL (Normal: 13-17)&#10;WBC: 7.5 x10^9/L (Normal: 4-11)&#10;Platelets: 250 x10^9/L (Normal: 150-400)"></textarea>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="resultStatus">
            <option value="normal">Normal</option>
            <option value="abnormal">Abnormal</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="saveTestResult('${testId}')">Save Result</button>
      </div>
    </div>`);
}

function saveTestResult(testId) {
  const db = getDB();
  const test = db.labTests.find(t => t.id === testId);
  if (!test) return;
  const result = document.getElementById('testResult').value.trim();
  if (!result) return showToast('Please enter test results', 'error');
  const statusVal = document.getElementById('resultStatus').value;
  test.status = 'completed';
  test.completedAt = new Date().toISOString();
  test.resultStatus = statusVal;
  test.result = `<p><strong>Findings:</strong> ${statusVal}</p><pre style="white-space:pre-wrap;font-family:inherit;">${result}</pre><p><em>Reported on ${formatDateTime(new Date().toISOString())}</em></p>`;
  saveDB(db);
  closeModal('uploadResultModal');
  showToast('Test result saved successfully', 'success');
  renderCurrentTab();
}

// ───────────────────── Home Collection ─────────────────────

function renderHomeCollection() {
  const db = getDB();
  const homeTests = [...(db.labTests || []).filter(t => t.isHomeCollection)]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  document.getElementById('pageContent').innerHTML = `
    <div class="section-title-sm">Home Blood Collection Requests</div>
    ${homeTests.length === 0
      ? emptyState('&#127968;', 'No home collection requests')
      : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:16px;">
        ${homeTests.map(t => {
          const pat = getPatientName(db, t.patientId);
          const tt = getTestName(db, t.testTypeId);
          return labCard(`
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
              <div>
                <h4>${pat}</h4>
                <p style="font-size:.85rem;color:var(--text-light);">${tt}</p>
              </div>
              ${statusBadge(t.status)}
            </div>
            <p style="font-size:.85rem;"><strong>Address:</strong> ${t.homeAddress || 'N/A'}</p>
            <p style="font-size:.85rem;"><strong>Preferred:</strong> ${t.preferredDate ? formatDate(t.preferredDate) : 'N/A'} ${t.preferredTime || ''}</p>
            <div style="display:flex;gap:8px;margin-top:12px;">
              ${t.status === 'pending' ? `<button class="btn btn-sm btn-primary" onclick="markCollected('${t.id}')">Mark Collected</button>` : ''}
              ${t.status === 'collected' ? `<button class="btn btn-sm btn-primary" onclick="openUploadResult('${t.id}')">Upload Result</button>` : ''}
              ${t.status === 'completed' && t.result ? `<button class="btn btn-sm btn-outline" onclick="viewLabResult('${t.id}')">View Result</button>` : ''}
            </div>`);
        }).join('')}
      </div>`
    }`;
}

// ───────────────────── Upload Results ─────────────────────

function renderUploadResults() {
  const db = getDB();
  const collected = (db.labTests || []).filter(t => t.status === 'collected');
  document.getElementById('pageContent').innerHTML = `
    <div class="section-title-sm">Tests Ready for Result Upload</div>
    ${collected.length === 0
      ? emptyState('&#128202;', 'No tests ready for result upload', 'Collect samples first')
      : `<div class="table-container"><table>
        <tr><th>Patient</th><th>Test</th><th>Date Collected</th><th>Action</th></tr>
        ${collected.map(t => `
          <tr>
            <td>${getPatientName(db, t.patientId)}</td>
            <td>${getTestName(db, t.testTypeId)}</td>
            <td>${formatDate(t.createdAt)}</td>
            <td><button class="btn btn-sm btn-primary" onclick="openUploadResult('${t.id}')">Upload Result</button></td>
          </tr>`
        ).join('')}
      </table></div>`
    }`;
}

// ───────────────────── Patients ─────────────────────

function renderLabPatients() {
  const db = getDB();
  const tests = db.labTests || [];
  const patients = db.patients || [];
  const patientIds = [...new Set(tests.map(t => t.patientId))];
  const labPatients = patientIds.map(id => patients.find(p => p.id === id)).filter(Boolean);

  document.getElementById('pageContent').innerHTML = `
    <div class="section-title-sm">Lab Patients (${labPatients.length})</div>
    ${labPatients.length === 0
      ? emptyState('&#9787;', 'No patients yet')
      : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">
        ${labPatients.map(p => {
          const patientTests = tests.filter(t => t.patientId === p.id);
          const testCount = patientTests.length;
          const completedCount = patientTests.filter(t => t.status === 'completed').length;
          const lastTest = patientTests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
          return labCard(`
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
              <div style="width:44px;height:44px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.1rem;">${getInitials(p.name)}</div>
              <div><h4 style="font-size:.95rem;margin:0;">${p.name}</h4><p style="font-size:.8rem;color:var(--text-light);margin:0;">${p.email || ''}</p></div>
            </div>
            <p style="font-size:.85rem;margin:0;">Tests: ${testCount} (${completedCount} completed)</p>
            ${lastTest ? `<p style="font-size:.85rem;color:var(--text-light);margin-top:4px;">Last: ${formatDate(lastTest.createdAt)}</p>` : ''}`);
        }).join('')}
      </div>`
    }`;
}

// ───────────────────── View Result (Print) ─────────────────────

function viewLabResult(id) {
  const db = getDB();
  const t = db.labTests.find(x => x.id === id);
  if (!t || !t.result) return showToast('Result not found', 'error');
  const tt = getTestType(db, t.testTypeId);
  const pat = getPatient(db, t.patientId);
  const reportDate = formatDateTime(t.completedAt || t.createdAt);
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html>
<html><head><title>Lab Result - ${t.id}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 40px; max-width: 700px; margin: 0 auto; color:#000; }
  .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { color: #0d9488; margin:0; font-size:1.5rem; }
  .header p { margin:4px 0 0; color:#555; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { border: 1px solid #ddd; padding: 10px 14px; text-align: left; font-size:.9rem; }
  th { background: #f0fdfa; font-weight:600; }
  .footer { text-align:center; margin-top:40px; font-size:.8rem; color:#999; border-top:1px solid #eee; padding-top:16px; }
</style></head><body>
<div class="header">
  <h1>ZEESHAN HOSPITAL - DIAGNOSTICS LAB</h1>
  <p>Laboratory Test Report</p>
</div>
<table>
  <tr><th>Patient Name</th><td>${pat ? pat.name : 'N/A'}</td></tr>
  <tr><th>Test Name</th><td>${tt ? tt.name : 'N/A'}</td></tr>
  <tr><th>Report Date</th><td>${reportDate}</td></tr>
</table>
<hr>
<div style="margin-top:20px;">${t.result}</div>
<div class="footer">Generated by Zeeshan Hospital Laboratory System</div>
<script>window.print();<\/script>
</body></html>`);
  w.document.close();
}

// ───────────────────── Profile ─────────────────────

function renderLabProfile() {
  document.getElementById('pageContent').innerHTML = `
    <div style="max-width:500px;">
      <div style="background:white;border-radius:var(--radius);padding:32px;box-shadow:var(--shadow);border:1px solid var(--border);">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="width:80px;height:80px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:700;margin:0 auto 12px;">${getInitials(user.name)}</div>
          <h3 style="margin:0 0 4px;">${user.name}</h3>
          <p style="color:var(--primary);font-weight:600;margin:0 0 4px;">Diagnostic Testing Facility</p>
          <p style="color:var(--text-light);margin:0;">${user.email}</p>
        </div>
        <div class="form-group"><label>Lab Name</label><input type="text" value="${user.name}" disabled></div>
        <div class="form-group"><label>License #</label><input type="text" value="${user.license || 'N/A'}" disabled></div>
        <div class="form-group"><label>Email</label><input type="text" value="${user.email}" disabled></div>
      </div>
    </div>`;
}

// ───────────────────── Helpers ─────────────────────

function renderCurrentTab() {
  const active = document.querySelector('.sidebar-nav a.active');
  if (active) showLabTab(active.dataset.tab);
}

// (init called from HTML after dbPromise resolves)
