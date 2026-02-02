# Suite 05: Task Management Tests

## Overview

Tests task CRUD operations, assignments, status workflows, comments, and task views (list, kanban, gantt).

**Priority:** P1
**Estimated Time:** 25 minutes
**Prerequisite:** Project tests passed, active project exists

---

## Test Cases

### TASK-001: Create New Task
**Priority:** CRITICAL
**Expected:** Can create task within project

```
STEPS:
1. Navigate to a project's task section
2. Click "Add Task" or "New Task"
3. Fill in:
   - Title: "Test Task [timestamp]"
   - Description: "Test task description"
   - Status: To Do
   - Due date: Tomorrow
4. Save task

VERIFY:
[ ] Task created successfully
[ ] Task appears in task list
[ ] Task shows correct title
[ ] Due date saved correctly

CONSOLE CHECK:
[ ] Firestore write successful
[ ] No errors

RESULT: PASS / FAIL
TASK ID: ___
```

### TASK-002: Task Validation
**Priority:** MAJOR
**Expected:** Form validates required fields

```
STEPS:
1. Click Add Task
2. Leave title empty
3. Try to save

VERIFY:
[ ] Title required validation
[ ] Form not submitted without title
[ ] Error message shown

RESULT: PASS / FAIL
```

### TASK-003: View Tasks List View
**Priority:** CRITICAL
**Expected:** Tasks display in list format

```
STEPS:
1. Go to project tasks
2. Ensure "List" view selected (if multiple views)

VERIFY:
[ ] Tasks listed
[ ] Title visible
[ ] Status visible
[ ] Assignee visible (if assigned)
[ ] Due date visible
[ ] Can click to open detail

CONSOLE CHECK:
[ ] Tasks query successful

RESULT: PASS / FAIL
```

### TASK-004: View Tasks Kanban View
**Priority:** MAJOR
**Expected:** Kanban board renders correctly

```
STEPS:
1. Go to project tasks
2. Switch to "Kanban" view

VERIFY:
[ ] Columns for each status visible
[ ] Tasks appear in correct columns
[ ] Task cards show key info
[ ] Can scroll if many tasks

DRAG AND DROP:
[ ] Can drag task between columns
[ ] Status updates on drop
[ ] Change persists

CONSOLE CHECK:
[ ] No errors on view switch
[ ] Drag/drop updates fire correctly

RESULT: PASS / FAIL
```

### TASK-005: View Tasks Gantt View
**Priority:** MINOR
**Expected:** Gantt chart displays (if implemented)

```
STEPS:
1. Switch to "Gantt" view
2. Observe chart

VERIFY:
[ ] Tasks appear as bars
[ ] Timeline correct
[ ] Can scroll through dates
[ ] OR Gantt not implemented (note)

RESULT: PASS / FAIL / NOT IMPLEMENTED
```

### TASK-006: Edit Task
**Priority:** CRITICAL
**Expected:** Can update task details

```
STEPS:
1. Click on a task to open detail
2. Edit task title
3. Edit description
4. Change due date
5. Save changes

VERIFY:
[ ] Changes saved
[ ] Updated data displays
[ ] Toast confirmation
[ ] Persists on refresh

CONSOLE CHECK:
[ ] Update successful

RESULT: PASS / FAIL
```

### TASK-007: Task Status Workflow
**Priority:** CRITICAL
**Expected:** Can change task status through workflow

```
STEPS:
1. Open a task with status "pending" or "todo"
2. Change status to "in_progress"
3. Confirm change
4. Change to "completed"

VERIFY:
[ ] Status updates immediately
[ ] Task moves to correct column in kanban
[ ] Status persists
[ ] Completed tasks handled appropriately

STATUS OPTIONS AVAILABLE:
[ ] pending/todo
[ ] in_progress
[ ] review (if applicable)
[ ] completed
[ ] on_hold

RESULT: PASS / FAIL
```

### TASK-008: Assign Task to User
**Priority:** CRITICAL
**Expected:** Can assign tasks to team members

