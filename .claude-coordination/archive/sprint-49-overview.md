# Sprint 49 - Data Quality & Missing Demo Data

**Start Date:** 2026-02-04
**Focus:** Complete demo data for all features
**Estimated Effort:** 8-12 hours (1-2 days)
**Priority:** P1 - HIGH
**Status:** 🔴 IN PROGRESS

---

## Why This Sprint?

**Problem:** Demo data is incomplete, making features appear broken
**Root Cause:** Previous sprints focused on code, not data completeness
**Solution:** Seed comprehensive demo data for all modules
**Impact:** Better sales demos, easier testing, features work as expected

---

## Sprint Objectives

### Issues to Fix
| ID | Issue | Effort | Status |
|----|-------|--------|--------|
| #12 | Demo projects not categorized | 2-3h | [ ] |
| #14 | Missing demo client assignment | 2-3h | [ ] |
| #17 | No demo tasks for Gantt | 8-12h | [ ] |
| #21 | No demo RFIs (partially done) | 3-4h | [ ] |
| #30 | Create realistic demo clients | 3-4h | [ ] |
| #35 | Schedule demo events | 4-6h | [ ] |

### Success Criteria
- [ ] All demo projects have categories assigned
- [ ] All projects assigned to clients
- [ ] 15-25 tasks per project for Gantt chart
- [ ] 5-10 demo RFIs with responses
- [ ] 5-8 realistic demo clients with full data
- [ ] 20+ schedule events across projects

---

## Seed Scripts

### Existing (to enhance)
- `scripts/seed-demo/seed-projects.ts`
- `scripts/seed-demo/seed-tasks.ts`
- `scripts/seed-demo/seed-rfis.ts`
- `scripts/seed-demo/seed-schedule-events.ts`

### New Scripts Needed
- `seed-project-categories.ts` - Assign categories to all projects
- `seed-client-assignments.ts` - Link projects to clients
- `seed-tasks-gantt.ts` - Add tasks with dependencies for Gantt
- `seed-demo-clients.ts` - Create realistic client profiles

---

## Parallel Execution Plan

### Batch 1: Assessment (Parallel)
- Agent 1: Audit existing projects (categories, clients)
- Agent 2: Audit existing tasks (count per project, dependencies)
- Agent 3: Audit existing RFIs and schedule events
- Agent 4: Check existing seed scripts

### Batch 2: Seed Script Updates (Parallel)
- Agent 1: Update seed-projects.ts with categories
- Agent 2: Create/update seed-tasks-gantt.ts
- Agent 3: Update seed-rfis.ts
- Agent 4: Update seed-schedule-events.ts

### Batch 3: Run Seeds & Verify
- Run all seed scripts
- Verify data in Firebase Console
- Test affected UI features

---

## Demo Organization

**Org Name:** Horizon Construction Co.
**OrgId:** Defined in `scripts/seed-demo/utils.ts`

### Expected Demo Data Counts
| Entity | Target Count | Notes |
|--------|--------------|-------|
| Projects | 8-12 | Various stages and categories |
| Clients | 5-8 | Residential and commercial |
| Tasks | 150-250 total | 15-25 per project |
| RFIs | 10-15 | Mix of statuses |
| Schedule Events | 20-30 | Across all projects |
| Subcontractors | 8-12 | Various trades |

---

## File Locations

```
scripts/seed-demo/
├── db.ts                    # Named database connection
├── utils.ts                 # Demo org config, helpers
├── index.ts                 # Main seeder
├── seed-projects.ts         # Project seeding
├── seed-tasks.ts            # Task seeding
├── seed-rfis.ts             # RFI seeding
├── seed-schedule-events.ts  # Calendar events
├── seed-subcontractors.ts   # Subcontractor data
└── seed-clients.ts          # Client profiles
```

---

## Verification Checklist

After seeding, verify in the app:

1. **Dashboard**
   - [ ] Projects show with categories
   - [ ] Active Projects widget populated

2. **Projects**
   - [ ] Each project has a client assigned
   - [ ] Category filters work

3. **Gantt Chart**
   - [ ] Tasks display on timeline
   - [ ] Dependencies shown (if supported)

4. **Schedule**
   - [ ] Calendar shows events
   - [ ] Events linked to projects

5. **RFIs**
   - [ ] RFI list populated
   - [ ] Various statuses shown

---

**Sprint Owner:** Development Team
**Sprint Status:** 🔴 IN PROGRESS
**Previous Sprint:** Sprint 48 - Next.js 16 + React 19 ✅ COMPLETE
