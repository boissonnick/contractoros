# Suite 22: UI/UX Testing - Mobile (320px - 428px)

Comprehensive usability testing for mobile viewport. This suite addresses the CRITICAL mobile usability issues.

---

## VIEWPORT REFERENCE

| Device | Width | Height | Priority |
|--------|-------|--------|----------|
| iPhone SE / Small | 320 | 568 | HIGH (edge case) |
| iPhone 8 / Standard | 375 | 667 | HIGH |
| iPhone X/11/12/13 | 375 | 812 | HIGH |
| iPhone 12/13 Pro | 390 | 844 | HIGH |
| iPhone 12/13 Pro Max | 428 | 926 | MEDIUM |
| Pixel 5 | 393 | 851 | MEDIUM |
| Samsung Galaxy S21 | 360 | 800 | MEDIUM |

---

## SECTION 1: Critical Mobile Navigation

### TEST: Mobile Navigation Menu
**Priority:** P0 (CRITICAL)
**Viewport:** 375x812

#### Steps
1. Navigate to /dashboard
2. Locate hamburger menu icon
3. Tap to open navigation
4. Verify all nav items visible
5. Tap to close navigation

#### Expected Results
- [ ] Hamburger icon clearly visible in header
- [ ] Icon is 44x44px minimum touch target
- [ ] Menu opens as full-screen or slide-out panel
- [ ] All navigation items listed
- [ ] Items have adequate touch targets (44px height)
- [ ] Active page indicated
- [ ] Close button or swipe to close works
- [ ] Overlay/backdrop behind menu

#### Screenshot Required
Capture both closed and open navigation states.

---

### TEST: Bottom Tab Bar
**Priority:** P0 (CRITICAL)
**Viewport:** 375x812

#### Steps
1. Check for fixed bottom navigation
2. Verify key pages accessible
3. Test all tabs

#### Expected Results
- [ ] Bottom bar fixed at viewport bottom
- [ ] Shows 4-5 key navigation items
- [ ] Icons + labels visible
- [ ] Current tab highlighted
- [ ] Touch targets 44px minimum
- [ ] Bar doesn't overlap content
- [ ] Bar stays visible on scroll

#### Issues to Check
- [ ] NOT overlapping content
- [ ] NOT too tall (max 56-64px)
- [ ] NOT hidden by keyboard

---

### TEST: Page Header Mobile
**Priority:** P0 (CRITICAL)
**Viewport:** 375x812

#### Steps
1. Check header at top of page
2. Verify content fits
3. Check any action buttons

#### Expected Results
- [ ] Logo/brand fits within header
- [ ] Page title visible (may truncate long titles)
- [ ] Back button on child pages
- [ ] Action buttons accessible (may move to menu)
- [ ] Header height reasonable (56-64px)
- [ ] No horizontal overflow

---

### TEST: Navigation Between Pages
**Priority:** P0
**Viewport:** 375x812

#### Steps
1. Navigate from Dashboard to Projects
2. Navigate to a specific project
3. Navigate back to list
4. Navigate to Clients

#### Expected Results
- [ ] Smooth page transitions
- [ ] Back navigation works (browser or in-app)
- [ ] No dead ends in navigation
- [ ] Loading states shown
- [ ] Scroll position reasonable after navigation

---

## SECTION 2: Content Layout

### TEST: Dashboard Mobile Layout
**Priority:** P0 (CRITICAL)
**Viewport:** 375x812

#### Steps
1. Navigate to /dashboard
2. Screenshot the full page
3. Scroll through all content
4. Check each section

#### Expected Results
- [ ] Stats cards: 2 per row maximum
- [ ] Cards don't overflow viewport
- [ ] "New Project" / "New Estimate" buttons accessible
- [ ] Active Projects list is single column
- [ ] All content reachable by scroll
- [ ] No horizontal scroll required
- [ ] Footer (if any) reachable

#### Screenshot Required
Full page screenshot showing entire dashboard.

---

### TEST: Stats Cards Mobile
**Priority:** P0
**Viewport:** 375x812

#### Steps
1. Examine stats cards section
2. Check card sizing
3. Verify text readability

#### Expected Results
- [ ] Cards in 2-column grid
- [ ] Equal width cards (50% minus gap)
- [ ] Numbers: 24px minimum, bold
- [ ] Labels: 12-14px, readable
- [ ] Icons: 20-24px
- [ ] Adequate padding within cards
- [ ] Cards don't touch screen edges

---

### TEST: Project Cards Mobile
**Priority:** P0
**Viewport:** 375x812

#### Steps
1. Navigate to /dashboard/projects
2. View project cards
3. Tap on a project

