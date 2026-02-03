# Session A: Critical Fixes + Refactoring

> **Run Command:** `claude "Execute session A from .claude-sessions/SESSION-A-critical-fixes-refactoring.md"`
> **Duration:** 5-8 hours
> **Phases:** 1 + 2
> **Priority:** 🔴 P0 - CRITICAL

---

## Pre-Session Checklist

Before starting, verify:
```bash
cd apps/web && npx tsc --noEmit  # Should pass
docker ps                         # Check if running
firebase projects:list            # Verify CLI access
```

---

## PHASE 1: Critical Fixes (2-3 hours)

### Batch 1.1: Critical Database Fix + Code Consolidation
**Launch these 4 agents in parallel:**

#### Agent 1: Fix Cloud Functions Database (CRITICAL)
```
Task: Fix the Cloud Functions to use the named 'contractoros' database instead of the default database.

CONTEXT:
- File: functions/src/index.ts
- Line 33 currently has: const db = admin.firestore();
- This causes ALL Cloud Functions to write to the WRONG database
- Email triggers, user creation, payment notifications are silently failing

CHANGES REQUIRED:
1. In functions/src/index.ts, change line ~33 from:
   const db = admin.firestore();
   TO:
   const db = getFirestore(admin.app(), 'contractoros');

2. Add import if needed:
   import { getFirestore } from 'firebase-admin/firestore';

3. Search ALL files in functions/src/ for any other uses of:
   - admin.firestore()
   - getFirestore() without the database name
   And fix them all.

4. After fixing, deploy:
   cd functions && npm run deploy
   OR
   firebase deploy --only functions --project contractoros-483812

VERIFICATION:
- Check Firebase Console for successful deployment
- Test by creating a test user or triggering an email

DELIVERABLE: All Cloud Functions using 'contractoros' named database, deployed and verified.
```

#### Agent 2: Consolidate Weather Services
```
Task: Merge the two duplicate weather service files into a single consolidated service.

CONTEXT:
- File 1: apps/web/lib/services/weather.ts (1,002 lines)
- File 2: apps/web/lib/weather-service.ts (896 lines)
- Both handle weather forecasts with slightly different APIs
- This duplication wastes tokens and causes confusion

CHANGES REQUIRED:
1. Read both files to understand their APIs
2. Create a consolidated version in lib/services/weather.ts that:
   - Exports all functions from both files
   - Uses consistent naming
   - Removes duplicate logic
   - Keeps the better implementation of shared functions

3. Update all imports across the codebase:
   - Search for: from '@/lib/weather-service'
   - Change to: from '@/lib/services/weather'

4. Delete the old file: lib/weather-service.ts

5. Run tsc to verify no import errors

DELIVERABLE: Single weather service file, all imports updated, old file deleted.
```

#### Agent 3: Create Shared Formatters Utility
```
Task: Extract duplicated formatting functions into a centralized utility file.

CONTEXT:
- formatCurrency() is duplicated in 6+ files
- formatPercent() is duplicated in 3+ files
- This causes inconsistency and wasted code

FILES WITH DUPLICATES (search to find all):
- lib/utils.ts
- lib/budget-utils.ts
- lib/payments/paymentUtils.ts
- lib/hooks/useJobCosting.ts
- lib/intelligence/bid-intelligence.ts
- lib/utils/tax-calculator.ts

CHANGES REQUIRED:
1. Create new file: apps/web/lib/utils/formatters.ts with:
   ```typescript
   export function formatCurrency(amount: number, currency = 'USD'): string {
     return new Intl.NumberFormat('en-US', {
       style: 'currency',
       currency,
     }).format(amount);
   }

   export function formatPercent(value: number, decimals = 1): string {
     return `${value.toFixed(decimals)}%`;
   }

   export function formatNumber(value: number, decimals = 0): string {
     return new Intl.NumberFormat('en-US', {
       minimumFractionDigits: decimals,
       maximumFractionDigits: decimals,
     }).format(value);
   }

   export function formatPhoneNumber(phone: string): string {
     const cleaned = phone.replace(/\D/g, '');
     if (cleaned.length === 10) {
       return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
     }
     return phone;
   }
   ```

2. Update all files to import from the new location:
   import { formatCurrency, formatPercent } from '@/lib/utils/formatters';

3. Remove the duplicate implementations from each file

4. Run tsc to verify

DELIVERABLE: Centralized formatters.ts, all duplicates removed, imports updated.
```

