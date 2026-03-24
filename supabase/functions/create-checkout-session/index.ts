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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
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
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer:             customerId,
      mode:                 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price:    priceId,
        quantity: 1,
      }],
      allow_promotion_codes: false,  // we pass coupon directly if provided
      subscription_data: {
        metadata: {
          supabase_profile_id: profile.id,
          account_type:        accountType,
        },
      },
      success_url: success_url ?? `${Deno.env.get('APP_URL') ?? 'https://www.songpitchhub.com'}?upgrade=success`,
      cancel_url:  cancel_url  ?? `${Deno.env.get('APP_URL') ?? 'https://www.songpitchhub.com'}?upgrade=canceled`,
    };

    // Apply coupon if provided (e.g. FOUNDER2026)
    if (coupon_code) {
      sessionParams.discounts = [{ coupon: coupon_code }];
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
