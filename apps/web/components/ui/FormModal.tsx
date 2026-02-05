/**
 * FormModal Component
 *
 * Standardized modal wrapper for forms with consistent styling,
 * footer buttons, loading states, and error handling.
 *
 * @example
 * // Basic usage
 * <FormModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Add Client"
 *   onSubmit={handleSubmit}
 * >
 *   <FormInput label="Name" {...register('name')} />
 *   <FormInput label="Email" type="email" {...register('email')} />
 * </FormModal>
 *
 * @example
 * // With description and custom submit label
 * <FormModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Create Project"
 *   description="Enter the project details below"
 *   submitLabel="Create Project"
 *   loading={isSubmitting}
 *   onSubmit={handleSubmit}
 * >
 *   {children}
 * </FormModal>
 *
 * @example
 * // With custom footer
 * <FormModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Review Changes"
 *   footer={
 *     <>
 *       <Button variant="outline" onClick={handleClose}>Cancel</Button>
 *       <Button variant="outline" onClick={handleSaveDraft}>Save Draft</Button>
 *       <Button onClick={handleSubmit}>Submit</Button>
 *     </>
 *   }
 * >
 *   {children}
 * </FormModal>
 */

'use client';

import React, { FormEvent, useCallback } from 'react';
import BaseModal from './BaseModal';
import Button from './Button';

export interface FormModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Callback when modal should close
   */
  onClose: () => void;

  /**
   * Modal title
   */
  title: string;

  /**
   * Optional description below title
   */
  description?: string;

  /**
   * Form submit handler
   */
  onSubmit?: () => void | Promise<void>;

  /**
   * Submit button label (default: 'Save')
   */
  submitLabel?: string;

  /**
   * Cancel button label (default: 'Cancel')
   */
  cancelLabel?: string;

  /**
   * Whether submit is in progress
   */
  loading?: boolean;

  /**
   * Whether submit button is disabled
   */
  disabled?: boolean;

  /**
   * Modal size
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  /**
   * Custom footer content (replaces default buttons)
   */
  footer?: React.ReactNode;

  /**
   * Whether to hide the footer entirely
   */
  hideFooter?: boolean;

  /**
   * Form content
   */
  children: React.ReactNode;

  /**
   * Additional className for modal content
   */
  className?: string;

  /**
   * Error message to display
   */
  error?: string | null;

  /**
   * Variant of submit button
   */
  submitVariant?: 'primary' | 'danger';
}

export function FormModal({
  isOpen,
  onClose,
  title,
  description,
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  loading = false,
  disabled = false,
  size = 'md',
  footer,
  hideFooter = false,
  children,
  className = '',
  error,
  submitVariant = 'primary',
}: FormModalProps) {
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (onSubmit && !loading && !disabled) {
        await onSubmit();
      }
    },
    [onSubmit, loading, disabled]
  );

  const handleClose = useCallback(() => {
    if (!loading) {
      onClose();
    }
  }, [loading, onClose]);

  return (
    <BaseModal open={isOpen} onClose={handleClose} size={size}>
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>

        {/* Content */}
        <div className={`p-4 md:p-6 space-y-4 ${className}`}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {children}
        </div>

        {/* Footer */}
        {!hideFooter && (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            {footer ?? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {cancelLabel}
                </Button>
                <Button
                  type="submit"
                  variant={submitVariant}
                  loading={loading}
                  disabled={disabled}
                  className="w-full sm:w-auto"
                >
                  {submitLabel}
                </Button>
              </>
            )}
          </div>
        )}
      </form>
    </BaseModal>
  );
}

/**
 * Hook for managing FormModal state
 *
 * @example
 * const { isOpen, open, close, loading, setLoading } = useFormModal();
 *
 * <Button onClick={open}>Add Item</Button>
 * <FormModal isOpen={isOpen} onClose={close} loading={loading}>
 *   ...
 * </FormModal>
 */
export function useFormModal(initialOpen = false) {
  const [isOpen, setIsOpen] = React.useState(initialOpen);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const open = useCallback(() => {
    setError(null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    if (!loading) {
      setIsOpen(false);
      setError(null);
    }
  }, [loading]);

  const handleSubmit = useCallback(
    async (submitFn: () => Promise<void>, options?: { closeOnSuccess?: boolean }) => {
      const { closeOnSuccess = true } = options || {};
      setLoading(true);
      setError(null);
      try {
        await submitFn();
        if (closeOnSuccess) {
          close();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    },
    [close]
  );

  return {
    isOpen,
    open,
    close,
    loading,
    setLoading,
    error,
    setError,
    handleSubmit,
  };
}

export default FormModal;
