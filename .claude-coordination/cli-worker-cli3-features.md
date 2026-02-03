# CLI 3 Worker Prompt: Feature Development

**Copy this entire prompt into a new Claude Code session.**

---

## Context

You are CLI 3 working on ContractorOS Sprint 39. Your role is to implement new features: navigation architecture, subcontractors module, and schedule enhancements.

**Project:** `/Users/nickbodkins/contractoros`
**App:** `apps/web/`
**Dev Server:** `npm run dev` (port 3000)

---

## Your Tasks

### Phase 1: Navigation Architecture

#### Task 1: Separate Team from Subcontractors (Issue #33)
**Effort:** 8-12h

Team section currently mixes employees and subcontractors.

**Changes:**
1. Team section shows ONLY: Employees, Project Managers
2. Remove subcontractors from Team listing
3. Subcontractors get dedicated section (Task 4)

**Find current implementation:**
```bash
grep -r "subcontractor" apps/web/app/dashboard/team --include="*.tsx"
grep -r "TeamMember" apps/web/components/team --include="*.tsx"
```

**Update team page to filter:**
```tsx
// Filter out subcontractors
const teamMembers = users.filter(u =>
  u.role === 'OWNER' || u.role === 'PM' || u.role === 'FIELD'
);
```

---

#### Task 2: Sidebar Navigation Reorganization (Issue #59)
**Effort:** 8-12h

**Current sidebar location:**
```bash
ls apps/web/components/layout/
```

**New structure:**
```
Dashboard
Projects
Schedule
Team
  └─ Directory
  └─ Availability
  └─ Time Off
Subcontractors (NEW)
  └─ Directory
  └─ Bids
  └─ Compare
Clients
Finances
  └─ Overview
  └─ Invoices
  └─ Expenses
  └─ Payroll
Reports
Settings
```

**Implementation:**
```tsx
const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderIcon },
  { name: 'Schedule', href: '/dashboard/schedule', icon: CalendarIcon },
  {
    name: 'Team',
    icon: UsersIcon,
    children: [
      { name: 'Directory', href: '/dashboard/team' },
      { name: 'Availability', href: '/dashboard/team/availability' },
      { name: 'Time Off', href: '/dashboard/team/time-off' },
    ],
  },
  {
    name: 'Subcontractors',
    icon: WrenchScrewdriverIcon,
    children: [
      { name: 'Directory', href: '/dashboard/subcontractors' },
      { name: 'Bids', href: '/dashboard/subcontractors/bids' },
      { name: 'Compare', href: '/dashboard/subcontractors/compare' },
    ],
  },
  // ... rest
];
```

---

### Phase 2: Subcontractors Module

#### Task 3: Create Dedicated Subcontractors Section
**Effort:** 20-30h

**Files to create:**
```
apps/web/app/dashboard/subcontractors/
├── page.tsx                 # Directory listing
├── [id]/
│   └── page.tsx            # Detail view
├── bids/
│   └── page.tsx            # All bids view
└── compare/
    └── page.tsx            # Comparison tool

apps/web/components/subcontractors/
├── SubcontractorCard.tsx
├── SubcontractorDetail.tsx
├── PerformanceMetrics.tsx
└── SubcontractorFilters.tsx
```

**Directory page features:**
- Search by name, trade, location
- Filter by trade specialty
- Sort by rating, projects completed
- Quick actions: View, Assign to Project

**Detail page features:**
- Full profile with certifications
- Project history table
- Performance metrics (on-time %, rating, total paid)
- Availability calendar

---

### Phase 3: Schedule Enhancements

#### Task 4: Weather Integration (Issue #36)
**Effort:** 12-16h

Add weather data to schedule view.

**Files to create:**
```
apps/web/lib/services/weather.ts
apps/web/components/schedule/WeatherWidget.tsx
apps/web/components/schedule/WeatherAlert.tsx
```

