---
title: "Managing Tasks"
description: "Create, assign, and track tasks to keep projects moving forward"
audience: ["owner", "pm", "employee"]
module: "projects"
difficulty: "beginner"
time_to_complete: "12 minutes"
video_url: ""
walkthrough_id: "tasks-overview"
last_updated: "2025-01-30"
status: "draft"
---

<!-- STATUS: DRAFT -->
<!-- NEEDS_VIDEO: Tasks overview walkthrough -->
<!-- NEEDS_WALKTHROUGH: Task management interactive -->

# Managing Tasks

Tasks are the actionable work items that drive your projects forward. This guide covers everything from creating tasks to tracking completion across your team.

---

## What Is a Task?

A task is a specific piece of work that needs to get done:

- "Install kitchen cabinets"
- "Schedule electrical inspection"
- "Order countertop materials"
- "Review shop drawings with client"

### Task Properties

| Property | Description |
|----------|-------------|
| **Title** | Clear, action-oriented name |
| **Description** | Details, specs, notes |
| **Assignee** | Who's responsible |
| **Due Date** | When it needs to be done |
| **Priority** | Low, Medium, High, Urgent |
| **Status** | To Do, In Progress, Complete, Blocked |
| **Phase** | Which phase it belongs to |
| **Project** | Which project it's part of |
| **Tags** | Custom labels for organization |

---

## Creating Tasks

### Quick Add

1. Open a project
2. Go to **Tasks** tab
3. Click **+ Add Task**
4. Enter task title
5. Press Enter

The task is created with defaults (no assignee, medium priority, current date).

### Detailed Add

1. Click **+ Add Task**
2. Click **More Options** (or the expand icon)
3. Fill in:
   - Title and description
   - Assignee
   - Due date
   - Priority
   - Phase
   - Tags
   - Checklist items (subtasks)
   - Attachments
4. Click **Create Task**

### From Phase View

1. Open a phase
2. Click **+ Add Task to Phase**
3. Task is automatically associated with that phase

### Bulk Add

1. Go to **Tasks** tab
2. Click **⋮ → Bulk Add**
3. Enter multiple tasks, one per line
4. Optionally set common properties (assignee, due date)
5. Click **Create All**

---

## Task Views

ContractorOS offers three ways to view tasks:

### List View

Traditional checklist format:
- Sort by due date, priority, assignee, or status
- Filter by phase, assignee, status
- Check boxes to mark complete
- Best for: Quick scanning and status updates

### Kanban View

Visual columns based on status:
- To Do | In Progress | Review | Complete
- Drag tasks between columns
- See bottlenecks at a glance
- Best for: Managing flow, team standups

### Gantt View

Timeline-based scheduling:
- Tasks shown as bars over time
- Dependencies visible as connectors
- Drag to reschedule
- Best for: Planning, client presentations

**Switch views** using the toggle in the top-right of the Tasks tab.

---

## Assigning Tasks

### Assign to Team Member

1. Open the task
2. Click the **Assignee** field
3. Select team member from dropdown
4. Save

Or from list view:
- Click the assignee avatar/name
- Select new assignee

### Assign to Subcontractor

<!-- STATUS: NEEDS_SCOPE -->
<!-- Sub assignment workflow needs refinement -->

1. Open the task
2. Click **Assignee**
3. Toggle to **Subcontractors**
4. Select the sub

Subs will see assigned tasks in their portal.

### Unassigned Tasks

Tasks without assignees appear in the "Unassigned" bucket. Review these regularly—nothing should stay unassigned for long.

---

## Task Status Workflow

### Default Statuses

| Status | Meaning |
|--------|---------|
| **To Do** | Not started |
| **In Progress** | Actively being worked |
| **Blocked** | Waiting on something |
| **Review** | Done, needs verification |
| **Complete** | Finished |

### Changing Status

**Option 1**: Click status badge, select new status

**Option 2**: Kanban view—drag to new column

**Option 3**: Quick complete—check the checkbox

### Custom Statuses

<!-- STATUS: COMING_SOON -->

> **Coming Soon**: Custom task statuses per project type. For now, use tags to add additional categorization.

---

## Due Dates and Scheduling

### Setting Due Dates

1. Click the **Due Date** field
2. Select date from calendar
3. Optionally set a time

### Date Indicators

| Visual | Meaning |
|--------|---------|
| No color | Due in future |
| Yellow | Due this week |
| Orange | Due tomorrow |
| Red | Due today |
| Red + strikethrough | Overdue |

### Recurring Tasks

<!-- STATUS: COMING_SOON -->

> **Coming Soon**: Recurring tasks for regular maintenance, inspections, and check-ins.

For now, create individual tasks or use task templates.

---

## Task Details

Click any task to open the detail panel:

### Description
Add detailed instructions, specifications, or context. Supports markdown formatting.

### Checklist
Break the task into subtasks:
1. Click **+ Add Checklist**
2. Add items one per line
3. Check items as completed
4. Task shows "3/5 complete" indicator

### Comments
Discuss the task with your team:
- @mention team members for notifications
- Attach files to comments
- Full comment history preserved

