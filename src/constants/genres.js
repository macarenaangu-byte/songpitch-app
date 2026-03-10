import { DESIGN_SYSTEM } from './designSystem';

// ─── GENRE OPTIONS ──────────────────────────────────────────────────────────
export const GENRE_OPTIONS = [
  'Classical', 'Jazz', 'Electronic', 'Hip-Hop', 'Pop', 'Film Score',
  'Ambient', 'R&B', 'Afrobeats', 'World Music', 'Musical Theatre',
  'Rock', 'Country', 'Folk', 'Blues', 'Reggae', 'Latin', 'K-Pop', 'EDM', 'Indie'
];

// Profile badge definitions
export const PROFILE_BADGES = {
  alpha_tester: { label: 'Alpha Tester', icon: '🧪', color: DESIGN_SYSTEM.colors.brand.purple },
  rising_star: { label: 'Rising Star', icon: '🌟', color: DESIGN_SYSTEM.colors.accent.amber },
  verified_composer: { label: 'Verified Composer', icon: '✓', color: DESIGN_SYSTEM.colors.brand.primary },
  verified_exec: { label: 'Verified Executive', icon: '✓', color: DESIGN_SYSTEM.colors.brand.blue },
  top_contributor: { label: 'Top Contributor', icon: '⭐', color: DESIGN_SYSTEM.colors.accent.amber },
};
