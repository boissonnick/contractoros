/**
 * Intelligence Components
 *
 * UI components for displaying AI-powered construction intelligence
 * including price suggestions, market comparisons, and confidence scores.
 */

// Insight display components
export { InsightCard, InsightCardSkeleton } from './InsightCard';
export { MarketComparison, MarketComparisonInline } from './MarketComparison';
export { ConfidenceScore, ConfidenceCircle, ConfidenceBadge } from './ConfidenceScore';

// Price suggestion components
export { PriceSuggestionCard, PriceSuggestionSkeleton } from './PriceSuggestionCard';

// Material price components
export { MaterialPriceWidget, MaterialPriceAlert } from './MaterialPriceWidget';
export { PriceAlertBanner, InlinePriceAlert } from './PriceAlertBanner';

// Estimate confidence components
export { EstimateConfidenceCard, EstimateConfidenceBadge } from './EstimateConfidenceCard';
export type { EstimateConfidenceData } from './EstimateConfidenceCard';
