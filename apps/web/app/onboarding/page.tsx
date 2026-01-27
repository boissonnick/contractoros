"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, setDoc, Timestamp } from 'firebase/firestore';
import { Button, Input, Card, toast } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  HomeIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { UserRole } from '@/types';

type Step = 'role' | 'profile' | 'organization' | 'complete';

const roleOptions: { id: UserRole; title: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
  {
    id: 'OWNER',
    title: "I'm a Contractor",
    description: 'I run a construction/contracting business',
    icon: BuildingOfficeIcon,
  },
  {
    id: 'SUB',
    title: "I'm a Subcontractor",
    description: 'I provide specialized services to contractors',
    icon: WrenchScrewdriverIcon,
  },
  {
    id: 'EMPLOYEE',
    title: "I'm an Employee",
    description: 'I work for a contracting company',
    icon: UserGroupIcon,
  },
  {
    id: 'CLIENT',
    title: "I'm a Homeowner",
    description: 'I hired a contractor for my project',
    icon: HomeIcon,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    phone: '',
    companyName: '',
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

  // Redirect if already onboarded
  useEffect(() => {
    if (profile?.role && profile?.orgId) {
      const path = profile.role === 'OWNER' || profile.role === 'PM' ? '/dashboard' :
                   profile.role === 'SUB' ? '/sub' :
                   profile.role === 'CLIENT' ? '/client' : '/field';
      router.replace(path);
    }
  }, [profile, router]);

  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setCurrentStep('profile');
  };

  const handleProfileSubmit = () => {
    if (!form.displayName.trim()) return;

    if (selectedRole === 'OWNER') {
      setCurrentStep('organization');
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!user?.uid || !selectedRole) return;

    setSaving(true);
    try {
      let orgId = '';

      // If owner, create organization
      if (selectedRole === 'OWNER' && form.companyName) {
        const orgRef = doc(db, 'organizations', user.uid);
        await setDoc(orgRef, {
          name: form.companyName,
          ownerUid: user.uid,
          settings: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            workdayStart: '08:00',
            workdayEnd: '17:00',
            overtimeThreshold: 40,
            requireGeoLocation: true,
          },
          createdAt: Timestamp.now(),
        });
        orgId = user.uid;
      }

      // Update user profile
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: form.displayName,
        phone: form.phone,
        role: selectedRole,
        orgId: orgId,
        trade: selectedRole === 'SUB' ? form.trade : null,
        isActive: true,
        createdAt: Timestamp.now(),
      }, { merge: true });

      setCurrentStep('complete');

      // Redirect after animation
      setTimeout(() => {
        const path = selectedRole === 'OWNER' || selectedRole === 'PM' ? '/dashboard' :
                     selectedRole === 'SUB' ? '/sub' :
                     selectedRole === 'CLIENT' ? '/client' : '/field';
        router.push(path);
      }, 2000);

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
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">ContractorOS</h1>
          <p className="text-blue-200 mt-2">Let's get you set up</p>
        </div>

        {/* Step Content */}
        <Card className="animate-fade-in">
          {currentStep === 'role' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome! Tell us about yourself</h2>
              <p className="text-gray-500 mb-6">This helps us personalize your experience</p>

              <div className="space-y-3">
                {roleOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleRoleSelect(option.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <option.icon className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{option.title}</p>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'profile' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Your Profile</h2>
              <p className="text-gray-500 mb-6">How should we identify you?</p>

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
                {selectedRole === 'SUB' && (
                  <Input
                    label="Your Trade"
                    placeholder="e.g., Electrician, Plumber, HVAC"
                    value={form.trade}
                    onChange={(e) => updateForm('trade', e.target.value)}
                  />
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setCurrentStep('role')} className="flex-1">
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleProfileSubmit}
                  disabled={!form.displayName.trim()}
                  className="flex-1"
                  icon={<ArrowRightIcon className="h-4 w-4" />}
                  iconPosition="right"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'organization' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Your Company</h2>
              <p className="text-gray-500 mb-6">Set up your organization</p>

              <div className="space-y-4">
                <Input
                  label="Company Name"
                  placeholder="Smith Construction LLC"
                  value={form.companyName}
                  onChange={(e) => updateForm('companyName', e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setCurrentStep('profile')} className="flex-1">
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleComplete}
                  loading={saving}
                  disabled={!form.companyName.trim()}
                  className="flex-1"
                  icon={<CheckCircleIcon className="h-4 w-4" />}
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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">You're all set!</h2>
              <p className="text-gray-500">Redirecting to your dashboard...</p>
              <div className="mt-4">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            </div>
          )}
        </Card>

        {/* Progress Dots */}
        {currentStep !== 'complete' && (
          <div className="flex justify-center gap-2 mt-6">
            {['role', 'profile', selectedRole === 'OWNER' ? 'organization' : null].filter(Boolean).map((step, i) => (
              <div
                key={i}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  (step === currentStep) ? 'bg-white' : 'bg-white/30'
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
