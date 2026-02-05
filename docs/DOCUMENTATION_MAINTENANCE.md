# Documentation Maintenance Guide

**Last Updated:** 2026-02-04
**Purpose:** Sustainable documentation lifecycle management and token optimization

---

## Quick Reference

| Action | Frequency | Token Impact |
|--------|-----------|--------------|
| Archive completed sprint | After each sprint | -5,000 to -8,000 per sprint |
| Review token budgets | Monthly | Prevents future bloat |
| Archive old research | Quarterly | -3,000 to -10,000 |
| Major restructure | Annually | -50,000 to -100,000 |

---

## Rolling Window System (Core Process)

### Sprint Archival (After Every Sprint)

**Trigger:** When a sprint is marked complete

**Process:**

1. **Mark Complete in SPRINT_STATUS.md**
   ```markdown
   ## Sprint 53: Settings Consolidation (COMPLETE ✅)
   **Completed:** 2026-02-05
   **Status:** All tasks completed, tests passing
   ```

2. **Check Sprint Count**
   - Count completed sprints in SPRINT_STATUS.md
   - If 3 or fewer → no action needed
   - If 4+ → proceed to archive oldest sprint

3. **Extract Oldest Sprint**
   - Copy oldest completed sprint section to archive file
   - Archive location: `.claude-coordination/archive/sprints-{start}-{end}-history.md`
   - Naming: Use sprint number range (e.g., `sprints-47-52-history.md`)

4. **Update SPRINT_STATUS.md Header**
   ```markdown
   > **Historical Sprints:** Sprints {range} archived in `.claude-coordination/archive/sprints-{start}-{end}-history.md`
   ```

5. **Verify Token Budget**
   ```bash
   wc -l docs/SPRINT_STATUS.md
   # Should be <1,000 lines
   ```

**Example Archive Cycle:**

| Sprint Completes | Keep in SPRINT_STATUS.md | Archive to File |
|------------------|--------------------------|-----------------|
| Sprint 50 done | 48, 49, 50 | None (only 3) |
| Sprint 51 done | 49, 50, 51 | None (only 3) |
| Sprint 52 done | 50, 51, 52 | None (only 3) |
| Sprint 53 done | 51, 52, 53 | Archive 50 → `sprints-47-52-history.md` |
| Sprint 54 done | 52, 53, 54 | Archive 51 → `sprints-47-52-history.md` |

---

## File Lifecycle Rules

### Active Documentation (High Read Frequency)

**Location:** `docs/` (root level)

| File | Lifecycle | Archive Trigger |
|------|-----------|----------------|
| `SPRINT_STATUS.md` | Rolling window (3 sprints) | Sprint N+3 completes |
| `REPRIORITIZED_SPRINT_PLAN.md` | Living document | Never (edit in place) |
| `VERSION_AUDIT_FEB_2026.md` | Annual refresh | New year or major upgrade cycle |
| `NEXT_SPRINTS_GUIDE.md` | Updated per phase | Phase completes (update priorities) |

**Token Budget:** <50,000 combined

### Reference Documentation (Low Read Frequency)

**Location:** `docs/reference/`

| File | Lifecycle | Archive Trigger |
|------|-----------|----------------|
| `ENVIRONMENT_CONFIG.md` | Stable (updated rarely) | Major tool version change |
| `TROUBLESHOOTING.md` | Append-only | If exceeds 500 lines, archive old errors |
| `PATTERNS_AND_TEMPLATES.md` | Living document | Never (edit in place) |

**Token Budget:** <15,000 combined

### Planning Documentation (Temporary)

**Location:** `docs/` → `docs/archive/planning/`

| File Pattern | Lifecycle | Archive Trigger |
|--------------|-----------|----------------|
| `SPRINT_*_PLAN.md` | Temporary | Sprint completes |
| `*_IMPLEMENTATION_PLAN.md` | Temporary | Plan executed or superseded |
| Sprint overviews | Temporary | Sprint completes (keep in `.claude-coordination/`) |

**Action:** Move to `docs/archive/planning/` within 7 days of completion

### Research Documentation (Permanent with Archive)

**Location:** `docs/research/` → `docs/archive/research/`

| File Pattern | Lifecycle | Archive Trigger |
|--------------|-----------|----------------|
| Individual research reports | Permanent | After integration (if >2,000 lines) |
| `RESEARCH_SUMMARY.md` | Living index | Never |

**Action:** Archive detailed reports after integration, keep summary

---

## Token Budgets

### Critical Files (Read Every Session)

