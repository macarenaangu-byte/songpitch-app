import { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { DESIGN_SYSTEM } from '../constants/designSystem';

// ── Command groups & items ─────────────────────────────────────────────────
// Each item: { id, label, description?, icon, onSelect(navigate, closeAll) }
// navigate is a function(page) that sets the current page in the app

const NAV_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard',       description: 'Overview & stats',        icon: '⊞' },
  { id: 'portfolio',     label: 'My Portfolio',     description: 'Your uploaded tracks',    icon: '🎵' },
  { id: 'catalog',       label: 'Browse Catalog',   description: 'Discover tracks',         icon: '🔍' },
  { id: 'opportunities', label: 'Opportunities',    description: 'Active sync briefs',      icon: '📋' },
  { id: 'messages',      label: 'Messages',         description: 'Your conversations',      icon: '💬' },
  { id: 'responses',     label: 'My Responses',     description: 'Track your pitches',      icon: '📊' },
  { id: 'splits',        label: 'Split Generator',  description: 'Create split sheets',     icon: '📄' },
  { id: 'profile',       label: 'Edit Profile',     description: 'Update your profile',     icon: '👤' },
];

const ACTION_ITEMS = [
  { id: 'upload',    label: 'Upload New Track',  description: 'Add to your portfolio',   icon: '⬆️',  page: 'portfolio' },
  { id: 'new-split', label: 'New Split Sheet',   description: 'Create a split document', icon: '✍️', page: 'splits' },
  { id: 'browse',    label: 'Browse Briefs',     description: 'Find sync opportunities', icon: '🎬', page: 'opportunities' },
];

// ── Styles ─────────────────────────────────────────────────────────────────
const overlayStyle = {
  position: 'fixed', inset: 0,
  background: 'rgba(4,5,14,0.75)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  zIndex: 9000,
  display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
  paddingTop: '15vh',
};

const dialogStyle = {
  width: '100%', maxWidth: 560,
  background: DESIGN_SYSTEM.colors.bg.elevated,
  border: `1px solid rgba(255,255,255,0.10)`,
  borderRadius: 16,
  boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.08)',
  overflow: 'hidden',
  fontFamily: DESIGN_SYSTEM.font.body,
};

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '16px 20px',
  background: 'transparent',
  border: 'none',
  borderBottom: `1px solid rgba(255,255,255,0.08)`,
  color: DESIGN_SYSTEM.colors.text.primary,
  fontFamily: DESIGN_SYSTEM.font.body,
  fontSize: 16,
  outline: 'none',
};

const listStyle = {
  maxHeight: 360,
  overflowY: 'auto',
  padding: '8px 0',
};

const groupHeadingStyle = {
  padding: '8px 16px 4px',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: DESIGN_SYSTEM.colors.text.tertiary,
};

const itemBaseStyle = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '10px 16px',
  borderRadius: 8,
  margin: '1px 8px',
  cursor: 'pointer',
  transition: 'background 0.12s ease',
};

const emptyStyle = {
  padding: '32px 20px',
  textAlign: 'center',
  color: DESIGN_SYSTEM.colors.text.tertiary,
  fontSize: 14,
};

const footerStyle = {
  display: 'flex', alignItems: 'center', gap: 16,
  padding: '10px 16px',
  borderTop: `1px solid rgba(255,255,255,0.06)`,
  fontSize: 12,
  color: DESIGN_SYSTEM.colors.text.tertiary,
};

const kbdStyle = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 5,
  padding: '2px 6px',
  fontSize: 11,
  fontFamily: DESIGN_SYSTEM.font.mono,
};

export default function CommandPalette({ open, onClose, onNavigate }) {
  const [query, setQuery] = useState('');

  // Reset search on open
  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const select = useCallback((page) => {
    onNavigate(page);
    onClose();
  }, [onNavigate, onClose]);

  if (!open) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={e => e.stopPropagation()}>
        <Command label="Command palette" shouldFilter={true}>
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Search pages, actions…"
            style={inputStyle}
            autoFocus
          />
          <Command.List style={listStyle}>
            <Command.Empty style={emptyStyle}>No results found.</Command.Empty>

            <Command.Group heading="">
              <div style={groupHeadingStyle}>Navigate</div>
              {NAV_ITEMS.map(item => (
                <Command.Item
                  key={item.id}
                  value={`${item.label} ${item.description}`}
                  onSelect={() => select(item.id)}
                  style={itemBaseStyle}
                  className="cmd-item"
                >
                  <span style={{ fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: DESIGN_SYSTEM.colors.text.primary }}>{item.label}</div>
                    {item.description && <div style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.tertiary, marginTop: 1 }}>{item.description}</div>}
                  </div>
                  <span style={{ fontSize: 11, color: DESIGN_SYSTEM.colors.text.muted }}>↵</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="">
              <div style={groupHeadingStyle}>Quick Actions</div>
              {ACTION_ITEMS.map(item => (
                <Command.Item
                  key={item.id}
                  value={`${item.label} ${item.description}`}
                  onSelect={() => select(item.page)}
                  style={itemBaseStyle}
                  className="cmd-item"
                >
                  <span style={{ fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: DESIGN_SYSTEM.colors.text.primary }}>{item.label}</div>
                    {item.description && <div style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.tertiary, marginTop: 1 }}>{item.description}</div>}
                  </div>
                  <span style={{ fontSize: 11, color: DESIGN_SYSTEM.colors.text.muted }}>↵</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          <div style={footerStyle}>
            <span><kbd style={kbdStyle}>↑↓</kbd> navigate</span>
            <span><kbd style={kbdStyle}>↵</kbd> open</span>
            <span><kbd style={kbdStyle}>esc</kbd> close</span>
            <span style={{ marginLeft: 'auto' }}>⌘K</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
