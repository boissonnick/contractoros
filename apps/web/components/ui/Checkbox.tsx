/**
 * Checkbox Component
 *
 * Styled checkbox with label, description, and error states.
 *
 * @example
 * // Basic usage
 * <Checkbox
 *   label="I agree to the terms"
 *   checked={agreed}
 *   onChange={(e) => setAgreed(e.target.checked)}
 * />
 *
 * @example
 * // With description
 * <Checkbox
 *   label="Send notifications"
 *   description="Receive email updates about your projects"
 *   checked={notifications}
 *   onChange={(e) => setNotifications(e.target.checked)}
 * />
 *
 * @example
 * // Indeterminate state
 * <Checkbox
 *   label="Select all"
 *   checked={allSelected}
 *   indeterminate={someSelected && !allSelected}
 *   onChange={handleSelectAll}
 * />
 */

'use client';

import React, { forwardRef, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { CheckIcon, MinusIcon } from '@heroicons/react/20/solid';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /**
   * Label text displayed next to the checkbox
   */
  label?: string;

  /**
   * Description text displayed below the label
   */
  description?: string;

  /**
   * Error message to display
   */
  error?: string;

  /**
   * Whether the checkbox is in an indeterminate state
   */
  indeterminate?: boolean;

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Container className
   */
  containerClassName?: string;
}

const sizeClasses = {
  sm: {
    checkbox: 'h-4 w-4',
    icon: 'h-3 w-3',
    label: 'text-sm',
    description: 'text-xs',
  },
  md: {
    checkbox: 'h-5 w-5',
    icon: 'h-3.5 w-3.5',
    label: 'text-sm',
    description: 'text-sm',
  },
  lg: {
    checkbox: 'h-6 w-6',
    icon: 'h-4 w-4',
    label: 'text-base',
    description: 'text-sm',
  },
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      description,
      error,
      indeterminate,
      size = 'md',
      className,
      containerClassName,
      disabled,
      checked,
      id,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const ref = (forwardedRef as React.RefObject<HTMLInputElement>) || internalRef;

    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    // Handle indeterminate state
    useEffect(() => {
      if (ref.current) {
        ref.current.indeterminate = indeterminate || false;
      }
    }, [indeterminate, ref]);

    const sizes = sizeClasses[size];

    return (
      <div className={cn('relative', containerClassName)}>
        <div className="flex items-start">
          <div className="flex items-center h-6">
            <div className="relative">
              <input
                ref={ref}
                type="checkbox"
                id={checkboxId}
                checked={checked}
                disabled={disabled}
                className={cn(
                  'peer appearance-none rounded border bg-white cursor-pointer',
                  'focus:ring-2 focus:ring-brand-primary/20 focus:ring-offset-2',
                  'transition-colors',
                  sizes.checkbox,
                  error
                    ? 'border-red-300'
                    : 'border-gray-300',
                  'checked:bg-brand-primary checked:border-brand-primary',
                  'disabled:bg-gray-100 disabled:border-gray-200 disabled:cursor-not-allowed',
                  className
                )}
                {...props}
              />
              {/* Check icon */}
              <CheckIcon
                className={cn(
                  'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                  'text-white pointer-events-none',
                  'opacity-0 peer-checked:opacity-100 transition-opacity',
                  indeterminate && 'hidden',
                  sizes.icon
                )}
              />
              {/* Indeterminate icon */}
              <MinusIcon
                className={cn(
                  'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                  'text-white pointer-events-none',
                  'opacity-0 transition-opacity',
                  indeterminate && 'opacity-100',
                  !indeterminate && 'hidden',
                  sizes.icon
                )}
              />
            </div>
          </div>

          {(label || description) && (
            <div className="ml-3">
              {label && (
                <label
                  htmlFor={checkboxId}
                  className={cn(
                    'font-medium text-gray-700 cursor-pointer',
                    disabled && 'text-gray-400 cursor-not-allowed',
                    sizes.label
                  )}
                >
                  {label}
                </label>
              )}
              {description && (
                <p
                  className={cn(
                    'text-gray-500 mt-0.5',
                    disabled && 'text-gray-400',
                    sizes.description
                  )}
                >
                  {description}
                </p>
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-600 ml-8">{error}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

/**
 * CheckboxGroup Component
 *
 * Groups multiple checkboxes together with a label.
 *
 * @example
 * <CheckboxGroup
 *   label="Select features"
 *   options={[
 *     { value: 'feature1', label: 'Feature 1' },
 *     { value: 'feature2', label: 'Feature 2' },
 *   ]}
 *   value={selectedFeatures}
 *   onChange={setSelectedFeatures}
 * />
 */
export interface CheckboxGroupOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface CheckboxGroupProps {
  label?: string;
  options: CheckboxGroupOption[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export function CheckboxGroup({
  label,
  options,
  value,
  onChange,
  error,
  helperText,
  required,
  disabled,
  orientation = 'vertical',
  className,
}: CheckboxGroupProps) {
  const handleChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter((v) => v !== optionValue));
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={cn(
          'space-y-2',
          orientation === 'horizontal' && 'flex flex-wrap gap-x-6 gap-y-2 space-y-0'
        )}
      >
        {options.map((option) => (
          <Checkbox
            key={option.value}
            label={option.label}
            description={option.description}
            checked={value.includes(option.value)}
            onChange={(e) => handleChange(option.value, e.target.checked)}
            disabled={disabled || option.disabled}
          />
        ))}
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

export default Checkbox;
