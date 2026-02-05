"use client";

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface BaseModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Modal title displayed in the header */
  title?: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Size of the modal */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Modal content */
  children: React.ReactNode;
  /** Footer content (usually action buttons) */
  footer?: React.ReactNode;
  /** Whether to show the close button in the header */
  showCloseButton?: boolean;
  /** Additional class for the modal panel */
  className?: string;
  /** Whether to prevent closing when clicking outside */
  preventOutsideClose?: boolean;
  /** Custom header content (replaces title/subtitle) */
  header?: React.ReactNode;
}

const sizeClasses: Record<NonNullable<BaseModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[90vw]',
};

/**
 * BaseModal - A reusable modal component built on Headless UI
 *
 * Features:
 * - Accessible (keyboard navigation, focus trap, aria attributes)
 * - Smooth enter/leave transitions
 * - Configurable sizes
 * - Header with title, subtitle, and close button
 * - Scrollable content area
 * - Optional footer for action buttons
 *
 * @example
 * ```tsx
 * <BaseModal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Edit Task"
 *   subtitle="Update task details"
 *   size="lg"
 *   footer={
 *     <div className="flex justify-end gap-2">
 *       <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
 *       <Button onClick={handleSave}>Save</Button>
 *     </div>
 *   }
 * >
 *   <TaskForm />
 * </BaseModal>
 * ```
 */
export default function BaseModal({
  open,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
  footer,
  showCloseButton = true,
  className,
  preventOutsideClose = false,
  header,
}: BaseModalProps) {
  const handleClose = () => {
    if (!preventOutsideClose) {
      onClose();
    }
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        {/* Modal container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-2 pt-4 sm:p-4 sm:pt-[10vh] text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel
                className={cn(
                  'w-full transform overflow-hidden rounded-xl bg-white text-left align-middle shadow-xl transition-all',
                  sizeClasses[size],
                  className
                )}
              >
                {/* Header */}
                {(title || header || showCloseButton) && (
                  <div className="flex items-start justify-between p-4 border-b border-gray-100">
                    {header ? (
                      <div className="flex-1 min-w-0">{header}</div>
                    ) : title ? (
                      <div className="flex-1 min-w-0">
                        <Dialog.Title
                          as="h3"
                          className="text-lg font-semibold text-gray-900"
                        >
                          {title}
                        </Dialog.Title>
                        {subtitle && (
                          <p className="mt-1 text-sm text-gray-500">
                            {subtitle}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1" />
                    )}
                    {showCloseButton && (
                      <button
                        type="button"
                        onClick={onClose}
                        className="ml-4 flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 -m-2"
                        aria-label="Close modal"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="max-h-[70vh] sm:max-h-[60vh] overflow-y-auto p-4">
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                    {footer}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

/**
 * Hook for managing modal state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isOpen, open, close } = useModal();
 *
 *   return (
 *     <>
 *       <Button onClick={open}>Open Modal</Button>
 *       <BaseModal open={isOpen} onClose={close} title="My Modal">
 *         <p>Content</p>
 *       </BaseModal>
 *     </>
 *   );
 * }
 * ```
 */
export function useModal(defaultOpen = false) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle, setIsOpen };
}

/**
 * Hook for managing modal dirty state (unsaved changes)
 *
 * Features:
 * - Track unsaved changes
 * - Confirm before closing with unsaved changes
 * - Optional custom confirmation message
 * - Works with React Hook Form via onDirtyChange callback
 * - Prevents accidental data loss
 *
 * @example
 * ```tsx
 * function EditModal({ onClose }) {
 *   const { isDirty, setDirty, confirmClose, handleClose } = useModalDirtyState({
 *     onClose,
 *     message: 'Discard changes to this task?',
 *   });
 *
 *   return (
 *     <BaseModal onClose={handleClose} preventOutsideClose={isDirty}>
 *       <Form onChange={() => setDirty(true)} />
 *     </BaseModal>
 *   );
 * }
 * ```
 *
 * @example With React Hook Form
 * ```tsx
 * function EditModal({ onClose }) {
 *   const { isDirty, handleClose, getFormProps } = useModalDirtyState({ onClose });
 *   const form = useForm();
 *
 *   // Pass form.formState.isDirty to track changes
 *   React.useEffect(() => {
 *     getFormProps().onDirtyChange(form.formState.isDirty);
 *   }, [form.formState.isDirty]);
 *
 *   return (
 *     <BaseModal onClose={handleClose} preventOutsideClose={isDirty}>
 *       <form {...form}>...</form>
 *     </BaseModal>
 *   );
 * }
 * ```
 */
export interface UseModalDirtyStateOptions {
  /** Callback when modal should close (after confirmation if dirty) */
  onClose?: () => void;
  /** Custom confirmation message */
  message?: string;
  /** Initial dirty state */
  initialDirty?: boolean;
}

export function useModalDirtyState(options: UseModalDirtyStateOptions = {}) {
  const {
    onClose,
    message = 'You have unsaved changes. Are you sure you want to close?',
    initialDirty = false,
  } = options;

  const [isDirty, setIsDirty] = React.useState(initialDirty);

  const setDirty = React.useCallback((dirty: boolean = true) => {
    setIsDirty(dirty);
  }, []);

  const confirmClose = React.useCallback((): boolean => {
    if (isDirty) {
      return window.confirm(message);
    }
    return true;
  }, [isDirty, message]);

  const handleClose = React.useCallback(() => {
    if (confirmClose()) {
      setIsDirty(false);
      onClose?.();
    }
  }, [confirmClose, onClose]);

  const reset = React.useCallback(() => {
    setIsDirty(false);
  }, []);

  // Helper for React Hook Form integration
  const getFormProps = React.useCallback(() => ({
    onDirtyChange: setDirty,
  }), [setDirty]);

  // Helper to wrap form submit - resets dirty state on successful submit
  const wrapSubmit = React.useCallback(
    <T extends (...args: unknown[]) => Promise<void>>(submitFn: T): T => {
      return (async (...args: unknown[]) => {
        await submitFn(...args);
        setIsDirty(false);
      }) as T;
    },
    []
  );

  return {
    isDirty,
    setDirty,
    confirmClose,
    handleClose,
    reset,
    getFormProps,
    wrapSubmit,
  };
}

/**
 * BaseModalWithDirtyState - A modal that automatically tracks dirty state
 *
 * Use this when you want built-in unsaved changes protection.
 * The modal will prompt users before closing if there are unsaved changes.
 *
 * @example
 * ```tsx
 * <BaseModalWithDirtyState
 *   open={isOpen}
 *   onClose={handleClose}
 *   title="Edit Task"
 *   isDirty={formState.isDirty}
 *   confirmMessage="Discard changes to this task?"
 * >
 *   <TaskForm />
 * </BaseModalWithDirtyState>
 * ```
 */
export interface BaseModalWithDirtyStateProps extends Omit<BaseModalProps, 'preventOutsideClose'> {
  /** Whether the form has unsaved changes */
  isDirty?: boolean;
  /** Custom confirmation message when closing with unsaved changes */
  confirmMessage?: string;
}

export function BaseModalWithDirtyState({
  open,
  onClose,
  isDirty = false,
  confirmMessage = 'You have unsaved changes. Are you sure you want to close?',
  ...props
}: BaseModalWithDirtyStateProps) {
  const handleClose = React.useCallback(() => {
    if (isDirty) {
      if (window.confirm(confirmMessage)) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [isDirty, confirmMessage, onClose]);

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      preventOutsideClose={isDirty}
      {...props}
    />
  );
}
