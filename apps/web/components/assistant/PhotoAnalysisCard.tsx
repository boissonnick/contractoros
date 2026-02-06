'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  PhotoIcon,
  PlusIcon,
  TagIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import {
  PhotoAnalysis,
  PhotoTag,
  PhotoIssue,
  PhotoAnalysisStatus,
} from '@/lib/assistant/types';

interface PhotoAnalysisCardProps {
  /** The photo analysis result */
  analysis: PhotoAnalysis;
  /** Callback to add photo to project */
  onAddToProject?: (analysis: PhotoAnalysis, selectedTags: string[]) => void;
  /** Callback to dismiss/remove the card */
  onDismiss?: () => void;
  /** Whether the card is in compact mode */
  compact?: boolean;
}

const TAG_CATEGORY_COLORS: Record<PhotoTag['category'], string> = {
  trade: 'bg-blue-100 text-blue-700 border-blue-200',
  material: 'bg-green-100 text-green-700 border-green-200',
  phase: 'bg-brand-100 text-brand-700 border-brand-200',
  issue: 'bg-red-100 text-red-700 border-red-200',
  location: 'bg-orange-100 text-orange-700 border-orange-200',
  equipment: 'bg-gray-100 text-gray-700 border-gray-200',
};

const ISSUE_SEVERITY_COLORS: Record<PhotoIssue['severity'], {
  bg: string;
  text: string;
  border: string;
}> = {
  low: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  medium: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  high: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export function PhotoAnalysisCard({
  analysis,
  onAddToProject,
  onDismiss,
  compact = false,
}: PhotoAnalysisCardProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(
    analysis.tags?.map((t) => t.id) || []
  );
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [isAdding, setIsAdding] = useState(false);

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleAddToProject = async () => {
    if (!onAddToProject) return;
    setIsAdding(true);
    try {
      await onAddToProject(analysis, selectedTags);
    } finally {
      setIsAdding(false);
    }
  };

  const getStatusDisplay = (status: PhotoAnalysisStatus) => {
    switch (status) {
      case 'uploading':
        return {
          text: 'Uploading...',
          color: 'text-blue-600',
          icon: (
            <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ),
        };
      case 'analyzing':
        return {
          text: 'Analyzing...',
          color: 'text-brand-600',
          icon: (
            <div className="h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          ),
        };
      case 'complete':
        return {
          text: 'Analysis complete',
          color: 'text-green-600',
          icon: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
        };
      case 'error':
        return {
          text: analysis.error || 'Analysis failed',
          color: 'text-red-600',
          icon: <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />,
        };
    }
  };

  const statusDisplay = getStatusDisplay(analysis.status);

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-3">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 overflow-hidden">
          {analysis.thumbnailUrl ? (
            <Image
              src={analysis.thumbnailUrl}
              alt={analysis.fileName}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PhotoIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-gray-900 truncate">
                {analysis.fileName}
              </p>
              <div className={`flex items-center gap-1.5 text-xs ${statusDisplay.color}`}>
                {statusDisplay.icon}
                <span>{statusDisplay.text}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {!compact && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  {isExpanded ? (
                    <ChevronUpIcon className="h-4 w-4" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4" />
                  )}
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Description preview (compact mode) */}
          {compact && analysis.status === 'complete' && analysis.description && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {analysis.description}
            </p>
          )}
        </div>
      </div>

      {/* Loading state */}
      {(analysis.status === 'uploading' || analysis.status === 'analyzing') && (
        <div className="px-3 pb-3">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full"
              style={{
                width: analysis.status === 'uploading' ? '40%' : '80%',
                animation: 'pulse 2s infinite',
              }}
            />
          </div>
        </div>
      )}

      {/* Expanded content */}
      {analysis.status === 'complete' && isExpanded && (
        <div className="border-t border-gray-100 p-3 space-y-3">
          {/* AI Description */}
          {analysis.description && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">AI Description</p>
              <p className="text-sm text-gray-700">{analysis.description}</p>
            </div>
          )}

          {/* Tags */}
          {analysis.tags && analysis.tags.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <TagIcon className="h-3.5 w-3.5 text-gray-400" />
                <p className="text-xs font-medium text-gray-500">Detected Tags</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id)}
                    className={`
                      text-xs px-2 py-1 rounded-full border transition-all
                      ${TAG_CATEGORY_COLORS[tag.category]}
                      ${selectedTags.includes(tag.id)
                        ? 'ring-2 ring-brand-500 ring-offset-1'
                        : 'opacity-75 hover:opacity-100'
                      }
                    `}
                  >
                    {tag.label}
                    {tag.confidence < 1 && (
                      <span className="ml-1 opacity-60">
                        {Math.round(tag.confidence * 100)}%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Issues detected */}
          {analysis.issues && analysis.issues.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <ExclamationTriangleIcon className="h-3.5 w-3.5 text-amber-500" />
                <p className="text-xs font-medium text-gray-500">Issues Detected</p>
              </div>
              <div className="space-y-1.5">
                {analysis.issues.map((issue) => {
                  const colors = ISSUE_SEVERITY_COLORS[issue.severity];
                  return (
                    <div
                      key={issue.id}
                      className={`text-xs p-2 rounded-lg border ${colors.bg} ${colors.border}`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${colors.bg} ${colors.text}`}
                        >
                          {issue.severity}
                        </span>
                        <span className={`capitalize ${colors.text}`}>{issue.type}</span>
                      </div>
                      <p className={`mt-1 ${colors.text}`}>{issue.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Suggested phase */}
          {analysis.suggestedPhase && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Suggested phase:</span>
              <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700">
                {analysis.suggestedPhase}
              </span>
            </div>
          )}

          {/* Add to project button */}
          {onAddToProject && (
            <button
              onClick={handleAddToProject}
              disabled={isAdding}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAdding ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4" />
                  <span>Add to Project Photos</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Error state details */}
      {analysis.status === 'error' && analysis.error && (
        <div className="border-t border-red-100 p-3 bg-red-50">
          <p className="text-xs text-red-600">{analysis.error}</p>
        </div>
      )}
    </div>
  );
}

export default PhotoAnalysisCard;
