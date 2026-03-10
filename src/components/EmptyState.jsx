import { DESIGN_SYSTEM } from '../constants/designSystem';

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
    }}>
      {Icon && (
        <div style={{
          width: 64,
          height: 64,
          borderRadius: DESIGN_SYSTEM.radius.lg,
          background: `${DESIGN_SYSTEM.colors.brand.primary}12`,
          border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}25`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}>
          <Icon size={28} color={DESIGN_SYSTEM.colors.brand.primary} />
        </div>
      )}
      <h3 style={{
        color: DESIGN_SYSTEM.colors.text.primary,
        fontSize: 17,
        fontWeight: DESIGN_SYSTEM.fontWeight.semibold,
        fontFamily: "'Outfit', sans-serif",
        marginBottom: 8,
        margin: '0 0 8px',
      }}>
        {title}
      </h3>
      <p style={{
        color: DESIGN_SYSTEM.colors.text.muted,
        fontSize: 14,
        lineHeight: 1.6,
        maxWidth: 360,
        margin: '0 0 20px',
      }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            background: DESIGN_SYSTEM.colors.brand.primary,
            color: '#fff',
            border: 'none',
            borderRadius: DESIGN_SYSTEM.radius.md,
            padding: '10px 22px',
            fontSize: 14,
            fontWeight: DESIGN_SYSTEM.fontWeight.semibold,
            fontFamily: "'Outfit', sans-serif",
            cursor: 'pointer',
            transition: `all ${DESIGN_SYSTEM.transition.fast}`,
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
