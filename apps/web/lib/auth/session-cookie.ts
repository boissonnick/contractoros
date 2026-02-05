/**
 * Session cookie utilities for Next.js middleware auth pre-check.
 *
 * Sets/clears a __session cookie that middleware uses to detect
 * authenticated users. The cookie contains the Firebase ID token
 * but middleware only checks existence, not validity.
 */

const SESSION_COOKIE_NAME = '__session';
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 5; // 5 days

/** Set session cookie after successful auth */
export async function setSessionCookie(idToken: string): Promise<void> {
  if (typeof document === 'undefined') return;

  // Use Secure flag in production, SameSite=Lax for CSRF protection
  const isSecure = window.location.protocol === 'https:';
  document.cookie = `${SESSION_COOKIE_NAME}=${idToken}; path=/; max-age=${SESSION_COOKIE_MAX_AGE}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
}

/** Clear session cookie on sign out */
export function clearSessionCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0`;
}

/** Check if session cookie exists (client-side check) */
export function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes(`${SESSION_COOKIE_NAME}=`);
}
