const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'zh-secret-key-change-in-production';
const DB_PATH = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from parent directory (ZH/)
app.use(express.static(path.join(__dirname, '..')));

// ==================== DATABASE ====================

let db = null;

function createFreshDB() {
  return {
    _version: 3, _seeded: false,
    patients: [], doctors: [], pharmacists: [], labs: [],
    appointments: [], prescriptions: [], labTests: [],
    medicines: [], testTypes: [], testCategories: [],
    messages: [], notifications: [], nextId: 100
  };
}

function loadDB() {
  if (fs.existsSync(DB_PATH)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      if (db && db.patients) return db;
    } catch (e) { console.error('DB corrupted, recreating...'); }
  }
  db = createFreshDB();
  seedDatabase(db);
  saveDB();
  return db;
}

function saveDB() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function genId() {
  db.nextId++;
  saveDB();
  return 'ZH-' + db.nextId;
}

// ==================== SEED DATA ====================

function daysFromNow(n) {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}
function daysAgoISO(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString();
}

function genDefaultSchedule() {
  const slots = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','14:00','14:30','15:00','15:30','16:00','16:30'];
  return [
    { day: 'Monday', start: '09:00', end: '17:00', slots: slots, isAvailable: true },
    { day: 'Tuesday', start: '09:00', end: '17:00', slots: slots, isAvailable: true },
    { day: 'Wednesday', start: '09:00', end: '17:00', slots: slots, isAvailable: true },
    { day: 'Thursday', start: '09:00', end: '17:00', slots: slots, isAvailable: true },
    { day: 'Friday', start: '09:00', end: '17:00', slots: slots, isAvailable: true },
    { day: 'Saturday', start: '09:00', end: '13:00', slots: slots.slice(0, 5), isAvailable: true },
    { day: 'Sunday', start: '', end: '', slots: [], isAvailable: false }
  ];
}

