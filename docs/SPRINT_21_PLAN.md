# Sprint 21 Plan — Bug Fixes & Polish

> **Created:** 2026-02-02 by Controller Session
> **Duration:** 2-3 days
> **Focus:** Stability, error handling, incomplete features

---

## Sprint Goals

| Priority | Category | Items |
|----------|----------|-------|
| **P0** | Critical Bugs | 3 |
| **P1** | Incomplete Features | 4 |
| **P2** | Polish & UX | 3 |

---

## P0: Critical Bugs (Day 1)

### BUG-21-001: Materials Page Missing Projects
**File:** `apps/web/app/dashboard/materials/page.tsx:755,781`
**Issue:** Projects array is hardcoded to empty `[]`
**Fix:** Load projects from Firestore and pass to component

```tsx
// Current (broken)
projects={[]} // TODO: Load projects

// Fix: Use useProjects hook
const { projects } = useProjects();
// Then pass projects={projects}
```

---

### BUG-21-002: Submittals CRUD Not Implemented
**File:** `apps/web/app/dashboard/projects/[id]/submittals/page.tsx:144,150`
**Issue:** Create/update functions are empty stubs
**Fix:** Implement Firestore operations

```tsx
// Line 144 - Implement create
const docRef = await addDoc(
  collection(db, `organizations/${orgId}/projects/${projectId}/submittals`),
  { ...data, createdAt: serverTimestamp() }
);

// Line 150 - Implement update
await updateDoc(
  doc(db, `organizations/${orgId}/projects/${projectId}/submittals/${id}`),
  { ...data, updatedAt: serverTimestamp() }
);
```

---

### BUG-21-003: E-Signature Emails Not Sent
**File:** `apps/web/lib/esignature/signature-service.ts:217,331`
**Issue:** Email sending is stubbed with TODO comments
**Fix:** Integrate with existing email Cloud Functions

```tsx
// Call sendSignatureEmails Cloud Function
await fetch('/api/esignature/send-emails', {
  method: 'POST',
  body: JSON.stringify({ documentId, signers })
});
```

---

## P1: Incomplete Features (Day 2)

### FEAT-21-001: Add Basic Pagination to Invoice List
**File:** `apps/web/app/dashboard/invoices/page.tsx`
**Issue:** All invoices loaded at once, will break at scale
**Fix:** Add cursor-based pagination with 25 items per page

**Implementation:**
1. Add `limit(25)` to Firestore query
2. Track last document for `startAfter()`
3. Add "Load More" button or infinite scroll
4. Show total count in header

---

### FEAT-21-002: Add Pagination to Projects List
**File:** `apps/web/app/dashboard/projects/page.tsx`
**Issue:** Same pagination issue
**Fix:** Same pattern as invoices

---

### FEAT-21-003: Error Toast on CRUD Failures
**Files:** Multiple hooks in `apps/web/lib/hooks/`
**Issue:** Silent failures confuse users
**Fix:** Add toast notifications on errors

```tsx
// In hooks, wrap mutations with try/catch + toast
try {
  await addDoc(...);
  toast.success('Created successfully');
} catch (error) {
  toast.error('Failed to create. Please try again.');
  console.error(error);
}
```

**Priority hooks to update:**
- useProjects.ts
- useClients.ts
- useInvoices.ts
- useEstimates.ts
- useTeam.ts

---

### FEAT-21-004: Twilio Webhook Signature Verification
**File:** `apps/web/app/api/sms/webhook/route.ts` (or create)
**Issue:** Webhook accepts unverified requests
**Fix:** Validate Twilio signature

```tsx
import twilio from 'twilio';

const twilioSignature = request.headers.get('X-Twilio-Signature');
const isValid = twilio.validateRequest(
  process.env.TWILIO_AUTH_TOKEN!,
  twilioSignature,
  webhookUrl,
  body
);

if (!isValid) {
  return new Response('Invalid signature', { status: 403 });
}
```

---

## P2: Polish & UX (Day 3)

### POLISH-21-001: Loading States Consistency
**Files:** Dashboard pages
**Issue:** Inconsistent loading skeletons
**Fix:** Ensure all list pages use SkeletonList component

---

### POLISH-21-002: Empty State Actions
**Files:** Dashboard pages
**Issue:** Empty states don't guide users to next action
**Fix:** Add "Get Started" CTAs to empty states

---

### POLISH-21-003: Form Validation Messages
**Files:** Form modals
**Issue:** Some forms show generic "Required" errors
**Fix:** Add contextual error messages

---

## Task Summary

| ID | Task | Effort | Session |
|----|------|--------|---------|
| BUG-21-001 | Materials projects fix | 30 min | Dev Sprint |
| BUG-21-002 | Submittals CRUD | 1 hr | Dev Sprint |
| BUG-21-003 | E-signature emails | 2 hr | Dev Sprint |
| FEAT-21-001 | Invoice pagination | 2 hr | Dev Sprint |
| FEAT-21-002 | Projects pagination | 1 hr | Dev Sprint |
| FEAT-21-003 | Error toasts (5 hooks) | 2 hr | Dev Sprint |
| FEAT-21-004 | Twilio webhook security | 1 hr | Dev Sprint |
| POLISH-21-001 | Loading states | 1 hr | Dev Sprint |
| POLISH-21-002 | Empty state CTAs | 1 hr | Dev Sprint |
| POLISH-21-003 | Form validation | 1 hr | Dev Sprint |

**Total Estimated:** 12-14 hours (2-3 days)

---

## Definition of Done

- [ ] All P0 bugs fixed
- [ ] Invoice + Projects pagination working
- [ ] Error toasts on CRUD failures
- [ ] Twilio webhook validates signatures
- [ ] TypeScript compiles clean
- [ ] Manual smoke test passes

---

## Files to Modify

```
apps/web/app/dashboard/materials/page.tsx
apps/web/app/dashboard/projects/[id]/submittals/page.tsx
apps/web/app/dashboard/invoices/page.tsx
apps/web/app/dashboard/projects/page.tsx
apps/web/lib/esignature/signature-service.ts
apps/web/lib/hooks/useProjects.ts
apps/web/lib/hooks/useClients.ts
apps/web/lib/hooks/useInvoices.ts
apps/web/lib/hooks/useEstimates.ts
apps/web/lib/hooks/useTeam.ts
apps/web/app/api/sms/webhook/route.ts (create or modify)
```