```
STEPS:
1. Open task detail
2. Find Assignee field
3. Select a team member
4. Save

VERIFY:
[ ] Assignee dropdown shows team members
[ ] Assignment saved
[ ] Assignee name displays on task
[ ] Assignee can see task (test with that user)

UNASSIGN:
[ ] Can remove assignment
[ ] Task shows as unassigned

CONSOLE CHECK:
[ ] Assignment update successful

RESULT: PASS / FAIL
```

### TASK-009: Add Task Comment
**Priority:** MAJOR
**Expected:** Can add comments to tasks

```
STEPS:
1. Open task detail
2. Find comments section
3. Type: "Test comment [timestamp]"
4. Submit comment

VERIFY:
[ ] Comment appears in thread
[ ] Author name shown
[ ] Timestamp shown
[ ] Comment persists

COMMENT FEATURES:
[ ] Can edit own comment (if supported)
[ ] Can delete own comment (if supported)
[ ] Mentions work (if supported)

CONSOLE CHECK:
[ ] Comment saved to subcollection

RESULT: PASS / FAIL
```

### TASK-010: Task Due Date Handling
**Priority:** MAJOR
**Expected:** Due dates work correctly

```
STEPS:
1. Create task with due date = today
2. Observe task display

VERIFY:
[ ] Due date shows correctly
[ ] Overdue tasks highlighted (if overdue)
[ ] Date picker works correctly
[ ] Timezone handling correct

TEST DATE SCENARIOS:
[ ] Past date (overdue)
[ ] Today
[ ] Tomorrow
[ ] No due date

RESULT: PASS / FAIL
```

### TASK-011: Delete Task
**Priority:** MAJOR
**Expected:** Can delete tasks

```
STEPS:
1. Open a test task
2. Find Delete option
3. Delete task

VERIFY:
[ ] Confirmation required
[ ] Task removed from list
[ ] Task not accessible by direct URL

RESULT: PASS / FAIL
```

### TASK-012: Subtasks (if implemented)
**Priority:** MINOR
**Expected:** Can create subtasks

```
STEPS:
1. Open a task
2. Find "Add Subtask" option
3. Create subtask

VERIFY:
[ ] Subtask created
[ ] Appears under parent
[ ] Can complete subtasks
[ ] OR not implemented (note)

RESULT: PASS / FAIL / NOT IMPLEMENTED
```

### TASK-013: Task Filtering
**Priority:** MAJOR
**Expected:** Can filter tasks

```
STEPS:
1. Go to task list with multiple tasks
2. Filter by status (e.g., "In Progress")
3. Filter by assignee (if available)

VERIFY:
[ ] Filter returns correct tasks
[ ] Clear filter restores all
[ ] Multiple filters work together

RESULT: PASS / FAIL
```

### TASK-014: Task Search
**Priority:** MAJOR
**Expected:** Can search tasks by title

```
STEPS:
1. Search for task by name
2. Search for non-existent task

VERIFY:
[ ] Search finds matching tasks
[ ] Empty results handled gracefully

RESULT: PASS / FAIL
```

---

## Task Test Summary

```
| Test ID | Test Name | Status | Console Errors |
|---------|-----------|--------|----------------|
| TASK-001 | Create Task | | |
| TASK-002 | Validation | | |
| TASK-003 | List View | | |
| TASK-004 | Kanban View | | |
| TASK-005 | Gantt View | | |
| TASK-006 | Edit Task | | |
| TASK-007 | Status Workflow | | |
| TASK-008 | Assign Task | | |
| TASK-009 | Comments | | |
| TASK-010 | Due Dates | | |
| TASK-011 | Delete Task | | |
| TASK-012 | Subtasks | | |
| TASK-013 | Filtering | | |
| TASK-014 | Search | | |

TOTAL: 14 tests
PASSED: ___
FAILED: ___
```

## Next Suite

→ Proceed to Suite 06: Team Management Tests
