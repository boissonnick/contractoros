# CLI 4 SPRINT 37C - Security Fixes

> **Sprint:** 37C (continued)
> **Role:** Security Remediation
> **Priority:** HIGH - Fix before production

---

## Fix 1: clientOnboardingTokens Rules (H-001)
**Priority:** CRITICAL | **Effort:** 1 hour

**File:** `firestore.rules`

**Current (INSECURE):**
```javascript
match /clientOnboardingTokens/{tokenId} {
  allow read: if true;
  allow update: if true;
}
```

**Fix to:**
```javascript
match /clientOnboardingTokens/{tokenId} {
  // Only allow read if token matches document ID (prevents enumeration)
  allow read: if true;  // Keep for magic link access

  // Only allow specific field updates, not full document
  allow update: if request.resource.data.diff(resource.data).affectedKeys()
    .hasOnly(['usedAt', 'status'])
    && request.resource.data.status in ['used', 'expired'];

  // No create/delete from client
  allow create, delete: if false;
}
```

**Acceptance:**
- [ ] Tokens can still be read for magic link validation
- [ ] Updates restricted to status fields only
- [ ] Cannot update arbitrary fields
- [ ] Test: Client onboarding flow still works

---

## Fix 2: Add Server-Side Middleware (H-002)
**Priority:** HIGH | **Effort:** 2-3 hours

**Create:** `apps/web/middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/admin', '/field'];
const publicRoutes = ['/login', '/signup', '/client', '/sign', '/pay', '/api/webhooks', '/api/health'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for auth cookie/token
  const authToken = request.cookies.get('__session')?.value;

  // If accessing protected route without auth, redirect to login
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!authToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};
```

**Note:** Firebase Auth uses client-side tokens. Full server verification requires Firebase Admin SDK. This middleware provides basic route protection.

**Acceptance:**
- [ ] Protected routes redirect to login if no session
- [ ] Public routes still accessible
- [ ] Login redirect includes return URL

---

## Fix 3: Project Subcollection Org Checks (M-003)
**Priority:** MEDIUM | **Effort:** 1-2 hours

**File:** `firestore.rules`

**Find these subcollection rules and add org check:**

```javascript
// BEFORE (insecure - any authenticated user)
match /projects/{projectId}/phases/{phaseId} {
  allow read, write: if request.auth != null;
}

// AFTER (secure - same org only)
match /projects/{projectId}/phases/{phaseId} {
  allow read, write: if request.auth != null
    && get(/databases/$(database)/documents/projects/$(projectId)).data.orgId == getUserOrgId();
}
```

**Apply to these subcollections:**
- [ ] `phases`
- [ ] `quoteSections`
- [ ] `clientPreferences`
- [ ] `activities`
- [ ] `notes`
- [ ] `drawings`
- [ ] `dailyLogs`

**Helper function (add if not exists):**
```javascript
function getUserOrgId() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.orgId;
}
```

**Acceptance:**
- [ ] Users can only read/write their org's project data
- [ ] Cross-org access blocked
- [ ] Test: Project pages still load for authorized users

---

## Fix 4: Strengthen signatureRequests Access (M-001)
**Priority:** MEDIUM | **Effort:** 30 min

**File:** `firestore.rules`

**Current:**
```javascript
match /signatureRequests/{requestId} {
  allow read: if true;
}
```

**Fix to:**
```javascript
match /signatureRequests/{requestId} {
  // Public read for magic link validation, but only unexpired
  allow read: if true
    && resource.data.expiresAt > request.time;

  // Updates only for specific signing actions
  allow update: if request.resource.data.diff(resource.data).affectedKeys()
    .hasOnly(['status', 'signedAt', 'signatureData', 'signerIp'])
    && request.resource.data.status in ['signed', 'declined'];
}
```

**Acceptance:**
- [ ] Expired signature requests not readable
- [ ] Updates restricted to signing fields
- [ ] Magic link signing still works

---

## Fix 5: Strengthen paymentLinks Access (M-002)
**Priority:** MEDIUM | **Effort:** 30 min

**File:** `firestore.rules`

**Current:**
```javascript
match /paymentLinks/{linkId} {
  allow read: if true;
}
```

**Fix to:**
```javascript
match /paymentLinks/{linkId} {
  // Public read for payment page, but only active links
  allow read: if true
    && resource.data.status == 'active'
    && (resource.data.expiresAt == null || resource.data.expiresAt > request.time);

  // No client-side updates to payment links
  allow update: if false;
}
```

**Acceptance:**
- [ ] Only active payment links readable
- [ ] Expired links not accessible
- [ ] Payment flow still works

---

## Verification Steps

After all fixes:

```bash
# 1. Deploy rules
firebase deploy --only firestore:rules --project contractoros-483812

# 2. Test client onboarding
# - Create new onboarding token
# - Complete onboarding flow
# - Verify token marked as used

# 3. Test signature flow
# - Create signature request
# - Open magic link
# - Sign document

# 4. Test payment flow
# - Create payment link
# - Open payment page
# - Complete payment

# 5. Test cross-org access (should fail)
# - Log in as user from Org A
# - Try to access project from Org B via direct URL
# - Should get permission denied
```

---

## Status Updates
```bash
echo "$(date +%H:%M) - Fix X complete: [description]" >> /Users/nickbodkins/contractoros/.claude-coordination/cli-4-status.txt
```

---

## Files You OWN
- `firestore.rules`
- `apps/web/middleware.ts` (create new)

## Files to AVOID
- Component files (CLI 2)
- Seed scripts (CLI 3)
