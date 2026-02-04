# Sprint 47 - Node.js & Firebase SDK Updates

**Start Date:** 2026-02-04
**Focus:** Node.js 20 → 22 migration + Firebase SDK updates (resolve deploy warnings)
**Estimated Effort:** 8-12 hours (1 day with parallel execution)
**Priority:** P0 - CRITICAL (Node.js 20 EOL in 3 months)

---

## Why This Sprint?

**Problem:** Deploy warnings about Node.js version
**Root Cause:** Node.js 20 approaching EOL (April 30, 2026)
**Solution:** Upgrade to Node.js 22 LTS + update Firebase SDKs
**Impact:** Resolves warnings, improves security, enables future updates

---

## Sprint Objectives

### Primary Goals
1. ✅ Upgrade Node.js 20 → 22 across all environments
2. ✅ Upgrade Firebase Admin SDK 12 → 13 (Cloud Functions)
3. ✅ Upgrade Firebase Functions SDK 5 → 7
4. ✅ Ensure version consistency across web app and functions
5. ✅ Resolve all deploy warnings

### Success Criteria
- [ ] Node.js 22 running locally
- [ ] Docker image builds with Node 22
- [ ] Cloud Functions deploy successfully
- [ ] No Node.js deprecation warnings in logs
- [ ] All E2E smoke tests pass
- [ ] TypeScript compiles without errors

---

## CLI Workstreams

| CLI | Focus | Tasks | Effort | Priority |
|-----|-------|-------|--------|----------|
| **CLI 1** | Node.js local + Docker | 3 | 2-3h | 🔴 P0 |
| **CLI 2** | Firebase SDKs (Functions) | 4 | 3-5h | 🔴 P0 |
| **CLI 3** | Testing & Validation | 3 | 2-3h | 🔴 P0 |
| **CLI 4** | Documentation | 2 | 1-2h | 🟡 P1 |

**Total Estimated Effort:** 8-13 hours (can be parallelized to ~4-6 hours wall-clock)

---

## CLI 1: Node.js Environment Updates

### Tasks

#### Task 1.1: Upgrade Local Node.js (1-2h)
**Description:** Upgrade local development environment to Node.js 22

**Steps:**
```bash
# 1. Install Node.js 22 via Homebrew
brew install node@22

# 2. Unlink Node 20
brew unlink node@20

# 3. Link Node 22
brew link node@22

# 4. Verify installation
node --version  # Should show v22.x.x
npm --version

# 5. Test build
cd /Users/nickbodkins/contractoros/apps/web
npx tsc --noEmit
npm run build
```

**Files Modified:**
- None (system-level change)

**Success Criteria:**
- `node --version` returns v22.x.x
- TypeScript compiles successfully
- `npm run build` completes

**Rollback:**
```bash
brew unlink node@22
brew link node@20
```

---

#### Task 1.2: Update Docker Node Version (30-60 min)
**Description:** Update Dockerfile to use Node.js 22

**Files to Modify:**
- `apps/web/Dockerfile`

**Changes:**
```dockerfile
# BEFORE:
FROM node:20-slim AS deps
FROM node:20-slim AS builder
FROM node:20-slim AS runner

# AFTER:
FROM node:22-slim AS deps
FROM node:22-slim AS builder
FROM node:22-slim AS runner
```

**Validation:**
```bash
cd /Users/nickbodkins/contractoros/apps/web
./docker-build-local.sh

# Verify build succeeds
docker images | grep contractoros-web

# Test container
docker stop contractoros-web 2>/dev/null; docker rm contractoros-web 2>/dev/null
docker run -d -p 3000:8080 --name contractoros-web contractoros-web

# Verify running
docker ps | grep contractoros-web
curl http://localhost:3000
```

**Success Criteria:**
- Docker build completes
- Container starts successfully
- App accessible on localhost:3000

---

#### Task 1.3: Create .nvmrc File (5 min)
**Description:** Add .nvmrc for team consistency

**File to Create:**
- `.nvmrc`

**Content:**
```
22
```

**Why:** Ensures all developers (and Claude sessions) use the same Node version

---

## CLI 2: Firebase SDK Updates

### Tasks

#### Task 2.1: Update Cloud Functions Node Version (10 min)
**Description:** Update functions package.json to Node 22

**File to Modify:**
- `functions/package.json`

**Changes:**
```json
{
  "engines": {
    "node": "22"  // Changed from "20"
  }
}
```

**Validation:**
```bash
cd /Users/nickbodkins/contractoros/functions
npm install
```

