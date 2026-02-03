/**
 * Twilio SMS Cloud Functions
 *
 * Handles sending and receiving SMS messages via Twilio.
 * - sendSMS: Callable function for sending SMS from the app
 * - smsWebhook: HTTP endpoint for receiving Twilio webhooks
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { getFirestore, Firestore, Timestamp } from "firebase-admin/firestore";
import * as crypto from "crypto";

// Define Twilio secrets
const twilioAccountSid = defineSecret("TWILIO_ACCOUNT_SID");
const twilioAuthToken = defineSecret("TWILIO_AUTH_TOKEN");
const twilioPhoneNumber = defineSecret("TWILIO_PHONE_NUMBER");

// Region configuration
const REGION = "us-east1";

// Lazy initialization for Firestore - use named database 'contractoros'
let _db: Firestore | null = null;
function getDb(): Firestore {
  if (!_db) {
    _db = getFirestore(admin.app(), "contractoros");
  }
  return _db;
}

// ============================================
// Types
// ============================================

interface SendSmsRequest {
  to: string;
  message: string;
  projectId?: string;
  orgId: string;
  recipientId?: string;
  recipientType?: "client" | "subcontractor" | "employee";
  recipientName?: string;
  templateId?: string;
  metadata?: Record<string, unknown>;
}

interface TwilioMessageResponse {
  sid: string;
  status: string;
  errorCode?: number;
  errorMessage?: string;
  price?: string;
  priceUnit?: string;
}

interface TwilioWebhookData {
  MessageSid?: string;
  SmsSid?: string;
  MessageStatus?: string;
  From?: string;
  To?: string;
  Body?: string;
  AccountSid?: string;
  ErrorCode?: string;
  ErrorMessage?: string;
  Price?: string;
  PriceUnit?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Format phone number to E.164 format
 */
function formatToE164(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // If already has country code (11 digits starting with 1), add +
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // If 10 digits (US number), add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If already has + prefix, return as is
  if (phone.startsWith("+")) {
    return phone;
  }

  // Return with + prefix
  return `+${digits}`;
}

/**
 * Send SMS via Twilio REST API
 */
