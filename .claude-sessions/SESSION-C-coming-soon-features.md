# Session C: Coming Soon Features

> **Run Command:** `claude "Execute session C from .claude-sessions/SESSION-C-coming-soon-features.md"`
> **Duration:** 6-10 hours
> **Phases:** 5 + 6
> **Priority:** 🟠 P2 - Feature Completion
> **Prerequisites:** Sessions A and B complete

---

## Pre-Session Checklist

Before starting, verify previous sessions completed:
```bash
cd apps/web && npx tsc --noEmit              # Must pass
npm run test                                  # Tests should pass
ls components/ui/Pagination.tsx              # Should exist
grep -r "usePagination" lib/hooks/ | head -3 # Should show usage
```

---

## PHASE 5: Portal Features (3-5 hours)

### Batch 5.1: Client Portal Pages
**Launch these 3 agents in parallel:**

#### Agent 1: Client Projects Page
```
Task: Convert /client/projects from Coming Soon to functional page.

CONTEXT:
- File: apps/web/app/client/projects/page.tsx
- Currently shows ComingSoon component
- Clients need to see their project status

REQUIREMENTS:
1. Show list of projects where client is assigned
2. Display project status, progress percentage
3. Link to project detail pages
4. Mobile-responsive card layout

IMPLEMENTATION:
```typescript
'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useClientProjects } from '@/lib/hooks/useClientProjects';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ClientProjectsPage() {
  const { user, orgId } = useAuth();
  const { projects, loading, error } = useClientProjects(user?.uid, orgId);

  if (loading) return <ProjectsSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!projects.length) return <EmptyState title="No projects yet" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your Projects"
        description="Track the progress of your construction projects"
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            href={`/client/projects/${project.id}`}
            showProgress
          />
        ))}
      </div>
    </div>
  );
}
```

CREATE HOOK if needed: lib/hooks/useClientProjects.ts
- Query projects where clientId === user.uid OR clientIds includes user.uid
- Return simplified project data for client view

DELIVERABLE: Functional client projects page with project cards
```

#### Agent 2: Client Messages Page
```
Task: Convert /client/messages from Coming Soon to functional page.

CONTEXT:
- File: apps/web/app/client/messages/page.tsx
- Clients need to communicate with contractor

REQUIREMENTS:
1. Show message threads with contractor
2. Read-only initially (can view, not send - keep simple)
3. Group by project if multiple projects
4. Show unread indicator
5. Mobile-friendly list view

IMPLEMENTATION APPROACH:
1. Create useClientMessages hook that:
   - Fetches messages where recipientId === user.uid OR senderId === user.uid
   - Groups by project or conversation thread
   - Marks messages as read when viewed

2. Create simple thread list UI:
   - Show sender, preview, timestamp
   - Indicate unread messages
   - Click to expand thread

3. For V1, make it read-only:
   - Show messages from contractor
   - Add "To reply, please call or text [phone]" note
   - Future: add send capability

DELIVERABLE: Client messages page showing message threads
```

#### Agent 3: Client Photos Page
```
Task: Convert /client/photos from Coming Soon to functional page.

CONTEXT:
- File: apps/web/app/client/photos/page.tsx
- Clients want to see progress photos

REQUIREMENTS:
1. Show photos from client's projects
2. Filter by project (if multiple)
3. Filter by date range
4. Gallery view with lightbox
5. Before/after pairs highlighted
6. Mobile-friendly grid

IMPLEMENTATION:
1. Use existing usePhotos hook with client filter
2. Create gallery grid component
3. Add lightbox for full-size view
4. Group by date or project phase

UI PATTERN:
```typescript
<div className="space-y-6">
  <PageHeader title="Project Photos" />

  <FilterBar>
    <ProjectFilter projects={clientProjects} />
    <DateRangeFilter />
  </FilterBar>

  <PhotoGallery
    photos={photos}
    onPhotoClick={openLightbox}
    groupBy="date"
  />

  <Lightbox
    isOpen={lightboxOpen}
    photos={photos}
    currentIndex={currentPhotoIndex}
    onClose={() => setLightboxOpen(false)}
  />
</div>
```

DELIVERABLE: Client photos gallery page with filtering
```

**Wait for Batch 5.1 to complete.**

---

### Batch 5.2: Field Portal Enhancements
**Launch these 3 agents in parallel:**

