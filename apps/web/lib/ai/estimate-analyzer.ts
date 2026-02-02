/**
 * Estimate Review Analyzer - Sprint 31
 *
 * Analyzes estimate line items for:
 * - Missing common items
 * - Unusual pricing (too high or too low)
 * - Category coverage
 * - General suggestions
 */

import type { EstimateLineItem, EstimateAnalysisResult } from '@/types';

// ===========================================
// COMMON ITEMS DATABASE
// ===========================================

/**
 * Common items expected for different project types
 */
const PROJECT_TYPE_ITEMS: Record<string, {
  required: string[];
  common: string[];
  categories: string[];
}> = {
  'kitchen remodel': {
    required: ['permit', 'demo', 'dumpster'],
    common: [
      'cabinet',
      'countertop',
      'backsplash',
      'flooring',
      'electrical',
      'plumbing',
      'lighting',
      'appliance',
      'sink',
      'faucet',
      'paint',
      'drywall',
      'cleanup',
    ],
    categories: ['demo', 'framing', 'electrical', 'plumbing', 'hvac', 'drywall', 'paint', 'flooring', 'cabinetry', 'countertops', 'appliances', 'fixtures', 'general'],
  },
  'bathroom remodel': {
    required: ['permit', 'demo', 'dumpster'],
    common: [
      'tile',
      'waterproofing',
      'vanity',
      'toilet',
      'shower',
      'tub',
      'faucet',
      'exhaust fan',
      'mirror',
      'lighting',
      'plumbing',
      'electrical',
      'paint',
      'drywall',
      'cleanup',
    ],
    categories: ['demo', 'framing', 'electrical', 'plumbing', 'waterproofing', 'tile', 'drywall', 'paint', 'fixtures', 'ventilation', 'general'],
  },
  'room addition': {
    required: ['permit', 'demo', 'dumpster', 'foundation', 'framing', 'roofing'],
    common: [
      'concrete',
      'lumber',
      'sheathing',
      'insulation',
      'window',
      'door',
      'electrical',
      'plumbing',
      'hvac',
      'drywall',
      'paint',
      'flooring',
      'trim',
      'cleanup',
    ],
    categories: ['sitework', 'foundation', 'framing', 'roofing', 'windows', 'doors', 'electrical', 'plumbing', 'hvac', 'insulation', 'drywall', 'paint', 'flooring', 'trim', 'general'],
  },
  'deck': {
    required: ['permit'],
    common: [
      'footing',
      'post',
      'beam',
      'joist',
      'decking',
      'railing',
      'stair',
      'hardware',
      'flashing',
      'ledger',
      'cleanup',
    ],
    categories: ['foundation', 'framing', 'decking', 'railing', 'stairs', 'hardware', 'general'],
  },
  'roofing': {
    required: ['permit', 'dumpster'],
    common: [
      'tear-off',
      'shingle',
      'underlayment',
      'flashing',
      'ridge',
      'vent',
      'gutter',
      'downspout',
      'chimney',
      'skylight',
      'cleanup',
    ],
    categories: ['demo', 'roofing', 'flashing', 'ventilation', 'gutters', 'general'],
  },
  default: {
    required: ['permit'],
    common: [
      'demo',
      'dumpster',
      'cleanup',
      'contingency',
    ],
    categories: ['general', 'labor', 'materials'],
  },
};

/**
 * General items that should typically be in any estimate
 */
const GENERAL_CHECKLIST = [
  { item: 'permit', category: 'General Conditions', reason: 'Most projects require permits' },
  { item: 'dumpster', category: 'General Conditions', reason: 'Waste removal typically needed' },
  { item: 'cleanup', category: 'General Conditions', reason: 'Final cleanup should be included' },
  { item: 'contingency', category: 'General Conditions', reason: 'Recommend 5-10% contingency for unknowns' },
  { item: 'supervision', category: 'Labor', reason: 'Project management/supervision time' },
  { item: 'material delivery', category: 'General Conditions', reason: 'Delivery costs often forgotten' },
];

// ===========================================
// PRICE BENCHMARKS
// ===========================================

/**
 * Market price ranges for common items (per unit)
 * Prices in USD, 2024 market data
 */
