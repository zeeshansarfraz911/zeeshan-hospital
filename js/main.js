// ========== ZEESHAN HOSPITAL - Core System (Firebase Backend) ==========

let dbCache = null;
let unsaved = {};

// ---------- Database (Firestore-backed) ----------

function getDB() { return dbCache; }

async function fetchDB() {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const snapshot = await db.collection('meta').doc('config').get();
    if (snapshot.exists) {
      dbCache = snapshot.data();
    } else {
      dbCache = {
        patients: [], doctors: [], appointments: [],
        prescriptions: [], labTests: [], medicines: [],
        pharmacists: [], labs: [], notifications: [],
        messages: [], testTypes: [], testCategories: [],
        nextId: 1, _version: 3, _seeded: false
      };
      await seedIfEmpty();
    }
  } catch (e) { console.error('DB fetch failed', e); }
}

async function saveDB(db) {
  dbCache = db;
  const user = auth.currentUser;
  if (!user) return;
  try {
    await db.collection('meta').doc('config').set(db);
  } catch (e) { console.error('DB save failed', e); }
}

async function seedIfEmpty() {
  if (!dbCache || dbCache._seeded) return;
  const d = dbCache;
  d.patients = [
    { id:'PAT-101', name:'Ahmed Khan', email:'ahmed@test.com', pass:'123456', phone:'+92 300 1111111', bloodGroup:'A+', gender:'Male', dob:'1985-03-15', address:'House 12, Block B, Gulshan, Karachi', createdAt:'2026-04-06T19:23:01.337Z' },
    { id:'PAT-102', name:'Fatima Zaidi', email:'fatima@test.com', pass:'123456', phone:'+92 321 2222222', bloodGroup:'B+', gender:'Female', dob:'1992-07-22', address:'Flat 5, Sea View Apartments, Clifton', createdAt:'2026-04-07T10:15:00.000Z' },
    { id:'PAT-103', name:'Muhammad Ali', email:'mali@test.com', pass:'123456', phone:'+92 333 3333333', bloodGroup:'O+', gender:'Male', dob:'1978-11-02', address:'House 3, Street 7, F-8/3, Islamabad', createdAt:'2026-04-08T14:30:00.000Z' },
    { id:'PAT-104', name:'Sana Riaz', email:'sana@test.com', pass:'123456', phone:'+92 345 4444444', bloodGroup:'AB-', gender:'Female', dob:'1995-09-18', address:'House 7, Block D, DHA Phase 2, Lahore', createdAt:'2026-04-09T09:00:00.000Z' },
    { id:'PAT-105', name:'Bilal Qureshi', email:'bilal@test.com', pass:'123456', phone:'+92 355 5555555', bloodGroup:'A-', gender:'Male', dob:'1988-01-30', address:'Flat 12, Harmony Heights, University Road, Peshawar', createdAt:'2026-04-10T16:45:00.000Z' }
  ];
  d.doctors = [
    { id:'DOC-101', name:'Dr. Usman Ali', email:'doctor@zh.com', pass:'123456', spec:'Cardiology', license:'PMC-1234', qualification:'MBBS, FCPS (Cardiology)', experience:15, consultationFee:1500, schedule:[{ day:'Monday', start:'09:00', end:'17:00', slots:['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30'], isAvailable:true },{ day:'Tuesday', start:'09:00', end:'17:00', slots:['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30'], isAvailable:true },{ day:'Wednesday', start:'09:00', end:'17:00', slots:['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30'], isAvailable:true },{ day:'Thursday', start:'09:00', end:'17:00', slots:['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30'], isAvailable:true },{ day:'Friday', start:'09:00', end:'12:00', slots:['09:00','09:30','10:00','10:30','11:00','11:30'], isAvailable:true }], createdAt:'2026-01-15T10:00:00.000Z' },
    { id:'DOC-102', name:'Dr. Ayesha Malik', email:'ayesha@zh.com', pass:'123456', spec:'Neurology', license:'PMC-5678', qualification:'MBBS, MD (Neurology)', experience:12, consultationFee:2000, schedule:[{ day:'Monday', start:'10:00', end:'16:00', slots:['10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30'], isAvailable:true },{ day:'Tuesday', start:'10:00', end:'16:00', slots:['10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30'], isAvailable:true },{ day:'Wednesday', start:'10:00', end:'16:00', slots:['10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30'], isAvailable:true },{ day:'Thursday', start:'10:00', end:'16:00', slots:['10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30'], isAvailable:true },{ day:'Friday', start:'10:00', end:'14:00', slots:['10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30'], isAvailable:true }], createdAt:'2026-02-01T10:00:00.000Z' },
    { id:'DOC-103', name:'Dr. Ahmed Raza', email:'ahmedr@zh.com', pass:'123456', spec:'Orthopedics', license:'PMC-9012', qualification:'MBBS, FRCS (Orthopedics)', experience:20, consultationFee:2500, schedule:[{ day:'Monday', start:'08:00', end:'14:00', slots:['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30'], isAvailable:true },{ day:'Tuesday', start:'08:00', end:'14:00', slots:['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30'], isAvailable:true },{ day:'Wednesday', start:'08:00', end:'14:00', slots:['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30'], isAvailable:true },{ day:'Thursday', start:'08:00', end:'14:00', slots:['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30'], isAvailable:true },{ day:'Saturday', start:'09:00', end:'13:00', slots:['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30'], isAvailable:true }], createdAt:'2026-01-20T10:00:00.000Z' },
    { id:'DOC-104', name:'Dr. Fatima Khan', email:'fatimak@zh.com', pass:'123456', spec:'Pediatrics', license:'PMC-3456', qualification:'MBBS, MD (Pediatrics)', experience:10, consultationFee:1200, schedule:[{ day:'Monday', start:'09:00', end:'17:00', slots:['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30'], isAvailable:true },{ day:'Tuesday', start:'09:00', end:'17:00', slots:['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30'], isAvailable:true },{ day:'Wednesday', start:'09:00', end:'17:00', slots:['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30'], isAvailable:true },{ day:'Thursday', start:'09:00', end:'17:00', slots:['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30'], isAvailable:true },{ day:'Friday', start:'09:00', end:'17:00', slots:['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30'], isAvailable:true }], createdAt:'2026-03-01T10:00:00.000Z' }
  ];
  d.appointments = [
    { id:'APT-101', patientId:'PAT-101', patientName:'Ahmed Khan', doctorId:'DOC-101', date:'2026-06-08', time:'10:00', status:'confirmed', type:'video', notes:'', createdAt:'2026-06-03T10:00:00.000Z' },
    { id:'APT-102', patientId:'PAT-102', patientName:'Fatima Zaidi', doctorId:'DOC-102', date:'2026-06-08', time:'11:00', status:'pending', type:'clinic', notes:'', createdAt:'2026-06-04T11:00:00.000Z' },
    { id:'APT-103', patientId:'PAT-101', patientName:'Ahmed Khan', doctorId:'DOC-103', date:'2026-06-09', time:'09:00', status:'confirmed', type:'video', notes:'Follow-up on knee pain', createdAt:'2026-06-04T14:00:00.000Z' },
    { id:'APT-104', patientId:'PAT-103', patientName:'Muhammad Ali', doctorId:'DOC-101', date:'2026-06-10', time:'14:00', status:'pending', type:'clinic', notes:'', createdAt:'2026-06-05T09:00:00.000Z' },
    { id:'APT-105', patientId:'PAT-104', patientName:'Sana Riaz', doctorId:'DOC-104', date:'2026-06-08', time:'10:30', status:'confirmed', type:'video', notes:'', createdAt:'2026-06-05T16:00:00.000Z' },
    { id:'APT-106', patientId:'PAT-105', patientName:'Bilal Qureshi', doctorId:'DOC-102', date:'2026-06-09', time:'15:00', status:'pending', type:'clinic', notes:'', createdAt:'2026-06-06T08:00:00.000Z' },
    { id:'APT-107', patientId:'PAT-102', patientName:'Fatima Zaidi', doctorId:'DOC-103', date:'2026-06-11', time:'10:00', status:'confirmed', type:'video', notes:'', createdAt:'2026-06-06T10:00:00.000Z' },
    { id:'APT-108', patientId:'PAT-101', patientName:'Ahmed Khan', doctorId:'DOC-104', date:'2026-06-12', time:'09:30', status:'completed', type:'clinic', notes:'Regular checkup - all vitals normal', createdAt:'2026-06-01T10:00:00.000Z' },
    { id:'APT-109', patientId:'PAT-103', patientName:'Muhammad Ali', doctorId:'DOC-102', date:'2026-06-08', time:'16:00', status:'pending', type:'video', notes:'', createdAt:'2026-06-07T12:00:00.000Z' },
    { id:'APT-110', patientId:'PAT-104', patientName:'Sana Riaz', doctorId:'DOC-101', date:'2026-06-10', time:'11:00', status:'confirmed', type:'clinic', notes:'', createdAt:'2026-06-07T14:00:00.000Z' },
    { id:'APT-111', patientId:'PAT-105', patientName:'Bilal Qureshi', doctorId:'DOC-104', date:'2026-06-11', time:'14:30', status:'pending', type:'video', notes:'', createdAt:'2026-06-07T16:00:00.000Z' },
    { id:'APT-112', patientId:'PAT-102', patientName:'Fatima Zaidi', doctorId:'DOC-101', date:'2026-06-12', time:'10:00', status:'confirmed', type:'clinic', notes:'Annual cardiac checkup', createdAt:'2026-06-08T09:00:00.000Z' }
  ];
  d.prescriptions = [
    { id:'RX-101', patientId:'PAT-101', patientName:'Ahmed Khan', doctorId:'DOC-101', doctorName:'Dr. Usman Ali', date:'2026-05-16', diagnosis:'Essential Hypertension', medications:[{ name:'Amlodipine 5mg', dosage:'5mg', frequency:'Once daily', duration:'30 days' }], notes:'Monitor BP weekly', createdAt:'2026-05-16T10:00:00.000Z' },
    { id:'RX-102', patientId:'PAT-102', patientName:'Fatima Zaidi', doctorId:'DOC-102', doctorName:'Dr. Ayesha Malik', date:'2026-05-18', diagnosis:'Migraine Prophylaxis', medications:[{ name:'Topiramate 25mg', dosage:'25mg', frequency:'Twice daily', duration:'30 days' },{ name:'Sumatriptan 50mg', dosage:'50mg', frequency:'As needed', duration:'10 tablets' }], notes:'Avoid trigger foods', createdAt:'2026-05-18T11:00:00.000Z' },
    { id:'RX-103', patientId:'PAT-103', patientName:'Muhammad Ali', doctorId:'DOC-103', doctorName:'Dr. Ahmed Raza', date:'2026-05-20', diagnosis:'Lumbar Spondylosis', medications:[{ name:'Naproxen 500mg', dosage:'500mg', frequency:'Twice daily', duration:'14 days' },{ name:'Omeprazole 20mg', dosage:'20mg', frequency:'Once daily', duration:'14 days' }], notes:'Avoid heavy lifting. Continue physiotherapy.', createdAt:'2026-05-20T14:00:00.000Z' },
    { id:'RX-104', patientId:'PAT-104', patientName:'Sana Riaz', doctorId:'DOC-104', doctorName:'Dr. Fatima Khan', date:'2026-05-22', diagnosis:'Upper Respiratory Tract Infection', medications:[{ name:'Amoxicillin 500mg', dosage:'500mg', frequency:'Three times daily', duration:'7 days' },{ name:'Paracetamol 500mg', dosage:'500mg', frequency:'As needed', duration:'5 days' },{ name:'Cough Syrup', dosage:'10ml', frequency:'Three times daily', duration:'7 days' }], notes:'Increase fluid intake. Rest for 2 days.', createdAt:'2026-05-22T10:30:00.000Z' },
    { id:'RX-105', patientId:'PAT-105', patientName:'Bilal Qureshi', doctorId:'DOC-101', doctorName:'Dr. Usman Ali', date:'2026-05-25', diagnosis:'Type 2 Diabetes Mellitus', medications:[{ name:'Metformin 500mg', dosage:'500mg', frequency:'Twice daily', duration:'90 days' },{ name:'Atorvastatin 10mg', dosage:'10mg', frequency:'Once daily', duration:'90 days' }], notes:'Diet control essential. Follow up in 1 month.', createdAt:'2026-05-25T16:00:00.000Z' },
    { id:'RX-106', patientId:'PAT-101', patientName:'Ahmed Khan', doctorId:'DOC-101', doctorName:'Dr. Usman Ali', date:'2026-06-01', diagnosis:'Hypertension - Follow up', medications:[{ name:'Amlodipine 5mg', dosage:'5mg', frequency:'Once daily', duration:'30 days' },{ name:'Lisinopril 10mg', dosage:'10mg', frequency:'Once daily', duration:'30 days' }], notes:'Continue current regimen. BP controlled.', createdAt:'2026-06-01T09:00:00.000Z' },
    { id:'RX-107', patientId:'PAT-103', patientName:'Muhammad Ali', doctorId:'DOC-102', doctorName:'Dr. Ayesha Malik', date:'2026-06-02', diagnosis:'Tension Headache', medications:[{ name:'Ibuprofen 400mg', dosage:'400mg', frequency:'As needed', duration:'7 days' }], notes:'Stress management techniques recommended.', createdAt:'2026-06-02T15:00:00.000Z' },
    { id:'RX-108', patientId:'PAT-104', patientName:'Sana Riaz', doctorId:'DOC-104', doctorName:'Dr. Fatima Khan', date:'2026-06-03', diagnosis:'Allergic Rhinitis', medications:[{ name:'Cetirizine 10mg', dosage:'10mg', frequency:'Once daily', duration:'30 days' },{ name:'Fluticasone Nasal Spray', dosage:'2 sprays', frequency:'Twice daily', duration:'30 days' }], notes:'Allergy testing recommended if symptoms persist.', createdAt:'2026-06-03T11:00:00.000Z' },
    { id:'RX-109', patientId:'PAT-105', patientName:'Bilal Qureshi', doctorId:'DOC-103', doctorName:'Dr. Ahmed Raza', date:'2026-06-04', diagnosis:'Plantar Fasciitis', medications:[{ name:'Diclofenac Gel', dosage:'Apply topically', frequency:'Three times daily', duration:'14 days' }], notes:'Stretching exercises. Supportive footwear.', createdAt:'2026-06-04T10:00:00.000Z' }
  ];
  d.labTests = [
    { id:'LT-101', patientId:'PAT-101', patientName:'Ahmed Khan', testTypeId:'TT-101', isHomeCollection:false, status:'completed', result:'<p><strong>Findings:</strong> All parameters within normal range.</p><ul><li>WBC: 6.2 x10^9/L (Normal 4.0-11.0)</li><li>RBC: 5.1 x10^12/L (Normal 4.5-5.5)</li><li>Hemoglobin: 15.2 g/dL (Normal 13.0-17.0)</li><li>Platelets: 250 x10^9/L (Normal 150-410)</li></ul>', createdAt:'2026-05-15T09:00:00.000Z', collectedAt:'2026-05-15T09:30:00.000Z', completedAt:'2026-05-15T12:00:00.000Z' },
    { id:'LT-102', patientId:'PAT-102', patientName:'Fatima Zaidi', testTypeId:'TT-102', isHomeCollection:true, status:'completed', result:'<p><strong>Findings:</strong> Mildly elevated fasting glucose.</p><ul><li>Fasting Glucose: 6.2 mmol/L (Normal 3.9-5.5)</li><li>HbA1c: 5.8% (Normal below 5.7%)</li></ul><p><strong>Recommendation:</strong> Follow-up with endocrinologist. Repeat test in 3 months.</p>', createdAt:'2026-05-20T10:00:00.000Z', collectedAt:'2026-05-21T08:00:00.000Z', completedAt:'2026-05-21T14:00:00.000Z' },
    { id:'LT-103', patientId:'PAT-103', patientName:'Muhammad Ali', testTypeId:'TT-104', isHomeCollection:false, status:'pending', result:null, createdAt:'2026-06-07T11:00:00.000Z', collectedAt:null, completedAt:null },
    { id:'LT-104', patientId:'PAT-104', patientName:'Sana Riaz', testTypeId:'TT-103', isHomeCollection:true, status:'collected', result:null, createdAt:'2026-06-06T14:00:00.000Z', collectedAt:'2026-06-07T07:00:00.000Z', completedAt:null },
    { id:'LT-105', patientId:'PAT-105', patientName:'Bilal Qureshi', testTypeId:'TT-105', isHomeCollection:false, status:'completed', result:'<p><strong>Findings:</strong> Normal lipid profile.</p><ul><li>Total Cholesterol: 180 mg/dL (Normal 125-200)</li><li>HDL: 45 mg/dL (Normal 40-60)</li><li>LDL: 110 mg/dL (Normal below 130)</li><li>Triglycerides: 150 mg/dL (Normal below 150)</li></ul>', createdAt:'2026-05-28T09:00:00.000Z', collectedAt:'2026-05-28T10:00:00.000Z', completedAt:'2026-05-28T15:00:00.000Z' },
    { id:'LT-106', patientId:'PAT-101', patientName:'Ahmed Khan', testTypeId:'TT-106', isHomeCollection:false, status:'pending', result:null, createdAt:'2026-06-07T16:00:00.000Z', collectedAt:null, completedAt:null },
    { id:'LT-107', patientId:'PAT-102', patientName:'Fatima Zaidi', testTypeId:'TT-107', isHomeCollection:false, status:'pending', result:null, createdAt:'2026-06-08T09:00:00.000Z', collectedAt:null, completedAt:null },
    { id:'LT-108', patientId:'PAT-103', patientName:'Muhammad Ali', testTypeId:'TT-108', isHomeCollection:true, status:'pending', result:null, createdAt:'2026-06-08T11:00:00.000Z', collectedAt:null, completedAt:null }
  ];
  d.medicines = [
    { id:'MED-101', name:'Paracetamol 500mg', price:50, stock:1000, category:'Analgesic', minStock:100, manufacturer:'Pfizer Pakistan' },
    { id:'MED-102', name:'Amoxicillin 500mg', price:120, stock:500, category:'Antibiotic', minStock:50, manufacturer:'GSK Pakistan' },
    { id:'MED-103', name:'Amlodipine 5mg', price:80, stock:300, category:'Cardiovascular', minStock:30, manufacturer:'Highnoon Laboratories' },
    { id:'MED-104', name:'Metformin 500mg', price:60, stock:800, category:'Endocrine', minStock:100, manufacturer:'PharmEvo' },
    { id:'MED-105', name:'Omeprazole 20mg', price:90, stock:400, category:'Gastroenterology', minStock:40, manufacturer:'Getz Pharma' },
    { id:'MED-106', name:'Cetirizine 10mg', price:40, stock:600, category:'Antihistamine', minStock:60, manufacturer:'Sami Pharmaceuticals' },
    { id:'MED-107', name:'Ibuprofen 400mg', price:55, stock:700, category:'Analgesic', minStock:70, manufacturer:'Abbott Laboratories' },
    { id:'MED-108', name:'Atorvastatin 10mg', price:150, stock:250, category:'Cardiovascular', minStock:25, manufacturer:'Pfizer Pakistan' },
    { id:'MED-109', name:'Diclofenac Sodium 50mg', price:45, stock:450, category:'Analgesic', minStock:45, manufacturer:'Novartis Pharma' },
    { id:'MED-110', name:'Salbutamol Inhaler', price:350, stock:150, category:'Respiratory', minStock:20, manufacturer:'GSK Pakistan' },
    { id:'MED-111', name:'Insulin Glargine 100IU', price:850, stock:100, category:'Endocrine', minStock:15, manufacturer:'Sanofi Aventis' },
    { id:'MED-112', name:'Cough Syrup (DM)', price:95, stock:350, category:'Respiratory', minStock:35, manufacturer:'Martin Dow' },
    { id:'MED-113', name:'Fluticasone Nasal Spray', price:550, stock:80, category:'Allergy', minStock:10, manufacturer:'GSK Pakistan' },
    { id:'MED-114', name:'Lisinopril 10mg', price:110, stock:200, category:'Cardiovascular', minStock:20, manufacturer:'Highnoon Laboratories' },
    { id:'MED-115', name:'Losartan 50mg', price:130, stock:220, category:'Cardiovascular', minStock:20, manufacturer:'PharmEvo' },
    { id:'MED-116', name:'Naproxen 500mg', price:70, stock:300, category:'Analgesic', minStock:30, manufacturer:'Searle Pakistan' },
    { id:'MED-117', name:'Prednisolone 5mg', price:65, stock:180, category:'Steroid', minStock:18, manufacturer:'Abbott Laboratories' },
    { id:'MED-118', name:'Aspirin 75mg', price:25, stock:1000, category:'Cardiovascular', minStock:100, manufacturer:'Bayer Pakistan' },
    { id:'MED-119', name:'Topiramate 25mg', price:200, stock:120, category:'Neurology', minStock:12, manufacturer:'Janssen Pharmaceuticals' },
    { id:'MED-120', name:'Sumatriptan 50mg', price:280, stock:90, category:'Neurology', minStock:10, manufacturer:'GSK Pakistan' }
  ];
  d.pharmacists = [
    { id:'PHARM-101', name:'Zeeshan Pharmacy', email:'pharmacy@zh.com', pass:'123456', license:'PHA-001', address:'Main Branch, ZH Hospital Road, Karachi', phone:'+92 300 9999999', timings:'8:00 AM - 10:00 PM' }
  ];
  d.labs = [
    { id:'LAB-101', name:'ZH Diagnostics Lab', email:'lab@zh.com', pass:'123456', license:'LAB-001', address:'ZH Hospital Campus, Karachi', phone:'+92 300 8888888', accreditation:'ISO 15189' }
  ];
  d.testCategories = [
    { id:'TC-1', name:'Hematology', description:'Blood and blood-forming tissues' },
    { id:'TC-2', name:'Biochemistry', description:'Chemical analysis of body fluids' },
    { id:'TC-3', name:'Microbiology', description:'Study of microorganisms' },
    { id:'TC-4', name:'Pathology', description:'Study of disease processes' },
    { id:'TC-5', name:'Radiology', description:'Medical imaging' }
  ];
  d.testTypes = [
    { id:'TT-101', name:'Complete Blood Count (CBC)', price:500, categoryId:'TC-1', preparation:'No special preparation required', turnaround:'2 hours' },
    { id:'TT-102', name:'Blood Glucose Fasting', price:300, categoryId:'TC-2', preparation:'8-12 hours fasting required', turnaround:'1 hour' },
    { id:'TT-103', name:'Lipid Profile', price:800, categoryId:'TC-2', preparation:'10-12 hours fasting required', turnaround:'4 hours' },
    { id:'TT-104', name:'Liver Function Test (LFT)', price:700, categoryId:'TC-2', preparation:'No special preparation required', turnaround:'3 hours' },
    { id:'TT-105', name:'Renal Function Test (RFT)', price:650, categoryId:'TC-2', preparation:'No special preparation required', turnaround:'3 hours' },
    { id:'TT-106', name:'Thyroid Profile (T3,T4,TSH)', price:1200, categoryId:'TC-2', preparation:'No special preparation required', turnaround:'6 hours' },
    { id:'TT-107', name:'Urinalysis', price:200, categoryId:'TC-1', preparation:'Clean catch mid-stream sample', turnaround:'1 hour' },
    { id:'TT-108', name:'ECG', price:500, categoryId:'TC-5', preparation:'No special preparation required', turnaround:'30 minutes' },
    { id:'TT-109', name:'Chest X-Ray', price:1000, categoryId:'TC-5', preparation:'No special preparation required', turnaround:'1 hour' },
    { id:'TT-110', name:'HbA1c', price:900, categoryId:'TC-2', preparation:'No special preparation required', turnaround:'24 hours' },
    { id:'TT-111', name:'Blood Culture', price:1500, categoryId:'TC-3', preparation:'No special preparation required', turnaround:'72 hours' },
    { id:'TT-112', name:'Vitamin D Test', price:2000, categoryId:'TC-2', preparation:'No special preparation required', turnaround:'24 hours' }
  ];
  d.notifications = [];
  d.messages = [
    { id:'MSG-1', name:'Ali Ahmed', email:'ali@example.com', subject:'Booking Inquiry', message:'I would like to book an appointment with a cardiologist for my father. Could you please guide me on the process?', read:false, createdAt:'2026-06-05T10:30:00.000Z' },
    { id:'MSG-2', name:'Sarah Khan', email:'sarah@example.com', subject:'Lab Test Pricing', message:'What are your current prices for a complete blood count and thyroid profile? Do you offer home collection services?', read:false, createdAt:'2026-06-06T14:15:00.000Z' },
    { id:'MSG-3', name:'Dr. Imran Ali', email:'imran@clinic.com', subject:'Partnership Opportunity', message:'I run a private clinic in Gulshan and am interested in partnering with Zeeshan Hospital for referrals and lab services.', read:true, createdAt:'2026-06-04T09:00:00.000Z' }
  ];
  d.nextId = 500;
  d._version = 3;
  d._seeded = true;
  await saveDB(d);
}