#### Agent 4: Field Schedule Calendar
```
Task: Enhance /field/schedule with full calendar view.

CONTEXT:
- File: apps/web/app/field/schedule/page.tsx
- Field workers need to see their schedule
- Currently basic, needs calendar view

REQUIREMENTS:
1. Day view (default) - shows today's tasks/events
2. Week view - 7-day overview
3. Swipe between days on mobile
4. Show assigned tasks with time blocks
5. Show project locations
6. Color-code by project
7. Tap to see details

IMPLEMENTATION:
1. Create FieldCalendar component:
   ```typescript
   interface FieldCalendarProps {
     events: ScheduleEvent[];
     tasks: Task[];
     view: 'day' | 'week';
     onEventClick: (event: ScheduleEvent) => void;
     onTaskClick: (task: Task) => void;
   }
   ```

2. For day view:
   - Hour-by-hour timeline
   - Tasks positioned by scheduled time
   - Current time indicator

3. For week view:
   - 7-day grid
   - Summary of tasks per day
   - Tap day to switch to day view

4. Mobile optimizations:
   - Swipe left/right for day navigation
   - Pull down to refresh
   - Large tap targets

DELIVERABLE: Full calendar view for field schedule
```

#### Agent 5: Offline Project Downloads
```
Task: Add ability to download project data for offline access.

CONTEXT:
- Field workers often lose connectivity
- Need core project data available offline
- Already have IndexedDB infrastructure from Sprint 28

REQUIREMENTS:
1. "Download for Offline" button on project detail
2. Downloads and caches:
   - Project details
   - Today's tasks
   - Recent photos (thumbnails)
   - Contact info
   - Project location/address
3. Shows "Available Offline" indicator
4. Auto-syncs when back online

IMPLEMENTATION:
1. Create useOfflineProject hook:
   ```typescript
   interface UseOfflineProjectResult {
     isDownloaded: boolean;
     downloadProject: () => Promise<void>;
     removeDownload: () => Promise<void>;
     lastSynced: Date | null;
     downloadProgress: number;
   }
   ```

2. Use existing offline infrastructure:
   - lib/offline/cache-projects.ts
   - IndexedDB storage
   - SyncManager for background sync

3. Add UI:
   - Download button with progress
   - "Offline Available" badge
   - "Last synced" timestamp
   - Manual refresh option

DELIVERABLE: Offline project download feature working
```

#### Agent 6: Voice Log UI Improvements
```
Task: Improve the voice log interface for field workers.

CONTEXT:
- File: apps/web/app/field/voice-logs/page.tsx
- Voice logs work but UI needs polish
- 246 lines currently

REQUIREMENTS:
1. Better recording UI:
   - Large, prominent record button
   - Clear recording indicator (pulsing, timer)
   - Waveform visualization
2. Queue management:
   - Show pending logs clearly
   - Retry failed uploads
   - Delete option
3. Status indicators:
   - Recording / Processing / Uploaded / Failed
4. Playback:
   - Listen to recorded logs
   - See transcription preview

UI IMPROVEMENTS:
```typescript
// Large record button
<RecordButton
  isRecording={isRecording}
  onStart={startRecording}
  onStop={stopRecording}
  className="w-24 h-24 mx-auto"
/>

// Status cards for queued logs
<VoiceLogQueue
  logs={pendingLogs}
  onRetry={retryLog}
  onDelete={deleteLog}
/>

// Recent logs with playback
<VoiceLogHistory
  logs={recentLogs}
  onPlay={playLog}
/>
```

DELIVERABLE: Polished voice log interface
```

**Wait for Batch 5.2 to complete.**

---

### Batch 5.3: Sub Portal Pages
**Launch these 3 agents in parallel:**

#### Agent 7: Sub Invoices Page
```
Task: Convert /sub/invoices from Coming Soon to functional page.

CONTEXT:
- File: apps/web/app/sub/invoices/page.tsx
- Subcontractors need to submit invoices for their work

REQUIREMENTS:
1. List subcontractor's invoices
2. Create new invoice
3. Track invoice status (draft, submitted, approved, paid)
4. Link to specific projects/work
5. Show payment history

IMPLEMENTATION:
1. Create useSubInvoices hook:
   ```typescript
   // Fetches invoices where subcontractorId === user.uid
   const { invoices, createInvoice, loading } = useSubInvoices(userId, orgId);
   ```

2. Invoice list view:
   - Filter by status
   - Sort by date
   - Show amount, project, status

3. Create invoice form:
   - Select project/assignment
   - Line items (labor, materials)
   - Attach documentation
   - Submit for approval

4. Invoice detail view:
   - Full breakdown
   - Status timeline
   - Payment info when paid

DELIVERABLE: Sub invoices page with create/list/detail
```