const PRICE_BENCHMARKS: Record<string, {
  unit: string;
  low: number;
  typical: number;
  high: number;
}> = {
  // Demo
  'demo kitchen': { unit: 'sqft', low: 3, typical: 5, high: 10 },
  'demo bathroom': { unit: 'sqft', low: 4, typical: 7, high: 12 },
  'demo drywall': { unit: 'sqft', low: 1, typical: 2, high: 4 },

  // Framing
  'framing wall': { unit: 'lf', low: 12, typical: 18, high: 30 },
  'framing header': { unit: 'each', low: 150, typical: 300, high: 500 },

  // Electrical
  'electrical outlet': { unit: 'each', low: 100, typical: 175, high: 300 },
  'electrical switch': { unit: 'each', low: 75, typical: 125, high: 200 },
  'electrical light fixture': { unit: 'each', low: 100, typical: 200, high: 400 },
  'electrical panel': { unit: 'each', low: 1500, typical: 2500, high: 4000 },
  'electrical circuit': { unit: 'each', low: 200, typical: 350, high: 600 },

  // Plumbing
  'plumbing fixture rough': { unit: 'each', low: 300, typical: 500, high: 800 },
  'plumbing fixture trim': { unit: 'each', low: 150, typical: 300, high: 500 },
  'plumbing water heater': { unit: 'each', low: 1200, typical: 2000, high: 4000 },

  // Drywall
  'drywall install': { unit: 'sqft', low: 1.5, typical: 2.5, high: 4 },
  'drywall finish': { unit: 'sqft', low: 1, typical: 2, high: 3.5 },
  'drywall complete': { unit: 'sqft', low: 3, typical: 5, high: 8 },

  // Paint
  'paint interior': { unit: 'sqft', low: 1.5, typical: 3, high: 5 },
  'paint exterior': { unit: 'sqft', low: 2, typical: 4, high: 7 },
  'paint trim': { unit: 'lf', low: 1.5, typical: 3, high: 5 },

  // Flooring
  'flooring tile': { unit: 'sqft', low: 8, typical: 15, high: 30 },
  'flooring hardwood': { unit: 'sqft', low: 8, typical: 14, high: 25 },
  'flooring laminate': { unit: 'sqft', low: 4, typical: 8, high: 12 },
  'flooring vinyl': { unit: 'sqft', low: 3, typical: 6, high: 10 },
  'flooring carpet': { unit: 'sqft', low: 3, typical: 6, high: 12 },

  // Cabinets
  'cabinet base': { unit: 'lf', low: 150, typical: 300, high: 600 },
  'cabinet wall': { unit: 'lf', low: 100, typical: 200, high: 400 },
  'cabinet tall': { unit: 'each', low: 400, typical: 800, high: 1500 },

  // Countertops
  'countertop laminate': { unit: 'sqft', low: 20, typical: 40, high: 70 },
  'countertop quartz': { unit: 'sqft', low: 50, typical: 80, high: 150 },
  'countertop granite': { unit: 'sqft', low: 45, typical: 75, high: 130 },

  // Roofing
  'roofing shingle': { unit: 'sqft', low: 4, typical: 7, high: 12 },
  'roofing metal': { unit: 'sqft', low: 8, typical: 14, high: 25 },
  'roofing flat': { unit: 'sqft', low: 5, typical: 10, high: 18 },

  // Windows & Doors
  'window standard': { unit: 'each', low: 400, typical: 700, high: 1200 },
  'window large': { unit: 'each', low: 800, typical: 1500, high: 3000 },
  'door interior': { unit: 'each', low: 200, typical: 400, high: 800 },
  'door exterior': { unit: 'each', low: 500, typical: 1200, high: 3000 },

  // Labor rates (per hour)
  'labor general': { unit: 'hr', low: 40, typical: 65, high: 100 },
  'labor electrician': { unit: 'hr', low: 60, typical: 90, high: 150 },
  'labor plumber': { unit: 'hr', low: 60, typical: 95, high: 160 },
  'labor hvac': { unit: 'hr', low: 55, typical: 85, high: 140 },
  'labor carpenter': { unit: 'hr', low: 45, typical: 70, high: 110 },
  'labor painter': { unit: 'hr', low: 35, typical: 55, high: 85 },
  'labor tile': { unit: 'hr', low: 50, typical: 75, high: 120 },
};

// ===========================================
// ANALYSIS FUNCTIONS
// ===========================================

/**
 * Detect project type from line items
 */
