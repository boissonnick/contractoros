# Sprint 75: Firestore Rules & Indexes (Manual Review Required)

**Status:** PENDING MANUAL REVIEW AND DEPLOYMENT
**Sprint:** 75 - Review Management Foundation
**Date:** 2026-02-05

## Overview

Sprint 75 introduces four new Firestore collections for the review management feature. These rules and indexes need to be manually reviewed before deployment.

---

## New Collections

| Collection | Path | Purpose |
|------------|------|---------|
| reviews | `organizations/{orgId}/reviews/{reviewId}` | Reviews from all platforms (Google, Yelp, Facebook, manual) |
| reviewRequests | `organizations/{orgId}/reviewRequests/{requestId}` | Review request tracking |
| reviewAutomationRules | `organizations/{orgId}/reviewAutomationRules/{ruleId}` | Automation rule configuration |
| googleBusinessConnections | `organizations/{orgId}/googleBusinessConnections/{connectionId}` | Google Business Profile OAuth connections |
| reviewResponseTemplates | `organizations/{orgId}/reviewResponseTemplates/{templateId}` | Response templates for replying to reviews |

---

## Firestore Rules (Add to firestore.rules)

```javascript
// =============================================================================
// REVIEW MANAGEMENT (Sprint 75)
// =============================================================================

// Reviews from all platforms
match /organizations/{orgId}/reviews/{reviewId} {
  allow read, write: if isSameOrg(orgId);
}

// Review requests sent to clients
match /organizations/{orgId}/reviewRequests/{requestId} {
  allow read, write: if isSameOrg(orgId);
}

// Automation rules for review requests
match /organizations/{orgId}/reviewAutomationRules/{ruleId} {
  allow read, write: if isSameOrg(orgId) && isAdmin();
}

// Google Business Profile OAuth connections (admin only)
match /organizations/{orgId}/googleBusinessConnections/{connectionId} {
  allow read, write: if isSameOrg(orgId) && isAdmin();
}

// Response templates for replying to reviews
match /organizations/{orgId}/reviewResponseTemplates/{templateId} {
  allow read, write: if isSameOrg(orgId);
}
```

---

## Firestore Indexes (Add to firestore.indexes.json)

```json
{
  "indexes": [
    {
      "collectionGroup": "reviews",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "reviewDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reviews",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "platform", "order": "ASCENDING" },
        { "fieldPath": "reviewDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reviews",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "projectId", "order": "ASCENDING" },
        { "fieldPath": "reviewDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reviews",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "clientId", "order": "ASCENDING" },
        { "fieldPath": "reviewDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reviewRequests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reviewRequests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "projectId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reviewRequests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "clientId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reviewAutomationRules",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reviewResponseTemplates",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "usageCount", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## Environment Variables Required

For Google Business Profile OAuth integration, add these secrets to GCP Secret Manager:

| Secret Name | Description |
|-------------|-------------|
| `GOOGLE_BUSINESS_CLIENT_ID` | Google OAuth 2.0 Client ID |
| `GOOGLE_BUSINESS_CLIENT_SECRET` | Google OAuth 2.0 Client Secret |
| `GOOGLE_BUSINESS_REDIRECT_URI` | (Optional) Defaults to `{NEXT_PUBLIC_APP_URL}/api/integrations/google-business/callback` |

---

## Deployment Commands

After manual review and approval:

```bash
# Deploy Firestore rules and indexes
firebase deploy --only firestore --project contractoros-483812

# Verify rules are active
firebase firestore:rules --project contractoros-483812
```

---

## Deferred to Sprint 76

The following items were deferred and will require additional work:

1. **Cloud Functions:**
   - `syncGoogleReviews` - Scheduled sync from Google Business Profile
   - `sendReviewRequest` - Send SMS/Email when request is created
   - `onProjectComplete` - Trigger automation rules when project status changes

2. **GCP Secrets:** The Google Business OAuth secrets need to be configured in GCP Secret Manager before the OAuth flow will work.

---

## Review Checklist

- [ ] Rules reviewed for security (org-scoped access)
- [ ] Admin-only rules verified (googleBusinessConnections, reviewAutomationRules)
- [ ] Indexes match query patterns in hooks
- [ ] No existing rules conflict with new rules
- [ ] Deployment tested in staging first
