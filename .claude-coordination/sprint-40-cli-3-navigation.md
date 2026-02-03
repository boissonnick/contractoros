# Sprint 40 - CLI 3: Navigation & Subcontractors Module

**Copy this entire prompt into a new Claude Code session.**

---

## Context

You are CLI 3 working on ContractorOS Sprint 40. Your role is to restructure navigation (separating Team from Subcontractors) and build the dedicated Subcontractors module.

**Project:** `/Users/nickbodkins/contractoros`
**App:** `apps/web/`
**Dev Server:** `npm run dev` (port 3000)

---

## Your Tasks

### Task 1: Separate Team from Subcontractors (Issue #33)
**Effort:** 8-12h

Team section currently mixes employees and subcontractors. They need to be separate.

**Find current implementation:**
```bash
grep -r "subcontractor" apps/web/app/dashboard/team --include="*.tsx"
grep -r "TeamMember" apps/web/components/team --include="*.tsx"
```

**Changes:**
1. Team section shows ONLY: Employees (OWNER, PM, FIELD roles)
2. Remove subcontractors from Team listing
3. Subcontractors get dedicated section (Task 3)

**Update team page filter:**
```tsx
// In team page query
const teamMembers = users.filter(u =>
  u.role === 'OWNER' || u.role === 'PM' || u.role === 'FIELD' || u.role === 'EMPLOYEE'
);

// Explicitly exclude subcontractors
const isSubcontractor = (user: UserProfile) =>
  user.role === 'CONTRACTOR' || user.userType === 'subcontractor';
```

**Acceptance Criteria:**
- [ ] Team page shows only employees
- [ ] No subcontractors in Team listing
- [ ] Team count reflects employees only

---

### Task 2: Sidebar Navigation Reorganization (Issue #59)
**Effort:** 8-12h

**Current sidebar location:**
```bash
cat apps/web/app/dashboard/layout.tsx
```

**New structure:**
```
Dashboard
Projects
Schedule
Team
  └─ Directory (/dashboard/team)
  └─ Availability (/dashboard/team/availability)
  └─ Time Off (/dashboard/team/time-off)
Subcontractors (NEW)
  └─ Directory (/dashboard/subcontractors)
  └─ Bids (/dashboard/subcontractors/bids)
  └─ Compare (/dashboard/subcontractors/compare)
Clients
Finances
  └─ Overview
  └─ Invoices
  └─ Expenses
  └─ Payroll
Reports
Settings
Help
```

**Implementation - Collapsible nav items:**
```tsx
interface NavItemWithChildren extends NavItem {
  children?: { label: string; href: string }[];
}

const navItems: NavItemWithChildren[] = [
  { label: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { label: 'Projects', href: '/dashboard/projects', icon: FolderIcon },
  { label: 'Schedule', href: '/dashboard/schedule', icon: CalendarIcon },
  {
    label: 'Team',
    href: '/dashboard/team',
    icon: UsersIcon,
    children: [
      { label: 'Directory', href: '/dashboard/team' },
      { label: 'Availability', href: '/dashboard/team/availability' },
      { label: 'Time Off', href: '/dashboard/team/time-off' },
    ],
  },
  {
    label: 'Subcontractors',
    href: '/dashboard/subcontractors',
    icon: WrenchScrewdriverIcon,
    children: [
      { label: 'Directory', href: '/dashboard/subcontractors' },
      { label: 'Bids', href: '/dashboard/subcontractors/bids' },
      { label: 'Compare', href: '/dashboard/subcontractors/compare' },
    ],
  },
  // ... rest
];
```

**Collapsible NavItem Component:**
```tsx
function CollapsibleNavItem({ item, isActive }: { item: NavItemWithChildren; isActive: boolean }) {
  const [isExpanded, setIsExpanded] = useState(isActive);
  const Icon = item.icon;

  if (!item.children) {
    return <NavLink item={item} isActive={isActive} />;
  }

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm',
          isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          {item.label}
        </div>
        <ChevronDownIcon
          className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')}
        />
      </button>
      {isExpanded && (
        <div className="ml-8 mt-1 space-y-1">
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className="block px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50"
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Collapsible nav items work
- [ ] Team has sub-items
- [ ] Subcontractors has sub-items
- [ ] Active state highlights parent when child active

---

### Task 3: Create Subcontractors Directory Route
**Effort:** 6-8h

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
```

**Directory page features:**
- Search by name, trade, location
- Filter by trade specialty
- Sort by rating, projects completed
- Quick actions: View, Assign to Project

