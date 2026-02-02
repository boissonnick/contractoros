# ContractorOS Launch Checklist

> **Purpose:** Pre-launch verification checklist for beta and production releases
> **Created:** 2026-02-02
> **Last Updated:** 2026-02-02

---

## Overview

This checklist ensures all critical items are verified before deploying ContractorOS to staging or production environments. Complete all sections marked as **Required** before release.

---

## Section 1: Code Quality (Required)

### TypeScript Compilation
- [ ] Run `npx tsc --noEmit` in `apps/web/` - **must pass with zero errors**
- [ ] No `any` types in new code (warnings acceptable for legacy)
- [ ] All imports resolve correctly

```bash
# Verify
cd apps/web && npx tsc --noEmit
```

### Build Verification
- [ ] Production build succeeds: `npm run build`
- [ ] No build warnings that indicate runtime issues
- [ ] Build output size reasonable (< 5MB initial JS)

```bash
# Verify
cd apps/web && npm run build
```

### Linting (Optional but Recommended)
- [ ] ESLint passes (if configured)
- [ ] No console.log statements in production code

---

## Section 2: Testing (Required)

### E2E Test Suites
- [ ] Smoke tests pass (`apps/web/e2e/suites/00-smoke.md`)
- [ ] Authentication tests pass (`apps/web/e2e/suites/01-auth.md`)
- [ ] RBAC security tests pass (`apps/web/e2e/suites/02-rbac.md`)
- [ ] Full regression pass (`apps/web/e2e/suites/27-regression.md`)

### Security Regression (Critical)
- [ ] SEC-001: Client data isolation verified
- [ ] SEC-002: PM cannot access payroll
- [ ] SEC-003: No Firebase permission errors in console

### Mobile Testing
- [ ] Mobile layout works at 375x812 (iPhone)
- [ ] Touch targets 44px minimum
- [ ] Navigation drawer functions

---

## Section 3: Infrastructure (Required)

### Docker Build
- [ ] Docker build succeeds: `./docker-build-local.sh`
- [ ] Container starts without errors
- [ ] Container responds on port 3000/8080

```bash
# Verify
cd apps/web
./docker-build-local.sh
docker stop contractoros-web 2>/dev/null; docker rm contractoros-web 2>/dev/null
docker run -d -p 3000:8080 --name contractoros-web contractoros-web
# Wait 10 seconds, then test
curl http://localhost:3000
```

### Firebase Services
- [ ] Firestore rules deployed: `firebase deploy --only firestore`
- [ ] Firestore indexes deployed (no "requires an index" errors)
- [ ] Cloud Functions deployed (if updated)
- [ ] Authentication configured

```bash
# Deploy Firestore rules and indexes
firebase deploy --only firestore --project contractoros-483812
```

### Cloud Run (Production)
- [ ] Cloud Build triggered and succeeds
- [ ] New revision deployed
- [ ] Health check passes
- [ ] SSL certificate valid

---

## Section 4: Environment Variables (Required)

### Firebase Configuration
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY` set
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` set
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` set
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` set
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` set
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID` set

