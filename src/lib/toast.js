import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';

// ─── TOAST NOTIFICATION SYSTEM ──────────────────────────────────────────────
let toastQueue = [];
let toastListeners = [];

export const showToast = (message, type = 'success') => {
  const toast = { id: Date.now() + Math.random(), message, type };
  toastQueue.push(toast);
  toastListeners.forEach((l) => l([...toastQueue]));
  setTimeout(() => {
    toastQueue = toastQueue.filter((t) => t.id !== toast.id);
    toastListeners.forEach((l) => l([...toastQueue]));
  }, 4500);
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter(listener => listener !== setToasts);
    };
  }, []);

  const removeToast = (id) => {
    toastQueue = toastQueue.filter(t => t.id !== id);
    setToasts([...toastQueue]);
  };

  return (
    <div role="status" aria-live="polite" style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            background: toast.type === 'success' ? DESIGN_SYSTEM.colors.accent.green : toast.type === 'error' ? DESIGN_SYSTEM.colors.accent.red : DESIGN_SYSTEM.colors.brand.primary,
            color: DESIGN_SYSTEM.colors.text.primary,
            padding: '14px 20px',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            minWidth: 280,
            maxWidth: 400,
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "'Outfit', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'slideIn 0.3s ease-out',
            pointerEvents: 'auto',
            cursor: 'pointer',
          }}
          onClick={() => removeToast(toast.id)}
        >
          <span style={{ flex: 1 }}>{toast.message}</span>
          <X size={16} style={{ opacity: 0.7, flexShrink: 0 }} />
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes waveformPulse {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.85); }
        }
      `}</style>
    </div>
  );
}
