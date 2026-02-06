/**
 * Browser Notification Permissions & Management
 *
 * Handles browser-native notification permissions and display.
 * Works with the existing Firestore notification system.
 */

'use client';

import { logger } from '@/lib/utils/logger';

// ============================================
// Permission Management
// ============================================

/**
 * Check if browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request notification permission from user
 * @returns true if permission granted, false otherwise
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) {
    logger.warn('Browser does not support notifications', { component: 'notifications-browser-notifications' });
    return false;
  }

  // Already granted
  if (Notification.permission === 'granted') {
    return true;
  }

  // Previously denied - can't re-request programmatically
  if (Notification.permission === 'denied') {
    logger.warn('Notification permission was previously denied', { component: 'notifications-browser-notifications' });
    return false;
  }

  // Request permission
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    logger.error('Error requesting notification permission', { error: error, component: 'notifications-browser-notifications' });
    return false;
  }
}

// ============================================
// Notification Display
// ============================================

export interface BrowserNotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
  silent?: boolean;
}

/**
 * Show a browser notification
 * @returns The Notification object if shown, null otherwise
 */
export function showBrowserNotification(
  title: string,
  options?: BrowserNotificationOptions
): Notification | null {
  if (!isNotificationSupported()) {
    return null;
  }

  if (Notification.permission !== 'granted') {
    logger.warn('Notification permission not granted', { component: 'notifications-browser-notifications' });
    return null;
  }

  const defaultOptions: BrowserNotificationOptions = {
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    ...options,
  };

  try {
    const notification = new Notification(title, defaultOptions);

    // Handle click - navigate to action URL if provided
    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();

      const url = options?.data?.url as string | undefined;
      if (url) {
        window.location.href = url;
      }

      notification.close();
    };

    return notification;
  } catch (error) {
    logger.error('Error showing notification', { error: error, component: 'notifications-browser-notifications' });
    return null;
  }
}

// ============================================
// Notification Type Helpers
// ============================================

export type AppNotificationType =
  | 'task_assigned'
  | 'task_completed'
  | 'rfi_response'
  | 'change_order_approval'
  | 'schedule_change'
  | 'message_received'
  | 'invoice_paid'
  | 'expense_approved'
  | 'bid_received'
  | 'project_update'
  | 'mention'
  | 'system';

interface NotificationTypeConfig {
  icon: string;
  defaultTitle: string;
  sound: boolean;
}

const NOTIFICATION_TYPE_CONFIG: Record<AppNotificationType, NotificationTypeConfig> = {
  task_assigned: {
    icon: '/icons/task.png',
    defaultTitle: 'New Task Assigned',
    sound: true,
  },
  task_completed: {
    icon: '/icons/check.png',
    defaultTitle: 'Task Completed',
    sound: true,
  },
  rfi_response: {
    icon: '/icons/rfi.png',
    defaultTitle: 'RFI Response',
    sound: true,
  },
  change_order_approval: {
    icon: '/icons/change-order.png',
    defaultTitle: 'Change Order Update',
    sound: true,
  },
  schedule_change: {
    icon: '/icons/calendar.png',
    defaultTitle: 'Schedule Changed',
    sound: true,
  },
  message_received: {
    icon: '/icons/message.png',
    defaultTitle: 'New Message',
    sound: true,
  },
  invoice_paid: {
    icon: '/icons/payment.png',
    defaultTitle: 'Invoice Paid',
    sound: true,
  },
  expense_approved: {
    icon: '/icons/expense.png',
    defaultTitle: 'Expense Approved',
    sound: true,
  },
  bid_received: {
    icon: '/icons/bid.png',
    defaultTitle: 'New Bid Received',
    sound: true,
  },
  project_update: {
    icon: '/icons/project.png',
    defaultTitle: 'Project Update',
    sound: false,
  },
  mention: {
    icon: '/icons/mention.png',
    defaultTitle: 'You were mentioned',
    sound: true,
  },
  system: {
    icon: '/icon-192.png',
    defaultTitle: 'System Notification',
    sound: false,
  },
};

/**
 * Show a typed notification with appropriate defaults
 */
export function showTypedNotification(
  type: AppNotificationType,
  title: string,
  body: string,
  actionUrl?: string
): Notification | null {
  const config = NOTIFICATION_TYPE_CONFIG[type];

  return showBrowserNotification(title || config.defaultTitle, {
    body,
    icon: config.icon,
    silent: !config.sound,
    tag: type, // Group by type
    data: actionUrl ? { url: actionUrl } : undefined,
  });
}

