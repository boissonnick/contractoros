# Acceptance Criteria & Test Cases

> Branch: `feature/bug-fixes-1.28`
> Last Updated: 2026-01-28

---

## Test Case Format

Each bug/feature includes:
- **Preconditions**: Setup required before testing
- **Steps**: Actions to perform
- **Expected Result**: What should happen
- **Regression Check**: Verify nothing else broke

---

## SPRINT 1: CRITICAL FIXES

### AC-001: Phase Dropdown in Task Modal
**Bug Reference:** BUG #1

#### Test Case 1.1: Phase Dropdown Visibility
**Preconditions:**
- Logged in as PM/Contractor
- Project exists with 3+ phases
- Task exists in project

**Steps:**
1. Navigate to project tasks page
2. Click on any task to open TaskDetailModal
3. Observe the Details tab

**Expected Result:**
- Phase dropdown is visible in the form
- Dropdown label reads "Phase"
- Dropdown shows current phase assignment (or "Unassigned")

#### Test Case 1.2: Phase Selection
**Steps:**
1. Open TaskDetailModal
2. Click Phase dropdown
3. Select a different phase
4. Click Save/Update

**Expected Result:**
- Dropdown shows all project phases
- Selection updates the dropdown display
- Save persists phaseId to Firestore
- Task card reflects new phase assignment

#### Test Case 1.3: Phase Filter Integration
**Steps:**
1. Navigate to task list view
2. Open TaskFilters
3. Filter by a specific phase

**Expected Result:**
- Only tasks assigned to selected phase appear
- Filter badge shows active filter
- Clear filter restores all tasks

**Regression Check:**
- Task CRUD still works without phase
- Existing tasks without phaseId don't break
- Gantt view groups by phase correctly

---

### AC-007: Unsaved Changes Warning
**Bug Reference:** UX #7

#### Test Case 7.1: Dirty State Detection
**Preconditions:**
- Open TaskDetailModal

**Steps:**
1. Modify task title
2. Click X to close modal (without saving)

**Expected Result:**
- ConfirmDialog appears: "You have unsaved changes"
- Options: "Save & Close", "Discard", "Cancel"
- Modal remains open until choice made

#### Test Case 7.2: Save & Close Action
**Steps:**
1. Make changes to task
2. Try to close modal
3. Click "Save & Close"

**Expected Result:**
- Changes saved to Firestore
- Modal closes
- Toast: "Task updated successfully"

#### Test Case 7.3: Discard Action
**Steps:**
1. Make changes to task
2. Try to close modal
3. Click "Discard"

**Expected Result:**
- Changes NOT saved
- Modal closes
- No toast notification

#### Test Case 7.4: Cancel Action
**Steps:**
1. Make changes to task
2. Try to close modal
3. Click "Cancel"

**Expected Result:**
- Confirm dialog closes
- TaskDetailModal remains open
- Changes still present in form

#### Test Case 7.5: Escape Key Behavior
**Steps:**
1. Make changes to task
2. Press Escape key

**Expected Result:**
- Same as clicking X button
- Confirm dialog appears

**Regression Check:**
- Clean close (no changes) works without dialog
- Tab switching within modal preserves dirty state
- Modal remains usable after cancel

---

### AC-008: SOW Template Phase Assignment
**Bug Reference:** BUG #8

#### Test Case 8.1: Template Application with Phases
**Preconditions:**
- SOW template exists with items having phase mappings
- Project has matching phase names

**Steps:**
1. Open project Scope page
2. Click "Apply Template"
3. Select template
4. Confirm application

**Expected Result:**
- Items appear grouped by phase
- Phase names match template → project mapping
- Items without phase mapping go to "Unassigned"

#### Test Case 8.2: Phase Name Mismatch Handling
**Preconditions:**
- Template has phase "Excavation"
- Project has phase "Site Prep" (no "Excavation")

**Steps:**
1. Apply template to project

**Expected Result:**
- Unmatched items placed in "Unassigned" group
- Warning toast: "Some items could not be mapped to phases"
- User can manually reassign phases

