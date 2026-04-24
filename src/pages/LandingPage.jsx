import { useState, useEffect, useRef } from 'react';
import { Search, Music, Briefcase, Headphones, MessageCircle, Users, Shield, ChevronDown, ChevronUp, Play, Star, CheckCircle, Lock, Zap, Wand2, FileText, Download } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

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
    a: "Coda-Vault has a free tier that's yours to keep — no credit card required. Basic and Pro plans unlock advanced features like contract analysis, unlimited uploads, and the full LegalSplits ML suite. Use code FOUNDER2026 for 6 months free on any Pro plan."
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

const PRICING_GROUPS = [
  {
    group: "🎵 For Composers",
    tiers: [
      {
        name: "Free",
        price: "Free",
        period: "forever",
        badge: null,
        features: [
          "3 song uploads per week",
          "Public split card visible to executives",
          "AI auto-tagging on every upload",
          "5 executive contacts / month",
          "3 opportunity applications / month",
          "Direct messaging",
        ],
        cta: "Get Started Free",
        highlight: false,
      },
      {
        name: "Basic",
        price: "$4.99",
        period: "/ month",
        badge: null,
        features: [
          "Unlimited song uploads",
          "Full contract analysis on splits tab",
          "PRO & IPI auto-enrichment via LegalSplits ML",
          "Verified badge on profile & songs",
          "25 exec contacts / month",
          "10 opportunity applications / month",
        ],
        cta: "Get Basic",
        highlight: false,
      },
      {
        name: "Pro",
        price: "$9.99",
        period: "/ month",
        badge: "Most Popular",
        founderOffer: true,
        features: [
          "Everything in Basic",
          "Deal Analyzer — upload any recording deal PDF",
          "Agreement Reader (co-pub, publishing, 360)",
          "Benchmarked against 460 real music contracts",
          "Recoupment timeline & red flag detection",
          "Unlimited contacts & applications",
        ],
        cta: "Get Pro",
        highlight: true,
      },
    ],
  },
  {
    group: "🏢 For Executives",
    tiers: [
      {
        name: "Free",
        price: "Free",
        period: "forever",
        badge: null,
        features: [
          "Browse full catalog",
          "30-second song previews",
          "See public split cards & verified badges",
          "5 composer contacts / month",
          "3 opportunity postings / month",
          "Basic search",
        ],
        cta: "Get Started Free",
        highlight: false,
      },
      {
        name: "Basic",
        price: "$5.99",
        period: "/ month",
        badge: null,
        features: [
          "Full previews + advanced filters",
          "25 composer contacts / month",
          "10 opportunity postings / month",
          "Save up to 5 shortlists",
          "Contract Revision via LegalSplits ML (3/month)",
          "Contract Vault — save your revisions",
        ],
        cta: "Get Basic",
        highlight: false,
      },
      {
        name: "Pro",
        price: "$14.99",
        period: "/ month",
        badge: "Luxury",
        founderOffer: true,
        features: [
          "Everything in Basic",
          "Unlimited contacts & opportunity postings",
          "Unlimited contract revisions & vault",
          "Export split sheets as PDF or CSV",
          "Market analytics — trending genres & composers",
          "Priority placement on your postings",
        ],
        cta: "Get Pro",
        highlight: false,
      },
    ],
  },
];

function FAQItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        border: `1px solid ${open ? DESIGN_SYSTEM.colors.brand.primary + '40' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        background: open ? 'rgba(201,168,76,0.06)' : 'rgba(18,20,31,0.42)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
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
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
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

const NAV_LINKS = [
  { label: 'Our Story', id: 'our-story' },
  { label: 'Who is it for?', id: 'who-for' },
  { label: 'How it works', id: 'how-it-works' },
  { label: 'Features', id: 'features' },
  { label: 'Pricing', id: 'pricing' },
  { label: 'FAQ', id: 'faq' },
];

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

function useCountUp(target, duration = 1800, startOnVisible = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!startOnVisible) {
      startCounting();
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !hasStarted) { setHasStarted(true); startCounting(); observer.disconnect(); } },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();

    function startCounting() {
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(eased * target));
        if (progress < 1) requestAnimationFrame(step);
        else setCount(target);
      };
      requestAnimationFrame(step);
    }
  }, [target, duration, hasStarted, startOnVisible]);

  return { count, ref };
}

function StatCounter({ value, suffix, label, color }) {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', color: color || DESIGN_SYSTEM.colors.brand.primary, lineHeight: 1, fontFamily: DESIGN_SYSTEM.font.display }}>
        {count}{suffix}
      </div>
      <div style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

const SCREEN_SLIDES = {
  composer: [
    { src: '/screen_composer_portfolio.jpg', caption: '🎵 My Portfolio', desc: 'Tracks live on the catalog' },
    { src: '/screen_composer_opportunities.jpg', caption: '📋 Browse Briefs', desc: 'Great Match briefs ready to apply' },
    { src: '/screen_composer_vault.jpg', caption: '🗄 Deal Vault', desc: 'AI-analyzed contracts saved' },
  ],
  executive: [
    { src: '/screen_exec_catalog.jpg', caption: '🔍 Search Catalog', desc: '19 tracks from verified composers' },
    { src: '/screen_exec_opportunities.jpg', caption: '📣 My Opportunities', desc: 'Open briefs with budgets & deadlines' },
    { src: '/screen_exec_vault.jpg', caption: '🗄 Contract Vault', desc: '5 AI-reviewed contracts saved' },
  ],
};

/* ── Feature Videos Component ────────────────────────────────────────────── */
const COMPOSER_VIDEOS = [
  { src: '/composer_pitch.mp4', title: 'Pitch Your Music', desc: 'Apply to sync briefs with AI-polished pitches in seconds' },
  { src: '/composer_design.mp4', title: 'Your Portfolio', desc: 'Upload, tag, and manage your entire catalog in one place' },
  { src: '/composer_screen.mp4', title: 'AI Deal Analyzer', desc: 'Upload any contract and get plain-English analysis instantly' },
];

const EXECUTIVE_VIDEOS = [
  { src: '/exec_video1.mp4', title: 'Search the Catalog', desc: 'Find exactly the track you need — filter by mood, genre, BPM, and rights' },
  { src: '/exec_video2.mp4', title: 'Review & Shortlist', desc: 'Compare pitches, shortlist favourites, and send offers in one click' },
];

function FeatureVideos({ isMobile }) {
  const [tab, setTab] = useState('composer');
  const [activeIdx, setActiveIdx] = useState(0);
  const videoRef = useRef(null);

  const videos = tab === 'composer' ? COMPOSER_VIDEOS : EXECUTIVE_VIDEOS;
  const current = videos[activeIdx] || videos[0];
  const accentColor = tab === 'composer' ? DESIGN_SYSTEM.colors.brand.primary : '#8B5CF6';

  const go = (dir) => {
    setActiveIdx(i => (i + dir + videos.length) % videos.length);
    if (videoRef.current) { videoRef.current.load(); videoRef.current.play().catch(() => {}); }
  };

  return (
    <div style={{ padding: isMobile ? '60px 20px' : '80px 48px', background: 'rgba(8,10,18,0.6)', borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>See It In Action</p>
          <h2 style={{ fontFamily: DESIGN_SYSTEM.font.display, fontSize: isMobile ? 28 : 42, fontWeight: 700, letterSpacing: '-0.02em', color: DESIGN_SYSTEM.colors.text.primary, margin: '0 0 24px' }}>
            What you can do
          </h2>
          {/* Tabs */}
          <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.04)', border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 12, padding: 4, gap: 4 }}>
            {[{ key: 'composer', label: '🎵 For Composers' }, { key: 'executive', label: '🎬 For Executives' }].map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setActiveIdx(0); }}
                style={{ background: tab === t.key ? (t.key === 'composer' ? `${DESIGN_SYSTEM.colors.brand.primary}22` : 'rgba(139,92,246,0.2)') : 'transparent', color: tab === t.key ? (t.key === 'composer' ? DESIGN_SYSTEM.colors.brand.primary : '#8B5CF6') : DESIGN_SYSTEM.colors.text.muted, border: tab === t.key ? `1px solid ${t.key === 'composer' ? DESIGN_SYSTEM.colors.brand.primary : '#8B5CF6'}44` : '1px solid transparent', borderRadius: 9, padding: '8px 20px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: "'Inter', -apple-system, sans-serif", transition: 'all 0.2s' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="reveal">
          {/* Video player */}
          <div style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid ${accentColor}33`, boxShadow: `0 24px 80px ${accentColor}18`, position: 'relative', background: '#000' }}>
            <video ref={videoRef} key={current.src} autoPlay muted loop playsInline
              style={{ width: '100%', display: 'block', maxHeight: 520, objectFit: 'contain' }}>
              <source src={current.src} type="video/mp4" />
            </video>
            {videos.length > 1 && (
              <>
                <button onClick={() => go(-1)} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: `1px solid ${accentColor}44`, borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 18, backdropFilter: 'blur(6px)' }}>‹</button>
                <button onClick={() => go(1)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: `1px solid ${accentColor}44`, borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 18, backdropFilter: 'blur(6px)' }}>›</button>
              </>
            )}
          </div>
          {/* Caption + dots */}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: DESIGN_SYSTEM.colors.text.primary, marginBottom: 6 }}>{current.title}</div>
            <div style={{ fontSize: 14, color: DESIGN_SYSTEM.colors.text.secondary, marginBottom: 16 }}>{current.desc}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              {videos.map((_, i) => (
                <button key={i} onClick={() => { setActiveIdx(i); if (videoRef.current) { videoRef.current.load(); videoRef.current.play().catch(() => {}); } }}
                  style={{ width: i === activeIdx ? 24 : 8, height: 8, borderRadius: 4, background: i === activeIdx ? accentColor : `${accentColor}44`, border: 'none', cursor: 'pointer', transition: 'all 0.25s', padding: 0 }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── ML Systems Section ───────────────────────────────────────────────────── */
function MLSystemsSection({ isMobile }) {
  return (
    <div style={{ padding: isMobile ? '60px 20px' : '80px 48px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Powered by AI</p>
          <h2 style={{ fontFamily: DESIGN_SYSTEM.font.display, fontSize: isMobile ? 28 : 42, fontWeight: 700, letterSpacing: '-0.02em', color: DESIGN_SYSTEM.colors.text.primary, margin: '0 0 14px' }}>
            Two proprietary ML systems,<br />built specifically for music
          </h2>
          <p style={{ fontSize: 16, color: DESIGN_SYSTEM.colors.text.secondary, maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
            Generic AI tools weren't built for sync licensing. Ours are.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24 }}>
          {/* Song Analyzer AI */}
          <div className="reveal" style={{ borderRadius: 20, padding: isMobile ? '28px 24px' : '36px 32px', background: 'rgba(18,20,31,0.6)', border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}22`, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: `${DESIGN_SYSTEM.colors.brand.primary}18`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🎧</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, color: DESIGN_SYSTEM.colors.text.primary, fontFamily: DESIGN_SYSTEM.font.display }}>Song Analyzer AI</div>
                <div style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.brand.primary, fontWeight: 600, marginTop: 2 }}>Audio Intelligence Engine</div>
              </div>
            </div>
            <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 14, lineHeight: 1.75, margin: '0 0 20px' }}>
              Upload any audio file and our ML model instantly detects genre, mood, BPM, and key — then transcribes lyrics using speech recognition. No manual tagging needed.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Genre & mood classification', 'BPM + key detection', 'Automatic lyric transcription', 'One-Stop rights verification'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: DESIGN_SYSTEM.colors.brand.primary, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: DESIGN_SYSTEM.colors.text.secondary }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* LegalSplits ML */}
          <div className="reveal reveal-delay-1" style={{ borderRadius: 20, padding: isMobile ? '28px 24px' : '36px 32px', background: 'rgba(18,20,31,0.6)', border: '1px solid rgba(139,92,246,0.22)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>⚖️</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, color: DESIGN_SYSTEM.colors.text.primary, fontFamily: DESIGN_SYSTEM.font.display }}>LegalSplits ML</div>
                <div style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 600, marginTop: 2 }}>Music Rights Intelligence</div>
              </div>
            </div>
            <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 14, lineHeight: 1.75, margin: '0 0 20px' }}>
              Upload any recording deal, publishing agreement, or co-pub contract. Our AI flags unfair clauses, explains every term in plain English, and gives you a deal score — in seconds.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Contract clause analysis & scoring', 'Split sheet verification', 'PRO & IPI registration lookup', 'Controlled composition detection'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8B5CF6', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: DESIGN_SYSTEM.colors.text.secondary }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage({ onGetStarted, onLegalPage }) {
  const [activeSection, setActiveSection] = useState('');
  const [howTab, setHowTab] = useState('composer'); // 'composer' | 'executive'
  const [screenIdx, setScreenIdx] = useState(0); // 0-2 within current role
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const { canInstall, install } = useInstallPrompt();

  useScrollReveal();

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); });
      },
      { threshold: 0.3 }
    );
    NAV_LINKS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="hero-animated-bg" style={{
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: DESIGN_SYSTEM.colors.text.primary,
      overflow: "auto"
    }}>

      {/* ── Animated gradient orbs (background layer) ─────────────────── */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
        <div style={{
          position: 'absolute', top: '4%', left: '3%',
          width: 720, height: 720, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.28) 0%, transparent 65%)',
          filter: 'blur(80px)',
          animation: 'orbDrift1 32s ease-in-out infinite',
          willChange: 'transform',
        }} />
        <div style={{
          position: 'absolute', top: '38%', right: '-4%',
          width: 620, height: 620, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 65%)',
          filter: 'blur(90px)',
          animation: 'orbDrift2 40s ease-in-out infinite',
          willChange: 'transform',
        }} />
        <div style={{
          position: 'absolute', bottom: '8%', left: '28%',
          width: 520, height: 520, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.16) 0%, transparent 65%)',
          filter: 'blur(100px)',
          animation: 'orbDrift3 26s ease-in-out infinite',
          willChange: 'transform',
        }} />
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      {/* 64px spacer so fixed nav doesn't overlap hero content */}
      <div style={{ height: 64, flexShrink: 0 }} />
      <nav style={{
        padding: isMobile ? "0 20px" : "0 48px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: scrolled ? `1px solid ${DESIGN_SYSTEM.colors.border.light}` : '1px solid transparent',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 64,
        background: scrolled ? 'rgba(8,10,18,0.92)' : 'rgba(8,10,18,0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: scrolled ? '0 1px 0 rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.3s ease',
        zIndex: 1000,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <img src="/songpitch-logo.png" alt="Coda-Vault" style={{ width: 32, height: 32, objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
          <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, background: DESIGN_SYSTEM.colors.gradient.main, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.3px' }}>Coda-Vault</div>
        </div>

        {/* Center nav links — desktop only */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {NAV_LINKS.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '6px 14px', borderRadius: 8,
                  fontSize: 13, fontWeight: 500,
                  color: activeSection === id ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.secondary,
                  fontFamily: DESIGN_SYSTEM.font.body,
                  transition: 'all 0.2s ease',
                  borderBottom: activeSection === id ? `2px solid ${DESIGN_SYSTEM.colors.brand.primary}` : '2px solid transparent',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.primary; }}
                onMouseLeave={e => { e.currentTarget.style.color = activeSection === id ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.secondary; }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Right side: desktop CTA or mobile hamburger + join button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {!isMobile && (
            <div style={{
              background: `${DESIGN_SYSTEM.colors.brand.primary}15`,
              border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}35`,
              borderRadius: 20, padding: '3px 10px',
              color: DESIGN_SYSTEM.colors.brand.primary,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.6px',
            }}>
              EARLY ACCESS
            </div>
          )}
          <button
            onClick={onGetStarted}
            style={{
              background: DESIGN_SYSTEM.colors.gradient.main,
              color: '#0D0B0F',
              border: "none", borderRadius: 8, padding: isMobile ? "8px 16px" : "9px 22px",
              fontSize: isMobile ? 12 : 13, fontWeight: 700, cursor: "pointer",
              fontFamily: DESIGN_SYSTEM.font.body,
              boxShadow: '0 4px 16px rgba(201,168,76,0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(201,168,76,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,168,76,0.3)'; }}
          >
            {isMobile ? 'Join Free' : 'Sign In / Sign Up'}
          </button>
          {/* Hamburger — mobile only */}
          {isMobile && (
            <button
              onClick={() => setMobileNavOpen(o => !o)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: DESIGN_SYSTEM.colors.text.primary, fontSize: 22,
                padding: '4px 6px', lineHeight: 1,
              }}
              aria-label="Toggle menu"
            >
              {mobileNavOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </nav>

      {/* ── Mobile nav dropdown ───────────────────────────────────────── */}
      {isMobile && mobileNavOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0,
          background: 'rgba(8,10,18,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
          zIndex: 999,
          display: 'flex', flexDirection: 'column',
          padding: '12px 0 20px',
        }}>
          {NAV_LINKS.map(({ label, id }) => (
            <button
              key={id}
              onClick={() => { scrollTo(id); setMobileNavOpen(false); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '14px 24px', textAlign: 'left',
                fontSize: 16, fontWeight: 500,
                color: activeSection === id ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.secondary,
                fontFamily: DESIGN_SYSTEM.font.body,
                transition: 'color 0.2s ease',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "60px 20px 40px" : "80px 48px 60px", textAlign: "center" }}>

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

        <h1 style={{ fontSize: isMobile ? 48 : 88, fontWeight: 800, marginBottom: 20, lineHeight: 1.0, letterSpacing: '-0.03em', fontFamily: DESIGN_SYSTEM.font.display }}>
          Where{' '}
          <span style={{ background: DESIGN_SYSTEM.colors.gradient.main, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Composers
          </span>{' '}
          Meet{' '}
          <span style={{ background: DESIGN_SYSTEM.colors.gradient.main, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Music Supervisors
          </span>
        </h1>

        <p style={{ fontSize: isMobile ? 16 : 20, color: DESIGN_SYSTEM.colors.text.secondary, maxWidth: isMobile ? '100%' : 560, margin: "0 auto 40px", lineHeight: 1.7 }}>
          The AI-powered sync licensing platform that handles the metadata, split sheets, and pitching — so you can focus on the music.
        </p>

        <div className="reveal reveal-delay-1" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 48 }}>
          <button
            onClick={onGetStarted}
            className="cta-primary"
            style={{
              background: DESIGN_SYSTEM.colors.gradient.main, color: DESIGN_SYSTEM.colors.text.primary,
              border: "none", borderRadius: 12, padding: "16px 40px", fontSize: 17, fontWeight: 700,
              cursor: "pointer", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              boxShadow: '0 8px 28px rgba(201,168,76,0.4)', transition: 'all 0.3s ease',
              width: isMobile ? '100%' : 'auto',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(201,168,76,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(201,168,76,0.4)'; }}
          >
            Join Free — No Credit Card
          </button>
          <a
            href="#demo"
            onClick={(e) => { e.preventDefault(); document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="cta-secondary"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'transparent', color: DESIGN_SYSTEM.colors.text.secondary,
              border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
              borderRadius: 12, padding: "16px 32px", fontSize: 16, fontWeight: 600,
              cursor: "pointer", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", textDecoration: 'none',
              transition: 'all 0.2s ease',
              width: isMobile ? '100%' : 'auto',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.primary + '60'; e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.primary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light; e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.secondary; }}
          >
            <Play size={15} fill="currentColor" /> Watch Demo
          </a>
          {canInstall && (
            <button
              onClick={install}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'transparent', color: DESIGN_SYSTEM.colors.text.secondary,
                border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                borderRadius: 12, padding: '16px 32px', fontSize: 16, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                transition: 'all 0.2s ease',
                width: isMobile ? '100%' : 'auto',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.primary + '60'; e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.primary; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light; e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.secondary; }}
            >
              <Download size={15} /> Download the App
            </button>
          )}
        </div>

        {/* Trust bar */}
        <div className="reveal reveal-delay-2" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: isMobile ? 20 : 32, flexWrap: 'wrap', opacity: 0.7, marginBottom: 48 }}>
          <StatCounter value={500} suffix="+" label="Founding Member Spots" />
          <StatCounter value={100} suffix="%" label="Built for Sync" />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 800, letterSpacing: '-0.02em', color: DESIGN_SYSTEM.colors.brand.primary, lineHeight: 1, fontFamily: DESIGN_SYSTEM.font.display }}>Now</div>
            <div style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: isMobile ? 11 : 13, marginTop: 4, fontWeight: 500 }}>Free to Join</div>
          </div>
        </div>

        {/* Hero atmospheric image */}
        <div style={{
          borderRadius: 20, overflow: 'hidden', position: 'relative',
          aspectRatio: isMobile ? '4/3' : '16/7', maxWidth: 860, margin: '0 auto',
          border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
          boxShadow: '0 32px 80px rgba(0,0,0,0.65)',
        }}>
          <img
            src="https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=1400&q=80&auto=format&fit=crop"
            alt="Music production studio"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.7 }}
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1400&q=80&auto=format&fit=crop'; }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,10,18,0.92) 0%, rgba(8,10,18,0.25) 55%, rgba(8,10,18,0.08) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(8,10,18,0.72)', backdropFilter: 'blur(10px)', border: `1px solid ${DESIGN_SYSTEM.colors.border.medium}`, borderRadius: 12, padding: '10px 22px' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: DESIGN_SYSTEM.colors.brand.primary, animation: 'goldPulse 2s ease-in-out infinite' }} />
              <span style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 500 }}>Where great music meets the right ears</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Our Story ───────────────────────────────────────────────────── */}
      <div id="our-story" style={{
        background: DESIGN_SYSTEM.colors.bg.secondary,
        borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
        borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
        padding: isMobile ? '60px 0' : '100px 0',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '0 20px' : '0 48px' }}>

          {/* Section label + title */}
          <div className="reveal" style={{ textAlign: 'center', marginBottom: isMobile ? 48 : 72 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)',
              borderRadius: 24, padding: '6px 18px', marginBottom: 20,
            }}>
              <span style={{ color: '#C9A84C', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em' }}>WHY WE BUILT THIS</span>
            </div>
            <h2 style={{
              fontSize: isMobile ? 30 : 48, fontWeight: 700, marginBottom: 16,
              fontFamily: DESIGN_SYSTEM.font.display, letterSpacing: '-0.01em',
              color: DESIGN_SYSTEM.colors.text.primary,
            }}>
              A problem nobody had solved.
            </h2>
            <p style={{
              fontSize: isMobile ? 15 : 17, color: DESIGN_SYSTEM.colors.text.secondary,
              maxWidth: 660, margin: '0 auto', lineHeight: 1.75,
            }}>
              I spent months building this platform because I saw a real problem nobody had
              solved — and I{' '}
              <em>couldn't ignore it.</em>
            </p>
          </div>

          {/* Two-sided problem */}
          <div className="reveal" style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? 16 : 24,
            marginBottom: isMobile ? 48 : 64,
          }}>
            {/* Composer side */}
            <div style={{
              background: 'rgba(201,168,76,0.05)',
              border: '1px solid rgba(201,168,76,0.15)',
              borderRadius: 20, padding: isMobile ? '28px 24px' : '36px 32px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>🎵</div>
                <span style={{ color: '#C9A84C', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em' }}>
                  THE COMPOSER'S REALITY
                </span>
              </div>
              <p style={{
                color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 15,
                lineHeight: 1.8, margin: 0,
              }}>
                You have the talent. You send emails that go unanswered. You upload your music to
                generic platforms where it disappears among millions of files. You wait.
                And wait. And wait.
              </p>
              <p style={{
                color: DESIGN_SYSTEM.colors.text.muted, fontSize: 14,
                lineHeight: 1.7, marginTop: 16, marginBottom: 0,
                borderTop: '1px solid rgba(201,168,76,0.1)', paddingTop: 16,
                fontStyle: 'italic',
              }}>
                Not because you're not good enough — because nobody built the infrastructure for you to get through.
              </p>
            </div>

            {/* Executive side */}
            <div style={{
              background: 'rgba(139,92,246,0.05)',
              border: '1px solid rgba(139,92,246,0.15)',
              borderRadius: 20, padding: isMobile ? '28px 24px' : '36px 32px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>🎯</div>
                <span style={{ color: DESIGN_SYSTEM.colors.brand.purple, fontSize: 13, fontWeight: 700, letterSpacing: '0.04em' }}>
                  THE EXECUTIVE'S REALITY
                </span>
              </div>
              <p style={{
                color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 15,
                lineHeight: 1.8, margin: 0,
              }}>
                You receive hundreds of emails a week — unlabeled files, Dropbox links, music
                with no documented rights. When you find something you love, weeks of paperwork
                stand between you and closing the deal.
              </p>
              <p style={{
                color: DESIGN_SYSTEM.colors.text.muted, fontSize: 14,
                lineHeight: 1.7, marginTop: 16, marginBottom: 0,
                borderTop: '1px solid rgba(139,92,246,0.1)', paddingTop: 16,
                fontStyle: 'italic',
              }}>
                For a project with a deadline, that process doesn't just slow things down — it kills the deal.
              </p>
            </div>
          </div>

          {/* Bridge statement */}
          <div className="reveal" style={{ textAlign: 'center', marginBottom: isMobile ? 48 : 64 }}>
            <p style={{
              fontSize: isMobile ? 18 : 22, fontWeight: 600,
              color: DESIGN_SYSTEM.colors.text.primary,
              fontFamily: DESIGN_SYSTEM.font.display,
              marginBottom: 12,
            }}>
              Nobody wins. Great music never reaches the people who need it.
            </p>
            <p style={{
              fontSize: isMobile ? 15 : 17, color: DESIGN_SYSTEM.colors.text.secondary,
              lineHeight: 1.75, maxWidth: 620, margin: '0 auto',
            }}>
              Coda-Vault is the infrastructure that was missing — the bridge between both sides,
              with all the legal and technical groundwork already done before the music ever
              reaches an executive. What normally takes three months to resolve,{' '}
              <strong style={{ color: DESIGN_SYSTEM.colors.text.primary }}>takes 24 hours.</strong>
            </p>
          </div>

          {/* Core purpose quote */}
          <div className="reveal" style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.1) 0%, rgba(201,168,76,0.04) 100%)',
            border: '1px solid rgba(201,168,76,0.25)',
            borderRadius: 24, padding: isMobile ? '32px 24px' : '48px 56px',
            textAlign: 'center', marginBottom: isMobile ? 48 : 64,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative quote mark */}
            <div style={{
              position: 'absolute', top: -10, left: 28,
              fontSize: 120, lineHeight: 1, color: 'rgba(201,168,76,0.07)',
              fontFamily: 'Georgia, serif', userSelect: 'none', pointerEvents: 'none',
            }}>"</div>
            <p style={{
              fontSize: isMobile ? 22 : 32, fontWeight: 700,
              color: '#C9A84C', fontFamily: DESIGN_SYSTEM.font.display,
              letterSpacing: '-0.01em', lineHeight: 1.35,
              margin: '0 0 24px', position: 'relative',
            }}>
              AI isn't here to replace artists.
              <br />It's here to clear their path.
            </p>
            <div style={{
              width: 40, height: 2, background: 'rgba(201,168,76,0.4)',
              margin: '0 auto 20px',
            }} />
            <p style={{
              color: DESIGN_SYSTEM.colors.text.muted, fontSize: 14,
              fontWeight: 600, letterSpacing: '0.04em', margin: 0,
            }}>
              — Macarena Angulo Nadeau, Founder &amp; CEO
            </p>
          </div>

          {/* Values */}
          <div className="reveal">
            <p style={{
              textAlign: 'center', color: DESIGN_SYSTEM.colors.text.muted,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', marginBottom: 20,
            }}>
              What we stand for
            </p>
            <div style={{
              display: 'flex', flexWrap: 'wrap',
              gap: 12, justifyContent: 'center',
            }}>
              {[
                { icon: '🔓', label: 'Access over exclusivity', desc: 'Talent determines opportunity — not contacts or resources.' },
                { icon: '🤝', label: 'Technology in service of the human', desc: 'AI exists to empower the artist. Never to replace them.' },
                { icon: '📋', label: 'Integrity first', desc: 'Every track, every contract, every deal is documented and honest.' },
                { icon: '✦', label: 'Simplicity', desc: "If it's complicated, it's because it hasn't been done right yet." },
              ].map(({ icon, label, desc }) => (
                <div key={label} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                  borderRadius: 14, padding: '18px 22px',
                  maxWidth: isMobile ? '100%' : 240,
                  flex: isMobile ? '1 1 100%' : '1 1 200px',
                }}>
                  <div style={{ fontSize: 20, marginBottom: 10 }}>{icon}</div>
                  <div style={{
                    color: DESIGN_SYSTEM.colors.text.primary,
                    fontSize: 13, fontWeight: 700, marginBottom: 6,
                    fontFamily: DESIGN_SYSTEM.font.display,
                  }}>{label}</div>
                  <div style={{
                    color: DESIGN_SYSTEM.colors.text.muted,
                    fontSize: 12, lineHeight: 1.6,
                  }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Who Is It For? ──────────────────────────────────────────────── */}
      <div id="who-for" style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "0 20px 60px" : "0 48px 100px" }}>

        {/* Section header */}
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 24, padding: '6px 20px', marginBottom: 20,
          }}>
            <span style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Built for both sides of the deal
            </span>
          </div>
          <h2 style={{
            fontFamily: DESIGN_SYSTEM.font.display,
            fontSize: isMobile ? 32 : 52, fontWeight: 600, letterSpacing: '0.01em',
            margin: '0 0 18px', color: DESIGN_SYSTEM.colors.text.primary,
            lineHeight: 1.15,
          }}>
            Who is Coda-Vault for?
          </h2>
          <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 17, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
            Two professionals. One platform. Every deal, handled.
          </p>
        </div>

        {/* Two-panel split */}
        <div style={{
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          borderRadius: 20, overflow: 'hidden',
          border: `1px solid ${DESIGN_SYSTEM.colors.border.medium}`,
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        }}>

          {/* — Composers panel — */}
          <div className="reveal reveal-delay-1" style={{
            background: 'linear-gradient(155deg, rgba(20,22,37,0.75) 0%, rgba(13,15,26,0.80) 100%)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            padding: isMobile ? '36px 24px' : '52px 44px', position: 'relative', overflow: 'hidden',
          }}>
            {/* bg glow */}
            <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(201,168,76,0.06)', pointerEvents: 'none', display: isMobile ? 'none' : 'block' }} />

            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.28)', borderRadius: 24, padding: '6px 14px', marginBottom: 32 }}>
              <Music size={13} color={DESIGN_SYSTEM.colors.brand.primary} />
              <span style={{ color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Composers & Producers
              </span>
            </div>

            <h3 style={{
              fontFamily: DESIGN_SYSTEM.font.display,
              fontSize: isMobile ? 26 : 34, fontWeight: 600, letterSpacing: '0.01em',
              margin: '0 0 14px', color: DESIGN_SYSTEM.colors.text.primary, lineHeight: 1.2,
            }}>
              Your music deserves<br />to be heard.
            </h3>
            <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 15, lineHeight: 1.75, margin: '0 0 32px' }}>
              Stop cold-emailing music supervisors. Upload your catalog, get AI-tagged in 60 seconds, and pitch directly to real industry briefs.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 40 }}>
              {[
                { icon: <Wand2 size={13} />, text: 'AI auto-tags genre, mood, BPM & key instantly' },
                { icon: <Lock size={13} />, text: 'Private, encrypted track vault — you control access' },
                { icon: <Briefcase size={13} />, text: 'Apply to real briefs with budgets & deadlines' },
                { icon: <FileText size={13} />, text: 'Generate verified split sheets in minutes' },
                { icon: <MessageCircle size={13} />, text: 'Direct line to music supervisors & A&Rs' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, color: DESIGN_SYSTEM.colors.brand.primary }}>
                    {icon}
                  </div>
                  <span style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 14, lineHeight: 1.6 }}>{text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onGetStarted}
              style={{
                background: DESIGN_SYSTEM.colors.gradient.main,
                border: 'none', borderRadius: 10, padding: '13px 28px',
                fontSize: 14, fontWeight: 700, color: '#0D0B0F',
                cursor: 'pointer', fontFamily: DESIGN_SYSTEM.font.body,
                boxShadow: '0 4px 20px rgba(201,168,76,0.35)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(201,168,76,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(201,168,76,0.35)'; }}
            >
              Join as a Composer →
            </button>

            {/* Composer panel image */}
            <div style={{ marginTop: 36, borderRadius: 12, overflow: 'hidden', position: 'relative', aspectRatio: '3/1.3', opacity: 0.85 }}>
              <img
                src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80&auto=format&fit=crop"
                alt="Composer at piano"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(8,10,18,0.5) 100%)' }} />
            </div>
          </div>

          {/* — Executives panel — */}
          <div className="reveal reveal-delay-2" style={{
            background: 'linear-gradient(155deg, rgba(15,17,32,0.75) 0%, rgba(8,10,18,0.80) 100%)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            padding: isMobile ? '36px 24px' : '52px 44px', position: 'relative', overflow: 'hidden',
            borderLeft: isMobile ? 'none' : `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
            borderTop: isMobile ? `1px solid ${DESIGN_SYSTEM.colors.border.light}` : 'none',
          }}>
            {/* bg glow */}
            <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(139,92,246,0.06)', pointerEvents: 'none', display: isMobile ? 'none' : 'block' }} />

            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.28)', borderRadius: 24, padding: '6px 14px', marginBottom: 32 }}>
              <Headphones size={13} color={DESIGN_SYSTEM.colors.accent.purple} />
              <span style={{ color: DESIGN_SYSTEM.colors.accent.purple, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Music Supervisors & A&Rs
              </span>
            </div>

            <h3 style={{
              fontFamily: DESIGN_SYSTEM.font.display,
              fontSize: isMobile ? 26 : 34, fontWeight: 600, letterSpacing: '0.01em',
              margin: '0 0 14px', color: DESIGN_SYSTEM.colors.text.primary, lineHeight: 1.2,
            }}>
              Find the right sound,<br />faster than ever.
            </h3>
            <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 15, lineHeight: 1.75, margin: '0 0 32px' }}>
              No more inbox chaos. Search a pre-cleared, metadata-rich catalog, post briefs, and receive curated pitches — all in one place.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 40 }}>
              {[
                { icon: <Search size={13} />, text: 'Natural language search by vibe, mood, or BPM' },
                { icon: <CheckCircle size={13} />, text: 'Every track pre-tagged, rights-documented' },
                { icon: <Zap size={13} />, text: 'Filter for One-Stop tracks — instant clearance' },
                { icon: <Users size={13} />, text: 'Post briefs, receive targeted composer applications' },
                { icon: <MessageCircle size={13} />, text: 'Message any composer on the platform directly' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, color: DESIGN_SYSTEM.colors.accent.purple }}>
                    {icon}
                  </div>
                  <span style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 14, lineHeight: 1.6 }}>{text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onGetStarted}
              style={{
                background: 'rgba(139,92,246,0.12)',
                border: '1px solid rgba(139,92,246,0.4)',
                borderRadius: 10, padding: '13px 28px',
                fontSize: 14, fontWeight: 700, color: DESIGN_SYSTEM.colors.accent.purple,
                cursor: 'pointer', fontFamily: DESIGN_SYSTEM.font.body,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.20)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.12)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Join as an Executive →
            </button>

            {/* Executive panel image */}
            <div style={{ marginTop: 36, borderRadius: 12, overflow: 'hidden', position: 'relative', aspectRatio: '3/1.3', opacity: 0.85 }}>
              <img
                src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80&auto=format&fit=crop"
                alt="Music supervisor with headphones"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(8,10,18,0.5) 100%)' }} />
            </div>
          </div>

        </div>
      </div>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <div id="how-it-works" style={{ background: DESIGN_SYSTEM.colors.bg.secondary, borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, padding: '80px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 20px' : '0 64px' }}>

          {/* Header */}
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 24, padding: '6px 20px', marginBottom: 18 }}>
              <span style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Simple by design</span>
            </div>
            <h2 style={{ fontFamily: DESIGN_SYSTEM.font.display, fontSize: isMobile ? 32 : 52, fontWeight: 600, letterSpacing: '0.01em', margin: '0 0 32px', color: DESIGN_SYSTEM.colors.text.primary }}>
              How does it work?
            </h2>

            {/* Tab switcher */}
            <div style={{ display: isMobile ? 'flex' : 'inline-flex', background: DESIGN_SYSTEM.colors.bg.card, border: `1px solid ${DESIGN_SYSTEM.colors.border.medium}`, borderRadius: 12, padding: 4, gap: 4, width: isMobile ? '100%' : 'auto' }}>
              {[
                { key: 'composer', label: '🎵 For Composers' },
                { key: 'executive', label: '🎬 For Executives' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setHowTab(key); setScreenIdx(0); }}
                  style={{
                    background: howTab === key ? DESIGN_SYSTEM.colors.brand.primary : 'transparent',
                    border: 'none', borderRadius: 9, padding: isMobile ? '10px 12px' : '10px 24px',
                    fontSize: isMobile ? 13 : 14, fontWeight: 700,
                    color: howTab === key ? '#0D0B0F' : DESIGN_SYSTEM.colors.text.secondary,
                    cursor: 'pointer', fontFamily: DESIGN_SYSTEM.font.body,
                    transition: 'all 0.25s ease',
                    flex: isMobile ? 1 : 'none',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Steps */}
          {howTab === 'composer' ? (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { step: '01', icon: <Users size={22} />, color: DESIGN_SYSTEM.colors.brand.primary, title: 'Create your profile', desc: 'Sign up, add your bio, PRO affiliation, genres, and instruments. Let supervisors know who they\'re dealing with.' },
                { step: '02', icon: <Music size={22} />, color: '#8B5CF6', title: 'Upload your tracks', desc: 'Drop any audio file. AI auto-tags genre, mood, BPM, key, and transcribes lyrics in under 60 seconds.' },
                { step: '03', icon: <Briefcase size={22} />, color: '#3B82F6', title: 'Apply to briefs', desc: 'Browse open briefs with budgets and deadlines. Submit a curated pitch in one click — no cold emails.' },
                { step: '04', icon: <CheckCircle size={22} />, color: DESIGN_SYSTEM.colors.accent.amber, title: 'Close the deal', desc: 'Chat directly with the supervisor, confirm splits, and lock in your sync placement — all on platform.' },
              ].map(({ step, icon, color, title, desc }, i) => (
                <div key={step} style={{ position: 'relative' }}>
                  {/* Connector line — desktop only */}
                  {i < 3 && !isMobile && (
                    <div style={{ position: 'absolute', top: 28, left: '60%', width: '80%', height: 1, background: `linear-gradient(90deg, ${color}40, ${DESIGN_SYSTEM.colors.border.light})`, zIndex: 0 }} />
                  )}
                  <div style={{ background: 'rgba(18,20,31,0.42)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: `1px solid ${color}28`, borderRadius: 16, padding: isMobile ? '20px 18px' : '28px 24px', position: 'relative', zIndex: 1, height: '100%', boxSizing: 'border-box', transition: 'all 0.2s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = color + '60'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${color}18`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = color + '30'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: color, letterSpacing: '0.1em', opacity: 0.7 }}>STEP {step}</span>
                    </div>
                    <h4 style={{ fontFamily: DESIGN_SYSTEM.font.display, fontSize: 20, fontWeight: 600, letterSpacing: '0.01em', margin: '0 0 10px', color: DESIGN_SYSTEM.colors.text.primary }}>{title}</h4>
                    <p style={{ fontSize: 13, color: DESIGN_SYSTEM.colors.text.secondary, lineHeight: 1.65, margin: 0 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { step: '01', icon: <Search size={22} />, color: '#8B5CF6', title: 'Set up your account', desc: 'Sign up as a music supervisor or A&R, add your company and the genres you\'re looking for.' },
                { step: '02', icon: <Headphones size={22} />, color: DESIGN_SYSTEM.colors.brand.primary, title: 'Search or post a brief', desc: 'Use natural language to search the catalog — or post a brief with your specs, budget, and deadline.' },
                { step: '03', icon: <Star size={22} />, color: '#3B82F6', title: 'Review & shortlist', desc: 'Receive curated applications. Listen, compare, and shortlist your favorites with one click.' },
                { step: '04', icon: <Zap size={22} />, color: DESIGN_SYSTEM.colors.accent.amber, title: 'Connect & license', desc: 'Message the composer directly, confirm rights and splits, and close the deal — all in one place.' },
              ].map(({ step, icon, color, title, desc }, i) => (
                <div key={step} style={{ position: 'relative' }}>
                  {i < 3 && !isMobile && (
                    <div style={{ position: 'absolute', top: 28, left: '60%', width: '80%', height: 1, background: `linear-gradient(90deg, ${color}40, ${DESIGN_SYSTEM.colors.border.light})`, zIndex: 0 }} />
                  )}
                  <div style={{ background: 'rgba(18,20,31,0.42)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: `1px solid ${color}28`, borderRadius: 16, padding: isMobile ? '20px 18px' : '28px 24px', position: 'relative', zIndex: 1, height: '100%', boxSizing: 'border-box', transition: 'all 0.2s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = color + '60'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${color}18`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = color + '30'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: color, letterSpacing: '0.1em', opacity: 0.7 }}>STEP {step}</span>
                    </div>
                    <h4 style={{ fontFamily: DESIGN_SYSTEM.font.display, fontSize: 20, fontWeight: 600, letterSpacing: '0.01em', margin: '0 0 10px', color: DESIGN_SYSTEM.colors.text.primary }}>{title}</h4>
                    <p style={{ fontSize: 13, color: DESIGN_SYSTEM.colors.text.secondary, lineHeight: 1.65, margin: 0 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Screenshot Slider — synced to howTab ── */}
          {(() => {
            const slides = SCREEN_SLIDES[howTab];
            const accent = howTab === 'composer' ? '#C9A84C' : '#8B5CF6';
            const shadow = howTab === 'composer' ? 'rgba(201,168,76,0.22)' : 'rgba(139,92,246,0.22)';
            const slide = slides[screenIdx];
            return (
              <div className="reveal" style={{ marginTop: 56, position: 'relative' }}>

                {/* Caption row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ background: `${accent}18`, border: `1px solid ${accent}40`, borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 700, color: accent, transition: 'all 0.3s ease' }}>
                      {slide.caption}
                    </div>
                    <span style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.muted }}>{slide.desc}</span>
                  </div>
                  <span style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.muted, fontWeight: 600, letterSpacing: '0.05em' }}>
                    {screenIdx + 1} / {slides.length}
                  </span>
                </div>

                {/* Browser window */}
                <div style={{ overflow: 'hidden', borderRadius: 16, boxShadow: `0 24px 80px ${shadow}`, transition: 'box-shadow 0.4s ease' }}>
                  {/* Chrome bar */}
                  <div style={{ background: 'rgba(14,16,26,0.97)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 7 }}>
                      {['#FF5F57','#FEBC2E','#28C840'].map(c => (
                        <div key={c} style={{ width: 13, height: 13, borderRadius: '50%', background: c }} />
                      ))}
                    </div>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 7, padding: '5px 14px', fontSize: 12, color: DESIGN_SYSTEM.colors.text.muted, fontFamily: 'monospace' }}>
                      app.songpitchhub.com
                    </div>
                    <div style={{ fontSize: 10, color: accent, background: `${accent}15`, border: `1px solid ${accent}35`, borderRadius: 5, padding: '3px 8px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {howTab === 'composer' ? '🎵 Composer' : '🎬 Executive'}
                    </div>
                  </div>

                  {/* Screenshot — slides via overflow+translate */}
                  <div style={{ display: 'flex', transition: 'transform 0.42s cubic-bezier(0.4,0,0.2,1)', transform: `translateX(-${screenIdx * 100}%)` }}>
                    {slides.map((s, i) => (
                      <div key={i} style={{ minWidth: '100%', lineHeight: 0 }}>
                        <img src={s.src} alt={s.caption} style={{ width: '100%', display: 'block' }} loading="lazy" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prev arrow */}
                <button
                  onClick={() => setScreenIdx(i => Math.max(0, i - 1))}
                  disabled={screenIdx === 0}
                  style={{
                    position: 'absolute', left: isMobile ? -4 : -24, top: '52%', transform: 'translateY(-50%)',
                    width: 48, height: 48, borderRadius: '50%',
                    background: screenIdx === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.10)',
                    border: `1px solid ${screenIdx === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.18)'}`,
                    color: screenIdx === 0 ? DESIGN_SYSTEM.colors.text.muted : DESIGN_SYSTEM.colors.text.primary,
                    fontSize: 22, cursor: screenIdx === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease', backdropFilter: 'blur(8px)',
                  }}
                  onMouseEnter={e => { if (screenIdx > 0) e.currentTarget.style.background = 'rgba(255,255,255,0.16)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = screenIdx === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.10)'; }}
                >‹</button>

                {/* Next arrow */}
                <button
                  onClick={() => setScreenIdx(i => Math.min(slides.length - 1, i + 1))}
                  disabled={screenIdx === slides.length - 1}
                  style={{
                    position: 'absolute', right: isMobile ? -4 : -24, top: '52%', transform: 'translateY(-50%)',
                    width: 48, height: 48, borderRadius: '50%',
                    background: screenIdx === slides.length - 1 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.10)',
                    border: `1px solid ${screenIdx === slides.length - 1 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.18)'}`,
                    color: screenIdx === slides.length - 1 ? DESIGN_SYSTEM.colors.text.muted : DESIGN_SYSTEM.colors.text.primary,
                    fontSize: 22, cursor: screenIdx === slides.length - 1 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease', backdropFilter: 'blur(8px)',
                  }}
                  onMouseEnter={e => { if (screenIdx < slides.length - 1) e.currentTarget.style.background = 'rgba(255,255,255,0.16)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = screenIdx === slides.length - 1 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.10)'; }}
                >›</button>

                {/* Dot indicators */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setScreenIdx(i)}
                      style={{
                        width: screenIdx === i ? 32 : 8, height: 8, borderRadius: 4,
                        background: screenIdx === i ? accent : DESIGN_SYSTEM.colors.border.medium,
                        border: 'none', cursor: 'pointer',
                        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)', padding: 0,
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })()}

          {/* CTA below slider */}
          <div style={{ textAlign: 'center', marginTop: 44 }}>
            <button onClick={onGetStarted} style={{ background: DESIGN_SYSTEM.colors.gradient.main, border: 'none', borderRadius: 10, padding: '13px 32px', fontSize: 14, fontWeight: 700, color: '#0D0B0F', cursor: 'pointer', fontFamily: DESIGN_SYSTEM.font.body, boxShadow: '0 4px 20px rgba(201,168,76,0.3)', transition: 'all 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(201,168,76,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(201,168,76,0.3)'; }}
            >
              Get Started Free — No Credit Card →
            </button>
          </div>
        </div>
      </div>

      {/* ── See It In Action (full-width showcase) ──────────────────────── */}
      <div id="demo-section" style={{ padding: isMobile ? '60px 20px' : '80px 48px', background: `linear-gradient(180deg, transparent 0%, rgba(201,168,76,0.04) 50%, transparent 100%)` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Header */}
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 24, padding: '6px 20px', marginBottom: 16 }}>
              <span style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Live Platform Preview</span>
            </div>
            <h2 style={{ fontFamily: DESIGN_SYSTEM.font.display, fontSize: isMobile ? 32 : 52, fontWeight: 600, letterSpacing: '0.01em', margin: '0 0 14px' }}>
              Built for both sides of the deal
            </h2>
            <p style={{ fontSize: 16, color: DESIGN_SYSTEM.colors.text.secondary, maxWidth: 540, margin: '0 auto' }}>
              Real workflows, real data — see exactly what composers and executives experience on the platform.
            </p>
          </div>

          {/* Side-by-side cards */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 28 }}>

            {/* Composer card */}
            <div className="reveal" style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid rgba(201,168,76,0.25)`, boxShadow: '0 20px 60px rgba(201,168,76,0.12)', background: DESIGN_SYSTEM.colors.bg.card }}>
              {/* Card header */}
              <div style={{ padding: '20px 24px', borderBottom: `1px solid rgba(201,168,76,0.15)`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${DESIGN_SYSTEM.colors.brand.primary}20`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎵</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: DESIGN_SYSTEM.colors.text.primary }}>Composer Workflow</div>
                  <div style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.muted, marginTop: 2 }}>Portfolio → Deal Analyzer → AI Analysis</div>
                </div>
                <div style={{ marginLeft: 'auto', background: `${DESIGN_SYSTEM.colors.brand.primary}15`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}35`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: DESIGN_SYSTEM.colors.brand.primary }}>PRO</div>
              </div>
              {/* Video */}
              <div style={{ lineHeight: 0 }}>
                <video src="/demo_composer.mp4" autoPlay muted loop playsInline style={{ width: '100%', display: 'block' }} />
              </div>
              {/* Footer */}
              <div style={{ padding: '14px 24px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {['Upload tracks', 'AI contract analysis', 'Deal Vault', 'Assign splits'].map(tag => (
                  <span key={tag} style={{ fontSize: 11, color: DESIGN_SYSTEM.colors.brand.primary, background: `${DESIGN_SYSTEM.colors.brand.primary}12`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}25`, borderRadius: 20, padding: '3px 10px', fontWeight: 600 }}>{tag}</span>
                ))}
              </div>
            </div>

            {/* Executive card */}
            <div className="reveal" style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid rgba(139,92,246,0.25)`, boxShadow: '0 20px 60px rgba(139,92,246,0.12)', background: DESIGN_SYSTEM.colors.bg.card }}>
              {/* Card header */}
              <div style={{ padding: '20px 24px', borderBottom: `1px solid rgba(139,92,246,0.15)`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎬</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: DESIGN_SYSTEM.colors.text.primary }}>Executive Workflow</div>
                  <div style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.muted, marginTop: 2 }}>Opportunities → Contract Review → Vault</div>
                </div>
                <div style={{ marginLeft: 'auto', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#8B5CF6' }}>PRO</div>
              </div>
              {/* Video */}
              <div style={{ lineHeight: 0 }}>
                <video src="/demo_exec.mp4" autoPlay muted loop playsInline style={{ width: '100%', display: 'block' }} />
              </div>
              {/* Footer */}
              <div style={{ padding: '14px 24px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {['Browse talent', 'AI contract review', 'Contract Vault', 'Red flag detection'].map(tag => (
                  <span key={tag} style={{ fontSize: 11, color: '#8B5CF6', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 20, padding: '3px 10px', fontWeight: 600 }}>{tag}</span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Feature Videos ───────────────────────────────────────────────── */}
      <FeatureVideos isMobile={isMobile} />

      {/* ── Feature Grid ────────────────────────────────────────────────── */}
      <div id="features" style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "0 20px 60px" : "0 48px 80px" }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: isMobile ? 32 : 48, fontWeight: 600, marginBottom: 12, fontFamily: DESIGN_SYSTEM.font.display, letterSpacing: '0.01em', background: DESIGN_SYSTEM.colors.gradient.main, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Everything in one platform
          </h2>
          <p style={{ fontSize: 16, color: DESIGN_SYSTEM.colors.text.secondary, maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
            Every tool you need to discover, pitch, and close sync deals — without switching apps.
          </p>
        </div>

        {/* Features visual banner */}
        <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', aspectRatio: '21/6', marginBottom: 36, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
          <img
            src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1400&q=80&auto=format&fit=crop"
            alt="Music production workspace"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.55 }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(8,10,18,0.9) 0%, rgba(8,10,18,0.2) 40%, rgba(8,10,18,0.7) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 48px', gap: 40 }}>
            {[
              { emoji: '🎧', label: 'AI Auto-Tagging' },
              { emoji: '🔒', label: 'Private Vault' },
              { emoji: '📄', label: 'Split Sheets' },
              { emoji: '📬', label: 'Direct Briefs' },
              { emoji: '⚡', label: 'One-Stop Clearance' },
            ].map(({ emoji, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 20 }}>{emoji}</span>
                <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bento grid — row 1: large card + two stacked small cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* Large feature card — FEATURES[0] */}
          <div className="reveal" style={{
            background: 'rgba(18,20,31,0.42)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid rgba(201,168,76,0.10)', borderRadius: 20, padding: isMobile ? '28px 24px' : '40px 36px',
            display: 'flex', flexDirection: 'column', gap: 16, minHeight: 240,
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${FEATURES[0].color}18`, border: `1px solid ${FEATURES[0].color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: FEATURES[0].color }}>{FEATURES[0].icon}</div>
            <h3 style={{ fontFamily: DESIGN_SYSTEM.font.display, fontSize: isMobile ? 18 : 22, fontWeight: 700, color: DESIGN_SYSTEM.colors.text.primary, margin: 0, lineHeight: 1.3 }}>{FEATURES[0].title}</h3>
            <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 15, lineHeight: 1.65, margin: 0 }}>{FEATURES[0].desc}</p>
          </div>
          {/* Stacked small cards — FEATURES[1] and FEATURES[2] */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[FEATURES[1], FEATURES[2]].map((f, i) => (
              <div key={f.title} className={`reveal reveal-delay-${i+1}`} style={{
                background: 'rgba(18,20,31,0.42)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(201,168,76,0.08)', borderRadius: 20, padding: '28px 28px',
                display: 'flex', flexDirection: 'column', gap: 12, flex: 1,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${f.color}18`, border: `1px solid ${f.color}${f.color === DESIGN_SYSTEM.colors.brand.primary || f.color === DESIGN_SYSTEM.colors.brand.accent ? '20' : '30'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color }}>{f.icon}</div>
                <h3 style={{ fontFamily: DESIGN_SYSTEM.font.display, fontSize: 17, fontWeight: 700, color: DESIGN_SYSTEM.colors.text.primary, margin: 0, lineHeight: 1.3 }}>{f.title}</h3>
                <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bento grid — row 2: three equal cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
          {[FEATURES[3], FEATURES[4], FEATURES[5]].map((f, i) => (
            <div key={f.title} className={`reveal reveal-delay-${i+1}`} style={{
              background: 'rgba(18,20,31,0.42)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(201,168,76,0.08)', borderRadius: 20, padding: '28px 28px',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${f.color}18`, border: `1px solid ${f.color}${f.color === DESIGN_SYSTEM.colors.brand.primary || f.color === DESIGN_SYSTEM.colors.brand.accent ? '20' : '30'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color }}>{f.icon}</div>
              <h3 style={{ fontFamily: DESIGN_SYSTEM.font.display, fontSize: 17, fontWeight: 700, color: DESIGN_SYSTEM.colors.text.primary, margin: 0, lineHeight: 1.3 }}>{f.title}</h3>
              <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Trust Signals: Rights-Ready ─────────────────────────────────── */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "0 20px 60px" : "0 48px 80px" }}>
        <div style={{
          background: 'rgba(18,20,31,0.42)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid rgba(201,168,76,0.10)`,
          borderRadius: 20, padding: isMobile ? '32px 20px' : '48px 40px', textAlign: 'center',
        }}>
          <h2 style={{ fontSize: isMobile ? 28 : 42, fontWeight: 600, marginBottom: 8, fontFamily: DESIGN_SYSTEM.font.display, letterSpacing: '0.01em' }}>Every track is rights-ready</h2>
          <p style={{ fontSize: 15, color: DESIGN_SYSTEM.colors.text.secondary, maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.7 }}>
            Before any track reaches your search results, the legal infrastructure is already in place.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
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
              <div key={title} style={{ background: `rgba(18,20,31,0.42)`, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: `1px solid ${color}22`, borderRadius: 14, padding: 24 }}>
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

      {/* ── Social Proof — hidden until real reviews are collected ── */}

      {/* ── ML Systems ──────────────────────────────────────────────────── */}
      <MLSystemsSection isMobile={isMobile} />

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <div id="pricing" style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "0 20px 60px" : "0 48px 80px" }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: isMobile ? 28 : 48, fontWeight: 600, marginBottom: 8, fontFamily: DESIGN_SYSTEM.font.display, letterSpacing: '0.01em' }}>Simple, Transparent Pricing</h2>
          <p style={{ fontSize: 16, color: DESIGN_SYSTEM.colors.text.secondary, margin: 0 }}>
            Start free forever. Upgrade when you're ready — cancel anytime. Use code <strong style={{ color: '#C9A84C' }}>FOUNDER2026</strong> for 6 months free Pro.
          </p>
        </div>
        {PRICING_GROUPS.map((group, gi) => (
          <div key={group.group} style={{ marginBottom: gi === 0 ? 48 : 0 }}>
            {/* Group header */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{
                fontSize: 18, fontWeight: 700, color: DESIGN_SYSTEM.colors.text.primary,
                fontFamily: DESIGN_SYSTEM.font.display, margin: 0,
                paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}>{group.group}</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20, alignItems: 'start' }}>
              {group.tiers.map((tier, ti) => (
                <div key={tier.name} className={`reveal reveal-delay-${ti + 1}`} style={{
                  background: tier.highlight ? 'rgba(201,168,76,0.09)' : 'rgba(18,20,31,0.42)',
                  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  border: `2px solid ${tier.highlight ? DESIGN_SYSTEM.colors.brand.primary : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 20, padding: isMobile ? '24px 20px' : '28px 24px',
                  position: 'relative',
                  boxShadow: tier.highlight ? `0 8px 32px ${DESIGN_SYSTEM.colors.brand.primary}25` : 'none',
                }}>
                  {tier.badge && (
                    <div style={{
                      position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                      background: DESIGN_SYSTEM.colors.brand.primary, color: '#000',
                      fontSize: 11, fontWeight: 800, padding: '4px 14px', borderRadius: 20,
                      letterSpacing: '0.5px', whiteSpace: 'nowrap',
                    }}>{tier.badge}</div>
                  )}
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, color: DESIGN_SYSTEM.colors.text.primary }}>{tier.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 32, fontWeight: 900, color: tier.highlight ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.primary }}>{tier.price}</span>
                      {tier.period && <span style={{ fontSize: 13, color: DESIGN_SYSTEM.colors.text.tertiary }}>{tier.period}</span>}
                    </div>
                  </div>

                  {/* Founder offer callout — Pro cards only */}
                  {tier.founderOffer && (
                    <div style={{
                      background: 'rgba(201,168,76,0.1)',
                      border: '1px solid rgba(201,168,76,0.3)',
                      borderRadius: 10,
                      padding: '10px 14px',
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                      <Star size={13} color="#C9A84C" fill="#C9A84C" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ color: '#C9A84C', fontSize: 12, fontWeight: 800, letterSpacing: '0.03em' }}>
                          🎉 FOUNDER OFFER — Limited to 500 spots
                        </div>
                        <div style={{ color: 'rgba(201,168,76,0.8)', fontSize: 12, marginTop: 2 }}>
                          Use code{' '}
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.5px' }}>FOUNDER2026</span>
                          {' '}for 6 months free
                        </div>
                      </div>
                    </div>
                  )}

                  <ul style={{ listStyle: 'none', margin: '0 0 24px', padding: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {tier.features.map(f => (
                      <li key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <CheckCircle size={14} color={tier.highlight ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.accent.green} style={{ marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: DESIGN_SYSTEM.colors.text.secondary, lineHeight: 1.5 }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={onGetStarted} style={{
                    width: '100%',
                    background: tier.highlight ? DESIGN_SYSTEM.colors.brand.primary : 'transparent',
                    color: tier.highlight ? '#000' : DESIGN_SYSTEM.colors.text.secondary,
                    border: `1px solid ${tier.highlight ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.border.light}`,
                    borderRadius: 10, padding: '11px 20px',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                    transition: 'all 0.2s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                  >{tier.cta}</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <div id="faq" style={{ maxWidth: 740, margin: "0 auto", padding: isMobile ? "0 20px 60px" : "0 48px 80px" }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: isMobile ? 28 : 48, fontWeight: 600, marginBottom: 8, fontFamily: DESIGN_SYSTEM.font.display, letterSpacing: '0.01em' }}>Frequently Asked Questions</h2>
          <p style={{ fontSize: 16, color: DESIGN_SYSTEM.colors.text.secondary, margin: 0 }}>
            Everything you need to know before you sign up.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FAQ_ITEMS.map(item => <FAQItem key={item.q} item={item} />)}
        </div>
      </div>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <div style={{ padding: isMobile ? '0 20px 60px' : '0 48px 80px', position: 'relative' }}>
        {/* Background image card */}
        <div style={{
          maxWidth: 960, margin: '0 auto', borderRadius: 24, overflow: 'hidden',
          position: 'relative', border: `1px solid ${DESIGN_SYSTEM.colors.border.medium}`,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}>
          <img
            src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1400&q=80&auto=format&fit=crop"
            alt="Live music atmosphere"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0, opacity: 0.3 }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(8,10,18,0.95) 100%)' }} />
          {/* Content */}
          <div style={{ position: 'relative', textAlign: 'center', padding: isMobile ? '48px 20px 56px' : '72px 48px 80px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 24, padding: '6px 18px', marginBottom: 28 }}>
              <Star size={13} color={DESIGN_SYSTEM.colors.brand.primary} fill={DESIGN_SYSTEM.colors.brand.primary} />
              <span style={{ color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em' }}>FOUNDING MEMBER ACCESS</span>
            </div>
            <h2 style={{ fontSize: isMobile ? 36 : 54, fontWeight: 700, marginBottom: 16, fontFamily: DESIGN_SYSTEM.font.display, letterSpacing: '-0.01em', lineHeight: 1.1 }}>Ready to Connect?</h2>
            <p style={{ fontSize: isMobile ? 15 : 17, color: DESIGN_SYSTEM.colors.text.secondary, marginBottom: 40, lineHeight: 1.7, maxWidth: 500, margin: '0 auto 40px' }}>
              Be one of the first founding members. Free during Early Access — lock in your spot before we open to the public.
            </p>
            <button
              onClick={onGetStarted}
              className="cta-primary"
              style={{
                background: DESIGN_SYSTEM.colors.gradient.main, color: '#0D0B0F',
                border: "none", borderRadius: 14, padding: isMobile ? "16px 32px" : "20px 52px", fontSize: isMobile ? 16 : 18, fontWeight: 700,
                cursor: "pointer", fontFamily: DESIGN_SYSTEM.font.body,
                boxShadow: '0 8px 28px rgba(201,168,76,0.45)', transition: 'all 0.3s ease',
                width: isMobile ? '100%' : 'auto',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(201,168,76,0.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(201,168,76,0.45)'; }}
            >
              Get Started Free →
            </button>
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, padding: isMobile ? "32px 20px" : "40px 48px", textAlign: "center" }}>
        <p style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: isMobile ? 13 : 14, marginBottom: 10 }}>
          Questions? We'd love to hear from you.
        </p>
        <a
          href="mailto:hello@coda-vault.com"
          style={{ color: DESIGN_SYSTEM.colors.brand.accent, fontSize: isMobile ? 14 : 15, fontWeight: 600, textDecoration: "none" }}
          onMouseEnter={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.blue}
          onMouseLeave={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.accent}
        >
          hello@coda-vault.com
        </a>
        <div style={{ marginTop: 20, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', alignItems: 'center', gap: isMobile ? 12 : 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Terms of Service', page: 'terms' },
            { label: 'Privacy Policy', page: 'privacy' },
            { label: 'DMCA Policy', page: 'dmca' },
          ].map(({ label, page }) => (
            <a key={page} href={`#${page}`} onClick={(e) => { e.preventDefault(); onLegalPage(page); }}
              style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: isMobile ? 12 : 13, cursor: 'pointer', textDecoration: 'underline' }}>
              {label}
            </a>
          ))}
        </div>
        <p style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: isMobile ? 12 : 13, marginTop: 16 }}>
          © {new Date().getFullYear()} Coda-Vault. Where talent meets opportunity.
        </p>
      </div>
    </div>
  );
}
