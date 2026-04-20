// Production-safe logger — only logs in development, suppresses in production
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  info: (...args) => isDev && console.log('[Coda-Vault]', ...args),
  warn: (...args) => isDev && console.warn('[Coda-Vault]', ...args),
  error: (...args) => console.error('[Coda-Vault]', ...args),
  debug: (...args) => isDev && console.log('[DEBUG]', ...args),
};
