"use client";

import React from 'react';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider, Toaster } from '@/components/ui/Toast';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </ToastProvider>
    </ErrorBoundary>
  );
}