---

#### Task 2.2: Upgrade Firebase Admin SDK (1-2h)
**Description:** Upgrade firebase-admin from 12.7.0 to 13.6.0

**File to Modify:**
- `functions/package.json`

**Changes:**
```json
{
  "dependencies": {
    "firebase-admin": "^13.6.0"  // Updated from ^12.0.0
  }
}
```

**Breaking Changes to Check:**
- Auth token verification API
- Firestore query methods
- Initialization patterns

**Files to Audit:**
```
functions/src/index.ts
functions/src/triggers/auth.ts (if exists)
functions/src/triggers/firestore.ts (if exists)
```

**Commands:**
```bash
cd /Users/nickbodkins/contractoros/functions
npm install firebase-admin@latest
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

**Success Criteria:**
- TypeScript compiles without errors
- No breaking API usage found

---

#### Task 2.3: Upgrade Firebase Functions SDK (1-2h)
**Description:** Upgrade firebase-functions from 5.1.1 to 7.0.5

**File to Modify:**
- `functions/package.json`

**Changes:**
```json
{
  "dependencies": {
    "firebase-functions": "^7.0.5"  // Updated from ^5.0.0
  }
}
```

**Breaking Changes to Check:**
- Function declaration syntax
- Trigger options (HTTP, Firestore, Auth, Scheduled)
- Region configuration
- CORS handling

**Example Migration:**
```typescript
// BEFORE (v5):
import * as functions from 'firebase-functions';

export const myFunction = functions.https.onRequest((req, res) => {
  // ...
});

// AFTER (v7) - May need updates depending on actual usage
import { onRequest } from 'firebase-functions/v2/https';

