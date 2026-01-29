/**
 * Phone Number Utility Functions
 *
 * Client-safe utility functions for phone number formatting and validation.
 * These can be safely imported in client components.
 */

/**
 * Validate a phone number is in E.164 format
 */
export function isValidE164(phoneNumber: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Format a US phone number to E.164 format
 * Assumes US (+1) if no country code
 */
export function formatToE164(phoneNumber: string): string {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');

  // If already has country code
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // Assume US number
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // Return as-is if it doesn't match expected formats
  return phoneNumber;
}

/**
 * Format E.164 phone number for display
 * +1XXXXXXXXXX -> (XXX) XXX-XXXX
 */
export function formatPhoneForDisplay(phoneNumber: string): string {
  if (!phoneNumber) return '';

  // Remove non-digits
  const digits = phoneNumber.replace(/\D/g, '');

  // Format US number
  if (digits.length === 11 && digits.startsWith('1')) {
    const area = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    const line = digits.slice(7);
    return `(${area}) ${prefix}-${line}`;
  }

  if (digits.length === 10) {
    const area = digits.slice(0, 3);
    const prefix = digits.slice(3, 6);
    const line = digits.slice(6);
    return `(${area}) ${prefix}-${line}`;
  }

  // Return as-is for other formats
  return phoneNumber;
}
