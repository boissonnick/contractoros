/**
 * Seed Email Templates & Email Logs Demo Data
 *
 * Creates custom email templates and a history of email log entries
 * for the Horizon Construction Co. demo organization.
 */

import { getDb } from './db';
import {
  DEMO_ORG_ID,
  DEMO_CLIENTS,
  daysAgo,
  monthsAgo,
  toTimestamp,
  randomItem,
  randomInt,
  randomDateBetween,
  generateId,
  logSection,
  logProgress,
  logSuccess,
} from './utils';

const db = getDb();
const orgRef = db.collection('organizations').doc(DEMO_ORG_ID);

// Demo project references (matching other seed scripts)
const DEMO_PROJECTS = [
  { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel', clientKey: 'smith' },
  { id: 'demo-proj-wilson-fence', name: 'Wilson Fence Installation', clientKey: 'wilson' },
  { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront', clientKey: 'mainStRetail' },
  { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath', clientKey: 'garcia' },
  { id: 'demo-proj-cafe-ti', name: 'Downtown Cafe TI', clientKey: 'downtownCafe' },
];

// Demo invoice references for log entries
const DEMO_INVOICES = [
  { id: 'demo-inv-001', number: 'INV-2026-001', amount: 12500.00 },
  { id: 'demo-inv-002', number: 'INV-2026-002', amount: 8750.00 },
  { id: 'demo-inv-003', number: 'INV-2026-003', amount: 45000.00 },
  { id: 'demo-inv-004', number: 'INV-2026-004', amount: 3200.00 },
  { id: 'demo-inv-005', number: 'INV-2026-005', amount: 22000.00 },
  { id: 'demo-inv-006', number: 'INV-2026-006', amount: 6800.00 },
];

// ============================================
// Email Templates
// ============================================

type TemplateType = 'invoice_sent' | 'invoice_reminder' | 'payment_received' | 'estimate_sent' | 'project_update' | 'welcome';

interface EmailTemplate {
  orgId: string;
  type: TemplateType;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  variables: string[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    orgId: DEMO_ORG_ID,
    type: 'invoice_sent',
    name: 'Custom Invoice Notification',
    subject: 'Invoice #{{invoiceNumber}} from Horizon Construction',
    bodyHtml: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h2 style="color: #1a56db; margin: 0;">Horizon Construction Co.</h2>
    <p style="color: #6b7280; margin: 4px 0 0;">Quality Craftsmanship Since 2015</p>
  </div>
  <p>Hi {{clientName}},</p>
  <p>Thank you for choosing Horizon Construction! Please find your invoice for <strong>{{projectName}}</strong> below.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0;"><strong>Invoice #:</strong> {{invoiceNumber}}</p>
    <p style="margin: 8px 0 0;"><strong>Amount Due:</strong> {{amount}}</p>
    <p style="margin: 8px 0 0;"><strong>Due Date:</strong> {{dueDate}}</p>
  </div>
  <p style="text-align: center; margin: 24px 0;">
    <a href="{{paymentLink}}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Pay Now</a>
  </p>
  <p style="color: #6b7280; font-size: 14px;">Questions? Call us at (303) 555-0100 or reply to this email.</p>
</div>`.trim(),
    bodyText: 'Hi {{clientName}}, Your invoice #{{invoiceNumber}} for {{projectName}} is ready. Amount due: {{amount}}. Due date: {{dueDate}}. Pay online: {{paymentLink}}',
    variables: ['clientName', 'projectName', 'invoiceNumber', 'amount', 'dueDate', 'paymentLink'],
    isDefault: false,
    isActive: true,
    createdAt: toTimestamp(monthsAgo(4)),
    updatedAt: toTimestamp(monthsAgo(1)),
  },
  {
    orgId: DEMO_ORG_ID,
    type: 'invoice_reminder',
    name: 'Friendly Payment Reminder',
    subject: 'Reminder: Invoice #{{invoiceNumber}} — Due {{dueDate}}',
    bodyHtml: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hi {{clientName}},</p>
  <p>This is a friendly reminder that invoice <strong>#{{invoiceNumber}}</strong> for <strong>{{amount}}</strong> is due on <strong>{{dueDate}}</strong>.</p>
  <p>If you have already sent payment, please disregard this message. Otherwise, you can pay securely online:</p>
  <p style="text-align: center; margin: 24px 0;">
    <a href="{{paymentLink}}" style="display: inline-block; background: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Pay Now</a>
  </p>
  <p style="color: #6b7280; font-size: 14px;">Thank you for your business!<br/>— Horizon Construction Co.</p>
</div>`.trim(),
    bodyText: 'Hi {{clientName}}, Reminder: Invoice #{{invoiceNumber}} for {{amount}} is due on {{dueDate}}. Pay online: {{paymentLink}}. If already paid, please disregard.',
    variables: ['clientName', 'invoiceNumber', 'amount', 'dueDate', 'paymentLink'],
    isDefault: false,
    isActive: true,
    createdAt: toTimestamp(monthsAgo(4)),
    updatedAt: toTimestamp(monthsAgo(2)),
  },
  {
    orgId: DEMO_ORG_ID,
    type: 'payment_received',
    name: 'Payment Confirmation',
    subject: 'Payment Received — Thank You, {{clientName}}!',
    bodyHtml: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hi {{clientName}},</p>
  <p>We have received your payment of <strong>{{amount}}</strong> for <strong>{{projectName}}</strong>. Thank you!</p>
  <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
    <p style="margin: 0; color: #059669; font-weight: bold;">Payment Confirmed</p>
    <p style="margin: 8px 0 0;"><strong>Amount:</strong> {{amount}}</p>
    <p style="margin: 8px 0 0;"><strong>Invoice #:</strong> {{invoiceNumber}}</p>
    <p style="margin: 8px 0 0;"><strong>Date:</strong> {{paymentDate}}</p>
  </div>
  <p>A receipt has been attached to this email for your records.</p>
  <p style="color: #6b7280; font-size: 14px;">Thank you for choosing Horizon Construction!<br/>(303) 555-0100</p>
</div>`.trim(),
    bodyText: 'Hi {{clientName}}, We received your payment of {{amount}} for {{projectName}} (Invoice #{{invoiceNumber}}) on {{paymentDate}}. Thank you for your business!',
    variables: ['clientName', 'projectName', 'invoiceNumber', 'amount', 'paymentDate'],
    isDefault: false,
    isActive: true,
    createdAt: toTimestamp(monthsAgo(3)),
    updatedAt: toTimestamp(monthsAgo(1)),
  },
  {
    orgId: DEMO_ORG_ID,
    type: 'estimate_sent',
    name: 'Custom Estimate Delivery',
    subject: 'Your Estimate from Horizon Construction — {{projectName}}',
    bodyHtml: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h2 style="color: #1a56db; margin: 0;">Horizon Construction Co.</h2>
  </div>
  <p>Hi {{clientName}},</p>
  <p>Thank you for your interest in working with us! We have prepared an estimate for your <strong>{{projectName}}</strong> project.</p>
  <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1a56db;">
    <p style="margin: 0;"><strong>Estimated Total:</strong> {{amount}}</p>
    <p style="margin: 8px 0 0;"><strong>Valid Until:</strong> {{validUntil}}</p>
  </div>
  <p>Please review the full estimate and let us know if you have any questions:</p>
  <p style="text-align: center; margin: 24px 0;">
    <a href="{{viewLink}}" style="display: inline-block; background: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Estimate</a>
  </p>
  <p style="color: #6b7280; font-size: 14px;">We look forward to working with you!<br/>Mike Johnson, Horizon Construction<br/>(303) 555-0100</p>
</div>`.trim(),
    bodyText: 'Hi {{clientName}}, Your estimate for {{projectName}} is ready. Estimated total: {{amount}}. Valid until: {{validUntil}}. View it here: {{viewLink}}. Call us at (303) 555-0100 with questions.',
    variables: ['clientName', 'projectName', 'amount', 'validUntil', 'viewLink'],
    isDefault: false,
    isActive: true,
    createdAt: toTimestamp(monthsAgo(4)),
    updatedAt: toTimestamp(monthsAgo(3)),
  },
  {
    orgId: DEMO_ORG_ID,
    type: 'project_update',
    name: 'Weekly Project Update',
    subject: 'Project Update: {{projectName}} — Week of {{weekDate}}',
    bodyHtml: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hi {{clientName}},</p>
  <p>Here is your weekly update for <strong>{{projectName}}</strong>:</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0;"><strong>Status:</strong> {{projectStatus}}</p>
    <p style="margin: 8px 0 0;"><strong>Completion:</strong> {{completionPercent}}%</p>
    <p style="margin: 8px 0 0;"><strong>This Week:</strong> {{weekSummary}}</p>
    <p style="margin: 8px 0 0;"><strong>Next Week:</strong> {{nextWeekPlan}}</p>
  </div>
  <p>View your full project dashboard for photos and detailed progress:</p>
  <p style="text-align: center; margin: 24px 0;">
    <a href="{{portalLink}}" style="display: inline-block; background: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Project</a>
  </p>
  <p style="color: #6b7280; font-size: 14px;">— Your Horizon Construction Team</p>
</div>`.trim(),
    bodyText: 'Hi {{clientName}}, Weekly update for {{projectName}}: Status: {{projectStatus}}, Completion: {{completionPercent}}%. This week: {{weekSummary}}. Next week: {{nextWeekPlan}}. View details: {{portalLink}}',
    variables: ['clientName', 'projectName', 'projectStatus', 'completionPercent', 'weekSummary', 'nextWeekPlan', 'weekDate', 'portalLink'],
    isDefault: false,
    isActive: true,
    createdAt: toTimestamp(monthsAgo(3)),
    updatedAt: toTimestamp(daysAgo(7)),
  },
  {
    orgId: DEMO_ORG_ID,
    type: 'welcome',
    name: 'New Client Welcome',
    subject: 'Welcome to Horizon Construction, {{clientName}}!',
    bodyHtml: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h2 style="color: #1a56db; margin: 0;">Welcome to Horizon Construction!</h2>
  </div>
  <p>Hi {{clientName}},</p>
  <p>Welcome aboard! We are excited to be working with you on your upcoming project.</p>
  <p>Here is what to expect next:</p>
  <ul style="line-height: 1.8;">
    <li>Your dedicated project manager will reach out within 24 hours</li>
    <li>You will receive access to your <strong>Client Portal</strong> where you can track progress, view photos, and communicate with our team</li>
    <li>We will schedule an initial site visit to finalize project details</li>
  </ul>
  <p style="text-align: center; margin: 24px 0;">
    <a href="{{portalLink}}" style="display: inline-block; background: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Access Your Portal</a>
  </p>
  <p>If you have any questions in the meantime, do not hesitate to reach out!</p>
  <p style="color: #6b7280; font-size: 14px;">Mike Johnson<br/>Horizon Construction Co.<br/>(303) 555-0100</p>
</div>`.trim(),
    bodyText: 'Hi {{clientName}}, Welcome to Horizon Construction! Your project manager will reach out within 24 hours. Access your Client Portal here: {{portalLink}}. Questions? Call (303) 555-0100.',
    variables: ['clientName', 'portalLink'],
    isDefault: false,
    isActive: true,
    createdAt: toTimestamp(monthsAgo(5)),
    updatedAt: toTimestamp(monthsAgo(2)),
  },
];

// ============================================
// Email Log Generation
// ============================================

type EmailStatus = 'sent' | 'failed' | 'bounced' | 'opened';

interface EmailLogEntry {
  orgId: string;
  templateType: TemplateType;
  templateId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  status: EmailStatus;
  clientId: string;
  projectId: string;
  invoiceId?: string;
  sentAt: FirebaseFirestore.Timestamp;
  openedAt?: FirebaseFirestore.Timestamp;
  errorMessage?: string;
  createdAt: FirebaseFirestore.Timestamp;
}

function buildEmailLogs(templateIds: Record<TemplateType, string>): EmailLogEntry[] {
  const logs: EmailLogEntry[] = [];

  // Helper to get client from project
  const getClient = (projectKey: string) => {
    const project = DEMO_PROJECTS.find((p) => p.clientKey === projectKey);
    if (!project) return null;
    const client = DEMO_CLIENTS[project.clientKey as keyof typeof DEMO_CLIENTS];
    return { project, client };
  };

  // --- Invoice Sent emails (6 entries) ---
  const invoiceSentData = [
    { projectKey: 'smith', invoiceIdx: 0, daysBack: 45, status: 'opened' as EmailStatus },
    { projectKey: 'garcia', invoiceIdx: 1, daysBack: 38, status: 'opened' as EmailStatus },
    { projectKey: 'mainStRetail', invoiceIdx: 2, daysBack: 30, status: 'sent' as EmailStatus },
    { projectKey: 'wilson', invoiceIdx: 3, daysBack: 22, status: 'opened' as EmailStatus },
    { projectKey: 'downtownCafe', invoiceIdx: 4, daysBack: 14, status: 'opened' as EmailStatus },
    { projectKey: 'smith', invoiceIdx: 5, daysBack: 7, status: 'sent' as EmailStatus },
  ];

  for (const entry of invoiceSentData) {
    const data = getClient(entry.projectKey);
    if (!data) continue;
    const { project, client } = data;
    const invoice = DEMO_INVOICES[entry.invoiceIdx];
    const sentDate = daysAgo(entry.daysBack);

    logs.push({
      orgId: DEMO_ORG_ID,
      templateType: 'invoice_sent',
      templateId: templateIds['invoice_sent'],
      recipientEmail: client.email,
      recipientName: `${client.firstName} ${client.lastName}`,
      subject: `Invoice #${invoice.number} from Horizon Construction`,
      status: entry.status,
      clientId: client.id,
      projectId: project.id,
      invoiceId: invoice.id,
      sentAt: toTimestamp(sentDate),
      ...(entry.status === 'opened' ? { openedAt: toTimestamp(new Date(sentDate.getTime() + randomInt(1, 48) * 3600000)) } : {}),
      createdAt: toTimestamp(sentDate),
    });
  }

  // --- Invoice Reminder emails (4 entries) ---
  const reminderData = [
    { projectKey: 'smith', invoiceIdx: 0, daysBack: 35, status: 'opened' as EmailStatus },
    { projectKey: 'mainStRetail', invoiceIdx: 2, daysBack: 20, status: 'sent' as EmailStatus },
    { projectKey: 'wilson', invoiceIdx: 3, daysBack: 12, status: 'bounced' as EmailStatus },
    { projectKey: 'downtownCafe', invoiceIdx: 4, daysBack: 5, status: 'opened' as EmailStatus },
  ];

  for (const entry of reminderData) {
    const data = getClient(entry.projectKey);
    if (!data) continue;
    const { project, client } = data;
    const invoice = DEMO_INVOICES[entry.invoiceIdx];
    const sentDate = daysAgo(entry.daysBack);

    logs.push({
      orgId: DEMO_ORG_ID,
      templateType: 'invoice_reminder',
      templateId: templateIds['invoice_reminder'],
      recipientEmail: client.email,
      recipientName: `${client.firstName} ${client.lastName}`,
      subject: `Reminder: Invoice #${invoice.number} — Due Soon`,
      status: entry.status,
      clientId: client.id,
      projectId: project.id,
      invoiceId: invoice.id,
      sentAt: toTimestamp(sentDate),
      ...(entry.status === 'opened' ? { openedAt: toTimestamp(new Date(sentDate.getTime() + randomInt(2, 24) * 3600000)) } : {}),
      ...(entry.status === 'bounced' ? { errorMessage: 'Mailbox not found: recipient address rejected by destination server' } : {}),
      createdAt: toTimestamp(sentDate),
    });
  }

  // --- Payment Received emails (4 entries) ---
  const paymentData = [
    { projectKey: 'smith', invoiceIdx: 0, daysBack: 40, status: 'opened' as EmailStatus },
    { projectKey: 'garcia', invoiceIdx: 1, daysBack: 32, status: 'opened' as EmailStatus },
    { projectKey: 'wilson', invoiceIdx: 3, daysBack: 18, status: 'sent' as EmailStatus },
    { projectKey: 'downtownCafe', invoiceIdx: 4, daysBack: 10, status: 'opened' as EmailStatus },
  ];

  for (const entry of paymentData) {
    const data = getClient(entry.projectKey);
    if (!data) continue;
    const { project, client } = data;
    const invoice = DEMO_INVOICES[entry.invoiceIdx];
    const sentDate = daysAgo(entry.daysBack);

    logs.push({
      orgId: DEMO_ORG_ID,
      templateType: 'payment_received',
      templateId: templateIds['payment_received'],
      recipientEmail: client.email,
      recipientName: `${client.firstName} ${client.lastName}`,
      subject: `Payment Received — Thank You, ${client.firstName}!`,
      status: entry.status,
      clientId: client.id,
      projectId: project.id,
      invoiceId: invoice.id,
      sentAt: toTimestamp(sentDate),
      ...(entry.status === 'opened' ? { openedAt: toTimestamp(new Date(sentDate.getTime() + randomInt(1, 12) * 3600000)) } : {}),
      createdAt: toTimestamp(sentDate),
    });
  }

  // --- Estimate Sent emails (4 entries) ---
  const estimateData = [
    { projectKey: 'smith', daysBack: 90, status: 'opened' as EmailStatus },
    { projectKey: 'garcia', daysBack: 75, status: 'opened' as EmailStatus },
    { projectKey: 'mainStRetail', daysBack: 60, status: 'opened' as EmailStatus },
    { projectKey: 'brown', daysBack: 25, status: 'sent' as EmailStatus },
  ];

  for (const entry of estimateData) {
    const data = getClient(entry.projectKey);
    if (!data) continue;
    const { project, client } = data;
    const sentDate = daysAgo(entry.daysBack);

    logs.push({
      orgId: DEMO_ORG_ID,
      templateType: 'estimate_sent',
      templateId: templateIds['estimate_sent'],
      recipientEmail: client.email,
      recipientName: `${client.firstName} ${client.lastName}`,
      subject: `Your Estimate from Horizon Construction — ${project.name}`,
      status: entry.status,
      clientId: client.id,
      projectId: project.id,
      sentAt: toTimestamp(sentDate),
      ...(entry.status === 'opened' ? { openedAt: toTimestamp(new Date(sentDate.getTime() + randomInt(1, 72) * 3600000)) } : {}),
      createdAt: toTimestamp(sentDate),
    });
  }

  // --- Project Update emails (6 entries) ---
  const updateData = [
    { projectKey: 'smith', daysBack: 28, status: 'opened' as EmailStatus },
    { projectKey: 'smith', daysBack: 21, status: 'opened' as EmailStatus },
    { projectKey: 'garcia', daysBack: 21, status: 'sent' as EmailStatus },
    { projectKey: 'mainStRetail', daysBack: 14, status: 'opened' as EmailStatus },
    { projectKey: 'downtownCafe', daysBack: 7, status: 'opened' as EmailStatus },
    { projectKey: 'garcia', daysBack: 3, status: 'sent' as EmailStatus },
  ];

  for (const entry of updateData) {
    const data = getClient(entry.projectKey);
    if (!data) continue;
    const { project, client } = data;
    const sentDate = daysAgo(entry.daysBack);

    logs.push({
      orgId: DEMO_ORG_ID,
      templateType: 'project_update',
      templateId: templateIds['project_update'],
      recipientEmail: client.email,
      recipientName: `${client.firstName} ${client.lastName}`,
      subject: `Project Update: ${project.name}`,
      status: entry.status,
      clientId: client.id,
      projectId: project.id,
      sentAt: toTimestamp(sentDate),
      ...(entry.status === 'opened' ? { openedAt: toTimestamp(new Date(sentDate.getTime() + randomInt(1, 24) * 3600000)) } : {}),
      createdAt: toTimestamp(sentDate),
    });
  }

  // --- Welcome emails (3 entries) ---
  const welcomeData = [
    { projectKey: 'smith', daysBack: 120, status: 'opened' as EmailStatus },
    { projectKey: 'garcia', daysBack: 95, status: 'opened' as EmailStatus },
    { projectKey: 'brown', daysBack: 30, status: 'failed' as EmailStatus },
  ];

  for (const entry of welcomeData) {
    const data = getClient(entry.projectKey);
    if (!data) continue;
    const { project, client } = data;
    const sentDate = daysAgo(entry.daysBack);

    logs.push({
      orgId: DEMO_ORG_ID,
      templateType: 'welcome',
      templateId: templateIds['welcome'],
      recipientEmail: client.email,
      recipientName: `${client.firstName} ${client.lastName}`,
      subject: `Welcome to Horizon Construction, ${client.firstName}!`,
      status: entry.status,
      clientId: client.id,
      projectId: project.id,
      sentAt: toTimestamp(sentDate),
      ...(entry.status === 'opened' ? { openedAt: toTimestamp(new Date(sentDate.getTime() + randomInt(1, 6) * 3600000)) } : {}),
      ...(entry.status === 'failed' ? { errorMessage: 'Connection timeout: unable to reach recipient mail server after 3 retries' } : {}),
      createdAt: toTimestamp(sentDate),
    });
  }

  return logs;
}

// ============================================
// Seed Functions
// ============================================

async function seedEmailTemplates(): Promise<Record<TemplateType, string>> {
  logSection('Seeding Email Templates');

  const templateIds: Record<string, string> = {};
  const batch = db.batch();

  for (const template of EMAIL_TEMPLATES) {
    const docId = generateId('etmpl');
    const docRef = orgRef.collection('emailTemplates').doc(docId);
    batch.set(docRef, template);
    templateIds[template.type] = docId;
    logProgress(`Template: ${template.name} (${template.type})`);
  }

  await batch.commit();
  logSuccess(`Created ${EMAIL_TEMPLATES.length} email templates`);

  return templateIds as Record<TemplateType, string>;
}

async function seedEmailLogs(templateIds: Record<TemplateType, string>): Promise<number> {
  logSection('Seeding Email Logs');

  const logs = buildEmailLogs(templateIds);
  const batch = db.batch();

  for (const log of logs) {
    const docRef = orgRef.collection('emailLogs').doc(generateId('elog'));
    batch.set(docRef, log);
  }

  await batch.commit();

  // Log stats
  const statusCounts = logs.reduce((acc, log) => {
    acc[log.status] = (acc[log.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeCounts = logs.reduce((acc, log) => {
    acc[log.templateType] = (acc[log.templateType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  logProgress('By status:');
  for (const [status, count] of Object.entries(statusCounts)) {
    logProgress(`  ${status}: ${count}`);
  }
  logProgress('By template type:');
  for (const [type, count] of Object.entries(typeCounts)) {
    logProgress(`  ${type}: ${count}`);
  }

  logSuccess(`Created ${logs.length} email log entries`);
  return logs.length;
}

// ============================================
// Main
// ============================================

async function main() {
  logSection('Email Data Seed Script');
  logProgress(`Organization: ${DEMO_ORG_ID}`);

  const templateIds = await seedEmailTemplates();
  const logCount = await seedEmailLogs(templateIds);

  logSection('Email Data Seed Complete!');
  logSuccess(`${EMAIL_TEMPLATES.length} email templates, ${logCount} email logs created`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
