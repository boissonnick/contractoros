# ContractorOS Multi-Session Development Guide

> **Purpose:** Setup parallel Claude Code sessions for maximum development velocity
> **Created:** 2026-02-02
> **Author:** Controller Session

---

## Overview

Running multiple Claude Code sessions in parallel allows you to:
- **Build features** while **running tests** simultaneously
- **Deploy Firebase rules** while **developing UI**
- **Maintain coordination** through a controller session
- **Avoid context limits** by distributing work

---

## Terminal Setup Instructions

### Option A: Same Directory, Different Roles (Simpler)

Open **4 terminal windows/tabs**. Each runs Claude Code in the same directory but with different prompts.

```bash
# TERMINAL 1 — CONTROLLER (this session)
cd ~/contractoros
claude

# When Claude starts, paste:
"You are the CONTROLLER session. Your responsibilities:
- Maintain CLAUDE.md and SPRINT_STATUS.md
- Coordinate work across sessions
- Review and merge changes
- Plan sprints and prioritize tasks
- DO NOT edit: components/, lib/hooks/, firestore.rules"
```

```bash
# TERMINAL 2 — DEV SPRINT
cd ~/contractoros
claude

# When Claude starts, paste:
"You are the DEV SPRINT session. Your responsibilities:
- Build UI components in components/
- Create pages in app/dashboard/
- Write hooks in lib/hooks/
- Run 'npx tsc --noEmit' frequently
- DO NOT edit: CLAUDE.md, firestore.rules, functions/"
```

```bash
# TERMINAL 3 — DATABASE
cd ~/contractoros
claude

# When Claude starts, paste:
"You are the DATABASE session. Your responsibilities:
- Edit firestore.rules for new collections
- Add indexes to firestore.indexes.json
- Write Cloud Functions in functions/
- Deploy: firebase deploy --only firestore
- DO NOT edit: components/, app/, CLAUDE.md"
```

```bash
# TERMINAL 4 — E2E TESTING
cd ~/contractoros
claude

# When Claude starts, paste:
"You are the E2E TESTING session. Your responsibilities:
- Run tests using Chrome MCP
- Document test results in e2e/
- Report bugs back to other sessions via SPRINT_STATUS.md
- DO NOT edit source code directly"
```

---

### Option B: Git Worktrees (More Isolated)

For truly parallel work with no merge conflicts:

```bash
# 1. Create branches for each role
git checkout main
git branch feature/sprint-19-dev
git branch feature/sprint-19-database

# 2. Create worktrees (separate directories)
cd ~/contractoros
git worktree add ../contractoros-dev feature/sprint-19-dev
git worktree add ../contractoros-database feature/sprint-19-database
git worktree add ../contractoros-e2e main  # E2E uses main

# 3. Open terminals for each worktree
# Terminal 1 (Controller): cd ~/contractoros
# Terminal 2 (Dev):        cd ~/contractoros-dev
# Terminal 3 (Database):   cd ~/contractoros-database
# Terminal 4 (E2E):        cd ~/contractoros-e2e
```

**Worktree Sync Workflow:**
```bash
# From Dev session, push changes:
git add . && git commit -m "feat: Add component X"
git push origin feature/sprint-19-dev

# Controller merges when ready:
cd ~/contractoros
git fetch origin
git merge feature/sprint-19-dev

# All sessions pull:
git pull origin main
```

---

## Session Communication Protocol

### 1. SPRINT_STATUS.md (Primary)

All sessions read/write to `docs/SPRINT_STATUS.md`:

```markdown
## Active Tasks

| Task | Session | Status | Notes |
|------|---------|--------|-------|
| QBO Settings UI | Dev Sprint | IN PROGRESS | - |
| QBO Firestore Rules | Database | BLOCKED | Waiting on types |
| Smoke Tests | E2E | COMPLETED | 3 failures |
```

### 2. TODO Markers in Code

Use session-specific TODO markers:

```typescript
// TODO(dev-sprint): Add loading state here
// TODO(database): Need Firestore rule for this collection
// TODO(e2e): Write test for this flow
// TODO(controller): Review this implementation
```

### 3. File Locking Convention

Before editing a file, check SPRINT_STATUS.md:

```markdown
## File Locks (Temporary)

| File | Session | Until |
|------|---------|-------|
| components/ui/DataTable.tsx | Dev Sprint | 10:30 AM |
| firestore.rules | Database | 11:00 AM |
```

---

## Quick Recovery: Fixing Current State

Your environment currently has:
- 50+ uncommitted files
- No running Docker container
- TypeScript compiles clean

