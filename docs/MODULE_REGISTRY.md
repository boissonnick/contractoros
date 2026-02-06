# ContractorOS Module Registry

**Last Updated:** 2026-02-06 (Sprint 113 - added lib/utils/logger.ts structured logger, no-console ESLint rule, 377 files migrated)
**Purpose:** Fast codebase navigation - eliminates 200k+ token waste from Explore agents
**Usage:** Check this file BEFORE running Explore agents at sprint start

**⚠️ IMPORTANT:** These Explore agents just wasted 197.6k tokens (Reports: 78.7k, Notifications: 84.3k, Package check: 34.6k). The information they discovered was ALREADY in this registry. Always check this file first!

---

## ⚡ Quick Start: Sprint Planning

**ALWAYS check this registry FIRST before exploring:**

1. Find your feature in "Quick Lookup by Feature" table
2. Get hook/page/component file paths
3. Start work immediately (no Explore agents needed!)

**Token cost:**
- Checking this registry: **5k tokens**
- Running Explore agents: **200k+ tokens**
- **Savings: ~195k tokens per sprint**

---

## Quick Lookup by Feature

**Most Common Features** (alphabetical):

| Feature | Hook | Page | Key Components | Pattern |
|---------|------|------|----------------|---------|
| **Activity Logs** | useActivityLog | activity/page.tsx | ActivityFeed | Real-time |
| **Change Orders** | useChangeOrders | (within projects) | ChangeOrderForm | CRUD + PDF |
| **Clients** | useClients | clients/page.tsx | ClientCard, ClientFormModal | CRUD hook |
| **Daily Logs** | useDailyLogs | logs/page.tsx | DailyLogForm | Form + Photos |
| **Documents** | useDocuments | documents/page.tsx | DocumentViewer, DocumentUploader | Firebase Storage |
| **Equipment** | useEquipment | equipment/page.tsx | EquipmentCard | CRUD hook |
| **E-signature** | useSignatureRequests | signatures/page.tsx | SignatureFlow, SignaturePad | Magic links |
| **Estimates** | useEstimates | estimates/page.tsx | EstimateForm, EstimatePDF | PDF generation |
| **Expenses** | useExpenses | expenses/page.tsx | ExpenseCard, LineItemsTable, ReceiptGallery, OCRConfidenceAlert | Receipts + OCR |
| **Expense OCR Analytics** | useOCRLogs | expenses/ocr-analytics/page.tsx | BarChartCard | Admin OCR stats |
| **Financial Intelligence** | useCompanyStats | intelligence/page.tsx | CompanyOverviewDashboard, ProjectProfitabilityLeaderboard, CashFlowRunwayDashboard | BI dashboards |
| **AP Invoicing** | useSubcontractorInvoices | ap-invoicing/page.tsx | SubcontractorInvoiceForm, InvoiceApprovalCard, LienWaiverModal | Subcontractor AP workflow |
| **Issues (Field)** | useIssues | field/issue/page.tsx | (inline form) | Field issue reporting (Sprint 111) |
| **Invoices** | useInvoices, useRecurringInvoices | invoices/page.tsx, invoices/[id]/page.tsx | InvoiceGenerator, InvoicePDF | PDF download + email + Stripe |
| **Leads** | useLeads | leads/page.tsx | LeadCard | CRM pipeline |
| **Material Requests (Field)** | useMaterialRequests | field/materials/page.tsx | (inline form) | Field material requests (Sprint 111) |
| **Materials** | useMaterials | materials/page.tsx | MaterialCard | Inventory |
| **Messages** | useMessages | messages/page.tsx | MessageThread, MessageComposer | Real-time |
| **Payroll** | usePayroll | payroll/page.tsx | PayrollRun, PayrollTable, OvertimeAlertCard | Calculations + OT alerts |
| **Photos** | usePhotos | photos/page.tsx | PhotoGallery | Firebase Storage |
| **Projects** | useProjects | projects/page.tsx | ProjectCard, ProjectTimeline | CRUD hook |
| **Reports** | useReports | reports/page.tsx | ReportGenerator, ReportChart | Data aggregation |
| **Reviews** | useReviews, useGoogleBusiness | reviews/page.tsx | ReviewCard, ReviewRequestModal, ReviewResponseModal, AutomationRuleForm | Review management |
| **RFIs** | useRFIs | rfis/page.tsx | RFICard, RFIFormModal | Request tracking |
| **Safety** | useSafetyIncidents | safety/page.tsx | SafetyForm, IncidentReport | Compliance |
| **Schedule** | useSchedule | schedule/page.tsx | ScheduleCalendar, ScheduleEvent | FullCalendar |
| **Service Tickets** | useServiceTickets | service-tickets/page.tsx | ServiceTicketCard | Issue tracking |
| **Settings** | useSessionManagement | settings/page.tsx | SettingsPanel | User prefs |
| **Subcontractors** | useSubcontractors | subcontractors/page.tsx | SubcontractorCard, BidList | Bidding |
| **Submittals** | useSubmittals | submittals/page.tsx | SubmittalCard | Document tracking |
| **Tasks** | useTasks | tasks/page.tsx | TaskBoard, TaskCard | Drag & drop |
| **Team** | useTeamMembers | team/page.tsx | TeamMemberCard, TeamMemberCostRateModal, CertificationsDashboard, CertificationFormModal | User management + Certs |
| **Time Off** | useTimeOffRequests | team/time-off/page.tsx | TimeOffRequestModal, TimeOffApprovalCard | PTO/time-off requests |
| **Time Tracking** | useTimeEntries | time/page.tsx | TimeTracker, TimeEntryList | Real-time + OT detection |
| **Timesheets** | useWeeklyTimesheets | timesheets/page.tsx | TimesheetDetailModal, TimesheetRejectionModal, TimesheetApprovalList | Approval workflow |
| **Warranties** | useWarranties | warranties/page.tsx | WarrantyCard | Warranty tracking |

