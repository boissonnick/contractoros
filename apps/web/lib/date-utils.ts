
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

/**
 * Format the distance from now to a given date (e.g., "2 hours ago", "in 3 days")
 * Similar to formatRelative but also handles future dates
 */
export function formatDistanceToNow(dateValue: any): string {
  const date = toDate(dateValue);
  if (!date) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const isPast = diffMs > 0;
  const absDiffMs = Math.abs(diffMs);

  const absDiffSecs = Math.floor(absDiffMs / 1000);
  const absDiffMins = Math.floor(absDiffSecs / 60);
  const absDiffHours = Math.floor(absDiffMins / 60);
  const absDiffDays = Math.floor(absDiffHours / 24);

  // Less than a minute
  if (absDiffSecs < 60) {
    return 'just now';
  }

  // Less than an hour
  if (absDiffMins < 60) {
    const unit = absDiffMins === 1 ? 'minute' : 'minutes';
    return isPast ? `${absDiffMins} ${unit} ago` : `in ${absDiffMins} ${unit}`;
  }

  // Less than 24 hours
  if (absDiffHours < 24) {
    const unit = absDiffHours === 1 ? 'hour' : 'hours';
    return isPast ? `${absDiffHours} ${unit} ago` : `in ${absDiffHours} ${unit}`;
  }

  // Less than 7 days
  if (absDiffDays < 7) {
    const unit = absDiffDays === 1 ? 'day' : 'days';
    return isPast ? `${absDiffDays} ${unit} ago` : `in ${absDiffDays} ${unit}`;
  }

  // More than a week - show date
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Re-export formatCurrency from centralized formatters for backwards compatibility
export { formatCurrency } from './utils/formatters';
