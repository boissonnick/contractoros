"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { Auth, getAuth, initializeAuth, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCDMqT_jPC9BwFqhM2fXPB7g6Wg7pnIvWc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "contractoros-483812.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "contractoros-483812",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "contractoros-483812.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "424251610296",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:424251610296:web:2f4d83a982a578306cd04d",
};

// Initialize Firebase only once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Use initializeAuth with explicit localStorage persistence to avoid
// IndexedDB hangs that prevent onAuthStateChanged from ever firing.
// getAuth() falls back to this if auth is already initialized.
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence,
  });
} catch (e) {
  // initializeAuth throws if already called — fall back to getAuth
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app, "contractoros");
export const storage = getStorage(app);
