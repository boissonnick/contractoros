# ContractorOS Sprint Status

> **Purpose:** Track current progress and enable seamless session handoffs.
> **Last Updated:** 2026-01-30 by Claude Opus 4.5 (Sprint 13: Field Operations)
> **Current Phase:** Phase 4 - Efficiency & Scale (Platform Hardening Complete)

---

## Quick Status

| Metric | Value |
|--------|-------|
| **Current Sprint** | Sprint 13 - Field Operations |
| **Sprint Status** | COMPLETED |
| **Completed This Sprint** | Time entry fixes, team location tracking, vehicle tracking, weather risk assessment |
| **Next Up** | Client Self-Scheduling / Integration OAuth |
| **Blockers** | None |
| **TypeScript Status** | Passing |
| **Firestore Rules** | Deployed (includes auditLog collection) |

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

### Sprint 9B: Full Payroll Module
**Status:** COMPLETED
**Duration:** 1 session

**Files Created/Updated:**
```
apps/web/lib/payroll/
├── pay-stub-pdf.tsx            # Pay stub PDF generation with @react-pdf/renderer
├── payroll-service.ts          # Already exists - payroll CRUD, calculations
└── tax-calculator.ts           # Already exists - federal/state tax estimation

apps/web/components/payroll/
├── PayrollRunCard.tsx          # Payroll run summary card (already exists)
├── PayrollEntryRow.tsx         # Employee entry with hours/earnings/deductions (already exists)
├── PayrollPreview.tsx          # Full payroll run detail view (already exists)
├── CreatePayrollModal.tsx      # 3-step wizard to create payroll run (already exists)
└── index.ts                    # Exports

apps/web/app/dashboard/payroll/page.tsx  # Payroll dashboard (updated with pay stub generation)
apps/web/app/dashboard/settings/payroll/page.tsx  # Payroll settings (already exists)
```

**Types (already in types/index.ts):**
- PayrollRun, PayrollEntry, PayPeriod, PaySchedule
- PayrollSettings, PayrollAdjustment, TaxCalculation
- PayStub (for PDF generation)
- PAYROLL_RUN_STATUSES, PAYROLL_ADJUSTMENT_TYPES, TAX_RATES constants

**Features:**
- Complete payroll dashboard with summary cards (gross, net, runs, employees)
- Create payroll run wizard (select pay period, employees, review)
- Payroll run detail view with employee breakdown
- Hours breakdown (regular, overtime, double-time, PTO, sick)
- Tax calculation (federal, state, SS, Medicare estimates)
- Adjustments (bonuses, reimbursements, deductions)
- YTD totals tracking
- Approval workflow (draft → pending_approval → approved → completed)
- CSV export for external payroll systems
- PDF pay stub generation per employee
- Tax disclaimer throughout

**Firestore Rules (already deployed):**
- `organizations/{orgId}/payrollRuns/{runId}` - admin only
- `organizations/{orgId}/payrollSettings/{settingId}` - admin only

---

### Sprint 9C: CSV Import System
**Status:** COMPLETED
**Duration:** 1 session

**Files Created:**
```
apps/web/lib/import/
├── types.ts                    # ImportJob, ColumnMapping, FieldDefinition, validation types
├── csv-parser.ts               # CSV parsing with auto-delimiter detection
├── column-mapper.ts            # Auto-mapping with fuzzy header matching
├── validators.ts               # Data type validation (email, phone, date, etc.)
└── import-service.ts           # Firestore import execution, rollback support

apps/web/components/import/
├── FileUploader.tsx            # Drag & drop file upload
├── DataPreview.tsx             # Tabular preview with error highlighting
├── ColumnMapper.tsx            # Column-to-field mapping interface
├── ValidationReport.tsx        # Error summary with grouped details
├── ImportProgress.tsx          # Progress bar with result summary
└── index.ts                    # Exports

apps/web/app/dashboard/settings/import/page.tsx  # Multi-step import wizard
```

