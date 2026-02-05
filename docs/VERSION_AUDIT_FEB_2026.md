# ContractorOS Version Audit & Update Plan

**Date:** 2026-02-04
**Status:** ✅ CRITICAL UPDATES COMPLETE - Sprints 47-48 done
**Estimated Remaining Effort:** 10-15 hours (1-2 days) for optional updates

---

## Quick Reference: Critical Updates

> **Note:** Sprints 47-48 are **COMPLETE** (Node.js 22, Next.js 16, React 19)
> See `SPRINT_STATUS.md` for completion details.

### 🔴 Critical Updates (COMPLETE ✅)

| Sprint | Update | Current | Status |
|--------|--------|---------|--------|
| **47** | Node.js 20 → 22 | 22.x | ✅ DONE |
| **47** | Firebase Admin 12 → 13 | 13.6.0 | ✅ DONE |
| **47** | Firebase Functions 5 → 7 | 7.0.5 | ✅ DONE |
| **48** | Next.js 14 → 16 | 16.1.6 | ✅ DONE |
| **48** | React 18 → 19 | 19.2.4 | ✅ DONE |

### 🟡 Recommended Updates (Future Sprints)

| Package | Current | Latest | Sprint | Priority |
|---------|---------|--------|--------|----------|
| Tailwind CSS | 3.4.19 | 4.1.18 | 60 | P2 |
| Zod | 3.25.76 | 4.3.6 | 59 | P3 |
| ESLint | 8.57.1 | 9.39.2 | 59 | P3 |

---

## Executive Summary

**Critical Findings (RESOLVED ✅):**
- ✅ **Node.js 20.x → 22.x** - Upgraded in Sprint 47
- ✅ **React 18 → 19** - Upgraded in Sprint 48
- ✅ **Next.js 14 → 16** - Upgraded in Sprint 48
- ✅ **Firebase Admin SDK** - Upgraded in Sprint 47 (13.6.0)
- ✅ **Firebase Functions SDK** - Upgraded in Sprint 47 (7.0.5)
- 🟡 **Tailwind CSS 3 → 4** - Deferred to Sprint 60 (optional)
- 🟡 **Zod 3 → 4** - Deferred to Sprint 59 (optional)

**Risk Level:** LOW - All critical updates complete

---

## Current Version Matrix

### Runtime Environment

| Component | Current | Latest | Status | Priority |
|-----------|---------|--------|--------|----------|
| **Node.js (local)** | 20.19.6 | 22.x LTS | ⚠️ Near EOL | P1 |
| **Node.js (Docker)** | 20-slim | 22-slim | ⚠️ Update needed | P1 |
| **Node.js (Functions)** | 20 | 22 | ⚠️ Update needed | P1 |
| **npm** | 10.8.2 | 10.x | ✅ Current | - |
| **Firebase CLI** | 15.4.0 | 15.x | ✅ Current | - |

**Node.js 20 EOL:** April 30, 2026 (~3 months away)
**Node.js 22 LTS:** Active until April 2027

---

## Web App Dependencies (apps/web/package.json)

### 🔴 Critical Updates (Breaking Changes)

| Package | Current | Latest | Breaking | Priority | Risk |
|---------|---------|--------|----------|----------|------|
| **next** | 14.2.35 | 16.1.6 | ✅ YES | P0 | HIGH |
| **react** | 18.3.1 | 19.2.4 | ✅ YES | P0 | HIGH |
| **react-dom** | 18.3.1 | 19.2.4 | ✅ YES | P0 | HIGH |
| **tailwindcss** | 3.4.19 | 4.1.18 | ✅ YES | P1 | MEDIUM |
| **firebase** | 11.10.0 | 12.8.0 | ⚠️ MAYBE | P1 | MEDIUM |
| **zod** | 3.25.76 | 4.3.6 | ✅ YES | P2 | LOW |

