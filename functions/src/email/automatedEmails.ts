/**
 * Automated Email Functions
 * Handles automatic email sending for invoices, estimates, and payments
 */

import * as admin from "firebase-admin";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { sendEmail } from "./sendEmail";

// Firestore reference - use named database 'contractoros'
// Lazy initialization to avoid calling admin.app() before initializeApp()
let _db: Firestore | null = null;
function getDb(): Firestore {
  if (!_db) {
    _db = getFirestore(admin.app(), "contractoros");
  }
  return _db;
}

// Base URL for links
const BASE_URL = process.env.APP_URL || "https://app.contractoros.com";

// ============================================
// Types
// ============================================

interface Organization {
  name: string;
  email?: string;
  phone?: string;
  logoURL?: string;
  branding?: {
    primaryColor?: string;
  };
}

interface Client {
  name: string;
  email: string;
}

interface Invoice {
  id: string;
  orgId: string;
  clientId: string;
  clientName?: string;
  clientEmail?: string;
  projectId?: string;
  projectName?: string;
  number: string;
  total: number;
  amountDue: number;
  amountPaid: number;
  status: string;
  dueDate: admin.firestore.Timestamp;
  createdAt: admin.firestore.Timestamp;
}

interface Estimate {
  id: string;
  orgId: string;
  clientId: string;
  clientName?: string;
  clientEmail?: string;
  projectId?: string;
  projectName?: string;
  number: string;
  total: number;
  status: string;
  validUntil?: admin.firestore.Timestamp;
  createdAt: admin.firestore.Timestamp;
}

interface Payment {
  id: string;
  orgId: string;
  invoiceId: string;
  clientId?: string;
  amount: number;
  method: string;
  createdAt: admin.firestore.Timestamp;
}


// ============================================
// Helper Functions
// ============================================

async function getOrganization(orgId: string): Promise<Organization | null> {
  try {
    const doc = await getDb().collection("organizations").doc(orgId).get();
    return doc.exists ? (doc.data() as Organization) : null;
  } catch (error) {
    console.error("Error fetching organization:", error);
    return null;
  }
}

async function getClient(clientId: string): Promise<Client | null> {
  try {
    const doc = await getDb().collection("users").doc(clientId).get();
    if (!doc.exists) return null;
    const data = doc.data();
    return {
      name: data?.displayName || data?.name || "Client",
      email: data?.email || "",
    };
  } catch (error) {
    console.error("Error fetching client:", error);
    return null;
  }
}

async function getEmailTemplate(
  orgId: string,
  type: string
): Promise<{ subject: string; body: string } | null> {
  try {
    // First check for org-specific template
    const orgTemplatesRef = getDb().collection("organizations").doc(orgId).collection("emailTemplates");
    const snapshot = await orgTemplatesRef.where("type", "==", type).where("isActive", "==", true).limit(1).get();

    if (!snapshot.empty) {
      const template = snapshot.docs[0].data();
      return {
        subject: template.subject,
        body: template.body,
      };
    }

    // Fall back to default templates
    return getDefaultTemplate(type);
  } catch (error) {
    console.error("Error fetching email template:", error);
    return getDefaultTemplate(type);
  }
}

