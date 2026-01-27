"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export const useToast = () => useContext(ToastContext);

let globalAddToast: ((toast: Omit<Toast, 'id'>) => void) | null = null;

// Imperative toast API for use outside React components
export const toast = {
  success: (title: string, message?: string) =>
    globalAddToast?.({ type: 'success', title, message }),
  error: (title: string, message?: string) =>
    globalAddToast?.({ type: 'error', title, message, duration: 6000 }),
  warning: (title: string, message?: string) =>
    globalAddToast?.({ type: 'warning', title, message }),
  info: (title: string, message?: string) =>
    globalAddToast?.({ type: 'info', title, message }),
};

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
  error: <XCircleIcon className="h-5 w-5 text-red-500" />,
  warning: <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />,
  info: <InformationCircleIcon className="h-5 w-5 text-blue-500" />,
};

const bgColors: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-amber-50 border-amber-200',
  info: 'bg-blue-50 border-blue-200',
};

const titleColors: Record<ToastType, string> = {
  success: 'text-green-800',
  error: 'text-red-800',
  warning: 'text-amber-800',
  info: 'text-blue-800',
};

const messageColors: Record<ToastType, string> = {
  success: 'text-green-700',
  error: 'text-red-700',
  warning: 'text-amber-700',
  info: 'text-blue-700',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Register global toast function
  useEffect(() => {
    globalAddToast = addToast;
    return () => { globalAddToast = null; };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const duration = toast.duration || 4000;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-sm w-full',
        'animate-slide-in-right',
        bgColors[toast.type]
      )}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', titleColors[toast.type])}>
          {toast.title}
        </p>
        {toast.message && (
          <p className={cn('text-sm mt-1', messageColors[toast.type])}>
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}
