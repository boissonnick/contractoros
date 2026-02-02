---
title: "Invoicing Overview"
description: "Create invoices, track payments, and get paid faster"
audience: ["owner", "pm"]
module: "invoicing"
difficulty: "beginner"
time_to_complete: "10 minutes"
video_url: ""
walkthrough_id: "invoicing-tour"
last_updated: "2025-01-30"
status: "draft"
---

<!-- STATUS: DRAFT -->
<!-- NEEDS_VIDEO: Invoicing overview -->
<!-- NEEDS_WALKTHROUGH: Invoicing tour -->

# Invoicing Overview

Get paid faster with professional invoices, online payment options, and automatic payment tracking.

---

## What You'll Learn

| Job to Be Done | This Section Helps You |
|----------------|------------------------|
| Bill clients for work | Create and send invoices |
| Get paid faster | Accept online payments |
| Track what's owed | Monitor outstanding invoices |
| Manage cash flow | See payment history and projections |
| Handle partial payments | Track deposits and progress payments |

---

## Invoice Lifecycle

```
Draft → Sent → Viewed → Paid
         ↓        ↓
      Overdue  Partial Payment
```

### Status Definitions

| Status | Meaning |
|--------|---------|
| Draft | Created but not sent |
| Sent | Delivered to client |
| Viewed | Client opened the invoice |
| Partial | Some payment received |
| Paid | Fully paid |
| Overdue | Past due date, unpaid |
| Void | Cancelled, doesn't count |

---

## Invoice Types

### Progress Invoices

Bill for work completed to date:
- Percentage of project complete
- Specific phase completion
- Monthly billing cycles

**Best for:** Large projects, ongoing work

### Final Invoices

Bill for project completion:
- All remaining work
- Retention release
- Final cleanup items

**Best for:** Project closeout

### Change Order Invoices

Bill for approved changes:
- Reference original CO number
- Clear description of added work
- Separate from main contract

**Best for:** Scope additions

### Retainer Invoices

<!-- STATUS: COMING_SOON - Retainer invoicing -->

Bill for upfront deposits:
- Design/planning phase
- Material deposits
- Project start deposit

---

## Creating Invoices

### From a Project

1. Open the project
2. Click **Create Invoice**
3. Choose invoice type
4. Add line items
5. Review and send

### From Scratch

1. Go to **Invoicing**
2. Click **New Invoice**
3. Select client
4. Add line items
5. Link to project (optional)
6. Send

### From Time Entries

<!-- STATUS: COMING_SOON - Auto-invoice from time -->

For T&M work:
1. Select time entries
2. Click **Create Invoice**
3. Time converts to line items
4. Review rates and totals
5. Send

→ [Create an invoice](/help/invoicing/create-invoice.guide.md)

---

## Invoice Content

### Header

- Your company logo and info
- Invoice number (auto-generated)
- Invoice date
- Due date
- Client billing address

### Line Items

Each line item includes:
- Description of work/materials
- Quantity
- Rate/price
- Line total

### Summary

- Subtotal
- Tax (if applicable)
- Payments received
- **Amount Due**

### Payment Instructions

- Accepted payment methods
- Online payment link
- Bank details (if applicable)
- Late payment terms

---

## Sending Invoices

### Email Delivery

1. Click **Send Invoice**
2. Confirm client email
3. Add message (optional)
4. Send

Client receives:
- Professional email
- Invoice PDF attached
- Pay online button (if enabled)

### Manual Delivery

1. Click **Download PDF**
2. Print or email manually
3. Mark as sent in system

---

## Online Payments

<!-- STATUS: NEEDS_SCOPE - Payment processor integration details -->

### Setting Up Payments

1. Go to **Settings → Payments**
2. Connect your payment processor:
   - Stripe (recommended)
   - Square
   - PayPal
3. Configure payment options
4. Test with a small invoice

### How It Works

1. Client receives invoice email
2. Clicks **Pay Now**
3. Enters payment info
4. Payment processes
5. You're notified
6. Invoice auto-updates to Paid

### Payment Methods

| Method | Processing Time | Fees |
|--------|----------------|------|
| Credit Card | Instant | ~2.9% + $0.30 |
| ACH/Bank Transfer | 3-5 days | ~0.8% |
| Check | Manual | None |
| Cash | Manual | None |

---

## Tracking Payments

### Payment Status

View all invoices by status:
- **Unpaid** — Not yet paid
- **Partial** — Some payment received
- **Paid** — Fully paid
- **Overdue** — Past due date

### Recording Manual Payments

When you receive a check or cash:

1. Open the invoice
2. Click **Record Payment**
3. Enter amount
4. Select payment method
5. Add reference (check #)
6. Save

### Partial Payments

Clients can pay in installments:

1. Record first payment
2. Invoice shows remaining balance
3. Record subsequent payments
4. Invoice closes when paid in full

---

## Payment Schedules

### Setting Up Schedules

For large projects, create payment milestones:

| Milestone | Amount | When |
|-----------|--------|------|
| Deposit | 25% | Contract signed |
| Rough Complete | 25% | Rough inspections pass |
| Substantial Complete | 40% | Punch list phase |
| Final | 10% | Project complete |

### Scheduling Invoices

<!-- STATUS: COMING_SOON - Scheduled invoicing -->

1. Create invoices in advance
2. Set send dates
3. System sends automatically
4. You're notified when sent

---

## Late Payments

### Automated Reminders

<!-- STATUS: COMING_SOON - Payment reminders -->

Set up automatic reminders:
- 3 days before due
- On due date
- 7 days overdue
- 14 days overdue
- 30 days overdue

### Manual Follow-Up

1. Filter by **Overdue**
2. Click **Send Reminder**
3. Customize message
4. Send

### Late Fees

<!-- STATUS: NEEDS_SCOPE - Late fee implementation -->

Configure late fee policy:
- Percentage or flat fee
- Grace period
- Maximum fee
- Waiver option

---

## Credits and Refunds

### Issuing a Credit

When you owe the client:

1. Create a **Credit Memo**
2. Reference original invoice
3. Enter credit amount
4. Apply to open invoices or refund

### Processing Refunds

<!-- STATUS: NEEDS_SCOPE - Refund processing -->

For online payments:
1. Open the payment
2. Click **Refund**
3. Enter refund amount
4. Confirm
5. Refund processes through payment provider

---

## Invoice Numbering

### Default Format

Invoices are numbered automatically:
- INV-2025-0001
- INV-2025-0002
- etc.

### Custom Format

<!-- STATUS: COMING_SOON - Custom invoice numbering -->

Customize your numbering:
- Prefix (your initials, company code)
- Starting number
- Include project code

---

## Reporting

### Invoice Summary

View totals for any period:
- Total invoiced
- Total collected
- Outstanding balance
- Average days to pay

### Aging Report

See overdue amounts by age:
- Current (not yet due)
- 1-30 days overdue
- 31-60 days overdue
- 61-90 days overdue
- 90+ days overdue

### Client Statements

Generate statements showing:
- All invoices for a client
- Payments received
- Current balance

→ [Invoice reports](/help/reports/invoicing.md)

---

## Best Practices

### Get Paid Faster

1. **Invoice promptly** — Don't wait weeks
2. **Clear descriptions** — Client knows what they're paying for
3. **Enable online payments** — Reduces friction
4. **Set realistic due dates** — Net 15 or Net 30
5. **Follow up quickly** — On overdue invoices

### Protect Yourself

1. **Match to contracts** — Reference agreement
2. **Document approvals** — For change orders
3. **Keep records** — All payments and communications
4. **Clear terms** — On every invoice

### Stay Organized

1. **Consistent process** — Invoice at same time
2. **Track everything** — Use the system, not spreadsheets
3. **Reconcile regularly** — Match to bank deposits
4. **Review aging weekly** — Catch issues early

---

## Common Questions

### Can I edit a sent invoice?

You can make corrections and resend. The original is kept for records.

### What if a client disputes an invoice?

1. Review with them
2. Adjust if needed
3. Create credit memo for reductions
4. Document resolution

### How do I handle deposits?

Create an invoice for the deposit amount, reference it as a deposit, and apply it when creating the final invoice.

### Can I invoice multiple projects together?

Yes. Create an invoice and add line items from multiple projects.

### How do I void an invoice?

Click **⋮ → Void Invoice**. The invoice remains for records but doesn't count toward totals.

---

## Permissions

| Action | Owner | PM | Employee |
|--------|-------|-----|----------|
| Create invoices | ✓ | ✓ | — |
| Send invoices | ✓ | ✓ | — |
| Record payments | ✓ | ✓ | — |
| View all invoices | ✓ | ✓ | — |
| Issue refunds | ✓ | — | — |
| Void invoices | ✓ | — | — |
| Configure settings | ✓ | — | — |

---

## Related Topics

- [Create an invoice](/help/invoicing/create-invoice.guide.md)
- [Record a payment](/help/invoicing/record-payment.guide.md)
- [Invoice reports](/help/reports/invoicing.md)
- [Payment settings](/help/settings/payments.md)
- [Client management](/help/clients/overview.md)
