/**
 * Import Validators
 *
 * Validation functions for each data type supported in imports.
 */

import {
  ColumnMapping,
  ParsedRow,
  ImportValidationError,
  ColumnDataType,
} from './types';

// Phone number regex (flexible)
const PHONE_REGEX = /^[\d\s\-\(\)\+\.]+$/;

// Email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Date formats to try parsing
const DATE_FORMATS = [
  /^\d{4}-\d{2}-\d{2}$/,                    // 2026-01-15
  /^\d{2}\/\d{2}\/\d{4}$/,                  // 01/15/2026
  /^\d{2}-\d{2}-\d{4}$/,                    // 01-15-2026
  /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,            // 1/15/26 or 1/15/2026
  /^[A-Za-z]+ \d{1,2}, \d{4}$/,             // January 15, 2026
  /^\d{1,2} [A-Za-z]+ \d{4}$/,              // 15 January 2026
];

/**
 * Validate a string value
 */
export function validateString(value: string, required: boolean): string | null {
  if (required && !value.trim()) {
    return 'Value is required';
  }
  return null;
}

/**
 * Validate an email address
 */
export function validateEmail(value: string, required: boolean): string | null {
  if (!value.trim()) {
    return required ? 'Email is required' : null;
  }

  if (!EMAIL_REGEX.test(value.trim())) {
    return 'Invalid email format';
  }

  return null;
}

/**
 * Validate a phone number
 */
export function validatePhone(value: string, required: boolean): string | null {
  if (!value.trim()) {
    return required ? 'Phone number is required' : null;
  }

  // Remove common formatting
  const cleaned = value.replace(/[\s\-\(\)\+\.]/g, '');

  if (!cleaned.match(/^\d{7,15}$/)) {
    return 'Invalid phone number format';
  }

  return null;
}

/**
 * Validate a date value
 */
export function validateDate(value: string, required: boolean): string | null {
  if (!value.trim()) {
    return required ? 'Date is required' : null;
  }

  // Try parsing with Date constructor
  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) {
    return null;
  }

  // Check against known formats
  const matchesFormat = DATE_FORMATS.some(regex => regex.test(value.trim()));
  if (matchesFormat) {
    return null;
  }

  return 'Invalid date format. Use YYYY-MM-DD, MM/DD/YYYY, or similar';
}

/**
 * Validate a number value
 */
export function validateNumber(value: string, required: boolean): string | null {
  if (!value.trim()) {
    return required ? 'Number is required' : null;
  }

  const cleaned = value.replace(/[,$\s]/g, '');
  const num = parseFloat(cleaned);

  if (isNaN(num)) {
    return 'Invalid number format';
  }

  return null;
}

/**
 * Validate a currency value
 */
export function validateCurrency(value: string, required: boolean): string | null {
  if (!value.trim()) {
    return required ? 'Amount is required' : null;
  }

  // Remove currency symbols and formatting
  const cleaned = value.replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);

  if (isNaN(num)) {
    return 'Invalid currency format';
  }

  if (num < 0) {
    return 'Currency value cannot be negative';
  }

  return null;
}

/**
 * Validate a boolean value
 */
export function validateBoolean(value: string, required: boolean): string | null {
  if (!value.trim()) {
    return required ? 'Value is required' : null;
  }

  const normalized = value.toLowerCase().trim();
  const validValues = ['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'];

  if (!validValues.includes(normalized)) {
    return 'Invalid boolean value. Use true/false, yes/no, or 1/0';
  }

  return null;
}

/**
 * Validate an enum value
 */
export function validateEnum(
  value: string,
  required: boolean,
  enumValues: string[] = []
): string | null {
  if (!value.trim()) {
    return required ? 'Value is required' : null;
  }

  const normalized = value.toLowerCase().trim();
  const normalizedEnum = enumValues.map(v => v.toLowerCase());

  if (!normalizedEnum.includes(normalized)) {
    return `Invalid value. Must be one of: ${enumValues.join(', ')}`;
  }

  return null;
}

