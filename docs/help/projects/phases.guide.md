---
title: "Working with Phases"
description: "How to break projects into manageable phases for better tracking and scheduling"
audience: ["owner", "pm"]
module: "projects"
difficulty: "beginner"
time_to_complete: "10 minutes"
video_url: ""
walkthrough_id: "project-phases"
last_updated: "2025-01-30"
status: "draft"
---

<!-- STATUS: DRAFT -->
<!-- NEEDS_VIDEO: Phases walkthrough -->
<!-- NEEDS_WALKTHROUGH: Adding phases interactive -->

# Working with Phases

Phases break a project into major stages of work. They help you track progress, schedule trades, and communicate milestones to clients.

---

## What Are Phases?

A phase represents a significant stage of construction work. Common examples:

| Phase | Typical Work |
|-------|--------------|
| Preconstruction | Permits, design, procurement |
| Demolition | Tear-out, site prep |
| Site Work | Grading, utilities, foundation prep |
| Foundation | Footings, slab, waterproofing |
| Framing | Structure, sheathing, roof |
| Rough MEP | Plumbing, electrical, HVAC rough-in |
| Insulation | Insulation, vapor barrier |
| Drywall | Board, tape, finish |
| Finishes | Paint, trim, flooring, cabinets |
| Final MEP | Fixtures, devices, equipment |
| Punch List | Corrections, touch-ups |
| Closeout | Final inspections, documentation |

---

## Why Use Phases?

### Organization
- Group related tasks together
- See progress at a glance
- Navigate large projects easily

### Scheduling
- Assign dates to major milestones
- Sequence work logically
- Identify dependencies

### Communication
- Report progress to clients by phase
- Set expectations for key milestones
- Align with inspection/permit stages

### Financial Tracking
- Budget by phase
- Invoice based on phase completion
- Track phase-level profitability

---

## Adding Phases to a Project

### Method 1: Add Phases Manually

1. Open your project
2. Go to the **Phases** tab
3. Click **+ Add Phase**
4. Enter:
   - **Phase Name** (e.g., "Rough Framing")
   - **Start Date** (when this phase begins)
   - **End Date** (target completion)
   - **Description** (optional details)
   - **Assigned Trades** (which trades work this phase)
5. Click **Save**

Repeat for each phase in your project.

### Method 2: Add from Template

1. Go to the **Phases** tab
2. Click **+ Add from Template**
3. Select a phase template:
   - Residential Renovation
   - New Construction
   - Commercial TI
   - Kitchen Remodel
   - (or your custom templates)
4. Phases are added with default names and sequence
5. Adjust dates and details as needed

### Method 3: Import with Project Template

When creating a project from a template, phases come pre-built. Just adjust the dates for your specific project.

---

## Phase Details

Each phase contains:

### Basic Information
| Field | Description |
|-------|-------------|
| **Name** | Phase name (e.g., "Framing") |
| **Status** | Not Started, In Progress, Complete, On Hold |
| **Progress** | Percentage complete (0-100%) |
| **Dates** | Start and end dates |

### Associations
| Element | Purpose |
|---------|---------|
| **Tasks** | Work items within this phase |
| **Trades** | Skill categories (Electrical, Plumbing, etc.) |
| **Team** | Specific people assigned |
| **Subcontractors** | Subs working this phase |
| **Budget** | Phase-level cost tracking |

### Tracking
| Field | Description |
|-------|-------------|
| **Actual Start** | When work actually began |
| **Actual End** | When work actually completed |
| **Weather Days** | Delays due to weather |
| **Notes** | Phase-specific commentary |

---

## Managing Phase Progress

### Update Progress Percentage

1. Open the phase
2. Drag the progress slider, or
3. Enter a percentage manually

**Progress is also updated automatically** when tasks within the phase are completed.

### Change Phase Status

| Status | When to Use |
|--------|-------------|
| **Not Started** | Future phase, no work begun |
| **In Progress** | Active work happening |
| **Complete** | All phase work done |
| **On Hold** | Waiting on something (inspections, materials, etc.) |

### Mark Phase Complete

1. Open the phase
2. Click **Mark Complete** (or change status to Complete)
3. Optionally add completion notes
4. Actual end date is recorded

