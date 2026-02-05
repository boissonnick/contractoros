# ContractorOS Security Audit Report

**Date:** 2026-02-03
**Auditor:** Claude Code Security Analysis
**Scope:** Full codebase security evaluation using "Vibe-Sec" methodology
**Framework:** OWASP Top 10, Secure Coding Guide for Web Applications

---

## Executive Summary

ContractorOS demonstrates a **solid security foundation** with proper Firebase Authentication, organization-scoped Firestore rules, and consistent authorization patterns. However, this audit identified **several critical and high-severity vulnerabilities** that require immediate attention before production deployment.

### Risk Summary

| Severity | Count | Status |
|----------|-------|--------|
| **CRITICAL** | 6 | Requires immediate action |
| **HIGH** | 11 | Fix within 1 week |
| **MEDIUM** | 12 | Fix within 1 sprint |
| **LOW** | 5 | Backlog items |

### Overall Security Posture: **MEDIUM RISK**

---

## Critical Findings (Fix Immediately)

### 1. Missing Authentication on Payment API Endpoints
**Location:** `apps/web/app/api/payments/[id]/route.ts` (lines 11-91)
**Type:** Broken Access Control (OWASP A01)

The GET and PATCH endpoints for payment records lack authentication:

```typescript
// VULNERABLE: No auth check
export async function GET(request: NextRequest, { params }) {
  const { id } = await params;
  const doc = await adminDb.collection('stripePayments').doc(id).get();
  return NextResponse.json(doc.data()); // Direct return without auth
}
```

**Impact:** Any user knowing a payment ID can view/modify payment records.
**Remediation:** Add `verifyAuthAndOrg()` check before all operations.

---

### 2. Mass Assignment Vulnerability on RFI Updates
**Location:** `apps/web/app/api/projects/[projectId]/rfis/[rfiId]/route.ts` (line 50-86)
**Type:** Mass Assignment (OWASP A04)

The PATCH endpoint spreads the entire request body without field filtering:

```typescript
const updates: Record<string, unknown> = { ...body, updatedAt: new Date() };
```

**Impact:** Attackers can modify any field including `respondedBy`, `closedAt`, or fabricate status transitions.
**Remediation:** Explicitly allowlist updateable fields.

---

### 3. Public Read Access on Client Onboarding Tokens
**Location:** `firestore.rules` (lines 616-632)
**Type:** Broken Access Control (OWASP A01)

```javascript
match /clientOnboardingTokens/{tokenId} {
  allow read: if true; // Anyone can read all tokens
}
```

**Impact:** Token metadata, creation dates, and associated client info are exposed without authentication.
**Remediation:** Restrict to pending tokens only: `allow read: if resource.data.status == 'pending';`

---

### 4. No Multi-Factor Authentication (MFA)
**Location:** Application-wide
**Type:** Identification and Authentication Failures (OWASP A07)

No MFA/2FA implementation exists for any user role, including high-privilege OWNER and PM accounts.

**Impact:** Accounts vulnerable to credential compromise, phishing, and password reuse attacks.
**Remediation:** Implement Firebase MFA (TOTP) for admin roles at minimum.

---

### 5. Public File Exposure via makePublic()
**Location:** `apps/web/app/api/assistant/analyze-photo/route.ts` (line 307)
**Location:** `apps/web/app/api/assistant/analyze-document/route.ts` (line 314)
**Type:** Security Misconfiguration (OWASP A05)

```typescript
await fileRef.makePublic();
const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
```

**Impact:** Uploaded documents and photos are publicly accessible to anyone with the URL.
**Remediation:** Use signed URLs with expiration instead of `makePublic()`.

---

### 6. Missing Content Security Policy (CSP) Headers
**Location:** `apps/web/next.config.js`
**Type:** Security Misconfiguration (OWASP A05)

No CSP header is configured, leaving the application vulnerable to XSS attacks.

**Impact:** Malicious scripts could execute in user browsers.
**Remediation:** Add strict CSP:
```javascript
"Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
```

---

## High Severity Findings

### 7. Open Redirect in OAuth Callback
**Location:** `apps/web/app/api/integrations/quickbooks/callback/route.ts` (line 77)
**Type:** Server-Side Request Forgery (OWASP A10)

The `returnUrl` parameter from OAuth state is used without validation:
```typescript
const successUrl = new URL(authState.returnUrl || '/dashboard/settings/integrations', request.url);
return NextResponse.redirect(successUrl);
```

**Remediation:** Validate returnUrl is same-origin before redirecting.

---

