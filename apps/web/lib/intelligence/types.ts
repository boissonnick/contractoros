/**
 * ContractorOS Intelligence Types
 *
 * Type definitions for the AI-powered construction intelligence system.
 * These types support material pricing, labor rates, market benchmarks,
 * and AI-powered suggestions throughout the platform.
 */

// ============================================================================
// MATERIAL PRICING
// ============================================================================

/**
 * Material types tracked by the intelligence system.
 * These map to FRED series codes for price index data.
 */
export type MaterialType =
  | 'lumber_framing'
  | 'lumber_plywood'
  | 'lumber_treated'
  | 'steel_structural'
  | 'steel_rebar'
  | 'steel_studs'
  | 'cement_portland'
  | 'concrete_ready_mix'
  | 'copper_wire'
  | 'copper_pipe'
  | 'drywall'
  | 'insulation_fiberglass'
  | 'insulation_foam'
  | 'roofing_shingles'
  | 'roofing_metal'
  | 'paint'
  | 'pvc_pipe'
  | 'hvac_equipment';

/**
 * Material category for grouping in UI
 */
export type MaterialCategory =
  | 'lumber'
  | 'steel'
  | 'concrete'
  | 'copper'
  | 'drywall'
  | 'insulation'
  | 'roofing'
  | 'finishes'
  | 'plumbing'
  | 'hvac'
  | 'electrical';

/**
 * Geographic region for pricing data
 */
export type PriceRegion =
  | 'national'
  | 'northeast'
  | 'southeast'
  | 'midwest'
  | 'southwest'
  | 'west'
  | 'pacific';

/**
 * Data source for price information
 */
export type PriceSource =
  | 'fred'           // Federal Reserve Economic Data
  | 'bls'            // Bureau of Labor Statistics
  | 'procore'        // Procore material tracker
  | 'user_aggregate' // Aggregated from user data
  | 'manual';        // Manually entered

/**
 * Material price index from FRED or other sources
 */
export interface MaterialPriceIndex {
  id: string;
  material: MaterialType;
  category: MaterialCategory;
  displayName: string;
  pricePerUnit: number;
  unit: string;                    // 'MBF', 'ton', 'cwt', 'sqft', etc.
  region: PriceRegion;
  source: PriceSource;
  fredSeriesId?: string;           // FRED series code if applicable
  timestamp: Date;
  percentChange7d: number;
  percentChange30d: number;
  percentChange90d: number;
  percentChangeYTD: number;
  historicalData?: MaterialPricePoint[];
  volatilityScore?: number;        // 0-100, higher = more volatile
}

export interface MaterialPricePoint {
  date: Date;
  price: number;
}

/**
 * Material price alert configuration
 */
export interface MaterialPriceAlert {
  id: string;
  orgId: string;
  material: MaterialType;
  alertType: 'increase' | 'decrease' | 'any';
  thresholdPercent: number;        // Alert when change exceeds this %
  enabled: boolean;
  lastTriggered?: Date;
  createdAt: Date;
}

// ============================================================================
// LABOR RATES
// ============================================================================

/**
 * Trade categories for labor rate tracking
 * These map to BLS occupation codes
 */
export type LaborTradeCategory =
  | 'carpenter'
  | 'electrician'
  | 'plumber'
  | 'hvac_tech'
  | 'painter'
  | 'roofer'
  | 'concrete_mason'
  | 'tile_setter'
  | 'drywall_installer'
  | 'framer'
  | 'general_laborer'
  | 'supervisor'
  | 'project_manager';

/**
 * Source of labor rate data
 */
export type LaborRateSource =
  | 'bls_oews'        // BLS Occupational Employment and Wage Statistics
  | 'davis_bacon'     // Davis-Bacon prevailing wage rates
  | 'state_prevailing' // State-specific prevailing wage
  | 'user_aggregate'  // Aggregated from user time tracking
  | 'manual';

/**
 * Regional labor rate data
 */
