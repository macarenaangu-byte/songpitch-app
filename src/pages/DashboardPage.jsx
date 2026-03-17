import { DESIGN_SYSTEM } from '../constants/designSystem';
import { StatCard } from '../components/StatCard';
import { MiniChart } from '../components/MiniChart';
import { CheckCircle, Circle, Users, Music, Briefcase, MessageCircle, FileText, Search, Eye, User, Sparkles } from 'lucide-react';

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

  return (
    <div style={{ padding: isMobile ? '16px' : `${DESIGN_SYSTEM.spacing.xl} ${DESIGN_SYSTEM.spacing.xl}`, minHeight: "100%", overflowY: "auto" }}>
      {/* Hero Section with Trust Signal */}
      <div style={{
        background: DESIGN_SYSTEM.colors.gradient.hero,
        borderRadius: DESIGN_SYSTEM.radius.lg,
        padding: isMobile ? '20px' : '32px',
        marginBottom: DESIGN_SYSTEM.spacing.lg,
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${DESIGN_SYSTEM.colors.border.medium}`,
        boxShadow: DESIGN_SYSTEM.shadow.md,
      }}>
        <h1 style={{
          color: DESIGN_SYSTEM.colors.text.primary,
          fontSize: isMobile ? 24 : 30,
          fontWeight: DESIGN_SYSTEM.fontWeight.bold,
          fontFamily: "'Outfit', sans-serif",
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
              <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 15, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
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
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: progressColor, fontFamily: "'Outfit', sans-serif" }}>
                    {completionPct}%
                  </div>
                </div>
                <div>
                  <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
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
                cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
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
                    fontSize: 13, fontFamily: "'Outfit', sans-serif",
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
      {analytics && (
        <div style={{
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: DESIGN_SYSTEM.spacing.md, marginBottom: DESIGN_SYSTEM.spacing.lg,
        }}>
          {/* Composer: Profile views this week */}
          {(isComposer || isAdminUser) && analytics.profileViewsWeek && (
            <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: DESIGN_SYSTEM.radius.lg, padding: '16px 20px', border: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>Profile Views This Week</span>
                <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{analytics.profileViewsWeek.reduce((a, b) => a + b, 0)}</span>
              </div>
              <MiniChart data={analytics.profileViewsWeek} type="bar" color={DESIGN_SYSTEM.colors.brand.primary} width={200} height={36} label="Mon — Sun" />
            </div>
          )}

          {/* Executive: Applications this week */}
          {(user.account_type === 'music_executive' || isAdminUser) && analytics.responsesWeek && (
            <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: DESIGN_SYSTEM.radius.lg, padding: '16px 20px', border: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>Applications This Week</span>
                <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{analytics.responsesWeek.reduce((a, b) => a + b, 0)}</span>
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
            <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
              <Eye size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Who Viewed Your Profile
            </span>
            <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>Last {analytics.recentViewers.length} views</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {analytics.recentViewers.map((view, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: view.profile.avatar_color || DESIGN_SYSTEM.colors.brand.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: "'Outfit', sans-serif", flexShrink: 0 }}>
                  {(view.profile.first_name?.[0] || '?').toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                    {view.profile.first_name} {view.profile.last_name}
                  </span>
                  <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 11, fontFamily: "'Outfit', sans-serif", marginLeft: 6 }}>
                    {view.profile.account_type === 'music_executive' ? 'Executive' : view.profile.account_type}
                  </span>
                </div>
                <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 11, fontFamily: "'Outfit', sans-serif" }}>
                  {new Date(view.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
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
        <h3 style={{
          color: DESIGN_SYSTEM.colors.text.primary,
          fontSize: DESIGN_SYSTEM.fontSize.lg,
          fontWeight: DESIGN_SYSTEM.fontWeight.bold,
          fontFamily: "'Outfit', sans-serif",
          marginBottom: 16
        }}>Quick Actions</h3>
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
                fontFamily: "'Outfit', sans-serif",
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
