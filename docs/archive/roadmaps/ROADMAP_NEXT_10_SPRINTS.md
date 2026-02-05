# ContractorOS: Next 10 Development Phases

> **Created:** 2026-02-03
> **Strategy:** Stabilization First, Aggressive Launch
> **Development Model:** AI-Assisted (Claude Code with parallel sub-agents)

---

## Executive Summary

This roadmap covers **10 development phases** designed for AI-assisted development where traditional "sprints" become **sessions lasting 1-4 hours each**. With parallel sub-agents, we can execute 3-5x faster than sequential work.

### Timing Reality Check

| Traditional Estimate | AI-Assisted Reality | Notes |
|---------------------|---------------------|-------|
| "1 week sprint" | 1-2 sessions (2-6 hours) | Parallel sub-agents |
| "40-60 hours effort" | 4-8 hours actual | No context switching, no meetings |
| "2-3 developers" | 3-6 parallel sub-agents | Simultaneous execution |
| "10-14 weeks to launch" | **5-10 sessions (~20-40 hours)** | Aggressive but realistic |

### Phase Overview

| Phase | Focus | Session Estimate | Token Budget |
|-------|-------|------------------|--------------|
| **1** | Critical Fixes | 1 session (2-3h) | ~500K tokens |
| **2** | Refactoring | 1-2 sessions (3-5h) | ~800K tokens |
| **3** | Testing Setup | 1 session (2-3h) | ~400K tokens |
| **4** | Pagination | 1 session (2-3h) | ~500K tokens |
| **5** | Portal Features | 1-2 sessions (3-5h) | ~700K tokens |
| **6** | Dashboard Features | 1-2 sessions (3-5h) | ~700K tokens |
| **7** | Integrations | 1 session (2-3h) | ~500K tokens |
| **8** | Security | 1 session (2-3h) | ~400K tokens |
| **9** | Launch Prep | 1 session (2-3h) | ~400K tokens |
| **10** | Launch & Polish | 1 session (2-3h) | ~300K tokens |

**Total: 8-12 sessions (~25-40 hours actual work)**

---

## Phase 1: Critical Fixes (URGENT)

**Session Time:** 2-3 hours
**Priority:** 🔴 P0 - Do First
**Parallel Agents:** 4

### Execution Plan

```
PARALLEL BATCH 1 (45 min):
├── Agent 1 (Bash): Fix Cloud Functions database → deploy
├── Agent 2 (general-purpose): Consolidate weather services
├── Agent 3 (general-purpose): Create shared formatters utility
└── Agent 4 (general-purpose): Remove duplicate useSubcontractors

PARALLEL BATCH 2 (60 min):
├── Agent 1 (general-purpose): Split types/index.ts → types/user.ts, types/project.ts
├── Agent 2 (general-purpose): Split types/index.ts → types/finance.ts, types/schedule.ts
├── Agent 3 (general-purpose): Split types/index.ts → types/subcontractor.ts, types/integration.ts
└── Agent 4 (general-purpose): Update all imports to new type paths

VERIFICATION (30 min):
└── Main session: Run tsc, verify CF deployment, test email triggers
```

### Tasks