| File | Target Lines | Max Lines | Target Tokens | Max Tokens |
|------|--------------|-----------|---------------|------------|
| `CLAUDE.md` | 400-500 | 600 | 8,000-10,000 | 12,000 |
| `SPRINT_STATUS.md` | 300-500 | 1,000 | 10,000-12,000 | 15,000 |
| `REPRIORITIZED_SPRINT_PLAN.md` | 600-800 | 1,200 | 15,000-18,000 | 20,000 |
| `NEXT_SPRINTS_GUIDE.md` | 100-150 | 200 | 2,000-3,000 | 4,000 |
| **TOTAL** | **~1,500** | **~3,000** | **~40,000** | **~50,000** |

### Reference Files (Read As-Needed)

| File | Target Lines | Max Lines | Target Tokens |
|------|--------------|-----------|---------------|
| `VERSION_AUDIT_FEB_2026.md` | 600-800 | 1,000 | 12,000-15,000 |
| `PLATFORM_AUDIT_COMPLETE.md` | 800-1,000 | 1,500 | 15,000-20,000 |
| `ARCHITECTURE.md` | 400-600 | 800 | 8,000-12,000 |
| `DEVELOPMENT_GUIDE.md` | 400-600 | 800 | 8,000-12,000 |

### Monitoring Token Usage

```bash
# Check line counts (rough token estimate)
wc -l CLAUDE.md
wc -l docs/SPRINT_STATUS.md
wc -l docs/REPRIORITIZED_SPRINT_PLAN.md
wc -l docs/NEXT_SPRINTS_GUIDE.md

# Estimate: ~2.5 tokens per line for markdown (rough average)
# Example: 500 lines ≈ 1,250 tokens
```

**Warning Signs:**
- SPRINT_STATUS.md > 1,000 lines → Archive old sprints immediately
- CLAUDE.md > 600 lines → Extract sections to reference docs
- REPRIORITIZED_SPRINT_PLAN.md > 1,200 lines → Archive completed phases

---

## Archive Structure

```
.claude-coordination/
└── archive/
    ├── sprints-13b-25-history.md     # Sprint 13B through Sprint 25
    ├── sprints-26-46-history.md      # Sprint 26 through Sprint 46 (future)
    └── sprints-47-52-history.md      # Sprint 47 through Sprint 52 (future)

docs/
└── archive/
    ├── planning/
    │   ├── README.md
    │   ├── SPRINT_9_PLAN.md
    │   ├── SPRINT_37B_TRACKER.md
    │   └── ...
    ├── audit/
    │   ├── README.md
    │   ├── PLATFORM_AUDIT_ISSUES.md
    │   └── PLATFORM_AUDIT_ISSUES_PHASE2.md
    ├── marketing-research/
    │   ├── README.md
    │   ├── ai-name-research-report.md
    │   └── builder-word-research-report.md
    ├── business-fundraising/
    │   └── (business documents)
    └── MASTER_ROADMAP_historical.md
```

### Archive File Naming

| Archive Type | Naming Convention | Example |
|--------------|------------------|---------|
| Sprint archives | `sprints-{start}-{end}-history.md` | `sprints-47-52-history.md` |
| Planning docs | Original filename preserved | `SPRINT_9_PLAN.md` |
| Roadmaps | `{ORIGINAL}_historical.md` | `MASTER_ROADMAP_historical.md` |
| Audit reports | `{ORIGINAL}.md` | `PLATFORM_AUDIT_ISSUES.md` |

---

## Maintenance Schedule

### After Every Sprint (5-10 minutes)

**Required Actions:**
1. [ ] Mark sprint complete in SPRINT_STATUS.md with date
2. [ ] Update REPRIORITIZED_SPRINT_PLAN.md (mark phase progress)
3. [ ] Update NEXT_SPRINTS_GUIDE.md if next sprint changes
4. [ ] Check sprint count — archive if 4+ completed sprints
5. [ ] Verify SPRINT_STATUS.md < 1,000 lines

**Commands:**
```bash
# Check sprint count in SPRINT_STATUS.md
grep -c "## Sprint.*COMPLETE" docs/SPRINT_STATUS.md

# Check line count
wc -l docs/SPRINT_STATUS.md

# If >1,000 lines, archive oldest sprint
```

### Monthly Review (30 minutes)

**Required Actions:**
1. [ ] Check all token budgets (line counts)
2. [ ] Archive sprints completed >30 days ago (even if <3 sprints)
3. [ ] Review for duplicate content across docs
4. [ ] Update NEXT_SPRINTS_GUIDE.md with current priorities
5. [ ] Check for orphaned files (unlinked .md files)

