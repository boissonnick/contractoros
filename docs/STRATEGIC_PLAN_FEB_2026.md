# ContractorOS Strategic Plan — February 2026

> **Purpose:** Comprehensive competitive analysis, feature gap assessment, and prioritized roadmap
> **Created:** 2026-01-31
> **Target:** Next 2 weeks of focused development
> **Multi-Session:** Parallel development workflow defined

---

## Executive Summary

ContractorOS has built an impressive foundation with 18+ sprints of development, but gaps remain when compared to market leaders. This document analyzes our position against competitors (Buildertrend, Procore, CoConstruct, Houzz Pro, Jobber, ServiceTitan), identifies critical weaknesses, and provides a prioritized roadmap with a multi-session parallel development strategy.

---

## Part 1: Competitive Analysis

### Market Positioning Map

```
                        COMPLEXITY
                            ↑
                    HIGH    │
                            │    ┌─────────────┐
                            │    │   PROCORE   │
                            │    │  Enterprise │
                            │    └─────────────┘
                            │
                            │         ┌──────────────┐
                            │         │ SERVICETITAN │
                            │         │   Large Svc  │
                            │         └──────────────┘
                            │
         ┌──────────────┐   │
         │ BUILDERTREND │   │
         │   Res SMB    │   │
         └──────────────┘   │    ┌──────────────────┐
                            │    │  CONTRACTOROS    │
        ┌────────────┐      │    │  ★ Target Zone   │
        │ COCONSTRUCT│      │    └──────────────────┘
        │Custom Home │      │
        └────────────┘      │
                            │         ┌─────────┐
                            │         │ JOBBER  │
                            │         │Small Svc│
         ┌──────────┐       │         └─────────┘
         │HOUZZ PRO │       │
         │ Remodel  │       │
         └──────────┘       │
                    LOW     │
           ←────────────────┼────────────────→
           RESIDENTIAL                  COMMERCIAL
                        MARKET FOCUS
```

### Feature Comparison Matrix

| Feature Category | ContractorOS | Buildertrend | CoConstruct | Procore | Jobber | ServiceTitan |
|-----------------|--------------|--------------|-------------|---------|--------|--------------|
| **Core PM** |
| Project Management | ✅ Strong | ✅ Strong | ✅ Strong | ✅ Best | ✅ Basic | ✅ Strong |
| Task Management | ✅ Gantt/Kanban | ✅ Full | ✅ Good | ✅ Best | ✅ Basic | ✅ Good |
| Scheduling | ✅ Calendar | ✅ Full | ✅ Good | ✅ Best | ✅ Good | ✅ Best |
| **Client Experience** |
| Client Portal | ✅ Magic Links | ✅ Login Req | ✅ Good | ⚠️ Limited | ✅ Basic | ✅ Good |
| E-Signature | ✅ Built-in | ✅ Built-in | ✅ Built-in | ❌ Integration | ❌ Integration | ❌ Integration |
| **Communication** |
| SMS/Text | ✅ Twilio | ⚠️ Limited | ⚠️ Limited | ❌ None | ✅ Built-in | ✅ Best |
| Email | ⚠️ Basic | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Financial** |
| Estimating | ✅ Good | ✅ Best | ✅ Good | ✅ Complex | ✅ Good | ✅ Good |
| Invoicing | ✅ Good | ✅ Full | ✅ Full | ✅ Full | ✅ Good | ✅ Best |
| Payments | ✅ Stripe | ✅ Built-in | ✅ Built-in | ❌ Integration | ✅ Built-in | ✅ Best |
| Job Costing | ⚠️ Basic | ✅ Good | ✅ Full | ✅ Best | ⚠️ Basic | ✅ Best |
| **Field Ops** |
| Time Tracking | ✅ GPS | ✅ Good | ✅ Good | ✅ Full | ✅ GPS | ✅ Best |
| Photo Documentation | ✅ Full | ✅ Full | ✅ Good | ✅ Full | ✅ Good | ✅ Good |
| Daily Logs | ✅ Full | ✅ Full | ⚠️ Basic | ✅ Full | ⚠️ Basic | ✅ Good |
| **Mobile** |
| Mobile App | ⚠️ Web Only | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| Offline Mode | ❌ None | ✅ Partial | ⚠️ Limited | ✅ Full | ✅ Partial | ✅ Full |
| **AI/Intelligence** |
| AI Suggestions | ✅ Building | ❌ None | ❌ None | ⚠️ Basic | ❌ None | ⚠️ Basic |
| Market Data | ✅ Building | ❌ None | ❌ None | ⚠️ Limited | ❌ None | ❌ None |
| **Integrations** |
| QuickBooks | ⚠️ Planned | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| Accounting Count | 0 | 5+ | 3+ | 50+ | 10+ | 50+ |
| **Subcontractor** |
| Sub Portal | ✅ Good | ✅ Good | ⚠️ Basic | ✅ Full | ❌ None | ❌ None |
| Bid Management | ✅ Good | ✅ Good | ⚠️ Basic | ✅ Best | ❌ None | ❌ None |
| **Specialty** |
| Inventory Mgmt | ✅ Full | ⚠️ Basic | ⚠️ Basic | ✅ Full | ❌ None | ✅ Full |
| Warranty Tracking | ✅ Full | ⚠️ Limited | ⚠️ Limited | ⚠️ Limited | ❌ None | ✅ Good |
| Permit Tracking | ✅ Full | ⚠️ Limited | ⚠️ Limited | ✅ Good | ❌ None | ❌ None |

