"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { PageHeader } from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import { toast } from '@/components/ui/Toast';
import {
  BellIcon,
  EnvelopeIcon,
  PhoneIcon,
  DevicePhoneMobileIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

interface NotificationSettings {
  emailInvoice: boolean;
  emailPayment: boolean;
  emailProjectUpdate: boolean;
  emailPhotoUpload: boolean;
  emailMessage: boolean;
  emailSelection: boolean;
  emailChangeOrder: boolean;
  emailWeeklySummary: boolean;
}

interface _ClientPreferences {
  userId: string;
  orgId: string;
  notifications: NotificationSettings;
  contactPreference: 'email' | 'phone' | 'text';
  phone: string;
  updatedAt: Date;
}

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  emailInvoice: true,
  emailPayment: true,
  emailProjectUpdate: true,
  emailPhotoUpload: true,
  emailMessage: true,
  emailSelection: true,
  emailChangeOrder: true,
  emailWeeklySummary: true,
};

const NOTIFICATION_OPTIONS: {
  key: keyof NotificationSettings;
  label: string;
  description: string;
}[] = [
  {
    key: 'emailInvoice',
    label: 'Invoice Received',
    description: 'Get notified when a new invoice is sent to you',
  },
  {
    key: 'emailPayment',
    label: 'Payment Confirmation',
    description: 'Receive confirmation when your payment is processed',
  },
  {
    key: 'emailProjectUpdate',
    label: 'Project Status Updates',
    description: 'Stay informed when your project status changes',
  },
  {
    key: 'emailPhotoUpload',
    label: 'Photo Uploads',
    description: 'Get notified when new project photos are added',
  },
  {
    key: 'emailMessage',
    label: 'Message Received',
    description: 'Get notified when you receive a new message',
  },
  {
    key: 'emailSelection',
    label: 'Selection Requests',
    description: 'Get notified when a selection decision is needed from you',
  },
  {
    key: 'emailChangeOrder',
    label: 'Change Order Updates',
    description: 'Get notified when a change order is created or updated',
  },
  {
    key: 'emailWeeklySummary',
    label: 'Weekly Project Summary',
    description: 'Receive a weekly digest of your project progress',
  },
];

const CONTACT_OPTIONS: {
  value: 'email' | 'phone' | 'text';
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: 'email',
    label: 'Email',
    description: 'Receive updates via email',
    icon: EnvelopeIcon,
  },
  {
    value: 'phone',
    label: 'Phone',
    description: 'Receive updates via phone call',
    icon: PhoneIcon,
  },
  {
    value: 'text',
    label: 'Text Message',
    description: 'Receive updates via SMS',
    icon: DevicePhoneMobileIcon,
  },
];

export default function ClientSettingsPage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);
  const [contactPreference, setContactPreference] = useState<'email' | 'phone' | 'text'>('email');
  const [phone, setPhone] = useState('');

  // Load existing preferences
  useEffect(() => {
    async function loadPreferences() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'clientPreferences', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.notifications) {
            setNotifications({ ...DEFAULT_NOTIFICATIONS, ...data.notifications });
          }
          if (data.contactPreference) {
            setContactPreference(data.contactPreference);
          }
          if (data.phone) {
            setPhone(data.phone);
          }
        }
      } catch (error) {
        logger.error('Error loading preferences', { error, page: 'client-settings' });
        toast.error('Failed to load preferences');
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, [user?.uid]);

  // Save preferences to Firestore
  const savePreferences = useCallback(
    async (
      updatedNotifications: NotificationSettings,
      updatedContact: 'email' | 'phone' | 'text',
      updatedPhone: string
    ) => {
      if (!user?.uid || !profile?.orgId) return;

      setSaving(true);
      try {
        const docRef = doc(db, 'clientPreferences', user.uid);
        await setDoc(
          docRef,
          {
            userId: user.uid,
            orgId: profile.orgId,
            notifications: updatedNotifications,
            contactPreference: updatedContact,
            phone: updatedPhone,
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        );
        toast.success('Preferences saved');
      } catch (error) {
        logger.error('Error saving preferences', { error, page: 'client-settings' });
        toast.error('Failed to save preferences');
      } finally {
        setSaving(false);
      }
    },
    [user?.uid, profile?.orgId]
  );

  // Toggle a notification setting
  const toggleNotification = useCallback(
    (key: keyof NotificationSettings) => {
      const updated = { ...notifications, [key]: !notifications[key] };
      setNotifications(updated);
      savePreferences(updated, contactPreference, phone);
    },
    [notifications, contactPreference, phone, savePreferences]
  );

  // Update contact preference
  const updateContactPreference = useCallback(
    (value: 'email' | 'phone' | 'text') => {
      setContactPreference(value);
      savePreferences(notifications, value, phone);
    },
    [notifications, phone, savePreferences]
  );

  // Save phone number on blur
  const handlePhoneSave = useCallback(() => {
    savePreferences(notifications, contactPreference, phone);
  }, [notifications, contactPreference, phone, savePreferences]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your notification preferences and contact information"
      />

      {/* Email Notifications */}
      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
            <BellIcon className="h-5 w-5 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
              Email Notifications
            </h2>
            <p className="text-sm text-gray-500">
              Choose which email notifications you would like to receive
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {NOTIFICATION_OPTIONS.map((option) => (
            <div key={option.key} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{option.label}</p>
                <p className="text-xs text-gray-500">{option.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifications[option.key]}
                onClick={() => toggleNotification(option.key)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2',
                  notifications[option.key] ? 'bg-brand-primary' : 'bg-gray-200'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    notifications[option.key] ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Communication Preferences */}
      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
            <EnvelopeIcon className="h-5 w-5 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
              Communication Preferences
            </h2>
            <p className="text-sm text-gray-500">
              How would you like your contractor to reach you?
            </p>
          </div>
        </div>

        {/* Preferred Contact Method */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Preferred Contact Method
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CONTACT_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = contactPreference === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateContactPreference(option.value)}
                  className={cn(
                    'relative flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all',
                    isSelected
                      ? 'border-brand-primary bg-brand-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div
                    className={cn(
                      'p-2 rounded-lg',
                      isSelected ? 'bg-brand-primary/10' : 'bg-gray-100'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        isSelected ? 'text-brand-primary' : 'text-gray-500'
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        isSelected ? 'text-brand-primary' : 'text-gray-900'
                      )}
                    >
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </div>
                  {isSelected && (
                    <CheckIcon className="h-5 w-5 text-brand-primary flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-700">Contact Information</h3>

          {/* Email (read-only) */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Email Address
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              <EnvelopeIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {user?.email || 'No email on file'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Contact your contractor to update your email address
            </p>
          </div>

          {/* Phone (editable) */}
          <div>
            <label
              htmlFor="phone"
              className="block text-xs font-medium text-gray-500 mb-1"
            >
              Phone Number
            </label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={handlePhoneSave}
                placeholder="(555) 123-4567"
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Saving indicator */}
      {saving && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-2">
          <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-600">Saving...</span>
        </div>
      )}
    </div>
  );
}
