# CLI 3 SPRINT 37B INSTRUCTIONS - Reports Configuration + Demo Data

> **Role:** Database/Data
> **Sprint:** 37B
> **Focus:** Settings configuration and reports demo data
> **Coordinator:** CLI 1

---

## YOUR TASKS (Complete in order)

### Task 1: Reports Navigation to Sidebar (#62)
**Effort:** 2-3 hours
**File:** `apps/web/app/dashboard/reports/layout.tsx`

**Problem:** Reports module has top navigation tabs but should use sidebar sub-navigation like other modules

**Current State:**
```
Reports
├── [Top Nav: Overview | Financial | Operational | Detailed]
```

**Target State:**
```
Reports (sidebar)
├── Overview
├── Financial
├── Operational
├── Detailed Reports
└── (Future: Custom Reports)
```

**Solution:**
1. Create a reports-specific sidebar component or extend existing sidebar
2. Add sub-navigation items for each report type
3. Remove or repurpose the top navigation tabs
4. Match styling of other modules (Finances, Settings, etc.)

**Acceptance Criteria:**
- [ ] Reports has sidebar sub-navigation
- [ ] All report types accessible from sidebar
- [ ] Active state shows current report section
- [ ] Consistent with other module navigation
- [ ] Mobile responsive (sidebar collapses appropriately)

---

### Task 2: Fiscal Year Configuration (#79)
**Effort:** 2-3 hours
**Files:**
- `apps/web/app/dashboard/settings/organization/page.tsx`
- `apps/web/types/index.ts` (add types)

**Problem:** No way to configure fiscal year start date

**Solution:**

1. Add type to `types/index.ts`:
```typescript
export interface FiscalYearConfig {
  startMonth: number; // 1-12 (January = 1)
  startDay: number;   // 1-31
}
```

2. Add UI in organization settings:
- Dropdown for fiscal year start month
- Common presets: January, April, July, October
- Custom option for specific date

3. Store in Firestore `organizations/{orgId}` document:
```typescript
fiscalYear: {
  startMonth: 1,
  startDay: 1
}
```

**Acceptance Criteria:**
- [ ] Fiscal year start month selectable
- [ ] Setting persists to Firestore
- [ ] Setting loads on page refresh
- [ ] Default is January 1 if not set

---

### Task 3: Payroll Period Configuration (#80)
**Effort:** 2-3 hours
**Files:**
- `apps/web/app/dashboard/settings/organization/page.tsx`
- `apps/web/types/index.ts`

**Problem:** No way to configure payroll periods

**Solution:**

1. Add type to `types/index.ts`:
```typescript
export interface PayrollPeriodConfig {
  frequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  periodStartDay: number;    // Day of week (0-6) or day of month (1-31)
  payDateOffset: number;     // Days after period end to pay
}
```

2. Add UI in organization settings:
- Frequency dropdown: Weekly, Bi-weekly, Semi-monthly, Monthly
- Period start day selector (contextual based on frequency)
- Pay date offset input (e.g., "3 days after period end")

3. Store in Firestore `organizations/{orgId}` document

**Acceptance Criteria:**
- [ ] Payroll frequency selectable
- [ ] Period start day configurable
- [ ] Pay date offset configurable
- [ ] Settings persist to Firestore

---

### Task 4: Tax Configuration (#83)
**Effort:** 3-4 hours
**File:** `apps/web/app/dashboard/settings/organization/page.tsx`

**Problem:** No tax configuration for payroll and financial calculations

**Solution:**

1. Add type:
```typescript
export interface TaxConfig {
  entityType: 'sole_proprietor' | 'llc' | 'partnership' | 's_corp' | 'c_corp';
  federalTaxRate: number;
  stateTaxRate: number;
  localTaxRate: number;
  state: string;
}
```

2. Add UI section "Tax Configuration":
- Entity type dropdown
- Federal tax rate input (%)
- State tax rate input (%)
- State selector
- Optional local tax rate

**Acceptance Criteria:**
- [ ] Tax entity type selectable
- [ ] Federal/state/local tax rates configurable
- [ ] Settings persist to Firestore
- [ ] Reasonable defaults (0% if not set)

---

### Task 5: Reports Demo Data Enhancement (#63, #64, #65)
**Effort:** 8-12 hours
**Files:**
- `scripts/seed-demo/seed-financials.ts`
- Create new: `scripts/seed-demo/seed-reports-data.ts`

**Problems:**
- Reports show minimal historical data
- Project profitability shows $0 labor costs
- Invoice aging lacks realistic distribution

**Solution:**

1. **Historical Revenue (#63):**
   - Add backdated paid invoices (3-6 months)
   - Link to completed projects
   - Vary amounts realistically

2. **Labor Costs (#64):**
   - Ensure time entries have project assignments
   - Link user hourly rates to time entries
   - Calculate realistic labor costs (20-50% of project budget)
   - Update profitability calculations

3. **Invoice Aging (#65):**
   Create realistic distribution:
   ```
   70% current (paid within terms)
   20% 1-30 days past due
   5% 31-60 days past due
   3-5% 61-90+ days past due
   ```

**New seed script structure:**
```typescript
// seed-reports-data.ts
export async function seedReportsData() {
  await seedHistoricalRevenue();
  await seedLaborCostData();
  await seedInvoiceAgingData();
}
```

**Acceptance Criteria:**
- [ ] Financial reports show 3-6 months of data
- [ ] Project profitability shows realistic labor costs
- [ ] Invoice aging has proper distribution
- [ ] All data has correct orgId
- [ ] Seed script runs without errors

---

## FILES YOU OWN (Safe to edit)

```
apps/web/app/dashboard/reports/layout.tsx
apps/web/app/dashboard/settings/organization/page.tsx
apps/web/types/index.ts (add new types only, don't modify existing)
scripts/seed-demo/seed-financials.ts
scripts/seed-demo/seed-reports-data.ts (create new)
```

## FILES TO AVOID (CLI 2 owns these)

```
components/ui/*
components/dashboard/*
app/dashboard/page.tsx
components/layout/Sidebar.tsx (coordinate with CLI 2 if needed)
```

---

## TYPE ADDITIONS

Add these to `apps/web/types/index.ts`:

```typescript
// Organization Settings Extensions
export interface FiscalYearConfig {
  startMonth: number;
  startDay: number;
}

export interface PayrollPeriodConfig {
  frequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  periodStartDay: number;
  payDateOffset: number;
}

export interface TaxConfig {
  entityType: 'sole_proprietor' | 'llc' | 'partnership' | 's_corp' | 'c_corp';
  federalTaxRate: number;
  stateTaxRate: number;
  localTaxRate: number;
  state: string;
}

// Extend Organization type
export interface OrganizationSettings {
  fiscalYear?: FiscalYearConfig;
  payrollPeriod?: PayrollPeriodConfig;
  taxConfig?: TaxConfig;
}
```

---

## VERIFICATION COMMANDS

After each task:
```bash
# Type check
cd apps/web && npx tsc --noEmit

# Run seed scripts
cd scripts/seed-demo && npx ts-node seed-reports-data.ts

# Test in browser via Chrome MCP
```

---

## STATUS UPDATES

After completing each task:
```bash
echo "$(date '+%H:%M') - Task X complete: [brief description]" >> .claude-coordination/cli-3-status.txt
```

---

## COMPLETION CHECKLIST

Before marking sprint complete:
- [ ] All 5 tasks done
- [ ] TypeScript passes
- [ ] Seed scripts run without errors
- [ ] Settings save and load correctly
- [ ] Status file updated
- [ ] Ready for CLI 4 verification
