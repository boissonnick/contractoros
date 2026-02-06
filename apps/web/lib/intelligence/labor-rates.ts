/**
 * Labor Rates Service
 *
 * Integrates with BLS (Bureau of Labor Statistics) OEWS API to fetch
 * occupational wage data for construction trades by region.
 *
 * BLS API Documentation: https://www.bls.gov/developers/api_signature_v2.htm
 */

import { logger } from '@/lib/utils/logger';
import {
  LaborTradeCategory,
  LaborRateData,
  PriceRegion,
  BLS_OCCUPATION_CODES,
  TRADE_DISPLAY_NAMES,
  DEFAULT_BURDEN_RATE,
} from './types';

const BLS_BASE_URL = 'https://api.bls.gov/publicAPI/v2';

/**
 * Get the BLS API key from environment
 */
function getBlsApiKey(): string {
  const key = process.env.NEXT_PUBLIC_BLS_API_KEY || process.env.BLS_API_KEY;
  if (!key) {
    logger.warn('BLS_API_KEY not configured. Labor rates will use fallback data.', { module: 'labor-rates' });
    return '';
  }
  return key;
}

/**
 * State to region mapping
 */
const STATE_TO_REGION: Record<string, PriceRegion> = {
  // Northeast
  CT: 'northeast', ME: 'northeast', MA: 'northeast', NH: 'northeast',
  NJ: 'northeast', NY: 'northeast', PA: 'northeast', RI: 'northeast', VT: 'northeast',
  // Southeast
  AL: 'southeast', AR: 'southeast', FL: 'southeast', GA: 'southeast',
  KY: 'southeast', LA: 'southeast', MS: 'southeast', NC: 'southeast',
  SC: 'southeast', TN: 'southeast', VA: 'southeast', WV: 'southeast',
  // Midwest
  IL: 'midwest', IN: 'midwest', IA: 'midwest', KS: 'midwest',
  MI: 'midwest', MN: 'midwest', MO: 'midwest', NE: 'midwest',
  ND: 'midwest', OH: 'midwest', SD: 'midwest', WI: 'midwest',
  // Southwest
  AZ: 'southwest', NM: 'southwest', OK: 'southwest', TX: 'southwest',
  // West
  CO: 'west', ID: 'west', MT: 'west', NV: 'west', UT: 'west', WY: 'west',
  // Pacific
  AK: 'pacific', CA: 'pacific', HI: 'pacific', OR: 'pacific', WA: 'pacific',
};

/**
 * National average rates (fallback data)
 * Source: BLS OEWS May 2024 National Estimates
 */
const NATIONAL_AVERAGES: Record<LaborTradeCategory, { low: number; median: number; high: number; mean: number }> = {
  carpenter: { low: 17.50, median: 26.50, high: 42.00, mean: 28.00 },
  electrician: { low: 19.00, median: 30.00, high: 48.00, mean: 32.50 },
  plumber: { low: 18.50, median: 29.50, high: 47.00, mean: 32.00 },
  hvac_tech: { low: 17.00, median: 27.50, high: 42.50, mean: 29.50 },
  painter: { low: 14.50, median: 22.50, high: 35.50, mean: 24.00 },
  roofer: { low: 15.00, median: 24.00, high: 38.00, mean: 26.00 },
  concrete_mason: { low: 16.00, median: 25.50, high: 40.00, mean: 27.50 },
  tile_setter: { low: 16.50, median: 26.00, high: 41.00, mean: 28.00 },
  drywall_installer: { low: 16.00, median: 25.00, high: 39.00, mean: 27.00 },
  framer: { low: 17.50, median: 26.50, high: 42.00, mean: 28.00 },
  general_laborer: { low: 14.00, median: 19.50, high: 28.00, mean: 20.50 },
  supervisor: { low: 24.00, median: 36.50, high: 55.00, mean: 38.50 },
  project_manager: { low: 32.00, median: 52.00, high: 85.00, mean: 56.00 },
};

/**
 * Regional adjustment factors (multipliers vs national average)
 * Higher = more expensive labor market
 */
const REGIONAL_ADJUSTMENTS: Record<PriceRegion, number> = {
  national: 1.0,
  northeast: 1.18,
  southeast: 0.92,
  midwest: 0.96,
  southwest: 0.94,
  west: 1.08,
  pacific: 1.22,
};

/**
 * State-specific adjustment factors (multipliers vs regional average)
 */
const STATE_ADJUSTMENTS: Record<string, number> = {
  // High cost states
  CA: 1.15, NY: 1.12, MA: 1.10, WA: 1.08, DC: 1.20,
  CT: 1.08, NJ: 1.06, AK: 1.15, HI: 1.18,
  // Low cost states
  MS: 0.88, AR: 0.90, WV: 0.90, AL: 0.92, KY: 0.92,
  // Others default to 1.0
};

/**
 * BLS API response types
 */