#### Expected Results
- [ ] Cards are full-width (single column)
- [ ] Project name prominent
- [ ] Client and location visible
- [ ] Status badge visible
- [ ] Budget info readable
- [ ] Entire card is tappable
- [ ] Adequate spacing between cards

---

### TEST: Lists and Tables Mobile
**Priority:** P0
**Viewport:** 375x812

#### Steps
1. View any list page (team, clients)
2. Check for table vs card display
3. Verify all info accessible

#### Expected Results
- [ ] Tables converted to cards on mobile
- [ ] OR tables have horizontal scroll with indicator
- [ ] Key info visible without scroll
- [ ] Actions accessible (in card or overflow menu)
- [ ] List items have adequate height (56px+)

---

### TEST: Content Width and Margins
**Priority:** P0
**Viewport:** 375x812

#### Steps
1. Check page margins on all pages
2. Verify text doesn't touch screen edge
3. Check consistent spacing

#### Expected Results
- [ ] Left/right margins: 16px minimum
- [ ] Content never touches screen edge
- [ ] Consistent margins across pages
- [ ] Full-width elements have proper containment

---

## SECTION 3: Forms on Mobile

### TEST: Form Field Layout
**Priority:** P0 (CRITICAL)
**Viewport:** 375x812

#### Steps
1. Open Add Client or New Project modal
2. Check field arrangement
3. Fill out form using keyboard

#### Expected Results
- [ ] All fields single column (full width)
- [ ] Labels above inputs (not inline)
- [ ] Input height: 44px minimum
- [ ] Adequate spacing between fields (16px+)
- [ ] Required indicators visible (*)
- [ ] Helper text readable

---

### TEST: Modal/Sheet on Mobile
**Priority:** P0 (CRITICAL)
**Viewport:** 375x812

#### Steps
1. Open a modal (Add Client)
2. Check modal presentation
3. Scroll through form if long
4. Try to close modal

#### Expected Results
- [ ] Modal is full-screen or near full-screen
- [ ] Header with title and close button
- [ ] Scrollable content area
- [ ] Fixed footer with action buttons
- [ ] Close (X) button: 44px touch target
- [ ] Can scroll to submit button
- [ ] Tapping outside (if visible) closes modal

---

### TEST: Keyboard Handling
**Priority:** P0 (CRITICAL)
**Viewport:** 375x812

#### Steps
1. Open a form
2. Tap on input field
3. Observe keyboard appearance
4. Check if input remains visible
5. Move between fields

#### Expected Results
- [ ] Input field scrolls into view above keyboard
- [ ] Current input always visible
- [ ] Can tap "Next" to move to next field
- [ ] Submit button accessible when keyboard open
- [ ] Keyboard doesn't permanently cover content

---

### TEST: Select/Dropdown Mobile
**Priority:** P0
**Viewport:** 375x812

#### Steps
1. Find a select/dropdown field
2. Tap to open
3. Select an option

#### Expected Results
- [ ] Native select OR custom mobile-friendly dropdown
- [ ] Options are scrollable if many
- [ ] Touch targets: 44px height per option
- [ ] Selected state visible
- [ ] Closes after selection

---

### TEST: Date Picker Mobile
**Priority:** P1
**Viewport:** 375x812

#### Steps
1. Find a date input
2. Tap to open date picker
3. Select a date

#### Expected Results
- [ ] Mobile-friendly date picker (native or custom)
- [ ] Calendar days tappable (36px+ each)
- [ ] Month/year navigation works
- [ ] Today clearly marked
- [ ] Selected date highlighted
- [ ] Done/confirm action clear

---

### TEST: Text Area on Mobile
**Priority:** P1
**Viewport:** 375x812

#### Steps
1. Find a notes/description text area
2. Tap to focus
3. Type multiple lines

#### Expected Results
- [ ] Text area expands or scrolls
- [ ] Can see what you're typing
- [ ] Minimum height: 88px (4 lines)
- [ ] Keyboard doesn't fully obscure

---

## SECTION 4: Touch Interactions

### TEST: Touch Target Audit
**Priority:** P0 (CRITICAL)
**Viewport:** 375x812

#### Steps
1. Go through entire app
2. Identify all tappable elements
3. Measure touch targets

#### Expected Results
- [ ] ALL buttons: 44x44px minimum
- [ ] ALL icons: 44x44px minimum (including padding)
- [ ] ALL links: Adequate tap area
- [ ] No adjacent touch targets without 8px gap
- [ ] No accidental tap zones

#### Screenshot Required
Highlight any elements smaller than 44x44px.

---

### TEST: Tap Feedback
**Priority:** P1
**Viewport:** 375x812

