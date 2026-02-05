"use client";

import React, { useState, useMemo } from 'react';
import { Subcontractor } from '@/types';
import { MagnifyingGlassIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import SubCard from './SubCard';

type SortOption = 'name' | 'rating' | 'projects' | 'ontime';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name', label: 'Company Name' },
  { value: 'rating', label: 'Rating (Highest)' },
  { value: 'projects', label: 'Projects Completed' },
  { value: 'ontime', label: 'On-Time Rate' },
];

interface SubListProps {
  subs: Subcontractor[];
  onSubClick: (sub: Subcontractor) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  selectionMode?: boolean;
}

export default function SubList({
  subs,
  onSubClick,
  selectedIds = [],
  onSelectionChange,
  selectionMode = false,
}: SubListProps) {
  const [search, setSearch] = useState('');
  const [tradeFilter, setTradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');

  const trades = useMemo(() => {
    const set = new Set<string>();
    subs.forEach((s) => set.add(s.trade));
    return Array.from(set).sort();
  }, [subs]);

  const filteredAndSorted = useMemo(() => {
    // Filter
    let result = subs.filter((s) => {
      if (search && !s.companyName.toLowerCase().includes(search.toLowerCase()) && !s.contactName.toLowerCase().includes(search.toLowerCase())) return false;
      if (tradeFilter && s.trade !== tradeFilter) return false;
      if (statusFilter === 'active' && !s.isActive) return false;
      if (statusFilter === 'inactive' && s.isActive) return false;
      return true;
    });

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.companyName.localeCompare(b.companyName);
        case 'rating':
          return (b.metrics.avgRating || 0) - (a.metrics.avgRating || 0);
        case 'projects':
          return (b.metrics.projectsCompleted || 0) - (a.metrics.projectsCompleted || 0);
        case 'ontime':
          return (b.metrics.onTimeRate || 0) - (a.metrics.onTimeRate || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [subs, search, tradeFilter, statusFilter, sortBy]);

  const handleToggleSelect = (sub: Subcontractor, e: React.MouseEvent) => {
    if (!selectionMode || !onSelectionChange) return;
    e.stopPropagation();
    if (selectedIds.includes(sub.id)) {
      onSelectionChange(selectedIds.filter(id => id !== sub.id));
    } else {
      onSelectionChange([...selectedIds, sub.id]);
    }
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (selectedIds.length === filteredAndSorted.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredAndSorted.map(s => s.id));
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subs..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <select
          value={tradeFilter}
          onChange={(e) => setTradeFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Trades</option>
          {trades.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="flex items-center gap-2">
          <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <span className="text-sm text-gray-500 ml-auto">{filteredAndSorted.length} subcontractor{filteredAndSorted.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Selection Mode Header */}
      {selectionMode && onSelectionChange && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <input
            type="checkbox"
            checked={selectedIds.length === filteredAndSorted.length && filteredAndSorted.length > 0}
            onChange={handleSelectAll}
            className="h-4 w-4 text-blue-600 rounded border-gray-300"
          />
          <span className="text-sm text-blue-700">
            {selectedIds.length} selected
          </span>
        </div>
      )}

      {/* Grid */}
      {filteredAndSorted.length === 0 ? (
        <div className="border border-gray-200 rounded-xl p-12 text-center bg-gray-50">
          <p className="text-base font-medium text-gray-600 mb-1">No matching subcontractors</p>
          <p className="text-sm text-gray-400">
            {search && tradeFilter ? (
              <>No subcontractors match &quot;{search}&quot; in {tradeFilter}. Try adjusting your filters.</>
            ) : search ? (
              <>No subcontractors match &quot;{search}&quot;. Try a different search term.</>
            ) : tradeFilter ? (
              <>No subcontractors in {tradeFilter}. Try selecting a different trade.</>
            ) : statusFilter !== 'all' ? (
              <>No {statusFilter} subcontractors found.</>
            ) : (
              <>No subcontractors found. Add your first subcontractor to get started.</>
            )}
          </p>
          {(search || tradeFilter || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setTradeFilter('');
                setStatusFilter('all');
              }}
              className="mt-3 text-sm text-brand-primary hover:text-brand-primary/80 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSorted.map((sub) => (
            <div key={sub.id} className="relative">
              {selectionMode && onSelectionChange && (
                <div
                  className="absolute top-3 left-3 z-10"
                  onClick={(e) => handleToggleSelect(sub, e)}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(sub.id)}
                    onChange={() => {}}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 cursor-pointer"
                  />
                </div>
              )}
              <SubCard sub={sub} onClick={selectionMode ? undefined : onSubClick} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
