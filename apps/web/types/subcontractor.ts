// ============================================
// Subcontractor & Bid Types
// Extracted from types/index.ts
// ============================================

// ============================================
// Subcontractor Document Types
// ============================================

export interface SubcontractorDocument {
  id: string;
  type: 'license' | 'insurance' | 'w9' | 'contract' | 'other';
  name: string;
  url: string;
  expiresAt?: Date;
  uploadedAt: Date;
}

// ============================================
// Subcontractor Metrics Types
// ============================================

export interface SubcontractorMetrics {
  projectsCompleted: number;
  onTimeRate: number; // 0-100
  avgRating: number; // 0-5
  totalPaid: number;
}

// ============================================
// Subcontractor Types
// ============================================

export interface Subcontractor {
  id: string;
  orgId: string;
  userId?: string; // linked UserProfile if they have an account
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  trade: string;
  licenseNumber?: string;
  insuranceExpiry?: Date;
  address?: string;
  notes?: string;
  metrics: SubcontractorMetrics;
  documents: SubcontractorDocument[];
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Sub Assignment Types
// ============================================

export type SubAssignmentStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface SubPaymentScheduleItem {
  id: string;
  description: string;
  amount: number;
  dueDate?: Date;
  paidAt?: Date;
  status: 'pending' | 'paid' | 'overdue';
}

export interface SubAssignment {
  id: string;
  subId: string;
  projectId: string;
  type: 'phase' | 'task';
  phaseId?: string;
  taskId?: string;
  bidId?: string;
  status: SubAssignmentStatus;
  agreedAmount: number;
  paidAmount: number;
  paymentSchedule: SubPaymentScheduleItem[];
  rating?: number; // 0-5
  ratingComment?: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Bid Types
// ============================================

export type BidStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface Bid {
  id: string;
  projectId: string;
  phaseIds?: string[];        // Can bid on phases
  taskId?: string;            // Can bid on specific tasks
  quoteSectionIds?: string[]; // Linked quote sections
  subId: string;              // Subcontractor ID
  amount: number;
  laborCost?: number;
  materialCost?: number;
  proposedStartDate?: Date;
  proposedEndDate?: Date;
  timeline?: string;          // "2 weeks"
  description?: string;
  attachments?: string[];     // URLs
  status: BidStatus;
  submittedAt?: Date;
  expiresAt?: Date;
  respondedAt?: Date;
  respondedBy?: string;
  responseNotes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Bid Solicitation Types
// ============================================

export type BidSolicitationStatus = 'open' | 'closed' | 'cancelled';

export interface BidSolicitation {
  id: string;
  projectId: string;
  orgId: string;
  title: string;
  description?: string;
  scopeItemIds: string[];
  phaseIds: string[];
  trade?: string;
  invitedSubIds: string[];
  deadline: Date;
  status: BidSolicitationStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Bid Intelligence Types
// ============================================

export type BidComparisonRating = 'excellent' | 'good' | 'fair' | 'high' | 'very_high';

export interface BidMarketComparison {
  bidAmount: number;
  marketLow: number;
  marketAverage: number;
  marketHigh: number;
  percentileRank: number; // 0-100, where 50 is average
  rating: BidComparisonRating;
  recommendation: string;
}

export interface BidHistoryComparison {
  bidAmount: number;
  subAverageBid: number;
  subLowestBid: number;
  subHighestBid: number;
  totalBidsFromSub: number;
  percentChange: number; // vs their average
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface BidFlag {
  type: 'warning' | 'info' | 'positive';
  code: string;
  message: string;
}

export interface BidAnalysis {
  id: string;
  bidId: string;
  projectId: string;
  subId: string;
  trade: string;
  analyzedAt: Date;
  marketComparison: BidMarketComparison;
  historyComparison?: BidHistoryComparison;
  competitorComparison?: {
    totalBidsReceived: number;
    rank: number; // 1 = lowest bid
    averageOfAllBids: number;
    lowestBid: number;
    highestBid: number;
  };
  overallScore: number; // 0-100
  flags: BidFlag[];
  recommendation: 'strongly_recommend' | 'recommend' | 'neutral' | 'caution' | 'avoid';
}

export interface BidRecommendation {
  projectId: string;
  trade: string;
  recommendedSubIds: string[];
  optimalBidCount: number;
  marketTiming: 'favorable' | 'neutral' | 'unfavorable';
  marketTimingReason?: string;
  estimatedMarketRate: {
    low: number;
    average: number;
    high: number;
  };
  suggestedDeadline: Date;
  notes: string[];
}

// ============================================
// Subcontractor Score & Intelligence Types
// ============================================

export type SubcontractorScoreCategory =
  | 'quality'
  | 'reliability'
  | 'communication'
  | 'price_competitiveness'
  | 'safety';

export interface SubcontractorScoreBreakdown {
  category: SubcontractorScoreCategory;
  score: number; // 0-100
  weight: number; // 0-1
  dataPoints: number;
  trend?: 'improving' | 'stable' | 'declining';
}

export interface SubcontractorIntelligence {
  subId: string;
  overallScore: number; // 0-100
  scoreBreakdown: SubcontractorScoreBreakdown[];
  performanceMetrics: {
    projectsCompleted: number;
    onTimeCompletionRate: number; // 0-100
    budgetAdherenceRate: number; // 0-100
    avgChangeOrderRate: number; // percent of original contract
    warrantyCallbackRate: number; // percent with callbacks
    repeatHireRate: number; // 0-100
  };
  pricingMetrics: {
    avgBidVsMarket: number; // percent, 100 = at market rate
    bidAcceptanceRate: number; // 0-100
    avgNegotiationDiscount: number; // percent typically negotiated
    priceConsistency: number; // 0-100, higher = more consistent
  };
  reliabilityMetrics: {
    showUpRate: number; // 0-100
    avgDelayDays: number;
    communicationRating: number; // 0-5
    documentCompleteness: number; // 0-100
  };
  recommendations: string[];
  lastUpdated: Date;
}

// ============================================
// Subcontractor Constants
// ============================================

export const BID_COMPARISON_RATINGS: Record<BidComparisonRating, { label: string; color: string; description: string }> = {
  excellent: { label: 'Excellent Value', color: 'green', description: 'Well below market average' },
  good: { label: 'Good Value', color: 'emerald', description: 'Below market average' },
  fair: { label: 'Fair Price', color: 'yellow', description: 'At market average' },
  high: { label: 'Above Market', color: 'orange', description: 'Above market average' },
  very_high: { label: 'Premium Price', color: 'red', description: 'Well above market average' },
};

export const SUBCONTRACTOR_SCORE_CATEGORIES: Record<SubcontractorScoreCategory, { label: string; icon: string; weight: number }> = {
  quality: { label: 'Work Quality', icon: 'StarIcon', weight: 0.3 },
  reliability: { label: 'Reliability', icon: 'ClockIcon', weight: 0.25 },
  communication: { label: 'Communication', icon: 'ChatBubbleLeftRightIcon', weight: 0.15 },
  price_competitiveness: { label: 'Price', icon: 'CurrencyDollarIcon', weight: 0.2 },
  safety: { label: 'Safety', icon: 'ShieldCheckIcon', weight: 0.1 },
};

export const BID_STATUS_LABELS: Record<BidStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const SUB_ASSIGNMENT_STATUS_LABELS: Record<SubAssignmentStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// ============================================
// Trade Types (Common construction trades)
// ============================================

export const CONSTRUCTION_TRADES = [
  'General Contractor',
  'Carpenter',
  'Electrician',
  'Plumber',
  'HVAC',
  'Roofer',
  'Painter',
  'Drywall',
  'Flooring',
  'Mason',
  'Concrete',
  'Landscaper',
  'Tile Setter',
  'Cabinetry',
  'Insulation',
  'Siding',
  'Windows & Doors',
  'Demolition',
  'Excavation',
  'Foundation',
  'Framing',
  'Stucco',
  'Waterproofing',
  'Fire Protection',
  'Security Systems',
  'Audio/Visual',
  'Solar',
  'Pool & Spa',
  'Fencing',
  'Gutters',
  'Other',
] as const;

export type ConstructionTrade = typeof CONSTRUCTION_TRADES[number];
