interface InviteEmailData {
  inviteeName: string;
  inviterName: string;
  orgName: string;
  role: string;
  inviteLink: string;
  primaryColor?: string;
  logoURL?: string;
}

interface WelcomeEmailData {
  name: string;
  orgName: string;
  dashboardLink: string;
  primaryColor?: string;
  logoURL?: string;
}

function baseLayout(content: string, primaryColor = "#2563eb", logoURL?: string): string {
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

export function inviteEmailTemplate(data: InviteEmailData): { subject: string; html: string } {
  const content = `
    <h2 style="color:#111827;font-size:18px;margin:0 0 8px 0;">You've been invited!</h2>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 16px 0;">
      <strong>${data.inviterName}</strong> has invited you to join
      <strong>${data.orgName}</strong> as a <strong>${data.role}</strong> on ContractorOS.
    </p>
    <a href="${data.inviteLink}" style="display:inline-block;padding:12px 24px;background:${data.primaryColor || "#2563eb"};color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
      Accept Invitation
    </a>
    <p style="color:#9ca3af;font-size:12px;margin:16px 0 0 0;">
      This invitation expires in 7 days. If you didn't expect this, you can ignore it.
    </p>
  `;

  return {
    subject: `${data.inviterName} invited you to ${data.orgName} on ContractorOS`,
    html: baseLayout(content, data.primaryColor, data.logoURL),
  };
}

export function welcomeEmailTemplate(data: WelcomeEmailData): { subject: string; html: string } {
  const content = `
    <h2 style="color:#111827;font-size:18px;margin:0 0 8px 0;">Welcome to ContractorOS!</h2>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 16px 0;">
      Hi ${data.name}, your account at <strong>${data.orgName}</strong> is all set up.
      You can now access your dashboard to manage projects, tasks, and team.
    </p>
    <a href="${data.dashboardLink}" style="display:inline-block;padding:12px 24px;background:${data.primaryColor || "#2563eb"};color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
      Go to Dashboard
    </a>
  `;

  return {
    subject: `Welcome to ${data.orgName} on ContractorOS`,
    html: baseLayout(content, data.primaryColor, data.logoURL),
  };
}

// ============================================
// E-Signature Email Templates
// ============================================

interface SignatureRequestEmailData {
  signerName: string;
  senderName: string;
  orgName: string;
  documentTitle: string;
  signingLink: string;
  expiresAt: string;
  message?: string;
  primaryColor?: string;
  logoURL?: string;
}

interface SignatureReminderEmailData {
  signerName: string;
  senderName: string;
  orgName: string;
  documentTitle: string;
  signingLink: string;
  expiresAt: string;
  reminderNumber: number;
  primaryColor?: string;
  logoURL?: string;
}

interface SignatureCompletedEmailData {
  recipientName: string;
  signerName: string;
  orgName: string;
  documentTitle: string;
  viewLink: string;
  signedAt: string;
  primaryColor?: string;
  logoURL?: string;
}

interface SignatureDeclinedEmailData {
  recipientName: string;
  signerName: string;
  orgName: string;
  documentTitle: string;
  declineReason?: string;
  viewLink: string;
  primaryColor?: string;
  logoURL?: string;
}

export function signatureRequestEmailTemplate(data: SignatureRequestEmailData): { subject: string; html: string } {
  const messageHtml = data.message
    ? `<div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="color:#374151;font-size:14px;line-height:1.6;margin:0;font-style:italic;">"${data.message}"</p>
        <p style="color:#6b7280;font-size:12px;margin:8px 0 0 0;">- ${data.senderName}</p>
       </div>`
    : "";

  const content = `
    <h2 style="color:#111827;font-size:18px;margin:0 0 8px 0;">Please sign this document</h2>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 16px 0;">
      Hi ${data.signerName},<br><br>
      <strong>${data.senderName}</strong> from <strong>${data.orgName}</strong> has sent you a document to review and sign.
    </p>
    <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="color:#374151;font-size:14px;margin:0;">
        <strong>Document:</strong> ${data.documentTitle}
      </p>
      <p style="color:#6b7280;font-size:12px;margin:8px 0 0 0;">
        Please sign by ${data.expiresAt}
      </p>
    </div>
    ${messageHtml}
    <a href="${data.signingLink}" style="display:inline-block;padding:14px 28px;background:${data.primaryColor || "#2563eb"};color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
      Review & Sign Document
    </a>
    <p style="color:#9ca3af;font-size:12px;margin:24px 0 0 0;">
      No account needed. Click the button above to sign securely. If you have questions, reply to this email to contact ${data.senderName}.
    </p>
  `;

  return {
    subject: `${data.senderName} sent you "${data.documentTitle}" to sign`,
    html: baseLayout(content, data.primaryColor, data.logoURL),
  };
}

export function signatureReminderEmailTemplate(data: SignatureReminderEmailData): { subject: string; html: string } {
  const urgencyText = data.reminderNumber >= 2
    ? "This is your final reminder."
    : "This is a friendly reminder.";

  const content = `
    <h2 style="color:#111827;font-size:18px;margin:0 0 8px 0;">Reminder: Document awaiting your signature</h2>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 16px 0;">
      Hi ${data.signerName},<br><br>
      ${urgencyText} <strong>${data.senderName}</strong> is waiting for you to sign the following document:
    </p>
    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="color:#92400e;font-size:14px;margin:0;">
        <strong>Document:</strong> ${data.documentTitle}
      </p>
      <p style="color:#b45309;font-size:12px;margin:8px 0 0 0;">
        <strong>Expires:</strong> ${data.expiresAt}
      </p>
    </div>
    <a href="${data.signingLink}" style="display:inline-block;padding:14px 28px;background:${data.primaryColor || "#2563eb"};color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
      Sign Now
    </a>
    <p style="color:#9ca3af;font-size:12px;margin:24px 0 0 0;">
      Need more time? Reply to this email to let ${data.senderName} know.
    </p>
  `;

  return {
    subject: `Reminder: "${data.documentTitle}" needs your signature`,
    html: baseLayout(content, data.primaryColor, data.logoURL),
  };
}

export function signatureCompletedEmailTemplate(data: SignatureCompletedEmailData): { subject: string; html: string } {
  const content = `
    <h2 style="color:#111827;font-size:18px;margin:0 0 8px 0;">Document signed!</h2>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 16px 0;">
      Hi ${data.recipientName},<br><br>
      Great news! <strong>${data.signerName}</strong> has signed the document.
    </p>
    <div style="background:#d1fae5;border:1px solid #6ee7b7;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="color:#065f46;font-size:14px;margin:0;">
        <strong>Document:</strong> ${data.documentTitle}
      </p>
      <p style="color:#047857;font-size:12px;margin:8px 0 0 0;">
        <strong>Signed at:</strong> ${data.signedAt}
      </p>
    </div>
    <a href="${data.viewLink}" style="display:inline-block;padding:14px 28px;background:${data.primaryColor || "#2563eb"};color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
      View Signed Document
    </a>
    <p style="color:#9ca3af;font-size:12px;margin:24px 0 0 0;">
      The signed document has been securely stored and is available for download.
    </p>
  `;

  return {
    subject: `"${data.documentTitle}" has been signed by ${data.signerName}`,
    html: baseLayout(content, data.primaryColor, data.logoURL),
  };
}

export function signatureDeclinedEmailTemplate(data: SignatureDeclinedEmailData): { subject: string; html: string } {
  const reasonHtml = data.declineReason
    ? `<div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="color:#6b7280;font-size:12px;margin:0 0 4px 0;">Reason provided:</p>
        <p style="color:#374151;font-size:14px;margin:0;font-style:italic;">"${data.declineReason}"</p>
       </div>`
    : "";

  const content = `
    <h2 style="color:#111827;font-size:18px;margin:0 0 8px 0;">Signature declined</h2>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 16px 0;">
      Hi ${data.recipientName},<br><br>
      <strong>${data.signerName}</strong> has declined to sign the following document:
    </p>
    <div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="color:#991b1b;font-size:14px;margin:0;">
        <strong>Document:</strong> ${data.documentTitle}
      </p>
    </div>
    ${reasonHtml}
    <a href="${data.viewLink}" style="display:inline-block;padding:14px 28px;background:${data.primaryColor || "#2563eb"};color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
      View Details
    </a>
    <p style="color:#9ca3af;font-size:12px;margin:24px 0 0 0;">
      You may want to reach out to ${data.signerName} to discuss their concerns.
    </p>
  `;

  return {
    subject: `"${data.documentTitle}" was declined by ${data.signerName}`,
    html: baseLayout(content, data.primaryColor, data.logoURL),
  };
}
