/**
 * useIntelligence Hook
 *
 * React hook for accessing construction intelligence data including
 * material prices, labor rates, and AI-powered suggestions.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import {
  MaterialPriceIndex,
  LaborRateData,
  LaborTradeCategory,
  MaterialType,
  PriceSuggestion,
  IntelligenceSettings,
  MarketBenchmark,
  BenchmarkProjectType,
  SuggestionConfidence,
  CONFIDENCE_THRESHOLDS,
  MIN_SAMPLE_SIZE,
} from '@/lib/intelligence/types';
import {
  getAllMaterialPrices,
  getMaterialPrice,
  getTopMovers,
  checkPriceAlerts,
} from '@/lib/intelligence/material-prices';
import {
  getAllLaborRates,
  getLaborRate,
  getStateFromZipPrefix,
} from '@/lib/intelligence/labor-rates';

/**
 * Main intelligence hook
 */
export function useIntelligence() {
  const { user, profile } = useAuth();
  const [settings, setSettings] = useState<IntelligenceSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Get user's ZIP code from organization or profile
  // Profile might have address info depending on implementation
  const userZipCode = '';  // Would be populated from org settings
  const userState = userZipCode ? getStateFromZipPrefix(userZipCode) : null;

  // Load settings on mount
  useEffect(() => {
    if (user) {
      // In production, this would fetch from Firestore
      // For now, use defaults
      setSettings({
        orgId: profile?.orgId || '',
        enabled: true,
        contributionEnabled: true,
        showSuggestions: true,
        showMaterialAlerts: true,
        showBidAnalysis: true,
        alertThresholdPercent: 5,
        updatedAt: new Date(),
      });
      setLoading(false);
    }
  }, [user, profile]);

  return {
    settings,
    loading,
    userZipCode,
    userState,
    intelligenceEnabled: settings?.enabled ?? true,
    contributionEnabled: settings?.contributionEnabled ?? true,
  };
}

/**
 * Hook for material prices
 */
export function useMaterialPrices() {
  const [prices, setPrices] = useState<MaterialPriceIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllMaterialPrices();
      setPrices(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch material prices'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const getPrice = useCallback(
    (material: MaterialType): MaterialPriceIndex | null => {
      return prices.find((p) => p.material === material) || null;
    },
    [prices]
  );

  return {
    prices,
    loading,
    error,
    refresh: fetchPrices,
    getPrice,
  };
}

/**
 * Hook for top material price movers
 */
export function useTopMaterialMovers(limit: number = 5) {
  const [movers, setMovers] = useState<MaterialPriceIndex[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getTopMovers(limit);
        setMovers(data);
      } catch (e) {
        console.error('Failed to fetch top movers:', e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [limit]);

  return { movers, loading };
}

/**
 * Hook for material price alerts
 */
export function useMaterialAlerts(thresholdPercent: number = 5) {
  const [alerts, setAlerts] = useState<
    Array<{
      material: MaterialType;
      displayName: string;
      change: number;
      direction: 'up' | 'down';
      period: '7d' | '30d';
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await checkPriceAlerts(thresholdPercent);
        setAlerts(data);
      } catch (e) {
        console.error('Failed to check price alerts:', e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [thresholdPercent]);

  return { alerts, loading };
}

/**
 * Hook for labor rates
 */
export function useLaborRates(state?: string) {
  const [rates, setRates] = useState<LaborRateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllLaborRates(state);
      setRates(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch labor rates'));
    } finally {
      setLoading(false);
    }
  }, [state]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const getRate = useCallback(
    (trade: LaborTradeCategory): LaborRateData | null => {
      return rates.find((r) => r.trade === trade) || null;
    },
    [rates]
  );

  return {
    rates,
    loading,
    error,
    refresh: fetchRates,
    getRate,
  };
}

/**
 * Hook for getting a price suggestion for a line item
 */
export function usePriceSuggestion(
  description: string,
  trade?: LaborTradeCategory,
  projectType?: BenchmarkProjectType,
  zipCode?: string
): { suggestion: PriceSuggestion | null; loading: boolean } {
  const [suggestion, setSuggestion] = useState<PriceSuggestion | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!description || description.length < 3) {
      setSuggestion(null);
      return;
    }

    // Debounce the suggestion fetch
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        // In production, this would call a Cloud Function that queries
        // the intelligence database for similar line items
        const generated = await generateSuggestion(description, trade, projectType, zipCode);
        setSuggestion(generated);
      } catch (e) {
        console.error('Failed to get price suggestion:', e);
        setSuggestion(null);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [description, trade, projectType, zipCode]);

  return { suggestion, loading };
}

/**
 * Generate a price suggestion (placeholder implementation)
 * In production, this would query the intelligence database
 */
