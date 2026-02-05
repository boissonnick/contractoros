# EPIC-08: Financial Intelligence (Sprint 65)

> **Status:** Spec
> **Owner:** Product Agent
> **Target:** Sprint 65

---

## 1. Objective
Deliver actionable insights to the Business Owner through high-level dashboards. The goal is to answer: "Is my business healthy?" and "Where am I making money?"

## 2. Priority: Sequential Delivery

### Dashboard A: Company Overview (The "Pulse")
**User Story:** As an Owner, I want a single screen to check my business health every morning.

**Key Metrics:**
1.  **Revenue (MTD/YTD):** Total invoiced.
2.  **Gross Margin (MTD/YTD):** Aggregated Contribution Margin % across all active projects.
3.  **Active Projects:** Count of projects in progress.
4.  **Pipeline Value:** Total value of "Open" Estimates.
5.  **Accounts Receivable:** Total unplanned invoices > 0 days overdue.

**Visuals:**
*   **Revenue Trend:** Line chart (Last 6 months).
*   **Margin Trend:** Line chart (Last 6 months - verify consistency).

### Dashboard B: Project Profitability Leaderboard
**User Story:** As a PM/Owner, I want to know which jobs are bleeding money so I can intervene.

**Key Features:**
1.  **Table View:** Sortable list of Projects.
    *   Columns: Name, Start Date, Revenue, Direct Cost, **Margin $**, **Margin %**.
2.  **RAG Status:** Color code Margin %.
    *   Green: > 25%
    *   Yellow: 15-25%
    *   Red: < 15% (Configurable thresholds).
3.  **Drill Down:** Clicking a row goes to `Project Dashboard > Financials Tab`.

### Dashboard C: Cash Flow (The "Runway")
**User Story:** As a CFO/Owner, I need to ensure we can make payroll next week.

**Key Features:**
1.  **AR Aging:** Bar chart (0-30, 31-60, 61-90, 90+ days).
2.  **Projection:**
    *   **In:** Expected payment dates from Invoices.
    *   **Out:** Upcoming Bills + Average Weekly Payroll.

## 3. Technical Implementation

### Components
*   `components/dashboard/KPICard.tsx` (Reuse existing if possible).
*   `components/charts/RevenueTrendChart.tsx` (Recharts).
*   `components/charts/MarginLeaderboardTable.tsx`.

### Data Source
*   Leverage `projects/{projectId}/financials` (built in Sprint 64).
*   Create new `stats/company_daily` collection for historical trend data (populated via Cloud Function daily cron).

## 4. Acceptance Criteria
*   [ ] "Intelligence" tab added to main Sidebar.
*   [ ] Company Overview loads < 2s.
*   [ ] Revenue/Margin numbers match the sum of individual projects.
*   [ ] Mobile View: Stacked cards instead of complex tables.