### 8. Token Storage in localStorage
**Location:** `apps/web/lib/firebase/config.ts` (lines 52-54)
**Type:** Sensitive Data Exposure (OWASP A02)

Firebase tokens stored in localStorage are accessible to XSS attacks.

**Remediation:** Consider `browserSessionPersistence` or httpOnly cookies.

---

### 9. Missing Rate Limiting on Sensitive Endpoints
**Location:** Multiple API routes
**Type:** Security Misconfiguration (OWASP A05)

No rate limiting on:
- `/api/payments/[id]/refund` (financial operations)
- `/api/esignature/send-reminder` (email spam)
- Login endpoints (brute force)

**Remediation:** Apply rate limiter from `lib/security/rate-limiter.ts` to all sensitive routes.

---

### 10. Overly Permissive RFI and Equipment Updates
**Location:** `firestore.rules` (lines 879-880, 1775-1787)
**Type:** Broken Access Control (OWASP A01)

Any org member can update RFIs and equipment checkouts without role restrictions.

**Remediation:** Add role-based restrictions (OWNER/PM only for updates).

---

### 11. Magic Link Email Stored in localStorage
**Location:** `apps/web/lib/auth-providers.ts` (line 89)
**Type:** Sensitive Data Exposure (OWASP A02)

```typescript
window.localStorage.setItem('emailForSignIn', email);
```

**Remediation:** Use secure session parameters or encrypted storage.

---

### 12. Insufficient Webhook Idempotency
**Location:** `apps/web/app/api/sms/webhooks/route.ts` (lines 14-46)
**Type:** Improper Input Validation (OWASP A03)

No deduplication for repeat webhook deliveries.

**Remediation:** Add idempotency key checks before processing.

---

### 13. File Type Validation Uses MIME Type Only
**Location:** `apps/web/app/api/voice-logs/upload/route.ts` (lines 135-141)
**Type:** Insecure File Upload

```typescript
const mimeType = audioFile.type || 'audio/webm'; // Client-controlled
```

**Remediation:** Implement magic byte verification for actual file type.

---

### 14. Excessive Impersonation Timeout
**Location:** `apps/web/lib/contexts/ImpersonationContext.tsx` (lines 68-104)
**Type:** Broken Access Control (OWASP A01)

2-hour impersonation stored in localStorage with minimal validation.

**Remediation:** Move to server-side sessions, reduce timeout to 30 minutes, add audit logging.

---

### 15. Broken Equipment Routes Authorization
**Location:** `apps/web/app/api/equipment/route.ts` (lines 26-107)
**Type:** Broken Access Control (OWASP A01)

Routes check authentication but not organization-level access.

**Remediation:** Add `verifyOrgAccess()` checks.

---

### 16. Assistant API Fallback to Client-Provided orgId
**Location:** `apps/web/app/api/assistant/route.ts` (lines 93-319)
**Type:** Broken Access Control (OWASP A01)

```typescript
const effectiveOrgId = verifiedOrgId || body.orgId || context?.organization?.orgId || 'unknown';
```

**Remediation:** Return 401 if verification fails; never use client-provided fallbacks.

---

### 17. Client Portal Token Security
**Location:** `apps/web/app/api/client/[token]/documents/route.ts` (lines 44-99)
**Type:** Identification Failures (OWASP A07)

No rate limiting on token guessing, no timing-safe comparison.

**Remediation:** Add rate limiting, use constant-time comparison, implement token expiration.

---

## Medium Severity Findings

### 18. Password Policy Not Fully Enforced
**Location:** `apps/web/app/auth/change-password/page.tsx` (lines 26-40)

Client-side only validation. No special character requirement. No common password checking.

### 19. Session Timeout Too Long
**Location:** `apps/web/lib/security/session-manager.ts` (lines 113-125)

7-day absolute timeout is excessive for sensitive operations.

### 20. Predictable Session ID Generation
**Location:** `apps/web/lib/hooks/useSessionManagement.ts` (lines 84-99)

Session IDs based on timestamp + random string, not cryptographically secure.

### 21. Missing Audit Logging
**Location:** Payment, webhook, and admin routes

No logging for financial operations, webhook processing, or failed auth attempts.

### 22. Inconsistent Activity Collection Fields
**Location:** `firestore.rules` (lines 699-705 vs 688-696)

`activityLog` uses `orgId` while `activity` uses `organizationId`.

### 23. Public Signature Requests Without Time Expiration
**Location:** `firestore.rules` (lines 1159-1170)

No time-based validation for old signature requests.

### 24. XSS Risk in Gantt Chart
**Location:** Gantt chart component uses innerHTML with task properties

