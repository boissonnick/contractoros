# ContractorOS Testing Strategy

> **Purpose:** Prevent common development errors and establish quality gates.
> **Last Updated:** 2026-01-28
> **Status:** Implementation Required

---

## Executive Summary

Analysis of development patterns has identified **critical gaps** that must be addressed:

| Risk Level | Category | Impact |
|-----------|----------|--------|
| CRITICAL | No test coverage | Production bugs undetected |
| CRITICAL | Silent error handling | Users unaware of failures |
| HIGH | Type safety gaps | Runtime errors possible |
| HIGH | Firestore rules forgotten | Permission denied errors |

---

## Common Development Mistakes (Lessons Learned)

### 1. Firestore Rules Not Deployed

**Pattern:** New collections created without security rules, causing "permission-denied" errors.

**Examples from this project:**
- `clients` collection created, rules forgotten
- `communicationLogs` collection created, rules forgotten
- `signatureRequests` collection created, rules forgotten

**Prevention Checklist:**
```markdown
- [ ] Add rules to `firestore.rules` BEFORE creating hook
- [ ] Test rules locally with emulators
- [ ] Deploy rules: `firebase deploy --only firestore:rules --project contractoros-483812`
- [ ] Verify in Firebase Console > Firestore > Rules
```

### 2. Type Mismatches Between Frontend and Firestore

**Pattern:** TypeScript types don't match actual Firestore document structure.

**Examples:**
- `Client` type uses `addresses` array, but form used single `address` field
- `ClientCommunicationLog` type used 'call' but DB expected 'phone'
- Missing required fields like `isCommercial` on Client

**Prevention Checklist:**
```markdown
- [ ] Define type in `types/index.ts` FIRST
- [ ] Match field names EXACTLY to type definition
- [ ] Include ALL required fields in create functions
- [ ] Test create/update operations with TypeScript strict mode
```

### 3. Component Prop Type Errors

**Pattern:** Using props that don't exist on UI components.

**Examples:**
- `SkeletonCard height="200px"` - component doesn't have `height` prop
- Using `className` with height instead: `className="h-[200px]"`

**Prevention:**
```markdown
- [ ] Check component interface before using
- [ ] Use IDE autocomplete to verify available props
- [ ] Prefer Tailwind classes over custom props
```

### 4. Silent Error Handling

**Pattern:** Errors logged to console but user receives no feedback.

**Bad Pattern:**
```typescript
} catch (err) {
  console.error('Failed:', err);
  // User sees nothing!
}
```

**Good Pattern:**
```typescript
} catch (err) {
  console.error('Failed to save client:', err);
  toast.error('Failed to save client. Please try again.');
  // Optionally: Check error type for specific messages
  if (err instanceof FirebaseError && err.code === 'permission-denied') {
    toast.error('Permission denied. Contact your administrator.');
  }
}
```

### 5. Missing Index Errors

**Pattern:** Compound queries require Firestore indexes that aren't created.

**Example Error:**
```
FirebaseError: The query requires an index. You can create it here: [link]
```

**Prevention:**
```markdown
- [ ] Test ALL query combinations in development
- [ ] Click the link in error to auto-create index
- [ ] Add index to `firestore.indexes.json`
- [ ] Deploy: `firebase deploy --only firestore:indexes`
```

### 6. Timestamp Handling Inconsistencies

**Pattern:** Firestore Timestamps not converted to Dates properly.

**Risky Code:**
```typescript
createdAt: data.createdAt.toDate() // Fails if null or not a Timestamp
```

**Safe Code:**
```typescript
createdAt: data.createdAt instanceof Timestamp
  ? data.createdAt.toDate()
  : new Date()
```

---

## Testing Requirements by Category

### Pre-Commit Checks (MANDATORY)

Run these before EVERY commit:

```bash
# 1. TypeScript compilation check
cd apps/web && npx tsc --noEmit

# 2. Lint check
npm run lint

# 3. Build verification (catches runtime issues)
npm run build
```

### Manual Testing Checklist

For EVERY new feature or bug fix:

```markdown
## Create Operation
- [ ] Create with all required fields
- [ ] Create with optional fields empty
- [ ] Create with invalid data (verify error handling)
- [ ] Verify toast notification appears
- [ ] Verify data appears in Firestore Console

## Read Operation
- [ ] Data loads on page load
- [ ] Loading state shows skeleton
- [ ] Empty state shows when no data
- [ ] Real-time updates work (change in Console, verify UI)

## Update Operation
- [ ] Update single field
- [ ] Update multiple fields
- [ ] Verify optimistic update (if implemented)
- [ ] Verify toast notification

## Delete Operation
- [ ] Delete with confirmation
- [ ] Verify item removed from UI
- [ ] Verify removed from Firestore

## Permission Testing
- [ ] Test as OWNER role
- [ ] Test as PM role
- [ ] Test as EMPLOYEE role
- [ ] Verify permission-denied shows user-friendly error

## Cross-Browser
- [ ] Chrome
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)
```

### Firestore Rules Testing

**Using Emulators:**

```bash
# Start emulators
npm run emulators

# In another terminal, run your app
npm run dev

# Test operations - they hit local emulator
```

**Rules Unit Tests (Future):**