#### Agent 4: Remove Duplicate useSubcontractors Hook
```
Task: Consolidate duplicate useSubcontractors implementations.

CONTEXT:
- There are multiple implementations of useSubcontractors
- Need to identify the canonical version and remove duplicates

CHANGES REQUIRED:
1. Search for all files containing useSubcontractors:
   - grep -r "useSubcontractors" apps/web/lib/hooks/

2. Identify which implementation is most complete

3. Keep the best version in lib/hooks/useSubcontractors.ts

4. Update all imports to use the canonical location

5. Delete any duplicate files

6. Run tsc to verify

DELIVERABLE: Single useSubcontractors hook, duplicates removed.
```

**Wait for Batch 1.1 to complete before proceeding.**

---

### Batch 1.2: Types File Splitting
**Launch these 4 agents in parallel:**

#### Agent 5: Split Types - User & Organization
```
Task: Extract user and organization types from the monolithic types/index.ts

CONTEXT:
- types/index.ts is 8,986 lines - way too large
- Lines 1-580 contain User, Organization, Team, Permissions types
- These should be in their own file

CHANGES REQUIRED:
1. Create: apps/web/types/user.ts
2. Move these types (approximately lines 1-580):
   - UserProfile
   - Organization
   - OrganizationSettings
   - Team-related types
   - Permission types
   - Role types

3. Add proper exports at the bottom

4. In types/index.ts, add:
   export * from './user';

5. Do NOT update imports yet - the re-export handles it

DELIVERABLE: types/user.ts with all user/org/team types, re-exported from index.ts
```

#### Agent 6: Split Types - Project & Tasks
```
Task: Extract project and task types from types/index.ts

CONTEXT:
- Lines 581-1040 contain Project, Phase, Activity, Task types

CHANGES REQUIRED:
1. Create: apps/web/types/project.ts
2. Move these types:
   - Project
   - ProjectPhase
   - ProjectActivity
   - Task
   - TaskStatus
   - Scope-related types

3. Add proper exports

4. In types/index.ts, add:
   export * from './project';

DELIVERABLE: types/project.ts with all project/task types, re-exported from index.ts
```

#### Agent 7: Split Types - Finance
```
Task: Extract finance types from types/index.ts

CONTEXT:
- Lines 1041-1560 contain Invoice, Expense, Payroll, Quote types

CHANGES REQUIRED:
1. Create: apps/web/types/finance.ts
2. Move these types:
   - Invoice
   - InvoiceLineItem
   - Expense
   - ExpenseCategory
   - PayrollRun
   - PayrollEntry
   - Quote
   - Estimate
   - Budget types

3. Add proper exports

4. In types/index.ts, add:
   export * from './finance';

DELIVERABLE: types/finance.ts with all finance types, re-exported from index.ts
```

#### Agent 8: Split Types - Schedule & Subcontractor
```
Task: Extract schedule and subcontractor types from types/index.ts

CONTEXT:
- Lines 1116-1390 contain Schedule, Subcontractor, Bid types

CHANGES REQUIRED:
1. Create: apps/web/types/schedule.ts with:
   - ScheduleEvent
   - ScheduleAssignment
   - CrewAvailability
   - Calendar types

2. Create: apps/web/types/subcontractor.ts with:
   - Subcontractor
   - Bid
   - BidSolicitation
   - SubAssignment

3. Add proper exports to both

4. In types/index.ts, add:
   export * from './schedule';
   export * from './subcontractor';

DELIVERABLE: Two new type files, re-exported from index.ts
```

**Wait for Batch 1.2 to complete before proceeding.**

---

### Batch 1.3: Remaining Types + Import Updates
**Launch these 2 agents in parallel:**

#### Agent 9: Split Types - Remaining (Integration, Communication, etc.)
```
Task: Extract remaining types and create index organization

CONTEXT:
- Remaining types: Integration, Communication, Equipment, Safety, etc.

CHANGES REQUIRED:
1. Create: apps/web/types/integration.ts
   - QuickBooks types
   - OAuth types
   - Sync types

2. Create: apps/web/types/communication.ts
   - Message types
   - SMS types
   - Signature types

3. Create: apps/web/types/equipment.ts
   - Equipment
   - EquipmentCheckout
   - Maintenance

4. Update types/index.ts to be a clean re-export file:
   ```typescript
   // Domain type exports
   export * from './user';
   export * from './project';
   export * from './finance';
   export * from './schedule';
   export * from './subcontractor';
   export * from './integration';
   export * from './communication';
   export * from './equipment';

   // Keep any shared utility types here
   export type Timestamp = ...
   ```

DELIVERABLE: All types split into domain files, clean index.ts re-exporting all
```