### 25. Firestore Database Inconsistency
**Location:** Multiple routes mix global `users` collection with org-scoped collections

### 26. OAuth State Validation Trusts Decoded Values
**Location:** `apps/web/app/api/integrations/quickbooks/callback/route.ts` (lines 45-89)

State parameter decoded without server-side verification.

### 27. Missing CORS Configuration Review
**Location:** All API routes

No explicit CORS configuration visible.

### 28. API Keys in URL Parameters
**Location:** `apps/web/app/api/assistant/analyze-photo/route.ts` (lines 114-218)

Gemini API key exposed in URL:
```typescript
`https://generativelanguage.googleapis.com/...?key=${apiKey}`
```

### 29. Password Reset Token Expiration Mismatch
**Location:** `apps/web/app/auth/forgot-password/page.tsx` (line 74)

UI says 1 hour, Firebase default is 24 hours.

---

## Low Severity Findings

### 30. Error Messages May Leak Information
Multiple routes expose specific error details to clients.

### 31. File Upload Path Could Include User Input
`file.name` used in document analysis paths without sanitization.

### 32. Session ID Not Cleared on Logout
Session ID remains in localStorage after `signOut()`.

### 33. Account Linking Implementation Issue
Uses incorrect credential creation pattern.

### 34. No Security Headers Review in middleware.ts
Missing middleware for additional security checks.

---

## Positive Security Findings

The following security best practices are correctly implemented:

| Area | Status | Details |
|------|--------|---------|
| Organization Scoping | ✅ Good | All Firestore collections use `isSameOrg(orgId)` |
| Role-Based Access | ✅ Good | OWNER/PM/EMPLOYEE/CLIENT roles implemented |
| Token Verification | ✅ Good | Firebase Admin SDK verifies tokens server-side |
| CSRF Protection | ✅ Good | JWT Bearer tokens inherently CSRF-safe |
| Stripe Webhooks | ✅ Good | Signature verification implemented |
| Twilio Webhooks | ✅ Excellent | Uses `crypto.timingSafeEqual()` |
| Input Validation | ✅ Good | React Hook Form + Zod validation |
| SQL Injection | ✅ Safe | Firestore parameterized queries |
| Secrets in Git | ✅ Good | .env.local is in .gitignore |
| XSS via React | ✅ Good | No dangerouslySetInnerHTML usage |
| Audit Log Immutability | ✅ Good | `allow update, delete: if false` |

---

## Remediation Priority

### Immediate (Today)
1. Add authentication to payment endpoints
2. Fix mass assignment on RFI updates
3. Remove `makePublic()` from file uploads
4. Restrict clientOnboardingTokens public read

### This Week
5. Implement CSP headers
6. Fix open redirect in OAuth callback
7. Add rate limiting to sensitive endpoints
8. Implement MFA for admin accounts

### This Sprint
9. Review all Firestore rules for authorization gaps
10. Implement magic byte file validation
11. Add comprehensive audit logging
12. Move sensitive data from localStorage

### Backlog
13. Standardize session management
14. Add security scanning to CI/CD
15. Implement DOMPurify for defense-in-depth
16. Complete penetration testing

---

## Testing Recommendations

After implementing fixes, perform:

1. **Authorization Testing**
   - Verify cross-org data isolation
   - Test role escalation scenarios
   - Validate IDOR protection

2. **Authentication Testing**
   - Test expired/invalid tokens
   - Verify MFA enforcement
   - Check session timeout behavior

3. **Input Validation Testing**
   - XSS payloads in all input fields
   - File upload with spoofed types
   - Mass assignment attempts

4. **API Security Testing**
   - Rate limiting verification
   - Webhook replay attacks
   - OAuth flow manipulation

---

## Compliance Considerations

If ContractorOS handles:
- **Financial Data:** PCI-DSS compliance requires MFA, encryption, audit logging
- **Personal Information:** CCPA/GDPR requires data access controls, deletion capability
- **Construction Industry Data:** Check state-specific contractor data protection requirements

---

## Conclusion

ContractorOS has a strong security foundation with Firebase Authentication and org-scoped Firestore rules. The main gaps are around:

1. **Authentication gaps** on specific API endpoints
2. **Missing MFA** for privileged accounts
3. **Public file exposure** without access controls
4. **Insufficient input validation** on some endpoints

Addressing the 6 critical and 11 high-severity findings should be the immediate priority before any production deployment with real user data.

**Estimated Remediation Effort:** 40-60 development hours for all critical and high findings.

---

*Report generated using Secure Coding Guide for Web Applications methodology*
