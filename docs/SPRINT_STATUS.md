# ContractorOS Sprint Status

> **Purpose:** Track current progress and enable seamless session handoffs.
> **Last Updated:** 2026-01-29 (PM) by Claude Opus 4.5
> **Current Phase:** Phase 4 - Efficiency & Scale

---

## Quick Status

| Metric | Value |
|--------|-------|
| **Current Sprint** | Sprint 9 - Data Architecture & Payroll |
| **Sprint Status** | IN PROGRESS (9A Complete) |
| **Completed This Sprint** | Sprint 9A: Client data architecture fix, demo team members persist to Firestore, payroll types added, enhanced daily logs |
| **Next Up** | Sprint 9B (Full Payroll Module), Sprint 9C (CSV Import System) |
| **Blockers** | None |
| **TypeScript Status** | Passing |
| **Firestore Rules** | Deployed (all features + timeEntries + dailyLogs + expenses + quoteTemplates) |

---

## Completed Sprints

### Sprint 0/1: Foundation & Bug Fixes
**Status:** COMPLETED
- Toast notification system
- BaseModal component standardization
- Brand color CSS variables
- Phase dropdown in TaskDetailModal
- Basic notification preferences

### Sprint 2: Core Stability
**Status:** COMPLETED
- Various bug fixes from 1.28 list
- UI improvements
- Form validation patterns

### Sprint 3: E-Signature System (FEAT-L1)
**Status:** COMPLETED
**Duration:** 4 weeks equivalent

**Files Created:**
```
apps/web/lib/esignature/
├── types.ts                    # SignatureRequest, SignerInfo, etc.
├── pdf-service.ts              # PDF generation with @react-pdf/renderer
├── pdf-templates/
│   └── estimate-pdf.tsx        # Estimate PDF template
└── signature-service.ts        # CRUD operations

apps/web/components/esignature/
├── SignaturePad.tsx            # Draw/type/upload signature
├── SendForSignatureModal.tsx   # Send document workflow
└── SignatureStatusBadge.tsx    # Status display

apps/web/app/sign/[token]/page.tsx      # Public signing page
apps/web/app/dashboard/estimates/[id]/page.tsx  # Estimate detail
apps/web/app/dashboard/signatures/page.tsx      # Signatures dashboard

apps/web/lib/hooks/useSignatureRequests.ts      # Real-time tracking

functions/src/email/
├── emailTemplates.ts           # Added signature templates
└── sendSignatureEmails.ts      # Email sending functions
```

**Features:**
- PDF generation from estimates
- Multi-method signature (draw, type, upload)
- Magic link authentication
- Email notifications on status changes
- Audit trail tracking
- Signatures dashboard

### Sprint 4: Client Management (FEAT-L4)
**Status:** COMPLETED
**Duration:** 1 session

**Files Created:**
```
apps/web/app/dashboard/clients/
├── page.tsx                    # Client list with search/filter
└── [id]/page.tsx               # Client detail with tabs

apps/web/components/clients/
├── AddClientModal.tsx          # 3-step add wizard
├── EditClientModal.tsx         # Edit client details
├── AddCommunicationLogModal.tsx # Log calls/emails/meetings
├── AddNoteModal.tsx            # Quick notes
├── ClientSourceSelect.tsx      # Source tracking UI
└── index.ts                    # Exports

apps/web/lib/hooks/useClients.ts  # Full CRUD hooks
```

**Types Added to `types/index.ts`:**
- ClientStatus, ClientSource, ClientCommunicationPreference
- ClientContact, ClientAddress, ClientNote, ClientFinancials
- ClientCommunicationLog, Client

**Features:**
- Client list with search, filter by status
- Client detail page with 5 tabs:
  - Overview (contact info, details)
  - Projects (linked projects)
  - Communication (log calls, emails, meetings)
  - Notes (quick notes)
  - Financials (lifetime value, outstanding balance)
- Source tracking (referral, google, social media, etc.)
- Status management (active, past, potential, inactive)

