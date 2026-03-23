/* ===== QR FIRELY - service-worker.js ===== */

'use strict';

/* ===== CACHE CONFIG ===== */
const CACHE_NAME    = 'qrfirely-v1';
const OFFLINE_URL   = './index.html';

const PRECACHE_URLS = [
  './index.html',
  './style.css',
  './app.js',
  './icon.svg',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/qr-code-styling@1.6.0-rc.1/lib/qr-code-styling.js',
];

/* ===== INSTALL ===== */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch((err) => console.error('[SW] Pre-cache failed:', err))
  );
});

/* ===== ACTIVATE ===== */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      ))
      .then(() => self.clients.claim())
  );
});

/* ===== FETCH STRATEGY ===== */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.origin === 'https://cdn.jsdelivr.net') {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.origin === location.origin) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }
});

/* ===== CACHE FIRST (CDN assets) ===== */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    console.warn('[SW] Cache first fetch failed:', err);
    return new Response('Network error', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/* ===== NETWORK FIRST WITH FALLBACK (local assets) ===== */
async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    if (request.mode === 'navigate') {
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
    }

    return new Response('Offline - content not available', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/* ===== MESSAGE HANDLER ===== */
self.addEventListener('message', (event) => {
  if (!event.data) return;

  switch (event.data.type) {

    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;

    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME).then(() => {
        if (event.ports[0]) {
          event.ports[0].postMessage({ cleared: true });
        }
      });
      break;

    default:
      break;
  }
});

/* ===== BACKGROUND SYNC (future use) ===== */
self.addEventListener('sync', (event) => {
  if (event.tag === 'qrfirely-sync') {
    event.waitUntil(Promise.resolve());
  }
});

/* ===== PUSH NOTIFICATIONS (future use) ===== */
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || 'QR Firely', {
    body: data.body || '',
    icon: './icon.svg',
    badge: './icon.svg',
  });
});

/* ===== NOTIFICATION CLICK ===== */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('index.html') && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('./index.html');
        }
      })
  );
});
