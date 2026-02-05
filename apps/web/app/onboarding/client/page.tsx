"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { Button, Input, Card, toast } from '@/components/ui';
import {
  CheckCircleIcon,
  ArrowRightIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';

type Step = 'welcome' | 'profile' | 'complete';

export default function ClientOnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [step, setStep] = useState<Step>('welcome');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ displayName: '', phone: '', address: '' });

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.displayName) setForm(prev => ({ ...prev, displayName: user.displayName || '' }));
  }, [user]);

  const handleComplete = async () => {
    if (!user?.uid || !form.displayName.trim()) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        displayName: form.displayName.trim(),
        phone: form.phone.trim() || null,
        onboardingCompleted: true,
        updatedAt: Timestamp.now(),
      }, { merge: true });

      setStep('complete');
      setTimeout(() => router.push('/client'), 2000);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 to-brand-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white font-heading tracking-tight">ContractorOS</h1>
          <p className="text-brand-200 mt-2">Welcome to your project portal</p>
        </div>

        <Card>
          {step === 'welcome' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HomeIcon className="h-8 w-8 text-brand-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 font-heading tracking-tight">Welcome!</h2>
              <p className="text-gray-500 mb-6">
                Your contractor has invited you to track your project progress, approve changes, view photos, and communicate in real time.
              </p>
              <Button variant="primary" onClick={() => setStep('profile')} icon={<ArrowRightIcon className="h-4 w-4" />} iconPosition="right">
                Get Started
              </Button>
            </div>
          )}

          {step === 'profile' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 font-heading tracking-tight">Your Contact Info</h2>
              <p className="text-gray-500 mb-6">This helps your contractor stay in touch.</p>
              <div className="space-y-4">
                <Input label="Full Name" value={form.displayName} onChange={(e) => setForm(p => ({ ...p, displayName: e.target.value }))} autoFocus />
                <Input label="Phone (optional)" type="tel" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="(512) 555-1234" />
                <Input label="Address (optional)" value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} placeholder="123 Elm St, Austin, TX" />
              </div>
              <div className="flex justify-end mt-6">
                <Button variant="primary" onClick={handleComplete} loading={saving} disabled={!form.displayName.trim()} icon={<CheckCircleIcon className="h-4 w-4" />} iconPosition="right">
                  Complete Setup
                </Button>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 font-heading tracking-tight">You&apos;re all set!</h2>
              <p className="text-gray-500">Redirecting to your project portal...</p>
              <div className="mt-4"><div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
