# Sprint 11: June AI Context & Data Access

## Overview

**Goal:** Enable June (AI Assistant) to have full, secure access to organization-specific data so she can actually help users with their real questions.

**Current State:** June only sees ~15% of available data. Organization context is NULL, no access to clients, schedule, payroll, estimates, projects list, financials, or team data.

**Target State:** June has full context of the user's organization while maintaining strict data isolation between organizations.

---

## Problem Analysis

### What June CAN'T Answer Today

| Question | Why It Fails |
|----------|--------------|
| "What's my schedule this week?" | No schedule data passed |
| "How many active projects do I have?" | No projects list passed |
| "Who are my overdue clients?" | No client data passed |
| "What's my revenue this month?" | No financial data passed |
| "When's the next payroll?" | No payroll data passed |
| "How much lumber do I have in stock?" | No inventory data passed |
| "Show me my team's availability" | No team/availability data passed |
| "What estimates are pending?" | No estimates list passed |
| "How is Project X performing financially?" | Only basic project info passed |

### Root Causes

1. **Organization is NULL** - `buildContext()` in useAssistant.ts hardcodes `organization: null`
2. **No data hooks called** - Context builder only accepts static data passed from page
3. **No server-side data loading** - API route doesn't fetch additional context
4. **Security gap** - orgId comes from client, not verified against auth token

---

## Sprint Tasks

### Phase 1: Security Foundation (CRITICAL)

#### 1.1 Verify OrgId from Auth Token
**File:** `app/api/assistant/route.ts`

```typescript
// BEFORE (insecure - trusts client)
const effectiveOrgId = orgId || context?.organization?.orgId || 'unknown';

// AFTER (secure - verifies from auth)
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

async function getAuthenticatedUser(request: NextRequest) {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;

  const decodedClaims = await getAuth().verifySessionCookie(sessionCookie);
  const userDoc = await adminDb.collection('users').doc(decodedClaims.uid).get();
  return { uid: decodedClaims.uid, ...userDoc.data() };
}

// In POST handler:
const authUser = await getAuthenticatedUser(request);
if (!authUser?.orgId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
const effectiveOrgId = authUser.orgId; // Can't be spoofed
```

#### 1.2 Create Server-Side Context Loader
**File:** `lib/assistant/server-context-loader.ts` (NEW)

```typescript
/**
 * Server-side context loader for June
 * Fetches organization data using authenticated user's orgId
 * Enforces data isolation at the source
 */
export async function loadServerContext(orgId: string, userId: string) {
  const adminDb = getAdminFirestore();

  // Parallel fetch for performance
  const [
    organization,
    activeProjects,
    recentClients,
    pendingEstimates,
    upcomingSchedule,
    financialSummary,
    teamMembers,
  ] = await Promise.all([
    loadOrganization(adminDb, orgId),
    loadActiveProjects(adminDb, orgId),
    loadRecentClients(adminDb, orgId),
    loadPendingEstimates(adminDb, orgId),
    loadUpcomingSchedule(adminDb, orgId),
    loadFinancialSummary(adminDb, orgId),
    loadTeamMembers(adminDb, orgId),
  ]);

  return {
    organization,
    projects: { active: activeProjects.length, list: activeProjects },
    clients: { recent: recentClients },
    estimates: { pending: pendingEstimates },
    schedule: { upcoming: upcomingSchedule },
    financials: financialSummary,
    team: { members: teamMembers },
  };
}
```

---

### Phase 2: Context Data Loaders

#### 2.1 Organization Context
**Purpose:** Regional pricing, company info, team size

```typescript
async function loadOrganization(db: Firestore, orgId: string) {
  const orgDoc = await db.collection('organizations').doc(orgId).get();
  const org = orgDoc.data();
  return {
    id: orgId,
    name: org?.name,
    location: {
      city: org?.city,
      state: org?.state,
      zipCode: org?.zip,
    },
    industry: org?.industry || 'general_contracting',
    teamSize: org?.memberCount || 0,
    primaryTrades: org?.trades || [],
  };
}
```

#### 2.2 Projects Context
**Purpose:** "How many active projects?", "Show my projects"

```typescript
async function loadActiveProjects(db: Firestore, orgId: string) {
  const projectsQuery = db.collection('projects')
    .where('orgId', '==', orgId)
    .where('status', 'in', ['active', 'in_progress'])
    .orderBy('updatedAt', 'desc')
    .limit(20);

  const snapshot = await projectsQuery.get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name,
    status: doc.data().status,
    clientName: doc.data().clientName,
    budget: doc.data().budget,
    completionPercent: doc.data().completionPercent,
  }));
}
```

#### 2.3 Clients Context
**Purpose:** "Who are my overdue clients?", "Recent client activity"

