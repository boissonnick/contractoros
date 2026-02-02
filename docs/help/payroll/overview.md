---
title: "Payroll Overview"
description: "Review time, calculate pay, and process payroll efficiently"
audience: ["owner"]
module: "payroll"
difficulty: "intermediate"
time_to_complete: "12 minutes"
video_url: ""
walkthrough_id: "payroll-tour"
last_updated: "2025-01-30"
status: "draft"
---

<!-- STATUS: DRAFT -->
<!-- NEEDS_VIDEO: Payroll overview -->
<!-- NEEDS_WALKTHROUGH: Payroll tour -->

# Payroll Overview

Process payroll with confidence. Review time entries, calculate pay, handle overtime, and ensure everyone gets paid correctly.

---

## What You'll Learn

| Job to Be Done | This Section Helps You |
|----------------|------------------------|
| Review employee time | Approve time entries |
| Calculate pay | Generate payroll for a period |
| Handle overtime | Apply correct overtime rules |
| Track expenses | Include reimbursements |
| Export to payroll | Send data to your payroll provider |

---

## The Payroll Workflow

```
Time Entry → Approval → Payroll Run → Review → Export/Process
                              ↓
                        Corrections
```

### 1. Time Entry
- Employees log time
- Field portal or manual entry
- Associated with projects

### 2. Approval
- Manager reviews entries
- Approve, adjust, or reject
- Ensure accuracy

### 3. Payroll Run
- Select pay period
- System calculates totals
- Review by employee

### 4. Review
- Check hours and rates
- Verify overtime
- Add adjustments

### 5. Export/Process
- Export to payroll provider
- Or process in-house

---

## Pay Types

### Employee Classifications

| Type | Pay Structure | Overtime |
|------|---------------|----------|
| Hourly | Paid per hour worked | Eligible |
| Salary | Fixed per period | Exempt (usually) |
| Per Diem | Daily rate | Varies |

### Rate Types

Configure for each employee:
- **Regular rate** — Standard hourly rate
- **Overtime rate** — Usually 1.5x regular
- **Double time** — Usually 2x regular (if applicable)
- **Holiday rate** — Premium for holidays

---

## Time Approval

### Before Payroll

All time must be approved before payroll:

1. Go to **Time Tracking → Approvals**
2. Filter by pay period
3. Review each entry
4. Approve or adjust

### Approval Options

| Action | When to Use |
|--------|-------------|
| Approve | Entry is correct |
| Adjust | Entry needs minor changes |
| Reject | Entry needs employee correction |
| Request Info | Need clarification |

### Bulk Actions

For efficiency:
- Select multiple entries
- Approve all at once
- Filter by employee, project, date

→ [Time approval guide](/help/time-tracking/approve-time.guide.md)

---

## Running Payroll

### Start a Payroll Run

1. Go to **Payroll**
2. Click **New Payroll Run**
3. Select pay period (dates)
4. System gathers approved time
5. Review and confirm

### What's Calculated

For each employee:
- Total regular hours
- Overtime hours
- Total pay
- Adjustments
- Expense reimbursements
- Net payroll amount

### Pay Period Types

| Type | Frequency | Example |
|------|-----------|---------|
| Weekly | Every week | Mon-Sun |
| Bi-Weekly | Every two weeks | 26 periods/year |
| Semi-Monthly | 1st & 15th | 24 periods/year |
| Monthly | Once per month | 12 periods/year |

---

## Overtime Calculation

### Standard Rules

Default overtime rules:
- Over 40 hours/week = 1.5x
- Can configure daily overtime
- State-specific rules available

### Configuration

Set overtime rules in Settings:

1. Go to **Settings → Time Tracking**
2. Configure overtime:
   - Weekly threshold (default 40)
   - Daily threshold (optional)
   - Overtime multiplier (default 1.5)
   - Double-time rules (if applicable)

### Example Calculation

Employee works 48 hours in a week at $25/hour:
- Regular (40 hrs × $25) = $1,000
- Overtime (8 hrs × $37.50) = $300
- **Total: $1,300**

---

## Adjustments

### Adding Adjustments

During payroll review:

1. Click **Add Adjustment**
2. Select employee
3. Choose type:
   - Bonus
   - Reimbursement
   - Deduction
   - Correction
4. Enter amount
5. Add notes
6. Save

### Common Adjustments

| Type | Example |
|------|---------|
| Bonus | Performance bonus |
| Tool Allowance | Monthly tool stipend |
| Mileage | Travel reimbursement |
| Advance | Paycheck advance |
| Correction | Fix prior period error |

---

## Expense Reimbursements