#### Agent 8: Sub Photos Page
```
Task: Convert /sub/photos from Coming Soon to functional page.

CONTEXT:
- File: apps/web/app/sub/photos/page.tsx
- Subs need to document their work

REQUIREMENTS:
1. Upload work photos
2. Assign to project/task
3. Add captions/notes
4. View uploaded photos
5. Before/after capability

IMPLEMENTATION:
1. Photo upload component:
   - Multi-file upload
   - Camera capture on mobile
   - Progress indicator
   - Auto-compress large images

2. Photo assignment:
   - Select project
   - Select task (optional)
   - Add caption
   - Mark as before/after

3. Gallery view:
   - Grid of uploaded photos
   - Filter by project
   - Filter by date

DELIVERABLE: Sub photos page with upload and gallery
```

#### Agent 9: Sub Bids Page
```
Task: Convert /sub/bids from Coming Soon to functional page.

CONTEXT:
- File: apps/web/app/sub/bids/page.tsx
- Subs receive bid requests and submit bids

REQUIREMENTS:
1. Show bid requests sent to this sub
2. View bid request details
3. Submit bid response
4. Track bid status (pending, submitted, accepted, rejected)
5. View won bids/contracts

IMPLEMENTATION:
1. Create useSubBids hook:
   ```typescript
   // Fetches bids where subcontractorId === user.uid
   // And bid solicitations sent to this sub
   ```

2. Bid request list:
   - New requests highlighted
   - Deadline shown
   - Project info
   - Quick actions

3. Bid submission form:
   - View scope of work
   - Enter price breakdown
   - Add notes/qualifications
   - Attach documents
   - Submit bid

4. Bid tracking:
   - Status updates
   - Comparison (if shared)
   - Contract if accepted

STATUSES:
- pending_review: Bid request received
- submitted: Sub submitted bid
- under_review: Contractor reviewing
- accepted: Bid won
- rejected: Bid not selected
- withdrawn: Sub withdrew

DELIVERABLE: Sub bids page with full bid workflow
```

**Wait for Batch 5.3 to complete.**

---

## PHASE 6: Dashboard Features (3-5 hours)

### Batch 6.1: Project Section Pages
**Launch these 4 agents in parallel:**

#### Agent 10: Projects Schedule Page
```
Task: Convert /projects/schedule from Coming Soon to timeline view.

CONTEXT:
- File: apps/web/app/projects/schedule/page.tsx
- Cross-project schedule view

REQUIREMENTS:
1. Show all projects on a timeline
2. Gantt-style view
3. Filter by status, category
4. Zoom in/out (day, week, month)
5. Click project to navigate

IMPLEMENTATION:
1. Use existing schedule data
2. Create timeline visualization:
   ```typescript
   <ProjectTimeline
     projects={projects}
     startDate={viewStart}
     endDate={viewEnd}
     zoom={zoomLevel}
     onProjectClick={navigateToProject}
   />
   ```

3. Timeline features:
   - Horizontal scroll
   - Project bars showing duration
   - Color by status
   - Milestone markers
   - Today indicator

DELIVERABLE: Project schedule timeline page
```

#### Agent 11: Projects Crew Page
```
Task: Convert /projects/crew from Coming Soon to crew assignment view.

CONTEXT:
- File: apps/web/app/projects/crew/page.tsx
- View crew assignments across projects

REQUIREMENTS:
1. Grid showing crew x projects
2. See who's assigned where
3. Identify availability gaps
4. Quick assignment capability

IMPLEMENTATION:
1. Crew assignment grid:
   ```typescript
   <CrewAssignmentGrid
     crew={teamMembers}
     projects={activeProjects}
     assignments={assignments}
     onAssign={handleAssign}
     onUnassign={handleUnassign}
   />
   ```

2. Features:
   - Row per crew member
   - Column per project (or day)
   - Cell shows assignment status
   - Click to assign/unassign
   - Show capacity warnings

3. Filters:
   - Date range
   - Crew role
   - Project

DELIVERABLE: Crew assignment grid page
```

