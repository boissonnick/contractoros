"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSubcontractors } from '@/lib/hooks/useSubcontractors';
import { Subcontractor } from '@/types';
import { PageHeader, Card, Badge, Button, EmptyState } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  StarIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ChartBarIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        star <= Math.round(rating)
          ? <StarSolid key={star} className="h-4 w-4 text-yellow-400" />
          : <StarIcon key={star} className="h-4 w-4 text-gray-300" />
      ))}
      <span className="ml-1 text-sm font-medium text-gray-900">{rating.toFixed(1)}</span>
    </div>
  );
}

function MetricBar({ value, max, color }: { value: number; max: number; color: string }) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div className={cn('h-full rounded-full', color)} style={{ width: `${percentage}%` }} />
    </div>
  );
}

export default function SubcontractorComparePage() {
  const { subs, loading } = useSubcontractors();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tradeFilter, setTradeFilter] = useState<string>('all');

  // Get unique trades
  const trades = useMemo(() => {
    const uniqueTrades = new Set<string>();
    subs.forEach(sub => {
      if (sub.trade) uniqueTrades.add(sub.trade);
    });
    return Array.from(uniqueTrades).sort();
  }, [subs]);

  // Filter subs for selection
  const filteredSubs = useMemo(() => {
    return subs.filter(sub => {
      const matchesSearch =
        sub.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.contactName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTrade = tradeFilter === 'all' || sub.trade === tradeFilter;
      return matchesSearch && matchesTrade && !selectedIds.includes(sub.id);
    });
  }, [subs, searchQuery, tradeFilter, selectedIds]);

  // Get selected subs
  const selectedSubs = useMemo(() => {
    return subs.filter(sub => selectedIds.includes(sub.id));
  }, [subs, selectedIds]);

  const addToComparison = (subId: string) => {
    if (selectedIds.length < 4) {
      setSelectedIds([...selectedIds, subId]);
    }
  };

  const removeFromComparison = (subId: string) => {
    setSelectedIds(selectedIds.filter(id => id !== subId));
  };

  const clearComparison = () => {
    setSelectedIds([]);
  };

  // Calculate max values for normalization
  const maxMetrics = useMemo(() => {
    return {
      rating: 5,
      projectsCompleted: Math.max(...selectedSubs.map(s => s.metrics?.projectsCompleted || 0), 1),
      onTimeRate: 100,
      totalPaid: Math.max(...selectedSubs.map(s => s.metrics?.totalPaid || 0), 1),
    };
  }, [selectedSubs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Link
          href="/dashboard/subcontractors"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Subcontractors
        </Link>
      </div>

      <PageHeader
        title="Compare Subcontractors"
        description="Compare up to 4 subcontractors side by side"
        actions={
          selectedIds.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearComparison}>
              Clear All
            </Button>
          )
        }
      />

      {/* Selection Panel */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Select Subcontractors to Compare</h3>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search subcontractors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={tradeFilter}
            onChange={(e) => setTradeFilter(e.target.value)}
            className="px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Trades</option>
            {trades.map(trade => (
              <option key={trade} value={trade}>{trade}</option>
            ))}
          </select>
        </div>

        {/* Available subs */}
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {filteredSubs.slice(0, 20).map(sub => (
            <button
              key={sub.id}
              onClick={() => addToComparison(sub.id)}
              disabled={selectedIds.length >= 4}
              className={cn(
                'inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm transition-colors',
                selectedIds.length >= 4
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:border-blue-500 hover:bg-blue-50'
              )}
            >
              <PlusIcon className="h-3 w-3" />
              {sub.companyName}
            </button>
          ))}
          {filteredSubs.length === 0 && (
            <p className="text-sm text-gray-500">No subcontractors available</p>
          )}
        </div>

        {/* Selected subs */}
        {selectedIds.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-2">Selected ({selectedIds.length}/4):</p>
            <div className="flex flex-wrap gap-2">
              {selectedSubs.map(sub => (
                <span
                  key={sub.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm"
                >
                  {sub.companyName}
                  <button
                    onClick={() => removeFromComparison(sub.id)}
                    className="p-0.5 hover:bg-blue-200 rounded-full"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Comparison Table */}
      {selectedSubs.length > 0 ? (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 w-48">Metric</th>
                  {selectedSubs.map(sub => (
                    <th key={sub.id} className="px-4 py-3 text-center min-w-[180px]">
                      <Link
                        href={`/dashboard/subcontractors/${sub.id}`}
                        className="text-sm font-semibold text-gray-900 hover:text-blue-600"
                      >
                        {sub.companyName}
                      </Link>
                      <p className="text-xs text-gray-500 font-normal">{sub.trade}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* Rating */}
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <StarIcon className="h-4 w-4 text-gray-400" />
                      Rating
                    </div>
                  </td>
                  {selectedSubs.map(sub => (
                    <td key={sub.id} className="px-4 py-3 text-center">
                      <RatingStars rating={sub.metrics?.avgRating || 0} />
                    </td>
                  ))}
                </tr>

                {/* Projects Completed */}
                <tr className="bg-gray-50/50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-gray-400" />
                      Projects Completed
                    </div>
                  </td>
                  {selectedSubs.map(sub => (
                    <td key={sub.id} className="px-4 py-3">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-900">{sub.metrics?.projectsCompleted || 0}</p>
                        <MetricBar
                          value={sub.metrics?.projectsCompleted || 0}
                          max={maxMetrics.projectsCompleted}
                          color="bg-blue-500"
                        />
                      </div>
                    </td>
                  ))}
                </tr>

                {/* On-Time Rate */}
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      On-Time Rate
                    </div>
                  </td>
                  {selectedSubs.map(sub => {
                    const rate = sub.metrics?.onTimeRate || 0;
                    return (
                      <td key={sub.id} className="px-4 py-3">
                        <div className="text-center">
                          <p className={cn(
                            'text-lg font-semibold',
                            rate >= 90 ? 'text-green-600' : rate >= 70 ? 'text-yellow-600' : 'text-red-600'
                          )}>
                            {rate}%
                          </p>
                          <MetricBar
                            value={rate}
                            max={100}
                            color={rate >= 90 ? 'bg-green-500' : rate >= 70 ? 'bg-yellow-500' : 'bg-red-500'}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Total Paid */}
                <tr className="bg-gray-50/50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                      Total Paid
                    </div>
                  </td>
                  {selectedSubs.map(sub => (
                    <td key={sub.id} className="px-4 py-3">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(sub.metrics?.totalPaid || 0)}
                        </p>
                        <MetricBar
                          value={sub.metrics?.totalPaid || 0}
                          max={maxMetrics.totalPaid}
                          color="bg-purple-500"
                        />
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Status */}
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <ChartBarIcon className="h-4 w-4 text-gray-400" />
                      Status
                    </div>
                  </td>
                  {selectedSubs.map(sub => (
                    <td key={sub.id} className="px-4 py-3 text-center">
                      <Badge className={sub.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                        {sub.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  ))}
                </tr>

                {/* Contact */}
                <tr className="bg-gray-50/50">
                  <td className="px-4 py-3 text-sm text-gray-600">Contact</td>
                  {selectedSubs.map(sub => (
                    <td key={sub.id} className="px-4 py-3 text-center">
                      <p className="text-sm text-gray-900">{sub.contactName}</p>
                      <p className="text-xs text-gray-500">{sub.phone}</p>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={<ChartBarIcon className="h-full w-full" />}
          title="No subcontractors selected"
          description="Select up to 4 subcontractors above to compare their performance metrics"
        />
      )}
    </div>
  );
}
