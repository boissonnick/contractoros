"use client";

import React from 'react';
import { RecurrenceConfig, RecurrenceFrequency } from '@/types';
import { cn } from '@/lib/utils';
import { Input, Select } from '@/components/ui';
import { formatDate } from '@/lib/date-utils';
import { ArrowPathIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

interface RecurringTaskConfigProps {
  config: RecurrenceConfig | undefined;
  onChange: (config: RecurrenceConfig | undefined) => void;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 Weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const daysOfWeek = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export default function RecurringTaskConfig({
  config,
  onChange,
  isEnabled,
  onToggle,
}: RecurringTaskConfigProps) {
  const handleFrequencyChange = (frequency: RecurrenceFrequency) => {
    onChange({
      ...(config || { interval: 1 }),
      frequency,
      // Reset day-specific settings when frequency changes
      daysOfWeek: frequency === 'weekly' || frequency === 'biweekly' ? config?.daysOfWeek || [1] : undefined,
      dayOfMonth: frequency === 'monthly' || frequency === 'quarterly' ? config?.dayOfMonth || 1 : undefined,
    });
  };

  const handleIntervalChange = (interval: number) => {
    if (!config) return;
    onChange({ ...config, interval: Math.max(1, interval) });
  };

  const handleDayOfWeekToggle = (day: number) => {
    if (!config) return;
    const currentDays = config.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort((a, b) => a - b);
    // Always keep at least one day selected
    if (newDays.length > 0) {
      onChange({ ...config, daysOfWeek: newDays });
    }
  };

  const handleDayOfMonthChange = (day: number) => {
    if (!config) return;
    onChange({ ...config, dayOfMonth: Math.min(31, Math.max(1, day)) });
  };

  const handleEndDateChange = (endDate: string) => {
    if (!config) return;
    onChange({
      ...config,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  };

  const handleMaxOccurrencesChange = (max: number) => {
    if (!config) return;
    onChange({
      ...config,
      maxOccurrences: max > 0 ? max : undefined,
    });
  };

  const getRecurrenceDescription = (): string => {
    if (!config) return '';
    const { frequency, interval, daysOfWeek: days, dayOfMonth } = config;

    let description = 'Repeats ';

    if (interval > 1) {
      description += `every ${interval} `;
      switch (frequency) {
        case 'daily': description += 'days'; break;
        case 'weekly': description += 'weeks'; break;
        case 'biweekly': description += 'periods (bi-weekly base)'; break;
        case 'monthly': description += 'months'; break;
        case 'quarterly': description += 'quarters'; break;
        case 'yearly': description += 'years'; break;
      }
    } else {
      description += frequency;
    }

    if ((frequency === 'weekly' || frequency === 'biweekly') && days && days.length > 0) {
      const dayNames = days.map((d) => daysOfWeek.find((dw) => dw.value === d)?.label).join(', ');
      description += ` on ${dayNames}`;
    }

    if ((frequency === 'monthly' || frequency === 'quarterly') && dayOfMonth) {
      description += ` on day ${dayOfMonth}`;
    }

    if (config.endDate) {
      description += ` until ${formatDate(config.endDate)}`;
    } else if (config.maxOccurrences) {
      description += ` (${config.maxOccurrences} times)`;
    }

    return description;
  };

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowPathIcon className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Recurring Task</span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!isEnabled) {
              // Enable with default config
              onToggle(true);
              onChange({
                frequency: 'weekly',
                interval: 1,
                daysOfWeek: [1], // Monday default
              });
            } else {
              onToggle(false);
              onChange(undefined);
            }
          }}
          className={cn(
            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            isEnabled ? 'bg-blue-600' : 'bg-gray-200'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
              isEnabled ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      {/* Configuration (shown when enabled) */}
      {isEnabled && config && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {/* Frequency Selection */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Frequency"
              value={config.frequency}
              onChange={(e) => handleFrequencyChange(e.target.value as RecurrenceFrequency)}
              options={frequencyOptions}
            />
            <div>
              <Input
                label="Every"
                type="number"
                min="1"
                value={config.interval.toString()}
                onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-gray-400 mt-1">
                {config.frequency === 'daily' ? 'days' :
                  config.frequency === 'weekly' ? 'weeks' :
                  config.frequency === 'biweekly' ? 'periods' :
                  config.frequency === 'monthly' ? 'months' :
                  config.frequency === 'quarterly' ? 'quarters' : 'years'}
              </p>
            </div>
          </div>

          {/* Day of Week Selection (for weekly/biweekly) */}
          {(config.frequency === 'weekly' || config.frequency === 'biweekly') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repeat on
              </label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleDayOfWeekToggle(day.value)}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                      config.daysOfWeek?.includes(day.value)
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day of Month Selection (for monthly/quarterly) */}
          {(config.frequency === 'monthly' || config.frequency === 'quarterly') && (
            <div>
              <Input
                label="Day of Month"
                type="number"
                min="1"
                max="31"
                value={config.dayOfMonth?.toString() || '1'}
                onChange={(e) => handleDayOfMonthChange(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-gray-400 mt-1">Use 28 or earlier for reliability across all months</p>
            </div>
          )}

          {/* End Conditions */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              End Condition
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  <CalendarDaysIcon className="h-3.5 w-3.5 inline mr-1" />
                  End Date (optional)
                </label>
                <input
                  type="date"
                  value={config.endDate ? new Date(config.endDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Max Occurrences (optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.maxOccurrences || ''}
                  onChange={(e) => handleMaxOccurrencesChange(parseInt(e.target.value) || 0)}
                  placeholder="Unlimited"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <p className="text-sm text-blue-700">
              <ArrowPathIcon className="h-4 w-4 inline mr-1" />
              {getRecurrenceDescription()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
