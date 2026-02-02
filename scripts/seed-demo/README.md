# Demo Data Seed Script

Seeds "Horizon Construction Co." - a realistic demo organization with 12 months of operational data.

## Prerequisites

1. **Node.js 18+** with TypeScript support
2. **Firebase Admin credentials** (one of the following):
   - Service account JSON file in this directory
   - `GOOGLE_APPLICATION_CREDENTIALS` environment variable
   - Default gcloud credentials (`gcloud auth application-default login`)

## Setup

### Option 1: Service Account File (Recommended for automation)

1. Go to [Firebase Console](https://console.firebase.google.com/project/contractoros-483812/settings/serviceaccounts/adminsdk)
2. Generate new private key
3. Save as `scripts/seed-demo/service-account.json`

```bash
# The file should be at:
scripts/seed-demo/service-account.json
```

**Important:** Never commit `service-account.json` to git!

### Option 2: Default Credentials (Recommended for local dev)

```bash
gcloud auth application-default login
```

## Running the Script

```bash
# From project root
cd apps/web

# Install dependencies if needed
npm install

# Run the seed script
npx ts-node ../../scripts/seed-demo/index.ts

# Or with esModuleInterop flags
npx ts-node --esModuleInterop --resolveJsonModule ../../scripts/seed-demo/index.ts
```

## What Gets Created

### Organization
- **Horizon Construction Co.**
- Location: Denver, CO
- Trades: General Contracting, Remodeling, Additions
- Plan: Professional
- Created: 14 months ago (for historical data)

### Users (7 total)

| Name | Role | Email | Compensation |
|------|------|-------|--------------|
| Mike Johnson | Owner | mike@horizonconstruction.demo | $150k salary |
| Sarah Williams | PM | sarah@horizonconstruction.demo | $85k salary |
| Carlos Rodriguez | Foreman | carlos@horizonconstruction.demo | $45/hr |
| Jake Thompson | Field | jake@horizonconstruction.demo | $32/hr |
| Maria Santos | Field | maria@horizonconstruction.demo | $35/hr |
| David Chen | Field | david@horizonconstruction.demo | $30/hr |
| Emily Parker | Admin | emily@horizonconstruction.demo | $55k salary |

### Clients (8 total)

**Residential (5):**
- Smith family - repeat client, 3 projects
- Garcia family - active basement project
- Thompson family - completed, satisfied
- Wilson family - 2 projects
- Brown family - potential lead

**Commercial (3):**
- Downtown Cafe LLC - completed build-out
- Main Street Retail Group - multi-location
- Office Park LLC - new relationship

## Data Characteristics

- All dates are **relative to now** (seed stays fresh)
- Realistic financials with outstanding balances
- Mix of completed, active, and potential projects
- Proper Denver-area addresses
- Realistic client notes and tags

## Re-running the Script

The script uses **merge** behavior:
- Existing data is updated, not duplicated
- Safe to run multiple times
- IDs are deterministic (demo-*)

## Extending the Seed

Additional seed modules can be added:

```typescript
// scripts/seed-demo/seed-projects.ts
export async function seedProjects(db: Firestore, orgId: string) {
  // Create projects...
}

// Then import in index.ts
import { seedProjects } from './seed-projects';
await seedProjects(db, orgId);
```

## Troubleshooting

### "Missing permissions" error
- Verify service account has Firestore permissions
- Check that `projectId` matches in script config

### "Cannot find module" error
```bash
# Make sure you're running from apps/web
cd apps/web
npx ts-node --esModuleInterop ../../scripts/seed-demo/index.ts
```

### Type errors
```bash
# Verify TypeScript compilation
npx tsc ../../scripts/seed-demo/index.ts --noEmit --esModuleInterop --resolveJsonModule
```

## File Structure

```
scripts/seed-demo/
├── index.ts            # Main entry point
├── seed-organization.ts # Organization creation
├── seed-users.ts       # User creation
├── seed-clients.ts     # Client creation
├── utils.ts            # Helper functions
├── README.md           # This file
└── service-account.json # Your credentials (not in git)
```

## Security Notes

- `service-account.json` is in `.gitignore`
- Demo emails use `.demo` domain (not deliverable)
- All user UIDs are prefixed with `demo-`
- No real PII in the seed data
