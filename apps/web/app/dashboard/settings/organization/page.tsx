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
} from '@heroicons/react/24/outline';

export default function OrganizationSettingsPage() {
  const { profile } = useAuth();
  const { branding, logoURL: currentLogo } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [org, setOrg] = useState<Partial<Organization> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    <div className="max-w-2xl space-y-8">
      {/* Company Info */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Company Information</h3>
        <div className="space-y-4">
          <Input label="Company Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(512) 555-1234" />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Austin, TX 78701" />
        </div>
      </section>

      {/* Brand Colors */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Brand Colors</h3>
        <div className="space-y-4">
          {[
            { label: 'Primary Color', value: primaryColor, set: setPrimaryColor, desc: 'Buttons, links, key actions' },
            { label: 'Secondary Color', value: secondaryColor, set: setSecondaryColor, desc: 'Secondary elements' },
            { label: 'Accent Color', value: accentColor, set: setAccentColor, desc: 'Highlights, badges' },
          ].map(({ label, value, set, desc }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <p className="text-xs text-gray-400 mb-2">{desc}</p>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono text-gray-900"
                  maxLength={7}
                />
              </div>
            </div>
          ))}

          {/* Preview */}
          <div className="border border-gray-200 rounded-lg p-4 mt-2">
            <p className="text-xs font-medium text-gray-500 mb-3">Preview</p>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: primaryColor }}>
                Primary
              </button>
              <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: secondaryColor }}>
                Secondary
              </button>
              <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: accentColor }}>
                Accent
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Logo */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Company Logo</h3>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          onChange={handleLogoSelect}
          className="hidden"
        />

        {logoPreview ? (
          <div className="relative border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            <img src={logoPreview} alt="Logo" className="h-16 max-w-[200px] object-contain" />
            <div className="flex-1">
              <p className="text-sm text-gray-600">{logoFile ? logoFile.name : 'Current logo'}</p>
              <button onClick={() => fileInputRef.current?.click()} className="text-sm text-blue-600 hover:underline mt-1">
                Change
              </button>
            </div>
            <button onClick={removeLogo} className="p-1 text-gray-400 hover:text-red-500">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
          >
            <CloudArrowUpIcon className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-600">Upload logo</p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG, or WebP. Max 5MB.</p>
          </button>
        )}

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}
      </section>

      {/* Save */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button variant="primary" onClick={handleSave} loading={saving} disabled={!name.trim()} icon={<CheckIcon className="h-4 w-4" />}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
