/**
 * Tax Calculator for Payroll
 *
 * IMPORTANT DISCLAIMER: These calculations are ESTIMATES ONLY and should not be used
 * for actual tax filing. Employers should consult with a qualified tax professional
 * or use a certified payroll service for official payroll tax calculations.
 *
 * Tax rates and brackets are approximate and may not reflect current law.
 */

import {
  TaxCalculationInput,
  TaxCalculation,
  PaySchedule,
  TAX_RATES,
} from '@/types';

// 2026 Federal Income Tax Brackets (Estimated - Single Filers)
const FEDERAL_BRACKETS_SINGLE = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 },
];

// 2026 Federal Income Tax Brackets (Estimated - Married Filing Jointly)
const FEDERAL_BRACKETS_MARRIED = [
  { min: 0, max: 23200, rate: 0.10 },
  { min: 23200, max: 94300, rate: 0.12 },
  { min: 94300, max: 201050, rate: 0.22 },
  { min: 201050, max: 383900, rate: 0.24 },
  { min: 383900, max: 487450, rate: 0.32 },
  { min: 487450, max: 731200, rate: 0.35 },
  { min: 731200, max: Infinity, rate: 0.37 },
];

// State tax rates (simplified - flat or top marginal rate estimates)
const STATE_TAX_RATES: Record<string, { rate: number; hasIncomeTax: boolean }> = {
  'AL': { rate: 0.05, hasIncomeTax: true },
  'AK': { rate: 0, hasIncomeTax: false },
  'AZ': { rate: 0.025, hasIncomeTax: true },
  'AR': { rate: 0.047, hasIncomeTax: true },
  'CA': { rate: 0.0725, hasIncomeTax: true }, // Simplified top rate
  'CO': { rate: 0.044, hasIncomeTax: true },
  'CT': { rate: 0.0699, hasIncomeTax: true },
  'DE': { rate: 0.066, hasIncomeTax: true },
  'FL': { rate: 0, hasIncomeTax: false },
  'GA': { rate: 0.0549, hasIncomeTax: true },
  'HI': { rate: 0.11, hasIncomeTax: true },
  'ID': { rate: 0.058, hasIncomeTax: true },
  'IL': { rate: 0.0495, hasIncomeTax: true },
  'IN': { rate: 0.0305, hasIncomeTax: true },
  'IA': { rate: 0.06, hasIncomeTax: true },
  'KS': { rate: 0.057, hasIncomeTax: true },
  'KY': { rate: 0.04, hasIncomeTax: true },
  'LA': { rate: 0.0425, hasIncomeTax: true },
  'ME': { rate: 0.0715, hasIncomeTax: true },
  'MD': { rate: 0.0575, hasIncomeTax: true },
  'MA': { rate: 0.05, hasIncomeTax: true },
  'MI': { rate: 0.0425, hasIncomeTax: true },
  'MN': { rate: 0.0985, hasIncomeTax: true },
  'MS': { rate: 0.05, hasIncomeTax: true },
  'MO': { rate: 0.048, hasIncomeTax: true },
  'MT': { rate: 0.0575, hasIncomeTax: true },
  'NE': { rate: 0.0584, hasIncomeTax: true },
  'NV': { rate: 0, hasIncomeTax: false },
  'NH': { rate: 0, hasIncomeTax: false }, // No earned income tax
  'NJ': { rate: 0.1075, hasIncomeTax: true },
  'NM': { rate: 0.059, hasIncomeTax: true },
  'NY': { rate: 0.0685, hasIncomeTax: true },
  'NC': { rate: 0.0475, hasIncomeTax: true },
  'ND': { rate: 0.0225, hasIncomeTax: true },
  'OH': { rate: 0.035, hasIncomeTax: true },
  'OK': { rate: 0.0475, hasIncomeTax: true },
  'OR': { rate: 0.099, hasIncomeTax: true },
  'PA': { rate: 0.0307, hasIncomeTax: true },
  'RI': { rate: 0.0599, hasIncomeTax: true },
  'SC': { rate: 0.064, hasIncomeTax: true },
  'SD': { rate: 0, hasIncomeTax: false },
  'TN': { rate: 0, hasIncomeTax: false },
  'TX': { rate: 0, hasIncomeTax: false },
  'UT': { rate: 0.0465, hasIncomeTax: true },
  'VT': { rate: 0.0875, hasIncomeTax: true },
  'VA': { rate: 0.0575, hasIncomeTax: true },
  'WA': { rate: 0, hasIncomeTax: false },
  'WV': { rate: 0.0512, hasIncomeTax: true },
  'WI': { rate: 0.0765, hasIncomeTax: true },
  'WY': { rate: 0, hasIncomeTax: false },
  'DC': { rate: 0.1075, hasIncomeTax: true },
};

// Pay periods per year for annualization
const PAY_PERIODS_PER_YEAR: Record<PaySchedule, number> = {
  'weekly': 52,
  'bi-weekly': 26,
  'semi-monthly': 24,
  'monthly': 12,
};

/**
 * Calculate federal income tax withholding
 * Uses simplified percentage method
 */
