# Sprint 22 Plan — Email Templates & Automation

> **Created:** 2026-02-02 by Controller Session
> **Duration:** 2 days
> **Focus:** Pre-built email templates, automated sending, email history

---

## Sprint Goals

| Priority | Feature | Effort |
|----------|---------|--------|
| **P0** | Email Template System | 4 hrs |
| **P1** | Template Editor UI | 3 hrs |
| **P1** | Automated Email Triggers | 4 hrs |
| **P2** | Email History Tracking | 2 hrs |

---

## Part 1: Email Template System (P0)

### Types

**File:** `apps/web/types/index.ts` (add)

```typescript
export type EmailTemplateType =
  | 'estimate_sent'
  | 'estimate_followup'
  | 'invoice_sent'
  | 'invoice_reminder'
  | 'invoice_overdue'
  | 'payment_received'
  | 'project_started'
  | 'project_completed'
  | 'document_ready'
  | 'signature_request'
  | 'welcome_client'
  | 'custom';

export interface EmailTemplate {
  id: string;
  orgId: string;
  type: EmailTemplateType;
  name: string;
  subject: string;
  body: string; // HTML with {{variables}}
  variables: string[]; // Available: clientName, projectName, amount, dueDate, etc.
  isDefault: boolean;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface EmailLog {
  id: string;
  orgId: string;
  templateId?: string;
  templateType: EmailTemplateType;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  status: 'sent' | 'failed' | 'bounced' | 'opened';
  clientId?: string;
  projectId?: string;
  invoiceId?: string;
  estimateId?: string;
  sentAt: Timestamp;
  openedAt?: Timestamp;
  errorMessage?: string;
}
```

### Default Templates

**File:** `apps/web/lib/email/default-templates.ts` (create)

```typescript
export const DEFAULT_EMAIL_TEMPLATES: Partial<EmailTemplate>[] = [
  {
    type: 'estimate_sent',
    name: 'Estimate Sent',
    subject: 'Your Estimate from {{companyName}}',
    body: `
      <p>Hi {{clientName}},</p>
      <p>Thank you for your interest! Please find your estimate for <strong>{{projectName}}</strong> attached.</p>
      <p><strong>Estimate Total:</strong> {{amount}}</p>
      <p>This estimate is valid until {{validUntil}}.</p>
      <p>Click below to view and approve:</p>
      <p><a href="{{viewLink}}">View Estimate</a></p>
      <p>Questions? Reply to this email or call us at {{companyPhone}}.</p>
    `,
    variables: ['clientName', 'projectName', 'amount', 'validUntil', 'viewLink', 'companyName', 'companyPhone'],
  },
  {
    type: 'invoice_sent',
    name: 'Invoice Sent',
    subject: 'Invoice #{{invoiceNumber}} from {{companyName}}',
    body: `
      <p>Hi {{clientName}},</p>
      <p>Please find your invoice for <strong>{{projectName}}</strong>.</p>
      <p><strong>Amount Due:</strong> {{amount}}</p>
      <p><strong>Due Date:</strong> {{dueDate}}</p>
      <p><a href="{{paymentLink}}">Pay Now</a></p>
    `,
    variables: ['clientName', 'projectName', 'invoiceNumber', 'amount', 'dueDate', 'paymentLink', 'companyName'],
  },
  {
    type: 'invoice_reminder',
    name: 'Invoice Reminder',
    subject: 'Reminder: Invoice #{{invoiceNumber}} Due {{dueDate}}',
    body: `
      <p>Hi {{clientName}},</p>
      <p>This is a friendly reminder that invoice #{{invoiceNumber}} for <strong>{{amount}}</strong> is due on {{dueDate}}.</p>
      <p><a href="{{paymentLink}}">Pay Now</a></p>
    `,
    variables: ['clientName', 'invoiceNumber', 'amount', 'dueDate', 'paymentLink'],
  },
  {
    type: 'invoice_overdue',
    name: 'Invoice Overdue',
    subject: 'Overdue: Invoice #{{invoiceNumber}} - {{daysPastDue}} Days Past Due',
    body: `
      <p>Hi {{clientName}},</p>
      <p>Invoice #{{invoiceNumber}} for <strong>{{amount}}</strong> is now {{daysPastDue}} days past due.</p>
      <p>Please remit payment at your earliest convenience.</p>
      <p><a href="{{paymentLink}}">Pay Now</a></p>
    `,
    variables: ['clientName', 'invoiceNumber', 'amount', 'daysPastDue', 'paymentLink'],
  },
  {
    type: 'payment_received',
    name: 'Payment Received',
    subject: 'Payment Received - Thank You!',
    body: `
      <p>Hi {{clientName}},</p>
      <p>We've received your payment of <strong>{{amount}}</strong> for invoice #{{invoiceNumber}}.</p>
      <p>Thank you for your business!</p>
    `,
    variables: ['clientName', 'amount', 'invoiceNumber'],
  },
];
```

