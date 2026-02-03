# Sprint 39 - Platform Hardening & Feature Development

**Start Date:** 2026-02-03
**Focus:** Complete demo data seeding, UI polish, feature development
**Estimated Effort:** 280-400 hours

---

## Sprint 38 Completed Items

- [x] Firebase Permission Errors (#13) - Rules added for 6 collections
- [x] Profit Margin Bug (#53) - Fixed negative profit display
- [x] Payroll NaNh Bug (#57) - Fixed with safe number validation
- [x] Job Costing Data Seeded - 87 cost items, 5 finance summaries
- [x] Punch List & Quotes Seeded - 13 punch items, 4 quotes, 26 line items
- [x] Named Database Documentation - CLAUDE.md updated with critical db info

---

## CLI Workstream Summary

| CLI | Focus | Tasks | Hours | Priority |
|-----|-------|-------|-------|----------|
| **CLI 1** | Demo Data Completion | 12 | 60-85h | 🔴 HIGH |
| **CLI 2** | UI/UX Polish | 17 | 45-65h | 🟡 MEDIUM |
| **CLI 3** | Feature Development | 15 | 100-140h | 🟡 MEDIUM |
| **CLI 4** | Notifications + Research | 14 | 75-110h | 🟢 PARALLEL |

---

## Execution Order

```
Week 1:
├── CLI 1: Complete remaining seed scripts (quotes, scopes, schedule)
├── CLI 2: Animation removal + layout fixes
├── CLI 3: Navigation architecture planning
└── CLI 4: Browser notification permissions

Week 2:
├── CLI 1: Payroll and finance data seeding
├── CLI 2: Date picker enhancements
├── CLI 3: Subcontractors module start
└── CLI 4: Notification system completion

Week 3-4:
├── CLI 1: Reports historical data
├── CLI 2: Empty state standardization
├── CLI 3: Schedule enhancements
└── CLI 4: Integration research documents
```

---

## Quick Start Commands

### Terminal 1 - CLI 1 (Demo Data)
```bash
cd /Users/nickbodkins/contractoros
cat .claude-coordination/sprint-39-cli-1.md
cd scripts/seed-demo && npx ts-node seed-quotes.ts
```

### Terminal 2 - CLI 2 (UI/UX)
```bash
cd /Users/nickbodkins/contractoros
cat .claude-coordination/sprint-39-cli-2.md
cd apps/web && npm run dev
```

### Terminal 3 - CLI 3 (Features)
```bash
cd /Users/nickbodkins/contractoros
cat .claude-coordination/sprint-39-cli-3.md
cd apps/web && npm run dev
```

### Terminal 4 - CLI 4 (Backend)
```bash
cd /Users/nickbodkins/contractoros
cat .claude-coordination/sprint-39-cli-4.md
```

---

## File Structure

```
.claude-coordination/
├── sprint-39-overview.md      # This file
├── sprint-39-cli-1.md         # Demo Data Seeding tasks
├── sprint-39-cli-2.md         # UI/UX & Layout tasks
├── sprint-39-cli-3.md         # Feature Development tasks
└── sprint-39-cli-4.md         # Notifications & Research tasks
```

---

## Status Tracking

### CLI 1 Status (Data)
```
Quotes & Scopes: [x] Scopes (7) [x] Submittals (54)
Schedule & Team: [x] Schedule Events (93) [x] Change Orders (8) [x] Daily Logs (256) [x] Time Off (18)
Finance & Payroll: [x] Payroll (6 runs) [x] Client Preferences (8)
Reports Data: [ ] [ ]
```

### CLI 2 Status (UI)
```
Layout Fixes: [ ] [ ] [ ] [ ] [ ] [ ] [ ]
Animation Removal: [ ] [ ] [ ] [ ]
Patterns & Pickers: [ ] [ ] [ ] [ ] [ ] [ ]
```

### CLI 3 Status (Features)
```
Navigation: [ ] [ ] [ ]
Subcontractors: [ ]
Schedule: [ ] [ ] [ ] [ ] [ ] [ ]
Finance: [ ] [ ] [ ]
Settings: [ ] [ ]
```

### CLI 4 Status (Backend)
```
Notifications: [x] Browser Permissions [x] Service Worker [x] Granular Control [x] Quiet Hours
Research Docs: [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] (Running in separate session)
```

---

## Communication Protocol

1. **Before starting:** Check this file and your CLI's coordination file
2. **File conflicts:** CLI owns specific directories per CLAUDE.md
3. **Cross-CLI dependencies:** Note in your status file
4. **Blocking issues:** Add `[!]` status with note
5. **Completed tasks:** Mark with `[x]` and commit changes

---

## Critical Reminders

### Named Database
```typescript
// ALWAYS use named database "contractoros"
import { getDb } from './db';  // scripts
export const db = getFirestore(app, "contractoros");  // app
```

### Type Checking
```bash
# Run BEFORE committing
cd apps/web && npx tsc --noEmit
```

### Docker Rebuild
```bash
# After significant changes
cd apps/web && ./docker-build-local.sh
docker stop contractoros-web; docker rm contractoros-web
docker run -d -p 3000:8080 --name contractoros-web contractoros-web
```
