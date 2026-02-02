# Suite 23: UAT Checklist - Complete UI/UX Testing

Master checklist for User Acceptance Testing across all viewports.

---

## Pre-Test Setup

### Environment
- [ ] Dev server running: `npm run dev` at localhost:3000
- [ ] Chrome browser with Claude in Chrome extension
- [ ] Test user account with Owner role
- [ ] Demo data populated

### Viewports to Test
| Viewport | Size | Device Reference |
|----------|------|------------------|
| Desktop | 1280x800 | Standard desktop |
| Desktop Large | 1440x900 | Large monitor |
| Tablet Portrait | 768x1024 | iPad Mini |
| Tablet Landscape | 1024x768 | iPad Landscape |
| Mobile | 375x812 | iPhone X/11/12 |
| Mobile Small | 320x568 | iPhone SE |

---

## UAT Test Execution Order

### Phase 1: Desktop (Suite 20)
**Time: ~45 minutes**

Run at 1280x800 first:
1. Layout & Visual Hierarchy
2. Typography & Readability
3. Interactive Elements
4. Color & Visual Design
5. Spacing & Alignment
6. Loading & Transition States
7. Accessibility

### Phase 2: Tablet (Suite 21)
**Time: ~30 minutes**

Run at 768x1024 and 1024x768:
1. Navigation Adaptation
2. Layout Changes
3. Form Usability
4. Touch Interactions
5. Orientation Changes

### Phase 3: Mobile (Suite 22) - PRIORITY
**Time: ~45 minutes**

Run at 375x812 (and 320x568 for edge cases):
1. Critical Navigation
2. Content Layout
3. Form Usability
4. Touch Interactions
5. Typography
6. Complete User Flows
7. Performance

---

## Quick UAT Scorecard

### Desktop (1280x800)
| Category | Tests | Pass | Fail |
|----------|-------|------|------|
| Layout | 4 | | |
| Typography | 3 | | |
| Interactions | 5 | | |
| Visual Design | 3 | | |
| Spacing | 2 | | |
| Loading States | 3 | | |
| Accessibility | 3 | | |
| **TOTAL** | **23** | | |

### Tablet (768x1024)
| Category | Tests | Pass | Fail |
|----------|-------|------|------|
| Navigation | 4 | | |
| Layout | 5 | | |
| Forms | 4 | | |
| Touch | 4 | | |
| Typography | 2 | | |
| Orientation | 2 | | |
| Performance | 2 | | |
| **TOTAL** | **23** | | |

### Mobile (375x812)
| Category | Tests | Pass | Fail |
|----------|-------|------|------|
| Navigation | 4 | | |
| Layout | 5 | | |
| Forms | 6 | | |
| Touch | 4 | | |
| Typography | 3 | | |
| Flows | 4 | | |
| Edge Cases | 3 | | |
| Performance | 3 | | |
| **TOTAL** | **32** | | |

---

## Critical Path Tests (Must Pass)

These tests are BLOCKERS - if any fail, the release is not ready.

### Desktop Critical
- [ ] Sidebar navigation works
- [ ] All pages load without error
- [ ] Forms can be submitted
- [ ] Modal dialogs work
- [ ] Keyboard navigation functions

### Tablet Critical
- [ ] Navigation accessible (hamburger or collapsed sidebar)
- [ ] Touch targets adequate (44px+)
- [ ] Forms completable
- [ ] Orientation change doesn't break layout

### Mobile Critical (HIGHEST PRIORITY)
- [ ] Navigation menu opens/closes
- [ ] Bottom tab bar works (if present)
- [ ] Dashboard content accessible via scroll
- [ ] Forms can be completed with keyboard
- [ ] Touch targets are 44px minimum
- [ ] No horizontal scroll on pages
- [ ] Project detail accessible
- [ ] Client add flow works

---

## Page-by-Page Viewport Matrix

### Dashboard
| Feature | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Stats visible | [  ] | [  ] | [  ] |
| Quick actions | [  ] | [  ] | [  ] |
| Project list | [  ] | [  ] | [  ] |
| Overdue tasks | [  ] | [  ] | [  ] |

### Projects
| Feature | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| List view | [  ] | [  ] | [  ] |
| Grid view | [  ] | [  ] | [  ] |
| Filters | [  ] | [  ] | [  ] |
| New project | [  ] | [  ] | [  ] |
| Project detail | [  ] | [  ] | [  ] |

