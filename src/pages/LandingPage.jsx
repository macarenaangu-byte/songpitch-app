import { useState } from 'react';
import { Search, Music, Briefcase, Headphones, MessageCircle, Users, Shield, ChevronDown, ChevronUp, Play, Star, CheckCircle, Lock, Zap } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';

const FAQ_ITEMS = [
  {
    q: "Is my music safe and private?",
    a: "Yes. Your tracks are stored in a private, encrypted cloud vault. Only music executives you explicitly pitch to can access them — no public browsing, no third-party sharing."
  },
  {
    q: "Who can see my uploaded tracks?",
    a: "Music executives who browse the Catalog can discover your songs. You control which tracks are in your portfolio and can remove them at any time."
  },
  {
    q: "How much does it cost?",
    a: "SongPitch is free during our Founding Member period. Early members lock in free access before we introduce paid plans. No credit card required."
  },
  {
    q: "What makes the AI tagging different from other tools?",
    a: "Our AI is trained specifically on sync licensing metadata — it tags BPM, key, genre, mood, and even transcribes lyrics. The result is a pitch-ready catalog that executives can actually search by vibe."
  },
  {
    q: "What is a One-Stop track?",
    a: "A One-Stop track means you own 100% of both the master and the composition rights — executives can license it immediately with no split negotiations. Our platform verifies and badges these tracks."
  },
  {
    q: "How do split sheets work?",
    a: "Our built-in split sheet generator lets you document co-writing splits (composition & master), export them as PDF or CSV, and publish them for verification — all without leaving the platform."
  },
];

const FEATURES = [
  {
    icon: <Music size={24} />,
    title: "Know your BPM, key & genre in 60 seconds",
    desc: "Upload any track and our AI instantly tags genre, mood, BPM, key, and even lyrics — no DAW, no manual entry.",
    color: DESIGN_SYSTEM.colors.brand.primary,
  },
  {
    icon: <Briefcase size={24} />,
    title: "Your private, always-organized track vault",
    desc: "Every unreleased track — perfectly tagged, securely stored, searchable in seconds. No more Dropbox chaos.",
    color: DESIGN_SYSTEM.colors.brand.accent,
  },
  {
    icon: <Headphones size={24} />,
    title: "Find 'Uplifting Indie Folk at 115 BPM' instantly",
    desc: "Music supervisors can filter by vibe, genre, mood, or BPM — getting exactly what they need without back-and-forth.",
    color: DESIGN_SYSTEM.colors.brand.purple,
  },
  {
    icon: <MessageCircle size={24} />,
    title: "Every track is pitch-ready from day one",
    desc: "Standardized metadata means executives can make decisions faster. No missing info, no follow-up emails.",
    color: DESIGN_SYSTEM.colors.brand.blue,
  },
  {
    icon: <Users size={24} />,
    title: "Apply to real briefs with real budgets",
    desc: "Executives post briefs with genres, deadlines, and budget ranges. Composers apply in one click with a curated pitch.",
    color: DESIGN_SYSTEM.colors.accent.amber,
  },
  {
    icon: <Shield size={24} />,
    title: "Skip the middleman entirely",
    desc: "Direct messaging, verified split sheets, and One-Stop badges — everything to close a deal without leaving the platform.",
    color: DESIGN_SYSTEM.colors.accent.green,
  },
];

