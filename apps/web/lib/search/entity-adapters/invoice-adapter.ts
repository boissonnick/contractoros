/**
 * Invoice Search Adapter
 */

import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { SearchResult } from '../types';

/**
 * Search invoices by invoice number, client name, project name, and amount
 */
export async function searchInvoices(
  orgId: string,
  searchQuery: string
): Promise<SearchResult[]> {
  if (!orgId || !searchQuery.trim()) return [];

  const normalizedQuery = searchQuery.toLowerCase().trim();
  const results: SearchResult[] = [];

  try {
    const invoicesRef = collection(db, 'organizations', orgId, 'invoices');
    const q = query(invoicesRef, limit(200));
    const snapshot = await getDocs(q);

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const invoiceNumber = (data.invoiceNumber || '').toLowerCase();
      const clientName = (data.clientName || '').toLowerCase();
      const projectName = (data.projectName || '').toLowerCase();
      const amount = data.total?.toString() || '';

      let score = 0;
      let highlight = '';

      // Check invoice number (highest priority)
      if (invoiceNumber.includes(normalizedQuery)) {
        score += 100;
        highlight = data.invoiceNumber;
      }

      // Check client name
      if (clientName.includes(normalizedQuery)) {
        score += 80;
        if (!highlight) highlight = data.clientName;
      }

      // Check project name
      if (projectName.includes(normalizedQuery)) {
        score += 70;
        if (!highlight) highlight = data.projectName;
      }

      // Check amount (for searching by dollar amount)
      if (amount.includes(normalizedQuery)) {
        score += 50;
        if (!highlight) highlight = `$${data.total?.toLocaleString() || '0'}`;
      }

      if (score > 0) {
        const total = data.total
          ? `$${data.total.toLocaleString()}`
          : '';
        const status = data.status || 'Draft';

        results.push({
          id: doc.id,
          type: 'invoice',
          title: data.invoiceNumber || `Invoice #${doc.id.substring(0, 6)}`,
          subtitle: [data.clientName, total, status].filter(Boolean).join(' • '),
          url: `/dashboard/invoices/${doc.id}`,
          highlight,
          score,
        });
      }
    });

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 20);
  } catch (error) {
    console.error('Error searching invoices:', error);
    return [];
  }
}

export default searchInvoices;
