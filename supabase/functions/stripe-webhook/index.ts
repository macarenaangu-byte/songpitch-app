// Supabase Edge Function: stripe-webhook
// Receives Stripe events and keeps subscription_tier in sync with payments.
//
// Deploy: supabase functions deploy stripe-webhook
// Secrets: supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
//
// In Stripe Dashboard → Webhooks → Add endpoint:
//   URL: https://pmdxbyuknfwqjzrmfrwc.supabase.co/functions/v1/stripe-webhook
//   Events: customer.subscription.created, customer.subscription.updated,
//            customer.subscription.deleted, checkout.session.completed

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Map Stripe Price IDs → SongPitch subscription tiers
// Covers all 4 products (composer + executive, basic + pro)
const PRICE_TO_TIER: Record<string, 'basic' | 'pro'> = {
  [Deno.env.get('STRIPE_PRICE_COMPOSER_BASIC') ?? '']: 'basic',
  [Deno.env.get('STRIPE_PRICE_COMPOSER_PRO')   ?? '']: 'pro',
  [Deno.env.get('STRIPE_PRICE_EXEC_BASIC')     ?? '']: 'basic',
  [Deno.env.get('STRIPE_PRICE_EXEC_PRO')       ?? '']: 'pro',
};

async function setTier(stripeCustomerId: string, tier: 'free' | 'basic' | 'pro', subscriptionId?: string, endsAt?: Date) {
  await supabase
    .from('user_profiles')
    .update({
      subscription_tier:      tier,
      stripe_subscription_id: subscriptionId ?? null,
      subscription_status:    tier === 'free' ? 'canceled' : 'active',
      subscription_ends_at:   endsAt?.toISOString() ?? null,
    })
    .eq('stripe_customer_id', stripeCustomerId);
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body      = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
    );
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err);
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  console.log(`[stripe-webhook] Event: ${event.type}`);

  switch (event.type) {

    // ── New checkout session completed (first purchase) ────────────────────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== 'subscription') break;

      const customerId = session.customer as string;
      const customerEmail = session.customer_details?.email;

      // Link Stripe customer to SongPitch profile
      if (customerEmail) {
        await supabase
          .from('user_profiles')
          .update({ stripe_customer_id: customerId })
          .eq('user_id', (
            await supabase.auth.admin.getUserByEmail(customerEmail)
          ).data.user?.id ?? '');
      }
      break;
    }

    // ── Subscription created or renewed ────────────────────────────────────
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price?.id ?? '';
      const tier = PRICE_TO_TIER[priceId] ?? 'free';
      const endsAt = new Date(sub.current_period_end * 1000);

      await setTier(sub.customer as string, tier, sub.id, endsAt);
      console.log(`[stripe-webhook] Set tier=${tier} for customer=${sub.customer}`);
      break;
    }

    // ── Subscription canceled / expired ────────────────────────────────────
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await setTier(sub.customer as string, 'free');
      console.log(`[stripe-webhook] Downgraded to free for customer=${sub.customer}`);
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
