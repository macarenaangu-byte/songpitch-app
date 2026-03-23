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
            borderRadius: 20, padding: '4px 10px 4px 13px',
            color: DESIGN_SYSTEM.colors.brand.primary,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            transition: 'all 0.15s ease',
            letterSpacing: '0.2px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = `${DESIGN_SYSTEM.colors.brand.primary}22`;
            e.currentTarget.style.borderColor = `${DESIGN_SYSTEM.colors.brand.primary}60`;
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(201,168,76,0.15)';
            e.currentTarget.style.backdropFilter = 'blur(8px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = `${DESIGN_SYSTEM.colors.brand.primary}15`;
            e.currentTarget.style.borderColor = `${DESIGN_SYSTEM.colors.brand.primary}33`;
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.backdropFilter = 'none';
          }}
        >
          {f.label}
          <span style={{ paddingLeft: 4, display: 'inline-flex', alignItems: 'center' }}>
            <X size={11} />
          </span>
        </button>
      ))}
      {filters.length >= 2 && onClearAll && (
        <button
          onClick={onClearAll}
          style={{
            background: 'none', border: 'none',
            color: 'rgba(201,168,76,0.7)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            textDecoration: 'none',
            padding: '2px 4px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.textDecoration = 'underline';
            e.currentTarget.style.color = 'rgba(201,168,76,1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.textDecoration = 'none';
            e.currentTarget.style.color = 'rgba(201,168,76,0.7)';
          }}
        >
          Clear all
        </button>
      )}
    </div>
  );
}