const PRICING_TIERS = [
  {
    name: "Free",
    price: "Free",
    period: "during Early Access",
    badge: null,
    color: DESIGN_SYSTEM.colors.border.light,
    features: [
      "Up to 5 tracks in your vault",
      "AI auto-tagging on every upload",
      "Browse & apply to opportunities",
      "Basic split sheet generator",
      "Direct messaging",
    ],
    cta: "Get Started Free",
    highlight: false,
  },
  {
    name: "Composer Pro",
    price: "Coming Soon",
    period: "",
    badge: "Most Popular",
    color: DESIGN_SYSTEM.colors.brand.primary,
    features: [
      "Unlimited tracks",
      "Unlimited opportunity applications",
      "Priority placement in executive search",
      "AI pitch writing helper",
      "Advanced split sheet management",
      "Lyrics transcription",
    ],
    cta: "Join Waitlist",
    highlight: true,
  },
  {
    name: "Executive Pro",
    price: "Coming Soon",
    period: "",
    badge: null,
    color: DESIGN_SYSTEM.colors.brand.accent,
    features: [
      "Unlimited opportunity postings",
      "AI brief writer",
      "Advanced composer search filters",
      "BPM & mood range filtering",
      "Bulk shortlist & export",
      "Priority support",
    ],
    cta: "Join Waitlist",
    highlight: false,
  },
];

function FAQItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        border: `1px solid ${open ? DESIGN_SYSTEM.colors.brand.primary + '40' : DESIGN_SYSTEM.colors.border.light}`,
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        background: open ? `${DESIGN_SYSTEM.colors.brand.primary}08` : DESIGN_SYSTEM.colors.bg.card,
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 24px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          gap: 16,
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 600 }}>{item.q}</span>
        {open
          ? <ChevronUp size={18} color={DESIGN_SYSTEM.colors.brand.primary} style={{ flexShrink: 0 }} />
          : <ChevronDown size={18} color={DESIGN_SYSTEM.colors.text.tertiary} style={{ flexShrink: 0 }} />}
      </button>
      {open && (
        <div style={{ padding: '0 24px 18px', color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 15, lineHeight: 1.7 }}>
          {item.a}
        </div>
      )}
    </div>
  );
}

