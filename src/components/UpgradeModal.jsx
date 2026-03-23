// UpgradeModal.jsx
// Shows when a user tries to access a gated feature.
// Includes Stripe Checkout flow with coupon code support.

import React, { useState } from 'react';
import { X, Zap, Star, Check, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

const GOLD   = '#C9A84C';
const PURPLE = '#8B5CF6';

// ── Tier feature lists ────────────────────────────────────────────────────────
const COMPOSER_FEATURES = {
  basic: [
    'Unlimited song uploads',
    'Full public split card (PRO & IPI visible to execs)',
    'PRO & IPI auto-enrichment via LegalSplits ML',
    'Full contract analysis on your private splits tab',
    'Verified badge on your profile & songs',
    'Up to 25 exec contacts / month',
    'Up to 10 opportunity applications / month',
  ],
  pro: [
    'Everything in Basic',
    'Deal Analyzer — upload any recording deal PDF',
    'Agreement Reader (co-pub, publishing admin, 360)',
    'Benchmarked against 460 real music contracts',
    'Recoupment timeline + red flag detection',
    'Negotiation checklist tailored to your deal',
    'Unlimited contacts & opportunity applications',
  ],
};

const EXEC_FEATURES = {
  basic: [
    'Full catalog access with advanced filters',
    'Complete song previews',
    'See verified badges + composer split cards',
    'Up to 25 composer contacts / month',
    'Up to 10 opportunity postings / month',
    'Save up to 5 shortlists',
    'Contract Revision — review drafts via LegalSplits ML (3/month)',
    'Contract Vault — save & manage your revisions',
  ],
  pro: [
    'Everything in Basic',
    'Unlimited contacts, postings & shortlists',
    'Unlimited contract revisions in your vault',
    'Export split sheets as PDF or CSV',
    'Market analytics — trending genres & top composers',
    'Priority placement on your opportunity postings',
    'Full LegalSplits ML feature access',
  ],
};

// ── Pricing ───────────────────────────────────────────────────────────────────
const PRICING = {
  composer: { basic: 4.99, pro: 9.99 },
  music_executive: { basic: 5.99, pro: 14.99 },
};

export default function UpgradeModal({ isOpen, onClose, feature, userProfile, defaultTier = 'basic' }) {
  const [selectedTier, setSelectedTier] = useState(defaultTier);
  const [couponCode, setCouponCode]     = useState('');
  const [showCoupon, setShowCoupon]     = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  if (!isOpen) return null;

  const accountType = userProfile?.account_type ?? 'composer';
  const isExec      = accountType === 'music_executive';
  const features    = isExec ? EXEC_FEATURES : COMPOSER_FEATURES;
  const pricing     = PRICING[accountType] ?? PRICING.composer;

  async function handleUpgrade() {
    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please sign in to upgrade.');

      const res = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            tier:        selectedTier,
            coupon_code: couponCode.trim() || undefined,
            success_url: `${window.location.origin}?upgrade=success`,
            cancel_url:  `${window.location.origin}?upgrade=canceled`,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed');

      // Redirect to Stripe Checkout
      window.location.href = data.url;

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div style={{
      position:        'fixed',
      inset:           0,
      zIndex:          9999,
      background:      'rgba(0,0,0,0.75)',
      backdropFilter:  'blur(8px)',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      padding:         '20px',
    }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background:   '#0F1120',
        border:       `1px solid rgba(201,168,76,0.18)`,
        borderRadius: 20,
        width:        '100%',
        maxWidth:     640,
        maxHeight:    '90vh',
        overflowY:    'auto',
        padding:      '32px',
        position:     'relative',
      }}>

        {/* Close */}
        <button onClick={onClose} style={{
          position:   'absolute', top: 16, right: 16,
          background: 'rgba(255,255,255,0.06)', border: 'none',
          borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#7A7468',
        }}>
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: `rgba(201,168,76,0.12)`,
            border: `1px solid rgba(201,168,76,0.25)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <Lock size={22} color={GOLD} />
          </div>
          <h2 style={{ color: '#F0EBE3', fontSize: 22, fontWeight: 700, margin: '0 0 8px', fontFamily: 'Space Grotesk, sans-serif' }}>
            Unlock {feature ?? 'this feature'}
          </h2>
          <p style={{ color: '#7A7468', fontSize: 14, margin: 0 }}>
            Choose your plan — cancel anytime.
          </p>
        </div>

        {/* Tier toggle */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {['basic', 'pro'].map((t) => (
            <button key={t} onClick={() => setSelectedTier(t)} style={{
              flex: 1, padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
              border: selectedTier === t
                ? `1.5px solid ${t === 'pro' ? PURPLE : GOLD}`
                : '1.5px solid rgba(255,255,255,0.08)',
              background: selectedTier === t
                ? t === 'pro' ? 'rgba(139,92,246,0.10)' : 'rgba(201,168,76,0.10)'
                : 'rgba(255,255,255,0.03)',
              transition: 'all 0.15s',
              textAlign: 'left',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {t === 'pro'
                  ? <Star size={14} color={PURPLE} fill={PURPLE} />
                  : <Zap  size={14} color={GOLD} />
                }
                <span style={{
                  color: selectedTier === t ? (t === 'pro' ? PURPLE : GOLD) : '#F0EBE3',
                  fontWeight: 700, fontSize: 14, fontFamily: 'Space Grotesk, sans-serif',
                  textTransform: 'capitalize',
                }}>
                  {t === 'basic' ? 'Basic' : 'Pro'}
                </span>
                {t === 'pro' && (
                  <span style={{
                    background: 'rgba(139,92,246,0.18)', color: PURPLE,
                    fontSize: 10, fontWeight: 700, padding: '2px 7px',
                    borderRadius: 20, letterSpacing: '0.5px',
                  }}>LUXURY</span>
                )}
              </div>
              <div style={{
                color: selectedTier === t ? (t === 'pro' ? PURPLE : GOLD) : '#7A7468',
                fontSize: 20, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif',
              }}>
                ${pricing[t]}
                <span style={{ fontSize: 13, fontWeight: 400 }}>/mo</span>
              </div>
            </button>
          ))}
        </div>

        {/* Feature list */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: '16px 20px', marginBottom: 20,
        }}>
          <p style={{ color: '#7A7468', fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', margin: '0 0 12px' }}>
            {selectedTier === 'pro' ? 'Pro includes' : 'Basic includes'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {features[selectedTier].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <Check size={14} color={selectedTier === 'pro' ? PURPLE : GOLD}
                  style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ color: '#C8C2B8', fontSize: 13, lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Coupon code */}
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => setShowCoupon(!showCoupon)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(201,168,76,0.7)', fontSize: 13, padding: 0,
            textDecoration: 'underline',
          }}>
            {showCoupon ? 'Hide coupon code' : 'Have a coupon code?'}
          </button>
          {showCoupon && (
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="e.g. FOUNDER2026"
              style={{
                display: 'block', width: '100%', marginTop: 10,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(201,168,76,0.25)',
                borderRadius: 10, padding: '10px 14px',
                color: GOLD, fontSize: 14, fontFamily: 'monospace',
                outline: 'none', boxSizing: 'border-box',
                letterSpacing: '1px',
              }}
            />
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            color: '#f87171', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* CTA */}
        <button onClick={handleUpgrade} disabled={loading} style={{
          width: '100%', padding: '14px',
          background: selectedTier === 'pro'
            ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
            : `linear-gradient(135deg, ${GOLD}, #A8832A)`,
          border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
          color: '#fff', fontSize: 15, fontWeight: 700,
          fontFamily: 'Space Grotesk, sans-serif',
          opacity: loading ? 0.7 : 1,
          transition: 'opacity 0.15s',
        }}>
          {loading
            ? 'Redirecting to checkout...'
            : `Upgrade to ${selectedTier === 'pro' ? 'Pro' : 'Basic'} — $${pricing[selectedTier]}/mo`
          }
        </button>

        <p style={{ textAlign: 'center', color: '#4A4640', fontSize: 12, marginTop: 12, marginBottom: 0 }}>
          Secure checkout via Stripe · Cancel anytime · No hidden fees
        </p>
      </div>
    </div>
  );
}
