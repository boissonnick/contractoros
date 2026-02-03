"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { uploadCompanyLogo } from '@/lib/firebase/storage-helpers';
import { Button, Input, toast } from '@/components/ui';
import { Organization, FiscalYearConfig, PayrollPeriodConfig, TaxConfig } from '@/types';
import {
  CloudArrowUpIcon,
  XMarkIcon,
  CheckIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { seedDemoData, resetDemoData, checkDemoDataExists, SeedProgress } from '@/scripts/seeders/demoData';
import { TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function OrganizationSettingsPage() {
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [org, setOrg] = useState<Partial<Organization> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingDemo, setGeneratingDemo] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);
  const [demoDataExists, setDemoDataExists] = useState<boolean | null>(null);
  const [checkingDemoData, setCheckingDemoData] = useState(false);
  const [demoResult, setDemoResult] = useState<{ success: boolean; message: string } | null>(null);
  const [demoProgress, setDemoProgress] = useState<SeedProgress[]>([]);

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

  // Fiscal Year, Payroll, and Tax Configuration (Sprint 37B)
  const [fiscalStartMonth, setFiscalStartMonth] = useState(1);
  const [fiscalStartDay, setFiscalStartDay] = useState(1);
  const [payrollFrequency, setPayrollFrequency] = useState<PayrollPeriodConfig['frequency']>('biweekly');
  const [payrollStartDay, setPayrollStartDay] = useState(1);
  const [payDateOffset, setPayDateOffset] = useState(3);
  const [taxEntityType, setTaxEntityType] = useState<TaxConfig['entityType']>('llc');
  const [federalTaxRate, setFederalTaxRate] = useState(0);
  const [stateTaxRate, setStateTaxRate] = useState(0);
  const [localTaxRate, setLocalTaxRate] = useState(0);
  const [taxState, setTaxState] = useState('');
  const [taxIdEin, setTaxIdEin] = useState('');

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
        // Load fiscal year config
        if (data.fiscalYear) {
          setFiscalStartMonth(data.fiscalYear.startMonth || 1);
          setFiscalStartDay(data.fiscalYear.startDay || 1);
        }
        // Load payroll config
        if (data.payrollPeriod) {
          setPayrollFrequency(data.payrollPeriod.frequency || 'biweekly');
          setPayrollStartDay(data.payrollPeriod.periodStartDay || 1);
          setPayDateOffset(data.payrollPeriod.payDateOffset || 3);
        }
        // Load tax config
        if (data.taxConfig) {
          setTaxEntityType(data.taxConfig.entityType || 'llc');
          setFederalTaxRate(data.taxConfig.federalTaxRate || 0);
          setStateTaxRate(data.taxConfig.stateTaxRate || 0);
          setLocalTaxRate(data.taxConfig.localTaxRate || 0);
          setTaxState(data.taxConfig.state || '');
          setTaxIdEin(data.taxConfig.taxIdEin || '');
        }
      }
      setLoading(false);
    }
    load();
  }, [profile?.orgId]);

  // Check if demo data already exists
  useEffect(() => {
    if (!profile?.orgId) return;
    async function checkDemo() {
      setCheckingDemoData(true);
      try {
        const exists = await checkDemoDataExists(profile!.orgId);
        setDemoDataExists(exists);
      } catch (error) {
        console.error('Error checking demo data:', error);
      } finally {
        setCheckingDemoData(false);
      }
    }
    checkDemo();
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
        // Fiscal year configuration
        fiscalYear: {
          startMonth: fiscalStartMonth,
          startDay: fiscalStartDay,
        },
        // Payroll configuration
        payrollPeriod: {
          frequency: payrollFrequency,
          periodStartDay: payrollStartDay,
          payDateOffset: payDateOffset,
        },
        // Tax configuration
        taxConfig: {
          entityType: taxEntityType,
          federalTaxRate: federalTaxRate,
          stateTaxRate: stateTaxRate,
          localTaxRate: localTaxRate,
          state: taxState,
          taxIdEin: taxIdEin.trim() || null,
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

      {/* Financial Configuration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fiscal Year Configuration */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Fiscal Year</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Month</label>
              <select
                value={fiscalStartMonth}
                onChange={(e) => setFiscalStartMonth(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={1}>January</option>
                <option value={2}>February</option>
                <option value={3}>March</option>
                <option value={4}>April</option>
                <option value={5}>May</option>
                <option value={6}>June</option>
                <option value={7}>July</option>
                <option value={8}>August</option>
                <option value={9}>September</option>
                <option value={10}>October</option>
                <option value={11}>November</option>
                <option value={12}>December</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Day</label>
              <select
                value={fiscalStartDay}
                onChange={(e) => setFiscalStartDay(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Common: Jan 1, Apr 1, Jul 1, Oct 1
            </p>
          </div>
        </div>

        {/* Payroll Period Configuration */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Payroll Period</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Frequency</label>
              <select
                value={payrollFrequency}
                onChange={(e) => setPayrollFrequency(e.target.value as PayrollPeriodConfig['frequency'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="semimonthly">Semi-monthly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Period Start {payrollFrequency === 'weekly' || payrollFrequency === 'biweekly' ? '(Day of Week)' : '(Day of Month)'}
              </label>
              <select
                value={payrollStartDay}
                onChange={(e) => setPayrollStartDay(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {payrollFrequency === 'weekly' || payrollFrequency === 'biweekly' ? (
                  <>
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </>
                ) : (
                  Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Pay Date Offset (days after period end)</label>
              <input
                type="number"
                min={0}
                max={14}
                value={payDateOffset}
                onChange={(e) => setPayDateOffset(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tax Configuration */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Tax Configuration</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Entity Type</label>
              <select
                value={taxEntityType}
                onChange={(e) => setTaxEntityType(e.target.value as TaxConfig['entityType'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="sole_proprietor">Sole Proprietor</option>
                <option value="llc">LLC</option>
                <option value="partnership">Partnership</option>
                <option value="s_corp">S Corporation</option>
                <option value="c_corp">C Corporation</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
              <input
                type="text"
                value={taxState}
                onChange={(e) => setTaxState(e.target.value)}
                placeholder="e.g., TX, CA, NY"
                maxLength={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Federal %</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={0.1}
                  value={federalTaxRate}
                  onChange={(e) => setFederalTaxRate(Number(e.target.value))}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">State %</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  step={0.1}
                  value={stateTaxRate}
                  onChange={(e) => setStateTaxRate(Number(e.target.value))}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Local %</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={localTaxRate}
                  onChange={(e) => setLocalTaxRate(Number(e.target.value))}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tax ID / EIN</label>
              <input
                type="text"
                value={taxIdEin}
                onChange={(e) => setTaxIdEin(e.target.value)}
                placeholder="XX-XXXXXXX (optional)"
                maxLength={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Displayed on invoices</p>
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
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">Demo Data</h3>
                {/* Status indicator */}
                {checkingDemoData ? (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <div className="h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Checking...
                  </span>
                ) : demoDataExists === true ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckIcon className="h-3 w-3" />
                    Demo data active
                  </span>
                ) : demoDataExists === false ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    No demo data
                  </span>
                ) : null}
              </div>
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

              {/* Single-line animated progress indicator */}
              {(generatingDemo || resettingDemo) && demoProgress.length > 0 && (
                <div className="p-3 bg-white border border-gray-200 rounded-lg mb-4">
                  {/* Current step - single line that updates in place */}
                  {(() => {
                    const currentStep = demoProgress.filter(p => p.status === 'in_progress')[0] ||
                                       demoProgress[demoProgress.length - 1];
                    const completedCount = demoProgress.filter(p => p.status === 'completed').length;
                    const totalSteps = resettingDemo ? 11 : 10; // Number of total steps

                    return (
                      <div className="space-y-2">
                        {/* Progress bar */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${Math.min(100, (completedCount / totalSteps) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 tabular-nums w-12 text-right">
                            {completedCount}/{totalSteps}
                          </span>
                        </div>

                        {/* Current step with animation */}
                        <div className="flex items-center gap-2 min-h-[24px]">
                          {currentStep?.status === 'completed' ? (
                            <CheckIcon className="h-4 w-4 text-green-600 flex-shrink-0 animate-[scale-in_0.2s_ease-out]" />
                          ) : (
                            <div className="h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                          )}
                          <span
                            key={currentStep?.step}
                            className={`text-sm transition-all duration-300 ${
                              currentStep?.status === 'completed'
                                ? 'text-green-700'
                                : 'text-purple-700 font-medium'
                            }`}
                          >
                            {currentStep?.step || 'Starting...'}
                            {currentStep?.count !== undefined && (
                              <span className="text-gray-500 font-normal ml-1 tabular-nums">
                                ({currentStep.count}{currentStep.total ? `/${currentStep.total}` : ''})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {demoResult && (
                <div className={`p-3 rounded-lg mb-4 ${demoResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`text-sm ${demoResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {demoResult.message}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3">
                {/* Generate Button - only shown if demo data doesn't exist */}
                {!demoDataExists && (
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
                      setDemoProgress([]);

                      try {
                        const result = await seedDemoData(profile.orgId, (progress) => {
                          setDemoProgress(prev => {
                            const existingIdx = prev.findIndex(p => p.step === progress.step);
                            if (existingIdx >= 0) {
                              const updated = [...prev];
                              updated[existingIdx] = progress;
                              return updated;
                            } else {
                              return [...prev, progress];
                            }
                          });
                        });
                        setDemoDataExists(true);
                        setDemoResult({
                          success: true,
                          message: `✅ Created ${result.teamMembers} team members, ${result.projects} projects, ${result.clients} clients, ${result.timeEntries} time entries, ${result.expenses} expenses, ${result.logs} daily logs, and ${result.changeOrders} change orders.`,
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
                    disabled={generatingDemo || resettingDemo}
                    icon={<SparklesIcon className="h-4 w-4" />}
                  >
                    {generatingDemo ? 'Generating...' : 'Generate Demo Data'}
                  </Button>
                )}

                {/* Reset Button - only shown if demo data exists */}
                {demoDataExists && (
                  <Button
                    variant="danger"
                    onClick={async () => {
                      if (!profile?.orgId) {
                        toast.error('Organization not found');
                        return;
                      }

                      const confirmed = window.confirm(
                        'Are you sure you want to remove all demo data? This will delete all demo projects, clients, time entries, expenses, and other demo data. Your real data will NOT be affected.'
                      );
                      if (!confirmed) return;

                      setResettingDemo(true);
                      setDemoResult(null);
                      setDemoProgress([]);

                      try {
                        const result = await resetDemoData(profile.orgId, (progress) => {
                          setDemoProgress(prev => {
                            const existingIdx = prev.findIndex(p => p.step === progress.step);
                            if (existingIdx >= 0) {
                              const updated = [...prev];
                              updated[existingIdx] = progress;
                              return updated;
                            } else {
                              return [...prev, progress];
                            }
                          });
                        });
                        setDemoDataExists(false);
                        setDemoResult({
                          success: true,
                          message: `🗑️ Removed ${result.deletedCounts.teamMembers} team members, ${result.deletedCounts.projects} projects, ${result.deletedCounts.clients} clients, ${result.deletedCounts.timeEntries} time entries, ${result.deletedCounts.expenses} expenses, ${result.deletedCounts.dailyLogs} daily logs, and ${result.deletedCounts.changeOrders} change orders.`,
                        });
                        toast.success('Demo data removed successfully!');
                      } catch (error) {
                        console.error('Error resetting demo data:', error);
                        setDemoResult({
                          success: false,
                          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        });
                        toast.error('Failed to remove demo data');
                      } finally {
                        setResettingDemo(false);
                      }
                    }}
                    loading={resettingDemo}
                    disabled={generatingDemo || resettingDemo}
                    icon={<TrashIcon className="h-4 w-4" />}
                  >
                    {resettingDemo ? 'Removing...' : 'Reset Demo Data'}
                  </Button>
                )}

                {/* Regenerate Button - only shown if demo data exists */}
                {demoDataExists && (
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      if (!profile?.orgId) {
                        toast.error('Organization not found');
                        return;
                      }

                      const confirmed = window.confirm(
                        'This will remove all existing demo data and generate fresh demo data. Continue?'
                      );
                      if (!confirmed) return;

                      // First reset
                      setResettingDemo(true);
                      setDemoResult(null);
                      setDemoProgress([]);

                      try {
                        await resetDemoData(profile.orgId, (progress) => {
                          setDemoProgress(prev => {
                            const existingIdx = prev.findIndex(p => p.step === progress.step);
                            if (existingIdx >= 0) {
                              const updated = [...prev];
                              updated[existingIdx] = progress;
                              return updated;
                            } else {
                              return [...prev, progress];
                            }
                          });
                        });

                        // Then generate
                        setResettingDemo(false);
                        setGeneratingDemo(true);
                        setDemoProgress([]);

                        const result = await seedDemoData(profile.orgId, (progress) => {
                          setDemoProgress(prev => {
                            const existingIdx = prev.findIndex(p => p.step === progress.step);
                            if (existingIdx >= 0) {
                              const updated = [...prev];
                              updated[existingIdx] = progress;
                              return updated;
                            } else {
                              return [...prev, progress];
                            }
                          });
                        });

                        setDemoDataExists(true);
                        setDemoResult({
                          success: true,
                          message: `🔄 Regenerated! Created ${result.teamMembers} team members, ${result.projects} projects, ${result.clients} clients, ${result.timeEntries} time entries, ${result.expenses} expenses, ${result.logs} daily logs, and ${result.changeOrders} change orders.`,
                        });
                        toast.success('Demo data regenerated successfully!');
                      } catch (error) {
                        console.error('Error regenerating demo data:', error);
                        setDemoResult({
                          success: false,
                          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        });
                        toast.error('Failed to regenerate demo data');
                      } finally {
                        setResettingDemo(false);
                        setGeneratingDemo(false);
                      }
                    }}
                    disabled={generatingDemo || resettingDemo}
                    icon={<ArrowPathIcon className="h-4 w-4" />}
                  >
                    Regenerate
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