#### Agent 10: Verify All Imports Work
```
Task: Run TypeScript compilation and fix any import errors

CONTEXT:
- After splitting types, some imports may break
- Need to verify everything compiles

CHANGES REQUIRED:
1. Run: cd apps/web && npx tsc --noEmit

2. If errors, analyze and fix:
   - Missing exports → add to appropriate type file
   - Circular dependencies → restructure imports
   - Type not found → ensure re-export in index.ts

3. Keep running tsc until it passes

DELIVERABLE: Clean TypeScript compilation with no errors
```

**Wait for Batch 1.3 to complete.**

---

## PHASE 2: Refactoring Completion (3-5 hours)

### Batch 2.1: Large File Splitting
**Launch these 5 agents in parallel:**

#### Agent 11: Split Templates Page
```
Task: Split the massive templates settings page into smaller components

CONTEXT:
- File: apps/web/app/dashboard/settings/templates/page.tsx
- Currently 2,424 lines - way too large
- Contains multiple template types (email, quote, SOW, etc.)

CHANGES REQUIRED:
1. Create component directory: components/settings/templates/

2. Extract each template editor into its own component:
   - EmailTemplateEditor.tsx
   - QuoteTemplateEditor.tsx
   - SOWTemplateEditor.tsx
   - InvoiceTemplateEditor.tsx
   - ContractTemplateEditor.tsx

3. Create a shared TemplateEditorBase.tsx for common functionality

4. Update page.tsx to import and use the components
   - Should be under 200 lines after extraction

5. Run tsc to verify

DELIVERABLE: Templates page split into 6+ files, each under 500 lines
```

#### Agent 12: Split useMaterials Hook
```
Task: Split the large useMaterials hook into focused hooks

CONTEXT:
- File: apps/web/lib/hooks/useMaterials.ts
- Currently 1,344 lines
- Contains CRUD, filtering, categorization, and more

CHANGES REQUIRED:
1. Create: lib/hooks/materials/useMaterialsCrud.ts
   - Basic CRUD operations (create, read, update, delete)

2. Create: lib/hooks/materials/useMaterialsFilters.ts
   - Filtering and search logic

3. Create: lib/hooks/materials/useMaterialsCategories.ts
   - Category management

4. Update useMaterials.ts to be a facade that combines them:
   ```typescript
   export function useMaterials(orgId: string) {
     const crud = useMaterialsCrud(orgId);
     const filters = useMaterialsFilters(orgId);
     const categories = useMaterialsCategories(orgId);

     return { ...crud, ...filters, ...categories };
   }
   ```

5. Run tsc to verify

DELIVERABLE: useMaterials split into 3 focused hooks + facade
```

#### Agent 13: Split useReports Hook
```
Task: Split useReports into report-type-specific hooks

CONTEXT:
- File: apps/web/lib/hooks/useReports.ts
- Currently 1,097 lines
- Contains logic for financial, operational, and other reports

CHANGES REQUIRED:
1. Create: lib/hooks/reports/useFinancialReports.ts
2. Create: lib/hooks/reports/useOperationalReports.ts
3. Create: lib/hooks/reports/usePayrollReports.ts
4. Create: lib/hooks/reports/useCustomReports.ts

5. Update useReports.ts as a facade or re-export

6. Run tsc to verify

DELIVERABLE: useReports split into 4 focused hooks
```

#### Agent 14: Split useSchedule Hook
```
Task: Split useSchedule into focused hooks

CONTEXT:
- File: apps/web/lib/hooks/useSchedule.ts
- Currently 963 lines

CHANGES REQUIRED:
1. Create: lib/hooks/schedule/useScheduleEvents.ts
   - Event CRUD operations

2. Create: lib/hooks/schedule/useScheduleAssignments.ts
   - Crew assignments

3. Create: lib/hooks/schedule/useScheduleFilters.ts
   - Date range, crew, project filters

4. Update useSchedule.ts as facade

5. Run tsc to verify

DELIVERABLE: useSchedule split into 3 focused hooks
```