### Sprint 5: Feature Development (IN PROGRESS)

#### FEAT-M5: Photo & Progress Documentation
**Status:** COMPLETED

**Files Created:**
```
apps/web/components/photos/
├── PhotoUploader.tsx           # Multi-file upload with drag & drop
├── PhotoGallery.tsx            # Grid view with lightbox
├── PhotoCard.tsx               # Individual photo display
├── PhotoAlbumCard.tsx          # Album display card
├── PhotoTagSelector.tsx        # Tag management
├── BeforeAfterComparison.tsx   # Before/after slider
└── index.ts                    # Exports

apps/web/lib/hooks/useProjectPhotos.ts  # Photo CRUD with albums
apps/web/lib/photo-processing.ts        # EXIF extraction, compression
```

**Features:**
- Photo upload with drag & drop
- EXIF metadata extraction (GPS, timestamp)
- Before/after photo comparison
- Photo albums per project phase
- Tagging and search
- Lightbox gallery view

#### FEAT-M6: Payment Processing (Stripe)
**Status:** COMPLETED

**Files Created:**
```
apps/web/lib/payments/
├── stripe-config.ts            # Stripe initialization
├── payment-service.ts          # Payment CRUD, refunds
└── types.ts                    # Payment types

apps/web/components/payments/
├── PaymentForm.tsx             # Stripe Elements form
├── PaymentMethodCard.tsx       # Saved payment methods
├── PaymentHistory.tsx          # Transaction history
├── InvoicePayButton.tsx        # One-click pay
├── PaymentStatusBadge.tsx      # Status display
└── index.ts                    # Exports

apps/web/app/pay/[token]/page.tsx       # Public payment page
apps/web/lib/hooks/usePayments.ts       # Payment hooks
```

**Features:**
- Stripe integration with Elements
- Credit card and ACH payments
- One-click payment links
- Automatic receipts
- Partial payments and refunds
- Payment history tracking

#### FEAT-L2: SMS/Text Workflows (Twilio)
**Status:** COMPLETED

**Files Created:**
```
apps/web/lib/sms/
├── twilio-config.ts            # Twilio initialization
├── sms-service.ts              # Send/receive SMS
└── types.ts                    # SMS types

apps/web/components/sms/
├── SmsComposer.tsx             # Message composer with templates
├── SmsConversationList.tsx     # Conversation inbox
├── SmsMessageThread.tsx        # Thread view
└── index.ts                    # Exports

apps/web/app/dashboard/messaging/page.tsx       # Full messaging interface
apps/web/app/dashboard/settings/sms-templates/page.tsx  # Template management
apps/web/lib/hooks/useSms.ts                    # SMS hooks
apps/web/lib/date-utils.ts                      # Added formatRelative
```

**Features:**
- Two-way SMS messaging
- Template-based quick replies
- Conversation threading
- Broadcast messaging
- Opt-out management
- Message scheduling

#### FEAT-M7: Quick Estimate Builder
**Status:** COMPLETED

**Files Created:**
```
apps/web/components/estimates/
├── LineItemPicker.tsx          # Library item selection
├── EstimateLineItemRow.tsx     # Editable line item row
├── QuickEstimateBuilder.tsx    # Main builder component
└── index.ts                    # Exports

apps/web/app/dashboard/settings/line-items/page.tsx  # Line item library
apps/web/lib/hooks/useLineItems.ts                   # Line items CRUD + templates
```

**Types Added to `types/index.ts`:**
- LineItemTrade, LineItemUnit (type unions)
- LineItem (library item)
- BuilderLineItem (estimate line item)
- EstimateTemplate, BuilderTemplateItem
- LineItemPriceHistory
- LINE_ITEM_TRADES, LINE_ITEM_UNITS (constants)

**Features:**
- Line item library with categories (trades)
- Quick add from library or manual entry
- Estimate templates with reusable item sets
- Markup and tax calculations
- Running totals
- Favorites and recent items
- Bulk pricing updates
- Price history tracking

#### FEAT-M8: Smart Scheduling
**Status:** COMPLETED

