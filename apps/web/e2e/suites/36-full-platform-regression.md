# Full Platform Regression Test Suite
# Sprint 32-36 Feature Validation
# Duration: 45-60 minutes
# Date: 2026-02-02

## Test Environment
- URL: http://localhost:3000
- Browser: Chrome via MCP
- Demo Account: owner@demo.contractoros.com

---

## PHASE 1: Authentication & Dashboard (5 min)

### 1.1 Login Flow
- [ ] Navigate to http://localhost:3000
- [ ] Verify login page loads correctly
- [ ] Login with demo credentials
- [ ] Verify redirect to dashboard
- [ ] Check no console errors

### 1.2 Dashboard Verification
- [ ] Stats cards display correctly
- [ ] Recent activity shows data
- [ ] Quick actions are functional
- [ ] Navigation sidebar works
- [ ] Global search (Cmd+K) opens

---

## PHASE 2: Core Modules Quick Check (10 min)

### 2.1 Projects
- [ ] Navigate to /dashboard/projects
- [ ] Verify project list loads
- [ ] Click into a project detail
- [ ] Check phases tab works
- [ ] Check tasks tab works

### 2.2 Clients
- [ ] Navigate to /dashboard/clients
- [ ] Verify client list loads
- [ ] Click into a client detail
- [ ] Check notes section works

### 2.3 Estimates
- [ ] Navigate to /dashboard/estimates
- [ ] Verify estimate list loads
- [ ] Check auto-numbering visible
- [ ] Click into an estimate

### 2.4 Invoices
- [ ] Navigate to /dashboard/invoices
- [ ] Verify invoice list loads
- [ ] Check auto-numbering visible
- [ ] Click into an invoice

---

## PHASE 3: Sprint 32 - Smart Automation (5 min)

### 3.1 Budget Alerts
- [ ] Navigate to project with budget data
- [ ] Look for budget alert card
- [ ] Verify alert shows variance info
- [ ] Check dismiss functionality

### 3.2 Scheduling Suggestions
- [ ] Navigate to scheduling page
- [ ] Look for AI scheduling suggestions
- [ ] Verify suggestion card renders

### 3.3 Change Order Detection
- [ ] Check for change order alerts on project
- [ ] Verify detection logic triggers

---

## PHASE 4: Sprint 33 - Punch Lists (5 min)

### 4.1 Punch List Access
- [ ] Navigate to project detail
- [ ] Find punch list section/tab
- [ ] Verify punch list loads

### 4.2 Punch List CRUD
- [ ] Create new punch list item
- [ ] Verify item appears in list
- [ ] Edit punch list item
- [ ] Mark item as complete
- [ ] Verify status updates

### 4.3 Closeout Checklist
- [ ] Access closeout checklist
- [ ] Verify template loads
- [ ] Check items can be toggled

---

## PHASE 5: Sprint 34 - RFIs & Submittals (5 min)

### 5.1 RFI List
- [ ] Navigate to RFI log (/dashboard/rfis or project RFI tab)
- [ ] Verify RFI list loads
- [ ] Check RFI card component renders

### 5.2 RFI CRUD
- [ ] Open create RFI modal
- [ ] Fill in required fields
- [ ] Submit RFI
- [ ] Verify RFI appears in list

### 5.3 Submittals
- [ ] Navigate to submittals section
- [ ] Verify submittal list loads
- [ ] Open create submittal modal
- [ ] Check form validation

---

## PHASE 6: Sprint 35 - Equipment Tracking (5 min)

### 6.1 Equipment List
- [ ] Navigate to /dashboard/equipment
- [ ] Verify equipment list loads
- [ ] Check equipment cards render

### 6.2 Equipment CRUD
- [ ] Open create equipment modal
- [ ] Fill in equipment details
- [ ] Submit and verify creation
- [ ] Edit equipment details
- [ ] Delete equipment (if allowed)

### 6.3 Check-out System
- [ ] Find check-out button on equipment
- [ ] Open check-out modal
- [ ] Fill in check-out details
- [ ] Complete check-out
- [ ] Verify status changes

### 6.4 Maintenance Log
- [ ] Access maintenance log for equipment
- [ ] Add maintenance record
- [ ] Verify record appears

