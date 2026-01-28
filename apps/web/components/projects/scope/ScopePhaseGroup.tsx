"use client";

import React, { useState } from 'react';
import { ScopeItem, ProjectPhase, QuoteSection } from '@/types';
import { ChevronDownIcon, ChevronRightIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface ScopePhaseGroupProps {
  phaseName: string;
  items: ScopeItem[];
  quoteSections: QuoteSection[];
  onEditItem: (item: ScopeItem) => void;
  onRemoveItem: (itemId: string) => void;
}

function fmt(n?: number): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function ScopePhaseGroup({ phaseName, items, quoteSections, onEditItem, onRemoveItem }: ScopePhaseGroupProps) {
  const [expanded, setExpanded] = useState(true);
  const totalCost = items.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
  const totalHours = items.reduce((sum, item) => sum + (item.estimatedHours || 0), 0);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDownIcon className="h-4 w-4 text-gray-400" /> : <ChevronRightIcon className="h-4 w-4 text-gray-400" />}
          <span className="text-sm font-semibold text-gray-900">{phaseName}</span>
          <span className="text-xs text-gray-500">({items.length} items)</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {totalHours > 0 && <span>{totalHours}h</span>}
          <span className="font-medium">{fmt(totalCost)}</span>
        </div>
      </button>

      {expanded && (
        <div className="divide-y divide-gray-100">
          {items.map((item) => {
            const linkedSection = item.quoteSectionId
              ? quoteSections.find(qs => qs.id === item.quoteSectionId)
              : null;

            return (
              <div key={item.id} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      {item.estimatedHours && <span>{item.estimatedHours}h est.</span>}
                      {item.estimatedCost && <span>{fmt(item.estimatedCost)}</span>}
                      {item.materials.length > 0 && <span>{item.materials.length} materials</span>}
                      {linkedSection && (
                        <span className="text-blue-500">→ {linkedSection.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button onClick={() => onEditItem(item)} className="p-1 text-gray-400 hover:text-blue-600">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => onRemoveItem(item.id)} className="p-1 text-gray-400 hover:text-red-500">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