function detectProjectType(lineItems: EstimateLineItem[]): string {
  const itemNames = lineItems.map(item => item.name.toLowerCase()).join(' ');

  if (itemNames.includes('kitchen') || itemNames.includes('cabinet') && itemNames.includes('countertop')) {
    return 'kitchen remodel';
  }
  if (itemNames.includes('bathroom') || (itemNames.includes('tile') && itemNames.includes('vanity'))) {
    return 'bathroom remodel';
  }
  if (itemNames.includes('addition') || itemNames.includes('foundation') && itemNames.includes('roof')) {
    return 'room addition';
  }
  if (itemNames.includes('deck') || itemNames.includes('decking')) {
    return 'deck';
  }
  if (itemNames.includes('roof') || itemNames.includes('shingle')) {
    return 'roofing';
  }

  return 'default';
}

/**
 * Check for missing common items
 */
function checkMissingItems(
  lineItems: EstimateLineItem[],
  projectType: string
): Array<{
  category: string;
  item: string;
  reason: string;
  suggestedAmount?: number;
  confidence: number;
}> {
  const missing: Array<{
    category: string;
    item: string;
    reason: string;
    suggestedAmount?: number;
    confidence: number;
  }> = [];

  const itemNamesLower = lineItems.map(item => item.name.toLowerCase());
  const projectConfig = PROJECT_TYPE_ITEMS[projectType] || PROJECT_TYPE_ITEMS.default;

  // Check required items
  for (const required of projectConfig.required) {
    const found = itemNamesLower.some(name => name.includes(required));
    if (!found) {
      missing.push({
        category: 'Required',
        item: required.charAt(0).toUpperCase() + required.slice(1),
        reason: `${required} is typically required for ${projectType} projects`,
        confidence: 0.9,
      });
    }
  }

  // Check general checklist
  for (const check of GENERAL_CHECKLIST) {
    const found = itemNamesLower.some(name => name.includes(check.item));
    if (!found) {
      // Check if contingency exists as a percentage of total
      if (check.item === 'contingency') {
        const hasContingency = itemNamesLower.some(name =>
          name.includes('contingency') || name.includes('allowance') || name.includes('buffer')
        );
        if (!hasContingency) {
          const total = lineItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
          missing.push({
            category: check.category,
            item: 'Contingency (5-10%)',
            reason: check.reason,
            suggestedAmount: Math.round(total * 0.075), // 7.5% average
            confidence: 0.7,
          });
        }
      } else {
        missing.push({
          category: check.category,
          item: check.item.charAt(0).toUpperCase() + check.item.slice(1),
          reason: check.reason,
          confidence: 0.6,
        });
      }
    }
  }

  return missing;
}

/**
 * Find matching price benchmark for an item
 */
function findBenchmark(itemName: string, unit: string): {
  benchmark: { unit: string; low: number; typical: number; high: number };
  matchKey: string;
} | null {
  const lowerName = itemName.toLowerCase();

  // Try to find a matching benchmark
  for (const [key, benchmark] of Object.entries(PRICE_BENCHMARKS)) {
    const keyParts = key.split(' ');
    const matchesName = keyParts.some(part => lowerName.includes(part));
    const matchesUnit = benchmark.unit === unit.toLowerCase() ||
      (benchmark.unit === 'sqft' && unit.toLowerCase() === 'sf') ||
      (benchmark.unit === 'lf' && unit.toLowerCase() === 'ft');

    if (matchesName && matchesUnit) {
      return { benchmark, matchKey: key };
    }
  }

  return null;
}

/**
 * Analyze pricing for unusual values
 */
function analyzePricing(lineItems: EstimateLineItem[]): Array<{
  lineItemId: string;
  lineItemDescription: string;
  currentPrice: number;
  marketRangeLow: number;
  marketRangeHigh: number;
  flag: 'too_low' | 'too_high' | 'significantly_low' | 'significantly_high';
  recommendation: string;
}> {
  const flags: Array<{
    lineItemId: string;
    lineItemDescription: string;
    currentPrice: number;
    marketRangeLow: number;
    marketRangeHigh: number;
    flag: 'too_low' | 'too_high' | 'significantly_low' | 'significantly_high';
    recommendation: string;
  }> = [];

  for (const item of lineItems) {
    if (!item.unitCost || item.unitCost === 0) continue;

    const benchmarkResult = findBenchmark(item.name, item.unit);
    if (!benchmarkResult) continue;

    const { benchmark } = benchmarkResult;
    const price = item.unitCost;

    // Check if price is outside normal range
    if (price < benchmark.low * 0.5) {
      flags.push({
        lineItemId: item.id,
        lineItemDescription: item.name,
        currentPrice: price,
        marketRangeLow: benchmark.low,
        marketRangeHigh: benchmark.high,
        flag: 'significantly_low',
        recommendation: `Price is less than half the typical market rate. Verify scope is complete or this is intentional.`,
      });
    } else if (price < benchmark.low) {
      flags.push({
        lineItemId: item.id,
        lineItemDescription: item.name,
        currentPrice: price,
        marketRangeLow: benchmark.low,
        marketRangeHigh: benchmark.high,
        flag: 'too_low',
        recommendation: `Price is below typical market range. May indicate missing scope or aggressive pricing.`,
      });
    } else if (price > benchmark.high * 1.5) {
      flags.push({
        lineItemId: item.id,
        lineItemDescription: item.name,
        currentPrice: price,
        marketRangeLow: benchmark.low,
        marketRangeHigh: benchmark.high,
        flag: 'significantly_high',
        recommendation: `Price is 50%+ above market high. Ensure client understands the value or consider adjusting.`,
      });
    } else if (price > benchmark.high) {
      flags.push({
        lineItemId: item.id,
        lineItemDescription: item.name,
        currentPrice: price,
        marketRangeLow: benchmark.low,
        marketRangeHigh: benchmark.high,
        flag: 'too_high',
        recommendation: `Price is above typical market range. May need justification for premium pricing.`,
      });
    }
  }

  return flags;
}

