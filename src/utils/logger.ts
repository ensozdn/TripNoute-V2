const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },
  warn: (...args: unknown[]): void => {
    console.warn('[WARN]', ...args);
  },
  error: (...args: unknown[]): void => {
    console.error('[ERROR]', ...args);
  },
  success: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log('[SUCCESS] ', ...args);
    }
  },
  debug: (emoji: string, ...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${emoji}`, ...args);
    }
  },
};
