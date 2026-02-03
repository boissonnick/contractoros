/**
 * Notification System Exports
 */

// Types
export * from './types';

// Firestore notification service
export * from './service';

// Browser notifications
export {
  isNotificationSupported,
  getNotificationPermissionStatus,
  requestNotificationPermission,
  showBrowserNotification,
  showTypedNotification,
  hasAskedForPermission,
  markPermissionAsked,
  requestPermissionIfNeeded,
  isWithinQuietHours,
  shouldSuppressNotification,
  getNotificationPreferences,
  saveNotificationPreferences,
  getDefaultPreferences,
  updateNotificationPreference,
  toggleNotificationType,
  type BrowserNotificationOptions,
  type AppNotificationType,
  type QuietHoursSettings,
  type NotificationPreferences,
} from './browser-notifications';

// Service Worker & Push
export {
  isServiceWorkerSupported,
  isPushSupported,
  registerServiceWorker,
  getRegistration,
  unregisterServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscription,
  getServiceWorkerStatus,
  postMessage,
  showPushNotification,
  onServiceWorkerMessage,
  type ServiceWorkerStatus,
} from './service-worker';
