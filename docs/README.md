# ContractorOS Documentation

> **For AI Assistants:** Start with `../CLAUDE.md`, then `SPRINT_STATUS.md`.

---

## Documentation Structure

```
docs/
├── README.md                     # This file - documentation index
├── MASTER_ROADMAP.md             # Complete backlog (SINGLE SOURCE OF TRUTH)
├── SPRINT_STATUS.md              # Current progress and next tasks
├── DEVELOPMENT_GUIDE.md          # How to build features, code patterns
├── ARCHITECTURE.md               # Technical architecture reference
├── COMPONENT_PATTERNS.md         # UI component library guide
├── DEPLOYMENT_CHECKLIST.md       # Firebase/infrastructure requirements
├── TESTING_STRATEGY.md           # Testing requirements, common mistakes
├── FEATURE_TEMPLATE.md           # Template for new feature development
├── HELP_DOCUMENTATION_PLAN.md    # User docs & help center plan
├── bugfixes/
│   ├── ACCEPTANCE_CRITERIA.md    # Test cases for bug fixes
│   └── REFACTORING.md            # Technical debt items
└── archive/                      # Historical roadmap versions

Root Files:
├── CHANGELOG.md                  # Version history (Keep a Changelog format)
└── CLAUDE.md                     # AI assistant context file
```

---

## Quick Reference

### Starting a New Session

```bash
# 1. Verify CLI authentication
firebase login
gcloud auth login

# 2. Check current status
cat docs/SPRINT_STATUS.md

# 3. Verify code compiles
cd apps/web && npx tsc --noEmit
```

### Building a New Feature

1. **Read the spec:** `docs/MASTER_ROADMAP.md`
2. **Copy the template:** `docs/FEATURE_TEMPLATE.md`
3. **Check patterns:** `docs/DEVELOPMENT_GUIDE.md`
4. **Follow infrastructure checklist:** `docs/DEPLOYMENT_CHECKLIST.md`
5. **Reference components:** `docs/COMPONENT_PATTERNS.md`

### After Completing Work

1. **Run pre-commit checks:**
   ```bash
   cd apps/web && npx tsc --noEmit  # Type check
   npm run lint                      # Lint check
   npm run build                     # Build check
   ```
2. **Deploy infrastructure changes:**
   ```bash
   firebase deploy --only firestore:rules --project contractoros-483812
   firebase deploy --only firestore:indexes --project contractoros-483812
   npm run deploy:functions  # if functions changed
   ```
3. **Update documentation:**
   - Update `CHANGELOG.md` with version entry
   - Update `SPRINT_STATUS.md` with progress
4. **Manual testing:** Follow checklist in `TESTING_STRATEGY.md`

---

## Document Purposes

| Document | Purpose | Update Frequency |
|----------|---------|------------------|
| **CHANGELOG.md** | Version history, all changes | Every feature/fix |
| **MASTER_ROADMAP.md** | Complete backlog, feature specs | When adding/completing features |
| **SPRINT_STATUS.md** | Current progress, session handoffs | Every session |
| **DEVELOPMENT_GUIDE.md** | Code patterns, conventions | When patterns change |
| **ARCHITECTURE.md** | Technical deep-dive, data models | When architecture changes |
| **COMPONENT_PATTERNS.md** | UI component examples | When adding UI patterns |
| **DEPLOYMENT_CHECKLIST.md** | Firebase/infra requirements | When infrastructure changes |
| **TESTING_STRATEGY.md** | Testing requirements, error prevention | When issues discovered |
| **FEATURE_TEMPLATE.md** | New feature checklist | Rarely (template) |
| **HELP_DOCUMENTATION_PLAN.md** | User docs roadmap | When planning help content |

---

## Key Processes

### New Feature Development Flow

```
┌─────────────────┐
│ Read Spec in    │
│ MASTER_ROADMAP  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Copy FEATURE    │
│ TEMPLATE        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check CLI Auth  │
│ (firebase/gcloud)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Build Feature   │
│ (types→hook→    │
│  pages→components)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deploy Infra    │
│ (rules, indexes,│
│  functions)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update          │
│ SPRINT_STATUS   │
└─────────────────┘
```

---

## CLI Authentication Quick Reference

### Firebase
```bash
firebase login              # Interactive login
firebase projects:list      # Check projects
firebase use contractoros-483812  # Set project
```

### Google Cloud
```bash
gcloud auth login           # Interactive login
gcloud config set project contractoros-483812  # Set project
gcloud auth list            # Check current auth
```

### Verification
```bash
# Verify both are working
firebase projects:list
gcloud config get-value project
```

---

## Common Tasks

### Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Deploy Cloud Functions
```bash
cd functions && npm run build
firebase deploy --only functions
```

### Create Firestore Index
```bash
# Add to firestore.indexes.json, then:
firebase deploy --only firestore:indexes
```

---

## Key Files Reference

### Types
All types in: `apps/web/types/index.ts`

### Hooks
Data hooks in: `apps/web/lib/hooks/`
- `useClients.ts` - Client CRUD
- `useSignatureRequests.ts` - E-signature tracking
- `useTasks.ts` - Task management
- `usePhases.ts` - Phase management

### UI Components
Shared components: `apps/web/components/ui/`
- Button, Card, Badge, EmptyState, Toast, Skeleton

### Feature Components
Domain components:
- `apps/web/components/clients/` - Client CRM
- `apps/web/components/esignature/` - E-signature
- `apps/web/components/projects/` - Project management
- `apps/web/components/tasks/` - Task management

---

## Troubleshooting

### "Permission denied" in Firestore
1. Check rules are deployed: `firebase deploy --only firestore:rules`
2. Verify user authenticated
3. Check orgId in query matches user's org

### "Missing index" error
1. Click link in error to auto-create
2. Or add to firestore.indexes.json and deploy

### TypeScript errors
```bash
cd apps/web && npx tsc --noEmit
```

### Function deployment fails
```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```