export interface LaborRateData {
  id: string;
  trade: LaborTradeCategory;
  blsOccupationCode?: string;      // e.g., '47-2031' for carpenters
  occupationTitle: string;
  zipCodePrefix: string;           // First 3 digits of ZIP
  state: string;                   // State abbreviation
  region: PriceRegion;
  hourlyRateLow: number;           // 10th percentile
  hourlyRateMedian: number;        // 50th percentile
  hourlyRateHigh: number;          // 90th percentile
  hourlyRateMean: number;          // Average
  burdenedRateMultiplier: number;  // e.g., 1.35 for 35% burden
  source: LaborRateSource;
  sampleSize?: number;             // For user aggregates
  lastUpdated: Date;
  nationalComparison: {
    vsNationalMedian: number;      // % difference from national
    percentileRank: number;        // Where this area ranks nationally
  };
}

/**
 * Davis-Bacon wage determination
 */
export interface DavisBaconRate {
  id: string;
  county: string;
  state: string;
  trade: string;
  classification: string;
  basicHourlyRate: number;
  fringeRate: number;
  totalRate: number;
  effectiveDate: Date;
  expirationDate?: Date;
  wageDecisionNumber: string;
}

// ============================================================================
// MARKET BENCHMARKS
// ============================================================================

/**
 * Project type categories for benchmarking
 */
export type BenchmarkProjectType =
  | 'bathroom_remodel'
  | 'kitchen_remodel'
  | 'basement_finish'
  | 'room_addition'
  | 'deck_patio'
  | 'roofing'
  | 'siding'
  | 'window_replacement'
  | 'flooring'
  | 'painting_interior'
  | 'painting_exterior'
  | 'electrical_upgrade'
  | 'plumbing_repipe'
  | 'hvac_replacement'
  | 'new_construction_residential'
  | 'new_construction_commercial'
  | 'tenant_improvement'
  | 'custom';

/**
 * Market benchmark data (aggregated from user data)
 */
export interface MarketBenchmark {
  id: string;
  projectType: BenchmarkProjectType;
  zipCodePrefix: string;           // First 3 digits
  region: PriceRegion;
  squareFootCost: {
    low: number;                   // 25th percentile
    median: number;                // 50th percentile
    high: number;                  // 75th percentile
    veryHigh: number;              // 90th percentile
  };
  totalProjectCost: {
    low: number;
    median: number;
    high: number;
  };
  duration: {
    avgDays: number;
    stdDev: number;
    range: { min: number; max: number };
  };
  commonLineItems: LineItemBenchmark[];
  laborToMaterialRatio: number;    // e.g., 0.6 means 60% labor, 40% materials
  changeOrderFrequency: number;    // % of projects with change orders
  avgChangeOrderPercent: number;   // Avg % increase from change orders
  sampleSize: number;
  minSampleSize: number;           // Minimum required to show
  lastUpdated: Date;
  confidenceLevel: 'high' | 'medium' | 'low';
}

/**
 * Benchmark data for individual line items
 */
export interface LineItemBenchmark {
  description: string;
  normalizedDescription: string;   // Cleaned/standardized version
  trade: LaborTradeCategory;
  category: MaterialCategory | 'labor' | 'equipment' | 'other';
  unitCostLow: number;
  unitCostMedian: number;
  unitCostHigh: number;
  unit: string;
  frequency: number;               // % of projects that include this item
  sampleSize: number;
}

// ============================================================================
// AI SUGGESTIONS
// ============================================================================

/**
 * Confidence level for AI suggestions
 */
export type SuggestionConfidence = 'high' | 'medium' | 'low' | 'insufficient_data';

/**
 * AI-generated price suggestion for line items
 */
export interface PriceSuggestion {
  suggestedPrice: number;
  priceRange: {
    low: number;
    median: number;
    high: number;
  };
  confidence: SuggestionConfidence;
  dataPoints: number;              // Number of data points used
  factors: SuggestionFactor[];     // Explanation of what influenced suggestion
  source: 'market_benchmark' | 'user_history' | 'material_index' | 'hybrid';
  timestamp: Date;
}

export interface SuggestionFactor {
  type: 'regional_avg' | 'material_trend' | 'historical' | 'seasonal' | 'project_type';
  description: string;             // Human-readable explanation
  impact: 'positive' | 'negative' | 'neutral';
  value?: number;                  // Numerical impact if applicable
}

/**
 * Estimate confidence score
 */
