/**
 * Review Management Types
 * Sprint 75: Foundation for review solicitation and reputation monitoring
 */

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

export type ReviewPlatform = 'google' | 'yelp' | 'facebook' | 'manual';

export const REVIEW_PLATFORM_LABELS: Record<ReviewPlatform, string> = {
  google: 'Google Business',
  yelp: 'Yelp',
  facebook: 'Facebook',
  manual: 'Manual Entry',
};

export type ReviewRequestStatus = 'pending' | 'sent' | 'clicked' | 'completed' | 'failed';

export const REVIEW_REQUEST_STATUS_LABELS: Record<ReviewRequestStatus, string> = {
  pending: 'Pending',
  sent: 'Sent',
  clicked: 'Clicked',
  completed: 'Completed',
  failed: 'Failed',
};

export type ReviewRequestChannel = 'sms' | 'email';

export const REVIEW_REQUEST_CHANNEL_LABELS: Record<ReviewRequestChannel, string> = {
  sms: 'SMS',
  email: 'Email',
};

export type ReviewAutomationTrigger = 'project_completed' | 'invoice_paid' | 'manual';

export const REVIEW_AUTOMATION_TRIGGER_LABELS: Record<ReviewAutomationTrigger, string> = {
  project_completed: 'Project Completed',
  invoice_paid: 'Final Invoice Paid',
  manual: 'Manual Only',
};

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Review from any platform (Google, Yelp, Facebook, or manual entry)
 * Collection: organizations/{orgId}/reviews/{reviewId}
 */
export interface Review {
  id: string;
  orgId: string;

  // Optional associations
  projectId?: string;
  clientId?: string;

  // Platform info
  platform: ReviewPlatform;
  externalId?: string; // Platform-specific ID for deduplication

  // Review content
  rating: number; // 1-5 stars
  reviewText?: string;
  reviewerName: string;
  reviewerPhotoUrl?: string;
  reviewDate: Date;

  // Response (if any)
  responseText?: string;
  respondedAt?: Date;
  respondedBy?: string; // userId

  // Sync tracking
  syncedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Request for a review sent to a client
 * Collection: organizations/{orgId}/reviewRequests/{requestId}
 */
export interface ReviewRequest {
  id: string;
  orgId: string;

  // Associations
  projectId: string;
  clientId: string;

  // Request details
  channel: ReviewRequestChannel;
  status: ReviewRequestStatus;
  templateId?: string;

  // Contact info used
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;

  // Tracking
  sentAt?: Date;
  clickedAt?: Date;
  completedAt?: Date;
  reviewId?: string; // Link to review if completed

  // Error handling
  errorMessage?: string;
  retryCount: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Automation rule for sending review requests
 * Collection: organizations/{orgId}/reviewAutomationRules/{ruleId}
 */
export interface ReviewAutomationRule {
  id: string;
  orgId: string;

  // Rule config
  name: string;
  description?: string;
  enabled: boolean;

  // Trigger settings
  trigger: ReviewAutomationTrigger;
  delayDays: number; // Days after trigger to send request

  // Request settings
  channel: ReviewRequestChannel;
  templateId?: string;

  // Stats
  requestsSent: number;
  reviewsReceived: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Google Business Profile OAuth connection
 * Collection: organizations/{orgId}/googleBusinessConnections/{connectionId}
 */
export interface GoogleBusinessConnection {
  id: string;
  orgId: string;

  // Google account info
  accountId: string;
  accountName?: string;

  // Location info
  locationId: string;
  locationName: string;
  locationAddress?: string;

  // OAuth tokens
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;

  // Tracking
  connectedAt: Date;
  connectedBy: string; // userId
  lastSyncAt?: Date;
  lastSyncStatus?: 'success' | 'error';
  lastSyncError?: string;
}

/**
 * Response template for replying to reviews
 * Collection: organizations/{orgId}/reviewResponseTemplates/{templateId}
 */
export interface ReviewResponseTemplate {
  id: string;
  orgId: string;

  name: string;
  description?: string;

  // Template content
  body: string; // Supports {{variables}}
  variables: string[];

  // Categorization
  sentiment: 'positive' | 'neutral' | 'negative';
  minRating?: number; // Suggested for reviews >= this rating
  maxRating?: number; // Suggested for reviews <= this rating

  // Usage stats
  usageCount: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// AGGREGATE TYPES
// =============================================================================

/**
 * Aggregated review statistics for an organization
 */
export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>; // { 1: count, 2: count, ... 5: count }
  platformBreakdown: Record<ReviewPlatform, number>;
  reviewsThisMonth: number;
  reviewsLastMonth: number;
  responseRate: number; // Percentage of reviews responded to
  averageResponseTime: number; // Hours
}

/**
 * Review request statistics
 */
export interface ReviewRequestStats {
  totalSent: number;
  pendingCount: number;
  clickRate: number; // Percentage clicked / sent
  conversionRate: number; // Percentage completed / sent
  byChannel: Record<ReviewRequestChannel, number>;
}
