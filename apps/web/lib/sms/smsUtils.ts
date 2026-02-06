/**
 * SMS Utilities
 *
 * Helper functions for SMS/text messaging workflows.
 */

import { SmsStatus, SmsTemplateType, SmsTemplateVariable } from '@/types';

/**
 * Get human-readable status label
 */
export function getSmsStatusLabel(status: SmsStatus): string {
  const labels: Record<SmsStatus, string> = {
    queued: 'Queued',
    sent: 'Sent',
    delivered: 'Delivered',
    failed: 'Failed',
    undelivered: 'Not Delivered',
  };
  return labels[status] || status;
}

/**
 * Get status color for UI
 */
export function getSmsStatusColor(status: SmsStatus): {
  bg: string;
  text: string;
  border: string;
} {
  const colors: Record<SmsStatus, { bg: string; text: string; border: string }> = {
    queued: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
    sent: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    delivered: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    failed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    undelivered: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  };
  return colors[status] || colors.queued;
}

/**
 * Get template type label
 */
export function getTemplateTypeLabel(type: SmsTemplateType): string {
  const labels: Record<SmsTemplateType, string> = {
    payment_reminder: 'Payment Reminder',
    payment_received: 'Payment Received',
    schedule_update: 'Schedule Update',
    project_update: 'Project Update',
    invoice_sent: 'Invoice Sent',
    document_ready: 'Document Ready',
    task_assigned: 'Task Assigned',
    review_request: 'Review Request',
    custom: 'Custom',
  };
  return labels[type] || type;
}

/**
 * Parse template variables from a template body
 * Returns array of variable names found in {{variable}} format
 */
