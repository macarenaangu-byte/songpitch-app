import { DESIGN_SYSTEM } from '../constants/designSystem';

export function Badge({ children, color = DESIGN_SYSTEM.colors.brand.primary }) {
  return (
    <span style={{
      background: color + "22",
      color: color,
      padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
      borderRadius: DESIGN_SYSTEM.radius.full,
      fontSize: DESIGN_SYSTEM.fontSize.xs,
      fontWeight: DESIGN_SYSTEM.fontWeight.semibold,
      border: `1px solid ${color}33`,
      display: 'inline-block',
      transition: DESIGN_SYSTEM.transition.fast,
    }}>
      {children}
    </span>
  );
}
