'use client';

import React, { useState } from 'react';
import {
  CalendarDaysIcon,
  UserGroupIcon,
  LightBulbIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export interface CrewMember {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
}

export interface SchedulingSuggestion {
  id: string;
  title: string;
  description: string;
  aiReasoning: string;
  originalDate?: Date;
  suggestedDate?: Date;
  affectedCrew: CrewMember[];
  projectId?: string;
  projectName?: string;
  potentialSavings?: {
    hours?: number;
    cost?: number;
  };
  confidence: number;
  createdAt: Date;
}

interface SchedulingSuggestionCardProps {
  suggestion: SchedulingSuggestion;
  onApply?: (suggestionId: string) => Promise<void>;
  onIgnore?: (suggestionId: string) => void;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function SchedulingSuggestionCard({
  suggestion,
  onApply,
  onIgnore,
}: SchedulingSuggestionCardProps) {
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    if (!onApply) return;
    setIsApplying(true);
    try {
      await onApply(suggestion.id);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="border border-blue-200 rounded-lg bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">
                {suggestion.title}
              </h4>
              {suggestion.projectName && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {suggestion.projectName}
                </p>
              )}
            </div>
            <span className="flex-shrink-0 text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
              {Math.round(suggestion.confidence * 100)}% confidence
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-700 mt-2">
            {suggestion.description}
          </p>

          {/* Date change */}
          {suggestion.originalDate && suggestion.suggestedDate && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-gray-500 line-through">
                {formatDate(suggestion.originalDate)}
              </span>
              <ArrowPathIcon className="h-3 w-3 text-gray-400" />
              <span className="text-blue-600 font-medium">
                {formatDate(suggestion.suggestedDate)}
              </span>
            </div>
          )}

          {/* Affected crew */}
          {suggestion.affectedCrew.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1.5">
                <UserGroupIcon className="h-3.5 w-3.5" />
                <span>Affected crew ({suggestion.affectedCrew.length})</span>
              </div>
              <div className="flex items-center gap-1">
                {suggestion.affectedCrew.slice(0, 4).map((crew) => (
                  <div
                    key={crew.id}
                    className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white"
                    title={crew.name}
                  >
                    {crew.avatarUrl ? (
                      <img
                        src={crew.avatarUrl}
                        alt={crew.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      crew.name.charAt(0).toUpperCase()
                    )}
                  </div>
                ))}
                {suggestion.affectedCrew.length > 4 && (
                  <span className="text-xs text-gray-500 ml-1">
                    +{suggestion.affectedCrew.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* AI Reasoning */}
          <div className="mt-3 p-2 bg-white/60 rounded-lg border border-blue-100">
            <div className="flex items-center gap-1 text-xs text-blue-600 font-medium mb-1">
              <LightBulbIcon className="h-3.5 w-3.5" />
              <span>AI Reasoning</span>
            </div>
            <p className="text-xs text-gray-600">
              {suggestion.aiReasoning}
            </p>
          </div>

          {/* Potential savings */}
          {suggestion.potentialSavings && (
            <div className="mt-2 text-xs text-green-600">
              Potential savings:{' '}
              {suggestion.potentialSavings.hours && (
                <span className="font-medium">{suggestion.potentialSavings.hours} hours</span>
              )}
              {suggestion.potentialSavings.hours && suggestion.potentialSavings.cost && ' / '}
              {suggestion.potentialSavings.cost && (
                <span className="font-medium">
                  ${suggestion.potentialSavings.cost.toLocaleString()}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex items-center gap-2">
            {onApply && (
              <button
                onClick={handleApply}
                disabled={isApplying}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isApplying ? (
                  <>
                    <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-3.5 w-3.5" />
                    Apply Suggestion
                  </>
                )}
              </button>
            )}
            {onIgnore && (
              <button
                onClick={() => onIgnore(suggestion.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-gray-600 text-xs font-medium rounded-lg hover:bg-white/50 transition-colors"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
                Ignore
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SchedulingSuggestionCard;