#### Steps
1. Tap various buttons and links
2. Check for visual feedback
3. Verify response feels immediate

#### Expected Results
- [ ] Immediate visual feedback on tap
- [ ] Active/pressed state visible
- [ ] No delay before feedback (<100ms)
- [ ] Ripple or highlight effect

---

### TEST: Scroll Performance
**Priority:** P0
**Viewport:** 375x812

#### Steps
1. Scroll through long lists
2. Check for smooth scrolling
3. Test momentum scroll

#### Expected Results
- [ ] Smooth 60fps scrolling
- [ ] Momentum scroll works naturally
- [ ] No jank or stuttering
- [ ] Scroll doesn't fight with gestures

---

### TEST: Pull to Refresh
**Priority:** P2
**Viewport:** 375x812

#### Steps
1. Pull down on list pages
2. Check for refresh behavior

#### Expected Results
- [ ] Pull-to-refresh indicator appears (if implemented)
- [ ] Data refreshes on release
- [ ] Loading indicator shown
- [ ] Smooth animation

---

## SECTION 5: Typography Mobile

### TEST: Text Readability
**Priority:** P0
**Viewport:** 375x812

#### Steps
1. Check all text sizes throughout app
2. Verify nothing too small
3. Check line lengths

#### Expected Results
- [ ] Body text: 14px minimum (16px preferred)
- [ ] Labels: 12px minimum
- [ ] No text smaller than 12px
- [ ] Line height: 1.4+ for body text
- [ ] Line length: Not exceeding viewport

---

### TEST: Text Truncation
**Priority:** P1
**Viewport:** 375x812

#### Steps
1. Check long names/titles
2. Verify ellipsis usage
3. Check for full text access

#### Expected Results
- [ ] Long text truncates with ellipsis
- [ ] Key info shown before truncation
- [ ] Can access full text (tap to expand or detail view)
- [ ] No broken layouts from overflow

---

### TEST: Heading Sizing Mobile
**Priority:** P1
**Viewport:** 375x812

#### Steps
1. Check page titles
2. Check section headers
3. Verify visual hierarchy

#### Expected Results
- [ ] Page titles: 20-24px
- [ ] Section headers: 16-18px
- [ ] Clear hierarchy visible
- [ ] Headings don't wrap awkwardly

---

## SECTION 6: Specific Page Testing

### TEST: Dashboard Complete Flow
**Priority:** P0
**Viewport:** 375x812

#### Steps
1. Load dashboard
2. View all stats
3. Scroll to projects
4. Tap on a project
5. Return to dashboard

#### Expected Results
- [ ] All content accessible
- [ ] Smooth navigation
- [ ] No dead ends
- [ ] Reasonable load times

---

### TEST: Projects List & Detail
**Priority:** P0
**Viewport:** 375x812

#### Steps
1. Navigate to Projects
2. Filter/search (if available)
3. Tap project card
4. View project details
5. Navigate tabs (if present)

#### Expected Results
- [ ] List displays correctly
- [ ] Filters accessible (may be in modal)
- [ ] Detail page loads
- [ ] Tabs work or scroll horizontally
- [ ] All project info accessible

---

### TEST: Client Management Flow
**Priority:** P1
**Viewport:** 375x812

#### Steps
1. Navigate to Clients
2. Tap Add Client
3. Fill form
4. Submit
5. View new client

#### Expected Results
- [ ] Can complete add client flow
- [ ] Form usable on mobile
- [ ] Success feedback shown
- [ ] Client appears in list

---

### TEST: Team View
**Priority:** P1
**Viewport:** 375x812

#### Steps
1. Navigate to Team
2. View member cards
3. Check contact actions

#### Expected Results
- [ ] Member cards display properly
- [ ] Can tap to call/email
- [ ] Role info visible
- [ ] Invite flow accessible (if admin)

---

## SECTION 7: Edge Cases

### TEST: Small Screen (320px)
**Priority:** P1
**Viewport:** 320x568

#### Steps
1. Test on smallest viewport
2. Check critical layouts
3. Verify nothing breaks

#### Expected Results
- [ ] Dashboard still usable
- [ ] Navigation accessible
- [ ] Forms completable
- [ ] Text readable (may be tighter)

---

### TEST: Large Phone (428px)
**Priority:** P2
**Viewport:** 428x926

#### Steps
1. Test on largest phone viewport
2. Check for wasted space
3. Verify layouts adapt

#### Expected Results
- [ ] Content fills width appropriately
- [ ] No awkward single-column on wide phone
- [ ] Consistent with standard mobile

---

### TEST: Landscape Phone
**Priority:** P1
**Viewport:** 812x375

