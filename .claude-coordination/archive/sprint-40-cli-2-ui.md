# Sprint 40 - CLI 2: UI Polish & Enhancement

**Copy this entire prompt into a new Claude Code session.**

---

## Context

You are CLI 2 working on ContractorOS Sprint 40. Your role is to complete remaining UI polish items - date picker enhancements, help menu relocation, online status indicator, and crew availability improvements.

**Project:** `/Users/nickbodkins/contractoros`
**App:** `apps/web/`
**Dev Server:** `npm run dev` (port 3000)

---

## Sprint 39 Completed

- [x] Search bar overlap (moved to sidebar)
- [x] Active Projects layout (4 cards, 280px)
- [x] Project card padding (reduced)
- [x] Sub-nav spacing (pt-2, mb-3)
- [x] Dropdown arrow positioning
- [x] Client Preferences (3-column grid)
- [x] Animation audit (appropriate usage confirmed)
- [x] EmptyState (already standardized)

---

## Your Tasks

### Task 1: Relocate Help Menu (Issue #2)
**Effort:** 1-2h

Help icon floating at top instead of in side navigation.

**Current Location:**
```bash
grep -r "Help" apps/web/app/dashboard/layout.tsx
grep -r "QuestionMarkCircle" apps/web/components
```

**Implementation:**
1. Add Help to sidebar navigation (after Settings)
2. Remove floating help icon if present
3. Help page already exists at `/dashboard/help`

```typescript
// In ownerPmNavItems array
{ label: 'Help', href: '/dashboard/help', icon: QuestionMarkCircleIcon },
```

**Acceptance Criteria:**
- [ ] Help menu in sidebar navigation
- [ ] Works for all roles (OWNER, PM, EMPLOYEE)
- [ ] No floating help icons

---

### Task 2: Online Status Indicator (Issue #3)
**Effort:** 2-3h

Add online status indicator to user profile section.

**Location:** Sidebar footer / user profile area

**Implementation:**
```tsx
// components/ui/OnlineStatusIndicator.tsx
export function OnlineStatusIndicator({ isOnline = true }: { isOnline?: boolean }) {
  return (
    <span
      className={cn(
        'w-2.5 h-2.5 rounded-full border-2 border-white',
        isOnline ? 'bg-green-500' : 'bg-gray-400'
      )}
    />
  );
}

// In user profile section
<div className="flex items-center gap-2">
  <div className="relative">
    <UserAvatar />
    <OnlineStatusIndicator className="absolute -bottom-0.5 -right-0.5" />
  </div>
  <span>{userName}</span>
</div>
```

**Use network status hook:**
```typescript
import { useNetworkStatus } from '@/lib/offline/network-status';

const { isOnline } = useNetworkStatus();
```

**Acceptance Criteria:**
- [ ] Green dot when online
- [ ] Gray dot when offline
- [ ] Updates in real-time
- [ ] Visible in sidebar profile area

---

### Task 3: Date Picker Quick Selections (Issue #77)
**Effort:** 3-4h

Add preset buttons to date picker on Reports page.

**Location:** `apps/web/app/dashboard/reports/`

**Implementation:**
```tsx
// components/ui/DateRangePresets.tsx
const DATE_PRESETS = [
  { label: 'Today', getValue: () => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }) },
  { label: 'This Week', getValue: () => ({ start: startOfWeek(new Date()), end: endOfWeek(new Date()) }) },
  { label: 'This Month', getValue: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
  { label: 'This Quarter', getValue: () => getQuarterRange(new Date()) },
  { label: 'YTD', getValue: () => ({ start: startOfYear(new Date()), end: new Date() }) },
  { label: 'Last 30 Days', getValue: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
  { label: 'Last 90 Days', getValue: () => ({ start: subDays(new Date(), 90), end: new Date() }) },
];

export function DateRangePresets({ onSelect }: { onSelect: (range: DateRange) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {DATE_PRESETS.map((preset) => (
        <button
          key={preset.label}
          onClick={() => onSelect(preset.getValue())}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
```

**Integration on Reports page:**
```tsx
<DateRangePresets onSelect={(range) => {
  setStartDate(range.start);
  setEndDate(range.end);
}} />
```

**Acceptance Criteria:**
- [ ] Preset buttons above date pickers
- [ ] All presets work correctly
- [ ] Reports update when preset selected
- [ ] Mobile responsive

---

### Task 4: Crew Availability Enhancement (Issue #42)
**Effort:** 8-12h

Improve the Team > Crew Availability tab.

**Location:** `apps/web/app/dashboard/team/availability/`

**Current State:** Basic availability list

**Enhancements:**
1. **Utilization Tracking**
   ```tsx
   <div className="flex items-center gap-2">
     <span className="font-medium">{member.name}</span>
     <Badge variant={utilization > 80 ? 'warning' : 'success'}>
       {utilization}% utilized
     </Badge>
   </div>
   ```

2. **Workload Visualization**
   ```tsx
   <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
     <div
       className="h-full bg-blue-500 rounded-full"
       style={{ width: `${utilization}%` }}
     />
   </div>
   ```

3. **Skills/Trade Filtering**
   ```tsx
   const TRADE_FILTERS = ['All', 'Carpenter', 'Electrician', 'Plumber', 'Laborer'];
   ```

4. **Date Range Selection**
   ```tsx
   <DateRangePicker
     startDate={availabilityStart}
     endDate={availabilityEnd}
     onChange={(start, end) => filterAvailability(start, end)}
   />
   ```

**Acceptance Criteria:**
- [ ] Utilization percentage displayed
- [ ] Workload progress bars
- [ ] Filter by trade/skill
- [ ] Date range selector works
- [ ] Responsive layout

---

### Task 5: Loading States Audit
**Effort:** 2-3h

Audit loading states across the platform.

**Check:**
1. All pages have skeleton loaders
2. No flash of unstyled content
3. Loading spinners are consistent

**Pattern:**
```tsx
if (loading) {
  return <SkeletonList count={5} />;
}
```

**Acceptance Criteria:**
- [ ] All major pages have loading states
- [ ] Consistent skeleton patterns
- [ ] No layout shifts on load

---

### Task 6: Form Input Consistency
**Effort:** 2-3h

Audit form inputs for consistency.

**Check:**
1. All inputs use same styling
2. Labels positioned consistently
3. Error states match design system
4. Focus rings consistent

**Standard Pattern:**
```tsx
<Input
  label="Field Name"
  error={errors.fieldName?.message}
  className="w-full"
/>
```

---

## File Ownership

CLI 2 owns:
- `components/ui/` - All UI components
- `components/dashboard/` - Dashboard components
- Component styling throughout
- Tailwind configuration

**Do NOT modify:**
- `lib/hooks/` (CLI 1/4)
- Business logic in page.tsx (CLI 3)
- Firestore rules (CLI 4)

---

## Commands

```bash
# Start dev server
cd /Users/nickbodkins/contractoros/apps/web
npm run dev

# Find components
grep -r "OnlineStatus" apps/web/components
grep -r "DateRange" apps/web/components

# TypeScript check
npx tsc --noEmit

# Commit pattern
git add apps/web/components/
git commit -m "feat(ui): Add online status indicator

- Green dot when online, gray when offline
- Uses useNetworkStatus hook
- Visible in sidebar profile area

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Success Criteria

- [ ] Help menu in sidebar
- [ ] Online status indicator working
- [ ] Date picker presets on Reports
- [ ] Crew availability improved
- [ ] All loading states consistent
- [ ] TypeScript passes
- [ ] All changes committed
