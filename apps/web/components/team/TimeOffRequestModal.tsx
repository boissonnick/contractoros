"use client";

import React, { useState } from 'react';
import { Button, BaseModal } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { SubmitTimeOffData } from '@/lib/hooks/schedule/useTimeOffRequests';
import { logger } from '@/lib/utils/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TimeOffRequestModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SubmitTimeOffData) => Promise<string>;
  userId: string;
  userName: string;
}

const TYPE_OPTIONS: { value: SubmitTimeOffData['type']; label: string }[] = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'sick', label: 'Sick' },
  { value: 'personal', label: 'Personal' },
  { value: 'bereavement', label: 'Bereavement' },
  { value: 'jury_duty', label: 'Jury Duty' },
  { value: 'other', label: 'Other' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TimeOffRequestModal({
  open,
  onClose,
  onSubmit,
  userId,
  userName,
}: TimeOffRequestModalProps) {
  const today = toLocalDateString(new Date());

  const [type, setType] = useState<SubmitTimeOffData['type']>('vacation');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDay, setHalfDay] = useState<'morning' | 'afternoon'>('morning');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setType('vacation');
    setStartDate(today);
    setEndDate(today);
    setIsHalfDay(false);
    setHalfDay('morning');
    setReason('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    setSubmitting(true);
    try {
      await onSubmit({
        userId,
        userName,
        type,
        startDate: new Date(startDate + 'T00:00:00'),
        endDate: new Date(endDate + 'T00:00:00'),
        halfDay: isHalfDay ? halfDay : undefined,
        reason: reason.trim() || undefined,
      });
      resetForm();
      onClose();
    } catch (err) {
      logger.error('Failed to submit time off request', { error: err, component: 'TimeOffRequestModal' });
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = startDate && endDate && new Date(endDate) >= new Date(startDate);

  const inputClasses = cn(
    'w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent',
    'placeholder:text-gray-400'
  );

  const labelClasses = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Request Time Off"
      subtitle="Submit a new time-off request for approval"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={!isValid}
          >
            Submit Request
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type */}
        <div>
          <label className={labelClasses}>Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as SubmitTimeOffData['type'])}
            className={inputClasses}
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClasses}>Start Date</label>
            <input
              type="date"
              value={startDate}
              min={today}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value > endDate) {
                  setEndDate(e.target.value);
                }
              }}
              className={inputClasses}
              required
            />
          </div>
          <div>
            <label className={labelClasses}>End Date</label>
            <input
              type="date"
              value={endDate}
              min={startDate || today}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClasses}
              required
            />
          </div>
        </div>

        {/* Half day */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isHalfDay}
              onChange={(e) => setIsHalfDay(e.target.checked)}
              className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary h-4 w-4"
            />
            <span className="text-sm text-gray-700">Half day</span>
          </label>
          {isHalfDay && (
            <select
              value={halfDay}
              onChange={(e) => setHalfDay(e.target.value as 'morning' | 'afternoon')}
              className={cn(inputClasses, 'w-auto')}
            >
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
            </select>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className={labelClasses}>
            Reason <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Family vacation, Doctor appointment..."
            rows={3}
            className={cn(inputClasses, 'resize-none')}
          />
        </div>
      </form>
    </BaseModal>
  );
}