export interface EstimateConfidence {
  overallScore: number;            // 0-100
  confidence: SuggestionConfidence;
  factors: ConfidenceFactor[];
  marketPosition: {
    percentile: number;            // Where this estimate falls vs market
    comparison: 'below_market' | 'at_market' | 'above_market';
    vsMedianPercent: number;       // % difference from median
  };
  risks: EstimateRisk[];
  recommendations: string[];
}

export interface ConfidenceFactor {
  category: 'data_availability' | 'price_volatility' | 'market_alignment' | 'completeness';
  score: number;                   // 0-100
  description: string;
  details?: string;
}

export interface EstimateRisk {
  type: 'material_volatility' | 'thin_margin' | 'scope_complexity' | 'market_outlier' | 'missing_items';
  severity: 'high' | 'medium' | 'low';
  description: string;
  recommendation?: string;
}

// ============================================================================
// BID INTELLIGENCE
// ============================================================================

/**
 * Analysis of a subcontractor bid compared to benchmarks
 */
export interface BidAnalysis {
  bidId: string;
  subcontractorId: string;
  trade: LaborTradeCategory;
  bidAmount: number;
  marketComparison: {
    vsMarketLow: number;           // % difference
    vsMarketMedian: number;
    vsMarketHigh: number;
    percentile: number;            // Where this bid ranks
    verdict: 'competitive' | 'high' | 'low' | 'outlier';
  };
  historicalComparison?: {
    vsSubAverage: number;          // % diff from this sub's typical bid
    vsSubPrevious: number;         // % diff from their last similar bid
    priceDirection: 'increasing' | 'decreasing' | 'stable';
  };
  otherBidsComparison?: {
    rank: number;                  // 1 = lowest
    totalBids: number;
    vsLowest: number;              // % higher than lowest
    vsHighest: number;             // % lower than highest
  };
  subPerformanceScore?: number;    // 0-100 based on past work
  recommendations: string[];
  timestamp: Date;
}

// ============================================================================
// USER DATA CONTRIBUTION
// ============================================================================

/**
 * Anonymized estimate data for aggregation
 * All identifying information is stripped before storage
 */
export interface AnonymizedEstimateData {
  id: string;
  projectType: BenchmarkProjectType;
  zipCodePrefix: string;           // Only first 3 digits
  region: PriceRegion;
  squareFootage?: number;
  totalAmount: number;
  lineItems: AnonymizedLineItem[];
  status: 'draft' | 'sent' | 'approved' | 'declined';
  createdAt: Date;
  approvedAt?: Date;
}

