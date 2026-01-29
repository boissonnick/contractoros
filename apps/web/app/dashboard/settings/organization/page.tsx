"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { uploadCompanyLogo } from '@/lib/firebase/storage-helpers';
import { Button, Input, toast } from '@/components/ui';
import { Organization } from '@/types';
import {
  CloudArrowUpIcon,
  XMarkIcon,
  CheckIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { seedDemoData } from '@/scripts/seeders/demoData';

export default function OrganizationSettingsPage() {
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [org, setOrg] = useState<Partial<Organization> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingDemo, setGeneratingDemo] = useState(false);
  const [demoResult, setDemoResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [secondaryColor, setSecondaryColor] = useState('#64748b');
  const [accentColor, setAccentColor] = useState('#f59e0b');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load org data
  useEffect(() => {
    if (!profile?.orgId) return;
    async function load() {
      const snap = await getDoc(doc(db, 'organizations', profile!.orgId));
      if (snap.exists()) {
        const data = snap.data();
        setOrg({ id: snap.id, ...data } as Partial<Organization>);
        setName(data.name || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setAddress(data.address || '');
        if (data.branding) {
          setPrimaryColor(data.branding.primaryColor || '#2563eb');
          setSecondaryColor(data.branding.secondaryColor || '#64748b');
          setAccentColor(data.branding.accentColor || '#f59e0b');
        }
        if (data.branding?.logoURL || data.logoURL) {
          setLogoPreview(data.branding?.logoURL || data.logoURL);
        }
      }
      setLoading(false);
    }
    load();
  }, [profile?.orgId]);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be under 5MB');
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

  const handleSave = async () => {
    if (!profile?.orgId || !name.trim()) return;
    setSaving(true);

    try {
      let logoURL = logoPreview;

      // Upload new logo if changed
      if (logoFile) {
        logoURL = await uploadCompanyLogo(profile.orgId, logoFile, setUploadProgress);
      }

      await updateDoc(doc(db, 'organizations', profile.orgId), {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        logoURL: logoURL || null,
        branding: {
          logoURL: logoURL || null,
          primaryColor,
          secondaryColor,
          accentColor,
        },
        updatedAt: Timestamp.now(),
      });

      setLogoFile(null);
      setUploadProgress(0);
      toast.success('Organization settings saved');
    } catch (error) {
      console.error('Error saving org settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Company Info & Logo */}
        <div className="space-y-6">
          {/* Company Info Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Company Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Input
                  label="Company Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <Input
                label="Phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(512) 555-1234"
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, Austin, TX 78701"
                />
              </div>
            </div>
          </div>

          {/* Logo Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Company Logo</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleLogoSelect}
              className="hidden"
            />

            {logoPreview ? (
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <img src={logoPreview} alt="Logo" className="h-12 max-w-[120px] object-contain" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 truncate">{logoFile ? logoFile.name : 'Current logo'}</p>
                  <button onClick={() => fileInputRef.current?.click()} className="text-xs text-blue-600 hover:underline">
                    Change
                  </button>
                </div>
                <button onClick={removeLogo} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-lg p-4 flex items-center gap-3 hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
              >
                <CloudArrowUpIcon className="h-6 w-6 text-gray-300" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-600">Upload logo</p>
                  <p className="text-xs text-gray-400">PNG, JPG, SVG, or WebP. Max 5MB.</p>
                </div>
              </button>
            )}

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Brand Colors */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Brand Colors</h3>
          <div className="space-y-4">
            {[
              { label: 'Primary', value: primaryColor, set: setPrimaryColor, desc: 'Buttons, links' },
              { label: 'Secondary', value: secondaryColor, set: setSecondaryColor, desc: 'Secondary elements' },
              { label: 'Accent', value: accentColor, set: setAccentColor, desc: 'Highlights, badges' },
            ].map(({ label, value, set, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    <span className="text-xs text-gray-400">{desc}</span>
                  </div>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className="mt-1 w-24 px-2 py-1 border border-gray-200 rounded text-xs font-mono text-gray-600"
                    maxLength={7}
                  />
                </div>
              </div>
            ))}

            {/* Preview */}
            <div className="pt-3 mt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Preview</p>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 rounded-lg text-white text-xs font-medium" style={{ backgroundColor: primaryColor }}>
                  Primary
                </button>
                <button className="px-3 py-1.5 rounded-lg text-white text-xs font-medium" style={{ backgroundColor: secondaryColor }}>
                  Secondary
                </button>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: accentColor }}>
                  Accent
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSave} loading={saving} disabled={!name.trim()} icon={<CheckIcon className="h-4 w-4" />}>
          Save Changes
        </Button>
      </div>

      {/* Demo Data Section */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <SparklesIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Generate Demo Data</h3>
              <p className="text-sm text-gray-600 mt-1 mb-4">
                Populate your organization with comprehensive demo data for testing and demos.
                This will create 8 projects, clients, time entries, expenses, daily logs, and more.
              </p>

              <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> This will add demo data to your organization.
                  Use only for testing purposes.
                </p>
              </div>

              {demoResult && (
                <div className={`p-3 rounded-lg mb-4 ${demoResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`text-sm ${demoResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {demoResult.message}
                  </p>
                </div>
              )}

              <Button
                variant="secondary"
                onClick={async () => {
                  if (!profile?.orgId) {
                    toast.error('Organization not found');
                    return;
                  }

                  const confirmed = window.confirm(
                    'Are you sure you want to generate demo data? This will add sample projects, clients, expenses, and other data to your organization.'
                  );
                  if (!confirmed) return;

                  setGeneratingDemo(true);
                  setDemoResult(null);
                  try {
                    const result = await seedDemoData(profile.orgId);
                    setDemoResult({
                      success: true,
                      message: `✅ Created ${result.projects} projects, ${result.clients} clients, ${result.timeEntries} time entries, ${result.expenses} expenses, ${result.logs} daily logs, and ${result.changeOrders} change orders.`,
                    });
                    toast.success('Demo data generated successfully!');
                  } catch (error) {
                    console.error('Error generating demo data:', error);
                    setDemoResult({
                      success: false,
                      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    });
                    toast.error('Failed to generate demo data');
                  } finally {
                    setGeneratingDemo(false);
                  }
                }}
                loading={generatingDemo}
                disabled={generatingDemo}
                icon={<SparklesIcon className="h-4 w-4" />}
              >
                {generatingDemo ? 'Generating Demo Data...' : 'Generate Demo Data'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