### 🟡 Major Updates (Non-Breaking)

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| **firebase-admin** | 13.6.0 | 13.6.0 | ✅ Up-to-date in web |
| **@types/react** | 18.3.27 | 19.2.11 | Update with React 19 |
| **@types/react-dom** | 18.3.7 | 19.2.3 | Update with React 19 |
| **eslint** | 8.57.1 | 9.39.2 | Major version, needs config changes |
| **eslint-config-next** | 14.2.35 | 16.1.6 | Update with Next.js |

### ✅ Minor Updates (Safe)

| Package | Current | Latest | Action |
|---------|---------|--------|--------|
| autoprefixer | 10.4.23 | 10.4.24 | Safe update |
| framer-motion | 12.29.2 | 12.31.0 | Safe update |
| @types/node | 20.19.30 | 20.19.31 | Safe update (stay on v20) |

---

## Cloud Functions Dependencies (functions/package.json)

### 🔴 Critical Updates

| Package | Current | Latest | Breaking | Priority | Risk |
|---------|---------|--------|----------|----------|------|
| **firebase-admin** | 12.7.0 | 13.6.0 | ⚠️ MAYBE | P0 | HIGH |
| **firebase-functions** | 5.1.1 | 7.0.5 | ✅ YES | P0 | HIGH |
| **@anthropic-ai/sdk** | 0.39.0 | 0.72.1 | ⚠️ MAYBE | P1 | MEDIUM |
| **@google-cloud/bigquery** | 7.9.4 | 8.1.1 | ⚠️ MAYBE | P2 | LOW |

**Critical Issue:** Firebase Admin SDK version mismatch between web (v13) and functions (v12) can cause compatibility issues.

---

## Breaking Changes Analysis

### 1. React 18 → 19 (HIGH IMPACT)

**Breaking Changes:**
- `ReactDOM.render` → `createRoot` (already migrated in Next.js)
- `act()` changes in testing utilities
- New JSX transform requirements
- `useEffect` timing changes
- Server Components become default in Next.js

**Migration Path:**
1. ✅ Already using React 18 concurrent features
2. ✅ Already using App Router (React Server Components)
3. ⚠️ Need to audit custom hooks for `useEffect` changes
4. ⚠️ Need to update testing utilities

**Estimated Effort:** 4-6 hours (testing focus)

---

### 2. Next.js 14 → 15 → 16 (VERY HIGH IMPACT)

**Next.js 15 Breaking Changes:**
- Turbopack becomes default for `next dev`
- React 19 becomes minimum version
- `fetch` caching changes (no longer cached by default)
- `next/headers` now async (all cookies/headers calls need `await`)
- Image optimization changes

**Next.js 16 Changes:**
- Enhanced caching strategies
- Improved Turbopack performance
- Better React 19 integration

**Migration Path:**
1. Audit all `cookies()` and `headers()` calls → add `await`
2. Review all `fetch` calls for caching expectations
3. Test Turbopack locally
4. Update Server Component patterns

**Estimated Effort:** 8-12 hours (major refactoring)

**Files Affected:**
- `app/**/page.tsx` - Server Components using cookies/headers
- `middleware.ts` - May need async updates
- `lib/firebase/server.ts` - Server-side Firebase calls

---

### 3. Tailwind CSS 3 → 4 (MEDIUM IMPACT)

**Breaking Changes:**
- New color palette system
- Updated spacing scale
- Different utility class names
- New configuration format
- Removed deprecated utilities

**Migration Path:**
1. Run Tailwind 4 migration tool
2. Audit custom colors in `tailwind.config.js`
3. Test all UI components for visual regressions
4. Update Tailwind plugins if any

**Estimated Effort:** 6-10 hours (visual testing focus)

**Recommendation:** Delay until after Next.js 16 upgrade (lower priority)

---

### 4. Firebase Admin SDK 12 → 13 (HIGH IMPACT - Functions)

**Breaking Changes:**
- Updated Auth API
- Firestore query API changes
- Different initialization patterns

**Migration Path:**
1. Update functions/package.json
2. Audit all Cloud Functions for deprecated API usage
3. Test auth token verification
4. Test Firestore queries in functions

**Estimated Effort:** 3-5 hours

---

