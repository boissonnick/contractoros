# ContractorOS Bug Fix & Feature Roadmap v1.28

> Generated: 2026-01-28
> Branch: `feature/bug-fixes-1.28`
> Source: `1.28.bugfixes.pdf`

---

## Priority Legend

| Priority | Description | Timeline |
|----------|-------------|----------|
| P0 - Critical | Blocking core functionality, broken pages | Immediate |
| P1 - High | Major UX issues, incomplete workflows | Sprint 1 |
| P2 - Medium | Enhancement opportunities, polish | Sprint 2 |
| P3 - Low | Nice-to-have, future consideration | Backlog |

---

## SECTION 1: TASK MANAGEMENT BUGS

### BUG #1: Phase Dropdown Missing in Task Modal
**Priority:** P1 - High
**Component:** `apps/web/components/tasks/TaskDetailModal.tsx`
**Hook:** `apps/web/lib/hooks/useTasks.ts`
**Issue:** Task detail modal lacks phase assignment dropdown despite `phaseId` existing in Task type

**Acceptance Criteria:**
- [ ] Phase dropdown appears in TaskDetailModal Details tab
- [ ] Dropdown populated from project phases via `usePhases` hook
- [ ] Selecting phase updates task's `phaseId` in Firestore
- [ ] Phase badge displays on TaskCard and TaskListRow
- [ ] Phase filter works in TaskFilters component

**Files to Modify:**
```
apps/web/components/tasks/TaskDetailModal.tsx
apps/web/components/tasks/TaskCard.tsx
apps/web/components/projects/tasks/list/TaskListRow.tsx
apps/web/components/projects/tasks/TaskFilters.tsx
```

---

### BUG #2: Modal Dismiss - Close Button Offset
**Priority:** P2 - Medium
**Component:** `apps/web/components/tasks/TaskDetailModal.tsx`
**Issue:** X close button poorly positioned, visually offset from modal corner

**Acceptance Criteria:**
- [ ] Close button positioned in top-right corner with consistent padding
- [ ] Button has proper hit target (min 44x44px for touch)
- [ ] Visual alignment matches other modals (SubDetailModal, PhaseDetailModal)

**Files to Modify:**
```
apps/web/components/tasks/TaskDetailModal.tsx
```

---

### BUG #3: Modal Scroll Issues on Long Content
**Priority:** P2 - Medium
**Component:** `apps/web/components/tasks/TaskDetailModal.tsx`
**Issue:** Long comments/checklists cause entire page scroll instead of modal scroll

**Acceptance Criteria:**
- [ ] Modal content scrolls independently within max-height container
- [ ] Header and action buttons remain fixed/visible
- [ ] Works on mobile viewports
- [ ] Tab content areas scroll independently

**Files to Modify:**
```
apps/web/components/tasks/TaskDetailModal.tsx
apps/web/components/tasks/TaskComments.tsx
apps/web/components/tasks/TaskChecklist.tsx
```

---

### BUG #4: Gantt View Task Name Overlap
**Priority:** P2 - Medium
**Component:** `apps/web/components/projects/tasks/gantt/GanttChart.tsx`
**Issue:** Long task names overlap with timeline bars in Gantt view

**Acceptance Criteria:**
- [ ] Task names truncate with ellipsis at appropriate width
- [ ] Tooltip shows full name on hover
- [ ] Bar and name maintain visual separation
- [ ] Works at all zoom levels (day/week/month)

**Files to Modify:**
```
apps/web/components/projects/tasks/gantt/GanttChart.tsx
apps/web/lib/utils/ganttTransform.ts
```

---

### UX #5: Task Assignment UX Improvement
**Priority:** P2 - Medium
**Component:** `apps/web/components/tasks/TaskAssignment.tsx`
**Issue:** Multi-select assignment unclear, no visual feedback on selection

**Acceptance Criteria:**
- [ ] Clear multi-select UI (checkboxes or pills)
- [ ] Selected assignees shown prominently
- [ ] Quick search/filter for team members
- [ ] Avatar display for assigned users
- [ ] Handle both users and subcontractors

