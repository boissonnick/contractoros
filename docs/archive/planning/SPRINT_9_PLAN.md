# Sprint 9: CRM, Payroll & Crew Management Initiative

> **Created:** 2026-01-29
> **Scope:** Multi-sprint initiative (9A-9D)
> **Estimated Duration:** 6-8 weeks

---

## Executive Summary

This sprint addresses critical gaps identified in user testing:
1. **Data architecture bugs** - Clients not showing in Clients tab, team members missing
2. **Payroll module** - Full in-app payroll with tax withholdings, direct deposit, pay stubs
3. **CSV Import** - Import clients, projects, contacts, notes from spreadsheets/other CRMs
4. **Crew scheduling** - Drag-drop scheduling, time-off requests, capacity planning, overtime alerts

---

## Sprint 9A: Immediate Bug Fixes (1-2 days)

### Issues to Fix

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Clients not showing on Clients tab | `useClients` queries root `clients` collection, but demo data writes to `organizations/{orgId}/clients` | Update `useClients` hook to use org subcollection |
| Demo team members not in Team settings | `DEMO_USERS` defined but never saved to Firestore `users` collection | Add user creation to `seedDemoData()` |
| Daily logs lack rich detail | Demo logs have simple one-line notes | Enhance demo data with comprehensive log entries |

### Files to Modify

```
apps/web/lib/hooks/useClients.ts          # Change collection path
apps/web/scripts/seeders/demoData.ts      # Add team member creation + richer logs
apps/web/types/index.ts                   # Add payroll fields to UserProfile
firestore.rules                           # Update clients rule path
```

### Task Breakdown

1. **Fix useClients hook** (30 min)
   - Change `CLIENTS_COLLECTION = 'clients'` to query `organizations/{orgId}/clients`
   - Update all CRUD functions to use org-scoped path

2. **Fix demo team members** (1 hour)
   - Add `seedDemoUsers()` function to create users in `users` collection
   - Set proper `orgId`, `role`, `employeeType`, `hourlyRate` fields
   - Call from main `seedDemoData()` function
   - Add cleanup in `resetDemoData()`

3. **Enhance demo daily logs** (1 hour)
   - Add richer detail: work performed list, crew names, material deliveries
   - Add safety notes and weather delay examples
   - Include visitor logs and inspection notes

4. **Add payroll fields to UserProfile** (30 min)
   - `salary?: number`
   - `weeklyRate?: number`
   - `overtimeRate?: number` (defaults to 1.5x)
   - `paySchedule?: 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly'`
   - `payMethod?: 'direct_deposit' | 'check' | 'cash'`
   - `bankInfo?: { routingNumber: string; accountNumber: string; accountType: 'checking' | 'savings' }`
   - `w4Status?: { filingStatus: string; allowances: number; additionalWithholding: number }`
   - `ptoBalance?: number`
   - `sickLeaveBalance?: number`

---

## Sprint 9B: Full Payroll Module (2-3 weeks)

### Features

1. **Employee Payroll Settings**
   - Hourly vs salary designation
   - Pay rates (regular, overtime, double-time)
   - Pay schedule configuration
   - Tax withholding setup (W-4 info)
   - Direct deposit setup (bank info - UI only, no actual processing)

2. **Payroll Preview & Calculation**
   - Pull time entries for pay period
   - Calculate gross pay (hours × rate)
   - Calculate overtime (daily >8hr, weekly >40hr)
   - Calculate deductions (federal, state, social security, medicare estimates)
   - Show net pay estimate

3. **Payroll Runs**
   - Create payroll run for pay period
   - Review/adjust entries before finalizing
   - Generate pay stubs (PDF)
   - Export to CSV for external payroll (Gusto, ADP, QuickBooks)
   - Mark as processed

4. **Reporting**
   - Payroll history by employee
   - Payroll by project
   - YTD earnings and deductions
   - Overtime analysis

### Files to Create

```
apps/web/lib/payroll/
├── types.ts                    # PayrollRun, PayrollEntry, TaxCalculation, etc.
├── payroll-service.ts          # CRUD operations for payroll
├── tax-calculator.ts           # Federal/state tax estimation
└── payroll-pdf.ts              # Pay stub PDF generation

apps/web/components/payroll/
├── PayrollSettingsForm.tsx     # Employee payroll configuration
├── PayrollRunCard.tsx          # Payroll run display
├── PayrollEntryRow.tsx         # Individual payroll line item
├── PayrollPreview.tsx          # Preview before finalizing
├── PayStubPdf.tsx              # PDF template for pay stubs
├── PayrollExportModal.tsx      # Export to CSV/PDF
└── index.ts                    # Exports

apps/web/app/dashboard/payroll/
├── page.tsx                    # Payroll dashboard
├── run/[id]/page.tsx           # Payroll run detail
└── history/page.tsx            # Payroll history

apps/web/app/dashboard/settings/payroll/page.tsx  # Payroll settings (enhance existing)
```