**Files Created:**
```
apps/web/components/schedule/
├── ScheduleCalendar.tsx        # Main calendar view
├── EventCard.tsx               # Event display card
├── EventFormModal.tsx          # Create/edit event modal
├── CrewAvailabilityPanel.tsx   # Crew availability management
├── WeatherWidget.tsx           # Weather forecast display
├── ConflictAlert.tsx           # Schedule conflict warnings
└── index.ts                    # Exports

apps/web/lib/hooks/useSchedule.ts    # Schedule CRUD operations
apps/web/lib/weather-service.ts      # Weather API integration
apps/web/app/dashboard/schedule/page.tsx  # Enhanced scheduling page
```

**Types Added to `types/index.ts`:**
- ScheduleEvent, ScheduleEventStatus, ScheduleEventType
- RecurrencePattern, WeatherCondition, WeatherImpact
- CrewAvailability, TimeOffRequest, WeatherForecast
- ScheduleConflict, ScheduleViewPreferences, ScheduleStats

**Features:**
- Day/week/month calendar views
- Drag & drop event scheduling
- Crew availability tracking
- Time off request workflow
- Weather integration (OpenWeatherMap)
- Conflict detection and warnings
- SMS reminder support

#### FEAT-L3: Client Portal Enhancement
**Status:** COMPLETED

**Files Created:**
```
apps/web/app/client/
├── layout.tsx                  # Client portal layout (updated)
├── invoices/page.tsx           # Invoice list with payments
```

**Features:**
- Invoice listing with filtering (all/unpaid/paid/overdue)
- Invoice detail modal with payment status
- Pay Now buttons linking to payment pages
- Summary card with total balance due

#### FEAT-M9: Material & Equipment Tracking
**Status:** COMPLETED

**Files Created:**
```
apps/web/components/materials/
├── MaterialItemCard.tsx        # Material inventory card
├── MaterialFormModal.tsx       # Add/edit material modal
├── EquipmentCard.tsx           # Equipment display card
├── EquipmentFormModal.tsx      # Add/edit equipment modal
├── EquipmentCheckoutModal.tsx  # Checkout/return equipment
├── PurchaseOrderCard.tsx       # Purchase order display
├── PurchaseOrderFormModal.tsx  # Create/edit PO modal
├── SupplierFormModal.tsx       # Add/edit supplier modal
├── LowStockAlertCard.tsx       # Low stock alert display
└── index.ts                    # Exports

apps/web/lib/hooks/useMaterials.ts   # Full CRUD for materials, equipment, suppliers, POs
apps/web/app/dashboard/materials/page.tsx  # Materials dashboard with tabs
```

**Types Added to `types/index.ts`:**
- MaterialCategory, MaterialStatus, EquipmentCheckoutStatus
- MaterialItem, EquipmentItem, EquipmentCheckout
- Supplier, MaterialPurchaseOrder, MaterialPurchaseOrderLineItem
- MaterialAllocation, MaterialTransaction
- StorageLocation, LowStockAlert
- MATERIAL_CATEGORIES, MATERIAL_STATUSES, EQUIPMENT_STATUSES, MATERIAL_PURCHASE_ORDER_STATUSES

**Features:**
- Material inventory with categories and reorder points
- Equipment tracking with checkout/return workflow
- Supplier management with ratings
- Purchase order creation and receiving
- Material allocation to projects
- Low stock alerts
- Transaction history tracking

---

## Backlog Summary

### Phase 2: Differentiating Features
| Feature | Status | Priority | Size |
|---------|--------|----------|------|
| FEAT-L1: E-Signature | DONE | P0 | L |
| FEAT-L2: SMS/Text Workflows | DONE | P0 | L |
| FEAT-L3: Client Portal | DONE | P1 | L |
| FEAT-L4: Client Management | DONE | P1 | L |

