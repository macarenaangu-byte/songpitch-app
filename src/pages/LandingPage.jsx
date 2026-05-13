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
    <div style={{ background: '#161620', border: `1px solid ${open ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.15)'}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.2s ease' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
      >
        <span style={{ color: '#ffffff', fontSize: 15, fontWeight: 600 }}>{item.q}</span>
        <span style={{ color: 'rgba(201,168,76,0.7)', fontSize: 18, flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'none' }}>›</span>
      </button>
      {open && (
        <div style={{ padding: '0 22px 18px', color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.75 }}>{item.a}</div>
      )}
    </div>
  );
}

const NAV_LINKS = [
  { label: 'For Composers', id: 'for-composers' },
  { label: 'For Executives', id: 'for-executives' },
  { label: 'Our Story', id: 'our-story' },
  { label: 'How it works', id: 'how-it-works' },
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
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

function useCountUp(target, duration = 1800) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
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
        if (progress < 1) requestAnimationFrame(step); else setCount(target);
      };
      requestAnimationFrame(step);
    }
  }, [target, duration, hasStarted]);
  return { count, ref };
}

function StatCounter({ value, suffix, label, color }) {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', color: color || DESIGN_SYSTEM.colors.brand.primary, lineHeight: 1, fontFamily: DESIGN_SYSTEM.font.display }}>{count}{suffix}</div>
      <div style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

/* ── Feature Videos ──────────────────────────────────────────────────────── */
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
  const go = (dir) => { setActiveIdx(i => (i + dir + videos.length) % videos.length); if (videoRef.current) { videoRef.current.load(); videoRef.current.play().catch(() => {}); } };
  return (
    <div style={{ padding: isMobile ? '60px 20px' : '80px 48px', background: 'rgba(8,10,18,0.6)', borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-block', fontSize: 10, padding: '4px 12px', borderRadius: 4, background: 'rgba(201,168,76,0.15)', color: DESIGN_SYSTEM.colors.brand.primary, marginBottom: 16, letterSpacing: '1.5px', fontWeight: 700 }}>SEE IT IN ACTION</div>
          <h2 style={{ fontFamily: DESIGN_SYSTEM.font.display, fontSize: isMobile ? 28 : 42, fontWeight: 700, letterSpacing: '-0.02em', color: DESIGN_SYSTEM.colors.text.primary, margin: '0 0 24px' }}>What you can do</h2>
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
          <div style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid ${accentColor}33`, boxShadow: `0 24px 80px ${accentColor}18`, position: 'relative', background: '#000' }}>
            <video ref={videoRef} key={current.src} autoPlay muted loop playsInline style={{ width: '100%', display: 'block', maxHeight: 520, objectFit: 'contain' }}>
              <source src={current.src} type="video/mp4" />
            </video>
            {videos.length > 1 && (
              <>
                <button onClick={() => go(-1)} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: `1px solid ${accentColor}44`, borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 18, backdropFilter: 'blur(6px)' }}>‹</button>
                <button onClick={() => go(1)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: `1px solid ${accentColor}44`, borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 18, backdropFilter: 'blur(6px)' }}>›</button>
              </>
            )}
          </div>
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

