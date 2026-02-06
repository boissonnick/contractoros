/**
 * Google Business Profile Review Sync
 *
 * Scheduled function that syncs reviews from Google Business Profile
 * for all connected organizations.
 */

import { getFirestore, Firestore, Timestamp } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";

// Google OAuth secrets
const googleClientId = defineSecret("GOOGLE_BUSINESS_CLIENT_ID");
const googleClientSecret = defineSecret("GOOGLE_BUSINESS_CLIENT_SECRET");

// Export secrets for use in index.ts
export const googleSecrets = [googleClientId, googleClientSecret];

// Lazy initialization for Firestore
let _db: Firestore | null = null;
function getDb(): Firestore {
  if (!_db) {
    _db = getFirestore(admin.app(), "contractoros");
  }
  return _db;
}

/**
 * Google Business connection data
 */
interface GoogleBusinessConnection {
  id: string;
  orgId: string;
  accountId: string;
  locationId: string;
  locationName: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: admin.firestore.Timestamp;
  lastSyncAt?: admin.firestore.Timestamp;
}

/**
 * Google review from API
 */
interface GoogleReviewResponse {
  name: string;
  reviewId: string;
  reviewer: {
    profilePhotoUrl?: string;
    displayName: string;
  };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
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
 * Refresh Google access token
 */
async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: Date } | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: googleClientId.value(),
        client_secret: googleClientSecret.value(),
      }).toString(),
    });

    if (!response.ok) {
      console.error("Failed to refresh Google token:", await response.text());
      return null;
    }

    const data = await response.json();
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

    return {
      accessToken: data.access_token,
      expiresAt,
    };
  } catch (error) {
    console.error("Error refreshing Google token:", error);
    return null;
  }
}

/**
 * Get valid access token, refreshing if needed
 */
async function getValidAccessToken(
  connection: GoogleBusinessConnection
): Promise<string | null> {
  const db = getDb();
  const now = new Date();
  const expiresAt = connection.expiresAt.toDate();
  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

  // Check if token needs refresh
  if (now.getTime() > expiresAt.getTime() - bufferTime) {
    const newTokens = await refreshAccessToken(connection.refreshToken);
    if (!newTokens) {
      return null;
    }

    // Update tokens in Firestore
    await db
      .collection("organizations")
      .doc(connection.orgId)
      .collection("googleBusinessConnections")
      .doc(connection.id)
      .update({
        accessToken: newTokens.accessToken,
        expiresAt: Timestamp.fromDate(newTokens.expiresAt),
      });

    return newTokens.accessToken;
  }

  return connection.accessToken;
}

/**
 * Fetch reviews from Google Business Profile API
 */
