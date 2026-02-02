'use client';

import React from 'react';
import { SearchResult, SearchEntityType, ENTITY_TYPE_LABELS, groupResultsByType } from '@/lib/search';
import SearchResultItem from './SearchResultItem';

interface SearchResultListProps {
  results: SearchResult[];
  onSelect?: (result: SearchResult) => void;
  grouped?: boolean;
}

export function SearchResultList({
  results,
  onSelect,
  grouped = true,
}: SearchResultListProps) {
  if (results.length === 0) {
    return null;
  }

  // If not grouped, just show flat list
  if (!grouped) {
    return (
      <div className="py-2">
        {results.map((result) => (
          <SearchResultItem
            key={`${result.type}-${result.id}`}
            result={result}
            onClick={() => onSelect?.(result)}
          />
        ))}
      </div>
    );
  }

  // Group results by type
  const groupedResults = groupResultsByType(results);

  // Get entity types that have results, in a consistent order
  const entityOrder: SearchEntityType[] = [
    'project',
    'client',
    'invoice',
    'task',
    'estimate',
    'subcontractor',
  ];

  const typesWithResults = entityOrder.filter(
    (type) => groupedResults[type].length > 0
  );

  return (
    <div className="py-2">
      {typesWithResults.map((type) => (
        <div key={type} className="mb-2 last:mb-0">
          {/* Section header */}
          <div className="px-4 py-1.5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {ENTITY_TYPE_LABELS[type]}s ({groupedResults[type].length})
            </h3>
          </div>

          {/* Results for this type */}
          <div className="px-2">
            {groupedResults[type].map((result) => (
              <SearchResultItem
                key={`${result.type}-${result.id}`}
                result={result}
                onClick={() => onSelect?.(result)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default SearchResultList;