### Attachments
Add relevant files:
- Drag and drop, or click to upload
- Preview images inline
- Download any attachment

### Activity
See the complete history:
- When created and by whom
- Status changes
- Assignee changes
- Comments and edits

### Time Entries
Track time worked on this task:
- View time logged by team members
- See total hours
- Click to add time entry

---

## Task Priorities

### Priority Levels

| Priority | When to Use |
|----------|-------------|
| **Urgent** | Blocking other work, safety issue, client waiting |
| **High** | Important and time-sensitive |
| **Medium** | Normal priority (default) |
| **Low** | Nice to have, do when able |

### Setting Priority

1. Open task
2. Click **Priority** dropdown
3. Select level

### Priority Views

Filter by priority:
- Show only Urgent + High
- Sort by priority
- Group by priority

---

## Finding and Filtering Tasks

### Search

Use the search bar to find tasks by:
- Title or description text
- Assignee name
- Tag name

### Filters

Click **Filter** to show tasks by:
- Status (To Do, In Progress, etc.)
- Assignee
- Phase
- Priority
- Due date range
- Tags

### Saved Filters

Save common filter combinations:
1. Set your filters
2. Click **Save Filter**
3. Name it (e.g., "My tasks due this week")
4. Access from **Saved Filters** dropdown

---

## Tasks and Phases

### Viewing by Phase

1. Open the project
2. Go to **Phases** tab
3. Expand a phase to see its tasks

### Moving Tasks Between Phases

1. Open the task
2. Change the **Phase** field
3. Save

Or drag the task to a different phase in phase view.

### Phase Progress

Phase completion percentage calculates automatically based on task completion within that phase.

---

## Notifications and Reminders

### Automatic Notifications

Team members receive notifications when:
- Assigned to a task
- @mentioned in a comment
- Task they're watching changes status
- Task due date approaches

### Watching Tasks

Click the **Watch** icon (eye) to receive updates for any task, even if not assigned.

### Email Summaries

Daily digest emails include:
- Tasks due today
- Overdue tasks
- New assignments

Configure in **Settings → Notifications**.

---

## Task Templates

<!-- STATUS: COMING_SOON -->

> **Coming Soon**: Task templates will let you:
> - Save common task sequences
> - Apply to any project or phase
> - Include default durations and dependencies

For now, use project templates which include pre-built tasks.

---

## Best Practices

### Write Clear Task Titles

**Good**:
- "Install bathroom vanity (master bath)"
- "Order 4x8 drywall sheets (qty: 50)"
- "Schedule rough plumbing inspection"

**Avoid**:
- "Do plumbing"
- "Cabinet stuff"
- "???"

### Right-Size Tasks

Tasks should be:
- Completable in a day or less (usually)
- Specific enough to be unambiguous
- Not so detailed they become micromanagement

If a task takes multiple days, consider breaking it into subtasks.

### Use Phases

Every task should belong to a phase. Orphan tasks make reporting and progress tracking difficult.

### Update Status Daily

Field workers should update task status at least once per day. This keeps the dashboard accurate and builds trust with clients.

### Add Context

Use descriptions and comments to add:
- Specifications and dimensions
- Client preferences
- Gotchas from past experience
- Photos of expected outcome

---

## Mobile and Field Access

Field workers can manage tasks from their phones:

1. Open field portal or mobile app
2. View "My Tasks" for today
3. Mark tasks complete with one tap
4. Add comments and photos
5. Log time against tasks

→ [Field portal guide](/help/field-portal/overview.md)

---

## Common Questions

### Can I assign multiple people to a task?

Currently, each task has one assignee. For collaborative work:
- Create subtasks for each person's portion
- Use comments to coordinate
- Track time separately per person

### What happens to completed tasks?

Completed tasks remain in the project history:
- Hidden from default views
- Visible in "Show Completed" filter
- Included in project archive
- Never automatically deleted

### Can clients see tasks?

By default, clients see a simplified view:
- Phase-level progress
- Milestones and key dates
- Not individual task details

You can optionally share specific tasks with clients.

### Can I import tasks from a spreadsheet?

<!-- STATUS: COMING_SOON -->

> **Coming Soon**: CSV import for bulk task creation.

For now, use bulk add feature with copy/paste.

---

## Troubleshooting

### Task not showing up

Check:
- Correct project selected?
- Filter hiding completed or wrong status?
- Task belongs to visible phase?
- Search term too specific?

### Can't change assignee

You may not have permission if:
- You're not the project PM or owner
- The task is locked (part of signed change order)
- Assignee field is controlled by phase assignment

### Notifications not arriving

Check:
- Notification settings in your profile
- Email not in spam folder
- Correct email address on file
- In-app notifications enabled

---

## Related Topics

- [Projects overview](/help/projects/overview.md)
- [Working with phases](/help/projects/phases.guide.md)
- [Project scheduling](/help/scheduling/project-schedule.guide.md)
- [Time tracking](/help/time-tracking/overview.md)
- [Field portal](/help/field-portal/overview.md)
