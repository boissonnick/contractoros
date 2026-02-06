/**
 * Send Review Request Functions
 *
 * Handles sending review request SMS and emails when a reviewRequest
 * document is created with status 'pending'.
 */

import { getFirestore, Firestore, Timestamp } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";

// Twilio secrets (reusing existing)
const twilioAccountSid = defineSecret("TWILIO_ACCOUNT_SID");
const twilioAuthToken = defineSecret("TWILIO_AUTH_TOKEN");
const twilioPhoneNumber = defineSecret("TWILIO_PHONE_NUMBER");

// Mailgun secrets (reusing existing)
const mailgunApiKey = defineSecret("MAILGUN_API_KEY");
const mailgunDomain = defineSecret("MAILGUN_DOMAIN");

// Export secrets for use in index.ts
export const reviewSecrets = [
  twilioAccountSid,
  twilioAuthToken,
  twilioPhoneNumber,
  mailgunApiKey,
  mailgunDomain,
];

// Lazy initialization for Firestore
let _db: Firestore | null = null;
function getDb(): Firestore {
  if (!_db) {
    _db = getFirestore(admin.app(), "contractoros");
  }
  return _db;
}

/**
 * Review request data structure
 */
interface ReviewRequestData {
  orgId: string;
  projectId: string;
  clientId: string;
  channel: "sms" | "email";
  status: "pending" | "sent" | "clicked" | "completed" | "failed";
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  templateId?: string;
  errorMessage?: string;
  retryCount: number;
}

/**
 * Organization data for templates
 */
interface OrgData {
  name: string;
  email?: string;
  phone?: string;
  googleReviewLink?: string;
}

/**
 * Project data for templates
 */
interface ProjectData {
  name: string;
}

/**
 * Send SMS via Twilio
 */
async function sendSmsViaTwilio(
  to: string,
  body: string
): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    const formattedTo = formatToE164(to);
    const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid.value()}/Messages.json`;

    const formData = new URLSearchParams();
    formData.append("To", formattedTo);
    formData.append("From", twilioPhoneNumber.value());
    formData.append("Body", body);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${twilioAccountSid.value()}:${twilioAuthToken.value()}`
        ).toString("base64")}`,
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || `Twilio error: ${response.status}` };
    }

    return { success: true, sid: data.sid };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "SMS send failed" };
  }
}

/**
 * Send email via Mailgun
 */
async function sendEmailViaMailgun(
  to: string,
  toName: string,
  subject: string,
  html: string,
  fromName: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const domain = mailgunDomain.value();
    const url = `https://api.mailgun.net/v3/${domain}/messages`;

    const formData = new URLSearchParams();
    formData.append("from", `${fromName} <noreply@${domain}>`);
    formData.append("to", `${toName} <${to}>`);
    formData.append("subject", subject);
    formData.append("html", html);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`api:${mailgunApiKey.value()}`).toString("base64")}`,
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || `Mailgun error: ${response.status}` };
    }

    return { success: true, id: data.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Email send failed" };
  }
}

/**
 * Format phone to E.164
 */
function formatToE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (phone.startsWith("+")) {
    return phone;
  }
  return `+${digits}`;
}

/**
 * Get review link for the organization
 */
async function getReviewLink(orgId: string): Promise<string> {
  // First check if org has a custom Google review link
  const orgDoc = await getDb().collection("organizations").doc(orgId).get();
  const orgData = orgDoc.data() as OrgData | undefined;

  if (orgData?.googleReviewLink) {
    return orgData.googleReviewLink;
  }

  // Check for Google Business connection
  const connectionsSnapshot = await getDb()
    .collection("organizations")
    .doc(orgId)
    .collection("googleBusinessConnections")
    .limit(1)
    .get();

  if (!connectionsSnapshot.empty) {
    const connection = connectionsSnapshot.docs[0].data();
    // Construct Google review link from location ID
    if (connection.locationId) {
      return `https://search.google.com/local/writereview?placeid=${connection.locationId}`;
    }
  }

  // Fallback - return empty (template should handle this)
  return "";
}

