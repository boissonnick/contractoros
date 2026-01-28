"use client";

import React from 'react';
import { UseFormRegister, FieldError, Path, FieldValues } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface BaseFieldProps {
  label?: string;
  error?: FieldError;
  hint?: string;
  required?: boolean;
  className?: string;
}

interface InputFieldProps<T extends FieldValues> extends BaseFieldProps {
  name: Path<T>;
  register: UseFormRegister<T>;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'date' | 'url';
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
}

export function FormInput<T extends FieldValues>({
  name,
  register,
  label,
  error,
  hint,
  required,
  type = 'text',
  placeholder,
  disabled,
  autoFocus,
  autoComplete,
  className,
}: InputFieldProps<T>) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={name}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          {...register(name)}
          className={cn(
            'block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500 pr-10'
              : 'border-gray-300 focus:border-brand-primary focus:ring-brand-primary',
            disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed'
          )}
        />
        {error && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      )}
      {hint && !error && (
        <p className="mt-1 text-sm text-gray-500">{hint}</p>
      )}
    </div>
  );
}

interface TextareaFieldProps<T extends FieldValues> extends BaseFieldProps {
  name: Path<T>;
  register: UseFormRegister<T>;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}

export function FormTextarea<T extends FieldValues>({
  name,
  register,
  label,
  error,
  hint,
  required,
  placeholder,
  disabled,
  rows = 3,
  className,
}: TextareaFieldProps<T>) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={name}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        {...register(name)}
        className={cn(
          'block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-brand-primary focus:ring-brand-primary',
          disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed'
        )}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      )}
      {hint && !error && (
        <p className="mt-1 text-sm text-gray-500">{hint}</p>
      )}
    </div>
  );
}

interface SelectFieldProps<T extends FieldValues> extends BaseFieldProps {
  name: Path<T>;
  register: UseFormRegister<T>;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}

export function FormSelect<T extends FieldValues>({
  name,
  register,
  label,
  error,
  hint,
  required,
  options,
  placeholder,
  disabled,
  className,
}: SelectFieldProps<T>) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={name}
        disabled={disabled}
        {...register(name)}
        className={cn(
          'block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-brand-primary focus:ring-brand-primary',
          disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed'
        )}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      )}
      {hint && !error && (
        <p className="mt-1 text-sm text-gray-500">{hint}</p>
      )}
    </div>
  );
}

interface CheckboxFieldProps<T extends FieldValues> extends BaseFieldProps {
  name: Path<T>;
  register: UseFormRegister<T>;
  description?: string;
  disabled?: boolean;
}

export function FormCheckbox<T extends FieldValues>({
  name,
  register,
  label,
  description,
  error,
  disabled,
  className,
}: CheckboxFieldProps<T>) {
  return (
    <div className={cn('flex items-start', className)}>
      <div className="flex items-center h-5">
        <input
          id={name}
          type="checkbox"
          disabled={disabled}
          {...register(name)}
          className={cn(
            'h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary',
            disabled && 'bg-gray-100 cursor-not-allowed'
          )}
        />
      </div>
      <div className="ml-3 text-sm">
        {label && (
          <label htmlFor={name} className="font-medium text-gray-700">
            {label}
          </label>
        )}
        {description && (
          <p className="text-gray-500">{description}</p>
        )}
        {error && (
          <p className="mt-1 text-red-600">{error.message}</p>
        )}
      </div>
    </div>
  );
}

/**
 * FormSection - Groups related form fields with a title and optional description
 */
interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

/**
 * FormError - Displays a summary of form errors at the top of a form
 */
interface FormErrorProps {
  errors: Record<string, { message?: string } | undefined>;
  className?: string;
}

export function FormError({ errors, className }: FormErrorProps) {
  const errorMessages = Object.entries(errors)
    .filter(([, error]) => error?.message)
    .map(([field, error]) => ({
      field,
      message: error!.message!,
    }));

  if (errorMessages.length === 0) return null;

  return (
    <div className={cn('rounded-lg bg-red-50 border border-red-200 p-4', className)}>
      <div className="flex items-start">
        <ExclamationCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            {errorMessages.length === 1
              ? 'There was an error with your submission'
              : `There were ${errorMessages.length} errors with your submission`}
          </h3>
          <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
            {errorMessages.map(({ field, message }) => (
              <li key={field}>{message}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * FormFieldWrapper - A generic wrapper for custom form controls
 */
interface FormFieldWrapperProps {
  label?: string;
  error?: FieldError;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormFieldWrapper({
  label,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldWrapperProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      )}
      {hint && !error && (
        <p className="mt-1 text-sm text-gray-500">{hint}</p>
      )}
    </div>
  );
}
