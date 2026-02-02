# Sprint 23: Parallel Development Plan

> **Purpose:** Enable 4 Claude Code sessions to work independently on high-impact features
> **Created:** 2026-02-02
> **Duration:** 3-4 hours of parallel work (estimated)
> **Prerequisite:** Sprint 22 (Email Templates) should be completed first

---

## Sprint Overview

Sprint 23 focuses on **power user features** that enhance productivity and user experience. These four features were selected because they:

1. Are high-impact, user-facing improvements
2. Have zero file conflicts (separate directories)
3. Can be developed in parallel
4. Build on existing infrastructure

---

## Key Principle: Zero File Conflicts

Each session works on **completely separate files**. No session touches another session's files.

| Session | Directory Ownership |
|---------|---------------------|
| Session 1 | `lib/search/`, `components/search/`, `app/dashboard/search/` |
| Session 2 | `lib/bulk-operations/`, `components/bulk/`, API routes for bulk |
| Session 3 | `lib/dashboard-widgets/`, `components/widgets/`, widget config storage |
| Session 4 | `app/client/` enhancements, `components/client-portal/` additions |

---

## Session Assignments

### SESSION 1: Global Search System
**Directory Ownership:** `apps/web/lib/search/`, `apps/web/components/search/`, `apps/web/app/dashboard/search/`

**Priority:** P1 - High Impact
**Time Estimate:** 45-60 minutes

**Why This Feature:**
- Users currently have to navigate to each module to find data
- Competitors (Buildertrend, Procore) have global search
- Reduces time-to-information significantly

**Files to Create:**
```
apps/web/lib/search/
├── types.ts                    # SearchResult, SearchFilter types
├── search-engine.ts            # Multi-entity search logic
├── entity-adapters/
│   ├── project-adapter.ts      # Project search adapter
│   ├── client-adapter.ts       # Client search adapter
│   ├── invoice-adapter.ts      # Invoice search adapter
│   └── task-adapter.ts         # Task search adapter
└── index.ts

apps/web/components/search/
├── GlobalSearchBar.tsx         # Cmd+K activated search bar
├── SearchResultList.tsx        # Grouped results by type
├── SearchResultItem.tsx        # Individual result row
├── SearchFilters.tsx           # Filter by entity type, date
├── RecentSearches.tsx          # Recent search history
└── index.ts

apps/web/app/dashboard/search/
└── page.tsx                    # Full search results page
```

**Prompt to paste:**
```
You are SESSION 1: Global Search System. Your task is to build a universal search feature.

Create these files (and ONLY these files):

1. apps/web/lib/search/types.ts
   - SearchResult: { id, type, title, subtitle, url, highlight, score }
   - SearchFilter: { entityTypes[], dateRange, query }
   - SearchEntityType: 'project' | 'client' | 'invoice' | 'task' | 'estimate' | 'subcontractor'

2. apps/web/lib/search/search-engine.ts
   - searchAll(orgId, query, filters): Promise<SearchResult[]>
   - Search across Firestore collections
   - Score results by relevance (title match > description match)
   - Limit to 50 results max

3. apps/web/lib/search/entity-adapters/project-adapter.ts
   - searchProjects(orgId, query): Promise<SearchResult[]>
   - Search name, address, clientName fields
   - Include status and budget in subtitle

4. apps/web/lib/search/entity-adapters/client-adapter.ts
   - searchClients(orgId, query): Promise<SearchResult[]>
   - Search name, email, phone, company fields

5. apps/web/components/search/GlobalSearchBar.tsx
   - Command+K (or Ctrl+K) keyboard shortcut to open
   - Modal overlay with search input
   - Debounced search (300ms)
   - Shows results as user types
   - Escape to close

6. apps/web/components/search/SearchResultList.tsx
   - Group results by entity type
   - Show icon per type (BuildingOfficeIcon for projects, etc.)
   - Click result to navigate to detail page

7. apps/web/components/search/SearchResultItem.tsx
   - Show title, subtitle, entity type badge
   - Highlight matching text in yellow
   - 44px minimum height for touch targets

8. apps/web/app/dashboard/search/page.tsx
   - Full search results page with filters
   - URL param: ?q=searchterm
   - Filter by entity type
   - Sort by relevance or date

Use existing patterns:
- Import types from '@/types' for existing entity types
- Use Tailwind for styling
- Use Dialog from @headlessui/react for modal
- Use existing Icons from @heroicons/react

DO NOT touch any files outside your assigned directories.
Run 'npx tsc --noEmit' when done.
```

