import * as Sentry from '@sentry/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import reportWebVitals from './reportWebVitals';

if (process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn:              process.env.REACT_APP_SENTRY_DSN,
    environment:      process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// ── PWA Service Worker Registration ─────────────────────────────────────────
// Only register in production. In development, the SW's Cache First strategy
// intercepts webpack hot-reload chunks and returns stale cached versions,
// which breaks HMR and causes continuous page blink loops.
if ('serviceWorker' in navigator) {
  if (process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[SW] Registered:', reg.scope);
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                window.dispatchEvent(new CustomEvent('sw-update-available'));
              }
            });
          });
        })
        .catch((err) => console.error('[SW] Registration failed:', err));
    });
  } else {
    // Development: unregister any previously installed SW so it stops
    // interfering with webpack dev server's hot module replacement.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((r) => r.unregister());
      if (registrations.length) console.log('[SW] Unregistered', registrations.length, 'worker(s) in dev mode');
    });
  }
}
