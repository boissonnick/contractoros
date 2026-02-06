/**
 * Project Search Adapter
 */

import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { SearchResult } from '../types';
import { logger } from '@/lib/utils/logger';

/**
 * Search projects by name, address, and description
 */
export async function searchProjects(
  orgId: string,
  searchQuery: string
): Promise<SearchResult[]> {
  if (!orgId || !searchQuery.trim()) return [];

  const normalizedQuery = searchQuery.toLowerCase().trim();
  const results: SearchResult[] = [];

  try {
    // Fetch projects (Firestore doesn't support full-text search, so we fetch and filter client-side)
    const projectsRef = collection(db, 'organizations', orgId, 'projects');
    const q = query(projectsRef, limit(200));
    const snapshot = await getDocs(q);

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const name = (data.name || '').toLowerCase();
      const description = (data.description || '').toLowerCase();
      const address = data.address
        ? `${data.address.street || ''} ${data.address.city || ''} ${data.address.state || ''} ${data.address.zip || ''}`.toLowerCase()
        : '';
      const clientName = (data.clientName || '').toLowerCase();

      // Check if query matches any field
      let score = 0;
      let highlight = '';

      if (name.includes(normalizedQuery)) {
        score += 100;
        highlight = data.name;
      }
      if (clientName.includes(normalizedQuery)) {
        score += 80;
        if (!highlight) highlight = data.clientName;
      }
      if (address.includes(normalizedQuery)) {
        score += 60;
        if (!highlight) highlight = `${data.address?.city || ''}, ${data.address?.state || ''}`;
      }
      if (description.includes(normalizedQuery)) {
        score += 40;
        if (!highlight) highlight = data.description?.substring(0, 50) + '...';
      }

      if (score > 0) {
        const budget = data.budget
          ? `$${data.budget.toLocaleString()}`
          : '';
        const status = data.status || 'Unknown';

        results.push({
          id: doc.id,
          type: 'project',
          title: data.name || 'Unnamed Project',
          subtitle: [status, budget, data.clientName].filter(Boolean).join(' • '),
          url: `/dashboard/projects/${doc.id}`,
          highlight,
          score,
        });
      }
    });

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, 20);
  } catch (error) {
    logger.error('Error searching projects', { error: error, component: 'search-entity-adapters-project-adapter' });
    return [];
  }
}

export default searchProjects;
