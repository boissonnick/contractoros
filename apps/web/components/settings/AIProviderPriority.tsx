"use client";

/**
 * AIProviderPriority Component - Sprint 37
 *
 * Manages AI provider priority ordering with:
 * - Drag or button-based reordering
 * - Enable/disable individual providers
 * - Set primary provider
 * - Cost per 1K tokens display
 */

import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import type { AIProviderPriority as AIProviderPriorityType } from '@/types';
import {
  PROVIDERS,
  moveProviderUp,
  moveProviderDown,
  setProviderAsPrimary,
  toggleProviderEnabled,
} from '@/lib/ai/provider-manager';

// ============================================================================
// Types
// ============================================================================

interface AIProviderPriorityProps {
  priorities: AIProviderPriorityType[];
  onChange: (priorities: AIProviderPriorityType[]) => void;
  disabled?: boolean;
}

// ============================================================================
// Provider Card Component
// ============================================================================

interface ProviderCardProps {
  provider: AIProviderPriorityType;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleEnabled: () => void;
  onSetPrimary: () => void;
  disabled?: boolean;
}

function ProviderCard({
  provider,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onToggleEnabled,
  onSetPrimary,
  disabled,
}: ProviderCardProps) {
  const providerConfig = PROVIDERS[provider.providerId];

  if (!providerConfig) {
    return null;
  }

  const colors = providerConfig.color;
  const canBeEnabled = provider.hasApiKey;

  return (
    <div
      className={cn(
        'relative border rounded-xl p-4 transition-all',
        provider.enabled
          ? 'border-gray-200 bg-white shadow-sm'
          : 'border-gray-100 bg-gray-50 opacity-60',
        provider.isPrimary && provider.enabled && 'border-blue-300 ring-2 ring-blue-100'
      )}
    >
      {/* Primary Badge */}
      {provider.isPrimary && provider.enabled && (
        <div className="absolute -top-2 -right-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-medium">
            <StarIconSolid className="h-3 w-3" />
            Primary
          </span>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Reorder Buttons */}
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={disabled || isFirst}
            className={cn(
              'p-1 rounded hover:bg-gray-100 transition-colors',
              (disabled || isFirst) && 'opacity-30 cursor-not-allowed'
            )}
            title="Move up"
          >
            <ChevronUpIcon className="h-4 w-4 text-gray-500" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={disabled || isLast}
            className={cn(
              'p-1 rounded hover:bg-gray-100 transition-colors',
              (disabled || isLast) && 'opacity-30 cursor-not-allowed'
            )}
            title="Move down"
          >
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Provider Icon */}
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            colors.bg
          )}
        >
          <span className={cn('text-lg font-semibold', colors.text)}>
            {providerConfig.name.charAt(0)}
          </span>
        </div>

        {/* Provider Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900">{providerConfig.name}</h4>
            {!canBeEnabled && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                <ExclamationTriangleIcon className="h-3 w-3" />
                No API Key
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{providerConfig.description}</p>

          {/* Cost Display */}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <CurrencyDollarIcon className="h-4 w-4 text-green-500" />
              <span>
                {provider.costPer1kTokens === 0
                  ? 'Free'
                  : `$${provider.costPer1kTokens.toFixed(4)}/1K tokens`}
              </span>
            </div>
            {provider.lastUsed && (
              <span className="text-xs text-gray-400">
                Last used: {new Date(provider.lastUsed).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Set Primary Button */}
          {provider.enabled && !provider.isPrimary && (
            <button
              type="button"
              onClick={onSetPrimary}
              disabled={disabled}
              className={cn(
                'p-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              title="Set as primary"
            >
              <StarIcon className="h-4 w-4 text-gray-400 hover:text-blue-500" />
            </button>
          )}

          {/* Enable/Disable Toggle */}
          <button
            type="button"
            onClick={onToggleEnabled}
            disabled={disabled || !canBeEnabled}
            className={cn(
              'p-2 rounded-lg transition-colors',
              provider.enabled
                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200',
              (disabled || !canBeEnabled) && 'opacity-50 cursor-not-allowed'
            )}
            title={provider.enabled ? 'Disable provider' : 'Enable provider'}
          >
            {provider.enabled ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              <XCircleIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Failure Warning */}
      {provider.failureCount && provider.failureCount > 2 && (
        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700">
            {provider.failureCount} recent failures. Consider checking your API key or
            moving this provider down in priority.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function AIProviderPriority({
  priorities,
  onChange,
  disabled = false,
}: AIProviderPriorityProps) {
  // Sort by priority for display
  const sortedPriorities = [...priorities].sort((a, b) => a.priority - b.priority);

  const handleMoveUp = useCallback(
    (providerId: string) => {
      const newPriorities = moveProviderUp(priorities, providerId);
      onChange(newPriorities);
    },
    [priorities, onChange]
  );

  const handleMoveDown = useCallback(
    (providerId: string) => {
      const newPriorities = moveProviderDown(priorities, providerId);
      onChange(newPriorities);
    },
    [priorities, onChange]
  );

  const handleToggleEnabled = useCallback(
    (providerId: string) => {
      const newPriorities = toggleProviderEnabled(priorities, providerId);
      onChange(newPriorities);
    },
    [priorities, onChange]
  );

  const handleSetPrimary = useCallback(
    (providerId: string) => {
      const newPriorities = setProviderAsPrimary(priorities, providerId);
      onChange(newPriorities);
    },
    [priorities, onChange]
  );

  const enabledCount = sortedPriorities.filter((p) => p.enabled).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Provider Priority</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Drag or use arrows to set the fallback order. The primary provider is used first.
          </p>
        </div>
        <span className="text-xs text-gray-400">
          {enabledCount} of {sortedPriorities.length} enabled
        </span>
      </div>

      {/* Provider Cards */}
      <div className="space-y-3">
        {sortedPriorities.map((provider, index) => (
          <ProviderCard
            key={provider.providerId}
            provider={provider}
            isFirst={index === 0}
            isLast={index === sortedPriorities.length - 1}
            onMoveUp={() => handleMoveUp(provider.providerId)}
            onMoveDown={() => handleMoveDown(provider.providerId)}
            onToggleEnabled={() => handleToggleEnabled(provider.providerId)}
            onSetPrimary={() => handleSetPrimary(provider.providerId)}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Help Text */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500">
          When the primary provider fails, requests automatically fall back to the next
          enabled provider in the list. Configure API keys in the provider settings to
          enable additional providers.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Feature Model Selector Component
// ============================================================================

interface FeatureModelSelectorProps {
  feature: string;
  featureLabel: string;
  selectedModel: string;
  fallbackModel?: string;
  availableModels: Array<{ key: string; name: string; provider: string }>;
  onChange: (modelKey: string, fallbackKey?: string) => void;
  disabled?: boolean;
}

export function FeatureModelSelector({
  feature,
  featureLabel,
  selectedModel,
  fallbackModel,
  availableModels,
  onChange,
  disabled = false,
}: FeatureModelSelectorProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="font-medium text-gray-900">{featureLabel}</p>
        <p className="text-xs text-gray-500">Feature: {feature}</p>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={selectedModel}
          onChange={(e) => onChange(e.target.value, fallbackModel)}
          disabled={disabled}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary disabled:opacity-50"
        >
          {availableModels.map((model) => (
            <option key={model.key} value={model.key}>
              {model.name} ({model.provider})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ============================================================================
// Usage Summary Component
// ============================================================================

interface UsageSummaryProps {
  totalCost: number;
  totalTokens: number;
  totalRequests: number;
  budget?: number;
  period: string;
}

export function AIUsageSummary({
  totalCost,
  totalTokens,
  totalRequests,
  budget,
  period,
}: UsageSummaryProps) {
  const budgetPercent = budget ? (totalCost / budget) * 100 : 0;
  const isOverBudget = budgetPercent > 100;
  const isNearBudget = budgetPercent > 80 && budgetPercent <= 100;

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900">{period} Usage Summary</h4>
        {budget && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              isOverBudget
                ? 'bg-red-100 text-red-700'
                : isNearBudget
                ? 'bg-amber-100 text-amber-700'
                : 'bg-green-100 text-green-700'
            )}
          >
            {budgetPercent.toFixed(0)}% of budget
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Total Cost</p>
          <p className="text-lg font-semibold text-gray-900">${totalCost.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Total Tokens</p>
          <p className="text-lg font-semibold text-gray-900">
            {(totalTokens / 1000).toFixed(1)}K
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Requests</p>
          <p className="text-lg font-semibold text-gray-900">
            {totalRequests.toLocaleString()}
          </p>
        </div>
      </div>

      {budget && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Budget: ${budget.toFixed(2)}</span>
            <span>Remaining: ${Math.max(0, budget - totalCost).toFixed(2)}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                isOverBudget
                  ? 'bg-red-500'
                  : isNearBudget
                  ? 'bg-amber-500'
                  : 'bg-green-500'
              )}
              style={{ width: `${Math.min(100, budgetPercent)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