**Files to Modify:**
```
apps/web/components/tasks/TaskAssignment.tsx
apps/web/components/tasks/TaskDetailModal.tsx
```

---

### UX #6: Checklist Item Save Feedback
**Priority:** P2 - Medium
**Component:** `apps/web/components/tasks/TaskChecklist.tsx`
**Issue:** No visual feedback when checklist items are saved

**Acceptance Criteria:**
- [ ] Toast notification on checklist save
- [ ] Optimistic UI update with rollback on error
- [ ] Loading indicator during save
- [ ] Checkbox animates on toggle

**Files to Modify:**
```
apps/web/components/tasks/TaskChecklist.tsx
```

---

### UX #7: Save Confirmation on Modal Close
**Priority:** P1 - High
**Component:** `apps/web/components/tasks/TaskDetailModal.tsx`
**Issue:** No warning when closing modal with unsaved changes

**Acceptance Criteria:**
- [ ] Track dirty state for form fields
- [ ] ConfirmDialog prompts on close with unsaved changes
- [ ] Options: Save & Close, Discard Changes, Cancel
- [ ] Escape key respects dirty state check

**Files to Modify:**
```
apps/web/components/tasks/TaskDetailModal.tsx
apps/web/components/ui/ConfirmDialog.tsx (if needed)
```

---

## SECTION 2: SOW/SCOPE BUILDER BUGS

### BUG #8: SOW Template Items Not Assigned to Phases
**Priority:** P1 - High
**Component:** `apps/web/components/projects/scope/ScopeTemplateSelector.tsx`
**Hook:** `apps/web/lib/hooks/useScopes.ts`
**Issue:** When applying SOW template, items don't inherit phase assignments

**Acceptance Criteria:**
- [ ] Template items include phaseId mapping
- [ ] On template apply, items assigned to corresponding project phases
- [ ] Phase matching by name or order position
- [ ] Unmatched items go to default/first phase or "Unassigned"

**Files to Modify:**
```
apps/web/components/projects/scope/ScopeTemplateSelector.tsx
apps/web/components/projects/scope/ScopeBuilder.tsx
apps/web/lib/firebase/seedSowTemplates.ts
apps/web/types/index.ts (SowTemplate type)
```

---

### FEATURE #9: SOW Template Management System
**Priority:** P1 - High
**Location:** New settings page needed
**Issue:** No UI to create/edit/delete SOW templates

**Acceptance Criteria:**
- [ ] New route: `/dashboard/settings/sow-templates`
- [ ] List existing templates with edit/delete
- [ ] Create template form with items, phases, categories
- [ ] Import from existing project scope
- [ ] Template preview before applying

**Files to Create:**
```
apps/web/app/dashboard/settings/sow-templates/page.tsx
apps/web/components/settings/SowTemplateList.tsx
apps/web/components/settings/SowTemplateForm.tsx
apps/web/lib/hooks/useSowTemplates.ts
```

---

### BUG #11: Archived Project Duplicate Fails
**Priority:** P2 - Medium
**Component:** Project duplication logic
**Issue:** Duplicating archived project throws error or produces incomplete copy

**Acceptance Criteria:**
- [ ] Archived projects can be duplicated successfully
- [ ] Duplicate includes all phases, tasks, scope items
- [ ] Duplicate has new dates (offset from current date)
- [ ] Status resets to 'planning' regardless of source

**Files to Modify:**
```
apps/web/app/dashboard/projects/[id]/page.tsx (duplicate action)
apps/web/lib/hooks/useProjects.ts (if exists) or inline logic
```

---

### UX #12: Tags Feature Incomplete
**Priority:** P3 - Low
**Components:** Multiple
**Issue:** Tags field exists but no tag management, filtering, or autocomplete

**Acceptance Criteria:**
- [ ] Tag autocomplete from existing project tags
- [ ] Tag creation inline (type and Enter)
- [ ] Tag color/category support
- [ ] Filter tasks/projects by tags
- [ ] Organization-wide tag library in settings

**Files to Modify:**
```
apps/web/components/tasks/TaskDetailModal.tsx
apps/web/components/projects/tasks/TaskFilters.tsx
apps/web/app/dashboard/settings/tags/page.tsx (new)
```