---

### SESSION 2: Bulk Operations System
**Directory Ownership:** `apps/web/lib/bulk-operations/`, `apps/web/components/bulk/`, `apps/web/app/api/bulk/`

**Priority:** P1 - High Impact
**Time Estimate:** 45-60 minutes

**Why This Feature:**
- Managing multiple projects/tasks one-by-one is tedious
- Bulk status changes, assignments, and deletes save significant time
- Essential for power users with many projects

**Files to Create:**
```
apps/web/lib/bulk-operations/
├── types.ts                    # BulkOperation, BulkResult types
├── operations/
│   ├── project-operations.ts   # Bulk project actions
│   ├── task-operations.ts      # Bulk task actions
│   └── invoice-operations.ts   # Bulk invoice actions
├── validators.ts               # Validate bulk operation requests
└── index.ts

apps/web/components/bulk/
├── BulkSelectBar.tsx           # Floating bar when items selected
├── BulkCheckbox.tsx            # Checkbox for row selection
├── BulkActionMenu.tsx          # Dropdown of bulk actions
├── BulkConfirmDialog.tsx       # Confirm destructive actions
├── BulkProgressModal.tsx       # Progress during bulk operation
└── index.ts

apps/web/app/api/bulk/
├── projects/route.ts           # POST - Bulk project operations
├── tasks/route.ts              # POST - Bulk task operations
└── invoices/route.ts           # POST - Bulk invoice operations
```

**Prompt to paste:**
```
You are SESSION 2: Bulk Operations System. Your task is to build multi-select bulk actions.

Create these files (and ONLY these files):

1. apps/web/lib/bulk-operations/types.ts
   - BulkOperation: { type, ids[], action, params? }
   - BulkAction: 'delete' | 'archive' | 'update_status' | 'assign' | 'tag'
   - BulkResult: { success: string[], failed: { id, error }[], total }

2. apps/web/lib/bulk-operations/operations/project-operations.ts
   - bulkUpdateProjectStatus(orgId, projectIds[], newStatus)
   - bulkArchiveProjects(orgId, projectIds[])
   - bulkAssignProjectManager(orgId, projectIds[], userId)
   - Each returns BulkResult

3. apps/web/lib/bulk-operations/operations/task-operations.ts
   - bulkUpdateTaskStatus(orgId, taskIds[], newStatus)
   - bulkAssignTasks(orgId, taskIds[], userIds[])
   - bulkDeleteTasks(orgId, taskIds[])

4. apps/web/lib/bulk-operations/validators.ts
   - validateBulkOperation(operation): { valid, errors[] }
   - Check max items (100), permissions, valid IDs

5. apps/web/components/bulk/BulkSelectBar.tsx
   - Fixed bar at bottom when items selected
   - Shows "X items selected"
   - Action buttons: "Change Status", "Assign", "Archive", "Delete"
   - "Clear selection" link
   - Animate in/out with Tailwind

6. apps/web/components/bulk/BulkCheckbox.tsx
   - Checkbox component for table rows
   - Visual indication when selected (row highlight)
   - Shift+click for range selection

7. apps/web/components/bulk/BulkActionMenu.tsx
   - Dropdown menu showing available actions
   - Actions filtered by entity type
   - Icons for each action

8. apps/web/components/bulk/BulkConfirmDialog.tsx
   - Confirmation dialog for destructive actions
   - Show count of items affected
   - "Type DELETE to confirm" for permanent deletions

9. apps/web/components/bulk/BulkProgressModal.tsx
   - Modal showing progress during bulk operation
   - Progress bar
   - List of completed/failed items
   - "Done" button when complete

10. apps/web/app/api/bulk/projects/route.ts
    - POST handler for bulk project operations
    - Validate request
    - Call appropriate operation function
    - Return BulkResult

Use existing patterns:
- Use Firestore batch writes (max 500 per batch)
- Use existing status constants from '@/types'
- Use Tailwind for styling
- Use Dialog from @headlessui/react for modals

DO NOT touch any files outside your assigned directories.
Run 'npx tsc --noEmit' when done.
```