**Regression Check:**
- Manual scope item creation unaffected
- Existing scopes not modified
- Quote generation from scope works

---

### AC-019: Required Field Indicators
**Bug Reference:** UX #19

#### Test Case 19.1: Asterisk Display
**Steps:**
1. Navigate to any form (SubForm, TaskForm, etc.)
2. Observe required fields

**Expected Result:**
- Red asterisk (*) appears after label text
- Only truly required fields marked
- Asterisk styling consistent (color, spacing)

#### Test Case 19.2: Form Submission Without Required
**Steps:**
1. Open form with required fields
2. Leave required field empty
3. Click Submit

**Expected Result:**
- Form does NOT submit
- Error message appears below field
- Field border turns red
- Focus moves to first error field

#### Test Case 19.3: Clearing Error on Input
**Steps:**
1. Trigger validation error
2. Enter valid value in field

**Expected Result:**
- Error message disappears
- Border returns to normal
- Can now submit form

**Regression Check:**
- Optional fields remain submittable when empty
- Existing forms don't break
- Accessibility: screen readers announce required

---

### AC-020: Global Subcontractor Management
**Bug Reference:** FEATURE #20

#### Test Case 20.1: Subcontractor List Page
**Preconditions:**
- Logged in as PM/Admin

**Steps:**
1. Navigate to `/dashboard/subcontractors`

**Expected Result:**
- List shows all org-level subcontractors
- Columns: Company, Trade, Rating, Projects, Status
- Search box filters by company/trade
- Add New button visible

#### Test Case 20.2: Create Org Subcontractor
**Steps:**
1. Click "Add Subcontractor"
2. Fill required fields (company, contact, trade)
3. Save

**Expected Result:**
- Sub saved to `organizations/{orgId}/subcontractors`
- Appears in list
- Toast: "Subcontractor added"

#### Test Case 20.3: Assign Sub to Project
**Preconditions:**
- Org sub exists
- Project exists

**Steps:**
1. Open project
2. Go to Subcontractors section
3. Click "Add from Directory"
4. Select org sub

**Expected Result:**
- Sub linked to project (reference, not copy)
- Appears in project sub list
- Changes to org sub reflect in project

#### Test Case 20.4: Cross-Project Metrics
**Steps:**
1. Open org sub detail page
2. View Performance tab

**Expected Result:**
- Aggregate metrics from all projects
- On-time completion rate
- Quality score average
- Total projects count
- Project history list

#### Test Case 20.5: Document Expiration Alert
**Preconditions:**
- Sub has insurance expiring in 30 days

**Steps:**
1. Navigate to sub list

**Expected Result:**
- Warning icon on sub row
- Banner: "Insurance expires in X days"
- Detail page shows expiration prominently

**Regression Check:**
- Project-level sub assignment still works
- Existing project subs migrate correctly
- Performance metrics calculate accurately

---

### AC-023: Brand Colors Application
**Bug Reference:** CRITICAL #23

