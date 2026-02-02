---
title: "Settings Overview"
description: "Configure ContractorOS to match how your business works"
audience: ["owner", "pm"]
module: "settings"
difficulty: "intermediate"
time_to_complete: "15 minutes"
video_url: ""
walkthrough_id: "settings-tour"
last_updated: "2025-01-30"
status: "draft"
---

<!-- STATUS: DRAFT -->
<!-- NEEDS_VIDEO: Settings overview -->
<!-- NEEDS_WALKTHROUGH: Settings tour -->

# Settings Overview

Configure ContractorOS to work exactly the way your business does. From branding to workflows, customize everything in Settings.

---

## What You'll Learn

| Job to Be Done | This Section Helps You |
|----------------|------------------------|
| Match your brand | Logo, colors, templates |
| Set up payments | Connect payment processor |
| Configure notifications | Control who gets what |
| Manage team access | Roles and permissions |
| Integrate other tools | Accounting, scheduling, etc. |

---

## Settings Categories

Access Settings from the main menu. You'll find these sections:

| Section | What It Controls |
|---------|------------------|
| Organization | Company info, branding, business settings |
| Users & Teams | Team members, roles, permissions |
| Notifications | Email, SMS, push notification settings |
| Payments | Payment processor, invoicing settings |
| Projects | Project defaults, phases, templates |
| Time Tracking | Time entry settings, approval workflows |
| Integrations | Third-party app connections |
| Billing | Your ContractorOS subscription |

---

## Organization Settings

### Company Information

Set your business basics:
- Company legal name
- DBA (if different)
- Address
- Phone and email
- Website
- License numbers

**Why it matters:** Appears on estimates, invoices, and client communications.

### Branding

Customize your look:

**Logo:**
- Upload your company logo
- Used on estimates, invoices, proposals
- Recommended: PNG or SVG, 200x60px minimum

**Colors:**
- Primary color (buttons, headers)
- Secondary color (accents)
- Accent color (highlights)

**Client Portal:**
- Custom portal URL (coming soon)
- Portal welcome message
- Footer text

→ [Branding settings guide](/help/settings/branding.guide.md)

### Business Settings

Configure operational defaults:

**Fiscal Year:**
- Starting month
- Affects financial reports

**Time Zone:**
- Your business time zone
- Affects scheduling and timestamps

**Currency:**
- Default currency
- Number format

**Business Hours:**
- Standard work hours
- Used for scheduling

---

## Users & Teams

### Managing Users

Add and manage your team:

1. Go to **Settings → Users**
2. Click **Invite User**
3. Enter email and role
4. User receives invitation
5. They create their account

### User Roles

| Role | Access Level |
|------|--------------|
| Owner | Full access to everything |
| PM | Most features, can't delete critical data |
| Employee | Limited to assigned work |
| Contractor | External team member access |

### Role Permissions

Customize what each role can do:
- View permissions
- Create permissions
- Edit permissions
- Delete permissions
- Approve permissions

→ [Manage team members](/help/team/overview.md)

### Deactivating Users

When someone leaves:
1. Go to their user profile
2. Click **Deactivate**
3. They lose access immediately
4. Their data remains for history

---

## Notification Settings

### Organization-Wide Defaults

Set default notification preferences:

**Email Notifications:**
- Invoice sent/paid
- New bid request
- Schedule changes
- Task assignments

**SMS Notifications:**
<!-- STATUS: COMING_SOON - SMS notifications -->
- Urgent alerts only
- Field worker notifications
- Client reminders

### Per-User Overrides

Users can customize their own:
- Notification types
- Delivery frequency
- Quiet hours

### Email Templates

<!-- STATUS: COMING_SOON - Custom email templates -->

Customize system emails:
- Invoice emails
- Estimate emails
- Invitation emails
- Reminder emails

---

## Payment Settings

### Payment Processor

Connect your payment processor:

**Stripe (Recommended):**
1. Click **Connect Stripe**
2. Log in to Stripe
3. Authorize connection
4. Ready to accept payments

**Square:**
1. Click **Connect Square**
2. Log in to Square
3. Authorize connection
4. Configure settings

**PayPal:**
<!-- STATUS: COMING_SOON - PayPal integration -->

### Payment Options

Configure what clients can pay with:
- Credit/debit cards
- ACH bank transfer
- Manual payments (check, cash)

### Invoice Settings

Default invoice settings:
- Payment terms (Net 30, etc.)
- Due date calculation
- Late fee policy
- Invoice numbering

→ [Payment settings guide](/help/settings/payments.guide.md)

---

## Project Settings

### Default Settings

Set defaults for new projects:
- Default phase template
- Standard terms
- Retention percentage
- Invoice schedule

### Phase Templates

Create reusable phase structures:

1. Go to **Settings → Project Phases**
2. Click **New Template**
3. Add phases in order
4. Name and save template

**Example Template - Kitchen Remodel:**
1. Pre-Construction
2. Demo
3. Rough MEP
4. Insulation & Drywall
5. Finish MEP
6. Cabinets & Counters
7. Finish & Punch

### Task Templates

