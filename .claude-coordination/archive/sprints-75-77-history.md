# Sprints 75-77 Archive

Archived from SPRINT_STATUS.md on 2026-02-05 to maintain rolling 3-sprint window.

---

## Sprint 77 - Unit Test Coverage - COMPLETE

**Priority:** P1 - HIGH (Quality/Testing)
**Completed:** 2026-02-05

**Goal:** Expand unit test coverage for review hooks and other critical hooks.

**Key results:**
- useReviews tests: 54 tests covering useReviews, useReview, useReviewRequests, useReviewAutomationRules, useReviewResponseTemplates
- useGoogleBusiness tests: 29 tests covering useGoogleBusiness, useGoogleBusinessLocations
- useSubcontractorInvoices tests: 27 tests covering CRUD, approval workflow, lien waivers

**Coverage improvement:** 5.08% → 5.99% (+18% relative). Total tests: 1154

---

## Sprint 76 - Review Management Cloud Functions - COMPLETE

**Priority:** P1 - HIGH (New Feature)
**Completed:** 2026-02-05

**Key results:**
- onReviewRequestCreated: SMS/Email on reviewRequest pending
- onProjectStatusChange: Automation rules on project complete/closed
- onInvoiceStatusChange: Automation rules on final invoice paid
- syncGoogleReviewsScheduled: 6-hour sync from Google Business Profile
- syncGoogleReviewsManual: HTTP endpoint for manual sync
- processScheduledReviewRequests: Hourly delayed request processor

**Pending manual actions:** GCP Secrets (GOOGLE_BUSINESS_CLIENT_ID, GOOGLE_BUSINESS_CLIENT_SECRET), deploy functions, deploy Firestore rules

---

## Sprint 75 - Review Management Foundation - COMPLETE

**Priority:** P1 - HIGH (New Feature)
**Completed:** 2026-02-05

**Key results:**
- Types: types/review.ts — Review, ReviewRequest, ReviewAutomationRule, GoogleBusinessConnection
- Hooks: useReviews, useReviewRequests, useReviewAutomationRules, useGoogleBusiness
- Google OAuth: lib/integrations/google-business/ (types, oauth, api)
- API Routes: /api/integrations/google-business/ (authorize, callback, disconnect, locations)
- Dashboard: /dashboard/reviews — tab-based layout
- Components: ReviewCard, ReviewStatsCard, ReviewRequestModal, ReviewResponseModal, AutomationRuleForm
- Settings: /dashboard/settings/integrations/google-business/
- 16 new files created

**Firestore rules/indexes:** Documented in docs/specs/sprint-75-firestore-changes.md — PENDING MANUAL DEPLOY