**Basic Directory Page:**
```tsx
// app/dashboard/subcontractors/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { useSubcontractors } from '@/lib/hooks/useSubcontractors';
import { PageHeader, Card, Badge, Button, Input } from '@/components/ui';
import { SubcontractorCard } from '@/components/subcontractors/SubcontractorCard';
import { MagnifyingGlassIcon, FunnelIcon, PlusIcon } from '@heroicons/react/24/outline';

const TRADE_FILTERS = ['All Trades', 'Plumbing', 'Electrical', 'HVAC', 'Framing', 'Drywall', 'Painting', 'Flooring'];

export default function SubcontractorsPage() {
  const { subcontractors, loading } = useSubcontractors();
  const [searchQuery, setSearchQuery] = useState('');
  const [tradeFilter, setTradeFilter] = useState('All Trades');

  const filteredSubs = useMemo(() => {
    return subcontractors.filter(sub => {
      const matchesSearch = sub.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.contactName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTrade = tradeFilter === 'All Trades' || sub.trade === tradeFilter;
      return matchesSearch && matchesTrade;
    });
  }, [subcontractors, searchQuery, tradeFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subcontractors"
        description="Manage your subcontractor network"
        actions={
          <Button variant="primary" icon={<PlusIcon className="h-4 w-4" />}>
            Add Subcontractor
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search subcontractors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <select
          value={tradeFilter}
          onChange={(e) => setTradeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          {TRADE_FILTERS.map(trade => (
            <option key={trade} value={trade}>{trade}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubs.map(sub => (
          <SubcontractorCard key={sub.id} subcontractor={sub} />
        ))}
      </div>
    </div>
  );
}
```

---

### Task 4: Create SubcontractorCard Component
**Effort:** 3-4h

**File:** `apps/web/components/subcontractors/SubcontractorCard.tsx`

```tsx
interface SubcontractorCardProps {
  subcontractor: Subcontractor;
  onAssign?: () => void;
}

export function SubcontractorCard({ subcontractor, onAssign }: SubcontractorCardProps) {
  const sub = subcontractor;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{sub.companyName}</h3>
          <p className="text-sm text-gray-500">{sub.contactName}</p>
        </div>
        <Badge variant={sub.isPreferred ? 'success' : 'default'}>
          {sub.isPreferred ? 'Preferred' : sub.trade}
        </Badge>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <StarIcon className="h-4 w-4 text-yellow-500" />
          <span>{sub.rating?.toFixed(1) || 'N/A'} rating</span>
          <span className="text-gray-400">•</span>
          <span>{sub.projectsCompleted || 0} projects</span>
        </div>
        {sub.phone && (
          <div className="flex items-center gap-2">
            <PhoneIcon className="h-4 w-4" />
            <span>{sub.phone}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <Link href={`/dashboard/subcontractors/${sub.id}`}>
          <Button variant="outline" size="sm">View</Button>
        </Link>
        {onAssign && (
          <Button variant="primary" size="sm" onClick={onAssign}>
            Assign
          </Button>
        )}
      </div>
    </Card>
  );
}
```

---

### Task 5: Create Subcontractor Detail Page
**Effort:** 6-8h

**File:** `apps/web/app/dashboard/subcontractors/[id]/page.tsx`

**Features:**
- Full profile with certifications
- Project history table
- Performance metrics (on-time %, rating, total paid)
- Availability calendar (optional)
- Bid history

---

### Task 6: Verify useSubcontractors Hook
**Effort:** 2-3h

Ensure the hook exists and works:

```bash
cat apps/web/lib/hooks/useSubcontractors.ts
```

If missing, create it:
```typescript
export function useSubcontractors() {
  const { profile } = useAuth();
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.orgId) return;

    const q = query(
      collection(db, 'organizations', profile.orgId, 'subcontractors'),
      orderBy('companyName')
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Subcontractor));
      setSubcontractors(data);
      setLoading(false);
    });

    return unsub;
  }, [profile?.orgId]);

  return { subcontractors, loading };
}
```

---

## File Ownership

CLI 3 owns:
- `app/dashboard/subcontractors/` - All subcontractor routes
- `components/subcontractors/` - Subcontractor components
- Navigation structure in `app/dashboard/layout.tsx`

**Coordinate with:**
- CLI 2 for component styling
- CLI 1 for demo data
- CLI 4 for Firestore rules if new collections

---

## Commands

```bash
# Create directory structure
mkdir -p apps/web/app/dashboard/subcontractors/[id]
mkdir -p apps/web/app/dashboard/subcontractors/bids
mkdir -p apps/web/app/dashboard/subcontractors/compare
mkdir -p apps/web/components/subcontractors

# TypeScript check
cd apps/web && npx tsc --noEmit

# Commit pattern
git add apps/web/app/dashboard/subcontractors/
git commit -m "feat(subcontractors): Add dedicated subcontractors module

- Directory page with search/filter
- SubcontractorCard component
- Detail page with metrics

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Success Criteria

- [ ] Team section shows only employees
- [ ] Sidebar has collapsible Team/Subcontractors
- [ ] `/dashboard/subcontractors` route works
- [ ] Directory has search and filter
- [ ] SubcontractorCard displays properly
- [ ] Detail page loads
- [ ] TypeScript passes
- [ ] All changes committed
