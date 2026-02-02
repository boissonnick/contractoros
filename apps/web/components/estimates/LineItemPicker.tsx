"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button, Input } from '@/components/ui';
import { useLineItems, useLineItemPriceHistory } from '@/lib/hooks/useLineItems';
import {
  LineItem,
  LineItemTrade,
  LINE_ITEM_TRADES,
  LINE_ITEM_UNITS,
  LineItemPriceHistory,
} from '@/types';
import {
  MagnifyingGlassIcon,
  StarIcon,
  ClockIcon,
  PlusIcon,
  CheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { usePriceSuggestion } from '@/lib/hooks/useIntelligence';
import { PriceSuggestionCard } from '@/components/intelligence';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { format } from 'date-fns';

/**
 * Simple fuzzy search implementation
 * Scores based on:
 * - Exact match: highest score
 * - Starts with query: high score
 * - Contains query: medium score
 * - Fuzzy match (characters in order): low score
 */
function fuzzyScore(text: string, query: string): number {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  // Exact match
  if (normalizedText === normalizedQuery) return 100;

  // Starts with
  if (normalizedText.startsWith(normalizedQuery)) return 90;

  // Contains
  if (normalizedText.includes(normalizedQuery)) return 70;

  // Fuzzy match - characters appear in order
  let queryIdx = 0;
  let score = 0;
  let consecutiveBonus = 0;

  for (let i = 0; i < normalizedText.length && queryIdx < normalizedQuery.length; i++) {
    if (normalizedText[i] === normalizedQuery[queryIdx]) {
      score += 10 + consecutiveBonus;
      consecutiveBonus = 5; // Bonus for consecutive matches
      queryIdx++;
    } else {
      consecutiveBonus = 0;
    }
  }

  // All characters matched?
  if (queryIdx === normalizedQuery.length) {
    // Penalize longer strings
    return Math.max(0, score - (normalizedText.length - normalizedQuery.length));
  }

  return 0;
}

function fuzzySearchItems(items: LineItem[], query: string): LineItem[] {
  if (!query.trim()) return items;

  const scored = items.map((item) => {
    // Search in name, description, sku, supplier, and tags
    const fields = [
      item.name,
      item.description || '',
      item.sku || '',
      item.supplier || '',
      ...(item.tags || []),
    ];
    const maxScore = Math.max(...fields.map((f) => fuzzyScore(f, query)));
    return { item, score: maxScore };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item);
}

/**
 * Price History Tooltip Component
 */
function PriceHistoryTooltip({ lineItemId }: { lineItemId: string }) {
  const { history, loading } = useLineItemPriceHistory(lineItemId);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="p-2">
        <div className="animate-pulse space-y-2">
          <div className="h-3 w-24 bg-gray-200 rounded" />
          <div className="h-3 w-20 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="p-2 text-xs text-gray-500">
        No pricing history available
      </div>
    );
  }

  // Calculate price trend
  const latestPrice = history[0]?.unitPrice || 0;
  const oldestPrice = history[history.length - 1]?.unitPrice || latestPrice;
  const percentChange = oldestPrice > 0
    ? ((latestPrice - oldestPrice) / oldestPrice) * 100
    : 0;

  return (
    <div className="p-3 min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-700">Price History</span>
        {percentChange !== 0 && (
          <span className={cn(
            'flex items-center text-xs font-medium',
            percentChange > 0 ? 'text-red-600' : 'text-green-600'
          )}>
            {percentChange > 0 ? (
              <ArrowTrendingUpIcon className="h-3 w-3 mr-0.5" />
            ) : (
              <ArrowTrendingDownIcon className="h-3 w-3 mr-0.5" />
            )}
            {Math.abs(percentChange).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="space-y-1.5 max-h-32 overflow-y-auto">
        {history.slice(0, 5).map((entry, idx) => (
          <div key={entry.id} className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              {format(entry.effectiveDate, 'MMM d, yyyy')}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {formatPrice(entry.unitPrice)}
              </span>
              {idx < history.length - 1 && (
                <span className={cn(
                  'text-[10px]',
                  entry.unitPrice > history[idx + 1].unitPrice
                    ? 'text-red-500'
                    : entry.unitPrice < history[idx + 1].unitPrice
                    ? 'text-green-500'
                    : 'text-gray-400'
                )}>
                  {entry.unitPrice > history[idx + 1].unitPrice ? '↑' : entry.unitPrice < history[idx + 1].unitPrice ? '↓' : '–'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {history.length > 5 && (
        <p className="text-[10px] text-gray-400 mt-1">
          +{history.length - 5} more entries
        </p>
      )}
    </div>
  );
}

/**
 * AI Price Insight Badge - shows market comparison inline
 */
function PriceInsightBadge({
  itemName,
  currentPrice,
  unit,
}: {
  itemName: string;
  currentPrice: number;
  unit: string;
}) {
  const { suggestion, loading } = usePriceSuggestion(itemName);
  const [showDetails, setShowDetails] = useState(false);

  if (loading || !suggestion) return null;

  // Compare current price to market range
  const isAboveMarket = currentPrice > suggestion.priceRange.high;
  const isBelowMarket = currentPrice < suggestion.priceRange.low;
  const isAtMarket = !isAboveMarket && !isBelowMarket;

  // Calculate percentage difference from median
  const percentDiff = ((currentPrice - suggestion.suggestedPrice) / suggestion.suggestedPrice) * 100;

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowDetails(!showDetails);
        }}
        className={cn(
          'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors',
          isAboveMarket && 'bg-red-50 text-red-600 hover:bg-red-100',
          isBelowMarket && 'bg-green-50 text-green-600 hover:bg-green-100',
          isAtMarket && 'bg-blue-50 text-blue-600 hover:bg-blue-100'
        )}
        title="AI price insight"
      >
        <SparklesIcon className="h-3 w-3" />
        {isAboveMarket && `+${Math.abs(percentDiff).toFixed(0)}% above market`}
        {isBelowMarket && `${Math.abs(percentDiff).toFixed(0)}% below market`}
        {isAtMarket && 'Market rate'}
      </button>

      {showDetails && (
        <div
          className="absolute right-0 top-full mt-1 z-50 w-64"
          onClick={(e) => e.stopPropagation()}
        >
          <PriceSuggestionCard
            suggestion={suggestion}
            unit={unit}
            compact
            onDismiss={() => setShowDetails(false)}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Line Item Row with hover tooltip
 */
function LineItemRow({
  item,
  selected,
  onSelect,
  onToggleFavorite,
  formatPrice,
  getUnitAbbr,
}: {
  item: LineItem;
  selected: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  formatPrice: (price: number) => string;
  getUnitAbbr: (unit: string) => string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={cn(
        'p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors cursor-pointer relative',
        selected && 'bg-brand-primary/5'
      )}
      onClick={onSelect}
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
          <div className="flex items-center gap-1">
            {/* Price history button */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(!showTooltip);
                }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="p-1 hover:bg-gray-100 rounded"
                title="View price history"
              >
                <ChartBarIcon className="h-4 w-4 text-gray-400" />
              </button>

              {/* Tooltip */}
              {showTooltip && (
                <div
                  className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <PriceHistoryTooltip lineItemId={item.id} />
                </div>
              )}
            </div>

            {/* Favorite button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
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
        </div>

        <div className="flex items-center flex-wrap gap-2 mt-1 text-sm text-gray-500">
          <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
            {LINE_ITEM_TRADES.find((t) => t.value === item.trade)?.label || item.trade}
          </span>
          <span>
            {formatPrice(item.unitPrice)} / {getUnitAbbr(item.unit)}
          </span>
          {item.sku && <span className="text-gray-400">SKU: {item.sku}</span>}
          {item.usageCount && item.usageCount > 0 && (
            <span className="text-gray-400 text-xs">Used {item.usageCount}x</span>
          )}
          {/* AI Price Insight */}
          <PriceInsightBadge
            itemName={item.name}
            currentPrice={item.unitPrice}
            unit={getUnitAbbr(item.unit)}
          />
        </div>
      </div>
    </div>
  );
}

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
 * - Fuzzy search by name, description, SKU, tags
 * - Filter by trade
 * - Favorites and recent tabs
 * - Multi-select support
 * - Price history on hover
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

    // Apply fuzzy search
    if (searchQuery) {
      items = fuzzySearchItems(items, searchQuery);
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

  // Count items by tab for badges
  const favoritesCount = useMemo(() => getFavorites().length, [getFavorites]);
  const recentCount = useMemo(() => getRecent(20).length, [getRecent]);

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
            placeholder="Search items... (supports fuzzy matching)"
            className="pl-9"
          />
        </div>
        {searchQuery && (
          <p className="text-xs text-gray-500 mt-1">
            Found {displayItems.length} item{displayItems.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'all' as const, label: 'All Items', count: lineItems.length },
          { key: 'favorites' as const, label: 'Favorites', icon: StarIcon, count: favoritesCount },
          { key: 'recent' as const, label: 'Recent', icon: ClockIcon, count: recentCount },
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
            {tab.count > 0 && (
              <span className={cn(
                'ml-1 px-1.5 py-0.5 text-xs rounded-full',
                activeTab === tab.key
                  ? 'bg-brand-primary/10 text-brand-primary'
                  : 'bg-gray-100 text-gray-500'
              )}>
                {tab.count}
              </span>
            )}
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
            <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium">
              {searchQuery
                ? 'No items match your search'
                : activeTab === 'favorites'
                ? 'No favorite items yet'
                : activeTab === 'recent'
                ? 'No recently used items'
                : 'No line items in library'}
            </p>
            {searchQuery && (
              <p className="text-xs text-gray-400 mt-1">
                Try a different search term or filter
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayItems.map((item) => (
              <LineItemRow
                key={item.id}
                item={item}
                selected={isSelected(item.id)}
                onSelect={() => handleSelect(item)}
                onToggleFavorite={() => toggleFavorite(item.id)}
                formatPrice={formatPrice}
                getUnitAbbr={getUnitAbbr}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