**Weather service:**
```typescript
// lib/services/weather.ts
const WEATHER_API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;

export interface WeatherData {
  date: string;
  high: number;
  low: number;
  precipitation: number;
  conditions: 'sunny' | 'cloudy' | 'rain' | 'snow';
  icon: string;
}

export async function getWeatherForecast(
  lat: number,
  lng: number,
  days: number = 7
): Promise<WeatherData[]> {
  // Use OpenWeatherMap or Weather.gov API
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&cnt=${days}&appid=${WEATHER_API_KEY}&units=imperial`
  );
  // Transform response...
}
```

**Weather widget placement:**
```tsx
// In schedule page
<div className="mb-4">
  <WeatherWidget location={projectLocation} />
</div>
<Calendar events={events} />
```

---

#### Task 5: Enhanced Schedule Views (Issue #37)
**Effort:** 8-12h

Add Day view to existing Week/Month views.

**Day view features:**
- Hourly granularity (6am - 8pm)
- Task detail cards
- Weather for the day
- Crew assignments visible

```tsx
const VIEW_OPTIONS = ['day', 'week', 'month'] as const;

function ScheduleView({ view }: { view: typeof VIEW_OPTIONS[number] }) {
  switch (view) {
    case 'day':
      return <DayView />;
    case 'week':
      return <WeekView />;
    case 'month':
      return <MonthView />;
  }
}
```

---

#### Task 6: Schedule Team Assignment (Issue #38)
**Effort:** 8-12h

Assign team members from calendar view.

**Implementation:**
```tsx
function EventCard({ event, onAssign }) {
  const [showAssignModal, setShowAssignModal] = useState(false);

  return (
    <div className="...">
      <span>{event.title}</span>
      <button onClick={() => setShowAssignModal(true)}>
        <UserPlusIcon className="h-4 w-4" />
      </button>

      {showAssignModal && (
        <AssignmentModal
          event={event}
          availableCrew={getAvailableCrew(event.date)}
          onAssign={(userId) => {
            onAssign(event.id, userId);
            setShowAssignModal(false);
          }}
        />
      )}
    </div>
  );
}
```

---

### Phase 4: Finance Enhancements (Lower Priority)

#### Task 7: Reimbursement Tracking (Issue #49)
**Effort:** 8-12h

**Files to create:**
```
apps/web/app/dashboard/finances/reimbursements/page.tsx
apps/web/components/finances/ReimbursementForm.tsx
apps/web/components/finances/ReimbursementList.tsx
apps/web/lib/hooks/useReimbursements.ts
```

**Workflow:**
1. Employee submits expense (amount, receipt, category, project)
2. Manager reviews → Approve/Reject
3. Finance processes payment
4. Mark as Reimbursed

---

## Execution Order

1. **Task 1-2**: Navigation changes (foundation for everything else)
2. **Task 3**: Subcontractors module (new feature)
3. **Tasks 4-6**: Schedule enhancements (can parallelize)
4. **Task 7**: Reimbursements (lower priority)

---

## Commands

```bash
# Start dev server
cd /Users/nickbodkins/contractoros/apps/web
npm run dev

# Create new page
mkdir -p app/dashboard/subcontractors/[id]
touch app/dashboard/subcontractors/page.tsx

# TypeScript check
npx tsc --noEmit

# Commit pattern
git add apps/web/app/dashboard/subcontractors/
git commit -m "feat(subcontractors): Add dedicated subcontractors module

- Directory page with search/filter
- Detail page with performance metrics
- Bids management view
- Comparison tools

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## File Ownership

CLI 3 owns:
- `app/dashboard/*/page.tsx` (page logic)
- `lib/hooks/` (new hooks)
- New feature routes and components
- `lib/services/` (new services like weather)

**Coordinate with:**
- CLI 2 for component styling
- CLI 1 for demo data
- CLI 4 for Firestore rules if new collections

---

## Success Criteria

- [ ] Team section no longer shows subcontractors
- [ ] New sidebar navigation with collapsible sections
- [ ] `/dashboard/subcontractors` route working
- [ ] Weather widget on schedule (if API key available)
- [ ] Day/Week/Month view toggle
- [ ] TypeScript passes
- [ ] All changes committed
