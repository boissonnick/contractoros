# Sprint 20 Plan — Mobile Integration & Job Costing

> **Created:** 2026-02-02 by Controller Session
> **Duration:** 1 week (Feb 3-9, 2026)
> **Focus:** Complete Sprint 19 unfinished work

---

## Executive Summary

Sprint 19 delivered major features (AI Assistant, Intelligence System, E2E Framework) but left **Mobile UI Integration** and **Job Costing Dashboard** incomplete. Sprint 20 focuses on finishing this work.

---

## Sprint 20 Goals

| Priority | Goal | Effort | Owner |
|----------|------|--------|-------|
| **P0** | Mobile UI Integration | 2-3 days | Dev Sprint |
| **P1** | Job Costing Dashboard | 2 days | Dev Sprint + Database |
| **P2** | E2E Validation | 1 day | E2E Session |

---

## Part 1: Mobile UI Integration (P0)

### Current State

| Page | Mobile Status | Components Needed |
|------|---------------|-------------------|
| Dashboard | ✅ Partial | MobileStats, MobileProjectList, MobileFAB exist |
| Projects List | ✅ Partial | MobileProjectList exists |
| **Clients** | ❌ None | ResponsiveDataView needed |
| **Schedule** | ❌ None | Mobile calendar view needed |
| **Time** | ❌ None | ResponsiveDataView needed |
| **Invoices** | ❌ None | ResponsiveDataView needed |
| **Estimates** | ❌ None | ResponsiveDataView needed |

### Available Components (Ready to Use)

```
apps/web/components/ui/MobileCard.tsx
├── MobileCard          - Card for list items
├── MobileCardList      - Wrapper with spacing
└── ResponsiveDataView  - Auto table/card switch (KEY COMPONENT)

apps/web/components/ui/MobileForm.tsx
├── MobileFormSection   - Collapsible section
├── MobileFormField     - Field with label/error
├── MobileInput         - 48px touch target input
├── MobileTextarea      - Mobile-optimized textarea
├── MobileSelect        - Mobile-optimized select
├── MobileButton        - 48px touch target button
├── MobileActionBar     - Sticky bottom bar
└── MobileBottomSheet   - Modal sheet
```

### Task 1.1: Clients Page Mobile Integration

**File:** `apps/web/app/dashboard/clients/page.tsx`

**Changes:**
1. Import `ResponsiveDataView` from `@/components/ui/MobileCard`
2. Replace the existing table with `ResponsiveDataView`
3. Define columns with `isTitle`, `isBadge`, `badgeColor` props

**Example Pattern:**
```tsx
import { ResponsiveDataView } from '@/components/ui/MobileCard';

const columns = [
  { key: 'name', header: 'Name', isTitle: true },
  { key: 'status', header: 'Status', isBadge: true, badgeColor: (c) => statusColors[c.status] },
  { key: 'email', header: 'Email' },
  { key: 'phone', header: 'Phone', hideOnMobile: true },
  { key: 'totalRevenue', header: 'Revenue', render: (c) => formatCurrency(c.totalRevenue) },
];

<ResponsiveDataView
  data={filteredClients}
  columns={columns}
  onRowClick={(client) => router.push(`/dashboard/clients/${client.id}`)}
  getRowKey={(client) => client.id}
  emptyMessage="No clients found"
/>
```

### Task 1.2: Schedule Page Mobile View

**File:** `apps/web/app/dashboard/schedule/page.tsx`

**Changes:**
1. Add mobile day view (list format instead of grid)
2. Add swipe gestures for day navigation
3. Use `MobileCard` for event display on mobile
4. Hide complex week/month views on mobile, show day/list only

**Mobile-Specific Component:**
```tsx
// Show on mobile only
<div className="md:hidden">
  <MobileScheduleView events={events} selectedDate={selectedDate} />
</div>

// Show on desktop only
<div className="hidden md:block">
  <FullCalendarView ... />
</div>
```

### Task 1.3: Time Page Mobile Integration

**File:** `apps/web/app/dashboard/time/page.tsx`

**Changes:**
1. Import `ResponsiveDataView`
2. Add mobile-friendly time entry with `MobileBottomSheet`
3. Use `MobileActionBar` for quick clock in/out

### Task 1.4: Invoices Page Mobile Integration

**File:** `apps/web/app/dashboard/invoices/page.tsx`

**Changes:**
1. Import `ResponsiveDataView`
2. Add swipe actions (mark paid, send reminder)
3. Mobile-optimized invoice preview

### Task 1.5: Estimates Page Mobile Integration

**File:** `apps/web/app/dashboard/estimates/page.tsx`

**Changes:**
1. Import `ResponsiveDataView`
2. Mobile-friendly estimate builder (if editing on mobile)