#### Agent 15: Split OffboardingWizard
```
Task: Split OffboardingWizard into step components

CONTEXT:
- File: apps/web/components/team/OffboardingWizard.tsx
- Currently 958 lines
- Multi-step wizard that should use composition

CHANGES REQUIRED:
1. Create: components/team/offboarding/OffboardingStep1.tsx (Info collection)
2. Create: components/team/offboarding/OffboardingStep2.tsx (Access removal)
3. Create: components/team/offboarding/OffboardingStep3.tsx (Asset return)
4. Create: components/team/offboarding/OffboardingStep4.tsx (Final review)
5. Create: components/team/offboarding/OffboardingStep5.tsx (Confirmation)

6. Update OffboardingWizard.tsx to orchestrate steps
   - Should be under 200 lines

7. Run tsc to verify

DELIVERABLE: Wizard split into 5 step components + orchestrator
```

**Wait for Batch 2.1 to complete.**

---

### Batch 2.2: Hook Standardization
**Launch these 4 agents in parallel:**

#### Agent 16: Standardize Timestamp Conversion (Hooks A-M)
```
Task: Ensure consistent timestamp conversion in hooks starting with A-M

CONTEXT:
- Some hooks use convertTimestamp(), others use convertTimestampsDeep()
- Need consistent pattern across all hooks

STANDARD PATTERN:
```typescript
import { convertTimestampsDeep, DATE_FIELDS } from '@/lib/firebase/timestamp-converter';

// In query results:
const data = convertTimestampsDeep(doc.data(), DATE_FIELDS);
```

CHANGES REQUIRED:
1. Find all hooks in lib/hooks/ starting with letters A-M
2. Check their timestamp conversion approach
3. Update to use the standard pattern above
4. Ensure DATE_FIELDS includes all date fields for that type

DELIVERABLE: All A-M hooks using consistent timestamp conversion
```

#### Agent 17: Standardize Timestamp Conversion (Hooks N-Z)
```
Task: Ensure consistent timestamp conversion in hooks starting with N-Z

Same as Agent 16 but for hooks N-Z.

DELIVERABLE: All N-Z hooks using consistent timestamp conversion
```

#### Agent 18: Standardize Error Return Pattern
```
Task: Ensure all hooks return consistent { data, loading, error } shape

CONTEXT:
- Some hooks return { items, loading, error }
- Others return { data, isLoading, err }
- Need consistency

STANDARD PATTERN:
```typescript
interface HookResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

// For collections:
interface CollectionHookResult<T> {
  items: T[];
  loading: boolean;
  error: Error | null;
}
```

CHANGES REQUIRED:
1. Audit all hooks in lib/hooks/
2. Update return types to match standard
3. Update any components that use the old property names

DELIVERABLE: All hooks returning consistent shape
```

#### Agent 19: Add JSDoc to Top 20 Hooks
```
Task: Add comprehensive JSDoc documentation to the most-used hooks

CONTEXT:
- Hooks lack documentation
- Makes onboarding and maintenance harder

TOP 20 HOOKS TO DOCUMENT:
1. useAuth
2. useProjects
3. useClients
4. useInvoices
5. useEstimates
6. useTasks
7. useTimeEntries
8. useSchedule
9. useMaterials
10. useSubcontractors
11. useExpenses
12. useTeam
13. useMessages
14. usePhotos
15. useDailyLogs
16. useEquipment
17. useRFIs
18. usePermissions
19. useSignatures
20. useReports

JSDoc FORMAT:
```typescript
/**
 * Hook for managing project data with real-time updates.
 *
 * @param orgId - The organization ID to scope queries
 * @returns {Object} Project data and operations
 * @returns {Project[]} items - Array of projects
 * @returns {boolean} loading - Loading state
 * @returns {Error|null} error - Error if any
 * @returns {Function} createProject - Create a new project
 * @returns {Function} updateProject - Update existing project
 * @returns {Function} deleteProject - Delete a project
 *
 * @example
 * const { items: projects, loading, createProject } = useProjects(orgId);
 */
```

DELIVERABLE: Top 20 hooks fully documented with JSDoc
```

**Wait for Batch 2.2 to complete.**

---

### Batch 2.3: Performance Optimizations
**Launch these 3 agents in parallel:**

#### Agent 20: Add useMemo to Dashboard
```
Task: Add memoization to prevent unnecessary re-renders on dashboard

CONTEXT:
- File: apps/web/app/dashboard/page.tsx
- Line 112-120: statusConfig object recreated every render
- Other computed values not memoized

CHANGES REQUIRED:
1. Wrap statusConfig in useMemo:
   ```typescript
   const statusConfig = useMemo(() => ({
     // ... config
   }), []);
   ```

2. Find other expensive calculations and memoize them

3. Add useCallback to event handlers passed to children

4. Run tsc to verify

DELIVERABLE: Dashboard page with proper memoization
```

