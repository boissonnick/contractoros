# Suite 07: Financial Operations Tests

## Overview

Tests invoicing, expenses, payroll, and payment tracking functionality.

**Priority:** P1
**Estimated Time:** 30 minutes
**Prerequisite:** Projects and clients exist, logged in as OWNER or FINANCE

---

## Part A: Invoice Tests

### FIN-001: Create Invoice
**Priority:** CRITICAL
**Expected:** Can create new invoice

```
STEPS:
1. Navigate to /dashboard/invoices
2. Click "New Invoice"
3. Fill in:
   - Select project
   - Select client (or auto-filled)
   - Add line item: "Labor - 10 hours @ $50"
   - Amount: $500
4. Save as draft

VERIFY:
[ ] Form accepts input
[ ] Calculations correct
[ ] Invoice saved
[ ] Appears in invoice list with "draft" status

CONSOLE CHECK:
[ ] Invoice created in Firestore
[ ] No calculation errors

RESULT: PASS / FAIL
INVOICE ID: ___
```

### FIN-002: Invoice Line Items
**Priority:** CRITICAL
**Expected:** Line items calculate correctly

```
STEPS:
1. Create/edit invoice
2. Add line item: Qty 10, Rate $50
3. Add another line item: Qty 5, Rate $100
4. Observe totals

VERIFY:
[ ] Line 1: 10 × $50 = $500
[ ] Line 2: 5 × $100 = $500
[ ] Subtotal: $1,000
[ ] Tax calculation (if applicable)
[ ] Grand total correct

CONSOLE CHECK:
[ ] No calculation errors

RESULT: PASS / FAIL
```

### FIN-003: Invoice Validation
**Priority:** MAJOR
**Expected:** Validates required fields

```
STEPS:
1. Try to create invoice without project
2. Try to create invoice without line items

VERIFY:
[ ] Required fields validated
[ ] Cannot save without minimum data

RESULT: PASS / FAIL
```

### FIN-004: Edit Invoice
**Priority:** CRITICAL
**Expected:** Can edit draft invoices

```
STEPS:
1. Open a draft invoice
2. Change line item amount
3. Add new line item
4. Save

VERIFY:
[ ] Changes saved
[ ] Totals recalculated
[ ] Updated data persists

RESULT: PASS / FAIL
```

### FIN-005: Send Invoice
**Priority:** CRITICAL
**Expected:** Can send invoice to client

```
STEPS:
1. Open a draft invoice
2. Click "Send" or "Send to Client"
3. Confirm send

VERIFY:
[ ] Status changes to "sent"
[ ] Sent date recorded
[ ] Email would be sent (if applicable)
[ ] Cannot edit certain fields after send (if locked)

CONSOLE CHECK:
[ ] Status update saved
[ ] Email function triggered (if applicable)

RESULT: PASS / FAIL
```

### FIN-006: Mark Invoice Paid
**Priority:** CRITICAL
**Expected:** Can mark invoice as paid

```
STEPS:
1. Open a sent invoice
2. Find "Mark as Paid" option
3. Enter payment details:
   - Payment date
   - Payment amount
   - Payment method
4. Confirm

VERIFY:
[ ] Status changes to "paid"
[ ] Payment amount recorded
[ ] Payment date recorded
[ ] Appears in paid invoices filter

RESULT: PASS / FAIL
```

### FIN-007: Invoice PDF Generation
**Priority:** MAJOR
**Expected:** Can generate/view invoice PDF

```
STEPS:
1. Open an invoice
2. Click "View PDF" or "Download PDF"
3. Observe result

VERIFY:
[ ] PDF generates/opens
[ ] Contains correct data
[ ] Formatting acceptable
[ ] No error messages

CONSOLE CHECK:
[ ] PDF generation successful
[ ] No rendering errors

RESULT: PASS / FAIL
```

---

## Part B: Expense Tests

### FIN-008: Submit Expense
**Priority:** CRITICAL
**Expected:** Can submit expense for approval

```
STEPS:
1. Navigate to /dashboard/expenses
2. Click "New Expense" or "Submit Expense"
3. Fill in:
   - Description: "Office supplies"
   - Amount: $150
   - Category: Supplies
   - Date: Today
   - Project (if applicable)
4. Submit

VERIFY:
[ ] Expense saved
[ ] Status: pending approval
[ ] Appears in expense list
[ ] Amount correct

CONSOLE CHECK:
[ ] Expense created

RESULT: PASS / FAIL
```

### FIN-009: Expense with Receipt
**Priority:** MAJOR
**Expected:** Can attach receipt to expense

```
STEPS:
1. Create expense
2. Upload receipt image

VERIFY:
[ ] Image uploads successfully
[ ] Receipt viewable
[ ] Attached to expense

RESULT: PASS / FAIL / NOT IMPLEMENTED
```

