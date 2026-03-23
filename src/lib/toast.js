// ─── TOAST COMPATIBILITY SHIM ────────────────────────────────────────────────
// All callers have been migrated to src/utils/toast.js (react-hot-toast).
// This shim keeps backward-compatible showToast(msg, type) imports working.

import { showToast as _showToast } from '../utils/toast';

export const showToast = (message, type = 'success') => {
  if (type === 'error') return _showToast.error(message);
  if (type === 'info')  return _showToast.info(message);
  if (type === 'loading') return _showToast.loading(message);
  return _showToast.success(message);
};

// No-op component — <Toaster> from react-hot-toast is mounted in App.jsx instead.
export function ToastContainer() {
  return null;
}
