// ─── DESIGN SYSTEM ──────────────────────────────────────────────────────────
export const DESIGN_SYSTEM = {
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },

  spacing: {
    xs: '6px',
    sm: '8px',
    md: '12px',
    lg: '20px',
    xl: '28px',
  },

  fontSize: {
    xs: 12,
    sm: 13,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 28,
  },

  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.25)',
    md: '0 4px 12px rgba(0,0,0,0.2)',
    lg: '0 8px 24px rgba(0,0,0,0.25)',
    xl: '0 16px 40px rgba(0,0,0,0.3)',
    hover: '0 8px 24px rgba(29,185,84,0.12), 0 2px 8px rgba(0,0,0,0.2)',
    card: '0 1px 3px rgba(0,0,0,0.2)',
  },

  colors: {
    bg: {
      primary: '#0a0a0a',
      secondary: '#111111',
      card: '#181818',
      hover: '#1f1f1f',
      elevated: '#242424',
      surface: '#282828',
    },
    border: {
      light: '#282828',
      medium: '#333333',
      accent: '#1DB954',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B3B3B3',
      tertiary: '#898989',
      muted: '#6A6A6A',
    },
    brand: {
      primary: '#1DB954',
      light: '#1ED760',
      dark: '#1AA34A',
      accent: '#1DB954',
      blue: '#2D7FF9',
      purple: '#8B5CF6',
      secondary: '#2D7FF9',
    },
    gradient: {
      main: 'linear-gradient(135deg, #1DB954 0%, #1ED760 100%)',
      subtle: 'linear-gradient(135deg, rgba(29,185,84,0.12) 0%, rgba(45,127,249,0.08) 100%)',
      hover: 'linear-gradient(135deg, rgba(29,185,84,0.18) 0%, rgba(45,127,249,0.12) 100%)',
      hero: 'linear-gradient(135deg, #0a0a0a 0%, #111a14 50%, #0a0a0a 100%)',
    },
    accent: {
      purple: '#8B5CF6',
      pink: '#EC4899',
      green: '#1DB954',
      red: '#E74C3C',
      amber: '#F59E0B',
    },
  },

  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};