export function LandingPage({ onGetStarted, onLegalPage }) {
  return (
    <div className="hero-animated-bg" style={{
      minHeight: "100vh",
      fontFamily: "'Outfit', sans-serif",
      color: DESIGN_SYSTEM.colors.text.primary,
      overflow: "auto"
    }}>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: "20px 48px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
        position: 'sticky',
        top: 0,
        background: 'rgba(10,10,12,0.90)',
        backdropFilter: 'blur(12px)',
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/songpitch-logo.png" alt="SongPitch" style={{ width: 36, height: 36, objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
          <div style={{ fontSize: 22, fontWeight: 800, background: DESIGN_SYSTEM.colors.gradient.main, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SongPitch</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: `${DESIGN_SYSTEM.colors.brand.primary}20`,
            border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}40`,
            borderRadius: 20, padding: '4px 12px',
            color: DESIGN_SYSTEM.colors.brand.primary,
            fontSize: 12, fontWeight: 700, letterSpacing: '0.5px',
          }}>
            EARLY ACCESS
          </div>
          <button
            onClick={onGetStarted}
            style={{
              background: DESIGN_SYSTEM.colors.gradient.main,
              color: DESIGN_SYSTEM.colors.text.primary,
              border: "none", borderRadius: 10, padding: "10px 24px",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
              boxShadow: '0 4px 16px rgba(29,185,84,0.3)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(29,185,84,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(29,185,84,0.3)'; }}
          >
            Sign In / Sign Up
          </button>
        </div>
      </div>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 48px 60px", textAlign: "center" }}>
        <div style={{ marginBottom: 24 }}>
          <img
            src="/songpitch-logo.png" alt="SongPitch"
            style={{ width: 80, height: 80, objectFit: 'contain', filter: 'drop-shadow(0 4px 24px rgba(29,185,84,0.35))', animation: 'fadeInUp 0.6s ease-out' }}
          />
        </div>

        {/* Founding Member badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: `${DESIGN_SYSTEM.colors.brand.primary}15`,
            border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}35`,
            borderRadius: 24, padding: '8px 18px',
          }}>
            <Star size={14} color={DESIGN_SYSTEM.colors.brand.primary} fill={DESIGN_SYSTEM.colors.brand.primary} />
            <span style={{ color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 13, fontWeight: 700 }}>
              Founding Member Access — Free While We Build
            </span>
          </div>
        </div>

        <h1 style={{ fontSize: 56, fontWeight: 900, marginBottom: 20, lineHeight: 1.15, letterSpacing: "-1.5px" }}>
          Where{' '}
          <span style={{ background: DESIGN_SYSTEM.colors.gradient.main, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Composers
          </span>{' '}
          Meet{' '}
          <span style={{ background: DESIGN_SYSTEM.colors.gradient.main, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Music Supervisors
          </span>
        </h1>

        <p style={{ fontSize: 20, color: DESIGN_SYSTEM.colors.text.secondary, maxWidth: 640, margin: "0 auto 40px", lineHeight: 1.7 }}>
          The AI-powered sync licensing platform that handles the metadata, split sheets, and pitching — so you can focus on the music.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 48 }}>
          <button
            onClick={onGetStarted}
            style={{
              background: DESIGN_SYSTEM.colors.gradient.main, color: DESIGN_SYSTEM.colors.text.primary,
              border: "none", borderRadius: 12, padding: "16px 40px", fontSize: 17, fontWeight: 700,
              cursor: "pointer", fontFamily: "'Outfit', sans-serif",
              boxShadow: '0 8px 28px rgba(29,185,84,0.4)', transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(29,185,84,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(29,185,84,0.4)'; }}
          >
            Join Free — No Credit Card
          </button>
          <a
            href="#demo"
            onClick={(e) => { e.preventDefault(); document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' }); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'transparent', color: DESIGN_SYSTEM.colors.text.secondary,
              border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
              borderRadius: 12, padding: "16px 32px", fontSize: 16, fontWeight: 600,
              cursor: "pointer", fontFamily: "'Outfit', sans-serif", textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.primary + '60'; e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.primary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light; e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.secondary; }}
          >
            <Play size={15} fill="currentColor" /> Watch Demo
          </a>
        </div>

        {/* Trust bar */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, flexWrap: 'wrap', opacity: 0.7 }}>
          {[
            { label: 'Founding Member Spots', value: '500' },
            { label: 'Built for Sync', value: '100%' },
            { label: 'Free to Join', value: 'Now' },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: DESIGN_SYSTEM.colors.brand.primary }}>{value}</div>
              <div style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.tertiary, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Demo Video ──────────────────────────────────────────────────── */}
      <div id="demo-section" style={{ maxWidth: 900, margin: "0 auto", padding: "0 48px 80px" }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>See It In Action</h2>
        <p style={{ fontSize: 16, color: DESIGN_SYSTEM.colors.text.secondary, textAlign: "center", marginBottom: 32 }}>
          A full walkthrough of uploading tracks, running AI analysis, and pitching to a brief.
        </p>
        <div style={{
          borderRadius: 20, overflow: 'hidden',
          border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          background: DESIGN_SYSTEM.colors.bg.card,
          aspectRatio: '16/9',
        }}>
          {/* Place your trimmed video file as /public/demo-video.mp4 */}
          <video
            src="/demo-video.mp4"
            controls
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            poster="/logo512.png"
          >
            Your browser does not support the video tag.
          </video>
        </div>
        <p style={{ textAlign: 'center', color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, marginTop: 12 }}>
          Full 8-minute tutorial available after sign-up
        </p>
      </div>

      {/* ── Value Props: For Executives & Composers ─────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px 80px" }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, textAlign: "center", marginBottom: 48 }}>What does it do?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32 }}>
          {[
            {
              accent: DESIGN_SYSTEM.colors.brand.accent,
              icon: <Search size={28} color={DESIGN_SYSTEM.colors.brand.accent} />,
              title: "For Music Executives",
              points: [
                "No more messy Dropbox links or expired Google Drive folders",
                "Filter by genre, vibe, mood, or BPM — find exactly what you need in seconds",
                "Every track is pre-tagged, pre-screened, and pitch-ready",
                "Post briefs with budgets and deadlines, receive curated applications",
              ],
            },
            {
              accent: DESIGN_SYSTEM.colors.brand.purple,
              icon: <Music size={28} color={DESIGN_SYSTEM.colors.brand.purple} />,
              title: "For Composers & Producers",
              points: [
                "AI auto-tags your genre, mood, and BPM in under a minute",
                "Build a private, secure track vault with verified rights documentation",
                "Generate and publish split sheets without legal back-and-forth",
                "Pitch directly to real industry briefs — no cold emails needed",
              ],
            },
          ].map(({ accent, icon, title, points }) => (
            <div key={title} style={{
              background: `${accent}06`, border: `1px solid ${accent}25`,
              borderRadius: 16, padding: 36, transition: 'all 0.3s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = accent + '50'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${accent}18`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = accent + '25'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ width: 56, height: 56, borderRadius: 14, background: `${accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                {icon}
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>{title}</h3>
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {points.map(p => (
                  <li key={p} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <CheckCircle size={16} color={accent} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ color: DESIGN_SYSTEM.colors.text.secondary, lineHeight: 1.6, fontSize: 15 }}>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Feature Grid ────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px 80px" }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, textAlign: "center", marginBottom: 12, background: DESIGN_SYSTEM.colors.gradient.main, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Everything in one platform
        </h2>
        <p style={{ fontSize: 16, color: DESIGN_SYSTEM.colors.text.secondary, textAlign: "center", maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7 }}>
          Every tool you need to discover, pitch, and close sync deals — without switching apps.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{
              background: DESIGN_SYSTEM.colors.bg.card,
              border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
              borderRadius: 16, padding: 24, transition: 'all 0.3s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = f.color + '50'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${f.color}18`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 11, background: `${f.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: f.color }}>
                {f.icon}
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: DESIGN_SYSTEM.colors.text.primary, lineHeight: 1.4 }}>{f.title}</h4>
              <p style={{ fontSize: 13, color: DESIGN_SYSTEM.colors.text.secondary, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Trust Signals: Rights-Ready ─────────────────────────────────── */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 48px 80px" }}>
        <div style={{
          background: DESIGN_SYSTEM.colors.bg.card,
          border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
          borderRadius: 20, padding: '48px 40px', textAlign: 'center',
        }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Every track is rights-ready</h2>
          <p style={{ fontSize: 15, color: DESIGN_SYSTEM.colors.text.secondary, maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.7 }}>
            Before any track reaches your search results, the legal infrastructure is already in place.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {[
              {
                icon: <Lock size={22} />,
                color: DESIGN_SYSTEM.colors.brand.primary,
                title: 'Verified Split Sheets',
                desc: 'Every track has a documented composition and master split sheet before it appears in search results.',
              },
              {
                icon: <CheckCircle size={22} />,
                color: DESIGN_SYSTEM.colors.brand.blue,
                title: 'PRO-Registered Composers',
                desc: "Composers connect their ASCAP, BMI, SESAC, or SOCAN registration so you know who you're dealing with.",
              },
              {
                icon: <Zap size={22} />,
                color: DESIGN_SYSTEM.colors.accent.amber,
                title: 'One-Stop Priority',
                desc: 'Filter for 100% One-Stop tracks — master and publishing owned by one person. Faster clearance, fewer conversations.',
              },
            ].map(({ icon, color, title, desc }) => (
              <div key={title} style={{ background: `${color}08`, border: `1px solid ${color}22`, borderRadius: 14, padding: 24 }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color }}>
                  {icon}
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{title}</h4>
                <p style={{ fontSize: 13, color: DESIGN_SYSTEM.colors.text.secondary, lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px 80px" }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>Simple, Transparent Pricing</h2>
        <p style={{ fontSize: 16, color: DESIGN_SYSTEM.colors.text.secondary, textAlign: "center", marginBottom: 40 }}>
          Free during our Founding Member period. Pro plans coming soon — founding members lock in early pricing.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'start' }}>
          {PRICING_TIERS.map((tier) => (
            <div key={tier.name} style={{
              background: tier.highlight ? `${DESIGN_SYSTEM.colors.brand.primary}12` : DESIGN_SYSTEM.colors.bg.card,
              border: `2px solid ${tier.highlight ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.border.light}`,
              borderRadius: 20, padding: '32px 28px',
              position: 'relative',
              boxShadow: tier.highlight ? `0 8px 32px ${DESIGN_SYSTEM.colors.brand.primary}25` : 'none',
            }}>
              {tier.badge && (
                <div style={{
                  position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                  background: DESIGN_SYSTEM.colors.brand.primary, color: '#000',
                  fontSize: 11, fontWeight: 800, padding: '4px 14px', borderRadius: 20,
                  letterSpacing: '0.5px', whiteSpace: 'nowrap',
                }}>
                  {tier.badge}
                </div>
              )}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{tier.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: tier.highlight ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.primary }}>{tier.price}</span>
                  {tier.period && <span style={{ fontSize: 13, color: DESIGN_SYSTEM.colors.text.tertiary }}>{tier.period}</span>}
                </div>
              </div>
              <ul style={{ listStyle: 'none', margin: '0 0 28px', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tier.features.map(f => (
                  <li key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <CheckCircle size={15} color={tier.highlight ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.accent.green} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: DESIGN_SYSTEM.colors.text.secondary, lineHeight: 1.5 }}>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={onGetStarted}
                style={{
                  width: '100%',
                  background: tier.highlight ? DESIGN_SYSTEM.colors.brand.primary : 'transparent',
                  color: tier.highlight ? '#000' : DESIGN_SYSTEM.colors.text.secondary,
                  border: `1px solid ${tier.highlight ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.border.light}`,
                  borderRadius: 10, padding: '12px 20px',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Outfit', sans-serif",
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "0 48px 80px" }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>Frequently Asked Questions</h2>
        <p style={{ fontSize: 16, color: DESIGN_SYSTEM.colors.text.secondary, textAlign: "center", marginBottom: 40 }}>
          Everything you need to know before you sign up.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FAQ_ITEMS.map(item => <FAQItem key={item.q} item={item} />)}
        </div>
      </div>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 48px 100px", textAlign: "center" }}>
        <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>Ready to Connect?</h2>
        <p style={{ fontSize: 17, color: DESIGN_SYSTEM.colors.text.secondary, marginBottom: 36, lineHeight: 1.7 }}>
          Be one of the first founding members. Free during Early Access — lock in your spot before we open to the public.
        </p>
        <button
          onClick={onGetStarted}
          style={{
            background: DESIGN_SYSTEM.colors.gradient.main, color: DESIGN_SYSTEM.colors.text.primary,
            border: "none", borderRadius: 14, padding: "20px 52px", fontSize: 18, fontWeight: 700,
            cursor: "pointer", fontFamily: "'Outfit', sans-serif",
            boxShadow: '0 8px 28px rgba(29,185,84,0.4)', transition: 'all 0.3s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(29,185,84,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(29,185,84,0.4)'; }}
        >
          Get Started Free →
        </button>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, padding: "40px 48px", textAlign: "center" }}>
        <p style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 14, marginBottom: 10 }}>
          Questions? We'd love to hear from you.
        </p>
        <a
          href="mailto:hello@songpitchhub.com"
          style={{ color: DESIGN_SYSTEM.colors.brand.accent, fontSize: 15, fontWeight: 600, textDecoration: "none" }}
          onMouseEnter={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.blue}
          onMouseLeave={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.accent}
        >
          hello@songpitchhub.com
        </a>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Terms of Service', page: 'terms' },
            { label: 'Privacy Policy', page: 'privacy' },
            { label: 'DMCA Policy', page: 'dmca' },
          ].map(({ label, page }) => (
            <a key={page} href={`#${page}`} onClick={(e) => { e.preventDefault(); onLegalPage(page); }}
              style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
              {label}
            </a>
          ))}
        </div>
        <p style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, marginTop: 16 }}>
          © {new Date().getFullYear()} SongPitch. Where talent meets opportunity.
        </p>
      </div>
    </div>
  );
}
