"use client";

import React, { useState } from 'react';
import { ScopeItem, QuoteSection } from '@/types';
import { ChevronDownIcon, ChevronRightIcon, PencilIcon, TrashIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  item: ScopeItem;
  quoteSections: QuoteSection[];
  onEditItem: (item: ScopeItem) => void;
  onRemoveItem: (itemId: string) => void;
  isSelected: boolean;
  onToggleSelect: (itemId: string) => void;
  isDraft: boolean;
}

function fmt(n?: number): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function SortableItem({ item, quoteSections, onEditItem, onRemoveItem, isSelected, onToggleSelect, isDraft }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const linkedSection = item.quoteSectionId
    ? quoteSections.find(qs => qs.id === item.quoteSectionId)
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'px-4 py-3 hover:bg-gray-50 flex items-start gap-2',
        isDragging && 'opacity-50 bg-blue-50',
        isSelected && 'bg-blue-50/50'
      )}
    >
      {isDraft && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(item.id)}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
        />
      )}
      {isDraft && (
        <button {...attributes} {...listeners} className="mt-0.5 cursor-grab text-gray-300 hover:text-gray-500">
          <Bars3Icon className="h-4 w-4" />
        </button>
      )}
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
            <span className="text-blue-500">&rarr; {linkedSection.name}</span>
          )}
        </div>
      </div>
      {isDraft && (
        <div className="flex items-center gap-1 ml-2">
          <button onClick={() => onEditItem(item)} className="p-1 text-gray-400 hover:text-blue-600">
            <PencilIcon className="h-4 w-4" />
          </button>
          <button onClick={() => onRemoveItem(item.id)} className="p-1 text-gray-400 hover:text-red-500">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

interface ScopePhaseGroupProps {
  phaseName: string;
  items: ScopeItem[];
  quoteSections: QuoteSection[];
  onEditItem: (item: ScopeItem) => void;
  onRemoveItem: (itemId: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (itemId: string) => void;
  isDraft: boolean;
}

export default function ScopePhaseGroup({ phaseName, items, quoteSections, onEditItem, onRemoveItem, selectedIds, onToggleSelect, isDraft }: ScopePhaseGroupProps) {
  const [expanded, setExpanded] = useState(true);
  const totalCost = items.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
  const totalHours = items.reduce((sum, item) => sum + (item.estimatedHours || 0), 0);
  const materialsCost = items.reduce((sum, item) =>
    sum + item.materials.reduce((ms, m) => ms + ((m.estimatedCost || 0) * (m.quantity || 1)), 0), 0);

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
          {materialsCost > 0 && <span>Materials: {fmt(materialsCost)}</span>}
          <span className="font-medium">{fmt(totalCost)}</span>
        </div>
      </button>

      {expanded && (
        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              quoteSections={quoteSections}
              onEditItem={onEditItem}
              onRemoveItem={onRemoveItem}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={onToggleSelect}
              isDraft={isDraft}
            />
          ))}
        </div>
      )}
    </div>
  );
}
