"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { Button, Input, Card, toast } from '@/components/ui';
import { EmployeeType } from '@/types';
import {
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  UserIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

type Step = 'type' | 'paperwork' | 'profile' | 'complete';

const EMPLOYEE_TYPES: { id: EmployeeType; label: string; description: string }[] = [
  { id: 'site_manager', label: 'Site Manager', description: 'Oversee job sites and manage crews' },
  { id: 'hourly', label: 'Hourly Employee', description: 'Paid by the hour with time tracking' },
  { id: 'salaried', label: 'Salaried Employee', description: 'Fixed salary with standard benefits' },
];

export default function EmployeeOnboardingPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [step, setStep] = useState<Step>('type');
  const [saving, setSaving] = useState(false);
  const [employeeType, setEmployeeType] = useState<EmployeeType | null>(null);
  const [form, setForm] = useState({ displayName: '', phone: '', address: '' });

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.displayName) setForm(prev => ({ ...prev, displayName: user.displayName || '' }));
  }, [user]);

  // If employee type was set during invite, skip type selection
  useEffect(() => {
    if (profile?.employeeType) {
      setEmployeeType(profile.employeeType);
      setStep('paperwork');
    }
  }, [profile]);

  const handleComplete = async () => {
    if (!user?.uid || !employeeType || !form.displayName.trim()) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        displayName: form.displayName.trim(),
        phone: form.phone.trim() || null,
        employeeType,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">ContractorOS</h1>
          <p className="text-blue-200 mt-2">Employee Setup</p>
        </div>

        <Card>
          {step === 'type' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">What type of employee are you?</h2>
              <p className="text-gray-500 mb-6">This determines your time tracking and payroll setup.</p>
              <div className="space-y-3">
                {EMPLOYEE_TYPES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setEmployeeType(t.id); setStep('paperwork'); }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <UserIcon className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{t.label}</p>
                      <p className="text-sm text-gray-500">{t.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'paperwork' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Required Paperwork</h2>
              <p className="text-gray-500 mb-6">The following documents will need to be completed. You can do this later from your dashboard.</p>
              <div className="space-y-3">
                {[
                  { label: 'W-4 Tax Withholding Form', status: 'Pending' },
                  { label: 'I-9 Employment Eligibility', status: 'Pending' },
                  { label: 'Direct Deposit Authorization', status: 'Optional' },
                ].map(doc => (
                  <div key={doc.label} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <ClipboardDocumentListIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{doc.label}</p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{doc.status}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep('type')} icon={<ArrowLeftIcon className="h-4 w-4" />}>Back</Button>
                <Button variant="primary" onClick={() => setStep('profile')} icon={<ArrowRightIcon className="h-4 w-4" />} iconPosition="right">Continue</Button>
              </div>
            </div>
          )}

          {step === 'profile' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Your Profile</h2>
              <p className="text-gray-500 mb-6">Confirm your details.</p>
              <div className="space-y-4">
                <Input label="Full Name" value={form.displayName} onChange={(e) => setForm(p => ({ ...p, displayName: e.target.value }))} autoFocus />
                <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="(512) 555-1234" />
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep('paperwork')} icon={<ArrowLeftIcon className="h-4 w-4" />}>Back</Button>
                <Button variant="primary" onClick={handleComplete} loading={saving} disabled={!form.displayName.trim()} icon={<CheckCircleIcon className="h-4 w-4" />} iconPosition="right">Complete</Button>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome aboard!</h2>
              <p className="text-gray-500">Redirecting to your dashboard...</p>
              <div className="mt-4"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