**Types Added to lib/import/types.ts:**
- ImportStatus, ImportTarget, ColumnDataType, ColumnTransform
- ColumnMapping, FieldDefinition, ImportValidationError, ParsedRow
- ImportJob, ImportSummary
- IMPORT_FIELD_DEFINITIONS (clients, projects, contacts, communication_logs)
- IMPORT_TARGET_INFO, IMPORT_STATUS_INFO, HEADER_ALIASES (auto-mapping)

**Features:**
- Multi-step import wizard (select target → upload → map → validate → import)
- Drag & drop CSV file upload
- Auto-delimiter detection (comma, semicolon, tab, pipe)
- Smart column auto-mapping with fuzzy header matching
- Common header aliases (e.g., "phone number" → phone, "email address" → email)
- Data type validation (string, email, phone, date, number, currency, boolean, enum)
- Real-time validation with error/warning severity
- Preview first 10 rows with error highlighting
- Import targets: Clients, Projects, Contacts, Communication Logs
- Client lookup for linking projects/contacts/logs
- Batch processing (500 records per batch)
- Progress tracking during import
- Import job history in Firestore
- Rollback support (stores created record IDs)

**Import Field Definitions:**
- Clients: name*, email, phone, company, address, status, source, notes
- Projects: name*, clientEmail, address, budget, status, dates, description
- Contacts: name*, email, phone, role, clientEmail, isPrimary, notes
- Communication Logs: date*, type*, clientEmail, summary*, notes, direction

**Firestore Rules Added:**
- `organizations/{orgId}/importJobs/{jobId}` - admin only

---

### Sprint 9E: Security Hardening (Phase 1 & 2)
**Status:** COMPLETED
**Duration:** 2 sessions

**Summary:** Comprehensive platform security audit and hardening - ensuring ALL Firestore collections have proper org-scoped security rules.

**Phase 1 - Critical Issues Fixed:**

1. **Missing Firestore Rules (CRITICAL):**
   - `messageChannels` - Had NO security rules, allowing unauthorized access
   - `toolCheckouts` - Had NO security rules, allowing unauthorized access
   - Added proper org-scoped rules with appropriate RBAC

2. **Cross-Organization Data Exposure in Hooks (CRITICAL):**
   - `useReports.ts` - Fixed 3 instances of root-level `timeEntries` to use `organizations/${orgId}/timeEntries`
   - `useClients.ts` - Fixed `invoices` collection to use `organizations/${orgId}/invoices`
   - `usePayments.ts` - Fixed `payments` collection to use `organizations/${orgId}/payments`

**Phase 2 - Comprehensive Rule Hardening:**

Updated ALL root-level collections to enforce `orgId` checking in Firestore rules:

| Collection | Previous Rule | Fixed Rule |
|------------|--------------|------------|
| `tasks` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `timeEntries` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `bids` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `invoices` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `photos` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `issues` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `dailyLogs` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `scheduleItems` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `scheduleAssignments` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `availabilityDefaults` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `availability` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `scopes` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `subcontractors` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `sub_assignments` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `changeOrders` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `bidSolicitations` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `sowTemplates` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `activityLog` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `expenses` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `rfis` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `punchItems` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `change_orders` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `estimates` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `weeklyTimesheets` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `geofences` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `financials` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `integrations` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `submittals` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `selections` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |
| `beforeAfterPairs` | `isAuthenticated()` | `resource.data.orgId == getUserProfile().orgId` |

**New Collections Added (were missing entirely):**
- `safetyInspections` - org-scoped read/write
- `safetyIncidents` - org-scoped read/write
- `toolboxTalks` - org-scoped read/write
- `messages` (root-level) - org-scoped read/write

**Phase 3 - Additional Missing Rules:**

Added rules for collections that were completely missing from firestore.rules:

