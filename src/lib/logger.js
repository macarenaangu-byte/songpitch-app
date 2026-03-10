// Production-safe logger — only logs in development, suppresses in production
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  info: (...args) => isDev && console.log('[SongPitch]', ...args),
  warn: (...args) => isDev && console.warn('[SongPitch]', ...args),
  error: (...args) => console.error('[SongPitch]', ...args),
  debug: (...args) => isDev && console.log('[DEBUG]', ...args),
};
