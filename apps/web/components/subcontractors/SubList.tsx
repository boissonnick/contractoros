"use client";

import React, { useState, useMemo } from 'react';
import { Subcontractor } from '@/types';
import { Input } from '@/components/ui';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import SubCard from './SubCard';

interface SubListProps {
  subs: Subcontractor[];
  onSubClick: (sub: Subcontractor) => void;
}

export default function SubList({ subs, onSubClick }: SubListProps) {
  const [search, setSearch] = useState('');
  const [tradeFilter, setTradeFilter] = useState('');

  const trades = useMemo(() => {
    const set = new Set<string>();
    subs.forEach((s) => set.add(s.trade));
    return Array.from(set).sort();
  }, [subs]);

  const filtered = useMemo(() => {
    return subs.filter((s) => {
      if (search && !s.companyName.toLowerCase().includes(search.toLowerCase()) && !s.contactName.toLowerCase().includes(search.toLowerCase())) return false;
      if (tradeFilter && s.trade !== tradeFilter) return false;
      return true;
    });
  }, [subs, search, tradeFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
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
        <span className="text-sm text-gray-500">{filtered.length} subcontractor{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="border border-gray-200 rounded-xl p-12 text-center bg-gray-50">
          <p className="text-sm text-gray-400">No subcontractors found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sub) => (
            <SubCard key={sub.id} sub={sub} onClick={onSubClick} />
          ))}
        </div>
      )}
    </div>
  );
}
