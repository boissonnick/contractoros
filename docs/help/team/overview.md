---
title: "Team Management Overview"
description: "Managing team members, roles, and permissions in ContractorOS"
audience: ["owner", "pm"]
module: "team"
difficulty: "intermediate"
time_to_complete: "12 minutes"
video_url: ""
walkthrough_id: "team-tour"
last_updated: "2025-01-30"
status: "draft"
---

<!-- STATUS: DRAFT -->
<!-- NEEDS_VIDEO: Team management overview -->
<!-- NEEDS_WALKTHROUGH: Team setup tour -->

# Team Management Overview

Your team is the engine of your business. ContractorOS helps you organize team members, control what they can access, and keep everyone productive.

---

## Team Member Types

ContractorOS supports different types of team members:

### Internal Team

| Role | Description |
|------|-------------|
| **Owner** | Company owner(s), full access to everything |
| **PM (Project Manager)** | Manages projects, team, clients |
| **Employee** | Field workers, office staff |

### External

| Role | Description |
|------|-------------|
| **Subcontractor** | External companies/individuals doing trade work |
| **Client** | Customers with portal access |

---

## Roles and Permissions

### Owner

Complete control over the organization:
- All PM permissions, plus:
- Manage subscription and billing
- Delete organization data
- Access all financial data
- Manage other owners

### PM (Project Manager)

Day-to-day management:
- Create and manage projects
- Manage clients and estimates
- Invite and manage employees
- Approve time entries
- View financial reports
- Manage subcontractors

### Employee

Execute work:
- View assigned projects
- Complete assigned tasks
- Log time
- Take photos and add notes
- View their own time entries
- Limited financial visibility

### Custom Roles

<!-- STATUS: COMING_SOON -->

> **Coming Soon**: Create custom roles with granular permissions for:
> - Office admin (invoicing but not project management)
> - Superintendent (project management but not financials)
> - Estimator (estimates and proposals only)

---

## The Team Page

Go to **Settings → Team** to manage your team.

### Team List

See all team members with:
- Name and photo
- Role
- Email
- Status (Active, Invited, Inactive)
- Last active date

### Filtering and Search

- Search by name or email
- Filter by role
- Filter by status
- Sort by name, role, or activity

---

## Inviting Team Members

### Step by Step

1. Go to **Settings → Team**
2. Click **+ Invite Member**
3. Enter their information:
   - Email address
   - Name
   - Role (Owner, PM, Employee)
4. Click **Send Invitation**

### What Happens Next

1. They receive an email invitation
2. They click the link to create their account
3. They complete their profile
4. They appear as **Active** in your team list

### Invitation Status

| Status | Meaning |
|--------|---------|
| **Invited** | Email sent, not yet accepted |
| **Active** | Account created and active |
| **Inactive** | Account disabled by admin |

### Resending Invitations

If they didn't receive it:
1. Find them in the team list
2. Click **⋮ → Resend Invitation**
3. New email is sent

---

## Team Member Profiles

Click any team member to see their profile:

### Profile Information
- Name and contact info
- Role and permissions
- Profile photo
- Employment details

### Work Data
- Current project assignments
- Recent time entries
- Tasks assigned

### Settings
- Notification preferences
- Pay rate (if applicable)
- Emergency contact

---

## Employee Details

For employees, additional information:

### Employment Info

| Field | Purpose |
|-------|---------|
| **Employee Type** | W-2, 1099, etc. |
| **Pay Type** | Hourly or salary |
| **Pay Rate** | Rate for time/payroll |
| **Start Date** | Employment start |
| **Department** | Team/crew assignment |

### Payroll Fields

| Field | Purpose |
|-------|---------|
| **SSN** | For payroll (encrypted) |
| **Tax Withholding** | W-4 info |
| **Direct Deposit** | Bank details |

<!-- STATUS: NEEDS_SCOPE -->
<!-- Payroll integration details to be finalized -->

---

## Changing Roles

To change someone's role:

1. Go to **Settings → Team**
2. Click the team member
3. Click **Change Role**
4. Select new role
5. Confirm the change

### Role Change Effects

| Change | What Happens |
|--------|--------------|
| Employee → PM | Gains project and team management |
| PM → Employee | Loses management access, keeps project access |
| Any → Owner | Gains full admin access |
| Owner → Any | Loses admin access (must have at least 1 owner) |

---

## Deactivating Team Members

When someone leaves or needs to be removed:

### Deactivate (Recommended)

1. Click the team member
2. Click **Deactivate**
3. Confirm

Effects:
- They can no longer log in
- Their data is preserved
- Time entries and history remain
- Can be reactivated later

