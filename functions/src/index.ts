import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { auth } from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { handleInviteCreated } from "./email/sendInviteEmail";
import {
  sendSignatureRequestEmails,
  sendSignatureCompletedEmail,
  sendSignatureDeclinedEmail,
  sendSignedDocumentCopy,
} from "./email/sendSignatureEmails";

// Intelligence data fetching functions
export {
  fetchMaterialPricesScheduled,
  fetchMaterialPricesHttp,
} from "./intelligence/fetchMaterialPrices";
export {
  fetchLaborRatesScheduled,
  fetchLaborRatesHttp,
} from "./intelligence/fetchLaborRates";

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

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
