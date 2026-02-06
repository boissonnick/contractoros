# Sprint 81: Review & Google Business Completion

**Priority:** P0 - HIGH (Finish started work)
**Estimated Effort:** 8-10 hours
**Dependencies:** None
**Brief Generated:** 2026-02-05

---

## Overview

Complete the remaining ~15% of review management. The code is fully written across types, hooks, UI components, Cloud Functions, and API routes. This sprint focuses on: adding Firestore composite indexes, deploying rules + functions, configuring GCP secrets, seeding demo data, and verifying the end-to-end flow.

---

## What Already Exists (DO NOT REBUILD)

### Types
| File | Path | Lines | Status |
|------|------|-------|--------|
| Review types | `apps/web/types/review.ts` | 237 | COMPLETE |

**Includes:** Review, ReviewRequest, ReviewAutomationRule, GoogleBusinessConnection, ReviewResponseTemplate, ReviewStats, ReviewRequestStats, plus all enums/labels.

### Hooks
| File | Path | Lines | Status |
|------|------|-------|--------|
| useReviews | `apps/web/lib/hooks/useReviews.ts` | 613 | COMPLETE |
| useGoogleBusiness | `apps/web/lib/hooks/useGoogleBusiness.ts` | 241 | COMPLETE |

**useReviews exports:** useReviews, useReview, useReviewRequests, useReviewAutomationRules, useReviewResponseTemplates
**useGoogleBusiness exports:** useGoogleBusiness, useGoogleBusinessLocations

### UI Components
| File | Path | Status |
|------|------|--------|
| ReviewCard | `apps/web/components/reviews/ReviewCard.tsx` | COMPLETE |
| ReviewStatsCard | `apps/web/components/reviews/ReviewStatsCard.tsx` | COMPLETE |
| ReviewRequestModal | `apps/web/components/reviews/ReviewRequestModal.tsx` | COMPLETE |
| ReviewResponseModal | `apps/web/components/reviews/ReviewResponseModal.tsx` | COMPLETE |
| AutomationRuleForm | `apps/web/components/reviews/AutomationRuleForm.tsx` | COMPLETE |
| Component index | `apps/web/components/reviews/index.ts` | COMPLETE |

### Pages
| File | Path | Status |
|------|------|--------|
| Reviews dashboard | `apps/web/app/dashboard/reviews/page.tsx` | COMPLETE |
| Google Business settings | `apps/web/app/dashboard/settings/integrations/google-business/page.tsx` | COMPLETE |

### API Routes
| File | Path | Status |
|------|------|--------|
| authorize | `apps/web/app/api/integrations/google-business/authorize/` | COMPLETE |
| callback | `apps/web/app/api/integrations/google-business/callback/` | COMPLETE |
| disconnect | `apps/web/app/api/integrations/google-business/disconnect/` | COMPLETE |
| locations | `apps/web/app/api/integrations/google-business/locations/` | COMPLETE |

### Cloud Functions
| File | Path | Status |
|------|------|--------|
| index.ts | `functions/src/reviews/index.ts` | COMPLETE |
| sendReviewRequest.ts | `functions/src/reviews/sendReviewRequest.ts` | COMPLETE |
| syncGoogleReviews.ts | `functions/src/reviews/syncGoogleReviews.ts` | COMPLETE |
| automationTrigger.ts | `functions/src/reviews/automationTrigger.ts` | COMPLETE |

**Exported in `functions/src/index.ts` (lines 49-57):**
- onReviewRequestCreated
- onProjectStatusChange
- onInvoiceStatusChange
- syncGoogleReviewsScheduled
- syncGoogleReviewsManual
- processScheduledReviewRequests

### Firestore Rules
| File | Path | Lines | Status |
|------|------|-------|--------|
| Review rules | `firestore.rules` | 2826-2861 | COMPLETE (in file, needs deploy verification) |

**5 collections covered:** reviews, reviewRequests, reviewAutomationRules, googleBusinessConnections, reviewResponseTemplates

### Tests
| File | Path | Status |
|------|------|--------|
| useReviews tests | `apps/web/__tests__/lib/hooks/useReviews.test.ts` | EXISTS |
| useGoogleBusiness tests | `apps/web/__tests__/lib/hooks/useGoogleBusiness.test.ts` | EXISTS |

---

## What Needs to Be Done

### Task 1: Add Firestore Composite Indexes (1-2h)
**File:** `firestore.indexes.json`
**Reference:** `docs/specs/sprint-75-firestore-changes.md` (lines 62-135)

Add these indexes from the spec:
```json
[
  { "collectionGroup": "reviews", "fields": [{"fieldPath": "reviewDate", "order": "DESCENDING"}] },
  { "collectionGroup": "reviews", "fields": [{"fieldPath": "platform", "order": "ASCENDING"}, {"fieldPath": "reviewDate", "order": "DESCENDING"}] },
  { "collectionGroup": "reviews", "fields": [{"fieldPath": "projectId", "order": "ASCENDING"}, {"fieldPath": "reviewDate", "order": "DESCENDING"}] },
  { "collectionGroup": "reviews", "fields": [{"fieldPath": "clientId", "order": "ASCENDING"}, {"fieldPath": "reviewDate", "order": "DESCENDING"}] },
  { "collectionGroup": "reviewRequests", "fields": [{"fieldPath": "status", "order": "ASCENDING"}, {"fieldPath": "createdAt", "order": "DESCENDING"}] },
  { "collectionGroup": "reviewRequests", "fields": [{"fieldPath": "projectId", "order": "ASCENDING"}, {"fieldPath": "createdAt", "order": "DESCENDING"}] },
  { "collectionGroup": "reviewRequests", "fields": [{"fieldPath": "clientId", "order": "ASCENDING"}, {"fieldPath": "createdAt", "order": "DESCENDING"}] },
  { "collectionGroup": "reviewAutomationRules", "fields": [{"fieldPath": "createdAt", "order": "DESCENDING"}] },
  { "collectionGroup": "reviewResponseTemplates", "fields": [{"fieldPath": "usageCount", "order": "DESCENDING"}] }
]
```

