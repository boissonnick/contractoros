# Session B: Testing + Pagination

> **Run Command:** `claude "Execute session B from .claude-sessions/SESSION-B-testing-pagination.md"`
> **Duration:** 4-6 hours
> **Phases:** 3 + 4
> **Priority:** 🔴 P0 - CRITICAL FOR SCALE
> **Prerequisites:** Session A complete

---

## Pre-Session Checklist

Before starting, verify Session A completed:
```bash
cd apps/web && npx tsc --noEmit           # Must pass
ls apps/web/types/*.ts                     # Should show split type files
ls apps/web/lib/utils/formatters.ts        # Should exist
firebase functions:list --project contractoros-483812  # CF deployed
```

---

## PHASE 3: Testing Foundation (2-3 hours)

### Batch 3.1: Test Infrastructure Setup
**Run sequentially in main session:**

```bash
# Install Jest and React Testing Library
cd apps/web
npm install --save-dev jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom

# Create Jest config
```

Then create jest.config.js:

```javascript
// apps/web/jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

Create jest.setup.js:

```javascript
// apps/web/jest.setup.js
import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('@/lib/firebase/config', () => ({
  db: {},
  auth: {},
  storage: {},
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));
```

Create test utilities:

```typescript
// apps/web/__tests__/utils/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Mock Auth Context
const mockAuthContext = {
  user: {
    uid: 'test-user-id',
    email: 'test@example.com',
  },
  orgId: 'test-org-id',
  userProfile: {
    id: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'OWNER',
    orgId: 'test-org-id',
  },
  loading: false,
};

// Custom render with providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options });
}

export * from '@testing-library/react';
export { customRender as render, mockAuthContext };
```

Update package.json scripts:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

**After setup, launch parallel agents for tests:**

---

### Batch 3.2: Security Helper Tests
**Launch these 4 agents in parallel:**

#### Agent 1: Test isAuthenticated + isSameOrg
```
Task: Create comprehensive tests for authentication and org isolation helpers.

CONTEXT:
- These are CRITICAL security functions
- Must have 100% coverage
- Located in security-related files (find them first)

CREATE FILE: apps/web/__tests__/lib/security/auth-helpers.test.ts

TEST CASES FOR isAuthenticated:
- Returns true when user is authenticated
- Returns false when user is null
- Returns false when user is undefined
- Handles edge cases (expired token simulation)

TEST CASES FOR isSameOrg:
- Returns true when orgIds match
- Returns false when orgIds don't match
- Returns false when orgId is null
- Returns false when orgId is undefined
- Returns false when user has no orgId
- Case sensitivity tests

EXAMPLE TEST STRUCTURE:
```typescript
import { isAuthenticated, isSameOrg } from '@/lib/security/auth-helpers';

describe('isAuthenticated', () => {
  it('returns true for authenticated user', () => {
    const user = { uid: '123', email: 'test@test.com' };
    expect(isAuthenticated(user)).toBe(true);
  });

  it('returns false for null user', () => {
    expect(isAuthenticated(null)).toBe(false);
  });
});

describe('isSameOrg', () => {
  it('returns true when orgIds match', () => {
    expect(isSameOrg('org-123', 'org-123')).toBe(true);
  });

  it('returns false when orgIds differ', () => {
    expect(isSameOrg('org-123', 'org-456')).toBe(false);
  });
});
```

DELIVERABLE: Comprehensive auth helper tests with 100% coverage
```

#### Agent 2: Test isAdmin + isOwner
```
Task: Create tests for role and ownership checking functions.

CREATE FILE: apps/web/__tests__/lib/security/role-helpers.test.ts

TEST CASES FOR isAdmin:
- Returns true for OWNER role
- Returns true for PM role
- Returns false for EMPLOYEE role
- Returns false for CONTRACTOR role
- Returns false for CLIENT role
- Returns false for SUB role
- Returns false for null/undefined role
- Case insensitivity handling

TEST CASES FOR isOwner:
- Returns true when userId matches resource owner
- Returns false when userId differs
- Returns false when userId is null
- Returns false when resource has no owner
- Handles undefined gracefully

