/**
 * Project Cache for Offline Use
 * Caches projects list for offline project selection in time entries
 */

import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { saveOffline, getOfflineData } from './storage';

// Cache keys
const PROJECTS_CACHE_KEY = 'cached-projects';
const CACHE_TIMESTAMP_KEY = 'projects-cache-timestamp';

// Cache TTL: 24 hours
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Simplified project data for offline use
 */
export interface CachedProject {
  id: string;
  name: string;
  clientName?: string;
  status: string;
  address?: string;
}

/**
 * Get the cache key for an org's projects
 */
function getProjectsCacheKey(orgId: string): string {
  return `${PROJECTS_CACHE_KEY}:${orgId}`;
}

function getTimestampKey(orgId: string): string {
  return `${CACHE_TIMESTAMP_KEY}:${orgId}`;
}

/**
 * Cache projects for offline use
 * Fetches all active projects and stores them locally
 */
export async function cacheProjectsForOffline(orgId: string): Promise<void> {
  if (!orgId) {
    throw new Error('Organization ID required');
  }

  try {
    // Fetch active projects from Firestore
    const projectsQuery = query(
      collection(db, 'projects'),
      where('orgId', '==', orgId),
      where('status', 'in', ['active', 'pending', 'planning']),
      orderBy('name', 'asc')
    );

    const snapshot = await getDocs(projectsQuery);

    // Convert to simplified cached format
    const cachedProjects: CachedProject[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unnamed Project',
        clientName: data.clientName,
        status: data.status,
        address: data.address?.street
          ? `${data.address.street}, ${data.address.city || ''}`
          : undefined,
      };
    });

    // Save to offline storage
    await saveOffline(getProjectsCacheKey(orgId), cachedProjects);
    await saveOffline(getTimestampKey(orgId), Date.now());
  } catch (error) {
    console.error('[OfflineCache] Failed to cache projects:', error);
    throw error;
  }
}

/**
 * Get cached projects for offline use
 */
export async function getCachedProjects(orgId: string): Promise<CachedProject[]> {
  if (!orgId) {
    return [];
  }

  const projects = await getOfflineData<CachedProject[]>(getProjectsCacheKey(orgId));
  return projects || [];
}

/**
 * Get the last cache timestamp
 */
export async function getLastCacheTime(orgId: string): Promise<Date | null> {
  const timestamp = await getOfflineData<number>(getTimestampKey(orgId));
  return timestamp ? new Date(timestamp) : null;
}

/**
 * Check if cache is stale
 */
export async function isCacheStale(orgId: string): Promise<boolean> {
  const timestamp = await getOfflineData<number>(getTimestampKey(orgId));

  if (!timestamp) {
    return true; // No cache, considered stale
  }

  return Date.now() - timestamp > CACHE_TTL_MS;
}

/**
 * Refresh cache if stale
 */
export async function refreshCacheIfNeeded(orgId: string): Promise<void> {
  const stale = await isCacheStale(orgId);

  if (stale) {
    await cacheProjectsForOffline(orgId);
  }
}

/**
 * Get cached projects with automatic refresh
 * Attempts to refresh if cache is stale, but returns cached data if offline
 */
export async function getCachedProjectsWithRefresh(orgId: string): Promise<CachedProject[]> {
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
  const stale = await isCacheStale(orgId);

  // If online and stale, try to refresh
  if (isOnline && stale) {
    try {
      await cacheProjectsForOffline(orgId);
    } catch {
      // Ignore refresh errors, will use existing cache
      console.warn('[OfflineCache] Failed to refresh project cache, using existing');
    }
  }

  return getCachedProjects(orgId);
}

/**
 * Clear project cache
 */
export async function clearProjectCache(orgId: string): Promise<void> {
  const { deleteOfflineData } = await import('./storage');
  await deleteOfflineData(getProjectsCacheKey(orgId));
  await deleteOfflineData(getTimestampKey(orgId));
}

/**
 * Hook helper: Initialize cache when user logs in
 * Call this when auth state changes to user logged in
 */
export async function initializeProjectCache(orgId: string): Promise<void> {
  try {
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

    if (isOnline) {
      await refreshCacheIfNeeded(orgId);
    }
  } catch (error) {
    console.warn('[OfflineCache] Failed to initialize project cache:', error);
  }
}