**Legend:** ✅ Strong/Complete | ⚠️ Basic/Limited | ❌ Missing

### Our Competitive Advantages

1. **AI Intelligence Platform** — No competitor has this
   - Material price tracking with FRED/BLS data
   - Estimation intelligence with market comparisons
   - Bid analysis and subcontractor scoring
   - AI Assistant (Claude-powered)

2. **Magic Link Client Experience** — Frictionless client access
   - No login required for clients
   - SMS-first communication
   - One-click document signing

3. **Modern Tech Stack** — Built for 2026
   - Next.js 14 App Router
   - Firebase serverless backend
   - React-PDF for documents
   - Responsive (though needs mobile polish)

4. **Comprehensive Feature Set** — More than Jobber, approaching Buildertrend
   - Full project lifecycle coverage
   - Multi-portal architecture
   - Strong field operations features

### Critical Weaknesses to Address

| Weakness | Impact | Competitor Advantage | Priority |
|----------|--------|---------------------|----------|
| **No Native Mobile App** | Users can't work offline, poor UX | All competitors have native apps | P1 - High |
| **No QuickBooks Integration** | Major blocker for adoption | All competitors have this | P0 - Critical |
| **Basic Job Costing** | Can't track real profitability | Procore, ServiceTitan excel here | P1 - High |
| **No Offline Mode** | Field workers lose connectivity | Procore, ServiceTitan, Buildertrend | P2 - Medium |
| **Mobile UI Polish** | Frustrating on phones | All competitors optimized | P1 - High |
| **No Email Templates** | Manual email composition | Buildertrend, CoConstruct | P2 - Medium |
| **Limited Reporting** | Basic analytics only | Procore, ServiceTitan lead | P2 - Medium |

---

## Part 2: Gap Analysis & Feature Prioritization

### Must-Have Features (Next 2 Weeks)

These are **blocking adoption** and must be addressed:

#### 1. QuickBooks Online Integration (5 days)
**Why Critical:** 73% of small contractors use QuickBooks. Without it, we lose deals.

**Scope:**
- OAuth 2.0 connection flow
- Customer sync (Clients → QBO Customers)
- Invoice sync (bidirectional)
- Payment recording
- Expense sync

**Files to Create:**
```
apps/web/lib/integrations/quickbooks/
├── oauth.ts              # OAuth flow handling
├── sync-customers.ts     # Customer synchronization
├── sync-invoices.ts      # Invoice synchronization
├── sync-payments.ts      # Payment recording
└── types.ts              # QBO types

apps/web/app/api/integrations/quickbooks/
├── callback/route.ts     # OAuth callback
├── sync/route.ts         # Sync trigger
└── webhook/route.ts      # QBO webhooks
```

