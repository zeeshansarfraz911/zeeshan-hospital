// ---------- Pharmacy Portal ----------
let user = getCurrentUser();
const role = getCurrentRole();

if (!user || role !== 'pharmacy') {
  window.location.href = 'index.html';
}

function getCurrentTab() {
  const active = document.querySelector('.sidebar-nav a.active');
  return active ? active.dataset.tab : 'dashboard';
}

function initPharmacy() {
  document.getElementById('sidebarAvatar').textContent = user.name.charAt(0);
  document.getElementById('sidebarName').textContent = user.name;
  document.getElementById('sidebarEmail').textContent = user.email;

  document.querySelectorAll('.sidebar-nav a[data-tab]').forEach(a => {
    a.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelectorAll('.sidebar-nav a').forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      showPharmacyTab(this.dataset.tab);
      if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
    });
  });

  showPharmacyTab('dashboard');
}

function showPharmacyTab(tab) {
  const titles = {
    dashboard: 'Dashboard', prescriptions: 'Prescriptions',
    inventory: 'Inventory', orders: 'Orders', profile: 'Profile'
  };
  document.getElementById('pageTitle').textContent = titles[tab] || 'Dashboard';
  document.getElementById('pageSubtitle').textContent = 'Manage pharmacy operations';

  const fns = {
    dashboard: renderPharmacyDashboard,
    prescriptions: renderPharmacyPrescriptions,
    inventory: renderPharmacyInventory,
    orders: renderPharmacyOrders,
    profile: renderPharmacyProfile
  };
  if (fns[tab]) fns[tab]();
}

