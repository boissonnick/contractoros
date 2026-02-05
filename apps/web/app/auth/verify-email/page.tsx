"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isMagicLink, completeMagicLinkSignIn } from '@/lib/auth-providers';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserRole } from '@/types';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

function getRedirectPath(role: UserRole): string {
  switch (role) {
    case 'OWNER':
    case 'PM':
      return '/dashboard';
    case 'EMPLOYEE':
    case 'CONTRACTOR':
      return '/field';
    case 'SUB':
      return '/sub';
    case 'CLIENT':
      return '/client';
    default:
      return '/onboarding';
  }
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function verify() {
      const url = window.location.href;

      if (!isMagicLink(url)) {
        setStatus('error');
        setErrorMessage('Invalid or expired link. Please request a new one.');
        return;
      }

      const email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        setStatus('error');
        setErrorMessage('Please open this link on the same device where you requested it, or enter your email to continue.');
        return;
      }

      try {
        const userCredential = await completeMagicLinkSignIn(email, url);
        window.localStorage.removeItem('emailForSignIn');

        setStatus('success');

        // Check if user has a profile
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          const role = userDoc.data().role as UserRole;
          setTimeout(() => router.push(getRedirectPath(role)), 1500);
        } else {
          setTimeout(() => router.push('/onboarding'), 1500);
        }
      } catch (error: any) {
        console.error('Magic link verification failed:', error);
        setStatus('error');
        if (error.code === 'auth/invalid-action-code') {
          setErrorMessage('This link has expired or already been used. Please request a new one.');
        } else {
          setErrorMessage('Verification failed. Please try again.');
        }
      }
    }

    verify();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 to-brand-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying your email...</h2>
            <p className="text-gray-500">Please wait while we sign you in.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-500">Redirecting you now...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircleIcon className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-500 mb-6">{errorMessage}</p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:opacity-90"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