#### 2. Mobile UI Polish (3 days)
**Why Critical:** Sprint 18 components exist but aren't integrated into main pages

**Scope:**
- Integrate MobileNav into AppShell
- Convert key pages to use MobileCard/ResponsiveDataView
- Add pull-to-refresh to list pages
- Ensure 44px touch targets everywhere
- Test on actual devices (iPhone, Android)

**Pages to Update:**
- Dashboard (priority 1)
- Projects list
- Client list
- Schedule
- Time tracking

#### 3. Job Costing Enhancement (4 days)
**Why Critical:** Contractors need to know if they're making money

**Scope:**
- Real-time cost vs budget tracking per project
- Cost breakdown by category (labor, materials, subs, overhead)
- Margin alerts when costs exceed thresholds
- Profitability dashboard per project

**Files to Create:**
```
apps/web/components/projects/JobCostingCard.tsx
apps/web/components/projects/CostBreakdownChart.tsx
apps/web/lib/hooks/useJobCosting.ts
```

### Should-Have Features (Week 3-4)

#### 4. Email Templates & Automation (2 days)
- Pre-built email templates (estimate follow-up, invoice reminder, etc.)
- Template variables (client name, project name, amount due)
- Scheduled sending
- Email history tracking

#### 5. Advanced Reporting Dashboard (3 days)
- Revenue by client
- Revenue by project type
- Margin analysis
- Year-over-year comparisons
- Exportable reports (PDF, CSV)

#### 6. Offline Mode Foundation (5 days)
- Service worker implementation
- IndexedDB for local data
- Sync queue for offline changes
- Visual indicator for offline state

### Nice-to-Have Features (Backlog)

- Native mobile app (React Native)
- Xero integration
- ADP/Gusto payroll sync
- White-label client portal
- API for third-party integrations

---

## Part 3: Multi-Session Parallel Development Workflow

### Session Architecture

To maximize development velocity, we'll run **4 parallel Claude sessions**, each with a distinct responsibility:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MULTI-SESSION DEVELOPMENT ARCHITECTURE               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐     ┌──────────────────┐                          │
│  │  SESSION 1       │     │  SESSION 2       │                          │
│  │  COORDINATOR     │────▶│  DEV SPRINT      │                          │
│  │                  │     │                  │                          │
│  │  • Planning      │     │  • Features      │                          │
│  │  • Code review   │     │  • UI/UX         │                          │
│  │  • Integration   │     │  • Hooks/Logic   │                          │
│  │  • Documentation │     │  • Components    │                          │
│  └────────┬─────────┘     └──────────────────┘                          │
│           │                                                              │
│           │               ┌──────────────────┐                          │
│           │               │  SESSION 3       │                          │
│           └──────────────▶│  DATABASE/RULES  │                          │
│           │               │                  │                          │
│           │               │  • Firestore     │                          │
│           │               │  • Security      │                          │
│           │               │  • Indexes       │                          │
│           │               │  • Migrations    │                          │
│           │               └──────────────────┘                          │
│           │                                                              │
│           │               ┌──────────────────┐                          │
│           └──────────────▶│  SESSION 4       │                          │
│                           │  E2E TESTING     │                          │
│                           │                  │                          │
│                           │  • Chrome MCP    │                          │
│                           │  • UAT suites    │                          │
│                           │  • Regression    │                          │
│                           │  • Bug filing    │                          │
│                           └──────────────────┘                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Session Definitions

#### Session 1: COORDINATOR
**Purpose:** Orchestrate work, review output, manage documentation

**Startup Prompt:**
```
You are the Coordinator session for ContractorOS development.

Read these files first:
- docs/STRATEGIC_PLAN_FEB_2026.md (this document)
- docs/SPRINT_STATUS.md

Your responsibilities:
1. Track progress across all sessions
2. Review and integrate code from other sessions
3. Resolve conflicts and dependencies
4. Update documentation
5. Make architectural decisions
6. Deploy when ready

Do NOT write feature code directly. Instead:
- Assign tasks to other sessions
- Review pull requests
- Update SPRINT_STATUS.md with progress
- Run builds and verify

Current sprint goal: [QuickBooks Integration + Mobile Polish + Job Costing]
```

