"use client";

import React, { useState } from 'react';
import { ChangeOrder } from '@/types';
import ChangeOrderCard from './ChangeOrderCard';

interface ChangeOrderListProps {
  changeOrders: ChangeOrder[];
  onSelect: (co: ChangeOrder) => void;
}

export default function ChangeOrderList({ changeOrders, onSelect }: ChangeOrderListProps) {
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all'
    ? changeOrders
    : changeOrders.filter(co => co.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'draft', 'pending_pm', 'pending_owner', 'pending_client', 'approved', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filter === f ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="border border-gray-200 rounded-xl p-12 text-center bg-gray-50">
          <p className="text-sm text-gray-400">No change orders found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((co) => (
            <ChangeOrderCard key={co.id} co={co} onClick={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}
