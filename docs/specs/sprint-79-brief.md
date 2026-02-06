# Sprint 79: Full-Stack UI Debugging (Desktop + Mobile)

**Priority:** P1 - HIGH (Bug Fixes / Polish)
**Estimated Effort:** 10-18 hours
**Dependencies:** None (all issues are independent)
**Brief Generated:** 2026-02-05

---

## Overview

Fix critical Firebase permissions, missing Firestore indexes, FRED API config, and polish mobile/desktop UI issues found during browser testing. This sprint addresses 7 issues across 3 severity levels.

---

## Issue Summary

| # | Issue | Severity | Category | Est. Hours |
|---|-------|----------|----------|------------|
| 1 | Firebase Permissions - AP Invoicing & Lien Waivers | CRITICAL | Backend | 1-2h |
| 2 | Firestore Composite Indexes (suppliers, equipment) | CRITICAL | Backend | 1h |
| 3 | FRED API Configuration | HIGH | Config | 0.5h |
| 4 | FAB Mobile Overlap | MEDIUM | Mobile UI | 2-3h |
| 5 | Text Truncation on Mobile Lists | MEDIUM | Mobile UI | 2-3h |
| 6 | Icon Circle Background Consistency | MEDIUM | Styling | 2-3h |
| 7 | Border Radius Standardization | MEDIUM | Styling | 2-3h |

---

## Existing Files (What Exists)

### Backend/Config
| File | Path | Purpose |
|------|------|---------|
| Firestore Rules | `firestore.rules` (project root) | Security rules — **MISSING rules for subcontractorInvoices & lienWaivers** |
| Firestore Indexes | `firestore.indexes.json` (project root) | Composite indexes — **MISSING suppliers & equipment isActive+name indexes** |
| Material Prices | `apps/web/lib/intelligence/material-prices.ts` | FRED API integration (line 25: reads `NEXT_PUBLIC_FRED_API_KEY` / `FRED_API_KEY`) |
| Sprint 75 Firestore | `docs/specs/sprint-75-firestore-changes.md` | Review rules pending deploy (separate from this sprint) |

### FAB Components
| File | Path | Notes |
|------|------|-------|
| QuickActionsFAB | `apps/web/components/field/QuickActionsFAB.tsx` | Field portal FAB — needs mobile positioning fix |
| VoiceActivationFAB | `apps/web/components/voice/VoiceActivationFAB.tsx` | Voice command FAB — needs mobile positioning fix |
| MobileFieldLayout | `apps/web/components/field/MobileFieldLayout.tsx` | Layout that hosts FABs |

### Stats/Metric Components
| File | Path | Notes |
|------|------|-------|
| StatsGrid | `apps/web/components/ui/StatsGrid.tsx` | Main stat cards — icon circle styling lives here |
| Card | `apps/web/components/ui/Card.tsx` | Base card — border-radius standardization target |
| MobileStats | `apps/web/components/ui/MobileStats.tsx` | Mobile variant of stats |

### Dashboard Pages (icon consistency audit targets)
| Page | Path |
|------|------|
| Dashboard | `apps/web/app/dashboard/page.tsx` |
| Finance | `apps/web/app/dashboard/finances/page.tsx` |
| Invoices | `apps/web/app/dashboard/invoices/page.tsx` |
| Estimates | `apps/web/app/dashboard/estimates/page.tsx` |
| E-Signatures | `apps/web/app/dashboard/signatures/page.tsx` |
| Expenses | `apps/web/app/dashboard/expenses/page.tsx` |
| Payroll | `apps/web/app/dashboard/payroll/page.tsx` |
| Intelligence | `apps/web/app/dashboard/intelligence/page.tsx` |
| Subcontractors | `apps/web/app/dashboard/subcontractors/page.tsx` |
| AP Invoicing | `apps/web/app/dashboard/ap-invoicing/page.tsx` |
| Materials | `apps/web/app/dashboard/materials/page.tsx` |
| Equipment | `apps/web/app/dashboard/equipment/page.tsx` |

### Card Components (border-radius audit targets)
| Component | Path |
|-----------|------|
| Card (base) | `apps/web/components/ui/Card.tsx` |
| ProjectCard | `apps/web/components/projects/ProjectCard.tsx` |
| ClientCard | `apps/web/components/clients/ClientCard.tsx` |
| TaskCard | `apps/web/components/tasks/TaskCard.tsx` |
| EventCard | `apps/web/components/schedule/EventCard.tsx` |
| EquipmentCard | `apps/web/components/materials/EquipmentCard.tsx` |
| MaterialItemCard | `apps/web/components/materials/MaterialItemCard.tsx` |

