---
title: "Time Tracking Overview"
description: "Understanding time tracking and payroll in ContractorOS"
audience: ["owner", "pm", "employee"]
module: "time-tracking"
difficulty: "beginner"
time_to_complete: "10 minutes"
video_url: ""
walkthrough_id: "time-tracking-tour"
last_updated: "2025-01-30"
status: "draft"
---

<!-- STATUS: DRAFT -->
<!-- NEEDS_VIDEO: Time tracking overview -->
<!-- NEEDS_WALKTHROUGH: Time tracking tour -->

# Time Tracking Overview

Accurate time tracking is essential for payroll, job costing, and profitability analysis. ContractorOS makes it easy for field workers to log time and for managers to approve and process it.

---

## Why Track Time?

### For Field Workers
- Get paid accurately for hours worked
- Document what you did each day
- Track breaks and overtime
- Build a record of your work

### For Managers
- Know who worked where and when
- Calculate job costs accurately
- Process payroll efficiently
- Bill clients for time-and-materials work

### For the Business
- Understand true project costs
- Identify profitable vs. unprofitable jobs
- Improve future estimates
- Meet labor law compliance

---

## Time Entry Basics

A time entry includes:

| Field | Description |
|-------|-------------|
| **Date** | When the work was done |
| **Project** | Which job |
| **Phase** | Which phase of work (optional) |
| **Task** | Specific task worked (optional) |
| **Hours** | Duration of work |
| **Start/End Time** | Clock in/out times |
| **Description** | What was accomplished |
| **Break Time** | Lunch and other breaks |

---

## Ways to Log Time

### Method 1: Clock In/Out

Real-time tracking:

1. Open ContractorOS (or field portal)
2. Click **Clock In**
3. Select project
4. Work your shift
5. Take breaks (click **Start Break** / **End Break**)
6. Click **Clock Out** when done

**Pros**: Most accurate, captures exact times
**Best for**: Employees who remember to clock in/out

### Method 2: Manual Entry

After-the-fact entry:

1. Go to **Time Tracking → + Add Entry**
2. Select date
3. Select project (and optionally phase/task)
4. Enter hours worked
5. Add description
6. Save

**Pros**: Flexible, can enter anytime
**Best for**: Catching up on forgotten entries

### Method 3: Voice Log

<!-- STATUS: COMING_SOON -->
<!-- Voice log integration with time entries in development -->

> **Coming Soon**: Log time by voice at the end of each day. Just talk about what you did, and ContractorOS extracts the time entries.

→ [Voice logs](/help/field-portal/voice-logs.guide.md)

### Method 4: Weekly Timesheet

Bulk entry for the week:

1. Go to **Time Tracking → Weekly View**
2. See Monday-Sunday grid
3. Enter hours per project per day
4. Submit at end of week

**Pros**: Efficient for routine schedules
**Best for**: Office staff, consistent schedules

---

## Time Entry Status

Entries move through a workflow:

| Status | Meaning |
|--------|---------|
| **Draft** | Entry saved but not submitted |
| **Submitted** | Awaiting manager approval |
| **Approved** | Verified, ready for payroll |
| **Rejected** | Manager returned for correction |
| **Paid** | Included in payroll run |

### Field Worker View
- See your entries and their status
- Edit draft or rejected entries
- View approved/paid entries (read-only)

### Manager View
- See all submitted entries
- Approve, reject, or edit entries
- Run approval in bulk

---

## Breaks and Overtime

### Tracking Breaks

| Break Type | How to Track |
|------------|--------------|
| **Lunch** | Click **Start Break** → **End Break** |
| **Short break** | Include in work time (< 15 min) |
| **Unpaid break** | Log separately or enter break duration |

Break time is subtracted from total hours.

### Overtime Calculation

ContractorOS calculates overtime based on your settings:

| Rule | Default |
|------|---------|
| Daily overtime | After 8 hours |
| Weekly overtime | After 40 hours |
| Double time | After 12 hours (daily) |

Configure overtime rules in **Settings → Payroll**.

---

## Viewing Time Entries

### My Time

Go to **Time Tracking** to see your entries:

| View | Shows |
|------|-------|
| **Day** | Today's entries and clock status |
| **Week** | Current week's entries by day |
| **Month** | Monthly calendar view |
| **List** | All entries with filters |

### Team Time (Managers)

See all team entries:

1. Go to **Time Tracking**
2. Click **Team View**
3. Filter by:
   - Team member
   - Date range
   - Project
   - Status

---

## Approving Time (Managers)

### Individual Approval

1. Open a submitted entry
2. Review details
3. Click **Approve** or **Reject**
4. If rejecting, add a note explaining why