export interface AnonymizedLineItem {
  normalizedDescription: string;   // Standardized description
  trade: LaborTradeCategory;
  category: MaterialCategory | 'labor' | 'equipment' | 'other';
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

/**
 * Anonymized bid data for aggregation
 */
export interface AnonymizedBidData {
  id: string;
  trade: LaborTradeCategory;
  projectType: BenchmarkProjectType;
  zipCodePrefix: string;
  bidAmount: number;
  squareFootage?: number;
  status: 'pending' | 'accepted' | 'rejected';
  submittedAt: Date;
}

// ============================================================================
// INTELLIGENCE SETTINGS
// ============================================================================

/**
 * User/org intelligence preferences
 */
export interface IntelligenceSettings {
  orgId: string;
  enabled: boolean;
  contributionEnabled: boolean;    // Opt-in to contribute data
  showSuggestions: boolean;
  showMaterialAlerts: boolean;
  showBidAnalysis: boolean;
  zipCodeOverride?: string;        // Override auto-detected ZIP
  preferredRegion?: PriceRegion;
  alertThresholdPercent: number;   // Default threshold for price alerts
  updatedAt: Date;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * FRED series codes for material prices
 */
export const FRED_SERIES_CODES: Record<MaterialType, string> = {
  lumber_framing: 'WPU0811',
  lumber_plywood: 'WPU0831',
  lumber_treated: 'WPU0815',
  steel_structural: 'WPU1017',
  steel_rebar: 'WPU101706',
  steel_studs: 'WPU1012',
  cement_portland: 'WPU1321',
  concrete_ready_mix: 'PCU327320327320',
  copper_wire: 'WPU10220601',
  copper_pipe: 'WPU10220611',
  drywall: 'WPU1392',
  insulation_fiberglass: 'WPU1393',
  insulation_foam: 'PCU3279903279901',
  roofing_shingles: 'WPU1391',
  roofing_metal: 'WPU1071',
  paint: 'WPU0621',
  pvc_pipe: 'WPU072104',
  hvac_equipment: 'WPU1141',
};

/**
 * BLS occupation codes for construction trades
 */
export const BLS_OCCUPATION_CODES: Record<LaborTradeCategory, string> = {
  carpenter: '47-2031',
  electrician: '47-2111',
  plumber: '47-2152',
  hvac_tech: '49-9021',
  painter: '47-2141',
  roofer: '47-2181',
  concrete_mason: '47-2051',
  tile_setter: '47-2044',
  drywall_installer: '47-2081',
  framer: '47-2031',           // Same as carpenter
  general_laborer: '47-2061',
  supervisor: '47-1011',
  project_manager: '11-9021',
};

/**
 * Material display names
 */
export const MATERIAL_DISPLAY_NAMES: Record<MaterialType, string> = {
  lumber_framing: 'Framing Lumber',
  lumber_plywood: 'Plywood',
  lumber_treated: 'Pressure Treated Lumber',
  steel_structural: 'Structural Steel',
  steel_rebar: 'Rebar',
  steel_studs: 'Steel Studs',
  cement_portland: 'Portland Cement',
  concrete_ready_mix: 'Ready-Mix Concrete',
  copper_wire: 'Copper Wire',
  copper_pipe: 'Copper Pipe',
  drywall: 'Drywall',
  insulation_fiberglass: 'Fiberglass Insulation',
  insulation_foam: 'Foam Insulation',
  roofing_shingles: 'Asphalt Shingles',
  roofing_metal: 'Metal Roofing',
  paint: 'Paint',
  pvc_pipe: 'PVC Pipe',
  hvac_equipment: 'HVAC Equipment',
};

/**
 * Trade display names
 */
export const TRADE_DISPLAY_NAMES: Record<LaborTradeCategory, string> = {
  carpenter: 'Carpenter',
  electrician: 'Electrician',
  plumber: 'Plumber',
  hvac_tech: 'HVAC Technician',
  painter: 'Painter',
  roofer: 'Roofer',
  concrete_mason: 'Concrete Mason',
  tile_setter: 'Tile Setter',
  drywall_installer: 'Drywall Installer',
  framer: 'Framer',
  general_laborer: 'General Laborer',
  supervisor: 'Construction Supervisor',
  project_manager: 'Project Manager',
};

/**
 * Project type display names
 */
export const PROJECT_TYPE_DISPLAY_NAMES: Record<BenchmarkProjectType, string> = {
  bathroom_remodel: 'Bathroom Remodel',
  kitchen_remodel: 'Kitchen Remodel',
  basement_finish: 'Basement Finish',
  room_addition: 'Room Addition',
  deck_patio: 'Deck/Patio',
  roofing: 'Roofing',
  siding: 'Siding',
  window_replacement: 'Window Replacement',
  flooring: 'Flooring',
  painting_interior: 'Interior Painting',
  painting_exterior: 'Exterior Painting',
  electrical_upgrade: 'Electrical Upgrade',
  plumbing_repipe: 'Plumbing Repipe',
  hvac_replacement: 'HVAC Replacement',
  new_construction_residential: 'New Residential Construction',
  new_construction_commercial: 'New Commercial Construction',
  tenant_improvement: 'Tenant Improvement',
  custom: 'Custom Project',
};

/**
 * Confidence level thresholds
 */
export const CONFIDENCE_THRESHOLDS = {
  high: { minDataPoints: 20, maxVariance: 0.15 },
  medium: { minDataPoints: 10, maxVariance: 0.25 },
  low: { minDataPoints: 5, maxVariance: 0.40 },
};

/**
 * Minimum sample size for showing benchmarks
 */
export const MIN_SAMPLE_SIZE = 5;

/**
 * Default burden rate multiplier (benefits, insurance, etc.)
 */
export const DEFAULT_BURDEN_RATE = 1.35;