### Including Expenses

Approved employee expenses can be included:

1. During payroll run
2. System shows pending reimbursements
3. Include or exclude as needed
4. Added to payroll total

### Expense Categories

- Materials purchased
- Mileage
- Meals
- Tools
- Parking
- Other

→ [Expense management](/help/expenses/overview.md)

---

## Reviewing Payroll

### Before Finalizing

Always review:

| Item | Check For |
|------|-----------|
| Hours | Match approved time |
| Rates | Correct for each employee |
| Overtime | Calculated correctly |
| Adjustments | All entered |
| Expenses | Included if approved |
| Totals | Make sense |

### Preview Report

Generate preview showing:
- Employee-by-employee breakdown
- Hours summary
- Pay calculation
- Adjustments
- Total payroll

### Making Corrections

If something's wrong:
1. Make corrections in payroll run
2. Re-calculate totals
3. Preview again
4. Finalize when correct

---

## Exporting Payroll

### Export Formats

Export payroll data for:
- Your payroll provider (ADP, Gusto, etc.)
- Accounting software
- Your records

### Export Options

| Format | Use For |
|--------|---------|
| CSV | Generic import |
| Excel | Analysis, records |
| PDF | Reports, printing |
| API | Direct integration |

### What's Included

Export includes:
- Employee name and ID
- Pay period dates
- Regular hours
- Overtime hours
- Gross pay
- Adjustments
- Net payroll

---

## Integration

### Payroll Providers

<!-- STATUS: COMING_SOON - Payroll provider integrations -->

Coming integrations:
- Gusto
- ADP
- Paychex
- QuickBooks Payroll

### Manual Process

Until integrated:
1. Export payroll data
2. Import into your payroll provider
3. Process payroll there
4. Mark as processed in ContractorOS

---

## Payroll Reports

### Payroll Summary

Overview of payroll run:
- Total employees
- Total hours
- Total pay
- By department/crew

### Employee Detail

Per-employee breakdown:
- All time entries
- Overtime breakdown
- Adjustments
- Final pay

### Period Comparison

Compare periods:
- This period vs last
- Hours trends
- Cost trends

### Year-to-Date

Cumulative tracking:
- Hours by employee
- Pay by employee
- Overtime tracking

→ [Payroll reports](/help/reports/payroll.guide.md)

---

## Tax Considerations

### What ContractorOS Does

- Tracks hours and calculates pay
- Exports data for payroll processing
- Maintains records

### What ContractorOS Doesn't Do

<!-- STATUS: NEEDS_SCOPE - Future tax features -->

Currently not included:
- Tax calculation
- Tax withholding
- Tax filing
- Paycheck generation
- Direct deposit

**Use your payroll provider** for actual payroll processing, tax withholding, and payment distribution.

---

## Best Practices

### Weekly Routine

1. **Monday:** Review prior week's time
2. **Tuesday:** Approve or follow up on issues
3. **Wednesday:** All time approved for weekly payroll
4. **Thursday:** Process payroll run
5. **Friday:** Export/submit to provider

### Avoiding Issues

| Problem | Prevention |
|---------|------------|
| Missing time | Reminders for employees |
| Unapproved time | Deadline for approvals |
| Wrong rates | Verify employee setup |
| OT errors | Check calculations |
| Late payroll | Start process early |

### Audit Trail

Everything is tracked:
- Who approved what
- When changes were made
- Original vs adjusted values
- Notes and reasons

---

## Common Questions

### What if time wasn't approved before payroll?

Unapproved time won't be included. Approve it and either:
- Include in current period (if still open)
- Add to next period

### How do I handle missed time entries?

Add them retroactively, approve, and include in current or next payroll.

### Can I run payroll for a partial period?

Yes. Select custom dates for the payroll run.

### What if I find an error after payroll?

Make a correction adjustment in the next period, documenting the reason.

### How do I handle a terminated employee?

Complete their final payroll, including any outstanding reimbursements.

---

## Permissions

| Action | Owner | PM | Employee |
|--------|-------|-----|----------|
| View payroll | ✓ | — | — |
| Run payroll | ✓ | — | — |
| Approve time | ✓ | ✓ | — |
| Add adjustments | ✓ | — | — |
| Export payroll | ✓ | — | — |
| Configure settings | ✓ | — | — |

---

## Related Topics

- [Time tracking overview](/help/time-tracking/overview.md)
- [Approve time entries](/help/time-tracking/approve-time.guide.md)
- [Payroll reports](/help/reports/payroll.guide.md)
- [Expense management](/help/expenses/overview.md)
- [Team management](/help/team/overview.md)
