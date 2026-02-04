# Sprint 38 - Platform Audit Fixes

**Start Date:** 2026-02-02
**Total Issues:** 87 remaining (from 101 total audit items)
**Estimated Effort:** 355-515 hours

---

## CLI Workstream Summary

| CLI | Focus | Issues | Hours | Priority |
|-----|-------|--------|-------|----------|
| **CLI 4** | Bugs & Backend | 27 | 90-140h | 🔴 START FIRST |
| **CLI 1** | Demo Data Seeding | 20 | 80-110h | 🟡 After CLI 4 |
| **CLI 2** | UI/UX & Layout | 17 | 45-65h | 🟢 Parallel OK |
| **CLI 3** | Feature Development | 23 | 140-200h | 🟡 After CLI 1 |

---

## Execution Order

```
Week 1:
├── CLI 4: Fix Firebase permissions (CRITICAL - unblocks everything)
├── CLI 4: Fix calculation bugs (#53, #57)
├── CLI 2: Animation removal (can run parallel)
└── CLI 2: Layout fixes (can run parallel)

Week 2:
├── CLI 4: Notification system
├── CLI 1: Start seed scripts (after permissions fixed)
├── CLI 2: Continue UI fixes
└── CLI 3: Start navigation architecture

Week 3-4:
├── CLI 1: Complete all seed scripts
├── CLI 3: Subcontractors module
├── CLI 3: Schedule enhancements
└── CLI 4: Integration research

Week 5+:
├── CLI 3: Finance enhancements
├── CLI 3: Settings consolidation
└── CLI 4: Future integrations (research docs)
```

---

## Quick Start Commands

### Terminal 1 - CLI 4 (Backend/Permissions)
```bash
cd /Users/nickbodkins/contractoros
./scripts/sprint-38-cli-4.sh
cat .claude-coordination/sprint-38-cli-4.md
```

### Terminal 2 - CLI 1 (Demo Data)
```bash
cd /Users/nickbodkins/contractoros
./scripts/sprint-38-cli-1.sh --dry-run  # Preview
./scripts/sprint-38-cli-1.sh            # Execute all
```

### Terminal 3 - CLI 2 (UI/UX)
```bash
cd /Users/nickbodkins/contractoros
./scripts/sprint-38-cli-2.sh
cat .claude-coordination/sprint-38-cli-2.md
```

### Terminal 4 - CLI 3 (Features)
```bash
cd /Users/nickbodkins/contractoros
./scripts/sprint-38-cli-3.sh
cat .claude-coordination/sprint-38-cli-3.md
```

---

## File Structure

```
.claude-coordination/
├── sprint-38-overview.md      # This file
├── sprint-38-cli-1.md         # Demo Data Seeding tasks
├── sprint-38-cli-2.md         # UI/UX & Layout tasks
├── sprint-38-cli-3.md         # Feature Development tasks
└── sprint-38-cli-4.md         # Bugs & Backend tasks

scripts/
├── sprint-38-cli-1.sh         # CLI 1 execution script
├── sprint-38-cli-2.sh         # CLI 2 execution script
├── sprint-38-cli-3.sh         # CLI 3 execution script
├── sprint-38-cli-4.sh         # CLI 4 execution script
└── seed-demo/
    ├── run-all-seeds.ts       # Master seed runner
    └── [individual seed scripts]
```

---

## Status Tracking

Update these as CLIs complete tasks:

### CLI 4 Status (Backend)
```
Critical Bugs:
[x] Firebase Permissions (#13) - ✅ COMPLETE 2026-02-02
[ ] Finances Error (#26) - Verify with seeded data
[ ] Comparison Testing (#27) - Verify with demo bids
[x] Profit Margin Bug (#53) - ✅ COMPLETE 2026-02-02
[x] Payroll NaN Bug (#57) - ✅ COMPLETE 2026-02-02

Data Seeded:
[x] Job Costing - 87 items, 5 finance summaries
[x] Punch Lists - 13 items
[x] Quotes - 4 quotes, 26 line items

Notifications: [ ] [ ] [ ] [ ]
Research: [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ]
```

### CLI 1 Status (Data)
```
Foundation: [ ] [ ] [ ]
Project Data: [ ] [ ] [ ]
Documentation: [ ] [ ] [ ] [ ]
Team/Schedule: [ ] [ ] [ ] [ ]
Financial: [ ] [ ] [ ]
```

### CLI 2 Status (UI)
```
Layout: [ ] [ ] [ ] [ ] [ ] [ ] [ ]
Animations: [ ] [ ] [ ] [ ]
Patterns: [ ] [ ] [ ]
Date Pickers: [ ] [ ] [ ]
```

### CLI 3 Status (Features)
```
Navigation: [ ] [ ] [ ]
Subcontractors: [ ]
Schedule: [ ] [ ] [ ] [ ] [ ] [ ]
Finance: [ ] [ ] [ ]
Settings: [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ]
```

---

## Communication Protocol

1. **Before starting:** Check this file and your CLI's coordination file
2. **File conflicts:** CLI owns specific directories per CLAUDE.md
3. **Cross-CLI dependencies:** Note in your status file
4. **Blocking issues:** Add `[!]` status with note

---

## Completed (Sprint 37B/C)

These issues are already done:
- #11 Category Filter Bug ✅
- #12 Demo Projects Not Categorized ✅
- #17 Demo Tasks ✅
- #18 Demo Sub Assignments ✅
- #19 Demo Bids ✅
- #20 Demo Bid Solicitations ✅
- #21 Demo RFIs ✅
- #30 Demo Clients ✅
- #62 Reports Top Nav to Sidebar ✅
- #69 Operational Reports Load Error ✅
- #76 Payroll Reports Load Error ✅
- #79 Fiscal Year Configuration ✅
- #80 Payroll Period Configuration ✅
- #83 Tax Configuration ✅

**Total Completed: 14/101 (14%)**