---

### SESSION 3: Dashboard Widget Customization
**Directory Ownership:** `apps/web/lib/dashboard-widgets/`, `apps/web/components/widgets/`, `apps/web/app/api/dashboard-config/`

**Priority:** P2 - User Experience
**Time Estimate:** 60-75 minutes

**Why This Feature:**
- Different users need different dashboard views
- PMs care about project status; Owners care about revenue
- Drag-drop customization is a differentiator

**Files to Create:**
```
apps/web/lib/dashboard-widgets/
├── types.ts                    # Widget, WidgetConfig, DashboardLayout types
├── widget-registry.ts          # Registry of available widgets
├── layout-manager.ts           # Save/load dashboard layouts
└── index.ts

apps/web/components/widgets/
├── WidgetContainer.tsx         # Draggable widget wrapper
├── WidgetGrid.tsx              # Grid layout with drag-drop
├── AddWidgetModal.tsx          # Modal to add new widgets
├── WidgetSettings.tsx          # Per-widget configuration
├── widgets/
│   ├── RevenueWidget.tsx       # Revenue summary
│   ├── ProjectStatusWidget.tsx # Project status breakdown
│   ├── TasksWidget.tsx         # Upcoming tasks
│   ├── ActivityWidget.tsx      # Recent activity feed
│   ├── CalendarWidget.tsx      # Upcoming schedule
│   └── QuickActionsWidget.tsx  # Quick action buttons
└── index.ts

apps/web/app/api/dashboard-config/
└── route.ts                    # GET/PUT dashboard configuration
```

**Prompt to paste:**
```
You are SESSION 3: Dashboard Widget Customization. Your task is to build customizable dashboard widgets.

Create these files (and ONLY these files):

1. apps/web/lib/dashboard-widgets/types.ts
   - Widget: { id, type, title, size, position, config }
   - WidgetSize: 'small' | 'medium' | 'large' | 'full'
   - WidgetType: 'revenue' | 'projects' | 'tasks' | 'activity' | 'calendar' | 'quick-actions'
   - DashboardLayout: { userId, orgId, widgets[], gridColumns, lastModified }
   - WidgetPosition: { x, y, w, h }

2. apps/web/lib/dashboard-widgets/widget-registry.ts
   - WIDGET_DEFINITIONS: Record<WidgetType, { title, description, icon, defaultSize, component }>
   - getWidgetComponent(type): React.ComponentType
   - getAvailableWidgets(): WidgetDefinition[]

3. apps/web/lib/dashboard-widgets/layout-manager.ts
   - saveDashboardLayout(userId, orgId, layout): Promise<void>
   - loadDashboardLayout(userId, orgId): Promise<DashboardLayout | null>
   - getDefaultLayout(): DashboardLayout
   - Store in Firestore: users/{userId}/dashboardConfig

4. apps/web/components/widgets/WidgetContainer.tsx
   - Wrapper for each widget
   - Drag handle in header
   - Settings button (gear icon)
   - Remove button (X)
   - Visual feedback during drag

5. apps/web/components/widgets/WidgetGrid.tsx
   - CSS Grid layout (12 columns)
   - Drag-and-drop reordering (use react-beautiful-dnd or simple drag API)
   - Responsive: 1 col mobile, 2 col tablet, 3 col desktop
   - "Add Widget" button when grid has space

6. apps/web/components/widgets/AddWidgetModal.tsx
   - Modal showing available widgets
   - Widget cards with title, description, preview
   - Click to add to dashboard

7. apps/web/components/widgets/widgets/RevenueWidget.tsx
   - Show total revenue this month
   - Comparison to last month (up/down arrow)
   - Mini bar chart of last 6 months
   - Uses existing invoice data

8. apps/web/components/widgets/widgets/ProjectStatusWidget.tsx
   - Pie chart or bar showing projects by status
   - Count per status
   - Click status to filter projects list

9. apps/web/components/widgets/widgets/TasksWidget.tsx
   - List of upcoming tasks (next 7 days)
   - Due date, assignee, project name
   - Click task to open detail

10. apps/web/app/api/dashboard-config/route.ts
    - GET: Return user's dashboard config (or default)
    - PUT: Save dashboard config
    - Validate user owns the config

Use existing patterns:
- Use Tailwind for styling
- For drag-drop, either use HTML5 drag API or simple CSS transforms
- Use existing hooks (useProjects, useInvoices, useTasks) for widget data
- Store config in Firestore under users collection

DO NOT touch any files outside your assigned directories.
Run 'npx tsc --noEmit' when done.
```