---

## Reordering Phases

Phases display in a specific sequence. To reorder:

1. Go to the **Phases** tab
2. Drag phases using the ⋮⋮ handle
3. Drop in new position
4. Order is saved automatically

Or:
1. Click **⋮ → Reorder Phases**
2. Drag to rearrange in the popup
3. Click **Save Order**

---

## Phase Dependencies

<!-- STATUS: COMING_SOON -->
<!-- Dependencies are not fully implemented yet -->

> **Coming Soon**: Phase dependencies will allow you to:
> - Link phases so one can't start until another finishes
> - Automatically adjust dates when upstream phases change
> - Visualize the critical path

For now, manage dependencies manually by setting logical dates.

---

## Best Practices

### Right-Size Your Phases

| Project Size | Recommended Phases |
|--------------|-------------------|
| Small (< $50K) | 3-5 phases |
| Medium ($50-250K) | 5-8 phases |
| Large ($250K+) | 8-12+ phases |

Too few phases = not enough visibility
Too many phases = administrative burden

### Align with Inspections

Create phases that end at inspection points:
- Foundation phase ends at foundation inspection
- Rough phase ends at rough inspection
- Framing phase ends at framing inspection

This makes scheduling inspections natural.

### Use Consistent Naming

Create company-wide standards:
- Use the same phase names across similar projects
- Makes reporting and comparison easier
- Templates enforce consistency

### Update Regularly

- Update progress at least weekly
- Mark phases complete promptly
- Note any delays with reasons

---

## Phases and Scheduling

Phases appear in your project schedule:

### Gantt View
- Each phase shows as a bar
- Tasks within phases are nested
- Drag to adjust dates

### Calendar View
- Phase start/end dates appear as milestones
- Tasks show as individual events

→ [Project scheduling](/help/scheduling/project-schedule.guide.md)

---

## Phases and Financials

### Budgeting by Phase

1. Open a phase
2. Go to the **Budget** section
3. Enter:
   - Labor budget
   - Material budget
   - Subcontractor budget
4. Track actual costs against budget

### Progress Billing

Invoice based on phase completion:

1. Create invoice
2. Select **Progress Billing**
3. Choose phases to invoice
4. Amount calculated from phase % complete × contract value

→ [Progress invoicing](/help/invoicing/progress-billing.guide.md)

---

## Phase Templates

Save time with reusable phase templates:

### Create a Template

1. Go to **Settings → Templates → Phase Templates**
2. Click **+ New Template**
3. Add phases with names and typical durations
4. Optionally include default tasks per phase
5. Save template

### Apply a Template

When adding phases to a project:
1. Click **+ Add from Template**
2. Select your template
3. Adjust dates for this specific project

→ [Managing templates](/help/settings/templates.guide.md)

---

## Common Questions

### Can I add phases to an existing project?

Yes, add phases anytime. If the project already has tasks, you can:
- Create new phases and add new tasks to them
- Move existing tasks into new phases

### What happens if I delete a phase?

- Tasks in the phase are **not deleted**
- They become unassigned (no phase)
- Budget data is removed
- This action can be undone (within 30 days)

### Can phases overlap?

Yes. In real construction, phases often overlap:
- Framing continues while rough MEP begins
- Drywall and paint can overlap in different rooms

Set overlapping dates as needed for your project.

### How do phases affect reporting?

Reports can filter and group by phase:
- "Show progress for Rough MEP phase"
- "Compare actual vs. budget by phase"
- "Time logged by phase"

---

## Troubleshooting

### Phase dates don't match task dates

Phase dates are independent of task dates. To sync:
- Update phase dates to match task range, or
- Adjust tasks to fit within phase dates

### Can't delete a phase

A phase can't be deleted if:
- It has invoices associated
- It's part of an active change order

Archive the phase instead, or reassign the financials first.

---

## Related Topics

- [Projects overview](/help/projects/overview.md)
- [Managing tasks](/help/projects/tasks.guide.md)
- [Project templates](/help/projects/templates.guide.md)
- [Project scheduling](/help/scheduling/project-schedule.guide.md)
