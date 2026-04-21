import { useState, useEffect } from 'react';
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { StatCard } from '../components/StatCard';
import { MiniChart } from '../components/MiniChart';
import { supabase } from '../lib/supabase';
import { CheckCircle, Circle, Users, Music, Briefcase, MessageCircle, FileText, Search, Eye, User, Sparkles, ArrowRight, Upload, Zap, X, Star } from 'lucide-react';
import UpgradeModal from '../components/UpgradeModal';

// Relative time helper
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d}d ago`;
}

export function DashboardPage({ user, stats, onNavigate, isMobile = false, analytics }) {
  // Calculate total platform stats for trust signals
  const totalSongs = stats.songs || 0;
  const totalUsers = stats.users || 0;

  // Time-aware greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Profile completion calculation
  const isComposer = user.account_type === 'composer';
  const isAdminUser = user.account_type === 'admin';
  const profileFields = (isComposer || isAdminUser)
    ? [
        { key: 'bio', label: 'Bio', filled: !!(user.bio && user.bio.trim()) },
        { key: 'location', label: 'Location', filled: !!(user.location && user.location.trim()) },
        { key: 'avatar_url', label: 'Profile photo', filled: !!user.avatar_url },
        { key: 'pro_name', label: 'PRO affiliation', filled: !!(user.pro_name || user.pro) },
        { key: 'role', label: 'Role', filled: !!user.role },
        { key: 'genres', label: 'Genres', filled: Array.isArray(user.genres) && user.genres.length > 0 },
        { key: 'instruments', label: 'Instruments', filled: !!(user.instruments && user.instruments.trim()) },
      ]
    : [
        { key: 'bio', label: 'Bio', filled: !!(user.bio && user.bio.trim()) },
        { key: 'location', label: 'Location', filled: !!(user.location && user.location.trim()) },
        { key: 'avatar_url', label: 'Profile photo', filled: !!user.avatar_url },
        { key: 'company', label: 'Company', filled: !!(user.company && user.company.trim()) },
        { key: 'job_title', label: 'Job title', filled: !!(user.job_title && user.job_title.trim()) },
        { key: 'genres', label: 'Genres of interest', filled: Array.isArray(user.genres) && user.genres.length > 0 },
      ];
  const filledCount = profileFields.filter(f => f.filled).length;
  const totalFields = profileFields.length;
  const completionPct = Math.round((filledCount / totalFields) * 100);
  const missingFields = profileFields.filter(f => !f.filled);
  const isProfileComplete = missingFields.length === 0;

  // ── Activity feed ────────────────────────────────────────────────────────────
  const [activityFeed, setActivityFeed] = useState([]);
  useEffect(() => {
    let cancelled = false;
    async function loadActivity() {
      try {
        const [songsRes, oppsRes] = await Promise.all([
          supabase
            .from('songs')
            .select('id, title, genre, created_at, composer:user_profiles!songs_composer_id_fkey(first_name,last_name)')
            .order('created_at', { ascending: false })
            .limit(6),
          supabase
            .from('opportunities')
            .select('id, title, created_at, creator:user_profiles!opportunities_creator_id_fkey(first_name, last_name)')
            .order('created_at', { ascending: false })
            .limit(4),
        ]);

        if (cancelled) return;

        const items = [];
        (songsRes.data || []).forEach(s => items.push({
          id: `song-${s.id}`,
          type: 'song',
          label: s.title || 'Untitled',
          sub: s.composer ? `${s.composer.first_name} ${s.composer.last_name}` : 'Unknown composer',
          genre: s.genre || '',
          time: s.created_at,
        }));
        (oppsRes.data || []).forEach(o => items.push({
          id: `opp-${o.id}`,
          type: 'opportunity',
          label: o.title || 'New Brief',
          sub: o.creator ? `${o.creator.first_name} ${o.creator.last_name}` : 'Industry professional',
          time: o.created_at,
        }));

        // Sort by time desc
        items.sort((a, b) => new Date(b.time) - new Date(a.time));
        setActivityFeed(items.slice(0, 8));
      } catch (err) {
        // Non-critical — fail silently
      }
    }
    loadActivity();
    return () => { cancelled = true; };
  }, []);

  // Founder offer banner — show for free-tier users until dismissed
  const founderKey = `cv_founder_banner_dismissed_${user?.id}`;
  const [founderBannerDismissed, setFounderBannerDismissed] = useState(
    () => localStorage.getItem(founderKey) === '1'
  );
  const [founderModalOpen, setFounderModalOpen] = useState(false);
  const isFree = !user?.subscription_tier || user?.subscription_tier === 'free';
  const showFounderBanner = isFree && !founderBannerDismissed && !isAdminUser;

  // Onboarding walkthrough modal — show for new users (joined within last 14 days), dismissible
  const dismissKey = `sp_onboarding_dismissed_${user?.id}`;
  const [onboardingDismissed, setOnboardingDismissed] = useState(
    () => localStorage.getItem(dismissKey) === '1'
  );
  const [onboardingStep, setOnboardingStep] = useState(0);
  const dismissOnboarding = () => {
    localStorage.setItem(dismissKey, '1');
    setOnboardingDismissed(true);
  };
  const isNewUser = user?.created_at
    ? (Date.now() - new Date(user.created_at).getTime()) < 14 * 24 * 60 * 60 * 1000
    : false;
  const showOnboarding = isNewUser && !onboardingDismissed;

  // Mark as seen the moment it first appears — so refreshing never shows it again
  useEffect(() => {
    if (showOnboarding) localStorage.setItem(dismissKey, '1');
  }, [showOnboarding, dismissKey]);

  const composerSteps = [
    { icon: <User size={18} />, color: DESIGN_SYSTEM.colors.brand.primary, step: '1', title: 'Complete your profile', desc: 'Add your bio, PRO affiliation, and instruments to get discovered.', page: 'profile', cta: 'Go to Profile' },
    { icon: <Upload size={18} />, color: DESIGN_SYSTEM.colors.brand.blue, step: '2', title: 'Upload your first track', desc: 'AI auto-tags genre, mood, and BPM — your catalog is pitch-ready instantly.', page: 'portfolio', cta: 'Go to Portfolio' },
    { icon: <Search size={18} />, color: DESIGN_SYSTEM.colors.accent.purple, step: '3', title: 'Browse opportunities', desc: 'Music supervisors post active briefs with budgets and deadlines.', page: 'opportunities', cta: 'Browse Briefs' },
    { icon: <Users size={18} />, color: '#f59e0b', step: '4', title: 'Connect with executives', desc: 'Browse the roster and message industry professionals directly.', page: 'roster', cta: 'View Roster' },
  ];

  const executiveSteps = [
    { icon: <User size={18} />, color: DESIGN_SYSTEM.colors.brand.primary, step: '1', title: 'Complete your profile', desc: 'Add your company, role, and genres so composers know who you are.', page: 'profile', cta: 'Go to Profile' },
    { icon: <Search size={18} />, color: DESIGN_SYSTEM.colors.brand.blue, step: '2', title: 'Explore the catalog', desc: 'Browse pre-cleared, metadata-rich tracks filtered by genre, mood, and BPM.', page: 'catalog', cta: 'Browse Catalog' },
    { icon: <Briefcase size={18} />, color: DESIGN_SYSTEM.colors.accent.purple, step: '3', title: 'Post an opportunity', desc: 'Describe what you need — budget, genre, deadline — and receive curated pitches.', page: 'opportunities', cta: 'Post Brief' },
    { icon: <MessageCircle size={18} />, color: '#f59e0b', step: '4', title: 'Message a composer', desc: 'Reach out directly to any composer in the roster to discuss your project.', page: 'messages', cta: 'Go to Messages' },
  ];

  const onboardingSteps = isComposer ? composerSteps : executiveSteps;

  return (
    <div className="page-enter" style={{ padding: isMobile ? '16px' : `${DESIGN_SYSTEM.spacing.xl} ${DESIGN_SYSTEM.spacing.xl}`, minHeight: "100%", overflowY: "auto" }}>

      {/* ── Upgrade Modal (Founder offer) ─────────────────────────────────── */}
      <UpgradeModal
        isOpen={founderModalOpen}
        onClose={() => setFounderModalOpen(false)}
        feature="6 months of Pro — completely free for founding members."
        userProfile={user}
        defaultTier="pro"
        defaultCoupon="FOUNDER2026"
      />

      {/* ── Founder Offer Banner ──────────────────────────────────────────── */}
      {showFounderBanner && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(201,168,76,0.14) 0%, rgba(201,168,76,0.06) 100%)',
          border: '1px solid rgba(201,168,76,0.35)',
          borderRadius: DESIGN_SYSTEM.radius.md,
          padding: isMobile ? '14px 16px' : '14px 20px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          position: 'relative',
        }}>
          {/* Gold star icon */}
          <div style={{
            flexShrink: 0,
            width: 36, height: 36,
            borderRadius: 10,
            background: 'rgba(201,168,76,0.15)',
            border: '1px solid rgba(201,168,76,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Star size={18} color="#C9A84C" fill="#C9A84C" />
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: 13, fontFamily: DESIGN_SYSTEM.font.display }}>
              🎉 Founding Member Offer
            </span>
            <span style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, marginLeft: 8 }}>
              Get <strong style={{ color: DESIGN_SYSTEM.colors.text.primary }}>6 months of Pro free</strong> — use code{' '}
              <span style={{
                background: 'rgba(201,168,76,0.15)', color: '#C9A84C',
                padding: '1px 8px', borderRadius: 6, fontFamily: 'monospace',
                fontSize: 12, fontWeight: 700, letterSpacing: '0.5px',
              }}>FOUNDER2026</span>
              {' '}at checkout.
            </span>
          </div>

          {/* CTA */}
          <button
            onClick={() => setFounderModalOpen(true)}
            style={{
              flexShrink: 0,
              background: '#C9A84C',
              color: '#0D0B0F',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: DESIGN_SYSTEM.font.body,
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Claim Offer →
          </button>

          {/* Dismiss */}
          <button
            onClick={() => {
              localStorage.setItem(founderKey, '1');
              setFounderBannerDismissed(true);
            }}
            style={{
              flexShrink: 0,
              background: 'none', border: 'none',
              cursor: 'pointer', padding: 4,
              color: DESIGN_SYSTEM.colors.text.muted,
              display: 'flex', alignItems: 'center',
            }}
            aria-label="Dismiss"
            onMouseEnter={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.secondary}
            onMouseLeave={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.muted}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Hero Section with Trust Signal */}
      <div style={{
        background: DESIGN_SYSTEM.colors.gradient.hero,
        borderRadius: DESIGN_SYSTEM.radius.lg,
        padding: isMobile ? '16px' : '20px 28px',
        marginBottom: '16px',
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${DESIGN_SYSTEM.colors.border.medium}`,
        boxShadow: DESIGN_SYSTEM.shadow.md,
      }}>
        <h1 style={{
          color: DESIGN_SYSTEM.colors.text.primary,
          fontSize: isMobile ? 28 : 38,
          fontWeight: DESIGN_SYSTEM.fontWeight.semibold,
          fontFamily: DESIGN_SYSTEM.font.display,
          letterSpacing: '0.01em',
          marginBottom: DESIGN_SYSTEM.spacing.xs,
        }}>
          {greeting}, <span style={{
            background: DESIGN_SYSTEM.colors.gradient.main,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>{user.first_name}</span>
        </h1>
        <p style={{
          color: DESIGN_SYSTEM.colors.text.secondary,
          fontSize: DESIGN_SYSTEM.fontSize.md,
          marginBottom: DESIGN_SYSTEM.spacing.md,
          maxWidth: '560px',
          lineHeight: 1.5,
        }}>
          {user.account_type === 'admin'
            ? "Full platform overview — you have access to everything."
            : user.account_type === 'music_executive'
            ? "Connect with talented composers and discover your next collaboration."
            : "Showcase your work to industry professionals actively seeking new music."}
        </p>

        {/* Trust Signal */}
        {(totalSongs > 0 || totalUsers > 0) && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: DESIGN_SYSTEM.spacing.xs,
            background: 'rgba(255,255,255,0.08)',
            padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
            borderRadius: DESIGN_SYSTEM.radius.full,
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: DESIGN_SYSTEM.fontSize.sm,
            color: DESIGN_SYSTEM.colors.text.secondary,
            fontWeight: DESIGN_SYSTEM.fontWeight.medium,
          }}>
            <CheckCircle size={14} color={DESIGN_SYSTEM.colors.brand.accent} />
            {totalSongs > 100 && `${totalSongs.toLocaleString()}+ songs`}
            {totalSongs > 100 && totalUsers > 10 && ' • '}
            {totalUsers > 10 && `${totalUsers}+ active members`}
          </div>
        )}
      </div>

      {/* ─── Onboarding Walkthrough Modal (new users only) ─── */}
      {showOnboarding && (() => {
        const step = onboardingSteps[onboardingStep];
        const isLast = onboardingStep === onboardingSteps.length - 1;
        const handleNext = () => {
          if (isLast) { dismissOnboarding(); } else { setOnboardingStep(s => s + 1); }
        };
        return (
          /* Backdrop */
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(4,5,14,0.78)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}>
            {/* Modal window */}
            <div className="modal-enter" style={{
              background: DESIGN_SYSTEM.colors.bg.card,
              borderRadius: DESIGN_SYSTEM.radius.lg,
              border: `1px solid ${DESIGN_SYSTEM.colors.border.accent}30`,
              boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.1)`,
              width: '100%',
              maxWidth: 400,
              overflow: 'hidden',
            }}>
              {/* Top accent bar */}
              <div style={{ height: 4, background: DESIGN_SYSTEM.colors.gradient.main }} />

              {/* Content */}
              <div style={{ padding: '28px 28px 24px' }}>
                {/* Step indicator dots */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
                  {onboardingSteps.map((_, i) => (
                    <div key={i} style={{
                      height: 4, flex: 1, borderRadius: 2,
                      background: i <= onboardingStep
                        ? DESIGN_SYSTEM.colors.brand.primary
                        : DESIGN_SYSTEM.colors.border.medium,
                      transition: 'background 0.3s ease',
                    }} />
                  ))}
                </div>

                {/* Icon */}
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: `${step.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: step.color, marginBottom: 16,
                  fontSize: 24,
                }}>
                  {step.icon}
                </div>

                {/* Step label */}
                <div style={{
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: step.color, marginBottom: 6,
                }}>
                  Step {step.step} of {onboardingSteps.length}
                </div>

                {/* Title */}
                <h2 style={{
                  fontSize: 24, fontWeight: 600, color: DESIGN_SYSTEM.colors.text.primary,
                  fontFamily: DESIGN_SYSTEM.font.display, letterSpacing: '0.01em', margin: '0 0 10px',
                }}>
                  {step.title}
                </h2>

                {/* Description */}
                <p style={{
                  fontSize: 14, color: DESIGN_SYSTEM.colors.text.secondary,
                  lineHeight: 1.6, margin: 0,
                }}>
                  {step.desc}
                </p>
              </div>

              {/* Footer */}
              <div style={{
                padding: '16px 28px 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
              }}>
                {/* Skip */}
                <button
                  onClick={dismissOnboarding}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: DESIGN_SYSTEM.colors.text.muted,
                    fontFamily: DESIGN_SYSTEM.font.body, padding: 0,
                  }}
                >
                  Skip guide
                </button>

                {/* Next / Finish */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {/* "Take me there" shortcut */}
                  <button
                    onClick={() => { onNavigate(step.page); dismissOnboarding(); }}
                    style={{
                      background: 'none', border: `1px solid ${DESIGN_SYSTEM.colors.border.medium}`,
                      borderRadius: 8, padding: '8px 14px',
                      fontSize: 13, fontWeight: 600, color: DESIGN_SYSTEM.colors.text.secondary,
                      cursor: 'pointer', fontFamily: DESIGN_SYSTEM.font.body,
                    }}
                  >
                    {step.cta}
                  </button>
                  <button
                    onClick={handleNext}
                    style={{
                      background: DESIGN_SYSTEM.colors.brand.primary, border: 'none',
                      borderRadius: 8, padding: '8px 20px',
                      fontSize: 13, fontWeight: 700, color: '#fff',
                      cursor: 'pointer', fontFamily: DESIGN_SYSTEM.font.body,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    {isLast ? "Let's go! 🎉" : <>Next <ArrowRight size={14} /></>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Profile Completion Card */}
      {(() => {
        const progressColor = completionPct < 40 ? DESIGN_SYSTEM.colors.accent.red
          : completionPct < 70 ? DESIGN_SYSTEM.colors.accent.amber
          : completionPct < 100 ? DESIGN_SYSTEM.colors.brand.primary
          : DESIGN_SYSTEM.colors.brand.primary;
        const nextMilestone = completionPct < 50 ? 50 : completionPct < 75 ? 75 : 100;

        return isProfileComplete ? (
          /* Celebration state for 100% */
          <div style={{
            background: `linear-gradient(135deg, ${DESIGN_SYSTEM.colors.brand.primary}12, ${DESIGN_SYSTEM.colors.brand.primary}08)`,
            borderRadius: DESIGN_SYSTEM.radius.lg,
            padding: isMobile ? '16px' : '20px 24px',
            marginBottom: DESIGN_SYSTEM.spacing.lg,
            border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}33`,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${DESIGN_SYSTEM.colors.brand.primary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={20} color={DESIGN_SYSTEM.colors.brand.primary} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 600, fontFamily: DESIGN_SYSTEM.font.display, letterSpacing: '0.01em' }}>
                Profile 100% complete!
              </div>
              <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, marginTop: 2 }}>
                You've unlocked the {isComposer ? 'Verified Composer' : 'Verified Executive'} badge
              </div>
            </div>
          </div>
        ) : (
          /* Progress card with checklist */
          <div style={{
            background: DESIGN_SYSTEM.colors.bg.card,
            borderRadius: DESIGN_SYSTEM.radius.lg,
            padding: isMobile ? '16px' : '20px 24px',
            marginBottom: DESIGN_SYSTEM.spacing.lg,
            border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 0, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                  <svg width="44" height="44" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="19" fill="none" stroke={DESIGN_SYSTEM.colors.bg.primary} strokeWidth="4" />
                    <circle cx="22" cy="22" r="19" fill="none" stroke={progressColor} strokeWidth="4"
                      strokeDasharray={`${2 * Math.PI * 19}`}
                      strokeDashoffset={`${2 * Math.PI * 19 * (1 - completionPct / 100)}`}
                      strokeLinecap="round" transform="rotate(-90 22 22)"
                      style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: progressColor, fontFamily: DESIGN_SYSTEM.font.body }}>
                    {completionPct}%
                  </div>
                </div>
                <div>
                  <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 600, fontFamily: DESIGN_SYSTEM.font.display, letterSpacing: '0.01em' }}>
                    Complete your profile
                  </div>
                  <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, marginTop: 2 }}>
                    {completionPct < 50 ? 'Get to 50% to earn the Rising Star badge' : `${nextMilestone - completionPct > 0 ? `${100 - completionPct}% to go` : ''} — unlock the Verified badge!`}
                  </div>
                </div>
              </div>
              <button onClick={() => onNavigate && onNavigate('profile')} style={{
                background: DESIGN_SYSTEM.colors.brand.primary,
                border: 'none', borderRadius: 8, padding: '8px 18px',
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: DESIGN_SYSTEM.font.body,
                whiteSpace: 'nowrap',
              }}>
                Complete Profile
              </button>
            </div>

            {/* Progress bar */}
            <div style={{ width: '100%', height: 6, background: DESIGN_SYSTEM.colors.bg.primary, borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ width: `${completionPct}%`, height: '100%', background: progressColor, borderRadius: 3, transition: 'width 0.6s ease' }} />
            </div>

            {/* Step-by-step checklist */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '6px 16px' }}>
              {profileFields.map(f => (
                <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  {f.filled
                    ? <CheckCircle size={15} color={DESIGN_SYSTEM.colors.brand.primary} />
                    : <Circle size={15} color={DESIGN_SYSTEM.colors.text.muted} />
                  }
                  <span style={{
                    fontSize: 13, fontFamily: DESIGN_SYSTEM.font.body,
                    color: f.filled ? DESIGN_SYSTEM.colors.text.tertiary : DESIGN_SYSTEM.colors.text.primary,
                    textDecoration: f.filled ? 'line-through' : 'none',
                    fontWeight: f.filled ? 400 : 500,
                  }}>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Contextual Stats */}
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: DESIGN_SYSTEM.colors.text.label, marginBottom: 10, fontFamily: DESIGN_SYSTEM.font.body }}>Overview</div>
      {isAdminUser ? (
        <div style={{ display: "flex", flexDirection: isMobile ? 'column' : 'row', gap: DESIGN_SYSTEM.spacing.md, marginBottom: DESIGN_SYSTEM.spacing.lg, flexWrap: isMobile ? 'nowrap' : 'wrap' }}>
          <StatCard icon={<Users size={20} color={DESIGN_SYSTEM.colors.brand.purple} />} label="Total Users" value={stats.users} color={DESIGN_SYSTEM.colors.brand.purple} onClick={() => onNavigate && onNavigate('roster')} />
          <StatCard icon={<Music size={20} color={DESIGN_SYSTEM.colors.brand.primary} />} label="Platform Songs" value={stats.songs || 0} color={DESIGN_SYSTEM.colors.brand.primary} onClick={() => onNavigate && onNavigate('catalog')} />
          <StatCard icon={<Briefcase size={20} color={DESIGN_SYSTEM.colors.brand.accent} />} label="Open Opportunities" value={stats.opportunities} color={DESIGN_SYSTEM.colors.brand.accent} onClick={() => onNavigate && onNavigate('opportunities')} />
          <StatCard icon={<MessageCircle size={20} color={DESIGN_SYSTEM.colors.brand.primary} />} label="Conversations" value={stats.conversations || 0} color={DESIGN_SYSTEM.colors.brand.primary} onClick={() => onNavigate && onNavigate('messages')} />
          <StatCard icon={<FileText size={20} color={DESIGN_SYSTEM.colors.accent.amber} />} label="Responses" value={stats.totalResponses || 0} color={DESIGN_SYSTEM.colors.accent.amber} onClick={() => onNavigate && onNavigate('responses')} />
        </div>
      ) : isComposer ? (
        <div style={{ display: "flex", flexDirection: isMobile ? 'column' : 'row', gap: DESIGN_SYSTEM.spacing.md, marginBottom: DESIGN_SYSTEM.spacing.lg, flexWrap: isMobile ? 'nowrap' : 'wrap' }}>
          <StatCard icon={<Briefcase size={20} color={DESIGN_SYSTEM.colors.brand.accent} />} label={Array.isArray(user.genres) && user.genres.length > 0 ? "Opportunities for your genres" : "Open Opportunities"} value={stats.opportunities} color={DESIGN_SYSTEM.colors.brand.accent} onClick={() => onNavigate && onNavigate('opportunities')} />
          <StatCard icon={<Music size={20} color={DESIGN_SYSTEM.colors.brand.primary} />} label="Your Portfolio" value={stats.mySongs || 0} color={DESIGN_SYSTEM.colors.brand.primary} onClick={() => onNavigate && onNavigate('portfolio')} subtitle={(stats.mySongs || 0) === 0 ? "Upload your first song →" : null} />
          <StatCard icon={<MessageCircle size={20} color={DESIGN_SYSTEM.colors.brand.purple} />} label="Conversations" value={stats.conversations || 0} color={DESIGN_SYSTEM.colors.brand.purple} onClick={() => onNavigate && onNavigate('messages')} />
          <StatCard icon={<Eye size={20} color={DESIGN_SYSTEM.colors.brand.primary} />} label="Profile Views" value={stats.profileViews || 0} color={DESIGN_SYSTEM.colors.brand.primary} subtitle={stats.profileViews > 0 ? "See who viewed →" : null} onClick={() => { const el = document.getElementById('recent-viewers'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: isMobile ? 'column' : 'row', gap: DESIGN_SYSTEM.spacing.md, marginBottom: DESIGN_SYSTEM.spacing.lg, flexWrap: isMobile ? 'nowrap' : 'wrap' }}>
          <StatCard icon={<FileText size={20} color={DESIGN_SYSTEM.colors.brand.accent} />} label="Applications Received" value={stats.totalResponses || 0} color={DESIGN_SYSTEM.colors.brand.accent} onClick={() => onNavigate && onNavigate('responses')} subtitle={(stats.totalResponses || 0) > 0 ? "Review applications →" : null} />
          <StatCard icon={<Users size={20} color={DESIGN_SYSTEM.colors.brand.purple} />} label="Composers to Browse" value={stats.users} color={DESIGN_SYSTEM.colors.brand.purple} onClick={() => onNavigate && onNavigate('roster')} />
          <StatCard icon={<MessageCircle size={20} color={DESIGN_SYSTEM.colors.brand.primary} />} label="Conversations" value={stats.conversations || 0} color={DESIGN_SYSTEM.colors.brand.primary} onClick={() => onNavigate && onNavigate('messages')} />
        </div>
      )}

      {/* Analytics Sparklines */}
      {analytics && <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: DESIGN_SYSTEM.colors.text.label, marginBottom: 10, fontFamily: DESIGN_SYSTEM.font.body }}>Analytics</div>}
      {analytics && (
        <div style={{
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: DESIGN_SYSTEM.spacing.md, marginBottom: DESIGN_SYSTEM.spacing.lg,
        }}>
          {/* Composer: Profile views this week */}
          {(isComposer || isAdminUser) && analytics.profileViewsWeek && (
            <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: DESIGN_SYSTEM.radius.lg, padding: '16px 20px', border: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, fontFamily: DESIGN_SYSTEM.font.body }}>Profile Views This Week</span>
                <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 700, fontFamily: DESIGN_SYSTEM.font.body }}>{analytics.profileViewsWeek.reduce((a, b) => a + b, 0)}</span>
              </div>
              <MiniChart data={analytics.profileViewsWeek} type="bar" color={DESIGN_SYSTEM.colors.brand.primary} width={200} height={36} label="Mon — Sun" />
            </div>
          )}

          {/* Executive: Applications this week */}
          {(user.account_type === 'music_executive' || isAdminUser) && analytics.responsesWeek && (
            <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: DESIGN_SYSTEM.radius.lg, padding: '16px 20px', border: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, fontFamily: DESIGN_SYSTEM.font.body }}>Applications This Week</span>
                <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 700, fontFamily: DESIGN_SYSTEM.font.body }}>{analytics.responsesWeek.reduce((a, b) => a + b, 0)}</span>
              </div>
              <MiniChart data={analytics.responsesWeek} type="bar" color={DESIGN_SYSTEM.colors.brand.accent} width={200} height={36} label="Mon — Sun" />
            </div>
          )}
        </div>
      )}

      {/* Recent Profile Viewers */}
      {isComposer && analytics?.recentViewers?.length > 0 && (
        <div id="recent-viewers" style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: DESIGN_SYSTEM.radius.lg, padding: '20px', border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, marginBottom: DESIGN_SYSTEM.spacing.lg }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 700, fontFamily: DESIGN_SYSTEM.font.body }}>
              <Eye size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Who Viewed Your Profile
            </span>
            <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 12, fontFamily: DESIGN_SYSTEM.font.body }}>Last {analytics.recentViewers.length} views</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {analytics.recentViewers.map((view, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: view.profile.avatar_color || DESIGN_SYSTEM.colors.brand.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: DESIGN_SYSTEM.font.body, flexShrink: 0 }}>
                  {(view.profile.first_name?.[0] || '?').toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600, fontFamily: DESIGN_SYSTEM.font.body }}>
                    {view.profile.first_name} {view.profile.last_name}
                  </span>
                  <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 11, fontFamily: DESIGN_SYSTEM.font.body, marginLeft: 6 }}>
                    {view.profile.account_type === 'music_executive' ? 'Executive' : view.profile.account_type}
                  </span>
                </div>
                <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 11, fontFamily: DESIGN_SYSTEM.font.body }}>
                  {new Date(view.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Activity Feed ──────────────────────────────────────────────────── */}
      {activityFeed.length > 0 && (
        <div style={{
          background: DESIGN_SYSTEM.colors.bg.card,
          borderRadius: DESIGN_SYSTEM.radius.lg,
          padding: isMobile ? '16px' : '20px 24px',
          border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
          marginBottom: DESIGN_SYSTEM.spacing.lg,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: `${DESIGN_SYSTEM.colors.brand.primary}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Zap size={14} color={DESIGN_SYSTEM.colors.brand.primary} />
              </div>
              <span style={{
                color: DESIGN_SYSTEM.colors.text.primary,
                fontSize: 15,
                fontWeight: 700,
                fontFamily: DESIGN_SYSTEM.font.display,
                letterSpacing: '0.01em',
              }}>
                Platform Activity
              </span>
            </div>
            {/* Live dot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#22C55E',
                boxShadow: '0 0 6px rgba(34,197,94,0.6)',
                animation: 'goldPulse 2s ease-in-out infinite',
              }} />
              <span style={{
                color: DESIGN_SYSTEM.colors.text.muted,
                fontSize: 11,
                fontWeight: 600,
                fontFamily: DESIGN_SYSTEM.font.body,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                Live
              </span>
            </div>
          </div>

          {/* Feed items */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {activityFeed.map((item, idx) => {
              const isSong = item.type === 'song';
              const color = isSong ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.brand.accent;
              const isLast = idx === activityFeed.length - 1;

              return (
                <div key={item.id} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  paddingBottom: isLast ? 0 : 14,
                  marginBottom: isLast ? 0 : 14,
                  borderBottom: isLast ? 'none' : `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                }}>
                  {/* Icon */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${color}15`,
                    border: `1px solid ${color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 1,
                  }}>
                    {isSong
                      ? <Music size={14} color={color} />
                      : <Briefcase size={14} color={color} />
                    }
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        color: DESIGN_SYSTEM.colors.text.primary,
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: DESIGN_SYSTEM.font.body,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: isMobile ? 140 : 260,
                      }}>
                        {item.label}
                      </span>
                      <span style={{
                        color: color,
                        fontSize: 10,
                        fontWeight: 700,
                        fontFamily: DESIGN_SYSTEM.font.body,
                        background: `${color}12`,
                        padding: '1px 6px',
                        borderRadius: 4,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}>
                        {isSong ? 'New Track' : 'New Brief'}
                      </span>
                    </div>
                    <div style={{
                      color: DESIGN_SYSTEM.colors.text.muted,
                      fontSize: 12,
                      fontFamily: DESIGN_SYSTEM.font.body,
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {item.sub}
                    </div>
                  </div>

                  {/* Time */}
                  <span style={{
                    color: DESIGN_SYSTEM.colors.text.muted,
                    fontSize: 11,
                    fontFamily: DESIGN_SYSTEM.font.body,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    marginTop: 2,
                  }}>
                    {timeAgo(item.time)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{
        background: DESIGN_SYSTEM.colors.bg.card,
        borderRadius: DESIGN_SYSTEM.radius.lg,
        padding: isMobile ? '16px' : DESIGN_SYSTEM.spacing.lg,
        border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
        boxShadow: DESIGN_SYSTEM.shadow.sm,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: DESIGN_SYSTEM.colors.text.label, marginBottom: 14, fontFamily: DESIGN_SYSTEM.font.body }}>Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {(isAdminUser ? [
            { label: 'Browse Users', desc: 'View all composers & execs', icon: <Users size={20} color={DESIGN_SYSTEM.colors.brand.purple} />, page: 'roster' },
            { label: 'Search Catalog', desc: 'Find specific sounds', icon: <Search size={20} color={DESIGN_SYSTEM.colors.brand.blue} />, page: 'catalog' },
            { label: 'My Portfolio', desc: 'Upload & manage songs', icon: <Music size={20} color={DESIGN_SYSTEM.colors.brand.primary} />, page: 'portfolio' },
            { label: 'Opportunities', desc: 'Manage opportunities', icon: <Briefcase size={20} color={DESIGN_SYSTEM.colors.brand.purple} />, page: 'opportunities' },
            { label: 'View Responses', desc: 'Review applications', icon: <MessageCircle size={20} color={DESIGN_SYSTEM.colors.accent.amber} />, page: 'responses' },
          ] : user.account_type === 'music_executive' ? [
            { label: 'Browse Composers', desc: 'Discover new talent', icon: <Music size={20} color={DESIGN_SYSTEM.colors.brand.primary} />, page: 'roster' },
            { label: 'Search Catalog', desc: 'Find specific sounds', icon: <Search size={20} color={DESIGN_SYSTEM.colors.brand.blue} />, page: 'catalog' },
            { label: 'Post Opportunity', desc: 'Find collaborators', icon: <Briefcase size={20} color={DESIGN_SYSTEM.colors.brand.purple} />, page: 'opportunities' },
            { label: 'View Responses', desc: 'Review applications', icon: <MessageCircle size={20} color={DESIGN_SYSTEM.colors.accent.amber} />, page: 'responses' },
          ] : [
            { label: 'My Portfolio', desc: 'Upload & manage songs', icon: <Music size={20} color={DESIGN_SYSTEM.colors.brand.primary} />, page: 'portfolio' },
            { label: 'Opportunities', desc: 'Find projects', icon: <Briefcase size={20} color={DESIGN_SYSTEM.colors.brand.purple} />, page: 'opportunities' },
            { label: 'Search Catalog', desc: 'Explore music', icon: <Search size={20} color={DESIGN_SYSTEM.colors.brand.blue} />, page: 'catalog' },
            { label: 'My Profile', desc: 'Complete your profile', icon: <User size={20} color={DESIGN_SYSTEM.colors.accent.amber} />, page: 'profile' },
          ]).map(action => (
            <button
              key={action.page}
              onClick={() => onNavigate && onNavigate(action.page)}
              style={{
                background: DESIGN_SYSTEM.colors.bg.primary,
                border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                borderRadius: 12,
                padding: '16px 14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                fontFamily: DESIGN_SYSTEM.font.body,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.primary;
                e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.hover;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light;
                e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.primary;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ marginBottom: 8 }}>{action.icon}</div>
              <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{action.label}</div>
              <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 12 }}>{action.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