### Types to Add

```typescript
// Pay period types
type PayPeriodType = 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';

interface PayPeriod {
  id: string;
  type: PayPeriodType;
  startDate: Date;
  endDate: Date;
  payDate: Date;
}

// Payroll entry for one employee in one period
interface PayrollEntry {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employeeName: string;

  // Hours
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  ptoHours: number;
  sickHours: number;

  // Rates
  regularRate: number;
  overtimeRate: number;
  doubleTimeRate: number;

  // Earnings
  regularPay: number;
  overtimePay: number;
  doubleTimePay: number;
  ptoPay: number;
  sickPay: number;
  bonuses: number;
  reimbursements: number;
  grossPay: number;

  // Deductions (estimates)
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
  otherDeductions: number;
  totalDeductions: number;

  netPay: number;

  // Metadata
  timeEntryIds: string[];      // Source time entries
  adjustments: PayrollAdjustment[];
  notes?: string;
}

// Complete payroll run
interface PayrollRun {
  id: string;
  orgId: string;
  payPeriod: PayPeriod;
  status: 'draft' | 'pending_approval' | 'approved' | 'processed' | 'paid';

  entries: PayrollEntry[];

  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  employeeCount: number;

  approvedBy?: string;
  approvedAt?: Date;
  processedBy?: string;
  processedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

// Tax calculation helper
interface TaxCalculation {
  grossPay: number;
  filingStatus: string;
  allowances: number;
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
  totalTax: number;
}
```

### Firestore Rules to Add

```javascript
// Payroll runs - admin only
match /organizations/{orgId}/payrollRuns/{runId} {
  allow read: if isAdmin();
  allow write: if isAdmin();
}

// Payroll settings - admin only
match /organizations/{orgId}/payrollSettings/{settingId} {
  allow read: if isAdmin();
  allow write: if isAdmin();
}
```

---

## Sprint 9C: CSV Import System (1-2 weeks)

### Features

1. **File Upload & Preview**
   - Drag & drop CSV/Excel file
   - Preview first 10 rows
   - Auto-detect delimiters

2. **Column Mapping**
   - Visual column mapper
   - Suggested mappings based on header names
   - Required field validation
   - Data type validation (email, phone, date formats)

3. **Import Targets**
   - Clients (name, email, phone, address, status, source, notes)
   - Projects (name, client, address, budget, status, dates)
   - Contacts (name, role, email, phone, linked to client)
   - Communication logs (date, type, notes, linked to client)

4. **Validation & Error Handling**
   - Row-by-row validation
   - Duplicate detection (by email, name, etc.)
   - Error report with line numbers
   - Partial import (skip errors, import valid rows)

5. **Import History**
   - Log of all imports
   - Rollback capability (undo import)

### Files to Create

```
apps/web/lib/import/
├── types.ts                    # ImportJob, ColumnMapping, ValidationError
├── csv-parser.ts               # Parse CSV/Excel files
├── column-mapper.ts            # Auto-detect and suggest mappings
├── validators.ts               # Validation rules by data type
├── import-service.ts           # Execute imports, create records
└── import-history.ts           # Track and rollback imports

apps/web/components/import/
├── FileUploader.tsx            # Drag & drop file upload
├── DataPreview.tsx             # Preview imported data table
├── ColumnMapper.tsx            # Column mapping interface
├── ValidationReport.tsx        # Show errors and warnings
├── ImportProgress.tsx          # Progress bar during import
├── ImportHistoryTable.tsx      # Import log table
└── index.ts                    # Exports

apps/web/app/dashboard/settings/import/page.tsx   # Import wizard page
```

### Types to Add