```javascript
// Example using @firebase/rules-unit-testing
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';

test('org member can read clients', async () => {
  const db = getFirestore({ uid: 'user1', orgId: 'org1' });
  await assertSucceeds(db.collection('clients').doc('client1').get());
});

test('non-member cannot read clients', async () => {
  const db = getFirestore({ uid: 'user2', orgId: 'org2' });
  await assertFails(db.collection('clients').doc('client1').get());
});
```

---

## Error Handling Standards

### Required Error Handling Pattern

Every async operation MUST follow this pattern:

```typescript
const handleSave = async () => {
  // 1. Set loading state
  setLoading(true);

  try {
    // 2. Perform operation
    await saveData();

    // 3. Success feedback
    toast.success('Saved successfully');

    // 4. Optional: close modal, refresh data
    onClose();

  } catch (err) {
    // 5. Log for debugging
    console.error('Save failed:', err);

    // 6. User-friendly error message
    if (err instanceof FirebaseError) {
      switch (err.code) {
        case 'permission-denied':
          toast.error('You don\'t have permission for this action');
          break;
        case 'not-found':
          toast.error('Item not found. It may have been deleted.');
          break;
        default:
          toast.error('Failed to save. Please try again.');
      }
    } else {
      toast.error('An unexpected error occurred');
    }

  } finally {
    // 7. Always clear loading state
    setLoading(false);
  }
};
```

### Error Message Guidelines

| Error Type | User Message | Developer Action |
|------------|--------------|------------------|
| permission-denied | "You don't have permission for this action" | Check Firestore rules |
| not-found | "Item not found. It may have been deleted." | Handle stale references |
| unavailable | "Unable to connect. Check your internet." | Implement retry logic |
| invalid-argument | "Invalid data. Please check your input." | Add form validation |
| Generic | "Something went wrong. Please try again." | Log full error for debugging |

---

## Development Workflow

### For New Features

```
1. PLAN
   - [ ] Review existing patterns in similar modules
   - [ ] Define types in types/index.ts
   - [ ] Document in CHANGELOG.md

2. IMPLEMENT
   - [ ] Create hook with proper error handling
   - [ ] Create components following patterns
   - [ ] Add Firestore rules if new collection
   - [ ] Add indexes if compound queries

3. TEST
   - [ ] Run TypeScript check: npx tsc --noEmit
   - [ ] Test CRUD operations manually
   - [ ] Test with emulators
   - [ ] Test error scenarios

4. DEPLOY
   - [ ] Deploy Firestore rules (if changed)
   - [ ] Deploy indexes (if changed)
   - [ ] Update SPRINT_STATUS.md
   - [ ] Update CHANGELOG.md
```

### For Bug Fixes

```
1. REPRODUCE
   - [ ] Identify exact steps to reproduce
   - [ ] Check browser console for errors
   - [ ] Check Firestore Console for data issues

2. DIAGNOSE
   - [ ] Is it a permission issue? (Check rules)
   - [ ] Is it a type mismatch? (Check types)
   - [ ] Is it missing data? (Check required fields)

3. FIX
   - [ ] Make minimal change to fix issue
   - [ ] Add error handling if missing
   - [ ] Update types if needed

4. VERIFY
   - [ ] Test the specific bug is fixed
   - [ ] Test related functionality still works
   - [ ] Run TypeScript check
```

---

## Future: Automated Testing Setup

### Phase 1: Unit Tests (Priority)

```bash
# Install testing dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Add to package.json scripts
"test": "vitest",
"test:ui": "vitest --ui"
```

**Priority Test Files to Create:**
1. `lib/hooks/useTasks.test.ts` - Task CRUD
2. `lib/hooks/useClients.test.ts` - Client CRUD
3. `lib/auth.test.tsx` - Auth flows
4. `components/ui/Button.test.tsx` - UI components

### Phase 2: Integration Tests

```bash
# For Firebase emulator testing
npm install -D @firebase/rules-unit-testing
```

### Phase 3: E2E Tests

```bash
# Playwright for full user flow testing
npm install -D @playwright/test
```

---

## Monitoring & Error Tracking (Future)

### Recommended Tools

1. **Sentry** - Error tracking and monitoring
2. **LogRocket** - Session replay for debugging
3. **Firebase Analytics** - User behavior tracking

### Implementation Priority

1. Add Sentry for production error tracking
2. Add custom error boundary with reporting
3. Add performance monitoring

---

## Quick Reference Card

### Before Every Commit

```bash
cd apps/web && npx tsc --noEmit  # Type check
npm run lint                      # Lint check
npm run build                     # Build check
```

### New Collection Checklist

```bash
# 1. Add rules
vim firestore.rules

# 2. Deploy rules
firebase deploy --only firestore:rules --project contractoros-483812

# 3. Test in emulator first
npm run emulators
```

### Common Firestore Errors

| Error | Likely Cause | Fix |
|-------|--------------|-----|
| permission-denied | Missing rules | Deploy rules |
| requires-index | Missing index | Click link in error |
| not-found | Bad document path | Check collection/doc IDs |
| invalid-argument | Type mismatch | Check data types |

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-28 | Claude Opus 4.5 | Initial creation based on error analysis |
