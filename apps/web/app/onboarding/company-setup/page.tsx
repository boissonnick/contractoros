"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { uploadCompanyLogo } from '@/lib/firebase/storage-helpers';
import { seedDemoData } from '@/lib/demo/seedDemoData';
import { Button, Input, Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  BuildingOfficeIcon,
  SwatchIcon,
  PhotoIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CloudArrowUpIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type Step = 'company' | 'branding' | 'logo' | 'complete';

const STEPS: { id: Step; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'company', label: 'Company Info', icon: BuildingOfficeIcon },
  { id: 'branding', label: 'Brand Colors', icon: SwatchIcon },
  { id: 'logo', label: 'Logo', icon: PhotoIcon },
  { id: 'complete', label: 'Done', icon: CheckCircleIcon },
];

const DEFAULT_COLORS = {
  primaryColor: '#2563eb',
  secondaryColor: '#64748b',
  accentColor: '#f59e0b',
};

export default function CompanySetupPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('company');
  const [saving, setSaving] = useState(false);

  // Company info
  const [companyName, setCompanyName] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');

  // Branding
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_COLORS.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_COLORS.secondaryColor);
  const [accentColor, setAccentColor] = useState(DEFAULT_COLORS.accentColor);

  // Logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Demo data
  const [createDemo, setCreateDemo] = useState(true);

  // Redirect if not authenticated or not owner
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Pre-fill email from user
  useEffect(() => {
    if (user?.email && !companyEmail) {
      setCompanyEmail(user.email);
    }
  }, [user, companyEmail]);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Logo must be under 5MB');
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleComplete = async () => {
    if (!user?.uid || !companyName.trim()) return;
    setSaving(true);

    try {
      const orgId = user.uid;
      let logoURL: string | undefined;

      // Upload logo if provided
      if (logoFile) {
        logoURL = await uploadCompanyLogo(orgId, logoFile, setUploadProgress);
      }

      // Create organization
      await setDoc(doc(db, 'organizations', orgId), {
        name: companyName.trim(),
        ownerUid: user.uid,
        address: companyAddress.trim() || null,
        phone: companyPhone.trim() || null,
        email: companyEmail.trim() || null,
        logoURL: logoURL || null,
        branding: {
          logoURL: logoURL || null,
          primaryColor,
          secondaryColor,
          accentColor,
        },
        settings: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          workdayStart: '08:00',
          workdayEnd: '17:00',
          overtimeThreshold: 40,
          requireGeoLocation: true,
        },
        onboardingCompleted: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Update user profile with orgId and mark onboarding complete
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || companyName.trim(),
        role: 'OWNER',
        orgId,
        isActive: true,
        onboardingCompleted: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }, { merge: true });

      // Seed demo data if requested
      if (createDemo) {
        try {
          await seedDemoData(orgId, user.uid);
        } catch (err) {
          console.error('Demo data seeding failed (non-critical):', err);
        }
      }

      setStep('complete');

      // Redirect after brief delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error completing company setup:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const stepIndex = STEPS.findIndex(s => s.id === step);

  const goNext = () => {
    if (step === 'company' && !companyName.trim()) return;
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      if (STEPS[nextIndex].id === 'complete') {
        handleComplete();
      } else {
        setStep(STEPS[nextIndex].id);
      }
    }
  };

  const goBack = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setStep(STEPS[prevIndex].id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">ContractorOS</h1>
          <p className="text-blue-200 mt-2">Set up your company</p>
        </div>

        {/* Progress Steps */}
        {step !== 'complete' && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {STEPS.filter(s => s.id !== 'complete').map((s, i) => (
              <React.Fragment key={s.id}>
                {i > 0 && <div className={cn('w-8 h-0.5', i <= stepIndex ? 'bg-white' : 'bg-white/30')} />}
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                  s.id === step ? 'bg-white text-blue-600' :
                  i < stepIndex ? 'bg-white/80 text-blue-600' :
                  'bg-white/20 text-white/60'
                )}>
                  {i + 1}
                </div>
              </React.Fragment>
            ))}
          </div>
        )}

        <Card className="animate-fade-in">
          {/* Step 1: Company Info */}
          {step === 'company' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Company Information</h2>
              <p className="text-gray-500 mb-6">Tell us about your business</p>

              <div className="space-y-4">
                <Input
                  label="Company Name"
                  placeholder="Smith Construction LLC"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  autoFocus
                />
                <Input
                  label="Phone (optional)"
                  type="tel"
                  placeholder="(512) 555-1234"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="info@smithconstruction.com"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                />
                <Input
                  label="Address (optional)"
                  placeholder="123 Main St, Austin, TX 78701"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                />
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  variant="primary"
                  onClick={goNext}
                  disabled={!companyName.trim()}
                  icon={<ArrowRightIcon className="h-4 w-4" />}
                  iconPosition="right"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Branding Colors */}
          {step === 'branding' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Brand Colors</h2>
              <p className="text-gray-500 mb-6">Choose colors to personalize your platform</p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                  <p className="text-xs text-gray-400 mb-2">Used for buttons, links, and key actions</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono text-gray-900"
                      maxLength={7}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                  <p className="text-xs text-gray-400 mb-2">Used for secondary elements and backgrounds</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono text-gray-900"
                      maxLength={7}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                  <p className="text-xs text-gray-400 mb-2">Used for highlights and attention-grabbing elements</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono text-gray-900"
                      maxLength={7}
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 mb-3">Preview</p>
                  <div className="flex items-center gap-3">
                    <button
                      className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Primary Button
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      Secondary
                    </button>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: accentColor }}
                    >
                      Badge
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={goBack} icon={<ArrowLeftIcon className="h-4 w-4" />}>
                  Back
                </Button>
                <Button variant="primary" onClick={goNext} icon={<ArrowRightIcon className="h-4 w-4" />} iconPosition="right">
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Logo Upload */}
          {step === 'logo' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Company Logo</h2>
              <p className="text-gray-500 mb-6">Upload your logo (optional). It will appear in your client portal and emails.</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoSelect}
                className="hidden"
              />

              {logoPreview ? (
                <div className="relative border border-gray-200 rounded-xl p-6 flex flex-col items-center">
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="max-h-32 max-w-full object-contain mb-3"
                  />
                  <p className="text-sm text-gray-500">{logoFile?.name}</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                >
                  <CloudArrowUpIcon className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-600">Click to upload logo</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG, or WebP. Max 5MB.</p>
                </button>
              )}

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">{uploadProgress}%</p>
                </div>
              )}

              {/* Demo Data Option */}
              <label className="flex items-start gap-3 mt-6 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={createDemo}
                  onChange={(e) => setCreateDemo(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Create a demo project</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Adds a sample "Kitchen Renovation" project with phases and tasks so you can explore the platform right away.
                  </p>
                </div>
              </label>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={goBack} icon={<ArrowLeftIcon className="h-4 w-4" />}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={goNext}
                  loading={saving}
                  icon={<CheckCircleIcon className="h-4 w-4" />}
                  iconPosition="right"
                >
                  {logoFile ? 'Upload & Finish' : 'Skip & Finish'}
                </Button>
              </div>
            </div>
          )}

          {/* Complete */}
          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">You're all set!</h2>
              <p className="text-gray-500">Your company is ready. Redirecting to your dashboard...</p>
              <div className="mt-4">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
