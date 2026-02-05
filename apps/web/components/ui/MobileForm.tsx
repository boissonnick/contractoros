/**
 * MobileForm Components
 *
 * Mobile-optimized form components with proper touch targets,
 * spacing, and responsive behavior.
 */

'use client';

import React from 'react';

/**
 * MobileFormSection
 *
 * A collapsible section for grouping form fields on mobile.
 */
interface MobileFormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
}

export function MobileFormSection({
  title,
  description,
  children,
  className = '',
  defaultOpen = true,
}: MobileFormSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left bg-gray-50 min-h-[48px]"
      >
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * MobileFormField
 *
 * A form field wrapper with proper label, error, and help text styling.
 */
interface MobileFormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
}

export function MobileFormField({
  label,
  required = false,
  error,
  helpText,
  children,
  className = '',
}: MobileFormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
      {helpText && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
}

/**
 * MobileInput
 *
 * A mobile-optimized text input with proper sizing.
 */
interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function MobileInput({
  error,
  className = '',
  ...props
}: MobileInputProps) {
  return (
    <input
      className={`
        w-full px-4 py-3 text-base rounded-lg border transition-colors
        min-h-[48px]
        ${error
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
          : 'border-gray-300 focus:border-brand-primary focus:ring-brand-primary'
        }
        focus:outline-none focus:ring-2 focus:ring-opacity-50
        ${className}
      `}
      {...props}
    />
  );
}

/**
 * MobileTextarea
 *
 * A mobile-optimized textarea with proper sizing.
 */
interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function MobileTextarea({
  error,
  className = '',
  ...props
}: MobileTextareaProps) {
  return (
    <textarea
      className={`
        w-full px-4 py-3 text-base rounded-lg border transition-colors
        min-h-[120px] resize-y
        ${error
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
          : 'border-gray-300 focus:border-brand-primary focus:ring-brand-primary'
        }
        focus:outline-none focus:ring-2 focus:ring-opacity-50
        ${className}
      `}
      {...props}
    />
  );
}

/**
 * MobileSelect
 *
 * A mobile-optimized select with proper sizing.
 */
interface MobileSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function MobileSelect({
  error,
  options,
  placeholder,
  className = '',
  ...props
}: MobileSelectProps) {
  return (
    <select
      className={`
        w-full px-4 py-3 text-base rounded-lg border transition-colors
        min-h-[48px] appearance-none bg-white
        bg-[url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="%236b7280"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>')]
        bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat
        ${error
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
          : 'border-gray-300 focus:border-brand-primary focus:ring-brand-primary'
        }
        focus:outline-none focus:ring-2 focus:ring-opacity-50
        ${className}
      `}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

/**
 * MobileButton
 *
 * A mobile-optimized button with proper touch target.
 */
interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function MobileButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: MobileButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantStyles = {
    primary: 'bg-brand-primary text-white hover:bg-brand-primary-dark focus:ring-brand-primary',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };

  const sizeStyles = {
    sm: 'px-3 py-2 text-sm min-h-[40px]',
    md: 'px-4 py-3 text-base min-h-[48px]',
    lg: 'px-6 py-4 text-lg min-h-[56px]',
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}

/**
 * MobileActionBar
 *
 * A sticky bottom action bar for mobile forms.
 */
interface MobileActionBarProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileActionBar({ children, className = '' }: MobileActionBarProps) {
  return (
    <div
      className={`
        fixed bottom-16 inset-x-0 bg-white border-t border-gray-200
        p-4 pb-safe md:static md:bottom-auto md:p-0 md:border-0 md:bg-transparent
        z-40
        ${className}
      `}
    >
      <div className="flex gap-3">
        {children}
      </div>
    </div>
  );
}

/**
 * MobileBottomSheet
 *
 * A mobile-friendly bottom sheet for forms and actions.
 */
interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}: MobileBottomSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`
          absolute bottom-0 inset-x-0 bg-white rounded-t-2xl
          max-h-[85vh] overflow-hidden flex flex-col
          animate-slide-up
          ${className}
        `}
      >
        {/* Handle */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-4 pb-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-safe">
          {children}
        </div>
      </div>
    </div>
  );
}

export default MobileFormField;
