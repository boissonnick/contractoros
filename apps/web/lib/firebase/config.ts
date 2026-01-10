"use client";

import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCDMqT_jPC9BwFqhM2fXPB7g6Wg7pnIvWc",
  authDomain: "contractoros-483812.firebaseapp.com",
  projectId: "contractoros-483812",
  storageBucket: "contractoros-483812.firebasestorage.app",
  messagingSenderId: "424251610296",
  appId: "1:424251610296:web:2f4d83a982a578306cd04d",
};

// Initialize Firebase only once
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();