# Documentation Audit & Integration Plan

**Created:** 2026-02-04
**Purpose:** Strategy for updating stale technical docs and integrating them into maintenance schedule

---

## Problem Statement

Several technical documentation files are outdated or not integrated into the rolling window maintenance system:

| File | Size | Last Updated | Issue |
|------|------|--------------|-------|
| ARCHITECTURE.md | 1,109 lines | Feb 2 | Says "Next.js 14", we're on 16 |
| COMPONENT_PATTERNS.md | 1,544 lines | Feb 3 | May be outdated, very large |
| DEVELOPMENT_GUIDE.md | 384 lines | Jan 28 | Pre-upgrade, needs review |
| TESTING_STRATEGY.md | 428 lines | Jan 28 | Pre-upgrade, may be outdated |
| docs/bugfixes/ | 2 files | Jan 28 | Old bug tracking, now in sprints |
| docs/help/ | 20+ folders | Jan 30 | User help docs, separate system |

**Total:** ~3,500 lines of technical docs not in maintenance schedule

---

## Strategy: Living Documentation System

### Principle 1: Documentation Decay Schedule

**Different docs age at different rates:**

| Doc Type | Decay Rate | Update Frequency | Ownership |
|----------|------------|------------------|-----------|
| **Architecture** | Fast | Every 10 sprints or major upgrade | Update immediately after tech stack changes |
| **Component Patterns** | Medium | Every 20 sprints or new patterns | Update when adding major UI patterns |
| **Development Guide** | Slow | Quarterly or when practices change | Update when coding conventions change |
| **Testing Strategy** | Slow | Quarterly or when test framework changes | Update when testing approach changes |
| **User Help** | Independent | As features release | Separate from dev docs |
| **Bug Tracking** | Sprint-scoped | Every sprint | Integrated into SPRINT_STATUS |

### Principle 2: Single Source of Truth

**Eliminate overlap between docs:**

| Information | Primary Location | Secondary/Reference |
|-------------|------------------|---------------------|
| Code patterns | reference/PATTERNS_AND_TEMPLATES.md | COMPONENT_PATTERNS (detailed) |
| Architecture overview | ARCHITECTURE.md | CLAUDE.md (quick ref) |
| Development workflow | DEVELOPMENT_GUIDE.md | CLAUDE.md (quick ref) |
| Testing approach | TESTING_STRATEGY.md | apps/web/e2e/ (actual tests) |
| Current bugs | SPRINT_STATUS.md | archive/audit/ (historical) |

---

## Action Plan

### Phase 1: Update Outdated Technical Docs ⚡ URGENT

