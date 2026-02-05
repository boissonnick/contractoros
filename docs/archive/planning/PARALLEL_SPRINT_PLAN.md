# Parallel Sprint Plan — February 2, 2026

> **Purpose:** Enable 4 Claude Code sessions to work truly independently
> **Created:** 2026-02-02
> **Duration:** 2-3 hours of parallel work

---

## Key Principle: Zero File Conflicts

Each session works on **completely separate files**. No session touches another session's files.

---

## Session Assignments

### SESSION 1: Email Templates System
**Directory Ownership:** `apps/web/lib/email/`, `apps/web/components/email/`, `apps/web/app/dashboard/settings/email-templates/`

**Task:** Build email template system with variable substitution

**Files to Create:**
```
apps/web/lib/email/
├── types.ts                    # EmailTemplate, EmailVariable types
├── template-engine.ts          # Variable substitution engine
├── templates/                  # Default template content
│   ├── invoice-due.ts
│   ├── project-update.ts
│   └── estimate-ready.ts
└── index.ts

apps/web/components/email/
├── TemplateEditor.tsx          # Rich text editor for templates
├── VariablePicker.tsx          # Insert {{variables}}
├── TemplatePreview.tsx         # Preview with sample data
└── index.ts

apps/web/app/dashboard/settings/email-templates/
└── page.tsx                    # Settings page for templates
```

**Prompt to paste:**
```
You are SESSION 1: Email Templates. Your task is to build an email template system.

Create these files (and ONLY these files):
1. apps/web/lib/email/types.ts - EmailTemplate interface with: id, name, subject, body, variables[], createdAt, updatedAt
2. apps/web/lib/email/template-engine.ts - Function to substitute {{variableName}} with actual values
3. apps/web/lib/email/templates/invoice-due.ts - Default "Invoice Due" template
4. apps/web/components/email/TemplateEditor.tsx - Form to edit template name, subject, body
5. apps/web/components/email/VariablePicker.tsx - Dropdown to insert variables like {{clientName}}, {{projectName}}, {{invoiceAmount}}
6. apps/web/app/dashboard/settings/email-templates/page.tsx - Settings page listing all templates with edit/delete

Use existing patterns from the codebase:
- Import types from '@/types'
- Use Tailwind for styling
- Use react-hook-form for forms
- Follow the FormModal pattern from components/ui

DO NOT touch any files outside your assigned directories.
Run 'npx tsc --noEmit' when done.
```

---

### SESSION 2: Reporting Dashboard
**Directory Ownership:** `apps/web/lib/reports/`, `apps/web/components/reports/`, `apps/web/app/dashboard/reports/`

**Task:** Build advanced reporting with charts

**Files to Create:**
```
apps/web/lib/reports/
├── types.ts                    # ReportConfig, ReportData types
├── generators/
│   ├── revenue-report.ts       # Revenue by period
│   ├── project-profitability.ts # Margin analysis
│   └── team-productivity.ts    # Hours by team member
└── index.ts

apps/web/components/reports/
├── ReportCard.tsx              # Individual report display
├── RevenueChart.tsx            # Bar chart for revenue
├── ProfitabilityChart.tsx      # Margin pie chart
├── DateRangePicker.tsx         # Filter by date range
└── index.ts

apps/web/app/dashboard/reports/
├── page.tsx                    # Main reports dashboard
├── revenue/page.tsx            # Revenue detail page
└── profitability/page.tsx      # Profitability detail page
```

**Prompt to paste:**
```
You are SESSION 2: Reporting Dashboard. Your task is to build an advanced reporting system.

Create these files (and ONLY these files):
1. apps/web/lib/reports/types.ts - ReportConfig, ReportData, DateRange interfaces
2. apps/web/lib/reports/generators/revenue-report.ts - Function to aggregate invoice data by month
3. apps/web/lib/reports/generators/project-profitability.ts - Calculate margin per project
4. apps/web/components/reports/ReportCard.tsx - Card showing report title, summary stat, and mini chart
5. apps/web/components/reports/RevenueChart.tsx - Use recharts or simple div bars for revenue visualization
6. apps/web/components/reports/DateRangePicker.tsx - Start/end date inputs with presets (This Month, Last 30 Days, etc.)
7. apps/web/app/dashboard/reports/page.tsx - Dashboard with 4 report cards: Revenue, Profitability, Hours, Projects

Use existing patterns:
- Import from '@/types' for existing types
- Use Tailwind for styling
- Use the PageHeader component from components/ui
- Check if recharts is installed, if not use simple CSS bars

DO NOT touch any files outside your assigned directories.
Run 'npx tsc --noEmit' when done.
```

---

### SESSION 3: Offline/PWA Foundation
**Directory Ownership:** `apps/web/lib/offline/`, `apps/web/components/offline/`, `apps/web/public/` (only sw.js and manifest additions)

**Task:** Build service worker and offline detection

**Files to Create:**
```
apps/web/lib/offline/
├── types.ts                    # OfflineState, SyncQueue types
├── storage.ts                  # IndexedDB wrapper for offline data
├── sync-queue.ts               # Queue operations for later sync
├── network-status.ts           # Online/offline detection
└── index.ts

apps/web/components/offline/
├── OfflineBanner.tsx           # "You're offline" notification
├── SyncStatusIndicator.tsx     # Shows pending sync count
├── OfflineProvider.tsx         # Context provider for offline state
└── index.ts

apps/web/public/
├── sw.js                       # Service worker (basic caching)
└── manifest.json               # PWA manifest (update existing)
```

