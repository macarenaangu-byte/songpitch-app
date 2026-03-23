// SongPitch Service Worker — Web Push Notifications
// Handles incoming push events and notification clicks

const ICON = '/logo192.png';
const BADGE = '/favicon-32.png';
const APP_ORIGIN = self.location.origin;

// ── Push received from server ────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch (_) {
    data = { title: 'SongPitch', body: event.data?.text() || 'You have a new notification' };
  }

  const title   = data.title || 'SongPitch';
  const options = {
    body:      data.body    || 'You have a new notification',
    icon:      ICON,
    badge:     BADGE,
    data:      { url: data.url || APP_ORIGIN },
    vibrate:   [200, 100, 200],
    tag:       data.tag     || 'songpitch',
    renotify:  true,
    silent:    false,
    actions: data.url ? [
      { action: 'open', title: 'Open SongPitch' },
    ] : [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification clicked ─────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || APP_ORIGIN;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If SongPitch tab is already open, focus it
        for (const client of clientList) {
          if (client.url.startsWith(APP_ORIGIN) && 'focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Otherwise open a new tab
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// ── Install & activate (cache-free — we're just a push handler) ──────────────
self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));
