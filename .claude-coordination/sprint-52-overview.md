# Sprint 52 - Reports Bugs & Configuration

**Start Date:** 2026-02-04
**Focus:** Reports module stability and export functionality
**Estimated Effort:** 8-12 hours (1-2 days)
**Priority:** P1 - HIGH
**Status:** 🔴 IN PROGRESS

---

## Why This Sprint?

**Problem:** Reports module at 65% completion, missing key features
**Root Cause:** Export functionality not implemented, demo data insufficient
**Solution:** Add PDF/Excel export, seed historical data, fix any remaining bugs
**Impact:** Complete reports module for production readiness

---

## Sprint Objectives

### Issues to Fix
| ID | Issue | Effort | Status |
|----|-------|--------|--------|
| #69 | Operational Reports load error | 2-4h | ✅ Previously Fixed - Verify |
| #76 | Payroll data load error | 2-4h | ✅ Previously Fixed - Verify |
| #63 | Reports demo data (historical revenue) | 12-16h | [ ] |
| #64 | Report filters save/load | 4-6h | [ ] |
| #65 | Export formats (PDF, Excel) | 6-8h | [ ] |

### Success Criteria
- [ ] All reports load without errors (verify fixes)
- [ ] 3-5 completed projects with full P&L data
- [ ] Backdated revenue (3-6 months historical)
- [ ] Report filters save user preferences
- [ ] PDF export functional
- [ ] Excel export functional

---

## Files Affected

```
apps/web/
├── app/dashboard/reports/
│   ├── page.tsx              # Overview
│   ├── financial/page.tsx    # Financial reports
│   ├── operational/page.tsx  # Operational reports
│   ├── benchmarking/page.tsx # Benchmarking
│   ├── detailed/page.tsx     # Detailed reports
│   └── builder/page.tsx      # Report builder
├── lib/reports/
│   ├── exportPDF.ts          # NEW - PDF export
│   └── exportExcel.ts        # NEW - Excel export
└── scripts/seed-demo/
    ├── seed-historical-revenue.ts  # NEW
    └── seed-completed-projects.ts  # NEW (if needed)
```

---

## Parallel Execution Plan

### Batch 1: Assessment
- Verify #69 and #76 are actually fixed
- Audit current reports module structure
- Identify export implementation approach

### Batch 2: Implementation (Parallel)
- Agent 1: Seed historical revenue data (#63)
- Agent 2: Implement PDF export (#65)
- Agent 3: Implement Excel export (#65)
- Agent 4: Add report filter persistence (#64)

### Batch 3: Verification
- TypeScript check
- Test exports
- Commit changes

---

## Technical Notes

### Historical Revenue (#63)
- Need invoices with payment dates spread over 3-6 months
- Need completed projects with final P&L data
- Seed with realistic revenue trends

### Report Filters (#64)
- Save filters to localStorage or Firestore user preferences
- Restore on page load
- Include date range, project, category filters

### Export Formats (#65)
- PDF: Use @react-pdf/renderer (already in project)
- Excel: Use xlsx or exceljs library
- Both should respect current filters

---

**Sprint Owner:** Development Team
**Sprint Status:** 🔴 IN PROGRESS
**Previous Sprint:** Sprint 51 - Navigation ✅ COMPLETE
