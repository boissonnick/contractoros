/**
 * Error Handler Utility
 *
 * Provides standardized error handling, user-friendly messages,
 * and toast notifications for the application.
 */

import { toast } from '@/components/ui/Toast';
import { FirebaseError } from 'firebase/app';

/**
 * Standard application error structure
 */
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  originalError?: unknown;
}

/**
 * Firebase error codes mapped to user-friendly messages
 */
const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/invalid-api-key': 'Configuration error. Please contact support.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',

  // Firestore errors
  'permission-denied': 'You don\'t have permission to perform this action.',
  'not-found': 'The requested item was not found.',
  'already-exists': 'This item already exists.',
  'resource-exhausted': 'Too many requests. Please try again in a moment.',
  'failed-precondition': 'Operation cannot be completed at this time.',
  'aborted': 'Operation was cancelled. Please try again.',
  'out-of-range': 'The value is outside the allowed range.',
  'unimplemented': 'This feature is not yet available.',
  'internal': 'An internal error occurred. Please try again.',
  'unavailable': 'Service temporarily unavailable. Please try again.',
  'data-loss': 'Data may have been corrupted. Please refresh and try again.',
  'unauthenticated': 'Please sign in to continue.',
  'invalid-argument': 'Invalid data provided. Please check your input.',
  'deadline-exceeded': 'The operation timed out. Please try again.',
  'cancelled': 'Operation was cancelled.',

  // Storage errors
  'storage/unauthorized': 'You don\'t have permission to access this file.',
  'storage/canceled': 'Upload was cancelled.',
  'storage/unknown': 'An error occurred during file upload.',
  'storage/object-not-found': 'File not found.',
  'storage/quota-exceeded': 'Storage quota exceeded. Please contact support.',
  'storage/unauthenticated': 'Please sign in to upload files.',
  'storage/retry-limit-exceeded': 'Upload failed after multiple attempts. Please try again.',
};

/**
 * Generic error messages by category
 */
const GENERIC_ERROR_MESSAGES: Record<string, string> = {
  network: 'Network error. Please check your connection and try again.',
  timeout: 'Request timed out. Please try again.',
  validation: 'Please check your input and try again.',
  unknown: 'An unexpected error occurred. Please try again.',
};

/**
 * Convert any error to user-friendly message
 */
export function getErrorMessage(error: unknown): string {
  // Handle null/undefined
  if (!error) {
    return GENERIC_ERROR_MESSAGES.unknown;
  }

  // Handle Firebase errors
  if (error instanceof FirebaseError || (error && typeof error === 'object' && 'code' in error)) {
    const firebaseError = error as FirebaseError;
    const code = firebaseError.code?.replace('firestore/', '').replace('auth/', '').replace('storage/', '');

    if (code && FIREBASE_ERROR_MESSAGES[code]) {
      return FIREBASE_ERROR_MESSAGES[code];
    }
    if (firebaseError.code && FIREBASE_ERROR_MESSAGES[firebaseError.code]) {
      return FIREBASE_ERROR_MESSAGES[firebaseError.code];
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Check for network errors
    if (error.message.toLowerCase().includes('network') ||
        error.message.toLowerCase().includes('fetch')) {
      return GENERIC_ERROR_MESSAGES.network;
    }

    // Check for timeout errors
    if (error.message.toLowerCase().includes('timeout')) {
      return GENERIC_ERROR_MESSAGES.timeout;
    }

    // Return the error message if it's user-friendly
    if (error.message && !error.message.includes('undefined') &&
        error.message.length < 200 && !error.message.includes('Error:')) {
      return error.message;
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error.length < 200 ? error : GENERIC_ERROR_MESSAGES.unknown;
  }

  return GENERIC_ERROR_MESSAGES.unknown;
}

/**
 * Create an AppError from any error type
 */
export function createAppError(error: unknown, context?: string): AppError {
  const message = getErrorMessage(error);

  let code = 'UNKNOWN_ERROR';
  if (error instanceof FirebaseError) {
    code = error.code;
  } else if (error instanceof Error) {
    code = error.name || 'ERROR';
  }

  return {
    code,
    message,
    details: context,
    originalError: error,
  };
}

/**
 * Show an error toast with user-friendly message
 */
export function showErrorToast(error: unknown, title?: string): void {
  const message = getErrorMessage(error);
  toast.error(title || 'Error', message);
}

/**
 * Show a success toast
 */
export function showSuccessToast(message: string, title?: string): void {
  toast.success(title || 'Success', message);
}

/**
 * Show a warning toast
 */
export function showWarningToast(message: string, title?: string): void {
  toast.warning(title || 'Warning', message);
}

/**
 * Show an info toast
 */
export function showInfoToast(message: string, title?: string): void {
  toast.info(title || 'Info', message);
}

/**
 * Log error for debugging (could be extended to send to monitoring service)
 */
export function logError(error: unknown, context?: string): void {
  const appError = createAppError(error, context);

  // Log to console in development
  console.error(`[${appError.code}]${context ? ` ${context}:` : ''}`, {
    message: appError.message,
    details: appError.details,
    originalError: appError.originalError,
  });

  // TODO: In production, send to error monitoring service (e.g., Sentry)
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error, { extra: { context } });
  // }
}

/**
 * Handle error with toast and logging
 */
export function handleError(error: unknown, options?: {
  context?: string;
  title?: string;
  showToast?: boolean;
  log?: boolean;
}): AppError {
  const { context, title, showToast = true, log = true } = options || {};

  if (log) {
    logError(error, context);
  }

  if (showToast) {
    showErrorToast(error, title);
  }

  return createAppError(error, context);
}

/**
 * Wrap an async function with error handling
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options?: {
    context?: string;
    successMessage?: string;
    errorTitle?: string;
  }
): T {
  return (async (...args: unknown[]) => {
    try {
      const result = await fn(...args);
      if (options?.successMessage) {
        showSuccessToast(options.successMessage);
      }
      return result;
    } catch (error) {
      handleError(error, {
        context: options?.context,
        title: options?.errorTitle,
      });
      throw error;
    }
  }) as T;
}

/**
 * Check if an error is a permission denied error
 */
export function isPermissionError(error: unknown): boolean {
  if (error instanceof FirebaseError) {
    return error.code === 'permission-denied' ||
           error.code === 'auth/unauthorized' ||
           error.code === 'storage/unauthorized';
  }
  if (error instanceof Error) {
    return error.message.toLowerCase().includes('permission') ||
           error.message.toLowerCase().includes('unauthorized');
  }
  return false;
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof FirebaseError) {
    return error.code === 'unavailable' ||
           error.code === 'auth/network-request-failed';
  }
  if (error instanceof Error) {
    return error.message.toLowerCase().includes('network') ||
           error.message.toLowerCase().includes('fetch') ||
           error.message.toLowerCase().includes('offline');
  }
  return false;
}

/**
 * Check if an error is a not found error
 */
export function isNotFoundError(error: unknown): boolean {
  if (error instanceof FirebaseError) {
    return error.code === 'not-found' ||
           error.code === 'storage/object-not-found';
  }
  if (error instanceof Error) {
    return error.message.toLowerCase().includes('not found') ||
           error.message.toLowerCase().includes('does not exist');
  }
  return false;
}