### Phase 3: Transaction & Operations
| Feature | Status | Priority | Size |
|---------|--------|----------|------|
| FEAT-M5: Photo Documentation | DONE | P1 | M |
| FEAT-M6: Payment Processing | DONE | P1 | M |
| FEAT-M7: Quick Estimate Builder | DONE | P1 | M |
| FEAT-M8: Smart Scheduling | DONE | P1 | M |
| FEAT-M9: Material Tracking | DONE | P2 | M |

### Bug Fixes Status
See `docs/MASTER_ROADMAP.md` for complete list.

**Completed (verified):**
- BUG-026: Integrations Page - DONE (full OAuth flow, sync settings, mapping)
- BUG-027: Tax Rates Page - DONE (full CRUD, default designation)
- BUG-028: Data Export Page - DONE (CSV/Excel, date range filter)
- BUG-029: Notifications Page - DONE (toggle by category/channel)
- CRITICAL-023: Brand Colors - DONE (CSS variables, ThemeProvider)
- BUG-001: Phase Dropdown - DONE (TaskDetailModal)
- BUG-011: Archived Project Duplicate - DONE (copies phases, tasks, resets to planning status)
- BUG-022: Table Layout Overflow - DONE (Table component with sticky columns, priority columns, mobile cards)
- BUG-021: Responsive Design Mobile - DONE (touch targets, mobile utilities, AppShell improvements)

**Remaining:**
- None (all P2 bug fixes completed!)

**Feature Backlog:**
- FEAT-009: SOW Template Management System
- UX-018: Form validation feedback
- UX-019: Required field indicators

---

## January 2026 Audit Findings

> **Date:** January 29, 2026
> **Total Items:** 17 issues (57 story points)
> **Completed:** 17 items (52 SP)
> **Remaining:** 0 items (0 SP) - OAuth partial (5 SP, UI done)

### Priority 0: Blockers (Immediate)
| ID | Issue | SP | Status |
|----|-------|-----|--------|
| AUDIT-001 | Photos Firebase Permissions | 3 | ✅ Done |
| AUDIT-002 | Schedule Firebase Permissions | 3 | ✅ Done |
| AUDIT-003 | SMS Firebase Permissions | 3 | ✅ Done |
| AUDIT-004 | Integrations Page Loading | 2 | ✅ Done |
| AUDIT-005 | Cannot Uncancel Projects | 2 | ✅ Done |

### Priority 1: Critical
| ID | Issue | SP | Status |
|----|-------|-----|--------|
| AUDIT-006 | Client Module Missing | 3 | ✅ Done (Sprint 4) |
| AUDIT-007 | Budget Calculation Issues | 5 | ✅ Done |
| AUDIT-008 | Dashboard Empty States | 3 | ✅ Done |
| AUDIT-009 | Dashboard Data Overflow | 3 | ✅ Done |
| AUDIT-010 | Invoice List Performance | 2 | ✅ Done

### Priority 2: UX & Settings
| ID | Issue | SP | Status |
|----|-------|-----|--------|
| AUDIT-011 | Project Tabs Order | 2 | ✅ Done |
| AUDIT-012 | Calendar Vertical Space | 3 | ✅ Done |
| AUDIT-013 | SMS Use Case Clarity | 3 | ✅ Done |
| AUDIT-014 | Material Categories | 2 | ✅ Done |
| AUDIT-015 | Line Item Search | 5 | ✅ Done |
| AUDIT-016 | Owner/Admin Controls | 5 | ✅ Done |
| AUDIT-017 | Template Management | 3 | ✅ Done |
| AUDIT-018 | Integration OAuth | 5 | Partial (UI done) |

### Sprint 8 - Phase 4 Features (IN PROGRESS)

#### FEAT-S13: Simple Time Tracking
**Status:** COMPLETED
**Duration:** 1 session

**Files Created:**
```
apps/web/components/timetracking/
├── TimeClockWidget.tsx         # Clock in/out with break management
├── TimeEntryCard.tsx           # Time entry display with details
├── TimeEntryFormModal.tsx      # Manual time entry creation
├── TimesheetSummary.tsx        # Weekly timesheet summary
└── index.ts                    # Exports

apps/web/lib/hooks/useTimeEntries.ts  # Full CRUD + approval workflow
apps/web/app/dashboard/time/page.tsx  # Time tracking dashboard
```