#### Test Case 23.1: Theme Provider CSS Variables
**Preconditions:**
- Org has brand colors set (primary: #FF5500)

**Steps:**
1. Login to dashboard
2. Inspect `<html>` element

**Expected Result:**
- `--color-primary: #FF5500` set
- `--color-secondary` and `--color-accent` also set
- Variables available to all components

#### Test Case 23.2: Button Primary Variant
**Steps:**
1. Navigate to any page with primary button
2. Inspect button styles

**Expected Result:**
- Background uses `var(--color-primary)` or equivalent Tailwind class
- Hover state uses darker shade
- Text contrast meets WCAG AA

#### Test Case 23.3: Settings Preview
**Steps:**
1. Go to Organization Settings
2. Change primary color
3. Observe preview

**Expected Result:**
- Color picker shows current selection
- Preview swatch updates in real-time
- Save applies colors site-wide

#### Test Case 23.4: Default Fallback
**Preconditions:**
- Org has NO brand colors set

**Steps:**
1. Login to dashboard

**Expected Result:**
- Default colors applied (blue primary)
- No errors or broken styling
- UI fully functional

**Regression Check:**
- Dark mode compatibility (if applicable)
- Color contrast maintained
- PDF exports use correct colors

---

### AC-026: Integrations Page
**Bug Reference:** BUG #26

#### Test Case 26.1: Integration Cards Display
**Steps:**
1. Navigate to Settings > Integrations

**Expected Result:**
- Cards for: QuickBooks, Xero (minimum)
- Each shows: Logo, name, status, Connect/Disconnect button
- Connected integrations show last sync time

#### Test Case 26.2: OAuth Connection Flow
**Steps:**
1. Click "Connect" on QuickBooks card
2. Complete OAuth flow in popup

**Expected Result:**
- OAuth popup opens
- After auth, popup closes
- Card updates to "Connected"
- Toast: "QuickBooks connected successfully"

#### Test Case 26.3: Disconnect Integration
**Preconditions:**
- QuickBooks connected

**Steps:**
1. Click "Disconnect" on QuickBooks card
2. Confirm in dialog

**Expected Result:**
- ConfirmDialog: "Are you sure?"
- On confirm, connection removed
- Card shows "Not Connected"
- Toast: "QuickBooks disconnected"

#### Test Case 26.4: Sync Settings
**Preconditions:**
- Integration connected

**Steps:**
1. Click "Settings" on connected integration

**Expected Result:**
- Modal with sync options
- Auto-sync toggle
- Sync frequency dropdown
- Entity mapping configuration

**Regression Check:**
- Existing connections preserved on page reload
- Sync logs accessible
- Error handling for failed OAuth

---

### AC-027: Tax Rates Page
**Bug Reference:** BUG #27

#### Test Case 27.1: Tax Rate List
**Steps:**
1. Navigate to Settings > Tax Rates

**Expected Result:**
- Table shows all tax rates
- Columns: Name, Rate %, Applies To, Default, Actions
- Add button visible

#### Test Case 27.2: Create Tax Rate
**Steps:**
1. Click "Add Tax Rate"
2. Enter: Name="State Sales Tax", Rate="8.25", Applies To="Estimates, Invoices"
3. Save

**Expected Result:**
- Rate saved to Firestore
- Appears in list
- Toast: "Tax rate added"

#### Test Case 27.3: Edit Tax Rate
**Steps:**
1. Click Edit on existing rate
2. Change rate to 9.0
3. Save

**Expected Result:**
- Inline editing or modal
- Rate updated
- Toast: "Tax rate updated"

#### Test Case 27.4: Set Default Rate
**Steps:**
1. Click "Set as Default" on a rate

**Expected Result:**
- Only one rate can be default
- Previous default cleared
- Default badge appears

#### Test Case 27.5: Delete Tax Rate
**Steps:**
1. Click Delete on a rate
2. Confirm

**Expected Result:**
- ConfirmDialog appears
- On confirm, rate removed
- Toast: "Tax rate deleted"

**Regression Check:**
- Existing invoices using rate unaffected
- Estimates recalculate if rate changed
- Can't delete rate in use (or warning)

---

### AC-028: Data Export Page
**Bug Reference:** BUG #28

#### Test Case 28.1: Export Options Display
**Steps:**
1. Navigate to Settings > Data Export

**Expected Result:**
- Export type checkboxes: Projects, Tasks, Timesheets, Invoices, etc.
- Format dropdown: CSV, JSON, PDF
- Date range picker
- Export button

#### Test Case 28.2: CSV Export
**Steps:**
1. Select "Projects" and "Tasks"
2. Set date range
3. Select CSV format
4. Click Export

**Expected Result:**
- Download starts
- ZIP file contains projects.csv, tasks.csv
- CSV has proper headers
- Data matches date range filter

#### Test Case 28.3: JSON Export
**Steps:**
1. Select "Invoices"
2. Select JSON format
3. Export

**Expected Result:**
- JSON file downloads
- Valid JSON structure
- Nested relationships included

#### Test Case 28.4: Export Progress
**Steps:**
1. Start large export

**Expected Result:**
- Progress indicator shows
- Can cancel export
- Success toast on completion

**Regression Check:**
- Large datasets don't timeout
- Permissions respected (can't export others' data)
- Files properly formatted

---

### AC-029: Notifications Page
**Bug Reference:** BUG #29

#### Test Case 29.1: Notification Preferences Display
**Steps:**
1. Navigate to Settings > Notifications

**Expected Result:**
- Categories: Tasks, Projects, Timesheets, Invoices, Team
- Channels: Email, Push, In-App (toggle for each)
- Digest frequency selector

#### Test Case 29.2: Toggle Notification
**Steps:**
1. Toggle "Task assigned to me" Email OFF
2. Observe

**Expected Result:**
- Toggle animates to OFF
- No immediate save required OR auto-saves
- Preference persisted to user profile

#### Test Case 29.3: Digest Frequency
**Steps:**
1. Change digest from "Immediate" to "Daily"
2. Save

**Expected Result:**
- Dropdown updates
- Preference saved
- Next digest at configured time

#### Test Case 29.4: Test Notification
**Steps:**
1. Click "Send Test Notification"

**Expected Result:**
- Test email/push sent to user
- Toast: "Test notification sent"
- Actually received by user

**Regression Check:**
- Existing preferences preserved
- Notifications actually respect settings
- Unsubscribe from email works

---

## SPRINT 2: UX POLISH

### AC-002: Modal Close Button Position
**Bug Reference:** BUG #2

#### Test Case 2.1: Visual Position
**Steps:**
1. Open TaskDetailModal
2. Observe X button position

**Expected Result:**
- Button in top-right corner of modal header
- Consistent padding (16px from edges)
- Aligned with modal border radius

#### Test Case 2.2: Touch Target
**Steps:**
1. On mobile device, open modal
2. Tap X button

**Expected Result:**
- Easy to tap (min 44x44px)
- No accidental triggers
- Visual feedback on press

**Regression Check:**
- Hover states work on desktop
- Escape key still works
- Multiple modals close correctly

---

### AC-003: Modal Scroll Behavior
**Bug Reference:** BUG #3

#### Test Case 3.1: Long Content Scroll
**Preconditions:**
- Task has 50+ comments

**Steps:**
1. Open TaskDetailModal
2. Go to Comments tab

**Expected Result:**
- Comments section scrolls independently
- Modal header stays fixed
- Action buttons stay visible
- Page behind does NOT scroll

#### Test Case 3.2: Mobile Viewport
**Steps:**
1. On mobile (375px width)
2. Open modal with long content

**Expected Result:**
- Modal takes appropriate height
- Content scrollable
- Keyboard doesn't obscure inputs

**Regression Check:**
- Short content displays correctly
- Tab switching works
- Focus management maintained

---

### AC-004: Gantt Task Name Truncation
**Bug Reference:** BUG #4

#### Test Case 4.1: Long Name Truncation
**Preconditions:**
- Task with name "Very Long Task Name That Should Be Truncated In Gantt View"

**Steps:**
1. View tasks in Gantt view

**Expected Result:**
- Name truncates with ellipsis (...)
- Bar and name don't overlap
- Truncation point appropriate for column width

#### Test Case 4.2: Hover Tooltip
**Steps:**
1. Hover over truncated task name

**Expected Result:**
- Tooltip shows full task name
- Tooltip positions correctly (doesn't go off-screen)
- Tooltip disappears on mouse leave

**Regression Check:**
- Short names display fully
- Zoom levels don't break truncation
- Print view shows full names

---

### AC-017: Subcontractor Modal Scroll
**Bug Reference:** UX #17

#### Test Case 17.1: Tab Content Scroll
**Preconditions:**
- Sub with 20+ documents

**Steps:**
1. Open SubDetailModal
2. Go to Documents tab

**Expected Result:**
- Document list scrolls within tab area
- Tab bar stays fixed
- Modal doesn't exceed viewport

#### Test Case 17.2: Performance Tab
**Steps:**
1. Go to Performance tab with extensive history

**Expected Result:**
- Metrics summary visible
- History list scrolls
- No layout breaking

**Regression Check:**
- Empty tabs display correctly
- Tab switching preserves scroll position
- Mobile layout works

---

### AC-018: Form Validation Feedback
**Bug Reference:** UX #18

#### Test Case 18.1: Inline Errors
**Steps:**
1. Open SubForm
2. Leave required fields empty
3. Click Save

**Expected Result:**
- Error message below each invalid field
- Error text: specific message (not generic)
- Field border red

#### Test Case 18.2: Real-time Validation
**Steps:**
1. Type invalid email format
2. Tab to next field

**Expected Result:**
- Error appears on blur
- Message: "Invalid email format"
- Clears when corrected

#### Test Case 18.3: Error Summary
**Steps:**
1. Submit form with multiple errors

**Expected Result:**
- Summary at top: "Please fix X errors below"
- Clicking error scrolls to field
- Focus on first error

**Regression Check:**
- Valid submissions unaffected
- Optional fields don't trigger errors
- Async validation (unique checks) works

---

## REGRESSION TEST SUITE

### RT-001: Core Task Operations
- [ ] Create task
- [ ] Edit task
- [ ] Delete task
- [ ] Assign task to user
- [ ] Assign task to subcontractor
- [ ] Add checklist items
- [ ] Complete checklist items
- [ ] Add comments
- [ ] Upload attachments
- [ ] Change task status
- [ ] Set task priority
- [ ] Add dependencies

### RT-002: Core Scope Operations
- [ ] Create scope
- [ ] Add scope items
- [ ] Edit scope items
- [ ] Delete scope items
- [ ] Group by phase
- [ ] Submit for approval
- [ ] Approve scope
- [ ] Reject scope
- [ ] Create new version
- [ ] View version history

### RT-003: Core Project Operations
- [ ] Create project
- [ ] Edit project
- [ ] Archive project
- [ ] Duplicate project
- [ ] Add phases
- [ ] Activate phase
- [ ] Complete phase
- [ ] Skip phase
- [ ] Add team members
- [ ] Remove team members

### RT-004: Authentication Flows
- [ ] Login with email/password
- [ ] Logout
- [ ] Password reset request
- [ ] Password reset complete
- [ ] Session persistence
- [ ] Protected route redirect

### RT-005: Navigation & Layout
- [ ] Desktop sidebar navigation
- [ ] Mobile hamburger menu
- [ ] Breadcrumb navigation
- [ ] Deep link to project
- [ ] Back button behavior
- [ ] Page transitions

---

## AUTOMATED TEST PRIORITIES

### Priority 1: Critical Path Unit Tests
```
lib/auth.tsx
lib/hooks/useTasks.ts
lib/hooks/useScopes.ts
lib/validations/index.ts
```

### Priority 2: Component Integration Tests
```
components/tasks/TaskDetailModal.tsx
components/projects/scope/ScopeBuilder.tsx
components/subcontractors/SubDetailModal.tsx
```

### Priority 3: E2E User Flows
```
Project creation → Phase setup → Task creation → Completion
SOW creation → Client approval → Quote generation
Team invite → Acceptance → First login
```

---

## BROWSER COMPATIBILITY MATRIX

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | Required |
| Safari | Latest | Required |
| Firefox | Latest | Required |
| Edge | Latest | Optional |
| iOS Safari | 15+ | Required |
| Android Chrome | Latest | Required |

---

## ACCESSIBILITY CHECKLIST

- [ ] All forms keyboard navigable
- [ ] Focus indicators visible
- [ ] Screen reader announces errors
- [ ] Color contrast WCAG AA
- [ ] Alt text on images
- [ ] Heading hierarchy correct
- [ ] ARIA labels on interactive elements
