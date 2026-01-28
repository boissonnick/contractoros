# ContractorOS — Project Intelligence

## What This Is
Field-first construction project management platform. Multi-portal app serving general contractors (dashboard), subcontractors, clients, and field workers. Built on Next.js 14 + Firebase.

## Architecture
```
apps/web/          → Next.js 14 App Router frontend (deployed to Cloud Run us-west1)
functions/         → Firebase Cloud Functions Gen 2 (us-east1), handles email + user creation
```
- **Auth:** Firebase Authentication (email/password)
- **Database:** Firestore (NoSQL)
- **Styling:** Tailwind CSS
- **Forms:** React Hook Form + Zod validation
- **State:** Custom Firestore hooks (lib/hooks/), no global state library

## Local Environment
- **Node:** v20 via Homebrew (`brew link node@20` — keg-only, must be symlinked)
- **npm:** v10.8.2
- **Firebase CLI:** v15.4.0 (`firebase` in PATH via Homebrew)
- **Docker:** Docker Desktop for Mac
- **gcloud:** Google Cloud SDK (`gcloud` in PATH via Homebrew)
- All tools in `/opt/homebrew/bin/`. Node@20 bin also at `/opt/homebrew/opt/node@20/bin/`.

## Commands
All commands run from `apps/web/` unless noted:
```bash
npm run dev              # Start Next.js dev server
npm run build            # Production build (includes CSS verification + standalone copy)
npm run start            # Start production server
npm run build:functions  # Compile Cloud Functions (from repo root)
npm run deploy:functions # Deploy functions to Firebase (from repo root)
npm run emulators        # Start Firebase emulators (auth:9099, functions:5001, firestore:8080)
npx tsc --noEmit         # Type check
```

## Portal Routes (app/)
| Route prefix | Portal | Users |
|---|---|---|
| `/dashboard/` | PM/Owner dashboard | General contractors, project managers |
| `/client/` | Client portal | Homeowners, property owners |
| `/sub/` | Subcontractor portal | Subcontractors |
| `/field/` | Field worker portal | Employees on-site |
| `/admin/` | Admin portal | Platform admins |
| `/onboarding/` | Onboarding flows | All new users |

## Module Map
- `components/projects/` — Project-level UI: phases, scope, change orders, bids, tasks (kanban/gantt/list)
- `components/subcontractors/` — Sub management: forms, ratings, payments, documents
- `components/tasks/` — Task detail: comments, attachments, assignments, activity log
- `components/ui/` — Shared primitives: Button, Card, Input, Toast, AppShell, etc.
- `lib/hooks/` — Firestore data hooks: useTasks, usePhases, useScopes, useChangeOrders, useSubcontractors, etc.
- `lib/firebase/` — Firebase config, storage helpers, seed templates
- `types/index.ts` — All TypeScript types (User, Org, Project, Phase, Task, Scope, ChangeOrder, etc.)

## Do Not Modify (without approval)
- `apps/web/Dockerfile` — Multi-stage build tuned for Cloud Run. May add new ARG/ENV for secrets only.
- `cloudbuild.yaml` — Production CI/CD pipeline. May update for secrets integration.
- `firestore.rules` — Security rules. Changes need careful review.
- `firestore.indexes.json` — Composite indexes. Only add, never remove.

## Key Technical Decisions
- **App Router (not Pages Router):** All routes use Next.js 14 app/ directory with layouts
- **Client-side Firestore:** Direct Firestore reads from React hooks, no API layer between frontend and DB
- **Standalone output:** next.config.js uses `output: 'standalone'` for Docker/Cloud Run
- **No test framework configured:** Zero test coverage currently

## Secrets Management
All secrets stored in **GCP Secret Manager** (project: `contractoros-483812`).

**Production (Cloud Build/Cloud Run):**
- Secrets injected at build time via `cloudbuild.yaml` → `availableSecrets`
- Cloud Build service account has `secretmanager.secretAccessor` role
- Secrets are passed as Docker build args, inlined by Next.js at build time

**Local Development:**
- Copy `.env.example` to `.env.local` (gitignored)
- Use `./docker-build-local.sh` to build with secrets from `.env.local`
- Use `./docker-run-local.sh` to run the container

**Current Secrets:**
| Secret Name | Description |
|-------------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API Key |

**Adding New Secrets:**
```bash
# Create secret in GCP
echo -n "secret-value" | gcloud secrets create SECRET_NAME --data-file=- --project=contractoros-483812

# Grant Cloud Build access
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:424251610296@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=contractoros-483812

# Update cloudbuild.yaml availableSecrets section
# Update Dockerfile ARG/ENV if needed for NEXT_PUBLIC_* vars
# Update docker-build-local.sh for local dev
```

## Known Issues / Tech Debt
- AuthProvider architecture needs refactoring
- 20+ route pages still missing or incomplete
- Silent error handling — no toast notifications on failures
- No pagination — will break at scale
- No tests at all — critical paths completely unguarded

## Critical Paths Needing Tests (Step 5 flag)
1. `lib/auth.tsx` — AuthProvider, login/logout/register flows
2. `lib/hooks/useTasks.ts` — Task CRUD against Firestore
3. `lib/hooks/usePhases.ts` — Phase lifecycle management
4. `lib/hooks/useChangeOrders.ts` — Change order creation and approval
5. `lib/hooks/useScopes.ts` — Scope versioning and approval
6. `lib/invitations/` — Invite send/accept flow
7. `functions/src/index.ts` — Cloud Functions (user creation, health check)
8. `components/projects/scope/ScopeBuilder.tsx` — Complex multi-step scope building UI
