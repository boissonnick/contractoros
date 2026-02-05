"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  Auth,
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  browserPopupRedirectResolver,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration - requires environment variables
// Copy .env.example to .env.local and fill in your Firebase project values
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate required config values at runtime
// Note: NEXT_PUBLIC_* vars are inlined at build time, so we check the config object directly
if (typeof window !== 'undefined') {
  const configChecks = [
    { key: 'apiKey', value: firebaseConfig.apiKey },
    { key: 'authDomain', value: firebaseConfig.authDomain },
    { key: 'projectId', value: firebaseConfig.projectId },
    { key: 'storageBucket', value: firebaseConfig.storageBucket },
    { key: 'appId', value: firebaseConfig.appId },
  ];

  for (const { key, value } of configChecks) {
    if (!value) {
      console.error(`Firebase config missing: ${key}. Rebuild with environment variables.`);
    }
  }
}

// Initialize Firebase only once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Use initializeAuth with explicit persistence and popupRedirectResolver.
// browserLocalPersistence avoids IndexedDB hangs that prevent onAuthStateChanged.
// browserPopupRedirectResolver is required for signInWithPopup in Firebase v11
// when using initializeAuth (otherwise popup auth methods get auth/argument-error).
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  });
} catch {
  // initializeAuth throws if already called — fall back to getAuth
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app, "contractoros");
export const storage = getStorage(app);
