# Suite 08: Scheduling & Calendar

## Overview
Tests for calendar views, event scheduling, availability management, and time-based features.

**Priority:** MEDIUM
**Roles to Test:** owner, project_manager, employee, contractor
**Estimated Duration:** 25 minutes

---

## Preconditions
- App running at localhost:3000
- Logged in as OWNER role
- At least 1 active project exists
- Calendar/scheduling module is enabled

---

## Tests

### TEST: 08-001 View Calendar Page
**Priority:** P0
**Roles:** owner, project_manager, employee
**Viewports:** desktop

#### Steps
1. Navigate to /dashboard/calendar or /dashboard/scheduling
2. Wait for calendar to load
3. Observe calendar view

#### Expected Results
- [ ] Calendar grid is visible
- [ ] Current month/week is displayed
- [ ] Today's date is highlighted
- [ ] Existing events/tasks are shown
- [ ] Navigation controls (prev/next month) work

---

### TEST: 08-002 Switch Calendar Views
**Priority:** P1
**Roles:** owner, project_manager
**Viewports:** desktop

#### Steps
1. Navigate to calendar
2. Click "Week" view button
3. Observe week view
4. Click "Month" view button
5. Observe month view
6. Click "Day" view button (if available)

#### Expected Results
- [ ] Week view shows 7 days with time slots
- [ ] Month view shows full month grid
- [ ] Day view shows detailed hourly breakdown
- [ ] Events display correctly in each view
- [ ] Current view is visually indicated

---

### TEST: 08-003 Create Calendar Event
**Priority:** P0
**Roles:** owner, project_manager
**Viewports:** desktop

#### Steps
1. Login as OWNER or PM
2. Navigate to calendar
3. Click on a date or "New Event" button
4. Fill in: Title="Site Visit", Date=tomorrow, Time=9:00 AM
5. Select project association (optional)
6. Save event

#### Expected Results
- [ ] Event creation modal appears
- [ ] Date/time pickers work correctly
- [ ] Project dropdown shows active projects
- [ ] Event appears on calendar after saving
- [ ] Success toast appears

---

### TEST: 08-004 Edit Calendar Event
**Priority:** P1
**Roles:** owner, project_manager
**Viewports:** desktop

#### Preconditions
- At least one event exists on calendar

#### Steps
1. Navigate to calendar
2. Click on an existing event
3. Click "Edit" button
4. Change time to 2:00 PM
5. Save changes

#### Expected Results
- [ ] Event detail modal/popup appears
- [ ] Edit form is pre-filled with existing data
- [ ] Changes save successfully
- [ ] Event moves to new time slot
- [ ] Success message appears

---

### TEST: 08-005 Delete Calendar Event
**Priority:** P1
**Roles:** owner, project_manager
**Viewports:** desktop

#### Steps
1. Navigate to calendar
2. Click on an existing event
3. Click "Delete" button
4. Confirm deletion

#### Expected Results
- [ ] Confirmation dialog appears
- [ ] Event is removed from calendar
- [ ] Success message appears
- [ ] Calendar updates immediately

---

### TEST: 08-006 View Project Schedule/Timeline
**Priority:** P0
**Roles:** owner, project_manager
**Viewports:** desktop

#### Steps
1. Navigate to /dashboard/projects
2. Click on an active project
3. Navigate to "Schedule" or "Timeline" tab
4. Observe project schedule

#### Expected Results
- [ ] Project phases/milestones are visible
- [ ] Start and end dates are shown
- [ ] Timeline or Gantt-style view displays
- [ ] Current progress is indicated
- [ ] Dependencies shown (if implemented)

---

### TEST: 08-007 Employee Calendar View
**Priority:** P1
**Roles:** employee
**Viewports:** desktop

#### Preconditions
- Logged in as OWNER, impersonating EMPLOYEE role

#### Steps
1. Navigate to calendar
2. Observe visible events

#### Expected Results
- [ ] Calendar is accessible
- [ ] Only sees assigned tasks/events
- [ ] Cannot see other team members' personal events
- [ ] Can see project milestones for assigned projects
- [ ] Cannot create events for projects not assigned to

---

### TEST: 08-008 Contractor Calendar View
**Priority:** P1
**Roles:** contractor
**Viewports:** desktop

#### Preconditions
- Logged in as OWNER, impersonating CONTRACTOR role

