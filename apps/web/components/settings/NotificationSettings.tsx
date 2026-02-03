'use client';

import React, { useState } from 'react';
import { useBrowserNotifications } from '@/lib/hooks/useBrowserNotifications';
import { AppNotificationType } from '@/lib/notifications/browser-notifications';
import {
  BellIcon,
  BellSlashIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  MoonIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const NOTIFICATION_TYPE_LABELS: Record<AppNotificationType, { label: string; description: string }> = {
  task_assigned: { label: 'Task Assignments', description: 'When a task is assigned to you' },
  task_completed: { label: 'Task Completions', description: 'When tasks you created are completed' },
  rfi_response: { label: 'RFI Responses', description: 'When an RFI receives a response' },
  change_order_approval: { label: 'Change Orders', description: 'When change orders are approved or rejected' },
  schedule_change: { label: 'Schedule Changes', description: 'When project schedules are modified' },
  message_received: { label: 'Messages', description: 'When you receive new messages' },
  invoice_paid: { label: 'Invoice Payments', description: 'When invoices are paid' },
  expense_approved: { label: 'Expense Approvals', description: 'When expenses are approved' },
  bid_received: { label: 'New Bids', description: 'When new bids are received' },
  project_update: { label: 'Project Updates', description: 'General project updates' },
  mention: { label: 'Mentions', description: 'When you are mentioned in comments' },
  system: { label: 'System Notifications', description: 'Important system announcements' },
};

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export function NotificationSettings() {
  const {
    isSupported,
    permission,
    isGranted,
    isDenied,
    requestPermission,
    preferences,
    toggleType,
    setBrowserEnabled,
    setSoundEnabled,
    setQuietHours,
    isQuietHours,
  } = useBrowserNotifications();

  const [requesting, setRequesting] = useState(false);

  const handleRequestPermission = async () => {
    setRequesting(true);
    await requestPermission();
    setRequesting(false);
  };

  const handleQuietHoursToggle = () => {
    setQuietHours({
      ...preferences.quietHours,
      enabled: !preferences.quietHours.enabled,
    });
  };

  const handleQuietHoursTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setQuietHours({
      ...preferences.quietHours,
      [field]: value,
    });
  };

  const handleDayToggle = (day: number) => {
    const days = preferences.quietHours.daysOfWeek;
    const newDays = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day].sort();
    setQuietHours({
      ...preferences.quietHours,
      daysOfWeek: newDays,
    });
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-800">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <p className="text-sm font-medium">Browser notifications are not supported</p>
        </div>
        <p className="mt-1 text-sm text-yellow-700">
          Your browser does not support desktop notifications. Try using Chrome, Firefox, or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Permission Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Browser Notifications</h3>

        {isDenied && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-red-800">
              <BellSlashIcon className="h-5 w-5" />
              <p className="text-sm font-medium">Notifications are blocked</p>
            </div>
            <p className="mt-1 text-sm text-red-700">
              You have blocked notifications for this site. To enable them, click the lock icon in your browser's address bar and allow notifications.
            </p>
          </div>
        )}

        {!isGranted && !isDenied && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">Enable desktop notifications</p>
              <p className="text-xs text-gray-500">Get notified about important updates</p>
            </div>
            <button
              onClick={handleRequestPermission}
              disabled={requesting}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {requesting ? 'Requesting...' : 'Enable Notifications'}
            </button>
          </div>
        )}

        {isGranted && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-700">Notifications enabled</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.browserEnabled}
                  onChange={(e) => setBrowserEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {preferences.soundEnabled ? (
                  <SpeakerWaveIcon className="h-5 w-5 text-gray-600" />
                ) : (
                  <SpeakerXMarkIcon className="h-5 w-5 text-gray-400" />
                )}
                <span className="text-sm text-gray-700">Notification sounds</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Quiet Hours */}
      {isGranted && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MoonIcon className="h-5 w-5 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Quiet Hours</h3>
              {isQuietHours && (
                <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                  Active
                </span>
              )}
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.quietHours.enabled}
                onChange={handleQuietHoursToggle}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {preferences.quietHours.enabled && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                Notifications will be silenced during quiet hours, except urgent ones.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={preferences.quietHours.startTime}
                    onChange={(e) => handleQuietHoursTimeChange('startTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={preferences.quietHours.endTime}
                    onChange={(e) => handleQuietHoursTimeChange('endTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Active Days</label>
                <div className="flex gap-1">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day.value}
                      onClick={() => handleDayToggle(day.value)}
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        preferences.quietHours.daysOfWeek.includes(day.value)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={preferences.quietHours.overrideForUrgent}
                  onChange={(e) =>
                    setQuietHours({
                      ...preferences.quietHours,
                      overrideForUrgent: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-gray-700">Allow urgent notifications during quiet hours</span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Notification Types */}
      {isGranted && preferences.browserEnabled && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Notification Types</h3>
          <div className="space-y-3">
            {(Object.keys(NOTIFICATION_TYPE_LABELS) as AppNotificationType[]).map((type) => {
              const { label, description } = NOTIFICATION_TYPE_LABELS[type];
              return (
                <div key={type} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700">{label}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.byType[type]}
                      onChange={() => toggleType(type)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationSettings;
