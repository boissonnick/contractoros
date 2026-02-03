import {
  formatCurrency,
  formatCurrencyCompact,
  formatCurrencyFromCents,
  formatPercent,
  formatPercentNoSign,
  formatNumber,
  formatPhoneNumber,
  formatTaxRate,
  formatFileSize,
  formatCurrencySigned,
} from '@/lib/utils/formatters';

describe('formatCurrency', () => {
  it('formats positive numbers correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('formats negative numbers correctly', () => {
    expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('handles null', () => {
    expect(formatCurrency(null)).toBe('$0.00');
  });

  it('handles undefined', () => {
    expect(formatCurrency(undefined)).toBe('$0.00');
  });

  it('handles large numbers', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000.00');
  });

  it('handles small decimals (rounds to 2 decimal places)', () => {
    expect(formatCurrency(0.001)).toBe('$0.00');
    expect(formatCurrency(0.015)).toBe('$0.02');
    expect(formatCurrency(0.99)).toBe('$0.99');
  });

  it('works with different currency codes (EUR)', () => {
    // EUR symbol placement varies by locale, but en-US uses prefix
    expect(formatCurrency(1234.56, 'EUR')).toBe('\u20AC1,234.56');
  });

  it('handles very small positive numbers', () => {
    expect(formatCurrency(0.01)).toBe('$0.01');
  });

  it('handles numbers with many decimal places (truncates to 2)', () => {
    expect(formatCurrency(123.456789)).toBe('$123.46');
  });
});

describe('formatCurrencyCompact', () => {
  it('formats whole numbers without decimals', () => {
    expect(formatCurrencyCompact(100)).toBe('$100');
  });

  it('shows decimals when present', () => {
    // Note: minimumFractionDigits: 0 means trailing zeros are dropped
    expect(formatCurrencyCompact(100.5)).toBe('$100.5');
    expect(formatCurrencyCompact(100.05)).toBe('$100.05');
    expect(formatCurrencyCompact(100.55)).toBe('$100.55');
  });

  it('handles null', () => {
    expect(formatCurrencyCompact(null)).toBe('$0');
  });

  it('handles undefined', () => {
    expect(formatCurrencyCompact(undefined)).toBe('$0');
  });

  it('handles large whole numbers', () => {
    expect(formatCurrencyCompact(1000000)).toBe('$1,000,000');
  });

  it('handles negative numbers', () => {
    expect(formatCurrencyCompact(-50)).toBe('-$50');
    expect(formatCurrencyCompact(-50.25)).toBe('-$50.25');
  });

  it('works with different currency codes', () => {
    expect(formatCurrencyCompact(100, 'EUR')).toBe('\u20AC100');
  });
});

describe('formatCurrencyFromCents', () => {
  it('converts cents to dollars', () => {
    expect(formatCurrencyFromCents(1000)).toBe('$10.00');
  });

  it('handles fractional cents correctly', () => {
    expect(formatCurrencyFromCents(1050)).toBe('$10.50');
    expect(formatCurrencyFromCents(999)).toBe('$9.99');
  });

  it('handles null', () => {
    expect(formatCurrencyFromCents(null)).toBe('$0.00');
  });

  it('handles undefined', () => {
    expect(formatCurrencyFromCents(undefined)).toBe('$0.00');
  });

  it('handles zero cents', () => {
    expect(formatCurrencyFromCents(0)).toBe('$0.00');
  });

  it('handles negative cents', () => {
    expect(formatCurrencyFromCents(-500)).toBe('-$5.00');
  });

  it('handles large amounts', () => {
    expect(formatCurrencyFromCents(10000000)).toBe('$100,000.00');
  });

  it('works with different currency codes', () => {
    expect(formatCurrencyFromCents(1000, 'EUR')).toBe('\u20AC10.00');
  });
});

describe('formatPercent', () => {
  it('formats whole numbers', () => {
    expect(formatPercent(45)).toBe('45.0%');
  });

  it('formats decimals (rounds to 1 decimal by default)', () => {
    expect(formatPercent(45.123)).toBe('45.1%');
    expect(formatPercent(45.156)).toBe('45.2%');
  });

  it('handles negative percentages', () => {
    expect(formatPercent(-10)).toBe('-10.0%');
    expect(formatPercent(-10.5)).toBe('-10.5%');
  });

  it('handles zero', () => {
    expect(formatPercent(0)).toBe('0.0%');
  });

  it('handles null', () => {
    expect(formatPercent(null)).toBe('0%');
  });

  it('handles undefined', () => {
    expect(formatPercent(undefined)).toBe('0%');
  });

  it('respects decimal places parameter', () => {
    expect(formatPercent(45.123, 2)).toBe('45.12%');
    expect(formatPercent(45.126, 2)).toBe('45.13%');
    expect(formatPercent(45, 0)).toBe('45%');
    expect(formatPercent(45.5, 3)).toBe('45.500%');
  });

  it('handles very small percentages', () => {
    expect(formatPercent(0.001, 3)).toBe('0.001%');
  });

  it('handles percentages over 100', () => {
    expect(formatPercent(150)).toBe('150.0%');
  });
});

