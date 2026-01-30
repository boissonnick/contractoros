/**
 * CSV Parser
 *
 * Parses CSV and Excel files, auto-detects delimiters,
 * and returns structured data for import processing.
 */

import { ParsedRow, ImportValidationError } from './types';

// Supported delimiters
const DELIMITERS = [',', ';', '\t', '|'];

// Parse options
export interface ParseOptions {
  hasHeader?: boolean;
  delimiter?: string;
  maxRows?: number;
  encoding?: string;
}

// Parse result
export interface ParseResult {
  headers: string[];
  rows: ParsedRow[];
  totalRows: number;
  delimiter: string;
  encoding: string;
  errors: ImportValidationError[];
}

/**
 * Detect the delimiter used in a CSV file
 */
export function detectDelimiter(content: string): string {
  const lines = content.split('\n').slice(0, 5); // Check first 5 lines

  const counts: Record<string, number[]> = {};

  for (const delimiter of DELIMITERS) {
    counts[delimiter] = lines.map(line => {
      // Count occurrences outside of quoted strings
      let count = 0;
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          count++;
        }
      }
      return count;
    });
  }

  // Find delimiter with most consistent non-zero count
  let bestDelimiter = ',';
  let bestScore = -1;

  for (const [delimiter, lineCounts] of Object.entries(counts)) {
    const nonZeroCounts = lineCounts.filter(c => c > 0);
    if (nonZeroCounts.length === 0) continue;

    // Calculate consistency (standard deviation should be low)
    const avg = nonZeroCounts.reduce((a, b) => a + b, 0) / nonZeroCounts.length;
    const variance = nonZeroCounts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / nonZeroCounts.length;
    const stdDev = Math.sqrt(variance);

    // Score = average count / (1 + stdDev) - higher is better
    const score = avg / (1 + stdDev);

    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

/**
 * Parse a CSV line respecting quoted fields
 */
export function parseCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Push last field
  fields.push(current.trim());

  return fields;
}

/**
 * Clean and normalize a header name
 */
export function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, '_'); // Replace spaces with underscores
}

/**
 * Parse CSV content into structured data
 */
export function parseCSV(content: string, options: ParseOptions = {}): ParseResult {
  const {
    hasHeader = true,
    delimiter: specifiedDelimiter,
    maxRows = Infinity,
  } = options;

  const errors: ImportValidationError[] = [];

  // Normalize line endings
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Detect delimiter
  const delimiter = specifiedDelimiter || detectDelimiter(normalizedContent);

  // Split into lines (handling quoted newlines is tricky, simplified here)
  const lines = normalizedContent.split('\n').filter(line => line.trim() !== '');

  if (lines.length === 0) {
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      delimiter,
      encoding: 'utf-8',
      errors: [{ row: 0, column: '', value: '', error: 'File is empty', severity: 'error' }],
    };
  }

  // Parse headers
  const headerLine = lines[0];
  const rawHeaders = parseCsvLine(headerLine, delimiter);
  const headers = rawHeaders.map(h => h.trim());

  // Check for duplicate headers
  const headerCounts = new Map<string, number>();
  headers.forEach((h, i) => {
    const normalized = normalizeHeader(h);
    const count = headerCounts.get(normalized) || 0;
    if (count > 0) {
      errors.push({
        row: 1,
        column: h,
        value: h,
        error: `Duplicate column header: "${h}"`,
        severity: 'warning',
      });
    }
    headerCounts.set(normalized, count + 1);
  });

  // Parse data rows
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const rows: ParsedRow[] = [];
  const rowLimit = Math.min(dataLines.length, maxRows);

  for (let i = 0; i < rowLimit; i++) {
    const line = dataLines[i];
    const rowNumber = hasHeader ? i + 2 : i + 1; // Account for header row in row number

    const values = parseCsvLine(line, delimiter);
    const rowErrors: ImportValidationError[] = [];

    // Check column count mismatch
    if (values.length !== headers.length) {
      rowErrors.push({
        row: rowNumber,
        column: '',
        value: '',
        error: `Column count mismatch: expected ${headers.length}, got ${values.length}`,
        severity: values.length < headers.length ? 'error' : 'warning',
      });
    }

    // Build row data object
    const data: Record<string, string> = {};
    headers.forEach((header, index) => {
      data[header] = values[index] ?? '';
    });

    rows.push({
      rowNumber,
      data,
      isValid: rowErrors.length === 0,
      errors: rowErrors,
    });

    errors.push(...rowErrors);
  }

  return {
    headers,
    rows,
    totalRows: dataLines.length,
    delimiter,
    encoding: 'utf-8',
    errors,
  };
}

/**
 * Read a file as text with encoding detection
 */
export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      resolve(content);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    // Try UTF-8 first
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Parse an uploaded file (CSV or Excel)
 */
export async function parseFile(file: File, options: ParseOptions = {}): Promise<ParseResult> {
  const extension = file.name.toLowerCase().split('.').pop();

  if (extension === 'csv' || extension === 'txt') {
    const content = await readFileAsText(file);
    return parseCSV(content, options);
  }

  if (extension === 'xlsx' || extension === 'xls') {
    // For Excel files, we'd need xlsx library
    // For now, return an error suggesting CSV
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      delimiter: ',',
      encoding: 'utf-8',
      errors: [{
        row: 0,
        column: '',
        value: file.name,
        error: 'Excel files (.xlsx, .xls) are not yet supported. Please export as CSV.',
        severity: 'error',
      }],
    };
  }

  return {
    headers: [],
    rows: [],
    totalRows: 0,
    delimiter: ',',
    encoding: 'utf-8',
    errors: [{
      row: 0,
      column: '',
      value: file.name,
      error: `Unsupported file type: .${extension}. Please use CSV files.`,
      severity: 'error',
    }],
  };
}

/**
 * Generate a sample CSV content for a given target
 */
export function generateSampleCSV(headers: string[]): string {
  return headers.join(',') + '\n' + headers.map(() => '').join(',');
}