/**
 * Analyze category coverage
 */
function analyzeCategories(
  lineItems: EstimateLineItem[],
  projectType: string
): Array<{
  category: string;
  itemCount: number;
  expectedItems: string[];
  missingCommon: string[];
  coverage: 'complete' | 'partial' | 'minimal';
}> {
  const projectConfig = PROJECT_TYPE_ITEMS[projectType] || PROJECT_TYPE_ITEMS.default;
  const categoryCounts: Record<string, { count: number; items: string[] }> = {};

  // Count items by category
  for (const item of lineItems) {
    const category = item.category || 'uncategorized';
    if (!categoryCounts[category]) {
      categoryCounts[category] = { count: 0, items: [] };
    }
    categoryCounts[category].count++;
    categoryCounts[category].items.push(item.name.toLowerCase());
  }

  const coverage: Array<{
    category: string;
    itemCount: number;
    expectedItems: string[];
    missingCommon: string[];
    coverage: 'complete' | 'partial' | 'minimal';
  }> = [];

  // Check each expected category
  for (const expectedCategory of projectConfig.categories) {
    const catData = categoryCounts[expectedCategory] || { count: 0, items: [] };

    // Find common items for this category that are missing
    const commonForCategory = projectConfig.common.filter(item => {
      // Simple heuristic: match category to common items
      const categoryLower = expectedCategory.toLowerCase();
      const itemLower = item.toLowerCase();
      return (
        categoryLower.includes(itemLower.split(' ')[0]) ||
        itemLower.includes(categoryLower)
      );
    });

    const missingCommon = commonForCategory.filter(
      commonItem => !catData.items.some(item => item.includes(commonItem))
    );

    let coverageLevel: 'complete' | 'partial' | 'minimal';
    if (missingCommon.length === 0 && catData.count > 0) {
      coverageLevel = 'complete';
    } else if (catData.count > 0) {
      coverageLevel = 'partial';
    } else {
      coverageLevel = 'minimal';
    }

    coverage.push({
      category: expectedCategory,
      itemCount: catData.count,
      expectedItems: commonForCategory,
      missingCommon,
      coverage: coverageLevel,
    });
  }

  return coverage;
}

/**
 * Calculate overall score
 */
function calculateScore(
  missingItems: number,
  pricingFlags: number,
  categoryCoverage: Array<{ coverage: string }>
): { score: number; riskLevel: 'low' | 'medium' | 'high' } {
  let score = 100;

  // Deduct for missing items (max -30)
  score -= Math.min(missingItems * 5, 30);

  // Deduct for pricing flags (max -20)
  score -= Math.min(pricingFlags * 5, 20);

  // Deduct for incomplete categories (max -20)
  const incompleteCategories = categoryCoverage.filter(c => c.coverage !== 'complete').length;
  score -= Math.min(incompleteCategories * 3, 20);

  score = Math.max(0, score);

  let riskLevel: 'low' | 'medium' | 'high';
  if (score >= 80) {
    riskLevel = 'low';
  } else if (score >= 60) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  return { score, riskLevel };
}

// ===========================================
// MAIN ANALYZER
// ===========================================

/**
 * Analyze an estimate for completeness and accuracy
 */
