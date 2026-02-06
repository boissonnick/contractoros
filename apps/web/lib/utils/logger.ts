/**
 * Structured logger with environment-aware log levels.
 *
 * - Production: only warn + error are emitted
 * - Development: all levels (debug, info, warn, error)
 *
 * Usage:
 *   import { logger } from '@/lib/utils/logger';
 *   logger.error('Failed to fetch', { error: err, hook: 'useClients' });
 *   logger.warn('Deprecated API called', { route: '/api/old' });
 *   logger.info('Invoice synced', { invoiceId: '123' });
 *   logger.debug('Payload', { data });
 *
 * Future Sentry integration:
 *   import { setErrorReporter } from '@/lib/utils/logger';
 *   setErrorReporter((msg, ctx) => Sentry.captureException(ctx?.error ?? msg, { extra: ctx }));
 */

type LogContext = Record<string, unknown>;
type ErrorReporter = (message: string, context?: LogContext) => void;

const isProd = process.env.NODE_ENV === 'production';

let errorReporter: ErrorReporter | null = null;

export function setErrorReporter(reporter: ErrorReporter): void {
  errorReporter = reporter;
}

function formatArgs(message: string, context?: LogContext): [string, ...unknown[]] {
  if (!context) return [message];
  return [message, context];
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (isProd) return;
    // eslint-disable-next-line no-console
    console.log(...formatArgs(`[DEBUG] ${message}`, context));
  },

  info(message: string, context?: LogContext): void {
    if (isProd) return;
    // eslint-disable-next-line no-console
    console.info(...formatArgs(`[INFO] ${message}`, context));
  },

  warn(message: string, context?: LogContext): void {
    // eslint-disable-next-line no-console
    console.warn(...formatArgs(`[WARN] ${message}`, context));
  },

  error(message: string, context?: LogContext): void {
    // eslint-disable-next-line no-console
    console.error(...formatArgs(`[ERROR] ${message}`, context));
    if (errorReporter) {
      try {
        errorReporter(message, context);
      } catch {
        // Never let the reporter crash the app
      }
    }
  },
};
