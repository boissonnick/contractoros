import {
  ENTITY_TYPE_LABELS,
  calculateTaxAmount,
  calculateTaxFromConfig,
  calculateEffectiveTaxRate,
  formatTaxSummary,
  getTaxBreakdown,
  calculateTotalWithTax,
  extractSubtotalFromTotal,
  isValidTaxRate,
  getEntityTaxLabel,
} from '@/lib/utils/tax-calculator';

// Helper to create a TaxConfig object for tests
function makeTaxConfig(overrides: Partial<{
  entityType: 'sole_proprietor' | 'llc' | 'partnership' | 's_corp' | 'c_corp';
  federalTaxRate: number;
  stateTaxRate: number;
  localTaxRate: number;
  state: string;
  ein: string;
}> = {}) {
  return {
    entityType: 'llc' as const,
    federalTaxRate: 0,
    stateTaxRate: 0,
    localTaxRate: 0,
    ...overrides,
  };
}

describe('ENTITY_TYPE_LABELS', () => {
  it('has all 5 entity types', () => {
    expect(Object.keys(ENTITY_TYPE_LABELS)).toHaveLength(5);
  });

  it('maps sole_proprietor correctly', () => {
    expect(ENTITY_TYPE_LABELS.sole_proprietor).toBe('Sole Proprietor');
  });

  it('maps llc correctly', () => {
    expect(ENTITY_TYPE_LABELS.llc).toBe('LLC');
  });

  it('maps partnership correctly', () => {
    expect(ENTITY_TYPE_LABELS.partnership).toBe('Partnership');
  });

  it('maps s_corp correctly', () => {
    expect(ENTITY_TYPE_LABELS.s_corp).toBe('S Corporation');
  });

  it('maps c_corp correctly', () => {
    expect(ENTITY_TYPE_LABELS.c_corp).toBe('C Corporation');
  });
});

describe('calculateTaxAmount', () => {
  it('returns 0 for zero amount', () => {
    expect(calculateTaxAmount(0, 8.25)).toBe(0);
  });

  it('returns 0 for zero tax rate', () => {
    expect(calculateTaxAmount(1000, 0)).toBe(0);
  });

  it('returns 0 for negative amount', () => {
    expect(calculateTaxAmount(-100, 8.25)).toBe(0);
  });

  it('returns 0 for negative tax rate', () => {
    expect(calculateTaxAmount(1000, -5)).toBe(0);
  });

  it('returns 0 when both amount and rate are zero', () => {
    expect(calculateTaxAmount(0, 0)).toBe(0);
  });

  it('returns 0 when both amount and rate are negative', () => {
    expect(calculateTaxAmount(-100, -5)).toBe(0);
  });

  it('calculates tax correctly for normal values', () => {
    expect(calculateTaxAmount(1000, 10)).toBe(100);
    expect(calculateTaxAmount(500, 8.25)).toBe(41.25);
    expect(calculateTaxAmount(100, 7)).toBe(7);
  });

  it('rounds to 2 decimal places', () => {
    // 100 * 0.0333 = 3.33
    expect(calculateTaxAmount(100, 3.33)).toBe(3.33);
    // 99.99 * 0.0825 = 8.249175 -> rounds to 8.25
    expect(calculateTaxAmount(99.99, 8.25)).toBe(8.25);
  });

  it('handles very small amounts', () => {
    expect(calculateTaxAmount(0.01, 10)).toBe(0);
    // 0.01 * 0.1 = 0.001 -> rounds to 0.00
  });

  it('handles large amounts', () => {
    expect(calculateTaxAmount(1000000, 8.25)).toBe(82500);
  });

  it('handles 100% tax rate', () => {
    expect(calculateTaxAmount(250, 100)).toBe(250);
  });
});