---

## All Hooks (`lib/hooks/`) - Alphabetical

**Total: 85 hooks**

### Data Fetching Hooks (Firestore Collections)

| Hook | File | Collection | Returns | Purpose |
|------|------|------------|---------|---------|
| useAccountingConnection | useAccountingConnection.ts | accountingConnections, accountMappingRules | {connection, mappingRules, loading, addMappingRule, removeMappingRule, triggerSync} | QBO integration + account mapping + full sync |
| useActivityLog | useActivityLog.ts | activityLogs | {logs, loading, error} | Activity feed |
| useAIProviderSettings | useAIProviderSettings.ts | aiProviderSettings | {settings, loading, error} | AI config |
| useAssistant | useAssistant.ts | - | {sendMessage, loading} | AI assistant |
| useAuditLog / useAuditLogs | useAuditLogs.ts | auditLogs | {logs, loading, error} | Audit trail |
| useAvailability | useAvailability.ts | availability | {schedules, loading, error} | Employee availability |
| useBidIntelligence | useBidIntelligence.ts | bidIntelligence | {insights, loading, error} | Bid analytics |
| useBids | useBids.ts | bids | {bids, loading, error} | Subcontractor bids |
| useBrowserNotifications | useBrowserNotifications.ts | - | {notify, permission} | Browser notifications |
| useChangeOrders | useChangeOrders.ts | changeOrders | {orders, loading, error} | Change orders |
| useClientNotes | useClientNotes.ts | clientNotes | {notes, loading, error} | Client notes |
| useClientPortal | useClientPortal.ts | clientPortalSettings | {settings, loading, error} | Client portal config |
| **useClients** | **useClients.ts** | **clients** | **{clients, loading, error}** | **Client CRM** |
| useCompanyStats | useCompanyStats.ts | invoices, projectProfitability, estimates, projects, expenses | {stats, loading, error, refresh} | Org-wide BI aggregation |
| useCloseoutChecklist | useCloseoutChecklist.ts | closeoutChecklists | {checklists, loading, error} | Project closeout |
| useCustomReports | useCustomReports.ts | customReports | {reports, loading, error} | Custom reporting |
| useDailyLogs | useDailyLogs.ts | dailyLogs | {logs, loading, error} | Daily logs |
| useDataRetention | useDataRetention.ts | dataRetentionPolicies | {policies, loading, error} | Data retention |
| useDocuments | useDocuments.ts | documents | {docs, loading, error} | Document management |
| useEmailTemplates | useEmailTemplates.ts | emailTemplates | {templates, loading, error} | Email templates |
| useEquipment | useEquipment.ts | equipment | {equipment, loading, error} | Equipment tracking |
| useEquipmentMaintenance | useEquipmentMaintenance.ts | equipmentMaintenance | {records, loading, error} | Equipment maintenance |
| useEstimates | useEstimates.ts | estimates | {estimates, loading, error} | Estimates/quotes |
| useExpenses | useExpenses.ts | expenses | {expenses, loading, error} | Expense tracking |
| useOCRLogs | useOCRLogs.ts | ocrLogs | {logs, stats, loading, error} | OCR analytics (admin) |
| useFieldReports | useFieldReports.ts | fieldReports | {reports, loading, error} | Field reports |
| useInspections | useInspections.ts | inspections | {inspections, loading, error} | Inspections |
| useInvoices | useInvoices.ts | invoices | {invoices, loading, error} | Invoicing |
| useIssues | useIssues.ts | issues | {issues, loading, error, addIssue, updateIssue} | Issue reporting (Sprint 111) |
| useLeads | useLeads.ts | leads | {leads, loading, error} | Lead management |
| useLienWaivers | useLienWaivers.ts | lienWaivers | {waivers, loading, error} | Lien waivers |
| useMaterialRequests | useMaterialRequests.ts | materialRequests | {requests, loading, error, addRequest, updateRequest} | Material requests (Sprint 111) |
| useMaterials | useMaterials.ts | materials | {materials, loading, error} | Material tracking |
| useMessages | useMessages.ts | messages | {messages, loading, error} | Messaging |
| useNotifications | useNotifications.ts | notifications | {notifications, loading, error} | Notifications |
| usePaymentSchedule | usePaymentSchedule.ts | paymentSchedules | {schedules, loading, error} | Payment scheduling |
| usePayroll | usePayroll.ts | payrollRuns | {runs, loading, error} | Payroll processing |
| usePermits | usePermits.ts | permits | {permits, loading, error} | Permit tracking |
| usePhotos | usePhotos.ts | photos | {photos, loading, error} | Photo management |
| useProjects | useProjects.ts | projects | {projects, loading, error} | Project management |
| usePunchList | usePunchList.ts | punchLists | {items, loading, error} | Punch list tracking |
| useQualityControl | useQualityControl.ts | qualityControl | {checks, loading, error} | QC checks |
| useReports | useReports.ts | reports | {reports, loading, error} | Report generation |
| useRFIs | useRFIs.ts | rfis | {rfis, loading, error} | RFI management |
| useSafetyIncidents | useSafetyIncidents.ts | safetyIncidents | {incidents, loading, error} | Safety tracking |
| **useSchedule** | **useSchedule.ts** | **schedules** | **{schedules, loading, error}** | **Scheduling** |
| useSelections | useSelections.ts | selections | {selections, loading, error} | Material selections |
| useServiceTickets | useServiceTickets.ts | serviceTickets | {tickets, loading, error} | Service tickets |
| **useSessionManagement** | **useSessionManagement.ts** | **(user settings)** | **{settings, update}** | **User preferences** |
| useSignatureRequests | useSignatureRequests.ts | signatureRequests | {requests, loading, error} | E-signatures |
| useSubmittals | useSubmittals.ts | submittals | {submittals, loading, error} | Submittals |
| useSubcontractors | useSubcontractors.ts | subcontractors | {subs, loading, error} | Subcontractor mgmt |
| useTasks | useTasks.ts | tasks | {tasks, loading, error} | Task management |
| useTeamMembers | useTeamMembers.ts | teamMembers | {members, loading, error} | Team management |
| useTimeEntries | useTimeEntries.ts | timeEntries | {entries, loading, error} | Time tracking |
| useTimesheets | useTimesheets.ts | timesheets | {timesheets, loading, error} | Timesheet management |
| useTools | useTools.ts | tools | {tools, loading, error} | Tool tracking |
| useWarranties | useWarranties.ts | warranties | {warranties, loading, error} | Warranty tracking |
| useWeather | useWeather.ts | - | {weather, loading, error} | Weather data |
| useWorkOrders | useWorkOrders.ts | workOrders | {orders, loading, error} | Work orders |