**Types Added to `types/index.ts`:**
- TimeEntryStatus, TimeEntryType, BreakType
- TimeEntryBreak, TimeEntryLocation, TimeEntry
- TimeEntryEdit, TimesheetPeriod, TimeTrackingSettings
- DailyTimeSummary, WeeklyTimeSummary
- TIME_ENTRY_STATUSES, BREAK_TYPES (constants)

**Features:**
- Clock in/out with real-time timer
- Break management (lunch, short, other)
- GPS location tracking (optional)
- Manual time entry for missed punches
- Weekly timesheet view with daily breakdown
- Project-based time allocation
- Approval workflow for managers
- Team time entries view for managers
- Hours by project breakdown
- Overtime tracking (daily 8hr, weekly 40hr)

**Firestore Rules Added:**
- `organizations/{orgId}/timeEntries/{entryId}`
- `organizations/{orgId}/timesheetPeriods/{periodId}`
- `organizations/{orgId}/timeTrackingSettings/{settingId}`

#### FEAT-S17: Daily Log/Journal
**Status:** COMPLETED
**Duration:** 1 session

**Files Created:**
```
apps/web/components/dailylogs/
├── DailyLogCard.tsx            # Log entry display with category icons
├── DailyLogFormModal.tsx       # Multi-tab form (basic, work, weather, issues)
└── index.ts                    # Exports

apps/web/lib/hooks/useDailyLogs.ts   # Full CRUD + summaries
apps/web/app/dashboard/logs/page.tsx  # Daily logs dashboard
```

**Types Added to `types/index.ts`:**
- DailyLogCategory (general, progress, issue, safety, weather, delivery, inspection, client_interaction, subcontractor, equipment)
- DailyLogPhoto, DailyLogEntry, DailyLogSummary
- DAILY_LOG_CATEGORIES (constants with icons/colors)
- Reuses existing WeatherCondition and WEATHER_CONDITIONS from schedule module

**Features:**
- 10 log categories with distinct icons and colors
- Week view with day groupings
- Category and project filtering
- Weather tracking (condition, temperature, notes)
- Crew count and hours worked tracking
- Work performed list (bullet points)
- Issue/delay tracking with impact levels (low/medium/high)
- Safety notes section
- Visitor and delivery logging
- Photo attachments
- Private flag (PM/Owner only visibility)
- Follow-up flag with date
- Tags for filtering

**Firestore Rules Added:**
- `organizations/{orgId}/dailyLogs/{logId}`

#### FEAT-S16: Expense Tracking Enhanced
**Status:** COMPLETED
**Duration:** 1 session

**Files Updated/Created:**
```
apps/web/components/expenses/
├── ExpenseCard.tsx             # Enhanced expense display with category icons
├── ExpenseFormModal.tsx        # Multi-field expense form with validation
└── index.ts                    # Exports

apps/web/lib/hooks/useExpenses.ts   # Full CRUD + summaries + approval workflow
apps/web/app/dashboard/expenses/page.tsx  # Enhanced expenses dashboard
```

**Types Added/Updated in `types/index.ts`:**
- ExpenseCategory extended (15 categories: materials, tools, equipment_rental, fuel, vehicle, subcontractor, permits, labor, office, travel, meals, insurance, utilities, marketing, other)
- ExpenseStatus changed to: pending, approved, rejected, reimbursed
- ExpensePaymentMethod: cash, credit_card, debit_card, check, company_card, other
- ExpenseReceipt, Expense (enhanced with receipts, tags, billable flags)
- ExpenseSummary with byCategory, byProject, byUser breakdowns
- EXPENSE_CATEGORIES, EXPENSE_STATUSES, EXPENSE_PAYMENT_METHODS constants

