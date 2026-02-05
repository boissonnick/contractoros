/**
 * Preference-Aware Notification Creation
 *
 * Wraps the base notification service with user preference checks.
 * Before creating a notification, this checks:
 * 1. Whether the user has the notification type enabled (email/push)
 * 2. Whether the project is muted for the user
 * 3. Whether quiet hours are active (returns suppressed flag for caller to handle)
 */

import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { NotificationPreferences, NotificationProjectSettings } from '@/types';
import { createNotification } from './service';
import { CreateNotificationData } from './types';
import { isQuietHoursActive } from '@/lib/hooks/useNotifications';

/**
 * Maps notification types from types/index.ts to email preference keys.
 * This bridges the gap between the NotificationType union and the
 * email preference fields on NotificationPreferences.
 */
const NOTIFICATION_TYPE_TO_EMAIL_PREF: Record<string, keyof NotificationPreferences['email'] | null> = {
  task_assigned: 'taskAssigned',
  task_completed: 'taskAssigned', // falls under task notifications
  task_due_soon: 'taskDueSoon',
  rfi_created: 'rfiCreated',
  rfi_responded: 'rfiCreated',
  submittal_review: null, // no specific preference, always send
  punch_item_assigned: 'taskAssigned',
  invoice_paid: 'invoicePaid',
  invoice_overdue: 'invoiceOverdue',
  expense_approved: 'expenseApproved',
  expense_rejected: 'expenseApproved',
  change_order_pending: 'changeOrderPending',
  selection_pending: 'selectionPending',
  selection_made: 'selectionPending',
  message_received: 'messages',
  mention: 'mentions',
  general: null, // always send
};

/**
 * Maps notification types to push preference keys.
 */
const NOTIFICATION_TYPE_TO_PUSH_PREF: Record<string, keyof NotificationPreferences['push'] | null> = {
  task_assigned: 'taskAssigned',
  task_completed: 'taskAssigned',
  task_due_soon: 'taskDueSoon',
  invoice_paid: 'invoicePaid',
  change_order_pending: 'changeOrderPending',
  message_received: 'messages',
  mention: 'mentions',
};

/**
 * Maps notification types to project-level preference keys.
 */
const NOTIFICATION_TYPE_TO_PROJECT_PREF: Record<string, keyof Omit<NotificationProjectSettings, 'projectId' | 'projectName' | 'muted' | 'updatedAt'> | null> = {
  task_assigned: 'taskNotifications',
  task_completed: 'taskNotifications',
  task_due_soon: 'taskNotifications',
  punch_item_assigned: 'taskNotifications',
  rfi_created: 'rfiNotifications',
  rfi_responded: 'rfiNotifications',
  expense_approved: 'expenseNotifications',
  expense_rejected: 'expenseNotifications',
  change_order_pending: 'changeOrderNotifications',
};

interface PreferenceCheckResult {
  shouldCreateInApp: boolean;
  shouldSendEmail: boolean;
  shouldSendPush: boolean;
  isQuietHours: boolean;
  reason?: string;
}

/**
 * Fetch notification preferences for a specific user.
 */
async function getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
  const q = query(
    collection(db, 'notificationPreferences'),
    where('userId', '==', userId),
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as NotificationPreferences;
}

/**
 * Check whether a notification should be delivered based on user preferences.
 */
export function checkNotificationPreferences(
  preferences: NotificationPreferences | null,
  notificationType: string,
  projectId?: string,
): PreferenceCheckResult {
  // No preferences = deliver everything (defaults)
  if (!preferences) {
    return {
      shouldCreateInApp: true,
      shouldSendEmail: true,
      shouldSendPush: true,
      isQuietHours: false,
    };
  }

  let shouldSendEmail = true;
  let shouldSendPush = true;

  // Check email master switch
  if (!preferences.email.enabled) {
    shouldSendEmail = false;
  } else {
    // Check specific email preference
    const emailPrefKey = NOTIFICATION_TYPE_TO_EMAIL_PREF[notificationType];
    if (emailPrefKey && emailPrefKey !== 'enabled') {
      const prefValue = preferences.email[emailPrefKey];
      if (prefValue === false) {
        shouldSendEmail = false;
      }
    }
  }

  // Check push master switch
  if (!preferences.push.enabled) {
    shouldSendPush = false;
  } else {
    // Check specific push preference
    const pushPrefKey = NOTIFICATION_TYPE_TO_PUSH_PREF[notificationType];
    if (pushPrefKey && pushPrefKey !== 'enabled') {
      const prefValue = preferences.push[pushPrefKey];
      if (prefValue === false) {
        shouldSendPush = false;
      }
    }
  }

  // Check project-level settings
  if (projectId && preferences.projectSettings) {
    const projectSettings = preferences.projectSettings.find(
      (ps) => ps.projectId === projectId
    );
    if (projectSettings) {
      // Project is muted entirely
      if (projectSettings.muted) {
        return {
          shouldCreateInApp: false,
          shouldSendEmail: false,
          shouldSendPush: false,
          isQuietHours: false,
          reason: 'Project is muted',
        };
      }

      // Check specific project notification type
      const projectPrefKey = NOTIFICATION_TYPE_TO_PROJECT_PREF[notificationType];
      if (projectPrefKey) {
        const prefValue = projectSettings[projectPrefKey];
        if (prefValue === false) {
          return {
            shouldCreateInApp: false,
            shouldSendEmail: false,
            shouldSendPush: false,
            isQuietHours: false,
            reason: `${projectPrefKey} disabled for project`,
          };
        }
      }
    }
  }

  // Check quiet hours
  const quietHours = isQuietHoursActive(preferences.quietHours);

  return {
    shouldCreateInApp: true,
    shouldSendEmail,
    shouldSendPush: quietHours ? false : shouldSendPush,
    isQuietHours: quietHours,
  };
}

/**
 * Create a notification with preference checking.
 * Returns null if the notification was suppressed by preferences.
 */
export async function createPreferenceAwareNotification(
  orgId: string,
  data: CreateNotificationData & { projectId?: string },
): Promise<{ id: string | null; suppressed: boolean; channels: PreferenceCheckResult }> {
  // Fetch user preferences
  const preferences = await getUserPreferences(data.userId);
  const check = checkNotificationPreferences(
    preferences,
    data.type,
    data.metadata?.projectId,
  );

  if (!check.shouldCreateInApp) {
    return { id: null, suppressed: true, channels: check };
  }

  // Create the in-app notification
  const id = await createNotification(orgId, data);

  return { id, suppressed: false, channels: check };
}