### Utility Hooks

| Hook | File | Purpose |
|------|------|---------|
| useAuth | useAuth.ts | Current user, login, logout |
| useFirestoreCollection | useFirestoreCollection.ts | Generic collection fetching |
| useFirestoreCrud | useFirestoreCrud.ts | Generic CRUD operations |
| useDebounce | useDebounce.ts | Debounce values |
| useLocalStorage | useLocalStorage.ts | Local storage wrapper |
| useMediaQuery | useMediaQuery.ts | Responsive breakpoints |
| usePagination | usePagination.ts | Pagination logic |
| useSearch | useSearch.ts | Search/filtering |
| useSorting | useSorting.ts | Sorting logic |

**Pattern:** All data hooks return `{items, loading, error}` shape and use `onSnapshot` for real-time updates.

---

## Components Directory (`components/`)

**Total: 60 directories**

### UI Components (`components/ui/`)

Core reusable components used everywhere:

| Component | File | Purpose | Used In |
|-----------|------|---------|---------|
| PageHeader | PageHeader.tsx | Page title + actions + breadcrumbs | All pages |
| StatsGrid | StatsGrid.tsx | KPI cards with icons | Dashboard |
| FilterBar | FilterBar.tsx | Search + filter controls | List views |
| DataTable | DataTable.tsx | Sortable/filterable tables | List views |
| FormModal | FormModal.tsx | Modal with form layout | CRUD operations |
| EmptyState | EmptyState.tsx | No data placeholder | Empty lists |
| Skeleton | Skeleton.tsx | Loading states | While fetching |
| Card | Card.tsx | Base card component | Everywhere |
| Badge | Badge.tsx | Status badges | Status displays |
| Button | Button.tsx | Button variants | Everywhere |
| Tabs | Tabs.tsx | Tab navigation | Multi-section pages |
| Toast | Toast.tsx | Notifications | All actions |
| Modal | Modal.tsx | Base modal | Confirmations |
| Dropdown | Dropdown.tsx | Dropdown menus | Actions |

