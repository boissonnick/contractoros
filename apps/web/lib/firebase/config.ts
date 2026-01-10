"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import * as firestore from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCDMqT_jPC9BwFqhM2fXPB7g6Wg7pnIvWc",
  authDomain: "contractoros-483812.firebaseapp.com",
  projectId: "contractoros-483812",
  storageBucket: "contractoros-483812.firebasestorage.app",
  messagingSenderId: "424251610296",
  appId: "1:424251610296:web:2f4d83a982a578306cd04d",
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = firestore.getFirestore(app);
export const storage = getStorage(app);