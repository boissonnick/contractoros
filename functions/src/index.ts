import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { auth } from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { handleInviteCreated } from "./email/sendInviteEmail";
import {
  sendSignatureRequestEmails,
  sendSignatureCompletedEmail,
  sendSignatureDeclinedEmail,
  sendSignedDocumentCopy,
} from "./email/sendSignatureEmails";
import {
  sendInvoiceEmail,
  sendPaymentReceivedEmail,
  sendEstimateEmail,
  processInvoiceReminders,
} from "./email/automatedEmails";

// Intelligence data fetching functions
export {
  fetchMaterialPricesScheduled,
  fetchMaterialPricesHttp,
} from "./intelligence/fetchMaterialPrices";
export {
  fetchLaborRatesScheduled,
  fetchLaborRatesHttp,
} from "./intelligence/fetchLaborRates";

// SMS Cloud Functions
export { sendSMS, smsWebhook } from "./sms";

// Receipt OCR Cloud Function
export { processReceiptOCR } from "./expenses/processReceiptOCR";

// Job Costing Engine — auto-recalculate project profitability
export { onTimeEntryWrite, onExpenseWrite } from "./job-costing";

// AP Invoicing — recalculate profitability on sub invoice approval/payment
export { onSubInvoiceWrite } from "./ap-invoicing";

// QuickBooks Online Integration - Scheduled Sync
export {
  qboScheduledSync,
  qboManualSync,
} from "./integrations/qbo-scheduled-sync";

// Review Management — automated review solicitation & Google sync
export {
  onReviewRequestCreated,
  onProjectStatusChange,
  onInvoiceStatusChange,
  syncGoogleReviewsScheduled,
  syncGoogleReviewsManual,
  processScheduledReviewRequests,
} from "./reviews";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Use named database 'contractoros' instead of default database
const db = getFirestore(admin.app(), "contractoros");

// Region configuration for Cloud Functions Gen 2
const REGION = "us-east1";

// Type definitions
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: "OWNER" | "PM" | "SUPER" | "WORKER" | "CLIENT" | "SUB";
  orgId: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
}

/**
 * Health check endpoint
 * GET /healthCheck
 */
export const healthCheck = onRequest(
  { region: REGION, cors: true },
  async (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "contractoros-functions",
    });
  }
);

/**
 * Create user profile on Firebase Auth user creation
 * Triggered automatically when a new user signs up
 */
export const createUserProfile = auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;

  const userProfile: UserProfile = {
    uid,
    email: email || "",
    displayName: displayName || email?.split("@")[0] || "User",
    role: "CLIENT", // Default role, can be changed by admin
    orgId: "", // To be assigned later
    createdAt: admin.firestore.Timestamp.now(),
  };

  try {
    await db.collection("users").doc(uid).set(userProfile);
    console.log(`User profile created for ${uid}`);
  } catch (error) {
    console.error(`Error creating user profile for ${uid}:`, error);
    throw error;
  }
});

/**
 * Get user profile
 * GET /getUserProfile?uid=xxx
 */