### Delete (Permanent)

Only available if:
- No time entries
- No project assignments
- No created records

Effects:
- Account completely removed
- Cannot be undone

### What About Active Work?

Before deactivating:
1. Reassign their tasks to others
2. Reassign their projects if they're the primary PM
3. Approve any pending time entries

---

## Project Assignments

Control who can access which projects:

### Assigning to Projects

1. Open a project
2. Go to **Team** tab
3. Click **+ Add Team Member**
4. Select person and role on project
5. Save

### Project Roles

| Role | Access |
|------|--------|
| **Project Manager** | Full project access |
| **Superintendent** | Field management |
| **Team Member** | Task access |

### Automatic Assignment

Employees automatically see projects where they have:
- Tasks assigned to them
- Time entries logged
- Explicit assignment

---

## Permissions Matrix

What each role can do:

### Organization Level

| Action | Owner | PM | Employee |
|--------|-------|-----|----------|
| Manage subscription | ✓ | | |
| Invite Owners | ✓ | | |
| Invite PMs | ✓ | ✓ | |
| Invite Employees | ✓ | ✓ | |
| View all team data | ✓ | ✓ | |
| Change settings | ✓ | ✓ | |
| Delete organization | ✓ | | |

### Project Level

| Action | Owner | PM | Employee |
|--------|-------|-----|----------|
| Create projects | ✓ | ✓ | |
| Edit projects | ✓ | ✓ | |
| Delete projects | ✓ | | |
| View all projects | ✓ | ✓ | Assigned only |
| Create tasks | ✓ | ✓ | |
| Complete tasks | ✓ | ✓ | Assigned |

### Financial

| Action | Owner | PM | Employee |
|--------|-------|-----|----------|
| View all financials | ✓ | ✓ | |
| Create invoices | ✓ | ✓ | |
| Receive payments | ✓ | ✓ | |
| View own pay rate | ✓ | ✓ | ✓ |
| View others' pay | ✓ | ✓ | |
| Run payroll | ✓ | ✓ | |

### Time Tracking

| Action | Owner | PM | Employee |
|--------|-------|-----|----------|
| Log own time | ✓ | ✓ | ✓ |
| Edit own time | ✓ | ✓ | ✓ |
| View team time | ✓ | ✓ | |
| Approve time | ✓ | ✓ | |
| Edit others' time | ✓ | ✓ | |

---

## Best Practices

### Least Privilege

Give people only the access they need:
- Field workers don't need financial access
- Estimators don't need HR data
- Keep Owner role to actual owners

### Document Expectations

When onboarding:
- Explain what they can and can't access
- Show them how to use the system
- Set expectations for time logging and updates

### Regular Audits

Periodically review:
- Who has access
- Are inactive accounts still enabled?
- Do roles still match responsibilities?

### Prompt Offboarding

When someone leaves:
- Deactivate immediately
- Reassign their work
- Review what they had access to

---

## Team Communication

<!-- STATUS: COMING_SOON -->

> **Coming Soon**: Team messaging and announcements:
> - Direct messages between team members
> - Team-wide announcements
> - Project-specific chat

For now, use task comments and daily logs for project-specific communication.

---

## Common Questions

### How many team members can I have?

Depends on your subscription plan:
- Starter: 5 users
- Professional: 15 users
- Business: Unlimited

Check **Settings → Subscription** for your current plan.

### Can I have multiple Owners?

Yes. Useful for:
- Business partners
- Owner and office manager
- Backup access

All Owners have full access.

### What if I forget to deactivate someone?

They retain access until deactivated. Best practice:
- Deactivate same-day as departure
- Change any shared passwords
- Review their recent activity if concerned

### Can employees see each other's time?

No, by default employees only see their own time entries. PMs and Owners see everyone's.

### How do I transfer ownership?

1. Add new owner
2. Verify they have access
3. Remove yourself (if leaving)

At least one Owner must remain.

---

## Troubleshooting

### Invitation not received

- Check spam/junk folder
- Verify email address is correct
- Resend invitation
- Have them add your domain to safe senders

### User can't log in

- Check account is Active (not Invited or Inactive)
- Try password reset
- Verify email address
- Check for browser issues

### Wrong permissions

- Verify their role is correct
- Check project-level assignments
- Review permission matrix above
- Contact support if unexpected behavior

---

## Related Topics

- [Invite team members](/help/team/invite-members.guide.md)
- [Roles and permissions reference](/help/team/roles-permissions.reference.md)
- [Employee profiles](/help/team/employee-profiles.guide.md)
- [Time tracking](/help/time-tracking/overview.md)
- [Payroll](/help/time-tracking/payroll.guide.md)
