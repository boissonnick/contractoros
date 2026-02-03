"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { initRecaptcha, sendPhoneVerification, verifyPhoneCode } from '@/lib/auth-providers';
import { ConfirmationResult } from 'firebase/auth';
import { UserRole } from '@/types';
import {
  ArrowLeftIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

function getRedirectPath(role: UserRole): string {
  switch (role) {
    case 'OWNER': case 'PM': return '/dashboard';
    case 'EMPLOYEE': case 'CONTRACTOR': return '/field';
    case 'SUB': return '/sub';
    case 'CLIENT': return '/client';
    default: return '/onboarding';
  }
}

type Step = 'phone' | 'verify';

export default function PhoneAuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(formatPhone(raw));
    setError('');
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const verifier = initRecaptcha('recaptcha-container');
      const result = await sendPhoneVerification(`+1${digits}`, verifier);
      setConfirmationResult(result);
      setStep('verify');
    } catch (err: any) {
      console.error('Phone verification error:', err);
      if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number. Please check and try again.');
      } else {
        setError('Failed to send verification code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCodeInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');

    // Auto-advance to next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newCode.every(d => d !== '') && value) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (codeStr?: string) => {
    const fullCode = codeStr || code.join('');
    if (fullCode.length !== 6 || !confirmationResult) return;

    setLoading(true);
    setError('');

    try {
      const userCredential = await verifyPhoneCode(confirmationResult, fullCode);

      // Check for existing profile
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role as UserRole;
        router.push(getRedirectPath(role));
      } else {
        router.push('/onboarding');
      }
    } catch (err: any) {
      console.error('Code verification error:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid code. Please check and try again.');
      } else if (err.code === 'auth/code-expired') {
        setError('Code has expired. Please request a new one.');
      } else {
        setError('Verification failed. Please try again.');
      }
      setCode(['', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">ContractorOS</h1>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <Link href="/login" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to login
          </Link>

          {step === 'phone' ? (
            <>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <DevicePhoneMobileIcon className="h-7 w-7 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Phone Sign-In</h2>
              <p className="text-gray-500 text-sm mb-6">
                Enter your phone number and we&apos;ll send a 6-digit verification code.
              </p>

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg text-gray-500 text-sm">
                      +1
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="(555) 555-5555"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                    <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || phone.replace(/\D/g, '').length !== 10}
                  className="w-full py-2.5 px-4 bg-brand-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <ShieldCheckIcon className="h-7 w-7 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Enter Code</h2>
              <p className="text-gray-500 text-sm mb-6">
                Enter the 6-digit code sent to <span className="font-medium text-gray-700">{phone}</span>
              </p>

              <div className="flex gap-2 justify-center mb-6">
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { codeInputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeInput(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-lg mb-4">
                  <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {loading && (
                <div className="flex justify-center mb-4">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              <button
                onClick={() => { setStep('phone'); setCode(['', '', '', '', '', '']); setError(''); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 text-center"
              >
                Didn&apos;t receive the code? Try again
              </button>
            </>
          )}
        </div>

        {/* Invisible reCAPTCHA container */}
        <div id="recaptcha-container" ref={recaptchaContainerRef} />
      </div>
    </div>
  );
}
