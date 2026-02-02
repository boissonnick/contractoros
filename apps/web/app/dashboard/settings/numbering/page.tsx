"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, Button } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import {
  HashtagIcon,
  DocumentTextIcon,
  DocumentCheckIcon,
  FolderIcon,
  DocumentPlusIcon,
} from '@heroicons/react/24/outline';
import {
  getNumberingSettings,
  saveNumberingSettings,
  getCurrentCounter,
  previewNextNumber,
  NumberingSettings,
  NumberingConfig,
  NumberableDocumentType,
  DEFAULT_NUMBERING_CONFIG,
} from '@/lib/utils/auto-number';

interface NumberingTypeConfig {
  type: NumberableDocumentType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NUMBERING_TYPES: NumberingTypeConfig[] = [
  {
    type: 'estimate',
    label: 'Estimates',
    description: 'Estimate and proposal numbers',
    icon: DocumentTextIcon,
  },
  {
    type: 'invoice',
    label: 'Invoices',
    description: 'Invoice and billing numbers',
    icon: DocumentCheckIcon,
  },
  {
    type: 'project',
    label: 'Projects',
    description: 'Project reference numbers',
    icon: FolderIcon,
  },
  {
    type: 'change_order',
    label: 'Change Orders',
    description: 'Change order numbers',
    icon: DocumentPlusIcon,
  },
];

interface TypeFormData {
  prefix: string;
  padLength: string;
  startFrom: string;
}

type FormData = Record<NumberableDocumentType, TypeFormData>;

export default function NumberingSettingsPage() {
  const { profile } = useAuth();
  const orgId = profile?.orgId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [counters, setCounters] = useState<Record<NumberableDocumentType, number>>({
    estimate: 0,
    invoice: 0,
    project: 0,
    change_order: 0,
  });
  const [form, setForm] = useState<FormData>({
    estimate: { prefix: 'EST-', padLength: '5', startFrom: '1' },
    invoice: { prefix: 'INV-', padLength: '5', startFrom: '1' },
    project: { prefix: 'PRJ-', padLength: '5', startFrom: '1' },
    change_order: { prefix: 'CO-', padLength: '5', startFrom: '1' },
  });

  // Load settings on mount
  useEffect(() => {
    if (!orgId) return;

    const loadSettings = async () => {
      try {
        const [settings, estCounter, invCounter, prjCounter, coCounter] = await Promise.all([
          getNumberingSettings(orgId),
          getCurrentCounter(orgId, 'estimate'),
          getCurrentCounter(orgId, 'invoice'),
          getCurrentCounter(orgId, 'project'),
          getCurrentCounter(orgId, 'change_order'),
        ]);

        setForm({
          estimate: {
            prefix: settings.estimate.prefix,
            padLength: String(settings.estimate.padLength),
            startFrom: String(settings.estimate.startFrom),
          },
          invoice: {
            prefix: settings.invoice.prefix,
            padLength: String(settings.invoice.padLength),
            startFrom: String(settings.invoice.startFrom),
          },
          project: {
            prefix: settings.project.prefix,
            padLength: String(settings.project.padLength),
            startFrom: String(settings.project.startFrom),
          },
          change_order: {
            prefix: settings.change_order.prefix,
            padLength: String(settings.change_order.padLength),
            startFrom: String(settings.change_order.startFrom),
          },
        });

        setCounters({
          estimate: estCounter,
          invoice: invCounter,
          project: prjCounter,
          change_order: coCounter,
        });
      } catch (error) {
        console.error('Failed to load numbering settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [orgId]);

  const updateField = (
    type: NumberableDocumentType,
    field: keyof TypeFormData,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const getPreview = (type: NumberableDocumentType): string => {
    const typeForm = form[type];
    const config: NumberingConfig = {
      prefix: typeForm.prefix || DEFAULT_NUMBERING_CONFIG[type].prefix,
      padLength: parseInt(typeForm.padLength) || DEFAULT_NUMBERING_CONFIG[type].padLength,
      startFrom: parseInt(typeForm.startFrom) || DEFAULT_NUMBERING_CONFIG[type].startFrom,
    };
    return previewNextNumber(config, counters[type]);
  };

  const handleSave = async () => {
    if (!orgId) return;

    // Validate
    for (const type of NUMBERING_TYPES) {
      const typeForm = form[type.type];
      const padLength = parseInt(typeForm.padLength);
      const startFrom = parseInt(typeForm.startFrom);

      if (!typeForm.prefix.trim()) {
        toast.error(`${type.label}: Prefix is required`);
        return;
      }
      if (isNaN(padLength) || padLength < 1 || padLength > 10) {
        toast.error(`${type.label}: Pad length must be between 1 and 10`);
        return;
      }
      if (isNaN(startFrom) || startFrom < 1) {
        toast.error(`${type.label}: Start from must be at least 1`);
        return;
      }
    }

    setSaving(true);
    try {
      const settings: NumberingSettings = {
        estimate: {
          prefix: form.estimate.prefix,
          padLength: parseInt(form.estimate.padLength),
          startFrom: parseInt(form.estimate.startFrom),
        },
        invoice: {
          prefix: form.invoice.prefix,
          padLength: parseInt(form.invoice.padLength),
          startFrom: parseInt(form.invoice.startFrom),
        },
        project: {
          prefix: form.project.prefix,
          padLength: parseInt(form.project.padLength),
          startFrom: parseInt(form.project.startFrom),
        },
        change_order: {
          prefix: form.change_order.prefix,
          padLength: parseInt(form.change_order.padLength),
          startFrom: parseInt(form.change_order.startFrom),
        },
      };

      await saveNumberingSettings(orgId, settings);
      toast.success('Numbering settings saved');
    } catch (error) {
      console.error('Failed to save numbering settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = (type: NumberableDocumentType) => {
    const defaultConfig = DEFAULT_NUMBERING_CONFIG[type];
    setForm((prev) => ({
      ...prev,
      [type]: {
        prefix: defaultConfig.prefix,
        padLength: String(defaultConfig.padLength),
        startFrom: String(defaultConfig.startFrom),
      },
    }));
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <HashtagIcon className="h-5 w-5 text-gray-400" />
            Document Numbering
          </h2>
          <p className="text-sm text-gray-500">
            Configure automatic sequential numbering for your documents
          </p>
        </div>
        <Button variant="primary" onClick={handleSave} loading={saving}>
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        {NUMBERING_TYPES.map(({ type, label, description, icon: Icon }) => (
          <Card key={type} className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Icon className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{label}</h3>
                    <p className="text-sm text-gray-500">{description}</p>
                  </div>
                  <button
                    onClick={() => handleReset(type)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Reset to default
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prefix
                    </label>
                    <input
                      type="text"
                      value={form[type].prefix}
                      onChange={(e) => updateField(type, 'prefix', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="e.g., EST-"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number Length
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={form[type].padLength}
                      onChange={(e) => updateField(type, 'padLength', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="5"
                    />
                    <p className="text-xs text-gray-400 mt-1">Digits to pad (1-10)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start From
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form[type].startFrom}
                      onChange={(e) => updateField(type, 'startFrom', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="1"
                    />
                    <p className="text-xs text-gray-400 mt-1">Minimum starting number</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Next number preview:</span>
                    <span className="font-mono font-semibold text-gray-900 bg-white px-3 py-1 rounded border">
                      {getPreview(type)}
                    </span>
                  </div>
                  {counters[type] > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      Current counter: {counters[type]} (last assigned number)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex gap-3">
          <div className="text-amber-600 mt-0.5">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800">Important Note</p>
            <p className="text-sm text-amber-700 mt-1">
              Changing the prefix or format will only affect new documents. Existing documents will keep their current numbers.
              The &quot;Start From&quot; setting only applies if it&apos;s greater than the current counter.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