export function parseTemplateVariables(body: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(body)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

/**
 * Render a template with variables
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
  }

  return result;
}

/**
 * Validate template variables are provided
 */
export function validateTemplateVariables(
  template: string,
  requiredVariables: SmsTemplateVariable[],
  providedVariables: Record<string, string>
): { valid: boolean; missing: string[] } {
  const required = requiredVariables.filter((v) => v.required);
  const missing: string[] = [];

  for (const variable of required) {
    if (!providedVariables[variable.name] && !variable.defaultValue) {
      missing.push(variable.name);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Get default template variables for common types
 */
export function getDefaultTemplateVariables(type: SmsTemplateType): SmsTemplateVariable[] {
  const commonVariables: SmsTemplateVariable[] = [
    { name: 'clientName', description: 'Client name', required: true },
    { name: 'companyName', description: 'Your company name', required: true },
  ];

  const typeSpecificVariables: Record<SmsTemplateType, SmsTemplateVariable[]> = {
    payment_reminder: [
      ...commonVariables,
      { name: 'amount', description: 'Payment amount', required: true },
      { name: 'dueDate', description: 'Payment due date', required: true },
      { name: 'invoiceNumber', description: 'Invoice number', required: false },
      { name: 'paymentLink', description: 'Payment link URL', required: false },
    ],
    payment_received: [
      ...commonVariables,
      { name: 'amount', description: 'Payment amount', required: true },
      { name: 'invoiceNumber', description: 'Invoice number', required: false },
    ],
    schedule_update: [
      ...commonVariables,
      { name: 'projectName', description: 'Project name', required: true },
      { name: 'date', description: 'Scheduled date', required: true },
      { name: 'time', description: 'Scheduled time', required: false },
      { name: 'description', description: 'Update description', required: false },
    ],
    project_update: [
      ...commonVariables,
      { name: 'projectName', description: 'Project name', required: true },
      { name: 'update', description: 'Update message', required: true },
    ],
    invoice_sent: [
      ...commonVariables,
      { name: 'amount', description: 'Invoice amount', required: true },
      { name: 'invoiceNumber', description: 'Invoice number', required: true },
      { name: 'dueDate', description: 'Due date', required: false },
      { name: 'viewLink', description: 'Invoice view link', required: false },
    ],
    document_ready: [
      ...commonVariables,
      { name: 'documentName', description: 'Document name', required: true },
      { name: 'documentType', description: 'Document type', required: false },
      { name: 'viewLink', description: 'Document view link', required: false },
    ],
    task_assigned: [
      ...commonVariables,
      { name: 'taskName', description: 'Task name', required: true },
      { name: 'projectName', description: 'Project name', required: false },
      { name: 'dueDate', description: 'Task due date', required: false },
    ],
    review_request: [
      ...commonVariables,
      { name: 'projectName', description: 'Project name', required: true },
      { name: 'reviewLink', description: 'Link to leave a review', required: true },
    ],
    custom: commonVariables,
  };

  return typeSpecificVariables[type] || commonVariables;
}

/**
 * Get default templates for each type
 */
export function getDefaultTemplate(type: SmsTemplateType): string {
  const templates: Record<SmsTemplateType, string> = {
    payment_reminder: `Hi {{clientName}}, this is a reminder that your payment of {{amount}} is due on {{dueDate}}. Pay securely online: {{paymentLink}} - {{companyName}}`,
    payment_received: `Hi {{clientName}}, we've received your payment of {{amount}}. Thank you for your business! - {{companyName}}`,
    schedule_update: `Hi {{clientName}}, your {{projectName}} work is scheduled for {{date}} at {{time}}. {{description}} - {{companyName}}`,
    project_update: `Hi {{clientName}}, update on your {{projectName}}: {{update}} - {{companyName}}`,
    invoice_sent: `Hi {{clientName}}, invoice #{{invoiceNumber}} for {{amount}} is ready. Due: {{dueDate}}. View: {{viewLink}} - {{companyName}}`,
    document_ready: `Hi {{clientName}}, your {{documentName}} is ready for review. View it here: {{viewLink}} - {{companyName}}`,
    task_assigned: `Hi {{clientName}}, you have a new task: {{taskName}} for {{projectName}}. Due: {{dueDate}} - {{companyName}}`,
    review_request: `Hi {{clientName}}, thank you for choosing {{companyName}} for your {{projectName}}! We'd love to hear about your experience. Please leave us a review: {{reviewLink}} - Thank you!`,
    custom: `Hi {{clientName}}, {{companyName}} has sent you a message.`,
  };

  return templates[type] || templates.custom;
}

/**
 * Calculate SMS segment count
 * GSM-7: 160 chars per segment, Unicode: 70 chars per segment
 */
export function calculateSmsSegments(message: string): {
  segments: number;
  encoding: 'GSM-7' | 'Unicode';
  charactersUsed: number;
  charactersPerSegment: number;
} {
  // Check if message contains non-GSM-7 characters
  const gsm7Regex = /^[\x20-\x7E\n\r]*$/;
  const isGsm7 = gsm7Regex.test(message);

  const encoding = isGsm7 ? 'GSM-7' : 'Unicode';
  const singleSegmentLimit = isGsm7 ? 160 : 70;
  const multiSegmentLimit = isGsm7 ? 153 : 67;

  const length = message.length;

  let segments: number;
  let charactersPerSegment: number;

  if (length <= singleSegmentLimit) {
    segments = 1;
    charactersPerSegment = singleSegmentLimit;
  } else {
    segments = Math.ceil(length / multiSegmentLimit);
    charactersPerSegment = multiSegmentLimit;
  }

  return {
    segments,
    encoding,
    charactersUsed: length,
    charactersPerSegment,
  };
}

/**
 * Estimate SMS cost (approximate US pricing)
 */
export function estimateSmsCost(segments: number, recipientCount: number = 1): {
  perMessage: number;
  total: number;
} {
  // Twilio pricing (approximate) - $0.0079 per segment
  const pricePerSegment = 0.0079;
  const perMessage = segments * pricePerSegment;
  const total = perMessage * recipientCount;

  return {
    perMessage: Math.round(perMessage * 10000) / 10000,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Parse Twilio error code to user-friendly message
 */
export function parseTwilioErrorCode(errorCode: string | number): string {
  const code = String(errorCode);

  const errorMessages: Record<string, string> = {
    '21211': 'Invalid phone number format.',
    '21214': 'The phone number is not a valid mobile number.',
    '21217': 'The number is not owned by your Twilio account.',
    '21408': 'Permission denied for the region.',
    '21421': 'The phone number is invalid.',
    '21610': 'The message cannot be sent to this number.',
    '21614': 'The number is not a valid mobile number.',
    '21617': 'The message body exceeds the maximum allowed length.',
    '30001': 'The queue is full. Try again later.',
    '30002': 'Account suspended.',
    '30003': 'Unreachable destination.',
    '30004': 'Message blocked.',
    '30005': 'Unknown destination.',
    '30006': 'Landline or unreachable carrier.',
    '30007': 'Message filtered.',
    '30008': 'Unknown error.',
    '30009': 'Missing segment.',
    '30010': 'Message price exceeds max price.',
  };

  return errorMessages[code] || `Error code: ${code}`;
}

/**
 * Generate opt-out compliance message
 */
export function getOptOutMessage(): string {
  return 'Reply STOP to unsubscribe.';
}

/**
 * Check if a message is an opt-out request
 */
export function isOptOutRequest(message: string): boolean {
  const optOutKeywords = ['stop', 'unsubscribe', 'cancel', 'end', 'quit'];
  const normalized = message.toLowerCase().trim();
  return optOutKeywords.includes(normalized);
}

/**
 * Check if a message is an opt-in request
 */
export function isOptInRequest(message: string): boolean {
  const optInKeywords = ['start', 'yes', 'unstop', 'subscribe'];
  const normalized = message.toLowerCase().trim();
  return optInKeywords.includes(normalized);
}