// ============================================
// Permission State Storage
// ============================================

const PERMISSION_STORAGE_KEY = 'notification_permission_asked';

/**
 * Check if we've already asked for permission this session
 */
export function hasAskedForPermission(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(PERMISSION_STORAGE_KEY) === 'true';
}

/**
 * Mark that we've asked for permission
 */
export function markPermissionAsked(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PERMISSION_STORAGE_KEY, 'true');
}

/**
 * Request permission if not already asked this session
 * @returns true if permission granted, false otherwise
 */
export async function requestPermissionIfNeeded(): Promise<boolean> {
  if (hasAskedForPermission()) {
    return getNotificationPermissionStatus() === 'granted';
  }

  markPermissionAsked();
  return requestNotificationPermission();
}

// ============================================
// Quiet Hours / DND Support
// ============================================

export interface QuietHoursSettings {
  enabled: boolean;
  startTime: string; // "18:00" format
  endTime: string;   // "08:00" format
  timezone: string;
  overrideForUrgent: boolean;
  daysOfWeek: number[]; // 0-6, Sunday-Saturday
}

const DEFAULT_QUIET_HOURS: QuietHoursSettings = {
  enabled: false,
  startTime: '22:00',
  endTime: '07:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  overrideForUrgent: true,
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // All days
};

/**
 * Check if current time is within quiet hours
 */
export function isWithinQuietHours(
  settings: QuietHoursSettings = DEFAULT_QUIET_HOURS
): boolean {
  if (!settings.enabled) return false;

  const now = new Date();
  const currentDay = now.getDay();

  // Check if today is a quiet hours day
  if (!settings.daysOfWeek.includes(currentDay)) {
    return false;
  }

  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // Handle overnight quiet hours (e.g., 22:00 - 07:00)
  if (settings.startTime > settings.endTime) {
    return currentTime >= settings.startTime || currentTime < settings.endTime;
  }

  // Same-day quiet hours (e.g., 12:00 - 14:00)
  return currentTime >= settings.startTime && currentTime < settings.endTime;
}

/**
 * Check if notification should be suppressed
 */
export function shouldSuppressNotification(
  settings: QuietHoursSettings,
  priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
): boolean {
  if (!isWithinQuietHours(settings)) {
    return false;
  }

  // Allow urgent notifications through if configured
  if (settings.overrideForUrgent && priority === 'urgent') {
    return false;
  }

  return true;
}

// ============================================
// Notification Preferences
// ============================================

export interface NotificationPreferences {
  browserEnabled: boolean;
  soundEnabled: boolean;
  quietHours: QuietHoursSettings;
  byType: Record<AppNotificationType, boolean>;
}

const PREFERENCES_STORAGE_KEY = 'notification_preferences';

/**
 * Get notification preferences from localStorage
 */
export function getNotificationPreferences(): NotificationPreferences {
  if (typeof window === 'undefined') {
    return getDefaultPreferences();
  }

  const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
  if (!stored) {
    return getDefaultPreferences();
  }

  try {
    return JSON.parse(stored) as NotificationPreferences;
  } catch {
    return getDefaultPreferences();
  }
}

/**
 * Save notification preferences to localStorage
 */
export function saveNotificationPreferences(prefs: NotificationPreferences): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
}

/**
 * Get default notification preferences
 */
export function getDefaultPreferences(): NotificationPreferences {
  const byType: Record<AppNotificationType, boolean> = {
    task_assigned: true,
    task_completed: true,
    rfi_response: true,
    change_order_approval: true,
    schedule_change: true,
    message_received: true,
    invoice_paid: true,
    expense_approved: true,
    bid_received: true,
    project_update: true,
    mention: true,
    system: true,
  };

  return {
    browserEnabled: true,
    soundEnabled: true,
    quietHours: DEFAULT_QUIET_HOURS,
    byType,
  };
}

/**
 * Update a single preference
 */
export function updateNotificationPreference<K extends keyof NotificationPreferences>(
  key: K,
  value: NotificationPreferences[K]
): NotificationPreferences {
  const current = getNotificationPreferences();
  const updated = { ...current, [key]: value };
  saveNotificationPreferences(updated);
  return updated;
}

/**
 * Toggle a notification type on/off
 */
export function toggleNotificationType(type: AppNotificationType): boolean {
  const prefs = getNotificationPreferences();
  const newValue = !prefs.byType[type];
  prefs.byType[type] = newValue;
  saveNotificationPreferences(prefs);
  return newValue;
}