async function generateSuggestion(
  description: string,
  trade?: LaborTradeCategory,
  projectType?: BenchmarkProjectType,
  zipCode?: string
): Promise<PriceSuggestion | null> {
  // Normalize description for matching
  const normalized = description.toLowerCase().trim();

  // Sample suggestions based on common line items
  // In production, this would query Firestore for similar items
  const sampleSuggestions: Record<string, { low: number; median: number; high: number }> = {
    'drywall installation': { low: 1.50, median: 2.25, high: 3.50 },
    'drywall': { low: 1.50, median: 2.25, high: 3.50 },
    'framing': { low: 8.00, median: 12.00, high: 18.00 },
    'hardwood flooring': { low: 6.00, median: 10.00, high: 16.00 },
    'flooring': { low: 4.00, median: 7.00, high: 12.00 },
    'tile': { low: 5.00, median: 10.00, high: 18.00 },
    'painting': { low: 2.00, median: 3.50, high: 6.00 },
    'paint': { low: 2.00, median: 3.50, high: 6.00 },
    'electrical': { low: 80.00, median: 125.00, high: 200.00 },
    'plumbing': { low: 100.00, median: 150.00, high: 250.00 },
    'cabinet': { low: 150.00, median: 300.00, high: 600.00 },
    'countertop': { low: 40.00, median: 75.00, high: 150.00 },
    'roofing': { low: 4.00, median: 6.50, high: 12.00 },
    'window': { low: 300.00, median: 500.00, high: 900.00 },
    'door': { low: 200.00, median: 400.00, high: 800.00 },
    'hvac': { low: 3000.00, median: 5500.00, high: 10000.00 },
    'insulation': { low: 1.00, median: 1.75, high: 3.00 },
  };

  // Find matching suggestion
  let matchedSuggestion: { low: number; median: number; high: number } | null = null;
  let matchedTerm = '';

  for (const [term, prices] of Object.entries(sampleSuggestions)) {
    if (normalized.includes(term)) {
      matchedSuggestion = prices;
      matchedTerm = term;
      break;
    }
  }

  if (!matchedSuggestion) {
    return null;
  }

  // Apply regional adjustment if ZIP provided
  let adjustment = 1.0;
  if (zipCode) {
    const state = getStateFromZipPrefix(zipCode.substring(0, 3));
    // Simple regional adjustments
    if (state && ['CA', 'NY', 'MA', 'WA'].includes(state)) {
      adjustment = 1.15;
    } else if (state && ['TX', 'FL', 'GA', 'NC'].includes(state)) {
      adjustment = 0.95;
    }
  }

  const adjusted = {
    low: matchedSuggestion.low * adjustment,
    median: matchedSuggestion.median * adjustment,
    high: matchedSuggestion.high * adjustment,
  };

  // Determine confidence based on how specific the match was
  let confidence: SuggestionConfidence = 'medium';
  let dataPoints = 15;

  if (normalized === matchedTerm) {
    confidence = 'high';
    dataPoints = 35;
  } else if (normalized.length > matchedTerm.length + 10) {
    confidence = 'low';
    dataPoints = 8;
  }

  return {
    suggestedPrice: adjusted.median,
    priceRange: adjusted,
    confidence,
    dataPoints,
    factors: [
      {
        type: 'regional_avg',
        description: `Based on ${dataPoints} similar projects${zipCode ? ' in your area' : ''}`,
        impact: 'neutral',
      },
      ...(adjustment !== 1.0
        ? [
            {
              type: 'regional_avg' as const,
              description: `Regional adjustment applied (${adjustment > 1 ? '+' : ''}${Math.round((adjustment - 1) * 100)}%)`,
              impact: adjustment > 1 ? ('negative' as const) : ('positive' as const),
            },
          ]
        : []),
    ],
    source: 'market_benchmark',
    timestamp: new Date(),
  };
}

/**
 * Hook for market benchmarks
 */
export function useMarketBenchmark(
  projectType: BenchmarkProjectType,
  zipCodePrefix?: string
): { benchmark: MarketBenchmark | null; loading: boolean } {
  const [benchmark, setBenchmark] = useState<MarketBenchmark | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        // In production, this would fetch from Firestore
        // For now, generate sample data
        const state = zipCodePrefix
          ? getStateFromZipPrefix(zipCodePrefix)
          : null;

        const sampleBenchmark: MarketBenchmark = {
          id: `${projectType}_${zipCodePrefix || 'national'}`,
          projectType,
          zipCodePrefix: zipCodePrefix || '',
          region: 'national',
          squareFootCost: {
            low: 80,
            median: 150,
            high: 250,
            veryHigh: 400,
          },
          totalProjectCost: {
            low: 15000,
            median: 35000,
            high: 75000,
          },
          duration: {
            avgDays: 21,
            stdDev: 7,
            range: { min: 10, max: 45 },
          },
          commonLineItems: [],
          laborToMaterialRatio: 0.55,
          changeOrderFrequency: 0.35,
          avgChangeOrderPercent: 12,
          sampleSize: 47,
          minSampleSize: MIN_SAMPLE_SIZE,
          lastUpdated: new Date(),
          confidenceLevel: 'high',
        };

        setBenchmark(sampleBenchmark);
      } catch (e) {
        console.error('Failed to fetch benchmark:', e);
        setBenchmark(null);
      } finally {
        setLoading(false);
      }
    }

    fetch();
  }, [projectType, zipCodePrefix]);

  return { benchmark, loading };
}