DELIVERABLE: Role helper tests with 100% coverage
```

#### Agent 3: Test Rate Limiter
```
Task: Create tests for the API rate limiting logic.

CONTEXT:
- File: apps/web/lib/assistant/security/rate-limiter.ts
- Critical for preventing abuse

CREATE FILE: apps/web/__tests__/lib/security/rate-limiter.test.ts

TEST CASES:
- Allows requests under the limit
- Blocks requests over the limit
- Resets after time window expires
- Tracks separate limits per user
- Handles concurrent requests correctly
- Returns correct remaining count
- Returns correct reset time

MOCK TIME:
```typescript
jest.useFakeTimers();
// ... test
jest.advanceTimersByTime(60000); // Advance 1 minute
```

DELIVERABLE: Rate limiter tests with 100% coverage
```

#### Agent 4: Test Timestamp Converter + Formatters
```
Task: Create tests for utility functions.

CREATE FILE: apps/web/__tests__/lib/utils/timestamp-converter.test.ts

TEST CASES FOR convertTimestampsDeep:
- Converts Firestore Timestamp to Date
- Handles nested objects
- Handles arrays of objects
- Preserves non-timestamp fields
- Handles null values
- Handles undefined values
- Handles empty objects

CREATE FILE: apps/web/__tests__/lib/utils/formatters.test.ts

TEST CASES FOR formatCurrency:
- Formats positive numbers correctly
- Formats negative numbers correctly
- Handles zero
- Handles large numbers
- Handles decimals
- Different currency codes (USD, EUR, etc.)

TEST CASES FOR formatPercent:
- Formats whole numbers
- Formats decimals
- Handles negative percentages
- Handles zero
- Respects decimal places parameter

TEST CASES FOR formatPhoneNumber:
- Formats 10-digit numbers
- Handles numbers with existing formatting
- Handles international numbers
- Returns original if invalid

DELIVERABLE: Utility function tests with 100% coverage
```

**Wait for Batch 3.2 to complete.**

---

### Batch 3.3: Critical Hook Tests
**Launch these 4 agents in parallel:**

#### Agent 5: Test useAuth Hook
```
Task: Create tests for the authentication hook.

CONTEXT:
- Most critical hook in the app
- Handles login, logout, session management

CREATE FILE: apps/web/__tests__/lib/hooks/useAuth.test.ts

MOCK FIREBASE:
```typescript
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));
```

TEST CASES:
- Returns loading true initially
- Sets user after auth state change
- Handles sign in success
- Handles sign in failure
- Handles sign out
- Fetches user profile after auth
- Returns correct orgId from profile
- Handles auth errors gracefully

DELIVERABLE: useAuth tests with 80%+ coverage
```

#### Agent 6: Test useProjects Hook
```
Task: Create tests for the projects hook.

CREATE FILE: apps/web/__tests__/lib/hooks/useProjects.test.ts

MOCK FIRESTORE:
```typescript
const mockProjects = [
  { id: 'proj-1', name: 'Project 1', status: 'active' },
  { id: 'proj-2', name: 'Project 2', status: 'completed' },
];

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn((query, callback) => {
    callback({
      docs: mockProjects.map(p => ({
        id: p.id,
        data: () => p,
      })),
    });
    return jest.fn(); // unsubscribe
  }),
}));
```

TEST CASES:
- Returns empty array when no orgId
- Returns projects for valid orgId
- Handles loading state correctly
- Handles errors gracefully
- createProject calls Firestore correctly
- updateProject updates correctly
- deleteProject removes correctly
- Filters by status work
- Filters by category work

DELIVERABLE: useProjects tests with 80%+ coverage
```

#### Agent 7: Test useInvoices Hook
```
Task: Create tests for the invoices hook.

CREATE FILE: apps/web/__tests__/lib/hooks/useInvoices.test.ts

TEST CASES:
- Returns invoices for org
- Filters by status (draft, sent, paid, overdue)
- Filters by client
- Filters by date range
- createInvoice generates correct number
- updateInvoice works
- markAsPaid updates status and paymentDate
- sendInvoice updates status and sentAt
- Calculates totals correctly
- Handles line items

