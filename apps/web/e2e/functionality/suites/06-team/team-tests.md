# Suite 06: Team Management Tests

## Overview

Tests team member management, invitations, role assignments, and user settings.

**Priority:** P1
**Estimated Time:** 20 minutes
**Prerequisite:** Logged in as OWNER

---

## Test Cases

### TEAM-001: View Team Members
**Priority:** CRITICAL
**Expected:** Team member list renders correctly

```
STEPS:
1. Navigate to /dashboard/settings/team
2. Wait for data to load

VERIFY:
[ ] Team members listed
[ ] Name visible for each
[ ] Email visible
[ ] Role/title visible
[ ] Status visible (active/inactive)
[ ] No infinite loading

CONSOLE CHECK:
[ ] Users query successful
[ ] No permission errors

RESULT: PASS / FAIL
TEAM SIZE: ___
```

### TEAM-002: Send Team Invitation
**Priority:** CRITICAL
**Expected:** Can invite new team members

```
STEPS:
1. Go to team management
2. Click "Invite" or "Add Team Member"
3. Fill in:
   - Email: "newmember[timestamp]@test.com"
   - Name: "Test New Member"
   - Role: Employee
4. Send invitation

VERIFY:
[ ] Form accepts input
[ ] Success message appears
[ ] Invitation appears in pending list (if shown)
[ ] Email would be sent (check functions log if available)

CONSOLE CHECK:
[ ] Invitation created in Firestore
[ ] Cloud Function triggered (if applicable)

RESULT: PASS / FAIL
```

### TEAM-003: Invitation Validation
**Priority:** MAJOR
**Expected:** Validates invitation input

```
STEPS:
1. Try to invite with invalid email
2. Try to invite with empty name

VERIFY:
[ ] Invalid email rejected
[ ] Required fields validated
[ ] Duplicate email handling (if applicable)

RESULT: PASS / FAIL
```

### TEAM-004: Cancel Pending Invitation
**Priority:** MAJOR
**Expected:** Can cancel unaccepted invitations

```
STEPS:
1. Find a pending invitation
2. Click Cancel/Revoke
3. Confirm action

VERIFY:
[ ] Invitation cancelled
[ ] Removed from pending list
[ ] Link no longer works (if testable)

RESULT: PASS / FAIL / NO PENDING INVITES
```

### TEAM-005: Resend Invitation
**Priority:** MINOR
**Expected:** Can resend invitation email

```
STEPS:
1. Find a pending invitation
2. Click Resend

VERIFY:
[ ] Confirmation shown
[ ] No error
[ ] New email sent (check function logs)

RESULT: PASS / FAIL / NOT IMPLEMENTED
```

### TEAM-006: Change Member Role
**Priority:** CRITICAL
**Expected:** Can change team member's role

```
STEPS:
1. Click on a team member
2. Find role/permission settings
3. Change role (e.g., Employee → PM)
4. Save

VERIFY:
[ ] Role dropdown shows available roles
[ ] Change saved successfully
[ ] New role displayed
[ ] Permissions update (test with that user)

ROLE OPTIONS:
[ ] OWNER (may be restricted)
[ ] PM
[ ] FINANCE
[ ] EMPLOYEE
[ ] ASSISTANT

CONSOLE CHECK:
[ ] Role update saved

RESULT: PASS / FAIL
```

### TEAM-007: Deactivate Team Member
**Priority:** CRITICAL
**Expected:** Can deactivate (not delete) members

```
STEPS:
1. Select a team member
2. Find Deactivate option
3. Deactivate member

VERIFY:
[ ] Confirmation required
[ ] Member marked as inactive
[ ] Member cannot log in (if testable)
[ ] Data preserved (not deleted)
[ ] Can reactivate

RESULT: PASS / FAIL
```

### TEAM-008: Reactivate Team Member
**Priority:** MAJOR
**Expected:** Can reactivate deactivated members

```
STEPS:
1. Find a deactivated member
2. Click Reactivate

VERIFY:
[ ] Member active again
[ ] Can log in (if testable)
[ ] Previous role restored

RESULT: PASS / FAIL
```

### TEAM-009: View Member Profile
**Priority:** MAJOR
**Expected:** Can view member details

```
STEPS:
1. Click on a team member
2. View profile/detail page

VERIFY:
[ ] Name displayed
[ ] Email displayed
[ ] Role displayed
[ ] Phone/contact info (if available)
[ ] Projects assigned (if shown)
[ ] Activity/stats (if shown)

RESULT: PASS / FAIL
```

### TEAM-010: Edit Member Details
**Priority:** MAJOR
**Expected:** Can edit member information

```
STEPS:
1. Open member profile
2. Edit name or phone
3. Save changes

VERIFY:
[ ] Changes saved
[ ] Updated info displayed
[ ] Persists on refresh

NOTE: Some fields may be user-editable only

RESULT: PASS / FAIL
```

### TEAM-011: Search/Filter Team
**Priority:** MINOR
**Expected:** Can search and filter team

```
STEPS:
1. Search for team member by name
2. Filter by role (if available)

VERIFY:
[ ] Search returns correct members
[ ] Filter works
[ ] Clear restores full list

RESULT: PASS / FAIL / NOT IMPLEMENTED
```

### TEAM-012: Role Permissions Displayed
**Priority:** MAJOR
**Expected:** Can view what each role can do

```
STEPS:
1. Go to roles/permissions settings
2. View permission matrix or role details

VERIFY:
[ ] Roles listed
[ ] Permissions per role shown
[ ] Clearly indicates access levels

RESULT: PASS / FAIL / NOT IMPLEMENTED
```

### TEAM-013: Cannot Delete Owner
**Priority:** CRITICAL
**Expected:** Owner account cannot be deleted/deactivated by self

```
STEPS:
1. As Owner, try to deactivate own account
2. Observe behavior

VERIFY:
[ ] Action prevented
[ ] Warning message shown
[ ] Account remains active

RESULT: PASS / FAIL
```

### TEAM-014: Invitation Email Contains Correct Link
**Priority:** MAJOR
**Expected:** Invitation works end-to-end

```
IF TESTABLE (with email access):
1. Send invitation to accessible email
2. Check received email
3. Click signup link
4. Complete signup

VERIFY:
[ ] Email received
[ ] Link points to correct URL
[ ] Can complete signup
[ ] User added to organization

IF NOT TESTABLE:
[ ] Note: Email testing requires email access

RESULT: PASS / FAIL / NOT TESTABLE
```

---

## Team Test Summary

```
| Test ID | Test Name | Status | Console Errors |
|---------|-----------|--------|----------------|
| TEAM-001 | View Members | | |
| TEAM-002 | Send Invitation | | |
| TEAM-003 | Validation | | |
| TEAM-004 | Cancel Invite | | |
| TEAM-005 | Resend Invite | | |
| TEAM-006 | Change Role | | |
| TEAM-007 | Deactivate | | |
| TEAM-008 | Reactivate | | |
| TEAM-009 | View Profile | | |
| TEAM-010 | Edit Details | | |
| TEAM-011 | Search/Filter | | |
| TEAM-012 | Permissions | | |
| TEAM-013 | Protect Owner | | |
| TEAM-014 | Email E2E | | |

TOTAL: 14 tests
PASSED: ___
FAILED: ___
```

## Next Suite

→ Proceed to Suite 07: Financial Operations Tests