**Commands:**
```bash
# Find all .md files in docs/
find docs/ -name "*.md" -type f

# Check for large files
find docs/ -name "*.md" -exec wc -l {} + | sort -n

# Find files not modified in 90 days
find docs/ -name "*.md" -mtime +90
```

### Quarterly Review (1-2 hours)

**Required Actions:**
1. [ ] Review all reference docs for currency
2. [ ] Archive completed research reports
3. [ ] Update CLAUDE.md if major pattern changes
4. [ ] Consolidate fragmented documentation
5. [ ] Update ARCHITECTURE.md if tech stack changed
6. [ ] Verify all archive README files are current

**Token Audit:**
```bash
# Generate token usage report (estimate)
echo "=== TOKEN USAGE ESTIMATE ==="
echo "Critical Files:"
echo -n "CLAUDE.md: " && wc -l CLAUDE.md | awk '{print $1 * 2.5 " tokens"}'
echo -n "SPRINT_STATUS.md: " && wc -l docs/SPRINT_STATUS.md | awk '{print $1 * 2.5 " tokens"}'
echo -n "REPRIORITIZED_SPRINT_PLAN.md: " && wc -l docs/REPRIORITIZED_SPRINT_PLAN.md | awk '{print $1 * 2.5 " tokens"}'
```

### Annual Review (Half day)

**Required Actions:**
1. [ ] Major documentation restructure if needed
2. [ ] Refresh VERSION_AUDIT with new year (e.g., `VERSION_AUDIT_FEB_2027.md`)
3. [ ] Archive entire previous year's sprint history
4. [ ] Update STRATEGIC_PLAN with new year
5. [ ] Review and update all file lifecycle rules
6. [ ] Comprehensive token optimization pass

---

## Creating New Documentation

### Decision Tree: Where to Put New Files

**Sprint-related:**
- Temporary overview → `.claude-coordination/sprint-{N}-overview.md`
- Detailed plan (if needed) → `docs/` (will archive to `docs/archive/planning/` when done)

**Feature research:**
- Initial research → `docs/research/{feature}-research.md`
- After integration → Archive if >2,000 lines, update `RESEARCH_SUMMARY.md`

**Reference material:**
- Permanent patterns → `docs/reference/PATTERNS_AND_TEMPLATES.md` (append)
- Environment setup → `docs/reference/ENVIRONMENT_CONFIG.md` (edit)
- Troubleshooting → `docs/reference/TROUBLESHOOTING.md` (append)

