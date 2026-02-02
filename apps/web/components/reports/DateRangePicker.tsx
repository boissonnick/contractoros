'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CalendarIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import {
  DateRange,
  DatePreset,
  DATE_PRESETS,
  getDateRangeFromPreset,
} from '@/lib/reports/types';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  showPresets?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DateRangePicker({
  value,
  onChange,
  className,
  showPresets = true,
  minDate,
  maxDate,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<DatePreset | null>(null);
  const [customStart, setCustomStart] = useState(formatDateForInput(value.startDate));
  const [customEnd, setCustomEnd] = useState(formatDateForInput(value.endDate));
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update custom dates when value changes externally
  useEffect(() => {
    setCustomStart(formatDateForInput(value.startDate));
    setCustomEnd(formatDateForInput(value.endDate));
  }, [value.startDate, value.endDate]);

  const handlePresetSelect = (preset: DatePreset) => {
    setSelectedPreset(preset);
    if (preset === 'custom') {
      // Don't close, let user pick custom dates
      return;
    }
    const range = getDateRangeFromPreset(preset);
    onChange(range);
    setIsOpen(false);
  };

  const handleCustomDateChange = () => {
    const start = new Date(customStart);
    const end = new Date(customEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return;
    }

    if (start > end) {
      return;
    }

    onChange({
      startDate: start,
      endDate: end,
      label: 'Custom Range',
    });
    setSelectedPreset('custom');
    setIsOpen(false);
  };

  const displayLabel = value.label || `${formatDateForDisplay(value.startDate)} - ${formatDateForDisplay(value.endDate)}`;

  // Quick preset buttons (most common)
  const quickPresets: DatePreset[] = ['this_month', 'last_month', 'last_30_days', 'this_year'];

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg',
          'text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500',
          'transition-colors min-w-[200px]'
        )}
      >
        <CalendarIcon className="h-4 w-4 text-gray-500" />
        <span className="flex-1 text-left truncate">{displayLabel}</span>
        <ChevronDownIcon
          className={cn(
            'h-4 w-4 text-gray-500 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg">
          {showPresets && (
            <>
              {/* Quick presets */}
              <div className="p-2 border-b border-gray-100">
                <div className="flex flex-wrap gap-1">
                  {quickPresets.map((preset) => {
                    const option = DATE_PRESETS.find((p) => p.value === preset);
                    if (!option) return null;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handlePresetSelect(preset)}
                        className={cn(
                          'px-2 py-1 text-xs rounded-full transition-colors',
                          selectedPreset === preset
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* All presets */}
              <div className="max-h-48 overflow-y-auto border-b border-gray-100">
                {DATE_PRESETS.filter((p) => p.value !== 'custom').map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handlePresetSelect(preset.value)}
                    className={cn(
                      'w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors',
                      selectedPreset === preset.value && 'bg-blue-50 text-blue-700'
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Custom date range */}
          <div className="p-3">
            <p className="text-xs font-medium text-gray-500 mb-2">Custom Range</p>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="sr-only">Start date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  min={minDate ? formatDateForInput(minDate) : undefined}
                  max={customEnd || (maxDate ? formatDateForInput(maxDate) : undefined)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <span className="text-gray-400">to</span>
              <div className="flex-1">
                <label className="sr-only">End date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  min={customStart || (minDate ? formatDateForInput(minDate) : undefined)}
                  max={maxDate ? formatDateForInput(maxDate) : undefined}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleCustomDateChange}
              className="mt-2 w-full px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Simpler inline version for compact layouts
interface InlineDateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export function InlineDateRangePicker({
  value,
  onChange,
  className,
}: InlineDateRangePickerProps) {
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const start = new Date(e.target.value);
    if (!isNaN(start.getTime()) && start <= value.endDate) {
      onChange({ ...value, startDate: start, label: 'Custom Range' });
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const end = new Date(e.target.value);
    if (!isNaN(end.getTime()) && end >= value.startDate) {
      onChange({ ...value, endDate: end, label: 'Custom Range' });
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <CalendarIcon className="h-4 w-4 text-gray-500" />
      <input
        type="date"
        value={formatDateForInput(value.startDate)}
        onChange={handleStartChange}
        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <span className="text-gray-400">to</span>
      <input
        type="date"
        value={formatDateForInput(value.endDate)}
        onChange={handleEndChange}
        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}

export default DateRangePicker;