#### Agent 12: Projects Time Page
```
Task: Convert /projects/time from Coming Soon to time tracking view.

CONTEXT:
- File: apps/web/app/projects/time/page.tsx
- View time entries across projects

REQUIREMENTS:
1. List time entries by project
2. Summary totals per project
3. Filter by date, crew, project
4. Export capability

IMPLEMENTATION:
1. Time summary view:
   ```typescript
   <ProjectTimeSummary
     projects={projects}
     timeEntries={entries}
     dateRange={dateRange}
   />
   ```

2. Features:
   - Total hours per project
   - Breakdown by crew member
   - Daily/weekly/monthly views
   - Cost calculations (hours * rate)

3. Detail view:
   - Individual time entries
   - Edit capability (for admins)
   - Approval workflow

DELIVERABLE: Project time tracking summary page
```

#### Agent 13: Projects Inbox Page
```
Task: Convert /projects/inbox from Coming Soon to notification center.

CONTEXT:
- File: apps/web/app/projects/inbox/page.tsx
- Project-related notifications and updates

REQUIREMENTS:
1. Activity feed across all projects
2. Filter by project
3. Filter by type (task, message, update)
4. Mark as read
5. Quick actions

IMPLEMENTATION:
1. Activity feed:
   ```typescript
   <ActivityFeed
     activities={activities}
     onMarkRead={markAsRead}
     onActivityClick={navigateToSource}
   />
   ```

2. Activity types:
   - Task assigned/completed
   - Message received
   - Document uploaded
   - Status changed
   - Comment added

3. Features:
   - Unread count badge
   - Batch mark as read
   - Jump to source

DELIVERABLE: Project inbox/notifications page
```

**Wait for Batch 6.1 to complete.**

---

### Batch 6.2: Dashboard Messaging
**Launch these 2 agents in parallel:**

#### Agent 14: Project Messages Page
```
Task: Convert /dashboard/projects/[id]/messages from Coming Soon.

CONTEXT:
- File: apps/web/app/dashboard/projects/[id]/messages/page.tsx
- Project-specific messaging

REQUIREMENTS:
1. Message thread for the project
2. Multiple participants (team, client, subs)
3. Send/receive messages
4. File attachments
5. @mentions

IMPLEMENTATION:
1. Use existing messaging infrastructure
2. Scope to project participants:
   ```typescript
   const { messages, sendMessage, loading } = useProjectMessages(projectId);
   ```

3. Chat UI:
   - Message list (newest at bottom)
   - Input field with send button
   - File attachment option
   - Participant list sidebar

4. Features:
   - Real-time updates
   - Read receipts
   - @mention autocomplete
   - Link to related items

DELIVERABLE: Project messaging page with full chat capability
```

#### Agent 15: Message Thread Component Improvements
```
Task: Enhance the message thread component used across the app.

CONTEXT:
- components/messaging/*.tsx
- Used in multiple places

REQUIREMENTS:
1. Better message bubbles
2. Timestamp grouping
3. Read status indicators
4. Typing indicator
5. Scroll to bottom on new message
6. Load older messages on scroll up

IMPLEMENTATION:
1. MessageThread component:
   ```typescript
   <MessageThread
     messages={messages}
     currentUserId={userId}
     participants={participants}
     onSendMessage={handleSend}
     onLoadMore={loadOlderMessages}
     hasMore={hasMoreMessages}
   />
   ```

2. Message bubble improvements:
   - Own messages on right (blue)
   - Others on left (gray)
   - Show sender name/avatar
   - Timestamp on hover

3. Functionality:
   - Auto-scroll on new
   - Intersection observer for "load more"
   - Keyboard shortcuts (Enter to send)

DELIVERABLE: Polished message thread component
```

**Wait for Batch 6.2 to complete.**

---

### Batch 6.3: Cleanup and Navigation
**Launch these 2 agents in parallel:**

#### Agent 16: Remove Remaining Coming Soon Placeholders
```
Task: Find and remove any remaining Coming Soon placeholders.

SEARCH:
```bash
grep -r "ComingSoon" apps/web/app/
grep -r "coming soon" apps/web/app/ -i
grep -r "Coming Soon" apps/web/components/
```

FOR EACH FOUND:
1. If page should now be functional → verify it works
2. If page is not in scope → add to backlog with TODO
3. If component is unused → remove it

DOCUMENT:
Create list of any remaining Coming Soon pages with rationale for deferral.

DELIVERABLE: No unexpected Coming Soon placeholders, backlog documented
```