DELIVERABLE: useInvoices tests with 80%+ coverage
```

#### Agent 8: Test useClients + useTimeEntries
```
Task: Create tests for clients and time entries hooks.

CREATE FILE: apps/web/__tests__/lib/hooks/useClients.test.ts

TEST CASES FOR useClients:
- Returns clients for org
- Filters by status (active, inactive)
- Search by name works
- createClient works
- updateClient works
- Handles client preferences

CREATE FILE: apps/web/__tests__/lib/hooks/useTimeEntries.test.ts

TEST CASES FOR useTimeEntries:
- Returns entries for org
- Filters by date range
- Filters by user
- Filters by project
- createEntry validates required fields
- Calculates duration correctly
- clockIn creates entry with startTime
- clockOut updates entry with endTime
- Handles break time

DELIVERABLE: Both hooks tested with 80%+ coverage
```

**Wait for Batch 3.3 to complete.**

---

### Batch 3.4: CI Integration
**Run in main session:**

Update cloudbuild.yaml to include tests:

```yaml
# Add test step before build
- name: 'node:20'
  entrypoint: 'npm'
  args: ['run', 'test:coverage']
  dir: 'apps/web'
  env:
    - 'CI=true'
```

Verify all tests pass:
```bash
cd apps/web && npm run test:coverage
```

---

## PHASE 4: Pagination & Scale (2-3 hours)

### Batch 4.1: Pagination Infrastructure
**Launch these 2 agents in parallel:**

#### Agent 9: Create Pagination Component
```
Task: Create a reusable pagination component.

CREATE FILE: apps/web/components/ui/Pagination.tsx

REQUIREMENTS:
- Shows current page and total pages
- Previous/Next buttons
- Jump to page input
- Page size selector (10, 25, 50, 100)
- Keyboard navigation support
- Mobile-friendly design

COMPONENT API:
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showItemCount?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSizeSelector = true,
  showItemCount = true,
}: PaginationProps) {
  // Implementation
}
```

ALSO CREATE: LoadMore.tsx for infinite scroll pattern
```typescript
interface LoadMoreProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  itemCount: number;
  totalCount?: number;
}
```

DELIVERABLE: Pagination.tsx and LoadMore.tsx components
```

#### Agent 10: Create usePagination Hook
```
Task: Create a generic pagination hook for Firestore queries.

CREATE FILE: apps/web/lib/hooks/usePagination.ts

REQUIREMENTS:
- Cursor-based pagination (Firestore best practice)
- Supports limit and offset
- Tracks hasMore state
- Caches pages for back navigation
- Works with any collection

HOOK API:
```typescript
interface UsePaginationOptions<T> {
  collectionPath: string;
  pageSize: number;
  orderByField: string;
  orderDirection?: 'asc' | 'desc';
  filters?: QueryConstraint[];
  transformDoc?: (doc: DocumentSnapshot) => T;
}