### 5. Firebase Functions SDK 5 → 7 (HIGH IMPACT)

**Breaking Changes:**
- New function declaration syntax
- Updated trigger options
- Different region configuration
- Changed CORS handling

**Migration Path:**
1. Update function exports
2. Review region configurations
3. Test all triggers (HTTP, Firestore, Auth, Scheduled)
4. Update CORS if needed

**Estimated Effort:** 4-6 hours

---

### 6. Zod 3 → 4 (LOW-MEDIUM IMPACT)

**Breaking Changes:**
- Schema API changes
- Different error messages
- Updated refinements syntax

**Migration Path:**
1. Audit all Zod schemas (form validation)
2. Update error handling
3. Test all forms

**Estimated Effort:** 2-4 hours

**Recommendation:** Delay until after React/Next.js upgrades

---

## Node.js 20 → 22 Migration Plan

### Why Upgrade?

- **Node.js 20 EOL:** April 30, 2026 (3 months away)
- **Node.js 22 LTS:** Active until April 2027
- **Security updates** will stop for Node 20
- **Deploy warnings** likely related to Node 20 deprecation

### What Changes?

**Node.js 22 Features:**
- V8 12.4 (improved performance)
- Better ES modules support
- Faster startup times
- Enhanced security features

**Breaking Changes:**
- Minimal - mostly internal
- Some deprecated APIs removed
- OpenSSL 3.x changes

### Migration Checklist

1. **Local Environment**
   ```bash
   brew install node@22
   brew unlink node@20
   brew link node@22
   ```

2. **Dockerfile** (apps/web/Dockerfile)
   ```dockerfile
   FROM node:22-slim AS deps
   FROM node:22-slim AS builder
   FROM node:22-slim AS runner
   ```

3. **Cloud Functions** (functions/package.json)
   ```json
   "engines": {
     "node": "22"
   }
   ```

4. **Web App** (apps/web/package.json)
   ```json
   "engines": {
     "node": ">=22"
   }
   ```

5. **Create .nvmrc** (for team consistency)
   ```
   22
   ```

6. **Update CLAUDE.md**
   ```markdown
   | Node | v22 | /opt/homebrew/opt/node@22/bin/ |
   ```

**Estimated Effort:** 1-2 hours

**Risk:** LOW - Node.js 22 is highly compatible with 20

---

## Recommended Sprint Plan

### Sprint 47: Node.js & Firebase Updates (Day 1 - 2-4 hours)

**Priority:** P0 - Addresses deploy warnings

**Tasks:**
1. ✅ Upgrade Node.js 20 → 22 (local, Docker, functions)
2. ✅ Create .nvmrc file
3. ✅ Upgrade firebase-admin 12 → 13 in Cloud Functions
4. ✅ Upgrade firebase-functions 5 → 7 in Cloud Functions
5. ✅ Update firebase-admin to match in web app (if needed)
6. ✅ Test all Cloud Functions locally
7. ✅ Deploy functions to staging
8. ✅ Run E2E smoke tests
9. ✅ Update CLAUDE.md with new Node version

**Breaking Change Risk:** LOW-MEDIUM
**Rollback Plan:** Revert package.json + Dockerfile, redeploy

---

### Sprint 48: Next.js 14 → 15 Migration (Day 2-3 - 6-10 hours)

**Priority:** P0 - React 19 dependency

**Phase 1: Preparation (2 hours)**
1. Research Next.js 15 breaking changes
2. Audit codebase for `cookies()`, `headers()` usage
3. Audit all `fetch()` calls for caching assumptions
4. Create migration checklist

**Phase 2: Upgrade (2-3 hours)**
1. Update `next` to 15.x
2. Update `eslint-config-next` to match
3. Add `await` to all `cookies()` / `headers()` calls
4. Review `fetch()` caching strategy
5. Test with Turbopack locally

**Phase 3: Testing (2-3 hours)**
1. Run `npx tsc --noEmit`
2. Test all Server Components
3. Test middleware
4. Test API routes
5. Run E2E regression suite

