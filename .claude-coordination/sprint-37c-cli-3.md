# CLI 3 SPRINT 37C - Demo Data Seeding

> **Sprint:** 37C
> **Role:** Database/Data
> **Started:** 2026-02-02

---

## Your Tasks

### Task 1: Categorize Demo Projects (Issue #12)
**Severity:** HIGH | **Effort:** 2-3 hours

**Problem:** All demo projects missing category assignments, breaking category filter

**Fix:** Update existing projects with categories:
| Project | Categories |
|---------|------------|
| Historic Home Restoration | residential, renovation |
| Kitchen Renovation Demo | residential, renovation |
| Office Build-Out | commercial |
| Multi-Unit Housing | residential, new_construction |
| Bathroom Remodel | residential, renovation |
| Deck Replacement | residential, addition |
| Basement Finishing | residential, renovation |
| Sunroom Addition | residential, addition |
| Ashview Drive | residential |

**Method:** Create `scripts/seed-demo/update-project-categories.ts` or update directly

**Acceptance:**
- [ ] All projects have category field
- [ ] Category filter works in Projects page

---

### Task 2: Create Demo Clients (Issues #14, #30)
**Severity:** HIGH | **Effort:** 3-4 hours

**Problem:** No clients exist, projects show "Client: Not assigned"

**Create these clients:**
1. Heritage Trust Foundation (organization) - Historic Home
2. Property Group LLC (company) - Multi-Unit Housing
3. TechCorp Inc (company) - Office Build-Out
4. Michael Chen (individual) - Kitchen Renovation
5. Robert Martinez (individual) - Bathroom Remodel
6. Sarah Johnson (individual) - Deck Replacement
7. The Williams Family (individual) - Basement Finishing
8. David & Lisa Park (individual) - Sunroom Addition

**File:** Create `scripts/seed-demo/seed-clients.ts`

**Each client needs:**
- name, email, phone
- address
- clientType (individual/company/organization)
- Linked projectIds

**Acceptance:**
- [ ] 8+ clients created
- [ ] Projects linked to clients
- [ ] Client shows on project Overview

---

### Task 3: Demo Tasks & Dependencies (Issue #17)
**Severity:** HIGH | **Effort:** 8-12 hours

**Problem:** Tasks page shows "0 tasks" - Gantt view needs data

**File:** Create `scripts/seed-demo/seed-tasks.ts`

**Per project, create 15-25 tasks with:**
- title, description
- status: 'todo' | 'in_progress' | 'review' | 'done'
- priority: 'low' | 'medium' | 'high'
- assigneeId (link to team members)
- dueDate, startDate
- phase: 'pre_construction' | 'rough_in' | 'systems' | 'finishes' | 'final'
- dependencies: string[] (task IDs this depends on)
- blockedBy: string[] (task IDs blocking this)

**Example tasks for Kitchen Renovation:**
1. Site preparation (done)
2. Demo existing cabinets (done)
3. Rough plumbing (done)
4. Electrical rough-in (in_progress, depends on #3)
5. Cabinet installation (todo, depends on #4)
6. Countertop templating (todo, depends on #5)
... etc

**Acceptance:**
- [ ] 15+ tasks per project
- [ ] Mix of statuses
- [ ] Dependencies set for Gantt
- [ ] Gantt view renders timeline

---

### Task 4: Demo Sub Assignments & Bids (Issues #18, #19, #20)
**Severity:** HIGH | **Effort:** 4-6 hours

**Problem:** Subs tab shows "Assignments (0)", "Bids (0)", "Solicitations (0)"

**File:** Create `scripts/seed-demo/seed-subcontractors.ts`

**Per project, create:**

**Sub Assignments (3-5 per project):**
- subcontractorId, subcontractorName
- trade (plumbing, electrical, HVAC, etc.)
- scopeDescription
- budgetAmount
- status: 'pending' | 'active' | 'completed'

**Bids (2-3 per assignment):**
- subcontractorId
- amount
- submittedAt
- status: 'pending' | 'accepted' | 'rejected'
- lineItems[]

**Solicitations (2-3 per project):**
- title, description
- dueDate
- targetTrades[]
- status: 'open' | 'closed' | 'awarded'

**Acceptance:**
- [ ] Sub assignments visible in Subs tab
- [ ] Bids can be compared
- [ ] Solicitations show pipeline

---

### Task 5: Demo RFIs (Issue #21)
**Severity:** Medium | **Effort:** 3-4 hours

**Problem:** RFIs page shows "No RFIs yet"

**File:** Create `scripts/seed-demo/seed-rfis.ts`

**Per project, create 5-10 RFIs:**
- number (RFI-001, RFI-002, etc.)
- subject
- question
- status: 'open' | 'answered' | 'closed'
- priority
- submittedBy, submittedAt
- answer (if answered)
- answeredBy, answeredAt

**Acceptance:**
- [ ] RFIs visible on project
- [ ] Mix of open/answered/closed
- [ ] Can view RFI details

---

## Files You OWN
- `scripts/seed-demo/*`
- Any new seed scripts you create

## Files to AVOID (CLI 2 owns)
- `components/ui/*`
- `components/dashboard/*`
- `app/dashboard/page.tsx`

---

## Status Updates
After each task:
```bash
echo "$(date +%H:%M) - Task X complete: [description]" >> /Users/nickbodkins/contractoros/.claude-coordination/cli-3-status.txt
```

## Running Seed Scripts
```bash
cd /Users/nickbodkins/contractoros/scripts/seed-demo
npx ts-node seed-clients.ts
npx ts-node seed-tasks.ts
# etc.
```

## Verification
```bash
cd /Users/nickbodkins/contractoros/apps/web && npx tsc --noEmit
```
