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
} from '@heroicons/react/24/outline';
import { logger } from '@/lib/utils/logger';

type Step = 'profile' | 'complete';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('profile');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    phone: '',
    trade: '',
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && user === null) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Pre-fill name from auth
  useEffect(() => {
    if (user?.displayName) {
      setForm(prev => ({ ...prev, displayName: user.displayName || '' }));
    }
  }, [user]);

  // Route to role-specific onboarding
  useEffect(() => {
    if (!profile?.role) return;

    // Already fully onboarded → redirect to dashboard
    if (profile.onboardingCompleted && profile.orgId) {
      const path = profile.role === 'OWNER' || profile.role === 'PM' ? '/dashboard' :
                   profile.role === 'SUB' ? '/sub' :
                   profile.role === 'CLIENT' ? '/client' : '/field';
      router.replace(path);
      return;
    }

    // Role-specific onboarding redirects
    if (profile.role === 'OWNER' && !profile.orgId) {
      router.replace('/onboarding/company-setup');
    } else if (profile.role === 'EMPLOYEE') {
      router.replace('/onboarding/employee');
    } else if (profile.role === 'CONTRACTOR') {
      router.replace('/onboarding/contractor');
    } else if (profile.role === 'CLIENT') {
      router.replace('/onboarding/client');
    }
    // PM and SUB use this generic page
  }, [profile, router]);

  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleComplete = async () => {
    if (!user?.uid || !form.displayName.trim()) return;

    setSaving(true);
    try {
      // Update user profile
      await setDoc(doc(db, 'users', user.uid), {
        displayName: form.displayName,
        phone: form.phone || null,
        trade: profile?.role === 'SUB' ? form.trade : null,
        onboardingCompleted: true,
        updatedAt: Timestamp.now(),
      }, { merge: true });

      setCurrentStep('complete');

      // Redirect after animation
      setTimeout(() => {
        const role = profile?.role || 'EMPLOYEE';
        const path = role === 'OWNER' || role === 'PM' ? '/dashboard' :
                     role === 'SUB' ? '/sub' :
                     role === 'CLIENT' ? '/client' : '/field';
        router.push(path);
      }, 2000);
    } catch (error) {
      logger.error('Error completing onboarding', { error: error, page: 'onboarding' });
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 to-brand-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">ContractorOS</h1>
          <p className="text-brand-200 mt-2">Let&apos;s get you set up</p>
        </div>

        <Card className="animate-fade-in">
          {currentStep === 'profile' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 tracking-tight">Your Profile</h2>
              <p className="text-gray-500 mb-6">
                {profile?.role
                  ? `You're joining as ${profile.role === 'PM' ? 'a Project Manager' : profile.role === 'SUB' ? 'a Subcontractor' : profile.role === 'CLIENT' ? 'a Client' : profile.role === 'EMPLOYEE' ? 'an Employee' : profile.role === 'CONTRACTOR' ? 'a Contractor' : 'an Owner'}.`
                  : 'How should we identify you?'}
              </p>

              <div className="space-y-4">
                <Input
                  label="Your Name"
                  placeholder="John Smith"
                  value={form.displayName}
                  onChange={(e) => updateForm('displayName', e.target.value)}
                  autoFocus
                />
                <Input
                  label="Phone (optional)"
                  type="tel"
                  placeholder="(512) 555-1234"
                  value={form.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                />
                {profile?.role === 'SUB' && (
                  <Input
                    label="Your Trade"
                    placeholder="e.g., Electrician, Plumber, HVAC"
                    value={form.trade}
                    onChange={(e) => updateForm('trade', e.target.value)}
                  />
                )}
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  variant="primary"
                  onClick={handleComplete}
                  loading={saving}
                  disabled={!form.displayName.trim()}
                  icon={<ArrowRightIcon className="h-4 w-4" />}
                  iconPosition="right"
                >
                  Complete Setup
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 tracking-tight">You&apos;re all set!</h2>
              <p className="text-gray-500">Redirecting to your dashboard...</p>
              <div className="mt-4">
                <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