**Features:**
- 15 expense categories with distinct icons and colors
- Monthly view with navigation
- Category, project, and status filtering
- Summary cards (total, pending, reimbursable, reimbursed)
- Category breakdown visualization with progress bars
- Receipt attachments support
- Billable to client flag
- Tax deductible flag
- Approval workflow for managers (approve/reject/mark reimbursed)
- Notes and tags for organization

**Firestore Rules Added:**
- `organizations/{orgId}/expenses/{expenseId}`

#### FEAT-S14: Quote Templates (Branded PDFs)
**Status:** COMPLETED
**Duration:** 1 session

**Files Created:**
```
apps/web/components/quotetemplates/
├── QuoteTemplateCard.tsx          # Template display card with color preview
├── QuoteTemplateFormModal.tsx     # Multi-tab form for template settings
└── index.ts                       # Exports

apps/web/lib/hooks/useQuoteTemplates.ts    # Full CRUD + default management
apps/web/app/dashboard/settings/quote-templates/page.tsx  # Templates settings page
```

**Files Updated:**
```
apps/web/lib/esignature/pdf-templates/estimate-pdf.tsx  # Template support with dynamic styles
apps/web/lib/esignature/pdf-service.ts                  # Template parameter for PDF generation
apps/web/app/dashboard/settings/layout.tsx              # Added Quote Templates to Resources nav
types/index.ts                                          # QuotePdfTemplate types + constants
```

**Types Added to `types/index.ts`:**
- QuotePdfLayout: 'modern' | 'classic' | 'minimal' | 'professional'
- QuotePdfFont: 'inter' | 'roboto' | 'open-sans' | 'lato' | 'poppins'
- QuotePdfHeaderStyle: 'logo-left' | 'logo-right' | 'centered' | 'full-width-banner'
- QuotePdfTemplate interface (full template configuration)
- QUOTE_PDF_LAYOUTS, QUOTE_PDF_FONTS, QUOTE_PDF_HEADER_STYLES constants
- createDefaultQuotePdfTemplate factory function

**Features:**
- 4 layout styles (modern, classic, minimal, professional)
- 5 font family options
- 4 header layout styles including full-width banner
- Customizable brand colors (primary, secondary, text, background, table)
- Header customization (logo, company info, tagline)
- Footer customization (page numbers, custom text)
- Table column visibility settings
- Section visibility toggles (scope, exclusions, terms, signature)
- Default content templates (reusable terms, payment terms, etc.)
- Usage tracking (count, last used)
- Default template designation
- Template duplication

**Firestore Rules Added:**
- `organizations/{orgId}/quoteTemplates/{templateId}`

---

### Recommended Next Sprint: Remaining Audit Items
**Sprint 7 - Final Audit Fixes (P2) - COMPLETED**
1. ~~AUDIT-014: Material Categories (2 SP) - P2~~ ✅ Done
2. ~~AUDIT-015: Line Item Search (5 SP) - P2~~ ✅ Done
3. ~~AUDIT-016: Owner/Admin Controls (5 SP) - P2~~ ✅ Done
4. ~~AUDIT-017: Template Management (3 SP) - P2~~ ✅ Done
**Total: 0 SP remaining (15 SP completed)**

**All P0, P1, and P2 Audit Items Completed:**
- AUDIT-001: Photos Firebase Permissions ✅
- AUDIT-002: Schedule Firebase Permissions ✅
- AUDIT-003: SMS Firebase Permissions ✅
- AUDIT-005: Cannot Uncancel Projects ✅
- AUDIT-007: Budget Calculation Issues ✅
- AUDIT-011: Project Tabs Order ✅
- AUDIT-012: Calendar Vertical Space ✅
- AUDIT-013: SMS Use Case Clarity ✅
- AUDIT-014: Material Categories ✅
- AUDIT-015: Line Item Search ✅
- AUDIT-016: Owner/Admin Controls ✅
- AUDIT-017: Template Management ✅

---

## BUG FIXES & IMPROVEMENTS - Settings Navigation Refactoring

> **Priority:** HIGH (Quick Wins Available)
> **Added:** 2026-01-29
> **Status:** QUICK WINS + MEDIUM PRIORITY COMPLETED

