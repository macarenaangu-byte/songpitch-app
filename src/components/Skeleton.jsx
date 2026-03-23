import { DESIGN_SYSTEM } from '../constants/designSystem';

// Pulse animation via inline keyframes injected once
const SKELETON_STYLE = {
  background: `linear-gradient(90deg, ${DESIGN_SYSTEM.colors.bg.card} 25%, ${DESIGN_SYSTEM.colors.bg.hover} 50%, ${DESIGN_SYSTEM.colors.bg.card} 75%)`,
  backgroundSize: '200% 100%',
  animation: 'skeletonShimmer 1.6s ease-in-out infinite',
  borderRadius: 8,
};

// Song card skeleton
export function SongCardSkeleton() {
  return (
    <div style={{ background: DESIGN_SYSTEM.colors.bg.card, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ ...SKELETON_STYLE, height: 120, borderRadius: 12 }} />
      <div style={{ ...SKELETON_STYLE, height: 16, width: '70%' }} />
      <div style={{ ...SKELETON_STYLE, height: 12, width: '45%' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ ...SKELETON_STYLE, height: 24, width: 60, borderRadius: 20 }} />
        <div style={{ ...SKELETON_STYLE, height: 24, width: 50, borderRadius: 20 }} />
      </div>
    </div>
  );
}

// Opportunity card skeleton
export function OpportunityCardSkeleton() {
  return (
    <div style={{ background: DESIGN_SYSTEM.colors.bg.card, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ ...SKELETON_STYLE, height: 18, width: '55%' }} />
        <div style={{ ...SKELETON_STYLE, height: 24, width: 70, borderRadius: 20 }} />
      </div>
      <div style={{ ...SKELETON_STYLE, height: 13, width: '90%' }} />
      <div style={{ ...SKELETON_STYLE, height: 13, width: '75%' }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <div style={{ ...SKELETON_STYLE, height: 22, width: 80, borderRadius: 20 }} />
        <div style={{ ...SKELETON_STYLE, height: 22, width: 65, borderRadius: 20 }} />
      </div>
    </div>
  );
}

// Message thread skeleton
export function MessageThreadSkeleton() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
      <div style={{ ...SKELETON_STYLE, width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ ...SKELETON_STYLE, height: 14, width: '60%' }} />
        <div style={{ ...SKELETON_STYLE, height: 12, width: '85%' }} />
      </div>
    </div>
  );
}

// Stat card skeleton
export function StatCardSkeleton() {
  return (
    <div style={{ background: DESIGN_SYSTEM.colors.bg.card, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ ...SKELETON_STYLE, height: 13, width: '50%' }} />
        <div style={{ ...SKELETON_STYLE, height: 32, width: 32, borderRadius: 8 }} />
      </div>
      <div style={{ ...SKELETON_STYLE, height: 32, width: '40%' }} />
    </div>
  );
}

// Generic line skeleton (reusable)
export function LineSkeleton({ width = '100%', height = 14, style = {} }) {
  return <div style={{ ...SKELETON_STYLE, height, width, borderRadius: 6, ...style }} />;
}

// Table row skeleton
export function TableRowSkeleton({ cols = 4 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, padding: '16px 0', borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} style={{ ...SKELETON_STYLE, height: 14, width: i === 0 ? '80%' : '60%' }} />
      ))}
    </div>
  );
}

// Page-level skeleton grid helpers
export function SongGridSkeleton({ count = 6 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
      {Array.from({ length: count }).map((_, i) => <SongCardSkeleton key={i} />)}
    </div>
  );
}

export function OpportunityGridSkeleton({ count = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => <OpportunityCardSkeleton key={i} />)}
    </div>
  );
}

export function MessageListSkeleton({ count = 6 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => <MessageThreadSkeleton key={i} />)}
    </div>
  );
}