| Collection | Description | Fixed |
|------------|-------------|-------|
| `tools` | Equipment inventory tracking | ✅ Added org-scoped rules |
| `leads` | Sales pipeline management | ✅ Added org-scoped rules |
| `serviceTickets` | Maintenance/support requests | ✅ Added org-scoped rules |
| `subAssignments` | Subcontractor assignments (camelCase version) | ✅ Added org-scoped rules |

**Hook Fixes:**
- `useGeofences.ts` - Fixed `createGeofence` to automatically include `orgId` (was missing)

**Phase 4 - API Route Security:**

Added authentication to all sensitive API routes:

| File | Changes |
|------|---------|
| `lib/api/auth.ts` | NEW - Authentication helper with `verifyAuth()`, `verifyOrgAccess()`, `verifyAdminAccess()` |
| `api/payments/route.ts` | Added auth verification for POST and GET |
| `api/payments/[id]/refund/route.ts` | Added auth + admin verification |
| `api/sms/route.ts` | Added auth verification for POST and GET |

**API Security Features:**
- Token-based authentication via Firebase Admin SDK
- Org-scoping: Users can only access data from their organization
- Role-based access: Admin endpoints check for OWNER/PM role
- Proper error responses (401 for auth failures, 403 for access denied)

**Webhook Security:**
- ✅ Stripe webhook: Already uses signature verification
- ⚠️ Twilio webhook: Missing signature verification (TODO)
- ✅ Payment link routes: Intentionally public (token-based access for clients)

**Security Status:**
- ✅ ALL root-level collections now enforce org-scoping
- ✅ All hooks use proper collection paths or have rule-level protection
- ✅ All write operations include orgId
- ✅ All sensitive API routes now require authentication
- ✅ TypeScript passing
- ✅ Firestore rules deployed and active (3 deployments total)

---

### Sprint 11: RBAC System
**Status:** COMPLETED
**Duration:** 1 session (January 30, 2026)

**Files Created:**
```
apps/web/components/auth/
├── PermissionGuard.tsx             # UI element protection based on permissions
├── RouteGuard.tsx                  # Route protection with access denied page
└── index.ts                        # Exports

apps/web/lib/audit.ts               # Audit logging service for security events
apps/web/lib/hooks/useAuditLog.ts   # Hook for audit log read + logging helpers

apps/web/app/dashboard/settings/roles/page.tsx  # Roles & Permissions page
```

**Files Updated:**
```
apps/web/app/dashboard/settings/team/page.tsx   # Added audit logging for role/user changes
apps/web/app/dashboard/settings/layout.tsx      # Added RouteGuard + Team dropdown with Roles link
firestore.rules                                  # Added auditLog collection rules
```

**Components Created:**
- `PermissionGuard` - Conditionally renders children based on permissions (single, all, any)
- `RouteGuard` - Protects routes with access denied page
- `AdminRouteGuard`, `OwnerOnlyRouteGuard`, `FinanceRouteGuard`, `SettingsRouteGuard` - Pre-configured guards
- `useCanAccess`, `useCanAccessAll`, `useCanAccessAny` - Permission check hooks
- `withPermission` - HOC for wrapping components

**Audit Log Features:**
- 18 audit event types covering security-sensitive actions
- Role changes, user management, impersonation, data exports
- Severity levels: info, warning, critical
- Immutable logs (no update/delete allowed)
- Admin-only read access

**Roles & Permissions Page Features:**
- Permission matrix view showing all 41 permissions across 6 roles
- Collapsible permission categories (9 categories)
- Role summary cards with permission counts
- Audit log tab showing recent security events
- Visual indicators for admin roles

**Firestore Rules Added:**
- `auditLog/{logId}` - Admin-only read, authenticated create, immutable

---

### Sprint 12: Reporting Dashboards
**Status:** COMPLETED
**Duration:** 1 session (January 30, 2026)

