"use client";

import React from 'react';
import { ScopeItem, QuoteSection } from '@/types';
import { LinkIcon } from '@heroicons/react/24/outline';

interface ScopeQuoteLinkProps {
  items: ScopeItem[];
  quoteSections: QuoteSection[];
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function ScopeQuoteLink({ items, quoteSections }: ScopeQuoteLinkProps) {
  const linked = items.filter(item => item.quoteSectionId);
  const unlinked = items.filter(item => !item.quoteSectionId);

  if (quoteSections.length === 0) {
    return (
      <div className="text-sm text-gray-400">
        No quote sections available to link.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900">SOW ↔ Quote Links</h4>

      {/* Summary table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Quote Section</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Linked Items</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Quote Cost</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">SOW Est.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {quoteSections.map((qs) => {
              const sectionItems = items.filter(item => item.quoteSectionId === qs.id);
              const sowCost = sectionItems.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
              const quoteCost = qs.laborCost + qs.materialCost;

              return (
                <tr key={qs.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      {sectionItems.length > 0 && <LinkIcon className="h-3.5 w-3.5 text-blue-500" />}
                      <span className="text-gray-900">{qs.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {sectionItems.length > 0
                      ? sectionItems.map(i => i.title).join(', ')
                      : <span className="text-gray-300">No links</span>
                    }
                  </td>
                  <td className="px-4 py-2 text-right text-gray-900">{fmt(quoteCost)}</td>
                  <td className="px-4 py-2 text-right text-gray-900">{sectionItems.length > 0 ? fmt(sowCost) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {unlinked.length > 0 && (
        <div className="text-xs text-yellow-600 bg-yellow-50 rounded-lg px-3 py-2">
          {unlinked.length} SOW item{unlinked.length !== 1 ? 's' : ''} not linked to any quote section.
        </div>
      )}
    </div>
  );
}
