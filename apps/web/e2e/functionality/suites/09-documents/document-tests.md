# Suite 09: Documents & E-Signatures Tests

## Overview

Tests estimates, scope of work, change orders, and e-signature workflows.

**Priority:** P1
**Estimated Time:** 30 minutes
**Prerequisite:** Projects and clients exist

---

## Part A: Estimates

### DOC-001: Create Estimate
**Priority:** CRITICAL
**Expected:** Can create new estimate

```
STEPS:
1. Navigate to /dashboard/estimates
2. Click "New Estimate"
3. Fill in:
   - Project: Select
   - Client: Auto-filled or select
   - Title: "Kitchen Renovation Estimate"
4. Proceed to line items

VERIFY:
[ ] Form opens
[ ] Project/client linkable
[ ] Can proceed to add items

CONSOLE CHECK:
[ ] No errors

RESULT: PASS / FAIL
```

### DOC-002: Add Line Items to Estimate
**Priority:** CRITICAL
**Expected:** Line items add and calculate

```
STEPS:
1. In estimate, add line items:
   - Item 1: Labor - 20 hrs @ $75 = $1,500
   - Item 2: Materials - 1 @ $500 = $500
   - Item 3: Permits - 1 @ $200 = $200
2. Review totals

VERIFY:
[ ] Items added successfully
[ ] Subtotal: $2,200
[ ] Tax calculated (if configured)
[ ] Grand total correct

CONSOLE CHECK:
[ ] No calculation errors

RESULT: PASS / FAIL
```

### DOC-003: Use Line Item Library
**Priority:** MAJOR
**Expected:** Can add items from saved library

```
STEPS:
1. In estimate, click "Add from Library"
2. Select saved line item
3. Add to estimate

VERIFY:
[ ] Library items displayed
[ ] Item added with saved price
[ ] Quantity adjustable

RESULT: PASS / FAIL / LIBRARY EMPTY
```

### DOC-004: Edit Estimate
**Priority:** CRITICAL
**Expected:** Can modify draft estimates

```
STEPS:
1. Open draft estimate
2. Change line item quantity
3. Add new item
4. Remove an item
5. Save

VERIFY:
[ ] All changes saved
[ ] Totals recalculate
[ ] Changes persist

RESULT: PASS / FAIL
```

### DOC-005: Preview Estimate
**Priority:** MAJOR
**Expected:** Can preview estimate document

```
STEPS:
1. Open estimate
2. Click "Preview" or view PDF

VERIFY:
[ ] Preview renders
[ ] All line items shown
[ ] Totals correct
[ ] Company branding (if configured)

RESULT: PASS / FAIL
```

### DOC-006: Send Estimate for Signature
**Priority:** CRITICAL
**Expected:** Can send estimate to client for e-signature

```
STEPS:
1. Open completed estimate
2. Click "Send for Signature"
3. Confirm client email
4. Send

VERIFY:
[ ] Signature request created
[ ] Status: "Pending signature"
[ ] Email sent (or would be sent)
[ ] Signing link generated

CONSOLE CHECK:
[ ] SignatureRequest created
[ ] Email function triggered

RESULT: PASS / FAIL
```

---

## Part B: E-Signatures

### DOC-007: View Signature Requests
**Priority:** CRITICAL
**Expected:** Signature requests list renders

```
STEPS:
1. Navigate to /dashboard/signatures
2. Wait for load

VERIFY:
[ ] Requests listed
[ ] Status shown (pending, signed, etc.)
[ ] Document title shown
[ ] Client name shown

RESULT: PASS / FAIL
```

### DOC-008: Sign Document (Client Flow)
**Priority:** CRITICAL
**Expected:** Client can sign via magic link

```
STEPS:
1. Get signing link (from test data or created request)
2. Open /sign/[token] link
3. Review document
4. Draw signature
5. Submit

VERIFY:
[ ] Document displays correctly
[ ] Can draw signature
[ ] "I Agree" or accept terms
[ ] Signature submitted
[ ] Confirmation shown

CONSOLE CHECK:
[ ] Signature saved
[ ] Status updated to "signed"

RESULT: PASS / FAIL
```

### DOC-009: Signature Captured Correctly
**Priority:** CRITICAL
**Expected:** Signature stored and accessible

```
STEPS:
1. After signing (DOC-008)
2. As admin, open the signature request
3. View signed document

VERIFY:
[ ] Signature visible on document
[ ] Signed timestamp recorded
[ ] Signer IP/device info (if captured)
[ ] Download signed document works

RESULT: PASS / FAIL
```