### Styling
| File | Path | Notes |
|------|------|-------|
| Global CSS | `apps/web/app/globals.css` | CSS variables, Tailwind base |
| Dashboard Layout | `apps/web/app/dashboard/layout.tsx` | Main layout wrapper |

---

## What's Missing (To Create/Modify)

### Issue 1: Firebase Permissions — AP Invoicing & Lien Waivers [CRITICAL]

**Root Cause:** `subcontractorInvoices` and `lienWaivers` collections have NO rules in `firestore.rules`. Sprint 69 created the hook and UI but rules were never deployed.

**File to modify:** `firestore.rules`

**Rules to add:**
```javascript
// =============================================================================
// AP INVOICING (Sprint 69 — rules missing from deploy)
// =============================================================================

// Subcontractor invoices (AP workflow)
match /organizations/{orgId}/subcontractorInvoices/{invoiceId} {
  allow read, write: if isSameOrg(orgId);
}

// Lien waivers linked to subcontractor invoices
match /organizations/{orgId}/lienWaivers/{waiverId} {
  allow read, write: if isSameOrg(orgId);
}
```

**Deploy command:**
```bash
firebase deploy --only firestore:rules --project contractoros-483812
```

---

### Issue 2: Firestore Composite Indexes [CRITICAL]

**Root Cause:** Materials & Equipment page queries use `where('isActive', '==', true).orderBy('name')` but no composite index exists.

**File to modify:** `firestore.indexes.json`

**Indexes to add:**
```json
{
  "collectionGroup": "suppliers",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "isActive", "order": "ASCENDING" },
    { "fieldPath": "name", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "equipment",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "isActive", "order": "ASCENDING" },
    { "fieldPath": "name", "order": "ASCENDING" }
  ]
}
```

**Deploy command:**
```bash
firebase deploy --only firestore:indexes --project contractoros-483812
```

**Note:** Index creation takes 5-15 minutes. Deploy early.

---

### Issue 3: FRED API Configuration [HIGH]

**Root Cause:** `FRED_API_KEY` not in `.env.local` or deployment secrets. `material-prices.ts:25` reads it and warns if missing.

**Action:**
1. Get FRED API key from https://fred.stlouisfed.org/docs/api/api_key.html
2. Add to `.env.local`: `NEXT_PUBLIC_FRED_API_KEY=your_key_here`
3. Add to GCP Secret Manager: `FRED_API_KEY`

**No code changes needed** — the code already handles the key correctly.

---

### Issue 4: FAB Mobile Overlap [MEDIUM]

**Files to modify:**
- `apps/web/components/field/QuickActionsFAB.tsx`
- `apps/web/components/voice/VoiceActivationFAB.tsx`

**Fix approach:**
- Add responsive positioning: on mobile (`max-width: 640px`), move FABs above bottom nav
- Set `bottom: 5rem` (80px) on mobile to clear MobileBottomNav
- Ensure `z-index: 40` (below modals at 50, above content)
- Add `@media (max-width: 640px)` or Tailwind `sm:` breakpoint classes

**Pattern:**
```tsx
// Before: fixed bottom-6 right-6
// After: fixed bottom-6 right-6 sm:bottom-6 bottom-20 (mobile above nav)
className="fixed right-6 bottom-20 sm:bottom-6 z-40"
```

---

### Issue 5: Text Truncation on Mobile Lists [MEDIUM]

**Files to audit/modify:**
- `apps/web/app/dashboard/page.tsx` (dashboard cards)
- `apps/web/app/dashboard/projects/page.tsx` (project list)
- `apps/web/app/dashboard/logs/page.tsx` (daily logs)
- Any card components rendering titles in list views

**Fix approach:**
- Replace `truncate` with `line-clamp-2` on mobile for titles
- Use responsive classes: `truncate sm:truncate line-clamp-2 sm:line-clamp-none`
- Ensure important info (project name, client name) isn't hidden
- Consider responsive font sizing: `text-sm sm:text-base`

---

### Issue 6: Icon Circle Background Consistency [MEDIUM]

**Primary file:** `apps/web/components/ui/StatsGrid.tsx`

**Audit targets:** All pages using inline stat cards with icon circles (Dashboard, Finance, Invoices, Estimates, E-Signatures, Expenses, Payroll, Intelligence, Subcontractors)

**Fix approach:**
1. Check StatsGrid's `iconBg` prop handling — ensure consistent default
2. Create/verify CSS variable in `globals.css`: `--icon-bg-opacity: 0.1`
3. Ensure all stat card icons use the same opacity pattern: `bg-{color}-100` or `rgba(color, 0.1)`
4. Audit each dashboard page's stat definitions for inconsistent `iconBg` values

