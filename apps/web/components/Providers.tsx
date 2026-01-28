"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { ToastProvider, Toaster } from '@/components/ui/Toast';
import ErrorBoundary from '@/components/ErrorBoundary';

// Create a client with sensible defaults for construction app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data doesn't change that fast in construction
      gcTime: 1000 * 60 * 30, // 30 minutes cache
      retry: 2,
      refetchOnWindowFocus: false, // Avoid unnecessary refetches
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </AuthProvider>
          <Toaster />
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