#### Session 2: DEV SPRINT
**Purpose:** Write feature code — components, hooks, pages

**Startup Prompt:**
```
You are the Dev Sprint session for ContractorOS.

Read these files first:
- CLAUDE.md
- docs/STRATEGIC_PLAN_FEB_2026.md
- docs/DEVELOPMENT_GUIDE.md

Your responsibilities:
1. Implement features assigned by Coordinator
2. Write TypeScript-safe code
3. Follow existing patterns (see lib/hooks/ examples)
4. Create components in components/
5. Add pages to app/dashboard/

Current assignment: [Feature name from Coordinator]

Rules:
- Run `npx tsc --noEmit` after every significant change
- Follow the hook patterns in useClients.ts, useProjects.ts
- Use existing UI components (Button, Card, Modal, etc.)
- Do NOT modify firestore.rules (Session 3 handles that)
- Do NOT run E2E tests (Session 4 handles that)
```

#### Session 3: DATABASE/RULES
**Purpose:** Firestore rules, indexes, data migrations

**Startup Prompt:**
```
You are the Database session for ContractorOS.

Read these files first:
- firestore.rules
- firestore.indexes.json
- docs/STRATEGIC_PLAN_FEB_2026.md

Your responsibilities:
1. Add/update Firestore security rules
2. Create composite indexes for new queries
3. Design data schemas for new collections
4. Run data migrations if needed
5. Deploy rules: firebase deploy --only firestore --project contractoros-483812

Rules:
- ALL collections must be org-scoped (isSameOrg helper)
- No public write access to any collection
- Add indexes BEFORE Dev Sprint uses new queries
- Test rules in Firebase emulator if possible
- Document schema changes in types/index.ts

Current assignment: [New collections needed from Coordinator]
```

#### Session 4: E2E TESTING
**Purpose:** Run tests, file bugs, verify features

**Startup Prompt:**
```
You are the E2E Testing session for ContractorOS.

Read these files first:
- apps/web/e2e/RUN_TESTS.md
- apps/web/e2e/suites/*.md
- docs/STRATEGIC_PLAN_FEB_2026.md

Your responsibilities:
1. Run E2E tests using Chrome MCP
2. Document bugs found
3. Verify fixes from Dev Sprint
4. Test mobile responsiveness (375x812, 768x1024)
5. Security testing (RBAC, permissions)

Test execution:
- Smoke tests after each deploy
- Full UAT before release
- Mobile tests for all new features

Output format:
Create bug reports in this format:
---
BUG-XXX: [Title]
Severity: P0/P1/P2/P3
Steps: 1. Go to... 2. Click... 3. Expected... 4. Actual...
Screenshot: [if available]
---

Current assignment: [Test scope from Coordinator]
```

### Coordination Protocol

#### Morning Standup (Start of Day)
1. **Coordinator** reviews overnight progress
2. **Coordinator** assigns tasks to all sessions
3. Each session reads SPRINT_STATUS.md for context

#### Work Cycle (Continuous)
```
1. Dev Sprint implements feature
2. Database adds rules/indexes
3. Coordinator reviews and merges
4. E2E Testing verifies
5. Coordinator updates SPRINT_STATUS.md
6. Repeat
```

#### Handoff Format
When any session completes work, output:

```markdown
## Session [N] Handoff

**Completed:**
- [x] Task description
- [x] Files modified: path/to/file.tsx

**Needs:**
- [ ] Database rules for collection X (Session 3)
- [ ] E2E verification (Session 4)

**Blockers:**
- None / Description of blocker

**Next Steps:**
- Ready for Coordinator review
```

### File Ownership Rules