async function fetchGoogleReviews(
  accessToken: string,
  locationName: string
): Promise<GoogleReviewResponse[]> {
  try {
    // Note: The actual API endpoint structure depends on the Google My Business API version
    // Using v4 My Business API for reviews
    const url = `https://mybusiness.googleapis.com/v4/${locationName}/reviews?pageSize=50`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to fetch Google reviews: ${error}`);
      return [];
    }

    const data = await response.json();
    return data.reviews || [];
  } catch (error) {
    console.error("Error fetching Google reviews:", error);
    return [];
  }
}

/**
 * Upsert a review in Firestore
 */
async function upsertReview(
  orgId: string,
  review: GoogleReviewResponse
): Promise<boolean> {
  const db = getDb();
  const reviewsRef = db.collection("organizations").doc(orgId).collection("reviews");

  // Check if review already exists by externalId
  const existingSnapshot = await reviewsRef
    .where("platform", "==", "google")
    .where("externalId", "==", review.reviewId)
    .limit(1)
    .get();

  const reviewData = {
    orgId,
    platform: "google" as const,
    externalId: review.reviewId,
    rating: starRatingToNumber(review.starRating),
    reviewText: review.comment || null,
    reviewerName: review.reviewer.displayName,
    reviewerPhotoUrl: review.reviewer.profilePhotoUrl || null,
    reviewDate: Timestamp.fromDate(new Date(review.createTime)),
    responseText: review.reviewReply?.comment || null,
    respondedAt: review.reviewReply
      ? Timestamp.fromDate(new Date(review.reviewReply.updateTime))
      : null,
    syncedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  if (existingSnapshot.empty) {
    // Create new review
    await reviewsRef.add({
      ...reviewData,
      createdAt: Timestamp.now(),
    });
    return true; // New review
  } else {
    // Update existing review
    await existingSnapshot.docs[0].ref.update(reviewData);
    return false; // Updated review
  }
}

/**
 * Sync reviews for a single organization connection
 */
async function syncConnectionReviews(
  connection: GoogleBusinessConnection
): Promise<{ synced: number; new: number; errors: number }> {
  const db = getDb();
  const stats = { synced: 0, new: 0, errors: 0 };

  try {
    // Get valid access token
    const accessToken = await getValidAccessToken(connection);
    if (!accessToken) {
      console.error(`Failed to get access token for org ${connection.orgId}`);
      stats.errors++;

      // Update connection with error status
      await db
        .collection("organizations")
        .doc(connection.orgId)
        .collection("googleBusinessConnections")
        .doc(connection.id)
        .update({
          lastSyncAt: Timestamp.now(),
          lastSyncStatus: "error",
          lastSyncError: "Failed to refresh access token",
        });

      return stats;
    }

    // Build location name for API
    // Format: accounts/{accountId}/locations/{locationId}
    const locationName = connection.locationId.includes("/")
      ? connection.locationId
      : `accounts/${connection.accountId}/locations/${connection.locationId}`;

    // Fetch reviews from Google
    const reviews = await fetchGoogleReviews(accessToken, locationName);
    console.log(`Fetched ${reviews.length} reviews for org ${connection.orgId}`);

    // Process each review
    for (const review of reviews) {
      try {
        const isNew = await upsertReview(connection.orgId, review);
        stats.synced++;
        if (isNew) stats.new++;
      } catch (error) {
        console.error(`Error processing review ${review.reviewId}:`, error);
        stats.errors++;
      }
    }

    // Update connection sync status
    await db
      .collection("organizations")
      .doc(connection.orgId)
      .collection("googleBusinessConnections")
      .doc(connection.id)
      .update({
        lastSyncAt: Timestamp.now(),
        lastSyncStatus: "success",
        lastSyncError: null,
      });

    console.log(
      `Sync complete for org ${connection.orgId}: ${stats.synced} synced, ${stats.new} new, ${stats.errors} errors`
    );
  } catch (error) {
    console.error(`Error syncing reviews for org ${connection.orgId}:`, error);
    stats.errors++;

    // Update connection with error status
    await db
      .collection("organizations")
      .doc(connection.orgId)
      .collection("googleBusinessConnections")
      .doc(connection.id)
      .update({
        lastSyncAt: Timestamp.now(),
        lastSyncStatus: "error",
        lastSyncError: error instanceof Error ? error.message : "Unknown error",
      });
  }

  return stats;
}

/**
 * Main sync function - syncs all connected organizations
 */
export async function syncAllGoogleReviews(): Promise<{
  organizations: number;
  totalSynced: number;
  totalNew: number;
  totalErrors: number;
}> {
  const db = getDb();
  const totals = { organizations: 0, totalSynced: 0, totalNew: 0, totalErrors: 0 };

  // Get all organizations with Google Business connections
  const orgsSnapshot = await db.collectionGroup("googleBusinessConnections").get();

  console.log(`Found ${orgsSnapshot.docs.length} Google Business connections to sync`);

  for (const doc of orgsSnapshot.docs) {
    const connection = { id: doc.id, ...doc.data() } as GoogleBusinessConnection;

    // Extract orgId from document path
    const pathParts = doc.ref.path.split("/");
    const orgIdIndex = pathParts.indexOf("organizations") + 1;
    connection.orgId = pathParts[orgIdIndex];

    const stats = await syncConnectionReviews(connection);

    totals.organizations++;
    totals.totalSynced += stats.synced;
    totals.totalNew += stats.new;
    totals.totalErrors += stats.errors;
  }

  console.log(
    `Google Review sync complete: ${totals.organizations} orgs, ${totals.totalSynced} synced, ${totals.totalNew} new, ${totals.totalErrors} errors`
  );

  return totals;
}