### FIN-010: Approve Expense
**Priority:** CRITICAL
**Expected:** Approver can approve expenses

```
STEPS:
1. As OWNER or FINANCE, go to expenses
2. Find pending expense
3. Click Approve

VERIFY:
[ ] Status changes to "approved"
[ ] Approval recorded
[ ] Appears in approved list

RESULT: PASS / FAIL
```

### FIN-011: Reject Expense
**Priority:** MAJOR
**Expected:** Can reject expenses with reason

```
STEPS:
1. Find pending expense
2. Click Reject
3. Enter reason: "Missing receipt"

VERIFY:
[ ] Status changes to "rejected"
[ ] Reason saved
[ ] Submitter notified (if applicable)

RESULT: PASS / FAIL
```

### FIN-012: Edit Pending Expense
**Priority:** MAJOR
**Expected:** Submitter can edit pending expenses

```
STEPS:
1. As expense creator, open pending expense
2. Edit amount
3. Save

VERIFY:
[ ] Changes allowed for pending status
[ ] Cannot edit approved expenses

RESULT: PASS / FAIL
```

---

## Part C: Payroll Tests

### FIN-013: View Payroll Dashboard
**Priority:** CRITICAL
**Expected:** Payroll section renders (for authorized roles)

```
STEPS:
1. Login as OWNER or FINANCE
2. Navigate to /dashboard/payroll
3. Wait for load

VERIFY:
[ ] Page loads successfully
[ ] Stats/summary visible
[ ] Payroll runs listed (if any)
[ ] No permission errors

CONSOLE CHECK:
[ ] No access denied errors

RESULT: PASS / FAIL
```

### FIN-014: Create Payroll Run
**Priority:** CRITICAL
**Expected:** Can create new payroll run

```
STEPS:
1. Click "New Payroll Run" or "Run Payroll"
2. Select pay period
3. Review employees included
4. Calculate payroll
5. Save/submit

VERIFY:
[ ] Pay period selectable
[ ] Employees listed with hours/rates
[ ] Calculations display:
   - Gross pay
   - Deductions (if any)
   - Net pay
[ ] Payroll run saved

CONSOLE CHECK:
[ ] Calculations correct
[ ] No errors

RESULT: PASS / FAIL
```

### FIN-015: Payroll Calculations
**Priority:** CRITICAL
**Expected:** Payroll math is correct

```
STEPS:
1. Create payroll run with known data
2. Employee: 40 hours @ $25/hr

VERIFY:
[ ] Gross: 40 × $25 = $1,000
[ ] Deductions calculated (if configured)
[ ] Net pay correct
[ ] Totals sum correctly

RESULT: PASS / FAIL
```

### FIN-016: View Payroll Run Detail
**Priority:** MAJOR
**Expected:** Can view completed payroll details

```
STEPS:
1. Open a completed payroll run
2. View details

VERIFY:
[ ] Run date shown
[ ] Pay period shown
[ ] Employee breakdown visible
[ ] Total amounts shown
[ ] Individual paystubs accessible (if implemented)

RESULT: PASS / FAIL
```

---

## Part D: Financial Reports

### FIN-017: Income Summary
**Priority:** MAJOR
**Expected:** Can view income summary

```
STEPS:
1. Navigate to reports or financial summary
2. View income report

VERIFY:
[ ] Total invoiced shown
[ ] Total collected shown
[ ] Outstanding receivables shown
[ ] Date filters work (if available)

RESULT: PASS / FAIL / NOT IMPLEMENTED
```

### FIN-018: Expense Summary
**Priority:** MAJOR
**Expected:** Can view expense summary

```
STEPS:
1. View expense report

VERIFY:
[ ] Total expenses by category
[ ] Date range filtering
[ ] Approved vs pending breakdown

RESULT: PASS / FAIL / NOT IMPLEMENTED
```

---

## Finance Test Summary

```
| Test ID | Test Name | Status | Console Errors |
|---------|-----------|--------|----------------|
| FIN-001 | Create Invoice | | |
| FIN-002 | Line Items | | |
| FIN-003 | Validation | | |
| FIN-004 | Edit Invoice | | |
| FIN-005 | Send Invoice | | |
| FIN-006 | Mark Paid | | |
| FIN-007 | PDF Generation | | |
| FIN-008 | Submit Expense | | |
| FIN-009 | Receipt Upload | | |
| FIN-010 | Approve Expense | | |
| FIN-011 | Reject Expense | | |
| FIN-012 | Edit Expense | | |
| FIN-013 | Payroll View | | |
| FIN-014 | Create Payroll | | |
| FIN-015 | Calculations | | |
| FIN-016 | Payroll Detail | | |
| FIN-017 | Income Report | | |
| FIN-018 | Expense Report | | |

TOTAL: 18 tests
PASSED: ___
FAILED: ___
```

## Next Suite

→ Proceed to Suite 08: Scheduling Tests
