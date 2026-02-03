/**
 * Bid Intelligence Service
 *
 * Provides bid analysis, subcontractor scoring, and market comparison
 * to help contractors make better decisions on subcontractor selection.
 */

import {
  Bid,
  Subcontractor,
  SubAssignment,
  BidAnalysis,
  BidMarketComparison,
  BidHistoryComparison,
  BidComparisonRating,
  BidFlag,
  SubcontractorIntelligence,
  SubcontractorScoreBreakdown,
  SubcontractorScoreCategory,
  BidRecommendation,
  SUBCONTRACTOR_SCORE_CATEGORIES,
} from '@/types';

// Market rate data by trade (simplified - would come from actual data in production)
const TRADE_MARKET_RATES: Record<string, { low: number; average: number; high: number; unit: string }> = {
  electrical: { low: 65, average: 85, high: 120, unit: 'per hour' },
  plumbing: { low: 70, average: 90, high: 130, unit: 'per hour' },
  hvac: { low: 75, average: 95, high: 140, unit: 'per hour' },
  carpentry: { low: 45, average: 65, high: 95, unit: 'per hour' },
  roofing: { low: 350, average: 450, high: 600, unit: 'per square' },
  painting: { low: 2, average: 3.5, high: 5, unit: 'per sq ft' },
  drywall: { low: 1.5, average: 2.5, high: 4, unit: 'per sq ft' },
  flooring: { low: 3, average: 5, high: 8, unit: 'per sq ft' },
  concrete: { low: 4, average: 6, high: 10, unit: 'per sq ft' },
  masonry: { low: 12, average: 18, high: 28, unit: 'per sq ft' },
  landscaping: { low: 50, average: 75, high: 110, unit: 'per hour' },
  insulation: { low: 1, average: 1.5, high: 2.5, unit: 'per sq ft' },
  siding: { low: 5, average: 8, high: 12, unit: 'per sq ft' },
  windows: { low: 300, average: 500, high: 800, unit: 'per window' },
  general: { low: 50, average: 70, high: 100, unit: 'per hour' },
};

/**
 * Analyze a bid against market rates and historical data
 */
export function analyzeBid(
  bid: Bid,
  sub: Subcontractor,
  allBidsForProject: Bid[],
  subHistory: { bids: Bid[]; assignments: SubAssignment[] }
): BidAnalysis {
  const trade = sub.trade.toLowerCase();
  const marketRates = TRADE_MARKET_RATES[trade] || TRADE_MARKET_RATES.general;

  // Market comparison
  const marketComparison = calculateMarketComparison(bid.amount, marketRates, trade);

  // History comparison (if sub has previous bids)
  const historyComparison = subHistory.bids.length > 0
    ? calculateHistoryComparison(bid.amount, subHistory.bids)
    : undefined;

  // Competitor comparison (other bids for same project/scope)
  const competitorBids = allBidsForProject.filter(b => b.id !== bid.id && b.status !== 'withdrawn');
  const competitorComparison = competitorBids.length > 0
    ? calculateCompetitorComparison(bid.amount, competitorBids)
    : undefined;

  // Generate flags
  const flags = generateBidFlags(bid, marketComparison, historyComparison, competitorComparison, sub);

  // Calculate overall score
  const overallScore = calculateBidScore(marketComparison, historyComparison, competitorComparison, sub.metrics);

  // Generate recommendation
  const recommendation = getRecommendation(overallScore, flags);

  return {
    id: `analysis_${bid.id}`,
    bidId: bid.id,
    projectId: bid.projectId,
    subId: bid.subId,
    trade: sub.trade,
    analyzedAt: new Date(),
    marketComparison,
    historyComparison,
    competitorComparison,
    overallScore,
    flags,
    recommendation,
  };
}

/**
 * Calculate how a bid compares to market rates
 */