---

## Part 2: Job Costing Dashboard (P1)

### Current State

- ✅ `JobCostingCard` component exists
- ✅ `CostBreakdownChart` component exists
- ✅ `useJobCosting` hook exists
- ✅ Integrated into project detail page
- ❌ No dedicated job costing dashboard
- ❌ No margin alerts
- ❌ No cross-project profitability view

### Task 2.1: Create Job Costing Dashboard Page

**File to Create:** `apps/web/app/dashboard/job-costing/page.tsx`

**Features:**
1. **Overview Stats**
   - Total projects value
   - Total costs to date
   - Overall margin %
   - Projects over budget count

2. **Project Profitability Table**
   - List all active projects
   - Show: Budget, Actual Cost, Variance, Margin %
   - Color-coded status (green/yellow/red)
   - Click to project detail

3. **Cost Category Breakdown**
   - Pie/bar chart: Labor, Materials, Subs, Overhead
   - Compare budgeted vs actual by category

4. **Margin Alerts Section**
   - Projects with margin < 10%
   - Projects over budget
   - Cost overruns by category

### Task 2.2: Add Margin Alert System

**File to Create:** `apps/web/lib/hooks/useMarginAlerts.ts`

**Features:**
```typescript
interface MarginAlert {
  projectId: string;
  projectName: string;
  alertType: 'low_margin' | 'over_budget' | 'cost_spike';
  severity: 'warning' | 'critical';
  message: string;
  currentValue: number;
  threshold: number;
}

function useMarginAlerts(orgId: string): {
  alerts: MarginAlert[];
  loading: boolean;
  dismissAlert: (alertId: string) => void;
}
```

### Task 2.3: Add Firestore Rules for Job Costing

**File:** `firestore.rules`

**Add:**
```javascript
match /organizations/{orgId}/jobCostingAlerts/{alertId} {
  allow read, write: if isSameOrg(orgId);
}
```

### Task 2.4: Add Job Costing to Sidebar Navigation

**File:** `apps/web/app/dashboard/layout.tsx`

**Add navigation item:**
```tsx
{ name: 'Job Costing', href: '/dashboard/job-costing', icon: ChartBarSquareIcon }
```

---

## Part 3: E2E Validation (P2)

### Test Suites to Run

| Suite | File | Focus |
|-------|------|-------|
| Smoke | `e2e/suites/00-smoke.md` | Basic functionality |
| Mobile | `e2e/suites/22-ui-ux-mobile.md` | Mobile responsiveness |
| Finances | `e2e/suites/07-finances.md` | Job costing, invoices |

### Test Checklist

- [ ] Clients page renders on mobile (375px)
- [ ] Schedule page renders on mobile
- [ ] Time page renders on mobile
- [ ] Job costing dashboard loads
- [ ] Margin alerts display correctly
- [ ] ResponsiveDataView switches at 768px breakpoint

---

## File Assignment Summary

### Dev Sprint Session

| Day | Task | Files |
|-----|------|-------|
| 1 | Clients + Invoices Mobile | `clients/page.tsx`, `invoices/page.tsx` |
| 2 | Schedule + Time Mobile | `schedule/page.tsx`, `time/page.tsx` |
| 3 | Job Costing Dashboard | `job-costing/page.tsx`, `useMarginAlerts.ts` |

### Database Session

| Task | Files |
|------|-------|
| Firestore Rules | `firestore.rules` |
| Indexes (if needed) | `firestore.indexes.json` |

### E2E Session

| Task | Files |
|------|-------|
| Mobile Tests | `e2e/suites/22-ui-ux-mobile.md` |
| Finance Tests | `e2e/suites/07-finances.md` |

---

## Definition of Done

### Mobile Integration
- [ ] All 5 pages use `ResponsiveDataView` or equivalent
- [ ] Touch targets are 48px minimum
- [ ] No horizontal scroll on mobile
- [ ] Forms use `MobileBottomSheet` or `MobileActionBar`

### Job Costing
- [ ] Dashboard page exists at `/dashboard/job-costing`
- [ ] Shows cross-project profitability
- [ ] Margin alerts functional
- [ ] Navigation link in sidebar

### E2E
- [ ] Smoke tests pass
- [ ] Mobile tests pass at 375px
- [ ] No console errors

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Schedule calendar complex on mobile | High | Show simplified day/list view only |
| Job costing data may not exist | Medium | Show empty state with setup guide |
| TypeScript errors from new components | Low | Run `tsc --noEmit` after each file |

---

## Next Sprint Preview (Sprint 21)

If Sprint 20 completes successfully:
- Email Templates & Automation
- Advanced Reporting Dashboard
- Performance optimizations