### 6.5 QR Codes
- [ ] Generate QR code for equipment
- [ ] Verify QR displays correctly

---

## PHASE 7: Sprint 36 - Enhanced Client Portal (5 min)

### 7.1 Client Portal Access
- [ ] Navigate to /client/[token] (use test magic link)
- [ ] Verify portal loads without auth

### 7.2 Photo Timeline
- [ ] Verify PhotoTimeline component renders
- [ ] Check photos grouped by date
- [ ] Click thumbnail to open lightbox
- [ ] Navigate through lightbox

### 7.3 Selection Board
- [ ] Navigate to selections section
- [ ] Verify SelectionBoard renders
- [ ] Check category tabs work
- [ ] Click on selection option
- [ ] Test approve/decline buttons

### 7.4 Progress Dashboard
- [ ] Verify ProgressDashboard renders
- [ ] Check circular progress displays
- [ ] Verify phase breakdown shows
- [ ] Check milestone markers

### 7.5 Document Library
- [ ] Navigate to documents section
- [ ] Verify DocumentLibrary renders
- [ ] Check category filters
- [ ] Test file preview
- [ ] Test download button

### 7.6 Client Notes
- [ ] Navigate to notes section
- [ ] Add a new note
- [ ] Verify note appears
- [ ] Check timestamp displays

---

## PHASE 8: AI Assistant (5 min)

### 8.1 Assistant Panel
- [ ] Open AI assistant (FAB button)
- [ ] Verify chat interface loads
- [ ] Check model selection works

### 8.2 Document Upload
- [ ] Try uploading a document
- [ ] Verify upload UI works

### 8.3 Natural Language Query
- [ ] Type "show overdue invoices"
- [ ] Verify query parses and executes

### 8.4 Proactive Suggestions
- [ ] Check for suggestion cards
- [ ] Verify dismiss works

---

## PHASE 9: Mobile Responsiveness (5 min)

### 9.1 Resize to Mobile (375x812)
- [ ] Dashboard adapts correctly
- [ ] Bottom navigation appears
- [ ] FAB positioned correctly
- [ ] Stats cards stack properly

### 9.2 Touch Interactions
- [ ] Pull-to-refresh works
- [ ] Swipe gestures work
- [ ] Touch targets are 44px+

### 9.3 Navigation
- [ ] Bottom nav items work
- [ ] Hamburger menu (if present) works

---

## PHASE 10: Error States & Edge Cases (5 min)

### 10.1 Empty States
- [ ] Navigate to section with no data
- [ ] Verify empty state renders
- [ ] Check animation plays

### 10.2 Loading States
- [ ] Observe loading skeletons
- [ ] Verify no layout shift

### 10.3 Error Handling
- [ ] Trigger an error (invalid ID in URL)
- [ ] Verify error boundary catches
- [ ] Check error message displays

### 10.4 Form Validation
- [ ] Submit form with missing required fields
- [ ] Verify validation messages appear
- [ ] Check field highlighting

---

## BUG TRACKING

### Critical Bugs (Blocks Usage)
| ID | Description | Location | Status |
|----|-------------|----------|--------|
|    |             |          |        |

### High Priority Bugs (Major Impact)
| ID | Description | Location | Status |
|----|-------------|----------|--------|
|    |             |          |        |

### Medium Priority Bugs (Annoyances)
| ID | Description | Location | Status |
|----|-------------|----------|--------|
|    |             |          |        |

### Low Priority Bugs (Cosmetic)
| ID | Description | Location | Status |
|----|-------------|----------|--------|
|    |             |          |        |

---

## NOTES

### Database Issues
-

### API Issues
-

### UI/UX Issues
-

### Performance Issues
-

---

## SUMMARY

| Phase | Passed | Failed | Blocked |
|-------|--------|--------|---------|
| Auth & Dashboard | | | |
| Core Modules | | | |
| Smart Automation | | | |
| Punch Lists | | | |
| RFIs & Submittals | | | |
| Equipment Tracking | | | |
| Client Portal | | | |
| AI Assistant | | | |
| Mobile | | | |
| Edge Cases | | | |
| **TOTAL** | | | |

**Tested By:** Claude Code E2E Session
**Date:** 2026-02-02
**Environment:** Docker localhost:3000
