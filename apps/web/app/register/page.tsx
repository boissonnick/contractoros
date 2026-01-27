"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, getDocs, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
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
  const [checkingAuth, setCheckingAuth] = useState(true);
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
          // User exists in auth but no profile - go to onboarding
          router.replace('/onboarding');
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Update display name
      await updateProfile(userCredential.user, {
        displayName: formData.name,
      });

      // If user has an invite, create their profile directly
      if (inviteData) {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: formData.email,
          displayName: formData.name,
          role: inviteData.role,
          orgId: inviteData.orgId,
          isActive: true,
          createdAt: Timestamp.now(),
        });

        // Mark invite as accepted
        await updateDoc(doc(db, 'invites', inviteData.id), {
          status: 'accepted',
          acceptedAt: Timestamp.now(),
          acceptedBy: userCredential.user.uid,
        });

        // Redirect based on role
        const path = inviteData.role === 'OWNER' || inviteData.role === 'PM'
          ? '/dashboard'
          : inviteData.role === 'SUB'
          ? '/sub'
          : inviteData.role === 'CLIENT'
          ? '/client'
          : '/field';
        router.push(path);
      } else {
        // No invite - go through onboarding
        router.push('/onboarding');
      }
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

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">ContractorOS</h1>
          <p className="text-blue-200 mt-2">
            {inviteData ? 'Complete your registration' : 'Create your account'}
          </p>
        </div>

        {/* Invite Banner */}
        {inviteData && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">You've been invited!</p>
              <p className="text-sm text-green-700 mt-1">
                Join as a <span className="font-medium">{inviteData.role}</span> and start collaborating.
              </p>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <Card>
          <form onSubmit={handleRegister} className="space-y-4">
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
              disabled={!!inviteData}
            />

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

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700">
                Sign in
              </Link>
            </p>
          </div>
        </Card>

        {/* Terms */}
        <p className="text-center text-sm text-blue-200 mt-6">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
