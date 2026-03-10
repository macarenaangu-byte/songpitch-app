import { X } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';

/**
 * FilterChips — shows active filters as removable pills.
 * @param {{ label: string, onRemove: () => void }[]} filters
 * @param {() => void} onClearAll
 */
export function FilterChips({ filters = [], onClearAll }) {
  if (filters.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {filters.map((f, i) => (
        <button
          key={i}
          onClick={f.onRemove}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: `${DESIGN_SYSTEM.colors.brand.primary}15`,
            border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}33`,
            borderRadius: 20, padding: '3px 10px 3px 12px',
            color: DESIGN_SYSTEM.colors.brand.primary,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'Outfit', sans-serif",
            transition: 'all 0.15s ease',
          }}
        >
          {f.label}
          <X size={12} />
        </button>
      ))}
      {filters.length >= 2 && onClearAll && (
        <button
          onClick={onClearAll}
          style={{
            background: 'none', border: 'none',
            color: DESIGN_SYSTEM.colors.text.muted,
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            fontFamily: "'Outfit', sans-serif",
            textDecoration: 'underline',
            padding: '2px 4px',
          }}
        >
          Clear all
        </button>
      )}
    </div>
  );
}