<!-- STATUS: COMING_SOON - Task templates -->

Pre-populate tasks for phases:
- Standard checklist items
- Typical descriptions
- Default assignees

### Project Numbering

Configure project number format:
- Prefix (year, type code)
- Starting number
- Auto-increment

---

## Time Tracking Settings

### Time Entry Settings

Configure time tracking:
- Minimum increment (15 min, 30 min, etc.)
- Rounding rules
- Required fields
- Photo requirements

### Approval Workflow

Set up time approval:
- Who can approve whose time
- Approval deadlines
- Auto-approve options
- Rejection handling

### Overtime Rules

Configure overtime calculation:
- Weekly overtime threshold (40 hrs)
- Daily overtime threshold (8 hrs)
- Overtime rate multiplier

### Geofencing

<!-- STATUS: COMING_SOON - Geofence configuration -->

Set up location verification:
- Job site boundaries
- Clock in/out verification
- Travel time tracking

→ [Time tracking settings guide](/help/settings/time-tracking.guide.md)

---

## Integrations

### Accounting Software

<!-- STATUS: NEEDS_SCOPE - Accounting integration -->

Connect your accounting:
- QuickBooks Online
- Xero
- FreshBooks

Sync capabilities:
- Invoices → Accounting
- Payments → Accounting
- Clients → Customers
- Chart of accounts mapping

### Calendar

<!-- STATUS: COMING_SOON - Calendar sync -->

Sync with external calendars:
- Google Calendar
- Outlook/Office 365
- Apple Calendar

### File Storage

<!-- STATUS: COMING_SOON - Cloud storage -->

Connect cloud storage:
- Google Drive
- Dropbox
- Box
- OneDrive

### Other Integrations

<!-- STATUS: NEEDS_SCOPE - Additional integrations -->

Coming integrations:
- Supplier catalogs
- Material ordering
- Equipment rental
- Weather services

→ [Integrations guide](/help/settings/integrations.guide.md)

---

## Billing (Your Subscription)

### Current Plan

View your subscription:
- Plan name and tier
- Included features
- Usage limits
- Next billing date

### Upgrade/Downgrade

Change your plan:
1. Go to **Settings → Billing**
2. Click **Change Plan**
3. Select new plan
4. Confirm changes

### Payment Method

Manage subscription payment:
- Update credit card
- Change billing email
- View invoices

### Usage

Monitor your usage:
- Active users
- Storage used
- Projects this month

---

## Data Management

### Import Data

<!-- STATUS: DRAFT - Import feature -->

Import from other systems:
- Clients (CSV)
- Projects (CSV)
- Subcontractors (CSV)
- Historical data

→ [Data import guide](/help/settings/import.guide.md)

### Export Data

Export your data:
- Client list
- Project list
- Financial data
- Time entries

### Backup

<!-- STATUS: COMING_SOON - Manual backups -->

Your data is automatically backed up. Request a full export for your records.

---

## Security Settings

### Password Policies

<!-- STATUS: COMING_SOON - Password policies -->

Set requirements:
- Minimum length
- Complexity rules
- Expiration period
- Previous password restrictions

### Two-Factor Authentication

<!-- STATUS: COMING_SOON - 2FA -->

Enable 2FA for your organization:
- Required for all users
- Optional per user
- Recovery options

### Session Settings

Control login behavior:
- Session timeout
- Remember me duration
- Concurrent session limit

### Audit Log

Track system activity:
- Who did what
- When it happened
- What changed
- Searchable history

---

## Settings Best Practices

### Initial Setup

When you first start:
1. **Organization info** — Complete company profile
2. **Branding** — Upload logo, set colors
3. **Payments** — Connect payment processor
4. **Users** — Invite your team
5. **Projects** — Create phase templates

### Regular Maintenance

Review periodically:
- **Monthly:** User access, roles
- **Quarterly:** Notification settings, templates
- **Annually:** Integrations, workflows

### Before Making Changes

Consider impact:
- Will it affect existing data?
- Do users need to know?
- Should you test first?

---

## Common Questions

### Who can access settings?

By default, only Owners. PMs may have access to some settings based on permissions.

### Will changing settings affect old data?

Most settings only affect new data. Historical records remain unchanged.

### Can I undo a setting change?

Many settings can be changed back. Some changes (like data imports) cannot be undone.

### How do I reset to defaults?

Contact support for assistance with resetting settings to defaults.

---

## Permissions

| Setting Area | Owner | PM |
|--------------|-------|-----|
| Organization | ✓ | View only |
| Users & Teams | ✓ | View only |
| Notifications | ✓ | Own settings only |
| Payments | ✓ | — |
| Projects | ✓ | ✓ |
| Time Tracking | ✓ | View only |
| Integrations | ✓ | — |
| Billing | ✓ | — |

---

## Related Topics

- [Branding settings](/help/settings/branding.guide.md)
- [Payment settings](/help/settings/payments.guide.md)
- [Time tracking settings](/help/settings/time-tracking.guide.md)
- [Data import](/help/settings/import.guide.md)
- [Integrations](/help/settings/integrations.guide.md)