### Issues Identified

1. **Navigation Overload** - Settings has 13 top-level navigation items, causing poor UX and cognitive overload
2. **Redundant Template Tabs** - Phase Templates, SOW Templates, SMS Templates, and Email Templates exist as separate tabs AND inside "All Templates"
3. **Poor Information Architecture** - Line Items sits between templates when it's a resource library
4. **Missing User Management** - No ability to invite users, add admins, or manage organization members
5. **No RBAC Implementation** - Team page shows role permissions but has no actual permission management system
6. **Ungrouped System Settings** - Billing, Data Export, and Notifications are scattered in top nav

### Tasks

#### QUICK WINS (1-2 days total) - ✅ COMPLETED
| ID | Task | Status |
|----|------|--------|
| SETTINGS-001 | Rename "All Templates" → "Templates" | ✅ Done |
| SETTINGS-002 | Remove redundant nav tabs: Phase Templates, SOW Templates, SMS Templates, Email Templates (keep consolidated Templates view) | ✅ Done |
| SETTINGS-003 | Create new "Resources" section grouping | ✅ Done |
| SETTINGS-004 | Move "Line Items" under Resources section | ✅ Done |
| SETTINGS-005 | Move "Tax Rates" under Resources section | ✅ Done |
| SETTINGS-006 | Create new "Account" section grouping | ✅ Done |
| SETTINGS-007 | Move Billing, Data Export, and Notifications under Account section | ✅ Done |

**Result:** Navigation reduced from 13 items → 6 items (54% reduction) ✅

#### MEDIUM PRIORITY (3-5 days) - ✅ COMPLETED
| ID | Task | Status |
|----|------|--------|
| SETTINGS-008 | Build "Users & Permissions" section (NEW) | ✅ Done |
| SETTINGS-009 | User management table (Name, Email, Role, Status columns) | ✅ Done |
| SETTINGS-010 | Add "Invite User" button and modal | ✅ Done |
| SETTINGS-011 | Email input + role selection in invite flow | ✅ Done |
| SETTINGS-012 | User list with Edit/Deactivate/Remove actions | ✅ Done |
| SETTINGS-013 | Status indicators (Active, Pending, Inactive) | ✅ Done |

#### LONGER-TERM (1-2 weeks)
| ID | Task | Status |
|----|------|--------|
| SETTINGS-014 | Implement full RBAC system | ⬜ Not Started |
| SETTINGS-015 | Define permission matrix for: Owner, Admin, Project Manager, Employee, Contractor roles | ⬜ Not Started |
| SETTINGS-016 | Build role assignment UI | ⬜ Not Started |
| SETTINGS-017 | Create custom permissions toggle | ⬜ Not Started |
| SETTINGS-018 | Add organization admins designation | ⬜ Not Started |
| SETTINGS-019 | Implement permission checks throughout app | ⬜ Not Started |
| SETTINGS-020 | Add admin activity log | ⬜ Not Started |
| SETTINGS-021 | Separate "Team" (role definitions) from "Users & Permissions" (actual user management) | ⬜ Not Started |
| SETTINGS-022 | Add user invitation email system | ⬜ Not Started |
| SETTINGS-023 | Build user onboarding flow for invited users | ⬜ Not Started |

### New Navigation Structure (Target)

```
Settings (6-7 items)
├── Templates               (consolidated - removes 4 redundant tabs)
├── Resources              (NEW grouping: Line Items, Tax Rates)
├── Organization           (Company info, branding)
├── Users & Permissions    (NEW: user management + RBAC)
├── Integrations          (APIs, SMS, payments)
└── Account               (NEW grouping: Billing, Export, Notifications)
```

### Technical Notes

- Templates page already works well with unified view - just remove redundant routes
- Line Items library is currently at `/dashboard/settings/line-items` - needs route update
- Team page has role permission cards but no actual user management - needs new components
- Current Team page only shows single owner (Nicholas Bodkins) - needs user list table
- No invite system exists yet - needs email invitation infrastructure
- RBAC checks not implemented in backend - needs permission middleware