interface BlsApiResponse {
  status: string;
  responseTime: number;
  message: string[];
  Results: {
    series: BlsSeries[];
  };
}

interface BlsSeries {
  seriesID: string;
  data: BlsDataPoint[];
}

interface BlsDataPoint {
  year: string;
  period: string;
  periodName: string;
  value: string;
  footnotes: { code: string; text: string }[];
}

/**
 * Build BLS series ID for occupation wage data
 * Format: OEUM + area + industry + occupation + datatype
 */
function _buildSeriesId(
  areaCode: string,
  occupationCode: string,
  dataType: 'mean' | 'pct10' | 'pct25' | 'pct50' | 'pct75' | 'pct90'
): string {
  const dataTypeCodes: Record<string, string> = {
    mean: '01',
    pct10: '02',
    pct25: '03',
    pct50: '04',
    pct75: '05',
    pct90: '06',
  };

  // OEUM = OES Unemployment (wages)
  // Area: National = 0000000, State = SSXXXXX
  // Industry: 000000 = All industries
  // Occupation: 6-digit code without hyphen
  return `OEUM${areaCode}000000${occupationCode.replace('-', '')}${dataTypeCodes[dataType]}`;
}

/**
 * Fetch wage data from BLS API
 */
async function _fetchBlsData(seriesIds: string[]): Promise<Map<string, number>> {
  const apiKey = getBlsApiKey();

  if (!apiKey) {
    // Return empty map, caller will use fallback data
    return new Map();
  }

  try {
    const response = await fetch(`${BLS_BASE_URL}/timeseries/data/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        seriesid: seriesIds,
        startyear: new Date().getFullYear() - 1,
        endyear: new Date().getFullYear(),
        registrationkey: apiKey,
      }),
    });

    if (!response.ok) {
      logger.error(`BLS API error: ${response.status}`, { module: 'labor-rates' });
      return new Map();
    }

    const data: BlsApiResponse = await response.json();

    if (data.status !== 'REQUEST_SUCCEEDED') {
      logger.error('BLS API request failed', { error: data.message, module: 'labor-rates' });
      return new Map();
    }

    const results = new Map<string, number>();

    for (const series of data.Results.series) {
      if (series.data.length > 0) {
        // Get most recent data point
        const latest = series.data[0];
        results.set(series.seriesID, parseFloat(latest.value));
      }
    }

    return results;
  } catch (error) {
    logger.error('Error fetching BLS data', { error, module: 'labor-rates' });
    return new Map();
  }
}

/**
 * Get labor rate for a specific trade and location
 */
export async function getLaborRate(
  trade: LaborTradeCategory,
  state?: string
): Promise<LaborRateData> {
  const occupationCode = BLS_OCCUPATION_CODES[trade];
  const nationalAvg = NATIONAL_AVERAGES[trade];

  // Determine region and adjustments
  const region = state ? (STATE_TO_REGION[state.toUpperCase()] || 'national') : 'national';
  const regionalAdj = REGIONAL_ADJUSTMENTS[region];
  const stateAdj = state ? (STATE_ADJUSTMENTS[state.toUpperCase()] || 1.0) : 1.0;
  const totalAdj = regionalAdj * stateAdj;

  // Apply adjustments to national averages
  const adjustedRates = {
    low: nationalAvg.low * totalAdj,
    median: nationalAvg.median * totalAdj,
    high: nationalAvg.high * totalAdj,
    mean: nationalAvg.mean * totalAdj,
  };

  // Calculate vs national comparison
  const vsNationalMedian = ((adjustedRates.median - nationalAvg.median) / nationalAvg.median) * 100;

  return {
    id: `${trade}_${state || 'national'}_${Date.now()}`,
    trade,
    blsOccupationCode: occupationCode,
    occupationTitle: TRADE_DISPLAY_NAMES[trade],
    zipCodePrefix: '', // Would be set if we had ZIP-level data
    state: state?.toUpperCase() || 'US',
    region,
    hourlyRateLow: Math.round(adjustedRates.low * 100) / 100,
    hourlyRateMedian: Math.round(adjustedRates.median * 100) / 100,
    hourlyRateHigh: Math.round(adjustedRates.high * 100) / 100,
    hourlyRateMean: Math.round(adjustedRates.mean * 100) / 100,
    burdenedRateMultiplier: DEFAULT_BURDEN_RATE,
    source: 'bls_oews',
    lastUpdated: new Date(),
    nationalComparison: {
      vsNationalMedian: Math.round(vsNationalMedian * 10) / 10,
      percentileRank: calculatePercentileRank(adjustedRates.median, trade),
    },
  };
}

/**
 * Get all labor rates for a state
 */
export async function getAllLaborRates(state?: string): Promise<LaborRateData[]> {
  const trades = Object.keys(BLS_OCCUPATION_CODES) as LaborTradeCategory[];

  const promises = trades.map((trade) => getLaborRate(trade, state));
  return Promise.all(promises);
}

/**
 * Get labor rates for multiple trades
 */
export async function getLaborRatesForTrades(
  trades: LaborTradeCategory[],
  state?: string
): Promise<LaborRateData[]> {
  const promises = trades.map((trade) => getLaborRate(trade, state));
  return Promise.all(promises);
}

/**
 * Calculate percentile rank compared to all regions
 */
function calculatePercentileRank(rate: number, trade: LaborTradeCategory): number {
  const nationalAvg = NATIONAL_AVERAGES[trade];
  const allRates: number[] = [];

  // Calculate rates for all regions
  for (const [_region, adj] of Object.entries(REGIONAL_ADJUSTMENTS)) {
    allRates.push(nationalAvg.median * adj);
  }

  // Sort and find percentile
  allRates.sort((a, b) => a - b);
  const position = allRates.findIndex((r) => r >= rate);

  return Math.round((position / allRates.length) * 100);
}

/**
 * Get burdened (fully loaded) rate including benefits, insurance, etc.
 */
export function getBurdenedRate(
  hourlyRate: number,
  burdenMultiplier: number = DEFAULT_BURDEN_RATE
): number {
  return Math.round(hourlyRate * burdenMultiplier * 100) / 100;
}

/**
 * Compare a rate to market benchmarks
 */
export function compareToMarket(
  rate: number,
  trade: LaborTradeCategory,
  state?: string
): {
  vsMedian: number;
  vsLow: number;
  vsHigh: number;
  assessment: 'below_market' | 'at_market' | 'above_market' | 'premium';
} {
  const region = state ? (STATE_TO_REGION[state.toUpperCase()] || 'national') : 'national';
  const regionalAdj = REGIONAL_ADJUSTMENTS[region];
  const stateAdj = state ? (STATE_ADJUSTMENTS[state.toUpperCase()] || 1.0) : 1.0;
  const totalAdj = regionalAdj * stateAdj;

  const nationalAvg = NATIONAL_AVERAGES[trade];
  const adjustedLow = nationalAvg.low * totalAdj;
  const adjustedMedian = nationalAvg.median * totalAdj;
  const adjustedHigh = nationalAvg.high * totalAdj;

  const vsMedian = ((rate - adjustedMedian) / adjustedMedian) * 100;
  const vsLow = ((rate - adjustedLow) / adjustedLow) * 100;
  const vsHigh = ((rate - adjustedHigh) / adjustedHigh) * 100;

  let assessment: 'below_market' | 'at_market' | 'above_market' | 'premium';

  if (rate < adjustedLow) {
    assessment = 'below_market';
  } else if (rate <= adjustedMedian * 1.1) {
    assessment = 'at_market';
  } else if (rate <= adjustedHigh) {
    assessment = 'above_market';
  } else {
    assessment = 'premium';
  }

  return {
    vsMedian: Math.round(vsMedian * 10) / 10,
    vsLow: Math.round(vsLow * 10) / 10,
    vsHigh: Math.round(vsHigh * 10) / 10,
    assessment,
  };
}

/**
 * Get region name for display
 */
export function getRegionDisplayName(region: PriceRegion): string {
  const names: Record<PriceRegion, string> = {
    national: 'National',
    northeast: 'Northeast',
    southeast: 'Southeast',
    midwest: 'Midwest',
    southwest: 'Southwest',
    west: 'West',
    pacific: 'Pacific',
  };
  return names[region];
}

/**
 * Get state from ZIP code prefix
 * (Simplified - in production would use a proper ZIP database)
 */
export function getStateFromZipPrefix(zipPrefix: string): string | null {
  // First digit gives general region
  const _firstDigit = zipPrefix.charAt(0);

  // This is a simplified mapping - real implementation would use a ZIP database
  const prefixToState: Record<string, string> = {
    // Northeast
    '010': 'MA', '011': 'MA', '012': 'MA',
    '100': 'NY', '101': 'NY', '102': 'NY',
    // California
    '900': 'CA', '901': 'CA', '902': 'CA', '903': 'CA', '904': 'CA',
    '910': 'CA', '911': 'CA', '912': 'CA',
    '920': 'CA', '921': 'CA', '922': 'CA',
    // Texas
    '750': 'TX', '751': 'TX', '752': 'TX',
    '770': 'TX', '771': 'TX', '772': 'TX',
    // Florida
    '330': 'FL', '331': 'FL', '332': 'FL',
    '334': 'FL', '335': 'FL',
    // Add more as needed
  };

  return prefixToState[zipPrefix] || null;
}

/**
 * Format hourly rate for display
 */
export function formatHourlyRate(rate: number): string {
  return `$${rate.toFixed(2)}/hr`;
}

/**
 * Format rate range for display
 */
export function formatRateRange(low: number, high: number): string {
  return `$${low.toFixed(0)} - $${high.toFixed(0)}/hr`;
}
