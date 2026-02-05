/**
 * Select Component
 *
 * Styled select dropdown with consistent appearance across the app.
 * Replaces raw <select> elements with a standardized component.
 *
 * @example
 * // Basic usage
 * <Select
 *   label="Status"
 *   value={status}
 *   onChange={(e) => setStatus(e.target.value)}
 *   options={[
 *     { label: 'Active', value: 'active' },
 *     { label: 'Inactive', value: 'inactive' },
 *   ]}
 * />
 *
 * @example
 * // With placeholder and error
 * <Select
 *   label="Category"
 *   value={category}
 *   onChange={handleChange}
 *   placeholder="Select a category..."
 *   options={categoryOptions}
 *   error="Category is required"
 * />
 */

'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /**
   * Label text displayed above the select
   */
  label?: string;

  /**
   * Array of options to display
   */
  options: SelectOption[];

  /**
   * Placeholder text shown when no value is selected
   */
  placeholder?: string;

  /**
   * Error message to display below the select
   */
  error?: string;

  /**
   * Helper text displayed below the select
   */
  helperText?: string;

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Container className
   */
  containerClassName?: string;
}

const sizeClasses = {
  sm: 'pl-2.5 py-1.5 text-sm',
  md: 'pl-3 py-2 text-sm',
  lg: 'pl-4 py-2.5 text-base',
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      placeholder,
      error,
      helperText,
      size = 'md',
      required,
      className,
      containerClassName,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id || `select-${generatedId}`;

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={cn(
            'block w-full rounded-lg border bg-white',
            'focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary',
            'transition-colors appearance-none cursor-pointer',
            'bg-[url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10',
            sizeClasses[size],
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-300',
            disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