async function sendViaTwilio(
  to: string,
  body: string,
  from: string,
  accountSid: string,
  authToken: string
): Promise<TwilioMessageResponse> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const formData = new URLSearchParams();
  formData.append("To", to);
  formData.append("From", from);
  formData.append("Body", body);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
    },
    body: formData.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Twilio error: ${response.status}`);
  }

  return {
    sid: data.sid,
    status: data.status,
    errorCode: data.error_code,
    errorMessage: data.error_message,
    price: data.price,
    priceUnit: data.price_unit,
  };
}

/**
 * Verify Twilio webhook signature using HMAC-SHA1
 * https://www.twilio.com/docs/usage/security#validating-requests
 */
function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string
): boolean {
  // Sort params by key and concatenate key+value
  const sortedKeys = Object.keys(params).sort();
  let dataString = url;
  for (const key of sortedKeys) {
    dataString += key + params[key];
  }

  // Compute HMAC-SHA1 and base64 encode
  const computedSignature = crypto
    .createHmac("sha1", authToken)
    .update(dataString)
    .digest("base64");

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(signature)
    );
  } catch {
    // Lengths don't match
    return false;
  }
}

/**
 * Check if message is an opt-out request
 */
function isOptOutRequest(message: string): boolean {
  const optOutKeywords = ["stop", "unsubscribe", "cancel", "end", "quit"];
  const normalized = message.toLowerCase().trim();
  return optOutKeywords.includes(normalized);
}

/**
 * Check if message is an opt-in request
 */
function isOptInRequest(message: string): boolean {
  const optInKeywords = ["start", "yes", "unstop", "subscribe"];
  const normalized = message.toLowerCase().trim();
  return optInKeywords.includes(normalized);
}

// ============================================
// Cloud Functions
// ============================================

/**
 * sendSMS - Callable function for sending SMS messages
 *
 * This function verifies the user is authenticated and belongs to the
 * specified organization before sending an SMS via Twilio.
 *
 * Request body:
 * - to: Phone number to send to (required)
 * - message: Message body (required)
 * - orgId: Organization ID (required)
 * - projectId: Optional project reference
 * - recipientId: Optional recipient user ID
 * - recipientType: Optional - 'client', 'subcontractor', or 'employee'
 * - recipientName: Optional recipient name
 * - templateId: Optional template reference
 * - metadata: Optional additional metadata
 *
 * Returns:
 * - id: Firestore document ID
 * - sid: Twilio message SID
 * - status: Message status
 */
export const sendSMS = onCall(
  {
    region: REGION,
    secrets: [twilioAccountSid, twilioAuthToken, twilioPhoneNumber],
  },
  async (request) => {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    const data = request.data as SendSmsRequest;
    const { to, message, orgId, projectId, recipientId, recipientType, recipientName, templateId, metadata } = data;

    // Validate required fields
    if (!to || !message || !orgId) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: to, message, orgId"
      );
    }

    // Verify user belongs to organization
    const userDoc = await getDb().collection("users").doc(request.auth.uid).get();
    if (!userDoc.exists) {
      throw new HttpsError("permission-denied", "User not found");
    }

    const userData = userDoc.data();
    if (userData?.orgId !== orgId) {
      throw new HttpsError(
        "permission-denied",
        "User does not belong to this organization"
      );
    }

    // Check opt-out status
    const optOutSnapshot = await getDb()
      .collection("smsOptOuts")
      .where("phoneNumber", "==", formatToE164(to))
      .limit(1)
      .get();

    if (!optOutSnapshot.empty) {
      throw new HttpsError(
        "failed-precondition",
        "Recipient has opted out of SMS messages"
      );
    }

    // Format phone number
    const formattedTo = formatToE164(to);
    const from = twilioPhoneNumber.value();

    // Create SMS record in Firestore
    const smsData = {
      orgId,
      to: formattedTo,
      from,
      body: message,
      direction: "outbound",
      status: "queued",
      recipientId: recipientId || null,
      recipientType: recipientType || null,
      recipientName: recipientName || null,
      projectId: projectId || null,
      templateId: templateId || null,
      createdAt: Timestamp.now(),
      createdBy: request.auth.uid,
      metadata: metadata || {},
    };

    const docRef = await getDb().collection("smsMessages").add(smsData);

    try {
      // Send via Twilio
      const twilioResponse = await sendViaTwilio(
        formattedTo,
        message,
        from,
        twilioAccountSid.value(),
        twilioAuthToken.value()
      );

      // Update with Twilio response
      await docRef.update({
        twilioMessageSid: twilioResponse.sid,
        twilioAccountSid: twilioAccountSid.value(),
        status: twilioResponse.status,
        price: twilioResponse.price || null,
        priceUnit: twilioResponse.priceUnit || null,
        sentAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Update conversation
      await updateConversation(orgId, formattedTo, message, "outbound");

      console.log(`SMS sent successfully: ${docRef.id} -> ${twilioResponse.sid}`);

      return {
        id: docRef.id,
        sid: twilioResponse.sid,
        status: twilioResponse.status,
        to: formattedTo,
      };
    } catch (error) {
      // Update record with error
      const errorMessage = error instanceof Error ? error.message : "Failed to send";

      await docRef.update({
        status: "failed",
        errorMessage,
        updatedAt: Timestamp.now(),
      });

      console.error("Twilio send error:", error);
      throw new HttpsError("internal", errorMessage);
    }
  }
);

/**
 * smsWebhook - HTTP endpoint for Twilio webhooks
 *
 * Handles two types of webhooks:
 * 1. Status callbacks - Updates message status in Firestore
 * 2. Incoming messages - Stores incoming messages and handles opt-out/opt-in
 *
 * Returns TwiML response for incoming messages.
 */
export const smsWebhook = onRequest(
  {
    region: REGION,
    secrets: [twilioAuthToken],
  },
  async (req, res) => {
    // Only accept POST requests
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    try {
      // Get signature from header
      const twilioSignature = req.headers["x-twilio-signature"] as string;
      if (!twilioSignature) {
        console.warn("Missing X-Twilio-Signature header");
        res.status(403).send("Missing signature");
        return;
      }

      // Parse form data
      const data: TwilioWebhookData = req.body || {};

      // Build the full URL for signature verification
      // Use the original URL that Twilio called
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const webhookUrl = `${protocol}://${host}${req.originalUrl}`;

      // Convert data to Record<string, string> for verification
      const params: Record<string, string> = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
          params[key] = String(value);
        }
      }

      // Verify signature
      if (!verifyTwilioSignature(webhookUrl, params, twilioSignature, twilioAuthToken.value())) {
        console.warn("Invalid Twilio signature - rejecting webhook");
        res.status(403).send("Invalid signature");
        return;
      }

      // Determine webhook type
      const messageSid = data.MessageSid || data.SmsSid;
      const messageStatus = data.MessageStatus;
      const from = data.From;
      const to = data.To;
      const body = data.Body;

      if (messageStatus && messageSid) {
        // This is a status callback
        await handleStatusCallback(messageSid, messageStatus, data);
        res.status(200).send("OK");
        return;
      } else if (from && to && body && messageSid) {
        // This is an incoming message
        await handleIncomingMessage(messageSid, from, to, body, data);

        // Return TwiML response (empty to not send auto-reply)
        res.set("Content-Type", "application/xml");
        res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
        return;
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).send("Webhook processing failed");
    }
  }
);

/**
 * Handle message status updates from Twilio
 */
