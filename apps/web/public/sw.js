/**
 * ContractorOS Service Worker
 * Provides offline caching, background sync, and push notification support
 *
 * Caching Strategies:
 * - Static assets: Cache-first (fonts, images, CSS, JS)
 * - App shell pages: Network-first with cache fallback
 * - API requests: Network-only (handled by IndexedDB sync)
 * - Images: Cache-first with network update (stale-while-revalidate)
 */

const CACHE_VERSION = 'v3';
const CACHE_NAME = `contractoros-${CACHE_VERSION}`;
const RUNTIME_CACHE = `contractoros-runtime-${CACHE_VERSION}`;

// Core app shell - these are precached on install
const APP_SHELL = [
  '/',
  '/dashboard',
  '/field',
  '/offline.html',
  '/manifest.json',
];

// Patterns for static assets (cache-first)
const STATIC_ASSET_PATTERNS = [
  /\/_next\/static\//,
  /\/fonts\//,
  /\.woff2?$/,
  /\.ttf$/,
  /\.otf$/,
];

// Patterns for cacheable resources
const CACHEABLE_PATTERNS = [
  /\.css$/,
  /\.js$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.svg$/,
  /\.webp$/,
  /\.ico$/,
];

// Patterns to always skip (never cache)
const SKIP_PATTERNS = [
  /\/api\//,
  /firestore\.googleapis\.com/,
  /firebase/,
  /googleapis\.com/,
  /identitytoolkit/,
  /firebaseauth/,
  /firebasestorage/,
  /cloudfunctions/,
  /\.hot-update\./,
  /__webpack_hmr/,
];

/**
 * Install Event
 * Precache the app shell for offline support
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        console.log('[SW] App shell cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache app shell:', error);
        // Still skip waiting even if caching fails
        return self.skipWaiting();
      })
  );
});

/**
 * Activate Event
 * Clean up old caches and claim all clients
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key.startsWith('contractoros-') && key !== CACHE_NAME && key !== RUNTIME_CACHE)
            .map((key) => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      }),
      // Claim all clients immediately
      self.clients.claim(),
    ])
  );
});

/**
 * Fetch Event
 * Handle all fetch requests with appropriate caching strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip requests that should never be cached
  if (SKIP_PATTERNS.some((pattern) => pattern.test(request.url))) {
    return;
  }

  // Skip chrome-extension and other non-http(s) protocols
  if (!request.url.startsWith('http')) {
    return;
  }

  // Determine caching strategy based on request type
  if (isStaticAsset(request.url)) {
    // Static assets: Cache-first
    event.respondWith(cacheFirst(request));
  } else if (isNavigationRequest(request)) {
    // Navigation requests: Network-first with offline fallback
    event.respondWith(networkFirstWithOfflineFallback(request));
  } else if (isCacheableResource(request.url)) {
    // Other cacheable resources: Stale-while-revalidate
    event.respondWith(staleWhileRevalidate(request));
  } else {
    // Everything else: Network-first
    event.respondWith(networkFirst(request));
  }
});

/**
 * Check if URL is a static asset
 */
function isStaticAsset(url) {
  return STATIC_ASSET_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Check if URL is a cacheable resource
 */
function isCacheableResource(url) {
  return CACHEABLE_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Check if request is a navigation request
 */
function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
         (request.headers.get('accept') || '').includes('text/html');
}

/**
 * Cache-first strategy
 * Try cache first, fall back to network
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first network fetch failed:', error);
    return new Response('Resource not available offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Network-first strategy
 * Try network first, fall back to cache
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response('Resource not available offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Network-first with offline fallback for navigation
 * Try network, fall back to cache, then offline page
 */
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Try to serve from cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Try to serve the dashboard for app routes
    const url = new URL(request.url);
    if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/field')) {
      const dashboardResponse = await caches.match('/dashboard');
      if (dashboardResponse) {
        return dashboardResponse;
      }
    }

    // Final fallback: offline page
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }

    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Stale-while-revalidate strategy
 * Return cached version immediately, update cache in background
 */
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);

  // Start network fetch in background
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        const cache = caches.open(RUNTIME_CACHE);
        cache.then((c) => c.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => null);

  // Return cached response if available, otherwise wait for network
  return cachedResponse || networkPromise || new Response('Resource not available', {
    status: 503,
    statusText: 'Service Unavailable',
  });
}

/**
 * Background Sync Event
 * Process queued operations when back online
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event received:', event.tag);

  if (event.tag === 'sync-pending-data') {
    event.waitUntil(triggerClientSync());
  }
});

/**
 * Trigger sync in all active clients
 */
async function triggerClientSync() {
  console.log('[SW] Triggering client sync...');

  const clients = await self.clients.matchAll({ type: 'window' });

  // Notify all clients to start syncing
  clients.forEach((client) => {
    client.postMessage({
      type: 'SYNC_REQUESTED',
      timestamp: Date.now(),
    });
  });
}

/**
 * Message Event
 * Handle messages from the app
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      console.log('[SW] Skip waiting requested');
      self.skipWaiting();
      break;

    case 'CACHE_URLS':
      // Cache specific URLs on demand
      if (payload?.urls?.length) {
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.addAll(payload.urls).catch((err) => {
            console.warn('[SW] Failed to cache URLs:', err);
          });
        });
      }
      break;

    case 'CLEAR_CACHE':
      // Clear all runtime caches
      caches.delete(RUNTIME_CACHE).then(() => {
        console.log('[SW] Runtime cache cleared');
      });
      break;

    case 'GET_CACHE_SIZE':
      // Report cache size back to client
      getCacheSize().then((size) => {
        event.source?.postMessage({
          type: 'CACHE_SIZE',
          payload: { size },
        });
      });
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

/**
 * Get total cache size in bytes
 */
async function getCacheSize() {
  let totalSize = 0;

  const cacheNames = await caches.keys();

  for (const name of cacheNames) {
    if (name.startsWith('contractoros-')) {
      const cache = await caches.open(name);
      const keys = await cache.keys();

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }
  }

  return totalSize;
}

/**
 * Push Notification Event
 * Display push notifications
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'ContractorOS', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/dashboard/notifications',
      timestamp: Date.now(),
    },
    actions: data.actions || [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    tag: data.tag || 'contractoros-notification',
    renotify: !!data.renotify,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'ContractorOS', options)
  );
});

/**
 * Notification Click Event
 * Handle notification interactions
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Try to focus an existing window
        for (const client of clients) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }

        // Find any ContractorOS window
        for (const client of clients) {
          if (client.url.includes('contractoros') && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }

        // Open new window
        return self.clients.openWindow(url);
      })
  );
});

/**
 * Notification Close Event
 * Track when notifications are dismissed
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
});

console.log('[SW] Service worker loaded');
