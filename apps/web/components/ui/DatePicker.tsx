/**
 * DatePicker Component
 *
 * Styled date input with consistent appearance and formatting.
 * Uses native date input for best mobile experience.
 *
 * @example
 * // Basic usage
 * <DatePicker
 *   label="Due Date"
 *   value={dueDate}
 *   onChange={(date) => setDueDate(date)}
 * />
 *
 * @example
 * // With min/max constraints
 * <DatePicker
 *   label="Start Date"
 *   value={startDate}
 *   onChange={setStartDate}
 *   min={new Date()}
 *   max={endDate}
 *   required
 * />
 *
 * @example
 * // Date range
 * <div className="flex gap-4">
 *   <DatePicker label="From" value={from} onChange={setFrom} />
 *   <DatePicker label="To" value={to} onChange={setTo} min={from} />
 * </div>
 */

'use client';

import React, { forwardRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CalendarIcon } from '@heroicons/react/24/outline';

export interface DatePickerProps {
  /**
   * Label text displayed above the input
   */
  label?: string;

  /**
   * Current date value
   */
  value?: Date | string | null;

  /**
   * Callback when date changes
   */
  onChange?: (date: Date | null) => void;

  /**
   * Minimum selectable date
   */
  min?: Date | string;

  /**
   * Maximum selectable date
   */
  max?: Date | string;

  /**
   * Placeholder text (shown in browsers that support it)
   */
  placeholder?: string;

  /**
   * Error message to display
   */
  error?: string;

  /**
   * Helper text displayed below the input
   */
  helperText?: string;

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Whether the field is disabled
   */
  disabled?: boolean;

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Additional className for the input
   */
  className?: string;

  /**
   * Container className
   */
  containerClassName?: string;

  /**
   * Input name attribute
   */
  name?: string;

  /**
   * Input id attribute
   */
  id?: string;
}

const sizeClasses = {
  sm: 'px-2.5 py-1.5 text-sm',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-2.5 text-base',
};

/**
 * Format a Date object to YYYY-MM-DD string for input value
 */
function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      label,
      value,
      onChange,
      min,
      max,
      placeholder,
      error,
      helperText,
      required,
      disabled,
      size = 'md',
      className,
      containerClassName,
      name,
      id,
    },
    ref
  ) => {
    const inputId = id || `datepicker-${Math.random().toString(36).substr(2, 9)}`;

    const formattedValue = useMemo(() => formatDateForInput(value), [value]);
    const formattedMin = useMemo(() => formatDateForInput(min), [min]);
    const formattedMax = useMemo(() => formatDateForInput(max), [max]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (!newValue) {
          onChange?.(null);
        } else {
          // Create date at noon to avoid timezone issues
          const [year, month, day] = newValue.split('-').map(Number);
          const date = new Date(year, month - 1, day, 12, 0, 0);
          onChange?.(date);
        }
      },
      [onChange]
    );

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            type="date"
            id={inputId}
            name={name}
            value={formattedValue}
            onChange={handleChange}
            min={formattedMin}
            max={formattedMax}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={cn(
              'block w-full rounded-lg border bg-white',
              'focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary',
              'transition-colors',
              sizeClasses[size],
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300',
              disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
              // Hide default calendar icon in webkit browsers
              '[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer',
              className
            )}
          />
          <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>

        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

/**
 * DateRangePicker Component
 *
 * Combines two DatePicker components for selecting a date range.
 *
 * @example
 * <DateRangePicker
 *   startDate={startDate}
 *   endDate={endDate}
 *   onStartDateChange={setStartDate}
 *   onEndDateChange={setEndDate}
 * />
 */
export interface DateRangePickerProps {
  startDate?: Date | null;
  endDate?: Date | null;
  onStartDateChange?: (date: Date | null) => void;
  onEndDateChange?: (date: Date | null) => void;
  startLabel?: string;
  endLabel?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel = 'Start Date',
  endLabel = 'End Date',
  minDate,
  maxDate,
  disabled,
  error,
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row gap-4', className)}>
      <DatePicker
        label={startLabel}
        value={startDate}
        onChange={onStartDateChange}
        min={minDate}
        max={endDate || maxDate}
        disabled={disabled}
        error={error}
        containerClassName="flex-1"
      />
      <DatePicker
        label={endLabel}
        value={endDate}
        onChange={onEndDateChange}
        min={startDate || minDate}
        max={maxDate}
        disabled={disabled}
        containerClassName="flex-1"
      />
    </div>
  );
}

export default DatePicker;
