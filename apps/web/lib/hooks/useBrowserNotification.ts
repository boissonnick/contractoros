"use client";

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';

export type BrowserPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

interface UseBrowserNotificationReturn {
  /** Current browser notification permission state */
  permissionState: BrowserPermissionState;
  /** Whether browser notifications are supported */
  isSupported: boolean;
  /** Request browser notification permission */
  requestPermission: () => Promise<boolean>;
  /** Send a test notification */
  sendTestNotification: () => void;
  /** Whether a permission request is in progress */
  isRequesting: boolean;
}

/**
 * Hook for managing browser notification permissions using the Web Notifications API.
 * Handles permission state, requesting permissions, and sending test notifications.
 */
export function useBrowserNotification(): UseBrowserNotificationReturn {
  const [permissionState, setPermissionState] = useState<BrowserPermissionState>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // Check if notifications are supported and get initial permission state
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const supported = 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermissionState(Notification.permission as BrowserPermissionState);
    } else {
      setPermissionState('unsupported');
    }
  }, []);

  // Listen for permission changes (some browsers support this)
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // Some browsers support permission change events via navigator.permissions
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' as PermissionName }).then((status) => {
        status.onchange = () => {
          setPermissionState(Notification.permission as BrowserPermissionState);
        };
      }).catch(() => {
        // Some browsers don't support querying notification permissions
      });
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    // If already granted, no need to request
    if (Notification.permission === 'granted') {
      setPermissionState('granted');
      return true;
    }

    // If denied, can't request again
    if (Notification.permission === 'denied') {
      setPermissionState('denied');
      return false;
    }

    setIsRequesting(true);

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission as BrowserPermissionState);
      return permission === 'granted';
    } catch (error) {
      logger.error('Error requesting notification permission', { error: error, hook: 'useBrowserNotification' });
      return false;
    } finally {
      setIsRequesting(false);
    }
  }, [isSupported]);

  const sendTestNotification = useCallback(() => {
    if (!isSupported || Notification.permission !== 'granted') {
      return;
    }

    try {
      const notification = new Notification('ContractorOS Test', {
        body: 'Browser notifications are working correctly!',
        icon: '/favicon.ico',
        tag: 'test-notification', // Prevents duplicate notifications
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      // Fallback for browsers that require service worker for notifications
      logger.error('Error sending test notification', { error: error, hook: 'useBrowserNotification' });
    }
  }, [isSupported]);

  return {
    permissionState,
    isSupported,
    requestPermission,
    sendTestNotification,
    isRequesting,
  };
}

/**
 * Helper to get a user-friendly label for the permission state
 */
export function getPermissionLabel(state: BrowserPermissionState): string {
  switch (state) {
    case 'granted':
      return 'Enabled';
    case 'denied':
      return 'Blocked';
    case 'default':
      return 'Not set';
    case 'unsupported':
      return 'Not supported';
    default:
      return 'Unknown';
  }
}

/**
 * Helper to get instructions for enabling notifications based on browser
 */
export function getBrowserInstructions(): string {
  if (typeof window === 'undefined') return '';

  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('chrome')) {
    return 'Click the lock icon in the address bar, then set Notifications to "Allow".';
  } else if (userAgent.includes('firefox')) {
    return 'Click the shield icon in the address bar, then enable notifications.';
  } else if (userAgent.includes('safari')) {
    return 'Go to Safari > Settings > Websites > Notifications and allow this site.';
  } else if (userAgent.includes('edge')) {
    return 'Click the lock icon in the address bar, then set Notifications to "Allow".';
  }

  return 'Check your browser settings to enable notifications for this site.';
}
