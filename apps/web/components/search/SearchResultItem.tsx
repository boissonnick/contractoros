'use client';

import React from 'react';
import Link from 'next/link';
import {
  BuildingOffice2Icon,
  UserGroupIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  CalculatorIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { SearchResult, SearchEntityType, ENTITY_TYPE_LABELS } from '@/lib/search/types';

interface SearchResultItemProps {
  result: SearchResult;
  onClick?: () => void;
}

const ENTITY_ICONS: Record<SearchEntityType, React.ComponentType<{ className?: string }>> = {
  project: BuildingOffice2Icon,
  client: UserGroupIcon,
  invoice: DocumentTextIcon,
  task: ClipboardDocumentListIcon,
  estimate: CalculatorIcon,
  subcontractor: WrenchScrewdriverIcon,
};

const ENTITY_COLORS: Record<SearchEntityType, string> = {
  project: 'bg-blue-100 text-blue-700',
  client: 'bg-green-100 text-green-700',
  invoice: 'bg-yellow-100 text-yellow-700',
  task: 'bg-purple-100 text-purple-700',
  estimate: 'bg-orange-100 text-orange-700',
  subcontractor: 'bg-gray-100 text-gray-700',
};

export function SearchResultItem({ result, onClick }: SearchResultItemProps) {
  const Icon = ENTITY_ICONS[result.type];
  const colorClass = ENTITY_COLORS[result.type];

  // Function to highlight matching text
  const highlightMatch = (text: string, highlight?: string) => {
    if (!highlight) return text;

    const lowerText = text.toLowerCase();
    const lowerHighlight = highlight.toLowerCase();
    const index = lowerText.indexOf(lowerHighlight);

    if (index === -1) return text;

    return (
      <>
        {text.substring(0, index)}
        <mark className="bg-yellow-200 text-gray-900 rounded px-0.5">
          {text.substring(index, index + highlight.length)}
        </mark>
        {text.substring(index + highlight.length)}
      </>
    );
  };

  return (
    <Link
      href={result.url}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors min-h-[44px]"
    >
      {/* Icon */}
      <div className={`flex-shrink-0 p-2 rounded-lg ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">
            {highlightMatch(result.title, result.highlight)}
          </span>
          <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded ${colorClass}`}>
            {ENTITY_TYPE_LABELS[result.type]}
          </span>
        </div>
        {result.subtitle && (
          <p className="text-sm text-gray-500 truncate mt-0.5">
            {result.subtitle}
          </p>
        )}
      </div>

      {/* Arrow indicator */}
      <svg
        className="flex-shrink-0 h-5 w-5 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </Link>
  );
}

export default SearchResultItem;
