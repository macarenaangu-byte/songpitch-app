// Coda-Vault Service Worker
// Handles: PWA caching (offline support) + Web Push Notifications

const CACHE_NAME = 'coda-vault-v1';
const ICON  = '/logo192.png';
const BADGE = '/favicon-32.png';
const APP_ORIGIN = self.location.origin;

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/favicon-32.png',
  '/favicon-16.png',
];

// ── Install: pre-cache key assets ────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old cache versions ────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => clients.claim())
  );
});

// ── Fetch: smart caching strategy ────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle GET requests to our own origin
  // Skip Supabase, Stripe, external APIs etc.
  if (event.request.method !== 'GET' || url.origin !== APP_ORIGIN) return;

  if (event.request.mode === 'navigate') {
    // Navigation requests: try network first, fall back to cached index.html
    // This keeps the SPA working offline
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets: cache first, then network (fast loads)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        // Cache the new asset for next time
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});

// ── Push notification received ────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch (_) {
    data = { title: 'Coda-Vault', body: event.data?.text() || 'You have a new notification' };
  }

  const title   = data.title || 'Coda-Vault';
  const options = {
    body:     data.body    || 'You have a new notification',
    icon:     ICON,
    badge:    BADGE,
    data:     { url: data.url || APP_ORIGIN },
    vibrate:  [200, 100, 200],
    tag:      data.tag     || 'coda-vault',
    renotify: true,
    silent:   false,
    actions:  data.url ? [{ action: 'open', title: 'Open Coda-Vault' }] : [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification clicked ──────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || APP_ORIGIN;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.startsWith(APP_ORIGIN) && 'focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
