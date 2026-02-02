---
title: "Scheduling Overview"
description: "Plan projects, assign resources, and keep everyone on track"
audience: ["owner", "pm"]
module: "scheduling"
difficulty: "intermediate"
time_to_complete: "12 minutes"
video_url: ""
walkthrough_id: "scheduling-tour"
last_updated: "2025-01-30"
status: "draft"
---

<!-- STATUS: DRAFT -->
<!-- NEEDS_VIDEO: Scheduling overview -->
<!-- NEEDS_WALKTHROUGH: Scheduling tour -->

# Scheduling Overview

Build realistic schedules, assign resources, and keep projects on track. See everything in one place with calendar and Gantt views.

---

## What You'll Learn

| Job to Be Done | This Section Helps You |
|----------------|------------------------|
| Plan project timelines | Create and adjust schedules |
| Assign people to work | Resource allocation |
| Avoid conflicts | See who's available |
| Communicate schedules | Share with team and subs |
| Track progress | Monitor actual vs planned |

---

## Scheduling Concepts

### Hierarchy

```
Project
└── Phases
    └── Tasks
        └── Subtasks
```

Each level has:
- Start and end dates
- Assigned resources
- Dependencies (optional)
- Progress tracking

### Date Types

| Type | Meaning |
|------|---------|
| Planned | When you intend to do it |
| Scheduled | Confirmed on calendar |
| Actual | When it really happened |

### Duration vs Effort

- **Duration:** Calendar days (includes weekends, weather delays)
- **Effort:** Work hours required

Example: A task might take 16 hours of effort but span 3 calendar days.

---

## Views

### Calendar View

See work by day, week, or month:
- Color-coded by project
- Shows assigned team members
- Click to see details
- Drag to reschedule

**Best for:** Daily and weekly planning, team coordination

### Gantt Chart

Traditional project timeline view:
- Phases and tasks as bars
- Dependencies as arrows
- Critical path highlighted
- Drag to adjust dates

**Best for:** Project planning, timeline visualization, client presentations

### List View

Simple table format:
- All tasks in rows
- Sortable columns
- Filter by any field
- Bulk actions

**Best for:** Quick updates, data entry, filtering

### Resource View

<!-- STATUS: COMING_SOON - Resource calendar -->

See people's schedules:
- Who is working where
- Availability gaps
- Over-allocation warnings
- Capacity planning

---

## Creating a Schedule

### From Project Phases

When you set up project phases:

1. Create or edit a project
2. Add phases
3. Set start/end dates for each phase
4. Phases appear on schedule

### Adding Tasks

For each phase, add tasks:

1. Open the phase
2. Click **Add Task**
3. Enter task details
4. Set dates
5. Assign resources

### Setting Dependencies

Link tasks that must happen in sequence:

1. Open a task
2. Click **Add Dependency**
3. Select predecessor task
4. Choose relationship type:
   - Finish-to-Start (most common)
   - Start-to-Start
   - Finish-to-Finish
   - Start-to-Finish

**Example:** "Drywall cannot start until framing is complete"

→ [Build a project schedule](/help/scheduling/create-schedule.guide.md)

---

## Assigning Resources

### Team Members

Assign employees to tasks:

1. Open the task
2. Click **Assign**
3. Select team member(s)
4. They're notified automatically

### Subcontractors

Assign subs to phases or tasks:

1. Open the phase/task
2. Click **Assign Sub**
3. Select from your sub network
4. Set their schedule dates

### Checking Availability

Before assigning:
- See person's current schedule
- View workload percentage
- Identify conflicts
- Make informed decisions

---

## Managing the Schedule

### Moving Tasks

When things change:

**Drag and drop:**
- In calendar or Gantt view
- Grab and move to new date
- Dependencies update automatically

**Edit dates:**
- Open task details
- Change start/end dates
- Save changes

### Handling Delays

When work takes longer:

1. Update task end date
2. System recalculates dependent tasks
3. Review downstream impact
4. Communicate changes

### Adding Buffer

Build in contingency:
- Add buffer phases between major milestones
- Use realistic durations
- Account for weather, inspections, delays

---

## Dependencies

### Why Use Dependencies

- Realistic schedules
- Automatic updates when things change
- Clear understanding of sequence
- Critical path identification

### Dependency Types

| Type | Meaning | Example |
|------|---------|---------|
| Finish-to-Start | B starts when A finishes | Paint starts when drywall finishes |
| Start-to-Start | B starts when A starts | Rough electrical starts with rough plumbing |
| Finish-to-Finish | B finishes when A finishes | Final inspection when all work finishes |

### Managing Dependencies