**Prompt to paste:**
```
You are SESSION 3: Offline/PWA Foundation. Your task is to build offline support infrastructure.

Create these files (and ONLY these files):
1. apps/web/lib/offline/types.ts - OfflineState, QueuedOperation, SyncStatus interfaces
2. apps/web/lib/offline/storage.ts - IndexedDB helper: openDB(), saveOffline(), getOfflineData()
3. apps/web/lib/offline/sync-queue.ts - Queue operations: addToQueue(), processQueue(), getQueueLength()
4. apps/web/lib/offline/network-status.ts - Hook: useNetworkStatus() returns { isOnline, wasOffline }
5. apps/web/components/offline/OfflineBanner.tsx - Yellow banner "You're offline. Changes will sync when connected."
6. apps/web/components/offline/SyncStatusIndicator.tsx - Small badge showing "3 pending" sync items
7. apps/web/components/offline/OfflineProvider.tsx - React context providing offline state to app
8. apps/web/public/sw.js - Basic service worker that caches app shell and API responses

Use existing patterns:
- Use Tailwind for styling
- Follow React context patterns from existing providers
- Keep the service worker simple - just cache GET requests

DO NOT touch any files outside your assigned directories.
Run 'npx tsc --noEmit' when done.
```

---

### SESSION 4: Notification Center
**Directory Ownership:** `apps/web/lib/notifications/`, `apps/web/components/notifications/`, `apps/web/app/api/notifications/`

**Task:** Build in-app notification system

**Files to Create:**
```
apps/web/lib/notifications/
├── types.ts                    # Notification, NotificationPreference types
├── service.ts                  # Create, mark read, delete notifications
└── index.ts

apps/web/lib/hooks/
└── useNotifications.ts         # Hook to fetch user notifications

apps/web/components/notifications/
├── NotificationBell.tsx        # Header bell icon with badge
├── NotificationDropdown.tsx    # Dropdown list of notifications
├── NotificationItem.tsx        # Single notification row
├── NotificationPreferences.tsx # Settings for notification types
└── index.ts

apps/web/app/api/notifications/
├── route.ts                    # GET/POST notifications
└── [id]/read/route.ts          # Mark notification as read
```

**Prompt to paste:**
```
You are SESSION 4: Notification Center. Your task is to build an in-app notification system.

Create these files (and ONLY these files):
1. apps/web/lib/notifications/types.ts - Notification interface: id, type, title, message, read, createdAt, actionUrl
2. apps/web/lib/notifications/service.ts - createNotification(), markAsRead(), deleteNotification()
3. apps/web/lib/hooks/useNotifications.ts - Hook returning { notifications, unreadCount, markAsRead, loading }
4. apps/web/components/notifications/NotificationBell.tsx - Bell icon with red badge showing unread count
5. apps/web/components/notifications/NotificationDropdown.tsx - Dropdown showing last 10 notifications
6. apps/web/components/notifications/NotificationItem.tsx - Row with icon, title, time ago, click to navigate
7. apps/web/app/api/notifications/route.ts - GET returns user notifications, POST creates notification

Notification types to support:
- 'invoice_paid' - When client pays invoice
- 'task_assigned' - When task assigned to user
- 'project_update' - Project status change
- 'mention' - User mentioned in comment

Use existing patterns:
- Store in Firestore: organizations/{orgId}/notifications/{notificationId}
- Use onSnapshot for real-time updates
- Use Tailwind for styling
- Use BellIcon from @heroicons/react/24/outline

DO NOT touch any files outside your assigned directories.
Run 'npx tsc --noEmit' when done.
```

---

## Coordination Rules

1. **No shared files** - Each session has exclusive ownership of their directories
2. **Don't modify existing files** - Only create new files in assigned directories
3. **Types go in your own types.ts** - Don't modify the main types/index.ts
4. **Run TypeScript check** - Each session runs `npx tsc --noEmit` before declaring done

---

## After All Sessions Complete

The **Controller session** (this one) will:
1. Collect all new files via `git status`
2. Add new types to main `types/index.ts`
3. Integrate components into main layout (NotificationBell in header, etc.)
4. Run full TypeScript check
5. Test in browser
6. Commit all work together

---

## Terminal Commands

**Terminal 1 (Controller):** Keep this session - coordinates and integrates

**Terminal 2 (Email Templates):**
```bash
cd ~/contractoros && claude
# Paste SESSION 1 prompt
```

**Terminal 3 (Reporting):**
```bash
cd ~/contractoros && claude
# Paste SESSION 2 prompt
```

**Terminal 4 (Offline/PWA):**
```bash
cd ~/contractoros && claude
# Paste SESSION 3 prompt
```

**Terminal 5 (Notifications):** *(or reuse Terminal 4 after Offline completes)*
```bash
cd ~/contractoros && claude
# Paste SESSION 4 prompt
```

---

## Estimated Time

| Session | Task | Est. Time |
|---------|------|-----------|
| 1 | Email Templates | 30-45 min |
| 2 | Reporting Dashboard | 45-60 min |
| 3 | Offline/PWA | 30-45 min |
| 4 | Notifications | 30-45 min |
| Controller | Integration | 15-20 min |

**Total wall-clock time:** ~60-75 minutes (parallel) vs ~3 hours (sequential)

---

## Success Criteria

- [ ] All sessions complete without TypeScript errors
- [ ] No file conflicts when committing
- [ ] Each feature works independently
- [ ] Controller successfully integrates all features
