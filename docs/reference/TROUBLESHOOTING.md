# Troubleshooting Guide

**Last Updated:** 2026-02-04
**Purpose:** Common errors, fixes, and debugging patterns for ContractorOS

---

## Quick Reference: Top 5 Errors

| Error | Quick Fix |
|-------|-----------|
| `FirebaseError: Missing permissions` | Add rule to `firestore.rules`, deploy |
| `requires an index` | Add to `firestore.indexes.json`, deploy |
| `Cannot find module '@/types'` | Use `from '@/types'` not `from '@/types/index'` |
| Data seeded but not visible in app | Use `getFirestore(app, 'contractoros')` |
| Container exists error | `docker stop contractoros-web; docker rm contractoros-web` |

---

## Firebase / Firestore Errors

### Missing Permissions

**Error:**
```
FirebaseError: Missing or insufficient permissions
Error: 7 PERMISSION_DENIED: Missing or insufficient permissions
```

**Causes:**
1. Firestore security rule missing or too restrictive
2. User not authenticated
3. Wrong organization context

**Fixes:**

**For new collection:**
```javascript
// Add to firestore.rules
match /organizations/{orgId}/newCollection/{docId} {
  allow read, write: if isSameOrg(orgId);
}
```

**Deploy rules:**
```bash
firebase deploy --only firestore --project contractoros-483812
```

**Check auth status:**
```typescript
import { useAuth } from '@/contexts/AuthContext';
const { user, loading } = useAuth();
console.log('User:', user, 'Loading:', loading);
```

---

### Missing Composite Index

**Error:**
```
FirebaseError: The query requires an index. You can create it here: https://console.firebase.google.com/...
```

**Cause:** Firestore query uses multiple fields or complex sorting

**Fix:**

**Method 1: Auto-create (click the link)**
- Click the URL in error message
- Firebase Console opens
- Click "Create Index"
- Wait 2-5 minutes for index to build

**Method 2: Manual add to firestore.indexes.json**
```json
{
  "indexes": [
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "dueDate", "order": "ASCENDING" }
      ]
    }
  ]
}
```

**Deploy:**
```bash
firebase deploy --only firestore --project contractoros-483812
```

---

### Named Database Issues

**Error 1: Data seeded but not visible in app**

**Cause:** Seed script used default database instead of named `contractoros` database

**Fix:**
```typescript
// WRONG
import admin from 'firebase-admin';
const db = admin.firestore();  // Uses default database

// CORRECT
import { getFirestore } from 'firebase-admin/firestore';
const db = getFirestore(app, 'contractoros');  // Uses named database

// For seed scripts, use shared db.ts:
import { getDb } from './db';
const db = getDb();  // Already configured for 'contractoros'
```

**Error 2: Data visible in Firebase Console but not in app**

**Cause:** Viewing wrong database in Firebase Console

**Fix:**
1. Go to Firebase Console → Firestore Database
2. Click database dropdown at top (says "(default)")
3. Select `contractoros`
4. Now you'll see app data

---

### Authentication Errors

**Error: `auth/invalid-api-key`**

**Cause:** Missing or incorrect Firebase API key in environment

**Fix:**
```bash
# Check .env.local exists
cat apps/web/.env.local

# Should have:
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...

# If missing, copy from Firebase Console:
# Project Settings → Your apps → Web app → Config
```

**Error: `auth/user-not-found`**

**Cause:** Trying to access user that doesn't exist

**Fix:**
```bash
# Check Firebase Console → Authentication → Users
# Or create test user:
firebase auth:import users.json --project contractoros-483812
```

---

## TypeScript / Module Errors

### Cannot Find Module

**Error:**
```
Cannot find module '@/types' or its corresponding type declarations
Cannot find module '@/types/index'
```

**Cause:** Incorrect import path

**Fix:**
```typescript
// WRONG
import { Client } from '@/types/index';

// CORRECT
import { Client } from '@/types';
```

**Why:** TypeScript auto-resolves `/index` — don't include it explicitly

---

### Type Errors in Forms

**Error:**
```
Type 'string | undefined' is not assignable to type 'string'
```

**Cause:** Form field might be undefined

**Fix:**
```typescript
// WRONG
const name: string = formData.name;

// CORRECT
const name = formData.name || '';
const name = formData.name ?? 'Default';
```

---

### Firestore Timestamp Type Errors

**Error:**
```
Type 'Timestamp' is not assignable to type 'Date'
```

**Cause:** Firestore returns Timestamp objects, not Date objects

**Fix:**
```typescript
import { convertTimestamps } from '@/lib/firebase/timestamp-converter';

// Convert on read
const client = convertTimestamps(docSnap.data() as Client);

// Now client.createdAt is Date, not Timestamp
```

---

## Docker Errors

### Container Already Exists

**Error:**
```
Error response from daemon: Conflict. The container name "/contractoros-web" is already in use
```

