import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Send to Sentry if available (loaded via REACT_APP_SENTRY_DSN in public/index.html)
    if (window.Sentry) window.Sentry.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: DESIGN_SYSTEM.colors.bg.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: 420,
          }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: DESIGN_SYSTEM.radius.lg,
              background: `${DESIGN_SYSTEM.colors.accent.amber}15`,
              border: `1px solid ${DESIGN_SYSTEM.colors.accent.amber}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <AlertTriangle size={32} color={DESIGN_SYSTEM.colors.accent.amber} />
            </div>
            <h1 style={{
              color: DESIGN_SYSTEM.colors.text.primary,
              fontSize: 24,
              fontWeight: DESIGN_SYSTEM.fontWeight.bold,
              fontFamily: "'Outfit', sans-serif",
              marginBottom: 12,
            }}>
              Something went wrong
            </h1>
            <p style={{
              color: DESIGN_SYSTEM.colors.text.tertiary,
              fontSize: DESIGN_SYSTEM.fontSize.md,
              lineHeight: 1.6,
              marginBottom: 28,
            }}>
              An unexpected error occurred. Please reload the app to continue.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: DESIGN_SYSTEM.colors.brand.primary,
                color: DESIGN_SYSTEM.colors.text.primary,
                border: 'none',
                borderRadius: DESIGN_SYSTEM.radius.md,
                padding: '14px 28px',
                fontSize: DESIGN_SYSTEM.fontSize.md,
                fontWeight: DESIGN_SYSTEM.fontWeight.semibold,
                fontFamily: "'Outfit', sans-serif",
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: `all ${DESIGN_SYSTEM.transition.fast}`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = DESIGN_SYSTEM.colors.brand.light;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = DESIGN_SYSTEM.colors.brand.primary;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <RefreshCw size={16} /> Reload App
            </button>
            <button
              onClick={() => window.open('https://github.com/songpitch/app/issues', '_blank')}
              style={{
                background: 'transparent',
                color: DESIGN_SYSTEM.colors.text.muted,
                border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                borderRadius: DESIGN_SYSTEM.radius.md,
                padding: '14px 28px',
                fontSize: DESIGN_SYSTEM.fontSize.md,
                fontWeight: DESIGN_SYSTEM.fontWeight.semibold,
                fontFamily: "'Outfit', sans-serif",
                cursor: 'pointer',
                transition: `all ${DESIGN_SYSTEM.transition.fast}`,
              }}
            >
              Report Issue
            </button>
            </div>
            {this.state.error && (
              <p style={{
                color: DESIGN_SYSTEM.colors.text.muted,
                fontSize: DESIGN_SYSTEM.fontSize.xs,
                marginTop: 24,
                fontFamily: 'monospace',
                background: DESIGN_SYSTEM.colors.bg.card,
                padding: '8px 12px',
                borderRadius: DESIGN_SYSTEM.radius.sm,
                border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                wordBreak: 'break-word',
              }}>
                {this.state.error.message || 'Unknown error'}
              </p>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