---

### WORKFLOW #13: SOW Approval Process Unclear
**Priority:** P1 - High
**Component:** `apps/web/components/projects/scope/ScopeApprovalPanel.tsx`
**Issue:** Approval workflow not intuitive, status transitions unclear

**Acceptance Criteria:**
- [ ] Clear status badges (Draft, Pending Review, Approved, Rejected)
- [ ] Approval action buttons contextual to user role
- [ ] Email notifications on status change
- [ ] Approval history/audit log visible
- [ ] Client portal shows approval actions

**Files to Modify:**
```
apps/web/components/projects/scope/ScopeApprovalPanel.tsx
apps/web/components/projects/scope/ScopeVersionHistory.tsx
apps/web/app/client/projects/[id]/scope/page.tsx
```

---

### WORKFLOW #14: SOW vs Quote Relationship Unclear
**Priority:** P1 - High
**Components:** Scope and Quote builders
**Issue:** Users confused about SOW/Quote relationship, when to use each

**Acceptance Criteria:**
- [ ] Help tooltips explaining SOW vs Quote
- [ ] Visual link showing connected SOW ↔ Quote
- [ ] Auto-generate Quote from approved SOW option
- [ ] Quote shows source SOW reference
- [ ] Changes sync prompt between linked documents

**Files to Modify:**
```
apps/web/components/projects/scope/ScopeQuoteLink.tsx
apps/web/app/dashboard/projects/[id]/scope/page.tsx
apps/web/app/dashboard/projects/[id]/quotes/page.tsx
```

---

### BUG #15: Quote Import Not Organized by Phase
**Priority:** P2 - Medium
**Component:** Quote builder/importer
**Issue:** Importing quote items doesn't group by phase

**Acceptance Criteria:**
- [ ] Imported items grouped by phase
- [ ] Phase headers in quote view
- [ ] Subtotals per phase
- [ ] Phase order matches SOW phase order

**Files to Modify:**
```
apps/web/app/dashboard/projects/[id]/quotes/page.tsx
apps/web/components/projects/QuoteSummaryCard.tsx
```

---

### FEATURE #16: Cannot View SOW Versions
**Priority:** P1 - High
**Component:** `apps/web/components/projects/scope/ScopeVersionHistory.tsx`
**Issue:** Version history exists but no way to view/compare past versions

**Acceptance Criteria:**
- [ ] Version list shows all scope versions
- [ ] Click version to view read-only snapshot
- [ ] Side-by-side diff comparison between versions
- [ ] Restore previous version option (creates new version)
- [ ] Change log shows additions/removals/modifications

**Files to Modify:**
```
apps/web/components/projects/scope/ScopeVersionHistory.tsx
apps/web/components/projects/scope/ScopeVersionDiff.tsx (new)
apps/web/lib/hooks/useScopes.ts
```

---

## SECTION 3: SUBCONTRACTOR MANAGEMENT

### UX #17: Subcontractor Modal Scrolling
**Priority:** P2 - Medium
**Component:** `apps/web/components/subcontractors/SubDetailModal.tsx`
**Issue:** Long content in Documents/Performance tabs causes scroll issues

**Acceptance Criteria:**
- [ ] Tab content areas scroll independently
- [ ] Modal doesn't exceed viewport height
- [ ] Sticky tab headers during scroll
- [ ] Works on mobile

**Files to Modify:**
```
apps/web/components/subcontractors/SubDetailModal.tsx
apps/web/components/subcontractors/SubDocuments.tsx
apps/web/components/subcontractors/SubPaymentTracker.tsx
```

---

### UX #18: Form Validation Feedback
**Priority:** P1 - High
**Component:** `apps/web/components/subcontractors/SubForm.tsx`
**Issue:** Validation errors not clearly shown, no inline feedback

**Acceptance Criteria:**
- [ ] Inline error messages below fields
- [ ] Field border turns red on error
- [ ] Error summary at form top
- [ ] Real-time validation as user types
- [ ] Clear error on field focus/change

**Files to Modify:**
```
apps/web/components/subcontractors/SubForm.tsx
apps/web/lib/validations/index.ts (add subcontractor schema)
```

