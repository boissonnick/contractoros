# CLI 4 SPRINT 37C - Security Audit

> **Sprint:** 37C
> **Role:** Security Vulnerability Discovery
> **Started:** 2026-02-02

---

## Your Mission

Perform a comprehensive security audit of the ContractorOS platform. Document all findings in a report.

---

## Task 1: Firestore Rules Audit
**Effort:** 2-3 hours

**File:** `firestore.rules`

**Check for:**
- [ ] All collections require authentication
- [ ] orgId checks on all org-scoped data
- [ ] No overly permissive `allow read, write: if true`
- [ ] Proper owner checks for user-specific data
- [ ] Rate limiting considerations

**Common vulnerabilities:**
- Missing `request.auth != null` checks
- Missing `resource.data.orgId == request.auth.token.orgId`
- Wildcards without constraints

**Document:** List each collection and its security posture

---

## Task 2: API Route Security
**Effort:** 2-3 hours

**Location:** `app/api/`

**Check each route for:**
- [ ] Authentication middleware
- [ ] Authorization (role-based access)
- [ ] Input validation
- [ ] Error handling (no stack traces leaked)

**Commands to find routes:**
```bash
find apps/web/app/api -name "route.ts" -o -name "route.tsx"
```

**Look for:**
- Routes without auth checks
- Direct database access without validation
- Sensitive data in responses

---

## Task 3: Client-Side Data Exposure
**Effort:** 1-2 hours

**Check:**
- [ ] API responses don't include sensitive fields (passwords, tokens, internal IDs)
- [ ] No `console.log` with sensitive data in production code
- [ ] LocalStorage/SessionStorage usage is appropriate
- [ ] No secrets in client-side code

**Commands:**
```bash
# Find console.log statements
grep -r "console.log" apps/web/app --include="*.tsx" --include="*.ts" | head -50

# Check for potential secrets
grep -r "password\|secret\|apiKey\|token" apps/web/lib --include="*.ts"
```

---

## Task 4: Input Validation Audit
**Effort:** 2-3 hours

**Check:**
- [ ] All forms use Zod or similar validation
- [ ] Server-side validation (not just client)
- [ ] SQL/NoSQL injection protection
- [ ] XSS prevention (React handles most, but check dangerouslySetInnerHTML)

**Find forms:**
```bash
grep -r "useForm\|onSubmit\|handleSubmit" apps/web/app --include="*.tsx" | wc -l
```

**Look for:**
- `dangerouslySetInnerHTML` usage
- Direct string interpolation in queries
- Unvalidated URL parameters

---

## Task 5: Environment & Config Security
**Effort:** 1 hour

**Check:**
- [ ] `.env.local` is gitignored
- [ ] No secrets in `.env.example`
- [ ] `NEXT_PUBLIC_*` vars contain only safe values
- [ ] No hardcoded credentials in code

**Commands:**
```bash
# Check gitignore
cat .gitignore | grep env

# Check for hardcoded values
grep -r "sk_live\|pk_live\|api_key.*=" apps/web --include="*.ts" --include="*.tsx"
```

---

## Task 6: Authentication Flow Review
**Effort:** 1-2 hours

**Files:**
- `lib/auth.tsx` or `lib/auth/`
- `app/login/page.tsx`
- `middleware.ts`

**Check:**
- [ ] Session management is secure
- [ ] Token refresh handling
- [ ] Logout clears all sensitive data
- [ ] Protected routes properly guarded
- [ ] No auth bypass vulnerabilities

---

## Output

Create a findings report:

**File:** `docs/SECURITY_AUDIT_37C.md`

**Format:**
```markdown
# Security Audit - Sprint 37C

## Summary
- Critical: X
- High: X
- Medium: X
- Low: X

## Findings

### [CRITICAL/HIGH/MEDIUM/LOW] Finding Title
- **Location:** file path
- **Description:** What the issue is
- **Risk:** What could happen
- **Recommendation:** How to fix
- **Status:** Open/Fixed
```

---

## Status Updates
```bash
echo "$(date +%H:%M) - [area] audited: [findings summary]" >> /Users/nickbodkins/contractoros/.claude-coordination/cli-4-status.txt
```

---

## Important Notes

1. **Do not exploit** - Document only, don't attempt actual attacks
2. **Be thorough** - Check edge cases
3. **Prioritize** - Focus on high-impact areas first
4. **Document everything** - Even if it looks secure, note that you checked
