/**
 * Google Business Profile API Client
 * Sprint 75: Review monitoring API wrapper
 */

import { getValidAccessToken } from './oauth';
import { GOOGLE_BUSINESS_API_BASE, GOOGLE_REVIEWS_API_BASE } from './types';

interface GoogleBusinessAccount {
  name: string;
  accountName: string;
  type: string;
}

interface GoogleBusinessLocation {
  name: string;
  locationName: string;
  title: string;
  storefrontAddress?: {
    addressLines: string[];
    locality: string;
    administrativeArea: string;
    postalCode: string;
  };
}

interface GoogleReview {
  name: string; // Full resource name
  reviewId: string;
  reviewer: {
    profilePhotoUrl?: string;
    displayName: string;
  };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

/**
 * Convert Google star rating to number
 */
function starRatingToNumber(rating: string): number {
  const map: Record<string, number> = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  };
  return map[rating] || 0;
}

/**
 * Fetch accounts associated with the authenticated user
 */
export async function fetchAccounts(
  accessToken: string
): Promise<GoogleBusinessAccount[]> {
  const response = await fetch(`${GOOGLE_BUSINESS_API_BASE}/accounts`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch Google Business accounts:', error);
    throw new Error(`Failed to fetch accounts: ${response.status}`);
  }

  const data = await response.json();
  return data.accounts || [];
}

/**
 * Fetch locations for a specific account
 */
export async function fetchLocations(
  accessToken: string,
  accountId: string
): Promise<GoogleBusinessLocation[]> {
  const response = await fetch(
    `${GOOGLE_BUSINESS_API_BASE}/${accountId}/locations`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch Google Business locations:', error);
    throw new Error(`Failed to fetch locations: ${response.status}`);
  }

  const data = await response.json();
  return data.locations || [];
}

/**
 * Fetch reviews for a location
 */
export async function fetchReviews(
  accessToken: string,
  locationName: string,
  pageSize: number = 50,
  pageToken?: string
): Promise<{ reviews: GoogleReview[]; nextPageToken?: string }> {
  const url = new URL(`${GOOGLE_REVIEWS_API_BASE}/${locationName}/reviews`);
  url.searchParams.set('pageSize', pageSize.toString());
  if (pageToken) {
    url.searchParams.set('pageToken', pageToken);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch Google reviews:', error);
    throw new Error(`Failed to fetch reviews: ${response.status}`);
  }

  const data = await response.json();
  return {
    reviews: data.reviews || [],
    nextPageToken: data.nextPageToken,
  };
}

/**
 * Reply to a review
 */
export async function replyToReview(
  accessToken: string,
  reviewName: string,
  replyText: string
): Promise<void> {
  const response = await fetch(
    `${GOOGLE_REVIEWS_API_BASE}/${reviewName}/reply`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: replyText,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to reply to review:', error);
    throw new Error(`Failed to reply to review: ${response.status}`);
  }
}

/**
 * Delete a review reply
 */
export async function deleteReviewReply(
  accessToken: string,
  reviewName: string
): Promise<void> {
  const response = await fetch(
    `${GOOGLE_REVIEWS_API_BASE}/${reviewName}/reply`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to delete review reply:', error);
    throw new Error(`Failed to delete review reply: ${response.status}`);
  }
}

// =============================================================================
// Convenience functions using stored credentials
// =============================================================================

/**
 * Fetch and sync reviews from Google Business Profile
 * Returns reviews in our internal format
 */
export async function syncReviewsFromGoogle(
  orgId: string,
  connectionId?: string
): Promise<
  Array<{
    externalId: string;
    rating: number;
    reviewText?: string;
    reviewerName: string;
    reviewerPhotoUrl?: string;
    reviewDate: Date;
    responseText?: string;
    respondedAt?: Date;
  }>
> {
  const credentials = await getValidAccessToken(orgId, connectionId);
  if (!credentials) {
    throw new Error('No valid Google Business connection');
  }

  // Build the full location name for the API
  const locationName = `accounts/${credentials.locationId.split('/')[0]}/locations/${credentials.locationId}`;

  const { reviews } = await fetchReviews(credentials.accessToken, locationName);

  return reviews.map((review) => ({
    externalId: review.reviewId,
    rating: starRatingToNumber(review.starRating),
    reviewText: review.comment,
    reviewerName: review.reviewer.displayName,
    reviewerPhotoUrl: review.reviewer.profilePhotoUrl,
    reviewDate: new Date(review.createTime),
    responseText: review.reviewReply?.comment,
    respondedAt: review.reviewReply
      ? new Date(review.reviewReply.updateTime)
      : undefined,
  }));
}