**Strategic/planning:**
- Active roadmap → Edit `REPRIORITIZED_SPRINT_PLAN.md` (don't create new)
- Platform strategy → Edit `STRATEGIC_PLAN_FEB_2026.md` (don't create new)

### Best Practices for New Docs

**DO:**
- Check if existing doc can be updated instead
- Add "Last Updated" date at top
- Include "Purpose" statement
- Link from relevant index (CLAUDE.md, docs/README.md)
- Follow naming conventions

**DON'T:**
- Create new roadmap files (edit existing)
- Duplicate content from other docs
- Create permanent files in root directory
- Create docs without clear lifecycle plan

---

## Deduplication & Consolidation

### Identifying Duplicates

**Warning Signs:**
- Multiple files with "roadmap" in name
- Multiple files with "plan" for same feature
- Version info in >1 file
- Same sprint info in multiple locations

**Process:**
1. Identify overlapping files (manual review or grep)
2. Compare content (diff or side-by-side read)
3. Determine single source of truth
4. Merge unique content
5. Archive or delete duplicates
6. Update all references

### Consolidation Checklist

Before consolidating:
- [ ] Read all candidate files completely
- [ ] Identify unique content in each
- [ ] Choose primary file (most current/comprehensive)
- [ ] Extract unique content from others
- [ ] Merge into primary file
- [ ] Move originals to archive (don't delete)
- [ ] Update CLAUDE.md references
- [ ] Update docs/README.md (if exists)
- [ ] Verify no broken links

---

## Archive Best Practices

### When to Archive (Not Delete)

**Always archive:**
- Completed sprint documentation
- Superseded roadmaps (historical value)
- Completed planning documents
- Old audit reports (compliance/historical)

**Can delete (rarely):**
- Duplicate files with no unique content
- Temporary test files
- Outdated screenshots (after verification)

### Archive README Files

Every archive directory must have a README.md:

```markdown
# Archive: [Category Name]

**Archived:** [Date]
**Reason:** [Why archived]

## Contents

- [file1.md] - Description
- [file2.md] - Description

## Context

[Brief explanation of what these files were used for]

## Retrieval

If you need this information:
1. [Where to find active version]
2. [Alternative current resource]
```

---

## Recovery Procedures

### Restoring Archived Content

If archived content is needed:

1. **Locate archive file** in `.claude-coordination/archive/` or `docs/archive/`
2. **Read archived content** (don't move back to active)
3. **Extract needed sections** only
4. **Update current docs** with extracted content
5. **Keep archive intact** (don't delete after extraction)

### Handling Broken References

If a reference to archived file is found:

```markdown
<!-- OLD -->
See MASTER_ROADMAP.md for details

<!-- FIX -->
See docs/REPRIORITIZED_SPRINT_PLAN.md for current roadmap
(Historical context in docs/archive/MASTER_ROADMAP_historical.md)
```

---

## Token Optimization Strategies

### Quick Wins

1. **Archive old sprints** → -5,000 to -8,000 tokens per sprint
2. **Consolidate duplicate roadmaps** → -25,000 to -30,000 tokens
3. **Extract CLAUDE.md sections to reference docs** → -2,000 to -3,000 tokens
4. **Remove completed todos from SPRINT_STATUS.md** → -1,000 to -2,000 tokens

### Advanced Optimization

1. **Split large files by section** (keep index in main, details in sub-files)
2. **Use tables instead of prose** (more information density)
3. **Remove redundant examples** (keep 1-2 best examples)
4. **Summarize completed work** (full details in archive)

### Maintenance Commands

```bash
# Find files over 1,000 lines
find docs/ -name "*.md" -exec sh -c 'lines=$(wc -l < "$1"); if [ $lines -gt 1000 ]; then echo "$1: $lines lines"; fi' _ {} \;

# Find recent large additions
git log --since="1 month ago" --stat --pretty=format:"%H %s" -- "*.md" | grep "^[a-f0-9]" -A 10

# Check total documentation size
find docs/ -name "*.md" -exec wc -l {} + | tail -1
```

---

## Troubleshooting

### SPRINT_STATUS.md Growing Too Large

**Symptoms:** File exceeds 1,000 lines, token usage >15,000

**Fix:**
1. Count completed sprints: `grep -c "COMPLETE" docs/SPRINT_STATUS.md`
2. If >3 sprints, archive oldest immediately
3. Remove detailed task lists (keep only "COMPLETE ✅" and deliverables)
4. Move extended context to sprint-specific files in `.claude-coordination/`

### Multiple Active Roadmaps

**Symptoms:** Confusion about which roadmap to follow, duplicate content

**Fix:**
1. Choose single source of truth (usually most recent/comprehensive)
2. Consolidate unique content from others
3. Archive superseded roadmaps
4. Update CLAUDE.md to reference only the active roadmap
5. Add note in archived roadmaps pointing to active version

### Documentation Drift

**Symptoms:** CLAUDE.md references files that don't exist, outdated patterns

**Fix:**
1. Run monthly link check (manual or script)
2. Update CLAUDE.md Documentation Index
3. Verify all linked files exist: `cat CLAUDE.md | grep "docs/" | grep ".md"`
4. Update outdated code examples

---

## Success Metrics

### Monthly Metrics

| Metric | Target | Measure |
|--------|--------|---------|
| SPRINT_STATUS.md size | <1,000 lines | `wc -l docs/SPRINT_STATUS.md` |
| Active sprints in SPRINT_STATUS | 3 or fewer | Manual count |
| Total critical docs tokens | <50,000 | Line count × 2.5 |
| Archive growth | +1-2 files/month | `ls .claude-coordination/archive/` |

### Quarterly Metrics

| Metric | Target | Measure |
|--------|--------|---------|
| Root .md files | <10 files | `ls -1 *.md | wc -l` |
| Orphaned docs | 0 | Manual review |
| Broken references | 0 | Link check |
| Documentation coverage | All features documented | Manual review |

---

## Change Log

| Date | Change | Impact |
|------|--------|--------|
| 2026-02-04 | Initial creation, rolling window system established | -53,000 tokens per session |
| 2026-02-04 | Archived Sprints 13B-25 from SPRINT_STATUS.md | -18,000 tokens |
| 2026-02-04 | Consolidated 3 roadmaps into REPRIORITIZED_SPRINT_PLAN.md | -25,000 tokens |
| 2026-02-04 | Consolidated version docs (3→2 files) | -8,000 tokens |

---

*For questions or updates to this guide, see `CLAUDE.md` or consult project maintainer.*