/* ── Song Analyzer Section ───────────────────────────────────────────────── */
function SongAnalyzerSection({ isMobile }) {
  const [progress, setProgress] = useState(0);
  const sectionRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let p = 0;
          const interval = setInterval(() => { p += 1; setProgress(p); if (p >= 85) clearInterval(interval); }, 18);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={sectionRef} style={{ padding: isMobile ? '60px 20px' : '80px 48px', background: 'rgba(8,10,18,0.6)', borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-block', fontSize: 10, padding: '4px 12px', borderRadius: 4, background: 'rgba(201,168,76,0.15)', color: DESIGN_SYSTEM.colors.brand.primary, marginBottom: 16, letterSpacing: '1.5px', fontWeight: 700 }}>SONG ANALYZER AI</div>
          <h2 style={{ fontFamily: DESIGN_SYSTEM.font.display, fontSize: isMobile ? 28 : 44, fontWeight: 600, color: '#ffffff', margin: '0 0 12px' }}>
            Metadata in <span style={{ color: DESIGN_SYSTEM.colors.brand.primary }}>under 60 seconds.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, maxWidth: 460, margin: '0 auto', lineHeight: 1.7 }}>
            No forms. No manual entry. Drop your track in and our AI does the work.
          </p>
        </div>
        <div className="reveal" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
          <div style={{ background: '#161620', borderRadius: 12, padding: 22, border: `1px solid rgba(201,168,76,0.25)` }}>
            <div style={{ border: `1px dashed rgba(201,168,76,0.4)`, borderRadius: 8, padding: '28px 20px', textAlign: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎵</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 4, fontWeight: 500 }}>Fuego_Lento_Final.wav</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Analyzing...</div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', margin: '14px 0 6px' }}>
                <div style={{ height: '100%', background: `linear-gradient(90deg, ${DESIGN_SYSTEM.colors.brand.primary}, #e8c86a)`, borderRadius: 2, width: `${progress}%`, transition: 'width 0.05s linear' }} />
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{progress}% — detecting mood</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {[{ label: 'Latin Pop', active: true }, { label: 'Romantic', active: true }, { label: '96 BPM', active: true }, { label: 'A Minor', active: true }, { label: 'Energetic', active: false }, { label: 'One-Stop', active: false }].map(({ label, active }) => (
                <span key={label} style={{ fontSize: 11, padding: '4px 11px', borderRadius: 5, background: active ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.06)', color: active ? DESIGN_SYSTEM.colors.brand.primary : 'rgba(255,255,255,0.45)', fontWeight: active ? 600 : 400 }}>{label}</span>
              ))}
            </div>
          </div>
          <div style={{ background: '#161620', borderRadius: 12, padding: 22, border: `1px solid rgba(201,168,76,0.25)` }}>
            {[
              { key: 'Genre', val: 'Latin Pop', gold: false }, { key: 'Mood', val: 'Romantic / Nostalgic', gold: false },
              { key: 'BPM', val: '96', gold: false }, { key: 'Key', val: 'A Minor', gold: false },
              { key: 'Duration', val: '3:42', gold: false }, { key: 'Ownership', val: '✓ Verified', gold: true }, { key: 'Rights', val: 'One-Stop', gold: true },
            ].map(({ key, val, gold }, i, arr) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{key}</span>
                <span style={{ fontSize: 13, color: gold ? DESIGN_SYSTEM.colors.brand.primary : 'rgba(255,255,255,0.85)', fontWeight: gold ? 600 : 500 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── LegalSplits Visual Section ──────────────────────────────────────────── */
function LegalSplitsVisualSection({ isMobile }) {
  return (
    <div style={{ padding: isMobile ? '60px 20px' : '80px 48px', borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 40 : 64, alignItems: 'start' }}>
        <div className="reveal">
          <div style={{ display: 'inline-block', fontSize: 10, padding: '4px 12px', borderRadius: 4, background: 'rgba(201,168,76,0.15)', color: DESIGN_SYSTEM.colors.brand.primary, marginBottom: 20, letterSpacing: '1.5px', fontWeight: 700 }}>LEGALSPLITS AI</div>
          <h2 style={{ fontFamily: DESIGN_SYSTEM.font.display, fontSize: isMobile ? 28 : 42, fontWeight: 600, color: '#ffffff', margin: '0 0 16px', lineHeight: 1.2 }}>
            Know what you're signing<br /><span style={{ color: DESIGN_SYSTEM.colors.brand.primary }}>before you sign.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.75, margin: '0 0 20px', maxWidth: 400 }}>
            Drop your contract in. Our AI reads every clause, flags every red flag in plain English, and tells you exactly what to push back on.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: 12, fontStyle: 'italic', margin: 0 }}>
            Not a lawyer. Not a replacement for one. A starting point so you walk in informed.
          </p>
        </div>
        <div className="reveal reveal-delay-1" style={{ background: '#161620', borderRadius: 14, padding: 22, border: `1px solid rgba(201,168,76,0.28)`, boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ width: 38, height: 38, background: 'rgba(201,168,76,0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📄</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>Publishing Agreement</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Stellar Songs Publishing Co. × Sofia Vargas</div>
            </div>
            <div style={{ fontSize: 11, padding: '4px 10px', borderRadius: 5, background: 'rgba(226,75,74,0.15)', color: '#E24B4A', fontWeight: 600 }}>Below Standard</div>
          </div>
          {[
            { color: '#E24B4A', label: 'Foreign sub-publishing', text: 'Publisher retains 80% of foreign income — you net ~10%. Industry standard is 75–85% to you.' },
            { color: '#E24B4A', label: 'No audit rights', text: "No stated right to verify publisher's accounting. This is a critical missing protection." },
            { color: '#63992A', label: "Writer's share protected", text: 'Performance royalties paid directly by ASCAP — publisher cannot touch them.' },
          ].map(({ color, label, text }) => (
            <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 5 }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>{text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Composer Feature Section ────────────────────────────────────────────── */
function ComposerSection({ isMobile, onGetStarted }) {
  return (
    <div id="for-composers" style={{ background: '#0F0F13', padding: isMobile ? '80px 20px' : '100px 48px', borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 48 : 72, alignItems: 'center' }}>

        {/* Left: copy */}
        <div className="reveal">
          <div style={{ display: 'inline-block', fontSize: 10, padding: '4px 12px', borderRadius: 4, background: 'rgba(201,168,76,0.15)', color: DESIGN_SYSTEM.colors.brand.primary, marginBottom: 24, letterSpacing: '1.5px', fontWeight: 700 }}>
            FOR COMPOSERS &amp; PRODUCERS
          </div>
          <h2 style={{ fontFamily: DESIGN_SYSTEM.font.display, fontSize: isMobile ? 40 : 56, fontWeight: 700, color: '#ffffff', margin: '0 0 20px', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            Your catalog.<br />Your rights.<br /><span style={{ color: DESIGN_SYSTEM.colors.brand.primary }}>All in one place.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, lineHeight: 1.75, margin: '0 0 32px', maxWidth: 420 }}>
            Stop cold-emailing supervisors and losing your music in generic platforms. Upload, get AI-tagged in 60 seconds, and pitch to real industry briefs — without ever leaving the app.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
            {[
              { icon: '🎵', title: 'AI auto-tagging', desc: 'Genre, mood, BPM, key, and lyrics — all detected automatically on upload.' },
              { icon: '📋', title: 'Pitch Helper', desc: 'Apply to sync briefs with AI-polished pitch letters. Stand out, say the right thing.' },
              { icon: '🔒', title: 'Private encrypted vault', desc: 'You control who hears your tracks. Nobody browses without your permission.' },
              { icon: '📄', title: 'Split sheet generator', desc: 'Document co-writing splits, export as PDF, publish for verification — in minutes.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={onGetStarted}
            style={{ background: DESIGN_SYSTEM.colors.gradient.main, border: 'none', borderRadius: 10, padding: '13px 28px', fontSize: 14, fontWeight: 700, color: '#0D0B0F', cursor: 'pointer', fontFamily: DESIGN_SYSTEM.font.body, boxShadow: '0 4px 20px rgba(201,168,76,0.35)', transition: 'all 0.2s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(201,168,76,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(201,168,76,0.35)'; }}
          >
            Join as a Composer →
          </button>
        </div>

        {/* Right: dashboard mockup */}
        <div className="reveal reveal-delay-1" style={{ background: '#161620', borderRadius: 16, padding: 24, border: `1px solid rgba(201,168,76,0.28)`, boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            {[1,2,3].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />)}
            <div style={{ marginLeft: 8 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Good morning, Sofia</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>3 new opportunities available</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
            {[{n:'24',l:'Tracks'},{n:'3',l:'Pitches'},{n:'100%',l:'Verified'},{n:'2',l:'Briefs'}].map(({n,l}) => (
              <div key={l} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: DESIGN_SYSTEM.colors.brand.primary }}>{n}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
          {[
            { bars: [8,12,16,10,14], name: 'Fuego Lento', badge: 'Verified', badgeColor: DESIGN_SYSTEM.colors.brand.primary, badgeBg: 'rgba(201,168,76,0.15)' },
            { bars: [14,8,12,16,10], name: 'No Te Vayas', badge: 'Pitched', badgeColor: '#3B82F6', badgeBg: 'rgba(59,130,246,0.15)' },
            { bars: [10,16,8,12,14], name: 'Wavelength', badge: 'One-Stop', badgeColor: '#63992A', badgeBg: 'rgba(99,153,42,0.15)' },
          ].map(({ bars, name, badge, badgeColor, badgeBg }) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 7, padding: '10px 13px', marginBottom: 7 }}>
              <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                {bars.map((h, i) => <div key={i} style={{ width: 3, height: h, background: DESIGN_SYSTEM.colors.brand.primary, borderRadius: 1 }} />)}
              </div>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', flex: 1 }}>{name}</span>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: badgeBg, color: badgeColor, fontWeight: 600 }}>{badge}</span>
            </div>
          ))}
          {/* Pitch helper preview */}
          <div style={{ marginTop: 14, background: 'rgba(201,168,76,0.06)', borderRadius: 8, padding: '12px 14px', border: '1px solid rgba(201,168,76,0.15)' }}>
            <div style={{ fontSize: 10, color: DESIGN_SYSTEM.colors.brand.primary, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6 }}>✨ PITCH HELPER SUGGESTION</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>"Fuego Lento is a Latin pop track at 96 BPM in A minor with a romantic nostalgia that suits dramatic lifestyle campaigns..."</div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Executive Feature Section ───────────────────────────────────────────── */
function ExecutiveSection({ isMobile, onGetStarted }) {
  return (
    <div id="for-executives" style={{ background: '#0A0A0F', padding: isMobile ? '80px 20px' : '100px 48px', borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 48 : 72, alignItems: 'center' }}>

        {/* Left: catalog search mockup */}
        <div className="reveal" style={{ background: '#161620', borderRadius: 16, padding: 24, border: `1px solid rgba(139,92,246,0.28)`, boxShadow: '0 32px 80px rgba(0,0,0,0.6)', order: isMobile ? 2 : 1 }}>
          {/* Search bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 9, padding: '11px 14px', marginBottom: 12, border: '1px solid rgba(139,92,246,0.2)' }}>
            <span style={{ fontSize: 14, opacity: 0.5 }}>🔍</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Moody indie rock · 120 BPM · One-Stop</span>
          </div>
          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {['Mood: Dark', 'BPM: 100–130', 'Genre: Rock', '✓ One-Stop'].map(f => (
              <span key={f} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)', fontWeight: 500 }}>{f}</span>
            ))}
          </div>
          {/* Results */}
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 10 }}>12 TRACKS FOUND</div>
          {[
            { name: 'Neon Rain', artist: 'Alex Kim', bpm: '118 BPM', key: 'E min', badge: 'One-Stop', badgeColor: '#63992A', badgeBg: 'rgba(99,153,42,0.15)' },
            { name: 'Last Light', artist: 'Maria V.', bpm: '124 BPM', key: 'D maj', badge: 'Verified', badgeColor: DESIGN_SYSTEM.colors.brand.primary, badgeBg: 'rgba(201,168,76,0.15)' },
            { name: 'Undertow', artist: 'Kai Oshiro', bpm: '112 BPM', key: 'A min', badge: 'One-Stop', badgeColor: '#63992A', badgeBg: 'rgba(99,153,42,0.15)' },
          ].map(({ name, artist, bpm, key, badge, badgeColor, badgeBg }) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 7, padding: '10px 13px', marginBottom: 7 }}>
              <div style={{ width: 32, height: 32, borderRadius: 7, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🎵</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{name}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{artist} · {bpm} · {key}</div>
              </div>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: badgeBg, color: badgeColor, fontWeight: 600 }}>{badge}</span>
            </div>
          ))}
          {/* AI Brief Helper preview */}
          <div style={{ marginTop: 14, background: 'rgba(139,92,246,0.06)', borderRadius: 8, padding: '12px 14px', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div style={{ fontSize: 10, color: '#8B5CF6', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6 }}>✨ AI BRIEF HELPER</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>"Looking for a dark indie rock track, 100–130 BPM, for a car commercial launch campaign. One-Stop licensing preferred. Deadline: June 15."</div>
          </div>
        </div>

        {/* Right: copy */}
        <div className="reveal reveal-delay-1" style={{ order: isMobile ? 1 : 2 }}>
          <div style={{ display: 'inline-block', fontSize: 10, padding: '4px 12px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', marginBottom: 24, letterSpacing: '1.5px', fontWeight: 700 }}>
            FOR MUSIC SUPERVISORS &amp; A&Rs
          </div>
          <h2 style={{ fontFamily: DESIGN_SYSTEM.font.display, fontSize: isMobile ? 40 : 56, fontWeight: 700, color: '#ffffff', margin: '0 0 20px', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            Find the right sound,<br /><span style={{ color: '#8B5CF6' }}>faster than ever.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, lineHeight: 1.75, margin: '0 0 32px', maxWidth: 420 }}>
            No more inbox chaos or untagged Dropbox links. Search a verified catalog by mood, BPM, key, and rights status — and close deals the same day.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
            {[
              { icon: '🔍', title: 'Catalog search', desc: 'Natural language search by vibe, mood, or BPM. Every track is pre-tagged and rights-documented.' },
              { icon: '📣', title: 'AI Brief Helper', desc: 'Describe what you need and our AI writes a structured brief instantly. Receive targeted pitches back.' },
              { icon: '⚡', title: 'One-Stop filter', desc: 'Filter for tracks with 100% rights clearance. No split negotiations, faster licensing.' },
              { icon: '💬', title: 'Direct messaging', desc: 'Message any verified composer directly. Confirm rights, splits, and deal terms — all in one thread.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={onGetStarted}
            style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.45)', borderRadius: 10, padding: '13px 28px', fontSize: 14, fontWeight: 700, color: '#8B5CF6', cursor: 'pointer', fontFamily: DESIGN_SYSTEM.font.body, transition: 'all 0.2s ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.22)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.12)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Join as an Executive →
          </button>
        </div>

      </div>
    </div>
  );
}

export function LandingPage({ onGetStarted, onLegalPage }) {
  const [activeSection, setActiveSection] = useState('');
  const [howTab, setHowTab] = useState('composer');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const { canInstall, install } = useInstallPrompt();

  useScrollReveal();

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); }); },
      { threshold: 0.3 }
    );
    NAV_LINKS.forEach(({ id }) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="hero-animated-bg" style={{ minHeight: "100vh", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: DESIGN_SYSTEM.colors.text.primary, overflow: "auto" }}>

      {/* ── Animated gradient orbs ─────────────────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
        <div style={{ position: 'absolute', top: '4%', left: '3%', width: 720, height: 720, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.28) 0%, transparent 65%)', filter: 'blur(80px)', animation: 'orbDrift1 32s ease-in-out infinite', willChange: 'transform' }} />
        <div style={{ position: 'absolute', top: '38%', right: '-4%', width: 620, height: 620, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 65%)', filter: 'blur(90px)', animation: 'orbDrift2 40s ease-in-out infinite', willChange: 'transform' }} />
        <div style={{ position: 'absolute', bottom: '8%', left: '28%', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.16) 0%, transparent 65%)', filter: 'blur(100px)', animation: 'orbDrift3 26s ease-in-out infinite', willChange: 'transform' }} />
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <div style={{ height: 64, flexShrink: 0 }} />
      <nav style={{ padding: isMobile ? "0 20px" : "0 48px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: scrolled ? `1px solid ${DESIGN_SYSTEM.colors.border.light}` : '1px solid transparent', position: 'fixed', top: 0, left: 0, right: 0, height: 64, background: scrolled ? 'rgba(8,10,18,0.92)' : 'rgba(8,10,18,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', transition: 'all 0.3s ease', zIndex: 1000 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <img src="/songpitch-logo.png" alt="Coda-Vault" style={{ width: 32, height: 32, objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
          <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, background: DESIGN_SYSTEM.colors.gradient.main, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.3px' }}>Coda-Vault</div>
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {NAV_LINKS.map(({ label, id }) => (
              <button key={id} onClick={() => scrollTo(id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: activeSection === id ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.secondary, fontFamily: DESIGN_SYSTEM.font.body, transition: 'all 0.2s ease', borderBottom: activeSection === id ? `2px solid ${DESIGN_SYSTEM.colors.brand.primary}` : '2px solid transparent' }}
                onMouseEnter={e => { e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.primary; }}
                onMouseLeave={e => { e.currentTarget.style.color = activeSection === id ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.secondary; }}
              >{label}</button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {!isMobile && (
            <div style={{ background: `${DESIGN_SYSTEM.colors.brand.primary}15`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}35`, borderRadius: 20, padding: '3px 10px', color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 11, fontWeight: 700, letterSpacing: '0.6px' }}>EARLY ACCESS</div>
          )}
          <button onClick={onGetStarted}
            style={{ background: DESIGN_SYSTEM.colors.gradient.main, color: '#0D0B0F', border: "none", borderRadius: 8, padding: isMobile ? "8px 16px" : "9px 22px", fontSize: isMobile ? 12 : 13, fontWeight: 700, cursor: "pointer", fontFamily: DESIGN_SYSTEM.font.body, boxShadow: '0 4px 16px rgba(201,168,76,0.3)', transition: 'all 0.2s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(201,168,76,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,168,76,0.3)'; }}
          >{isMobile ? 'Join Free' : 'Sign In / Sign Up'}</button>
          {isMobile && (
            <button onClick={() => setMobileNavOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: DESIGN_SYSTEM.colors.text.primary, fontSize: 22, padding: '4px 6px', lineHeight: 1 }} aria-label="Toggle menu">
              {mobileNavOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </nav>

      {isMobile && mobileNavOpen && (
        <div style={{ position: 'fixed', top: 64, left: 0, right: 0, background: 'rgba(8,10,18,0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, zIndex: 999, display: 'flex', flexDirection: 'column', padding: '12px 0 20px' }}>
          {NAV_LINKS.map(({ label, id }) => (
            <button key={id} onClick={() => { scrollTo(id); setMobileNavOpen(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '14px 24px', textAlign: 'left', fontSize: 16, fontWeight: 500, color: activeSection === id ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.secondary, fontFamily: DESIGN_SYSTEM.font.body }}
            >{label}</button>
          ))}
        </div>
      )}

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "60px 20px 40px" : "80px 48px 60px", textAlign: "center" }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${DESIGN_SYSTEM.colors.brand.primary}15`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}35`, borderRadius: 24, padding: '8px 18px' }}>
            <Star size={14} color={DESIGN_SYSTEM.colors.brand.primary} fill={DESIGN_SYSTEM.colors.brand.primary} />
            <span style={{ color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 13, fontWeight: 700 }}>🎵 Composers · 6 Months Pro Free · Code: FOUNDER2026</span>
          </div>
        </div>

        <h1 style={{ fontSize: isMobile ? 48 : 88, fontWeight: 800, marginBottom: 20, lineHeight: 1.0, letterSpacing: '-0.03em', fontFamily: DESIGN_SYSTEM.font.display }}>
          Where{' '}
          <span style={{ background: DESIGN_SYSTEM.colors.gradient.main, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Composers</span>
          {' '}Meet{' '}
          <span style={{ background: DESIGN_SYSTEM.colors.gradient.main, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Music Supervisors</span>
        </h1>

        <p style={{ fontSize: isMobile ? 16 : 20, color: DESIGN_SYSTEM.colors.text.secondary, maxWidth: isMobile ? '100%' : 620, margin: "0 auto 32px", lineHeight: 1.7 }}>
          A sync licensing platform built for both sides of the deal. Composers get their music placed. Executives find exactly what they need. Everyone closes faster.
        </p>

        <div className="reveal reveal-delay-1" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 48 }}>
          <button onClick={onGetStarted} className="cta-primary"
            style={{ background: DESIGN_SYSTEM.colors.gradient.main, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 12, padding: "16px 40px", fontSize: 17, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", boxShadow: '0 8px 28px rgba(201,168,76,0.4)', transition: 'all 0.3s ease', width: isMobile ? '100%' : 'auto' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(201,168,76,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(201,168,76,0.4)'; }}
          >
            Get Started Free →
          </button>
          <a href="#demo" onClick={(e) => { e.preventDefault(); document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="cta-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', color: DESIGN_SYSTEM.colors.text.secondary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 12, padding: "16px 32px", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", textDecoration: 'none', transition: 'all 0.2s ease', width: isMobile ? '100%' : 'auto' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.primary + '60'; e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.primary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light; e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.secondary; }}
          >
            <Play size={15} fill="currentColor" /> Watch Demo
          </a>
          {canInstall && (
            <button onClick={install}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', color: DESIGN_SYSTEM.colors.text.secondary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 12, padding: '16px 32px', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", transition: 'all 0.2s ease', width: isMobile ? '100%' : 'auto' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.primary + '60'; e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.primary; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light; e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.secondary; }}
            >
              <Download size={15} /> Download the App
            </button>
          )}
        </div>

        <div className="reveal reveal-delay-2" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: isMobile ? 20 : 40, flexWrap: 'wrap', opacity: 0.7, marginBottom: 48 }}>
          <StatCounter value={4} suffix="" label="AI Tools Built-In" />
          <StatCounter value={100} suffix="%" label="Rights-Verified Tracks" />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 800, letterSpacing: '-0.02em', color: DESIGN_SYSTEM.colors.brand.primary, lineHeight: 1, fontFamily: DESIGN_SYSTEM.font.display }}>6 Mo</div>
            <div style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: isMobile ? 11 : 13, marginTop: 4, fontWeight: 500 }}>Pro Free</div>
          </div>
        </div>

        {/* Hero waveform */}
        <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', maxWidth: 860, margin: '0 auto', border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, boxShadow: '0 32px 80px rgba(0,0,0,0.65)', background: '#0a0b10', padding: isMobile ? '36px 24px 48px' : '48px 40px 64px' }}>
          {/* Subtle radial glow behind bars */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% 80%, rgba(201,168,76,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

          {/* Bar group label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isMobile ? 24 : 32 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: DESIGN_SYSTEM.colors.brand.primary, animation: 'goldPulse 2s ease-in-out infinite' }} />
            <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Now playing — Midnight Drive (Instrumental)</span>
          </div>

          {/* Waveform bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: isMobile ? 3 : 4, height: isMobile ? 80 : 120 }}>
            {[42,58,35,72,88,55,38,95,65,48,80,62,44,90,70,52,38,78,55,68,
              85,47,60,92,73,50,83,40,67,56,88,45,74,63,38,95,58,72,42,80,
              50,65,90,38,70,55,85,48].map((h, i) => (
              <div
                key={i}
                className="hero-bar"
                style={{
                  width: isMobile ? 5 : 7,
                  height: `${h}%`,
                  borderRadius: 3,
                  background: i % 7 === 0
                    ? `rgba(201,168,76,0.9)`
                    : i % 3 === 0
                      ? `rgba(201,168,76,0.55)`
                      : `rgba(201,168,76,0.38)`,
                  flexShrink: 0,
                }}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: isMobile ? 20 : 28, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 11, fontFamily: 'monospace', minWidth: 32 }}>0:38</span>
            <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 2, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '41%', background: `linear-gradient(90deg, ${DESIGN_SYSTEM.colors.brand.primary}, rgba(201,168,76,0.6))`, borderRadius: 2 }} />
              <div style={{ position: 'absolute', left: '41%', top: '50%', transform: 'translate(-50%, -50%)', width: 10, height: 10, borderRadius: '50%', background: DESIGN_SYSTEM.colors.brand.primary, boxShadow: '0 0 8px rgba(201,168,76,0.7)' }} />
            </div>
            <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 11, fontFamily: 'monospace', minWidth: 32, textAlign: 'right' }}>1:32</span>
          </div>

          {/* Bottom pill */}
          <div style={{ marginTop: isMobile ? 24 : 32, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(8,10,18,0.72)', backdropFilter: 'blur(10px)', border: `1px solid ${DESIGN_SYSTEM.colors.border.medium}`, borderRadius: 12, padding: '10px 22px' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: DESIGN_SYSTEM.colors.brand.primary, animation: 'goldPulse 2s ease-in-out infinite' }} />
              <span style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 500 }}>Your music. Your rights. Your next placement.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── For Composers ───────────────────────────────────────────────── */}
      <ComposerSection isMobile={isMobile} onGetStarted={onGetStarted} />

      {/* ── Song Analyzer AI ────────────────────────────────────────────── */}
      <div id="features">
        <SongAnalyzerSection isMobile={isMobile} />
      </div>

      {/* ── LegalSplits AI ──────────────────────────────────────────────── */}
      <LegalSplitsVisualSection isMobile={isMobile} />

      {/* ── For Executives ──────────────────────────────────────────────── */}
      <ExecutiveSection isMobile={isMobile} onGetStarted={onGetStarted} />

      {/* ── Our Story ───────────────────────────────────────────────────── */}
      <div id="our-story" style={{ background: '#0F0F13', borderTop: `1px solid rgba(255,255,255,0.06)`, padding: isMobile ? '80px 20px' : '100px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 48 : 72, alignItems: 'center' }}>

          {/* Left: copy */}
          <div className="reveal">
            <div style={{ display: 'inline-block', fontSize: 10, padding: '4px 12px', borderRadius: 4, background: 'rgba(201,168,76,0.15)', color: DESIGN_SYSTEM.colors.brand.primary, marginBottom: 24, letterSpacing: '1.8px', fontWeight: 700 }}>WHY WE BUILT THIS</div>
            <h2 style={{ fontFamily: DESIGN_SYSTEM.font.display, fontSize: isMobile ? 36 : 52, fontWeight: 700, color: '#ffffff', margin: '0 0 20px', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
              A problem<br />nobody had<br /><span style={{ color: DESIGN_SYSTEM.colors.brand.primary }}>solved.</span>
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, margin: '0 0 32px', maxWidth: 420 }}>
              I spent months building Coda-Vault because I saw a gap nobody was fixing. Two sides of the same industry, talking past each other — because nobody built the infrastructure to connect them.
            </p>
            <div style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.07) 0%, rgba(201,168,76,0.02) 100%)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 14, padding: '28px 32px' }}>
              <p style={{ fontSize: isMobile ? 17 : 20, fontWeight: 600, color: DESIGN_SYSTEM.colors.brand.primary, lineHeight: 1.4, margin: '0 0 16px', letterSpacing: '-0.01em' }}>
                "AI isn't here to replace artists.<br />It's here to clear their path."
              </p>
              <div style={{ width: 28, height: 1, background: 'rgba(201,168,76,0.35)', margin: '0 0 12px' }} />
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', margin: 0 }}>
                — Macarena Angulo Nadeau, Founder &amp; CEO
              </p>
            </div>
          </div>

          {/* Right: before/after visual */}
          <div className="reveal reveal-delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* BEFORE card */}
            <div style={{ background: '#161620', borderRadius: 14, border: '1px solid rgba(226,75,74,0.25)', padding: 22, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(226,75,74,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#E24B4A' }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#E24B4A' }}>WITHOUT CODA-VAULT</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { icon: '📨', line: 'Re: track.mp3', sub: 'No metadata · no rights info' },
                  { icon: '📨', line: 'FWD: here\'s the dropbox link', sub: 'Broken link · no split docs' },
                  { icon: '📨', line: 'RE: RE: RE: splits?', sub: 'Third follow-up · still no answer' },
                ].map(({ icon, line, sub }) => (
                  <div key={line} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(226,75,74,0.05)', borderRadius: 7, padding: '9px 12px', border: '1px solid rgba(226,75,74,0.1)' }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{line}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 1 }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: '1px solid rgba(226,75,74,0.1)' }}>
                <span style={{ fontSize: 11, color: '#E24B4A', fontWeight: 600 }}>⚠ 3 months of back-and-forth. Deal falls through.</span>
              </div>
            </div>

            {/* AFTER card */}
            <div style={{ background: '#161620', borderRadius: 14, border: '1px solid rgba(99,153,42,0.3)', padding: 22, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,153,42,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#63992A' }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#63992A' }}>WITH CODA-VAULT</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { name: 'Fuego Lento', meta: '96 BPM · A min · One-Stop', badge: 'Verified', color: DESIGN_SYSTEM.colors.brand.primary },
                  { name: 'No Te Vayas', meta: '104 BPM · G maj · Split docs ready', badge: 'Pitched', color: '#3B82F6' },
                  { name: 'Wavelength', meta: '128 BPM · E min · AI-tagged', badge: 'One-Stop', color: '#63992A' },
                ].map(({ name, meta, badge, color }) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(99,153,42,0.04)', borderRadius: 7, padding: '9px 12px', border: '1px solid rgba(99,153,42,0.1)' }}>
                    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexShrink: 0 }}>
                      {[6,10,14,8,12].map((h, i) => <div key={i} style={{ width: 3, height: h, background: color, borderRadius: 1, opacity: 0.7 }} />)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{name}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{meta}</div>
                    </div>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${color}18`, color, fontWeight: 600, border: `1px solid ${color}30` }}>{badge}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: '1px solid rgba(99,153,42,0.1)' }}>
                <span style={{ fontSize: 11, color: '#63992A', fontWeight: 600 }}>✓ Deal closed in 24 hours. Rights already handled.</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <div id="how-it-works" style={{ background: DESIGN_SYSTEM.colors.bg.secondary, borderTop: `1px solid rgba(255,255,255,0.06)`, borderBottom: `1px solid rgba(255,255,255,0.06)`, padding: isMobile ? '60px 20px' : '80px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          <div className="reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'inline-block', fontSize: 10, padding: '4px 12px', borderRadius: 4, background: 'rgba(201,168,76,0.15)', color: DESIGN_SYSTEM.colors.brand.primary, marginBottom: 18, letterSpacing: '1.8px', fontWeight: 700 }}>HOW IT WORKS</div>
            <h2 style={{ fontFamily: DESIGN_SYSTEM.font.display, fontSize: isMobile ? 30 : 42, fontWeight: 600, color: '#ffffff', margin: '0 0 28px', letterSpacing: '-0.02em' }}>
              From upload to <span style={{ color: DESIGN_SYSTEM.colors.brand.primary }}>placement.</span>
            </h2>
            {/* Tab switcher */}
            <div style={{ display: isMobile ? 'flex' : 'inline-flex', background: DESIGN_SYSTEM.colors.bg.card, border: `1px solid ${DESIGN_SYSTEM.colors.border.medium}`, borderRadius: 12, padding: 4, gap: 4, width: isMobile ? '100%' : 'auto' }}>
              {[{ key: 'composer', label: '🎵 For Composers' }, { key: 'executive', label: '🎬 For Executives' }].map(({ key, label }) => (
                <button key={key} onClick={() => setHowTab(key)}
                  style={{ background: howTab === key ? (key === 'composer' ? DESIGN_SYSTEM.colors.brand.primary : '#8B5CF6') : 'transparent', border: 'none', borderRadius: 9, padding: isMobile ? '10px 12px' : '10px 24px', fontSize: isMobile ? 13 : 14, fontWeight: 700, color: howTab === key ? '#0D0B0F' : DESIGN_SYSTEM.colors.text.secondary, cursor: 'pointer', fontFamily: DESIGN_SYSTEM.font.body, transition: 'all 0.25s ease', flex: isMobile ? 1 : 'none' }}
                >{label}</button>
              ))}
            </div>
          </div>

          {howTab === 'composer' ? (
            <div className="reveal" style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 760, margin: '0 auto' }}>
              {[
                { num: '1', title: 'Upload your track', desc: 'Drop any audio file. Our AI instantly detects genre, mood, BPM, key, and transcribes lyrics — no manual entry. One-Stop tracks get automatically badged.', last: false },
                { num: '2', title: 'Get discovered or apply with Pitch Helper', desc: 'Your catalog is searchable by verified supervisors immediately. Browse open briefs, then let the Pitch Helper write your application — so you always say the right thing.', last: false },
                { num: '3', title: 'Close the deal — rights already handled', desc: 'Split sheets are verified, LegalSplits AI analyzes any contract, and direct messaging is built in. What normally takes three months takes 24 hours.', last: true },
              ].map(({ num, title, desc, last }) => (
                <div key={num} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: DESIGN_SYSTEM.colors.brand.primary }}>{num}</div>
                    {!last && <div style={{ width: 1, height: 56, background: 'rgba(201,168,76,0.15)', marginTop: 6 }} />}
                  </div>
                  <div style={{ paddingTop: 10, paddingBottom: last ? 0 : 24 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>{title}</div>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.75, maxWidth: 560, margin: 0 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="reveal" style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 760, margin: '0 auto' }}>
              {[
                { num: '1', title: 'Post a brief with AI Brief Helper', desc: 'Describe what you need in plain language. The AI Brief Helper structures your requirements — genre, mood, BPM, budget, deadline — and publishes it to verified composers instantly.', last: false },
                { num: '2', title: 'Search the catalog or receive pitched tracks', desc: 'Filter the pre-cleared catalog by mood, BPM, key, and One-Stop status. Or sit back — composers who match your brief apply directly to you.', last: false },
                { num: '3', title: 'Shortlist, negotiate, and close', desc: 'Compare pitches, save shortlists, message composers directly. Rights are already documented. Use LegalSplits AI to review any contract before you sign.', last: true },
              ].map(({ num, title, desc, last }) => (
                <div key={num} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#8B5CF6' }}>{num}</div>
                    {!last && <div style={{ width: 1, height: 56, background: 'rgba(139,92,246,0.15)', marginTop: 6 }} />}
                  </div>
                  <div style={{ paddingTop: 10, paddingBottom: last ? 0 : 24 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>{title}</div>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.75, maxWidth: 560, margin: 0 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <button onClick={onGetStarted}
              style={{ background: DESIGN_SYSTEM.colors.gradient.main, border: 'none', borderRadius: 10, padding: '13px 32px', fontSize: 14, fontWeight: 700, color: '#0D0B0F', cursor: 'pointer', fontFamily: DESIGN_SYSTEM.font.body, boxShadow: '0 4px 20px rgba(201,168,76,0.3)', transition: 'all 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(201,168,76,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(201,168,76,0.3)'; }}
            >
              Get Started Free — No Credit Card →
            </button>
          </div>
        </div>
      </div>

      {/* ── Feature Videos ───────────────────────────────────────────────── */}
      <div id="demo-section">
        <FeatureVideos isMobile={isMobile} />
      </div>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <div id="pricing" style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "60px 20px 80px" : "80px 48px" }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-block', fontSize: 10, padding: '4px 12px', borderRadius: 4, background: 'rgba(201,168,76,0.15)', color: DESIGN_SYSTEM.colors.brand.primary, marginBottom: 18, letterSpacing: '1.8px', fontWeight: 700 }}>PRICING</div>
          <h2 style={{ fontSize: isMobile ? 28 : 48, fontWeight: 600, marginBottom: 10, fontFamily: DESIGN_SYSTEM.font.display, letterSpacing: '-0.01em', color: DESIGN_SYSTEM.colors.text.primary }}>
            Simple, Transparent Pricing
          </h2>
          <p style={{ fontSize: 16, color: DESIGN_SYSTEM.colors.text.secondary, margin: 0 }}>
            Start free forever. Upgrade when you're ready — cancel anytime.{' '}
            Use code <strong style={{ color: '#C9A84C' }}>FOUNDER2026</strong> for 6 months free Pro.
          </p>
        </div>

        {PRICING_GROUPS.map((group, gi) => (
          <div key={group.group} style={{ marginBottom: gi === 0 ? 56 : 0 }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: DESIGN_SYSTEM.colors.text.primary, fontFamily: DESIGN_SYSTEM.font.display, margin: 0, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {group.group}
              </h3>
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
                    <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: DESIGN_SYSTEM.colors.brand.primary, color: '#000', fontSize: 11, fontWeight: 800, padding: '4px 14px', borderRadius: 20, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{tier.badge}</div>
                  )}
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, color: DESIGN_SYSTEM.colors.text.primary }}>{tier.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 32, fontWeight: 900, color: tier.highlight ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.primary }}>{tier.price}</span>
                      {tier.period && <span style={{ fontSize: 13, color: DESIGN_SYSTEM.colors.text.tertiary }}>{tier.period}</span>}
                    </div>
                  </div>
                  {tier.founderOffer && (
                    <div style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Star size={13} color="#C9A84C" fill="#C9A84C" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ color: '#C9A84C', fontSize: 12, fontWeight: 800, letterSpacing: '0.03em' }}>🎉 FOUNDER OFFER — Limited to 500 spots</div>
                        <div style={{ color: 'rgba(201,168,76,0.8)', fontSize: 12, marginTop: 2 }}>
                          Use code{' '}<span style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.5px' }}>FOUNDER2026</span>{' '}for 6 months free
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
                    width: '100%', background: tier.highlight ? DESIGN_SYSTEM.colors.brand.primary : 'transparent',
                    color: tier.highlight ? '#000' : DESIGN_SYSTEM.colors.text.secondary,
                    border: `1px solid ${tier.highlight ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.border.light}`,
                    borderRadius: 10, padding: '11px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", transition: 'all 0.2s ease',
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
      <div id="faq" style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, padding: isMobile ? '60px 20px 80px' : '80px 48px' }}>
        <div style={{ maxWidth: 740, margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'inline-block', fontSize: 10, padding: '4px 12px', borderRadius: 4, background: 'rgba(201,168,76,0.15)', color: DESIGN_SYSTEM.colors.brand.primary, marginBottom: 18, letterSpacing: '1.8px', fontWeight: 700 }}>FAQ</div>
            <h2 style={{ fontFamily: DESIGN_SYSTEM.font.display, fontSize: isMobile ? 28 : 36, fontWeight: 600, color: '#ffffff', margin: 0, letterSpacing: '-0.01em' }}>FAQ</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQ_ITEMS.map(item => <FAQItem key={item.q} item={item} />)}
          </div>
        </div>
      </div>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, padding: isMobile ? '60px 20px 80px' : '80px 48px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ borderRadius: 20, padding: isMobile ? '48px 24px 56px' : '72px 48px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.02) 100%)', border: '1px solid rgba(201,168,76,0.28)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'inline-block', fontSize: 10, padding: '4px 12px', borderRadius: 4, background: 'rgba(201,168,76,0.15)', color: DESIGN_SYSTEM.colors.brand.primary, marginBottom: 24, letterSpacing: '1.8px', fontWeight: 700 }}>FOUNDING MEMBER ACCESS</div>
            <h2 style={{ fontFamily: DESIGN_SYSTEM.font.display, fontSize: isMobile ? 36 : 52, fontWeight: 700, color: '#ffffff', margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: 1.05 }}>Ready to Connect?</h2>
            <p style={{ fontSize: isMobile ? 15 : 16, color: 'rgba(255,255,255,0.45)', maxWidth: 440, margin: '0 auto 40px', lineHeight: 1.75 }}>
              Be one of the first founding members. Free during Early Access — lock in your spot before we open to the public.
            </p>
            <button onClick={onGetStarted} className="cta-primary"
              style={{ background: DESIGN_SYSTEM.colors.gradient.main, color: '#0D0B0F', border: "none", borderRadius: 12, padding: isMobile ? "16px 32px" : "18px 52px", fontSize: isMobile ? 16 : 17, fontWeight: 700, cursor: "pointer", fontFamily: DESIGN_SYSTEM.font.body, boxShadow: '0 8px 28px rgba(201,168,76,0.35)', transition: 'all 0.3s ease', letterSpacing: '-0.01em', width: isMobile ? '100%' : 'auto' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(201,168,76,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(201,168,76,0.35)'; }}
            >
              Get Started Free →
            </button>
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, padding: isMobile ? "32px 20px" : "40px 48px", textAlign: "center" }}>
        <p style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: isMobile ? 13 : 14, marginBottom: 10 }}>Questions? We'd love to hear from you.</p>
        <a href="mailto:hello@coda-vault.com"
          style={{ color: DESIGN_SYSTEM.colors.brand.accent, fontSize: isMobile ? 14 : 15, fontWeight: 600, textDecoration: "none" }}
          onMouseEnter={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.blue}
          onMouseLeave={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.accent}
        >hello@coda-vault.com</a>
        <div style={{ marginTop: 20, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', alignItems: 'center', gap: isMobile ? 12 : 24, flexWrap: 'wrap' }}>
          {[{ label: 'Terms of Service', page: 'terms' }, { label: 'Privacy Policy', page: 'privacy' }, { label: 'DMCA Policy', page: 'dmca' }].map(({ label, page }) => (
            <a key={page} href={`#${page}`} onClick={(e) => { e.preventDefault(); onLegalPage(page); }}
              style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: isMobile ? 12 : 13, cursor: 'pointer', textDecoration: 'underline' }}>{label}</a>
          ))}
        </div>
        <p style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: isMobile ? 12 : 13, marginTop: 16 }}>
          © {new Date().getFullYear()} Coda-Vault. Where talent meets opportunity.
        </p>
      </div>
    </div>
  );
}
