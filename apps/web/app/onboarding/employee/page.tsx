"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { Button, Input, toast } from '@/components/ui';
import { EmployeeType, EmergencyContact, Certification } from '@/types';
import {
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import OnboardingStepLayout from '@/components/onboarding/OnboardingStepLayout';
import TradeSelectionStep from '@/components/onboarding/TradeSelectionStep';
import EmergencyContactStep from '@/components/onboarding/EmergencyContactStep';
import CertificationsStep from '@/components/onboarding/CertificationsStep';

type Step = 'type' | 'trades' | 'emergency' | 'certifications' | 'profile' | 'complete';
const STEPS: Step[] = ['type', 'trades', 'emergency', 'certifications', 'profile', 'complete'];

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
  const [trades, setTrades] = useState<string[]>([]);
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact | undefined>();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [form, setForm] = useState({ displayName: '', phone: '', address: '' });

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.displayName) setForm(prev => ({ ...prev, displayName: user.displayName || '' }));
  }, [user]);

  useEffect(() => {
    if (profile?.employeeType) {
      setEmployeeType(profile.employeeType);
      setStep('trades');
    }
  }, [profile]);

  const stepIndex = STEPS.indexOf(step);

  const handleComplete = async () => {
    if (!user?.uid || !employeeType || !form.displayName.trim()) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        displayName: form.displayName.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        employeeType,
        trades: trades.length > 0 ? trades : null,
        emergencyContact: emergencyContact || null,
        certifications: certifications.length > 0 ? certifications : null,
        taxClassification: 'W2',
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
    <OnboardingStepLayout
      title={
        step === 'type' ? 'What type of employee are you?' :
        step === 'trades' ? 'Your Trades & Skills' :
        step === 'emergency' ? 'Emergency Contact' :
        step === 'certifications' ? 'Licenses & Certifications' :
        step === 'profile' ? 'Your Profile' :
        'Welcome aboard!'
      }
      subtitle="Employee Setup"
      currentStep={stepIndex}
      totalSteps={STEPS.length}
    >
      {step === 'type' && (
        <div>
          <p className="text-gray-500 mb-6">This determines your time tracking and payroll setup.</p>
          <div className="space-y-3">
            {EMPLOYEE_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => { setEmployeeType(t.id); setStep('trades'); }}
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

      {step === 'trades' && (
        <TradeSelectionStep
          initialTrades={trades}
          onNext={(t) => { setTrades(t); setStep('emergency'); }}
          onBack={() => setStep('type')}
        />
      )}

      {step === 'emergency' && (
        <EmergencyContactStep
          initialData={emergencyContact}
          onNext={(ec) => { setEmergencyContact(ec); setStep('certifications'); }}
          onBack={() => setStep('trades')}
        />
      )}

      {step === 'certifications' && (
        <CertificationsStep
          initialCerts={certifications}
          onNext={(c) => { setCertifications(c); setStep('profile'); }}
          onBack={() => setStep('emergency')}
        />
      )}

      {step === 'profile' && (
        <div>
          <p className="text-gray-500 mb-6">Confirm your details.</p>
          <div className="space-y-4">
            <Input label="Full Name" value={form.displayName} onChange={(e) => setForm(p => ({ ...p, displayName: e.target.value }))} autoFocus />
            <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="(512) 555-1234" />
            <Input label="Address" value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} placeholder="123 Main St, Austin, TX" />
          </div>
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep('certifications')} icon={<ArrowLeftIcon className="h-4 w-4" />}>Back</Button>
            <Button variant="primary" onClick={handleComplete} loading={saving} disabled={!form.displayName.trim()} icon={<CheckCircleIcon className="h-4 w-4" />} iconPosition="right">Complete</Button>
          </div>
        </div>
      )}

      {step === 'complete' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-gray-500">Redirecting to your dashboard...</p>
          <div className="mt-4"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        </div>
      )}
    </OnboardingStepLayout>
  );
}