// ----- Dashboard -----
function renderPharmacyDashboard() {
  const db = getDB();
  const totalRx = db.prescriptions.length;
  const toProcess = db.prescriptions.filter(p => p.status !== 'dispensed').length;
  const lowStockItems = db.medicines.filter(m => m.stock < 50);
  const invValue = db.medicines.reduce((sum, m) => sum + (m.price * m.stock), 0);
  const recentRx = [...db.prescriptions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  document.getElementById('pageContent').innerHTML = `
    <div class="dash-cards">
      <div class="dash-card">
        <div class="dash-card-label">Total Prescriptions</div>
        <div class="dash-card-value green">${totalRx}</div>
      </div>
      <div class="dash-card">
        <div class="dash-card-label">To Process</div>
        <div class="dash-card-value blue">${toProcess}</div>
      </div>
      <div class="dash-card">
        <div class="dash-card-label">Low Stock Items</div>
        <div class="dash-card-value red">${lowStockItems.length}</div>
      </div>
      <div class="dash-card">
        <div class="dash-card-label">Inventory Value</div>
        <div class="dash-card-value amber">Rs. ${invValue.toLocaleString()}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <div>
        <div class="section-title-sm">Recent Prescriptions</div>
        ${recentRx.length === 0
          ? '<div class="empty-state"><div class="empty-icon">&#9998;</div><h3>No prescriptions yet</h3></div>'
          : recentRx.map(p => {
              const pat = db.patients.find(pt => pt.id === p.patientId);
              return `<div style="background:white;border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                <div><strong>${pat ? pat.name : 'Patient'}</strong><br><span style="font-size:.85rem;color:var(--text-light);">${p.diagnosis} &bull; ${formatDate(p.date)}</span></div>
                <span class="badge ${p.status === 'dispensed' ? 'badge-green' : 'badge-amber'}">${p.medications.length} items</span>
              </div>`;
            }).join('')
        }
      </div>
      <div>
        <div class="section-title-sm">Low Stock Alerts</div>
        ${lowStockItems.length === 0
          ? '<p style="color:var(--text-light);padding:16px 0;">All items are well stocked</p>'
          : lowStockItems.map(m => `
              <div style="background:white;border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                <div><strong>${m.name}</strong><br><span style="font-size:.85rem;color:var(--text-light);">Stock: ${m.stock} units</span></div>
                <button class="btn btn-sm btn-primary" onclick="showRestockModal('${m.id}')">Restock</button>
              </div>
            `).join('')
        }
      </div>
    </div>
  `;
}

// ----- Prescriptions -----
function renderPharmacyPrescriptions() {
  const db = getDB();
  const allRx = [...db.prescriptions].sort((a, b) => new Date(b.date) - new Date(a.date));

  document.getElementById('pageContent').innerHTML = `
    <div class="section-title-sm">All Prescriptions</div>
    ${allRx.length === 0
      ? '<div class="empty-state"><div class="empty-icon">&#9998;</div><h3>No prescriptions found</h3></div>'
      : `<div class="table-container"><table>
          <tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Diagnosis</th><th>Medications</th><th>Status</th><th>Action</th></tr>
          ${allRx.map(p => {
            const pat = db.patients.find(pt => pt.id === p.patientId);
            const doc = db.doctors.find(d => d.id === p.doctorId);
            return `<tr>
              <td>${p.id}</td>
              <td><strong>${pat ? pat.name : 'N/A'}</strong></td>
              <td>${doc ? doc.name : 'N/A'}</td>
              <td>${formatDate(p.date)}</td>
              <td>${p.diagnosis}</td>
              <td>${p.medications.map(m => `${m.name} ${m.dosage}`).join(', ')}</td>
              <td>${p.status === 'dispensed' ? '<span class="badge badge-green">Dispensed</span>' : '<span class="badge badge-amber">Pending</span>'}</td>
              <td>${p.status !== 'dispensed' ? `<button class="btn btn-sm btn-primary" onclick="showDispenseModal('${p.id}')">Dispense</button>` : '<span style="color:var(--text-light);font-size:.85rem;">Completed</span>'}</td>
            </tr>`;
          }).join('')}
        </table></div>`
    }
  `;
}

function showDispenseModal(rxId) {
  const old = document.getElementById('dispenseModal');
  if (old) old.remove();
  const db = getDB();
  const rx = db.prescriptions.find(p => p.id === rxId);
  if (!rx) return;
  const pat = db.patients.find(pt => pt.id === rx.patientId);

  const html = `
    <div class="modal active" id="dispenseModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Dispense Prescription</h3>
          <button class="modal-close" onclick="closeModal('dispenseModal')">&times;</button>
        </div>
        <p style="margin-bottom:12px;"><strong>Patient:</strong> ${pat ? pat.name : 'N/A'}<br><strong>Diagnosis:</strong> ${rx.diagnosis}</p>
        <div style="background:var(--bg);border-radius:var(--radius-sm);padding:12px;margin-bottom:16px;">
          <p style="font-weight:600;margin-bottom:8px;font-size:.9rem;">Medications to Dispense</p>
          ${rx.medications.map((m, i) => `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;font-size:.85rem;">
              <input type="checkbox" id="medChk_${i}" checked>
              <label for="medChk_${i}">${m.name} ${m.dosage} &mdash; ${m.frequency} for ${m.duration}</label>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="markDispensed('${rxId}')">Confirm Dispense</button>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

function markDispensed(rxId) {
  const db = getDB();
  const rx = db.prescriptions.find(p => p.id === rxId);
  if (!rx) return;

  rx.status = 'dispensed';
  rx.dispensedAt = new Date().toISOString();
  rx.dispensedBy = user.name;

  rx.medications.forEach((m, i) => {
    const chk = document.getElementById('medChk_' + i);
    if (chk && chk.checked) {
      const med = db.medicines.find(x => x.name.toLowerCase() === m.name.toLowerCase());
      if (med) {
        med.stock = Math.max(0, med.stock - 1);
      }
    }
  });

  saveDB(db);
  closeModal('dispenseModal');
  showToast(`Prescription ${rxId} dispensed successfully`, 'success');
  showPharmacyTab(getCurrentTab());
}

// ----- Inventory -----
function renderPharmacyInventory() {
  const db = getDB();

  document.getElementById('pageContent').innerHTML = `
    <button class="btn btn-primary" onclick="showAddMedicineModal()" style="margin-bottom:16px;">+ Add Medicine</button>
    <div class="section-title-sm">Medicine Inventory (${db.medicines.length} items)</div>
    ${db.medicines.length === 0
      ? '<div class="empty-state"><div class="empty-icon">&#128230;</div><h3>Inventory is empty</h3></div>'
      : `<div class="table-container"><table>
          <tr><th>Name</th><th>Category</th><th>Price (Rs.)</th><th>Stock</th><th>Status</th><th>Action</th></tr>
          ${db.medicines.map(m => {
            const status = m.stock < 50 ? 'low' : m.stock < 200 ? 'medium' : 'high';
            const badgeClass = status === 'low' ? 'badge-red' : status === 'medium' ? 'badge-amber' : 'badge-green';
            const label = status === 'low' ? 'Low Stock' : status === 'medium' ? 'Medium' : 'In Stock';
            return `<tr>
              <td><strong>${m.name}</strong></td>
              <td style="color:var(--text-light);font-size:.85rem;">${m.category || '—'}</td>
              <td>Rs. ${m.price}</td>
              <td>${m.stock}</td>
              <td><span class="badge ${badgeClass}">${label}</span></td>
              <td><button class="btn btn-sm btn-primary" onclick="showRestockModal('${m.id}')">Restock</button></td>
            </tr>`;
          }).join('')}
        </table></div>`
    }
  `;
}

function showAddMedicineModal() {
  const exists = document.getElementById('addMedModal');
  if (exists) { exists.classList.add('active'); document.getElementById('newMedName').value = ''; document.getElementById('newMedCategory').value = ''; document.getElementById('newMedPrice').value = ''; document.getElementById('newMedStock').value = ''; return; }

  const html = `
    <div class="modal active" id="addMedModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add New Medicine</h3>
          <button class="modal-close" onclick="closeModal('addMedModal')">&times;</button>
        </div>
        <div class="form-group">
          <label>Medicine Name</label>
          <input type="text" id="newMedName" placeholder="Enter medicine name">
        </div>
        <div class="form-group">
          <label>Category</label>
          <input type="text" id="newMedCategory" placeholder="e.g. Analgesic, Antibiotic">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label>Price (Rs.)</label>
            <input type="number" id="newMedPrice" placeholder="0" min="0">
          </div>
          <div class="form-group">
            <label>Initial Stock</label>
            <input type="number" id="newMedStock" placeholder="100" min="0">
          </div>
        </div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:8px;" onclick="addMedicine()">Add to Inventory</button>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

function addMedicine() {
  const db = getDB();
  const name = document.getElementById('newMedName').value.trim();
  const category = document.getElementById('newMedCategory').value.trim();
  const price = parseFloat(document.getElementById('newMedPrice').value) || 0;
  const stock = parseInt(document.getElementById('newMedStock').value, 10) || 0;

  if (!name) return showToast('Please enter a medicine name', 'error');
  if (price <= 0) return showToast('Please enter a valid price', 'error');
  if (stock < 0) return showToast('Please enter a valid stock quantity', 'error');

  db.medicines.push({
    id: genId(),
    name,
    category: category || 'General',
    price,
    stock,
    minStock: 20,
    manufacturer: user.name
  });

  saveDB(db);
  closeModal('addMedModal');
  showToast(`${name} added to inventory`, 'success');
  renderPharmacyInventory();
}

function showRestockModal(medId) {
  const db = getDB();
  const med = db.medicines.find(m => m.id === medId);
  if (!med) return;

  const exists = document.getElementById('restockModal');
  if (exists) { exists.classList.add('active'); document.getElementById('restockMedName').textContent = 'Restock: ' + med.name; document.getElementById('restockCurrent').textContent = med.stock; document.getElementById('restockMedId').value = medId; return; }

  const html = `
    <div class="modal active" id="restockModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="restockMedName">Restock: ${med.name}</h3>
          <button class="modal-close" onclick="closeModal('restockModal')">&times;</button>
        </div>
        <p style="color:var(--text-light);margin-bottom:16px;">Current stock: <strong id="restockCurrent">${med.stock}</strong> units</p>
        <input type="hidden" id="restockMedId" value="${medId}">
        <div class="form-group">
          <label>Quantity to Add</label>
          <input type="number" id="restockQty" value="100" min="1">
        </div>
        <div style="display:flex;gap:8px;margin-top:16px;">
          <button class="btn btn-outline" style="flex:1;justify-content:center;" onclick="quickRestock('${medId}',50)">+50</button>
          <button class="btn btn-outline" style="flex:1;justify-content:center;" onclick="quickRestock('${medId}',100)">+100</button>
          <button class="btn btn-outline" style="flex:1;justify-content:center;" onclick="quickRestock('${medId}',200)">+200</button>
        </div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:12px;" onclick="restockMedicine()">Restock</button>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

function quickRestock(medId, qty) {
  document.getElementById('restockQty').value = qty;
}

function restockMedicine() {
  const db = getDB();
  const medId = document.getElementById('restockMedId').value;
  const med = db.medicines.find(m => m.id === medId);
  const qty = parseInt(document.getElementById('restockQty').value, 10) || 0;

  if (!med) return showToast('Medicine not found', 'error');
  if (qty <= 0) return showToast('Enter a valid quantity', 'error');

  med.stock += qty;
  saveDB(db);
  closeModal('restockModal');
  showToast(`Restocked ${med.name} with ${qty} units`, 'success');
  showPharmacyTab(getCurrentTab());
}

// ----- Orders -----
function renderPharmacyOrders() {
  const db = getDB();
  const prescriptions = [...db.prescriptions].sort((a, b) => new Date(b.date) - new Date(a.date));

  const orderItems = [];
  prescriptions.forEach(rx => {
    const pat = db.patients.find(pt => pt.id === rx.patientId);
    rx.medications.forEach(m => {
      orderItems.push({
        rxId: rx.id,
        patient: pat ? pat.name : 'N/A',
        medicine: m.name,
        dosage: m.dosage,
        date: rx.date,
        status: rx.status === 'dispensed' ? 'dispensed' : 'pending',
        diagnosis: rx.diagnosis
      });
    });
  });

  document.getElementById('pageContent').innerHTML = `
    <div class="section-title-sm">Patient Orders</div>
    ${orderItems.length === 0
      ? '<div class="empty-state"><div class="empty-icon">&#128666;</div><h3>No orders to display</h3></div>'
      : `<div class="table-container"><table>
          <tr><th>Order</th><th>Patient</th><th>Medicine</th><th>Dosage</th><th>Date</th><th>Status</th><th>Action</th></tr>
          ${orderItems.map((o, i) => `
            <tr>
              <td>#${i + 1}</td>
              <td><strong>${o.patient}</strong></td>
              <td>${o.medicine}</td>
              <td>${o.dosage}</td>
              <td>${formatDate(o.date)}</td>
              <td>${o.status === 'dispensed' ? '<span class="badge badge-green">Dispensed</span>' : '<span class="badge badge-amber">Pending</span>'}</td>
              <td>${o.status === 'pending' ? `<button class="btn btn-sm btn-primary" onclick="showDispenseModal('${o.rxId}')">Process</button>` : '<span style="color:var(--text-light);font-size:.85rem;">Done</span>'}</td>
            </tr>
          `).join('')}
        </table></div>`
    }
  `;
}

// ----- Profile -----
function renderPharmacyProfile() {
  document.getElementById('pageContent').innerHTML = `
    <div style="max-width:520px;">
      <div style="background:white;border-radius:var(--radius);padding:32px;box-shadow:var(--shadow);border:1px solid var(--border);">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="width:80px;height:80px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:700;margin:0 auto 12px;">${user.name.charAt(0)}</div>
          <h3>${user.name}</h3>
          <p style="color:var(--primary);font-weight:600;">Licensed Pharmacy</p>
          <p style="color:var(--text-light);font-size:.85rem;">${user.email}</p>
        </div>
        <div class="form-group"><label>Pharmacy Name</label><input type="text" value="${user.name || '—'}" disabled></div>
        <div class="form-group"><label>License Number</label><input type="text" value="${user.license || '—'}" disabled></div>
        <div class="form-group"><label>Email Address</label><input type="text" value="${user.email || '—'}" disabled></div>
        <div class="form-group"><label>Phone</label><input type="text" value="${user.phone || '—'}" disabled></div>
        <div class="form-group"><label>Address</label><input type="text" value="${user.address || 'Zeeshan Hospital, Karachi'}" disabled></div>
        <div class="form-group"><label>Timings</label><input type="text" value="${user.timings || '8:00 AM - 10:00 PM'}" disabled></div>
      </div>
    </div>
  `;
}

// (init called from HTML after dbPromise resolves)
