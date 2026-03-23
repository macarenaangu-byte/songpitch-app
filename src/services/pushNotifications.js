// pushNotifications.js
// Manages Web Push subscription lifecycle for SongPitch

// ── VAPID public key (matches the private key stored in Supabase Edge Function) ─
const VAPID_PUBLIC_KEY = 'BFUO-mbO1SL68OYiKeZqCdYgbUU55S1GoRGdc-skFf4Pawj_W5YVDyQpJx12QqMNqHxu40Oy8DR8wc3-_Z9AThU';

// Convert VAPID key from base64url → Uint8Array (required by PushManager)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const arr     = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr;
}

/** Returns true if this browser supports Web Push */
export function isPushSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager'   in window    &&
    'Notification'  in window
  );
}

/** Register /sw.js and return the ServiceWorkerRegistration */
export async function registerServiceWorker() {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch (err) {
    console.warn('[Push] Service worker registration failed:', err);
    return null;
  }
}

/** Ask the user for notification permission. Returns 'granted' | 'denied' | 'default' */
export async function requestPermission() {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  return await Notification.requestPermission();
}

/**
 * Subscribe this device to push and store the subscription in Supabase.
 * Call this after the user has granted permission.
 */
export async function subscribeAndSave(supabase, userId) {
  if (!isPushSupported()) return null;

  try {
    const reg = await navigator.serviceWorker.ready;

    // Re-use existing subscription if already subscribed on this device
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // Persist to Supabase so the Edge Function can send pushes to this device
    const sub = subscription.toJSON();
    await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id:    userId,
          endpoint:   sub.endpoint,
          p256dh:     sub.keys.p256dh,
          auth:       sub.keys.auth,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      );

    return subscription;
  } catch (err) {
    console.warn('[Push] Subscription failed:', err);
    return null;
  }
}

/**
 * Unsubscribe this device and remove from Supabase.
 * Call on logout.
 */
export async function unsubscribeAndRemove(supabase) {
  if (!isPushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;

    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  } catch (err) {
    console.warn('[Push] Unsubscribe failed:', err);
  }
}