/**
 * Build SMS message from template
 */
function buildSmsMessage(
  recipientName: string,
  companyName: string,
  projectName: string,
  reviewLink: string
): string {
  return `Hi ${recipientName}, thank you for choosing ${companyName} for your ${projectName}! We'd love to hear about your experience. Please leave us a review: ${reviewLink} - Thank you!`;
}

/**
 * Build email HTML from template
 */
function buildEmailHtml(
  recipientName: string,
  companyName: string,
  projectName: string,
  reviewLink: string
): string {
  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hi ${recipientName},</p>
  <p>Thank you for choosing <strong>${companyName}</strong> for your <strong>${projectName}</strong>!</p>
  <p>We hope you're thrilled with the results. Your feedback helps us continue delivering excellent service and helps other homeowners find quality contractors.</p>
  <p>Would you mind taking a moment to share your experience?</p>
  <p style="text-align: center; margin: 24px 0;">
    <a href="${reviewLink}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Leave a Review</a>
  </p>
  <p style="color: #6b7280; font-size: 14px;">Thank you for your business!</p>
  <p style="color: #6b7280; font-size: 14px;">${companyName}</p>
</div>
  `.trim();
}

/**
 * Process a review request - send SMS or email based on channel
 */
export async function processReviewRequest(
  requestId: string,
  requestData: ReviewRequestData
): Promise<void> {
  const db = getDb();
  const { orgId, projectId, channel, recipientName, recipientEmail, recipientPhone } = requestData;

  // Get org data for company name
  const orgDoc = await db.collection("organizations").doc(orgId).get();
  const orgData = orgDoc.data() as OrgData | undefined;
  const companyName = orgData?.name || "Our Company";

  // Get project data for project name
  const projectDoc = await db
    .collection("organizations")
    .doc(orgId)
    .collection("projects")
    .doc(projectId)
    .get();
  const projectData = projectDoc.data() as ProjectData | undefined;
  const projectName = projectData?.name || "your project";

  // Get review link
  const reviewLink = await getReviewLink(orgId);

  if (!reviewLink) {
    // No review link configured - mark as failed
    await db.collection("organizations").doc(orgId).collection("reviewRequests").doc(requestId).update({
      status: "failed",
      errorMessage: "No review link configured. Please connect Google Business Profile or set a custom review link.",
      updatedAt: Timestamp.now(),
    });
    console.log(`Review request ${requestId} failed: No review link configured`);
    return;
  }

  let result: { success: boolean; error?: string };

  if (channel === "sms") {
    if (!recipientPhone) {
      await db.collection("organizations").doc(orgId).collection("reviewRequests").doc(requestId).update({
        status: "failed",
        errorMessage: "No phone number provided",
        updatedAt: Timestamp.now(),
      });
      return;
    }

    const message = buildSmsMessage(recipientName, companyName, projectName, reviewLink);
    result = await sendSmsViaTwilio(recipientPhone, message);
  } else {
    if (!recipientEmail) {
      await db.collection("organizations").doc(orgId).collection("reviewRequests").doc(requestId).update({
        status: "failed",
        errorMessage: "No email address provided",
        updatedAt: Timestamp.now(),
      });
      return;
    }

    const subject = `How was your experience with ${companyName}?`;
    const html = buildEmailHtml(recipientName, companyName, projectName, reviewLink);
    result = await sendEmailViaMailgun(recipientEmail, recipientName, subject, html, companyName);
  }

  // Update request status
  if (result.success) {
    await db.collection("organizations").doc(orgId).collection("reviewRequests").doc(requestId).update({
      status: "sent",
      sentAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log(`Review request ${requestId} sent successfully via ${channel}`);
  } else {
    await db.collection("organizations").doc(orgId).collection("reviewRequests").doc(requestId).update({
      status: "failed",
      errorMessage: result.error,
      retryCount: (requestData.retryCount || 0) + 1,
      updatedAt: Timestamp.now(),
    });
    console.log(`Review request ${requestId} failed: ${result.error}`);
  }
}
