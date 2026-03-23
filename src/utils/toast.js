import toast from 'react-hot-toast';
import { DESIGN_SYSTEM } from '../constants/designSystem';

const base = {
  style: {
    background: DESIGN_SYSTEM.colors.bg.elevated,
    color: DESIGN_SYSTEM.colors.text.primary,
    border: `1px solid rgba(255,255,255,0.08)`,
    borderRadius: '12px',
    fontFamily: DESIGN_SYSTEM.font.body,
    fontSize: '14px',
    fontWeight: 500,
    padding: '12px 16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    maxWidth: '360px',
  },
};

export const showToast = {
  success: (msg) => toast.success(msg, {
    ...base,
    iconTheme: { primary: DESIGN_SYSTEM.colors.brand.primary, secondary: DESIGN_SYSTEM.colors.bg.elevated },
  }),
  error: (msg) => toast.error(msg, {
    ...base,
    iconTheme: { primary: '#EF4444', secondary: DESIGN_SYSTEM.colors.bg.elevated },
  }),
  loading: (msg) => toast.loading(msg, { ...base }),
  info: (msg) => toast(msg, {
    ...base,
    icon: 'ℹ️',
  }),
  promise: (promise, msgs) => toast.promise(promise, msgs, { ...base }),
};

export default showToast;