async function handleStatusCallback(
  messageSid: string,
  status: string,
  data: TwilioWebhookData
): Promise<void> {
  try {
    // Find the message by Twilio SID
    const snapshot = await getDb()
      .collection("smsMessages")
      .where("twilioMessageSid", "==", messageSid)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.log(`Message not found for SID: ${messageSid}`);
      return;
    }

    const docRef = snapshot.docs[0].ref;
    const updates: Record<string, unknown> = {
      status,
      updatedAt: Timestamp.now(),
    };

    // Add timing info based on status
    if (status === "delivered") {
      updates.deliveredAt = Timestamp.now();
    }

    // Add error info if failed
    if (status === "failed" || status === "undelivered") {
      updates.errorCode = data.ErrorCode || null;
      updates.errorMessage = data.ErrorMessage || null;
    }

    // Add pricing info if available
    if (data.Price) {
      updates.price = data.Price;
      updates.priceUnit = data.PriceUnit || "USD";
    }

    await docRef.update(updates);

    console.log(`Updated message ${messageSid} to status: ${status}`);
  } catch (error) {
    console.error("Status callback error:", error);
  }
}

/**
 * Handle incoming messages from Twilio
 */
async function handleIncomingMessage(
  messageSid: string,
  from: string,
  to: string,
  body: string,
  data: TwilioWebhookData
): Promise<void> {
  try {
    // Find the org that owns this phone number
    const phoneSnapshot = await getDb()
      .collection("twilioPhoneNumbers")
      .where("phoneNumber", "==", to)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    let orgId: string | null = null;

    if (!phoneSnapshot.empty) {
      orgId = phoneSnapshot.docs[0].data().orgId;
    }

    // Store the incoming message
    const incomingData = {
      orgId,
      to,
      from,
      body,
      direction: "inbound",
      status: "delivered",
      twilioMessageSid: messageSid,
      twilioAccountSid: data.AccountSid || null,
      createdAt: Timestamp.now(),
      deliveredAt: Timestamp.now(),
    };

    await getDb().collection("smsMessages").add(incomingData);

    // Handle opt-out/opt-in requests
    if (isOptOutRequest(body)) {
      await handleOptOut(from, orgId);
    } else if (isOptInRequest(body)) {
      await handleOptIn(from, orgId);
    }

    // Update or create conversation
    if (orgId) {
      await updateConversation(orgId, from, body, "inbound");
    }

    console.log(`Received message from ${from}: ${body.substring(0, 50)}...`);
  } catch (error) {
    console.error("Incoming message error:", error);
  }
}

/**
 * Handle opt-out request
 */
async function handleOptOut(phoneNumber: string, orgId: string | null): Promise<void> {
  try {
    // Check if opt-out record exists
    const existingSnapshot = await getDb()
      .collection("smsOptOuts")
      .where("phoneNumber", "==", phoneNumber)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      // Already opted out, update timestamp
      await existingSnapshot.docs[0].ref.update({
        updatedAt: Timestamp.now(),
      });
    } else {
      // Create new opt-out record
      await getDb().collection("smsOptOuts").add({
        phoneNumber,
        orgId,
        optedOutAt: Timestamp.now(),
        createdAt: Timestamp.now(),
      });
    }

    console.log(`Opt-out recorded for ${phoneNumber}`);
  } catch (error) {
    console.error("Opt-out error:", error);
  }
}

/**
 * Handle opt-in request
 */
async function handleOptIn(phoneNumber: string, orgId: string | null): Promise<void> {
  try {
    // Find and delete opt-out record
    const snapshot = await getDb()
      .collection("smsOptOuts")
      .where("phoneNumber", "==", phoneNumber)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.delete();
      console.log(`Opt-in recorded for ${phoneNumber}`);
    }
  } catch (error) {
    console.error("Opt-in error:", error);
  }
}

/**
 * Update or create conversation record
 */
async function updateConversation(
  orgId: string,
  phoneNumber: string,
  lastMessage: string,
  direction: "inbound" | "outbound"
): Promise<void> {
  try {
    // Find existing conversation
    const snapshot = await getDb()
      .collection("smsConversations")
      .where("orgId", "==", orgId)
      .where("phoneNumber", "==", phoneNumber)
      .limit(1)
      .get();

    const conversationData = {
      orgId,
      phoneNumber,
      lastMessageAt: Timestamp.now(),
      lastMessagePreview: lastMessage.substring(0, 100),
      lastMessageDirection: direction,
      updatedAt: Timestamp.now(),
    };

    if (snapshot.empty) {
      // Create new conversation
      await getDb().collection("smsConversations").add({
        ...conversationData,
        unreadCount: direction === "inbound" ? 1 : 0,
        createdAt: Timestamp.now(),
      });
    } else {
      // Update existing conversation
      const doc = snapshot.docs[0];
      const currentData = doc.data();
      const newUnreadCount =
        direction === "inbound"
          ? (currentData.unreadCount || 0) + 1
          : currentData.unreadCount || 0;

      await doc.ref.update({
        ...conversationData,
        unreadCount: newUnreadCount,
      });
    }
  } catch (error) {
    console.error("Update conversation error:", error);
  }
}