**Pattern (StatsGrid):**
```tsx
// Ensure consistent default iconBg
const defaultIconBg = 'bg-brand-100/80';  // or equivalent
```

---

### Issue 7: Border Radius Standardization [MEDIUM]

**Primary file:** `apps/web/components/ui/Card.tsx`

**Files to audit:**
- All card components listed in "Card Components" table above
- `apps/web/app/globals.css` for CSS variable

**Fix approach:**
1. Add CSS variable to `globals.css`: `--card-border-radius: 12px` (or verify `rounded-2xl` = 16px is the standard from Sprint 72/74)
2. Ensure base `Card.tsx` uses consistent `rounded-2xl`
3. Audit all card components for hardcoded border-radius values that differ
4. Standardize icon padding/spacing within cards

**Note:** Sprint 72 established `rounded-2xl` as the design system standard. Verify all cards comply.

---

## Parallel Work Plan

### Batch 1: Critical Backend (No Code Conflicts)
Run these in parallel — they touch different files:

| Agent | Task | Files | Type |
|-------|------|-------|------|
| Agent 1 (general-purpose) | Add Firestore rules for subcontractorInvoices & lienWaivers | `firestore.rules` | Modify |
| Agent 2 (general-purpose) | Add composite indexes for suppliers & equipment | `firestore.indexes.json` | Modify |

**After Batch 1:** Deploy Firebase rules + indexes:
```bash
firebase deploy --only firestore --project contractoros-483812
```

### Batch 2: Mobile UI Fixes (Independent Components)
Run in parallel after Batch 1 deploy:

| Agent | Task | Files | Type |
|-------|------|-------|------|
| Agent 3 (general-purpose) | Fix FAB mobile positioning | `QuickActionsFAB.tsx`, `VoiceActivationFAB.tsx` | Modify |
| Agent 4 (general-purpose) | Fix text truncation on mobile lists | Dashboard/project/log pages, card components | Modify |

### Batch 3: Styling Polish (Independent)
Run in parallel:

| Agent | Task | Files | Type |
|-------|------|-------|------|
| Agent 5 (general-purpose) | Standardize icon circle backgrounds | `StatsGrid.tsx`, dashboard pages | Modify |
| Agent 6 (general-purpose) | Standardize card border-radius | `Card.tsx`, `globals.css`, card components | Modify |

### Manual Step (Issue 3):
FRED API key must be obtained manually and added to `.env.local` and GCP secrets. No code changes.

---

## Testing Checklist

### Desktop (1440px)
- [ ] AP Invoicing page loads without console permission errors
- [ ] Materials & Equipment page loads equipment/suppliers without index errors
- [ ] Dashboard Material Prices widget shows data (after FRED key added)
- [ ] All metric bubbles have consistent icon styling across all 9+ pages
- [ ] All cards use consistent border-radius (12px / rounded-2xl)
- [ ] Test at 75%, 100%, 125% zoom

### Mobile (375px)
- [ ] AP Invoicing page loads without errors
- [ ] FABs don't overlap content or bottom nav
- [ ] FABs are still clickable and accessible
- [ ] Text is readable — titles wrap to 2 lines instead of truncating
- [ ] All pages load without layout breaks
- [ ] All buttons/interactive elements min 48px touch target

### Console
- [ ] Zero permission-related errors
- [ ] Zero "requires an index" errors
- [ ] Zero "FRED_API_KEY not configured" warnings (after key added)

---

## Success Criteria

**Critical (Must Ship):**
- Zero permission errors in AP Invoicing & Lien Waivers
- Firestore queries work without index errors for suppliers & equipment
- Material prices display with FRED API (config-dependent)

**Mobile (Must Ship):**
- FABs don't overlap content on 375px
- Text is readable on 375px width
- All pages load without layout breaks

**Styling (Should Ship):**
- All metric bubbles have consistent icon styling
- All cards use standardized border-radius
- No visual inconsistencies across pages

---

## Deployment Order

1. **Firebase rules** (subcontractorInvoices + lienWaivers) — no downtime
2. **Firestore indexes** (suppliers + equipment) — 5-15 min build time
3. **FRED API key** — add to .env.local and GCP secrets
4. **Code changes** (FAB positioning, text overflow, styling) — single deploy
5. **Full QA testing** — desktop + mobile
6. **Monitor error logs** post-deployment

All changes are low-risk and individually revertible.
