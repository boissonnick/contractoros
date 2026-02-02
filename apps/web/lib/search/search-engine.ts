/**
 * Global Search Engine
 * Aggregates search results from multiple entity adapters
 */

import { SearchResult, SearchFilter, SearchEntityType } from './types';
import { searchProjects } from './entity-adapters/project-adapter';
import { searchClients } from './entity-adapters/client-adapter';
import { searchInvoices } from './entity-adapters/invoice-adapter';
import { searchTasks } from './entity-adapters/task-adapter';

const DEFAULT_ENTITY_TYPES: SearchEntityType[] = [
  'project',
  'client',
  'invoice',
  'task',
];

/**
 * Search across all entity types
 */
export async function searchAll(
  orgId: string,
  searchQuery: string,
  filters?: Partial<SearchFilter>
): Promise<SearchResult[]> {
  if (!orgId || !searchQuery.trim()) {
    return [];
  }

  const entityTypes = filters?.entityTypes?.length
    ? filters.entityTypes
    : DEFAULT_ENTITY_TYPES;

  // Run searches in parallel for enabled entity types
  const searchPromises: Promise<SearchResult[]>[] = [];

  if (entityTypes.includes('project')) {
    searchPromises.push(searchProjects(orgId, searchQuery));
  }
  if (entityTypes.includes('client')) {
    searchPromises.push(searchClients(orgId, searchQuery));
  }
  if (entityTypes.includes('invoice')) {
    searchPromises.push(searchInvoices(orgId, searchQuery));
  }
  if (entityTypes.includes('task')) {
    searchPromises.push(searchTasks(orgId, searchQuery));
  }

  // Wait for all searches to complete
  const results = await Promise.all(searchPromises);

  // Flatten and combine all results
  let allResults = results.flat();

  // Sort by score (highest first)
  allResults.sort((a, b) => b.score - a.score);

  // Limit to 50 results max
  return allResults.slice(0, 50);
}

/**
 * Group search results by entity type
 */
export function groupResultsByType(
  results: SearchResult[]
): Record<SearchEntityType, SearchResult[]> {
  const grouped: Record<SearchEntityType, SearchResult[]> = {
    project: [],
    client: [],
    invoice: [],
    task: [],
    estimate: [],
    subcontractor: [],
  };

  for (const result of results) {
    if (grouped[result.type]) {
      grouped[result.type].push(result);
    }
  }

  return grouped;
}

/**
 * Get recent searches from localStorage
 */
export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem('recentSearches');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save a search query to recent searches
 */
export function saveRecentSearch(query: string): void {
  if (typeof window === 'undefined' || !query.trim()) return;

  try {
    const recent = getRecentSearches();
    // Remove duplicates and add to front
    const updated = [query, ...recent.filter((q) => q !== query)].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Clear recent searches
 */
export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('recentSearches');
  } catch {
    // Ignore localStorage errors
  }
}

export default searchAll;
