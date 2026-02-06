"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { signInWithGoogle, sendMagicLink } from '@/lib/auth-providers';
import { Button, Input, Card } from '@/components/ui';
import Link from 'next/link';
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [authMode, setAuthMode] = useState<'password' | 'magic-link'>('password');
  const [inviteData, setInviteData] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    orgId: string;
  } | null>(null);

  // Check if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          router.replace('/dashboard');
          return;
        } else {
          router.replace('/onboarding/company-setup');
          return;
        }
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Check for invite token
  useEffect(() => {
    if (inviteToken) {
      checkInvite(inviteToken);
    }
  }, [inviteToken]);

  const checkInvite = async (token: string) => {
    try {
      const inviteDoc = await getDoc(doc(db, 'invites', token));
      if (inviteDoc.exists()) {
        const data = inviteDoc.data();
        if (data.status === 'pending') {
          setInviteData({
            id: inviteDoc.id,
            name: data.name,
            email: data.email,
            role: data.role,
            orgId: data.orgId,
          });
          setFormData(prev => ({
            ...prev,
            name: data.name,
            email: data.email,
          }));
        }
      }
    } catch (error) {
      console.error('Error checking invite:', error);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Create user doc as OWNER (open signup) or invited role
  const createUserDoc = async (uid: string, email: string, displayName: string) => {
    if (inviteData) {
      // Invited user — use invite role & org
      await setDoc(doc(db, 'users', uid), {
        uid,
        email,
        displayName,
        role: inviteData.role,
        orgId: inviteData.orgId,
        isActive: true,
        onboardingCompleted: false,
        createdAt: Timestamp.now(),
      });
      await updateDoc(doc(db, 'invites', inviteData.id), {
        status: 'accepted',
        acceptedAt: Timestamp.now(),
        acceptedBy: uid,
      });
      router.push('/onboarding');
    } else {
      // Open signup — create as OWNER, route to company setup
      await setDoc(doc(db, 'users', uid), {
        uid,
        email,
        displayName,
        role: 'OWNER',
        orgId: '',
        isActive: true,
        onboardingCompleted: false,
        createdAt: Timestamp.now(),
      });
      router.push('/onboarding/company-setup');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) { setError('Name is required'); return; }
    if (!formData.email.trim()) { setError('Email is required'); return; }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(userCredential.user, { displayName: formData.name });
      await createUserDoc(userCredential.user.uid, formData.email, formData.name);
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Try signing in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setSocialLoading(true);
    setError('');
    try {
      const userCredential = await signInWithGoogle();
      const uid = userCredential.user.uid;

      // Check if user already exists
      const existingDoc = await getDoc(doc(db, 'users', uid));
      if (existingDoc.exists()) {
        router.push('/dashboard');
        return;
      }

      await createUserDoc(
        uid,
        userCredential.user.email || formData.email,
        userCredential.user.displayName || formData.name,
      );
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-up failed. Please try again.');
      }
    } finally {
      setSocialLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError('');
    try {
      await sendMagicLink(formData.email);
      setMagicLinkSent(true);
    } catch {
      setError('Failed to send sign-in link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-900 to-brand-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Magic link sent confirmation
  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-900 to-brand-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <EnvelopeIcon className="h-8 w-8 text-brand-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 mb-2">
            We sent a sign-in link to <span className="font-medium text-gray-700">{formData.email}</span>
          </p>
          <p className="text-sm text-gray-400 mb-6">Click the link in the email to complete your registration.</p>
          <button
            onClick={() => { setMagicLinkSent(false); }}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            Use a different method
          </button>
        </div>
      </div>
    );
  }

  const isInvited = !!inviteData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 to-brand-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">ContractorOS</h1>
          <p className="text-brand-200 mt-2">
            {isInvited ? 'Complete your registration' : 'Create your account'}
          </p>
        </div>

        {/* Invite Banner */}
        {isInvited && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">You&apos;ve been invited!</p>
              <p className="text-sm text-green-700 mt-1">
                Join as a <span className="font-medium">{inviteData!.role}</span> and start collaborating.
              </p>
            </div>
          </div>
        )}

        <Card>
          {/* Google SSO */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleSignup}
              disabled={socialLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {socialLoading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-400">or</span>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => { setAuthMode('password'); setError(''); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                authMode === 'password' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Password
            </button>
            <button
              onClick={() => { setAuthMode('magic-link'); setError(''); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                authMode === 'magic-link' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Magic Link
            </button>
          </div>

          {/* Registration Form */}
          <form onSubmit={authMode === 'password' ? handleRegister : handleMagicLink} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="John Smith"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              icon={<UserIcon className="h-5 w-5" />}
              autoFocus
            />

            <Input
              label="Email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              icon={<EnvelopeIcon className="h-5 w-5" />}
              disabled={isInvited}
            />

            {authMode === 'password' && (
              <>
                <Input
                  label="Password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  icon={<LockClosedIcon className="h-5 w-5" />}
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  icon={<LockClosedIcon className="h-5 w-5" />}
                />
              </>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" variant="primary" loading={loading} className="w-full">
              {authMode === 'password' ? 'Create Account' : 'Send Magic Link'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-600 font-medium hover:text-brand-700">
                Sign in
              </Link>
            </p>
          </div>
        </Card>

        <p className="text-center text-sm text-brand-200 mt-6">
          By creating an account, you agree to our{' '}
          <a href="#" className="text-white underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-white underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-brand-900 to-brand-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
