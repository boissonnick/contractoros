/**
 * Default Email Templates
 * These are used as fallbacks when an organization hasn't customized their templates
 */

import { EmailTemplateType } from '@/types';

export interface DefaultEmailTemplate {
  type: EmailTemplateType;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export const DEFAULT_EMAIL_TEMPLATES: DefaultEmailTemplate[] = [
  {
    type: 'estimate_sent',
    name: 'Estimate Sent',
    subject: 'Your Estimate from {{companyName}}',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hi {{clientName}},</p>
  <p>Thank you for your interest! Please find your estimate for <strong>{{projectName}}</strong> attached.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0;"><strong>Estimate Total:</strong> {{amount}}</p>
    <p style="margin: 8px 0 0;"><strong>Valid Until:</strong> {{validUntil}}</p>
  </div>
  <p>Click below to view and approve:</p>
  <p style="text-align: center; margin: 24px 0;">
    <a href="{{viewLink}}" style="display: inline-block; background: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Estimate</a>
  </p>
  <p style="color: #6b7280; font-size: 14px;">Questions? Reply to this email or call us at {{companyPhone}}.</p>
</div>
    `.trim(),
    variables: ['clientName', 'projectName', 'amount', 'validUntil', 'viewLink', 'companyName', 'companyPhone'],
  },
  {
    type: 'estimate_followup',
    name: 'Estimate Follow-up',
    subject: 'Following up on your estimate from {{companyName}}',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hi {{clientName}},</p>
  <p>I wanted to follow up on the estimate we sent for <strong>{{projectName}}</strong>.</p>
  <p>The estimate total is <strong>{{amount}}</strong> and is valid until {{validUntil}}.</p>
  <p>Do you have any questions or would you like to discuss any changes?</p>
  <p style="text-align: center; margin: 24px 0;">
    <a href="{{viewLink}}" style="display: inline-block; background: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Estimate</a>
  </p>
  <p>Looking forward to hearing from you!</p>
  <p style="color: #6b7280; font-size: 14px;">{{companyName}}<br/>{{companyPhone}}</p>
</div>
    `.trim(),
    variables: ['clientName', 'projectName', 'amount', 'validUntil', 'viewLink', 'companyName', 'companyPhone'],
  },
  {
    type: 'invoice_sent',
    name: 'Invoice Sent',
    subject: 'Invoice #{{invoiceNumber}} from {{companyName}}',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hi {{clientName}},</p>
  <p>Please find your invoice for <strong>{{projectName}}</strong>.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0;"><strong>Invoice #:</strong> {{invoiceNumber}}</p>
    <p style="margin: 8px 0 0;"><strong>Amount Due:</strong> {{amount}}</p>
    <p style="margin: 8px 0 0;"><strong>Due Date:</strong> {{dueDate}}</p>
  </div>
  <p style="text-align: center; margin: 24px 0;">
    <a href="{{paymentLink}}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Pay Now</a>
  </p>
  <p style="color: #6b7280; font-size: 14px;">Thank you for your business!</p>
</div>
    `.trim(),
    variables: ['clientName', 'projectName', 'invoiceNumber', 'amount', 'dueDate', 'paymentLink', 'companyName'],
  },
  {
    type: 'invoice_reminder',
    name: 'Invoice Reminder',
    subject: 'Reminder: Invoice #{{invoiceNumber}} Due {{dueDate}}',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hi {{clientName}},</p>
  <p>This is a friendly reminder that invoice #{{invoiceNumber}} for <strong>{{amount}}</strong> is due on <strong>{{dueDate}}</strong>.</p>
  <p style="text-align: center; margin: 24px 0;">
    <a href="{{paymentLink}}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Pay Now</a>
  </p>
  <p style="color: #6b7280; font-size: 14px;">If you've already sent payment, please disregard this message.</p>
</div>
    `.trim(),
    variables: ['clientName', 'invoiceNumber', 'amount', 'dueDate', 'paymentLink'],
  },
  {
    type: 'invoice_overdue',
    name: 'Invoice Overdue',
    subject: 'Overdue: Invoice #{{invoiceNumber}} - {{daysPastDue}} Days Past Due',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hi {{clientName}},</p>
  <p>Invoice #{{invoiceNumber}} for <strong>{{amount}}</strong> is now <strong>{{daysPastDue}} days past due</strong>.</p>
  <p>Please remit payment at your earliest convenience to avoid any late fees.</p>
  <p style="text-align: center; margin: 24px 0;">
    <a href="{{paymentLink}}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Pay Now</a>
  </p>
  <p style="color: #6b7280; font-size: 14px;">If you have questions about this invoice, please contact us.</p>
</div>
    `.trim(),
    variables: ['clientName', 'invoiceNumber', 'amount', 'daysPastDue', 'paymentLink'],
  },
  {
    type: 'payment_received',
    name: 'Payment Received',
    subject: 'Payment Received - Thank You!',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hi {{clientName}},</p>
  <p>We've received your payment of <strong>{{amount}}</strong> for invoice #{{invoiceNumber}}.</p>
  <div style="background: #dcfce7; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
    <p style="margin: 0; color: #166534; font-size: 18px;">Payment Confirmed</p>
  </div>
  <p>Thank you for your business!</p>
  <p style="color: #6b7280; font-size: 14px;">{{companyName}}</p>
</div>
    `.trim(),
    variables: ['clientName', 'amount', 'invoiceNumber', 'companyName'],
  },
  {
    type: 'project_started',
    name: 'Project Started',
    subject: 'Your Project Has Started - {{projectName}}',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hi {{clientName}},</p>
  <p>Great news! Work on <strong>{{projectName}}</strong> has officially begun.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0;"><strong>Project Manager:</strong> {{pmName}}</p>
    <p style="margin: 8px 0 0;"><strong>Estimated Completion:</strong> {{estimatedEndDate}}</p>
  </div>
  <p>You can track progress and view updates through your client portal:</p>
  <p style="text-align: center; margin: 24px 0;">
    <a href="{{portalLink}}" style="display: inline-block; background: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Project</a>
  </p>
  <p style="color: #6b7280; font-size: 14px;">Questions? Contact us at {{companyPhone}}.</p>
</div>
    `.trim(),
    variables: ['clientName', 'projectName', 'pmName', 'estimatedEndDate', 'portalLink', 'companyPhone'],
  },
  {
    type: 'project_completed',
    name: 'Project Completed',
    subject: 'Project Complete - {{projectName}}',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hi {{clientName}},</p>
  <p>We're pleased to inform you that <strong>{{projectName}}</strong> has been completed!</p>
  <div style="background: #dcfce7; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
    <p style="margin: 0; color: #166534; font-size: 18px;">Project Complete</p>
  </div>
  <p>Thank you for trusting us with your project. We'd love to hear your feedback!</p>
  <p style="text-align: center; margin: 24px 0;">
    <a href="{{reviewLink}}" style="display: inline-block; background: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Leave a Review</a>
  </p>
  <p style="color: #6b7280; font-size: 14px;">{{companyName}}</p>
</div>
    `.trim(),
    variables: ['clientName', 'projectName', 'reviewLink', 'companyName'],
  },
  {
    type: 'document_ready',
    name: 'Document Ready',
    subject: 'Document Ready for Review - {{documentTitle}}',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hi {{clientName}},</p>
  <p>A new document is ready for your review:</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0;"><strong>Document:</strong> {{documentTitle}}</p>
    <p style="margin: 8px 0 0;"><strong>Project:</strong> {{projectName}}</p>
  </div>
  <p style="text-align: center; margin: 24px 0;">
    <a href="{{viewLink}}" style="display: inline-block; background: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Document</a>
  </p>
  <p style="color: #6b7280; font-size: 14px;">{{companyName}}</p>
</div>
    `.trim(),
    variables: ['clientName', 'documentTitle', 'projectName', 'viewLink', 'companyName'],
  },
  {
    type: 'signature_request',
    name: 'Signature Request',
    subject: 'Signature Requested - {{documentTitle}}',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hi {{clientName}},</p>
  <p>Your signature is requested on the following document:</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0;"><strong>Document:</strong> {{documentTitle}}</p>
    <p style="margin: 8px 0 0;"><strong>From:</strong> {{companyName}}</p>
  </div>
  <p>Please review and sign the document at your earliest convenience:</p>
  <p style="text-align: center; margin: 24px 0;">
    <a href="{{signLink}}" style="display: inline-block; background: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Review & Sign</a>
  </p>
  <p style="color: #6b7280; font-size: 14px;">This link will expire on {{expiresAt}}.</p>
</div>
    `.trim(),
    variables: ['clientName', 'documentTitle', 'signLink', 'expiresAt', 'companyName'],
  },
  {
    type: 'welcome_client',
    name: 'Welcome Client',
    subject: 'Welcome to {{companyName}}!',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hi {{clientName}},</p>
  <p>Welcome! We're excited to have you as a client.</p>
  <p>You now have access to your client portal where you can:</p>
  <ul>
    <li>View project progress and updates</li>
    <li>Review and approve estimates</li>
    <li>View and pay invoices</li>
    <li>Upload photos and documents</li>
    <li>Communicate with our team</li>
  </ul>
  <p style="text-align: center; margin: 24px 0;">
    <a href="{{portalLink}}" style="display: inline-block; background: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Access Your Portal</a>
  </p>
  <p style="color: #6b7280; font-size: 14px;">Questions? Contact us at {{companyPhone}} or reply to this email.</p>
</div>
    `.trim(),
    variables: ['clientName', 'portalLink', 'companyName', 'companyPhone'],
  },
];

/**
 * Get a default template by type
 */
export function getDefaultTemplate(type: EmailTemplateType): DefaultEmailTemplate | undefined {
  return DEFAULT_EMAIL_TEMPLATES.find(t => t.type === type);
}

/**
 * Get all available template variables with descriptions
 */
export const TEMPLATE_VARIABLES: Record<string, string> = {
  clientName: 'Client\'s full name',
  clientEmail: 'Client\'s email address',
  projectName: 'Project name',
  projectAddress: 'Project address',
  companyName: 'Your company name',
  companyPhone: 'Your company phone number',
  companyEmail: 'Your company email',
  amount: 'Formatted dollar amount',
  invoiceNumber: 'Invoice number (e.g., INV-001)',
  dueDate: 'Payment due date',
  validUntil: 'Estimate valid until date',
  daysPastDue: 'Number of days past due',
  viewLink: 'Link to view the document',
  paymentLink: 'Link to pay an invoice',
  signLink: 'Link to sign a document',
  portalLink: 'Link to client portal',
  reviewLink: 'Link to leave a review',
  pmName: 'Project manager name',
  estimatedEndDate: 'Estimated project end date',
  documentTitle: 'Document title',
  expiresAt: 'Link expiration date',
};

/**
 * Replace template variables with actual values
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return rendered;
}