describe('calculateTaxFromConfig', () => {
  it('returns 0 for null config', () => {
    expect(calculateTaxFromConfig(1000, null)).toBe(0);
  });

  it('returns 0 for undefined config', () => {
    expect(calculateTaxFromConfig(1000, undefined)).toBe(0);
  });

  it('returns 0 for zero amount', () => {
    const config = makeTaxConfig({ federalTaxRate: 22 });
    expect(calculateTaxFromConfig(0, config)).toBe(0);
  });

  it('returns 0 for negative amount', () => {
    const config = makeTaxConfig({ federalTaxRate: 22 });
    expect(calculateTaxFromConfig(-500, config)).toBe(0);
  });

  it('calculates federal tax only', () => {
    const config = makeTaxConfig({ federalTaxRate: 22 });
    expect(calculateTaxFromConfig(1000, config)).toBe(220);
  });

  it('calculates state tax only', () => {
    const config = makeTaxConfig({ stateTaxRate: 6.5 });
    expect(calculateTaxFromConfig(1000, config)).toBe(65);
  });

  it('calculates local tax only', () => {
    const config = makeTaxConfig({ localTaxRate: 2.5 });
    expect(calculateTaxFromConfig(1000, config)).toBe(25);
  });

  it('calculates multi-level taxes combined', () => {
    const config = makeTaxConfig({
      federalTaxRate: 22,
      stateTaxRate: 6.5,
      localTaxRate: 2.5,
    });
    // 220 + 65 + 25 = 310
    expect(calculateTaxFromConfig(1000, config)).toBe(310);
  });

  it('handles all rates as zero', () => {
    const config = makeTaxConfig();
    expect(calculateTaxFromConfig(1000, config)).toBe(0);
  });

  it('rounds total tax to 2 decimal places', () => {
    const config = makeTaxConfig({
      federalTaxRate: 7.3,
      stateTaxRate: 4.2,
      localTaxRate: 1.1,
    });
    // 100 * 0.073 = 7.3, 100 * 0.042 = 4.2, 100 * 0.011 = 1.1
    // total = 12.6
    expect(calculateTaxFromConfig(100, config)).toBe(12.6);
  });
});

describe('calculateEffectiveTaxRate', () => {
  it('returns 0 for null config', () => {
    expect(calculateEffectiveTaxRate(null)).toBe(0);
  });

  it('returns 0 for undefined config', () => {
    expect(calculateEffectiveTaxRate(undefined)).toBe(0);
  });

  it('returns 0 when all rates are zero', () => {
    const config = makeTaxConfig();
    expect(calculateEffectiveTaxRate(config)).toBe(0);
  });

  it('sums federal, state, and local rates', () => {
    const config = makeTaxConfig({
      federalTaxRate: 22,
      stateTaxRate: 6.5,
      localTaxRate: 2.5,
    });
    expect(calculateEffectiveTaxRate(config)).toBe(31);
  });

  it('handles federal only', () => {
    const config = makeTaxConfig({ federalTaxRate: 15 });
    expect(calculateEffectiveTaxRate(config)).toBe(15);
  });

  it('handles state only', () => {
    const config = makeTaxConfig({ stateTaxRate: 9.3 });
    expect(calculateEffectiveTaxRate(config)).toBe(9.3);
  });

  it('handles local only', () => {
    const config = makeTaxConfig({ localTaxRate: 3.75 });
    expect(calculateEffectiveTaxRate(config)).toBe(3.75);
  });

  it('rounds combined rate to 2 decimal places', () => {
    const config = makeTaxConfig({
      federalTaxRate: 7.333,
      stateTaxRate: 4.222,
      localTaxRate: 1.111,
    });
    // 7.333 + 4.222 + 1.111 = 12.666 -> rounds to 12.67
    expect(calculateEffectiveTaxRate(config)).toBe(12.67);
  });
});

describe('formatTaxSummary', () => {
  it('returns "No tax configuration" for null', () => {
    expect(formatTaxSummary(null)).toBe('No tax configuration');
  });

  it('returns "No tax configuration" for undefined', () => {
    expect(formatTaxSummary(undefined)).toBe('No tax configuration');
  });

  it('returns "No taxes configured" when all rates are zero', () => {
    const config = makeTaxConfig();
    expect(formatTaxSummary(config)).toBe('No taxes configured');
  });

  it('formats federal only', () => {
    const config = makeTaxConfig({ federalTaxRate: 22 });
    expect(formatTaxSummary(config)).toBe('Federal 22% = 22% effective');
  });

  it('formats state with state name', () => {
    const config = makeTaxConfig({ stateTaxRate: 6.5, state: 'CA' });
    expect(formatTaxSummary(config)).toBe('CA State 6.5% = 6.5% effective');
  });

  it('formats state without state name', () => {
    const config = makeTaxConfig({ stateTaxRate: 6.5 });
    expect(formatTaxSummary(config)).toBe('State 6.5% = 6.5% effective');
  });

  it('formats local only', () => {
    const config = makeTaxConfig({ localTaxRate: 2.5 });
    expect(formatTaxSummary(config)).toBe('Local 2.5% = 2.5% effective');
  });

  it('formats all three levels combined', () => {
    const config = makeTaxConfig({
      federalTaxRate: 22,
      stateTaxRate: 6.5,
      localTaxRate: 2.5,
      state: 'TX',
    });
    expect(formatTaxSummary(config)).toBe(
      'Federal 22% + TX State 6.5% + Local 2.5% = 31% effective'
    );
  });

  it('formats federal + state without local', () => {
    const config = makeTaxConfig({
      federalTaxRate: 22,
      stateTaxRate: 5,
    });
    expect(formatTaxSummary(config)).toBe('Federal 22% + State 5% = 27% effective');
  });

  it('formats federal + local without state', () => {
    const config = makeTaxConfig({
      federalTaxRate: 22,
      localTaxRate: 3,
    });
    expect(formatTaxSummary(config)).toBe('Federal 22% + Local 3% = 25% effective');
  });
});