### Bulk Approval

1. Go to **Time Tracking → Team View**
2. Filter to **Submitted** status
3. Check entries to approve
4. Click **Approve Selected**

### Best Practices

- Approve time at least weekly
- Review unusual entries (very long or short hours)
- Check project assignments are correct
- Note any patterns needing discussion

---

## Time and Job Costing

Time entries feed job costing:

### How It Works

1. Employee logs 8 hours on Smith Kitchen Remodel
2. Employee's hourly rate: $35/hour
3. Labor cost added to project: $280

### Viewing Labor Costs

On any project:
1. Go to **Financial** tab
2. See **Labor Costs** section
3. View total hours and cost
4. Break down by phase or team member

### Billing Rates vs. Cost Rates

| Rate Type | Purpose |
|-----------|---------|
| **Cost Rate** | What you pay the employee (for costing) |
| **Bill Rate** | What you charge the client (for T&M billing) |

Configure rates in **Settings → Team → [Employee] → Rates**.

---

## Time and Payroll

Time entries are the foundation of payroll:

### Payroll Workflow

1. Team logs time throughout pay period
2. Managers approve time by cutoff date
3. Payroll admin reviews and runs payroll
4. Entries marked as **Paid**

→ [Payroll guide](/help/time-tracking/payroll.guide.md)

### Locked Entries

Entries included in a payroll run become locked:
- Cannot be edited
- Cannot be deleted
- Adjustments require new entries

---

## Geolocation Tracking

<!-- STATUS: COMING_SOON -->
<!-- Geofencing and location verification in development -->

> **Coming Soon**: Location verification features:
> - See where clock-ins occurred
> - Set up job site geofences
> - Alerts for off-site clock-ins

For now, time entries include optional location notes.

---

## Reports

Time data powers several reports:

| Report | Shows |
|--------|-------|
| **Time by Employee** | Hours worked per person |
| **Time by Project** | Labor hours per job |
| **Time by Phase** | Where time is spent in projects |
| **Overtime Report** | Overtime hours and costs |
| **Timesheet Report** | Printable timesheets |

→ [Reports overview](/help/reports/overview.md)

---

## Jobs to Be Done

### "I need to log my hours for today"
→ [Log time](/help/time-tracking/log-time.guide.md)

### "I forgot to clock in this morning"
Edit today's entry or create manual entry with correct times

### "I need to approve my team's time"
→ [Approving time](/help/time-tracking/approve-time.guide.md)

### "I need to see how much labor we've used on a project"
Open project → Financial tab → Labor Costs

### "I need to run payroll"
→ [Payroll guide](/help/time-tracking/payroll.guide.md)

### "I need to fix a mistake on an approved entry"
Contact manager to unlock, or create adjustment entry

---

## Best Practices

### For Field Workers

- **Clock in when you arrive** - Don't wait until you start actual work
- **Log breaks accurately** - Protects you and the company
- **Add descriptions** - "Installed cabinets" is better than nothing
- **Submit daily** - Don't let entries pile up

### For Managers

- **Approve promptly** - Don't make employees wait
- **Review regularly** - Catch errors before payroll
- **Communicate rejections** - Explain why you rejected
- **Check trends** - Unusual patterns may indicate issues

---

## Common Questions

### What if I forget to clock out?

Options:
1. Edit the entry to add end time
2. Ask your manager to fix it
3. For repeated issues, set a reminder

### Can I edit approved time?

Only managers can unlock approved entries. Contact your PM if you find an error.

### What counts as "hours worked"?

- Travel to first job site: Usually not
- Travel between job sites: Yes
- Lunch: Usually no (unless working lunch)
- Short breaks (< 15 min): Yes

Specific rules vary by state and company policy.

### Can clients see my time entries?

Clients see labor costs in progress reports, but not individual time entries or employee names.

---

## Troubleshooting

### Clock in button not working

Check:
- Internet connection
- App permissions (location, if required)
- Already clocked in somewhere?

### Entry not showing up

Check:
- Correct date selected?
- Entry was saved (not just closed)?
- Filter hiding it (status, project)?

### Time doesn't match paycheck

Possible reasons:
- Entry not approved before payroll cutoff
- Different pay period than expected
- Overtime calculated differently than expected
- Contact payroll admin to investigate

---

## Related Topics

- [Log time](/help/time-tracking/log-time.guide.md)
- [Approve time](/help/time-tracking/approve-time.guide.md)
- [Payroll](/help/time-tracking/payroll.guide.md)
- [Field portal](/help/field-portal/overview.md)
- [Reports](/help/reports/overview.md)
