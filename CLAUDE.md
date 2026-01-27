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

## Commands
```bash
npm run dev              # Start Next.js dev server
npm run build            # Production build (includes CSS verification + standalone copy)
npm run start            # Start production server
npm run build:functions  # Compile Cloud Functions
npm run deploy:functions # Deploy functions to Firebase
npm run emulators        # Start Firebase emulators (auth:9099, functions:5001, firestore:8080)
npx tsc --noEmit         # Type check (run from apps/web/)
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

## Do Not Modify
- `apps/web/Dockerfile` — Frozen (see DO_NOT_EDIT.md). Multi-stage build tuned for Cloud Run.
- `cloudbuild.yaml` — Production CI/CD pipeline.
- `firestore.rules` — Security rules. Changes need careful review.
- `firestore.indexes.json` — Composite indexes. Only add, never remove.

## Key Technical Decisions
- **App Router (not Pages Router):** All routes use Next.js 14 app/ directory with layouts
- **Client-side Firestore:** Direct Firestore reads from React hooks, no API layer between frontend and DB
- **Standalone output:** next.config.js uses `output: 'standalone'` for Docker/Cloud Run
- **No test framework configured:** Zero test coverage currently

## Known Issues / Tech Debt
- AuthProvider architecture needs refactoring
- 20+ route pages still missing or incomplete
- Silent error handling — no toast notifications on failures
- Firebase config hardcoded in lib/firebase/config.ts (should use env vars)
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