/**
 * Validate a single value based on column mapping
 */
export function validateValue(
  value: string,
  mapping: ColumnMapping
): string | null {
  const { dataType, required, enumValues } = mapping;

  switch (dataType) {
    case 'string':
      return validateString(value, required);
    case 'email':
      return validateEmail(value, required);
    case 'phone':
      return validatePhone(value, required);
    case 'date':
      return validateDate(value, required);
    case 'number':
      return validateNumber(value, required);
    case 'currency':
      return validateCurrency(value, required);
    case 'boolean':
      return validateBoolean(value, required);
    case 'enum':
      return validateEnum(value, required, enumValues);
    default:
      return null;
  }
}

/**
 * Validate all rows against column mappings
 */
export function validateRows(
  rows: ParsedRow[],
  mappings: ColumnMapping[]
): { validRows: ParsedRow[]; errors: ImportValidationError[] } {
  const allErrors: ImportValidationError[] = [];
  const validatedRows: ParsedRow[] = [];

  for (const row of rows) {
    const rowErrors: ImportValidationError[] = [...row.errors];

    for (const mapping of mappings) {
      if (!mapping.targetField) continue; // Skip unmapped columns

      const value = row.data[mapping.sourceColumn] ?? '';
      const error = validateValue(value, mapping);

      if (error) {
        rowErrors.push({
          row: row.rowNumber,
          column: mapping.sourceColumn,
          value,
          error,
          severity: mapping.required ? 'error' : 'warning',
        });
      }
    }

    validatedRows.push({
      ...row,
      errors: rowErrors,
      isValid: rowErrors.filter(e => e.severity === 'error').length === 0,
    });

    allErrors.push(...rowErrors);
  }

  return { validRows: validatedRows, errors: allErrors };
}

/**
 * Transform a value based on column transform setting
 */
export function transformValue(value: string, transform?: string): string {
  if (!value || !transform || transform === 'none') {
    return value;
  }

  switch (transform) {
    case 'uppercase':
      return value.toUpperCase();
    case 'lowercase':
      return value.toLowerCase();
    case 'trim':
      return value.trim();
    case 'phone_format':
      // Format as (XXX) XXX-XXXX
      const digits = value.replace(/\D/g, '');
      if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
      if (digits.length === 11 && digits[0] === '1') {
        return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
      }
      return value;
    case 'date_format':
      // Parse and format as ISO date
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      return value;
    case 'currency_format':
      // Parse and format as number
      const cleaned = value.replace(/[$,\s]/g, '');
      const num = parseFloat(cleaned);
      if (!isNaN(num)) {
        return num.toFixed(2);
      }
      return value;
    default:
      return value;
  }
}

/**
 * Parse boolean value to actual boolean
 */
export function parseBoolean(value: string): boolean {
  const normalized = value.toLowerCase().trim();
  return ['true', 'yes', '1', 'y'].includes(normalized);
}

/**
 * Parse date value to Date object
 */
export function parseDate(value: string): Date | null {
  if (!value.trim()) return null;

  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date;
  }

  return null;
}

/**
 * Parse currency value to number
 */
export function parseCurrency(value: string): number | null {
  if (!value.trim()) return null;

  const cleaned = value.replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);

  return isNaN(num) ? null : num;
}

/**
 * Check for duplicate values in a specific column
 */
export function findDuplicates(
  rows: ParsedRow[],
  columnName: string
): { value: string; rowNumbers: number[] }[] {
  const valueMap = new Map<string, number[]>();

  for (const row of rows) {
    const value = row.data[columnName]?.toLowerCase().trim();
    if (!value) continue;

    const existing = valueMap.get(value) || [];
    existing.push(row.rowNumber);
    valueMap.set(value, existing);
  }

  return Array.from(valueMap.entries())
    .filter(([, rowNumbers]) => rowNumbers.length > 1)
    .map(([value, rowNumbers]) => ({ value, rowNumbers }));
}
