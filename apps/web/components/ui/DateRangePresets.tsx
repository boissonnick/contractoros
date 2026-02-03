/**
 * DateRangePresets Component
 *
 * Provides quick-select preset buttons for common date ranges.
 * Can be used standalone or integrated with any date picker component.
 *
 * @example
 * // Standalone usage
 * <DateRangePresets
 *   onSelect={(startDate, endDate, label) => {
 *     setDateRange({ startDate, endDate });
 *   }}
 * />
 *
 * @example
 * // With custom presets
 * <DateRangePresets
 *   presets={['today', 'this_week', 'this_month']}
 *   selectedPreset={currentPreset}
 *   onSelect={handleSelect}
 *   variant="pills"
 * />
 *
 * @example
 * // Compact layout for tight spaces
 * <DateRangePresets
 *   layout="compact"
 *   size="sm"
 *   onSelect={handleSelect}
 * />
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

// Date preset types
export type DatePresetValue =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days';

export interface DatePresetConfig {
  value: DatePresetValue;
  label: string;
  shortLabel?: string;
}

// Default preset configurations
export const DATE_PRESET_CONFIGS: DatePresetConfig[] = [
  { value: 'today', label: 'Today', shortLabel: 'Today' },
  { value: 'yesterday', label: 'Yesterday', shortLabel: 'Yest.' },
  { value: 'this_week', label: 'This Week', shortLabel: 'Wk' },
  { value: 'last_week', label: 'Last Week', shortLabel: 'Last Wk' },
  { value: 'this_month', label: 'This Month', shortLabel: 'Mo' },
  { value: 'last_month', label: 'Last Month', shortLabel: 'Last Mo' },
  { value: 'this_quarter', label: 'This Quarter', shortLabel: 'Qtr' },
  { value: 'last_quarter', label: 'Last Quarter', shortLabel: 'Last Qtr' },
  { value: 'this_year', label: 'This Year', shortLabel: 'Yr' },
  { value: 'last_year', label: 'Last Year', shortLabel: 'Last Yr' },
  { value: 'last_7_days', label: 'Last 7 Days', shortLabel: '7d' },
  { value: 'last_30_days', label: 'Last 30 Days', shortLabel: '30d' },
  { value: 'last_90_days', label: 'Last 90 Days', shortLabel: '90d' },
];

// Common preset groups
export const PRESET_GROUPS = {
  basic: ['today', 'yesterday', 'this_week', 'this_month'] as DatePresetValue[],
  extended: ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month'] as DatePresetValue[],
  rolling: ['last_7_days', 'last_30_days', 'last_90_days'] as DatePresetValue[],
  periods: ['this_week', 'this_month', 'this_quarter', 'this_year'] as DatePresetValue[],
  comparison: ['this_month', 'last_month', 'this_quarter', 'last_quarter', 'this_year', 'last_year'] as DatePresetValue[],
  all: DATE_PRESET_CONFIGS.map(p => p.value),
};

export interface DateRangePresetsProps {
  /**
   * Which presets to show (default: extended)
   * Can be an array of preset values or a preset group name
   */
  presets?: DatePresetValue[] | keyof typeof PRESET_GROUPS;

  /**
   * Currently selected preset (for controlled usage)
   */
  selectedPreset?: DatePresetValue | null;

  /**
   * Callback when a preset is selected
   * Provides start date, end date, and human-readable label
   */
  onSelect?: (startDate: Date, endDate: Date, label: string, preset: DatePresetValue) => void;

  /**
   * Visual variant
   * - pills: Rounded pill buttons (default)
   * - buttons: Standard button style
   * - chips: Compact chip style
   * - underline: Text with underline on hover
   */
  variant?: 'pills' | 'buttons' | 'chips' | 'underline';

  /**
   * Size variant
   */
  size?: 'xs' | 'sm' | 'md';

  /**
   * Layout style
   * - inline: All in a row with wrapping (default)
   * - compact: Tight spacing, short labels
   * - stacked: Vertical list
   */
  layout?: 'inline' | 'compact' | 'stacked';

  /**
   * Whether the component is disabled
   */
  disabled?: boolean;

  /**
   * Additional class name
   */
  className?: string;

  /**
   * Optional label/title above the presets
   */
  label?: string;

  /**
   * Use short labels (for compact layouts)
   */
  useShortLabels?: boolean;
}

/**
 * Calculate date range from a preset value
 */