### Task 2: Deploy Firestore Rules + Indexes (0.5h)
```bash
firebase deploy --only firestore --project contractoros-483812
```

Verify:
- Rules are active for all 5 review collections
- Indexes build successfully (may take 1-2 minutes)

### Task 3: Deploy Cloud Functions (1-2h)
```bash
cd functions && npm run build && firebase deploy --only functions --project contractoros-483812
```

Verify all 6 review functions deployed:
- onReviewRequestCreated
- onProjectStatusChange
- onInvoiceStatusChange
- syncGoogleReviewsScheduled
- syncGoogleReviewsManual
- processScheduledReviewRequests

**Note:** Functions may need build fixes if there are TypeScript issues in the review module. Check `cd functions && npx tsc --noEmit` first.

### Task 4: Configure GCP Secrets (0.5h — MANUAL)
Add to GCP Secret Manager (project: contractoros-483812):
- `GOOGLE_BUSINESS_CLIENT_ID` — Google OAuth 2.0 Client ID
- `GOOGLE_BUSINESS_CLIENT_SECRET` — Google OAuth 2.0 Client Secret

**Note:** If Google Business Profile API access isn't set up yet, these can be placeholder values. The review request flow (SMS/email) works independently of Google Business OAuth.

### Task 5: Seed Demo Review Data (3-4h)
**Create:** `scripts/seed-demo/seed-reviews.ts`

Seed the following into the named `contractoros` database:

| Collection | Count | Details |
|------------|-------|---------|
| reviews | 15-20 | Mix of Google (10), Yelp (3), manual (5). Ratings 1-5, most 4-5 stars. Include review text, reviewer names. 3-4 with responses. |
| reviewRequests | 8-10 | Mix of statuses: 2 pending, 3 sent, 2 clicked, 2 completed, 1 failed. SMS and email channels. |
| reviewAutomationRules | 2-3 | One for project_completed (enabled, 3 day delay), one for invoice_paid (enabled, 1 day delay), one disabled. |
| reviewResponseTemplates | 4-5 | Positive (2), neutral (1), negative (2). Include {{clientName}}, {{projectName}} variables. |

**Pattern to follow:** `scripts/seed-demo/seed-to-named-db.ts` — use `getDb()` from `db.ts`

### Task 6: Verify End-to-End (1-2h)
1. Start app: `cd apps/web && npm run dev` (or Docker)
2. Navigate to `/dashboard/reviews` — should show seeded reviews with stats
3. Click "Request Review" — ReviewRequestModal should open
4. Navigate to `/dashboard/settings/integrations/google-business/` — settings page loads
5. Check review stats card shows accurate counts
6. Verify automation rules display correctly
7. Verify response templates display correctly

### Task 7: Update MODULE_REGISTRY.md (0.25h)
Add/verify Reviews entry in Quick Lookup table:
```
| Reviews | useReviews, useGoogleBusiness | reviews/page.tsx | ReviewCard, ReviewRequestModal, ReviewResponseModal, AutomationRuleForm | Review management |
```

---

## Parallel Work Plan

**These tasks can run in parallel:**

| Agent | Tasks | Files |
|-------|-------|-------|
| Agent 1 (DB/Deploy) | Tasks 1-3: Indexes, deploy rules, deploy functions | `firestore.indexes.json`, deploy commands |
| Agent 2 (Seed) | Task 5: Create seed-reviews.ts and run it | `scripts/seed-demo/seed-reviews.ts` |
| Main session | Tasks 4, 6, 7: GCP secrets (manual), E2E verification, docs update | GCP Console, browser testing, `docs/MODULE_REGISTRY.md` |

---

## Success Criteria

- [ ] Firestore indexes for 5 review collections added to `firestore.indexes.json` and deployed
- [ ] Firestore rules verified active (already in `firestore.rules` lines 2826-2861)
- [ ] 6 Cloud Functions deployed and visible in Firebase Console
- [ ] Reviews page loads with 15-20 demo reviews at localhost:3000
- [ ] Review request modal opens and creates a request document
- [ ] Automation rules display on reviews page
- [ ] Response templates display on reviews page
- [ ] TypeScript: 0 errors (`npx tsc --noEmit`)
- [ ] MODULE_REGISTRY.md updated

---

## Risks

| Risk | Mitigation |
|------|------------|
| Cloud Functions build errors | Run `cd functions && npx tsc --noEmit` first, fix any issues |
| Index build time | Deploy indexes first, they build in background while seeding data |
| Google Business OAuth not testable | That's OK — the review request flow works independently. Google sync is a stretch goal. |
