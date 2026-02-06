"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { Button, Input, Card, toast } from '@/components/ui';
import {
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';

type Step = 'info' | 'w9' | 'complete';

export default function ContractorOnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('info');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    phone: '',
    trade: '',
    companyName: '',
  });
  const [w9File, setW9File] = useState<File | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.displayName) setForm(prev => ({ ...prev, displayName: user.displayName || '' }));
  }, [user]);

  const handleW9Select = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setW9File(file);
  };

  const handleComplete = async () => {
    if (!user?.uid || !form.displayName.trim()) return;
    setSaving(true);
    try {
      // TODO: Upload W-9 file to Firebase Storage when ready
      await setDoc(doc(db, 'users', user.uid), {
        displayName: form.displayName.trim(),
        phone: form.phone.trim() || null,
        trade: form.trade.trim() || null,
        onboardingCompleted: true,
        updatedAt: Timestamp.now(),
      }, { merge: true });

      setStep('complete');
      setTimeout(() => router.push('/field'), 2000);
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
          <h1 className="text-3xl font-bold text-white tracking-tight">ContractorOS</h1>
          <p className="text-brand-200 mt-2">Contractor Setup</p>
        </div>

        <Card>
          {step === 'info' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 tracking-tight">Your Information</h2>
              <p className="text-gray-500 mb-6">Tell us about your contracting business.</p>
              <div className="space-y-4">
                <Input label="Full Name" value={form.displayName} onChange={(e) => setForm(p => ({ ...p, displayName: e.target.value }))} autoFocus />
                <Input label="Company Name (optional)" value={form.companyName} onChange={(e) => setForm(p => ({ ...p, companyName: e.target.value }))} placeholder="Smith Electric LLC" />
                <Input label="Trade" value={form.trade} onChange={(e) => setForm(p => ({ ...p, trade: e.target.value }))} placeholder="e.g., Electrician, Plumber, HVAC" />
                <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="(512) 555-1234" />
              </div>
              <div className="flex justify-end mt-6">
                <Button variant="primary" onClick={() => setStep('w9')} disabled={!form.displayName.trim()} icon={<ArrowRightIcon className="h-4 w-4" />} iconPosition="right">Next</Button>
              </div>
            </div>
          )}

          {step === 'w9' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 tracking-tight">W-9 Form</h2>
              <p className="text-gray-500 mb-6">As a 1099 contractor, we need your W-9 for end-of-year tax reporting. You can upload it now or later.</p>

              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleW9Select} className="hidden" />

              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="h-8 w-8 text-gray-300" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">IRS Form W-9</p>
                    <p className="text-xs text-gray-400">Request for Taxpayer Identification Number</p>
                  </div>
                </div>

                {w9File ? (
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700">{w9File.name}</span>
                    <button onClick={() => { setW9File(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="ml-auto text-xs text-gray-500 hover:text-red-500">Remove</button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center hover:border-brand-400 transition-colors"
                  >
                    <CloudArrowUpIcon className="h-6 w-6 text-gray-300 mb-1" />
                    <p className="text-sm text-gray-600">Upload W-9 (PDF, JPG, PNG)</p>
                  </button>
                )}
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep('info')} icon={<ArrowLeftIcon className="h-4 w-4" />}>Back</Button>
                <Button variant="primary" onClick={handleComplete} loading={saving} icon={<CheckCircleIcon className="h-4 w-4" />} iconPosition="right">
                  {w9File ? 'Upload & Finish' : 'Skip & Finish'}
                </Button>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 tracking-tight">You&apos;re all set!</h2>
              <p className="text-gray-500">Redirecting to your dashboard...</p>
              <div className="mt-4"><div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
