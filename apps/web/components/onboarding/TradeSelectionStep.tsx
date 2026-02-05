"use client";

import React, { useState } from 'react';
import { CONSTRUCTION_TRADES } from '@/types';
import { Button } from '@/components/ui';
import { ArrowRightIcon, ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface TradeSelectionStepProps {
  initialTrades?: string[];
  onNext: (trades: string[]) => void;
  onBack: () => void;
}

export default function TradeSelectionStep({ initialTrades = [], onNext, onBack }: TradeSelectionStepProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialTrades));

  const toggle = (trade: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(trade)) next.delete(trade); else next.add(trade);
      return next;
    });
  };

  return (
    <div>
      <p className="text-gray-500 mb-6">Select all trades that apply to you.</p>
      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
        {CONSTRUCTION_TRADES.map(trade => (
          <button
            key={trade}
            onClick={() => toggle(trade)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-all',
              selected.has(trade) ? 'border-brand-primary bg-brand-50 text-brand-900' : 'border-gray-200 hover:border-gray-300 text-gray-700'
            )}
          >
            <div className={cn('w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
              selected.has(trade) ? 'bg-brand-primary border-brand-primary' : 'border-gray-300'
            )}>
              {selected.has(trade) && <CheckIcon className="h-3 w-3 text-white" />}
            </div>
            {trade}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack} icon={<ArrowLeftIcon className="h-4 w-4" />}>Back</Button>
        <Button variant="primary" onClick={() => onNext(Array.from(selected))} disabled={selected.size === 0} icon={<ArrowRightIcon className="h-4 w-4" />} iconPosition="right">Continue</Button>
      </div>
    </div>
  );
}
