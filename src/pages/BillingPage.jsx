import { useState, useEffect } from 'react';
import { CreditCard, Calendar, RefreshCw, AlertTriangle, CheckCircle, Crown, Zap, Shield, Download, FileText } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';

const TIER_CONFIG = {
  free:   { label: 'Free',          icon: <Shield size={16} />,  color: DESIGN_SYSTEM.colors.text.muted },
  basic:  { label: 'Basic',         icon: <Zap size={16} />,     color: DESIGN_SYSTEM.colors.brand.blue },
  pro:    { label: 'Pro',           icon: <Crown size={16} />,   color: DESIGN_SYSTEM.colors.brand.primary },
  admin:  { label: 'Admin',         icon: <Shield size={16} />,  color: DESIGN_SYSTEM.colors.accent.purple },
  founder:{ label: 'Founder',       icon: <Crown size={16} />,   color: DESIGN_SYSTEM.colors.brand.primary },
};

const CARD_BRAND_LABELS = {
  visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express',
  discover: 'Discover', jcb: 'JCB', diners: 'Diners Club', unionpay: 'UnionPay',
};

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

export function BillingPage({ userProfile, isMobile = false }) {
  const [billingInfo, setBillingInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  const tier = userProfile?.subscription_tier || 'free';
  const tierCfg = TIER_CONFIG[tier] || TIER_CONFIG.free;
  const isFree = tier === 'free' || tier === 'admin';
  const isPaid = !isFree;

  useEffect(() => {
    let cancelled = false;
    const loadBillingInfo = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-billing-info', { body: {} });
        if (cancelled) return;
        if (error) throw error;
        setBillingInfo(data);
      } catch (err) {
        if (cancelled) return;
        console.error('Billing info error:', err);
        // Fallback to profile data if edge function fails
        setBillingInfo({
          tier,
          status: userProfile?.subscription_status || 'active',
          ends_at: userProfile?.subscription_ends_at || null,
          paymentMethod: null,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadBillingInfo();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = async () => {
    if (!window.confirm('Your plan stays active until the end of the billing period, then downgrades to Free. Are you sure you want to cancel?')) return;
    setCanceling(true);
    try {
      const { error } = await supabase.functions.invoke('cancel-subscription', { body: {} });
      if (error) throw error;
      showToast.success('Subscription cancelled — you keep access until the end of your billing period.');
      setBillingInfo(prev => prev ? { ...prev, status: 'canceling' } : prev);
    } catch (err) {
      showToast.error(err.message || 'Could not cancel subscription. Please try again.');
    } finally {
      setCanceling(false);
    }
  };

  const status = billingInfo?.status || userProfile?.subscription_status || 'active';
  const endsAt = billingInfo?.ends_at || userProfile?.subscription_ends_at;
  const paymentMethod = billingInfo?.paymentMethod;
  const isCanceling = status === 'canceling';

  const formatDate = (iso) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const cardStyle = {
    background: DESIGN_SYSTEM.colors.bg.secondary,
    border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 16,
  };

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 0',
    borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.subtle}`,
  };

  const labelStyle = {
    color: DESIGN_SYSTEM.colors.text.muted,
    fontSize: 13,
    fontFamily: DESIGN_SYSTEM.font.body,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  const valueStyle = {
    color: DESIGN_SYSTEM.colors.text.primary,
    fontSize: 14,
    fontWeight: 500,
    fontFamily: DESIGN_SYSTEM.font.body,
  };

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '32px 36px', maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{
        color: DESIGN_SYSTEM.colors.text.primary,
        fontSize: isMobile ? 22 : 26,
        fontWeight: 700,
        fontFamily: DESIGN_SYSTEM.font.display,
        marginBottom: 6,
      }}>
        Billing
      </h1>
      <p style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 14, marginBottom: 28, fontFamily: DESIGN_SYSTEM.font.body }}>
        Manage your subscription and payment details.
      </p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <RefreshCw size={24} color={DESIGN_SYSTEM.colors.text.muted} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* Subscription Card */}
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: DESIGN_SYSTEM.colors.text.muted, marginBottom: 16, fontFamily: DESIGN_SYSTEM.font.body }}>
              Subscription
            </div>

            {/* Plan */}
            <div style={{ ...rowStyle }}>
              <span style={labelStyle}>
                <Shield size={15} /> Plan
              </span>
              <span style={{ ...valueStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: `${tierCfg.color}18`, color: tierCfg.color,
                  border: `1px solid ${tierCfg.color}40`,
                  borderRadius: 20, padding: '3px 10px', fontSize: 13, fontWeight: 600,
                  fontFamily: DESIGN_SYSTEM.font.body,
                }}>
                  {tierCfg.icon}
                  {capitalize(tierCfg.label)}
                </span>
                {isCanceling && (
                  <span style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.accent.amber, fontWeight: 500 }}>
                    Cancelling
                  </span>
                )}
              </span>
            </div>

            {/* Status */}
            <div style={{ ...rowStyle }}>
              <span style={labelStyle}>
                <CheckCircle size={15} /> Status
              </span>
              <span style={{
                ...valueStyle,
                color: isCanceling
                  ? DESIGN_SYSTEM.colors.accent.amber
                  : status === 'active'
                    ? DESIGN_SYSTEM.colors.accent.green || '#4ade80'
                    : DESIGN_SYSTEM.colors.text.muted,
              }}>
                {isCanceling ? 'Cancelling at period end' : capitalize(status)}
              </span>
            </div>

            {/* Renewal / End date */}
            {endsAt && isPaid && (
              <div style={{ ...rowStyle }}>
                <span style={labelStyle}>
                  <Calendar size={15} />
                  {isCanceling ? 'Access ends' : 'Renews on'}
                </span>
                <span style={valueStyle}>{formatDate(endsAt)}</span>
              </div>
            )}

            {/* Account email */}
            <div style={{ ...rowStyle, borderBottom: 'none' }}>
              <span style={labelStyle}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                Billing email
              </span>
              <span style={{ ...valueStyle, color: DESIGN_SYSTEM.colors.text.secondary }}>
                {userProfile?.email || '—'}
              </span>
            </div>
          </div>

          {/* Payment Method Card */}
          {isPaid && (
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: DESIGN_SYSTEM.colors.text.muted, marginBottom: 16, fontFamily: DESIGN_SYSTEM.font.body }}>
                Payment Method
              </div>

              {paymentMethod ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 30, borderRadius: 6,
                    background: DESIGN_SYSTEM.colors.bg.elevated,
                    border: `1px solid ${DESIGN_SYSTEM.colors.border.medium}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CreditCard size={16} color={DESIGN_SYSTEM.colors.text.muted} />
                  </div>
                  <div>
                    <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600, fontFamily: DESIGN_SYSTEM.font.body }}>
                      {CARD_BRAND_LABELS[paymentMethod.brand] || capitalize(paymentMethod.brand)} •••• {paymentMethod.last4}
                    </div>
                    <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 12, marginTop: 2, fontFamily: DESIGN_SYSTEM.font.body }}>
                      Expires {paymentMethod.exp_month}/{paymentMethod.exp_year}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 14, fontFamily: DESIGN_SYSTEM.font.body }}>
                  No payment method on file.
                </div>
              )}
            </div>
          )}

          {/* Free plan CTA */}
          {isFree && tier !== 'admin' && (
            <div style={{
              ...cardStyle,
              background: `linear-gradient(135deg, ${DESIGN_SYSTEM.colors.brand.primary}10 0%, ${DESIGN_SYSTEM.colors.bg.secondary} 100%)`,
              border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}30`,
              textAlign: 'center',
              padding: '32px 24px',
            }}>
              <Crown size={28} color={DESIGN_SYSTEM.colors.brand.primary} style={{ marginBottom: 12 }} />
              <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 600, marginBottom: 8, fontFamily: DESIGN_SYSTEM.font.body }}>
                You're on the Free plan
              </div>
              <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 14, marginBottom: 20, fontFamily: DESIGN_SYSTEM.font.body }}>
                Upgrade to unlock unlimited uploads, AI genre analysis, and direct executive access.
              </div>
              <button
                onClick={() => window.location.hash = '#opportunities'}
                style={{
                  background: DESIGN_SYSTEM.colors.brand.primary,
                  color: '#0F0F13', border: 'none', borderRadius: 8,
                  padding: '10px 24px', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: DESIGN_SYSTEM.font.body,
                }}
              >
                View Plans
              </button>
            </div>
          )}

          {/* Invoice History */}
          {billingInfo?.invoices?.length > 0 && (
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: DESIGN_SYSTEM.colors.text.muted, marginBottom: 16, fontFamily: DESIGN_SYSTEM.font.body }}>
                Invoice History
              </div>
              {billingInfo.invoices.map((inv, i) => {
                const amount    = inv.amount_paid != null ? `$${(inv.amount_paid / 100).toFixed(2)}` : '—';
                const currency  = (inv.currency ?? 'usd').toUpperCase();
                const invNum    = inv.number ?? `INV-${inv.id?.slice(-8).toUpperCase()}`;
                const date      = inv.created ? new Date(inv.created * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                const isLast    = i === billingInfo.invoices.length - 1;
                return (
                  <div key={inv.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 0',
                    borderBottom: isLast ? 'none' : `1px solid ${DESIGN_SYSTEM.colors.border.subtle}`,
                    gap: 12,
                  }}>
                    {/* Left: icon + invoice info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                        background: `${DESIGN_SYSTEM.colors.brand.primary}12`,
                        border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}25`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <FileText size={15} color={DESIGN_SYSTEM.colors.brand.primary} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600, fontFamily: DESIGN_SYSTEM.font.body }}>
                          {invNum}
                        </div>
                        <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 12, fontFamily: DESIGN_SYSTEM.font.body }}>
                          {date}
                        </div>
                      </div>
                    </div>

                    {/* Center: amount + currency */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 700, fontFamily: DESIGN_SYSTEM.font.body }}>
                        {amount}
                      </div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 11, fontFamily: DESIGN_SYSTEM.font.body }}>
                        {currency}
                      </div>
                    </div>

                    {/* Right: download */}
                    {inv.invoice_pdf && (
                      <a
                        href={inv.invoice_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '6px 12px', borderRadius: 8, flexShrink: 0,
                          background: DESIGN_SYSTEM.colors.bg.elevated,
                          border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                          color: DESIGN_SYSTEM.colors.text.secondary,
                          fontSize: 12, fontWeight: 600,
                          textDecoration: 'none', fontFamily: DESIGN_SYSTEM.font.body,
                          transition: 'all 0.15s',
                        }}
                      >
                        <Download size={12} />
                        PDF
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Cancel subscription */}
          {isPaid && !isCanceling && (
            <div style={{ marginTop: 8, paddingTop: 8 }}>
              <button
                onClick={handleCancel}
                disabled={canceling}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: DESIGN_SYSTEM.colors.text.muted,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: DESIGN_SYSTEM.font.body,
                  textDecoration: 'underline',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <AlertTriangle size={13} />
                {canceling ? 'Cancelling…' : 'Cancel subscription'}
              </button>
              <p style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 12, marginTop: 6, fontFamily: DESIGN_SYSTEM.font.body }}>
                You'll keep access until the end of your billing period. No refunds are issued for partial periods.
              </p>
            </div>
          )}

          {isCanceling && endsAt && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: `${DESIGN_SYSTEM.colors.accent.amber}12`,
              border: `1px solid ${DESIGN_SYSTEM.colors.accent.amber}30`,
              borderRadius: 10, padding: '12px 16px', marginTop: 8,
            }}>
              <AlertTriangle size={16} color={DESIGN_SYSTEM.colors.accent.amber} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ color: DESIGN_SYSTEM.colors.accent.amber, fontSize: 13, fontFamily: DESIGN_SYSTEM.font.body }}>
                Your subscription is scheduled to cancel on <strong>{formatDate(endsAt)}</strong>. You keep full access until then.
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
