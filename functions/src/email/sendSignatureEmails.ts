import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { sendEmail } from "./sendEmail";
import {
  signatureRequestEmailTemplate,
  signatureReminderEmailTemplate,
  signatureCompletedEmailTemplate,
  signatureDeclinedEmailTemplate,
} from "./emailTemplates";
import { format } from "date-fns";

interface SignerInfo {
  id: string;
  order: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  accessToken: string;
  tokenExpiresAt: Timestamp | Date;
  status: "pending" | "sent" | "viewed" | "signed" | "declined";
  signedAt?: Timestamp | Date;
  declinedAt?: Timestamp | Date;
  declineReason?: string;
  remindersSent: number;
}

interface SignatureRequestData {
  id: string;
  orgId: string;
  projectId?: string;
  documentType: string;
  documentId?: string;
  documentTitle: string;
  documentPdfUrl?: string;
  signers: SignerInfo[];
  currentSignerIndex: number;
  status: string;
  emailSubject?: string;
  emailMessage?: string;
  expiresAt?: Timestamp | Date;
  createdBy: string;
  createdByName: string;
}

interface OrgData {
  name: string;
  branding?: {
    primaryColor?: string;
    logoURL?: string;
  };
  logoURL?: string;
}

/**
 * Get organization data for email branding
 */
async function getOrgData(orgId: string): Promise<OrgData | null> {
  const db = getFirestore();
  const orgSnap = await db.collection("organizations").doc(orgId).get();
  if (!orgSnap.exists) return null;
  return orgSnap.data() as OrgData;
}

/**
 * Generate signing URL from request ID and signer index
 */
function generateSigningUrl(requestId: string, signerIndex: number): string {
  const token = Buffer.from(`${requestId}:${signerIndex}`).toString("base64");
  const appUrl = process.env.APP_URL || "https://app.contractoros.com";
  return `${appUrl}/sign/${token}`;
}

/**
 * Format a date for email display
 */
function formatDate(date: Timestamp | Date | undefined): string {
  if (!date) return "N/A";
  const d = date instanceof Timestamp ? date.toDate() : date;
  return format(d, "MMMM d, yyyy 'at' h:mm a");
}

/**
 * Send signature request emails to all pending signers
 */
export async function sendSignatureRequestEmails(
  requestId: string,
  data: SignatureRequestData
): Promise<void> {
  const orgData = await getOrgData(data.orgId);
  const orgName = orgData?.name || "ContractorOS";
  const primaryColor = orgData?.branding?.primaryColor;
  const logoURL = orgData?.branding?.logoURL || orgData?.logoURL;

  // Send to all signers with "sent" status
  for (let i = 0; i < data.signers.length; i++) {
    const signer = data.signers[i];
    if (signer.status !== "sent" && signer.status !== "pending") continue;

    const signingLink = generateSigningUrl(requestId, i);
    const expiresAt = formatDate(data.expiresAt);

    const { subject, html } = signatureRequestEmailTemplate({
      signerName: signer.name,
      senderName: data.createdByName,
      orgName,
      documentTitle: data.documentTitle,
      signingLink,
      expiresAt,
      message: data.emailMessage,
      primaryColor,
      logoURL,
    });

    await sendEmail({
      to: signer.email,
      subject: data.emailSubject || subject,
      html,
    });

    console.log(`Signature request email sent to ${signer.email} for request ${requestId}`);
  }
}

/**
 * Send a reminder email to a specific signer
 */
export async function sendSignatureReminderEmail(
  requestId: string,
  data: SignatureRequestData,
  signerIndex: number
): Promise<void> {
  const signer = data.signers[signerIndex];
  if (!signer) {
    console.error(`Signer at index ${signerIndex} not found for request ${requestId}`);
    return;
  }

  const orgData = await getOrgData(data.orgId);
  const orgName = orgData?.name || "ContractorOS";
  const primaryColor = orgData?.branding?.primaryColor;
  const logoURL = orgData?.branding?.logoURL || orgData?.logoURL;

  const signingLink = generateSigningUrl(requestId, signerIndex);
  const expiresAt = formatDate(data.expiresAt);

  const { subject, html } = signatureReminderEmailTemplate({
    signerName: signer.name,
    senderName: data.createdByName,
    orgName,
    documentTitle: data.documentTitle,
    signingLink,
    expiresAt,
    reminderNumber: signer.remindersSent || 1,
    primaryColor,
    logoURL,
  });

  await sendEmail({
    to: signer.email,
    subject,
    html,
  });

  console.log(`Reminder email sent to ${signer.email} for request ${requestId}`);
}