describe('formatPercentNoSign', () => {
  it('returns number without % sign', () => {
    expect(formatPercentNoSign(45)).toBe('45.0');
    expect(formatPercentNoSign(45.5)).toBe('45.5');
  });

  it('handles null', () => {
    expect(formatPercentNoSign(null)).toBe('0');
  });

  it('handles undefined', () => {
    expect(formatPercentNoSign(undefined)).toBe('0');
  });

  it('respects decimal places parameter', () => {
    expect(formatPercentNoSign(45.123, 2)).toBe('45.12');
    expect(formatPercentNoSign(45, 0)).toBe('45');
  });

  it('handles negative numbers', () => {
    expect(formatPercentNoSign(-10.5)).toBe('-10.5');
  });
});

describe('formatNumber', () => {
  it('formats with thousands separators', () => {
    expect(formatNumber(1234)).toBe('1,234');
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('respects decimal places parameter', () => {
    expect(formatNumber(1234.567, 2)).toBe('1,234.57');
    expect(formatNumber(1234, 2)).toBe('1,234.00');
    expect(formatNumber(1234.1, 3)).toBe('1,234.100');
  });

  it('handles null', () => {
    expect(formatNumber(null)).toBe('0');
  });

  it('handles undefined', () => {
    expect(formatNumber(undefined)).toBe('0');
  });

  it('handles negative numbers', () => {
    expect(formatNumber(-1234)).toBe('-1,234');
    expect(formatNumber(-1234.56, 2)).toBe('-1,234.56');
  });

  it('handles small numbers', () => {
    expect(formatNumber(5)).toBe('5');
    expect(formatNumber(0.5, 1)).toBe('0.5');
  });
});

describe('formatPhoneNumber', () => {
  it('formats 10-digit numbers', () => {
    expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
  });

  it('formats 11-digit numbers with leading 1', () => {
    expect(formatPhoneNumber('15551234567')).toBe('+1 (555) 123-4567');
  });

  it('handles numbers with existing formatting (strips and reformats)', () => {
    expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567');
    expect(formatPhoneNumber('555-123-4567')).toBe('(555) 123-4567');
    expect(formatPhoneNumber('555.123.4567')).toBe('(555) 123-4567');
    expect(formatPhoneNumber('+1 555 123 4567')).toBe('+1 (555) 123-4567');
  });

  it('returns original if not 10/11 digits', () => {
    expect(formatPhoneNumber('12345')).toBe('12345');
    expect(formatPhoneNumber('123456789012')).toBe('123456789012');
  });

  it('handles empty string', () => {
    expect(formatPhoneNumber('')).toBe('');
  });

  it('handles null', () => {
    expect(formatPhoneNumber(null)).toBe('');
  });

  it('handles undefined', () => {
    expect(formatPhoneNumber(undefined)).toBe('');
  });

  it('handles 11 digits not starting with 1', () => {
    expect(formatPhoneNumber('25551234567')).toBe('25551234567');
  });
});

describe('formatTaxRate', () => {
  it('formats rate with 2 decimals', () => {
    expect(formatTaxRate(8.25)).toBe('8.25%');
    expect(formatTaxRate(10)).toBe('10.00%');
  });

  it('handles null', () => {
    expect(formatTaxRate(null)).toBe('0%');
  });

  it('handles undefined', () => {
    expect(formatTaxRate(undefined)).toBe('0%');
  });

  it('handles zero', () => {
    expect(formatTaxRate(0)).toBe('0.00%');
  });

  it('handles rates with many decimal places (rounds to 2)', () => {
    expect(formatTaxRate(8.255)).toBe('8.26%');
    expect(formatTaxRate(8.254)).toBe('8.25%');
  });

  it('handles high tax rates', () => {
    expect(formatTaxRate(25.5)).toBe('25.50%');
  });
});

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(1)).toBe('1 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(1572864)).toBe('1.5 MB');
  });

  it('formats gigabytes', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB');
    expect(formatFileSize(1610612736)).toBe('1.5 GB');
  });

  it('formats terabytes', () => {
    expect(formatFileSize(1099511627776)).toBe('1 TB');
  });

  it('handles 0', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('handles null', () => {
    expect(formatFileSize(null)).toBe('0 B');
  });

  it('handles undefined', () => {
    expect(formatFileSize(undefined)).toBe('0 B');
  });

  it('formats with appropriate precision', () => {
    expect(formatFileSize(1500)).toBe('1.46 KB');
    expect(formatFileSize(2048)).toBe('2 KB');
  });
});

describe('formatCurrencySigned', () => {
  it('shows + for positive', () => {
    expect(formatCurrencySigned(100)).toBe('+$100.00');
    expect(formatCurrencySigned(1234.56)).toBe('+$1,234.56');
  });

  it('shows - for negative', () => {
    expect(formatCurrencySigned(-100)).toBe('-$100.00');
    expect(formatCurrencySigned(-500.5)).toBe('-$500.50');
  });

  it('handles zero', () => {
    // Zero with signDisplay: 'always' typically shows +$0.00
    expect(formatCurrencySigned(0)).toBe('+$0.00');
  });

  it('handles null', () => {
    expect(formatCurrencySigned(null)).toBe('$0.00');
  });

  it('handles undefined', () => {
    expect(formatCurrencySigned(undefined)).toBe('$0.00');
  });

  it('works with different currency codes', () => {
    expect(formatCurrencySigned(100, 'EUR')).toBe('+\u20AC100.00');
    expect(formatCurrencySigned(-100, 'EUR')).toBe('-\u20AC100.00');
  });

  it('handles large positive numbers', () => {
    expect(formatCurrencySigned(1000000)).toBe('+$1,000,000.00');
  });

  it('handles large negative numbers', () => {
    expect(formatCurrencySigned(-1000000)).toBe('-$1,000,000.00');
  });
});
