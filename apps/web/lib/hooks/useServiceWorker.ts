"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { logger } from '@/lib/utils/logger';

/**
 * Notification payload interface for OS-level notifications
 */
export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    type?: string;
    [key: string]: unknown;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  image?: string;
  requireInteraction?: boolean;
  renotify?: boolean;
  silent?: boolean;
}

/**
 * Service worker registration status
 */
export interface ServiceWorkerStatus {
  isRegistered: boolean;
  isActive: boolean;
  isWaiting: boolean;
  scope: string | null;
  scriptUrl: string | null;
  state: ServiceWorkerState | null;
}

/**
 * Main service worker hook return type
 */
export interface UseServiceWorkerReturn {
  // PWA Support
  isSupported: boolean;
  isInstalled: boolean;
  isUpdateAvailable: boolean;
  canInstall: boolean;
  promptInstall: () => Promise<boolean>;
  applyUpdate: () => void;

  // Service Worker Status
  registration: ServiceWorkerRegistration | null;
  notificationSwStatus: ServiceWorkerStatus;
  mainSwStatus: ServiceWorkerStatus;

  // Notification Methods
  sendNotification: (payload: NotificationPayload) => Promise<boolean>;
  clearNotifications: (tag?: string) => void;
  getNotificationPermission: () => NotificationPermission | 'unsupported';
  requestNotificationPermission: () => Promise<boolean>;
}

/**
 * Hook for managing service workers and OS-level notifications
 *
 * Provides:
 * - PWA installation prompts and updates
 * - Service worker registration status
 * - Methods to send OS-level notifications via service worker
 * - Notification permission management
 */
export function useServiceWorker(): UseServiceWorkerReturn {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [notificationSwReg, setNotificationSwReg] = useState<ServiceWorkerRegistration | null>(null);

  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);

  // Build status object from registration
  const getSwStatus = useCallback((reg: ServiceWorkerRegistration | null): ServiceWorkerStatus => {
    if (!reg) {
      return {
        isRegistered: false,
        isActive: false,
        isWaiting: false,
        scope: null,
        scriptUrl: null,
        state: null,
      };
    }

    const activeWorker = reg.active;
    const waitingWorker = reg.waiting;

    return {
      isRegistered: true,
      isActive: !!activeWorker,
      isWaiting: !!waitingWorker,
      scope: reg.scope,
      scriptUrl: activeWorker?.scriptURL || null,
      state: activeWorker?.state || null,
    };
  }, []);

  // Check if service workers are supported
  const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator;

  // Get notification permission status
  const getNotificationPermission = useCallback((): NotificationPermission | 'unsupported' => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      return result === 'granted';
    } catch (error) {
      logger.error('[useServiceWorker] Error requesting notification permission', { error: error, hook: 'useServiceWorker' });
      return false;
    }
  }, []);

  // Send notification via service worker
  const sendNotification = useCallback(async (payload: NotificationPayload): Promise<boolean> => {
    // Check permission first
    const permission = getNotificationPermission();
    if (permission !== 'granted') {
      logger.warn('[useServiceWorker] Notification permission not granted', { hook: 'useServiceWorker' });
      return false;
    }

    // Prefer notification service worker, fall back to main
    const swReg = notificationSwReg || registration;

    if (!swReg?.active) {
      logger.warn('[useServiceWorker] No active service worker for notifications', { hook: 'useServiceWorker' });

      // Fall back to direct Notification API if service worker unavailable
      try {
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icons/icon-192x192.png',
          badge: payload.badge,
          tag: payload.tag,
          data: payload.data,
          requireInteraction: payload.requireInteraction,
          silent: payload.silent,
        });
        return true;
      } catch (error) {
        logger.error('[useServiceWorker] Direct notification failed', { error: error, hook: 'useServiceWorker' });
        return false;
      }
    }

    // Send message to service worker to show notification
    try {
      swReg.active.postMessage({
        type: 'SHOW_NOTIFICATION',
        payload,
      });
      return true;
    } catch (error) {
      logger.error('[useServiceWorker] Failed to send notification via SW', { error: error, hook: 'useServiceWorker' });
      return false;
    }
  }, [notificationSwReg, registration, getNotificationPermission]);

  // Clear notifications by tag
  const clearNotifications = useCallback((tag?: string): void => {
    const swReg = notificationSwReg || registration;

    if (swReg?.active) {
      swReg.active.postMessage({
        type: 'CLEAR_NOTIFICATIONS',
        payload: { tag },
      });
    }
  }, [notificationSwReg, registration]);

  // Prompt for PWA install
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) return false;

    const prompt = installPrompt as BeforeInstallPromptEvent;
    prompt.prompt();

    const result = await prompt.userChoice;
    setInstallPrompt(null);

    return result.outcome === 'accepted';
  }, [installPrompt]);

  // Apply pending update
  const applyUpdate = useCallback((): void => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  // Initialize service workers
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Check if app is installed as PWA
    const mqStandalone = window.matchMedia('(display-mode: standalone)');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- event listener callback is an async handler
    setIsInstalled(mqStandalone.matches);

    const handleDisplayModeChange = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mqStandalone.addEventListener('change', handleDisplayModeChange);

    // Capture install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Set up message handler for service worker messages
    messageHandlerRef.current = (event: MessageEvent) => {
      const { type, payload } = event.data || {};

      switch (type) {
        case 'NOTIFICATION_CLICKED':
          logger.debug('[useServiceWorker] Notification clicked', { data: payload, hook: 'useServiceWorker' });
          // Could dispatch an event or call a callback here
          break;
        case 'NOTIFICATION_SHOWN':
          logger.debug('[useServiceWorker] Notification shown', { data: payload, hook: 'useServiceWorker' });
          break;
        case 'NOTIFICATION_DISMISSED':
          logger.debug('[useServiceWorker] Notification dismissed', { data: payload, hook: 'useServiceWorker' });
          break;
        default:
          break;
      }
    };

    navigator.serviceWorker.addEventListener('message', messageHandlerRef.current);

    // Register main service worker
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        setRegistration(reg);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setIsUpdateAvailable(true);
              }
            });
          }
        });
      })
      .catch((err) => {
        logger.warn('[useServiceWorker] Main SW registration failed', { error: err, hook: 'useServiceWorker' });
      });

    // Register notification service worker
    navigator.serviceWorker
      .register('/sw-notifications.js')
      .then((reg) => {
        setNotificationSwReg(reg);
        logger.debug('[useServiceWorker] Notification SW registered', { data: reg.scope, hook: 'useServiceWorker' });
      })
      .catch((err) => {
        logger.warn('[useServiceWorker] Notification SW registration failed', { error: err, hook: 'useServiceWorker' });
      });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      mqStandalone.removeEventListener('change', handleDisplayModeChange);

      if (messageHandlerRef.current) {
        navigator.serviceWorker.removeEventListener('message', messageHandlerRef.current);
      }
    };
  }, []);

  return {
    // PWA Support
    isSupported,
    isInstalled,
    isUpdateAvailable,
    canInstall: !!installPrompt,
    promptInstall,
    applyUpdate,

    // Service Worker Status
    registration,
    notificationSwStatus: getSwStatus(notificationSwReg),
    mainSwStatus: getSwStatus(registration),

    // Notification Methods
    sendNotification,
    clearNotifications,
    getNotificationPermission,
    requestNotificationPermission,
  };
}

/**
 * BeforeInstallPromptEvent interface for TypeScript
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default useServiceWorker;
