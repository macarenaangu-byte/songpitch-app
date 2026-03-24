// Supabase Edge Function: send-push
// Called by a Database Webhook when a row is inserted into `notifications`.
// Looks up all push subscriptions for that user and sends a Web Push message.
//
// Deploy: supabase functions deploy send-push
// Secrets: supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:hello@songpitch.com

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-ignore — web-push works in Deno via esm.sh
import webpush from 'https://esm.sh/web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Parse incoming webhook payload ────────────────────────────────────────
    const body = await req.json();

    // Supabase Database Webhook sends: { type, table, record, old_record, schema }
    const notification = body?.record ?? body;

    const userId = notification?.user_id;
    const title  = notification?.title  ?? 'SongPitch';
    const message = notification?.message ?? notification?.body ?? '';
    const notifType = notification?.type ?? '';

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400, headers: corsHeaders });
    }

    // ── Set up VAPID ──────────────────────────────────────────────────────────
    webpush.setVapidDetails(
      Deno.env.get('VAPID_SUBJECT')    ?? 'mailto:hello@songpitch.com',
      Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
      Deno.env.get('VAPID_PRIVATE_KEY') ?? '',
    );

    // ── Admin Supabase client ─────────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // ── Fetch all push subscriptions for this user ────────────────────────────
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId);

    if (error || !subs?.length) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: corsHeaders });
    }

    // ── Build notification URL based on type ──────────────────────────────────
    const APP_URL = Deno.env.get('APP_URL') ?? 'https://songpitch.app';
    const urlMap: Record<string, string> = {
      new_message:     `${APP_URL}/messages`,
      opportunity:     `${APP_URL}/opportunities`,
      response:        `${APP_URL}/opportunities`,
      verification:    `${APP_URL}/portfolio`,
    };
    const url = urlMap[notifType] ?? APP_URL;

    // ── Send push to all subscribed devices ───────────────────────────────────
    const payload = JSON.stringify({ title, body: message, url, tag: notifType || 'songpitch' });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
          { TTL: 60 * 60 * 24 } // 24 hour TTL
        )
      )
    );

    // Clean up expired subscriptions (410 Gone)
    const expiredEndpoints: string[] = [];
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        const statusCode = (result.reason as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          expiredEndpoints.push(subs[i].endpoint);
        }
      }
    });

    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints);
    }

    const sent = results.filter(r => r.status === 'fulfilled').length;
    return new Response(JSON.stringify({ sent, total: subs.length }), { headers: corsHeaders });

  } catch (err) {
    console.error('[send-push] Error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
