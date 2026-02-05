# Sprint 66: Scoping Sprint — Pre-Generate Implementation Briefs

> **Status:** Ready to Execute
> **Duration:** ~30 minutes (fully parallelized with sub-agents)
> **Output:** Implementation-ready briefs for Sprints 67, 68, 69
> **ROI:** Saves ~600k tokens and ~60 minutes across the next 3 sprints

---

## Objective

Run parallel Explore + Plan sub-agents to generate implementation briefs for all upcoming sprints. Each brief eliminates the need for plan mode at sprint start, allowing immediate coding.

---

## Why a Dedicated Scoping Sprint?

| Metric | Without Scoping Sprint | With Scoping Sprint |
|--------|----------------------|---------------------|
| Sprint start overhead | 15-20 min plan mode + 150-200k tokens | <1 min reading brief |
| Exploration per sprint | 3 Explore agents (~195k tokens) | 0 Explore agents (0 tokens) |
| Total for 3 sprints | ~600k tokens wasted on planning | ~100k tokens (one-time scoping) |
| **Net savings** | — | **~500k tokens saved** |

---

## Execution Plan

### Phase 1: Read Specs + Registry (Main Session, 2 min)

```bash
# Read specs for the 3 sprints we're scoping:
cat docs/specs/EPIC-08-BI-DASHBOARDS.md   # Sprint 67 (BI Dashboards)
# Sprint 68 (Expense OCR) - check if spec exists, create if not
# Sprint 69 (TBD) - identify from backlog
cat docs/MODULE_REGISTRY.md
```

### Phase 2: Parallel Exploration (3 Sub-Agents, ~5 min)

Launch ALL THREE simultaneously in a single message:

#### Agent 1: BI Dashboard Scoping (Explore)
```
Scope Sprint 67 (Financial Intelligence / BI Dashboards).

Read and analyze these files:
1. docs/specs/EPIC-08-BI-DASHBOARDS.md (the spec)
2. app/dashboard/intelligence/page.tsx (existing intelligence page)
3. components/intelligence/ (existing BI components)
4. components/charts/ (existing chart components)
5. components/dashboard/ (dashboard widgets - KPI cards)
6. lib/hooks/useInvoices.ts (revenue data)
7. lib/hooks/useEstimates.ts (pipeline data)
8. lib/hooks/useProjects.ts (active projects)
9. app/dashboard/page.tsx (main dashboard - patterns for stats)
10. functions/src/job-costing/ (Job Costing from Sprint 65 - BI depends on this)
11. components/finances/MarginMeter.tsx (margin visualization pattern from Sprint 65)

For each, note:
- What chart/dashboard components already exist
- What data hooks exist vs need creation
- Where the new /intelligence route fits
- How Sprint 65 Job Costing data feeds into BI dashboards
- Recharts vs other chart library patterns

Write findings to: docs/specs/sprint-67-brief.md using template at docs/specs/SPRINT_BRIEF_TEMPLATE.md
```

#### Agent 2: Expense OCR Scoping (Explore)
```
Scope Sprint 68 (Expense Automation / OCR).

Read and analyze these files:
1. functions/src/expenses/processReceiptOCR.ts (EXISTING OCR function!)
2. lib/hooks/useExpenses.ts (expense hook)
3. components/expenses/ (expense components)
4. app/dashboard/expenses/page.tsx (expenses page)
5. components/photos/PhotoUploader.tsx (camera/upload patterns)
6. types/index.ts lines 1391-1560 (Expense types)
7. functions/src/index.ts (Cloud Function registration)
8. functions/src/job-costing/category-mapping.ts (expense category mapping from Sprint 65)

Note especially:
- processReceiptOCR.ts already exists — what does it do? Is it complete?
- What camera/upload patterns exist already?
- How do expenses currently handle receipts?
- What's the Mindee integration status?
- How does Sprint 65's category mapping affect OCR auto-categorization?

Write findings to: docs/specs/sprint-68-brief.md using template at docs/specs/SPRINT_BRIEF_TEMPLATE.md
```

#### Agent 3: Next Backlog Priority Scoping (Explore)
```
Scope Sprint 69 (next backlog priority).

First, determine what Sprint 69 should be by reading:
1. docs/NEXT_PHASE_PLAN.md (check backlog/future features)
2. docs/SPRINT_STATUS.md (check remaining backlog items)
3. docs/REPRIORITIZED_SPRINT_PLAN.md (check outstanding items)

Then scope whatever the next priority is by:
1. Finding the relevant spec (if one exists)
2. Cross-referencing with MODULE_REGISTRY.md
3. Reading relevant existing files in the codebase

Write findings to: docs/specs/sprint-69-brief.md using template at docs/specs/SPRINT_BRIEF_TEMPLATE.md
```

### Phase 3: Review + Finalize (Main Session, 5 min)

1. Read each generated brief
2. Fill in any gaps or cross-references between sprints
3. Add parallel work plans
4. Commit all briefs

### Phase 4: Update Registry (Main Session, 2 min)

If any exploration discovered modules NOT in MODULE_REGISTRY.md:
- Update the registry immediately
- This prevents future sprints from re-exploring

---

## Deliverables

| File | Content | Used By |
|------|---------|---------|
| `docs/specs/sprint-67-brief.md` | BI Dashboard implementation brief | Sprint 67 |
| `docs/specs/sprint-68-brief.md` | Expense OCR implementation brief | Sprint 68 |
| `docs/specs/sprint-69-brief.md` | Next backlog priority brief | Sprint 69 |
| `docs/MODULE_REGISTRY.md` | Updated with any new discoveries | All future sprints |

---

## Success Criteria

- [ ] All 3 briefs generated and committed
- [ ] Each brief has: existing files, missing pieces, files to create/modify, patterns to follow
- [ ] Each brief has a parallel work plan with sub-agent assignments
- [ ] MODULE_REGISTRY.md updated if needed
- [ ] Sprint 67 can start WITHOUT entering plan mode

---

## Sprint Start Decision Tree (Post-Scoping)

After this sprint, all future sprint starts follow this logic:

```
1. Is there a sprint-{N}-brief.md?
   ├─ YES → Read brief (5k tokens) → Start coding immediately
   │         Skip plan mode entirely
   │
   └─ NO  → Enter plan mode → Explore → Generate brief
             (But also generate briefs for N+1, N+2 while you're at it!)
```

---

## Future: Auto-Scoping at Sprint Close

After each sprint, add this step to the close process:

```
END-OF-SPRINT CHECKLIST:
1. ✅ Mark sprint complete in SPRINT_STATUS.md
2. ✅ Archive if needed (rolling window)
3. 🆕 Generate brief for sprint N+3:
   Task(Explore, background): "Read spec for Sprint {N+3}.
   Cross-reference with MODULE_REGISTRY.md.
   Write implementation brief to docs/specs/sprint-{N+3}-brief.md
   using template at docs/specs/SPRINT_BRIEF_TEMPLATE.md"
```

This keeps a rolling 2-sprint buffer of pre-generated briefs.