### Feature Components (Major Directories)

| Directory | Key Components | Purpose | Hook Used |
|-----------|---------------|---------|-----------|
| **activity/** | ActivityFeed, ActivityCard | Activity logs | useActivityLog |
| **admin/** | AdminPanel, RoleManagement | Admin controls | useAuth |
| **assistant/** | ChatInterface, AIPrompt | AI assistant | useAssistant |
| **auth/** | LoginForm, RegisterForm | Authentication | useAuth |
| **automation/** | AutomationBuilder, RuleEditor | Workflow automation | useAutomation |
| **bid-intelligence/** | BidAnalytics, BidRecommendations | Bid insights | useBidIntelligence |
| **charts/** | LineChart, BarChart, PieChart | Data visualization | Multiple |
| **client-portal/** | ClientDashboard, ClientDocuments | Client portal | useClientPortal |
| **clients/** | ClientCard, ClientFormModal, ClientList | Client CRM | useClients |
| **dailylogs/** | DailyLogForm, DailyLogCard | Daily logs | useDailyLogs |
| **dashboard/** | DashboardGrid, StatsCard | Dashboard widgets | Multiple |
| **email/** | EmailComposer, EmailTemplateEditor | Email management | useEmailTemplates |
| **equipment/** | EquipmentCard, MaintenanceSchedule | Equipment tracking | useEquipment |
| **esignature/** | SignatureFlow, SignaturePad, SignatureStatus | E-signatures | useSignatureRequests |
| **estimates/** | EstimateForm, EstimatePreview, EstimatePDF | Estimates/quotes | useEstimates |
| **expenses/** | ExpenseCard, ReceiptUploader | Expense tracking | useExpenses |
| **field/** | FieldReportForm, PhotoCapture | Field operations | useFieldReports |
| **finances/** | FinancialDashboard, CashFlow, MarginMeter, JobCostingSummary | Financial overview + profitability | useJobCosting, useOrgJobCosting |
| **intelligence/** | InsightCard, Recommendations | Business intelligence | useBidIntelligence |
| **invoicing/** | InvoiceGenerator, InvoicePDF, InvoiceList | Invoicing | useInvoices |
| **leads/** | LeadCard, LeadFormModal, LeadPipeline | Lead management | useLeads |
| **logs/** | DailyLogForm, DailyLogViewer | Daily log tracking | useDailyLogs |
| **materials/** | MaterialCard, MaterialRequest | Material management | useMaterials |
| **messages/** | MessageThread, MessageComposer, MessageList | Messaging | useMessages |
| **navigation/** | **CollapsibleNavSection**, AppShell, MobileNav | **Navigation** | - |
| **notifications/** | NotificationBell, NotificationList | Notifications | useNotifications |
| **payroll/** | PayrollRun, PayrollTable, PayrollSummary | Payroll processing | usePayroll |
| **permits/** | PermitCard, PermitTracker | Permit tracking | usePermits |
| **photos/** | PhotoGallery, PhotoUploader | Photo management | usePhotos |
| **projects/** | ProjectCard, ProjectFormModal, ProjectTimeline | Project management | useProjects |
| **reports/** | ReportGenerator, ReportChart, ReportExport | Reporting | useReports |
| **rfis/** | RFICard, RFIFormModal, RFIList | RFI management | useRFIs |
| **safety/** | SafetyForm, IncidentReport, SafetyChecklist | Safety tracking | useSafetyIncidents |
| **schedule/** | ScheduleCalendar, ScheduleEvent | Scheduling | useSchedule |
| **selections/** | SelectionCard, SelectionBoard | Material selections | useSelections |
| **settings/** | SettingsPanel, PreferencesForm | User settings | useSessionManagement |
| **signatures/** | See esignature/ | (Same as esignature) | useSignatureRequests |
| **subcontractors/** | SubcontractorCard, BidList, BidFormModal | Subcontractor mgmt | useSubcontractors |
| **submittals/** | SubmittalCard, SubmittalTracker | Submittals | useSubmittals |
| **tasks/** | TaskBoard, TaskCard, TaskFormModal | Task management | useTasks |
| **team/** | TeamMemberCard, RoleAssignment | Team management | useTeamMembers |
| **time/** | TimeTracker, TimeEntryList | Time tracking | useTimeEntries |
| **timesheets/** | TimesheetTable, TimesheetApproval | Timesheet management | useTimesheets |
| **tools/** | ToolCard, ToolCheckout | Tool tracking | useTools |
| **warranties/** | WarrantyCard, WarrantyTracker | Warranty tracking | useWarranties |

---

## Pages Directory (`app/dashboard/`)

**Total: 36 routes**

| Route | File | Main Components | Hook Used | Purpose |
|-------|------|-----------------|-----------|---------|
| /dashboard | page.tsx | DashboardGrid, StatsGrid | Multiple | Dashboard home |
| /dashboard/activity | activity/page.tsx | ActivityFeed | useActivityLog | Activity logs |
| /dashboard/clients | clients/page.tsx | ClientList, ClientCard | useClients | Client CRM |
| /dashboard/documents | documents/page.tsx | DocumentList, DocumentViewer | useDocuments | Document management |
| /dashboard/equipment | equipment/page.tsx | EquipmentCard | useEquipment | Equipment tracking |
| /dashboard/estimates | estimates/page.tsx | EstimateList, EstimateForm | useEstimates | Estimates/quotes |
| /dashboard/expenses | expenses/page.tsx | ExpenseCard | useExpenses | Expense tracking |
| /dashboard/finances | finances/page.tsx | FinancialDashboard | Multiple | Financial overview |
| /dashboard/help | help/page.tsx | HelpCenter | - | Help documentation |
| /dashboard/intelligence | intelligence/page.tsx | InsightCard | useBidIntelligence | Business intelligence |
| /dashboard/invoices | invoices/page.tsx | InvoiceList, InvoiceGenerator | useInvoices | Invoicing |
| /dashboard/leads | leads/page.tsx | LeadCard, LeadPipeline | useLeads | Lead management |
| /dashboard/logs | logs/page.tsx | DailyLogForm | useDailyLogs | Daily logs |
| /dashboard/materials | materials/page.tsx | MaterialCard | useMaterials | Material tracking |
| /dashboard/messages | messages/page.tsx | MessageThread | useMessages | Messaging |
| /dashboard/messaging | messaging/page.tsx | (Alias for messages) | useMessages | Messaging (alt route) |
| /dashboard/notifications | notifications/page.tsx | NotificationList | useNotifications | Notifications |
| /dashboard/payroll | payroll/page.tsx | PayrollRun, PayrollTable | usePayroll | Payroll processing |
| /dashboard/permits | permits/page.tsx | PermitCard | usePermits | Permit tracking |
| /dashboard/photos | photos/page.tsx | PhotoGallery | usePhotos | Photo management |
| /dashboard/projects | projects/page.tsx | ProjectList, ProjectCard | useProjects | Project management |
| /dashboard/reports | reports/page.tsx | ReportGenerator | useReports | Report generation |
| /dashboard/rfis | rfis/page.tsx | RFICard | useRFIs | RFI management |
| /dashboard/safety | safety/page.tsx | SafetyForm, IncidentReport | useSafetyIncidents | Safety tracking |
| /dashboard/schedule | schedule/page.tsx | ScheduleCalendar | useSchedule | Scheduling |
| /dashboard/search | search/page.tsx | GlobalSearch | Multiple | Global search |
| /dashboard/service-tickets | service-tickets/page.tsx | ServiceTicketCard | useServiceTickets | Service tickets |
| /dashboard/settings | settings/page.tsx | SettingsPanel | useSessionManagement | User settings |
| /dashboard/settings/integrations/quickbooks | quickbooks/page.tsx | QBOAccountMapping, QBOSyncStatus | useAccountingConnection | QBO integration (Sprint 109) |
| /dashboard/signatures | signatures/page.tsx | SignatureFlow | useSignatureRequests | E-signatures |
| /dashboard/subcontractors | subcontractors/page.tsx | SubcontractorCard | useSubcontractors | Subcontractor mgmt |
| /dashboard/submittals | submittals/page.tsx | SubmittalCard | useSubmittals | Submittals |
| /dashboard/tasks | tasks/page.tsx | TaskBoard | useTasks | Task management |
| /dashboard/team | team/page.tsx | TeamMemberCard | useTeamMembers | Team management |
| /dashboard/time | time/page.tsx | TimeTracker | useTimeEntries | Time tracking |
| /dashboard/timesheets | timesheets/page.tsx | TimesheetTable | useTimesheets | Timesheet management |
| /dashboard/tools | tools/page.tsx | ToolCard | useTools | Tool tracking |
| /dashboard/warranties | warranties/page.tsx | WarrantyCard | useWarranties | Warranty tracking |

---

## Client Portal Pages (`app/client/`)

**Total: 15 routes** (Sprint 108 enhanced)

| Route | File | Features | Status |
|-------|------|----------|--------|
| /client | page.tsx | Dashboard: active project, stats, recent photos, invoices | ✅ |
| /client/projects | projects/page.tsx | Project list with status | ✅ |
| /client/projects/[id] | projects/[id]/page.tsx | Project detail: progress, phases, task stats, quick links | ✅ |
| /client/projects/[id]/scope | projects/[id]/scope/page.tsx | Scope of work view | ✅ |
| /client/projects/[id]/selections | projects/[id]/selections/page.tsx | Selection approval with budget, notes, option selection | ✅ |
| /client/projects/[id]/change-orders | projects/[id]/change-orders/page.tsx | Change order review | ✅ |
| /client/messages | messages/page.tsx | Two-way messaging with real-time updates (Sprint 108) | ✅ Enhanced |
| /client/invoices | invoices/page.tsx | Invoice list with Pay Now, payment progress, overdue warnings (Sprint 108) | ✅ Enhanced |
| /client/documents | documents/page.tsx | 6 document types: invoices, change orders, contracts, permits, warranties, insurance (Sprint 108) | ✅ Enhanced |
| /client/photos | photos/page.tsx | Photo gallery with before/after comparisons, date/project filters | ✅ |
| /client/settings | settings/page.tsx | Notification preferences, contact method, phone (Sprint 108) | ✅ New |
| /client/[token]/timeline | [token]/timeline/page.tsx | Public project timeline | ✅ |
| /client/[token]/gallery | [token]/gallery/page.tsx | Public photo gallery | ✅ |
| /client/[token]/messages | [token]/messages/page.tsx | Public messages view | ✅ |
| /client/[token]/approvals | [token]/approvals/page.tsx | Public approvals | ✅ |

---

## Field Portal Pages (`app/field/`)

**Total: 11 routes** (Sprint 111 added 4)

| Route | File | Hook Used | Purpose |
|-------|------|-----------|---------|
| /field | page.tsx | (direct queries) | Home — clock in/out, tasks, quick actions |
| /field/time | time/page.tsx | useTimeEntries | Time clock |
| /field/schedule | schedule/page.tsx | useSchedule | Daily schedule |
| /field/tasks | tasks/page.tsx | useTasks | Task list |
| /field/photos | photos/page.tsx | usePhotos | Photo capture |
| /field/daily-log | daily-log/page.tsx | useDailyLogs | Daily log |
| /field/voice-logs | voice-logs/page.tsx | - | Voice logs |
| /field/issue | issue/page.tsx | useIssues | Issue reporting (Sprint 111) |
| /field/safety | safety/page.tsx | useSafetyIncidents | Safety incidents (Sprint 111) |
| /field/equipment | equipment/page.tsx | useEquipment | Equipment checkout/return (Sprint 111) |
| /field/materials | materials/page.tsx | useMaterialRequests | Material requests (Sprint 111) |

---

## Common Patterns

### Form Handling
**Pattern:** React Hook Form + Zod validation
**Example:** `components/clients/ClientFormModal.tsx`
**Files:** All `*FormModal.tsx` components

### Data Fetching
**Pattern:** Custom Firestore hooks with real-time subscriptions
**Return Shape:** `{items, loading, error}`
**Example:** All `lib/hooks/use*.ts` files

### PDF Generation
**Pattern:** @react-pdf/renderer
**Example:** `components/estimates/EstimatePDF.tsx`, `components/invoicing/InvoicePDF.tsx`
**Files:** All `*PDF.tsx` components

### File Upload
**Pattern:** Firebase Storage
**Example:** `components/photos/PhotoUploader.tsx`, `components/expenses/ReceiptUploader.tsx`

### Authentication
**Pattern:** Firebase Auth + custom claims (orgId)
**Files:** `contexts/AuthContext.tsx`, `lib/hooks/useAuth.ts`

### Styling
**Pattern:** Tailwind CSS + CSS variables
**Theme:** `app/globals.css`

### Real-time Updates
**Pattern:** Firestore `onSnapshot` subscriptions
**Example:** All data hooks use real-time by default

---

## Firestore Collections

**All collections scoped to:** `organizations/{orgId}/[collection]`

| Collection | Purpose | Key Fields | Indexes |
|------------|---------|------------|---------|
| activityLogs | Activity feed | userId, action, timestamp | userId+timestamp |
| clients | Client CRM | name, email, phone, status | name, createdAt, status |
| dailyLogs | Daily logs | projectId, date, weather | projectId+date |
| documents | Document storage | projectId, type, url | projectId+type |
| equipment | Equipment | name, type, status | type, status |
| estimates | Estimates | clientId, status, total | clientId+status, createdAt |
| expenses | Expenses | projectId, amount, date | projectId+date |
| invoices | Invoices | clientId, status, dueDate, total | clientId+status, dueDate |
| issues | Issues (field) | projectId, reportedBy, severity, status | projectId+createdAt |
| leads | Leads | name, status, source | status, createdAt |
| materialRequests | Material requests | projectId, requestedBy, priority, status | projectId+createdAt |
| materials | Materials | projectId, name, quantity | projectId+name |
| messages | Messages | threadId, senderId, timestamp | threadId+timestamp |
| notifications | Notifications | userId, read, timestamp | userId+read+timestamp |
| payrollRuns | Payroll | period, status, totalAmount | period, status |
| permits | Permits | projectId, type, status | projectId+status |
| photos | Photos | projectId, capturedAt | projectId+capturedAt |
| projects | Projects | clientId, status, startDate, endDate | clientId+status, startDate, status |
| rfis | RFIs | projectId, status, createdAt | projectId+status |
| safetyIncidents | Safety | projectId, date, severity | projectId+date, severity |
| schedules | Schedules | employeeId, date, startTime | employeeId+date |
| signatureRequests | E-signatures | projectId, status, createdAt | projectId+status |
| subcontractors | Subcontractors | name, trade, status | trade, status |
| submittals | Submittals | projectId, status, dueDate | projectId+status |
| tasks | Tasks | projectId, assignee, dueDate, status | projectId+status, assignee+dueDate, status |
| teamMembers | Team | email, role, active | role, active |
| timeEntries | Time tracking | employeeId, projectId, date, hours | employeeId+date, projectId+date |
| timesheets | Timesheets | employeeId, period, status | employeeId+period, status |
| tools | Tools | name, type, assignedTo | type, assignedTo |
| warranties | Warranties | projectId, type, expirationDate | projectId+expirationDate |

**See:** `firestore.indexes.json` for complete index definitions

---

## Update Schedule

### When to Update
- **New feature added:** Add to registry within same sprint
- **File moved/renamed:** Update affected entries immediately
- **Quarterly review:** Every 5-10 sprints, verify all paths

### How to Update
1. Find relevant table in this file
2. Add new row or update existing row
3. Update "Last Updated" date at top
4. Commit: `docs: Update MODULE_REGISTRY for [feature]`

**Time cost:** 30 seconds per update

### Who Updates
- Development sessions that add features
- Quarterly documentation reviews
- Anyone who discovers outdated paths

---

## Usage Examples

### Example 1: Sprint 53 (Settings Management)

**❌ Old way - Without MODULE_REGISTRY:**
```
1. Launch Explore agent: settings module → 100.1k tokens, 5 min
2. Review 26 tool uses
3. Extract: useSessionManagement.ts, SettingsPanel.tsx
4. Start work
Total: 100.1k tokens, ~5 minutes
```

**✅ New way - With MODULE_REGISTRY:**
```
1. Open MODULE_REGISTRY.md
2. Find "Settings" row in Quick Lookup table
3. Get: useSessionManagement.ts, settings/page.tsx, SettingsPanel.tsx
4. Start work immediately
Total: 5k tokens (reading registry), ~10 seconds
```

**Savings: 95k tokens, 4:50 minutes**

### Example 2: Sprint 54 (Hypothetical - Invoicing Feature)

**Need to work on invoicing:**
1. Check MODULE_REGISTRY.md "Quick Lookup by Feature"
2. Find "Invoices" row:
   - Hook: `useInvoices.ts`
   - Page: `invoices/page.tsx`
   - Components: `InvoiceGenerator.tsx`, `InvoicePDF.tsx`
   - Pattern: PDF + Stripe
3. Open those files and start coding

**No Explore agents needed!**

---

## Verification

**Success Metrics:**
- ✅ All 36 dashboard routes documented
- ✅ All major hooks documented (50+ hooks)
- ✅ All feature component directories documented (40+ directories)
- ✅ Common patterns documented
- ✅ File paths accurate (verified 2026-02-04)

**Next Sprint Test:**
1. Sprint 54 starts with new feature
2. Check MODULE_REGISTRY.md FIRST
3. Measure token usage (should be ~5k not ~200k)
4. Measure time to start work (should be <1 min not 15 min)

---

## Future Enhancements

### Automated Generation
Create `scripts/generate-module-registry.ts`:
- Scan `lib/hooks/` for all `.ts` files
- Scan `app/dashboard/` for all `page.tsx` files
- Scan `components/` for all directories
- Generate MODULE_REGISTRY.md automatically
- Run monthly or via git hook

### Integration with CLAUDE.md
Add to session startup:
```markdown
## Sprint Startup (MANDATORY):
1. Read CLAUDE.md
2. Read MODULE_REGISTRY.md ← Find your modules HERE first!
3. ONLY use Explore agents if module not in registry
4. If you explore: UPDATE MODULE_REGISTRY.md before committing
```

---

## Historical Context

**Created:** 2026-02-04 during Sprint 53
**Reason:** Sprint 53 wasted 248.8k tokens on 3 Explore agents just to find:
- `useSessionManagement.ts` (settings)
- `useSchedule.ts` (scheduling)
- `CollapsibleNavSection.tsx` (mobile nav)

**Impact:** This registry prevents future sprints from repeating this waste.

**Annual Impact:** 40 sprints × 195k tokens saved = **7.8 million tokens saved per year**

---

*Last verified: 2026-02-04 (Sprint 53) - All file paths confirmed accurate*
