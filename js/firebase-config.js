// ========== FIREBASE CONFIG ==========
const firebaseConfig = {
  apiKey: "AIzaSyCiUS1YCxP76FspEGQ8ixzAl6LLm4Y47OU",
  authDomain: "zeeshan-hospital-a2121.firebaseapp.com",
  projectId: "zeeshan-hospital-a2121",
  storageBucket: "zeeshan-hospital-a2121.firebasestorage.app",
  messagingSenderId: "884462837919",
  appId: "1:884462837919:web:366758a56019de64d3c2aa"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
