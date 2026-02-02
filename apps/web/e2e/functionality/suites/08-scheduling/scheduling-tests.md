# Suite 08: Scheduling & Time Tracking Tests

## Overview

Tests calendar functionality, schedule events, time entries, timesheets, and availability management.

**Priority:** P1
**Estimated Time:** 25 minutes
**Prerequisite:** Team members exist

---

## Part A: Calendar & Scheduling

### SCHED-001: View Calendar
**Priority:** CRITICAL
**Expected:** Calendar renders correctly

```
STEPS:
1. Navigate to /dashboard/schedule
2. Wait for calendar to load

VERIFY:
[ ] Calendar displays
[ ] Current month/week visible
[ ] Navigation (prev/next) works
[ ] Can switch views (day/week/month if available)
[ ] Events display on correct dates

CONSOLE CHECK:
[ ] Schedule events fetched
[ ] No rendering errors

RESULT: PASS / FAIL
```

### SCHED-002: Create Schedule Event
**Priority:** CRITICAL
**Expected:** Can create new schedule event

```
STEPS:
1. Click on a date or "Add Event"
2. Fill in:
   - Title: "Site Visit - Test Project"
   - Date: Tomorrow
   - Time: 9:00 AM - 12:00 PM
   - Project: Select project
   - Crew: Select members
3. Save

VERIFY:
[ ] Event created
[ ] Appears on calendar
[ ] Correct date/time shown
[ ] Assigned crew visible

CONSOLE CHECK:
[ ] Event saved to Firestore

RESULT: PASS / FAIL
```

### SCHED-003: Edit Schedule Event
**Priority:** MAJOR
**Expected:** Can modify events

```
STEPS:
1. Click on existing event
2. Change time
3. Change assigned crew
4. Save

VERIFY:
[ ] Changes saved
[ ] Calendar updates
[ ] Crew reassigned

RESULT: PASS / FAIL
```

### SCHED-004: Delete Schedule Event
**Priority:** MAJOR
**Expected:** Can delete events

```
STEPS:
1. Open an event
2. Delete event

VERIFY:
[ ] Confirmation required
[ ] Event removed from calendar

RESULT: PASS / FAIL
```

### SCHED-005: Recurring Events
**Priority:** MINOR
**Expected:** Can create recurring events (if implemented)

```
STEPS:
1. Create event
2. Set recurrence (daily/weekly)
3. Save

VERIFY:
[ ] Multiple instances created
[ ] Correct dates
[ ] OR feature not implemented

RESULT: PASS / FAIL / NOT IMPLEMENTED
```

### SCHED-006: Schedule Conflicts
**Priority:** MAJOR
**Expected:** Warns about scheduling conflicts

```
STEPS:
1. Schedule employee for 9-12 on Monday
2. Try to schedule same employee 10-11 on Monday

VERIFY:
[ ] Conflict warning shown
[ ] Can proceed with override (or prevented)
[ ] Conflict logged/tracked

RESULT: PASS / FAIL / NOT IMPLEMENTED
```

---

## Part B: Time Tracking

### SCHED-007: Clock In/Out
**Priority:** CRITICAL
**Expected:** Can clock in and out

```
STEPS:
1. Navigate to time tracking (field portal or time page)
2. Click "Clock In"
3. Wait/do work
4. Click "Clock Out"

VERIFY:
[ ] Clock in recorded with timestamp
[ ] Timer shows (if applicable)
[ ] Clock out recorded
[ ] Duration calculated correctly

CONSOLE CHECK:
[ ] Time entries created

RESULT: PASS / FAIL
```

### SCHED-008: Manual Time Entry
**Priority:** CRITICAL
**Expected:** Can add time entries manually

```
STEPS:
1. Go to time tracking
2. Click "Add Time Entry"
3. Fill in:
   - Date: Today
   - Project: Select
   - Hours: 8
   - Description: "Site work"
4. Save

VERIFY:
[ ] Entry created
[ ] Hours recorded
[ ] Project linked

RESULT: PASS / FAIL
```

### SCHED-009: Edit Time Entry
**Priority:** MAJOR
**Expected:** Can edit own time entries

```
STEPS:
1. Find a time entry
2. Edit hours
3. Save

VERIFY:
[ ] Changes saved
[ ] Updated hours display
[ ] Only own entries editable (unless admin)

RESULT: PASS / FAIL
```

