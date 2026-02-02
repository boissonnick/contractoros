---
title: "Projects Overview"
description: "Understanding project management in ContractorOS"
audience: ["owner", "pm", "employee"]
module: "projects"
difficulty: "beginner"
time_to_complete: "8 minutes"
video_url: ""
walkthrough_id: "projects-tour"
last_updated: "2025-01-30"
status: "draft"
---

<!-- STATUS: DRAFT -->
<!-- NEEDS_VIDEO: Projects module overview -->
<!-- NEEDS_WALKTHROUGH: Projects tour -->

# Projects Overview

Projects are the heart of ContractorOS. Every job you take on—from a small repair to a multi-phase renovation—is managed as a project. This guide explains how projects work and how to use them effectively.

---

## What Is a Project?

A project represents a single job or contract. It contains:

- **Basic info**: Name, address, client, dates
- **Phases**: Major stages of work (Demolition, Framing, etc.)
- **Tasks**: Specific to-dos assigned to team members
- **Schedule**: Timeline and milestones
- **Financial data**: Budget, estimates, invoices, change orders
- **Documents**: Contracts, plans, specs
- **Photos**: Progress documentation
- **Team**: Who's assigned to this job

### Project Types

ContractorOS supports various project types:

| Type | Typical Use |
|------|-------------|
| New Construction | Ground-up residential or commercial |
| Renovation | Updating existing structures |
| Remodel | Kitchen, bath, whole-house |
| Addition | Expanding existing buildings |
| Repair | Fixing specific issues |
| Maintenance | Recurring service work |
| Commercial | Office, retail, industrial |
| Custom | Define your own |

---

## Project Lifecycle

Projects move through stages:

```
Lead → Estimate → Sold → Active → Substantial Completion → Closed
```

### Stage Descriptions

| Stage | What's Happening |
|-------|------------------|
| **Lead** | Initial inquiry, not yet quoted |
| **Estimate** | Preparing or waiting on proposal |
| **Sold** | Contract signed, not yet started |
| **Active** | Work in progress |
| **Substantial Completion** | Punch list phase |
| **Closed** | Fully complete, final payment received |
| **On Hold** | Paused (waiting on permits, materials, etc.) |
| **Cancelled** | Job didn't happen |

You can customize these stages in Settings to match your workflow.

---

## The Project Dashboard

When you open a project, you see:

### Header Section
- Project name and address
- Current status badge
- Client name (clickable to view client)
- Quick actions (Edit, Archive, etc.)

### Tab Navigation

| Tab | Contents |
|-----|----------|
| **Overview** | Summary, key metrics, activity feed |
| **Phases** | Work breakdown structure |
| **Tasks** | All tasks across phases |
| **Schedule** | Gantt chart and calendar view |
| **Scope** | Scope of work document |
| **Documents** | Files, contracts, plans |
| **Photos** | Image gallery |
| **Financial** | Budget, invoices, change orders |
| **Team** | Assigned members and subs |
| **Daily Logs** | Site logs and notes |

---

## Key Concepts

### Phases

Phases are the major stages of work. Think of them as chapters of the project:

- Preconstruction
- Site Work
- Foundation
- Framing
- Rough MEP (Mechanical, Electrical, Plumbing)
- Insulation & Drywall
- Finishes
- Punch List
- Closeout

Each phase can have:
- Start and end dates
- Tasks assigned
- Budget allocation
- Assigned trades/team members
- Completion percentage

→ [Learn more: Working with phases](/help/projects/phases.guide.md)

### Tasks

Tasks are specific work items within a project or phase:

- Assigned to a person
- Have a due date
- Can be marked complete
- Support comments and attachments
- Track time against them

Tasks can be viewed as:
- **List** - Simple checklist
- **Kanban** - Drag between columns
- **Gantt** - Timeline view

→ [Learn more: Managing tasks](/help/projects/tasks.guide.md)

### Scope of Work

The scope document defines what's included in the project:

- Detailed work descriptions
- Inclusions and exclusions
- Specifications
- Allowances
- Terms and conditions

The scope can be:
- Created from scratch
- Generated from an estimate
- Imported from a template

→ [Learn more: Scope of work](/help/projects/scope.guide.md)

---

## Jobs to Be Done

### "I need to start a new job"
→ [Create a project](/help/projects/create-project.guide.md)

### "I need to see what's happening across all my projects"
→ [Using the project list](/help/projects/project-list.guide.md)

### "I need to update a client on progress"
→ [Sharing project updates](/help/projects/share-updates.guide.md)

### "I need to handle a change in scope"
→ [Change orders](/help/projects/change-orders.guide.md)

### "I need to close out a completed project"
→ [Project closeout](/help/projects/closeout.guide.md)

### "I need to find a past project"
→ [Searching and filtering](/help/projects/search-filter.guide.md)

---

## Best Practices

### Naming Projects

Use a consistent naming convention:

**Recommended**: `[Client Last Name] - [Brief Description]`
- Smith - Kitchen Remodel
- Johnson - Master Suite Addition
- ABC Corp - Office TI

**Avoid**:
- Generic names ("New Project", "Job 1")
- Too long ("Mr. and Mrs. Johnson Full Home Renovation Including Kitchen, Bath, and Basement")

### Setting Realistic Dates

- **Start Date**: When you'll mobilize, not when you hope to
- **End Date**: Include buffer for weather, surprises, inspections
- **Phase Dates**: Work backward from milestones (inspections, client events)

### Keeping Projects Current

Update at least weekly:
- Mark completed tasks
- Add photos of progress
- Log any issues or changes
- Update phase percentages

This keeps your dashboard accurate and gives clients real-time visibility.

---

## Project Permissions

Who can do what:

| Action | Owner | PM | Employee | Client | Sub |
|--------|-------|-----|----------|--------|-----|
| Create project | ✓ | ✓ | | | |
| Edit project | ✓ | ✓ | | | |
| View project | ✓ | ✓ | Assigned only | Their projects | Their projects |
| Delete project | ✓ | | | | |
| Add tasks | ✓ | ✓ | | | |
| Complete tasks | ✓ | ✓ | Assigned | | Assigned |
| View financials | ✓ | ✓ | Limited | Limited | Their portion |

---

## Related Topics

- [Creating a project](/help/projects/create-project.guide.md)
- [Working with phases](/help/projects/phases.guide.md)
- [Managing tasks](/help/projects/tasks.guide.md)
- [Project templates](/help/projects/templates.guide.md)
- [Change orders](/help/projects/change-orders.guide.md)
