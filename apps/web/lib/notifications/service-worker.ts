/**
 * Service Worker Registration & Management
 *
 * Handles registering the service worker for push notifications.
 */

'use client';

import { logger } from '@/lib/utils/logger';

// ============================================
// Types
// ============================================

export interface ServiceWorkerStatus {
  supported: boolean;
  registered: boolean;
  ready: boolean;
  pushSupported: boolean;
  subscription: PushSubscription | null;
}

// ============================================
// Registration
// ============================================

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Check if service workers are supported
 */
export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return isServiceWorkerSupported() && 'PushManager' in window;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    logger.warn('Service workers are not supported', { component: 'notifications-service-worker' });
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    swRegistration = registration;

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {

          }
        });
      }
    });

    return registration;
  } catch (error) {
    logger.error('Service Worker registration failed', { error: error, component: 'notifications-service-worker' });
    return null;
  }
}

/**
 * Get the current service worker registration
 */
export async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (swRegistration) return swRegistration;

  if (!isServiceWorkerSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    swRegistration = registration;
    return registration;
  } catch {
    return null;
  }
}

/**
 * Unregister the service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const result = await registration.unregister();
    if (result) {
      swRegistration = null;
    }
    return result;
  } catch (error) {
    logger.error('Failed to unregister service worker', { error: error, component: 'notifications-service-worker' });
    return false;
  }
}

// ============================================
// Push Subscription
// ============================================

/**
 * Get the VAPID public key from environment
 */
function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
}

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    logger.warn('Push notifications are not supported', { component: 'notifications-service-worker' });
    return null;
  }

  const vapidKey = getVapidPublicKey();
  if (!vapidKey) {
    logger.warn('VAPID public key not configured - push notifications disabled', { component: 'notifications-service-worker' });
    return null;
  }

  try {
    const registration = await getRegistration();
    if (!registration) {
      logger.error('No service worker registration', { component: 'notifications-service-worker' });
      return null;
    }

    let subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      return subscription;
    }

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    });

    return subscription;
  } catch (error) {
    logger.error('Failed to subscribe to push', { error: error, component: 'notifications-service-worker' });
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await getRegistration();
    if (!registration) return false;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;

    return await subscription.unsubscribe();
  } catch (error) {
    logger.error('Failed to unsubscribe from push', { error: error, component: 'notifications-service-worker' });
    return false;
  }
}

/**
 * Get current push subscription
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    const registration = await getRegistration();
    if (!registration) return null;

    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

// ============================================
// Service Worker Status
// ============================================

/**
 * Get complete service worker status
 */
export async function getServiceWorkerStatus(): Promise<ServiceWorkerStatus> {
  const supported = isServiceWorkerSupported();
  const pushSupported = isPushSupported();

  if (!supported) {
    return {
      supported: false,
      registered: false,
      ready: false,
      pushSupported: false,
      subscription: null,
    };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = pushSupported && registration
      ? await registration.pushManager.getSubscription()
      : null;

    return {
      supported: true,
      registered: !!registration,
      ready: !!navigator.serviceWorker.controller,
      pushSupported,
      subscription,
    };
  } catch {
    return {
      supported: true,
      registered: false,
      ready: false,
      pushSupported,
      subscription: null,
    };
  }
}

// ============================================
// Communication with Service Worker
// ============================================

/**
 * Send a message to the service worker
 */
export function postMessage(message: { type: string; payload?: unknown }): void {
  if (!navigator.serviceWorker.controller) {
    logger.warn('No active service worker', { component: 'notifications-service-worker' });
    return;
  }

  navigator.serviceWorker.controller.postMessage(message);
}

/**
 * Show a notification via the service worker
 */
export async function showPushNotification(
  title: string,
  options?: NotificationOptions & { url?: string; type?: string }
): Promise<void> {
  const registration = await getRegistration();
  if (!registration) {
    logger.warn('No service worker registration', { component: 'notifications-service-worker' });
    return;
  }

  await registration.showNotification(title, {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    ...options,
    data: {
      url: options?.url || '/',
      type: options?.type || 'system',
      ...options?.data,
    },
  });
}

/**
 * Listen for messages from service worker
 */
export function onServiceWorkerMessage(
  callback: (data: { type: string; url?: string; notificationType?: string }) => void
): () => void {
  if (!isServiceWorkerSupported()) {
    return () => {};
  }

  const handler = (event: MessageEvent) => {
    callback(event.data);
  };

  navigator.serviceWorker.addEventListener('message', handler);

  return () => {
    navigator.serviceWorker.removeEventListener('message', handler);
  };
}