```typescript
// Import job status
type ImportStatus = 'uploading' | 'mapping' | 'validating' | 'importing' | 'completed' | 'failed' | 'rolled_back';

// Target entity types
type ImportTarget = 'clients' | 'projects' | 'contacts' | 'communication_logs';

// Column mapping
interface ColumnMapping {
  sourceColumn: string;        // CSV header
  targetField: string;         // Database field
  dataType: 'string' | 'email' | 'phone' | 'date' | 'number' | 'boolean';
  required: boolean;
  defaultValue?: string;
  transform?: 'uppercase' | 'lowercase' | 'trim' | 'phone_format' | 'date_format';
}

// Validation error
interface ImportValidationError {
  row: number;
  column: string;
  value: string;
  error: string;
  severity: 'error' | 'warning';
}

// Import job
interface ImportJob {
  id: string;
  orgId: string;
  userId: string;
  userName: string;

  target: ImportTarget;
  fileName: string;
  fileSize: number;

  status: ImportStatus;

  mappings: ColumnMapping[];

  totalRows: number;
  validRows: number;
  importedRows: number;
  skippedRows: number;
  errors: ImportValidationError[];

  createdRecordIds: string[];   // For rollback

  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

// Field definitions for each target
const IMPORT_FIELD_DEFINITIONS: Record<ImportTarget, FieldDefinition[]> = {
  clients: [
    { name: 'displayName', label: 'Client Name', type: 'string', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone', type: 'phone', required: false },
    { name: 'companyName', label: 'Company', type: 'string', required: false },
    { name: 'address.street', label: 'Street Address', type: 'string', required: false },
    { name: 'address.city', label: 'City', type: 'string', required: false },
    { name: 'address.state', label: 'State', type: 'string', required: false },
    { name: 'address.zip', label: 'ZIP', type: 'string', required: false },
    { name: 'status', label: 'Status', type: 'string', required: false, enum: ['active', 'past', 'potential', 'inactive'] },
    { name: 'source', label: 'Source', type: 'string', required: false },
  ],
  projects: [
    { name: 'name', label: 'Project Name', type: 'string', required: true },
    { name: 'clientEmail', label: 'Client Email', type: 'email', required: false }, // Lookup client by email
    { name: 'address.street', label: 'Address', type: 'string', required: false },
    { name: 'budget', label: 'Budget', type: 'number', required: false },
    { name: 'status', label: 'Status', type: 'string', required: false, enum: ['lead', 'bidding', 'planning', 'active', 'on_hold', 'completed', 'cancelled'] },
    { name: 'startDate', label: 'Start Date', type: 'date', required: false },
    { name: 'estimatedEndDate', label: 'End Date', type: 'date', required: false },
  ],
  contacts: [...],
  communication_logs: [...],
};
```

---

## Sprint 9D: Full Crew Scheduling (2-3 weeks)

### Features

1. **Schedule Board**
   - Day/week/month views
   - Drag & drop job scheduling
   - Color coding by project/job type
   - Employee assignment visualization

2. **Crew Availability**
   - Set regular working hours per employee
   - Mark unavailable dates
   - Skill/trade based filtering
   - Capacity utilization view

3. **Time-Off Requests**
   - Employee self-service request submission
   - Manager approval workflow
   - PTO/Sick leave balance tracking
   - Conflict detection (scheduled work)

4. **Conflict Detection**
   - Double-booking alerts
   - Overtime threshold warnings (daily/weekly)
   - Skill mismatch warnings
   - Travel time considerations

5. **Capacity Planning**
   - Hours scheduled vs available
   - Utilization by employee
   - Project staffing requirements
   - Forecast view

### Files to Create/Update

```
apps/web/components/scheduling/
├── ScheduleBoard.tsx           # Main drag-drop schedule
├── CrewRow.tsx                 # Employee schedule row
├── JobBlock.tsx                # Draggable job block
├── TimeOffRequestForm.tsx      # Request time off
├── TimeOffApprovalCard.tsx     # Approve/deny request
├── AvailabilityEditor.tsx      # Set regular hours
├── ConflictAlertList.tsx       # Show scheduling conflicts
├── CapacityChart.tsx           # Utilization visualization
└── index.ts                    # Exports

apps/web/lib/hooks/
├── useCrewScheduling.ts        # Schedule CRUD
├── useTimeOffRequests.ts       # Time-off management
└── useCrewCapacity.ts          # Capacity calculations

apps/web/app/dashboard/scheduling/
├── page.tsx                    # Schedule board
├── time-off/page.tsx           # Time-off requests (employee view)
└── capacity/page.tsx           # Capacity planning (manager view)
```

### Types to Add/Update