interface UsePaginationResult<T> {
  items: T[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  hasPrevious: boolean;
  loadMore: () => Promise<void>;
  loadPrevious: () => Promise<void>;
  refresh: () => Promise<void>;
  currentPage: number;
  totalLoaded: number;
}

export function usePagination<T>(
  orgId: string,
  options: UsePaginationOptions<T>
): UsePaginationResult<T> {
  // Implementation using startAfter/endBefore cursors
}
```

IMPLEMENTATION NOTES:
- Use startAfter() for forward pagination
- Store lastVisible document for cursor
- Use limit() to control page size
- Handle empty results gracefully

DELIVERABLE: Fully functional usePagination hook
```

**Wait for Batch 4.1 to complete.**

---

### Batch 4.2: Implement Pagination on Critical Collections
**Launch these 4 agents in parallel:**

#### Agent 11: Paginate Tasks + Time Entries
```
Task: Add pagination to useTasks and useTimeEntries hooks.

CONTEXT:
- Tasks can number in thousands per project
- Time entries grow daily
- Currently load all records - will break at scale

CHANGES TO useTasks.ts:
1. Add pageSize parameter (default 50)
2. Use usePagination hook internally
3. Export loadMore, hasMore functions
4. Keep backward compatibility (items still works)

CHANGES TO useTimeEntries.ts:
1. Add pageSize parameter (default 100)
2. Use usePagination hook internally
3. Export loadMore, hasMore functions

UPDATE COMPONENTS:
- Find components using these hooks
- Add Pagination or LoadMore component
- Test that pagination works

DELIVERABLE: Both hooks paginated, components updated
```

#### Agent 12: Paginate Photos + Invoices
```
Task: Add pagination to usePhotos and useInvoices hooks.

CONTEXT:
- Photos can be 100s per project
- Invoices accumulate over time

CHANGES TO usePhotos.ts:
1. Add pageSize parameter (default 30)
2. Use usePagination hook
3. Support gallery-style loading

CHANGES TO useInvoices.ts:
1. Add pageSize parameter (default 50)
2. Use usePagination hook
3. Maintain filter compatibility

UPDATE COMPONENTS:
- Photo gallery component
- Invoice list page

DELIVERABLE: Both hooks paginated, components updated
```

#### Agent 13: Paginate Activity Logs + Messages
```
Task: Add pagination to useActivityLog and useMessages hooks.

CONTEXT:
- Activity logs grow with every action
- Messages can be extensive

CHANGES TO useActivityLog.ts:
1. Add pageSize parameter (default 100)
2. Use usePagination hook
3. Support real-time new entries

CHANGES TO useMessages.ts:
1. Add pageSize parameter (default 50)
2. Use usePagination hook
3. Support chat-style loading (newest first, load older)

UPDATE COMPONENTS:
- Activity feed component
- Message thread component

DELIVERABLE: Both hooks paginated, components updated
```

#### Agent 14: Paginate Daily Logs + Create LoadMore Pattern
```
Task: Add pagination to useDailyLogs and document the LoadMore pattern.

CHANGES TO useDailyLogs.ts:
1. Add pageSize parameter (default 50)
2. Use usePagination hook

CREATE PATTERN DOCUMENTATION:
Document in COMPONENT_PATTERNS.md how to use LoadMore:

```typescript
// Example usage
const { items, loading, hasMore, loadMore } = useDailyLogs(orgId, { pageSize: 50 });

return (
  <div>
    {items.map(log => <DailyLogCard key={log.id} log={log} />)}
    <LoadMore
      hasMore={hasMore}
      loading={loading}
      onLoadMore={loadMore}
      itemCount={items.length}
    />
  </div>
);
```

DELIVERABLE: Daily logs paginated, LoadMore pattern documented
```

**Wait for Batch 4.2 to complete.**

---

### Batch 4.3: Performance Optimization
**Launch these 3 agents in parallel:**

#### Agent 15: Lazy Load Admin Pages
```
Task: Implement dynamic imports for admin/settings pages.

CONTEXT:
- Settings pages are heavy but rarely used
- Should be loaded on-demand

CHANGES:
1. In app/dashboard/settings/layout.tsx or page components
2. Use next/dynamic for heavy components:

```typescript
import dynamic from 'next/dynamic';

const TemplatesPage = dynamic(
  () => import('./templates/page'),
  { loading: () => <Skeleton /> }
);
```

PAGES TO LAZY LOAD:
- Settings templates
- Settings integrations
- Settings import/export
- Reports builder
- Team permissions

DELIVERABLE: Admin pages lazy loaded
```

#### Agent 16: Optimize Image Loading
```
Task: Add lazy loading and optimization to image components.

CHANGES:
1. Find all <img> tags and Image components
2. Add loading="lazy" to images below fold
3. Use Next.js Image component with:
   - placeholder="blur"
   - sizes attribute for responsive
   - priority only for above-fold

4. Add intersection observer for photo galleries:
```typescript
const [isVisible, setIsVisible] = useState(false);
const ref = useRef(null);

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => setIsVisible(entry.isIntersecting),
    { rootMargin: '100px' }
  );
  if (ref.current) observer.observe(ref.current);
  return () => observer.disconnect();
}, []);
```

DELIVERABLE: Images optimized with lazy loading
```