function getDefaultTemplate(type: string): { subject: string; body: string } | null {
  const templates: Record<string, { subject: string; body: string }> = {
    invoice_sent: {
      subject: "Invoice #{{invoiceNumber}} from {{companyName}}",
      body: `
        <p>Hi {{clientName}},</p>
        <p>Please find your invoice for <strong>{{projectName}}</strong>.</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:20px 0;">
          <p style="margin:0;"><strong>Invoice #:</strong> {{invoiceNumber}}</p>
          <p style="margin:8px 0 0;"><strong>Amount Due:</strong> {{amount}}</p>
          <p style="margin:8px 0 0;"><strong>Due Date:</strong> {{dueDate}}</p>
        </div>
        <p style="text-align:center;margin:24px 0;">
          <a href="{{paymentLink}}" style="display:inline-block;background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">Pay Now</a>
        </p>
        <p style="color:#6b7280;font-size:14px;">Thank you for your business!</p>
      `,
    },
    invoice_reminder: {
      subject: "Reminder: Invoice #{{invoiceNumber}} Due {{dueDate}}",
      body: `
        <p>Hi {{clientName}},</p>
        <p>This is a friendly reminder that invoice #{{invoiceNumber}} for <strong>{{amount}}</strong> is due on <strong>{{dueDate}}</strong>.</p>
        <p style="text-align:center;margin:24px 0;">
          <a href="{{paymentLink}}" style="display:inline-block;background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">Pay Now</a>
        </p>
        <p style="color:#6b7280;font-size:14px;">If you've already sent payment, please disregard this message.</p>
      `,
    },
    invoice_overdue: {
      subject: "Overdue: Invoice #{{invoiceNumber}} - {{daysPastDue}} Days Past Due",
      body: `
        <p>Hi {{clientName}},</p>
        <p>Invoice #{{invoiceNumber}} for <strong>{{amount}}</strong> is now <strong>{{daysPastDue}} days past due</strong>.</p>
        <p>Please remit payment at your earliest convenience.</p>
        <p style="text-align:center;margin:24px 0;">
          <a href="{{paymentLink}}" style="display:inline-block;background:#dc2626;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">Pay Now</a>
        </p>
        <p style="color:#6b7280;font-size:14px;">If you have questions about this invoice, please contact us.</p>
      `,
    },
    payment_received: {
      subject: "Payment Received - Thank You!",
      body: `
        <p>Hi {{clientName}},</p>
        <p>We've received your payment of <strong>{{amount}}</strong> for invoice #{{invoiceNumber}}.</p>
        <div style="background:#dcfce7;padding:16px;border-radius:8px;margin:20px 0;text-align:center;">
          <p style="margin:0;color:#166534;font-size:18px;">Payment Confirmed</p>
        </div>
        <p>Thank you for your business!</p>
        <p style="color:#6b7280;font-size:14px;">{{companyName}}</p>
      `,
    },
    estimate_sent: {
      subject: "Your Estimate from {{companyName}}",
      body: `
        <p>Hi {{clientName}},</p>
        <p>Thank you for your interest! Please find your estimate for <strong>{{projectName}}</strong>.</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:20px 0;">
          <p style="margin:0;"><strong>Estimate Total:</strong> {{amount}}</p>
          <p style="margin:8px 0 0;"><strong>Valid Until:</strong> {{validUntil}}</p>
        </div>
        <p>Click below to view and approve:</p>
        <p style="text-align:center;margin:24px 0;">
          <a href="{{viewLink}}" style="display:inline-block;background:#1a56db;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">View Estimate</a>
        </p>
        <p style="color:#6b7280;font-size:14px;">Questions? Reply to this email or call us at {{companyPhone}}.</p>
      `,
    },
  };

  return templates[type] || null;
}

