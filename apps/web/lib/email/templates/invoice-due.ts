/**
 * Default Invoice Due Email Template
 */

import { EmailTemplate } from '../types';

export const invoiceDueTemplate: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Invoice Due',
  subject: 'Invoice {{invoiceNumber}} Due on {{invoiceDueDate}}',
  body: `Hi {{clientName}},

This is a reminder that Invoice {{invoiceNumber}} for {{invoiceAmount}} is due on {{invoiceDueDate}}.

Project: {{projectName}}

Please make your payment at your earliest convenience using the link below:

{{paymentLink}}

If you have already made this payment, please disregard this email.

If you have any questions about this invoice, please don't hesitate to contact us at {{companyEmail}} or {{companyPhone}}.

Thank you for your business!

Best regards,
{{companyName}}`,
  variables: [
    'clientName',
    'invoiceNumber',
    'invoiceAmount',
    'invoiceDueDate',
    'projectName',
    'paymentLink',
    'companyName',
    'companyEmail',
    'companyPhone',
  ],
};

export default invoiceDueTemplate;