export function analyzeEstimate(
  estimateId: string,
  lineItems: EstimateLineItem[],
  options?: {
    projectType?: string;
    totalBudget?: number;
  }
): EstimateAnalysisResult {
  const startTime = Date.now();

  // Detect or use provided project type
  const projectType = options?.projectType || detectProjectType(lineItems);

  // Check for missing items
  const potentiallyMissingItems = checkMissingItems(lineItems, projectType);

  // Analyze pricing
  const pricingFlags = analyzePricing(lineItems);

  // Analyze category coverage
  const categoryCoverage = analyzeCategories(lineItems, projectType);

  // Calculate score
  const { score, riskLevel } = calculateScore(
    potentiallyMissingItems.length,
    pricingFlags.length,
    categoryCoverage
  );

  // Generate suggestions
  const suggestions: string[] = [];

  if (potentiallyMissingItems.length > 0) {
    suggestions.push(`Review ${potentiallyMissingItems.length} potentially missing items`);
  }

  if (pricingFlags.length > 0) {
    const lowCount = pricingFlags.filter(f => f.flag.includes('low')).length;
    const highCount = pricingFlags.filter(f => f.flag.includes('high')).length;
    if (lowCount > 0) {
      suggestions.push(`${lowCount} items may be priced below market - verify scope`);
    }
    if (highCount > 0) {
      suggestions.push(`${highCount} items above market range - ensure value justification`);
    }
  }

  const minimalCategories = categoryCoverage.filter(c => c.coverage === 'minimal');
  if (minimalCategories.length > 0) {
    suggestions.push(
      `Categories with minimal coverage: ${minimalCategories.map(c => c.category).join(', ')}`
    );
  }

  // Check for contingency
  const hasContingency = lineItems.some(item =>
    item.name.toLowerCase().includes('contingency') ||
    item.name.toLowerCase().includes('allowance')
  );
  if (!hasContingency) {
    suggestions.push('Consider adding a 5-10% contingency for unexpected costs');
  }

  // Check total markup
  const totalCost = lineItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  const totalMaterialLabor = lineItems.reduce((sum, item) => {
    return sum + (item.materialCost || 0) + (item.laborCost || 0);
  }, 0);

  if (totalMaterialLabor > 0 && totalCost > 0) {
    const impliedMarkup = ((totalCost - totalMaterialLabor) / totalMaterialLabor) * 100;
    if (impliedMarkup < 10) {
      suggestions.push('Overall markup appears low (<10%). Verify profitability.');
    } else if (impliedMarkup > 50) {
      suggestions.push('Overall markup is high (>50%). Ensure competitive positioning.');
    }
  }

  return {
    estimateId,
    analyzedAt: new Date(),
    overallScore: score,
    riskLevel,
    potentiallyMissingItems,
    pricingFlags,
    categoryCoverage,
    suggestions,
    confidence: 0.75, // Rule-based analysis has moderate confidence
    modelUsed: 'rule-based-v1',
    processingTimeMs: Date.now() - startTime,
  };
}

/**
 * Get quick suggestions without full analysis
 */
export function getQuickSuggestions(lineItems: EstimateLineItem[]): string[] {
  const suggestions: string[] = [];
  const itemNamesLower = lineItems.map(item => item.name.toLowerCase());

  // Quick checks
  if (!itemNamesLower.some(name => name.includes('permit'))) {
    suggestions.push('Consider adding permit fees');
  }
  if (!itemNamesLower.some(name => name.includes('contingency') || name.includes('allowance'))) {
    suggestions.push('Add contingency for unknowns (5-10% recommended)');
  }
  if (!itemNamesLower.some(name => name.includes('cleanup'))) {
    suggestions.push('Include final cleanup in estimate');
  }

  return suggestions;
}

/**
 * Validate line item pricing is reasonable
 */
export function validateLineItemPricing(
  name: string,
  unitCost: number,
  unit: string
): { valid: boolean; warning?: string } {
  const benchmarkResult = findBenchmark(name, unit);

  if (!benchmarkResult) {
    return { valid: true }; // Can't validate without benchmark
  }

  const { benchmark } = benchmarkResult;

  if (unitCost < benchmark.low * 0.3) {
    return {
      valid: false,
      warning: `Price seems very low. Typical range: $${benchmark.low}-$${benchmark.high}/${benchmark.unit}`,
    };
  }

  if (unitCost > benchmark.high * 2) {
    return {
      valid: false,
      warning: `Price seems very high. Typical range: $${benchmark.low}-$${benchmark.high}/${benchmark.unit}`,
    };
  }

  return { valid: true };
}
