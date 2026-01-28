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
