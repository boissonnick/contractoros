/**
 * Email Template Types
 */

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplateFormData {
  name: string;
  subject: string;
  body: string;
}

export interface EmailVariable {
  name: string;
  label: string;
  description: string;
  example: string;
}

export const EMAIL_VARIABLES: EmailVariable[] = [
  {
    name: 'clientName',
    label: 'Client Name',
    description: 'The full name of the client',
    example: 'John Smith',
  },
  {
    name: 'clientEmail',
    label: 'Client Email',
    description: 'The email address of the client',
    example: 'john@example.com',
  },
  {
    name: 'projectName',
    label: 'Project Name',
    description: 'The name of the project',
    example: 'Kitchen Renovation',
  },
  {
    name: 'projectAddress',
    label: 'Project Address',
    description: 'The address of the project',
    example: '123 Main St, City, ST 12345',
  },
  {
    name: 'invoiceNumber',
    label: 'Invoice Number',
    description: 'The invoice number',
    example: 'INV-001',
  },
  {
    name: 'invoiceAmount',
    label: 'Invoice Amount',
    description: 'The total invoice amount',
    example: '$5,000.00',
  },
  {
    name: 'invoiceDueDate',
    label: 'Invoice Due Date',
    description: 'The date the invoice is due',
    example: 'March 15, 2026',
  },
  {
    name: 'estimateNumber',
    label: 'Estimate Number',
    description: 'The estimate number',
    example: 'EST-001',
  },
  {
    name: 'estimateAmount',
    label: 'Estimate Amount',
    description: 'The total estimate amount',
    example: '$10,000.00',
  },
  {
    name: 'companyName',
    label: 'Company Name',
    description: 'Your company name',
    example: 'ABC Construction',
  },
  {
    name: 'companyPhone',
    label: 'Company Phone',
    description: 'Your company phone number',
    example: '(555) 123-4567',
  },
  {
    name: 'companyEmail',
    label: 'Company Email',
    description: 'Your company email address',
    example: 'info@abcconstruction.com',
  },
  {
    name: 'paymentLink',
    label: 'Payment Link',
    description: 'Link for the client to pay the invoice',
    example: 'https://app.contractoros.com/pay/abc123',
  },
  {
    name: 'viewLink',
    label: 'View Link',
    description: 'Link to view the document',
    example: 'https://app.contractoros.com/view/abc123',
  },
];