1. Open task or use Gantt view
2. Click the chain icon
3. Select related task
4. Choose relationship
5. Dependencies shown as lines/arrows

### Critical Path

The longest chain of dependent tasks:
- Highlighted in Gantt view
- Delays here delay the project
- Focus resources on critical path

---

## Resource Management

### Workload View

<!-- STATUS: COMING_SOON - Workload visualization -->

See each person's allocation:
- Hours per day/week
- Over-allocation warnings
- Under-utilization opportunities

### Balancing Resources

When someone is overbooked:
- Reassign some tasks
- Adjust dates
- Add resources
- Negotiate priorities

### Capacity Planning

Plan ahead:
- See upcoming availability
- Schedule work in advance
- Avoid bottlenecks
- Hire when needed

---

## Weather & External Factors

### Weather Considerations

<!-- STATUS: COMING_SOON - Weather integration -->

Account for weather impact:
- Build in rain days
- Track weather delays
- Adjust schedules accordingly

### Inspections

Schedule around inspections:
- Add inspection tasks
- Allow time for corrections
- Dependencies on passing inspection

### Material Lead Times

Account for delivery:
- Order date vs delivery date
- Tasks dependent on materials
- Long-lead item tracking

---

## Communicating Schedules

### Team Notifications

Team members are notified of:
- New assignments
- Schedule changes
- Upcoming deadlines
- Delays affecting them

### Client Communication

Share schedules with clients:
- Client portal shows their project schedule
- Milestone updates
- Progress visibility

### Subcontractor Communication

Share relevant portions:
- Sub portal shows their scheduled work
- Start/end dates
- Scope details

### Exporting Schedules

Create shareable formats:
- PDF schedule report
- Calendar export (ICS)
- Excel for external sharing

---

## Tracking Progress

### Updating Status

As work completes:
- Mark tasks done
- Update percent complete
- Add actual end dates
- Log delays and reasons

### Actual vs Planned

Compare what happened to what was planned:
- Planned dates
- Actual start/end
- Duration variance
- Reason for variance

### Performance Metrics

Track scheduling performance:
- On-time completion rate
- Average delay by phase type
- Estimating accuracy
- Resource utilization

---

## Schedule Templates

### Using Templates

Speed up scheduling:

1. Select phase template during project setup
2. Template phases auto-populate
3. Adjust dates for this project
4. Add project-specific items

### Creating Templates

Save successful schedules:

1. Build out a complete schedule
2. Click **Save as Template**
3. Name the template
4. Available for future projects

---

## Best Practices

### Building Realistic Schedules

1. **Historical data** — Look at past similar projects
2. **Buffer time** — Add contingency for unknowns
3. **Team input** — Ask those doing the work
4. **Dependencies** — Map out the sequence
5. **Resource limits** — Don't over-commit people

### Managing Changes

1. **Document reasons** — Why did it change?
2. **Communicate quickly** — Tell affected parties
3. **Update dependencies** — Let the system recalculate
4. **Learn lessons** — Improve future estimates

### Avoiding Common Mistakes

| Mistake | Impact | Prevention |
|---------|--------|------------|
| No dependencies | Manual updates, errors | Always link related tasks |
| No buffer | Every delay cascades | Build in contingency |
| Overcommitting | Quality suffers, burnout | Check availability first |
| Ignoring weather | Unrealistic timelines | Plan for seasonal factors |

---

## Common Questions

### Can I see all my projects on one calendar?

Yes. The main calendar shows all active projects, color-coded for easy identification.

### What happens when I change a date?

Dependent tasks automatically update. You can review the changes before saving.

### Can subs see the whole project schedule?

No. Subs only see the phases/tasks they're assigned to.

### How do I handle a project delay?

Update the affected task. Dependencies will cascade. Communicate changes to stakeholders.

### Can I schedule the same person on multiple projects?

Yes, but the system will warn you about over-allocation.

---

## Permissions

| Action | Owner | PM | Employee | Sub |
|--------|-------|-----|----------|-----|
| View schedule | ✓ | ✓ | Own tasks | Own tasks |
| Create schedule | ✓ | ✓ | — | — |
| Edit schedule | ✓ | ✓ | — | — |
| Assign resources | ✓ | ✓ | — | — |
| Update own tasks | ✓ | ✓ | ✓ | ✓ |
| Export schedule | ✓ | ✓ | — | — |

---

## Related Topics

- [Create a project schedule](/help/scheduling/create-schedule.guide.md)
- [Gantt chart guide](/help/scheduling/gantt.guide.md)
- [Resource planning](/help/scheduling/resources.guide.md)
- [Phase management](/help/projects/phases.guide.md)
- [Task management](/help/projects/tasks.guide.md)