export function getDateRangeFromPresetValue(preset: DatePresetValue): { startDate: Date; endDate: Date; label: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);

  switch (preset) {
    case 'today':
      return {
        startDate: new Date(today),
        endDate: new Date(today),
        label: 'Today',
      };

    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        startDate: yesterday,
        endDate: new Date(yesterday),
        label: 'Yesterday',
      };
    }

    case 'this_week': {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return {
        startDate: startOfWeek,
        endDate: new Date(today),
        label: 'This Week',
      };
    }

    case 'last_week': {
      const endOfLastWeek = new Date(today);
      endOfLastWeek.setDate(today.getDate() - today.getDay() - 1);
      const startOfLastWeek = new Date(endOfLastWeek);
      startOfLastWeek.setDate(endOfLastWeek.getDate() - 6);
      return {
        startDate: startOfLastWeek,
        endDate: endOfLastWeek,
        label: 'Last Week',
      };
    }

    case 'this_month': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0);
      return {
        startDate: startOfMonth,
        endDate: new Date(today),
        label: 'This Month',
      };
    }

    case 'last_month': {
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1, 12, 0, 0);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 12, 0, 0);
      return {
        startDate: startOfLastMonth,
        endDate: endOfLastMonth,
        label: 'Last Month',
      };
    }

    case 'this_quarter': {
      const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
      const startOfQuarter = new Date(today.getFullYear(), quarterMonth, 1, 12, 0, 0);
      return {
        startDate: startOfQuarter,
        endDate: new Date(today),
        label: 'This Quarter',
      };
    }

    case 'last_quarter': {
      const currentQuarterMonth = Math.floor(today.getMonth() / 3) * 3;
      const startOfLastQuarter = new Date(today.getFullYear(), currentQuarterMonth - 3, 1, 12, 0, 0);
      const endOfLastQuarter = new Date(today.getFullYear(), currentQuarterMonth, 0, 12, 0, 0);
      return {
        startDate: startOfLastQuarter,
        endDate: endOfLastQuarter,
        label: 'Last Quarter',
      };
    }

    case 'this_year': {
      const startOfYear = new Date(today.getFullYear(), 0, 1, 12, 0, 0);
      return {
        startDate: startOfYear,
        endDate: new Date(today),
        label: 'This Year',
      };
    }

    case 'last_year': {
      const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1, 12, 0, 0);
      const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31, 12, 0, 0);
      return {
        startDate: startOfLastYear,
        endDate: endOfLastYear,
        label: 'Last Year',
      };
    }

    case 'last_7_days': {
      const start = new Date(today);
      start.setDate(today.getDate() - 6); // 7 days including today
      return {
        startDate: start,
        endDate: new Date(today),
        label: 'Last 7 Days',
      };
    }

    case 'last_30_days': {
      const start = new Date(today);
      start.setDate(today.getDate() - 29); // 30 days including today
      return {
        startDate: start,
        endDate: new Date(today),
        label: 'Last 30 Days',
      };
    }

    case 'last_90_days': {
      const start = new Date(today);
      start.setDate(today.getDate() - 89); // 90 days including today
      return {
        startDate: start,
        endDate: new Date(today),
        label: 'Last 90 Days',
      };
    }

    default:
      return {
        startDate: new Date(today),
        endDate: new Date(today),
        label: 'Today',
      };
  }
}

// Style configurations
const variantClasses = {
  pills: {
    base: 'px-3 py-1 rounded-full border transition-colors',
    idle: 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300',
    selected: 'border-brand-primary bg-brand-primary/10 text-brand-primary',
    disabled: 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed',
  },
  buttons: {
    base: 'px-3 py-1.5 rounded-md border transition-colors',
    idle: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    selected: 'border-brand-primary bg-brand-primary text-white',
    disabled: 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed',
  },
  chips: {
    base: 'px-2 py-0.5 rounded-md transition-colors',
    idle: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
    selected: 'bg-brand-primary text-white',
    disabled: 'bg-gray-50 text-gray-400 cursor-not-allowed',
  },
  underline: {
    base: 'px-1 py-0.5 transition-colors border-b-2',
    idle: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
    selected: 'border-brand-primary text-brand-primary',
    disabled: 'border-transparent text-gray-300 cursor-not-allowed',
  },
};

const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-xs sm:text-sm',
  md: 'text-sm',
};

const layoutClasses = {
  inline: 'flex flex-wrap gap-1.5',
  compact: 'flex flex-wrap gap-1',
  stacked: 'flex flex-col gap-1',
};

export function DateRangePresets({
  presets = 'extended',
  selectedPreset,
  onSelect,
  variant = 'pills',
  size = 'sm',
  layout = 'inline',
  disabled = false,
  className,
  label,
  useShortLabels = false,
}: DateRangePresetsProps) {
  // Resolve presets array
  const resolvedPresets = useMemo(() => {
    const presetValues = typeof presets === 'string' ? PRESET_GROUPS[presets] : presets;
    return presetValues.map(value => {
      const config = DATE_PRESET_CONFIGS.find(p => p.value === value);
      return config || { value, label: value, shortLabel: value };
    });
  }, [presets]);

  // Use short labels in compact mode or when explicitly requested
  const shouldUseShortLabels = useShortLabels || layout === 'compact';

  const handleSelect = useCallback(
    (preset: DatePresetConfig) => {
      if (disabled || !onSelect) return;
      const range = getDateRangeFromPresetValue(preset.value);
      onSelect(range.startDate, range.endDate, range.label, preset.value);
    },
    [disabled, onSelect]
  );

  const variantStyle = variantClasses[variant];

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          {label}
        </label>
      )}
      <div className={layoutClasses[layout]} role="group" aria-label="Date range presets">
        {resolvedPresets.map((preset) => {
          const isSelected = selectedPreset === preset.value;
          const displayLabel = shouldUseShortLabels && preset.shortLabel
            ? preset.shortLabel
            : preset.label;

          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleSelect(preset)}
              disabled={disabled}
              aria-pressed={isSelected}
              title={preset.label}
              className={cn(
                variantStyle.base,
                sizeClasses[size],
                disabled
                  ? variantStyle.disabled
                  : isSelected
                  ? variantStyle.selected
                  : variantStyle.idle
              )}
            >
              {displayLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Inline version for tight spaces - just the preset buttons
 */
export function InlineDateRangePresets({
  presets = 'basic',
  selectedPreset,
  onSelect,
  disabled = false,
  className,
}: Pick<DateRangePresetsProps, 'presets' | 'selectedPreset' | 'onSelect' | 'disabled' | 'className'>) {
  return (
    <DateRangePresets
      presets={presets}
      selectedPreset={selectedPreset}
      onSelect={onSelect}
      variant="chips"
      size="xs"
      layout="compact"
      disabled={disabled}
      className={className}
      useShortLabels
    />
  );
}

export default DateRangePresets;