**Files Created:**
```
apps/web/components/charts/
├── types.ts                        # ChartConfig, DEFAULT_COLORS, CHART_DEFAULTS
├── ChartTooltip.tsx               # Reusable tooltip component
├── ChartLegend.tsx                # Reusable legend component
├── AreaChartCard.tsx              # Area chart with card wrapper
├── BarChartCard.tsx               # Bar chart with horizontal/stacked options
├── PieChartCard.tsx               # Pie/donut chart with labels
├── LineChartCard.tsx              # Line chart with dots and curves
└── index.ts                       # Exports

apps/web/app/dashboard/reports/
├── layout.tsx                     # Tab navigation (Overview, Financial, Operational, Detailed)
├── page.tsx                       # Overview dashboard with KPIs and charts
├── financial/page.tsx             # Financial analytics (expenses, revenue, profitability)
├── operational/page.tsx           # Operational metrics (timelines, tasks, hours)
└── detailed/page.tsx              # Legacy detailed reports (moved from original page)
```

**Files Updated:**
```
apps/web/lib/hooks/useReports.ts   # Enhanced with dashboard hooks:
                                   # - useDashboardReports (KPIs, project status, revenue trends)
                                   # - useFinancialReports (expenses, invoices, profitability)
                                   # - useOperationalReports (timelines, tasks, hours)
```

**New Libraries:**
- `recharts` - React charting library for data visualization

**Dashboard Features:**

**Overview Tab:**
- 8 KPI cards (Active Projects, Revenue, Outstanding Invoices, Hours, Expenses, etc.)
- Revenue vs Expenses area chart (6 months)
- Projects by Status pie chart
- Revenue Trend bar chart
- Team Performance bar chart (hours logged)
- Team Productivity table with efficiency metrics

**Financial Tab:**
- 6 Financial KPI cards (Revenue, Expenses, Gross Profit, Margin, Budget, Cash Flow)
- Expenses by Category pie chart
- Invoice Aging bar chart
- Project Profitability table with variance and budget progress bars
- Invoice Aging Summary grid

**Operational Tab:**
- 6 Operational KPI cards (Avg Duration, On-Time Rate, Subs, Change Orders, etc.)
- Tasks by Status pie chart
- Hours by Project bar chart
- Active Project Timelines visualization
- Task Status Breakdown grid

**Detailed Reports Tab:**
- Original reports functionality preserved (Labor Costs, P&L, Productivity, Payroll)
- Date range filtering
- CSV export

**TypeScript Status:** Passing

---

### Sprint 13: Field Operations
**Status:** COMPLETED
**Duration:** 1 session (January 30, 2026)

**Focus:** Fix time clock issues, team location tracking, vehicle tracking, weather risk assessment

**Files Created:**
```
apps/web/lib/hooks/useTeamLocations.ts    # Team location + vehicle tracking hooks
apps/web/lib/hooks/useWeatherRisk.ts      # Weather risk assessment hooks

apps/web/components/tracking/
├── TeamMapView.tsx                       # Team locations display component
└── index.ts                              # Exports

apps/web/components/weather/
├── WeatherRiskBadge.tsx                  # Risk level badge component
├── WeatherForecastCard.tsx               # Daily forecast card
├── ProjectWeatherWidget.tsx              # Project weather widget
├── PhaseWeatherRisk.tsx                  # Phase-specific risk display
└── index.ts                              # Exports
```

**Files Updated:**
```
apps/web/app/field/page.tsx               # Fixed collection paths to org-scoped
apps/web/lib/weather-service.ts           # Enhanced with project/phase risk assessment:
                                          # - assessTradeWeatherRisk()
                                          # - assessProjectWeatherRisk()
                                          # - assessPhaseWeatherRisk()
                                          # - createProjectWeatherForecast()
                                          # - Trade-specific thresholds
apps/web/types/index.ts                   # Added location tracking + weather risk types
```

