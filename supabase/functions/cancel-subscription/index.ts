// Supabase Edge Function: cancel-subscription
// Sets cancel_at_period_end = true on the user's active Stripe subscription.
// The tier stays active until the period ends, then customer.subscription.deleted
// fires and the webhook downgrades the user to free.
//
// Deploy: supabase functions deploy cancel-subscription

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const token = authHeader.replace('Bearer ', '');

    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error: authError } = await adminSupabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    // ── Get profile ───────────────────────────────────────────────────────────
    const { data: profile } = await adminSupabase
      .from('user_profiles')
      .select('stripe_subscription_id, subscription_tier, subscription_status')
      .eq('user_id', user.id)
      .single();

    if (!profile?.stripe_subscription_id) {
      return new Response(
        JSON.stringify({ error: 'No active subscription found' }),
        { status: 400, headers: corsHeaders },
      );
    }

    if (profile.subscription_status === 'canceling') {
      return new Response(
        JSON.stringify({ error: 'Subscription is already scheduled for cancellation' }),
        { status: 400, headers: corsHeaders },
      );
    }

    // ── Determine when to cancel ──────────────────────────────────────────────
    // If the subscription has an active promotional discount (e.g. 6-month free promo),
    // cancel at the end of the promo period so the user keeps access for the full
    // promotional duration they were promised. Otherwise cancel at period end.
    const existingSub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);

    let cancelAt: number | undefined;
    const discountEnd = existingSub.discount?.end; // Unix timestamp when repeating coupon expires
    if (discountEnd && discountEnd > Math.floor(Date.now() / 1000)) {
      // Promo is still active — cancel at the promo end date
      cancelAt = discountEnd;
    }

    const subscription = await stripe.subscriptions.update(
      profile.stripe_subscription_id,
      cancelAt
        ? { cancel_at: cancelAt }
        : { cancel_at_period_end: true },
    );

    // Mark as "canceling" in our DB so the UI can reflect it
    await adminSupabase
      .from('user_profiles')
      .update({ subscription_status: 'canceling' })
      .eq('user_id', user.id);

    const cancelAtIso = subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000).toISOString()
      : null;

    console.log(`[cancel-subscription] Scheduled cancellation for user=${user.id} at ${cancelAtIso}`);

    return new Response(
      JSON.stringify({ success: true, cancel_at: cancelAtIso }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (err) {
    console.error('[cancel-subscription] Error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: corsHeaders },
    );
  }
});
