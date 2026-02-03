/**
 * Centralized formatting utilities for ContractorOS
 *
 * Use these functions throughout the app for consistent formatting.
 * Import from '@/lib/utils/formatters' or '@/lib/utils'
 */

/**
 * Format a number as currency
 * @param amount - The amount to format (can be null/undefined)
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency string (e.g., '$1,234.56')
 */
export function formatCurrency(amount: number | null | undefined, currency = 'USD'): string {
  if (amount == null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format currency with flexible decimal places (0-2)
 * Uses minimumFractionDigits: 0 so $100 shows as "$100" not "$100.00"
 * @param amount - The amount to format (can be null/undefined)
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency string (e.g., '$1,234' or '$1,234.50')
 */
export function formatCurrencyCompact(amount: number | null | undefined, currency = 'USD'): string {
  if (amount == null) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format currency from cents (for payment processing)
 * @param cents - Amount in cents
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency string
 */
export function formatCurrencyFromCents(cents: number | null | undefined, currency = 'USD'): string {
  if (cents == null) return '$0.00';
  return formatCurrency(cents / 100, currency);
}

/**
 * Format a percentage
 * @param value - The percentage value (can be null/undefined)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., '45.5%')
 */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null) return '0%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a percentage without the percent sign
 * @param value - The percentage value (can be null/undefined)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted number string without % sign
 */
export function formatPercentNoSign(value: number | null | undefined, decimals = 1): string {
  if (value == null) return '0';
  return value.toFixed(decimals);
}

/**
 * Format a number with thousands separators
 * @param value - The number to format (can be null/undefined)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string (e.g., '1,234')
 */
export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value == null) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a phone number as (XXX) XXX-XXXX
 * @param phone - The phone number string
 * @returns Formatted phone number or original if not 10 digits
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Format a tax rate for display
 * @param rate - The tax rate (e.g., 8.25 for 8.25%)
 * @returns Formatted rate string (e.g., '8.25%')
 */
export function formatTaxRate(rate: number | null | undefined): string {
  if (rate == null) return '0%';
  return `${rate.toFixed(2)}%`;
}

/**
 * Format file size in bytes to human-readable format
 * @param bytes - Size in bytes
 * @returns Formatted size string (e.g., '1.5 MB')
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

/**
 * Format currency with +/- sign always displayed
 * Useful for showing change amounts (e.g., change orders)
 * @param amount - The amount to format
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency with sign (e.g., '+$1,234.00' or '-$500.00')
 */
export function formatCurrencySigned(amount: number | null | undefined, currency = 'USD'): string {
  if (amount == null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    signDisplay: 'always',
  }).format(amount);
}
