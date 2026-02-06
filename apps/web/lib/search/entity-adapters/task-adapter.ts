/**
 * Task Search Adapter
 */

import { db } from '@/lib/firebase/config';
import { collectionGroup, getDocs, query, where, limit } from 'firebase/firestore';
import { SearchResult } from '../types';
import { logger } from '@/lib/utils/logger';

/**
 * Search tasks by name, description, and assignee
 */
export async function searchTasks(
  orgId: string,
  searchQuery: string
): Promise<SearchResult[]> {
  if (!orgId || !searchQuery.trim()) return [];

  const normalizedQuery = searchQuery.toLowerCase().trim();
  const results: SearchResult[] = [];

  try {
    // Use collection group query to search tasks across all projects
    const tasksRef = collectionGroup(db, 'tasks');
    const q = query(tasksRef, where('orgId', '==', orgId), limit(200));
    const snapshot = await getDocs(q);

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const name = (data.name || data.title || '').toLowerCase();
      const description = (data.description || '').toLowerCase();
      const assigneeName = (data.assigneeName || '').toLowerCase();
      const projectName = (data.projectName || '').toLowerCase();

      let score = 0;
      let highlight = '';

      // Check task name
      if (name.includes(normalizedQuery)) {
        score += 100;
        highlight = data.name || data.title;
      }

      // Check assignee
      if (assigneeName.includes(normalizedQuery)) {
        score += 80;
        if (!highlight) highlight = `Assigned to ${data.assigneeName}`;
      }

      // Check project name
      if (projectName.includes(normalizedQuery)) {
        score += 70;
        if (!highlight) highlight = data.projectName;
      }

      // Check description
      if (description.includes(normalizedQuery)) {
        score += 40;
        if (!highlight) highlight = data.description?.substring(0, 50) + '...';
      }

      if (score > 0) {
        const status = data.status || 'pending';
        const projectId = data.projectId || doc.ref.parent.parent?.id;

        results.push({
          id: doc.id,
          type: 'task',
          title: data.name || data.title || 'Unnamed Task',
          subtitle: [data.projectName, data.assigneeName, status].filter(Boolean).join(' • '),
          url: projectId ? `/dashboard/projects/${projectId}?tab=tasks` : '/dashboard/tasks',
          highlight,
          score,
        });
      }
    });

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 20);
  } catch (error) {
    logger.error('Error searching tasks', { error: error, component: 'search-entity-adapters-task-adapter' });
    return [];
  }
}

export default searchTasks;
