import { DESIGN_SYSTEM } from '../constants/designSystem';

const ICON_MAP = {
  music: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  ),
  search: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  message: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  briefcase: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  users: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  file: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  star: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
};

export default function EmptyState({
  icon = 'music',
  title = 'Nothing here yet',
  description = '',
  action = null,   // { label: 'Button text', onClick: fn }
  compact = false,
}) {
  const iconEl = ICON_MAP[icon] || ICON_MAP.music;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: compact ? '40px 24px' : '80px 24px',
      textAlign: 'center',
      gap: 20,
    }}>
      {/* Icon container */}
      <div style={{
        width: 88,
        height: 88,
        borderRadius: '50%',
        background: 'rgba(201,168,76,0.07)',
        border: '1px solid rgba(201,168,76,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: DESIGN_SYSTEM.colors.brand.primary,
        marginBottom: 4,
      }}>
        {iconEl}
      </div>

      {/* Text */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
        <h3 style={{
          fontFamily: DESIGN_SYSTEM.font.display,
          fontSize: compact ? 18 : 22,
          fontWeight: 700,
          color: DESIGN_SYSTEM.colors.text.primary,
          margin: 0,
          letterSpacing: '-0.01em',
        }}>{title}</h3>
        {description && (
          <p style={{
            fontFamily: DESIGN_SYSTEM.font.body,
            fontSize: 14,
            lineHeight: 1.6,
            color: DESIGN_SYSTEM.colors.text.secondary,
            margin: 0,
          }}>{description}</p>
        )}
      </div>

      {/* CTA */}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 4,
            padding: '10px 24px',
            background: `linear-gradient(135deg, #D4AF6A 0%, #C9A84C 50%, #A8873A 100%)`,
            color: DESIGN_SYSTEM.colors.bg.primary,
            border: 'none',
            borderRadius: 10,
            fontFamily: DESIGN_SYSTEM.font.body,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(201,168,76,0.25)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 32px rgba(201,168,76,0.40)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(201,168,76,0.25)'; }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