**Phase 4: Next.js 15 → 16 (2 hours)**
1. Update to Next.js 16.x
2. Test for regressions
3. Validate build output

**Breaking Change Risk:** HIGH
**Rollback Plan:** Revert package.json, rebuild Docker

---

### Sprint 49: React 18 → 19 Migration (Day 3-4 - 4-6 hours)

**Priority:** P0 - Required for Next.js 15+

**Phase 1: Preparation (1 hour)**
1. Research React 19 breaking changes
2. Audit custom hooks for `useEffect` patterns
3. Audit tests for `act()` usage

**Phase 2: Upgrade (1-2 hours)**
1. Update `react`, `react-dom` to 19.x
2. Update `@types/react`, `@types/react-dom`
3. Update testing libraries if needed
4. Fix TypeScript errors

**Phase 3: Testing (2-3 hours)**
1. Run `npx tsc --noEmit`
2. Test all interactive components
3. Test forms (React Hook Form compatibility)
4. Test animations (Framer Motion)
5. Run full E2E regression suite

**Breaking Change Risk:** MEDIUM-HIGH
**Rollback Plan:** Revert package.json + package-lock.json, npm install

**Note:** This must happen AFTER Next.js 15, as Next 15 requires React 19.

---

### Sprint 50: Minor Updates & Cleanup (Day 4 - 2-3 hours)

**Priority:** P2 - Non-breaking improvements

**Tasks:**
1. ✅ Update @anthropic-ai/sdk in functions (0.39 → 0.72)
2. ✅ Update framer-motion patch version
3. ✅ Update autoprefixer
4. ✅ Update @types/node to 22.x
5. ✅ Update @google-cloud/bigquery (if no breaking changes)
6. ✅ Run `npm audit` and address vulnerabilities
7. ✅ Test all updated packages
8. ✅ Document any API changes in CLAUDE.md

**Breaking Change Risk:** LOW

---

### Sprint 51: Tailwind CSS 4 Migration (OPTIONAL - Day 5 - 6-10 hours)

**Priority:** P3 - Nice-to-have, not urgent

**Recommendation:** DELAY until React/Next.js migrations are stable

**Tasks:**
1. Install Tailwind CSS 4
2. Run migration tool
3. Update tailwind.config.js
4. Audit all UI components for visual changes
5. Fix any broken utility classes
6. Test responsive layouts
7. Test dark mode (if implemented)
8. Full visual regression testing

**Breaking Change Risk:** MEDIUM (visual changes)

---

### Sprint 52: Zod 4 Migration (OPTIONAL - Day 5 - 2-4 hours)

**Priority:** P3 - Nice-to-have, not urgent

**Recommendation:** DELAY until after Sprint 49

**Tasks:**
1. Update zod to 4.x
2. Audit all schemas in forms
3. Update refinements if needed
4. Test all form validation
5. Update error handling

**Breaking Change Risk:** LOW-MEDIUM

---

## Risk Assessment

### High-Risk Migrations

1. **Next.js 14 → 16** (Sprint 48)
   - **Risk:** Server Component breaking changes
   - **Mitigation:** Thorough testing, staged rollout
   - **Rollback Time:** 15-30 minutes

2. **React 18 → 19** (Sprint 49)
   - **Risk:** Hook behavior changes
   - **Mitigation:** Comprehensive E2E tests
   - **Rollback Time:** 15-30 minutes

3. **Firebase Functions 5 → 7** (Sprint 47)
   - **Risk:** Broken Cloud Functions
   - **Mitigation:** Test in emulator, deploy one function at a time
   - **Rollback Time:** 5-10 minutes

### Medium-Risk Migrations

1. **Node.js 20 → 22** (Sprint 47)
   - **Risk:** Build/runtime incompatibilities
   - **Mitigation:** Node 22 is highly compatible with 20
   - **Rollback Time:** 20-30 minutes (rebuild Docker)

2. **Firebase Admin 12 → 13** (Sprint 47)
   - **Risk:** Auth/Firestore API changes
   - **Mitigation:** Incremental testing
   - **Rollback Time:** 10-15 minutes

