// Supabase Edge Function: get-billing-info
// Returns the user's Stripe subscription details and payment method for the Billing page.
//
// Deploy: supabase functions deploy get-billing-info

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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
      .select('stripe_customer_id, stripe_subscription_id, subscription_tier, subscription_status, subscription_ends_at')
      .eq('user_id', user.id)
      .single();

    // No Stripe customer = free user with no billing history
    if (!profile?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ tier: profile?.subscription_tier || 'free', paymentMethod: null, subscription: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Fetch payment method from Stripe ──────────────────────────────────────
    let paymentMethod = null;
    try {
      const customer = await stripe.customers.retrieve(profile.stripe_customer_id, {
        expand: ['invoice_settings.default_payment_method'],
      }) as Stripe.Customer;

      const pm = customer.invoice_settings?.default_payment_method as Stripe.PaymentMethod | null;
      if (pm?.card) {
        paymentMethod = {
          brand: pm.card.brand,       // "visa", "mastercard", etc.
          last4: pm.card.last4,
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year,
        };
      }
    } catch (_) {
      // Non-fatal — card info just won't show
    }

    return new Response(
      JSON.stringify({
        tier: profile.subscription_tier || 'free',
        status: profile.subscription_status || 'active',
        ends_at: profile.subscription_ends_at || null,
        paymentMethod,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (err) {
    console.error('[get-billing-info] Error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: corsHeaders },
    );
  }
});
