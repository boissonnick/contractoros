"use client";

import React from 'react';
import { QuoteSection } from '@/types';
import { Card } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface QuoteSummaryCardProps {
  sections: QuoteSection[];
  quoteTotal?: number | null;
}

export default function QuoteSummaryCard({ sections, quoteTotal }: QuoteSummaryCardProps) {
  const totalLabor = sections.reduce((sum, s) => sum + (s.laborCost || 0), 0);
  const totalMaterials = sections.reduce((sum, s) => sum + (s.materialCost || 0), 0);
  const total = quoteTotal ?? (totalLabor + totalMaterials);

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-100 rounded-lg">
          <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
        </div>
        <h3 className="font-semibold text-gray-900">Quote Summary</h3>
      </div>

      {sections.length === 0 ? (
        <p className="text-sm text-gray-500">No quote sections yet. Build a quote to get started.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Labor</span>
            <span className="font-medium text-gray-900">{formatCurrency(totalLabor)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Materials</span>
            <span className="font-medium text-gray-900">{formatCurrency(totalMaterials)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="font-bold text-gray-900 text-lg">{formatCurrency(total)}</span>
          </div>
          <div className="text-xs text-gray-400">
            {sections.length} section{sections.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </Card>
  );
}
