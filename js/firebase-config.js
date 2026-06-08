// ========== FIREBASE CONFIG ==========
const firebaseConfig = {
  apiKey: "AIzaSyAP-nqL2zYxo_s2e1QM68AuePRoCecxQCI",
  authDomain: "zeeshan-hospital-a2121.firebaseapp.com",
  projectId: "zeeshan-hospital-a2121",
  storageBucket: "zeeshan-hospital-a2121.firebasestorage.app",
  messagingSenderId: "883229651688",
  appId: "1:883229651688:web:c0f489bfa83bd424e44f5d",
  measurementId: "G-5CB2RGW03T"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
