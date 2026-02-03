'use client';

import React from 'react';
import {
  FolderIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ClockIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { DataSourceType, DATA_SOURCES } from '@/lib/reports/report-builder';
import { cn } from '@/lib/utils';

interface DataSourcePickerProps {
  value: DataSourceType;
  onChange: (source: DataSourceType) => void;
  disabled?: boolean;
}

const DATA_SOURCE_ICONS: Record<DataSourceType, React.ElementType> = {
  projects: FolderIcon,
  tasks: ClipboardDocumentListIcon,
  expenses: CurrencyDollarIcon,
  invoices: DocumentTextIcon,
  timeEntries: ClockIcon,
  clients: UserGroupIcon,
  subcontractors: WrenchScrewdriverIcon,
  materials: CubeIcon,
};

export function DataSourcePicker({
  value,
  onChange,
  disabled = false,
}: DataSourcePickerProps) {
  const sources = Object.values(DATA_SOURCES);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Data Source
      </label>
      <div className="grid grid-cols-2 gap-2">
        {sources.map((source) => {
          const Icon = DATA_SOURCE_ICONS[source.id];
          const isSelected = value === source.id;

          return (
            <button
              key={source.id}
              type="button"
              onClick={() => onChange(source.id)}
              disabled={disabled}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all',
                isSelected
                  ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium truncate">{source.label}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Select the data you want to include in your report
      </p>
    </div>
  );
}

export default DataSourcePicker;