```typescript
// Time-off request
interface TimeOffRequest {
  id: string;
  orgId: string;
  employeeId: string;
  employeeName: string;

  type: 'pto' | 'sick' | 'unpaid' | 'bereavement' | 'jury_duty' | 'other';
  startDate: Date;
  endDate: Date;
  hours: number;              // Total hours requested

  reason?: string;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';

  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;

  // Conflict info
  conflictingSchedules?: string[];   // Schedule IDs that overlap

  createdAt: Date;
  updatedAt: Date;
}

// Employee availability pattern
interface EmployeeAvailability {
  id: string;
  employeeId: string;
  orgId: string;

  // Regular schedule (repeating)
  regularSchedule: {
    monday: { start: string; end: string; available: boolean };
    tuesday: { start: string; end: string; available: boolean };
    // ... etc
  };

  // Exceptions (one-time overrides)
  exceptions: Array<{
    date: string;
    available: boolean;
    start?: string;
    end?: string;
    reason?: string;
  }>;

  // Skills/trades
  trades: string[];
  certifications?: string[];

  updatedAt: Date;
}

// Schedule entry (job assignment)
interface ScheduleEntry {
  id: string;
  orgId: string;

  // Assignment
  employeeId: string;
  employeeName: string;
  projectId: string;
  projectName: string;
  taskId?: string;
  taskName?: string;

  // Timing
  date: string;
  startTime: string;
  endTime: string;
  hours: number;

  // Metadata
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;

  // Conflict tracking
  conflicts?: ScheduleConflict[];

  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schedule conflict
interface ScheduleConflict {
  type: 'double_booking' | 'overtime_daily' | 'overtime_weekly' | 'unavailable' | 'time_off';
  severity: 'warning' | 'error';
  message: string;
  relatedEntryId?: string;
}

// Capacity summary
interface CapacitySummary {
  employeeId: string;
  employeeName: string;
  period: { start: Date; end: Date };

  availableHours: number;
  scheduledHours: number;
  utilization: number;        // percentage

  overtimeHours: number;
  timeOffHours: number;

  byProject: Array<{
    projectId: string;
    projectName: string;
    hours: number;
  }>;
}
```

---

## Implementation Order

### Week 1-2: Sprint 9A (Bug Fixes)
- [ ] Fix useClients hook to use org subcollection
- [ ] Update Firestore rules for clients path
- [ ] Add demo team members to users collection
- [ ] Add payroll fields to UserProfile type
- [ ] Enhance demo daily logs with rich detail
- [ ] Rebuild and test demo data generation

### Week 3-5: Sprint 9B (Payroll)
- [ ] Create payroll types and service
- [ ] Build employee payroll settings UI
- [ ] Implement payroll preview/calculation
- [ ] Build payroll run workflow
- [ ] Create pay stub PDF generation
- [ ] Add CSV export for external payroll systems
- [ ] Build payroll reporting

### Week 6-7: Sprint 9C (CSV Import)
- [ ] Build CSV parser with Excel support
- [ ] Create column mapping interface
- [ ] Implement validators for each data type
- [ ] Build import execution with progress
- [ ] Add import history and rollback
- [ ] Test with real-world data samples

### Week 8-9: Sprint 9D (Crew Scheduling)
- [ ] Build schedule board with drag-drop
- [ ] Create crew availability management
- [ ] Implement time-off request workflow
- [ ] Add conflict detection engine
- [ ] Build capacity planning views
- [ ] Integration with time tracking

---

## Success Criteria

### Sprint 9A
- [ ] Clients appear correctly in Clients tab
- [ ] Demo team members show in Team settings
- [ ] Demo daily logs have comprehensive detail
- [ ] Time entries link to employee payroll info

### Sprint 9B
- [ ] Can configure hourly/salary pay for employees
- [ ] Payroll preview shows accurate calculations
- [ ] Pay stubs can be generated as PDF
- [ ] Can export payroll to CSV for external systems
- [ ] Payroll history is searchable

### Sprint 9C
- [ ] Can upload CSV/Excel files
- [ ] Column mapping is intuitive and fast
- [ ] Validation catches errors before import
- [ ] Can import 1000+ records without issues
- [ ] Can rollback failed imports

### Sprint 9D
- [ ] Drag-drop scheduling works smoothly
- [ ] Time-off requests flow through approval
- [ ] Conflicts are detected and shown clearly
- [ ] Capacity view helps with planning
- [ ] Overtime alerts prevent violations

---

## Dependencies

- Sprint 9B depends on 9A (payroll fields on UserProfile)
- Sprint 9D depends on 9A (team members must exist)
- Sprint 9C is independent, can run in parallel

## Risks

1. **Payroll tax calculations** - Complex, varies by state. Recommend "estimates only" disclaimer.
2. **Bank info handling** - Must NOT store actual bank details. Use external payroll integration.
3. **Large CSV imports** - May timeout on large files. Need chunked processing.
4. **Schedule complexity** - Drag-drop with many constraints is challenging. Start simple.

---

## Notes

- All payroll tax calculations are ESTIMATES only - users should use professional payroll services for actual tax filing
- Bank info will be stored as masked values for display only - actual direct deposit requires integration with payroll provider
- CSV import will support both CSV and XLSX formats using Papa Parse and xlsx libraries