**Types Added to `types/index.ts`:**
- TeamMemberLocation (GPS tracking, status, vehicle assignment)
- VehicleLocation (position, speed, heading, status)
- Vehicle (with type, license plate, GPS tracker status)
- LocationHistory (position history tracking)
- WeatherRiskLevel, WeatherRiskAssessment, WeatherRiskFactor
- DailyWeatherForecast, ProjectWeatherForecast
- VEHICLE_TYPES, LOCATION_STATUS_LABELS constants
- TRADE_WEATHER_THRESHOLDS (roofing, concrete, painting, etc.)
- WEATHER_RISK_LEVELS constant
- Phase alias for ProjectPhase

**Time Entry Fix:**
- Fixed field/page.tsx to use org-scoped `organizations/${orgId}/timeEntries`
- Was using top-level `timeEntries` causing cross-org data exposure

**Team Location Tracking Features:**
- useTeamLocations hook with real-time subscription
- useVehicles hook for vehicle fleet management
- useLocationTracking hook for continuous GPS updates
- Location history tracking
- Active/idle/offline status detection
- Vehicle assignment to team members

**Weather Risk Assessment Features:**
- Trade-specific weather thresholds (10 trades defined)
- Risk levels: none, low, moderate, high, severe
- Risk factors: temperature, precipitation, wind, humidity, storm, snow, heat, cold
- Recommended actions based on risk factors
- Estimated delay hours calculation
- Should-pause-work flag for severe conditions
- Project and phase-level risk assessment
- 5-day forecast with daily risk levels

**Component Features:**
- TeamMapView: Team/vehicle list with status indicators
- WeatherRiskBadge: Color-coded risk level display
- WeatherForecastCard: Compact/full forecast display
- ProjectWeatherWidget: Full weather widget for project pages
- PhaseWeatherRisk: Phase-specific risk with recommendations

**TypeScript Status:** Passing

---

### Sprint 10: Core Feature Completion
**Status:** COMPLETED
**Duration:** 1 session

#### Warranty Tracking
**Status:** COMPLETED

**Files Created:**
```
apps/web/lib/hooks/useWarranties.ts      # Full CRUD + claims + stats
apps/web/app/dashboard/warranties/page.tsx  # Warranties dashboard
apps/web/components/warranties/
├── AddWarrantyModal.tsx                 # Add warranty form
├── EditWarrantyModal.tsx                # Edit warranty form
├── WarrantyClaimsModal.tsx              # Manage warranty claims
└── index.ts                             # Exports
```

**Types Added to `types/index.ts`:**
- WarrantyStatus: 'active' | 'expiring_soon' | 'expired' | 'claimed'
- WarrantyItem (with category, projectName, warrantyNumber, contactPhone, contactEmail, notes)
- WarrantyClaim (with referenceNumber)

**Features:**
- Warranty list with search and status filter
- Stats dashboard (active, expiring soon, expired, claims)
- Add/Edit warranty with full form validation
- Claims management (file claim, resolve claim)
- Project association
- Document URL support
- Contact information storage

**Firestore Rules Added:**
- `organizations/{orgId}/warranties/{warrantyId}` - org-scoped read/write

---

#### Permit Tracking
**Status:** COMPLETED

**Files Created:**
```
apps/web/lib/hooks/usePermits.ts         # Full CRUD + inspections + stats
apps/web/app/dashboard/permits/page.tsx  # Permits dashboard
apps/web/components/permits/
├── AddPermitModal.tsx                   # Add permit form
├── EditPermitModal.tsx                  # Edit permit form
├── PermitInspectionsModal.tsx           # Manage inspections
└── index.ts                             # Exports
```

**Types Added to `types/index.ts`:**
- PermitStatus: 'draft' | 'submitted' | 'under_review' | 'approved' | 'denied' | 'expired' | 'closed'
- PermitType: 'building' | 'electrical' | 'plumbing' | 'mechanical' | 'demolition' | 'grading' | 'fence' | 'sign' | 'other'
- Permit (full permit tracking with fees, inspections, contacts)
- PermitInspection (with status, notes, inspector)