#### Agent 17: Navigation Updates for New Pages
```
Task: Update navigation to include all new pages.

CONTEXT:
- New pages need to be accessible from nav
- Mobile and desktop nav

CHANGES:
1. Update sidebar navigation:
   - Add Projects submenu if not present
   - Include: Schedule, Crew, Time, Inbox

2. Update client portal nav:
   - Ensure Projects, Messages, Photos accessible

3. Update sub portal nav:
   - Ensure Invoices, Photos, Bids accessible

4. Update field portal nav:
   - Ensure Schedule, Voice Logs prominent

5. Verify mobile bottom nav includes key items

6. Test all navigation paths work

DELIVERABLE: All new pages accessible via navigation
```

**Wait for Batch 6.3 to complete.**

---

## VERIFICATION & SELF-IMPROVEMENT

### Final Verification
```bash
# TypeScript check
cd apps/web && npx tsc --noEmit

# Run tests
npm run test

# Manual testing checklist:
# Client Portal:
# - [ ] /client/projects shows projects
# - [ ] /client/messages shows messages
# - [ ] /client/photos shows gallery

# Field Portal:
# - [ ] /field/schedule has calendar view
# - [ ] Offline download works
# - [ ] Voice logs UI improved

# Sub Portal:
# - [ ] /sub/invoices create and list
# - [ ] /sub/photos upload and view
# - [ ] /sub/bids view and submit

# Dashboard:
# - [ ] /projects/schedule shows timeline
# - [ ] /projects/crew shows grid
# - [ ] /projects/time shows summary
# - [ ] /projects/inbox shows feed
# - [ ] Project messages work
```

### Self-Improvement Analysis

**Launch this agent after all work is complete:**

#### Agent 18: Session C Retrospective
```
Task: Analyze Session C and update documentation.

PROCESS:
1. ANALYZE PAGE PATTERNS:
   - What patterns emerged for portal pages?
   - Which components were reused effectively?
   - What new components were created?
   - Were there any consistency issues?

2. IDENTIFY REUSABLE COMPONENTS:
   - List components created that could be reused
   - Document their APIs
   - Add to component library docs

3. UPDATE CLAUDE.MD:
   Add:
   - Portal page patterns
   - Client/Sub/Field portal conventions
   - New hooks created
   - Navigation structure

4. UPDATE COMPONENT_PATTERNS.md:
   Add patterns for:
   - Portal pages (client, sub, field)
   - Gallery components
   - Calendar/timeline views
   - Messaging components

5. UPDATE help docs:
   - If any user-facing features changed, update help docs
   - Ensure feature descriptions match implementation

6. CREATE SESSION LEARNINGS:
   .claude-sessions/SESSION-C-learnings.md
   - Pages converted from Coming Soon
   - Components created/enhanced
   - Patterns established
   - Any remaining gaps

7. UPDATE SPRINT_STATUS.md:
   - Mark Phases 5 and 6 complete
   - Update "Coming Soon" count (should be 0 or near 0)

DELIVERABLE: Comprehensive documentation updates
```

---

## Session C Completion Checklist

### Client Portal
- [ ] /client/projects functional
- [ ] /client/messages functional
- [ ] /client/photos functional

### Field Portal
- [ ] /field/schedule calendar view
- [ ] Offline project downloads
- [ ] Voice log UI polished

### Sub Portal
- [ ] /sub/invoices create and list
- [ ] /sub/photos upload and view
- [ ] /sub/bids full workflow

### Dashboard
- [ ] /projects/schedule timeline
- [ ] /projects/crew assignment grid
- [ ] /projects/time summary
- [ ] /projects/inbox notifications
- [ ] Project messages working

### Cleanup
- [ ] No remaining Coming Soon pages
- [ ] Navigation updated
- [ ] All pages accessible

### Quality
- [ ] TypeScript passing
- [ ] Tests passing
- [ ] Mobile-responsive verified
- [ ] Self-improvement complete

---

## Next Session

After completing Session C, proceed to:
**Session D: Integrations + Security** (`.claude-sessions/SESSION-D-integrations-security.md`)
