"use client";

import React, { useState, useEffect } from 'react';
import { useNotificationPreferences } from '@/lib/hooks/useNotifications';
import {
  useBrowserNotification,
  getBrowserInstructions,
  BrowserPermissionState
} from '@/lib/hooks/useBrowserNotification';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { QuietHoursConfig, DayOfWeek } from '@/types';
import { ProjectNotificationSettings } from '@/components/settings/ProjectNotificationSettings';
import {
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  MoonIcon,
  BellAlertIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

function Toggle({ label, description, checked, onChange, disabled }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className={cn(
          "text-sm font-medium",
          disabled ? "text-gray-400" : "text-gray-900"
        )}>{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <button
        onClick={onChange}
        disabled={disabled}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors',
          disabled && 'opacity-50 cursor-not-allowed',
          checked ? 'bg-brand-primary' : 'bg-gray-300'
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

function PermissionStatusBadge({ state }: { state: BrowserPermissionState }) {
  const config = {
    granted: {
      icon: CheckCircleIcon,
      bg: 'bg-green-50',
      text: 'text-green-700',
      label: 'Enabled',
    },
    denied: {
      icon: XCircleIcon,
      bg: 'bg-red-50',
      text: 'text-red-700',
      label: 'Blocked',
    },
    default: {
      icon: InformationCircleIcon,
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      label: 'Not set',
    },
    unsupported: {
      icon: ExclamationTriangleIcon,
      bg: 'bg-gray-50',
      text: 'text-gray-600',
      label: 'Not supported',
    },
  };

  const { icon: Icon, bg, text, label } = config[state];

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', bg, text)}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

const DAY_OPTIONS: { value: DayOfWeek; label: string }[] = [
  { value: 'mon', label: 'M' },
  { value: 'tue', label: 'T' },
  { value: 'wed', label: 'W' },
  { value: 'thu', label: 'T' },
  { value: 'fri', label: 'F' },
  { value: 'sat', label: 'S' },
  { value: 'sun', label: 'S' },
];

const PRESET_OPTIONS = [
  { value: 'everyday', label: 'Every day', days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as DayOfWeek[] },
  { value: 'weekdays', label: 'Weekdays only', days: ['mon', 'tue', 'wed', 'thu', 'fri'] as DayOfWeek[] },
  { value: 'weekends', label: 'Weekends only', days: ['sat', 'sun'] as DayOfWeek[] },
  { value: 'custom', label: 'Custom', days: [] as DayOfWeek[] },
];

function getPresetFromDays(days: DayOfWeek[]): string {
  const sorted = [...days].sort();
  const weekdays = ['fri', 'mon', 'thu', 'tue', 'wed'];
  const weekends = ['sat', 'sun'];
  const everyday = ['fri', 'mon', 'sat', 'sun', 'thu', 'tue', 'wed'];

  if (JSON.stringify(sorted) === JSON.stringify(everyday)) return 'everyday';
  if (JSON.stringify(sorted) === JSON.stringify(weekdays)) return 'weekdays';
  if (JSON.stringify(sorted) === JSON.stringify(weekends)) return 'weekends';
  return 'custom';
}

export default function NotificationSettingsPage() {
  const { preferences, loading, updatePreference, updateQuietHours, quietHoursActive, preferencesId, refetch } = useNotificationPreferences();
  const [localQuietHours, setLocalQuietHours] = useState<QuietHoursConfig | null>(null);
  const {
    permissionState,
    isSupported,
    requestPermission,
    sendTestNotification,
    isRequesting
  } = useBrowserNotification();

  useEffect(() => {
    if (preferences?.quietHours) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch setState is not synchronous
      setLocalQuietHours(preferences.quietHours);
    }
  }, [preferences?.quietHours]);

  const handleToggle = async (category: 'email' | 'push', key: string, currentValue: boolean) => {
    const success = await updatePreference(category, key, !currentValue);
    if (!success) {
      toast.error('Failed to update notification preference');
    }
  };

  const handlePushToggle = async (key: string, currentValue: boolean) => {
    // If enabling push notifications and permission not granted, request it first
    if (!currentValue && key === 'enabled' && permissionState !== 'granted') {
      if (permissionState === 'denied') {
        toast.error('Browser notifications are blocked. Please enable them in your browser settings.');
        return;
      }

      const granted = await requestPermission();
      if (!granted) {
        toast.error('Browser notification permission was not granted');
        return;
      }
      toast.success('Browser notifications enabled!');
    }

    const success = await updatePreference('push', key, !currentValue);
    if (!success) {
      toast.error('Failed to update notification preference');
    }
  };

  const handleTestNotification = () => {
    if (permissionState !== 'granted') {
      toast.error('Please enable browser notifications first');
      return;
    }
    sendTestNotification();
    toast.success('Test notification sent!');
  };

  const handleRequestPermission = async () => {
    if (permissionState === 'denied') {
      toast.error('Notifications are blocked. Please enable them in your browser settings.');
      return;
    }

    const granted = await requestPermission();
    if (granted) {
      toast.success('Browser notifications enabled!');
    } else {
      toast.error('Permission was not granted');
    }
  };

  const handleQuietHoursChange = async (updates: Partial<QuietHoursConfig>) => {
    if (!localQuietHours) return;

    const updated = { ...localQuietHours, ...updates };
    setLocalQuietHours(updated);

    const success = await updateQuietHours(updated);
    if (!success) {
      toast.error('Failed to update quiet hours');
      // Revert on error
      setLocalQuietHours(preferences?.quietHours || null);
    }
  };

  const handlePresetChange = (preset: string) => {
    const option = PRESET_OPTIONS.find(p => p.value === preset);
    if (option && option.value !== 'custom') {
      handleQuietHoursChange({ days: option.days });
    }
  };

  const handleDayToggle = (day: DayOfWeek) => {
    if (!localQuietHours) return;
    const newDays = localQuietHours.days.includes(day)
      ? localQuietHours.days.filter(d => d !== day)
      : [...localQuietHours.days, day];
    handleQuietHoursChange({ days: newDays });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!preferences) return null;

  const isPushDisabled = permissionState === 'denied' || permissionState === 'unsupported';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 font-heading tracking-tight">Notification Preferences</h2>
        <p className="text-sm text-gray-500">Control how and when you receive notifications</p>
      </div>

      {/* Browser Permission Status */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <BellAlertIcon className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Browser Notifications</h3>
          <PermissionStatusBadge state={permissionState} />
        </div>

        {!isSupported && (
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg mb-4">
            <ExclamationTriangleIcon className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700">
                Your browser does not support desktop notifications.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Try using a modern browser like Chrome, Firefox, Safari, or Edge.
              </p>
            </div>
          </div>
        )}

        {isSupported && permissionState === 'denied' && (
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg mb-4">
            <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 font-medium">
                Browser notifications are blocked
              </p>
              <p className="text-xs text-red-600 mt-1">
                {getBrowserInstructions()}
              </p>
            </div>
          </div>
        )}

        {isSupported && permissionState === 'default' && (
          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg mb-4">
            <InformationCircleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-700">
                Browser notification permission has not been set.
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Click the button below to enable browser notifications.
              </p>
            </div>
          </div>
        )}

        {isSupported && permissionState === 'granted' && (
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg mb-4">
            <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-green-700">
                Browser notifications are enabled and ready to use.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {isSupported && permissionState !== 'granted' && permissionState !== 'denied' && (
            <button
              onClick={handleRequestPermission}
              disabled={isRequesting}
              className={cn(
                "px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-xl",
                "hover:bg-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors"
              )}
            >
              {isRequesting ? 'Requesting...' : 'Enable Browser Notifications'}
            </button>
          )}

          {isSupported && permissionState === 'granted' && (
            <button
              onClick={handleTestNotification}
              className={cn(
                "px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl",
                "hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:ring-offset-2",
                "transition-colors"
              )}
            >
              Send Test Notification
            </button>
          )}
        </div>
      </Card>

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
            onChange={() => handleToggle('email', 'enabled', preferences.email.enabled)}
          />
          <Toggle label="Task Assigned" description="When a task is assigned to you" checked={preferences.email.taskAssigned} onChange={() => handleToggle('email', 'taskAssigned', preferences.email.taskAssigned)} />
          <Toggle label="Task Due Soon" description="Reminder before a task is due" checked={preferences.email.taskDueSoon} onChange={() => handleToggle('email', 'taskDueSoon', preferences.email.taskDueSoon)} />
          <Toggle label="Invoice Paid" description="When a client pays an invoice" checked={preferences.email.invoicePaid} onChange={() => handleToggle('email', 'invoicePaid', preferences.email.invoicePaid)} />
          <Toggle label="Invoice Overdue" description="When an invoice becomes overdue" checked={preferences.email.invoiceOverdue} onChange={() => handleToggle('email', 'invoiceOverdue', preferences.email.invoiceOverdue)} />
          <Toggle label="RFI Created" description="When a new RFI is submitted" checked={preferences.email.rfiCreated} onChange={() => handleToggle('email', 'rfiCreated', preferences.email.rfiCreated)} />
          <Toggle label="Expense Approved/Rejected" description="When your expense report is reviewed" checked={preferences.email.expenseApproved} onChange={() => handleToggle('email', 'expenseApproved', preferences.email.expenseApproved)} />
          <Toggle label="Change Order Pending" description="When a change order needs your approval" checked={preferences.email.changeOrderPending ?? true} onChange={() => handleToggle('email', 'changeOrderPending', preferences.email.changeOrderPending ?? true)} />
          <Toggle label="Selection Pending" description="When a selection is awaiting your decision" checked={preferences.email.selectionPending ?? true} onChange={() => handleToggle('email', 'selectionPending', preferences.email.selectionPending ?? true)} />
          <Toggle label="Messages" description="New messages in your channels" checked={preferences.email.messages} onChange={() => handleToggle('email', 'messages', preferences.email.messages)} />
          <Toggle label="@Mentions" description="When someone mentions you" checked={preferences.email.mentions} onChange={() => handleToggle('email', 'mentions', preferences.email.mentions)} />
          <Toggle label="Daily Digest" description="Summary of daily activity" checked={preferences.email.dailyDigest} onChange={() => handleToggle('email', 'dailyDigest', preferences.email.dailyDigest)} />
        </div>
      </Card>

      {/* Push Notifications */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Push Notifications</h3>
          {isPushDisabled && (
            <span className="text-xs text-gray-500">(Enable browser notifications first)</span>
          )}
        </div>
        <div className="space-y-1 divide-y divide-gray-100">
          <Toggle
            label="Push Notifications"
            description="Master switch for all push notifications"
            checked={preferences.push.enabled}
            onChange={() => handlePushToggle('enabled', preferences.push.enabled)}
            disabled={isPushDisabled}
          />
          <Toggle
            label="Task Assigned"
            checked={preferences.push.taskAssigned}
            onChange={() => handlePushToggle('taskAssigned', preferences.push.taskAssigned)}
            disabled={isPushDisabled}
          />
          <Toggle
            label="Task Due Soon"
            checked={preferences.push.taskDueSoon}
            onChange={() => handlePushToggle('taskDueSoon', preferences.push.taskDueSoon)}
            disabled={isPushDisabled}
          />
          <Toggle
            label="Invoice Paid"
            checked={preferences.push.invoicePaid}
            onChange={() => handlePushToggle('invoicePaid', preferences.push.invoicePaid)}
            disabled={isPushDisabled}
          />
          <Toggle
            label="Change Order Pending"
            description="When a change order needs your approval"
            checked={preferences.push.changeOrderPending ?? true}
            onChange={() => handlePushToggle('changeOrderPending', preferences.push.changeOrderPending ?? true)}
            disabled={isPushDisabled}
          />
          <Toggle
            label="Messages"
            checked={preferences.push.messages}
            onChange={() => handlePushToggle('messages', preferences.push.messages)}
            disabled={isPushDisabled}
          />
          <Toggle
            label="@Mentions"
            checked={preferences.push.mentions}
            onChange={() => handlePushToggle('mentions', preferences.push.mentions)}
            disabled={isPushDisabled}
          />
        </div>
      </Card>

      {/* Quiet Hours / Do Not Disturb */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MoonIcon className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Quiet Hours</h3>
          </div>
          {quietHoursActive && localQuietHours?.enabled && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              Active Now
            </span>
          )}
        </div>

        {localQuietHours && (
          <div className="space-y-4">
            {/* Enable toggle */}
            <Toggle
              label="Enable Quiet Hours"
              description="Silence notifications during scheduled times"
              checked={localQuietHours.enabled}
              onChange={() => handleQuietHoursChange({ enabled: !localQuietHours.enabled })}
            />

            {localQuietHours.enabled && (
              <>
                {/* Time pickers */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={localQuietHours.startTime}
                      onChange={(e) => handleQuietHoursChange({ startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={localQuietHours.endTime}
                      onChange={(e) => handleQuietHoursChange({ endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    />
                  </div>
                </div>

                {/* Day preset selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule
                  </label>
                  <select
                    value={getPresetFromDays(localQuietHours.days)}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  >
                    {PRESET_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom day selection */}
                {getPresetFromDays(localQuietHours.days) === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Days
                    </label>
                    <div className="flex gap-2">
                      {DAY_OPTIONS.map((day, idx) => (
                        <button
                          key={`${day.value}-${idx}`}
                          onClick={() => handleDayToggle(day.value)}
                          className={cn(
                            'w-9 h-9 rounded-full text-sm font-medium transition-colors',
                            localQuietHours.days.includes(day.value)
                              ? 'bg-brand-primary text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          )}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* High priority override */}
                <div className="pt-2 border-t border-gray-100">
                  <Toggle
                    label="Allow High-Priority Notifications"
                    description="Urgent notifications will still come through during quiet hours"
                    checked={localQuietHours.allowHighPriority}
                    onChange={() => handleQuietHoursChange({ allowHighPriority: !localQuietHours.allowHighPriority })}
                  />
                </div>

                {/* Status summary */}
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <p>
                    Notifications will be silenced from{' '}
                    <span className="font-medium">{localQuietHours.startTime}</span> to{' '}
                    <span className="font-medium">{localQuietHours.endTime}</span>
                    {localQuietHours.days.length === 7 && ' every day'}
                    {localQuietHours.days.length === 5 &&
                      JSON.stringify([...localQuietHours.days].sort()) === JSON.stringify(['fri', 'mon', 'thu', 'tue', 'wed']) &&
                      ' on weekdays'}
                    {localQuietHours.days.length === 2 &&
                      JSON.stringify([...localQuietHours.days].sort()) === JSON.stringify(['sat', 'sun']) &&
                      ' on weekends'}
                    {getPresetFromDays(localQuietHours.days) === 'custom' && localQuietHours.days.length > 0 &&
                      ` on ${localQuietHours.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}`}
                    {localQuietHours.days.length === 0 && ' (no days selected)'}
                    .
                  </p>
                  {localQuietHours.allowHighPriority && (
                    <p className="mt-1 text-gray-500">
                      High-priority notifications will still be delivered.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Project-Specific Settings */}
      <ProjectNotificationSettings
        projectSettings={preferences.projectSettings || []}
        preferencesId={preferencesId}
        onUpdate={refetch}
      />

      <p className="text-xs text-gray-400 text-center">
        Changes are saved automatically. Push notifications require browser permission.
      </p>
    </div>
  );
}
