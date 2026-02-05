# EPIC-07: Job Costing Engine (Sprint 64)

> **Status:** Spec
> **Owner:** Product Agent
> **Target:** Sprint 64

---

## 1. Objective
Implement "Project Contribution Margin" logic to track project-level profitability. This moves beyond simple revenue tracking to a full Cost vs. Revenue model, serving as the foundation for the BI Dashboard.

## 2. Key Concepts

### Contribution Margin Model
*   **Formula:** `Project Revenue - Direct Costs = Contribution Margin`
*   **Target Margin:** ~30-50% (to cover Company Operating Costs).
*   **Operating Costs:** (Tech, Insurance, Admin, Equipment) are **NOT** allocated to individual projects in this MVP. They are tracked at the Company/P&L level.

## 3. Data Model Requirements

### A. Direct Costs (The "Big 3")
We need to track three distinct cost buckets per project:

1.  **Direct Labor Cost**
    *   **Source:** `TimeEntry` records.
    *   **Calculation:** `Hours * Employee Hourly Cost`.
    *   **Requires:** Adding `hourlyCost` field to `User` profile (Role: OWNER/ADMIN only view).

2.  **Materials Cost**
    *   **Source:** `Expense` records (Category = 'Materials').
    *   **Sync:** From QuickBooks expenses or manual entry.
    *   **Logic:** Must be tagged to a `projectId`.

3.  **Subcontractor Cost**
    *   **Source:** `Expense` records (Category = 'Subcontractors') or `Bill` records.
    *   **Sync:** From QuickBooks bills/expenses.
    *   **Logic:** Must be tagged to a `projectId`.

### B. Firestore Schema Updates

#### `projects/{projectId}/financials` (Collection or Document)
```typescript
interface ProjectFinancials {
  totalRevenue: number;         // Sum of invoices
  totalDirectCost: number;      // labor + materials + subs
  grossProfit: number;          // revenue - directCost
  grossMarginPercent: number;   // (grossProfit / revenue) * 100

  // Cost Breakdowns
  laborCost: number;
  materialsCost: number;
  subcontractorCost: number;
  equipmentCost: number;        // Direct allocations (rentals)
  otherDirectCost: number;      // Permits, etc.

  updatedAt: Timestamp;
}
```

## 4. Key Features

### Feature A: Cost Aggregation Trigger
**User Story:** When I add an expense or approve a timesheet, the Project's financial totals update automatically.
*   **Tech:** Cloud Function `onWrite` for `expenses` and `time_entries`.

### Feature B: Project Financial Widget
**User Story:** On the Project Dashboard, I want to see how much money this job is making *right now*.
*   **UI:** Card showing Revenue, Direct Costs, and Contribution Margin $.
*   **Visual:** "Margin Meter" (Green > 30%, Red < 15%).

### Feature C: Labor Cost Management
**User Story:** As an Owner, I need to set the "Cost Rate" for my employees so labor calculations are accurate.
*   **UI:** Settings > Team > [Employee] > "Hourly Cost Rate" (Private field).

## 5. Acceptance Criteria
*   [ ] `ProjectFinancials` schema created.
*   [ ] Cloud Function aggregates Expenses (Materials/Subs) to Project.
*   [ ] Cloud Function aggregates Time Entries * Rate to Project Labor Cost.
*   [ ] "Project Profitability" card visible on Project Dashboard.
*   [ ] Contribution Margin is accurate based on test data.