```typescript
async function loadRecentClients(db: Firestore, orgId: string) {
  const clientsQuery = db.collection(`organizations/${orgId}/clients`)
    .where('status', '==', 'active')
    .orderBy('lastContactDate', 'desc')
    .limit(15);

  const snapshot = await clientsQuery.get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name,
    status: doc.data().status,
    lastContact: doc.data().lastContactDate,
    totalRevenue: doc.data().financials?.totalRevenue || 0,
    outstandingBalance: doc.data().financials?.outstandingBalance || 0,
  }));
}
```

#### 2.4 Schedule Context
**Purpose:** "What's my schedule?", "Any conflicts this week?"

```typescript
async function loadUpcomingSchedule(db: Firestore, orgId: string) {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const scheduleQuery = db.collection(`organizations/${orgId}/scheduleEvents`)
    .where('startTime', '>=', Timestamp.fromDate(now))
    .where('startTime', '<=', Timestamp.fromDate(weekFromNow))
    .orderBy('startTime')
    .limit(20);

  const snapshot = await scheduleQuery.get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    title: doc.data().title,
    type: doc.data().eventType,
    startTime: doc.data().startTime?.toDate(),
    endTime: doc.data().endTime?.toDate(),
    projectName: doc.data().projectName,
    assignedTo: doc.data().assignedUsers?.map(u => u.name),
  }));
}
```

#### 2.5 Financial Summary Context
**Purpose:** "How am I doing financially?", "Revenue this month?"

```typescript
async function loadFinancialSummary(db: Firestore, orgId: string) {
  // Get current month invoices
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [invoicesSnap, expensesSnap] = await Promise.all([
    db.collection(`organizations/${orgId}/invoices`)
      .where('date', '>=', Timestamp.fromDate(startOfMonth))
      .get(),
    db.collection(`organizations/${orgId}/expenses`)
      .where('date', '>=', Timestamp.fromDate(startOfMonth))
      .get(),
  ]);

  const invoices = invoicesSnap.docs.map(d => d.data());
  const expenses = expensesSnap.docs.map(d => d.data());

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
  const overdueInvoices = invoices.filter(inv =>
    inv.status === 'pending' && inv.dueDate?.toDate() < new Date()
  ).length;

  return {
    monthlyRevenue: totalRevenue,
    monthlyExpenses: totalExpenses,
    monthlyProfit: totalRevenue - totalExpenses,
    pendingInvoices,
    overdueInvoices,
  };
}
```

#### 2.6 Team Context
**Purpose:** "Who's available?", "Show my team"

```typescript
async function loadTeamMembers(db: Firestore, orgId: string) {
  const usersQuery = db.collection('users')
    .where('orgId', '==', orgId)
    .where('status', '==', 'active')
    .limit(50);

  const snapshot = await usersQuery.get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().displayName,
    role: doc.data().role,
    email: doc.data().email,
    phone: doc.data().phone,
  }));
}
```

#### 2.7 Estimates Context
**Purpose:** "Pending estimates?", "Show my quotes"

```typescript
async function loadPendingEstimates(db: Firestore, orgId: string) {
  const estimatesQuery = db.collection('estimates')
    .where('orgId', '==', orgId)
    .where('status', 'in', ['draft', 'pending', 'sent'])
    .orderBy('updatedAt', 'desc')
    .limit(15);

  const snapshot = await estimatesQuery.get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name,
    status: doc.data().status,
    clientName: doc.data().clientName,
    total: doc.data().total,
    expiresAt: doc.data().expiresAt?.toDate(),
  }));
}
```

---

### Phase 3: Enhanced System Prompt

#### 3.1 Update buildSystemPrompt()
**File:** `lib/assistant/prompts.ts`

Add a new section that formats the rich context:

```typescript
function buildRichContextSummary(serverContext: ServerContext): string {
  const parts: string[] = [];

  // Organization
  if (serverContext.organization) {
    const org = serverContext.organization;
    parts.push(`**Organization:** ${org.name} (${org.location.city}, ${org.location.state})`);
    parts.push(`Team size: ${org.teamSize} members | Primary trades: ${org.primaryTrades.join(', ')}`);
  }

  // Projects
  if (serverContext.projects) {
    parts.push(`\n**Projects:** ${serverContext.projects.active} active`);
    if (serverContext.projects.list.length > 0) {
      parts.push('Recent projects:');
      serverContext.projects.list.slice(0, 5).forEach(p => {
        parts.push(`- ${p.name} (${p.status}) - ${p.clientName} - $${p.budget?.toLocaleString() || 'TBD'}`);
      });
    }
  }

  // Financials
  if (serverContext.financials) {
    const fin = serverContext.financials;
    parts.push(`\n**This Month's Financials:**`);
    parts.push(`- Revenue: $${fin.monthlyRevenue.toLocaleString()}`);
    parts.push(`- Expenses: $${fin.monthlyExpenses.toLocaleString()}`);
    parts.push(`- Profit: $${fin.monthlyProfit.toLocaleString()}`);
    parts.push(`- Pending invoices: ${fin.pendingInvoices} | Overdue: ${fin.overdueInvoices}`);
  }

  // Schedule
  if (serverContext.schedule?.upcoming?.length > 0) {
    parts.push(`\n**Upcoming This Week:** ${serverContext.schedule.upcoming.length} events`);
    serverContext.schedule.upcoming.slice(0, 5).forEach(e => {
      const date = e.startTime ? new Date(e.startTime).toLocaleDateString() : 'TBD';
      parts.push(`- ${date}: ${e.title} (${e.type})`);
    });
  }

  // Clients
  if (serverContext.clients?.recent?.length > 0) {
    const withBalance = serverContext.clients.recent.filter(c => c.outstandingBalance > 0);
    if (withBalance.length > 0) {
      parts.push(`\n**Clients with Outstanding Balance:**`);
      withBalance.slice(0, 5).forEach(c => {
        parts.push(`- ${c.name}: $${c.outstandingBalance.toLocaleString()}`);
      });
    }
  }

  // Estimates
  if (serverContext.estimates?.pending?.length > 0) {
    parts.push(`\n**Pending Estimates:** ${serverContext.estimates.pending.length}`);
    serverContext.estimates.pending.slice(0, 5).forEach(e => {
      parts.push(`- ${e.name} for ${e.clientName}: $${e.total?.toLocaleString() || 'TBD'}`);
    });
  }

  return parts.join('\n');
}
```

---

### Phase 4: API Route Integration

#### 4.1 Update POST Handler
**File:** `app/api/assistant/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: RequestBody = await request.json();
    const { message, context, conversationHistory, options } = body;

    // STEP 0: Authenticate and get orgId from token (not client)
    const authUser = await getAuthenticatedUser(request);
    if (!authUser?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const effectiveOrgId = authUser.orgId;
    const effectiveUserId = authUser.uid;

    // ... existing validation ...

    // STEP 2.5: Load rich server-side context
    const serverContext = await loadServerContext(effectiveOrgId, effectiveUserId);

    // STEP 4: Build system prompt WITH rich context
    const systemPrompt = buildSystemPrompt(context, serverContext);

    // ... rest of handler ...
  }
}
```

---

### Phase 5: Testing Plan

#### 5.1 Test Questions by Category

**Organization Questions:**
- "What company am I working for?" → Should return org name
- "Where is my company located?" → Should return city, state
- "How big is my team?" → Should return member count

**Project Questions:**
- "How many active projects do I have?" → Should return count
- "List my projects" → Should list recent projects
- "What's the status of Project X?" → Should find and describe

**Financial Questions:**
- "What's my revenue this month?" → Should return MTD revenue
- "How am I doing financially?" → Should summarize P&L
- "Any overdue invoices?" → Should list overdue count/clients

**Schedule Questions:**
- "What's my schedule this week?" → Should list upcoming events
- "Any scheduling conflicts?" → Should analyze overlaps
- "Who's working on Monday?" → Should check assignments

**Client Questions:**
- "Who are my top clients?" → Should list by revenue
- "Any clients with outstanding balances?" → Should filter and list
- "When did I last contact John Smith?" → Should check lastContactDate

**Estimate Questions:**
- "Any pending estimates?" → Should list pending
- "How much is the Miller estimate?" → Should find by name

**Team Questions:**
- "Who's on my team?" → Should list members
- "What's Bob's role?" → Should find and return role

#### 5.2 Security Test Cases

1. **Cross-org isolation:** User from OrgA cannot see OrgB data
2. **Unauthenticated requests:** Should return 401
3. **Spoofed orgId in body:** Should be ignored, use auth token
4. **Rate limiting by org:** Each org has separate limits

---

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `lib/assistant/server-context-loader.ts` | CREATE | Load org data server-side |
| `app/api/assistant/route.ts` | MODIFY | Auth verification, context loading |
| `lib/assistant/prompts.ts` | MODIFY | Rich context in system prompt |
| `lib/assistant/types.ts` | MODIFY | Add ServerContext type |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Performance (too many queries) | Use parallel Promise.all, add caching |
| Token limit exceeded | Summarize data, limit list sizes |
| Stale data | Context loaded per-request, always fresh |
| Cost increase | Monitor token usage, optimize prompt |

---

## Success Criteria

1. ✅ June can answer all test questions correctly
2. ✅ Zero cross-organization data leakage
3. ✅ Response latency < 3 seconds
4. ✅ All security tests pass
5. ✅ Rate limiting works per-organization

---

## Estimated Effort

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: Security | 2 hours | Firebase Admin SDK |
| Phase 2: Data Loaders | 3 hours | Firestore indexes |
| Phase 3: System Prompt | 1 hour | Phase 2 |
| Phase 4: API Integration | 1 hour | Phases 1-3 |
| Phase 5: Testing | 2 hours | All phases |

**Total:** ~9 hours