function renderTemplate(template: string, variables: Record<string, string>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return rendered;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(timestamp: admin.firestore.Timestamp | Date): string {
  const date = timestamp instanceof admin.firestore.Timestamp ? timestamp.toDate() : timestamp;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function wrapInEmailLayout(content: string, primaryColor = "#2563eb", logoURL?: string): string {
  const logoHtml = logoURL
    ? `<img src="${logoURL}" alt="Logo" style="max-height:40px;max-width:160px;margin-bottom:16px;" />`
    : `<h1 style="color:${primaryColor};font-size:20px;font-weight:bold;margin:0 0 16px 0;">ContractorOS</h1>`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="padding:32px 32px 0 32px;">
      ${logoHtml}
    </div>
    <div style="padding:0 32px 32px 32px;">
      ${content}
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Sent by ContractorOS</p>
    </div>
  </div>
</body>
</html>`;
}

async function logEmail(
  orgId: string,
  data: {
    templateType: string;
    templateId?: string;
    recipientEmail: string;
    recipientName: string;
    subject: string;
    status: "sent" | "failed";
    clientId?: string;
    projectId?: string;
    invoiceId?: string;
    estimateId?: string;
    errorMessage?: string;
  }
): Promise<void> {
  try {
    await getDb().collection("organizations").doc(orgId).collection("emailLogs").add({
      ...data,
      orgId,
      sentAt: admin.firestore.Timestamp.now(),
    });
  } catch (error) {
    console.error("Error logging email:", error);
  }
}

// ============================================
// Email Sending Functions
// ============================================

/**
 * Send invoice email when invoice is created or status changes to 'sent'
 */
export async function sendInvoiceEmail(invoice: Invoice): Promise<boolean> {
  const org = await getOrganization(invoice.orgId);
  if (!org) {
    console.error("Organization not found for invoice email");
    return false;
  }

  // Get client email
  let clientEmail = invoice.clientEmail;
  let clientName = invoice.clientName || "Client";

  if (!clientEmail && invoice.clientId) {
    const client = await getClient(invoice.clientId);
    if (client) {
      clientEmail = client.email;
      clientName = client.name;
    }
  }

  if (!clientEmail) {
    console.error("No client email for invoice:", invoice.id);
    return false;
  }

  // Get template
  const template = await getEmailTemplate(invoice.orgId, "invoice_sent");
  if (!template) {
    console.error("No template found for invoice_sent");
    return false;
  }

  // Prepare variables
  const variables: Record<string, string> = {
    clientName,
    projectName: invoice.projectName || "Your Project",
    invoiceNumber: invoice.number,
    amount: formatCurrency(invoice.amountDue),
    dueDate: formatDate(invoice.dueDate),
    paymentLink: `${BASE_URL}/client/invoices/${invoice.id}`,
    companyName: org.name,
    companyPhone: org.phone || "",
  };

  // Render template
  const subject = renderTemplate(template.subject, variables);
  const bodyContent = renderTemplate(template.body, variables);
  const html = wrapInEmailLayout(bodyContent, org.branding?.primaryColor, org.logoURL);

  // Send email
  const success = await sendEmail({
    to: clientEmail,
    subject,
    html,
    from: org.email ? `${org.name} <${org.email}>` : undefined,
  });

  // Log email
  await logEmail(invoice.orgId, {
    templateType: "invoice_sent",
    recipientEmail: clientEmail,
    recipientName: clientName,
    subject,
    status: success ? "sent" : "failed",
    clientId: invoice.clientId,
    projectId: invoice.projectId,
    invoiceId: invoice.id,
  });

  return success;
}

/**
 * Send payment received email
 */
export async function sendPaymentReceivedEmail(
  payment: Payment,
  invoice: Invoice
): Promise<boolean> {
  const org = await getOrganization(invoice.orgId);
  if (!org) {
    console.error("Organization not found for payment email");
    return false;
  }

  // Get client email
  let clientEmail = invoice.clientEmail;
  let clientName = invoice.clientName || "Client";

  if (!clientEmail && invoice.clientId) {
    const client = await getClient(invoice.clientId);
    if (client) {
      clientEmail = client.email;
      clientName = client.name;
    }
  }

  if (!clientEmail) {
    console.error("No client email for payment:", payment.id);
    return false;
  }

  // Get template
  const template = await getEmailTemplate(invoice.orgId, "payment_received");
  if (!template) {
    console.error("No template found for payment_received");
    return false;
  }

  // Prepare variables
  const variables: Record<string, string> = {
    clientName,
    amount: formatCurrency(payment.amount),
    invoiceNumber: invoice.number,
    companyName: org.name,
  };

  // Render template
  const subject = renderTemplate(template.subject, variables);
  const bodyContent = renderTemplate(template.body, variables);
  const html = wrapInEmailLayout(bodyContent, org.branding?.primaryColor, org.logoURL);

  // Send email
  const success = await sendEmail({
    to: clientEmail,
    subject,
    html,
    from: org.email ? `${org.name} <${org.email}>` : undefined,
  });

  // Log email
  await logEmail(invoice.orgId, {
    templateType: "payment_received",
    recipientEmail: clientEmail,
    recipientName: clientName,
    subject,
    status: success ? "sent" : "failed",
    clientId: invoice.clientId,
    projectId: invoice.projectId,
    invoiceId: invoice.id,
  });

  return success;
}

/**
 * Send estimate email
 */
export async function sendEstimateEmail(estimate: Estimate): Promise<boolean> {
  const org = await getOrganization(estimate.orgId);
  if (!org) {
    console.error("Organization not found for estimate email");
    return false;
  }

  // Get client email
  let clientEmail = estimate.clientEmail;
  let clientName = estimate.clientName || "Client";

  if (!clientEmail && estimate.clientId) {
    const client = await getClient(estimate.clientId);
    if (client) {
      clientEmail = client.email;
      clientName = client.name;
    }
  }

  if (!clientEmail) {
    console.error("No client email for estimate:", estimate.id);
    return false;
  }

  // Get template
  const template = await getEmailTemplate(estimate.orgId, "estimate_sent");
  if (!template) {
    console.error("No template found for estimate_sent");
    return false;
  }

  // Prepare variables
  const validUntil = estimate.validUntil
    ? formatDate(estimate.validUntil)
    : "30 days from now";

  const variables: Record<string, string> = {
    clientName,
    projectName: estimate.projectName || "Your Project",
    amount: formatCurrency(estimate.total),
    validUntil,
    viewLink: `${BASE_URL}/client/estimates/${estimate.id}`,
    companyName: org.name,
    companyPhone: org.phone || "",
  };

  // Render template
  const subject = renderTemplate(template.subject, variables);
  const bodyContent = renderTemplate(template.body, variables);
  const html = wrapInEmailLayout(bodyContent, org.branding?.primaryColor, org.logoURL);

  // Send email
  const success = await sendEmail({
    to: clientEmail,
    subject,
    html,
    from: org.email ? `${org.name} <${org.email}>` : undefined,
  });

  // Log email
  await logEmail(estimate.orgId, {
    templateType: "estimate_sent",
    recipientEmail: clientEmail,
    recipientName: clientName,
    subject,
    status: success ? "sent" : "failed",
    clientId: estimate.clientId,
    projectId: estimate.projectId,
    estimateId: estimate.id,
  });

  return success;
}

/**
 * Send invoice reminder email
 */
export async function sendInvoiceReminderEmail(
  invoice: Invoice,
  isOverdue: boolean = false
): Promise<boolean> {
  const org = await getOrganization(invoice.orgId);
  if (!org) {
    console.error("Organization not found for reminder email");
    return false;
  }

  // Get client email
  let clientEmail = invoice.clientEmail;
  let clientName = invoice.clientName || "Client";

  if (!clientEmail && invoice.clientId) {
    const client = await getClient(invoice.clientId);
    if (client) {
      clientEmail = client.email;
      clientName = client.name;
    }
  }

  if (!clientEmail) {
    console.error("No client email for reminder:", invoice.id);
    return false;
  }

  // Get template
  const templateType = isOverdue ? "invoice_overdue" : "invoice_reminder";
  const template = await getEmailTemplate(invoice.orgId, templateType);
  if (!template) {
    console.error(`No template found for ${templateType}`);
    return false;
  }

  // Calculate days past due if overdue
  const now = new Date();
  const dueDate = invoice.dueDate.toDate();
  const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

  // Prepare variables
  const variables: Record<string, string> = {
    clientName,
    invoiceNumber: invoice.number,
    amount: formatCurrency(invoice.amountDue),
    dueDate: formatDate(invoice.dueDate),
    daysPastDue: String(Math.max(0, daysPastDue)),
    paymentLink: `${BASE_URL}/client/invoices/${invoice.id}`,
    companyName: org.name,
  };

  // Render template
  const subject = renderTemplate(template.subject, variables);
  const bodyContent = renderTemplate(template.body, variables);
  const html = wrapInEmailLayout(bodyContent, org.branding?.primaryColor, org.logoURL);

  // Send email
  const success = await sendEmail({
    to: clientEmail,
    subject,
    html,
    from: org.email ? `${org.name} <${org.email}>` : undefined,
  });

  // Log email
  await logEmail(invoice.orgId, {
    templateType,
    recipientEmail: clientEmail,
    recipientName: clientName,
    subject,
    status: success ? "sent" : "failed",
    clientId: invoice.clientId,
    projectId: invoice.projectId,
    invoiceId: invoice.id,
  });

  return success;
}

/**
 * Process invoice reminders - called by scheduled function
 * Sends reminders for invoices due in 3 days and overdue invoices
 */
export async function processInvoiceReminders(): Promise<void> {
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Get all organizations
  const orgsSnapshot = await getDb().collection("organizations").get();

  for (const orgDoc of orgsSnapshot.docs) {
    const orgId = orgDoc.id;

    try {
      // Get invoices due in 3 days
      const dueSoonSnapshot = await getDb()
        .collection("invoices")
        .where("orgId", "==", orgId)
        .where("status", "in", ["sent", "viewed"])
        .where("dueDate", ">=", admin.firestore.Timestamp.fromDate(now))
        .where("dueDate", "<=", admin.firestore.Timestamp.fromDate(threeDaysFromNow))
        .get();

      for (const doc of dueSoonSnapshot.docs) {
        const invoice = { id: doc.id, ...doc.data() } as Invoice;
        console.log(`Sending reminder for invoice ${invoice.number} (due soon)`);
        await sendInvoiceReminderEmail(invoice, false);
      }

      // Get overdue invoices
      const overdueSnapshot = await getDb()
        .collection("invoices")
        .where("orgId", "==", orgId)
        .where("status", "in", ["sent", "viewed", "overdue"])
        .where("dueDate", "<", admin.firestore.Timestamp.fromDate(now))
        .get();

      for (const doc of overdueSnapshot.docs) {
        const invoice = { id: doc.id, ...doc.data() } as Invoice;
        console.log(`Sending overdue notice for invoice ${invoice.number}`);
        await sendInvoiceReminderEmail(invoice, true);
      }
    } catch (error) {
      console.error(`Error processing reminders for org ${orgId}:`, error);
    }
  }
}