function seedDatabase(db) {
  if (db._seeded) return;

  // Patients
  db.patients = [
    { id: 'PAT-101', name: 'Ahmed Khan', email: 'ahmed@test.com', pass: '123', phone: '+92 300 1111111', dob: '1985-03-15', gender: 'Male', bloodGroup: 'A+', address: 'House 12, Block B, Gulshan-e-Maymar, Karachi', createdAt: daysAgoISO(60) },
    { id: 'PAT-102', name: 'Sara Fatima', email: 'sara@test.com', pass: '123', phone: '+92 321 2222222', dob: '1992-07-22', gender: 'Female', bloodGroup: 'B+', address: 'Flat 5, Al-Noor Apartments, Clifton, Karachi', createdAt: daysAgoISO(58) },
    { id: 'PAT-103', name: 'Ali Raza', email: 'ali@test.com', pass: '123', phone: '+92 333 3333333', dob: '1978-11-10', gender: 'Male', bloodGroup: 'O+', address: 'Street 4, Phase 2, DHA, Lahore', createdAt: daysAgoISO(55) },
    { id: 'PAT-104', name: 'Fatima Noor', email: 'fatima@test.com', pass: '123', phone: '+92 345 4444444', dob: '1995-01-05', gender: 'Female', bloodGroup: 'AB+', address: 'Gulberg III, Lahore', createdAt: daysAgoISO(50) },
    { id: 'PAT-105', name: 'Usman Tariq', email: 'usman@test.com', pass: '123', phone: '+92 312 5555555', dob: '1982-09-30', gender: 'Male', bloodGroup: 'A-', address: 'North Nazimabad, Karachi', createdAt: daysAgoISO(45) },
  ];

  // Doctors
  const schedule = genDefaultSchedule();
  db.doctors = [
    { id: 'DOC-101', name: 'Dr. Usman Ali', email: 'doctor@zh.com', pass: '123', spec: 'Cardiology', license: 'PMC-1234', qualification: 'MBBS, FCPS (Cardiology)', experience: 15, consultationFee: 1500, schedule: JSON.parse(JSON.stringify(schedule)) },
    { id: 'DOC-102', name: 'Dr. Sara Khan', email: 'sara@zh.com', pass: '123', spec: 'Dermatology', license: 'PMC-5678', qualification: 'MBBS, FCPS (Dermatology)', experience: 10, consultationFee: 1200, schedule: JSON.parse(JSON.stringify(schedule)) },
    { id: 'DOC-103', name: 'Dr. Ahmed Raza', email: 'ahmed@zh.com', pass: '123', spec: 'General Medicine', license: 'PMC-9012', qualification: 'MBBS, MD (Internal Medicine)', experience: 20, consultationFee: 1000, schedule: JSON.parse(JSON.stringify(schedule)) },
    { id: 'DOC-104', name: 'Dr. Fatima Zafar', email: 'fatima.doc@zh.com', pass: '123', spec: 'Pediatrics', license: 'PMC-3456', qualification: 'MBBS, FCPS (Pediatrics)', experience: 8, consultationFee: 1300, schedule: JSON.parse(JSON.stringify(schedule)) },
  ];

  // Pharmacy & Lab
  db.pharmacists = [
    { id: 'PHARM-101', name: 'Zeeshan Pharmacy', email: 'pharmacy@zh.com', pass: '123', license: 'PHA-001', address: 'Main Branch, Gulshan-e-Maymar, Karachi', phone: '+92 300 9999999', timings: '8:00 AM - 10:00 PM' }
  ];
  db.labs = [
    { id: 'LAB-101', name: 'ZH Diagnostics Lab', email: 'lab@zh.com', pass: '123', license: 'LAB-001', address: 'ZH Hospital Campus, Karachi', phone: '+92 300 8888888', accreditation: 'ISO 15189' }
  ];

  // Test Categories
  db.testCategories = [
    { id: 'TC-1', name: 'Hematology', description: 'Blood and blood-forming tissues' },
    { id: 'TC-2', name: 'Biochemistry', description: 'Chemical processes in the body' },
    { id: 'TC-3', name: 'Microbiology', description: 'Microorganisms and infections' },
    { id: 'TC-4', name: 'Serology', description: 'Antibodies and antigens in blood serum' }
  ];

  // Test Types
  db.testTypes = [
    { id: 'TT-101', name: 'Complete Blood Count (CBC)', price: 500, categoryId: 'TC-1', preparation: 'No special preparation required', turnaround: '2 hours' },
    { id: 'TT-102', name: 'Blood Sugar (Fasting)', price: 300, categoryId: 'TC-2', preparation: '8-10 hours fasting required', turnaround: '1 hour' },
    { id: 'TT-103', name: 'Lipid Profile', price: 800, categoryId: 'TC-2', preparation: '10-12 hours fasting required', turnaround: '4 hours' },
    { id: 'TT-104', name: 'Liver Function Test', price: 1000, categoryId: 'TC-2', preparation: 'Fasting recommended', turnaround: '4 hours' },
    { id: 'TT-105', name: 'Thyroid Profile (T3, T4, TSH)', price: 1200, categoryId: 'TC-2', preparation: 'No special preparation', turnaround: '6 hours' },
    { id: 'TT-106', name: 'Urinalysis', price: 200, categoryId: 'TC-3', preparation: 'Clean catch mid-stream sample', turnaround: '1 hour' },
    { id: 'TT-107', name: 'Malaria Parasite (MP)', price: 600, categoryId: 'TC-3', preparation: 'No special preparation', turnaround: '2 hours' },
    { id: 'TT-108', name: 'Dengue NS1 Antigen', price: 1500, categoryId: 'TC-4', preparation: 'No special preparation', turnaround: '3 hours' },
    { id: 'TT-109', name: 'HbA1c', price: 900, categoryId: 'TC-2', preparation: 'No fasting required', turnaround: '6 hours' },
    { id: 'TT-110', name: 'Vitamin D (25-OH)', price: 2500, categoryId: 'TC-2', preparation: 'No special preparation', turnaround: '24 hours' },
  ];

  // Medicines
  db.medicines = [
    { id: 'MED-101', name: 'Paracetamol 500mg', price: 50, stock: 1000, category: 'Analgesic', minStock: 100, manufacturer: 'Pfizer Pakistan' },
    { id: 'MED-102', name: 'Amoxicillin 250mg', price: 120, stock: 500, category: 'Antibiotic', minStock: 50, manufacturer: 'GSK Pakistan' },
    { id: 'MED-103', name: 'Omeprazole 20mg', price: 80, stock: 750, category: 'PPI', minStock: 50, manufacturer: 'Highnoon Pharma' },
    { id: 'MED-104', name: 'Metformin 500mg', price: 60, stock: 600, category: 'Antidiabetic', minStock: 50, manufacturer: 'Martin Dow' },
    { id: 'MED-105', name: 'Atorvastatin 10mg', price: 150, stock: 400, category: 'Statin', minStock: 30, manufacturer: 'Pfizer Pakistan' },
    { id: 'MED-106', name: 'Amlodipine 5mg', price: 80, stock: 500, category: 'Calcium Blocker', minStock: 30, manufacturer: 'Getz Pharma' },
    { id: 'MED-107', name: 'Losartan 50mg', price: 120, stock: 400, category: 'ARB', minStock: 30, manufacturer: 'MSD Pakistan' },
    { id: 'MED-108', name: 'Levothyroxine 50mcg', price: 60, stock: 300, category: 'Thyroid Hormone', minStock: 20, manufacturer: 'Abbott Labs' },
    { id: 'MED-109', name: 'Cetirizine 10mg', price: 30, stock: 1000, category: 'Antihistamine', minStock: 50, manufacturer: 'GSK Pakistan' },
    { id: 'MED-110', name: 'Amoxicillin 500mg', price: 150, stock: 600, category: 'Antibiotic', minStock: 50, manufacturer: 'GSK Pakistan' },
    { id: 'MED-111', name: 'Ibuprofen 400mg', price: 40, stock: 800, category: 'NSAID', minStock: 50, manufacturer: 'Abbott Labs' },
    { id: 'MED-112', name: 'Aspirin 75mg', price: 25, stock: 2000, category: 'Antiplatelet', minStock: 100, manufacturer: 'Bayer Pakistan' },
    { id: 'MED-113', name: 'Insulin Glargine 100IU', price: 800, stock: 100, category: 'Antidiabetic', minStock: 20, manufacturer: 'Sanofi' },
    { id: 'MED-114', name: 'Salbutamol Inhaler', price: 350, stock: 200, category: 'Bronchodilator', minStock: 20, manufacturer: 'Highnoon Pharma' },
    { id: 'MED-115', name: 'Clindamycin 1% Gel', price: 250, stock: 150, category: 'Topical Antibiotic', minStock: 20, manufacturer: 'Martin Dow' },
    { id: 'MED-116', name: 'Sumatriptan 50mg', price: 180, stock: 120, category: 'Antimigraine', minStock: 20, manufacturer: 'GSK Pakistan' },
    { id: 'MED-117', name: 'Fluticasone Nasal Spray', price: 400, stock: 90, category: 'Corticosteroid', minStock: 15, manufacturer: 'Pfizer Pakistan' },
    { id: 'MED-118', name: 'Pantoprazole 40mg', price: 100, stock: 450, category: 'PPI', minStock: 30, manufacturer: 'Getz Pharma' },
    { id: 'MED-119', name: 'Furosemide 40mg', price: 50, stock: 350, category: 'Diuretic', minStock: 30, manufacturer: 'Sanofi' },
    { id: 'MED-120', name: 'Nitroglycerin 0.5mg SL', price: 120, stock: 200, category: 'Coronary Vasodilator', minStock: 20, manufacturer: 'Pfizer Pakistan' },
  ];

  // Appointments
  db.appointments = [
    { id: 'APT-101', patientId: 'PAT-101', patientName: 'Ahmed Khan', doctorId: 'DOC-101', date: daysFromNow(3), time: '10:00', status: 'pending', type: 'video', notes: '', createdAt: daysAgoISO(2) },
    { id: 'APT-102', patientId: 'PAT-102', patientName: 'Sara Fatima', doctorId: 'DOC-102', date: daysFromNow(1), time: '11:30', status: 'confirmed', type: 'clinic', notes: 'Skin rash on arms', createdAt: daysAgoISO(5) },
    { id: 'APT-103', patientId: 'PAT-103', patientName: 'Ali Raza', doctorId: 'DOC-103', date: daysFromNow(-15), time: '09:00', status: 'completed', type: 'clinic', notes: 'Routine checkup, BP normal', createdAt: daysAgoISO(18) },
    { id: 'APT-104', patientId: 'PAT-104', patientName: 'Fatima Noor', doctorId: 'DOC-101', date: daysFromNow(5), time: '14:00', status: 'confirmed', type: 'video', notes: '', createdAt: daysAgoISO(3) },
    { id: 'APT-105', patientId: 'PAT-105', patientName: 'Usman Tariq', doctorId: 'DOC-104', date: daysFromNow(-10), time: '10:30', status: 'completed', type: 'clinic', notes: 'Child vaccination follow-up', createdAt: daysAgoISO(12) },
    { id: 'APT-106', patientId: 'PAT-101', patientName: 'Ahmed Khan', doctorId: 'DOC-103', date: daysFromNow(-20), time: '15:00', status: 'cancelled', type: 'video', notes: 'Patient cancelled due to emergency', createdAt: daysAgoISO(22) },
    { id: 'APT-107', patientId: 'PAT-102', patientName: 'Sara Fatima', doctorId: 'DOC-101', date: daysFromNow(7), time: '09:30', status: 'pending', type: 'clinic', notes: '', createdAt: daysAgoISO(1) },
    { id: 'APT-108', patientId: 'PAT-103', patientName: 'Ali Raza', doctorId: 'DOC-104', date: daysFromNow(2), time: '16:00', status: 'confirmed', type: 'video', notes: 'Cough and fever for 3 days', createdAt: daysAgoISO(4) },
    { id: 'APT-109', patientId: 'PAT-104', patientName: 'Fatima Noor', doctorId: 'DOC-102', date: daysFromNow(-5), time: '12:00', status: 'completed', type: 'clinic', notes: 'Acne treatment review, improvement noted', createdAt: daysAgoISO(7) },
    { id: 'APT-110', patientId: 'PAT-105', patientName: 'Usman Tariq', doctorId: 'DOC-103', date: daysFromNow(10), time: '11:00', status: 'pending', type: 'video', notes: '', createdAt: daysAgoISO(1) },
    { id: 'APT-111', patientId: 'PAT-101', patientName: 'Ahmed Khan', doctorId: 'DOC-104', date: daysFromNow(0), time: '14:30', status: 'confirmed', type: 'clinic', notes: 'Child regular checkup', createdAt: daysAgoISO(6) },
    { id: 'APT-112', patientId: 'PAT-104', patientName: 'Fatima Noor', doctorId: 'DOC-103', date: daysFromNow(-30), time: '10:00', status: 'completed', type: 'clinic', notes: 'Annual health screening', createdAt: daysAgoISO(32) },
  ];

  // Prescriptions
  db.prescriptions = [
    { id: 'RX-101', patientId: 'PAT-101', patientName: 'Ahmed Khan', doctorId: 'DOC-103', doctorName: 'Dr. Ahmed Raza', date: daysFromNow(-20), diagnosis: 'Essential Hypertension', notes: 'Monitor BP weekly. Reduce salt intake. Exercise 30 min daily.', medications: [{ name: 'Amlodipine 5mg', dosage: '5mg', frequency: 'Once daily', duration: '30 days' }, { name: 'Losartan 50mg', dosage: '50mg', frequency: 'Once daily', duration: '30 days' }, { name: 'Aspirin 75mg', dosage: '75mg', frequency: 'Once daily', duration: '90 days' }], createdAt: daysAgoISO(20) },
    { id: 'RX-102', patientId: 'PAT-102', patientName: 'Sara Fatima', doctorId: 'DOC-102', doctorName: 'Dr. Sara Khan', date: daysFromNow(-5), diagnosis: 'Acne Vulgaris', notes: 'Avoid oily foods. Use non-comedogenic moisturizer. Follow up in 8 weeks.', medications: [{ name: 'Isotretinoin 20mg', dosage: '20mg', frequency: 'Once daily with food', duration: '8 weeks' }, { name: 'Clindamycin 1% Gel', dosage: '1%', frequency: 'Apply twice daily', duration: '30 days' }], createdAt: daysAgoISO(5) },
    { id: 'RX-103', patientId: 'PAT-103', patientName: 'Ali Raza', doctorId: 'DOC-101', doctorName: 'Dr. Usman Ali', date: daysFromNow(-15), diagnosis: 'Stable Angina Pectoris', notes: 'ECG done. Stress test recommended.', medications: [{ name: 'Aspirin 75mg', dosage: '75mg', frequency: 'Once daily', duration: '90 days' }, { name: 'Nitroglycerin 0.5mg SL', dosage: '0.5mg', frequency: 'As needed for chest pain', duration: '30 days' }, { name: 'Atorvastatin 10mg', dosage: '10mg', frequency: 'Once daily at night', duration: '90 days' }], createdAt: daysAgoISO(15) },
    { id: 'RX-104', patientId: 'PAT-104', patientName: 'Fatima Noor', doctorId: 'DOC-104', doctorName: 'Dr. Fatima Zafar', date: daysFromNow(-10), diagnosis: 'Acute Pharyngitis', notes: 'Gargle with warm salt water. Stay hydrated.', medications: [{ name: 'Amoxicillin 250mg', dosage: '250mg', frequency: 'Three times daily', duration: '7 days' }, { name: 'Paracetamol 500mg', dosage: '500mg', frequency: 'As needed for fever', duration: '5 days' }, { name: 'Pantoprazole 40mg', dosage: '40mg', frequency: 'Once daily before breakfast', duration: '7 days' }], createdAt: daysAgoISO(10) },
    { id: 'RX-105', patientId: 'PAT-105', patientName: 'Usman Tariq', doctorId: 'DOC-103', doctorName: 'Dr. Ahmed Raza', date: daysFromNow(-25), diagnosis: 'Type 2 Diabetes Mellitus', notes: 'HbA1c 7.8%. Diet control and exercise.', medications: [{ name: 'Metformin 500mg', dosage: '500mg', frequency: 'Twice daily with meals', duration: '90 days' }, { name: 'Glimepiride 2mg', dosage: '2mg', frequency: 'Once daily with breakfast', duration: '90 days' }], createdAt: daysAgoISO(25) },
    { id: 'RX-106', patientId: 'PAT-101', patientName: 'Ahmed Khan', doctorId: 'DOC-101', doctorName: 'Dr. Usman Ali', date: daysFromNow(-30), diagnosis: 'Migraine without Aura', notes: 'Identify and avoid triggers.', medications: [{ name: 'Sumatriptan 50mg', dosage: '50mg', frequency: 'At onset, max 2 per day', duration: '10 tablets course' }, { name: 'Ibuprofen 400mg', dosage: '400mg', frequency: 'Twice daily as needed', duration: '5 days' }], createdAt: daysAgoISO(30) },
    { id: 'RX-107', patientId: 'PAT-102', patientName: 'Sara Fatima', doctorId: 'DOC-102', doctorName: 'Dr. Sara Khan', date: daysFromNow(-12), diagnosis: 'Atopic Dermatitis (Eczema)', notes: 'Use mild soap. Moisturize regularly.', medications: [{ name: 'Hydrocortisone 1% Cream', dosage: '1%', frequency: 'Apply twice daily', duration: '14 days' }, { name: 'Cetirizine 10mg', dosage: '10mg', frequency: 'Once daily at bedtime', duration: '14 days' }], createdAt: daysAgoISO(12) },
    { id: 'RX-108', patientId: 'PAT-103', patientName: 'Ali Raza', doctorId: 'DOC-104', doctorName: 'Dr. Fatima Zafar', date: daysFromNow(-8), diagnosis: 'Allergic Rhinitis', notes: 'Avoid dust and pollen.', medications: [{ name: 'Loratadine 10mg', dosage: '10mg', frequency: 'Once daily', duration: '30 days' }, { name: 'Fluticasone Nasal Spray', dosage: '50mcg/spray', frequency: '2 sprays each nostril once daily', duration: '30 days' }], createdAt: daysAgoISO(8) },
    { id: 'RX-109', patientId: 'PAT-104', patientName: 'Fatima Noor', doctorId: 'DOC-103', doctorName: 'Dr. Ahmed Raza', date: daysFromNow(-35), diagnosis: 'Hypothyroidism', notes: 'Take on empty stomach 30 min before breakfast.', medications: [{ name: 'Levothyroxine 50mcg', dosage: '50mcg', frequency: 'Once daily on empty stomach', duration: '90 days' }], createdAt: daysAgoISO(35) },
  ];

  // Lab Tests
  db.labTests = [
    { id: 'LT-101', patientId: 'PAT-101', patientName: 'Ahmed Khan', testTypeId: 'TT-101', isHomeCollection: false, status: 'completed', homeAddress: '', preferredDate: '', preferredTime: '', result: '<p><strong>Findings:</strong> normal</p><pre style="white-space:pre-wrap;font-family:inherit;">Hemoglobin: 14.8 g/dL (13.0-17.0)\nWBC Count: 7.2 x10^9/L (4.0-11.0)\nPlatelets: 245 x10^9/L (150-400)</pre><p><em>Reported on ' + daysFromNow(-18) + '</em></p>', createdAt: daysAgoISO(20), collectedAt: daysAgoISO(19), completedAt: daysAgoISO(18) },
    { id: 'LT-102', patientId: 'PAT-102', patientName: 'Sara Fatima', testTypeId: 'TT-102', isHomeCollection: false, status: 'pending', homeAddress: '', preferredDate: '', preferredTime: '', result: null, createdAt: daysAgoISO(3), collectedAt: null, completedAt: null },
    { id: 'LT-103', patientId: 'PAT-103', patientName: 'Ali Raza', testTypeId: 'TT-103', isHomeCollection: false, status: 'completed', homeAddress: '', preferredDate: '', preferredTime: '', result: '<p><strong>Findings:</strong> abnormal (high cholesterol)</p><pre style="white-space:pre-wrap;font-family:inherit;">Total Cholesterol: 245 mg/dL (&lt;200)\nTriglycerides: 180 mg/dL (&lt;150)\nHDL Cholesterol: 38 mg/dL (&gt;40)\nLDL Cholesterol: 172 mg/dL (&lt;130)</pre><p><em>Reported on ' + daysFromNow(-13) + '</em></p>', createdAt: daysAgoISO(15), collectedAt: daysAgoISO(14), completedAt: daysAgoISO(13) },
    { id: 'LT-104', patientId: 'PAT-104', patientName: 'Fatima Noor', testTypeId: 'TT-104', isHomeCollection: true, status: 'pending', homeAddress: 'House 8, Street 12, Gulberg III, Lahore', preferredDate: daysFromNow(2), preferredTime: '09:00-11:00', result: null, createdAt: daysAgoISO(1), collectedAt: null, completedAt: null },
    { id: 'LT-105', patientId: 'PAT-105', patientName: 'Usman Tariq', testTypeId: 'TT-105', isHomeCollection: true, status: 'collected', homeAddress: 'Plot 45, Block C, North Nazimabad, Karachi', preferredDate: daysFromNow(-1), preferredTime: '14:00-16:00', result: null, createdAt: daysAgoISO(3), collectedAt: daysAgoISO(1), completedAt: null },
    { id: 'LT-106', patientId: 'PAT-101', patientName: 'Ahmed Khan', testTypeId: 'TT-106', isHomeCollection: false, status: 'pending', homeAddress: '', preferredDate: '', preferredTime: '', result: null, createdAt: daysAgoISO(2), collectedAt: null, completedAt: null },
    { id: 'LT-107', patientId: 'PAT-102', patientName: 'Sara Fatima', testTypeId: 'TT-101', isHomeCollection: false, status: 'collected', homeAddress: '', preferredDate: '', preferredTime: '', result: null, createdAt: daysAgoISO(5), collectedAt: daysAgoISO(4), completedAt: null },
    { id: 'LT-108', patientId: 'PAT-105', patientName: 'Usman Tariq', testTypeId: 'TT-109', isHomeCollection: false, status: 'completed', homeAddress: '', preferredDate: '', preferredTime: '', result: '<p><strong>Findings:</strong> abnormal (elevated)</p><pre style="white-space:pre-wrap;font-family:inherit;">HbA1c: 7.9% (&lt;5.7% normal, 5.7-6.4% prediabetes, &gt;6.5% diabetes)</pre><p><em>Reported on ' + daysFromNow(-23) + '</em></p>', createdAt: daysAgoISO(25), collectedAt: daysAgoISO(24), completedAt: daysAgoISO(23) },
  ];

  // Notifications
  db.notifications = [
    { id: 'NOT-101', userId: 'PAT-101', title: 'Appointment Confirmed', message: 'Your appointment with Dr. Fatima Zafar on ' + daysFromNow(0) + ' at 14:30 has been confirmed.', type: 'success', read: false, createdAt: daysAgoISO(6) },
    { id: 'NOT-102', userId: 'PAT-101', title: 'Lab Result Ready', message: 'Your CBC test results are now available for viewing.', type: 'info', read: false, createdAt: daysAgoISO(18) },
    { id: 'NOT-103', userId: 'PAT-102', title: 'Appointment Reminder', message: 'You have an appointment with Dr. Sara Khan tomorrow at 11:30.', type: 'warning', read: false, createdAt: daysAgoISO(2) },
    { id: 'NOT-104', userId: 'PAT-103', title: 'Prescription Issued', message: 'Dr. Fatima Zafar has issued a new prescription.', type: 'info', read: true, createdAt: daysAgoISO(8) },
    { id: 'NOT-105', userId: 'PAT-104', title: 'Home Collection Scheduled', message: 'Your home blood collection has been scheduled.', type: 'success', read: false, createdAt: daysAgoISO(1) },
    { id: 'NOT-106', userId: 'PAT-105', title: 'Appointment Reminder', message: 'You have a video consultation with Dr. Ahmed Raza on ' + daysFromNow(10) + ' at 11:00.', type: 'warning', read: false, createdAt: daysAgoISO(1) },
    { id: 'NOT-107', userId: 'DOC-101', title: 'New Appointment Booking', message: 'Ahmed Khan has booked an appointment on ' + daysFromNow(3) + ' at 10:00.', type: 'info', read: false, createdAt: daysAgoISO(2) },
    { id: 'NOT-108', userId: 'DOC-102', title: 'Appointment Confirmed', message: 'You confirmed Sara Fatima\'s appointment.', type: 'success', read: false, createdAt: daysAgoISO(4) },
    { id: 'NOT-109', userId: 'LAB-101', title: 'New Sample Received', message: 'Blood sample for Sara Fatima (CBC) has been received.', type: 'info', read: false, createdAt: daysAgoISO(4) },
    { id: 'NOT-110', userId: 'PHARM-101', title: 'New Prescription', message: 'Dr. Fatima Zafar issued a prescription for Ali Raza.', type: 'info', read: false, createdAt: daysAgoISO(8) },
  ];

  db.messages = [];
  db._seeded = true;
  db.nextId = 500;
}