#### Agent 17: Bundle Analysis + Documentation
```
Task: Run bundle analysis and document findings.

STEPS:
1. Install analyzer:
   npm install --save-dev @next/bundle-analyzer

2. Update next.config.js:
```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // existing config
});
```

3. Run analysis:
   ANALYZE=true npm run build

4. Document findings in: docs/BUNDLE_ANALYSIS.md
   - Total bundle size
   - Largest dependencies
   - Recommendations for reduction
   - Before/after comparison

5. Run Lighthouse:
   - Document scores for key pages
   - Note performance opportunities

DELIVERABLE: Bundle analysis documented, Lighthouse baseline recorded
```

**Wait for Batch 4.3 to complete.**

---

## VERIFICATION & SELF-IMPROVEMENT

### Final Verification
```bash
# Run all tests
cd apps/web && npm run test:coverage

# Verify coverage thresholds met
# Should show: 60%+ overall, 100% security helpers

# Test pagination manually
npm run dev
# Navigate to Tasks, scroll, verify Load More works

# Check bundle size
ANALYZE=true npm run build
# Main bundle should be < 250KB

# Run Lighthouse
# Performance score should be > 70
```

### Self-Improvement Analysis

**Launch this agent after all work is complete:**

#### Agent 18: Session B Retrospective
```
Task: Analyze Session B work and update documentation.

PROCESS:
1. ANALYZE TEST PATTERNS:
   - Which tests were hardest to write?
   - What mocking patterns worked best?
   - Were there any flaky tests?
   - What coverage gaps remain?

2. ANALYZE PAGINATION IMPLEMENTATION:
   - Did the usePagination hook work as designed?
   - Any edge cases discovered?
   - Performance improvements measured?

3. UPDATE CLAUDE.MD:
   Add sections for:
   - Test file conventions (__tests__/...)
   - Mocking patterns for Firebase
   - Pagination hook usage
   - Coverage requirements

4. UPDATE DEVELOPMENT_GUIDE.md:
   Add:
   - How to write tests for hooks
   - How to add pagination to new collections
   - Performance optimization checklist

5. CREATE SESSION LEARNINGS:
   .claude-sessions/SESSION-B-learnings.md
   - Test coverage achieved
   - Pagination implementation notes
   - Performance metrics baseline
   - Issues and solutions

6. UPDATE SPRINT_STATUS.md:
   Mark Phases 3 and 4 complete.

7. UPDATE TESTING_STRATEGY.md:
   - Add unit test section
   - Document coverage targets
   - Note CI integration

DELIVERABLE: All documentation updated, learnings captured
```

---

## Session B Completion Checklist

- [ ] Jest installed and configured
- [ ] Test utilities created
- [ ] Security helper tests (100% coverage)
- [ ] Rate limiter tests (100% coverage)
- [ ] Utility function tests (100% coverage)
- [ ] useAuth tests (80%+ coverage)
- [ ] useProjects tests (80%+ coverage)
- [ ] useInvoices tests (80%+ coverage)
- [ ] useClients tests (80%+ coverage)
- [ ] useTimeEntries tests (80%+ coverage)
- [ ] CI runs tests (cloudbuild.yaml updated)
- [ ] Pagination component created
- [ ] LoadMore component created
- [ ] usePagination hook created
- [ ] Tasks paginated
- [ ] Time Entries paginated
- [ ] Photos paginated
- [ ] Invoices paginated
- [ ] Activity Logs paginated
- [ ] Messages paginated
- [ ] Daily Logs paginated
- [ ] Admin pages lazy loaded
- [ ] Images optimized
- [ ] Bundle analysis documented
- [ ] Lighthouse baseline recorded
- [ ] Self-improvement analysis complete
- [ ] All tests passing
- [ ] 60%+ coverage achieved

---

## Next Session

After completing Session B, proceed to:
**Session C: Coming Soon Features** (`.claude-sessions/SESSION-C-coming-soon-features.md`)