| Path | Primary Session | Notes |
|------|----------------|-------|
| `apps/web/components/` | Dev Sprint | New UI components |
| `apps/web/lib/hooks/` | Dev Sprint | Data hooks |
| `apps/web/app/` | Dev Sprint | Pages and routes |
| `firestore.rules` | Database | Security rules |
| `firestore.indexes.json` | Database | Query indexes |
| `apps/web/types/index.ts` | Dev Sprint | Type definitions |
| `docs/*.md` | Coordinator | Documentation |
| `apps/web/e2e/` | E2E Testing | Test suites |

### Conflict Resolution

If two sessions need to modify the same file:
1. First session creates their changes
2. Second session reads latest, adapts their changes
3. Coordinator resolves if conflict occurs

---

## Part 4: Two-Week Sprint Plan

### Week 1: Critical Features

| Day | Session 1 (Coord) | Session 2 (Dev) | Session 3 (DB) | Session 4 (E2E) |
|-----|------------------|-----------------|----------------|-----------------|
| Mon | Setup sessions, assign tasks | QBO OAuth scaffold | QBO collection rules | Smoke test baseline |
| Tue | Review OAuth, plan sync | QBO Customer sync | Add sync indexes | Test QBO OAuth flow |
| Wed | Review sync, plan mobile | QBO Invoice sync | Invoice sync indexes | Test customer sync |
| Thu | Review invoices, plan costing | Mobile Nav integration | Job costing schema | Test invoice sync |
| Fri | Review mobile, plan testing | Dashboard mobile UI | Job costing indexes | Mobile UI tests |

### Week 2: Polish & Release

| Day | Session 1 (Coord) | Session 2 (Dev) | Session 3 (DB) | Session 4 (E2E) |
|-----|------------------|-----------------|----------------|-----------------|
| Mon | Review weekend, assign bugs | Job Costing Card | Verify all rules | Full UAT run |
| Tue | Bug triage, fix priority | Projects list mobile | Index optimization | Bug verification |
| Wed | Integration testing | Schedule mobile UI | Rule cleanup | Regression tests |
| Thu | Documentation update | Bug fixes from E2E | Deploy prod rules | Security tests |
| Fri | Release prep | Final polish | Prod verification | Final UAT |

### Success Criteria

End of Week 2:
- [ ] QuickBooks Online connected and syncing
- [ ] Mobile UI usable on iPhone/Android
- [ ] Job costing shows real-time P&L per project
- [ ] All E2E tests passing
- [ ] Zero P0/P1 bugs
- [ ] Documentation updated

---

## Part 5: Quick Start Commands

### For Coordinator Session

```bash
# Check all status
cat docs/SPRINT_STATUS.md

# Run TypeScript check
cd apps/web && npx tsc --noEmit

# Full build and deploy
cd apps/web && npx tsc --noEmit && \
firebase deploy --only firestore --project contractoros-483812 && \
./docker-build-local.sh && \
docker stop contractoros-web 2>/dev/null; \
docker rm contractoros-web 2>/dev/null; \
docker run -d -p 3000:8080 --name contractoros-web contractoros-web && \
docker ps
```

### For Dev Sprint Session

```bash
# Start dev server
cd apps/web && npm run dev

# Type check frequently
npx tsc --noEmit

# Check existing patterns
cat apps/web/lib/hooks/useClients.ts
cat apps/web/components/ui/index.ts
```

### For Database Session

```bash
# Deploy rules only
firebase deploy --only firestore:rules --project contractoros-483812

# Deploy indexes only
firebase deploy --only firestore:indexes --project contractoros-483812

# Check index status
firebase firestore:indexes --project contractoros-483812
```

### For E2E Session

```bash
# Ensure Docker is running
docker ps

# Access app
open http://localhost:3000

# Run specific test suite (with Chrome MCP)
# "Run smoke tests from apps/web/e2e/suites/00-smoke.md"
# "Run mobile tests at 375x812"
```

---

## Appendix A: QuickBooks Integration Spec

### OAuth 2.0 Flow