// ==================== AUTH MIDDLEWARE ====================

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token provided' });
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ==================== AUTH ROUTES ====================

app.post('/api/auth/login', (req, res) => {
  const { email, pass, role } = req.body;
  if (!email || !pass || !role) return res.status(400).json({ error: 'Email, password, and role required' });

  let user = null;
  if (role === 'admin') {
    if (email === 'admin@zh.com' && pass === '123') {
      return res.json({ token: jwt.sign({ id: 'ADMIN-001', name: 'System Admin', email, role: 'admin' }, JWT_SECRET), user: { id: 'ADMIN-001', name: 'System Admin', email, role: 'admin' } });
    }
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
  if (role === 'patient') user = db.patients.find(u => u.email === email && u.pass === pass);
  else if (role === 'doctor') user = db.doctors.find(u => u.email === email && u.pass === pass);
  else if (role === 'pharmacy') user = db.pharmacists.find(u => u.email === email && u.pass === pass);
  else if (role === 'lab') user = db.labs.find(u => u.email === email && u.pass === pass);

  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role } });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, pass } = req.body;
  if (!name || !email || !pass) return res.status(400).json({ error: 'Name, email, and password required' });
  if (db.patients.find(p => p.email === email)) return res.status(409).json({ error: 'Email already registered' });
  const user = { id: genId(), name, email, pass, phone: '', dob: '', gender: '', bloodGroup: '', address: '', createdAt: new Date().toISOString() };
  db.patients.push(user);
  saveDB();
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: 'patient' }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: 'patient' } });
});