function genId() {
  if (!dbCache) return 'ZH-' + Date.now();
  dbCache.nextId = (dbCache.nextId || 0) + 1;
  return 'ZH-' + dbCache.nextId;
}

async function resetDB() {
  if (dbCache) {
    dbCache._seeded = false;
    await seedIfEmpty();
  }
  location.reload();
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
    if (hint) hint.innerHTML = 'New user? Register below. Demo: <strong>ahmed@test.com</strong> / <strong>123456</strong>';
    if (toggleText) toggleText.style.display = 'block';
  } else {
    var creds = { doctor: 'doctor@zh.com / 123456', pharmacy: 'pharmacy@zh.com / 123456', lab: 'lab@zh.com / 123456' };
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
    var cred = await auth.signInWithEmailAndPassword(email, pass);
    var user = cred.user;
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
      if (email === 'admin@zh.com') { authUser = { id:'ADMIN', name:'Admin', email:'admin@zh.com', role:'admin' }; }
      else { authUser = { id:user.uid, name:user.email, email:user.email, role:'patient' }; }
    }
    loginSuccess(user.uid, authUser);
  } catch (e) {
    var msg = e.code === 'auth/user-not-found' ? 'Account not found. Register first.' : e.code === 'auth/wrong-password' ? 'Wrong password' : e.code === 'auth/invalid-email' ? 'Invalid email' : e.message || 'Login failed';
    showToast(msg, 'error');
  }
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
    var cred = await auth.createUserWithEmailAndPassword(email, pass);
    var d = getDB();
    if (!d) d = { patients: [], doctors: [], appointments: [], prescriptions: [], labTests: [], medicines: [], pharmacists: [], labs: [], notifications: [], messages: [], testTypes: [], testCategories: [], nextId: 1, _version: 3, _seeded: true };
    var newUser = { id: genId(), name: name, email: email, pass: pass, phone: '', bloodGroup: '', gender: '', dob: '', address: '', createdAt: new Date().toISOString() };
    d.patients.push(newUser);
    await saveDB(d);
    authUser = newUser;
    authUser.role = 'patient';
    loginSuccess(cred.user.uid, authUser);
  } catch (e) {
    var msg = e.code === 'auth/email-already-in-use' ? 'Email already registered. Please login.' : e.code === 'auth/weak-password' ? 'Password too weak' : e.message || 'Registration failed';
    showToast(msg, 'error');
  }
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
    await auth.signInWithEmailAndPassword('admin@zh.com', '123');
    await fetchDB();
    authUser = { id:'ADMIN', name:'Admin', email:'admin@zh.com', role:'admin' };
    localStorage.setItem('zh_token', 'admin');
    localStorage.setItem('zh_user', JSON.stringify(authUser));
    localStorage.setItem('zh_role', 'admin');
    localStorage.setItem('zh_login_time', Date.now().toString());
    window.location.href = 'admin.html';
  } catch (e) { showToast('Backend not reachable. Create admin@zh.com / 123 in Firebase Auth first.', 'error'); }
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
            nextId: 1, _version: 3, _seeded: false
          };
        }
        if (!dbCache._seeded) await seedIfEmpty();
      } catch (e) { console.error('DB fetch failed', e); }
    }
    resolve();
  });
});

// ---------- Close modal on outside click ----------
document.addEventListener('click', function(e) {
  document.querySelectorAll('.modal.active').forEach(function(m) {
    if (e.target === m) closeModal(m.id);
  });
});
