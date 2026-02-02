# Suite 10: Materials & Tools Tests

## Overview

Tests material inventory, tool/equipment management, and purchase orders.

**Priority:** P2
**Estimated Time:** 15 minutes
**Prerequisite:** Logged in as OWNER or PM

---

## Part A: Materials Inventory

### MAT-001: View Materials List
**Priority:** MAJOR
**Expected:** Materials inventory renders

```
STEPS:
1. Navigate to /dashboard/materials
2. Wait for data

VERIFY:
[ ] Materials list displays
[ ] Name, quantity, unit visible
[ ] Category visible (if applicable)
[ ] Stock levels shown

RESULT: PASS / FAIL
```

### MAT-002: Add Material
**Priority:** MAJOR
**Expected:** Can add new material

```
STEPS:
1. Click "Add Material"
2. Fill in:
   - Name: "2x4 Lumber 8ft"
   - Unit: Each
   - Quantity in stock: 50
   - Cost: $4.50
3. Save

VERIFY:
[ ] Material created
[ ] Appears in list
[ ] Quantity correct

RESULT: PASS / FAIL
```

### MAT-003: Edit Material
**Priority:** MAJOR
**Expected:** Can modify material details

```
STEPS:
1. Open material detail
2. Change quantity
3. Save

VERIFY:
[ ] Changes saved
[ ] Updated quantity displays

RESULT: PASS / FAIL
```

### MAT-004: Low Stock Alerts
**Priority:** MINOR
**Expected:** Alerts for low inventory

```
STEPS:
1. Set material minimum threshold
2. Reduce quantity below threshold

VERIFY:
[ ] Low stock warning appears
[ ] Dashboard shows alert (if implemented)

RESULT: PASS / FAIL / NOT IMPLEMENTED
```

### MAT-005: Allocate Material to Project
**Priority:** MAJOR
**Expected:** Can allocate inventory to project

```
STEPS:
1. Open material
2. Allocate to project:
   - Quantity: 10
   - Project: Select
3. Save

VERIFY:
[ ] Allocation recorded
[ ] Available stock reduced
[ ] Project shows allocation

RESULT: PASS / FAIL / NOT IMPLEMENTED
```

---

## Part B: Tools & Equipment

### MAT-006: View Tools List
**Priority:** MAJOR
**Expected:** Tools inventory renders

```
STEPS:
1. Navigate to /dashboard/tools
2. Wait for data

VERIFY:
[ ] Tools list displays
[ ] Name, status, location visible
[ ] Checkout status shown

RESULT: PASS / FAIL
```

### MAT-007: Add Tool
**Priority:** MAJOR
**Expected:** Can add equipment

```
STEPS:
1. Click "Add Tool"
2. Fill in:
   - Name: "DeWalt Drill"
   - Model/Serial: ABC123
   - Condition: Good
3. Save

VERIFY:
[ ] Tool created
[ ] Appears in list

RESULT: PASS / FAIL
```

### MAT-008: Check Out Tool
**Priority:** MAJOR
**Expected:** Can check out tool to team member

```
STEPS:
1. Select available tool
2. Click "Check Out"
3. Assign to team member
4. Confirm

VERIFY:
[ ] Tool marked as "checked out"
[ ] Assignee recorded
[ ] Checkout date/time recorded

RESULT: PASS / FAIL
```

### MAT-009: Return Tool
**Priority:** MAJOR
**Expected:** Can check in returned tool

```
STEPS:
1. Select checked-out tool
2. Click "Return" or "Check In"
3. Note condition

VERIFY:
[ ] Tool marked as available
[ ] Return logged
[ ] Condition updated

RESULT: PASS / FAIL
```

### MAT-010: Tool Checkout History
**Priority:** MINOR
**Expected:** View checkout history

```
STEPS:
1. Open tool detail
2. View history

VERIFY:
[ ] Previous checkouts listed
[ ] Dates and assignees shown

RESULT: PASS / FAIL / NOT IMPLEMENTED
```

---

## Part C: Purchase Orders

### MAT-011: Create Purchase Order
**Priority:** MINOR
**Expected:** Can create PO for materials

```
STEPS:
1. Navigate to purchase orders
2. Create new PO
3. Add items
4. Set supplier
5. Save

VERIFY:
[ ] PO created
[ ] Items listed
[ ] Total calculated

RESULT: PASS / FAIL / NOT IMPLEMENTED
```

### MAT-012: Receive PO Items
**Priority:** MINOR
**Expected:** Can mark items received

```
STEPS:
1. Open PO
2. Mark items received

VERIFY:
[ ] Inventory updated
[ ] PO status updated

RESULT: PASS / FAIL / NOT IMPLEMENTED
```

---

## Materials Test Summary

```
| Test ID | Test Name | Status | Console Errors |
|---------|-----------|--------|----------------|
| MAT-001 | View Materials | | |
| MAT-002 | Add Material | | |
| MAT-003 | Edit Material | | |
| MAT-004 | Low Stock | | |
| MAT-005 | Allocate | | |
| MAT-006 | View Tools | | |
| MAT-007 | Add Tool | | |
| MAT-008 | Check Out | | |
| MAT-009 | Return | | |
| MAT-010 | History | | |
| MAT-011 | Create PO | | |
| MAT-012 | Receive PO | | |

TOTAL: 12 tests
PASSED: ___
FAILED: ___
```

## Next Suite

→ Proceed to Suite 11: Settings Tests
