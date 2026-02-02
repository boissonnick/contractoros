'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import { searchAll, SearchResult, SearchEntityType, ENTITY_TYPE_LABELS } from '@/lib/search';
import { SearchResultList } from '@/components/search';
import { PageHeader } from '@/components/ui';
import { SkeletonList } from '@/components/ui/Skeleton';

const ALL_ENTITY_TYPES: SearchEntityType[] = [
  'project',
  'client',
  'invoice',
  'task',
];

function SearchPageContent() {
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get('q') || '';
  const initialTypes = searchParams.get('types')?.split(',').filter(Boolean) as SearchEntityType[] || [];

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<SearchEntityType[]>(
    initialTypes.length > 0 ? initialTypes : ALL_ENTITY_TYPES
  );
  const [sortBy, setSortBy] = useState<'relevance' | 'type'>('relevance');
  const [showFilters, setShowFilters] = useState(false);

  const orgId = profile?.orgId;

  // Perform search
  const handleSearch = useCallback(async () => {
    if (!orgId || !query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await searchAll(orgId, query, {
        entityTypes: selectedTypes.length > 0 ? selectedTypes : ALL_ENTITY_TYPES,
        query,
      });
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, query, selectedTypes]);

  // Search on query or filter change
  useEffect(() => {
    if (query.trim()) {
      const timer = setTimeout(handleSearch, 300);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [query, selectedTypes, handleSearch]);

  // Initial search from URL params
  useEffect(() => {
    if (initialQuery) {
      handleSearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update URL when search changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedTypes.length > 0 && selectedTypes.length < ALL_ENTITY_TYPES.length) {
      params.set('types', selectedTypes.join(','));
    }
    const newUrl = params.toString() ? `?${params.toString()}` : '/dashboard/search';
    router.replace(newUrl, { scroll: false });
  }, [query, selectedTypes, router]);

  // Toggle entity type filter
  const toggleType = (type: SearchEntityType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedTypes(ALL_ENTITY_TYPES);
  };

  // Sort results
  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'type') {
      return a.type.localeCompare(b.type);
    }
    return b.score - a.score; // Default: relevance
  });

  const hasActiveFilters = selectedTypes.length < ALL_ENTITY_TYPES.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Search"
        description="Find projects, clients, invoices, and tasks"
      />

      {/* Search input */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search across all entities..."
              className="w-full pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
              >
                <XMarkIcon className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-white text-brand-primary rounded">
                {selectedTypes.length}
              </span>
            )}
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Show:</span>
              {ALL_ENTITY_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                    selectedTypes.includes(type)
                      ? 'bg-brand-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {ENTITY_TYPE_LABELS[type]}s
                </button>
              ))}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 mt-4">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'relevance' | 'type')}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="relevance">Relevance</option>
                <option value="type">Entity Type</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-4">
            <SkeletonList count={5} />
          </div>
        ) : sortedResults.length > 0 ? (
          <>
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-sm text-gray-600">
                Found <span className="font-medium">{sortedResults.length}</span> results
                {query && (
                  <>
                    {' '}for &quot;<span className="font-medium">{query}</span>&quot;
                  </>
                )}
              </p>
            </div>
            <SearchResultList
              results={sortedResults}
              grouped={sortBy === 'type'}
            />
          </>
        ) : query ? (
          <div className="p-12 text-center">
            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No results found</h3>
            <p className="mt-2 text-sm text-gray-500">
              No matches for &quot;{query}&quot; in{' '}
              {selectedTypes.length === ALL_ENTITY_TYPES.length
                ? 'any category'
                : selectedTypes.map((t) => ENTITY_TYPE_LABELS[t].toLowerCase() + 's').join(', ')}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-brand-primary hover:underline"
              >
                Clear filters and try again
              </button>
            )}
          </div>
        ) : (
          <div className="p-12 text-center">
            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Search your data</h3>
            <p className="mt-2 text-sm text-gray-500">
              Enter a search term to find projects, clients, invoices, and tasks
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SkeletonList count={5} />}>
      <SearchPageContent />
    </Suspense>
  );
}
