'use client';

import React from 'react';
import {
  TableCellsIcon,
  ChartBarIcon,
  ChartBarSquareIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';
import { VisualizationType, VISUALIZATION_OPTIONS } from '@/lib/reports/report-builder';
import { cn } from '@/lib/utils';

interface VisualizationPickerProps {
  value: VisualizationType;
  onChange: (visualization: VisualizationType) => void;
  disabled?: boolean;
}

const VISUALIZATION_ICONS: Record<VisualizationType, React.ElementType> = {
  table: TableCellsIcon,
  bar: ChartBarIcon,
  line: ChartBarSquareIcon,
  pie: ChartPieIcon,
};

export function VisualizationPicker({
  value,
  onChange,
  disabled = false,
}: VisualizationPickerProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Visualization
      </label>
      <div className="flex gap-2">
        {VISUALIZATION_OPTIONS.map((option) => {
          const Icon = VISUALIZATION_ICONS[option.value];
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-3 rounded-lg border transition-all flex-1',
                isSelected
                  ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default VisualizationPicker;