### API Keys
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` set (for address autocomplete)
- [ ] `MAILGUN_API_KEY` set (for email)
- [ ] `MAILGUN_DOMAIN` set

### AI Assistant (if enabled)
- [ ] `ANTHROPIC_API_KEY` set (for Claude)
- [ ] `GOOGLE_AI_API_KEY` set (for Gemini)
- [ ] `OPENAI_API_KEY` set (if using GPT-4)

### Integrations (if enabled)
- [ ] `QUICKBOOKS_CLIENT_ID` set
- [ ] `QUICKBOOKS_CLIENT_SECRET` set
- [ ] `TWILIO_ACCOUNT_SID` set (if using SMS)
- [ ] `TWILIO_AUTH_TOKEN` set

---

## Section 5: Demo Account (Required for Beta)

### Demo Organization
- [ ] Demo org "Horizon Construction Co." exists
- [ ] Demo users can log in
- [ ] Demo data populated (12 months history)

### Demo Data Verification
- [ ] Projects display (12 total)
- [ ] Clients display (8 total)
- [ ] Invoices display with payment history
- [ ] Time entries display
- [ ] Activities/communications display

```bash
# Run seed scripts if needed
cd scripts
npx ts-node seed-demo-org.ts
npx ts-node seed-demo-projects.ts
npx ts-node seed-demo-financial.ts
npx ts-node seed-demo-activities.ts
```

---

## Section 6: Console Errors (Required)

### Production Build Check
- [ ] No JavaScript errors in console on page load
- [ ] No React hydration warnings
- [ ] No missing resource errors (404s)
- [ ] No Firebase permission errors
- [ ] No CORS errors

### Network Tab Check
- [ ] All API calls return 200/201
- [ ] No failed Firestore queries
- [ ] Assets load from correct CDN

---

## Section 7: Documentation (Required)

### Technical Documentation
- [ ] CLAUDE.md up to date
- [ ] ARCHITECTURE.md reflects current system
- [ ] SPRINT_STATUS.md updated
- [ ] API routes documented (if applicable)

### User Documentation
- [ ] Help docs available at `/help`
- [ ] Key workflows documented
- [ ] Contact/support info available

---

## Section 8: Performance (Recommended)

### Load Times
- [ ] Dashboard loads < 3 seconds
- [ ] Project list loads < 2 seconds
- [ ] No infinite loading states

### Memory & Resources
- [ ] No memory leaks (check after 30 min usage)
- [ ] Reasonable CPU usage
- [ ] WebSocket connections close properly

---

## Section 9: Security (Required)

### Authentication
- [ ] Login required for protected routes
- [ ] Session timeout works (after idle period)
- [ ] Logout clears session completely

### Authorization
- [ ] Role-based access enforced
- [ ] Firestore security rules deployed
- [ ] No sensitive data in client bundle

### Data Protection
- [ ] No API keys exposed in client code
- [ ] Environment variables not in git
- [ ] Secure headers configured (HTTPS, CSP)

---

## Section 10: Monitoring (Recommended for Production)

### Error Tracking
- [ ] Error reporting configured (Sentry, etc.)
- [ ] Alert thresholds set
- [ ] On-call rotation defined

### Logging
- [ ] Cloud Logging enabled
- [ ] Key events logged
- [ ] Log retention configured

### Uptime
- [ ] Health check endpoint exists
- [ ] Uptime monitoring configured
- [ ] Status page set up (optional)

---

## Section 11: Rollback Plan (Required for Production)

### Rollback Preparation
- [ ] Previous working version identified
- [ ] Rollback command documented
- [ ] Database migration reversible (if applicable)

```bash
# Cloud Run Rollback (example)
gcloud run services update-traffic contractoros-web \
  --to-revisions=contractoros-web-PREVIOUS:100 \
  --region=us-west1 \
  --project=contractoros-483812
```

---

## Final Sign-Off

| Item | Status | Verified By | Date |
|------|--------|-------------|------|
| Code Quality | [ ] Pass | | |
| E2E Testing | [ ] Pass | | |
| Infrastructure | [ ] Pass | | |
| Environment Vars | [ ] Pass | | |
| Demo Account | [ ] Pass | | |
| No Console Errors | [ ] Pass | | |
| Documentation | [ ] Pass | | |
| Security | [ ] Pass | | |

### Approval

| Role | Name | Approval | Date |
|------|------|----------|------|
| Developer | | [ ] Approved | |
| QA/Tester | | [ ] Approved | |
| Tech Lead | | [ ] Approved | |

---

## Post-Launch Verification

After deployment, verify:

- [ ] Application accessible at production URL
- [ ] Login works with demo account
- [ ] Dashboard loads with data
- [ ] Create operation works (e.g., new project)
- [ ] No new errors in monitoring

---

## Quick Reference Commands

```bash
# Full verification sequence
cd apps/web

# 1. TypeScript check
npx tsc --noEmit

# 2. Production build
npm run build

# 3. Deploy Firestore
firebase deploy --only firestore --project contractoros-483812

# 4. Docker build & run
./docker-build-local.sh && \
docker stop contractoros-web 2>/dev/null; docker rm contractoros-web 2>/dev/null && \
docker run -d -p 3000:8080 --name contractoros-web contractoros-web

# 5. Test
curl http://localhost:3000

# 6. View logs
docker logs contractoros-web
```

---

_Checklist Version: 1.0 | Created: 2026-02-02_
