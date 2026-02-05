'use client';

import { useAuth } from '@/lib/auth';
import { UserProfile } from '@/types';

/**
 * Hook that provides a guaranteed orgId when the user is authenticated
 * and has a profile with an organization.
 *
 * Use this instead of the defensive `const orgId = profile?.orgId; if (!orgId) return;`
 * pattern that appears in 30+ hooks.
 *
 * @example
 * // Before:
 * const { profile } = useAuth();
 * const orgId = profile?.orgId;
 * if (!orgId) { setLoading(false); return; }
 *
 * // After:
 * const { orgId, profile, ready } = useAuthenticatedOrg();
 * if (!ready) return; // orgId is guaranteed non-null after this
 */

type AuthenticatedOrgResult =
  | { ready: false; orgId: null; profile: null; loading: boolean }
  | { ready: true; orgId: string; profile: UserProfile; loading: false };

export function useAuthenticatedOrg(): AuthenticatedOrgResult {
  const { profile, loading } = useAuth();

  if (loading) {
    return { ready: false, orgId: null, profile: null, loading: true };
  }

  const orgId = profile?.orgId;

  if (!orgId || !profile) {
    return { ready: false, orgId: null, profile: null, loading: false };
  }

  return { ready: true, orgId, profile, loading: false };
}
