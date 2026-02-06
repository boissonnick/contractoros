/**
 * Review Management Cloud Functions
 *
 * Sprint 76: Cloud Functions for automated review solicitation
 *
 * Functions:
 * - onReviewRequestCreated: Sends SMS/Email when review request is created
 * - onProjectStatusChange: Triggers automation when project completes
 * - onInvoiceStatusChange: Triggers automation when final invoice is paid
 * - syncGoogleReviews: Scheduled sync of Google Business Profile reviews
 * - syncGoogleReviewsManual: HTTP trigger for manual sync
 */

import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

import { processReviewRequest, reviewSecrets } from "./sendReviewRequest";
import { handleProjectCompleted, handleInvoicePaid } from "./automationTrigger";
import { syncAllGoogleReviews, googleSecrets } from "./syncGoogleReviews";

const REGION = "us-east1";

// Lazy initialization for Firestore
function getDb() {
  return getFirestore(admin.app(), "contractoros");
}

// ============================================
// Review Request Trigger
// ============================================

/**
 * Send review request when a new request is created with status 'pending'
 */
export const onReviewRequestCreated = onDocumentCreated(
  {
    document: "organizations/{orgId}/reviewRequests/{requestId}",
    database: "contractoros",
    region: REGION,
    secrets: reviewSecrets,
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log("No data for review request event");
      return;
    }

    const data = snapshot.data();
    const { orgId, requestId } = event.params;

    // Only process pending requests (not scheduled or failed)
    if (data.status !== "pending") {
      console.log(`Review request ${requestId} status is ${data.status}, skipping`);
      return;
    }

    console.log(`Processing review request ${requestId} for org ${orgId}`);
    await processReviewRequest(requestId, {
      orgId,
      projectId: data.projectId,
      clientId: data.clientId,
      channel: data.channel,
      status: data.status,
      recipientName: data.recipientName,
      recipientEmail: data.recipientEmail,
      recipientPhone: data.recipientPhone,
      templateId: data.templateId,
      retryCount: data.retryCount || 0,
    });
  }
);

// ============================================
// Project Completion Trigger
// ============================================

/**
 * Trigger review automation when project status changes to 'complete'
 */
export const onProjectStatusChange = onDocumentUpdated(
  {
    document: "organizations/{orgId}/projects/{projectId}",
    database: "contractoros",
    region: REGION,
  },
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) {
      console.log("No data for project update event");
      return;
    }

    const { orgId, projectId } = event.params;

    // Check if status changed to 'complete' or 'completed'
    const completedStatuses = ["complete", "completed", "closed"];
    const wasCompleted = completedStatuses.includes(beforeData.status?.toLowerCase());
    const isCompleted = completedStatuses.includes(afterData.status?.toLowerCase());

    if (!wasCompleted && isCompleted) {
      console.log(`Project ${projectId} completed, checking automation rules`);
      await handleProjectCompleted(orgId, projectId, {
        id: projectId,
        orgId,
        clientId: afterData.clientId,
        name: afterData.name,
        status: afterData.status,
      });
    }
  }
);

// ============================================
// Invoice Payment Trigger
// ============================================

/**
 * Trigger review automation when invoice status changes to 'paid'
 */
export const onInvoiceStatusChange = onDocumentUpdated(
  {
    document: "organizations/{orgId}/invoices/{invoiceId}",
    database: "contractoros",
    region: REGION,
  },
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) {
      console.log("No data for invoice update event");
      return;
    }

    const { orgId, invoiceId } = event.params;

    // Check if status changed to 'paid'
    const wasPaid = beforeData.status === "paid";
    const isPaid = afterData.status === "paid";

    // Only trigger if this is the final invoice (marked as final or no remaining balance)
    const isFinalInvoice = afterData.isFinal === true || afterData.remainingBalance === 0;

    if (!wasPaid && isPaid && isFinalInvoice) {
      console.log(`Final invoice ${invoiceId} paid, checking automation rules`);
      await handleInvoicePaid(
        orgId,
        invoiceId,
        afterData.projectId,
        afterData.clientId
      );
    }
  }
);

// ============================================
// Google Review Sync
// ============================================

/**
 * Scheduled sync of Google Business Profile reviews
 * Runs every 6 hours
 */
export const syncGoogleReviewsScheduled = onSchedule(
  {
    schedule: "0 */6 * * *", // Every 6 hours
    region: REGION,
    timeZone: "America/Los_Angeles",
    secrets: googleSecrets,
  },
  async () => {
    console.log("Starting scheduled Google review sync");
    const stats = await syncAllGoogleReviews();
    console.log("Scheduled Google review sync complete:", stats);
  }
);

/**
 * Manual sync trigger via HTTP
 * POST /syncGoogleReviewsManual
 */
export const syncGoogleReviewsManual = onRequest(
  {
    region: REGION,
    cors: true,
    secrets: googleSecrets,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      // Check if user is admin (OWNER or PM)
      const userDoc = await getDb().collection("users").doc(decodedToken.uid).get();
      const userData = userDoc.data();

      if (!userData || !["OWNER", "PM"].includes(userData.role)) {
        res.status(403).json({ error: "Forbidden: Admin access required" });
        return;
      }

      console.log(`Manual Google review sync triggered by user ${decodedToken.uid}`);
      const stats = await syncAllGoogleReviews();

      res.status(200).json({
        success: true,
        message: "Google review sync complete",
        stats,
      });
    } catch (error) {
      console.error("Manual sync error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ============================================
// Scheduled Review Request Processor
// ============================================

/**
 * Process scheduled review requests
 * Runs every hour to check for requests that are ready to send
 */
export const processScheduledReviewRequests = onSchedule(
  {
    schedule: "0 * * * *", // Every hour
    region: REGION,
    timeZone: "America/Los_Angeles",
    secrets: reviewSecrets,
  },
  async () => {
    const db = getDb();
    const now = new Date();

    console.log("Processing scheduled review requests");

    // Find all scheduled requests that are ready to send
    const snapshot = await db
      .collectionGroup("reviewRequests")
      .where("status", "==", "scheduled")
      .where("scheduledFor", "<=", admin.firestore.Timestamp.fromDate(now))
      .limit(100)
      .get();

    console.log(`Found ${snapshot.docs.length} scheduled requests ready to send`);

    let processed = 0;
    let errors = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Extract orgId from document path
      const pathParts = doc.ref.path.split("/");
      const orgIdIndex = pathParts.indexOf("organizations") + 1;
      const orgId = pathParts[orgIdIndex];
      const requestId = doc.id;

      try {
        // Update status to pending to trigger the send
        await doc.ref.update({
          status: "pending",
          updatedAt: admin.firestore.Timestamp.now(),
        });

        // Process the request
        await processReviewRequest(requestId, {
          orgId,
          projectId: data.projectId,
          clientId: data.clientId,
          channel: data.channel,
          status: "pending",
          recipientName: data.recipientName,
          recipientEmail: data.recipientEmail,
          recipientPhone: data.recipientPhone,
          templateId: data.templateId,
          retryCount: data.retryCount || 0,
        });

        processed++;
      } catch (error) {
        console.error(`Error processing scheduled request ${requestId}:`, error);
        errors++;
      }
    }

    console.log(`Scheduled request processing complete: ${processed} processed, ${errors} errors`);
  }
);
