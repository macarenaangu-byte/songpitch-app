// ─── SONGPITCH DESIGN SYSTEM — MIDNIGHT GOLD ────────────────────────────────
export const DESIGN_SYSTEM = {

  font: {
    display: "'Space Grotesk', sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  fontSize: {
    xs: 12,
    sm: 13,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 28,
    display: 40,
    hero: 56,
  },

  radius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '20px',
    full: '9999px',
  },

  spacing: {
    xs: '6px',
    sm: '8px',
    md: '12px',
    lg: '20px',
    xl: '32px',
    xxl: '48px',
  },

  shadow: {
    sm:    '0 1px 3px rgba(0,0,0,0.4)',
    md:    '0 4px 16px rgba(0,0,0,0.35)',
    lg:    '0 8px 32px rgba(0,0,0,0.4)',
    xl:    '0 20px 60px rgba(0,0,0,0.5)',
    hover: '0 8px 32px rgba(201,168,76,0.15), 0 2px 8px rgba(0,0,0,0.3)',
    gold:  '0 0 20px rgba(201,168,76,0.25)',
    card:  '0 1px 4px rgba(0,0,0,0.3)',
  },

  colors: {
    bg: {
      primary:   '#06080F',   // page bg — deep obsidian
      secondary: '#0B0D1C',   // sidebar — distinct cooler shade
      card:      '#111425',   // card surfaces — clear lift above page
      hover:     '#171A2E',   // card hover state
      elevated:  '#1C1F35',   // inputs, dropdowns, modals
      surface:   '#22263C',   // active / selected state
    },
    border: {
      light:  'rgba(255,255,255,0.09)',   // structural grid — works on any surface
      medium: 'rgba(255,255,255,0.16)',   // hover / active borders
      accent: '#C9A84C',                 // gold border
    },
    text: {
      primary:   '#F5F0E8',               // warm off-white
      secondary: '#B8AF9F',               // lifted for readability (was A89F91)
      tertiary:  '#7A7468',               // subtle
      muted:     '#514C44',               // very muted
      gold:      '#C9A84C',               // gold text
      label:     'rgba(255,255,255,0.35)',// uppercase section labels
    },
    brand: {
      primary:   '#C9A84C',   // gold
      light:     '#E8C547',   // bright gold
      dark:      '#A8873A',   // deep gold
      accent:    '#C9A84C',
      secondary: '#D4AF6A',   // warm champagne
      muted:     'rgba(201,168,76,0.15)',
      blue:      '#3B82F6',   // referenced by StatCard / Dashboard
      purple:    '#8B5CF6',   // referenced by StatCard / Roster
    },
    gradient: {
      main:    'linear-gradient(135deg, #C9A84C 0%, #E8C547 100%)',
      subtle:  'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(232,197,71,0.06) 100%)',
      hover:   'linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(232,197,71,0.10) 100%)',
      hero:    'linear-gradient(160deg, #080A12 0%, #0D1020 50%, #080A12 100%)',
      card:    'linear-gradient(145deg, #12141F 0%, #0D0F1A 100%)',
      gold:    'linear-gradient(135deg, #A8873A 0%, #C9A84C 40%, #E8C547 100%)',
    },
    accent: {
      gold:   '#C9A84C',
      amber:  '#E8C547',
      purple: '#8B5CF6',
      pink:   '#EC4899',
      red:    '#E74C3C',
      green:  '#22C55E',
      blue:   '#3B82F6',
    },
  },

  transition: {
    fast:   '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow:   '350ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};
