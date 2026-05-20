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
const APP_URL     = Deno.env.get('APP_URL') ?? 'https://www.coda-vault.com';

// ── Email helpers ─────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) { console.warn('[stripe-webhook] RESEND_API_KEY not set — skipping email'); return; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: `Coda-Vault <${ADMIN_EMAIL}>`, to: [to], subject, html }),
  });
  if (!res.ok) console.error('[stripe-webhook] Resend error:', res.status, await res.text());
}

async function sendAdminEmail(subject: string, body: string): Promise<void> {
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
  await sendEmail(ADMIN_EMAIL, subject, html);
}

async function sendUserConfirmationEmail(toEmail: string, tier: string): Promise<void> {
  const tierLabel = tier === 'pro' ? 'Pro' : 'Basic';
  const html = `
    <div style="background:#0F0F13;padding:40px;font-family:'Helvetica Neue',sans-serif;max-width:540px;margin:auto;border-radius:16px;border:1px solid rgba(201,168,76,0.2);">
      <div style="margin-bottom:24px;text-align:center;">
        <span style="color:#C9A84C;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Coda-Vault</span>
      </div>
      <h2 style="color:#f1f5f9;font-size:20px;font-weight:700;margin:0 0 12px;text-align:center;">
        You're on ${tierLabel}! 🎉
      </h2>
      <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 24px;text-align:center;">
        Your subscription is now active. Head back to Coda-Vault to start using all your ${tierLabel} features.
      </p>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${APP_URL}" style="display:inline-block;background:#C9A84C;color:#0F0F13;font-weight:700;font-size:15px;padding:12px 32px;border-radius:10px;text-decoration:none;">
          Go to Coda-Vault →
        </a>
      </div>
      <p style="color:#4A4640;font-size:12px;text-align:center;margin:0;">
        Questions? Reply to this email — we read every one.
      </p>
    </div>`;
  await sendEmail(toEmail, `Your Coda-Vault ${tierLabel} plan is active ✓`, html);
}

// ── Database helpers ──────────────────────────────────────────────────────────

async function setTier(stripeCustomerId: string, tier: 'free' | 'basic' | 'pro', subscriptionId?: string, endsAt?: Date, promoEndsAt?: Date) {
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_tier:      tier,
      stripe_subscription_id: subscriptionId ?? null,
      subscription_status:    tier === 'free' ? 'canceled' : 'active',
      subscription_ends_at:   (endsAt && !isNaN(endsAt.getTime())) ? endsAt.toISOString() : null,
      promo_ends_at:          (promoEndsAt && !isNaN(promoEndsAt.getTime())) ? promoEndsAt.toISOString() : null,
    })
    .eq('stripe_customer_id', stripeCustomerId);
  if (error) console.error('[stripe-webhook] setTier error:', error);
}

// Extract promo end date from a Stripe subscription's discount (if active)
function getPromoEndsAt(sub: Stripe.Subscription): Date | undefined {
  const discountEnd = sub.discount?.end;
  if (discountEnd && discountEnd > Math.floor(Date.now() / 1000)) {
    return new Date(discountEnd * 1000);
  }
  return undefined;
}

// ── Main handler ──────────────────────────────────────────────────────────────

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

    // ── Checkout completed — set tier immediately, send user confirmation ──────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== 'subscription') break;

      const customerId    = session.customer as string;
      const customerEmail = session.customer_details?.email;
      const subscriptionId = session.subscription as string;

      // Retrieve the subscription to get the price ID and set the tier now.
      // This is the primary place tier is set — don't wait for subscription.created.
      if (subscriptionId) {
        try {
          const sub    = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = sub.items.data[0]?.price?.id ?? '';
          const tier    = PRICE_TO_TIER[priceId];

          if (tier) {
            const endsAt = sub.current_period_end ? new Date(sub.current_period_end * 1000) : undefined;
            await setTier(customerId, tier, sub.id, endsAt, getPromoEndsAt(sub));
            console.log(`[stripe-webhook] checkout.session.completed: tier=${tier} customer=${customerId}`);

            // Send confirmation email to user
            if (customerEmail) {
              await sendUserConfirmationEmail(customerEmail, tier);
            }

            await sendAdminEmail(
              '💳 New subscriber on Coda-Vault',
              `Tier: <strong>${tier}</strong><br>Stripe customer: ${customerId}<br>Email: ${customerEmail ?? '—'}<br>Renews: ${endsAt.toDateString()}`,
            );
          } else {
            console.warn(`[stripe-webhook] checkout.session.completed: unknown price ID "${priceId}" — tier NOT set for customer ${customerId}. Check STRIPE_PRICE_* secrets.`);
          }
        } catch (err) {
          console.error('[stripe-webhook] Failed to retrieve subscription in checkout.session.completed:', err);
        }
      }
      break;
    }

    // ── Subscription updated (renewal, plan change) ────────────────────────────
    // checkout.session.completed handles initial creation, so this covers upgrades/renewals.
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub    = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price?.id ?? '';
      const tier    = PRICE_TO_TIER[priceId];

      if (tier) {
        const endsAt = new Date(sub.current_period_end * 1000);
        await setTier(sub.customer as string, tier, sub.id, endsAt, getPromoEndsAt(sub));
        console.log(`[stripe-webhook] ${event.type}: tier=${tier} customer=${sub.customer}`);
      } else {
        console.warn(`[stripe-webhook] ${event.type}: unknown price ID "${priceId}" for customer ${sub.customer}`);
      }
      break;
    }

    // ── Subscription canceled / expired ────────────────────────────────────────
    case 'customer.subscription.deleted': {
      const sub    = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price?.id ?? '';
      const tier    = PRICE_TO_TIER[priceId] ?? 'unknown';
      await setTier(sub.customer as string, 'free');
      console.log(`[stripe-webhook] subscription.deleted: downgraded to free for customer=${sub.customer}`);
      await sendAdminEmail(
        '😢 Cancellation on Coda-Vault',
        `Tier cancelled: <strong>${tier}</strong><br>Stripe customer: ${sub.customer}`,
      );
      break;
    }

    // ── Payment failed ──────────────────────────────────────────────────────────
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const amount  = invoice.amount_due ? `$${(invoice.amount_due / 100).toFixed(2)}` : '—';
      console.log(`[stripe-webhook] payment_failed: customer=${invoice.customer} amount=${amount}`);
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