**Fix:**
```bash
# Stop and remove old container
docker stop contractoros-web
docker rm contractoros-web

# Then run again
docker run -d -p 3000:8080 --name contractoros-web contractoros-web
```

**One-liner:**
```bash
docker stop contractoros-web 2>/dev/null; docker rm contractoros-web 2>/dev/null; docker run -d -p 3000:8080 --name contractoros-web contractoros-web
```

---

### Docker Build Fails (Missing Env Vars)

**Error:**
```
Error: Firebase config is incomplete
Error: NEXT_PUBLIC_FIREBASE_API_KEY is required
```

**Cause:** Docker build needs environment variables at build time

**Fix:**
```bash
# WRONG - doesn't pass env vars
docker build -t contractoros-web .

# CORRECT - use build script
./docker-build-local.sh
```

**Why:** Next.js embeds `NEXT_PUBLIC_*` vars at build time, not runtime

---

### Port Already in Use

**Error:**
```
Error starting userland proxy: listen tcp4 0.0.0.0:3000: bind: address already in use
```

**Fix:**

**Option 1: Kill process on port 3000**
```bash
lsof -ti:3000 | xargs kill -9
```

**Option 2: Use different port**
```bash
docker run -d -p 3001:8080 --name contractoros-web contractoros-web
# Now access at http://localhost:3001
```

---

## Next.js / React Errors

### Hydration Mismatch

**Error:**
```
Warning: Text content did not match. Server: "..." Client: "..."
Hydration failed because the initial UI does not match what was rendered on the server
```

**Causes:**
1. Using browser-only APIs during SSR (localStorage, window)
2. Date formatting differences
3. Random values generated during render

**Fixes:**

**Use client-side only rendering:**
```typescript
'use client';
import { useEffect, useState } from 'react';

export default function Component() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Now safe to use browser APIs
  return <div>{localStorage.getItem('key')}</div>;
}
```

**Use suppressHydrationWarning for timestamps:**
```tsx
<time suppressHydrationWarning>
  {new Date().toLocaleString()}
</time>
```

---

### useEffect Infinite Loop

**Error:** Browser tab freezes, React dev tools show constant re-renders

**Cause:** Dependency array missing or includes objects/arrays

**Fix:**
```typescript
// WRONG - missing deps
useEffect(() => {
  fetchData(clientId);  // clientId not in deps!
}, []);

// WRONG - object reference changes every render
useEffect(() => {
  fetchData(filters);
}, [filters]);  // filters is object

// CORRECT - primitive dependencies
useEffect(() => {
  fetchData(clientId);
}, [clientId]);

// CORRECT - stable object reference
const filters = useMemo(() => ({ status: 'active' }), []);
useEffect(() => {
  fetchData(filters);
}, [filters]);
```

---

### Memory Leaks (setState on Unmounted Component)

**Error:**
```
Warning: Can't perform a React state update on an unmounted component
```

**Cause:** Async operation completes after component unmounts

**Fix:**
```typescript
useEffect(() => {
  let cancelled = false;

  async function fetchData() {
    const data = await api.fetch();
    if (!cancelled) {
      setData(data);
    }
  }

  fetchData();

  return () => {
    cancelled = true;  // Cleanup
  };
}, []);
```

---

## Build / Deployment Errors

### TypeScript Build Fails

**Error:**
```
Type error: Property 'X' does not exist on type 'Y'
```

**Check before committing:**
```bash
cd apps/web
npx tsc --noEmit
```

**Common fixes:**
- Add missing type definition
- Import missing type
- Make property optional with `?`
- Use type assertion (carefully)

---

### Cloud Build Timeout

**Error:**
```
ERROR: build step timed out (10m0s)
```

**Causes:**
1. Large dependency install
2. Slow Docker build
3. Network issues

**Fixes:**

**Increase timeout in cloudbuild.yaml:**
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    timeout: 1800s  # 30 minutes
```

**Use build cache:**
```yaml
- name: 'gcr.io/cloud-builders/docker'
  args:
    - build
    - --cache-from
    - gcr.io/$PROJECT_ID/contractoros-web:latest
```

---

## Performance Issues

### Slow Firestore Queries

**Symptom:** Page takes >3 seconds to load

**Debug:**
```typescript
console.time('query');
const snapshot = await getDocs(query);
console.timeEnd('query');
```

**Fixes:**

**Add index:**
```bash
# Check console for missing index URL
firebase deploy --only firestore --project contractoros-483812
```

**Add pagination:**
```typescript
import { limit, startAfter } from 'firebase/firestore';

const q = query(
  collection(db, 'organizations', orgId, 'clients'),
  orderBy('createdAt', 'desc'),
  limit(25)  // Only fetch 25 at a time
);
```

**Use select() for specific fields:**
```typescript
// Don't fetch all fields if you only need a few
const q = query(
  collection(db, path),
  select('id', 'name', 'status')  // Only these fields
);
```

---

### Large Bundle Size

**Symptom:** Initial page load >2MB

**Check bundle size:**
```bash
npm run build
# Check .next/standalone size
```

**Fixes:**

**Use dynamic imports:**
```typescript
// Instead of:
import HeavyComponent from './HeavyComponent';

