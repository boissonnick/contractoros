# Suite 11: Settings & Configuration Tests

## Overview

Tests user profile settings, organization settings, templates, and configuration options.

**Priority:** P2
**Estimated Time:** 15 minutes
**Prerequisite:** Logged in as OWNER

---

## Part A: User Profile

### SET-001: View Profile
**Priority:** MAJOR
**Expected:** Profile page renders

```
STEPS:
1. Navigate to /dashboard/settings/profile
2. Wait for data

VERIFY:
[ ] Profile page loads
[ ] Name displayed
[ ] Email displayed
[ ] Phone displayed (if set)
[ ] Avatar/photo (if implemented)

RESULT: PASS / FAIL
```

### SET-002: Edit Profile
**Priority:** MAJOR
**Expected:** Can update profile info

```
STEPS:
1. Edit display name
2. Edit phone number
3. Save

VERIFY:
[ ] Changes saved
[ ] Updated info displays
[ ] Persists on refresh
[ ] Name updates in header (if shown)

RESULT: PASS / FAIL
```

### SET-003: Change Password
**Priority:** MAJOR
**Expected:** Can change password

```
STEPS:
1. Navigate to password change
2. Enter current password
3. Enter new password
4. Confirm new password
5. Submit

VERIFY:
[ ] Password change accepted
[ ] Can login with new password
[ ] Old password no longer works

NOTE: May not be testable without disrupting session

RESULT: PASS / FAIL / NOT TESTED
```

---

## Part B: Organization Settings

### SET-004: View Organization Settings
**Priority:** MAJOR
**Expected:** Org settings render (OWNER only)

```
STEPS:
1. Navigate to /dashboard/settings/organization
2. Wait for data

VERIFY:
[ ] Organization name shown
[ ] Address shown
[ ] Logo (if set)
[ ] Business info visible

RESULT: PASS / FAIL
```

### SET-005: Edit Organization
**Priority:** MAJOR
**Expected:** Can update org info

```
STEPS:
1. Change organization name
2. Update address
3. Save

VERIFY:
[ ] Changes saved
[ ] Updated info displays

RESULT: PASS / FAIL
```

### SET-006: Upload Logo
**Priority:** MINOR
**Expected:** Can upload company logo

```
STEPS:
1. Find logo upload option
2. Upload image file
3. Save

VERIFY:
[ ] Logo uploads
[ ] Displays correctly
[ ] Shows on documents (if applicable)

RESULT: PASS / FAIL / NOT IMPLEMENTED
```

---

## Part C: Notification Settings

### SET-007: View Notification Preferences
**Priority:** MINOR
**Expected:** Can view notification settings

```
STEPS:
1. Navigate to notification settings

VERIFY:
[ ] Options displayed
[ ] Email notification toggles
[ ] Push notification toggles (if applicable)

RESULT: PASS / FAIL
```

### SET-008: Toggle Notifications
**Priority:** MINOR
**Expected:** Can enable/disable notifications

```
STEPS:
1. Toggle off email notifications for tasks
2. Save
3. Toggle back on

VERIFY:
[ ] Setting saved
[ ] Preference persists

RESULT: PASS / FAIL
```

---

## Part D: Templates

### SET-009: View Quote Templates
**Priority:** MAJOR
**Expected:** Quote template library renders

```
STEPS:
1. Navigate to /dashboard/settings/quote-templates

VERIFY:
[ ] Templates listed
[ ] Can view template content
[ ] Create new option available

RESULT: PASS / FAIL
```

### SET-010: Create Quote Template
**Priority:** MAJOR
**Expected:** Can create new template

```
STEPS:
1. Click "Create Template"
2. Add name: "Standard Kitchen Remodel"
3. Add line items
4. Save

VERIFY:
[ ] Template created
[ ] Appears in list
[ ] Can use when creating estimate

RESULT: PASS / FAIL
```

### SET-011: Edit Template
**Priority:** MAJOR
**Expected:** Can modify templates

```
STEPS:
1. Open template
2. Change line item
3. Save

VERIFY:
[ ] Changes saved
[ ] Template updated

RESULT: PASS / FAIL
```

### SET-012: Delete Template
**Priority:** MINOR
**Expected:** Can delete templates

```
STEPS:
1. Select template
2. Delete

VERIFY:
[ ] Confirmation required
[ ] Template removed

RESULT: PASS / FAIL
```

---

## Part E: Line Item Library

### SET-013: View Line Items
**Priority:** MAJOR
**Expected:** Line item library renders

```
STEPS:
1. Navigate to /dashboard/settings/line-items

VERIFY:
[ ] Items listed
[ ] Name, price, category visible

RESULT: PASS / FAIL
```

### SET-014: Add Line Item
**Priority:** MAJOR
**Expected:** Can add to library

```
STEPS:
1. Add new item:
   - Name: "Standard Labor Hour"
   - Price: $75
   - Unit: Hour
2. Save

VERIFY:
[ ] Item created
[ ] Available in estimates

RESULT: PASS / FAIL
```

---

## Part F: Tax Rates

### SET-015: View Tax Rates
**Priority:** MAJOR
**Expected:** Tax configuration renders

```
STEPS:
1. Navigate to /dashboard/settings/tax-rates

VERIFY:
[ ] Tax rates displayed
[ ] Rate percentages shown

RESULT: PASS / FAIL
```

### SET-016: Configure Tax Rate
**Priority:** MAJOR
**Expected:** Can set tax rate

```
STEPS:
1. Add or edit tax rate
2. Set to 8.25%
3. Save

VERIFY:
[ ] Rate saved
[ ] Applied to new invoices

RESULT: PASS / FAIL
```

---

## Settings Test Summary

```
| Test ID | Test Name | Status | Console Errors |
|---------|-----------|--------|----------------|
| SET-001 | View Profile | | |
| SET-002 | Edit Profile | | |
| SET-003 | Change Password | | |
| SET-004 | View Org | | |
| SET-005 | Edit Org | | |
| SET-006 | Upload Logo | | |
| SET-007 | View Notifications | | |
| SET-008 | Toggle Notif | | |
| SET-009 | View Templates | | |
| SET-010 | Create Template | | |
| SET-011 | Edit Template | | |
| SET-012 | Delete Template | | |
| SET-013 | View Line Items | | |
| SET-014 | Add Line Item | | |
| SET-015 | View Tax | | |
| SET-016 | Config Tax | | |

TOTAL: 16 tests
PASSED: ___
FAILED: ___
```

## Next Suite

→ Proceed to Suite 12: Portal Tests