---

### UX #19: No Required Field Indicators
**Priority:** P1 - High
**Component:** System-wide
**Issue:** Required fields not marked with asterisks or other indicators

**Acceptance Criteria:**
- [ ] Required fields show red asterisk (*) next to label
- [ ] Consistent pattern across all forms
- [ ] Legend indicating "* Required" where appropriate
- [ ] Works with both controlled and uncontrolled inputs

**Files to Modify:**
```
apps/web/components/ui/Input.tsx (add required prop styling)
apps/web/components/ui/Select.tsx (if exists)
All form components using these primitives
```

---

### FEATURE #20: Global Subcontractor Management System
**Priority:** P0 - Critical
**Location:** New module
**Issue:** Subcontractors only exist at project level, no org-wide database

**Acceptance Criteria:**
- [ ] Org-level subcontractor collection in Firestore
- [ ] `/dashboard/subcontractors` list page with search/filter
- [ ] Subcontractor detail page with full profile
- [ ] Assign existing subs to projects (not duplicate)
- [ ] Cross-project performance metrics aggregation
- [ ] Document expiration alerts (license, insurance)
- [ ] Bulk import/export functionality

**Files to Create:**
```
apps/web/app/dashboard/subcontractors/page.tsx
apps/web/app/dashboard/subcontractors/[id]/page.tsx
apps/web/lib/hooks/useOrgSubcontractors.ts
apps/web/components/subcontractors/SubcontractorGlobalList.tsx
apps/web/components/subcontractors/SubcontractorImport.tsx
```

**Firestore Schema:**
```
organizations/{orgId}/subcontractors/{subId}
  - company, contact, trade, rating, documents[]
  - linkedProjects[] (references)
  - aggregateMetrics: { onTimeRate, qualityScore, totalProjects }
```

---

## SECTION 4: UI/RESPONSIVE BUGS

### BUG #21: Responsive Design Mobile Issues
**Priority:** P2 - Medium
**Components:** Various
**Issue:** Layout breaks on mobile viewports (<640px)

**Acceptance Criteria:**
- [ ] All pages render correctly on 375px width
- [ ] Navigation collapses to hamburger menu
- [ ] Tables convert to card layouts on mobile
- [ ] Touch targets minimum 44x44px
- [ ] No horizontal scroll on main content

**Files to Audit:**
```
apps/web/components/ui/AppShell.tsx
apps/web/components/projects/tasks/list/TaskList.tsx
apps/web/components/subcontractors/SubList.tsx
apps/web/app/dashboard/layout.tsx
```

---

### BUG #22: Table Layout Overflow
**Priority:** P2 - Medium
**Components:** Tables/Lists
**Issue:** Wide tables overflow container on smaller screens

**Acceptance Criteria:**
- [ ] Horizontal scroll on table containers (not page)
- [ ] Sticky first column option for key identifiers
- [ ] Column priority: hide less important columns on mobile
- [ ] Responsive breakpoints at 640px, 768px, 1024px

**Files to Modify:**
```
apps/web/components/projects/tasks/list/TaskList.tsx
apps/web/components/timesheets/TimeEntryList.tsx
apps/web/components/timesheets/TimesheetApprovalList.tsx
```

---

### CRITICAL #23: Brand Colors Not Applied
**Priority:** P1 - High
**Component:** `apps/web/lib/theme/ThemeProvider.tsx`
**Issue:** Organization brand colors set but not reflected throughout UI

**Acceptance Criteria:**
- [ ] Primary button uses `--color-primary` CSS variable
- [ ] Accent colors used for highlights, badges
- [ ] Sidebar/header can use org colors
- [ ] Preview brand colors in settings before save
- [ ] Fallback to defaults if colors not set

**Files to Modify:**
```
apps/web/lib/theme/ThemeProvider.tsx
apps/web/tailwind.config.js
apps/web/components/ui/Button.tsx
apps/web/app/dashboard/settings/organization/page.tsx
```

---

## SECTION 5: SETTINGS PAGE BUGS

