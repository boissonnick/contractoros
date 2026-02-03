/**
 * Tax Calculator Utility
 *
 * General utility functions for tax calculations used across the application
 * for invoices, estimates, and organization-level tax configuration.
 */

import { TaxConfig } from '@/types';

/**
 * Entity type labels for display
 */
export const ENTITY_TYPE_LABELS: Record<TaxConfig['entityType'], string> = {
  sole_proprietor: 'Sole Proprietor',
  llc: 'LLC',
  partnership: 'Partnership',
  s_corp: 'S Corporation',
  c_corp: 'C Corporation',
};

/**
 * Calculate tax amount based on a given amount and tax rate percentage
 * @param amount - The base amount to apply tax to
 * @param taxRatePercent - The tax rate as a percentage (e.g., 8.25 for 8.25%)
 * @returns The calculated tax amount, rounded to 2 decimal places
 */
export function calculateTaxAmount(amount: number, taxRatePercent: number): number {
  if (amount <= 0 || taxRatePercent <= 0) {
    return 0;
  }
  const taxAmount = amount * (taxRatePercent / 100);
  return Math.round(taxAmount * 100) / 100;
}

/**
 * Calculate tax amount using the organization's TaxConfig
 * Applies federal, state, and local tax rates combined
 * @param amount - The base amount to apply tax to
 * @param taxConfig - The organization's tax configuration
 * @returns The total tax amount from all tax levels
 */
export function calculateTaxFromConfig(amount: number, taxConfig: TaxConfig | null | undefined): number {
  if (!taxConfig || amount <= 0) {
    return 0;
  }

  const federalTax = calculateTaxAmount(amount, taxConfig.federalTaxRate || 0);
  const stateTax = calculateTaxAmount(amount, taxConfig.stateTaxRate || 0);
  const localTax = calculateTaxAmount(amount, taxConfig.localTaxRate || 0);

  return Math.round((federalTax + stateTax + localTax) * 100) / 100;
}

/**
 * Calculate the effective (combined) tax rate from all tax levels
 * @param taxConfig - The organization's tax configuration
 * @returns The combined effective tax rate as a percentage
 */
export function calculateEffectiveTaxRate(taxConfig: TaxConfig | null | undefined): number {
  if (!taxConfig) {
    return 0;
  }

  const effectiveRate =
    (taxConfig.federalTaxRate || 0) +
    (taxConfig.stateTaxRate || 0) +
    (taxConfig.localTaxRate || 0);

  return Math.round(effectiveRate * 100) / 100;
}

/**
 * Format a tax summary string for display
 * @param taxConfig - The organization's tax configuration
 * @returns A formatted string summarizing the tax configuration
 */
export function formatTaxSummary(taxConfig: TaxConfig | null | undefined): string {
  if (!taxConfig) {
    return 'No tax configuration';
  }

  const parts: string[] = [];

  if (taxConfig.federalTaxRate > 0) {
    parts.push(`Federal ${taxConfig.federalTaxRate}%`);
  }

  if (taxConfig.stateTaxRate > 0) {
    const stateLabel = taxConfig.state ? `${taxConfig.state} State` : 'State';
    parts.push(`${stateLabel} ${taxConfig.stateTaxRate}%`);
  }

  if (taxConfig.localTaxRate > 0) {
    parts.push(`Local ${taxConfig.localTaxRate}%`);
  }

  if (parts.length === 0) {
    return 'No taxes configured';
  }

  const effectiveRate = calculateEffectiveTaxRate(taxConfig);
  return `${parts.join(' + ')} = ${effectiveRate}% effective`;
}

/**
 * Format a tax breakdown for detailed display
 * @param amount - The base amount
 * @param taxConfig - The organization's tax configuration
 * @returns An object with individual tax breakdowns
 */
export function getTaxBreakdown(amount: number, taxConfig: TaxConfig | null | undefined): {
  federalTax: number;
  stateTax: number;
  localTax: number;
  totalTax: number;
  effectiveRate: number;
  breakdown: string;
} {
  if (!taxConfig || amount <= 0) {
    return {
      federalTax: 0,
      stateTax: 0,
      localTax: 0,
      totalTax: 0,
      effectiveRate: 0,
      breakdown: 'No tax',
    };
  }

  const federalTax = calculateTaxAmount(amount, taxConfig.federalTaxRate || 0);
  const stateTax = calculateTaxAmount(amount, taxConfig.stateTaxRate || 0);
  const localTax = calculateTaxAmount(amount, taxConfig.localTaxRate || 0);
  const totalTax = Math.round((federalTax + stateTax + localTax) * 100) / 100;
  const effectiveRate = calculateEffectiveTaxRate(taxConfig);

  return {
    federalTax,
    stateTax,
    localTax,
    totalTax,
    effectiveRate,
    breakdown: formatTaxSummary(taxConfig),
  };
}

/**
 * Calculate total with tax included
 * @param subtotal - The subtotal before tax
 * @param taxRatePercent - The tax rate as a percentage
 * @returns The total including tax
 */
export function calculateTotalWithTax(subtotal: number, taxRatePercent: number): number {
  const taxAmount = calculateTaxAmount(subtotal, taxRatePercent);
  return Math.round((subtotal + taxAmount) * 100) / 100;
}

/**
 * Extract the pre-tax amount from a total that includes tax
 * Useful for reverse-calculating the subtotal
 * @param totalWithTax - The total amount including tax
 * @param taxRatePercent - The tax rate as a percentage
 * @returns The pre-tax subtotal
 */
export function extractSubtotalFromTotal(totalWithTax: number, taxRatePercent: number): number {
  if (taxRatePercent <= 0) {
    return totalWithTax;
  }
  const subtotal = totalWithTax / (1 + taxRatePercent / 100);
  return Math.round(subtotal * 100) / 100;
}

/**
 * Format a currency value for display
 * @param amount - The amount to format
 * @param currency - The currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a tax rate percentage for display
 * @param rate - The tax rate as a number
 * @returns Formatted percentage string
 */
export function formatTaxRate(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

/**
 * Validate a tax rate is within reasonable bounds
 * @param rate - The tax rate to validate
 * @param min - Minimum allowed rate (default: 0)
 * @param max - Maximum allowed rate (default: 100)
 * @returns Whether the rate is valid
 */
export function isValidTaxRate(rate: number, min: number = 0, max: number = 100): boolean {
  return typeof rate === 'number' && !isNaN(rate) && rate >= min && rate <= max;
}

/**
 * Get the appropriate tax label based on entity type
 * @param entityType - The business entity type
 * @returns A descriptive label for tax purposes
 */
export function getEntityTaxLabel(entityType: TaxConfig['entityType']): string {
  const labels: Record<TaxConfig['entityType'], string> = {
    sole_proprietor: 'Self-Employment Tax',
    llc: 'Pass-Through Taxation',
    partnership: 'Partnership Taxation',
    s_corp: 'S-Corp Pass-Through',
    c_corp: 'Corporate Tax',
  };
  return labels[entityType] || 'Business Tax';
}
