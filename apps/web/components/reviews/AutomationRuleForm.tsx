'use client';

import React, { useState } from 'react';
import { FormModal } from '@/components/ui/FormModal';
import {
  ReviewAutomationTrigger,
  ReviewRequestChannel,
  REVIEW_AUTOMATION_TRIGGER_LABELS,
  REVIEW_REQUEST_CHANNEL_LABELS,
  ReviewAutomationRule,
} from '@/types/review';

interface AutomationRuleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ReviewAutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'requestsSent' | 'reviewsReceived'>) => Promise<string>;
  orgId: string;
}

export function AutomationRuleForm({
  isOpen,
  onClose,
  onSubmit,
  orgId,
}: AutomationRuleFormProps) {
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<ReviewAutomationTrigger>('project_completed');
  const [delayDays, setDelayDays] = useState(3);
  const [channel, setChannel] = useState<ReviewRequestChannel>('email');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        orgId,
        name,
        enabled: true,
        trigger,
        delayDays,
        channel,
      });
      onClose();
      // Reset form
      setName('');
      setTrigger('project_completed');
      setDelayDays(3);
      setChannel('email');
    } catch (err) {
      console.error('Failed to create automation rule:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Automation Rule"
      loading={loading}
      onSubmit={handleSubmit}
      submitLabel="Create Rule"
      disabled={!name.trim()}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Rule Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-primary focus:ring-brand-primary"
            placeholder="e.g., Post-Project Review Request"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Trigger</label>
          <select
            value={trigger}
            onChange={(e) => setTrigger(e.target.value as ReviewAutomationTrigger)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-primary focus:ring-brand-primary"
          >
            {Object.entries(REVIEW_AUTOMATION_TRIGGER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Delay (days after trigger)
          </label>
          <input
            type="number"
            min={0}
            max={30}
            value={delayDays}
            onChange={(e) => setDelayDays(Number(e.target.value))}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-primary focus:ring-brand-primary"
          />
          <p className="mt-1 text-xs text-gray-500">
            Wait this many days after the trigger before sending the request
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Send Via</label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as ReviewRequestChannel)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-primary focus:ring-brand-primary"
          >
            {Object.entries(REVIEW_REQUEST_CHANNEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </FormModal>
  );
}

export default AutomationRuleForm;