### DOC-010: Decline Signature
**Priority:** MAJOR
**Expected:** Client can decline to sign

```
STEPS:
1. Open signing link
2. Find "Decline" option
3. Enter decline reason
4. Submit

VERIFY:
[ ] Status changes to "declined"
[ ] Reason saved
[ ] Notification sent to sender

RESULT: PASS / FAIL
```

### DOC-011: Resend Signature Request
**Priority:** MINOR
**Expected:** Can resend signature email

```
STEPS:
1. Find pending signature request
2. Click Resend

VERIFY:
[ ] New email sent
[ ] Link still valid

RESULT: PASS / FAIL
```

### DOC-012: Cancel Signature Request
**Priority:** MAJOR
**Expected:** Can cancel pending requests

```
STEPS:
1. Find pending request
2. Cancel

VERIFY:
[ ] Status: cancelled
[ ] Link no longer works

RESULT: PASS / FAIL
```

---

## Part C: Scope of Work (SOW)

### DOC-013: Create SOW
**Priority:** MAJOR
**Expected:** Can create scope of work document

```
STEPS:
1. Navigate to project scope section
2. Create new SOW
3. Add sections:
   - Description of work
   - Materials included
   - Timeline
4. Save

VERIFY:
[ ] SOW created
[ ] Sections saved
[ ] Linked to project

RESULT: PASS / FAIL
```

### DOC-014: Use SOW Template
**Priority:** MINOR
**Expected:** Can create from template

```
STEPS:
1. Click "Create from Template"
2. Select template
3. Customize
4. Save

VERIFY:
[ ] Template content loaded
[ ] Can modify
[ ] Saves as new SOW

RESULT: PASS / FAIL / NO TEMPLATES
```

### DOC-015: Edit SOW
**Priority:** MAJOR
**Expected:** Can edit scope document

```
STEPS:
1. Open existing SOW
2. Modify content
3. Save

VERIFY:
[ ] Changes saved
[ ] Version tracked (if applicable)

RESULT: PASS / FAIL
```

---

## Part D: Change Orders

### DOC-016: Create Change Order
**Priority:** CRITICAL
**Expected:** Can create change order

```
STEPS:
1. Navigate to project change orders
2. Click "New Change Order"
3. Fill in:
   - Title: "Add electrical outlet"
   - Description: Details
   - Amount: +$500
4. Save

VERIFY:
[ ] Change order created
[ ] Amount recorded
[ ] Status: draft

CONSOLE CHECK:
[ ] Saved to Firestore

RESULT: PASS / FAIL
```

### DOC-017: Change Order Approval
**Priority:** CRITICAL
**Expected:** Client approves change order

```
STEPS:
1. Send change order for approval
2. As client/admin, approve

VERIFY:
[ ] Status: approved
[ ] Project budget updated (if applicable)
[ ] Adds to project total

RESULT: PASS / FAIL
```

### DOC-018: Change Order with Signature
**Priority:** MAJOR
**Expected:** Change order can require signature

```
STEPS:
1. Create change order
2. Send for signature
3. Client signs

VERIFY:
[ ] Signature request created
[ ] Client can sign
[ ] Signed CO stored

RESULT: PASS / FAIL / NOT IMPLEMENTED
```

---

## Document Test Summary

```
| Test ID | Test Name | Status | Console Errors |
|---------|-----------|--------|----------------|
| DOC-001 | Create Estimate | | |
| DOC-002 | Line Items | | |
| DOC-003 | Item Library | | |
| DOC-004 | Edit Estimate | | |
| DOC-005 | Preview | | |
| DOC-006 | Send for Sig | | |
| DOC-007 | View Requests | | |
| DOC-008 | Sign Doc | | |
| DOC-009 | Sig Captured | | |
| DOC-010 | Decline Sig | | |
| DOC-011 | Resend | | |
| DOC-012 | Cancel | | |
| DOC-013 | Create SOW | | |
| DOC-014 | SOW Template | | |
| DOC-015 | Edit SOW | | |
| DOC-016 | Create CO | | |
| DOC-017 | CO Approval | | |
| DOC-018 | CO Signature | | |

TOTAL: 18 tests
PASSED: ___
FAILED: ___
```

## Next Suite

→ Proceed to Suite 10: Materials Tests (if time) or Suite 12: Portals