### Clients
| Feature | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Client list | [  ] | [  ] | [  ] |
| Add client | [  ] | [  ] | [  ] |
| Edit client | [  ] | [  ] | [  ] |
| Client detail | [  ] | [  ] | [  ] |

### Team
| Feature | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Member list | [  ] | [  ] | [  ] |
| Invite member | [  ] | [  ] | [  ] |
| Member detail | [  ] | [  ] | [  ] |
| Role display | [  ] | [  ] | [  ] |

### Settings
| Feature | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Tab navigation | [  ] | [  ] | [  ] |
| Templates | [  ] | [  ] | [  ] |
| Organization | [  ] | [  ] | [  ] |
| Save changes | [  ] | [  ] | [  ] |

### Payroll
| Feature | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Overview stats | [  ] | [  ] | [  ] |
| Payroll runs | [  ] | [  ] | [  ] |
| Run detail | [  ] | [  ] | [  ] |
| Create run | [  ] | [  ] | [  ] |

---

## Issue Tracking Template

### Format
```
[VIEWPORT]-[PAGE]-[SEVERITY]-[NUMBER]

Example: MOBILE-DASH-BLOCKER-001
```

### Severity Definitions
| Severity | Definition | SLA |
|----------|------------|-----|
| BLOCKER | Prevents core functionality | Fix immediately |
| MAJOR | Significantly impairs usability | Fix before release |
| MINOR | Cosmetic or low-impact | Fix in next sprint |
| ENHANCEMENT | Suggestion for improvement | Backlog |

---

## Issue Log

### BLOCKER Issues
| ID | Description | Page | Status |
|----|-------------|------|--------|
| | | | |

### MAJOR Issues
| ID | Description | Page | Status |
|----|-------------|------|--------|
| | | | |

### MINOR Issues
| ID | Description | Page | Status |
|----|-------------|------|--------|
| | | | |

---

## UAT Sign-Off

### Desktop UAT
- **Tester:** ________________
- **Date:** ________________
- **Result:** PASS / CONDITIONAL PASS / FAIL
- **Blockers:** ________________
- **Notes:** ________________

### Tablet UAT
- **Tester:** ________________
- **Date:** ________________
- **Result:** PASS / CONDITIONAL PASS / FAIL
- **Blockers:** ________________
- **Notes:** ________________

### Mobile UAT
- **Tester:** ________________
- **Date:** ________________
- **Result:** PASS / CONDITIONAL PASS / FAIL
- **Blockers:** ________________
- **Notes:** ________________

---

## Release Criteria

### Must Have (Release Blockers)
- [ ] All BLOCKER issues resolved
- [ ] Desktop: 90%+ tests passing
- [ ] Tablet: 85%+ tests passing
- [ ] Mobile: 85%+ tests passing
- [ ] All critical path tests passing

### Should Have (Conditional Release)
- [ ] All MAJOR issues resolved
- [ ] All viewports: 90%+ tests passing
- [ ] Performance benchmarks met

### Nice to Have (Post-Release)
- [ ] All MINOR issues resolved
- [ ] All ENHANCEMENT items reviewed
- [ ] 100% test coverage

---

## Sprint Integration Rule

> **RULE: Run full UAT testing after every 5-10 sprints**

### Sprint UAT Schedule
| After Sprint | UAT Focus |
|--------------|-----------|
| 5 | Mobile quick check |
| 10 | Full UAT all viewports |
| 15 | Mobile quick check |
| 20 | Full UAT all viewports |

### Quick Check (Sprints 5, 15, etc.)
- Run critical path tests only
- Focus on new features
- ~30 minutes total

### Full UAT (Sprints 10, 20, etc.)
- Complete Suite 20, 21, 22
- All viewports
- ~2 hours total

---

## Appendix: Claude Code Commands

### Run Desktop UAT
```
Run UI/UX desktop tests from apps/web/e2e/suites/20-ui-ux-desktop.md at 1280x800
```

### Run Tablet UAT
```
Run UI/UX tablet tests from apps/web/e2e/suites/21-ui-ux-tablet.md at 768x1024
```

### Run Mobile UAT
```
Run UI/UX mobile tests from apps/web/e2e/suites/22-ui-ux-mobile.md at 375x812
```

### Run All UAT
```
Run complete UAT testing using apps/web/e2e/suites/23-uat-checklist.md. Start with mobile (critical), then tablet, then desktop.
```
