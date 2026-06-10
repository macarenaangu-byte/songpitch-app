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
//            invoice.payment_failed, invoice.payment_succeeded

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

async function sendInvoiceEmail(
  toEmail: string,
  invoice: Stripe.Invoice,
  tier: string,
  cardBrand: string | null,
  cardLast4: string | null,
): Promise<void> {
  const tierLabel   = tier === 'pro' ? 'Pro' : 'Basic';
  const amount      = invoice.amount_paid != null ? `$${(invoice.amount_paid / 100).toFixed(2)}` : '—';
  const currency    = (invoice.currency ?? 'usd').toUpperCase();
  const invoiceNum  = invoice.number ?? `INV-${invoice.id?.slice(-8).toUpperCase()}`;
  const billedDate  = invoice.created ? new Date(invoice.created * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  const nextDate    = invoice.period_end ? new Date(invoice.period_end * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  const pdfUrl      = invoice.invoice_pdf ?? '';
  const cardLine    = cardBrand && cardLast4
    ? `${cardBrand.charAt(0).toUpperCase() + cardBrand.slice(1)} ending in ${cardLast4}`
    : 'Card on file';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#08080C;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#08080C;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0F0F13;border-radius:16px;border:1px solid rgba(201,168,76,0.18);overflow:hidden;max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1A1710,#0F0F13);padding:32px 40px 28px;border-bottom:1px solid rgba(201,168,76,0.12);">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="color:#C9A84C;font-size:22px;font-weight:800;letter-spacing:-0.5px;font-family:Georgia,serif;">Coda-Vault</span>
                </td>
                <td align="right">
                  <span style="color:#4A4640;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Invoice</span>
                  <div style="color:#C9A84C;font-size:13px;font-weight:700;margin-top:2px;">${invoiceNum}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Amount hero -->
        <tr>
          <td style="padding:36px 40px 28px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
            <div style="color:#7A7468;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Amount Paid</div>
            <div style="color:#F1F5F9;font-size:42px;font-weight:800;letter-spacing:-1px;line-height:1;">${amount}</div>
            <div style="color:#4A4640;font-size:13px;margin-top:6px;">${currency}</div>
            <div style="display:inline-block;margin-top:16px;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.25);color:#C9A84C;font-size:12px;font-weight:700;padding:5px 14px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">
              ${tierLabel} Plan
            </div>
          </td>
        </tr>

        <!-- Details grid -->
        <tr>
          <td style="padding:28px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:18px;border-bottom:1px solid rgba(255,255,255,0.05);">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color:#7A7468;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;padding-bottom:4px;">Billed To</td>
                    </tr>
                    <tr>
                      <td style="color:#E2E8F0;font-size:14px;">${toEmail}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:18px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="50%">
                        <div style="color:#7A7468;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">Payment Method</div>
                        <div style="color:#E2E8F0;font-size:14px;">${cardLine}</div>
                      </td>
                      <td width="50%" align="right">
                        <div style="color:#7A7468;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">Date</div>
                        <div style="color:#E2E8F0;font-size:14px;">${billedDate}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding-top:18px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <div style="color:#7A7468;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">Next Billing Date</div>
                        <div style="color:#E2E8F0;font-size:14px;">${nextDate}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTAs -->
        <tr>
          <td style="padding:0 40px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="48%">
                  ${pdfUrl ? `<a href="${pdfUrl}" style="display:block;text-align:center;background:#C9A84C;color:#0F0F13;font-weight:700;font-size:14px;padding:13px 20px;border-radius:10px;text-decoration:none;">Download Invoice PDF</a>` : ''}
                </td>
                <td width="4%"></td>
                <td width="48%">
                  <a href="${APP_URL}/#billing" style="display:block;text-align:center;background:rgba(255,255,255,0.05);color:#E2E8F0;font-weight:600;font-size:14px;padding:13px 20px;border-radius:10px;text-decoration:none;border:1px solid rgba(255,255,255,0.08);">Manage Billing</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="color:#4A4640;font-size:12px;margin:0 0 6px;">Questions about this invoice? Reply to this email.</p>
            <p style="color:#2A2A2A;font-size:11px;margin:0;">© ${new Date().getFullYear()} Coda-Vault · <a href="${APP_URL}" style="color:#4A4640;text-decoration:none;">coda-vault.com</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await sendEmail(toEmail, `Invoice from Coda-Vault — ${amount} ${currency}`, html);
}

async function sendUserConfirmationEmail(toEmail: string, tier: string, promoEndsAt?: Date): Promise<void> {
  const tierLabel  = tier === 'pro' ? 'Pro' : 'Basic';
  const isPromo    = !!promoEndsAt;
  const promoEnd   = promoEndsAt ? promoEndsAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  const subject = isPromo
    ? `Your 6 months free on Coda-Vault ${tierLabel} have started 🎉`
    : `Your Coda-Vault ${tierLabel} plan is active ✓`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#08080C;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#08080C;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0F0F13;border-radius:16px;border:1px solid rgba(201,168,76,0.18);overflow:hidden;max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1A1710,#0F0F13);padding:32px 40px 28px;border-bottom:1px solid rgba(201,168,76,0.12);text-align:center;">
            <span style="color:#C9A84C;font-size:22px;font-weight:800;letter-spacing:-0.5px;font-family:Georgia,serif;">Coda-Vault</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;text-align:center;">
            <div style="font-size:42px;margin-bottom:16px;">${isPromo ? '🎁' : '🎉'}</div>
            <h2 style="color:#F1F5F9;font-size:22px;font-weight:800;margin:0 0 14px;line-height:1.3;">
              ${isPromo ? `Your 6 months free<br/>on ${tierLabel} have started!` : `You're on ${tierLabel}!`}
            </h2>
            <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 10px;">
              ${isPromo
                ? `Enjoy full access to all ${tierLabel} features completely free until <strong style="color:#C9A84C;">${promoEnd}</strong>.`
                : `Your ${tierLabel} subscription is now active. Head back to start using all your features.`
              }
            </p>
            ${isPromo ? `<p style="color:#7A7468;font-size:13px;line-height:1.6;margin:0 0 28px;">After your free period ends, you'll be charged the standard ${tierLabel} rate. You can cancel anytime from your billing page.</p>` : '<div style="margin-bottom:28px;"></div>'}
            <div style="display:inline-block;margin-bottom:28px;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.25);color:#C9A84C;font-size:12px;font-weight:700;padding:5px 16px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">
              ${tierLabel} Plan ${isPromo ? '· Free until ' + promoEnd : '· Active'}
            </div>
            <br/>
            <a href="${APP_URL}" style="display:inline-block;background:#C9A84C;color:#0F0F13;font-weight:700;font-size:15px;padding:13px 32px;border-radius:10px;text-decoration:none;">
              Go to Coda-Vault →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="color:#4A4640;font-size:12px;margin:0 0 6px;">Questions? Reply to this email — we read every one.</p>
            <p style="color:#2A2A2A;font-size:11px;margin:0;">© ${new Date().getFullYear()} Coda-Vault · <a href="${APP_URL}" style="color:#4A4640;text-decoration:none;">coda-vault.com</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await sendEmail(toEmail, subject, html);
}

// ── Database helpers ──────────────────────────────────────────────────────────

async function setTier(stripeCustomerId: string, tier: 'free' | 'basic' | 'pro', subscriptionId?: string, endsAt?: Date, promoEndsAt?: Date) {
  const payload = {
    subscription_tier:      tier,
    stripe_subscription_id: subscriptionId ?? null,
    subscription_status:    tier === 'free' ? 'canceled' : 'active',
    subscription_ends_at:   (endsAt && !isNaN(endsAt.getTime())) ? endsAt.toISOString() : null,
    promo_ends_at:          (promoEndsAt && !isNaN(promoEndsAt.getTime())) ? promoEndsAt.toISOString() : null,
  };

  // Primary: match by stripe_customer_id
  const { error, count } = await supabase
    .from('user_profiles')
    .update(payload)
    .eq('stripe_customer_id', stripeCustomerId)
    .select('id', { count: 'exact', head: true });

  if (error) {
    console.error('[stripe-webhook] setTier error (by customer ID):', error);
  } else if ((count ?? 0) === 0) {
    // Fallback: no profile has this stripe_customer_id yet.
    // This can happen if the checkout-session customer-ID save raced or failed.
    // Try to match by email via the Stripe customer record.
    console.warn(`[stripe-webhook] setTier: no profile found for stripe_customer_id=${stripeCustomerId} — attempting email fallback`);
    try {
      const customer = await stripe.customers.retrieve(stripeCustomerId);
      const email = (customer as Stripe.Customer).email;
      if (email) {
        // Also save the stripe_customer_id so future events resolve instantly
        const { error: emailError, count: emailCount } = await supabase
          .from('user_profiles')
          .update({ ...payload, stripe_customer_id: stripeCustomerId })
          .eq('email', email)
          .select('id', { count: 'exact', head: true });

        if (emailError) {
          console.error('[stripe-webhook] setTier email fallback error:', emailError);
        } else if ((emailCount ?? 0) === 0) {
          console.error(`[stripe-webhook] setTier: FAILED — no profile found for email=${email} (customer=${stripeCustomerId}). Tier NOT updated.`);
        } else {
          console.log(`[stripe-webhook] setTier: email fallback succeeded for email=${email} tier=${tier}`);
        }
      } else {
        console.error(`[stripe-webhook] setTier: FAILED — Stripe customer ${stripeCustomerId} has no email. Tier NOT updated.`);
      }
    } catch (stripeErr) {
      console.error('[stripe-webhook] setTier: could not retrieve Stripe customer for fallback:', stripeErr);
    }
  } else {
    console.log(`[stripe-webhook] setTier: updated ${count} profile(s) for customer=${stripeCustomerId} tier=${tier}`);
  }
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

            // Send confirmation email to user (promo-aware)
            if (customerEmail) {
              await sendUserConfirmationEmail(customerEmail, tier, getPromoEndsAt(sub));
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

    // ── Invoice paid — send branded invoice email to customer ──────────────────
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;

      // Only send for subscription renewals/payments, not for $0 trials
      if (!invoice.customer_email || !invoice.amount_paid || invoice.amount_paid === 0) break;

      // Determine tier from the invoice line items
      const priceId  = invoice.lines?.data?.[0]?.price?.id ?? '';
      const tier     = PRICE_TO_TIER[priceId] ?? 'basic';

      // Fetch card details from the payment intent
      let cardBrand: string | null = null;
      let cardLast4: string | null = null;
      try {
        if (invoice.payment_intent) {
          const pi = await stripe.paymentIntents.retrieve(
            typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent.id,
            { expand: ['payment_method'] }
          );
          const pm = pi.payment_method as Stripe.PaymentMethod | null;
          cardBrand = pm?.card?.brand ?? null;
          cardLast4 = pm?.card?.last4 ?? null;
        }
      } catch (err) {
        console.warn('[stripe-webhook] Could not fetch card details:', err);
      }

      await sendInvoiceEmail(invoice.customer_email, invoice, tier, cardBrand, cardLast4);
      console.log(`[stripe-webhook] invoice.payment_succeeded: sent invoice to ${invoice.customer_email}`);
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