| Task | Agent Type | Time | Files |
|------|------------|------|-------|
| Fix CF database bug | Bash | 15 min | `functions/src/index.ts:33` |
| Deploy & verify CF | Bash | 15 min | Firebase CLI |
| Consolidate weather services | general-purpose | 30 min | 2 files → 1 |
| Create formatters.ts | general-purpose | 20 min | New file + 6 updates |
| Remove duplicate hooks | general-purpose | 15 min | 2 files |
| Split types (6 files) | 3x general-purpose | 45 min | types/*.ts |
| Update imports | general-purpose | 30 min | ~100 files |

### Deliverables
- [ ] Cloud Functions using `contractoros` database
- [ ] Email triggers verified working
- [ ] Single weather service
- [ ] Centralized formatters
- [ ] Types split into 6+ domain files
- [ ] `npx tsc --noEmit` passing

---

## Phase 2: Refactoring Completion

**Session Time:** 3-5 hours
**Priority:** 🟡 P1
**Parallel Agents:** 5

### Execution Plan

```
PARALLEL BATCH 1 - Large File Splitting (90 min):
├── Agent 1: Split templates/page.tsx (2,424 lines)
├── Agent 2: Split useMaterials.ts (1,344 lines)
├── Agent 3: Split useReports.ts (1,097 lines)
├── Agent 4: Split useSchedule.ts (963 lines)
└── Agent 5: Split OffboardingWizard.tsx (958 lines)

PARALLEL BATCH 2 - Hook Standardization (60 min):
├── Agent 1: Standardize timestamp conversion (hooks A-M)
├── Agent 2: Standardize timestamp conversion (hooks N-Z)
├── Agent 3: Standardize error returns pattern
└── Agent 4: Add JSDoc to top 20 hooks

PARALLEL BATCH 3 - Performance (30 min):
├── Agent 1: Add useMemo to dashboard page
├── Agent 2: Add useCallback patterns to forms
└── Agent 3: Document component patterns

VERIFICATION (30 min):
└── Main session: tsc, spot-check refactored files
```

### Tasks

| Task | Files | Before | After |
|------|-------|--------|-------|
| Split templates page | `settings/templates/page.tsx` | 2,424 lines | 5 files <400 lines each |
| Split useMaterials | `hooks/useMaterials.ts` | 1,344 lines | 3 hooks |
| Split useReports | `hooks/useReports.ts` | 1,097 lines | 4 report-specific hooks |
| Split useSchedule | `hooks/useSchedule.ts` | 963 lines | 3 focused hooks |
| Split OffboardingWizard | `team/OffboardingWizard.tsx` | 958 lines | 5 step components |

### Deliverables
- [ ] No file over 600 lines
- [ ] Consistent hook patterns
- [ ] Performance optimizations applied
- [ ] Documentation updated

---

## Phase 3: Testing Foundation

**Session Time:** 2-3 hours
**Priority:** 🟡 P1
**Parallel Agents:** 4

### Execution Plan

```
SETUP (30 min):
└── Main session: Install Jest, configure, create test utilities

PARALLEL BATCH 1 - Security Tests (45 min):
├── Agent 1: Test isAuthenticated + isSameOrg
├── Agent 2: Test isAdmin + isOwner
├── Agent 3: Test rate-limiter
└── Agent 4: Test timestamp-converter + formatters

PARALLEL BATCH 2 - Hook Tests (60 min):
├── Agent 1: Test useAuth
├── Agent 2: Test useProjects
├── Agent 3: Test useInvoices
└── Agent 4: Test useClients + useTimeEntries

VERIFICATION (15 min):
└── Main session: Run full test suite, check coverage
```

### Coverage Targets

| Category | Target | Priority |
|----------|--------|----------|
| Security helpers | 100% | P0 |
| Utility functions | 100% | P0 |
| Auth hooks | 80% | P1 |
| CRUD hooks (5) | 80% | P1 |
| Overall | 60% critical paths | P1 |

### Deliverables
- [ ] Jest configured and running
- [ ] 100% coverage on security helpers
- [ ] 80% coverage on 5 critical hooks
- [ ] CI runs tests (cloudbuild.yaml updated)

---

## Phase 4: Pagination & Scale

**Session Time:** 2-3 hours
**Priority:** 🔴 P0
**Parallel Agents:** 4

### Execution Plan

```
SETUP (30 min):
├── Agent 1: Create Pagination.tsx component
└── Agent 2: Create usePagination.ts hook

PARALLEL BATCH 1 - Implement Pagination (60 min):
├── Agent 1: Tasks + Time Entries pagination
├── Agent 2: Photos + Invoices pagination
├── Agent 3: Activity Logs + Messages pagination
└── Agent 4: Daily Logs + create LoadMore component

PARALLEL BATCH 2 - Performance (30 min):
├── Agent 1: Lazy load admin pages
├── Agent 2: Optimize image loading
└── Agent 3: Run bundle analysis, document results

VERIFICATION (30 min):
└── Main session: Test pagination, run Lighthouse
```

### Collections to Paginate

| Collection | Current | Target | Hook File |
|------------|---------|--------|-----------|
| Tasks | Unlimited | 50/page | `useTasks.ts` |
| Time Entries | Unlimited | 100/page | `useTimeEntries.ts` |
| Photos | Unlimited | 30/page | `usePhotos.ts` |
| Invoices | Unlimited | 50/page | `useInvoices.ts` |
| Activity Logs | Unlimited | 100/page | `useActivityLog.ts` |
| Messages | Unlimited | 50/page | `useMessages.ts` |
| Daily Logs | Unlimited | 50/page | `useDailyLogs.ts` |

### Deliverables
- [ ] Reusable Pagination component
- [ ] 7 collections paginated
- [ ] Lighthouse score documented
- [ ] Bundle size < 250KB

---

## Phase 5: Portal Features (Coming Soon → Functional)

**Session Time:** 3-5 hours
**Priority:** 🟠 P2
**Parallel Agents:** 5

### Execution Plan

```
PARALLEL BATCH 1 - Client Portal (60 min):
├── Agent 1: /client/projects - Project list view
├── Agent 2: /client/messages - Read-only messaging
└── Agent 3: /client/photos - Photo gallery

PARALLEL BATCH 2 - Field Portal (45 min):
├── Agent 1: /field/schedule - Calendar view
├── Agent 2: Offline project downloads (IndexedDB)
└── Agent 3: Voice log UI improvements

PARALLEL BATCH 3 - Sub Portal (45 min):
├── Agent 1: /sub/invoices - Invoice creation
├── Agent 2: /sub/photos - Work documentation
└── Agent 3: /sub/bids - Bid management

VERIFICATION (30 min):
└── Main session: Test all new pages across viewports
```

### Pages to Convert

| Portal | Route | Current | Target |
|--------|-------|---------|--------|
| Client | `/client/projects` | Coming Soon | Project list with status |
| Client | `/client/messages` | Coming Soon | Read message thread |
| Client | `/client/photos` | Coming Soon | Photo gallery browser |
| Field | `/field/schedule` | Basic | Full calendar view |
| Sub | `/sub/invoices` | Coming Soon | Create/track invoices |
| Sub | `/sub/photos` | Coming Soon | Upload work photos |
| Sub | `/sub/bids` | Coming Soon | View/respond to bids |

### Deliverables
- [ ] 6 Coming Soon pages → functional
- [ ] Client can view projects, photos, messages
- [ ] Subs can submit invoices and bids
- [ ] Field workers have calendar

---

## Phase 6: Dashboard Features

**Session Time:** 3-5 hours
**Priority:** 🟠 P2
**Parallel Agents:** 4

### Execution Plan

```
PARALLEL BATCH 1 - Project Section (75 min):
├── Agent 1: /projects/schedule - Timeline view
├── Agent 2: /projects/crew - Crew assignments
├── Agent 3: /projects/time - Time by project
└── Agent 4: /projects/inbox - Project notifications

PARALLEL BATCH 2 - Messaging (45 min):
├── Agent 1: /dashboard/projects/[id]/messages - Project chat
└── Agent 2: Message thread component improvements

PARALLEL BATCH 3 - Cleanup (30 min):
├── Agent 1: Remove remaining Coming Soon placeholders
└── Agent 2: Navigation updates for new pages

VERIFICATION (30 min):
└── Main session: Test all new pages, check navigation
```

### Pages to Convert

| Route | Current | Target |
|-------|---------|--------|
| `/projects/schedule` | Coming Soon | Project timeline/Gantt |
| `/projects/crew` | Coming Soon | Crew assignment grid |
| `/projects/time` | Coming Soon | Time entries by project |
| `/projects/inbox` | Coming Soon | Project notifications |
| `/dashboard/projects/[id]/messages` | Coming Soon | Project-specific chat |

### Deliverables
- [ ] All /projects/* pages functional
- [ ] Project messaging working
- [ ] 0 Coming Soon pages remaining
- [ ] Navigation updated

---

## Phase 7: Integrations

**Session Time:** 2-3 hours
**Priority:** 🟠 P2
**Parallel Agents:** 3

### Execution Plan

```
PARALLEL BATCH 1 - SMS (60 min):
├── Agent 1: Cloud Function sendSMS + webhook
├── Agent 2: useSMS hook + conversation UI
└── Agent 3: SMS templates management

PARALLEL BATCH 2 - QBO & Stubs (45 min):
├── Agent 1: QBO scheduled sync (6-hour cron)
├── Agent 2: Integration status dashboard
└── Agent 3: Gusto/Stripe stub pages

VERIFICATION (30 min):
└── Main session: Test SMS send/receive, QBO sync
```

### Integration Status

| Integration | Current | Target | Priority |
|-------------|---------|--------|----------|
| Twilio SMS | Stubbed | Working | P1 |
| QuickBooks | 60% | Scheduled sync | P2 |
| Gusto | Stub UI | Better stub UI | P3 |
| Stripe | Stub UI | Better stub UI | P3 |

### Deliverables
- [ ] SMS sending working
- [ ] SMS webhook receiving
- [ ] QBO auto-syncs every 6 hours
- [ ] Integration dashboard shows all statuses

---

## Phase 8: Security Hardening

**Session Time:** 2-3 hours
**Priority:** 🔴 P0
**Parallel Agents:** 3

### Execution Plan

```
PARALLEL BATCH 1 - Core Security (60 min):
├── Agent 1: Field-level encryption for PII
├── Agent 2: Rate limiting on remaining API routes
└── Agent 3: Audit logging improvements

PARALLEL BATCH 2 - Compliance (45 min):
├── Agent 1: Data retention policy implementation
├── Agent 2: GDPR data export tool
└── Agent 3: Session timeout + force logout

VERIFICATION (30 min):
└── Main session: Run security E2E tests, verify encryption
```

### Security Checklist

| Item | Current | Target |
|------|---------|--------|
| PII encryption | None | AES-256 at rest |
| API rate limiting | Partial | All routes |
| Audit logging | Basic | Comprehensive |
| Session management | Basic | Timeout + force logout |
| Data export | None | GDPR compliant |

### Deliverables
- [ ] PII fields encrypted
- [ ] All API routes rate-limited
- [ ] Audit logs comprehensive
- [ ] Data export working
- [ ] All security E2E tests pass

---

## Phase 9: Launch Preparation

**Session Time:** 2-3 hours
**Priority:** 🔴 P0
**Parallel Agents:** 3

### Execution Plan

```
PARALLEL BATCH 1 - Infrastructure (60 min):
├── Agent 1: Production secrets audit + DNS/SSL
├── Agent 2: Cloud Monitoring alerts setup
└── Agent 3: Sentry error tracking integration

PARALLEL BATCH 2 - Documentation (45 min):
├── Agent 1: API documentation
├── Agent 2: Admin operations runbook
└── Agent 3: In-app onboarding tour

PARALLEL BATCH 3 - Demo (30 min):
├── Agent 1: Verify demo data quality (450+ records)
└── Agent 2: Demo account setup + walkthrough script

VERIFICATION (15 min):
└── Main session: Verify production readiness checklist
```

### Production Checklist

| Item | Status |
|------|--------|
| Secrets in Secret Manager | Verify |
| DNS configured | Setup |
| SSL certificate | Setup |
| Cloud Monitoring | Configure |
| Sentry | Integrate |
| Demo account | Polish |

### Deliverables
- [ ] Production environment ready
- [ ] Monitoring alerts configured
- [ ] Sentry capturing errors
- [ ] Documentation complete
- [ ] Demo account polished

---

## Phase 10: Launch & Polish

**Session Time:** 2-3 hours
**Priority:** 🔴 P0
**Parallel Agents:** 2

### Execution Plan

```
TESTING (60 min):
├── Agent 1: Run full E2E regression (225+ tests)
└── Agent 2: Mobile + cross-browser testing

BUG FIXES (60 min):
└── Main session: Fix any blockers found

LAUNCH (30 min):
├── Deploy to production
├── Verify no critical alerts
└── Soft launch to limited users
```

### Launch Criteria

**Must Have (Launch Blockers):**
- [ ] 0 critical bugs
- [ ] All security E2E tests passing
- [ ] Pagination on all large collections
- [ ] Cloud Functions verified
- [ ] 60% unit test coverage on critical paths

**Nice to Have:**
- [ ] All Coming Soon pages functional
- [ ] SMS integration working
- [ ] 80% unit test coverage

---

## Execution Summary

### Total Time Investment

| Phase | Hours | Sessions |
|-------|-------|----------|
| Phase 1: Critical Fixes | 2-3h | 1 |
| Phase 2: Refactoring | 3-5h | 1-2 |
| Phase 3: Testing | 2-3h | 1 |
| Phase 4: Pagination | 2-3h | 1 |
| Phase 5: Portal Features | 3-5h | 1-2 |
| Phase 6: Dashboard Features | 3-5h | 1-2 |
| Phase 7: Integrations | 2-3h | 1 |
| Phase 8: Security | 2-3h | 1 |
| Phase 9: Launch Prep | 2-3h | 1 |
| Phase 10: Launch | 2-3h | 1 |
| **TOTAL** | **25-40h** | **8-12 sessions** |

### Recommended Session Groupings

For maximum efficiency, combine phases in longer sessions:

| Session | Phases | Duration | Focus |
|---------|--------|----------|-------|
| **Session A** | 1 + 2 | 5-8h | Critical fixes + Refactoring |
| **Session B** | 3 + 4 | 4-6h | Testing + Pagination |
| **Session C** | 5 + 6 | 6-10h | All Coming Soon features |
| **Session D** | 7 + 8 | 4-6h | Integrations + Security |
| **Session E** | 9 + 10 | 4-6h | Launch prep + Deploy |

**Aggressive path: 5 sessions (~25-35 hours) to production**

---

## Post-Launch Backlog

Features deferred for after launch:

| Feature | Effort | Priority |
|---------|--------|----------|
| QuickBooks full bidirectional sync | 4-6h | P2 |
| Gusto payroll integration | 4-6h | P3 |
| Custom reports builder | 4-6h | P2 |
| Messaging redesign | 6-8h | P2 |
| Native mobile app | 20-40h | P3 |
| AI model multi-provider | 3-4h | P3 |

---

## Starting Phase 1 Now?

If you want to start immediately, I can launch Phase 1 with parallel sub-agents:

```
Ready to execute:
├── Agent 1: Fix Cloud Functions database
├── Agent 2: Consolidate weather services
├── Agent 3: Create shared formatters
├── Agent 4: Begin types splitting

Estimated time: 2-3 hours to complete Phase 1
```

Just say "go" and I'll begin execution.

---

*Document created: 2026-02-03*
*Development model: AI-assisted with parallel sub-agents*