export const getUserProfile = onRequest(
  { region: REGION, cors: true },
  async (req, res) => {
    // Verify request method
    if (req.method !== "GET") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const uid = req.query.uid as string;

    if (!uid) {
      res.status(400).json({ error: "Missing uid parameter" });
      return;
    }

    try {
      // Verify the request has a valid Firebase ID token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized: Missing or invalid authorization header" });
        return;
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      // Users can only fetch their own profile unless they have admin role
      if (decodedToken.uid !== uid) {
        // Check if requester is an admin
        const requesterDoc = await db.collection("users").doc(decodedToken.uid).get();
        const requesterProfile = requesterDoc.data() as UserProfile | undefined;

        if (!requesterProfile || !["OWNER", "PM"].includes(requesterProfile.role)) {
          res.status(403).json({ error: "Forbidden: Cannot access other user profiles" });
          return;
        }
      }

      const userDoc = await db.collection("users").doc(uid).get();

      if (!userDoc.exists) {
        res.status(404).json({ error: "User profile not found" });
        return;
      }

      res.status(200).json(userDoc.data());
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * Update user profile
 * PUT /updateUserProfile
 * Body: { uid, updates: { displayName?, role?, orgId? } }
 */
export const updateUserProfile = onRequest(
  { region: REGION, cors: true },
  async (req, res) => {
    // Verify request method
    if (req.method !== "PUT" && req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      // Verify the request has a valid Firebase ID token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized: Missing or invalid authorization header" });
        return;
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      const { uid, updates } = req.body;

      if (!uid || !updates) {
        res.status(400).json({ error: "Missing uid or updates in request body" });
        return;
      }

      // Users can only update their own profile unless they have admin role
      if (decodedToken.uid !== uid) {
        const requesterDoc = await db.collection("users").doc(decodedToken.uid).get();
        const requesterProfile = requesterDoc.data() as UserProfile | undefined;

        if (!requesterProfile || !["OWNER", "PM"].includes(requesterProfile.role)) {
          res.status(403).json({ error: "Forbidden: Cannot update other user profiles" });
          return;
        }
      }

      // Validate updates - only allow certain fields
      const allowedFields = ["displayName", "role", "orgId", "photoURL"];
      const sanitizedUpdates: Record<string, unknown> = {};

      for (const key of Object.keys(updates)) {
        if (allowedFields.includes(key)) {
          sanitizedUpdates[key] = updates[key];
        }
      }

      // Add updatedAt timestamp
      sanitizedUpdates.updatedAt = admin.firestore.Timestamp.now();

      await db.collection("users").doc(uid).update(sanitizedUpdates);

      res.status(200).json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * Optional: Firestore trigger when a user document is created
 * Can be used for additional processing like sending welcome emails
 */
export const onUserCreated = onDocumentCreated(
  { document: "users/{userId}", region: REGION },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log("No data associated with the event");
      return;
    }

    const userData = snapshot.data() as UserProfile;
    console.log(`New user document created: ${userData.uid} with role ${userData.role}`);

    // Additional processing can be added here
    // e.g., send welcome email, initialize user preferences, etc.
  }
);

/**
 * Send invite email when a new invite document is created
 * Triggered on invites/{inviteId} creation
 */
export const onInviteCreated = onDocumentCreated(
  { document: "invites/{inviteId}", region: REGION },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log("No data associated with invite event");
      return;
    }

    const data = snapshot.data();
    await handleInviteCreated(event.params.inviteId, {
      email: data.email,
      name: data.name,
      role: data.role,
      orgId: data.orgId,
      invitedBy: data.invitedBy,
      status: data.status,
    });
  }
);

// ============================================
// E-Signature Cloud Functions
// ============================================

// Firestore document data type for signature requests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FirestoreSignatureRequest = any;

/**
 * Send signature request emails when status changes to "pending"
 * Triggered on signatureRequests/{requestId} update
 */
export const onSignatureRequestUpdated = onDocumentUpdated(
  { document: "signatureRequests/{requestId}", region: REGION },
  async (event) => {
    const beforeData = event.data?.before.data() as FirestoreSignatureRequest;
    const afterData = event.data?.after.data() as FirestoreSignatureRequest;

    if (!beforeData || !afterData) {
      console.log("No data for signature request update");
      return;
    }

    const requestId = event.params.requestId;

    // Check if status changed from draft to pending (send initial emails)
    if (beforeData.status === "draft" && afterData.status === "pending") {
      console.log(`Signature request ${requestId} changed to pending, sending emails`);
      await sendSignatureRequestEmails(requestId, { ...afterData, id: requestId });
      return;
    }

    // Check for signer status changes
    const signers = afterData.signers || [];
    for (let i = 0; i < signers.length; i++) {
      const beforeSigner = beforeData.signers?.[i];
      const afterSigner = signers[i];

      if (!beforeSigner || !afterSigner) continue;

      // Signer just signed
      if (beforeSigner.status !== "signed" && afterSigner.status === "signed") {
        console.log(`Signer ${afterSigner.name} signed request ${requestId}`);

        // Notify the sender
        await sendSignatureCompletedEmail(requestId, { ...afterData, id: requestId }, i);

        // Send copy to signer
        await sendSignedDocumentCopy(requestId, { ...afterData, id: requestId }, i);
      }

      // Signer declined
      if (beforeSigner.status !== "declined" && afterSigner.status === "declined") {
        console.log(`Signer ${afterSigner.name} declined request ${requestId}`);
        await sendSignatureDeclinedEmail(requestId, { ...afterData, id: requestId }, i);
      }
    }
  }
);

// ============================================
// Automated Email Cloud Functions
// ============================================

/**
 * Send invoice email when invoice status changes to 'sent'
 * Triggered on invoices/{invoiceId} update
 */
export const onInvoiceSent = onDocumentUpdated(
  { document: "invoices/{invoiceId}", region: REGION },
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) {
      console.log("No data for invoice update");
      return;
    }

    const invoiceId = event.params.invoiceId;

    // Check if status changed to 'sent'
    if (beforeData.status !== "sent" && afterData.status === "sent") {
      console.log(`Invoice ${invoiceId} status changed to sent, sending email`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await sendInvoiceEmail({ id: invoiceId, ...afterData } as any);
    }
  }
);

/**
 * Send payment received email when payment is recorded
 * Triggered on payments/{paymentId} creation
 */
export const onPaymentCreated = onDocumentCreated(
  { document: "payments/{paymentId}", region: REGION },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log("No data for payment event");
      return;
    }

    const paymentData = snapshot.data();
    const paymentId = event.params.paymentId;

    console.log(`Payment ${paymentId} created, sending confirmation email`);

    // Get the related invoice
    if (paymentData.invoiceId) {
      const invoiceDoc = await db.collection("invoices").doc(paymentData.invoiceId).get();
      if (invoiceDoc.exists) {
        const invoiceData = invoiceDoc.data();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await sendPaymentReceivedEmail(
          { id: paymentId, ...paymentData } as any,
          { id: invoiceDoc.id, ...invoiceData } as any
        );
      }
    }
  }
);

/**
 * Send estimate email when estimate status changes to 'sent'
 * Triggered on estimates/{estimateId} update
 */
export const onEstimateSent = onDocumentUpdated(
  { document: "estimates/{estimateId}", region: REGION },
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) {
      console.log("No data for estimate update");
      return;
    }

    const estimateId = event.params.estimateId;

    // Check if status changed to 'sent'
    if (beforeData.status !== "sent" && afterData.status === "sent") {
      console.log(`Estimate ${estimateId} status changed to sent, sending email`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await sendEstimateEmail({ id: estimateId, ...afterData } as any);
    }
  }
);

/**
 * Scheduled function to send invoice reminders
 * Runs daily at 9:00 AM UTC
 */
export const sendDailyInvoiceReminders = onSchedule(
  {
    schedule: "0 9 * * *", // 9:00 AM UTC daily
    region: REGION,
    timeZone: "America/Los_Angeles",
  },
  async () => {
    console.log("Running daily invoice reminder job");
    await processInvoiceReminders();
    console.log("Daily invoice reminder job complete");
  }
);
