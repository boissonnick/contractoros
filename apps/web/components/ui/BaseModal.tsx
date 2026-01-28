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
          <div className="flex min-h-full items-start justify-center p-4 pt-[10vh] text-center">
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
                        className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="max-h-[60vh] overflow-y-auto p-4">
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
 * @example
 * ```tsx
 * function EditModal({ onClose }) {
 *   const { isDirty, setDirty, confirmClose } = useModalDirtyState();
 *
 *   const handleClose = () => {
 *     if (confirmClose()) {
 *       onClose();
 *     }
 *   };
 *
 *   return (
 *     <BaseModal onClose={handleClose} preventOutsideClose={isDirty}>
 *       <Form onChange={() => setDirty(true)} />
 *     </BaseModal>
 *   );
 * }
 * ```
 */
export function useModalDirtyState() {
  const [isDirty, setIsDirty] = React.useState(false);

  const setDirty = React.useCallback((dirty: boolean = true) => {
    setIsDirty(dirty);
  }, []);

  const confirmClose = React.useCallback(() => {
    if (isDirty) {
      return window.confirm('You have unsaved changes. Are you sure you want to close?');
    }
    return true;
  }, [isDirty]);

  const reset = React.useCallback(() => {
    setIsDirty(false);
  }, []);

  return { isDirty, setDirty, confirmClose, reset };
}
