/**
 * Production-safe logging utility
 * Only logs in development mode, prevents console pollution in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Log info messages (only in development)
   */
  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Log warning messages (always logged)
   */
  warn: (...args: unknown[]): void => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Log error messages (always logged)
   */
  error: (...args: unknown[]): void => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Log success messages (only in development)
   */
  success: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log('[SUCCESS] ✅', ...args);
    }
  },

  /**
   * Log debug messages with emoji (only in development)
   */
  debug: (emoji: string, ...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${emoji}`, ...args);
    }
  },
};