**Features:**
- Permit list with search and type/status filters
- Stats dashboard (submitted, under review, approved, denied)
- Add/Edit permit with full form validation
- Inspection scheduling and tracking
- Fee tracking with payment dates
- Project association
- Document URL support
- Jurisdiction tracking

**Firestore Rules Added:**
- `organizations/{orgId}/permits/{permitId}` - org-scoped read/write

---

#### Leads Enhancement
**Status:** COMPLETED

**Files Created:**
```
apps/web/components/leads/
├── AddLeadModal.tsx                     # Add lead form with validation
└── index.ts                             # Exports
```

**Files Updated:**
- `apps/web/app/dashboard/leads/page.tsx` - Connected Add Lead button to modal

**Features:**
- Add lead modal with full form validation
- Fields: name, email, phone, company, source, status, estimated value, notes
- Lead source tracking (referral, website, google, social media, etc.)
- Pipeline status management

---

### Sprint 9 - Core Functionality Verification (January 30, 2026)

**Discovery:** Sprint 9D Crew Scheduling was already implemented with:
- `useScheduleEvents` - Full CRUD for schedule events with conflict detection
- `useCrewAvailability` - Crew availability management
- `useTimeOffRequests` - Time-off request workflow with submit/approve/deny
- `CrewAvailabilityPanel` - UI for managing availability and time-off requests
- `ConflictAlert` - Conflict detection and display

**Also Verified Already Complete:**
- ✅ UX-018: Form Validation Feedback (FormField.tsx with inline errors)
- ✅ UX-019: Required Field Indicators (red asterisks in FormField.tsx)
- ✅ RF-001/002/003: Toast, FormField, BaseModal components

**Added Route-Level Error Boundaries:**

| File | Purpose |
|------|---------|
| `app/error.tsx` | Global error boundary with try again + go home |
| `app/not-found.tsx` | 404 page with navigation suggestions |
| `app/loading.tsx` | Global loading spinner |
| `app/dashboard/error.tsx` | Dashboard-specific error handling |
| `app/dashboard/loading.tsx` | Dashboard skeleton loading state |
| `app/client/error.tsx` | Client portal error page |
| `app/field/error.tsx` | Field portal error (dark theme) |
| `app/sub/error.tsx` | Subcontractor portal error page |

**Also Verified Already Complete:**
- ✅ UX-012: Tags Feature - `TagInput.tsx` has autocomplete, colors, max tags, suggestions
- ✅ FEAT-009: SOW Template Management - Full CRUD with duplicate, item ordering, phases

**Remaining Core Functionality Items:**
- RF-004: AuthProvider Architecture refactoring
- AUDIT-018: Integration OAuth flows (partial - UI done, need actual OAuth)
- Twilio webhook signature verification (security TODO)

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
2. **Sprint 9A, 9B, 9C completed:** Payroll module + CSV Import System
3. **See `docs/SPRINT_9_PLAN.md`** for Sprint 9D (Crew Scheduling Enhancement)
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

### Recent Decisions (Sprint 9B & 9C)
- PayStub PDF generation uses @react-pdf/renderer with Inter font
- Pay stub includes current period earnings/deductions AND YTD totals
- Tax calculations are estimates only - disclaimers shown throughout
- Payroll runs have approval workflow: draft → pending_approval → approved → completed
- CSV export available for integration with external payroll (Gusto, ADP, QuickBooks)
- CSV import uses fuzzy header matching with HEADER_ALIASES for auto-mapping
- Import wizard validates data types before import, skips invalid rows
- Import jobs stored in Firestore for history and potential rollback
- Batch processing (500 records) prevents Firestore write limits

---

## How to Update This File

After each work session:
1. Update "Quick Status" section
2. Move completed items to "Completed Sprints"
3. Update "Current Sprint" with progress
4. Add any blockers or decisions to "Session Handoff Notes"
5. Update "Last Updated" timestamp
