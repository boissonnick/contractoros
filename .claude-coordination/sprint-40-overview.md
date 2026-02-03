# Sprint 40 - Feature Completion & Polish

**Start Date:** 2026-02-03
**Focus:** Complete demo data gaps, navigation restructure, schedule enhancements
**Estimated Effort:** 200-280 hours

---

## Sprint 39 Completed Items

### CLI 1 (Data Seeding) - COMPLETE ✅
- seed-scopes.ts: 7 scopes
- seed-submittals.ts: 54 submittals
- seed-change-orders.ts: 8 change orders
- seed-schedule-events.ts: 93 events
- seed-daily-logs.ts: 256 entries
- seed-time-off.ts: 18 requests
- seed-payroll.ts: 6 runs (24 entries)
- seed-client-preferences.ts: 8 records
- **Total: 450 demo records**

### CLI 2 (UI/UX) - COMPLETE ✅
- Search bar overlap: Fixed (moved to sidebar)
- Active Projects: Reduced to 4 cards, 280px max
- Project cards: Padding reduced, 4-col grid on 2xl
- Sub-nav spacing: Added pt-2, mb-3
- Dropdown arrows: Fixed positioning
- Client Preferences: 3-column grid
- Animation audit: Complete (appropriate usage confirmed)
- EmptyState: Already standardized

### CLI 4 (Notifications) - COMPLETE ✅
- Browser notification permissions
- Service worker registration
- Granular notification type control
- Do Not Disturb / Quiet Hours

### CLI 4 (Research) - COMPLETE ✅
- docs/ANIMATION_GUIDELINES.md
- docs/research/BANK_INTEGRATION.md
- docs/research/NEOBANK_INTEGRATION.md
- docs/research/PAYROLL_INTEGRATION.md
- docs/research/MESSAGING_ARCHITECTURE.md
- docs/research/CUSTOM_REPORTS.md
- docs/research/AI_INSIGHTS.md
- docs/research/AI_PROVIDER_MANAGEMENT.md

---

## Sprint 40 CLI Workstreams

| CLI | Focus | Tasks | Hours | Priority |
|-----|-------|-------|-------|----------|
| **CLI 1** | Demo Data Completeness | 8 | 40-55h | 🔴 HIGH |
| **CLI 2** | UI Polish & Enhancement | 6 | 25-35h | 🟡 MEDIUM |
| **CLI 3** | Navigation & Subcontractors | 6 | 50-70h | 🔴 HIGH |
| **CLI 4** | Schedule & Weather | 5 | 45-60h | 🟡 MEDIUM |

---

## Remaining Audit Issues by Category

### Data Quality (Priority)
| Issue | Description | CLI | Effort |
|-------|-------------|-----|--------|
| #12 | Demo projects not categorized | CLI 1 | 2-3h |
| #14 | Missing demo client assignment | CLI 1 | 2-3h |
| #17 | No demo tasks for Gantt | CLI 1 | 8-12h |
| #21 | No demo RFIs | CLI 1 | 3-4h |
| #22 | No demo change orders | CLI 1 | ✅ Done |
| #23 | No demo submittals | CLI 1 | ✅ Done |

### UI/UX (Polish)
| Issue | Description | CLI | Effort |
|-------|-------------|-----|--------|
| #2 | Help menu location | CLI 2 | 1-2h |
| #3 | Online status indicator missing | CLI 2 | 2-3h |
| #42 | Crew availability underdeveloped | CLI 2 | 8-12h |
| #77 | Date picker quick selections | CLI 2 | 3-4h |

### Navigation (Structure)
| Issue | Description | CLI | Effort |
|-------|-------------|-----|--------|
| #33 | Separate Team from Subcontractors | CLI 3 | 8-12h |
| #59 | Sidebar navigation reorganization | CLI 3 | 8-12h |
| #34 | Subcontractor directory | CLI 3 | 12-16h |

### Schedule (Features)
| Issue | Description | CLI | Effort |
|-------|-------------|-----|--------|
| #36 | Weather integration | CLI 4 | 12-16h |
| #37 | Day view for schedule | CLI 4 | 8-12h |
| #38 | Team assignment from calendar | CLI 4 | 8-12h |

---

## File Structure

```
.claude-coordination/
├── sprint-40-overview.md           # This file
├── sprint-40-cli-1-data.md         # Demo data completeness
├── sprint-40-cli-2-ui.md           # UI polish & enhancements
├── sprint-40-cli-3-navigation.md   # Navigation & subcontractors
└── sprint-40-cli-4-schedule.md     # Schedule & weather
```

---

## Quick Start Commands

### Terminal 1 - CLI 1 (Data)
```bash
cd /Users/nickbodkins/contractoros
cat .claude-coordination/sprint-40-cli-1-data.md
cd scripts/seed-demo && npx ts-node seed-tasks.ts
```

### Terminal 2 - CLI 2 (UI)
```bash
cd /Users/nickbodkins/contractoros
cat .claude-coordination/sprint-40-cli-2-ui.md
cd apps/web && npm run dev
```

### Terminal 3 - CLI 3 (Navigation)
```bash
cd /Users/nickbodkins/contractoros
cat .claude-coordination/sprint-40-cli-3-navigation.md
cd apps/web && npm run dev
```

### Terminal 4 - CLI 4 (Schedule)
```bash
cd /Users/nickbodkins/contractoros
cat .claude-coordination/sprint-40-cli-4-schedule.md
cd apps/web && npm run dev
```

---

## Status Tracking

### CLI 1 Status (Data)
```
Project Categories: [ ]
Client Assignment: [ ]
Demo Tasks: [ ]
Demo RFIs: [ ]
Demo Photos: [ ]
Historical Reports: [ ]
Finance Verification: [ ]
```

### CLI 2 Status (UI)
```
Help Menu: [ ]
Online Status: [ ]
Crew Availability: [ ]
Date Picker Presets: [ ]
Loading States Audit: [ ]
```

### CLI 3 Status (Navigation)
```
Team/Subs Separation: [ ]
Sidebar Reorganization: [ ]
Subcontractors Route: [ ]
Subcontractor Directory: [ ]
Subcontractor Detail: [ ]
```

### CLI 4 Status (Schedule)
```
Weather Service: [ ]
Weather Widget: [ ]
Day View: [ ]
Team Assignment: [ ]
Schedule Polish: [ ]
```

---

## Success Criteria

### Sprint 40 Complete When:
- [ ] All demo projects have categories and clients
- [ ] Gantt view shows 15+ tasks per project
- [ ] Help menu in sidebar
- [ ] Online status indicator working
- [ ] Subcontractors has dedicated section
- [ ] Weather widget on schedule (if API available)
- [ ] Day view toggle works
- [ ] TypeScript passes
- [ ] All changes committed

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

### Commit Pattern
```bash
git commit -m "feat(area): Description

Details here

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```
