import { DESIGN_SYSTEM } from '../constants/designSystem';

export function Badge({ children, color = DESIGN_SYSTEM.colors.brand.primary }) {
  return (
    <span
      style={{
        background: color + "22",
        color: color,
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: DESIGN_SYSTEM.fontSize.xs,
        fontWeight: DESIGN_SYSTEM.fontWeight.semibold,
        border: `1px solid ${color}33`,
        display: 'inline-block',
        transition: DESIGN_SYSTEM.transition.fast,
        letterSpacing: '0.3px',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.border = `1px solid ${color}60`;
        e.currentTarget.style.background = color + '30';
        e.currentTarget.style.boxShadow = `0 2px 8px ${color}20`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.border = `1px solid ${color}33`;
        e.currentTarget.style.background = color + '22';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {children}
    </span>
  );
}
