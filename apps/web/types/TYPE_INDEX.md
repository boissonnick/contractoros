# Types Index - Quick Reference

> **Purpose:** Find types without reading the entire 6000-line `index.ts` file.
> **Last Updated:** 2026-01-29

## BEST: Use Domain-Specific Type Files

For commonly used types, import from the smaller domain files instead of the main index:

```typescript
// Core types (~150 lines) - User, Organization
import { UserProfile, Organization, UserRole } from '@/types/domains/core';

// Client types (~120 lines) - Client CRM
import { Client, ClientStatus, ClientFinancials } from '@/types/domains/client';
```

**Available domain files:**
- `types/domains/core.ts` - UserProfile, Organization, Auth (~150 lines)
- `types/domains/client.ts` - Client, ClientNote, ClientFinancials (~120 lines)

For types not yet extracted to domain files, use the section map below.

## How to Use This File

1. Find the section you need below
2. Note the line range
3. Read only that section: `Read file with offset=X, limit=Y`

## Section Map

| Section | Lines | Key Types |
|---------|-------|-----------|
| **User & Organization** | 1-153 | `UserProfile`, `UserRole`, `Organization`, `OrgSettings` |
| **Payroll Fields** | 24-86 | `PaySchedule`, `PayMethod`, `BankInfo`, `W4Info` (on UserProfile) |
| **Permissions** | 154-580 | `UserPermissions`, `RolePermission`, `PermissionFlags` |
| **User Invitations** | 581-604 | `UserInvitation`, `InvitationStatus` |
| **Projects** | 605-669 | `Project`, `ProjectStatus`, `ProjectType` |
| **Activity Feed** | 670-729 | `ProjectActivity`, `ActivityType` |
| **Phase Templates** | 730-750 | `PhaseTemplate` |
| **Project Phases** | 751-798 | `Phase`, `PhaseStatus` |
| **Quotes** | 799-818 | `Quote`, `QuoteStatus` |
| **Client Preferences** | 819-855 | `ClientPreferences`, `CommunicationPreference` |
| **Tasks & Scope** | 856-967 | `Task`, `TaskStatus`, `ScopeItem`, `ChecklistItem` |
| **Task Templates** | 968-996 | `TaskTemplate` |
| **Task Comments** | 997-1011 | `TaskComment` |
| **Task Activity** | 1012-1039 | `TaskActivity` |
| **Time Tracking** | 1040-1072 | `TimeEntry`, `TimeEntryStatus`, `BreakType` |
| **Legacy Payroll** | 1073-1115 | `PayrollEntry`, `PayrollRun` (simple versions) |
| **Scheduling** | 1116-1156 | `ScheduleEvent`, `CrewAvailability` |
| **Subcontractors** | 1157-1196 | `Subcontractor`, `SubcontractorStatus` |
| **Sub Assignments** | 1197-1231 | `SubAssignment` |
| **Bids** | 1232-1268 | `Bid`, `BidStatus` |
| **Bid Solicitations** | 1269-1291 | `BidSolicitation` |
| **Expenses** | 1292-1424 | `Expense`, `ExpenseCategory`, `ExpenseStatus` |
| **Purchase Orders** | 1425-1481 | `PurchaseOrder`, `PurchaseOrderStatus` |
| **Cost Codes** | 1482-1521 | `CostCode`, `CostCodeCategory` |
| **Budget & Costing** | 1522-1557 | `BudgetLineItem`, `JobCostSummary` |
| **Photos** | 1558-1682 | `ProjectPhoto`, `PhotoAlbum` |
| **Issues** | 1683-1707 | `ProjectIssue`, `IssueStatus` |
| **Daily Logs** | 1714-1739 | `DailyLogEntry`, `DailyLogCategory` |
| **Navigation** | 1740-1751 | `NavItem` |
| **API Response** | 1752-1770 | `ApiResponse` |
| **Dashboard Stats** | 1771-1798 | `DashboardStats` |
| **SOW** | 1799-1859 | `ScopeOfWork`, `SOWSection` |
| **Change Orders** | 1860-1928 | `ChangeOrder`, `ChangeOrderStatus` |
| **RFIs** | 1929-2013 | `RFI`, `RFIStatus` |
| **Submittals** | 2014-2099 | `Submittal`, `SubmittalStatus` |
| **Punch Lists** | 2100-2193 | `PunchListItem`, `PunchListStatus` |
| **Estimates** | 2194-2325 | `Estimate`, `EstimateLineItem`, `EstimateStatus` |
| **Cost Catalog** | 2326-2351 | `CostCatalogItem` |
| **Labor Rates** | 2352-2364 | `LaborRate` |
| **Estimate Templates** | 2365-2387 | `EstimateTemplate` |
| **Invoices** | 2388-2503 | `Invoice`, `InvoiceLineItem`, `InvoiceStatus` |
| **Lien Waivers** | 2504-2537 | `LienWaiver`, `LienWaiverType` |
| **Accounting Integration** | 2538-2630 | `AccountingIntegration`, `SyncStatus` |
| **Selections** | 2631-2692 | `Selection`, `SelectionStatus` |
| **Warranty** | 2693-2739 | `WarrantyItem`, `WarrantyStatus` |
| **Messaging** | 2740-2833 | `Message`, `Conversation`, `NotificationPreference` |
| **Safety** | 2834-2907 | `SafetyIncident`, `SafetyChecklist` |
| **Equipment** | 2908-3000 | `Equipment`, `EquipmentCheckout` |

## Sprint-Specific Quick References

### Sprint 9B: Payroll Module
```
Lines to read:
- 24-86: UserProfile payroll fields (PaySchedule, PayMethod, BankInfo, W4Info)
- 1040-1072: TimeEntry types
- 1073-1115: Legacy PayrollEntry, PayrollRun

Reference hooks:
- lib/hooks/useTimeEntries.ts
- lib/hooks/useExpenses.ts (similar approval workflow)
```

### Sprint 9C: CSV Import
```
Lines to read:
- 1-153: UserProfile (for team import)
- 605-669: Project types (for project import)
- 856-967: Task types (for task import)

Reference hooks:
- lib/hooks/useClients.ts (bulk operations pattern)
```

## Common Type Patterns

### Status Types
Most modules follow this pattern:
```typescript
export type XStatus = 'draft' | 'pending' | 'active' | 'completed' | 'cancelled';
export const X_STATUSES: Record<XStatus, { label: string; color: string }> = { ... };
```

### Entity Types
```typescript
export interface X {
  id: string;
  orgId: string;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  // ... entity-specific fields
}
```

### Create Operations
```typescript
// Use Omit to exclude auto-generated fields
type CreateX = Omit<X, 'id' | 'createdAt' | 'updatedAt'>;
```
