"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import {
  XMarkIcon,
  SunIcon,
  CloudIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

// Alert types representing different weather conditions
export type WeatherAlertType = 'heat' | 'cold' | 'rain' | 'storm' | 'wind' | 'snow' | 'flood';

// Severity levels for weather alerts
export type WeatherAlertSeverity = 'advisory' | 'watch' | 'warning' | 'emergency';

export interface WeatherAlertData {
  id: string;
  type: WeatherAlertType;
  severity: WeatherAlertSeverity;
  title: string;
  message: string;
  startTime?: Date;
  endTime?: Date;
  affectedProjects?: string[];
}

export interface WeatherAlertProps {
  alert: WeatherAlertData;
  onDismiss?: (alertId: string) => void;
  onViewDetails?: (alertId: string) => void;
  className?: string;
}

/**
 * Get the appropriate icon for each weather alert type
 */
const getAlertIcon = (type: WeatherAlertType): React.ReactNode => {
  const iconClass = 'h-5 w-5';

  switch (type) {
    case 'heat':
      return <SunIcon className={cn(iconClass, 'text-orange-600')} />;
    case 'cold':
      return (
        <svg className={cn(iconClass)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18l-3 3m3-3l3 3m-3 15l-3-3m3 3l3-3M3 12h18M3 12l3-3m-3 3l3 3m15-3l-3-3m3 3l-3 3" />
        </svg>
      );
    case 'rain':
      return (
        <svg className={cn(iconClass)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 16.5v2.25m3-2.25v2.25m3-2.25v2.25" />
        </svg>
      );
    case 'storm':
      return <BoltIcon className={cn(iconClass)} />;
    case 'wind':
      return (
        <svg className={cn(iconClass)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        </svg>
      );
    case 'snow':
      return (
        <svg className={cn(iconClass)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
          <circle cx="8" cy="18" r="1" fill="currentColor" />
          <circle cx="12" cy="19" r="1" fill="currentColor" />
          <circle cx="16" cy="18" r="1" fill="currentColor" />
        </svg>
      );
    case 'flood':
      return (
        <svg className={cn(iconClass)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 18.75c1.5-1.5 3-2.25 4.5-2.25s3 .75 4.5 2.25 3 2.25 4.5 2.25 3-.75 4.5-2.25" />
        </svg>
      );
    default:
      return <CloudIcon className={cn(iconClass)} />;
  }
};

/**
 * Get styling based on alert severity
 */
const getSeverityStyles = (severity: WeatherAlertSeverity) => {
  switch (severity) {
    case 'advisory':
      return {
        container: 'bg-blue-50 border-l-4 border-blue-500',
        icon: 'bg-blue-100 text-blue-600',
        title: 'text-blue-800',
        message: 'text-blue-700',
        badge: 'bg-blue-100 text-blue-700',
        dismissButton: 'text-blue-400 hover:text-blue-600',
        detailsLink: 'text-blue-600 hover:text-blue-800',
      };
    case 'watch':
      return {
        container: 'bg-yellow-50 border-l-4 border-yellow-500',
        icon: 'bg-yellow-100 text-yellow-600',
        title: 'text-yellow-800',
        message: 'text-yellow-700',
        badge: 'bg-yellow-100 text-yellow-700',
        dismissButton: 'text-yellow-400 hover:text-yellow-600',
        detailsLink: 'text-yellow-600 hover:text-yellow-800',
      };
    case 'warning':
      return {
        container: 'bg-orange-50 border-l-4 border-orange-500',
        icon: 'bg-orange-100 text-orange-600',
        title: 'text-orange-800',
        message: 'text-orange-700',
        badge: 'bg-orange-100 text-orange-700',
        dismissButton: 'text-orange-400 hover:text-orange-600',
        detailsLink: 'text-orange-600 hover:text-orange-800',
      };
    case 'emergency':
      return {
        container: 'bg-red-50 border-l-4 border-red-500',
        icon: 'bg-red-100 text-red-600',
        title: 'text-red-800',
        message: 'text-red-700',
        badge: 'bg-red-100 text-red-700',
        dismissButton: 'text-red-400 hover:text-red-600',
        detailsLink: 'text-red-600 hover:text-red-800',
      };
    default:
      return {
        container: 'bg-gray-50 border-l-4 border-gray-500',
        icon: 'bg-gray-100 text-gray-600',
        title: 'text-gray-800',
        message: 'text-gray-700',
        badge: 'bg-gray-100 text-gray-700',
        dismissButton: 'text-gray-400 hover:text-gray-600',
        detailsLink: 'text-gray-600 hover:text-gray-800',
      };
  }
};

/**
 * Get severity label for display
 */
const getSeverityLabel = (severity: WeatherAlertSeverity): string => {
  switch (severity) {
    case 'advisory':
      return 'Advisory';
    case 'watch':
      return 'Watch';
    case 'warning':
      return 'Warning';
    case 'emergency':
      return 'Emergency';
    default:
      return 'Alert';
  }
};

/**
 * Format date range for display
 */
const formatTimeRange = (startTime?: Date, endTime?: Date): string | null => {
  if (!startTime && !endTime) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (startTime && endTime) {
    return `${formatDate(startTime)} - ${formatDate(endTime)}`;
  }

  if (startTime) {
    return `Starting ${formatDate(startTime)}`;
  }

  if (endTime) {
    return `Until ${formatDate(endTime)}`;
  }

  return null;
};

/**
 * WeatherAlert Component
 *
 * Displays a weather alert banner with severity-based styling,
 * alert details, and action buttons.
 */
export default function WeatherAlert({
  alert,
  onDismiss,
  onViewDetails,
  className,
}: WeatherAlertProps) {
  const styles = getSeverityStyles(alert.severity);
  const timeRange = formatTimeRange(alert.startTime, alert.endTime);

  return (
    <div
      className={cn(
        'w-full rounded-lg p-4',
        styles.container,
        className
      )}
      role="alert"
      aria-live={alert.severity === 'emergency' ? 'assertive' : 'polite'}
    >
      {/* Desktop layout */}
      <div className="hidden sm:flex items-start gap-4">
        {/* Icon */}
        <div className={cn('p-2 rounded-lg flex-shrink-0', styles.icon)}>
          {getAlertIcon(alert.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={cn('font-semibold', styles.title)}>
              {alert.title}
            </h4>
            <span className={cn('px-2 py-0.5 rounded text-xs font-medium', styles.badge)}>
              {getSeverityLabel(alert.severity)}
            </span>
          </div>

          <p className={cn('text-sm mt-1', styles.message)}>
            {alert.message}
          </p>

          {/* Time range */}
          {timeRange && (
            <p className={cn('text-xs mt-1.5 opacity-80', styles.message)}>
              {timeRange}
            </p>
          )}

          {/* Affected projects */}
          {alert.affectedProjects && alert.affectedProjects.length > 0 && (
            <p className={cn('text-xs mt-1.5', styles.message)}>
              <span className="font-medium">
                {alert.affectedProjects.length} project{alert.affectedProjects.length > 1 ? 's' : ''} affected
              </span>
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(alert.id)}
              className={cn(
                'inline-flex items-center gap-1 text-sm font-medium',
                styles.detailsLink
              )}
            >
              View Details
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          )}
          {onDismiss && (
            <button
              onClick={() => onDismiss(alert.id)}
              className={cn('p-1 rounded-full hover:bg-white/50', styles.dismissButton)}
              aria-label="Dismiss alert"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile layout - stacked vertically */}
      <div className="sm:hidden">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn('p-2 rounded-lg flex-shrink-0', styles.icon)}>
            {getAlertIcon(alert.type)}
          </div>

          {/* Header with dismiss */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className={cn('font-semibold', styles.title)}>
                  {alert.title}
                </h4>
                <span className={cn('inline-block px-2 py-0.5 rounded text-xs font-medium mt-1', styles.badge)}>
                  {getSeverityLabel(alert.severity)}
                </span>
              </div>
              {onDismiss && (
                <button
                  onClick={() => onDismiss(alert.id)}
                  className={cn('p-1 rounded-full hover:bg-white/50 flex-shrink-0', styles.dismissButton)}
                  aria-label="Dismiss alert"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Message */}
        <p className={cn('text-sm mt-2', styles.message)}>
          {alert.message}
        </p>

        {/* Time range */}
        {timeRange && (
          <p className={cn('text-xs mt-1.5 opacity-80', styles.message)}>
            {timeRange}
          </p>
        )}

        {/* Affected projects */}
        {alert.affectedProjects && alert.affectedProjects.length > 0 && (
          <p className={cn('text-xs mt-1.5', styles.message)}>
            <span className="font-medium">
              {alert.affectedProjects.length} project{alert.affectedProjects.length > 1 ? 's' : ''} affected
            </span>
          </p>
        )}

        {/* View Details link */}
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(alert.id)}
            className={cn(
              'inline-flex items-center gap-1 text-sm font-medium mt-3',
              styles.detailsLink
            )}
          >
            View Details
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * WeatherAlertList Component
 *
 * Displays a list of weather alerts with optional dismissal tracking.
 */
export interface WeatherAlertListProps {
  alerts: WeatherAlertData[];
  onDismiss?: (alertId: string) => void;
  onViewDetails?: (alertId: string) => void;
  className?: string;
}

export function WeatherAlertList({
  alerts,
  onDismiss,
  onViewDetails,
  className,
}: WeatherAlertListProps) {
  if (alerts.length === 0) {
    return null;
  }

  // Sort alerts by severity (emergency first)
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder: Record<WeatherAlertSeverity, number> = {
      emergency: 0,
      warning: 1,
      watch: 2,
      advisory: 3,
    };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return (
    <div className={cn('space-y-3', className)}>
      {sortedAlerts.map((alert) => (
        <WeatherAlert
          key={alert.id}
          alert={alert}
          onDismiss={onDismiss}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}

/**
 * Compact WeatherAlertBadge for use in headers or cards
 */
export interface WeatherAlertBadgeProps {
  alertCount: number;
  highestSeverity: WeatherAlertSeverity;
  onClick?: () => void;
  className?: string;
}

export function WeatherAlertBadge({
  alertCount,
  highestSeverity,
  onClick,
  className,
}: WeatherAlertBadgeProps) {
  if (alertCount === 0) {
    return null;
  }

  const styles = getSeverityStyles(highestSeverity);

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors',
        styles.badge,
        onClick && 'cursor-pointer hover:opacity-80',
        !onClick && 'cursor-default',
        className
      )}
    >
      <ExclamationTriangleIcon className="h-3.5 w-3.5" />
      <span>
        {alertCount} Weather Alert{alertCount > 1 ? 's' : ''}
      </span>
    </button>
  );
}
