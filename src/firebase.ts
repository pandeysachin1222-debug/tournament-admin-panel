import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAdsMK_nkzrLhhSMXfrLl84PNh5cnV61Mg",
  authDomain: "tournamenthub-15f89.firebaseapp.com",
  projectId: "tournamenthub-15f89",
  storageBucket: "tournamenthub-15f89.firebasestorage.app",
  messagingSenderId: "407134461502",
  appId: "1:407134461502:web:4764d84445229c31bb3b6f",
  measurementId: "G-QJ96WZL87L"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export const adminEmails = [
  "pandey.sachin1222@gmail.com",
  "ravanvillan7@gmail.com"
];
