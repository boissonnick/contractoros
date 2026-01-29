# Feature Implementation Template

> **Purpose:** Use this checklist when building any new feature to ensure nothing is missed.
> **Copy this template for each new feature.**

---

## Feature: [FEATURE NAME]

**Feature ID:** FEAT-XX
**Priority:** P0/P1/P2/P3
**Size:** S/M/L
**Started:** YYYY-MM-DD
**Completed:** YYYY-MM-DD

---

## Pre-Development

### Requirements Gathered
- [ ] Feature spec read from MASTER_ROADMAP.md
- [ ] User stories defined
- [ ] Acceptance criteria clear
- [ ] Similar existing patterns identified

### Infrastructure Planned
- [ ] New Firestore collections identified: ________________
- [ ] New Cloud Functions needed: ________________
- [ ] New environment variables needed: ________________
- [ ] Storage requirements: ________________

### CLI Authentication Verified
- [ ] `firebase login` - authenticated
- [ ] `gcloud auth login` - authenticated
- [ ] Firebase project set: `firebase use contractoros-483812`
- [ ] gcloud project set: `gcloud config set project contractoros-483812`

---

## Development Checklist

### 1. Types (apps/web/types/index.ts)
- [ ] Status types defined (e.g., `type MyStatus = 'active' | 'inactive'`)
- [ ] Main interface defined
- [ ] Supporting interfaces defined
- [ ] Types exported

```typescript
// Example types added:
// - MyFeatureStatus
// - MyFeature
// - MyFeatureOptions
```

### 2. Firestore Rules (firestore.rules)
- [ ] Collection rules added
- [ ] Read permissions defined
- [ ] Write permissions defined
- [ ] Delete permissions defined (if needed)
- [ ] Rules deployed: `firebase deploy --only firestore:rules`

```javascript
// Rules added for collections:
// - myCollection
```

### 3. Firestore Indexes (firestore.indexes.json)
- [ ] Composite indexes identified
- [ ] Indexes added to JSON file
- [ ] Indexes deployed: `firebase deploy --only firestore:indexes`

### 4. Hook (apps/web/lib/hooks/useMyFeature.ts)
- [ ] Collection constant defined
- [ ] Label constants exported
- [ ] List hook created (useMyFeatures)
- [ ] Single item hook created (useMyFeature)
- [ ] CRUD operations implemented
- [ ] Helper functions created (createMyFeature, etc.)

### 5. Pages
- [ ] List page: `apps/web/app/dashboard/myfeature/page.tsx`
  - [ ] Search implemented
  - [ ] Filters implemented
  - [ ] Stats cards (if applicable)
  - [ ] Loading states (Skeleton)
  - [ ] Empty states
  - [ ] Error handling
- [ ] Detail page: `apps/web/app/dashboard/myfeature/[id]/page.tsx`
  - [ ] Header with actions
  - [ ] Tabs (if applicable)
  - [ ] CRUD operations wired
  - [ ] Loading states
  - [ ] Error handling

### 6. Components (apps/web/components/myfeature/)
- [ ] AddMyFeatureModal.tsx
- [ ] EditMyFeatureModal.tsx
- [ ] MyFeatureCard.tsx (if needed)
- [ ] Supporting components
- [ ] index.ts with exports

### 7. Cloud Functions (if needed)
- [ ] Function added to `functions/src/index.ts`
- [ ] Dependencies added to `functions/package.json`
- [ ] Functions built: `npm run build:functions`
- [ ] Functions deployed: `npm run deploy:functions`

### 8. Navigation
- [ ] Added to AppShell sidebar (if top-level feature)
- [ ] Breadcrumbs work correctly

---

## Testing Checklist

### Manual Testing
- [ ] Create operation works
- [ ] Read/list operation works
- [ ] Update operation works
- [ ] Delete operation works (if applicable)
- [ ] Search/filter works
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Empty states display correctly
- [ ] Mobile responsive

### TypeScript
- [ ] `npx tsc --noEmit` passes

### Firestore Rules
- [ ] Authenticated user can read own org data
- [ ] Authenticated user can write own org data
- [ ] Cannot read other org's data
- [ ] Cannot write to other org's data

---

## Post-Development

### Documentation Updated
- [ ] SPRINT_STATUS.md updated with completion
- [ ] ARCHITECTURE.md updated (if new patterns)
- [ ] COMPONENT_PATTERNS.md updated (if new UI patterns)
- [ ] Types documented in architecture doc

### Deployment
- [ ] Firestore rules deployed
- [ ] Firestore indexes deployed
- [ ] Cloud functions deployed (if any)
- [ ] TypeScript passes in production build

---

## Files Created/Modified

### New Files
```
apps/web/types/index.ts (modified)
apps/web/lib/hooks/useMyFeature.ts (new)
apps/web/app/dashboard/myfeature/page.tsx (new)
apps/web/app/dashboard/myfeature/[id]/page.tsx (new)
apps/web/components/myfeature/AddMyFeatureModal.tsx (new)
apps/web/components/myfeature/EditMyFeatureModal.tsx (new)
apps/web/components/myfeature/index.ts (new)
```

### Infrastructure Files
```
firestore.rules (modified)
firestore.indexes.json (modified, if needed)
functions/src/index.ts (modified, if needed)
```

---

## Notes

<!-- Add any decisions, issues encountered, or things to remember -->

---

## Rollback Plan

If issues occur:
1. Revert Firestore rules: `git checkout firestore.rules && firebase deploy --only firestore:rules`
2. Revert functions: `git checkout functions/ && npm run deploy:functions`
3. Revert code changes: `git revert HEAD`
