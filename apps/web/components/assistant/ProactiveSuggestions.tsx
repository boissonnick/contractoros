'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
  CheckIcon,
  ArrowRightIcon,
  LightBulbIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ShieldExclamationIcon,
  CheckBadgeIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import {
  ProactiveSuggestion,
  SuggestionCategory,
  SuggestionPriority,
  SUGGESTION_CATEGORY_CONFIG,
  SUGGESTION_PRIORITY_CONFIG,
} from '@/lib/assistant/types';

interface ProactiveSuggestionsProps {
  /** List of suggestions */
  suggestions: ProactiveSuggestion[];
  /** Callback when a suggestion is dismissed */
  onDismiss: (suggestionId: string) => void;
  /** Callback when a suggestion is acknowledged */
  onAcknowledge: (suggestionId: string) => void;
  /** Callback when all suggestions are dismissed */
  onDismissAll?: () => void;
  /** Filter by category */
  filterCategory?: SuggestionCategory;
  /** Whether the widget starts collapsed */
  defaultCollapsed?: boolean;
  /** Maximum suggestions to show before "show more" */
  maxVisible?: number;
  /** Whether to show in compact inline mode */
  inline?: boolean;
}

const CATEGORY_ICONS: Record<SuggestionCategory, React.ElementType> = {
  budget: CurrencyDollarIcon,
  schedule: CalendarIcon,
  safety: ShieldExclamationIcon,
  quality: CheckBadgeIcon,
  general: LightBulbIcon,
};

export function ProactiveSuggestions({
  suggestions,
  onDismiss,
  onAcknowledge,
  onDismissAll,
  filterCategory,
  defaultCollapsed = false,
  maxVisible = 3,
  inline = false,
}: ProactiveSuggestionsProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [showAll, setShowAll] = useState(false);

  // Filter and sort suggestions
  const filteredSuggestions = useMemo(() => {
    let result = suggestions.filter((s) => !s.isDismissed);
    if (filterCategory) {
      result = result.filter((s) => s.category === filterCategory);
    }
    // Sort by priority (critical > high > medium > low) then by date
    const priorityOrder: Record<SuggestionPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    return result.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [suggestions, filterCategory]);

  // Count unread suggestions
  const unreadCount = filteredSuggestions.filter((s) => !s.isRead).length;

  // Suggestions to display
  const visibleSuggestions = showAll
    ? filteredSuggestions
    : filteredSuggestions.slice(0, maxVisible);
  const hasMore = filteredSuggestions.length > maxVisible;

  if (filteredSuggestions.length === 0) {
    return null;
  }

  // Inline mode for embedding in messages
  if (inline) {
    return (
      <div className="space-y-2">
        {visibleSuggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onDismiss={onDismiss}
            onAcknowledge={onAcknowledge}
            compact
          />
        ))}
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <LightBulbIcon className="h-5 w-5 text-amber-600" />
          <span className="text-sm font-medium text-gray-900">AI Suggestions</span>
          {unreadCount > 0 && (
            <span className="flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-medium text-white bg-amber-500 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onDismissAll && !isCollapsed && filteredSuggestions.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismissAll();
              }}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-white/50 rounded"
            >
              Clear all
            </button>
          )}
          {isCollapsed ? (
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronUpIcon className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-3 space-y-2">
          {/* Category filters */}
          {!filterCategory && (
            <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
              <CategoryBadge
                category={null}
                count={filteredSuggestions.length}
                active={!filterCategory}
              />
              {(['budget', 'schedule', 'safety', 'quality'] as SuggestionCategory[]).map(
                (cat) => {
                  const count = filteredSuggestions.filter((s) => s.category === cat).length;
                  if (count === 0) return null;
                  return (
                    <CategoryBadge
                      key={cat}
                      category={cat}
                      count={count}
                      active={filterCategory === cat}
                    />
                  );
                }
              )}
            </div>
          )}

          {/* Suggestions list */}
          <div className="space-y-2">
            {visibleSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onDismiss={onDismiss}
                onAcknowledge={onAcknowledge}
              />
            ))}
          </div>

          {/* Show more/less */}
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full text-center text-xs text-brand-600 hover:text-brand-700 py-2 hover:bg-brand-50 rounded transition-colors"
            >
              {showAll
                ? 'Show less'
                : `Show ${filteredSuggestions.length - maxVisible} more suggestions`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Individual suggestion card
 */
interface SuggestionCardProps {
  suggestion: ProactiveSuggestion;
  onDismiss: (id: string) => void;
  onAcknowledge: (id: string) => void;
  compact?: boolean;
}

function SuggestionCard({
  suggestion,
  onDismiss,
  onAcknowledge,
  compact = false,
}: SuggestionCardProps) {
  const categoryConfig = SUGGESTION_CATEGORY_CONFIG[suggestion.category];
  const priorityConfig = SUGGESTION_PRIORITY_CONFIG[suggestion.priority];
  const CategoryIcon = CATEGORY_ICONS[suggestion.category];

  return (
    <div
      className={`
        border rounded-lg p-3 transition-all
        ${categoryConfig.bgColor} ${categoryConfig.borderColor}
        ${!suggestion.isRead ? 'ring-1 ring-offset-1 ring-amber-300' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${categoryConfig.bgColor}`}
        >
          <CategoryIcon className={`h-5 w-5 ${categoryConfig.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-medium text-gray-900">{suggestion.title}</h4>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityConfig.bgColor} ${priorityConfig.color}`}
                >
                  {priorityConfig.label}
                </span>
              </div>
              <p className={`text-xs text-gray-600 mt-0.5 ${compact ? 'line-clamp-2' : ''}`}>
                {suggestion.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onAcknowledge(suggestion.id)}
                className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Mark as read"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDismiss(suggestion.id)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Dismiss"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Related entity and action */}
          <div className="flex items-center justify-between mt-2 gap-2">
            {suggestion.relatedEntity && (
              <span className="text-[10px] text-gray-500 truncate">
                {suggestion.relatedEntity.type}: {suggestion.relatedEntity.name}
              </span>
            )}
            {suggestion.actionUrl && (
              <Link
                href={suggestion.actionUrl}
                className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium whitespace-nowrap"
              >
                {suggestion.actionLabel || 'View'}
                <ArrowRightIcon className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Category filter badge
 */
interface CategoryBadgeProps {
  category: SuggestionCategory | null;
  count: number;
  active: boolean;
}

function CategoryBadge({ category, count, active }: CategoryBadgeProps) {
  const config = category ? SUGGESTION_CATEGORY_CONFIG[category] : null;
  const Icon = category ? CATEGORY_ICONS[category] : BellIcon;

  return (
    <button
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
        transition-all whitespace-nowrap
        ${active
          ? config
            ? `${config.bgColor} ${config.color} ring-1 ring-offset-1 ${config.borderColor}`
            : 'bg-gray-100 text-gray-700 ring-1 ring-offset-1 ring-gray-300'
          : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
        }
      `}
    >
      <Icon className="h-3 w-3" />
      <span>{category ? category.charAt(0).toUpperCase() + category.slice(1) : 'All'}</span>
      <span className="opacity-60">({count})</span>
    </button>
  );
}

export default ProactiveSuggestions;
