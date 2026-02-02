# Sprint 36: CLI 2 - Enhanced Client Portal UI

You are CLI 2 for ContractorOS Sprint 36: Enhanced Client Portal.

Working directory: /Users/nickbodkins/contractoros/apps/web

## RULES
- Do NOT run tsc until ALL tasks complete
- Create files, commit after each, move on

---

## Task 1: Photo Timeline Component
Create: components/client-portal/PhotoTimeline.tsx

Features:
- Vertical timeline layout
- Photos grouped by date/phase
- Thumbnail grid with lightbox on click
- Phase labels and date markers
- "View All Photos" link

Commit: "feat(client-portal): Add photo timeline component"

---

## Task 2: Selection Board Component
Create: components/client-portal/SelectionBoard.tsx

Features:
- Category tabs (Flooring, Countertops, Fixtures, etc.)
- Option cards with image, name, price
- "Selected" badge for chosen items
- Compare toggle (side-by-side)
- Approve/Request Change buttons

Commit: "feat(client-portal): Add selection board component"

---

## Task 3: Progress Dashboard Component
Create: components/client-portal/ProgressDashboard.tsx

Features:
- Overall completion percentage (circular progress)
- Phase breakdown bars
- Milestone markers
- Estimated completion date
- Recent activity feed

Commit: "feat(client-portal): Add progress dashboard component"

---

## Task 4: Document Library Component
Create: components/client-portal/DocumentLibrary.tsx

Features:
- Category filters (Contracts, Plans, Permits, Invoices)
- File cards with icon, name, date
- Download button
- Preview modal for PDFs/images
- Search by filename

Commit: "feat(client-portal): Add document library component"

---

## Task 5: Client Notes Widget
Create: components/client-portal/ClientNotes.tsx

Features:
- Add note form (textarea + submit)
- Notes list with timestamp
- Edit/delete own notes
- Mark as addressed (contractor view)

Commit: "feat(client-portal): Add client notes widget"

---

## Final Step
```bash
npx tsc --noEmit 2>&1 | head -20
```

---

## AUTO-REPORT (Required - Do this when done)
```bash
echo "CLI: 2
STATUS: complete
TASK: Sprint 36 UI - Photo timeline, selection board, progress dashboard, document library, client notes
COMMIT: $(git rev-parse --short HEAD)
MESSAGE: Ready for review" > /Users/nickbodkins/contractoros/.claude-coordination/cli-2-$(date +%s).status
```