#### Agent 21: Add useCallback to Form Components
```
Task: Add useCallback patterns to form event handlers

CONTEXT:
- Form components often pass callbacks to children
- Without useCallback, children re-render unnecessarily

FILES TO CHECK:
- components/*/FormModal.tsx
- components/*/Editor.tsx
- app/dashboard/*/page.tsx (forms)

CHANGES REQUIRED:
1. Find form submit handlers, onChange handlers
2. Wrap in useCallback with proper dependencies
3. Document the pattern for future reference

DELIVERABLE: Form components using useCallback properly
```

#### Agent 22: Document Component Patterns
```
Task: Create a component patterns documentation file

CONTEXT:
- No documented patterns for components
- Leads to inconsistency

CHANGES REQUIRED:
1. Create: docs/COMPONENT_PATTERNS.md

2. Document these patterns:
   - Page component structure
   - Modal component structure
   - Form component structure
   - List/Table component structure
   - Card component structure
   - Hook usage patterns
   - Memoization guidelines
   - Error boundary usage

3. Include code examples for each

DELIVERABLE: Comprehensive component patterns documentation
```

**Wait for Batch 2.3 to complete.**

---

## VERIFICATION & SELF-IMPROVEMENT

### Final Verification
```
Run these commands to verify session success:

1. TypeScript compilation:
   cd apps/web && npx tsc --noEmit

2. Check no duplicate files remain:
   find apps/web/lib -name "*.ts" | xargs grep -l "formatCurrency" | wc -l
   # Should be 1 (the formatters.ts file)

3. Verify Cloud Functions deployed:
   firebase functions:list --project contractoros-483812

4. Check types structure:
   ls -la apps/web/types/
   # Should show: user.ts, project.ts, finance.ts, schedule.ts, etc.

5. Check large files are split:
   wc -l apps/web/app/dashboard/settings/templates/page.tsx
   # Should be under 300 lines
```

### Self-Improvement Analysis

**Launch this agent after all work is complete:**

#### Agent 23: Session Retrospective & Documentation Update
```
Task: Analyze the session's work, identify patterns, and update documentation to prevent future issues.

PROCESS:
1. ANALYZE ERRORS ENCOUNTERED:
   - Review any TypeScript errors that occurred
   - Review any runtime errors
   - Review any patterns that caused issues
   - Note which refactoring approaches worked well

2. IDENTIFY COMMON PATTERNS:
   - What mistakes were made repeatedly?
   - What took longer than expected?
   - What went smoothly?

3. UPDATE CLAUDE.MD:
   If you identified patterns that should be documented, update /Users/nickbodkins/contractoros/CLAUDE.md with:
   - New file location conventions (types split)
   - New import patterns
   - Hook naming conventions
   - Any gotchas discovered

4. UPDATE COMPONENT_PATTERNS.md:
   Add any patterns discovered during refactoring.

5. CREATE SESSION LEARNINGS:
   Create: .claude-sessions/SESSION-A-learnings.md with:
   - What was accomplished
   - Time taken per batch
   - Issues encountered and solutions
   - Recommendations for future sessions

6. UPDATE SPRINT_STATUS.md:
   Mark Phase 1 and Phase 2 as complete.

DELIVERABLE: Updated documentation, learnings file, sprint status updated
```

---

## Session A Completion Checklist

- [ ] Cloud Functions using 'contractoros' database
- [ ] Email triggers verified working
- [ ] Weather services consolidated (2 files → 1)
- [ ] Formatters centralized
- [ ] Types split into 6+ domain files
- [ ] Templates page split (<300 lines)
- [ ] useMaterials split (3 hooks)
- [ ] useReports split (4 hooks)
- [ ] useSchedule split (3 hooks)
- [ ] OffboardingWizard split (5 steps)
- [ ] Timestamp conversion standardized
- [ ] Error returns standardized
- [ ] Top 20 hooks documented
- [ ] Dashboard memoized
- [ ] Form callbacks optimized
- [ ] Component patterns documented
- [ ] Self-improvement analysis complete
- [ ] CLAUDE.md updated with learnings
- [ ] TypeScript compilation passing

---

## Next Session

After completing Session A, proceed to:
**Session B: Testing + Pagination** (`.claude-sessions/SESSION-B-testing-pagination.md`)