#### 1.1 Update ARCHITECTURE.md
**Status:** OUTDATED (says Next.js 14, we're on 16)

**Actions:**
1. Update version references:
   - Next.js 14 → Next.js 16
   - React 18 → React 19
   - Node 20 → Node 22
2. Add "Last Verified" date after each major section
3. Add "Update Schedule: After major upgrades (every 10 sprints)"
4. Review data models - may have changed during Sprints 47-52

**Acceptance Criteria:**
- All version numbers current
- Reflects React 19 server components usage
- Reflects Next.js 16 async request APIs
- Each section has "Last Verified: 2026-02-04"

#### 1.2 Consolidate DEVELOPMENT_GUIDE.md + reference/PATTERNS_AND_TEMPLATES.md
**Status:** DUPLICATE (overlapping content)

**Decision:**
- Keep DEVELOPMENT_GUIDE.md for **development workflow** (how we work)
- Keep reference/PATTERNS_AND_TEMPLATES.md for **code examples** (what to write)

**Actions:**
1. Review DEVELOPMENT_GUIDE for outdated patterns
2. Move code examples to reference/PATTERNS_AND_TEMPLATES
3. Keep workflow, git practices, review process in DEVELOPMENT_GUIDE
4. Add cross-references between files

**Result:**
- DEVELOPMENT_GUIDE: Workflow, processes, standards
- PATTERNS_AND_TEMPLATES: Code snippets, templates, examples

#### 1.3 Review TESTING_STRATEGY.md
**Status:** May be outdated (Jan 28, pre-upgrades)

**Decision:** Compare with actual test suite in apps/web/e2e/

**Actions:**
1. Read TESTING_STRATEGY.md
2. Check if reflects actual e2e/ suite structure
3. If outdated: Archive and point to e2e/README.md
4. If current: Add "Last Verified: 2026-02-04"

**Options:**
- **Option A:** Archive to archive/reference/ if superseded by e2e/
- **Option B:** Update to match current test approach

#### 1.4 Audit COMPONENT_PATTERNS.md (1,544 lines!)
**Status:** VERY LARGE, may be outdated

**Concern:** 1,544 lines is huge, likely has token waste

**Actions:**
1. Compare with reference/PATTERNS_AND_TEMPLATES.md for overlap
2. Check if examples match current components
3. Consider: Is this a "living reference" or "historical snapshot"?

**Options:**
- **Option A:** Archive detailed patterns, keep reference/ version
- **Option B:** Split into smaller files by pattern type
- **Option C:** Keep as deep-dive reference, update as-needed

---

### Phase 2: Archive Non-Development Documentation

#### 2.1 Archive docs/bugfixes/
**Status:** Jan 28, issues now tracked in SPRINT_STATUS

**Reasoning:**
- Bug tracking moved to sprint-based system
- ACCEPTANCE_CRITERIA.md and REFACTORING.md are snapshots
- Not updated during Sprints 49-52 (bug fix sprints!)

**Action:**
```bash
mv docs/bugfixes/ docs/archive/bugfixes/
```

**Create README:**
```markdown
# Archive: Bug Tracking (Jan 2026)

**Archived:** 2026-02-04
**Reason:** Bug tracking moved to sprint-based system

These files tracked bugs before sprint-based tracking:
- ACCEPTANCE_CRITERIA.md - Test cases for bug fixes
- REFACTORING.md - Technical debt inventory

**Current bug tracking:**
- See docs/SPRINT_STATUS.md for active issues
- See docs/REPRIORITIZED_SPRINT_PLAN.md for prioritized fixes
- See docs/archive/audit/ for historical audit reports
```

#### 2.2 Relocate docs/help/ (User Documentation)
**Status:** Jan 30, separate from dev docs

**Reasoning:**
- User help docs are separate concern from development docs
- 20+ folders with feature guides
- Not part of development workflow
- Should be closer to actual application

**Options:**
- **Option A:** Move to `apps/web/public/help/` (served with app)
- **Option B:** Keep in `docs/help/` but exclude from dev doc counts
- **Option C:** Archive to `docs/archive/user-help-jan-2026/` (snapshot)

**Recommendation:** Option B - Keep separate, document as "User Documentation System"

---

### Phase 3: Create Documentation Inventory

#### 3.1 Create ACTIVE_DOCS_INVENTORY.md

**Purpose:** Master list of all documentation with update schedules

```markdown
# Active Documentation Inventory

**Last Updated:** 2026-02-04

## Core Development Docs (Read Often)

| Document | Size | Last Updated | Update Schedule | Owner |
|----------|------|--------------|-----------------|-------|
| CLAUDE.md | 650 lines | Feb 4 | After major changes | System |
| NEXT_SPRINTS_GUIDE.md | 139 lines | Feb 4 | Weekly | Planning |
| SPRINT_STATUS.md | 483 lines | Feb 4 | Daily | Development |
| REPRIORITIZED_SPRINT_PLAN.md | 850 lines | Feb 4 | After each sprint | Planning |

## Technical Reference (As-Needed)

| Document | Size | Last Updated | Update Schedule | Owner |
|----------|------|--------------|-----------------|-------|
| ARCHITECTURE.md | 1,109 lines | Feb 4 | Every 10 sprints or major upgrade | Architecture |
| DEVELOPMENT_GUIDE.md | 384 lines | Jan 28 | Quarterly or when practices change | Development |
| COMPONENT_PATTERNS.md | 1,544 lines | Feb 3 | Every 20 sprints or new patterns | UI/UX |
| TESTING_STRATEGY.md | 428 lines | Jan 28 | Quarterly or framework changes | QA |

## Reference Documentation (Search First)

| Document | Size | Last Updated | Update Schedule | Owner |
|----------|------|--------------|-----------------|-------|
| reference/ENVIRONMENT_CONFIG.md | ~400 lines | Feb 4 | When tools upgrade | DevOps |
| reference/TROUBLESHOOTING.md | ~500 lines | Feb 4 | When new errors discovered | Development |
| reference/PATTERNS_AND_TEMPLATES.md | ~400 lines | Feb 4 | When patterns added | Development |

## Update Schedule Legend

- **Daily:** Every session
- **Weekly:** Every 3-5 sprints
- **Quarterly:** Every ~30 sprints
- **Every 10 sprints:** After major milestones
- **When X changes:** Event-driven updates

## Maintenance Triggers

### Automatic Updates (Rolling Window)
- SPRINT_STATUS.md - Archive when 3+ completed sprints
- See DOCUMENTATION_MAINTENANCE.md

### Manual Updates (Event-Driven)
- ARCHITECTURE.md - After tech stack upgrades (Node, React, Next.js)
- COMPONENT_PATTERNS.md - After new UI pattern introduced
- DEVELOPMENT_GUIDE.md - After workflow changes
- TESTING_STRATEGY.md - After test framework changes

### Scheduled Reviews
- **Monthly:** Token budget check (line counts)
- **Quarterly:** Review all technical docs for currency
- **Annually:** Major documentation audit (like this one!)
```

#### 3.2 Add to DOCUMENTATION_MAINTENANCE.md

Add section on "Technical Documentation Update Schedule":

```markdown
## Technical Documentation Updates

### Architecture Documentation
- **File:** ARCHITECTURE.md
- **Update trigger:** After major tech stack upgrades
- **Frequency:** Every 10 sprints or immediately after:
  - Node.js version change
  - React version change
  - Next.js version change
  - Database architecture change
- **Process:**
  1. Update version references throughout doc
  2. Update diagrams if architecture changed
  3. Add "Last Verified: [DATE]" to each major section
  4. Review data models for changes
  5. Test that code examples still work

### Component Patterns
- **File:** COMPONENT_PATTERNS.md
- **Update trigger:** New UI pattern introduced
- **Frequency:** Every 20 sprints or when:
  - New shared component created
  - Major UI library upgrade
  - Design system changes
- **Process:**
  1. Add new pattern with example
  2. Update existing patterns if API changed
  3. Remove deprecated patterns

### Development Guide
- **File:** DEVELOPMENT_GUIDE.md
- **Update trigger:** Workflow or practice changes
- **Frequency:** Quarterly or when:
  - Git workflow changes
  - Code review process updates
  - New coding standards adopted
- **Process:**
  1. Document new practices
  2. Update examples
  3. Archive old practices if deprecated

### Testing Strategy
- **File:** TESTING_STRATEGY.md
- **Update trigger:** Test framework changes
- **Frequency:** Quarterly or when:
  - Test framework upgraded
  - New testing approach adopted
  - E2E test structure changes
- **Process:**
  1. Document current test structure
  2. Update test writing guidelines
  3. Sync with apps/web/e2e/ README
```

---

## Implementation Timeline

### Immediate (This Session)

1. ✅ Create this audit plan
2. ⚡ Update ARCHITECTURE.md version references (Next.js 14→16, React 18→19, Node 20→22)
3. ⚡ Add "Last Verified" dates to major sections
4. ⚡ Archive docs/bugfixes/
5. ⚡ Create ACTIVE_DOCS_INVENTORY.md
6. ⚡ Update DOCUMENTATION_MAINTENANCE.md with technical doc schedules

### Next Session (When Time Permits)

1. Consolidate DEVELOPMENT_GUIDE + reference/PATTERNS_AND_TEMPLATES (remove overlap)
2. Review TESTING_STRATEGY vs e2e/ suite
3. Audit COMPONENT_PATTERNS for token waste
4. Decide on docs/help/ relocation

### Quarterly Review (Every ~30 Sprints)

1. Review all technical docs for accuracy
2. Update examples to match current code
3. Archive outdated patterns
4. Check token budgets

---

## Success Metrics

### Token Efficiency
- Technical docs should be <20,000 tokens combined
- Reference docs only read when needed
- No duplicate information across files

### Currency
- All version numbers current
- All code examples work
- All references point to existing files

### Maintainability
- Clear update schedules documented
- Clear ownership for each doc
- Automatic triggers for updates

---

## Recommendations

### Priority 1 (This Session)
1. Update ARCHITECTURE.md immediately (outdated versions)
2. Archive docs/bugfixes/ (not maintained)
3. Create inventory system

### Priority 2 (Next Session)
1. Consolidate overlapping dev guides
2. Review TESTING_STRATEGY currency
3. Audit COMPONENT_PATTERNS size

### Priority 3 (Quarterly)
1. Full technical doc review
2. Update all examples
3. Remove deprecated patterns

---

*This audit plan created during aggressive documentation cleanup (Feb 4, 2026)*
