'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import { searchAll, saveRecentSearch, getRecentSearches } from '@/lib/search';
import { SearchResult } from '@/lib/search/types';
import SearchResultList from './SearchResultList';
import { logger } from '@/lib/utils/logger';

interface GlobalSearchBarProps {
  className?: string;
}

export function GlobalSearchBar({ className = '' }: GlobalSearchBarProps) {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  const orgId = profile?.orgId;

  // Load recent searches when modal opens
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
    }
  }, [isOpen]);

  // Handle keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Debounced search
  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!orgId || !searchQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const searchResults = await searchAll(orgId, searchQuery);
        setResults(searchResults);
      } catch (error) {
        logger.error('Search error', { error: error, component: 'GlobalSearchBar' });
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [orgId]
  );

  // Handle query change with debounce
  const handleQueryChange = (value: string) => {
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  // Handle result selection
  const handleSelect = (_result: SearchResult) => {
    saveRecentSearch(query);
    setIsOpen(false);
    setQuery('');
    setResults([]);
    // Navigation handled by SearchResultItem
  };

  // Handle recent search click
  const handleRecentClick = (recentQuery: string) => {
    setQuery(recentQuery);
    handleSearch(recentQuery);
  };

  // Handle modal close
  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors ${className}`}
      >
        <MagnifyingGlassIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium text-gray-400 bg-white rounded border border-gray-200">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search modal */}
      <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity data-[closed]:opacity-0"
        />

        <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6 md:p-20">
          <DialogPanel
            transition
            className="mx-auto max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            {/* Search input */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search projects, clients, invoices, tasks..."
                className="w-full py-4 pl-12 pr-12 text-gray-900 placeholder-gray-400 border-b border-gray-200 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Results or recent searches */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-brand-primary" />
                  <p className="mt-2 text-sm">Searching...</p>
                </div>
              ) : results.length > 0 ? (
                <SearchResultList
                  results={results}
                  onSelect={handleSelect}
                />
              ) : query ? (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-sm">No results found for &quot;{query}&quot;</p>
                </div>
              ) : recentSearches.length > 0 ? (
                <div className="p-4">
                  <p className="px-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Recent Searches
                  </p>
                  <div className="space-y-1">
                    {recentSearches.map((recent, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleRecentClick(recent)}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 rounded-lg hover:bg-gray-100"
                      >
                        <MagnifyingGlassIcon className="inline-block h-4 w-4 mr-2 text-gray-400" />
                        {recent}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-sm">Start typing to search...</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Search across projects, clients, invoices, and tasks
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 font-medium">↑↓</kbd>
                  {' '}to navigate
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 font-medium">↵</kbd>
                  {' '}to select
                </span>
              </div>
              <span>
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 font-medium">esc</kbd>
                {' '}to close
              </span>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}

export default GlobalSearchBar;