/**
 * Send signature completed notification to the sender
 */
export async function sendSignatureCompletedEmail(
  requestId: string,
  data: SignatureRequestData,
  signerIndex: number
): Promise<void> {
  const signer = data.signers[signerIndex];
  if (!signer) return;

  const db = getFirestore();
  const orgData = await getOrgData(data.orgId);
  const orgName = orgData?.name || "ContractorOS";
  const primaryColor = orgData?.branding?.primaryColor;
  const logoURL = orgData?.branding?.logoURL || orgData?.logoURL;

  // Get sender's email
  const senderDoc = await db.collection("users").doc(data.createdBy).get();
  const senderEmail = senderDoc.data()?.email;

  if (!senderEmail) {
    console.error(`Sender email not found for user ${data.createdBy}`);
    return;
  }

  const appUrl = process.env.APP_URL || "https://app.contractoros.com";
  const viewLink = `${appUrl}/dashboard/signatures/${requestId}`;
  const signedAt = formatDate(signer.signedAt);

  const { subject, html } = signatureCompletedEmailTemplate({
    recipientName: data.createdByName,
    signerName: signer.name,
    orgName,
    documentTitle: data.documentTitle,
    viewLink,
    signedAt,
    primaryColor,
    logoURL,
  });

  await sendEmail({
    to: senderEmail,
    subject,
    html,
  });

  console.log(`Signature completed email sent to ${senderEmail} for request ${requestId}`);
}

/**
 * Send signature declined notification to the sender
 */
export async function sendSignatureDeclinedEmail(
  requestId: string,
  data: SignatureRequestData,
  signerIndex: number
): Promise<void> {
  const signer = data.signers[signerIndex];
  if (!signer) return;

  const db = getFirestore();
  const orgData = await getOrgData(data.orgId);
  const orgName = orgData?.name || "ContractorOS";
  const primaryColor = orgData?.branding?.primaryColor;
  const logoURL = orgData?.branding?.logoURL || orgData?.logoURL;

  // Get sender's email
  const senderDoc = await db.collection("users").doc(data.createdBy).get();
  const senderEmail = senderDoc.data()?.email;

  if (!senderEmail) {
    console.error(`Sender email not found for user ${data.createdBy}`);
    return;
  }

  const appUrl = process.env.APP_URL || "https://app.contractoros.com";
  const viewLink = `${appUrl}/dashboard/signatures/${requestId}`;

  const { subject, html } = signatureDeclinedEmailTemplate({
    recipientName: data.createdByName,
    signerName: signer.name,
    orgName,
    documentTitle: data.documentTitle,
    declineReason: signer.declineReason,
    viewLink,
    primaryColor,
    logoURL,
  });

  await sendEmail({
    to: senderEmail,
    subject,
    html,
  });

  console.log(`Signature declined email sent to ${senderEmail} for request ${requestId}`);
}

/**
 * Send copy of signed document to signer
 */
export async function sendSignedDocumentCopy(
  requestId: string,
  data: SignatureRequestData,
  signerIndex: number
): Promise<void> {
  const signer = data.signers[signerIndex];
  if (!signer) return;

  const orgData = await getOrgData(data.orgId);
  const orgName = orgData?.name || "ContractorOS";
  const primaryColor = orgData?.branding?.primaryColor;
  const logoURL = orgData?.branding?.logoURL || orgData?.logoURL;

  const viewLink = generateSigningUrl(requestId, signerIndex); // They can view their signed copy

  const { html } = signatureCompletedEmailTemplate({
    recipientName: signer.name,
    signerName: "You",
    orgName,
    documentTitle: data.documentTitle,
    viewLink,
    signedAt: formatDate(signer.signedAt),
    primaryColor,
    logoURL,
  });

  await sendEmail({
    to: signer.email,
    subject: `Your signed copy: ${data.documentTitle}`,
    html,
  });

  console.log(`Signed document copy sent to ${signer.email} for request ${requestId}`);
}
