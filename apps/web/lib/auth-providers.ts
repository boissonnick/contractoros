"use client";

import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  RecaptchaVerifier,
  PhoneAuthProvider,
  linkWithCredential,
  UserCredential,
  ConfirmationResult,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

// ============================================
// Google Sign-In
// ============================================

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

export async function signInWithGoogle(): Promise<UserCredential> {
  return signInWithPopup(auth, googleProvider);
}

// ============================================
// Facebook Sign-In
// ============================================

const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');

export async function signInWithFacebook(): Promise<UserCredential> {
  return signInWithPopup(auth, facebookProvider);
}

// ============================================
// Phone Number Sign-In
// ============================================

let recaptchaVerifier: RecaptchaVerifier | null = null;

export function initRecaptcha(containerId: string): RecaptchaVerifier {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
  }
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
  });
  return recaptchaVerifier;
}

export async function sendPhoneVerification(
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
}

export async function verifyPhoneCode(
  confirmationResult: ConfirmationResult,
  code: string
): Promise<UserCredential> {
  return confirmationResult.confirm(code);
}

// ============================================
// Magic Link (Email Link) Sign-In
// ============================================

const ACTION_CODE_SETTINGS = {
  // URL to redirect to after clicking the magic link
  url: typeof window !== 'undefined'
    ? `${window.location.origin}/auth/verify-email`
    : 'http://localhost:3000/auth/verify-email',
  handleCodeInApp: true,
};

export async function sendMagicLink(email: string): Promise<void> {
  await sendSignInLinkToEmail(auth, email, ACTION_CODE_SETTINGS);
  // Save email for completion (link opens in same device)
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('emailForSignIn', email);
  }
}

export function isMagicLink(url: string): boolean {
  return isSignInWithEmailLink(auth, url);
}

export async function completeMagicLinkSignIn(
  email: string,
  url: string
): Promise<UserCredential> {
  return signInWithEmailLink(auth, email, url);
}

// ============================================
// Account Linking (link providers to existing account)
// ============================================

export async function linkGoogleAccount(): Promise<UserCredential> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('No user signed in');
  const credential = GoogleAuthProvider.credential(
    (await signInWithPopup(auth, googleProvider)).user.uid
  );
  return linkWithCredential(currentUser, credential);
}

// ============================================
// Helper: Get available providers for an email
// ============================================

export function getProviderName(providerId: string): string {
  switch (providerId) {
    case 'google.com': return 'Google';
    case 'facebook.com': return 'Facebook';
    case 'phone': return 'Phone';
    case 'password': return 'Email/Password';
    case 'emailLink': return 'Magic Link';
    default: return providerId;
  }
}