### Step 1: Start Docker
```bash
cd ~/contractoros/apps/web
docker stop contractoros-web 2>/dev/null; docker rm contractoros-web 2>/dev/null
./docker-build-local.sh
docker run -d -p 3000:8080 --name contractoros-web contractoros-web
```

### Step 2: Verify
```bash
docker ps  # Should show "Up" status
curl -s http://localhost:3000 | head -5  # Should return HTML
```

### Step 3: Commit Current Work
```bash
cd ~/contractoros
git status  # Review changes
git add -A
git commit -m "feat: Sprint 10-19 accumulated work

- QuickBooks integration (OAuth, sync)
- AI Assistant infrastructure
- Mobile UI components
- Job costing module
- Intelligence/bid analysis

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

### Step 4: Deploy Firebase (if needed)
```bash
firebase deploy --only firestore --project contractoros-483812
```

---

## Parallel Execution Examples

### Example 1: Building a New Feature

**Controller assigns:**
```
Task: Add Expense Report Export
- Dev Sprint: Create ExportButton component, hook for data
- Database: Add export audit log collection, rules
- E2E: Write export flow test
```

**Parallel execution:**
```
Dev Sprint: Creates components/expenses/ExportButton.tsx
Database: Adds firestore.rules match for /exportLogs/{logId}
E2E: Prepares test case in e2e/suites/expenses.md
```

**Controller merges when all complete.**

### Example 2: Bug Fix Sprint

**Controller identifies 5 bugs from E2E testing:**
```
Bug 1: Mobile nav not closing → Dev Sprint
Bug 2: Missing permission rule → Database
Bug 3: Type error in hook → Dev Sprint
Bug 4: Index missing for query → Database
Bug 5: (verify fix) → E2E
```

All sessions work in parallel, Controller tracks completion.

---

## Troubleshooting

### Sessions Editing Same File
```bash
# If merge conflict:
git stash  # In conflicting session
# Let other session finish
git stash pop
git diff  # Review changes
```

### Lost Sync Between Sessions
```bash
# All sessions run:
git fetch origin
git status
# Controller decides which changes to keep
```

### Docker Container Issues
```bash
# Kill all and restart:
docker ps -aq | xargs docker stop 2>/dev/null
docker ps -aq | xargs docker rm 2>/dev/null
cd ~/contractoros/apps/web
./docker-build-local.sh
docker run -d -p 3000:8080 --name contractoros-web contractoros-web
```

### TypeScript Errors After Pull
```bash
cd ~/contractoros/apps/web
rm -rf node_modules/.cache
npx tsc --noEmit
# If errors persist:
rm -rf node_modules
npm install
npx tsc --noEmit
```

---

## Session Startup Scripts

Create these for quick startup:

**~/.contractoros-controller.sh:**
```bash
#!/bin/bash
cd ~/contractoros
echo "=== CONTROLLER SESSION ==="
echo "Current branch: $(git branch --show-current)"
echo "Docker status: $(docker ps --filter name=contractoros-web --format '{{.Status}}')"
echo "TypeScript: $(cd apps/web && npx tsc --noEmit 2>&1 | tail -1)"
echo ""
echo "Starting Claude Code..."
claude
```

**~/.contractoros-dev.sh:**
```bash
#!/bin/bash
cd ~/contractoros
echo "=== DEV SPRINT SESSION ==="
echo "Run 'npx tsc --noEmit' frequently!"
claude
```

Make executable: `chmod +x ~/.contractoros-*.sh`

---

## Recommended Window Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                        MONITOR 1                                 │
├───────────────────────────┬─────────────────────────────────────┤
│     TERMINAL 1            │           TERMINAL 2                 │
│     Controller            │           Dev Sprint                 │
│     (coordination)        │           (UI/hooks)                 │
├───────────────────────────┼─────────────────────────────────────┤
│     TERMINAL 3            │           TERMINAL 4                 │
│     Database              │           E2E Testing                │
│     (rules/functions)     │           (Chrome MCP)               │
└───────────────────────────┴─────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                        MONITOR 2                                 │
│                                                                  │
│                    Chrome (localhost:3000)                       │
│                    + DevTools open                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Checklist: Starting a Multi-Session Sprint

- [ ] All sessions on same git commit: `git rev-parse HEAD`
- [ ] Docker running: `docker ps`
- [ ] TypeScript clean: `npx tsc --noEmit`
- [ ] SPRINT_STATUS.md updated with task assignments
- [ ] Each session knows their role (paste prompts above)
- [ ] File locks documented if needed
- [ ] E2E session has Chrome MCP working