### Low-Risk Migrations

1. **Minor version bumps** (Sprint 50)
2. **Anthropic SDK** (Sprint 50)
3. **@types/* packages** (Sprint 50)

---

## Testing Strategy

### Per-Sprint Testing

**Sprint 47 (Node.js + Firebase):**
- ✅ Firebase emulator (functions)
- ✅ Local Docker build
- ✅ Test Cloud Function triggers
- ✅ E2E smoke tests (auth, Firestore reads/writes)

**Sprint 48 (Next.js):**
- ✅ TypeScript compile (`npx tsc --noEmit`)
- ✅ Local dev server (`npm run dev`)
- ✅ Production build (`npm run build`)
- ✅ Docker build test
- ✅ E2E regression suite (00-smoke.md)
- ✅ Server Component testing
- ✅ API route testing

**Sprint 49 (React):**
- ✅ TypeScript compile
- ✅ Interactive component testing (forms, modals)
- ✅ Animation testing (Framer Motion)
- ✅ Full E2E regression (27-regression.md, 2-3 hours)

**Sprint 50 (Minor Updates):**
- ✅ TypeScript compile
- ✅ Unit tests (`npm test`)
- ✅ Integration smoke tests

---

## Rollback Procedures

### Immediate Rollback (Production Emergency)

**If deployed to production and critical bug found:**

```bash
# 1. Rollback Cloud Run to previous revision (2 minutes)
gcloud run services update-traffic contractoros-web \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region=us-west1 \
  --project=contractoros-483812

# 2. Rollback Cloud Functions (if needed)
firebase deploy --only functions --project contractoros-483812
# (After reverting functions/ directory in git)

# 3. Verify rollback
curl https://contractoros-web-[hash]-uw.a.run.app/api/health
```

### Local Rollback (Dev Environment)

```bash
# 1. Revert package.json changes
git checkout HEAD~1 -- package.json package-lock.json

# 2. Reinstall dependencies
npm install

# 3. Rebuild Docker
./docker-build-local.sh

# 4. Verify
npx tsc --noEmit
docker ps
```

---

## Pre-Migration Checklist

Before starting Sprint 47:

- [ ] Backup current production database (Firestore export)
- [ ] Create git branch: `version-updates-sprint-47-52`
- [ ] Document current Docker image SHA
- [ ] Document current Cloud Run revision ID
- [ ] Run full E2E regression suite on current version (baseline)
- [ ] Ensure all current tests pass
- [ ] Review Cloud Run/Cloud Functions logs for any existing issues

---

## Post-Migration Validation

After completing each sprint:

### Sprint 47 (Node.js + Firebase)
- [ ] Cloud Functions responding correctly
- [ ] Firebase Admin SDK auth working
- [ ] Firestore queries working in functions
- [ ] No Node.js deprecation warnings in logs

### Sprint 48 (Next.js)
- [ ] All pages render correctly
- [ ] Server Components working
- [ ] Middleware functioning
- [ ] API routes responding
- [ ] Build output size comparable

### Sprint 49 (React)
- [ ] All interactive components working
- [ ] Forms submitting correctly
- [ ] Animations smooth
- [ ] No console errors

### Sprint 50 (Minor Updates)
- [ ] No TypeScript errors
- [ ] No security vulnerabilities
- [ ] All features functioning

---

## Success Metrics

### Performance Metrics (Before/After)

| Metric | Current (Baseline) | Target (After Upgrades) |
|--------|-------------------|-------------------------|
| Docker image size | ~120 MB | ≤ 130 MB |
| Build time | ~3-4 min | ≤ 5 min |
| Cold start time | ~2-3 sec | ≤ 3 sec |
| Page load time (dashboard) | ~1.5 sec | ≤ 2 sec |
| TypeScript compile time | ~15 sec | ≤ 20 sec |

### Quality Metrics

| Metric | Target |
|--------|--------|
| TypeScript errors | 0 |
| ESLint errors | 0 |
| E2E test pass rate | ≥ 95% |
| Security vulnerabilities (npm audit) | 0 high/critical |
| Console errors (production) | 0 |

---

## Dependencies Between Sprints

```
Sprint 47 (Node.js + Firebase)
    ↓ (Can proceed independently)
    ↓
Sprint 48 (Next.js 14 → 15 → 16)
    ↓ (Next 15 requires React 19)
    ↓
Sprint 49 (React 18 → 19)
    ↓ (Optional sprints after core updates)
    ↓
Sprint 50 (Minor Updates) → Sprint 51 (Tailwind 4) → Sprint 52 (Zod 4)
```

**Critical Path:** Sprint 47 → 48 → 49 (3-4 days total)
**Optional Path:** Sprint 50 → 51 → 52 (additional 2-3 days)

---

## Cost-Benefit Analysis

### Benefits of Upgrading

1. **Security:** Node.js 20 EOL in 3 months → no security patches
2. **Performance:** Next.js 16 + React 19 + Node 22 = faster runtime
3. **Developer Experience:** Better error messages, improved tooling
4. **Future-Proofing:** Stay current with ecosystem
5. **Deploy Warnings:** Resolve Node.js deprecation warnings

### Costs of Upgrading

1. **Time:** 15-25 hours (2-3 days) for core updates
2. **Risk:** Breaking changes could introduce bugs
3. **Testing:** Full regression testing required
4. **Learning Curve:** New APIs to understand

### Costs of NOT Upgrading

1. **Security Risk:** Unpatched vulnerabilities after April 2026
2. **Deploy Issues:** Increasing warnings/errors from GCP
3. **Technical Debt:** Falling further behind ecosystem
4. **Hiring/Onboarding:** Harder to find devs familiar with old versions
5. **Library Support:** Newer packages may not support old versions

**Recommendation:** Upgrade ASAP, starting with Sprint 47 (Node.js + Firebase)

---

## Communication Plan

### Stakeholder Updates

**After Sprint 47:**
- Node.js upgraded to 22 (security + performance)
- Firebase SDKs updated (compatibility)
- No user-facing changes

**After Sprint 48:**
- Next.js upgraded to 16 (latest)
- Performance improvements expected
- No feature changes

**After Sprint 49:**
- React upgraded to 19 (latest)
- Improved UI performance
- No visual changes

---

## Appendix A: Current Package Versions

### Web App (apps/web/package.json)

```json
{
  "dependencies": {
    "next": "^14.2.35",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "firebase": "^11.10.0",
    "firebase-admin": "^13.6.0",
    "tailwindcss": "^3.4.19",
    "zod": "^3.25.23"
  },
  "engines": {
    "node": ">=20"
  }
}
```

### Cloud Functions (functions/package.json)

```json
{
  "dependencies": {
    "firebase-admin": "^12.7.0",
    "firebase-functions": "^5.1.1",
    "@anthropic-ai/sdk": "^0.39.0"
  },
  "engines": {
    "node": "20"
  }
}
```

---

## Appendix B: Commands Reference

### Version Checking

```bash
# Check current versions
node --version
npm --version
firebase --version

# Check outdated packages
cd apps/web && npm outdated
cd functions && npm outdated

# Check for security vulnerabilities
npm audit
```

### Upgrade Commands

```bash
# Update specific package
npm install package-name@latest

# Update all patch/minor versions
npm update

# Reinstall all packages
rm -rf node_modules package-lock.json
npm install
```

### Testing Commands

```bash
# Type check
npx tsc --noEmit

# Run tests
npm test

# Build production
npm run build

# Docker rebuild
./docker-build-local.sh
docker stop contractoros-web; docker rm contractoros-web
docker run -d -p 3000:8080 --name contractoros-web contractoros-web
```

---

## Appendix C: Further Reading

- [Node.js 22 Release Notes](https://nodejs.org/en/blog/release/v22.0.0)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [Next.js 15 Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16)
- [Firebase Admin SDK v13 Release Notes](https://firebase.google.com/support/release-notes/admin/node)
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)

---

**Document Version:** 1.0
**Next Review:** After Sprint 49 completion
**Owner:** Development Team