### BUG #24: Organization Settings Save Behavior
**Priority:** P1 - High
**Component:** `apps/web/app/dashboard/settings/organization/page.tsx`
**Issue:** Save button behavior unclear, no success confirmation

**Acceptance Criteria:**
- [ ] Toast notification on successful save
- [ ] Loading state during save
- [ ] Error handling with specific messages
- [ ] Dirty state tracking (unsaved changes indicator)
- [ ] Form validation before submit

**Files to Modify:**
```
apps/web/app/dashboard/settings/organization/page.tsx
apps/web/components/ui/Toast.tsx (ensure working)
```

---

### BUG #25: Organization Settings Layout Issues
**Priority:** P2 - Medium
**Component:** `apps/web/app/dashboard/settings/organization/page.tsx`
**Issue:** Form layout inconsistent, sections not clearly separated

**Acceptance Criteria:**
- [ ] Clear section headers (Company Info, Branding, Contact)
- [ ] Consistent spacing between sections
- [ ] Logo upload area properly styled
- [ ] Color pickers with preview swatches
- [ ] Mobile-responsive form layout

**Files to Modify:**
```
apps/web/app/dashboard/settings/organization/page.tsx
```

---

### BUG #26: Integrations Page Broken
**Priority:** P0 - Critical
**Component:** `apps/web/app/dashboard/settings/integrations/page.tsx`
**Issue:** Page shows stubs only, no functional integrations

**Acceptance Criteria:**
- [ ] Integration cards with status (Connected/Not Connected)
- [ ] OAuth flow for QuickBooks, Xero
- [ ] Connection status indicator
- [ ] Disconnect option with confirmation
- [ ] Sync settings per integration
- [ ] Last sync timestamp display

**Files to Modify:**
```
apps/web/app/dashboard/settings/integrations/page.tsx
apps/web/components/settings/IntegrationCard.tsx (new)
apps/web/lib/hooks/useAccountingConnection.ts
```

---

### BUG #27: Tax Rates Page Issues
**Priority:** P1 - High
**Component:** `apps/web/app/dashboard/settings/tax-rates/page.tsx`
**Issue:** Page may be incomplete or have CRUD issues

**Acceptance Criteria:**
- [ ] List all org tax rates
- [ ] Add new rate with name, percentage, applies-to
- [ ] Edit existing rates inline or modal
- [ ] Delete with confirmation
- [ ] Default rate designation
- [ ] Rate used in estimates/invoices

**Files to Modify:**
```
apps/web/app/dashboard/settings/tax-rates/page.tsx
apps/web/lib/hooks/useTaxRates.ts
```

---

### BUG #28: Data Export Page Broken
**Priority:** P1 - High
**Component:** `apps/web/app/dashboard/settings/data-export/page.tsx`
**Issue:** Export functionality not working

**Acceptance Criteria:**
- [ ] Export options: Projects, Tasks, Timesheets, Invoices
- [ ] Format selection: CSV, JSON, PDF
- [ ] Date range filter
- [ ] Download initiated with progress indicator
- [ ] Export history/logs

**Files to Modify:**
```
apps/web/app/dashboard/settings/data-export/page.tsx
apps/web/lib/exports.ts
```

---

### BUG #29: Notifications Page Broken
**Priority:** P1 - High
**Component:** `apps/web/app/dashboard/settings/notifications/page.tsx`
**Issue:** Notification preferences not saving or displaying

**Acceptance Criteria:**
- [ ] Toggle switches for each notification type
- [ ] Categories: Tasks, Projects, Timesheets, Invoices, Team
- [ ] Channel selection: Email, Push, In-App
- [ ] Digest frequency option (immediate, daily, weekly)
- [ ] Save preferences to user profile
- [ ] Test notification button

**Files to Modify:**
```
apps/web/app/dashboard/settings/notifications/page.tsx
apps/web/lib/hooks/useNotifications.ts
apps/web/types/index.ts (NotificationPreferences type)
```

---

## SECTION 6: MAJOR FEATURE GAPS

### FEATURE GAP: Team Management Enhancements
**Priority:** P2 - Medium
**Location:** `/dashboard/settings/team`
**Issue:** Basic team management lacks advanced features