---

### SESSION 4: Client Portal Enhancements
**Directory Ownership:** `apps/web/app/client/` (existing, enhance), `apps/web/components/client-portal/` (new)

**Priority:** P1 - Competitive Differentiator
**Time Estimate:** 45-60 minutes

**Why This Feature:**
- Client portal is a key differentiator (no-login access)
- Current portal is functional but basic
- Enhanced features reduce "what's the status?" calls

**Files to Create:**
```
apps/web/components/client-portal/
├── PortalNav.tsx               # Clean navigation for clients
├── ProjectTimeline.tsx         # Visual timeline of project phases
├── PhotoGallery.tsx            # Swipeable photo gallery
├── DocumentList.tsx            # List of documents to download
├── PaymentSummary.tsx          # Invoice and payment status
├── MessageThread.tsx           # Communication history
├── ApprovalCard.tsx            # Pending approvals (estimates, COs)
└── index.ts

apps/web/app/client/[token]/
├── timeline/page.tsx           # Project timeline view
├── gallery/page.tsx            # Photo gallery
├── messages/page.tsx           # Message thread
└── approvals/page.tsx          # Pending approvals
```

**Prompt to paste:**
```
You are SESSION 4: Client Portal Enhancements. Your task is to enhance the client-facing portal.

Create these files (and ONLY these files):

1. apps/web/components/client-portal/PortalNav.tsx
   - Clean, simple navigation for clients
   - Home, Timeline, Photos, Documents, Messages, Payments tabs
   - Mobile-friendly (bottom nav on mobile, top nav on desktop)
   - Project name in header

2. apps/web/components/client-portal/ProjectTimeline.tsx
   - Vertical timeline showing project phases
   - Current phase highlighted
   - Completed phases with checkmark
   - Future phases grayed out
   - Dates for each phase

3. apps/web/components/client-portal/PhotoGallery.tsx
   - Grid of project photos
   - Click to open lightbox
   - Swipe between photos on mobile
   - Filter by phase
   - Pinch-to-zoom support

4. apps/web/components/client-portal/DocumentList.tsx
   - List of documents for client
   - Contract, change orders, invoices, warranties
   - Download button for each
   - File type icon (PDF, image, etc.)

5. apps/web/components/client-portal/PaymentSummary.tsx
   - Total contract value
   - Amount paid vs remaining
   - Progress bar
   - List of invoices with status (paid/unpaid)
   - "Pay Now" button for unpaid invoices

6. apps/web/components/client-portal/MessageThread.tsx
   - Conversation-style message display
   - Contractor messages on left, client on right
   - Timestamps
   - "Send Message" input at bottom
   - Photo attachment support

7. apps/web/components/client-portal/ApprovalCard.tsx
   - Card showing item needing approval
   - Estimate or Change Order details
   - "Approve" and "Request Changes" buttons
   - Total amount prominently displayed

8. apps/web/app/client/[token]/timeline/page.tsx
   - Full timeline page
   - Uses ProjectTimeline component
   - Fetches project phases from token

9. apps/web/app/client/[token]/gallery/page.tsx
   - Photo gallery page
   - Uses PhotoGallery component
   - Fetches photos from project

10. apps/web/app/client/[token]/messages/page.tsx
    - Message thread page
    - Uses MessageThread component
    - Real-time updates with onSnapshot

11. apps/web/app/client/[token]/approvals/page.tsx
    - Pending approvals page
    - List of estimates/change orders needing approval
    - Click to view details and approve

Use existing patterns:
- The client portal uses magic link tokens (already implemented)
- Use getProjectFromToken() helper from existing client portal code
- Use Tailwind for styling
- Make everything mobile-first (most clients view on phone)
- Use smooth animations for lightbox/gallery

DO NOT touch any files outside your assigned directories.
Run 'npx tsc --noEmit' when done.
```

---

## Coordination Rules

