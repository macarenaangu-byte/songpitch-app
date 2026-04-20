// Supabase Edge Function: stripe-webhook
// Receives Stripe events and keeps subscription_tier in sync with payments.
//
// Deploy: supabase functions deploy stripe-webhook
// Secrets: supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
//
// In Stripe Dashboard → Webhooks → Add endpoint:
//   URL: https://zjbsmxgccmtatrbjlvep.supabase.co/functions/v1/stripe-webhook
//   Events: customer.subscription.created, customer.subscription.updated,
//            customer.subscription.deleted, checkout.session.completed,
//            invoice.payment_failed

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

// Map Stripe Price IDs → Coda-Vault subscription tiers
// Covers all 4 products (composer + executive, basic + pro)
const PRICE_TO_TIER: Record<string, 'basic' | 'pro'> = {
  [Deno.env.get('STRIPE_PRICE_COMPOSER_BASIC') ?? '']: 'basic',
  [Deno.env.get('STRIPE_PRICE_COMPOSER_PRO')   ?? '']: 'pro',
  [Deno.env.get('STRIPE_PRICE_EXEC_BASIC')     ?? '']: 'basic',
  [Deno.env.get('STRIPE_PRICE_EXEC_PRO')       ?? '']: 'pro',
};

const ADMIN_EMAIL = 'manadeau@coda-vault.com';

async function sendAdminEmail(subject: string, body: string): Promise<void> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) return;
  const html = `
    <div style="background:#1a1a2e;padding:32px;font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:auto;border-radius:12px;">
      <div style="margin-bottom:18px;">
        <span style="color:#C9A84C;font-size:18px;font-weight:800;">Coda-Vault</span>
        <span style="color:#94a3b8;font-size:13px;margin-left:10px;">Payment Alert</span>
      </div>
      <h2 style="color:#e2e8f0;font-size:16px;font-weight:700;margin:0 0 14px;">${subject}</h2>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0;">${body}</p>
      <div style="margin-top:24px;padding-top:18px;border-top:1px solid rgba(255,255,255,0.08);color:#4A4640;font-size:11px;">
        Coda-Vault automatic monitoring
      </div>
    </div>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: `Coda-Vault <${ADMIN_EMAIL}>`, to: [ADMIN_EMAIL], subject, html }),
  });
  if (!res.ok) console.error('[stripe-webhook] Resend error:', res.status, await res.text());
}

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

      // Link Stripe customer to Coda-Vault profile
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

      if (event.type === 'customer.subscription.created') {
        await sendAdminEmail(
          '💳 New subscriber on Coda-Vault',
          `Tier: <strong>${tier}</strong><br>Stripe customer: ${sub.customer}<br>Renews: ${endsAt.toDateString()}`,
        );
      }
      break;
    }

    // ── Subscription canceled / expired ────────────────────────────────────
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price?.id ?? '';
      const tier = PRICE_TO_TIER[priceId] ?? 'unknown';
      await setTier(sub.customer as string, 'free');
      console.log(`[stripe-webhook] Downgraded to free for customer=${sub.customer}`);
      await sendAdminEmail(
        '😢 Cancellation on Coda-Vault',
        `Tier cancelled: <strong>${tier}</strong><br>Stripe customer: ${sub.customer}`,
      );
      break;
    }

    // ── Payment failed ──────────────────────────────────────────────────────
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const amount  = invoice.amount_due ? `$${(invoice.amount_due / 100).toFixed(2)}` : '—';
      console.log(`[stripe-webhook] Payment failed for customer=${invoice.customer}, amount=${amount}`);
      await sendAdminEmail(
        '⚠️ Payment failed on Coda-Vault',
        `Amount due: <strong>${amount}</strong><br>Stripe customer: ${invoice.customer}<br>Invoice: ${invoice.id}`,
      );
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