// Use:
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />
});
```

**Check for duplicate dependencies:**
```bash
npm ls react  # Should only see one version
```

---

## Data Issues

### Demo Data Not Visible

**Symptom:** Seed script runs successfully but data not in app

**Checks:**

**1. Verify database:**
```typescript
// In seed script, check:
console.log('Database:', db.databaseId);  // Should be 'contractoros'
```

**2. Check Firebase Console:**
- Select `contractoros` database (not `(default)`)
- Navigate to collection
- Verify documents exist

**3. Check orgId match:**
```typescript
// Seed script orgId must match user's orgId
const orgId = 'org123';  // From utils.ts
// User in Firebase Auth must have custom claim: orgId = 'org123'
```

**Fix:**
```bash
# Re-run seed with correct database
cd scripts/seed-demo
npx ts-node seed-to-named-db.ts
```

---

### Timestamp Conversion Errors

**Symptom:** `client.createdAt.toDate is not a function`

**Cause:** Not converting Firestore Timestamp to Date

**Fix:**
```typescript
import { convertTimestamps } from '@/lib/firebase/timestamp-converter';

// After fetching from Firestore
const client = convertTimestamps(docData as Client);

// Now client.createdAt is Date, not Timestamp
```

---

## Testing Issues

### E2E Tests Timeout

**Error:** Test exceeds 30 second timeout

**Causes:**
1. Page not loading
2. Selector not found
3. Network request hanging

**Fixes:**

**Increase timeout:**
```typescript
await page.waitForSelector('.client-card', { timeout: 60000 });
```

**Check page errors:**
```typescript
page.on('pageerror', error => {
  console.error('Page error:', error);
});
```

**Use better selectors:**
```typescript
// WRONG - fragile
await page.click('button:nth-child(3)');

// CORRECT - semantic
await page.click('button:has-text("Add Client")');
```

---

## Debugging Tools

### Enable Firestore Debug Logging

```typescript
import { setLogLevel } from 'firebase/firestore';
setLogLevel('debug');
```

### Enable Next.js Debug Mode

```bash
NODE_OPTIONS='--inspect' npm run dev
# Open chrome://inspect in Chrome
```

### Check Firebase Auth State

```typescript
import { getAuth } from 'firebase/auth';
const auth = getAuth();
auth.onAuthStateChanged(user => {
  console.log('Auth state:', user);
});
```

### Monitor Firestore Reads

```typescript
let readCount = 0;
onSnapshot(query, snapshot => {
  readCount += snapshot.size;
  console.log('Total reads:', readCount);
});
```

---

## Getting Help

### Before Asking for Help

1. Check this troubleshooting guide
2. Check error message carefully (often contains solution)
3. Search Firebase documentation
4. Check git history for recent changes
5. Try rolling back to last working commit

### What to Include

```markdown
**Error:**
[Exact error message]

**Steps to reproduce:**
1. [Step 1]
2. [Step 2]

**Environment:**
- Node version: [Run `node --version`]
- Firebase CLI: [Run `firebase --version`]
- Branch: [Run `git branch --show-current`]

**What I've tried:**
- [Attempt 1]
- [Attempt 2]
```

---

## Common Patterns to Avoid

### ❌ Don't: Silently Catch Errors

```typescript
// BAD
try {
  await updateClient(id, data);
} catch (error) {
  // Silent failure - user has no idea what happened
}
```

### ✅ Do: Show User-Friendly Errors

```typescript
// GOOD
try {
  await updateClient(id, data);
  toast.success('Client updated');
} catch (error) {
  console.error('Update failed:', error);
  toast.error('Failed to update client. Please try again.');
}
```

---

### ❌ Don't: Use Any Type

```typescript
// BAD
const data: any = await fetchClient(id);
```

### ✅ Do: Use Proper Types

```typescript
// GOOD
const data = await fetchClient(id) as Client;
// or
import { Client } from '@/types';
const data: Client = await fetchClient(id);
```

---

### ❌ Don't: Read Entire types/index.ts

```typescript
// Wastes 6,000 lines / 35,000 tokens
```

### ✅ Do: Grep for Specific Types

```bash
grep -n "export interface Client" apps/web/types/index.ts
# Then read specific lines with offset/limit
```

---

## Reference Links

- **Firebase Docs:** https://firebase.google.com/docs
- **Next.js Errors:** https://nextjs.org/docs/messages
- **React Errors:** https://react.dev/reference/react/Component#error-boundaries
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/handbook

---

*For environment setup issues, see `docs/reference/ENVIRONMENT_CONFIG.md`*
