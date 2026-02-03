import { Timestamp } from 'firebase/firestore';

export function toDate(dateValue: any): Date | null {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  if (dateValue?.toDate) return dateValue.toDate();
  if (typeof dateValue === 'number') return new Date(dateValue);
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  if (dateValue?.seconds) return new Date(dateValue.seconds * 1000);
  return null;
}

export function formatDate(dateValue: any, options?: Intl.DateTimeFormatOptions): string {
  const date = toDate(dateValue);
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', options || { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(dateValue: any): string {
  const date = toDate(dateValue);
  if (!date) return 'N/A';
  return date.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}

/**
 * Format a date relative to now (e.g., "2 hours ago", "Yesterday", "Dec 5")
 */
export function formatRelative(dateValue: any): string {
  const date = toDate(dateValue);
  if (!date) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Less than a minute
  if (diffSecs < 60) {
    return 'Just now';
  }

  // Less than an hour
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }

  // Less than 24 hours
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  // Within this week (less than 7 days)
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  // Same year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Different year
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Re-export formatCurrency from centralized formatters for backwards compatibility
export { formatCurrency } from './utils/formatters';