### SCHED-010: Delete Time Entry
**Priority:** MAJOR
**Expected:** Can delete time entries

```
STEPS:
1. Find a time entry
2. Delete

VERIFY:
[ ] Entry removed
[ ] Hours removed from totals

RESULT: PASS / FAIL
```

### SCHED-011: View Time by Date Range
**Priority:** MAJOR
**Expected:** Can filter time entries by date

```
STEPS:
1. Set date range filter
2. View entries

VERIFY:
[ ] Only entries in range shown
[ ] Totals recalculated for range

RESULT: PASS / FAIL
```

---

## Part C: Timesheets

### SCHED-012: View Weekly Timesheet
**Priority:** CRITICAL
**Expected:** Weekly timesheet displays

```
STEPS:
1. Navigate to timesheets
2. View current week

VERIFY:
[ ] Week displayed
[ ] Days of week shown
[ ] Hours per day visible
[ ] Weekly total calculated

RESULT: PASS / FAIL
```

### SCHED-013: Submit Timesheet
**Priority:** CRITICAL
**Expected:** Can submit timesheet for approval

```
STEPS:
1. Complete time entries for week
2. Click "Submit" or "Submit for Approval"

VERIFY:
[ ] Timesheet status changes to "submitted"
[ ] Cannot edit after submission (or warning)
[ ] Manager notified (if applicable)

RESULT: PASS / FAIL
```

### SCHED-014: Approve Timesheet
**Priority:** CRITICAL
**Expected:** Manager can approve timesheets

```
STEPS:
1. As manager/admin, view pending timesheets
2. Select a submitted timesheet
3. Approve

VERIFY:
[ ] Status changes to "approved"
[ ] Ready for payroll
[ ] Approver recorded

RESULT: PASS / FAIL
```

### SCHED-015: Reject Timesheet
**Priority:** MAJOR
**Expected:** Can reject with reason

```
STEPS:
1. Select submitted timesheet
2. Reject with reason

VERIFY:
[ ] Status changes to "rejected"
[ ] Reason saved
[ ] Employee can edit and resubmit

RESULT: PASS / FAIL
```

---

## Part D: Availability

### SCHED-016: Set Availability
**Priority:** MAJOR
**Expected:** User can set availability

```
STEPS:
1. Navigate to availability settings
2. Set available hours for week
3. Save

VERIFY:
[ ] Availability saved
[ ] Reflected in scheduling views
[ ] Managers can see availability

RESULT: PASS / FAIL
```

### SCHED-017: Request Time Off
**Priority:** MAJOR
**Expected:** Can request time off

```
STEPS:
1. Find time off request option
2. Request day off:
   - Date: Next Friday
   - Reason: Personal
3. Submit

VERIFY:
[ ] Request submitted
[ ] Status: pending
[ ] Date marked as unavailable (after approval)

RESULT: PASS / FAIL
```

### SCHED-018: Approve Time Off
**Priority:** MAJOR
**Expected:** Manager can approve time off

```
STEPS:
1. View pending time off requests
2. Approve request

VERIFY:
[ ] Status: approved
[ ] Availability updated
[ ] Calendar shows day blocked

RESULT: PASS / FAIL
```

---

## Scheduling Test Summary

```
| Test ID | Test Name | Status | Console Errors |
|---------|-----------|--------|----------------|
| SCHED-001 | View Calendar | | |
| SCHED-002 | Create Event | | |
| SCHED-003 | Edit Event | | |
| SCHED-004 | Delete Event | | |
| SCHED-005 | Recurring | | |
| SCHED-006 | Conflicts | | |
| SCHED-007 | Clock In/Out | | |
| SCHED-008 | Manual Entry | | |
| SCHED-009 | Edit Entry | | |
| SCHED-010 | Delete Entry | | |
| SCHED-011 | Date Range | | |
| SCHED-012 | Weekly Sheet | | |
| SCHED-013 | Submit Sheet | | |
| SCHED-014 | Approve Sheet | | |
| SCHED-015 | Reject Sheet | | |
| SCHED-016 | Availability | | |
| SCHED-017 | Time Off Req | | |
| SCHED-018 | Approve PTO | | |

TOTAL: 18 tests
PASSED: ___
FAILED: ___
```

## Next Suite

→ Proceed to Suite 09: Documents & Signatures Tests