**Acceptance Criteria:**
- [ ] Team member roles and permissions matrix
- [ ] Department/crew grouping
- [ ] Certifications tracking with expiry alerts
- [ ] Training records
- [ ] Emergency contact info
- [ ] Performance metrics dashboard

**Files to Create/Modify:**
```
apps/web/app/dashboard/settings/team/page.tsx
apps/web/components/team/TeamMemberCard.tsx
apps/web/components/team/CertificationTracker.tsx
apps/web/components/team/PermissionsMatrix.tsx
```

---

### FEATURE GAP: Client Module Enhancements
**Priority:** P2 - Medium
**Location:** Client portal
**Issue:** Client portal limited functionality

**Acceptance Criteria:**
- [ ] Client dashboard with project overview
- [ ] Document sharing and e-signatures
- [ ] Payment portal integration
- [ ] Communication thread with contractor
- [ ] Photo gallery access
- [ ] Approval workflows (SOW, Change Orders)

**Files to Modify:**
```
apps/web/app/client/page.tsx
apps/web/app/client/projects/[id]/page.tsx
apps/web/components/client/*
```

---

### FEATURE GAP: Employee Onboarding Flow
**Priority:** P2 - Medium
**Location:** `/onboarding`
**Issue:** Onboarding incomplete for field workers

**Acceptance Criteria:**
- [ ] Multi-step wizard for new employees
- [ ] Document upload (W-9, I-9, certifications)
- [ ] Emergency contact collection
- [ ] Trade/skill selection
- [ ] Equipment/vehicle assignment
- [ ] Policy acknowledgment signatures

**Files to Modify:**
```
apps/web/app/onboarding/employee/page.tsx
apps/web/components/onboarding/*
```

---

## SECTION 7: REFACTORING OPPORTUNITIES

### REFACTOR #1: Modal Component Consolidation
**Priority:** P2 - Medium
**Issue:** Multiple modal implementations with inconsistent patterns

**Recommendation:**
- Create `BaseModal` component wrapping Headless UI Dialog
- Standardize header, body, footer sections
- Consistent scroll behavior (fixed header/footer, scrolling body)
- Shared close button positioning
- Dirty state tracking hook

**Files to Create:**
```
apps/web/components/ui/BaseModal.tsx
apps/web/lib/hooks/useModalState.ts
```

---

### REFACTOR #2: Form Component Library
**Priority:** P2 - Medium
**Issue:** Form validation inconsistent, no shared patterns

**Recommendation:**
- Create FormField wrapper with label, error, required indicator
- Integrate React Hook Form + Zod universally
- Shared validation schemas in `/lib/validations`
- Form-level error summary component

**Files to Create:**
```
apps/web/components/ui/FormField.tsx
apps/web/components/ui/FormError.tsx
apps/web/components/ui/FormSection.tsx
```

---

### REFACTOR #3: Toast/Notification System
**Priority:** P1 - High
**Issue:** Silent errors, no user feedback on operations

**Recommendation:**
- Implement react-hot-toast or similar
- Toast on all CRUD operations
- Error toast with retry action
- Success/warning/error/info variants
- Auto-dismiss with configurable duration

**Files to Modify:**
```
apps/web/components/ui/Toast.tsx
apps/web/components/Providers.tsx (add toast provider)
All hooks with CRUD operations
```

---

### REFACTOR #4: Error Boundary Enhancement
**Priority:** P2 - Medium
**Issue:** Errors may crash entire app

**Recommendation:**
- Wrap each route segment in ErrorBoundary
- Graceful error UI with retry
- Error logging to monitoring service
- Preserve navigation on component errors

**Files to Modify:**
```
apps/web/components/ErrorBoundary.tsx
apps/web/app/**/error.tsx (Next.js error files)
```

---

### REFACTOR #5: AuthProvider Architecture
**Priority:** P1 - High
**Issue:** Per CLAUDE.md, AuthProvider needs refactoring

**Recommendation:**
- Review current implementation at `/lib/auth.tsx`
- Separate concerns: auth state, user profile, permissions
- Add loading states for auth checks
- Implement proper token refresh
- Session persistence options