1. **No shared files** - Each session has exclusive ownership of their directories
2. **Don't modify existing core files** - Only create new files in assigned directories
3. **Types go in your own types.ts** - Don't modify the main types/index.ts
4. **Run TypeScript check** - Each session runs `npx tsc --noEmit` before declaring done
5. **Use existing hooks** - Import from '@/lib/hooks' for data access

---

## After All Sessions Complete

The **Controller session** will:

1. Collect all new files via `git status`
2. Add new types to main `types/index.ts` if needed
3. Integrate components into main layout:
   - Add GlobalSearchBar to AppShell header
   - Add BulkSelectBar to list pages
   - Replace dashboard with WidgetGrid
   - Update client portal routes
4. Run full TypeScript check
5. Test in browser
6. Commit all work together

---

## Terminal Commands

**Terminal 1 (Controller):** Keep this session - coordinates and integrates

**Terminal 2 (Global Search):**
```bash
cd ~/contractoros && claude
# Paste SESSION 1 prompt
```

**Terminal 3 (Bulk Operations):**
```bash
cd ~/contractoros && claude
# Paste SESSION 2 prompt
```

**Terminal 4 (Dashboard Widgets):**
```bash
cd ~/contractoros && claude
# Paste SESSION 3 prompt
```

**Terminal 5 (Client Portal):**
```bash
cd ~/contractoros && claude
# Paste SESSION 4 prompt
```

---

## Time Estimates

| Session | Task | Est. Time | Complexity |
|---------|------|-----------|------------|
| 1 | Global Search | 45-60 min | Medium |
| 2 | Bulk Operations | 45-60 min | Medium |
| 3 | Dashboard Widgets | 60-75 min | High |
| 4 | Client Portal | 45-60 min | Medium |
| Controller | Integration | 20-30 min | Low |

**Total wall-clock time:** ~75-90 minutes (parallel) vs ~4-5 hours (sequential)

---

## Dependencies & Prerequisites

| Session | Depends On | Notes |
|---------|------------|-------|
| 1 - Search | None | Can start immediately |
| 2 - Bulk Ops | None | Can start immediately |
| 3 - Widgets | None | Can start immediately |
| 4 - Client Portal | None | Builds on existing portal |

All sessions can run **truly in parallel** with zero dependencies.

---

## Success Criteria

- [ ] All sessions complete without TypeScript errors
- [ ] No file conflicts when committing
- [ ] Global search finds projects, clients, invoices, tasks
- [ ] Bulk operations work for status changes and deletions
- [ ] Dashboard widgets can be rearranged and saved
- [ ] Client portal timeline and gallery work on mobile
- [ ] Controller successfully integrates all features

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Drag-drop complexity | Session 3 can use simple CSS reorder if react-beautiful-dnd is complex |
| Search performance | Limit to 50 results, add pagination later |
| Bulk operation limits | Cap at 100 items per operation |
| Photo gallery size | Lazy load images, limit initial fetch to 20 |

---

## Post-Sprint Integration Checklist

After all sessions complete, the Controller should:

1. **Search Integration**
   - [ ] Add GlobalSearchBar to AppShell.tsx header
   - [ ] Add Cmd+K keyboard shortcut listener
   - [ ] Add /dashboard/search to navigation

2. **Bulk Operations Integration**
   - [ ] Add BulkSelectBar to projects/page.tsx
   - [ ] Add BulkSelectBar to tasks list
   - [ ] Add BulkCheckbox to table rows

3. **Widget Integration**
   - [ ] Replace dashboard/page.tsx content with WidgetGrid
   - [ ] Add "Customize" button to dashboard header
   - [ ] Set up default widget layout

4. **Client Portal Integration**
   - [ ] Update client portal navigation
   - [ ] Add routes to client portal layout
   - [ ] Test magic link flow end-to-end

---

## Feature Value Summary

| Feature | User Impact | Business Value |
|---------|-------------|----------------|
| Global Search | High - Find anything fast | Reduced support requests |
| Bulk Operations | High - Save hours on admin | Power user retention |
| Dashboard Widgets | Medium - Personalized views | User engagement |
| Client Portal | High - Better client experience | Competitive differentiator |

---

*This document serves as the single source of truth for Sprint 23 parallel development.*
