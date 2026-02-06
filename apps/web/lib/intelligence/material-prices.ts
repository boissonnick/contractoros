/**
 * Material Prices Service
 *
 * Integrates with FRED (Federal Reserve Economic Data) API to fetch
 * current and historical material price indices for construction materials.
 *
 * FRED API Documentation: https://fred.stlouisfed.org/docs/api/fred/
 */

import {
  MaterialType,
  MaterialPriceIndex,
  MaterialPricePoint,
  MaterialCategory,
  FRED_SERIES_CODES,
  MATERIAL_DISPLAY_NAMES,
} from './types';
import { logger } from '@/lib/utils/logger';

const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';

/**
 * Get the FRED API key from environment
 */
function getFredApiKey(): string {
  const key = process.env.NEXT_PUBLIC_FRED_API_KEY || process.env.FRED_API_KEY;
  if (!key) {
    logger.warn('FRED_API_KEY not configured. Material prices will not be available.', { component: 'intelligence-material-prices' });
    return '';
  }
  return key;
}

/**
 * Map material types to their categories
 */
const MATERIAL_CATEGORIES: Record<MaterialType, MaterialCategory> = {
  lumber_framing: 'lumber',
  lumber_plywood: 'lumber',
  lumber_treated: 'lumber',
  steel_structural: 'steel',
  steel_rebar: 'steel',
  steel_studs: 'steel',
  cement_portland: 'concrete',
  concrete_ready_mix: 'concrete',
  copper_wire: 'copper',
  copper_pipe: 'copper',
  drywall: 'drywall',
  insulation_fiberglass: 'insulation',
  insulation_foam: 'insulation',
  roofing_shingles: 'roofing',
  roofing_metal: 'roofing',
  paint: 'finishes',
  pvc_pipe: 'plumbing',
  hvac_equipment: 'hvac',
};

/**
 * Default units for each material type
 */
const MATERIAL_UNITS: Record<MaterialType, string> = {
  lumber_framing: 'MBF',           // Thousand Board Feet
  lumber_plywood: 'MSF',           // Thousand Square Feet
  lumber_treated: 'MBF',
  steel_structural: 'ton',
  steel_rebar: 'ton',
  steel_studs: 'cwt',              // Hundred Weight
  cement_portland: 'ton',
  concrete_ready_mix: 'cu yd',
  copper_wire: 'lb',
  copper_pipe: 'lb',
  drywall: 'MSF',
  insulation_fiberglass: 'MSF',
  insulation_foam: 'bd ft',
  roofing_shingles: 'square',
  roofing_metal: 'sq ft',
  paint: 'gallon',
  pvc_pipe: 'lb',
  hvac_equipment: 'unit',
};

/**
 * FRED API response types
 */
interface FredSeriesResponse {
  realtime_start: string;
  realtime_end: string;
  observation_start: string;
  observation_end: string;
  units: string;
  output_type: number;
  file_type: string;
  order_by: string;
  sort_order: string;
  count: number;
  offset: number;
  limit: number;
  observations: FredObservation[];
}

interface FredObservation {
  realtime_start: string;
  realtime_end: string;
  date: string;
  value: string;
}

/**
 * Fetch observations for a FRED series
 */
async function fetchFredSeries(
  seriesId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<FredObservation[]> {
  const apiKey = getFredApiKey();
  if (!apiKey) {
    return [];
  }

  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: 'json',
    sort_order: 'desc',
  });

  if (options?.startDate) {
    params.append('observation_start', formatDate(options.startDate));
  }
  if (options?.endDate) {
    params.append('observation_end', formatDate(options.endDate));
  }
  if (options?.limit) {
    params.append('limit', options.limit.toString());
  }

  try {
    const response = await fetch(
      `${FRED_BASE_URL}/series/observations?${params.toString()}`
    );

    if (!response.ok) {
      logger.error('FRED API error: ${response.status} ${response.statusText}', { component: 'intelligence-material-prices' });
      return [];
    }

    const data: FredSeriesResponse = await response.json();
    return data.observations.filter((obs) => obs.value !== '.');
  } catch (error) {
    logger.error('Error fetching FRED data', { error: error, component: 'intelligence-material-prices' });
    return [];
  }
}

/**
 * Format date for FRED API (YYYY-MM-DD)
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate percent change between two values
 */
function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Get date N days ago
 */
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Fetch current price for a single material type
 */
export async function getMaterialPrice(
  material: MaterialType
): Promise<MaterialPriceIndex | null> {
  const seriesId = FRED_SERIES_CODES[material];
  if (!seriesId) {
    logger.warn('No FRED series ID for material: ${material}', { component: 'intelligence-material-prices' });
    return null;
  }

  // Fetch last year of data to calculate changes
  const observations = await fetchFredSeries(seriesId, {
    startDate: daysAgo(365),
    limit: 365,
  });

  if (observations.length === 0) {
    return null;
  }

  const currentObs = observations[0];
  const currentPrice = parseFloat(currentObs.value);

  // Find observations for change calculations
  const obs7d = findObservationNearDate(observations, daysAgo(7));
  const obs30d = findObservationNearDate(observations, daysAgo(30));
  const obs90d = findObservationNearDate(observations, daysAgo(90));
  const obsYTD = findObservationNearDate(observations, new Date(new Date().getFullYear(), 0, 1));

  const historicalData: MaterialPricePoint[] = observations
    .slice(0, 90) // Last 90 data points
    .reverse()
    .map((obs) => ({
      date: new Date(obs.date),
      price: parseFloat(obs.value),
    }));

  return {
    id: `${material}_${Date.now()}`,
    material,
    category: MATERIAL_CATEGORIES[material],
    displayName: MATERIAL_DISPLAY_NAMES[material],
    pricePerUnit: currentPrice,
    unit: MATERIAL_UNITS[material],
    region: 'national',
    source: 'fred',
    fredSeriesId: seriesId,
    timestamp: new Date(currentObs.date),
    percentChange7d: obs7d ? calculatePercentChange(currentPrice, parseFloat(obs7d.value)) : 0,
    percentChange30d: obs30d ? calculatePercentChange(currentPrice, parseFloat(obs30d.value)) : 0,
    percentChange90d: obs90d ? calculatePercentChange(currentPrice, parseFloat(obs90d.value)) : 0,
    percentChangeYTD: obsYTD ? calculatePercentChange(currentPrice, parseFloat(obsYTD.value)) : 0,
    historicalData,
    volatilityScore: calculateVolatility(historicalData),
  };
}

