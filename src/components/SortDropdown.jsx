import { DESIGN_SYSTEM } from '../constants/designSystem';

/**
 * SortDropdown — reusable sort selector.
 * @param {{ value: string, label: string }[]} options
 * @param {string} value — current selected value
 * @param {(value: string) => void} onChange
 */
export function SortDropdown({ options = [], value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 12, fontWeight: 500, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", whiteSpace: 'nowrap' }}>Sort by</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: DESIGN_SYSTEM.colors.bg.primary,
          border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
          borderRadius: 8,
          padding: '6px 10px',
          color: DESIGN_SYSTEM.colors.text.primary,
          fontSize: 13,
          fontWeight: 500,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          cursor: 'pointer',
          outline: 'none',
          appearance: 'auto',
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
