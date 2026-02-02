# Suite 07: Finances

Tests for invoices, expenses, estimates, and payroll.

---

## SECTION: Invoices

### TEST: Invoices List Page
**Priority:** P0
**Roles:** owner, finance
**Viewports:** desktop

### Steps
1. Navigate to /dashboard/invoices
2. Observe page

### Expected Results
- ✓ Invoice list displayed
- ✓ Status filters available
- ✓ "Create Invoice" button visible
- ✓ Total outstanding amount visible

---

### TEST: Create Invoice
**Priority:** P0
**Roles:** owner, finance
**Viewports:** desktop

### Steps
1. Click "Create Invoice"
2. Select project
3. Add line items
4. Set due date
5. Submit

### Expected Results
- ✓ Invoice created
- ✓ Invoice number assigned
- ✓ Appears in list
- ✓ Correct totals calculated

---

### TEST: Invoice Status Flow
**Priority:** P1
**Roles:** owner, finance
**Viewports:** desktop

### Steps
1. Create draft invoice
2. Change to "sent"
3. Mark as "paid"

### Expected Results
- ✓ Status transitions work
- ✓ Paid date recorded
- ✓ Outstanding amount updates

---

### TEST: Invoice PDF Generation
**Priority:** P1
**Roles:** owner, finance
**Viewports:** desktop

### Steps
1. Open invoice
2. Click "Download PDF" or "Preview"

### Expected Results
- ✓ PDF generates
- ✓ Contains correct info
- ✓ Professional formatting

---

## SECTION: Estimates

### TEST: Estimates List Page
**Priority:** P0
**Roles:** owner, project_manager
**Viewports:** desktop

### Steps
1. Navigate to /dashboard/estimates
2. Observe page

### Expected Results
- ✓ Estimate list displayed
- ✓ Status visible (draft, sent, accepted, etc.)
- ✓ "New Estimate" button visible

---

### TEST: Create Estimate
**Priority:** P0
**Roles:** owner, project_manager
**Viewports:** desktop

### Steps
1. Click "New Estimate"
2. Fill client info
3. Add line items
4. Submit

### Expected Results
- ✓ Estimate created
- ✓ Totals calculated correctly
- ✓ Can be edited before sending

---

### TEST: Send Estimate for Signature
**Priority:** P1
**Roles:** owner, project_manager
**Viewports:** desktop

### Steps
1. Open estimate
2. Click "Send for Signature"
3. Enter client email
4. Send

### Expected Results
- ✓ Signature request created
- ✓ Email sent (or queued)
- ✓ Status changes to "sent"

---

### TEST: Estimate to Project Conversion
**Priority:** P1
**Roles:** owner, project_manager
**Viewports:** desktop

### Steps
1. Open accepted estimate
2. Convert to project

### Expected Results
- ✓ Project created
- ✓ Budget set from estimate
- ✓ Client linked
- ✓ Estimate marked as converted

---

## SECTION: Expenses

### TEST: Expenses List Page
**Priority:** P1
**Roles:** owner, finance
**Viewports:** desktop

### Steps
1. Navigate to /dashboard/expenses (or finances)
2. Observe expense tracking

### Expected Results
- ✓ Expense list visible
- ✓ Can filter by project
- ✓ Can filter by status

---

### TEST: Add Expense
**Priority:** P1
**Roles:** owner, employee
**Viewports:** desktop

### Steps
1. Add new expense
2. Fill description, amount, category
3. Attach receipt (optional)
4. Submit

### Expected Results
- ✓ Expense created
- ✓ Pending approval (if not owner)
- ✓ Receipt attached (if provided)

---

### TEST: Expense Approval
**Priority:** P1
**Roles:** owner, finance
**Viewports:** desktop

### Steps
1. View pending expense
2. Approve or reject

### Expected Results
- ✓ Status changes
- ✓ Approval recorded
- ✓ Project expense totals update

---

## SECTION: Payroll

### TEST: Payroll Dashboard
**Priority:** P0
**Roles:** owner, finance
**Viewports:** desktop

### Steps
1. Navigate to /dashboard/payroll
2. Observe page

### Expected Results
- ✓ Payroll overview visible
- ✓ Recent/upcoming pay runs listed
- ✓ "Create Payroll Run" button visible
- ✓ Team earnings summary

---

### TEST: Create Payroll Run
**Priority:** P1
**Roles:** owner, finance
**Viewports:** desktop

### Steps
1. Click "Create Payroll Run"
2. Select pay period
3. Review hours
4. Process

### Expected Results
- ✓ Pay run created
- ✓ Hours pulled from time entries
- ✓ Calculations correct
- ✓ Can preview before finalizing

---

### TEST: Payroll Approval
**Priority:** P1
**Roles:** owner
**Viewports:** desktop

### Steps
1. Open pending payroll run
2. Approve payroll

### Expected Results
- ✓ Approval recorded with user/timestamp
- ✓ Status changes to approved
- ✓ Pay stubs generated

---

### TEST: Pay Stub Download
**Priority:** P2
**Roles:** owner, finance
**Viewports:** desktop

### Steps
1. Open approved payroll
2. Download pay stub for employee

### Expected Results
- ✓ PDF generates
- ✓ Contains correct employee info
- ✓ Hours and amounts correct

---

## Finances Test Summary

```
FINANCES TEST RESULTS
=====================
Invoices List:          [PASS/FAIL]
Create Invoice:         [PASS/FAIL]
Invoice Status Flow:    [PASS/FAIL]
Invoice PDF:            [PASS/FAIL]
Estimates List:         [PASS/FAIL]
Create Estimate:        [PASS/FAIL]
Send for Signature:     [PASS/FAIL]
Estimate Conversion:    [PASS/FAIL]
Expenses List:          [PASS/FAIL]
Add Expense:            [PASS/FAIL]
Expense Approval:       [PASS/FAIL]
Payroll Dashboard:      [PASS/FAIL]
Create Payroll:         [PASS/FAIL]
Payroll Approval:       [PASS/FAIL]
Pay Stub Download:      [PASS/FAIL]

Overall: [X/15 PASSED]
```
