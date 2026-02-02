# Field Portal Documentation

> **Purpose:** Mobile-first, offline-capable portal for field workers.
> **Routes:** `/field/*`
> **Users:** Employees, Contractors

---

## Overview

The Field Portal is a mobile-optimized interface designed for construction workers on job sites. It provides essential functionality for:
- Time tracking (clock in/out)
- Task management
- Photo documentation
- Daily log creation
- Schedule management
- Voice-activated commands

The portal works offline, automatically syncing data when connectivity is restored.

---

## Access & Permissions

| Role | Access Level |
|------|-------------|
| EMPLOYEE | Full access |
| CONTRACTOR | Full access |
| FOREMAN | Full access |

Field workers can only see and modify:
- Their own time entries
- Tasks assigned to them
- Photos for their organization
- Daily logs for their projects

---

## Pages

### Dashboard (`/field`)

The main landing page showing today's status.

**Features:**
- Time clock card with active session display
- Geofence-based clock-in/out with location tracking
- Project selector for time entries
- Today's assigned tasks (top 5)
- Quick action cards (Take Photo, Report Issue)
- Greeting with current date

### Time Tracking (`/field/time`)

Comprehensive time entry management.

| Tab | Purpose |
|-----|---------|
| Entries | List of time entries by date |
| Weekly | Aggregated hours by day with submission |
| Add Entry | Manual entry form |

**Features:**
- Clock in/out with optional project selection
- Manual time entry creation
- Break time management
- Notes for each entry
- Weekly timesheet submission
- Sync status indicators

### Tasks (`/field/tasks`)

Mobile-optimized task management.

**Features:**
- Project filter dropdown
- Status tabs: My Tasks, Pending, In Progress, Completed, All
- Swipe-to-complete gesture
- Task status updates with notes
- Priority and due date indicators
- Completion statistics bar

**Gestures:**
- Swipe left to reveal "Mark Complete" action
- Pull to refresh

### Photos (`/field/photos`)

Photo capture and gallery.

**Categories:**
- Progress, Issue, Before, After
- Inspection, Safety, Material

**Features:**
- In-app camera integration
- Grid/list view toggle
- Category filtering
- Full-screen preview modal
- Pending uploads badge
- Manual sync button

**Metadata Captured:**
- Category, caption, tags
- GPS location (if permitted)
- Timestamp
- User attribution

### Daily Log (`/field/daily-log`)

Project documentation and reporting.

**Form Fields:**
- Date and category selection
- Title and description
- Weather (condition, temp high/low)
- Work performed (bulleted list)
- Workers on site (from cached team)
- Crew count and hours worked
- Delays and issues
- Summary notes

**Categories:**
- General, Progress, Issue, Safety
- Weather, Delivery, Inspection
- Subcontractor, Equipment

### Schedule (`/field/schedule`)

Availability and assignment management.

**Features:**
- Weekly default availability editor
- Monthly availability calendar
- Date override (mark specific days unavailable)
- Assignment view (your scheduled work)

### Voice Logs (`/field/voice-logs`)

Voice note recording for field documentation.

**Features:**
- Microphone recording interface
- List view of recorded logs
- Playback and metadata display
- Status filtering

---

## Offline Capabilities

All core features work without network connectivity.

### What Works Offline

| Feature | Offline Support | Notes |
|---------|----------------|-------|
| Clock In/Out | Yes | Queues sync automatically |
| View Tasks | Yes | Uses cached task list |
| Update Task Status | Yes | Queues until online |
| Take Photos | Yes | Compressed and stored locally |
| Create Daily Log | Yes | Full form available |
| View Schedule | No | Requires live data |
| Voice Recording | Partial | Local storage only |

### Data Storage

- **IndexedDB**: Primary local storage
- **TTL**: 24h for projects, 7d for team members
- **Photo Compression**: Max 2048px, 85% quality
- **Thumbnails**: 200px, 60% quality (instant display)

### Sync Behavior

1. Operations queue in IndexedDB when offline
2. Network status monitored continuously
3. Auto-sync triggers on reconnection
4. Exponential backoff for failed retries (max 5)
5. Visual indicators show pending/syncing/failed counts

### Conflict Resolution

When both server and client modify the same record:
- **Server wins** (default): Server data preserved
- **Client wins**: Local changes applied
- **Merge**: Combine both (client overrides server fields)
- **Manual**: Flagged for user resolution

---

## Voice Commands

Natural language commands for hands-free operation.

### Supported Command Types

**Time Entry:**
```
"Log 4 hours framing at Smith house"
"Add 2 and a half hours drywall"
"Record thirty minutes meeting"
```

**Daily Log:**
```
"Today was sunny and 75 degrees. We had 5 crew members on site."
"Weather was rainy. 3 guys worked on interior drywall."
"Inspection passed for electrical rough-in."
```

**Task Updates:**
```
"Mark drywall installation complete"
"Start working on electrical rough-in"
"Finish the painting in master bedroom"
```

### How to Use

1. Tap the microphone FAB (bottom-right)
2. Speak your command naturally
3. Review the parsed result
4. Confirm or cancel

### Voice Command Flow

```
User taps FAB → Speech recognition starts
                      ↓
              User speaks command
                      ↓
              Recognition ends → Parser processes transcript
                      ↓
              Show confirmation modal with parsed data
                      ↓
              User confirms → Execute action
```

### Parser Capabilities

- **Auto-detection**: Determines command type from keywords
- **Fuzzy matching**: Handles speech recognition errors
- **Project matching**: Finds projects by partial name
- **Time parsing**: Understands "4 hours", "thirty minutes", "2.5 hrs"
- **Confidence scoring**: Warns on low-confidence parses

---

## UI Patterns

### Mobile Optimizations

- **Touch targets**: 48px minimum for all interactive elements
- **Swipe gestures**: Swipe-to-complete on tasks
- **Pull-to-refresh**: On all list views
- **Bottom navigation**: 5 main sections
- **Safe area padding**: Respects notch/home indicator
- **Haptic feedback**: On voice activation

### Status Indicators

| State | Visual |
|-------|--------|
| Online | Hidden or green |
| Offline | Yellow banner |
| Syncing | Blue spinner |
| Pending | Amber badge with count |
| Failed | Red badge |

### Loading States

- Skeleton placeholders during data fetch
- Loading spinner in buttons
- Progress indicators for photo uploads

---

## Components

Key field-specific components in `components/field/`:

| Component | Purpose |
|-----------|---------|
| `OfflineTaskCard` | Task with swipe actions |
| `OfflineDailyLogForm` | Daily log creation form |
| `BottomNavigation` | Mobile nav bar |
| `PullToRefresh` | Gesture-based refresh |
| `SwipeableCard` | Swipe action pattern |
| `QuickActionsFAB` | Floating action buttons |
| `MobileFieldLayout` | Layout wrapper |
| `TouchTarget` | 48px touch compliance |
| `OptimizedPhotoGrid` | Lazy-loaded gallery |

---

## Firestore Collections

| Collection | Usage |
|-----------|-------|
| `organizations/{orgId}/timeEntries` | Clock data |
| `tasks` | Task records (filtered by assignment) |
| `projects` | Project listing (filtered by org) |
| `projectPhotos` | Photo storage |
| `geofences` | Location restrictions |
| `dailyLogs` | Daily work logs |

---

## Related Documentation

- [Architecture - Offline Mode](./ARCHITECTURE.md#offline-mode-architecture)
- [Architecture - Voice Commands](./ARCHITECTURE.md#voice-command-system)
- [Testing - Mobile UI](./TESTING_STRATEGY.md)
