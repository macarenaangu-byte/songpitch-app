import { DESIGN_SYSTEM } from '../constants/designSystem';

export function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(4,5,14,0.78)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20,
    }}>
      <div className="modal-enter" style={{
        background: DESIGN_SYSTEM.colors.bg.card,
        borderRadius: 20,
        padding: 28,
        maxWidth: 420,
        width: '100%',
        border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
      }}>
        <h3 style={{
          color: DESIGN_SYSTEM.colors.text.primary,
          fontSize: 18,
          fontWeight: 700,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          marginBottom: 12,
        }}>
          {title}
        </h3>
        <p style={{
          color: DESIGN_SYSTEM.colors.text.secondary,
          fontSize: 14,
          lineHeight: 1.5,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          marginBottom: 24,
        }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              color: DESIGN_SYSTEM.colors.text.tertiary,
              border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
              borderRadius: 10,
              padding: '10px 20px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              background: DESIGN_SYSTEM.colors.brand.primary,
              color: DESIGN_SYSTEM.colors.text.primary,
              border: 'none',
              borderRadius: 10,
              padding: '10px 20px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
