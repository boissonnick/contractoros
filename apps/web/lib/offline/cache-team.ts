/**
 * Team Caching for Offline Support
 * Caches team members for offline worker selection in daily logs
 */

import { saveOffline, getOfflineData } from './storage';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { logger } from '@/lib/utils/logger';

// Cached team member
export interface CachedTeamMember {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

// Cache metadata
export interface TeamCache {
  orgId: string;
  members: CachedTeamMember[];
  cachedAt: number;
}

const CACHE_KEY_PREFIX = 'offline-team-';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Get cache key for org
 */
function getCacheKey(orgId: string): string {
  return `${CACHE_KEY_PREFIX}${orgId}`;
}

/**
 * Cache team members for offline access
 */
export async function cacheTeamForOffline(orgId: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Fetch team members from Firestore
    const usersQuery = query(
      collection(db, 'users'),
      where('orgId', '==', orgId)
    );

    const snapshot = await getDocs(usersQuery);
    const members: CachedTeamMember[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      members.push({
        uid: doc.id,
        displayName: data.displayName || data.email?.split('@')[0] || 'Unknown',
        email: data.email || '',
        role: data.role || 'EMPLOYEE',
        avatarUrl: data.photoUrl || data.avatarUrl,
      });
    });

    // Save to offline storage
    const cache: TeamCache = {
      orgId,
      members,
      cachedAt: Date.now(),
    };

    await saveOffline(getCacheKey(orgId), cache, CACHE_TTL);
  } catch (error) {
    logger.error('Failed to cache team for offline', { error: error, component: 'offline-cache-team' });
    throw error;
  }
}

/**
 * Get cached team members
 */
export async function getCachedTeam(orgId: string): Promise<CachedTeamMember[]> {
  if (typeof window === 'undefined') return [];

  try {
    const cache = await getOfflineData<TeamCache>(getCacheKey(orgId));

    if (!cache) {
      return [];
    }

    // Check if cache is stale (older than 7 days)
    // Cache staleness is handled by the caller - we still return data

    return cache.members;
  } catch (error) {
    logger.error('Failed to get cached team', { error: error, component: 'offline-cache-team' });
    return [];
  }
}

/**
 * Check if team cache exists
 */
export async function hasTeamCache(orgId: string): Promise<boolean> {
  const cache = await getOfflineData<TeamCache>(getCacheKey(orgId));
  return cache !== null;
}

/**
 * Get cache age in milliseconds
 */
export async function getTeamCacheAge(orgId: string): Promise<number | null> {
  const cache = await getOfflineData<TeamCache>(getCacheKey(orgId));
  if (!cache) return null;
  return Date.now() - cache.cachedAt;
}

/**
 * Force refresh team cache
 */
export async function refreshTeamCache(orgId: string): Promise<CachedTeamMember[]> {
  await cacheTeamForOffline(orgId);
  return getCachedTeam(orgId);
}

/**
 * Get field workers only (EMPLOYEE, CONTRACTOR, FOREMAN roles)
 */
export async function getCachedFieldWorkers(orgId: string): Promise<CachedTeamMember[]> {
  const team = await getCachedTeam(orgId);
  const fieldRoles = ['EMPLOYEE', 'CONTRACTOR', 'FOREMAN', 'FIELD'];
  return team.filter((member) => fieldRoles.includes(member.role.toUpperCase()));
}

/**
 * Search cached team members by name or email
 */
export async function searchCachedTeam(
  orgId: string,
  searchTerm: string
): Promise<CachedTeamMember[]> {
  const team = await getCachedTeam(orgId);
  const term = searchTerm.toLowerCase();

  return team.filter(
    (member) =>
      member.displayName.toLowerCase().includes(term) ||
      member.email.toLowerCase().includes(term)
  );
}

/**
 * Get a specific team member by ID
 */
export async function getCachedTeamMember(
  orgId: string,
  memberId: string
): Promise<CachedTeamMember | null> {
  const team = await getCachedTeam(orgId);
  return team.find((member) => member.uid === memberId) || null;
}

/**
 * Get multiple team members by IDs
 */
export async function getCachedTeamMembers(
  orgId: string,
  memberIds: string[]
): Promise<CachedTeamMember[]> {
  const team = await getCachedTeam(orgId);
  return team.filter((member) => memberIds.includes(member.uid));
}