### Hook

**File:** `apps/web/lib/hooks/useEmailTemplates.ts` (create)

```typescript
// CRUD operations for email templates
// - getTemplates(orgId)
// - getTemplate(orgId, templateId)
// - createTemplate(orgId, template)
// - updateTemplate(orgId, templateId, updates)
// - deleteTemplate(orgId, templateId)
// - getDefaultTemplate(type) - returns system default if org hasn't customized
```

---

## Part 2: Template Editor UI (P1)

### Settings Page

**File:** `apps/web/app/dashboard/settings/email-templates/page.tsx` (create)

**Features:**
1. List all templates (default + custom)
2. Edit template modal with:
   - Subject line editor
   - Rich text body editor (or HTML)
   - Variable insertion buttons
   - Preview with sample data
3. Toggle template active/inactive
4. Reset to default option

### Components

**File:** `apps/web/components/email/EmailTemplateEditor.tsx` (create)

```tsx
interface EmailTemplateEditorProps {
  template: EmailTemplate;
  onSave: (template: Partial<EmailTemplate>) => void;
  onCancel: () => void;
}

// Features:
// - Subject input
// - Body textarea/rich editor
// - Variable chips that insert {{variable}}
// - Live preview panel
// - Send test email button
```

---

## Part 3: Automated Email Triggers (P1)

### Cloud Function

**File:** `functions/src/email/automatedEmails.ts` (create)

**Triggers:**
1. **Invoice Created** → Send invoice_sent email
2. **Invoice Due Soon** (3 days) → Send invoice_reminder
3. **Invoice Overdue** → Send invoice_overdue (daily)
4. **Payment Received** → Send payment_received
5. **Estimate Sent** → Send estimate_sent

**Implementation:**
```typescript
// Firestore trigger on invoice creation
export const onInvoiceCreated = onDocumentCreated(
  'organizations/{orgId}/invoices/{invoiceId}',
  async (event) => {
    const invoice = event.data?.data();
    const orgId = event.params.orgId;

    // Get org's email template for invoice_sent
    // Populate variables
    // Send via Mailgun
    // Log to emailLogs collection
  }
);

// Scheduled function for reminders (daily at 9am)
export const sendInvoiceReminders = onSchedule('0 9 * * *', async () => {
  // Query invoices due in 3 days
  // Send reminder emails
});
```

---

## Part 4: Email History (P2)

### Email Logs Collection

**Firestore Path:** `organizations/{orgId}/emailLogs/{logId}`

### History UI

**File:** `apps/web/app/dashboard/settings/email-history/page.tsx` (create)

**Features:**
1. List sent emails with filters (date, type, status)
2. Search by recipient
3. View email content
4. Resend failed emails

**Also add to:**
- Client detail page → "Emails" tab
- Project detail page → "Communication" section

---

## Task Summary

| ID | Task | Effort | Session |
|----|------|--------|---------|
| EMAIL-001 | Add EmailTemplate types | 30 min | Dev Sprint |
| EMAIL-002 | Create default templates | 1 hr | Dev Sprint |
| EMAIL-003 | Create useEmailTemplates hook | 1 hr | Dev Sprint |
| EMAIL-004 | Email template settings page | 2 hr | Dev Sprint |
| EMAIL-005 | Template editor component | 2 hr | Dev Sprint |
| EMAIL-006 | Automated invoice emails (Cloud Fn) | 2 hr | Dev Sprint |
| EMAIL-007 | Email history page | 1 hr | Dev Sprint |
| EMAIL-008 | Firestore rules for emailLogs | 15 min | Database |

**Total Estimated:** ~10 hours (2 days)

---

## Files to Create

```
apps/web/types/index.ts (add types)
apps/web/lib/email/default-templates.ts
apps/web/lib/email/template-renderer.ts
apps/web/lib/hooks/useEmailTemplates.ts
apps/web/lib/hooks/useEmailHistory.ts
apps/web/app/dashboard/settings/email-templates/page.tsx
apps/web/app/dashboard/settings/email-history/page.tsx
apps/web/components/email/EmailTemplateEditor.tsx
apps/web/components/email/EmailPreview.tsx
apps/web/components/email/VariableChips.tsx
functions/src/email/automatedEmails.ts
firestore.rules (add emailLogs rules)
```

---

## Definition of Done

- [ ] 5 default email templates created
- [ ] Template editor UI works
- [ ] Can customize and save templates
- [ ] At least 2 automated triggers working (invoice sent, payment received)
- [ ] Email history shows sent emails
- [ ] TypeScript compiles clean
