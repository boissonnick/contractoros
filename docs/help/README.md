# ContractorOS Help Documentation

This directory contains all user-facing help documentation for ContractorOS. The content is organized by module and user role, designed to be consumed by:

1. **In-app Help Center** - Searchable, browsable help pages
2. **June AI Assistant** - RAG-powered contextual help
3. **Interactive Walkthroughs** - WalkMe-style guided tours
4. **Video/GIF Tutorials** - Visual step-by-step guides

## Documentation Standards

### File Naming
- `overview.md` - Module introduction and key concepts
- `*.guide.md` - How-to guides for specific jobs-to-be-done
- `*.reference.md` - Reference documentation (field definitions, etc.)
- `*.troubleshooting.md` - Common issues and solutions

### Content Flags

Use these HTML comments to flag content status:

```markdown
<!-- STATUS: COMPLETE -->        - Fully written and reviewed
<!-- STATUS: DRAFT -->           - Written but needs review
<!-- STATUS: COMING_SOON -->     - Feature not yet built
<!-- STATUS: NEEDS_SCOPE -->     - Feature spec incomplete
<!-- STATUS: NEEDS_VIDEO -->     - Text done, needs video/GIF
<!-- STATUS: NEEDS_WALKTHROUGH --> - Needs interactive tour
```

### Frontmatter Template

```yaml
---
title: "Page Title"
description: "Brief description for search/SEO"
audience: ["owner", "pm", "employee", "client", "sub"]
module: "projects"
difficulty: "beginner" | "intermediate" | "advanced"
time_to_complete: "5 minutes"
related:
  - /help/projects/create-project
  - /help/clients/overview
video_url: ""
walkthrough_id: ""
last_updated: "2025-01-30"
status: "complete" | "draft" | "coming_soon"
---
```

### Writing Style Guide

1. **Voice**: Professional, direct, helpful. Not overly casual or stiff.
2. **Structure**: Problem/Job → Solution → Steps → Tips
3. **Length**: Aim for scannable content. Use headers, bullets, numbered steps.
4. **Screenshots**: Use `![Alt text](./images/filename.png)` - images stored in `images/` subfolder
5. **Videos**: Reference by ID, actual files stored in CDN/Cloud Storage

### Jobs-to-be-Done Framework

Each guide should answer: "As a [role], I need to [job] so that [outcome]."

Examples:
- "As a PM, I need to create a project from an estimate so that I can start scheduling work."
- "As a field worker, I need to log my time so that I get paid accurately."
- "As a client, I need to approve a change order so that work can continue."

## Directory Structure

```
help/
├── README.md                    # This file
├── getting-started/             # Onboarding, first steps
│   ├── overview.md              ✓ Welcome guide
│   └── quick-wins.guide.md      ✓ First week success
├── projects/                    # Project management
│   ├── overview.md              ✓ Project lifecycle
│   ├── create-project.guide.md  ✓ Create projects
│   ├── phases.guide.md          ✓ Phase management
│   └── tasks.guide.md           ✓ Task management
├── clients/                     # Client CRM
│   ├── overview.md              ✓ Client management
│   └── add-client.guide.md      ✓ Adding clients
├── estimates/                   # Quoting, proposals
│   ├── overview.md              ✓ Estimates lifecycle
│   └── create-estimate.guide.md ✓ Creating estimates
├── invoicing/                   # Billing, payments
│   ├── overview.md              ✓ Invoice management
│   └── create-invoice.guide.md  ✓ Creating invoices
├── subcontractors/              # Sub management
│   └── overview.md              ✓ Sub network management
├── team/                        # Users, roles, permissions
│   └── overview.md              ✓ Team management
├── time-tracking/               # Time entries
│   └── overview.md              ✓ Time tracking
├── payroll/                     # Payroll processing
│   └── overview.md              ✓ Payroll workflow
├── expenses/                    # Expense tracking
│   └── overview.md              ✓ Expense management
├── change-orders/               # Scope changes
│   └── overview.md              ✓ Change order process
├── scheduling/                  # Calendar, assignments
│   └── overview.md              ✓ Project scheduling
├── documentation/               # Photos & files
│   └── overview.md              ✓ Documentation management
├── reports/                     # Reporting, analytics
│   └── overview.md              ✓ Business reports
├── settings/                    # Organization settings
│   └── overview.md              ✓ Configuration
├── field-portal/                # Field worker-specific
│   └── overview.md              ✓ Field portal guide
├── client-portal/               # Client-specific
│   └── overview.md              ✓ Client portal guide
├── sub-portal/                  # Subcontractor-specific
│   └── overview.md              ✓ Sub portal guide
└── troubleshooting/             # Common issues
    └── common-issues.md         ✓ Quick fixes
```

## Documentation Status Summary

| Section | Files | Status |
|---------|-------|--------|
| Getting Started | 2 | ✓ Draft |
| Projects | 4 | ✓ Draft |
| Clients | 2 | ✓ Draft |
| Estimates | 2 | ✓ Draft |
| Invoicing | 2 | ✓ Draft |
| Subcontractors | 1 | ✓ Draft |
| Team | 1 | ✓ Draft |
| Time Tracking | 1 | ✓ Draft |
| Payroll | 1 | ✓ Draft |
| Expenses | 1 | ✓ Draft |
| Change Orders | 1 | ✓ Draft |
| Scheduling | 1 | ✓ Draft |
| Documentation | 1 | ✓ Draft |
| Reports | 1 | ✓ Draft |
| Settings | 1 | ✓ Draft |
| Field Portal | 1 | ✓ Draft |
| Client Portal | 1 | ✓ Draft |
| Sub Portal | 1 | ✓ Draft |
| Troubleshooting | 1 | ✓ Draft |
| **Total** | **26** | **All Draft** |

### What's Done
- All core module overview pages written
- Jobs-to-be-done framework applied throughout
- Role-based audience targeting in frontmatter
- Status flags for coming soon features
- Placeholder video/walkthrough IDs

### What's Needed
- Video/GIF content for all guides
- Interactive walkthrough implementations
- Screenshot captures
- Review and polish of all content
- Translation to Spanish (phase 2)

## June AI Assistant Integration

This documentation serves as the knowledge base for June, the ContractorOS AI assistant. Key integration points:

1. **Semantic Search**: All content is indexed for natural language queries
2. **Context Awareness**: June knows which page/module the user is on
3. **Action Suggestions**: Guides link to specific UI actions June can help execute
4. **Escalation**: Complex issues route to human support with context

### June Personality Notes

- Name: June
- Tone: Professional, capable, warm but not overly casual
- Approach: Direct answers first, then context if needed
- Limitations: Acknowledges when she doesn't know something, offers to connect to support
