"use client";

import React from 'react';
import { useNotificationPreferences } from '@/lib/hooks/useNotifications';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  EnvelopeIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
}

function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <button
        onClick={onChange}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors',
          checked ? 'bg-blue-600' : 'bg-gray-300'
        )}
      >
        <span className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform',
          checked && 'translate-x-5'
        )} />
      </button>
    </div>
  );
}

export default function NotificationSettingsPage() {
  const { preferences, loading } = useNotificationPreferences();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!preferences) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
        <p className="text-sm text-gray-500">Control how and when you receive notifications</p>
      </div>

      {/* Email Notifications */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <EnvelopeIcon className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Email Notifications</h3>
        </div>
        <div className="space-y-1 divide-y divide-gray-100">
          <Toggle
            label="Email Notifications"
            description="Master switch for all email notifications"
            checked={preferences.email.enabled}
            onChange={() => {}}
          />
          <Toggle label="Task Assigned" description="When a task is assigned to you" checked={preferences.email.taskAssigned} onChange={() => {}} />
          <Toggle label="Task Due Soon" description="Reminder before a task is due" checked={preferences.email.taskDueSoon} onChange={() => {}} />
          <Toggle label="Invoice Paid" description="When a client pays an invoice" checked={preferences.email.invoicePaid} onChange={() => {}} />
          <Toggle label="Invoice Overdue" description="When an invoice becomes overdue" checked={preferences.email.invoiceOverdue} onChange={() => {}} />
          <Toggle label="RFI Created" description="When a new RFI is submitted" checked={preferences.email.rfiCreated} onChange={() => {}} />
          <Toggle label="Expense Approved/Rejected" description="When your expense report is reviewed" checked={preferences.email.expenseApproved} onChange={() => {}} />
          <Toggle label="Messages" description="New messages in your channels" checked={preferences.email.messages} onChange={() => {}} />
          <Toggle label="@Mentions" description="When someone mentions you" checked={preferences.email.mentions} onChange={() => {}} />
          <Toggle label="Daily Digest" description="Summary of daily activity" checked={preferences.email.dailyDigest} onChange={() => {}} />
        </div>
      </Card>

      {/* Push Notifications */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Push Notifications</h3>
        </div>
        <div className="space-y-1 divide-y divide-gray-100">
          <Toggle
            label="Push Notifications"
            description="Master switch for all push notifications"
            checked={preferences.push.enabled}
            onChange={() => {}}
          />
          <Toggle label="Task Assigned" checked={preferences.push.taskAssigned} onChange={() => {}} />
          <Toggle label="Task Due Soon" checked={preferences.push.taskDueSoon} onChange={() => {}} />
          <Toggle label="Invoice Paid" checked={preferences.push.invoicePaid} onChange={() => {}} />
          <Toggle label="Messages" checked={preferences.push.messages} onChange={() => {}} />
          <Toggle label="@Mentions" checked={preferences.push.mentions} onChange={() => {}} />
        </div>
      </Card>

      <p className="text-xs text-gray-400 text-center">
        Changes are saved automatically. Push notifications require browser permission.
      </p>
    </div>
  );
}
