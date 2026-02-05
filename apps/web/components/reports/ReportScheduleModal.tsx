'use client';

import React, { useState, useCallback } from 'react';
import { FormModal } from '@/components/ui/FormModal';
import { FormInput, FormSelect, FormSection } from '@/components/ui/FormField';
import {
  ClockIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly';

export interface ReportScheduleConfig {
  frequency: ScheduleFrequency;
  dayOfWeek?: number; // 0-6, Sunday-Saturday (for weekly)
  dayOfMonth?: number; // 1-31 (for monthly)
  time: string; // HH:MM format (UTC)
  recipients: string[]; // Email addresses
  enabled: boolean;
  reportId: string;
  reportName: string;
}

interface ReportScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: ReportScheduleConfig) => Promise<void>;
  reportId: string;
  reportName: string;
  existingSchedule?: ReportScheduleConfig | null;
}

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const DAY_OF_WEEK_OPTIONS = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
  { value: '0', label: 'Sunday' },
];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  const label = i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`;
  return { value: `${hour}:00`, label };
});

export function ReportScheduleModal({
  isOpen,
  onClose,
  onSave,
  reportId,
  reportName,
  existingSchedule,
}: ReportScheduleModalProps) {
  const [frequency, setFrequency] = useState<ScheduleFrequency>(
    existingSchedule?.frequency || 'weekly'
  );
  const [dayOfWeek, setDayOfWeek] = useState(
    existingSchedule?.dayOfWeek?.toString() || '1'
  );
  const [dayOfMonth, setDayOfMonth] = useState(
    existingSchedule?.dayOfMonth?.toString() || '1'
  );
  const [time, setTime] = useState(existingSchedule?.time || '09:00');
  const [recipients, setRecipients] = useState<string[]>(
    existingSchedule?.recipients || []
  );
  const [newRecipient, setNewRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRecipient = useCallback(() => {
    const email = newRecipient.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (recipients.includes(email)) {
      setError('This email is already added');
      return;
    }
    setRecipients((prev) => [...prev, email]);
    setNewRecipient('');
    setError(null);
  }, [newRecipient, recipients]);

  const removeRecipient = useCallback((email: string) => {
    setRecipients((prev) => prev.filter((r) => r !== email));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (recipients.length === 0) {
      setError('Add at least one recipient email');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSave({
        frequency,
        dayOfWeek: frequency === 'weekly' ? parseInt(dayOfWeek) : undefined,
        dayOfMonth: frequency === 'monthly' ? parseInt(dayOfMonth) : undefined,
        time,
        recipients,
        enabled: true,
        reportId,
        reportName,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save schedule');
    } finally {
      setLoading(false);
    }
  }, [frequency, dayOfWeek, dayOfMonth, time, recipients, reportId, reportName, onSave, onClose]);

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Report"
      description={`Automatically send "${reportName}" via email`}
      onSubmit={handleSubmit}
      submitLabel={existingSchedule ? 'Update Schedule' : 'Create Schedule'}
      loading={loading}
      error={error}
      size="md"
    >
      <FormSection title="Delivery Schedule">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
            <div className="flex gap-2">
              {FREQUENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFrequency(opt.value as ScheduleFrequency)}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    frequency === opt.value
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-medium'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {frequency === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {DAY_OF_WEEK_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {frequency === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day of Month</label>
              <select
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {Array.from({ length: 28 }, (_, i) => (
                  <option key={i + 1} value={(i + 1).toString()}>
                    {i + 1}{i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              {TIME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">Times are in your local timezone</p>
          </div>
        </div>
      </FormSection>

      <FormSection title="Recipients">
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="email"
              value={newRecipient}
              onChange={(e) => {
                setNewRecipient(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient())}
              placeholder="email@company.com"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <button
              type="button"
              onClick={addRecipient}
              className="px-4 py-2 text-sm font-medium text-brand-primary border border-brand-primary rounded-lg hover:bg-brand-primary/10 transition-colors"
            >
              Add
            </button>
          </div>

          {recipients.length > 0 && (
            <div className="space-y-1">
              {recipients.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                    {email}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRecipient(email)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {recipients.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-2">
              Add email addresses to receive this report
            </p>
          )}
        </div>
      </FormSection>
    </FormModal>
  );
}

export default ReportScheduleModal;