app.get('/api/auth/verify', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ==================== DB API ====================

app.get('/api/db', authMiddleware, (req, res) => {
  res.json(db);
});

app.post('/api/db', authMiddleware, (req, res) => {
  const newDB = req.body;
  if (!newDB || !newDB.patients) return res.status(400).json({ error: 'Invalid database payload' });
  newDB._version = 3;
  db = newDB;
  saveDB();
  res.json({ success: true });
});

app.post('/api/db/reset', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  db = createFreshDB();
  seedDatabase(db);
  saveDB();
  res.json({ success: true, message: 'Database reset to defaults' });
});

app.post('/api/db/broadcast', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { title, message } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'Title and message required' });
  const allUsers = [].concat(db.patients || []).concat(db.doctors || []).concat(db.pharmacists || []).concat(db.labs || []);
  allUsers.forEach(u => {
    db.notifications.push({ id: 'NOT-' + (db.nextId++), userId: u.id, title, message, type: 'info', read: false, createdAt: new Date().toISOString() });
  });
  saveDB();
  res.json({ success: true, count: allUsers.length });
});

// ==================== START ====================

loadDB();

// Admin login hint
console.log('');
console.log('============================================');
console.log('  ZEESHAN HOSPITAL - Backend Server Running');
console.log('  Local:   http://localhost:' + PORT);
console.log('');
console.log('  Admin:   admin@zh.com / 123');
console.log('  Doctor:  doctor@zh.com / 123');
console.log('  Patient: ahmed@test.com / 123');
console.log('  Pharmacy: pharmacy@zh.com / 123');
console.log('  Lab:     lab@zh.com / 123');
console.log('============================================');
console.log('');

app.listen(PORT, () => {});
