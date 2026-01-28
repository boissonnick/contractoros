"use client";

import React, { useState } from 'react';
import { QuoteSection } from '@/types';
import { Card } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { CurrencyDollarIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface QuoteSummaryCardProps {
  sections: QuoteSection[];
  quoteTotal?: number | null;
  /** Group sections by phase if phaseId is present */
  showPhaseBreakdown?: boolean;
  /** Phase names lookup */
  phases?: { id: string; name: string }[];
}

export default function QuoteSummaryCard({ sections, quoteTotal, showPhaseBreakdown, phases = [] }: QuoteSummaryCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const totalLabor = sections.reduce((sum, s) => sum + (s.laborCost || 0), 0);
  const totalMaterials = sections.reduce((sum, s) => sum + (s.materialCost || 0), 0);
  const total = quoteTotal ?? (totalLabor + totalMaterials);

  // Group sections by phase
  const sectionsByPhase = showPhaseBreakdown
    ? sections.reduce((acc, section) => {
        const phaseId = (section as QuoteSection & { phaseId?: string }).phaseId || 'unassigned';
        if (!acc[phaseId]) acc[phaseId] = [];
        acc[phaseId].push(section);
        return acc;
      }, {} as Record<string, QuoteSection[]>)
    : null;

  const getPhaseDisplayName = (phaseId: string) => {
    if (phaseId === 'unassigned') return 'Unassigned';
    return phases.find(p => p.id === phaseId)?.name || 'Unknown Phase';
  };

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

          {/* Phase breakdown toggle */}
          {sectionsByPhase && Object.keys(sectionsByPhase).length > 1 && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-xs text-brand-primary hover:underline"
            >
              {showDetails ? (
                <ChevronDownIcon className="h-3 w-3" />
              ) : (
                <ChevronRightIcon className="h-3 w-3" />
              )}
              {showDetails ? 'Hide' : 'Show'} phase breakdown
            </button>
          )}

          {/* Phase breakdown details */}
          {showDetails && sectionsByPhase && (
            <div className="border-t pt-3 space-y-2">
              {Object.entries(sectionsByPhase).map(([phaseId, phaseSections]) => {
                const phaseTotal = phaseSections.reduce(
                  (sum, s) => sum + (s.laborCost || 0) + (s.materialCost || 0),
                  0
                );
                return (
                  <div key={phaseId} className="flex justify-between text-xs">
                    <span className="text-gray-600">{getPhaseDisplayName(phaseId)}</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(phaseTotal)}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-xs text-gray-400">
            {sections.length} section{sections.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </Card>
  );
}
