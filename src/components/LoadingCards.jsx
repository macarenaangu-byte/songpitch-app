import { DESIGN_SYSTEM } from '../constants/designSystem';

export function LoadingSongCard() {
  return (
    <div className="song-card" style={{
      background: DESIGN_SYSTEM.colors.bg.card,
      borderRadius: DESIGN_SYSTEM.radius.lg,
      padding: `${DESIGN_SYSTEM.spacing.md} ${DESIGN_SYSTEM.spacing.lg}`,
      border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
      display: 'flex',
      alignItems: 'center',
      gap: DESIGN_SYSTEM.spacing.md,
    }}>
      <div className="skeleton" style={{ width: 52, height: 52, borderRadius: DESIGN_SYSTEM.radius.md, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: DESIGN_SYSTEM.spacing.xs }}>
        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
      </div>
    </div>
  );
}

export function LoadingOpportunityCard() {
  return (
    <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 20, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="skeleton" style={{ height: 14, width: '50%', borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 6 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <div className="skeleton" style={{ height: 12, width: 120, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 12, width: 60, borderRadius: 6 }} />
      </div>
    </div>
  );
}

export function LoadingMessageItem() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 999 }} />
      <div style={{ maxWidth: '60%' }}>
        <div className="skeleton" style={{ height: 14, width: '70%', borderRadius: 8, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 8 }} />
      </div>
    </div>
  );
}
