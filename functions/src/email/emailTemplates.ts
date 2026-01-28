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