/**
 * Estimate Confidence Data type
 */
export interface EstimateConfidenceResult {
  overallScore: number;
  itemsWithData: number;
  totalItems: number;
  marketComparison?: {
    low: number;
    median: number;
    high: number;
    estimateTotal: number;
  };
  priceAlerts?: Array<{
    material: string;
    changePercent: number;
    direction: 'up' | 'down';
    lastUpdated: Date;
  }>;
  factors?: Array<{
    label: string;
    status: 'positive' | 'warning' | 'negative';
    description?: string;
  }>;
  sampleSize?: number;
}

interface EstimateLineItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
  trade?: string;
}

/**
 * Hook for calculating estimate confidence score
 */
export function useEstimateConfidence(
  lineItems: EstimateLineItem[],
  projectType?: BenchmarkProjectType,
  zipCode?: string
): { confidence: EstimateConfidenceResult | null; loading: boolean } {
  const [confidence, setConfidence] = useState<EstimateConfidenceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const { alerts } = useMaterialAlerts(5);

  useEffect(() => {
    if (!lineItems || lineItems.length === 0) {
      setConfidence(null);
      setLoading(false);
      return;
    }

    async function calculateConfidence() {
      setLoading(true);
      try {
        // Calculate how many line items have data
        let itemsWithData = 0;
        let totalScore = 0;

        for (const item of lineItems) {
          // Check if we can generate a suggestion for this item
          const suggestion = await generateSuggestion(
            item.description,
            undefined,
            projectType,
            zipCode
          );
          if (suggestion) {
            itemsWithData++;
            // Score based on confidence level
            totalScore += suggestion.confidence === 'high' ? 100 : suggestion.confidence === 'medium' ? 70 : 40;
          }
        }

        // Calculate overall score
        const coverage = lineItems.length > 0 ? itemsWithData / lineItems.length : 0;
        const avgItemScore = itemsWithData > 0 ? totalScore / itemsWithData : 0;
        const overallScore = Math.round((coverage * 0.4 + avgItemScore / 100 * 0.6) * 100);

        // Calculate estimate total
        const estimateTotal = lineItems.reduce((sum, item) => sum + (item.total || 0), 0);

        // Generate factors
        const factors: EstimateConfidenceResult['factors'] = [];

        if (coverage >= 0.8) {
          factors.push({
            label: 'High data coverage',
            status: 'positive',
            description: `${Math.round(coverage * 100)}% of line items have market data`,
          });
        } else if (coverage >= 0.5) {
          factors.push({
            label: 'Partial data coverage',
            status: 'warning',
            description: `${Math.round(coverage * 100)}% of line items have market data`,
          });
        } else {
          factors.push({
            label: 'Limited data coverage',
            status: 'negative',
            description: `Only ${Math.round(coverage * 100)}% of line items have market data`,
          });
        }

        if (zipCode) {
          factors.push({
            label: 'Regional pricing applied',
            status: 'positive',
            description: `Using market data for ZIP ${zipCode.substring(0, 3)}XX`,
          });
        }

        // Convert material alerts
        const priceAlerts = alerts.map((a) => ({
          material: a.displayName,
          changePercent: a.change,
          direction: a.direction,
          lastUpdated: new Date(),
        }));

        // Create market comparison (sample data)
        const marketComparison = estimateTotal > 0
          ? {
              low: Math.round(estimateTotal * 0.75),
              median: Math.round(estimateTotal * 0.95),
              high: Math.round(estimateTotal * 1.25),
              estimateTotal,
            }
          : undefined;

        setConfidence({
          overallScore,
          itemsWithData,
          totalItems: lineItems.length,
          marketComparison,
          priceAlerts: priceAlerts.length > 0 ? priceAlerts : undefined,
          factors,
          sampleSize: itemsWithData * 5, // Approximate sample size
        });
      } catch (e) {
        console.error('Failed to calculate estimate confidence:', e);
        setConfidence(null);
      } finally {
        setLoading(false);
      }
    }

    calculateConfidence();
  }, [lineItems, projectType, zipCode, alerts]);

  return { confidence, loading };
}