function calculateMarketComparison(
  amount: number,
  marketRates: { low: number; average: number; high: number },
  trade: string
): BidMarketComparison {
  // Note: In production, this would normalize by project scope/size
  // For now, we use a simplified approach
  const range = marketRates.high - marketRates.low;
  const position = (amount - marketRates.low) / range;
  const percentileRank = Math.min(100, Math.max(0, position * 100));

  let rating: BidComparisonRating;
  let recommendation: string;

  if (percentileRank <= 20) {
    rating = 'excellent';
    recommendation = 'This bid is significantly below market average - excellent value if the sub has good track record.';
  } else if (percentileRank <= 40) {
    rating = 'good';
    recommendation = 'This bid is below market average - good value proposition.';
  } else if (percentileRank <= 60) {
    rating = 'fair';
    recommendation = 'This bid is at market rate - fair and competitive pricing.';
  } else if (percentileRank <= 80) {
    rating = 'high';
    recommendation = 'This bid is above market average - consider negotiating or getting more bids.';
  } else {
    rating = 'very_high';
    recommendation = 'This bid is significantly above market - strongly consider alternatives unless justified by quality.';
  }

  return {
    bidAmount: amount,
    marketLow: marketRates.low,
    marketAverage: marketRates.average,
    marketHigh: marketRates.high,
    percentileRank,
    rating,
    recommendation,
  };
}

/**
 * Calculate how bid compares to sub's historical bids
 */
