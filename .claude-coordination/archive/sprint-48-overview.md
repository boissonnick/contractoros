# Sprint 48 - Next.js 14→16 + React 18→19 Upgrades

**Start Date:** 2026-02-04
**Focus:** Major framework upgrades (Next.js + React)
**Estimated Effort:** 12-18 hours (2-3 days)
**Priority:** P0 - CRITICAL
**Status:** 🔴 READY TO START

---

## Why This Sprint?

**Problem:** Outdated Next.js (14.2.35) and React (18.3.1)
**Root Cause:** Framework versions lag behind latest releases
**Solution:** Upgrade to Next.js 16 + React 19
**Impact:** Security updates, new features, better performance

---

## Sprint Objectives

### Primary Goals
1. Upgrade Next.js 14.2.35 → 15 → 16.1.6
2. Upgrade React 18.3.1 → 19.2.4
3. Handle breaking changes (async cookies/headers)
4. Ensure TypeScript compiles without errors
5. Pass E2E smoke tests

### Success Criteria
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` completes
- [ ] Docker image builds successfully
- [ ] E2E smoke tests ≥ 95% pass rate
- [ ] No console errors in dev mode

---

## Breaking Changes to Address

### Next.js 14 → 15 Breaking Changes

1. **Async Request APIs** (CRITICAL)
   - `cookies()`, `headers()`, `params`, `searchParams` are now async
   - Must add `await` to all usages

   ```typescript
   // BEFORE (Next.js 14):
   const cookieStore = cookies();

   // AFTER (Next.js 15+):
   const cookieStore = await cookies();
   ```

2. **Fetch Caching**
   - Default changed from `force-cache` to `no-store`
   - May need explicit cache options

3. **Server Actions**
   - `revalidatePath` / `revalidateTag` behavior changes

### Next.js 15 → 16 Breaking Changes

1. **Turbopack Stable**
   - Now default bundler
   - Should work without changes

2. **React 19 Requirement**
   - Must upgrade React simultaneously

### React 18 → 19 Breaking Changes

1. **No major API changes** for our usage
2. **Server Components** already supported
3. **useFormStatus** / **useActionState** available

---

## Migration Plan

### Day 1: Next.js 14 → 15

#### Task 1.1: Audit Async APIs (1-2h)
```bash
# Find all cookies() usages
grep -rn "cookies()" apps/web/app --include="*.ts" --include="*.tsx"

# Find all headers() usages
grep -rn "headers()" apps/web/app --include="*.ts" --include="*.tsx"

# Find params usage in page components
grep -rn "params" apps/web/app --include="page.tsx"
```

#### Task 1.2: Update Package Versions (30min)
```bash
cd apps/web
npm install next@15 react@18 react-dom@18
```

#### Task 1.3: Fix Async APIs (2-4h)
- Add `await` to all `cookies()` calls
- Add `await` to all `headers()` calls
- Convert page components to async where using params

#### Task 1.4: Test Build (1h)
```bash
npx tsc --noEmit
npm run build
npm run dev
```

---

### Day 2: Next.js 15 → 16 + React 19

#### Task 2.1: Upgrade to Next.js 16 + React 19 (1h)
```bash
cd apps/web
npm install next@16 react@19 react-dom@19
npm install @types/react@19 @types/react-dom@19 --save-dev
```

#### Task 2.2: Fix Type Errors (2-4h)
- Address any new TypeScript errors
- Update deprecated APIs

#### Task 2.3: Test Interactive Components (2h)
- Forms
- Modals
- Dropdowns
- Date pickers

#### Task 2.4: Full Build Test (1h)
```bash
npx tsc --noEmit
npm run build
./docker-build-local.sh
```

---

### Day 3: Testing & Polish

#### Task 3.1: E2E Smoke Tests (2h)
- Run `apps/web/e2e/suites/00-smoke.md`
- Target: ≥ 95% pass rate

#### Task 3.2: Manual Testing (2h)
- Login/logout flow
- Dashboard navigation
- Create project
- Create invoice
- File uploads

#### Task 3.3: Fix Remaining Issues (2-4h)
- Address any failing tests
- Fix console errors/warnings

---

## Files Likely to Change

### High Impact (Async API Changes)
```
apps/web/app/dashboard/layout.tsx
apps/web/app/dashboard/*/page.tsx
apps/web/app/api/*/route.ts
apps/web/lib/auth-helpers.ts
apps/web/middleware.ts
```

### Medium Impact (React Updates)
```
apps/web/components/**/*.tsx
apps/web/package.json
apps/web/package-lock.json
```

### Low Impact (Config)
```
apps/web/next.config.js
apps/web/tsconfig.json
```

---

## Rollback Plan

### If Build Fails
```bash
# Revert package.json changes
git checkout HEAD~1 -- apps/web/package.json apps/web/package-lock.json

# Reinstall old versions
cd apps/web && rm -rf node_modules && npm install
```

### If Production Issues
```bash
# Rollback Cloud Run to previous revision
gcloud run services update-traffic contractoros-web \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region=us-west1 \
  --project=contractoros-483812
```

---

## Dependencies

### Blocks
- Sprint 49+ (all future sprints require stable framework)

### Blocked By
- Sprint 47 ✅ COMPLETE (Node.js 22 required for React 19)

---

## Reference Links

- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/12/05/react-19-upgrade-guide)

---

## Quick Start

```bash
# 1. Verify Node 22 is active
node --version  # Should show v22.x.x

# 2. Start with audit
grep -rn "cookies()" apps/web/app --include="*.ts" --include="*.tsx"
grep -rn "headers()" apps/web/app --include="*.ts" --include="*.tsx"

# 3. Check current versions
cd apps/web && npm list next react

# 4. Begin upgrade
npm install next@15 react@18 react-dom@18
npx tsc --noEmit
```

---

**Sprint Owner:** Development Team
**Sprint Status:** 🔴 READY TO START
**Previous Sprint:** Sprint 47 - Node.js 22 + Firebase SDKs ✅ COMPLETE