#### Steps
1. Navigate to calendar
2. Observe visible events

#### Expected Results
- [ ] Calendar shows only contractor's assigned work
- [ ] Cannot see internal company events
- [ ] Cannot see other contractors' schedules
- [ ] Project deadlines for assigned projects visible

---

### TEST: 08-009 Navigate Calendar Months
**Priority:** P1
**Roles:** owner
**Viewports:** desktop

#### Steps
1. Navigate to calendar (month view)
2. Click "Next Month" arrow
3. Observe calendar updates
4. Click "Previous Month" arrow
5. Click "Today" button

#### Expected Results
- [ ] Month advances/retreats correctly
- [ ] Events for each month display properly
- [ ] "Today" button returns to current month
- [ ] Month/year header updates correctly
- [ ] Smooth transition between months

---

### TEST: 08-010 Calendar Mobile View
**Priority:** P0
**Roles:** owner, employee
**Viewports:** mobile (375x812)

#### Steps
1. Resize browser to 375x812
2. Navigate to calendar
3. Interact with calendar

#### Expected Results
- [ ] Calendar adapts to mobile layout
- [ ] Day view or agenda view is default (not month grid)
- [ ] Events are tappable and readable
- [ ] Date navigation works via swipe or buttons
- [ ] "Add Event" is accessible
- [ ] No horizontal scroll required

---

### TEST: 08-011 Time Entry from Calendar
**Priority:** P1
**Roles:** employee, contractor
**Viewports:** desktop

#### Steps
1. Navigate to calendar
2. Find time entry option (if integrated)
3. Click to add time entry
4. Fill in hours and project
5. Save

#### Expected Results
- [ ] Time entry option is visible on calendar
- [ ] Can select date and project
- [ ] Hours/duration input works correctly
- [ ] Time entry saves successfully
- [ ] Appears in time tracking reports

---

### TEST: 08-012 Availability/Out of Office
**Priority:** P2
**Roles:** owner, project_manager
**Viewports:** desktop

#### Steps
1. Navigate to calendar or settings
2. Find "Set Availability" or "Out of Office"
3. Mark dates as unavailable
4. Save

#### Expected Results
- [ ] Availability settings accessible
- [ ] Can select date range
- [ ] Unavailable dates show differently on calendar
- [ ] Other users can see availability status
- [ ] Prevents scheduling on unavailable dates (if implemented)

---

### TEST: 08-013 Project Deadline Visibility
**Priority:** P1
**Roles:** owner, project_manager
**Viewports:** desktop

#### Preconditions
- Projects exist with due dates

#### Steps
1. Navigate to calendar
2. Look for project deadline markers
3. Click on a project deadline

#### Expected Results
- [ ] Project deadlines appear on calendar
- [ ] Visually distinct from regular events
- [ ] Clicking shows project details or links to project
- [ ] Overdue deadlines highlighted in red/warning color

---

### TEST: 08-014 Recurring Events
**Priority:** P2
**Roles:** owner, project_manager
**Viewports:** desktop

#### Steps
1. Create a new event
2. Set recurrence: Weekly on Monday
3. Save
4. Navigate to following weeks

#### Expected Results
- [ ] Recurrence options available in event form
- [ ] Event appears on specified recurring days
- [ ] Can edit single instance or all instances
- [ ] Can stop/end recurrence

---

### TEST: 08-015 Calendar Sync Notification
**Priority:** P3
**Roles:** owner, project_manager
**Viewports:** desktop

#### Steps
1. Navigate to calendar settings
2. Look for calendar sync options (Google, Outlook)
3. Observe sync status

#### Expected Results
- [ ] Sync options are visible (if implemented)
- [ ] Connection status is shown
- [ ] Can disconnect/reconnect calendar
- [ ] Synced events appear with indicator

---

## Test Data Requirements

```json
{
  "calendarEvents": [
    {
      "title": "E2E Test Event",
      "date": "tomorrow",
      "time": "10:00 AM",
      "project": "E2E Test Project - Active"
    },
    {
      "title": "Weekly Team Meeting",
      "date": "next Monday",
      "time": "9:00 AM",
      "recurring": "weekly"
    }
  ]
}
```

---

## Cleanup Actions
1. Delete any test events created
2. Remove any availability blocks set during testing
3. Cancel any recurring events created
4. Return to OWNER role if impersonating