```
User clicks "Connect QuickBooks"
        │
        ▼
┌──────────────────────────────────────┐
│ Redirect to Intuit OAuth             │
│ https://appcenter.intuit.com/connect │
│ /oauth2                              │
└──────────────────────────────────────┘
        │
        ▼
User logs in, authorizes app
        │
        ▼
┌──────────────────────────────────────┐
│ Callback to /api/integrations/       │
│ quickbooks/callback                   │
│                                       │
│ Exchange code for tokens              │
│ Store refresh_token in Firestore      │
└──────────────────────────────────────┘
        │
        ▼
Connection active, show "Connected" status
```

### Data Sync Strategy

| ContractorOS | QuickBooks | Sync Direction | Frequency |
|--------------|------------|----------------|-----------|
| Client | Customer | COS → QBO | On create/update |
| Invoice | Invoice | COS → QBO | On create/send |
| Payment | Payment | QBO → COS | Webhook + polling |
| Expense | Expense | COS → QBO | On approval |

### Environment Variables

```bash
# Add to .env.local
QUICKBOOKS_CLIENT_ID=your_client_id
QUICKBOOKS_CLIENT_SECRET=your_client_secret
QUICKBOOKS_REDIRECT_URI=http://localhost:3000/api/integrations/quickbooks/callback
QUICKBOOKS_ENVIRONMENT=sandbox  # or 'production'
```

---

## Appendix B: Mobile UI Implementation Checklist

### Components to Integrate

- [ ] MobileBottomNav in AppShell (replace desktop nav on mobile)
- [ ] MobileHeader for page titles
- [ ] MobileDrawer for full menu
- [ ] MobileFAB for primary actions
- [ ] MobilePullToRefresh on list pages

### Pages to Update (Priority Order)

1. **Dashboard** (`app/dashboard/page.tsx`)
   - Use MobileStats for KPIs
   - Horizontal scroll for activity feed
   - Quick action buttons

2. **Projects List** (`app/dashboard/projects/page.tsx`)
   - Use MobileProjectCard for list items
   - Filter chips instead of dropdowns
   - FAB for "New Project"

3. **Project Detail** (`app/dashboard/projects/[id]/page.tsx`)
   - Tab navigation as scrollable pills
   - Collapsible sections
   - Swipe for phase navigation

4. **Schedule** (`app/dashboard/schedule/page.tsx`)
   - Day view as default on mobile
   - Swipe between days
   - Event cards with touch targets

5. **Time Tracking** (`app/dashboard/time/page.tsx`)
   - Clock in/out as hero action
   - Large timer display
   - Quick project selection

### CSS Breakpoints

```css
/* Mobile: 0 - 639px */
@media (max-width: 639px) { }

/* Tablet: 640px - 1023px */
@media (min-width: 640px) and (max-width: 1023px) { }

/* Desktop: 1024px+ */
@media (min-width: 1024px) { }
```

---

## Appendix C: Job Costing Schema

### Types to Add

```typescript
// In types/index.ts

interface JobCostEntry {
  id: string;
  projectId: string;
  orgId: string;
  category: CostCategory;
  description: string;
  amount: number;
  date: Date;
  source: 'manual' | 'timesheet' | 'expense' | 'invoice' | 'sub_payment';
  sourceId?: string;  // Reference to original record
  createdAt: Date;
  createdBy: string;
}

type CostCategory =
  | 'labor_internal'
  | 'labor_subcontractor'
  | 'materials'
  | 'equipment_rental'
  | 'permits_fees'
  | 'overhead'
  | 'other';

interface ProjectProfitability {
  projectId: string;
  contractValue: number;
  totalCosts: number;
  costsByCategory: Record<CostCategory, number>;
  grossProfit: number;
  grossMargin: number;  // Percentage
  budgetVariance: number;  // Over/under budget
  projectedFinalCost: number;
  projectedProfit: number;
  lastUpdated: Date;
}
```

### Firestore Collection

```
organizations/{orgId}/jobCosts/{costId}
organizations/{orgId}/projectProfitability/{projectId}  // Calculated summaries
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-31 | Strategic Planning Session | Initial document |

---

*This document serves as the single source of truth for the February 2026 development push. All sessions should reference it for context and priorities.*
