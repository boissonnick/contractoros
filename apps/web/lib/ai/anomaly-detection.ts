/**
 * Anomaly Detection Utilities - Sprint 37B
 *
 * Statistical methods for detecting anomalies in financial and operational data:
 * - Z-score analysis for normally distributed data
 * - IQR (Interquartile Range) for outlier detection
 * - Trend analysis with linear regression
 * - Percentage-based threshold detection
 * - Peer comparison utilities
 */

import type {
  AIInsightSeverity,
  AnomalyDetectionResult,
  TrendAnalysisResult,
  TrendDirection,
  MetricStatistics,
} from '@/types';

// ===========================================
// STATISTICAL UTILITIES
// ===========================================

/**
 * Calculate basic statistics for a dataset
 */
export function calculateStatistics(values: number[]): MetricStatistics {
  if (values.length === 0) {
    return {
      current: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      q1: 0,
      q3: 0,
      iqr: 0,
      count: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const count = values.length;
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / count;

  // Calculate median
  const median = count % 2 === 0
    ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
    : sorted[Math.floor(count / 2)];

  // Calculate standard deviation
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((acc, val) => acc + val, 0) / count;
  const stdDev = Math.sqrt(avgSquaredDiff);

  // Calculate quartiles
  const q1Index = Math.floor(count * 0.25);
  const q3Index = Math.floor(count * 0.75);
  const q1 = sorted[q1Index] ?? 0;
  const q3 = sorted[q3Index] ?? 0;
  const iqr = q3 - q1;

  return {
    current: values[values.length - 1] ?? 0,
    mean,
    median,
    stdDev,
    min: sorted[0] ?? 0,
    max: sorted[count - 1] ?? 0,
    q1,
    q3,
    iqr,
    count,
  };
}

/**
 * Calculate Z-score for a value given mean and standard deviation
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

// ===========================================
// Z-SCORE ANOMALY DETECTION
// ===========================================

/**
 * Sensitivity thresholds for Z-score detection
 */
const ZSCORE_THRESHOLDS = {
  low: { warning: 3.0, critical: 4.0 },
  medium: { warning: 2.5, critical: 3.5 },
  high: { warning: 2.0, critical: 3.0 },
} as const;

/**
 * Detect anomaly using Z-score method
 * Good for normally distributed data
 */
export function detectAnomalyZScore(
  value: number,
  historicalValues: number[],
  sensitivity: 'low' | 'medium' | 'high' = 'medium'
): AnomalyDetectionResult {
  const stats = calculateStatistics(historicalValues);
  const zScore = calculateZScore(value, stats.mean, stats.stdDev);
  const absZScore = Math.abs(zScore);
  const thresholds = ZSCORE_THRESHOLDS[sensitivity];

  const percentageDeviation = stats.mean !== 0
    ? ((value - stats.mean) / Math.abs(stats.mean)) * 100
    : 0;

  let severity: AIInsightSeverity = 'info';
  let isAnomaly = false;

  if (absZScore >= thresholds.critical) {
    severity = 'critical';
    isAnomaly = true;
  } else if (absZScore >= thresholds.warning) {
    severity = 'warning';
    isAnomaly = true;
  }

  return {
    isAnomaly,
    value,
    expectedValue: stats.mean,
    deviation: zScore,
    percentageDeviation,
    direction: value >= stats.mean ? 'above' : 'below',
    severity,
    method: 'zscore',
  };
}

// ===========================================
// IQR ANOMALY DETECTION
// ===========================================

/**
 * IQR multipliers for different sensitivity levels
 */
const IQR_MULTIPLIERS = {
  low: 2.0,    // More lenient (allows wider range)
  medium: 1.5, // Standard Tukey fence
  high: 1.0,   // More sensitive
} as const;

/**
 * Detect anomaly using IQR (Interquartile Range) method
 * Good for skewed data and outlier detection
 */
export function detectAnomalyIQR(
  value: number,
  historicalValues: number[],
  sensitivity: 'low' | 'medium' | 'high' = 'medium'
): AnomalyDetectionResult {
  const stats = calculateStatistics(historicalValues);
  const multiplier = IQR_MULTIPLIERS[sensitivity];

  const lowerFence = stats.q1 - multiplier * stats.iqr;
  const upperFence = stats.q3 + multiplier * stats.iqr;

  const isAnomaly = value < lowerFence || value > upperFence;
  const direction: 'above' | 'below' = value >= stats.median ? 'above' : 'below';

  // Calculate deviation in terms of IQR units
  let deviation: number;
  if (value > upperFence) {
    deviation = (value - upperFence) / stats.iqr;
  } else if (value < lowerFence) {
    deviation = (lowerFence - value) / stats.iqr;
  } else {
    deviation = 0;
  }

  const percentageDeviation = stats.median !== 0
    ? ((value - stats.median) / Math.abs(stats.median)) * 100
    : 0;

  // Determine severity based on how far beyond the fence
  let severity: AIInsightSeverity = 'info';
  if (isAnomaly) {
    if (deviation >= 1.5) {
      severity = 'critical';
    } else if (deviation >= 0.5) {
      severity = 'warning';
    }
  }

  return {
    isAnomaly,
    value,
    expectedValue: stats.median,
    deviation,
    percentageDeviation,
    direction,
    severity,
    method: 'iqr',
  };
}

// ===========================================
// PERCENTAGE THRESHOLD DETECTION
// ===========================================

/**
 * Percentage thresholds for different sensitivity levels
 */
const PERCENTAGE_THRESHOLDS = {
  low: { warning: 30, critical: 50 },
  medium: { warning: 20, critical: 40 },
  high: { warning: 10, critical: 25 },
} as const;

/**
 * Detect anomaly based on percentage deviation from a baseline
 * Good for budget variance and target comparisons
 */
export function detectAnomalyPercentage(
  value: number,
  baseline: number,
  sensitivity: 'low' | 'medium' | 'high' = 'medium'
): AnomalyDetectionResult {
  const thresholds = PERCENTAGE_THRESHOLDS[sensitivity];

  const percentageDeviation = baseline !== 0
    ? ((value - baseline) / Math.abs(baseline)) * 100
    : 0;

  const absDeviation = Math.abs(percentageDeviation);

  let severity: AIInsightSeverity = 'info';
  let isAnomaly = false;

  if (absDeviation >= thresholds.critical) {
    severity = 'critical';
    isAnomaly = true;
  } else if (absDeviation >= thresholds.warning) {
    severity = 'warning';
    isAnomaly = true;
  }

  return {
    isAnomaly,
    value,
    expectedValue: baseline,
    deviation: percentageDeviation / 100, // Normalize to decimal
    percentageDeviation,
    direction: value >= baseline ? 'above' : 'below',
    severity,
    method: 'percentage',
  };
}

// ===========================================
// THRESHOLD-BASED DETECTION
// ===========================================

/**
 * Detect anomaly based on fixed thresholds
 * Good for business rules like "margin should be > 10%"
 */
export function detectAnomalyThreshold(
  value: number,
  options: {
    warningLow?: number;
    warningHigh?: number;
    criticalLow?: number;
    criticalHigh?: number;
    expectedValue?: number;
  }
): AnomalyDetectionResult {
  const { warningLow, warningHigh, criticalLow, criticalHigh, expectedValue } = options;

  let severity: AIInsightSeverity = 'info';
  let isAnomaly = false;
  let direction: 'above' | 'below' = 'above';

  // Check critical thresholds first
  if (criticalLow !== undefined && value < criticalLow) {
    severity = 'critical';
    isAnomaly = true;
    direction = 'below';
  } else if (criticalHigh !== undefined && value > criticalHigh) {
    severity = 'critical';
    isAnomaly = true;
    direction = 'above';
  }
  // Then check warning thresholds
  else if (warningLow !== undefined && value < warningLow) {
    severity = 'warning';
    isAnomaly = true;
    direction = 'below';
  } else if (warningHigh !== undefined && value > warningHigh) {
    severity = 'warning';
    isAnomaly = true;
    direction = 'above';
  }

  const expected = expectedValue ?? (warningLow ?? 0 + (warningHigh ?? 0)) / 2;
  const percentageDeviation = expected !== 0
    ? ((value - expected) / Math.abs(expected)) * 100
    : 0;

  return {
    isAnomaly,
    value,
    expectedValue: expected,
    deviation: 0, // Not applicable for threshold method
    percentageDeviation,
    direction,
    severity,
    method: 'threshold',
  };
}

// ===========================================
// TREND ANALYSIS
// ===========================================

/**
 * Perform linear regression on time series data
 */
function linearRegression(values: number[]): { slope: number; intercept: number; rSquared: number } {
  const n = values.length;
  if (n < 2) {
    return { slope: 0, intercept: values[0] ?? 0, rSquared: 0 };
  }

  // X values are just indices (0, 1, 2, ...)
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((sum, val) => sum + val, 0) / n;

  let numerator = 0;
  let denominator = 0;
  let ssRes = 0;
  let ssTot = 0;

  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += Math.pow(i - xMean, 2);
    ssTot += Math.pow(values[i] - yMean, 2);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  // Calculate R-squared
  for (let i = 0; i < n; i++) {
    const predicted = intercept + slope * i;
    ssRes += Math.pow(values[i] - predicted, 2);
  }

  const rSquared = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

  return { slope, intercept, rSquared };
}

/**
 * Analyze trend in a time series
 */
export function analyzeTrend(
  values: number[],
  options: {
    periodLabel?: string;
    forecastPeriods?: number;
  } = {}
): TrendAnalysisResult {
  const { periodLabel = 'period', forecastPeriods = 1 } = options;

  if (values.length < 2) {
    return {
      direction: 'stable',
      changePercentage: 0,
      slope: 0,
      rSquared: 0,
      dataPoints: values.length,
      periodLabel,
    };
  }

  const { slope, intercept, rSquared } = linearRegression(values);

  // Calculate percentage change from first to last
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const changePercentage = firstValue !== 0
    ? ((lastValue - firstValue) / Math.abs(firstValue)) * 100
    : 0;

  // Determine trend direction
  let direction: TrendDirection;
  const absChangePercent = Math.abs(changePercentage);

  // Consider volatility (R-squared indicates how well the trend fits)
  if (rSquared < 0.3) {
    // Poor fit suggests volatility or no clear trend
    direction = absChangePercent > 20 ? 'volatile' : 'stable';
  } else {
    // Good fit, clear trend
    if (absChangePercent < 5) {
      direction = 'stable';
    } else if (slope > 0) {
      direction = 'improving';
    } else {
      direction = 'declining';
    }
  }

  // Forecast if requested
  let forecastValue: number | undefined;
  if (forecastPeriods > 0 && rSquared > 0.5) {
    forecastValue = intercept + slope * (values.length - 1 + forecastPeriods);
  }

  return {
    direction,
    changePercentage,
    slope,
    rSquared,
    dataPoints: values.length,
    periodLabel,
    forecastValue,
    forecastPeriod: forecastPeriods > 0 ? `+${forecastPeriods} ${periodLabel}s` : undefined,
  };
}

// ===========================================
// PEER COMPARISON
// ===========================================

/**
 * Result of comparing a value to peers
 */
export interface PeerComparisonResult {
  value: number;
  peerMean: number;
  peerMedian: number;
  percentile: number;  // 0-100
  rank: number;
  totalPeers: number;
  deviation: number;  // Standard deviations from peer mean
  isOutlier: boolean;
  performance: 'top' | 'above_average' | 'average' | 'below_average' | 'bottom';
}

/**
 * Compare a value against a set of peer values
 */
export function compareToPeers(value: number, peerValues: number[]): PeerComparisonResult {
  if (peerValues.length === 0) {
    return {
      value,
      peerMean: 0,
      peerMedian: 0,
      percentile: 50,
      rank: 1,
      totalPeers: 0,
      deviation: 0,
      isOutlier: false,
      performance: 'average',
    };
  }

  const allValues = [...peerValues, value].sort((a, b) => b - a); // Descending
  const stats = calculateStatistics(peerValues);

  const rank = allValues.indexOf(value) + 1;
  const totalPeers = peerValues.length;
  const percentile = ((totalPeers - rank + 1) / (totalPeers + 1)) * 100;

  const deviation = calculateZScore(value, stats.mean, stats.stdDev);
  const isOutlier = Math.abs(deviation) > 2;

  // Determine performance category
  let performance: PeerComparisonResult['performance'];
  if (percentile >= 90) {
    performance = 'top';
  } else if (percentile >= 60) {
    performance = 'above_average';
  } else if (percentile >= 40) {
    performance = 'average';
  } else if (percentile >= 10) {
    performance = 'below_average';
  } else {
    performance = 'bottom';
  }

  return {
    value,
    peerMean: stats.mean,
    peerMedian: stats.median,
    percentile,
    rank,
    totalPeers,
    deviation,
    isOutlier,
    performance,
  };
}

// ===========================================
// COMBINED ANOMALY DETECTION
// ===========================================

/**
 * Options for combined anomaly detection
 */
export interface CombinedDetectionOptions {
  sensitivity?: 'low' | 'medium' | 'high';
  methods?: ('zscore' | 'iqr' | 'percentage')[];
  baseline?: number;  // For percentage method
  requireUnanimous?: boolean;  // All methods must agree
}

/**
 * Run multiple detection methods and combine results
 * Returns the most severe result by default, or unanimous result if specified
 */
export function detectAnomalyCombined(
  value: number,
  historicalValues: number[],
  options: CombinedDetectionOptions = {}
): AnomalyDetectionResult {
  const {
    sensitivity = 'medium',
    methods = ['zscore', 'iqr'],
    baseline,
    requireUnanimous = false,
  } = options;

  const results: AnomalyDetectionResult[] = [];

  if (methods.includes('zscore')) {
    results.push(detectAnomalyZScore(value, historicalValues, sensitivity));
  }

  if (methods.includes('iqr')) {
    results.push(detectAnomalyIQR(value, historicalValues, sensitivity));
  }

  if (methods.includes('percentage') && baseline !== undefined) {
    results.push(detectAnomalyPercentage(value, baseline, sensitivity));
  }

  if (results.length === 0) {
    // Default to Z-score
    return detectAnomalyZScore(value, historicalValues, sensitivity);
  }

  if (requireUnanimous) {
    // All methods must agree it's an anomaly
    const allAgree = results.every(r => r.isAnomaly);
    if (!allAgree) {
      return {
        ...results[0],
        isAnomaly: false,
        severity: 'info',
      };
    }
  }

  // Return the most severe result
  const severityOrder: AIInsightSeverity[] = ['info', 'warning', 'critical'];
  return results.reduce((most, current) => {
    const mostIdx = severityOrder.indexOf(most.severity);
    const currentIdx = severityOrder.indexOf(current.severity);
    return currentIdx > mostIdx ? current : most;
  });
}

// ===========================================
// UTILITY EXPORTS
// ===========================================

export {
  ZSCORE_THRESHOLDS,
  IQR_MULTIPLIERS,
  PERCENTAGE_THRESHOLDS,
};