**Files to Modify:**
```
apps/web/lib/auth.tsx
apps/web/components/auth/AuthGuard.tsx
```

---

## IMPLEMENTATION SPRINTS

### Sprint 1: Critical Fixes (P0 + P1)
1. BUG #26: Integrations Page (P0)
2. FEATURE #20: Global Subcontractor System (P0)
3. CRITICAL #23: Brand Colors (P1)
4. BUG #1: Phase Dropdown (P1)
5. UX #7: Save Confirmation (P1)
6. BUG #8: SOW Template Phases (P1)
7. FEATURE #9: SOW Template Management (P1)
8. WORKFLOW #13: SOW Approval Process (P1)
9. FEATURE #16: SOW Versions (P1)
10. UX #18: Form Validation (P1)
11. UX #19: Required Field Indicators (P1)
12. BUG #24: Settings Save Behavior (P1)
13. BUG #27-29: Settings Pages (P1)
14. REFACTOR #3: Toast System (P1)
15. REFACTOR #5: AuthProvider (P1)

### Sprint 2: UX Polish (P2)
1. BUG #2-4: Modal/Gantt fixes
2. UX #5-6: Task UX improvements
3. UX #17: Sub Modal scroll
4. BUG #21-22: Responsive design
5. BUG #25: Settings layout
6. REFACTOR #1-2: Modal + Form consolidation
7. REFACTOR #4: Error boundaries

### Sprint 3: Feature Enhancements (P2-P3)
1. BUG #11: Archived project duplicate
2. UX #12: Tags feature
3. WORKFLOW #14: SOW/Quote relationship
4. BUG #15: Quote import phases
5. Team Management features
6. Client portal enhancements
7. Employee onboarding flow

---

## TESTING STRATEGY

### Unit Tests (Priority: Critical paths first)
```
lib/auth.tsx - Auth flows
lib/hooks/useTasks.ts - Task CRUD
lib/hooks/usePhases.ts - Phase management
lib/hooks/useChangeOrders.ts - Change order workflow
lib/hooks/useScopes.ts - Scope versioning
lib/validations/index.ts - Schema validation
```

### Integration Tests
```
Task creation → Phase assignment → Gantt view
SOW creation → Approval → Quote generation
Subcontractor creation → Project assignment → Performance tracking
```

### E2E Tests (Playwright/Cypress)
```
Full project creation workflow
Client approval flow
Settings configuration
Multi-user collaboration scenarios
```

---

## FILE CHANGE TRACKING

| File | Bugs Addressed | Status |
|------|----------------|--------|
| `components/tasks/TaskDetailModal.tsx` | #1, #2, #3, #5, #7 | Pending |
| `components/tasks/TaskChecklist.tsx` | #6 | Pending |
| `components/tasks/TaskCard.tsx` | #1 | Pending |
| `components/projects/tasks/gantt/GanttChart.tsx` | #4 | Pending |
| `components/projects/scope/ScopeBuilder.tsx` | #8 | Pending |
| `components/projects/scope/ScopeApprovalPanel.tsx` | #13 | Pending |
| `components/projects/scope/ScopeVersionHistory.tsx` | #16 | Pending |
| `components/subcontractors/SubDetailModal.tsx` | #17 | Pending |
| `components/subcontractors/SubForm.tsx` | #18 | Pending |
| `components/ui/Input.tsx` | #19 | Pending |
| `lib/theme/ThemeProvider.tsx` | #23 | Pending |
| `app/dashboard/settings/organization/page.tsx` | #24, #25 | Pending |
| `app/dashboard/settings/integrations/page.tsx` | #26 | Pending |
| `app/dashboard/settings/tax-rates/page.tsx` | #27 | Pending |
| `app/dashboard/settings/data-export/page.tsx` | #28 | Pending |
| `app/dashboard/settings/notifications/page.tsx` | #29 | Pending |

---

## NOTES

- All changes should maintain TypeScript strict mode compliance
- Follow existing code patterns (hooks, Tailwind classes, component structure)
- Test on Chrome, Safari, Firefox; iOS Safari, Android Chrome
- Maintain Firestore security rules for new collections
- Update types/index.ts for any schema changes
