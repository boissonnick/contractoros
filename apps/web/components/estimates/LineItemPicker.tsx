"use client";

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button, Input } from '@/components/ui';
import { useLineItems } from '@/lib/hooks/useLineItems';
import {
  LineItem,
  LineItemTrade,
  LINE_ITEM_TRADES,
  LINE_ITEM_UNITS,
} from '@/types';
import {
  MagnifyingGlassIcon,
  StarIcon,
  ClockIcon,
  PlusIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

export interface LineItemPickerProps {
  onSelect: (item: LineItem) => void;
  selectedIds?: string[];
  multiple?: boolean;
  className?: string;
}

/**
 * LineItemPicker - Select line items from library
 *
 * Features:
 * - Search by name, description, SKU
 * - Filter by trade
 * - Favorites and recent tabs
 * - Multi-select support
 */
export default function LineItemPicker({
  onSelect,
  selectedIds = [],
  multiple = true,
  className,
}: LineItemPickerProps) {
  const { lineItems, loading, getRecent, getFavorites, toggleFavorite } = useLineItems();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<LineItemTrade | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'recent'>('all');

  // Get items based on tab
  const displayItems = useMemo(() => {
    let items: LineItem[];

    switch (activeTab) {
      case 'favorites':
        items = getFavorites();
        break;
      case 'recent':
        items = getRecent(20);
        break;
      default:
        items = lineItems;
    }

    // Filter by trade
    if (selectedTrade !== 'all') {
      items = items.filter((item) => item.trade === selectedTrade);
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.sku?.toLowerCase().includes(q)
      );
    }

    return items;
  }, [lineItems, activeTab, selectedTrade, searchQuery, getFavorites, getRecent]);

  const isSelected = (id: string) => selectedIds.includes(id);

  const handleSelect = (item: LineItem) => {
    if (!multiple && isSelected(item.id)) return;
    onSelect(item);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getUnitAbbr = (unit: string) => {
    const found = LINE_ITEM_UNITS.find((u) => u.value === unit);
    return found?.abbr || unit;
  };

  if (loading) {
    return (
      <div className={cn('animate-pulse space-y-4', className)}>
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-48 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Search */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search line items..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'all' as const, label: 'All Items' },
          { key: 'favorites' as const, label: 'Favorites', icon: StarIcon },
          { key: 'recent' as const, label: 'Recent', icon: ClockIcon },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.key
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.icon && <tab.icon className="h-4 w-4" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Trade filter */}
      <div className="p-3 border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-1">
          <button
            onClick={() => setSelectedTrade('all')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
              selectedTrade === 'all'
                ? 'bg-brand-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            All Trades
          </button>
          {LINE_ITEM_TRADES.map((trade) => (
            <button
              key={trade.value}
              onClick={() => setSelectedTrade(trade.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
                selectedTrade === trade.value
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {trade.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto">
        {displayItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-sm">
              {searchQuery
                ? 'No items match your search'
                : activeTab === 'favorites'
                ? 'No favorite items yet'
                : activeTab === 'recent'
                ? 'No recently used items'
                : 'No line items in library'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayItems.map((item) => {
              const selected = isSelected(item.id);
              return (
                <div
                  key={item.id}
                  className={cn(
                    'p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors cursor-pointer',
                    selected && 'bg-brand-primary/5'
                  )}
                  onClick={() => handleSelect(item)}
                >
                  {/* Selection indicator */}
                  <div
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                      selected
                        ? 'bg-brand-primary border-brand-primary'
                        : 'border-gray-300'
                    )}
                  >
                    {selected && <CheckIcon className="h-3 w-3 text-white" />}
                  </div>

                  {/* Item details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900 truncate">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-gray-500 truncate">{item.description}</p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {item.isFavorite ? (
                          <StarIconSolid className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <StarIcon className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                        {LINE_ITEM_TRADES.find((t) => t.value === item.trade)?.label || item.trade}
                      </span>
                      <span>
                        {formatPrice(item.unitPrice)} / {getUnitAbbr(item.unit)}
                      </span>
                      {item.sku && <span className="text-gray-400">SKU: {item.sku}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