#### Steps
1. Rotate to landscape
2. Check critical pages
3. Test form usability

#### Expected Results
- [ ] Content still accessible
- [ ] Navigation works
- [ ] Forms usable (may need scroll)
- [ ] Keyboard doesn't completely block

---

## SECTION 8: Performance Mobile

### TEST: Initial Load Time
**Priority:** P0
**Viewport:** 375x812

#### Steps
1. Clear cache
2. Navigate to dashboard
3. Time until usable

#### Expected Results
- [ ] First paint: <2 seconds
- [ ] Time to interactive: <5 seconds
- [ ] Critical content visible first
- [ ] Loading indicator if >1 second

---

### TEST: Navigation Speed
**Priority:** P1
**Viewport:** 375x812

#### Steps
1. Navigate between pages
2. Check transition times
3. Verify responsiveness

#### Expected Results
- [ ] Page transitions: <500ms
- [ ] Instant feedback on tap
- [ ] Loading states for slow operations

---

### TEST: Scroll List Performance
**Priority:** P1
**Viewport:** 375x812

#### Steps
1. Scroll through long lists
2. Check for lazy loading
3. Verify no memory issues

#### Expected Results
- [ ] Smooth scrolling maintained
- [ ] Items lazy load (virtualization)
- [ ] No crashes on long lists

---

## Mobile UAT Summary

```
MOBILE UI/UX TEST RESULTS (375x812)
====================================

NAVIGATION (CRITICAL)
---------------------
Mobile Nav Menu:        [PASS/FAIL]
Bottom Tab Bar:         [PASS/FAIL]
Page Header:            [PASS/FAIL]
Page Navigation:        [PASS/FAIL]

CONTENT LAYOUT (CRITICAL)
-------------------------
Dashboard Layout:       [PASS/FAIL]
Stats Cards:            [PASS/FAIL]
Project Cards:          [PASS/FAIL]
Lists/Tables:           [PASS/FAIL]
Content Width:          [PASS/FAIL]

FORMS (CRITICAL)
----------------
Form Field Layout:      [PASS/FAIL]
Modal/Sheet:            [PASS/FAIL]
Keyboard Handling:      [PASS/FAIL]
Select/Dropdown:        [PASS/FAIL]
Date Picker:            [PASS/FAIL]
Text Area:              [PASS/FAIL]

TOUCH (CRITICAL)
----------------
Touch Targets (44px):   [PASS/FAIL]
Tap Feedback:           [PASS/FAIL]
Scroll Performance:     [PASS/FAIL]
Pull to Refresh:        [PASS/FAIL]

TYPOGRAPHY
----------
Text Readability:       [PASS/FAIL]
Text Truncation:        [PASS/FAIL]
Heading Sizing:         [PASS/FAIL]

FLOWS
-----
Dashboard Flow:         [PASS/FAIL]
Projects Flow:          [PASS/FAIL]
Clients Flow:           [PASS/FAIL]
Team View:              [PASS/FAIL]

EDGE CASES
----------
Small Screen (320px):   [PASS/FAIL]
Large Phone (428px):    [PASS/FAIL]
Landscape:              [PASS/FAIL]

PERFORMANCE
-----------
Initial Load:           [PASS/FAIL]
Navigation Speed:       [PASS/FAIL]
Scroll Performance:     [PASS/FAIL]

Overall: [X/28 PASSED]
Critical Tests: [X/13 PASSED]
```

---

## Mobile Critical Issues Checklist

### BLOCKERS (Must fix immediately)
- [ ] Navigation menu doesn't open
- [ ] Touch targets too small to tap
- [ ] Forms can't be completed
- [ ] Content not accessible (cut off, overflow)
- [ ] Keyboard covers input permanently
- [ ] Can't scroll to critical content

### MAJOR (Fix before release)
- [ ] Poor touch feedback
- [ ] Slow/janky scrolling
- [ ] Text too small to read
- [ ] Confusing navigation
- [ ] Broken layouts at certain widths

### MINOR (Can fix post-release)
- [ ] Minor spacing issues
- [ ] Animation polish
- [ ] Non-critical feature accessibility

---

## Known Mobile Issues Template

When documenting issues:

```markdown
### ISSUE: [Brief Description]
**Severity:** BLOCKER / MAJOR / MINOR
**Viewport:** 375x812
**Page:** /dashboard/[page]

**Description:**
[What's wrong]

**Steps to Reproduce:**
1. Navigate to [page]
2. [Action]
3. [Observe issue]

**Expected:**
[What should happen]

**Actual:**
[What happens instead]

**Screenshot:**
[Attach screenshot]

**Suggested Fix:**
[If known]
```
