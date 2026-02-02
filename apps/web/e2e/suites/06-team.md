# Suite 06: Team Management

## Overview
Tests for team member management, invitations, role assignments, and organization settings.

**Priority:** HIGH
**Roles to Test:** owner, project_manager, finance, employee, contractor
**Estimated Duration:** 20 minutes

---

## Preconditions
- App running at localhost:3000
- Logged in as OWNER role
- At least 2 team members exist in the organization

---

## Tests

### TEST: 06-001 View Team List
**Priority:** P0
**Roles:** owner, project_manager
**Viewports:** desktop, mobile

#### Steps
1. Navigate to /dashboard/team
2. Wait for page to load
3. Observe team list

#### Expected Results
- [ ] Team members table/grid is visible
- [ ] Each member shows: name, email, role, status
- [ ] Member avatars or initials display correctly
- [ ] Pagination or scroll works for large teams
- [ ] Search/filter functionality is visible (if implemented)

---

### TEST: 06-002 Owner Can Invite Team Member
**Priority:** P0
**Roles:** owner
**Viewports:** desktop

#### Steps
1. Login as OWNER
2. Navigate to /dashboard/team
3. Click "Invite Team Member" or "Add Member" button
4. Fill in email: test-invite@example.com
5. Select role: EMPLOYEE
6. Click Send Invitation

#### Expected Results
- [ ] Invitation modal appears
- [ ] Role dropdown shows all available roles
- [ ] Success message appears after sending
- [ ] Pending invitation appears in team list or invitations tab
- [ ] Invitation email is sent (check logs or email service)

---

### TEST: 06-003 PM Cannot Invite Team Members
**Priority:** P1
**Roles:** project_manager
**Viewports:** desktop

#### Preconditions
- Logged in as OWNER, impersonating PM role

#### Steps
1. Navigate to /dashboard/team
2. Look for "Invite Team Member" button

#### Expected Results
- [ ] "Invite Team Member" button is NOT visible
- [ ] No way to access invitation functionality
- [ ] If URL /dashboard/team/invite is accessed directly, show Access Denied

---

### TEST: 06-004 View Team Member Profile
**Priority:** P1
**Roles:** owner, project_manager, finance
**Viewports:** desktop

#### Steps
1. Navigate to /dashboard/team
2. Click on a team member row or "View" button
3. Observe profile details

#### Expected Results
- [ ] Profile page or modal opens
- [ ] Shows: name, email, phone, role, status
- [ ] Shows assigned projects (if applicable)
- [ ] Shows activity history (if implemented)
- [ ] Edit button visible for authorized roles

---

### TEST: 06-005 Owner Can Edit Team Member Role
**Priority:** P0
**Roles:** owner
**Viewports:** desktop

#### Steps
1. Login as OWNER
2. Navigate to /dashboard/team
3. Click on a team member
4. Click "Edit" or role dropdown
5. Change role from EMPLOYEE to PROJECT_MANAGER
6. Save changes

#### Expected Results
- [ ] Role dropdown shows all available roles
- [ ] Success message appears after saving
- [ ] Team list updates to show new role
- [ ] Member's permissions update immediately

---

### TEST: 06-006 PM Cannot Change Team Roles
**Priority:** P1
**Roles:** project_manager
**Viewports:** desktop

#### Preconditions
- Logged in as OWNER, impersonating PM role

#### Steps
1. Navigate to /dashboard/team
2. Click on a team member
3. Look for role editing options

#### Expected Results
- [ ] No "Edit Role" button visible
- [ ] Role dropdown is disabled or not shown
- [ ] Cannot access role change via URL manipulation

---

### TEST: 06-007 Owner Can Deactivate Team Member
**Priority:** P1
**Roles:** owner
**Viewports:** desktop

#### Steps
1. Login as OWNER
2. Navigate to /dashboard/team
3. Click on a team member
4. Click "Deactivate" or toggle status
5. Confirm deactivation

#### Expected Results
- [ ] Confirmation dialog appears
- [ ] Success message after deactivation
- [ ] Member shows as "Inactive" in team list
- [ ] Deactivated member cannot login
- [ ] Member's data is preserved (not deleted)

---

### TEST: 06-008 Employee View of Team Page
**Priority:** P1
**Roles:** employee
**Viewports:** desktop

#### Preconditions
- Logged in as OWNER, impersonating EMPLOYEE role

#### Steps
1. Navigate to /dashboard/team
2. Observe what is visible

#### Expected Results
- [ ] Can see list of team members (names, roles)
- [ ] Cannot see email addresses or phone numbers
- [ ] Cannot see "Invite" or "Edit" buttons
- [ ] Cannot see salary/payroll information
- [ ] Can see project assignments for collaboration

---

### TEST: 06-009 Contractor Cannot Access Team Page
**Priority:** P1
**Roles:** contractor
**Viewports:** desktop

#### Preconditions
- Logged in as OWNER, impersonating CONTRACTOR role

#### Steps
1. Navigate to /dashboard/team directly via URL
2. Observe result

#### Expected Results
- [ ] Access Denied page appears
- [ ] Or redirect to dashboard with limited view
- [ ] No team data is exposed
- [ ] Navigation menu does not show Team link

---

### TEST: 06-010 Resend Invitation
**Priority:** P2
**Roles:** owner
**Viewports:** desktop

#### Preconditions
- A pending invitation exists

#### Steps
1. Login as OWNER
2. Navigate to /dashboard/team or /dashboard/team/invitations
3. Find pending invitation
4. Click "Resend" button
5. Confirm action

#### Expected Results
- [ ] Resend confirmation appears
- [ ] Success message after resending
- [ ] Invitation timestamp updates
- [ ] Email is sent again

---

### TEST: 06-011 Cancel Pending Invitation
**Priority:** P2
**Roles:** owner
**Viewports:** desktop

#### Preconditions
- A pending invitation exists

#### Steps
1. Login as OWNER
2. Navigate to /dashboard/team or /dashboard/team/invitations
3. Find pending invitation
4. Click "Cancel" or "Revoke" button
5. Confirm cancellation

#### Expected Results
- [ ] Confirmation dialog appears
- [ ] Invitation is removed from list
- [ ] Invitation link becomes invalid
- [ ] Success message appears

---

### TEST: 06-012 Team Page Mobile Layout
**Priority:** P1
**Roles:** owner
**Viewports:** mobile (375x812)

#### Steps
1. Resize browser to 375x812
2. Navigate to /dashboard/team
3. Interact with team list

#### Expected Results
- [ ] Team list displays as cards or stacked rows
- [ ] All information is readable without horizontal scroll
- [ ] Action buttons are touch-friendly (min 44px)
- [ ] "Invite" button is accessible
- [ ] Search/filter works on mobile

---

## Test Data Requirements

```json
{
  "teamMembers": [
    {
      "email": "pm@test.contractoros.com",
      "role": "PROJECT_MANAGER",
      "name": "Test PM"
    },
    {
      "email": "employee@test.contractoros.com",
      "role": "EMPLOYEE",
      "name": "Test Employee"
    }
  ],
  "pendingInvitations": [
    {
      "email": "pending@example.com",
      "role": "EMPLOYEE",
      "status": "pending"
    }
  ]
}
```

---

## Cleanup Actions
1. Cancel any test invitations created
2. Revert any role changes made during testing
3. Reactivate any deactivated test users
4. Return to OWNER role if impersonating
