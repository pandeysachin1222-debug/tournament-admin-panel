// src/firebase.ts

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// @ts-ignore
import firebaseConfig from '../firebase-applet-config.json';

// 🔥 Firebase Init
const app = initializeApp(firebaseConfig);

// 🔥 Firestore DB
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// 🔥 Auth
export const auth = getAuth(app);

// 🔐 Admin Emails (IMPORTANT)
export const adminEmails = [
  "pandey.sachin1222@gmail.com",
  "ravanvillan7@gmail.com"
];
