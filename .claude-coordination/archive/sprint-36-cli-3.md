# Sprint 36: CLI 3 - Enhanced Client Portal API

You are CLI 3 for ContractorOS Sprint 36: Enhanced Client Portal.

Working directory: /Users/nickbodkins/contractoros/apps/web

## RULES
- Do NOT run tsc until ALL tasks complete
- Create files, commit, move on

---

## Task 1: Client Portal Types
Add to end of types/index.ts:

```typescript
// ============================================================================
// Client Portal Types (Sprint 36)
// ============================================================================

export interface ProjectSelection {
  id: string;
  projectId: string;
  orgId: string;
  category: string;
  options: SelectionOption[];
  selectedOptionId?: string;
  clientApproved: boolean;
  clientApprovedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SelectionOption {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  supplier?: string;
  leadTime?: string;
}

export interface ClientNote {
  id: string;
  projectId: string;
  orgId: string;
  clientId: string;
  clientName: string;
  content: string;
  addressed: boolean;
  addressedBy?: string;
  addressedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectProgress {
  projectId: string;
  orgId: string;
  overallPercent: number;
  phases: PhaseProgress[];
  estimatedCompletion?: Date;
  lastUpdated: Date;
}

export interface PhaseProgress {
  phaseId: string;
  phaseName: string;
  percent: number;
  startDate?: Date;
  endDate?: Date;
}
```

Commit: "feat(types): Add client portal types"

---

## Task 2: Selections API
Create: app/api/client/[token]/selections/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';

// GET: List selections for project
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // TODO: Validate token, get project
    // TODO: Fetch selections from Firestore
    return NextResponse.json({ selections: [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// PATCH: Approve selection
export async function PATCH(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const body = await request.json();
    // TODO: Update selection approval
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
```

Commit: "feat(api): Add client selections endpoint"

---

## Task 3: Client Notes API
Create: app/api/client/[token]/notes/route.ts

- GET: List notes for project
- POST: Create note (client)
- PATCH: Mark addressed (contractor)

Commit: "feat(api): Add client notes endpoint"

---

## Task 4: Progress API
Create: app/api/client/[token]/progress/route.ts

- GET: Return project progress data

Commit: "feat(api): Add client progress endpoint"

---

## Task 5: Documents API
Create: app/api/client/[token]/documents/route.ts

- GET: List documents for project (filtered for client access)

Commit: "feat(api): Add client documents endpoint"

---

## Task 6: Firestore Rules
Add to firestore.rules (inside organizations match):

```javascript
// Client Notes
match /clientNotes/{noteId} {
  allow read: if isSameOrg(orgId);
  allow create: if isSameOrg(orgId);
  allow update: if isSameOrg(orgId);
  allow delete: if isSameOrg(orgId) && getUserProfile().role in ['OWNER', 'PM'];
}

// Project Selections
match /projectSelections/{selectionId} {
  allow read: if isSameOrg(orgId);
  allow write: if isSameOrg(orgId) && getUserProfile().role in ['OWNER', 'PM'];
}

// Project Progress
match /projectProgress/{progressId} {
  allow read: if isSameOrg(orgId);
  allow write: if isSameOrg(orgId) && getUserProfile().role in ['OWNER', 'PM'];
}
```

Commit: "chore: Add Firestore rules for client portal"

---

## Final Step
```bash
npx tsc --noEmit 2>&1 | head -20
```

---

## AUTO-REPORT (Required - Do this when done)
```bash
echo "CLI: 3
STATUS: complete
TASK: Sprint 36 API - Client portal types, selections, notes, progress, documents, rules
COMMIT: $(git rev-parse --short HEAD)
MESSAGE: Ready for review" > /Users/nickbodkins/contractoros/.claude-coordination/cli-3-$(date +%s).status
```