export function calculateFederalWithholding(
  grossPay: number,
  payPeriodType: PaySchedule,
  filingStatus: TaxCalculationInput['filingStatus'],
  allowances: number,
  additionalWithholding: number,
  isExempt: boolean
): number {
  if (isExempt || grossPay <= 0) {
    return 0;
  }

  const periodsPerYear = PAY_PERIODS_PER_YEAR[payPeriodType];

  // Annualize the gross pay
  const annualGross = grossPay * periodsPerYear;

  // Standard deduction (2026 estimated)
  const standardDeduction = filingStatus === 'married_filing_jointly' ? 29200 : 14600;

  // Allowance value (approximate)
  const allowanceValue = 4300 * allowances;

  // Taxable income
  const taxableIncome = Math.max(0, annualGross - standardDeduction - allowanceValue);

  // Select brackets based on filing status
  const brackets = filingStatus === 'married_filing_jointly'
    ? FEDERAL_BRACKETS_MARRIED
    : FEDERAL_BRACKETS_SINGLE;

  // Calculate annual tax
  let annualTax = 0;
  let remainingIncome = taxableIncome;

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;

    const bracketWidth = bracket.max - bracket.min;
    const taxableInBracket = Math.min(remainingIncome, bracketWidth);

    annualTax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
  }

  // Per-period withholding
  let periodWithholding = annualTax / periodsPerYear;

  // Add additional withholding
  periodWithholding += additionalWithholding;

  return Math.max(0, Math.round(periodWithholding * 100) / 100);
}

/**
 * Calculate state income tax withholding
 * Uses simplified flat rate approximation
 */
export function calculateStateWithholding(
  grossPay: number,
  stateCode: string
): number {
  const stateInfo = STATE_TAX_RATES[stateCode.toUpperCase()];

  if (!stateInfo || !stateInfo.hasIncomeTax || grossPay <= 0) {
    return 0;
  }

  // Simple flat rate calculation (actual state taxes are more complex)
  const withholding = grossPay * stateInfo.rate;

  return Math.round(withholding * 100) / 100;
}

/**
 * Calculate Social Security tax (FICA - OASDI)
 */
export function calculateSocialSecurity(
  grossPay: number,
  ytdGrossPay: number
): number {
  const { rate, wageBase } = TAX_RATES.socialSecurity;

  // Check if we've already hit the wage base
  if (ytdGrossPay >= wageBase) {
    return 0;
  }

  // Calculate taxable amount (up to wage base)
  const ytdAfterThisPay = ytdGrossPay + grossPay;
  const taxableAmount = ytdAfterThisPay <= wageBase
    ? grossPay
    : Math.max(0, wageBase - ytdGrossPay);

  const tax = taxableAmount * rate;

  return Math.round(tax * 100) / 100;
}

/**
 * Calculate Medicare tax (FICA - HI)
 */
export function calculateMedicare(
  grossPay: number,
  ytdGrossPay: number
): number {
  const { rate, additionalRate, additionalThreshold } = TAX_RATES.medicare;

  // Base Medicare tax
  let tax = grossPay * rate;

  // Additional Medicare tax for high earners
  const ytdAfterThisPay = ytdGrossPay + grossPay;

  if (ytdAfterThisPay > additionalThreshold) {
    // Amount subject to additional tax
    const previouslySubject = Math.max(0, ytdGrossPay - additionalThreshold);
    const nowSubject = ytdAfterThisPay - additionalThreshold;
    const additionalTaxableThisPeriod = nowSubject - previouslySubject;

    if (additionalTaxableThisPeriod > 0) {
      tax += additionalTaxableThisPeriod * additionalRate;
    }
  }

  return Math.round(tax * 100) / 100;
}

/**
 * Calculate all taxes for a pay period
 */
export function calculateTaxes(input: TaxCalculationInput): TaxCalculation {
  const {
    grossPay,
    payPeriodType,
    filingStatus,
    allowances,
    additionalWithholding,
    isExempt,
    stateCode,
    ytdGrossPay,
  } = input;

  const federalWithholding = calculateFederalWithholding(
    grossPay,
    payPeriodType,
    filingStatus,
    allowances,
    additionalWithholding,
    isExempt
  );

  const stateWithholding = calculateStateWithholding(grossPay, stateCode);
  const socialSecurity = calculateSocialSecurity(grossPay, ytdGrossPay);
  const medicare = calculateMedicare(grossPay, ytdGrossPay);

  const totalTax = federalWithholding + stateWithholding + socialSecurity + medicare;
  const effectiveRate = grossPay > 0 ? (totalTax / grossPay) * 100 : 0;

  return {
    grossPay,
    federalWithholding,
    stateWithholding,
    socialSecurity,
    medicare,
    totalTax,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
  };
}

/**
 * Get list of states with no income tax
 */
export function getNoIncomeTaxStates(): string[] {
  return Object.entries(STATE_TAX_RATES)
    .filter(([, info]) => !info.hasIncomeTax)
    .map(([code]) => code);
}

/**
 * Get state tax rate for display
 */
export function getStateTaxRate(stateCode: string): number {
  const stateInfo = STATE_TAX_RATES[stateCode.toUpperCase()];
  return stateInfo?.rate ?? 0;
}

/**
 * Validate state code
 */
export function isValidStateCode(stateCode: string): boolean {
  return stateCode.toUpperCase() in STATE_TAX_RATES;
}