function calculateHistoryComparison(amount: number, historicalBids: Bid[]): BidHistoryComparison {
  const amounts = historicalBids.map(b => b.amount);
  const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const lowest = Math.min(...amounts);
  const highest = Math.max(...amounts);
  const percentChange = ((amount - average) / average) * 100;

  // Determine trend based on recent bids
  const recentBids = historicalBids
    .filter(b => b.submittedAt)
    .sort((a, b) => (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0))
    .slice(0, 5);

  let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
  if (recentBids.length >= 3) {
    const recentAmounts = recentBids.map(b => b.amount);
    const firstHalf = recentAmounts.slice(0, Math.floor(recentAmounts.length / 2));
    const secondHalf = recentAmounts.slice(Math.floor(recentAmounts.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const trendPct = ((firstAvg - secondAvg) / secondAvg) * 100;

    if (trendPct > 5) trend = 'increasing';
    else if (trendPct < -5) trend = 'decreasing';
  }

  return {
    bidAmount: amount,
    subAverageBid: average,
    subLowestBid: lowest,
    subHighestBid: highest,
    totalBidsFromSub: historicalBids.length,
    percentChange,
    trend,
  };
}

/**
 * Calculate how bid compares to other bids received
 */
function calculateCompetitorComparison(amount: number, otherBids: Bid[]) {
  const allAmounts = [...otherBids.map(b => b.amount), amount].sort((a, b) => a - b);
  const rank = allAmounts.indexOf(amount) + 1;
  const average = allAmounts.reduce((a, b) => a + b, 0) / allAmounts.length;

  return {
    totalBidsReceived: allAmounts.length,
    rank,
    averageOfAllBids: average,
    lowestBid: allAmounts[0],
    highestBid: allAmounts[allAmounts.length - 1],
  };
}

/**
 * Generate warning/info flags for a bid
 */
function generateBidFlags(
  bid: Bid,
  marketComparison: BidMarketComparison,
  historyComparison: BidHistoryComparison | undefined,
  competitorComparison: { rank: number; totalBidsReceived: number } | undefined,
  sub: Subcontractor
): BidFlag[] {
  const flags: BidFlag[] = [];

  // Market-based flags
  if (marketComparison.rating === 'excellent') {
    flags.push({
      type: 'positive',
      code: 'BELOW_MARKET',
      message: 'Bid is significantly below market rate',
    });
  } else if (marketComparison.rating === 'very_high') {
    flags.push({
      type: 'warning',
      code: 'ABOVE_MARKET',
      message: 'Bid is significantly above market rate',
    });
  }

  // History-based flags
  if (historyComparison) {
    if (historyComparison.percentChange > 20) {
      flags.push({
        type: 'warning',
        code: 'PRICE_INCREASE',
        message: `${Math.round(historyComparison.percentChange)}% higher than sub's typical bid`,
      });
    } else if (historyComparison.percentChange < -20) {
      flags.push({
        type: 'info',
        code: 'PRICE_DECREASE',
        message: `${Math.round(Math.abs(historyComparison.percentChange))}% lower than sub's typical bid - verify scope understanding`,
      });
    }
  }

  // Competitor-based flags
  if (competitorComparison) {
    if (competitorComparison.rank === 1 && competitorComparison.totalBidsReceived >= 3) {
      flags.push({
        type: 'positive',
        code: 'LOWEST_BID',
        message: `Lowest of ${competitorComparison.totalBidsReceived} bids received`,
      });
    }
  }

  // Sub metrics flags
  if (sub.metrics.onTimeRate < 70) {
    flags.push({
      type: 'warning',
      code: 'LOW_RELIABILITY',
      message: `Sub has ${sub.metrics.onTimeRate}% on-time completion rate`,
    });
  }
  if (sub.metrics.avgRating >= 4.5) {
    flags.push({
      type: 'positive',
      code: 'HIGH_RATING',
      message: `Excellent rating: ${sub.metrics.avgRating}/5 stars`,
    });
  } else if (sub.metrics.avgRating < 3) {
    flags.push({
      type: 'warning',
      code: 'LOW_RATING',
      message: `Below average rating: ${sub.metrics.avgRating}/5 stars`,
    });
  }

  // Document flags
  if (sub.insuranceExpiry && new Date(sub.insuranceExpiry) < new Date()) {
    flags.push({
      type: 'warning',
      code: 'INSURANCE_EXPIRED',
      message: 'Insurance has expired - verify coverage before awarding',
    });
  }

  // Bid expiration flag
  if (bid.expiresAt && new Date(bid.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
    flags.push({
      type: 'info',
      code: 'EXPIRING_SOON',
      message: 'Bid expires within 7 days',
    });
  }

  return flags;
}

/**
 * Calculate overall bid score (0-100)
 */
function calculateBidScore(
  marketComparison: BidMarketComparison,
  historyComparison: BidHistoryComparison | undefined,
  competitorComparison: { rank: number; totalBidsReceived: number; averageOfAllBids: number } | undefined,
  subMetrics: { onTimeRate: number; avgRating: number; projectsCompleted: number }
): number {
  let score = 50; // Start at neutral

  // Price score (40% weight)
  const priceScore = 100 - marketComparison.percentileRank;
  score += (priceScore - 50) * 0.4;

  // Sub quality score (35% weight)
  const qualityScore = (subMetrics.onTimeRate * 0.5) + (subMetrics.avgRating * 20 * 0.5);
  score += (qualityScore - 50) * 0.35;

  // Experience score (15% weight)
  const experienceScore = Math.min(100, subMetrics.projectsCompleted * 10);
  score += (experienceScore - 50) * 0.15;

  // Competitor ranking (10% weight)
  if (competitorComparison && competitorComparison.totalBidsReceived > 1) {
    const rankScore = 100 - ((competitorComparison.rank - 1) / (competitorComparison.totalBidsReceived - 1)) * 100;
    score += (rankScore - 50) * 0.1;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get recommendation based on score and flags
 */
function getRecommendation(
  score: number,
  flags: BidFlag[]
): 'strongly_recommend' | 'recommend' | 'neutral' | 'caution' | 'avoid' {
  const warningCount = flags.filter(f => f.type === 'warning').length;
  const positiveCount = flags.filter(f => f.type === 'positive').length;

  // Critical warnings override score
  const hasCriticalWarning = flags.some(f =>
    f.code === 'INSURANCE_EXPIRED' || f.code === 'LOW_RATING'
  );

  if (hasCriticalWarning) return 'caution';
  if (score >= 80 && warningCount === 0) return 'strongly_recommend';
  if (score >= 65 || (score >= 50 && positiveCount >= 2)) return 'recommend';
  if (score >= 40 || warningCount <= 1) return 'neutral';
  if (score >= 25) return 'caution';
  return 'avoid';
}

/**
 * Generate comprehensive subcontractor intelligence
 */
export function generateSubcontractorIntelligence(
  sub: Subcontractor,
  assignments: SubAssignment[],
  bids: Bid[]
): SubcontractorIntelligence {
  // Calculate score breakdown
  const scoreBreakdown = calculateScoreBreakdown(sub, assignments, bids);

  // Calculate overall score
  const overallScore = scoreBreakdown.reduce((total, item) => total + item.score * item.weight, 0);

  // Performance metrics
  const completedAssignments = assignments.filter(a => a.status === 'completed');
  const onTimeAssignments = completedAssignments.filter(a =>
    a.endDate && a.startDate && new Date(a.endDate) <= new Date(a.startDate)
  );

  const performanceMetrics = {
    projectsCompleted: completedAssignments.length,
    onTimeCompletionRate: completedAssignments.length > 0
      ? (onTimeAssignments.length / completedAssignments.length) * 100
      : 0,
    budgetAdherenceRate: calculateBudgetAdherence(completedAssignments),
    avgChangeOrderRate: 5, // Placeholder - would calculate from actual data
    warrantyCallbackRate: 2, // Placeholder
    repeatHireRate: calculateRepeatHireRate(assignments),
  };

  // Pricing metrics
  const acceptedBids = bids.filter(b => b.status === 'accepted');
  const pricingMetrics = {
    avgBidVsMarket: 100, // Would calculate against market rates
    bidAcceptanceRate: bids.length > 0 ? (acceptedBids.length / bids.length) * 100 : 0,
    avgNegotiationDiscount: 5, // Placeholder
    priceConsistency: calculatePriceConsistency(bids),
  };

  // Reliability metrics
  const reliabilityMetrics = {
    showUpRate: sub.metrics.onTimeRate,
    avgDelayDays: 1, // Placeholder
    communicationRating: sub.metrics.avgRating,
    documentCompleteness: calculateDocumentCompleteness(sub),
  };

  // Generate recommendations
  const recommendations = generateSubRecommendations(
    overallScore,
    performanceMetrics,
    pricingMetrics,
    reliabilityMetrics,
    sub
  );

  return {
    subId: sub.id,
    overallScore: Math.round(overallScore),
    scoreBreakdown,
    performanceMetrics,
    pricingMetrics,
    reliabilityMetrics,
    recommendations,
    lastUpdated: new Date(),
  };
}

function calculateScoreBreakdown(
  sub: Subcontractor,
  assignments: SubAssignment[],
  bids: Bid[]
): SubcontractorScoreBreakdown[] {
  const completedAssignments = assignments.filter(a => a.status === 'completed');

  return Object.entries(SUBCONTRACTOR_SCORE_CATEGORIES).map(([category, config]) => {
    let score: number;
    let dataPoints: number;
    let trend: 'improving' | 'stable' | 'declining' | undefined;

    switch (category as SubcontractorScoreCategory) {
      case 'quality':
        score = (sub.metrics.avgRating / 5) * 100;
        dataPoints = completedAssignments.length;
        break;
      case 'reliability':
        score = sub.metrics.onTimeRate;
        dataPoints = completedAssignments.length;
        break;
      case 'communication':
        score = (sub.metrics.avgRating / 5) * 100; // Simplified
        dataPoints = completedAssignments.length;
        break;
      case 'price_competitiveness':
        const acceptedBids = bids.filter(b => b.status === 'accepted');
        score = acceptedBids.length > 0 ? 70 : 50; // Simplified
        dataPoints = bids.length;
        break;
      case 'safety':
        score = 85; // Placeholder - would check for incidents
        dataPoints = completedAssignments.length;
        break;
      default:
        score = 50;
        dataPoints = 0;
    }

    return {
      category: category as SubcontractorScoreCategory,
      score: Math.round(score),
      weight: config.weight,
      dataPoints,
      trend,
    };
  });
}

function calculateBudgetAdherence(assignments: SubAssignment[]): number {
  if (assignments.length === 0) return 100;

  const withinBudget = assignments.filter(a => a.paidAmount <= a.agreedAmount);
  return (withinBudget.length / assignments.length) * 100;
}

function calculateRepeatHireRate(assignments: SubAssignment[]): number {
  // Group by project
  const projectIds = new Set(assignments.map(a => a.projectId));
  if (projectIds.size <= 1) return 0;

  // If hired for multiple projects, that's a repeat hire
  return Math.min(100, (projectIds.size - 1) * 25);
}

function calculatePriceConsistency(bids: Bid[]): number {
  if (bids.length < 2) return 100;

  const amounts = bids.map(b => b.amount);
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const variance = amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = (stdDev / avg) * 100;

  // Lower CV = more consistent
  return Math.max(0, 100 - coefficientOfVariation * 2);
}

function calculateDocumentCompleteness(sub: Subcontractor): number {
  const requiredDocs = ['license', 'insurance', 'w9'];
  const presentDocs = sub.documents.filter(d => requiredDocs.includes(d.type));
  return (presentDocs.length / requiredDocs.length) * 100;
}

function generateSubRecommendations(
  overallScore: number,
  performanceMetrics: SubcontractorIntelligence['performanceMetrics'],
  pricingMetrics: SubcontractorIntelligence['pricingMetrics'],
  reliabilityMetrics: SubcontractorIntelligence['reliabilityMetrics'],
  sub: Subcontractor
): string[] {
  const recommendations: string[] = [];

  if (overallScore >= 80) {
    recommendations.push('Preferred subcontractor - consider for priority projects.');
  }

  if (performanceMetrics.onTimeCompletionRate < 70) {
    recommendations.push('Build in schedule buffer when assigning work.');
  }

  if (pricingMetrics.bidAcceptanceRate < 30 && pricingMetrics.bidAcceptanceRate > 0) {
    recommendations.push('Bids are often competitive but rejected - may need scope clarification.');
  }

  if (reliabilityMetrics.documentCompleteness < 100) {
    recommendations.push('Request updated insurance and license documentation.');
  }

  if (sub.insuranceExpiry && new Date(sub.insuranceExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
    recommendations.push('Insurance expiring soon - request renewal certificate.');
  }

  if (performanceMetrics.projectsCompleted === 0) {
    recommendations.push('New subcontractor - consider a small trial project first.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Solid performer with no specific concerns.');
  }

  return recommendations;
}

/**
 * Generate bid recommendations for a project
 */
export function generateBidRecommendations(
  projectId: string,
  trade: string,
  availableSubs: Subcontractor[],
  subIntelligence: Map<string, SubcontractorIntelligence>
): BidRecommendation {
  // Filter and rank subs by score
  const rankedSubs = availableSubs
    .filter(s => s.trade.toLowerCase() === trade.toLowerCase() && s.isActive)
    .map(s => ({
      sub: s,
      score: subIntelligence.get(s.id)?.overallScore || 50,
    }))
    .sort((a, b) => b.score - a.score);

  // Recommend top 3-5 subs
  const optimalBidCount = Math.min(5, Math.max(3, rankedSubs.length));
  const recommendedSubIds = rankedSubs.slice(0, optimalBidCount).map(r => r.sub.id);

  // Get market rates
  const marketRates = TRADE_MARKET_RATES[trade.toLowerCase()] || TRADE_MARKET_RATES.general;

  // Simple market timing (would be more sophisticated in production)
  const today = new Date();
  const month = today.getMonth();
  let marketTiming: 'favorable' | 'neutral' | 'unfavorable' = 'neutral';
  let marketTimingReason: string | undefined;

  // Construction is typically slower in winter (favorable for buyers)
  if (month >= 11 || month <= 2) {
    marketTiming = 'favorable';
    marketTimingReason = 'Winter months typically see lower demand and more competitive pricing.';
  } else if (month >= 4 && month <= 8) {
    marketTiming = 'unfavorable';
    marketTimingReason = 'Peak construction season - expect higher prices and limited availability.';
  }

  // Suggest deadline (2 weeks from now)
  const suggestedDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const notes: string[] = [];
  if (rankedSubs.length < 3) {
    notes.push(`Only ${rankedSubs.length} active ${trade} subcontractors available - consider adding more to your network.`);
  }
  if (recommendedSubIds.some(id => subIntelligence.get(id)?.overallScore || 0 < 50)) {
    notes.push('Some recommended subs have limited history - request references.');
  }

  return {
    projectId,
    trade,
    recommendedSubIds,
    optimalBidCount,
    marketTiming,
    marketTimingReason,
    estimatedMarketRate: {
      low: marketRates.low,
      average: marketRates.average,
      high: marketRates.high,
    },
    suggestedDeadline,
    notes,
  };
}

// Re-export from centralized formatters
export { formatCurrencyCompact as formatCurrency } from '@/lib/utils/formatters';

/**
 * Format percentage for display (rounded to integer)
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
