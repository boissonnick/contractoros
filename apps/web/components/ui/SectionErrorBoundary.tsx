"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface SectionErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  /** Label for the section (shown in error message) */
  sectionName?: string;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Lightweight error boundary for wrapping page sections.
 *
 * Unlike the global ErrorBoundary (which shows a full-page error),
 * this renders a compact inline error with a retry button.
 * Use it to isolate sections so one failing widget doesn't crash the whole page.
 *
 * @example
 * <SectionErrorBoundary sectionName="Weather Widget">
 *   <WeatherWidget />
 * </SectionErrorBoundary>
 */
export class SectionErrorBoundary extends Component<SectionErrorBoundaryProps, SectionErrorBoundaryState> {
  public state: SectionErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `SectionErrorBoundary [${this.props.sectionName || 'unknown'}]:`,
      error,
      errorInfo
    );
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-red-800">
                {this.props.sectionName
                  ? `Error loading ${this.props.sectionName}`
                  : 'Something went wrong'}
              </h3>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <p className="text-xs text-red-600 mt-1 truncate">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 rounded-md transition-colors"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SectionErrorBoundary;