describe('getTaxBreakdown', () => {
  it('returns zero breakdown for null config', () => {
    const result = getTaxBreakdown(1000, null);
    expect(result).toEqual({
      federalTax: 0,
      stateTax: 0,
      localTax: 0,
      totalTax: 0,
      effectiveRate: 0,
      breakdown: 'No tax',
    });
  });

  it('returns zero breakdown for undefined config', () => {
    const result = getTaxBreakdown(1000, undefined);
    expect(result).toEqual({
      federalTax: 0,
      stateTax: 0,
      localTax: 0,
      totalTax: 0,
      effectiveRate: 0,
      breakdown: 'No tax',
    });
  });

  it('returns zero breakdown for zero amount', () => {
    const config = makeTaxConfig({ federalTaxRate: 22 });
    const result = getTaxBreakdown(0, config);
    expect(result).toEqual({
      federalTax: 0,
      stateTax: 0,
      localTax: 0,
      totalTax: 0,
      effectiveRate: 0,
      breakdown: 'No tax',
    });
  });

  it('returns zero breakdown for negative amount', () => {
    const config = makeTaxConfig({ federalTaxRate: 22 });
    const result = getTaxBreakdown(-500, config);
    expect(result).toEqual({
      federalTax: 0,
      stateTax: 0,
      localTax: 0,
      totalTax: 0,
      effectiveRate: 0,
      breakdown: 'No tax',
    });
  });

  it('calculates full breakdown with all levels', () => {
    const config = makeTaxConfig({
      entityType: 's_corp',
      federalTaxRate: 22,
      stateTaxRate: 6.5,
      localTaxRate: 2.5,
      state: 'WA',
    });
    const result = getTaxBreakdown(10000, config);
    expect(result.federalTax).toBe(2200);
    expect(result.stateTax).toBe(650);
    expect(result.localTax).toBe(250);
    expect(result.totalTax).toBe(3100);
    expect(result.effectiveRate).toBe(31);
    expect(result.breakdown).toBe(
      'Federal 22% + WA State 6.5% + Local 2.5% = 31% effective'
    );
  });

  it('calculates breakdown with federal only', () => {
    const config = makeTaxConfig({ federalTaxRate: 15 });
    const result = getTaxBreakdown(500, config);
    expect(result.federalTax).toBe(75);
    expect(result.stateTax).toBe(0);
    expect(result.localTax).toBe(0);
    expect(result.totalTax).toBe(75);
    expect(result.effectiveRate).toBe(15);
  });

  it('calculates breakdown with all rates zero', () => {
    const config = makeTaxConfig();
    const result = getTaxBreakdown(1000, config);
    expect(result.totalTax).toBe(0);
    expect(result.effectiveRate).toBe(0);
    expect(result.breakdown).toBe('No taxes configured');
  });
});

describe('calculateTotalWithTax', () => {
  it('adds tax to subtotal', () => {
    expect(calculateTotalWithTax(1000, 10)).toBe(1100);
  });

  it('returns subtotal when tax rate is zero', () => {
    expect(calculateTotalWithTax(1000, 0)).toBe(1000);
  });

  it('returns subtotal when tax rate is negative', () => {
    // calculateTaxAmount returns 0 for negative rate
    expect(calculateTotalWithTax(1000, -5)).toBe(1000);
  });

  it('handles decimal subtotals', () => {
    expect(calculateTotalWithTax(99.99, 8.25)).toBe(108.24);
  });

  it('rounds total to 2 decimal places', () => {
    // 33.33 + 33.33 * 0.07 = 33.33 + 2.3331 = 35.6631 -> 35.66
    expect(calculateTotalWithTax(33.33, 7)).toBe(35.66);
  });

  it('handles zero subtotal', () => {
    expect(calculateTotalWithTax(0, 10)).toBe(0);
  });

  it('handles 100% tax rate', () => {
    expect(calculateTotalWithTax(500, 100)).toBe(1000);
  });
});

