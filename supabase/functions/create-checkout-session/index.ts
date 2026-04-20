// Supabase Edge Function: create-checkout-session
// Called from SongPitch frontend when a user clicks an upgrade button.
// Creates a Stripe Checkout Session and returns the URL to redirect to.
//
// Deploy: npx supabase functions deploy create-checkout-session

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

// Price IDs per account type + tier
const PRICES: Record<string, Record<string, string>> = {
  composer: {
    basic: Deno.env.get('STRIPE_PRICE_COMPOSER_BASIC') ?? '',
    pro:   Deno.env.get('STRIPE_PRICE_COMPOSER_PRO')   ?? '',
  },
  music_executive: {
    basic: Deno.env.get('STRIPE_PRICE_EXEC_BASIC') ?? '',
    pro:   Deno.env.get('STRIPE_PRICE_EXEC_PRO')   ?? '',
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Authenticate user ────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const token = authHeader.replace('Bearer ', '');

    // Use service-role client to verify the token — most reliable pattern
    const adminAuthClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: { user }, error: authError } = await adminAuthClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    // ── Parse request ────────────────────────────────────────────────────────
    const { tier, coupon_code, success_url, cancel_url } = await req.json();

    if (!tier || !['basic', 'pro'].includes(tier)) {
      return new Response(JSON.stringify({ error: 'Invalid tier' }), { status: 400, headers: corsHeaders });
    }

    // ── Get user profile (account_type + existing stripe_customer_id) ────────
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: profile } = await adminSupabase
      .from('user_profiles')
      .select('id, account_type, stripe_customer_id, subscription_tier')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404, headers: corsHeaders });
    }

    // Block admin from checking out
    if (profile.subscription_tier === 'admin') {
      return new Response(JSON.stringify({ error: 'Admin accounts have unlimited access' }), { status: 400, headers: corsHeaders });
    }

    const accountType = profile.account_type as 'composer' | 'music_executive';
    const priceId = PRICES[accountType]?.[tier];

    if (!priceId) {
      return new Response(JSON.stringify({ error: 'Price not found for this account type' }), { status: 400, headers: corsHeaders });
    }

    // ── Get or create Stripe customer ────────────────────────────────────────
    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id:    user.id,
          supabase_profile_id: profile.id,
          account_type:        accountType,
        },
      });
      customerId = customer.id;

      // Save customer ID immediately
      await adminSupabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', profile.id);
    }

    // ── Build checkout session params ────────────────────────────────────────
    // Build base session params — do NOT include allow_promotion_codes yet
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer:             customerId,
      mode:                 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price:    priceId,
        quantity: 1,
      }],
      subscription_data: {
        metadata: {
          supabase_profile_id: profile.id,
          account_type:        accountType,
        },
      },
      success_url: success_url ?? `${Deno.env.get('APP_URL') ?? 'https://www.songpitchhub.com'}?upgrade=success`,
      cancel_url:  cancel_url  ?? `${Deno.env.get('APP_URL') ?? 'https://www.songpitchhub.com'}?upgrade=canceled`,
    };

    // Apply promotion code if provided (e.g. FOUNDER2026)
    // Stripe forbids having BOTH discounts and allow_promotion_codes in the same session,
    // even if allow_promotion_codes is false — so we only add whichever one applies.
    if (coupon_code) {
      const promoCodes = await stripe.promotionCodes.list({ code: coupon_code, limit: 1, active: true });
      if (promoCodes.data.length > 0) {
        sessionParams.discounts = [{ promotion_code: promoCodes.data[0].id }];
        // allow_promotion_codes intentionally omitted — Stripe rejects both together
      } else {
        sessionParams.allow_promotion_codes = true;
      }
    } else {
      sessionParams.allow_promotion_codes = true;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (err) {
    console.error('[create-checkout-session] Error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