/**
 * Find observation closest to a target date
 */
function findObservationNearDate(
  observations: FredObservation[],
  targetDate: Date
): FredObservation | null {
  const targetTime = targetDate.getTime();

  let closest: FredObservation | null = null;
  let closestDiff = Infinity;

  for (const obs of observations) {
    const obsDate = new Date(obs.date);
    const diff = Math.abs(obsDate.getTime() - targetTime);
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = obs;
    }
  }

  // Only return if within 7 days of target
  if (closest && closestDiff < 7 * 24 * 60 * 60 * 1000) {
    return closest;
  }

  return null;
}

/**
 * Calculate volatility score (0-100) based on historical price variance
 */
function calculateVolatility(historicalData: MaterialPricePoint[]): number {
  if (historicalData.length < 10) return 0;

  const prices = historicalData.map((d) => d.price);
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const coeffOfVariation = stdDev / mean;

  // Map coefficient of variation to 0-100 score
  // CV of 0.1 (10%) = score of 50, CV of 0.2+ = 100
  return Math.min(100, Math.round(coeffOfVariation * 500));
}

/**
 * Fetch all material prices
 */
export async function getAllMaterialPrices(): Promise<MaterialPriceIndex[]> {
  const materials = Object.keys(FRED_SERIES_CODES) as MaterialType[];

  const promises = materials.map((material) => getMaterialPrice(material));
  const results = await Promise.all(promises);

  return results.filter((r): r is MaterialPriceIndex => r !== null);
}

/**
 * Fetch prices for a specific category
 */
export async function getMaterialPricesByCategory(
  category: MaterialCategory
): Promise<MaterialPriceIndex[]> {
  const materials = (Object.keys(MATERIAL_CATEGORIES) as MaterialType[]).filter(
    (m) => MATERIAL_CATEGORIES[m] === category
  );

  const promises = materials.map((material) => getMaterialPrice(material));
  const results = await Promise.all(promises);

  return results.filter((r): r is MaterialPriceIndex => r !== null);
}

/**
 * Get historical price data for charting
 */
export async function getMaterialPriceHistory(
  material: MaterialType,
  months: number = 12
): Promise<MaterialPricePoint[]> {
  const seriesId = FRED_SERIES_CODES[material];
  if (!seriesId) return [];

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const observations = await fetchFredSeries(seriesId, {
    startDate,
    limit: months * 30,
  });

  return observations
    .filter((obs) => obs.value !== '.')
    .map((obs) => ({
      date: new Date(obs.date),
      price: parseFloat(obs.value),
    }))
    .reverse();
}

/**
 * Check for significant price changes that should trigger alerts
 */
export async function checkPriceAlerts(
  thresholdPercent: number = 5
): Promise<
  Array<{
    material: MaterialType;
    displayName: string;
    change: number;
    direction: 'up' | 'down';
    period: '7d' | '30d';
  }>
> {
  const allPrices = await getAllMaterialPrices();
  const alerts: Array<{
    material: MaterialType;
    displayName: string;
    change: number;
    direction: 'up' | 'down';
    period: '7d' | '30d';
  }> = [];

  for (const price of allPrices) {
    // Check 7-day changes
    if (Math.abs(price.percentChange7d) >= thresholdPercent) {
      alerts.push({
        material: price.material,
        displayName: price.displayName,
        change: price.percentChange7d,
        direction: price.percentChange7d > 0 ? 'up' : 'down',
        period: '7d',
      });
    }
    // Check 30-day changes
    else if (Math.abs(price.percentChange30d) >= thresholdPercent * 2) {
      alerts.push({
        material: price.material,
        displayName: price.displayName,
        change: price.percentChange30d,
        direction: price.percentChange30d > 0 ? 'up' : 'down',
        period: '30d',
      });
    }
  }

  return alerts;
}

/**
 * Get top movers (biggest price changes)
 */
export async function getTopMovers(
  limit: number = 5
): Promise<MaterialPriceIndex[]> {
  const allPrices = await getAllMaterialPrices();

  return allPrices
    .sort((a, b) => Math.abs(b.percentChange30d) - Math.abs(a.percentChange30d))
    .slice(0, limit);
}

/**
 * Format price change for display
 */
export function formatPriceChange(change: number): {
  text: string;
  color: 'green' | 'red' | 'gray';
  arrow: '↑' | '↓' | '→';
} {
  if (Math.abs(change) < 0.5) {
    return { text: 'Stable', color: 'gray', arrow: '→' };
  }

  const isUp = change > 0;
  return {
    text: `${isUp ? '+' : ''}${change.toFixed(1)}%`,
    color: isUp ? 'red' : 'green', // Higher prices = red (bad for contractors)
    arrow: isUp ? '↑' : '↓',
  };
}
