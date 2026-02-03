/**
 * ContractorOS Notification Service Worker
 *
 * Handles OS-level push notifications that appear in the Windows/Mac notification center.
 * This service worker enables persistent notifications even when the browser tab is closed.
 *
 * Features:
 * - Push notification handling
 * - OS notification center integration
 * - Notification click actions (focus/open app)
 * - Notification grouping with tags
 * - Action buttons support
 */

const SW_VERSION = '1.0.0';
const DEFAULT_ICON = '/icons/icon-192x192.png';
const DEFAULT_BADGE = '/icons/badge-72x72.png';

/**
 * Install Event
 * Activate immediately to ensure notifications work right away
 */
self.addEventListener('install', (event) => {
  console.log('[SW-Notifications] Installing notification service worker v' + SW_VERSION);
  // Skip waiting to activate immediately
  event.waitUntil(self.skipWaiting());
});

/**
 * Activate Event
 * Claim all clients to start handling notifications immediately
 */
self.addEventListener('activate', (event) => {
  console.log('[SW-Notifications] Activating notification service worker');
  event.waitUntil(self.clients.claim());
});

/**
 * Push Event
 * Handle incoming push notifications and display them in the OS notification center
 */
self.addEventListener('push', (event) => {
  console.log('[SW-Notifications] Push event received');

  if (!event.data) {
    console.warn('[SW-Notifications] Push event has no data');
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    // Fallback for plain text push
    payload = {
      title: 'ContractorOS',
      body: event.data.text(),
    };
  }

  // Build notification options for OS display
  const options = buildNotificationOptions(payload);

  event.waitUntil(
    self.registration.showNotification(payload.title || 'ContractorOS', options)
      .then(() => {
        console.log('[SW-Notifications] Notification displayed:', payload.title);
        // Notify all clients that a notification was shown
        return notifyClients('NOTIFICATION_SHOWN', payload);
      })
      .catch((error) => {
        console.error('[SW-Notifications] Failed to show notification:', error);
      })
  );
});

/**
 * Build notification options from payload
 * @param {Object} payload - The notification payload
 * @returns {NotificationOptions} Options for showNotification
 */
function buildNotificationOptions(payload) {
  return {
    body: payload.body || '',
    icon: payload.icon || DEFAULT_ICON,
    badge: payload.badge || DEFAULT_BADGE,
    tag: payload.tag || `contractoros-${Date.now()}`,
    data: {
      url: payload.data?.url || '/dashboard/notifications',
      type: payload.data?.type || 'default',
      timestamp: Date.now(),
      ...payload.data,
    },
    // Vibration pattern: buzz, pause, buzz
    vibrate: [200, 100, 200],
    // Keep notification until user interacts
    requireInteraction: payload.requireInteraction || false,
    // Renotify even if same tag exists
    renotify: payload.renotify || false,
    // Silent mode if specified
    silent: payload.silent || false,
    // Actions (max 2 on most platforms)
    actions: payload.actions || [
      { action: 'open', title: 'Open', icon: '/icons/open.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/close.png' },
    ],
    // Image for expanded notification (optional)
    image: payload.image,
  };
}

/**
 * Notification Click Event
 * Handle when user clicks on the notification or an action button
 */
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  console.log('[SW-Notifications] Notification clicked:', {
    action,
    tag: notification.tag,
    url: data.url,
  });

  // Always close the notification
  notification.close();

  // Handle dismiss action
  if (action === 'dismiss') {
    // Just close, don't navigate
    return;
  }

  // Get the URL to open
  const targetUrl = data.url || '/dashboard';

  event.waitUntil(
    handleNotificationClick(targetUrl, data)
  );
});

/**
 * Handle the navigation logic for notification clicks
 * @param {string} targetUrl - URL to navigate to
 * @param {Object} data - Additional notification data
 */
async function handleNotificationClick(targetUrl, data) {
  // Get all window clients
  const windowClients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  // Try to find an existing ContractorOS window
  for (const client of windowClients) {
    const clientUrl = new URL(client.url);

    // Check if this is a ContractorOS window
    if (clientUrl.pathname.startsWith('/dashboard') ||
        clientUrl.pathname.startsWith('/field') ||
        clientUrl.pathname.startsWith('/client') ||
        clientUrl.pathname.startsWith('/sub')) {

      // Found an existing window - navigate and focus it
      await client.navigate(targetUrl);
      await client.focus();

      // Notify the client about the notification click
      client.postMessage({
        type: 'NOTIFICATION_CLICKED',
        payload: { url: targetUrl, data },
      });

      return;
    }
  }

  // No existing window found - open a new one
  const newClient = await self.clients.openWindow(targetUrl);

  if (newClient) {
    // Wait a bit for the page to load, then notify
    setTimeout(() => {
      newClient.postMessage({
        type: 'NOTIFICATION_CLICKED',
        payload: { url: targetUrl, data },
      });
    }, 1000);
  }
}

/**
 * Notification Close Event
 * Track when notifications are dismissed by the user
 */
self.addEventListener('notificationclose', (event) => {
  const notification = event.notification;

  console.log('[SW-Notifications] Notification closed:', notification.tag);

  // Notify clients that notification was dismissed
  notifyClients('NOTIFICATION_DISMISSED', {
    tag: notification.tag,
    type: notification.data?.type,
  });
});

/**
 * Message Event
 * Handle messages from the main app
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  console.log('[SW-Notifications] Message received:', type);

  switch (type) {
    case 'SHOW_NOTIFICATION':
      // Allow the app to trigger notifications directly
      if (payload) {
        const options = buildNotificationOptions(payload);
        self.registration.showNotification(payload.title || 'ContractorOS', options);
      }
      break;

    case 'GET_NOTIFICATION_STATUS':
      // Return current notification status
      event.source?.postMessage({
        type: 'NOTIFICATION_STATUS',
        payload: {
          version: SW_VERSION,
          active: true,
          scope: self.registration.scope,
        },
      });
      break;

    case 'CLEAR_NOTIFICATIONS':
      // Clear all notifications by tag pattern
      self.registration.getNotifications({
        tag: payload?.tag,
      }).then((notifications) => {
        notifications.forEach((n) => n.close());
        console.log('[SW-Notifications] Cleared notifications:', notifications.length);
      });
      break;

    default:
      console.log('[SW-Notifications] Unknown message type:', type);
  }
});

/**
 * Notify all clients of an event
 * @param {string} type - Event type
 * @param {Object} payload - Event data
 */
async function notifyClients(type, payload) {
  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  clients.forEach((client) => {
    client.postMessage({ type, payload });
  });
}

console.log('[SW-Notifications] Service worker loaded v' + SW_VERSION);