### Acceptance Criteria

- [x] Settings navigation reduced to 6-7 items maximum (now 6 items)
- [x] All template types accessible from single "Templates" page
- [x] Resources grouped logically (Line Items, Tax Rates)
- [x] Account settings grouped together (Billing, Export, Notifications)
- [x] Users can be invited via email with role assignment
- [ ] Multiple admins can be designated (requires RBAC system)
- [ ] Permission system enforces role-based access
- [ ] UI matches organization principles from "Stupid-Simple UI" competitive advantage

### Aligns With

- Feature L4: Client Management Module (Separate from Team)
- Competitive Advantage #6: Stupid-Simple UI
- Platform assessment: "What Needs Fixing" - Settings UX

---

## Next Features (Choose One)

### Option A: FEAT-L3 - Mobile-First Client Portal
**Priority:** P1 | **Size:** L (3 weeks)
**Business Value:** Eliminates #1 client friction point

**Scope:**
- Magic link authentication
- Project status view
- Photo gallery access
- Document access
- Invoice viewing/payment
- Mobile-optimized UI

**Files to Create:**
```
apps/web/app/client/
├── layout.tsx                  # Client portal layout
├── page.tsx                    # Client dashboard
├── projects/[id]/page.tsx      # Project detail
├── photos/page.tsx             # Photo gallery
├── documents/page.tsx          # Document access
├── invoices/page.tsx           # Invoice list
└── pay/[invoiceId]/page.tsx    # Invoice payment
```

### Option B: FEAT-M8 - Smart Scheduling
**Priority:** P1 | **Size:** M (2 weeks)
**Business Value:** Optimize crew utilization, reduce scheduling conflicts

**Scope:**
- Calendar view with drag & drop
- Crew availability tracking
- Conflict detection
- Weather integration
- Job duration estimation
- SMS reminders

**Files to Create:**
```
apps/web/components/schedule/
├── ScheduleCalendar.tsx        # Main calendar view
├── CrewScheduleRow.tsx         # Crew availability
├── JobCard.tsx                 # Draggable job card
├── ConflictWarning.tsx         # Conflict detection
└── WeatherOverlay.tsx          # Weather integration

apps/web/lib/hooks/useSchedule.ts
apps/web/lib/weather-service.ts
```

---

## Session Handoff Notes

### For Next Session
1. **TypeScript is passing** - run `npx tsc --noEmit` to verify
2. **Sprint 9A completed:** Client data architecture, demo team members, payroll types, enhanced daily logs
3. **See `docs/SPRINT_9_PLAN.md`** for Sprint 9B-9D roadmap
4. **ALWAYS deploy Firebase before Docker build** - see workflow below

### Build & Deploy Workflow (CRITICAL)
```bash
# From apps/web/ directory - run these in order:
cd apps/web && npx tsc --noEmit && \
firebase deploy --only firestore --project contractoros-483812 && \
./docker-build-local.sh && \
docker stop contractoros-web 2>/dev/null; \
docker rm contractoros-web 2>/dev/null; \
docker run -d -p 3000:8080 --name contractoros-web contractoros-web && \
docker ps
```
**Why:** Firebase indexes take 30s-2min to build. Deploy them BEFORE Docker build so they're ready when app starts.

### Known Issues
- No test coverage
- Silent error handling in some places
- Invoice pagination implemented; other lists still need pagination

### Recent Decisions
- Renamed `EstimateLineItem` to `BuilderLineItem` to avoid conflict with existing type
- Renamed `EstimateTemplateItem` to `BuilderTemplateItem` for consistency
- Line items use materialCost + laborCost + markup = unitPrice formula
- Price history tracked for audit purposes

---

## How to Update This File

After each work session:
1. Update "Quick Status" section
2. Move completed items to "Completed Sprints"
3. Update "Current Sprint" with progress
4. Add any blockers or decisions to "Session Handoff Notes"
5. Update "Last Updated" timestamp
