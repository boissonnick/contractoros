"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { Card, Button, Badge, toast } from '@/components/ui';
import { IntelligenceSettings } from '@/lib/intelligence/types';
import {
  SparklesIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  BellAlertIcon,
  MapPinIcon,
  ArrowPathIcon,
  LightBulbIcon,
  CheckIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

function Toggle({ enabled, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        enabled ? 'bg-blue-600' : 'bg-gray-200',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          enabled ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

export default function IntelligenceSettingsPage() {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<IntelligenceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const orgId = profile?.orgId;

  // Load settings
  useEffect(() => {
    if (!orgId) return;

    async function loadSettings() {
      try {
        const docRef = doc(db, 'organizations', orgId!, 'intelligenceSettings', 'default');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings({
            orgId: orgId!,
            enabled: data.enabled ?? true,
            contributionEnabled: data.contributionEnabled ?? true,
            showSuggestions: data.showSuggestions ?? true,
            showMaterialAlerts: data.showMaterialAlerts ?? true,
            showBidAnalysis: data.showBidAnalysis ?? true,
            zipCodeOverride: data.zipCodeOverride,
            preferredRegion: data.preferredRegion,
            alertThresholdPercent: data.alertThresholdPercent ?? 5,
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        } else {
          // Default settings
          setSettings({
            orgId: orgId!,
            enabled: true,
            contributionEnabled: true,
            showSuggestions: true,
            showMaterialAlerts: true,
            showBidAnalysis: true,
            alertThresholdPercent: 5,
            updatedAt: new Date(),
          });
        }
      } catch (error) {
        console.error('Error loading intelligence settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [orgId]);

  const handleSave = async () => {
    if (!orgId || !settings) return;

    setSaving(true);
    try {
      const docRef = doc(db, 'organizations', orgId, 'intelligenceSettings', 'default');
      await setDoc(docRef, {
        ...settings,
        updatedAt: Timestamp.now(),
      });
      setHasChanges(false);
      toast.success('Intelligence settings saved');
    } catch (error) {
      console.error('Error saving intelligence settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof IntelligenceSettings>(
    key: K,
    value: IntelligenceSettings[K]
  ) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
    setHasChanges(true);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <SparklesIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Intelligence</h2>
            <p className="text-sm text-gray-500">Configure AI-powered insights and data sharing</p>
          </div>
        </div>
        {hasChanges && (
          <Button variant="primary" onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
        )}
      </div>

      {/* Master Toggle */}
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <SparklesIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Enable AI Intelligence</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                Get AI-powered suggestions, market insights, and pricing recommendations
              </p>
            </div>
          </div>
          <Toggle
            enabled={settings?.enabled ?? true}
            onChange={(v) => updateSetting('enabled', v)}
          />
        </div>
      </Card>

      {/* Feature Settings */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Feature Settings</h3>
        <div className="space-y-4">
          {/* Price Suggestions */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                <LightBulbIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Price Suggestions</p>
                <p className="text-sm text-gray-500">Show AI-suggested prices when creating estimates</p>
              </div>
            </div>
            <Toggle
              enabled={settings?.showSuggestions ?? true}
              onChange={(v) => updateSetting('showSuggestions', v)}
              disabled={!settings?.enabled}
            />
          </div>

          {/* Material Price Alerts */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                <BellAlertIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Material Price Alerts</p>
                <p className="text-sm text-gray-500">Get notified when material prices change significantly</p>
              </div>
            </div>
            <Toggle
              enabled={settings?.showMaterialAlerts ?? true}
              onChange={(v) => updateSetting('showMaterialAlerts', v)}
              disabled={!settings?.enabled}
            />
          </div>

          {/* Bid Analysis */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Bid Analysis</p>
                <p className="text-sm text-gray-500">Compare subcontractor bids to market rates</p>
              </div>
            </div>
            <Toggle
              enabled={settings?.showBidAnalysis ?? true}
              onChange={(v) => updateSetting('showBidAnalysis', v)}
              disabled={!settings?.enabled}
            />
          </div>
        </div>
      </Card>

      {/* Alert Threshold */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Alert Threshold</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notify when prices change by more than:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="50"
                value={settings?.alertThresholdPercent ?? 5}
                onChange={(e) => updateSetting('alertThresholdPercent', parseInt(e.target.value) || 5)}
                disabled={!settings?.enabled || !settings?.showMaterialAlerts}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              />
              <span className="text-gray-600">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              You&apos;ll receive alerts when material prices increase or decrease by this percentage
            </p>
          </div>
        </div>
      </Card>

      {/* Data Contribution - Now managed in Organization Settings */}
      <Card className="bg-gray-50">
        <div className="flex items-center gap-3">
          <ShieldCheckIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Data contribution settings</span> have moved to{' '}
              <a href="/dashboard/settings/organization" className="text-blue-600 hover:underline">
                Organization Settings
              </a>{' '}
              under &quot;Data &amp; Privacy&quot;.
            </p>
          </div>
        </div>
      </Card>

      {/* Location Override */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Location Settings</h3>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
            <MapPinIcon className="h-5 w-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code Override (Optional)
            </label>
            <input
              type="text"
              maxLength={5}
              placeholder="Auto-detected from org address"
              value={settings?.zipCodeOverride ?? ''}
              onChange={(e) => updateSetting('zipCodeOverride', e.target.value.replace(/\D/g, ''))}
              disabled={!settings?.enabled}
              className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Override auto-detected location for regional pricing data
            </p>
          </div>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="bg-gray-50">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-gray-900">About AI Intelligence</h4>
            <p className="text-sm text-gray-600 mt-1">
              ContractorOS uses AI to provide data-driven insights for your estimates and bids.
              Our intelligence engine combines public data from FRED, BLS, and other government sources
              with anonymized, aggregated data from our user community to give you accurate,
              regional pricing recommendations.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              The more contractors who contribute, the better the suggestions become for everyone.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
