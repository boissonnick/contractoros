/**
 * Hook for Browser Notification Management
 *
 * Provides reactive state and methods for browser notifications.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isNotificationSupported,
  getNotificationPermissionStatus,
  requestNotificationPermission,
  showTypedNotification,
  getNotificationPreferences,
  saveNotificationPreferences,
  NotificationPreferences,
  AppNotificationType,
  QuietHoursSettings,
  isWithinQuietHours,
  shouldSuppressNotification,
} from '@/lib/notifications/browser-notifications';

export interface UseBrowserNotificationsReturn {
  // Permission state
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isGranted: boolean;
  isDenied: boolean;

  // Actions
  requestPermission: () => Promise<boolean>;
  showNotification: (
    type: AppNotificationType,
    title: string,
    body: string,
    actionUrl?: string
  ) => Notification | null;

  // Preferences
  preferences: NotificationPreferences;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  toggleType: (type: AppNotificationType) => void;
  setBrowserEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setQuietHours: (settings: QuietHoursSettings) => void;

  // Status
  isQuietHours: boolean;
}

export function useBrowserNotifications(): UseBrowserNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [preferences, setPreferences] = useState<NotificationPreferences>(getNotificationPreferences);
  const [isQuietHours, setIsQuietHours] = useState(false);

  // Initialize permission state
  useEffect(() => {
    const status = getNotificationPermissionStatus();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch setState is not synchronous
    setPermission(status);

    // Check quiet hours periodically
    const checkQuietHours = () => {
      setIsQuietHours(isWithinQuietHours(preferences.quietHours));
    };

    checkQuietHours();
    const interval = setInterval(checkQuietHours, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [preferences.quietHours]);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermissionStatus());
    return granted;
  }, []);

  // Show notification with preferences check
  const showNotification = useCallback(
    (
      type: AppNotificationType,
      title: string,
      body: string,
      actionUrl?: string
    ): Notification | null => {
      // Check if browser notifications are enabled
      if (!preferences.browserEnabled) {
        return null;
      }

      // Check if this type is enabled
      if (!preferences.byType[type]) {
        return null;
      }

      // Check quiet hours (use 'normal' priority for now)
      if (shouldSuppressNotification(preferences.quietHours, 'normal')) {
        // Could queue notification for later
        console.log('Notification suppressed due to quiet hours:', title);
        return null;
      }

      return showTypedNotification(type, title, body, actionUrl);
    },
    [preferences]
  );

  // Update preferences
  const updatePreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    setPreferences((current) => {
      const updated = { ...current, ...updates };
      saveNotificationPreferences(updated);
      return updated;
    });
  }, []);

  // Toggle notification type
  const toggleType = useCallback((type: AppNotificationType) => {
    setPreferences((current) => {
      const updated = {
        ...current,
        byType: {
          ...current.byType,
          [type]: !current.byType[type],
        },
      };
      saveNotificationPreferences(updated);
      return updated;
    });
  }, []);

  // Set browser enabled
  const setBrowserEnabled = useCallback((enabled: boolean) => {
    updatePreferences({ browserEnabled: enabled });
  }, [updatePreferences]);

  // Set sound enabled
  const setSoundEnabled = useCallback((enabled: boolean) => {
    updatePreferences({ soundEnabled: enabled });
  }, [updatePreferences]);

  // Set quiet hours
  const setQuietHours = useCallback((settings: QuietHoursSettings) => {
    updatePreferences({ quietHours: settings });
  }, [updatePreferences]);

  return {
    // Permission state
    isSupported: isNotificationSupported(),
    permission,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',

    // Actions
    requestPermission,
    showNotification,

    // Preferences
    preferences,
    updatePreferences,
    toggleType,
    setBrowserEnabled,
    setSoundEnabled,
    setQuietHours,

    // Status
    isQuietHours,
  };
}

export default useBrowserNotifications;