describe('extractSubtotalFromTotal', () => {
  it('extracts subtotal from total with tax', () => {
    // total = 1100, rate = 10 -> subtotal = 1100 / 1.10 = 1000
    expect(extractSubtotalFromTotal(1100, 10)).toBe(1000);
  });

  it('returns total when tax rate is zero', () => {
    expect(extractSubtotalFromTotal(1000, 0)).toBe(1000);
  });

  it('returns total when tax rate is negative', () => {
    expect(extractSubtotalFromTotal(1000, -5)).toBe(1000);
  });

  it('rounds subtotal to 2 decimal places', () => {
    // 108.24 / 1.0825 = 99.99... -> 100.0 (approximately)
    const result = extractSubtotalFromTotal(108.25, 8.25);
    expect(result).toBe(100);
  });

  it('is the inverse of calculateTotalWithTax', () => {
    const subtotal = 1234.56;
    const rate = 8.25;
    const total = calculateTotalWithTax(subtotal, rate);
    const extracted = extractSubtotalFromTotal(total, rate);
    // Due to rounding, might differ by 1 cent
    expect(Math.abs(extracted - subtotal)).toBeLessThanOrEqual(0.01);
  });

  it('handles large totals', () => {
    const result = extractSubtotalFromTotal(1082500, 8.25);
    expect(result).toBe(1000000);
  });
});

describe('isValidTaxRate', () => {
  it('returns true for zero', () => {
    expect(isValidTaxRate(0)).toBe(true);
  });

  it('returns true for 100', () => {
    expect(isValidTaxRate(100)).toBe(true);
  });

  it('returns true for a normal rate', () => {
    expect(isValidTaxRate(8.25)).toBe(true);
  });

  it('returns true for a whole number rate', () => {
    expect(isValidTaxRate(25)).toBe(true);
  });

  it('returns false for NaN', () => {
    expect(isValidTaxRate(NaN)).toBe(false);
  });

  it('returns false for negative rate', () => {
    expect(isValidTaxRate(-1)).toBe(false);
  });

  it('returns false for rate above 100', () => {
    expect(isValidTaxRate(101)).toBe(false);
  });

  it('respects custom min bound', () => {
    expect(isValidTaxRate(5, 10, 100)).toBe(false);
    expect(isValidTaxRate(10, 10, 100)).toBe(true);
  });

  it('respects custom max bound', () => {
    expect(isValidTaxRate(50, 0, 40)).toBe(false);
    expect(isValidTaxRate(40, 0, 40)).toBe(true);
  });

  it('respects custom min and max bounds', () => {
    expect(isValidTaxRate(15, 10, 20)).toBe(true);
    expect(isValidTaxRate(5, 10, 20)).toBe(false);
    expect(isValidTaxRate(25, 10, 20)).toBe(false);
  });

  it('handles boundary values with defaults', () => {
    expect(isValidTaxRate(0)).toBe(true);
    expect(isValidTaxRate(100)).toBe(true);
    expect(isValidTaxRate(-0.01)).toBe(false);
    expect(isValidTaxRate(100.01)).toBe(false);
  });
});

describe('getEntityTaxLabel', () => {
  it('returns correct label for sole_proprietor', () => {
    expect(getEntityTaxLabel('sole_proprietor')).toBe('Self-Employment Tax');
  });

  it('returns correct label for llc', () => {
    expect(getEntityTaxLabel('llc')).toBe('Pass-Through Taxation');
  });

  it('returns correct label for partnership', () => {
    expect(getEntityTaxLabel('partnership')).toBe('Partnership Taxation');
  });

  it('returns correct label for s_corp', () => {
    expect(getEntityTaxLabel('s_corp')).toBe('S-Corp Pass-Through');
  });

  it('returns correct label for c_corp', () => {
    expect(getEntityTaxLabel('c_corp')).toBe('Corporate Tax');
  });

  it('returns fallback for unknown entity type', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getEntityTaxLabel('unknown_type' as any)).toBe('Business Tax');
  });
});