export const myFunction = onRequest((req, res) => {
  // ...
});
```

**Files to Audit:**
```
functions/src/index.ts
functions/src/triggers/*.ts
functions/src/api/*.ts
```

**Commands:**
```bash
cd /Users/nickbodkins/contractoros/functions
npm install firebase-functions@latest
npm run build

# Test with emulator
firebase emulators:start --only functions
```

**Success Criteria:**
- Functions build successfully
- Emulator starts without errors
- All triggers respond correctly

---

#### Task 2.4: Sync Web App Firebase Admin (30 min)
**Description:** Ensure web app uses same Firebase Admin version

**File to Check:**
- `apps/web/package.json`

**Current:** firebase-admin: ^13.6.0 (already up-to-date)

**Validation:**
```bash
cd /Users/nickbodkins/contractoros/apps/web
npm list firebase-admin
# Should show 13.6.0
```

**Action:** No changes needed if already v13.6.0

---

## CLI 3: Testing & Validation

### Tasks

#### Task 3.1: Unit & Type Tests (30-60 min)
**Description:** Verify TypeScript compilation and unit tests

**Commands:**
```bash
# Web app
cd /Users/nickbodkins/contractoros/apps/web
npx tsc --noEmit
npm test

# Functions
cd /Users/nickbodkins/contractoros/functions
npx tsc --noEmit
```

**Success Criteria:**
- 0 TypeScript errors
- All unit tests pass
- No new warnings

---

#### Task 3.2: Local Integration Testing (1-2h)
**Description:** Test full stack locally

**Test Plan:**

1. **Start Local Stack:**
   ```bash
   # Terminal 1: Start Firebase emulator
   cd /Users/nickbodkins/contractoros/functions
   firebase emulators:start

   # Terminal 2: Start web app
   cd /Users/nickbodkins/contractoros/apps/web
   npm run dev
   ```

2. **Test Scenarios:**
   - [ ] User authentication (sign in/out)
   - [ ] Firestore read/write from web app
   - [ ] Cloud Function triggers (test at least 1-2)
   - [ ] API routes responding
   - [ ] No console errors

3. **Docker Test:**
   ```bash
   ./docker-build-local.sh
   docker stop contractoros-web; docker rm contractoros-web
   docker run -d -p 3000:8080 --name contractoros-web contractoros-web
   curl http://localhost:3000/api/health
   ```

**Success Criteria:**
- All test scenarios pass
- No errors in console/logs
- Docker container runs successfully

---

#### Task 3.3: E2E Smoke Tests (1h)
**Description:** Run critical path E2E tests

**Test Suite:** `apps/web/e2e/suites/00-smoke.md`

**Test Cases:**
- [ ] Login with demo account
- [ ] Navigate to dashboard
- [ ] View projects list
- [ ] View clients list
- [ ] Create new task
- [ ] Upload photo
- [ ] Verify real-time updates

**Commands:**
```bash
# Ensure app is running on localhost:3000
# Run smoke tests manually or via Chrome MCP
```

**Success Criteria:**
- ≥ 95% pass rate (47/50+ tests)
- No blocking errors
- Performance comparable to baseline

---

## CLI 4: Documentation & Deployment

### Tasks

#### Task 4.1: Update CLAUDE.md (30 min)
**Description:** Document Node.js version change

**File to Modify:**
- `CLAUDE.md`

**Changes:**
```markdown
## Environment

| Tool | Version | Path |
|------|---------|------|
| Node | v22 | /opt/homebrew/opt/node@22/bin/ |  # Updated from v20
| npm | v10.8.2 | - |
| Firebase CLI | v15.4.0 | `/opt/homebrew/bin/firebase` |

## Critical Commands

# Updated Docker command (now uses Node 22)
./docker-build-local.sh  # Build image (reads .env.local)
```

**Also Update:**
- Any references to Node 20 → Node 22
- Add note about .nvmrc file

---

#### Task 4.2: Update SPRINT_STATUS.md (15 min)
**Description:** Record Sprint 47 completion

**File to Modify:**
- `docs/SPRINT_STATUS.md`

**Changes:**
```markdown
## ✅ Completed Sprints

| Sprint | Focus | Status |
|--------|-------|--------|
| 47 | Node.js 22 + Firebase SDK Updates | ✅ COMPLETE |

## Sprint 47: Node.js & Firebase Updates ✅ COMPLETE

**Duration:** 1 day
**Completed:** 2026-02-04

| Task | Description | Status |
|------|-------------|--------|
| Node.js upgrade | 20 → 22 (local, Docker, functions) | `[x]` ✅ |
| Firebase Admin | 12 → 13 (functions) | `[x]` ✅ |
| Firebase Functions | 5 → 7 (functions) | `[x]` ✅ |
| .nvmrc created | Team consistency | `[x]` ✅ |
| E2E smoke tests | Pass rate ≥ 95% | `[x]` ✅ |
```

---

## File Change Manifest

### Modified Files

| File | Type | Changes |
|------|------|---------|
| `apps/web/Dockerfile` | Infrastructure | Node 20 → 22 |
| `functions/package.json` | Config | Node 20 → 22, Firebase Admin 12 → 13, Functions 5 → 7 |
| `apps/web/package.json` | Config | Node engine >=22 |
| `.nvmrc` | New | Node version 22 |
| `CLAUDE.md` | Docs | Node version references |
| `docs/SPRINT_STATUS.md` | Docs | Sprint 47 completion |

### No Changes Required
- `apps/web/package.json` dependencies (Firebase Admin already v13)
- `cloudbuild.yaml` (uses Dockerfile, automatically picks up Node 22)

---

## Risk Mitigation

### Pre-Sprint Backup

```bash
# 1. Git commit current state
git add -A
git commit -m "Pre-Sprint 47: Backup before Node.js upgrade"

# 2. Tag current version
git tag pre-sprint-47
git push origin pre-sprint-47

# 3. Document current Docker image
docker images | grep contractoros-web | head -1 > .sprint-47-rollback-info.txt

# 4. Document current Cloud Run revision (if deployed)
gcloud run revisions list --service=contractoros-web --region=us-west1 --project=contractoros-483812 | head -2 >> .sprint-47-rollback-info.txt
```

---

## Rollback Plan

### Scenario 1: Local Build Fails

**Symptoms:** Docker build fails, TypeScript errors

**Solution:**
```bash
# Revert changes
git checkout pre-sprint-47

# Reinstall dependencies
cd apps/web && rm -rf node_modules && npm install
cd ../functions && rm -rf node_modules && npm install

# Switch back to Node 20 (if needed)
brew unlink node@22
brew link node@20
```

**Time:** 10-15 minutes

---

### Scenario 2: Cloud Functions Deploy Fails

**Symptoms:** `firebase deploy --only functions` fails

**Solution:**
```bash
# Revert functions/package.json
git checkout HEAD~1 -- functions/package.json

# Reinstall
cd functions && npm install

# Redeploy
firebase deploy --only functions --project contractoros-483812
```

**Time:** 5-10 minutes

---

### Scenario 3: Production Issue After Deploy

**Symptoms:** App works locally but fails in production

**Solution:**
```bash
# 1. Rollback Cloud Run to previous revision
gcloud run services update-traffic contractoros-web \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region=us-west1 \
  --project=contractoros-483812

# 2. Investigate logs
gcloud logging read "resource.type=cloud_run_revision" \
  --limit=50 \
  --project=contractoros-483812

# 3. Fix issue locally, redeploy
```

**Time:** 2-5 minutes (rollback), 30-60 minutes (fix)

---

## Success Metrics

### Before Sprint 47 (Baseline)

| Metric | Value |
|--------|-------|
| Node.js version | 20.19.6 |
| Firebase Admin (functions) | 12.7.0 |
| Firebase Functions | 5.1.1 |
| Deploy warnings | YES |
| TypeScript errors | 0 |
| Docker build time | ~3-4 min |
| E2E test pass rate | 94% (47/50) |

### After Sprint 47 (Target)

| Metric | Target |
|--------|--------|
| Node.js version | 22.x.x |
| Firebase Admin (functions) | 13.6.0 |
| Firebase Functions | 7.0.5 |
| Deploy warnings | NO |
| TypeScript errors | 0 |
| Docker build time | ≤ 5 min |
| E2E test pass rate | ≥ 95% |

---

## Breaking Changes Summary

### Node.js 20 → 22
- **Impact:** LOW (highly compatible)
- **Changes:** Internal V8 updates, minimal API changes
- **Testing Focus:** Runtime behavior, module loading

### Firebase Admin 12 → 13
- **Impact:** MEDIUM (some API changes)
- **Changes:** Auth API updates, Firestore query improvements
- **Testing Focus:** Auth token verification, Firestore queries

### Firebase Functions 5 → 7
- **Impact:** HIGH (new v2 API recommended)
- **Changes:** Function declaration syntax, trigger options
- **Testing Focus:** All Cloud Function triggers

---

## Post-Sprint Actions

After Sprint 47 is complete:

1. **Deploy to Production:**
   ```bash
   # Trigger Cloud Build
   git push origin main

   # Monitor deployment
   gcloud builds list --limit=1 --project=contractoros-483812
   ```

2. **Monitor Logs:**
   ```bash
   # Check for errors
   gcloud logging read "resource.type=cloud_run_revision" \
     --limit=100 \
     --project=contractoros-483812 \
     --format="table(timestamp,jsonPayload.message)"
   ```

3. **Verify Deploy Warnings:**
   - Check GCP Console for build warnings
   - Should no longer see Node.js 20 deprecation warnings

4. **Update Roadmap:**
   - Mark Sprint 47 complete in MASTER_ROADMAP.md
   - Begin Sprint 48 planning (Next.js upgrade)

---

## Dependencies

### Blocks
- Sprint 48 (Next.js 15 requires stable Node environment)
- Sprint 49 (React 19 requires Next.js 15)

### Blocked By
- None (can start immediately)

---

## Parallel Execution Strategy

### Batch 1 (Parallel - 2h)
- **CLI 1:** Upgrade local Node.js + create .nvmrc
- **CLI 2:** Update functions/package.json (Node + Firebase Admin)
- **CLI 4:** Begin CLAUDE.md updates

### Batch 2 (Sequential - 2-3h)
- **CLI 1:** Update Dockerfile + rebuild Docker
- **CLI 2:** Upgrade Firebase Functions SDK + audit code
- **CLI 3:** Run unit tests

### Batch 3 (Sequential - 3-4h)
- **CLI 3:** Integration testing (local stack)
- **CLI 3:** E2E smoke tests
- **CLI 4:** Finalize documentation

**Total Wall-Clock Time:** 6-8 hours (vs. 8-13h sequential)

---

## Communication Plan

**Before Sprint:**
- Document current state in git
- Tag release: `pre-sprint-47`

**During Sprint:**
- Update checkboxes in this document as tasks complete
- Commit frequently with clear messages

**After Sprint:**
- Update SPRINT_STATUS.md
- Notify team (if applicable) of Node.js version change
- Update VERSION_AUDIT_FEB_2026.md with completion status

---

## Related Documents

- `docs/VERSION_AUDIT_FEB_2026.md` - Full version audit
- `docs/SPRINT_STATUS.md` - Overall sprint tracking
- `CLAUDE.md` - Project instructions (to be updated)
- `.claude-coordination/sprint-48-overview.md` - Next sprint (Next.js)

---

**Sprint Owner:** Development Team
**Sprint Status:** 🏗️ READY TO START
**Next Sprint:** Sprint 48 - Next.js 14 → 15 → 16 Migration
