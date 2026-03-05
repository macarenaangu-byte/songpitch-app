import { DESIGN_SYSTEM } from '../constants/designSystem';

export function StatCard({ icon, label, value, color = DESIGN_SYSTEM.colors.brand.primary, onClick, subtitle }) {
  return (
    <div className="song-card" onClick={onClick} style={{
      background: DESIGN_SYSTEM.colors.bg.card,
      borderRadius: DESIGN_SYSTEM.radius.lg,
      padding: DESIGN_SYSTEM.spacing.lg,
      border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
      flex: 1,
      minWidth: 140,
      transition: DESIGN_SYSTEM.transition.normal,
      cursor: onClick ? 'pointer' : 'default',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = onClick ? color + '60' : DESIGN_SYSTEM.colors.border.medium;
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = DESIGN_SYSTEM.shadow.md;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light;
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: DESIGN_SYSTEM.radius.md,
        background: color + "18",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: DESIGN_SYSTEM.spacing.sm
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: DESIGN_SYSTEM.fontSize.xxl,
        fontWeight: DESIGN_SYSTEM.fontWeight.extrabold,
        color: DESIGN_SYSTEM.colors.text.primary,
        fontFamily: "'Outfit', sans-serif"
      }}>{value}</div>
      <div style={{
        fontSize: DESIGN_SYSTEM.fontSize.sm,
        color: DESIGN_SYSTEM.colors.text.tertiary,
        marginTop: DESIGN_SYSTEM.spacing.xs
      }}>{label}</div>
      {subtitle && (
        <div style={{
          fontSize: 12,
          color: DESIGN_SYSTEM.colors.brand.primary,
          marginTop: 4,
          fontWeight: 600,
        }}>{subtitle}</div>
      )}
    </div>
  );
}
