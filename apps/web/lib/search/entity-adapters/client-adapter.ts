/**
 * Client Search Adapter
 */

import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { SearchResult } from '../types';

/**
 * Search clients by name, email, phone, and company
 */
export async function searchClients(
  orgId: string,
  searchQuery: string
): Promise<SearchResult[]> {
  if (!orgId || !searchQuery.trim()) return [];

  const normalizedQuery = searchQuery.toLowerCase().trim();
  const results: SearchResult[] = [];

  try {
    const clientsRef = collection(db, 'organizations', orgId, 'clients');
    const q = query(clientsRef, limit(200));
    const snapshot = await getDocs(q);

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const displayName = (data.displayName || '').toLowerCase();
      const firstName = (data.firstName || '').toLowerCase();
      const lastName = (data.lastName || '').toLowerCase();
      const email = (data.email || '').toLowerCase();
      const phone = (data.phone || '').toLowerCase();
      const companyName = (data.companyName || '').toLowerCase();

      let score = 0;
      let highlight = '';

      // Check name matches
      if (displayName.includes(normalizedQuery)) {
        score += 100;
        highlight = data.displayName;
      } else if (firstName.includes(normalizedQuery) || lastName.includes(normalizedQuery)) {
        score += 90;
        highlight = data.displayName || `${data.firstName} ${data.lastName}`;
      }

      // Check company name
      if (companyName.includes(normalizedQuery)) {
        score += 85;
        if (!highlight) highlight = data.companyName;
      }

      // Check email
      if (email.includes(normalizedQuery)) {
        score += 70;
        if (!highlight) highlight = data.email;
      }

      // Check phone
      if (phone.includes(normalizedQuery)) {
        score += 60;
        if (!highlight) highlight = data.phone;
      }

      if (score > 0) {
        const subtitle = [
          data.companyName,
          data.email,
          data.phone,
        ].filter(Boolean).join(' • ');

        results.push({
          id: doc.id,
          type: 'client',
          title: data.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unnamed Client',
          subtitle: subtitle || 'No contact info',
          url: `/dashboard/clients/${doc.id}`,
          highlight,
          score,
        });
      }
    });

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 20);
  } catch (error) {
    console.error('Error searching clients:', error);
    return [];
  }
}

export default searchClients;
