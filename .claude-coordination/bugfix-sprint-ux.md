# UI/UX Bugfix Sprint - Critical Issues

You are the BUGFIX CLI for ContractorOS.

Working directory: /Users/nickbodkins/contractoros/apps/web

## RULES
- Fix each bug in order of priority (P0 first)
- Commit after each fix
- Run `npx tsc --noEmit` after all fixes
- DO NOT create new features, only fix the listed bugs

---

## BUG UX-001: Online Status Positioning (P0 - CRITICAL)

**Location:** Sidebar user profile section (bottom left)
**File:** `app/dashboard/layout.tsx` or sidebar component

**Problem:**
- "Online" status text floats in main content area
- Overlaps with project cards on narrow viewports (600-1024px)
- Shows "Online" text alongside truncated "gn Out"

**Fix Required:**
1. Find the "Online" status indicator in the sidebar
2. Remove the floating text label
3. Add a small green dot indicator on the user avatar instead
4. Add tooltip on hover showing "Online"
5. Ensure proper z-index so it stays in sidebar

**Expected Result:**
- Small green circle (6-8px) positioned bottom-right of avatar
- Tooltip appears on hover saying "Online"
- No floating text in main content

Commit: "fix(ui): Move online status to avatar indicator with tooltip (UX-001)"

---

## BUG UX-002: Sign Out Button Text Truncation (P0 - CRITICAL)

**Location:** Sidebar user profile section (bottom left)
**File:** `app/dashboard/layout.tsx` or sidebar component

**Problem:**
- "Sign Out" displays as "gn Out" (missing "Si")
- Container width insufficient for full text

**Fix Required:**
1. Find the Sign Out button in sidebar
2. Ensure container has sufficient width OR
3. Use icon-only button with tooltip on collapsed states
4. Full text visible when sidebar expanded

**Expected Result:**
- "Sign Out" text fully visible
- Icon + text on expanded sidebar
- Icon only with tooltip on collapsed sidebar

Commit: "fix(ui): Fix Sign Out button text truncation (UX-002)"

---

## BUG UX-003: Dropdown Z-Index Issue (P0 - CRITICAL)

**Location:** Projects page filter dropdowns
**Files:**
- `app/dashboard/projects/page.tsx`
- `components/ui/Select.tsx` or dropdown component

**Problem:**
- Filter dropdowns ("All Status", "All Categories") hidden behind content
- Incorrect z-index stacking

**Fix Required:**
1. Find the dropdown/select components used on Projects page
2. Add proper z-index to dropdown menu (z-50 or higher)
3. Ensure dropdown portal renders above other content
4. Test at 1024px+ viewports

**Expected Result:**
- Dropdowns appear on top of all content when open
- No visual clipping or hiding

Commit: "fix(ui): Fix dropdown z-index stacking on Projects page (UX-003)"

---

## BUG UX-004: Text Wrapping Inconsistency (P2 - LOW)

**Location:** Dashboard project titles
**Files:** Project card components

**Problem:**
- Long titles like "Historic Home Restoration - Old Salem District" wrap inconsistently
- Layout shifts at 600-900px viewports

**Fix Required:**
1. Add consistent `line-clamp-1` or `line-clamp-2` to project titles
2. Add `truncate` class where single-line is needed
3. Ensure ellipsis displays properly

**Expected Result:**
- Consistent text truncation with ellipsis
- No layout shifts

Commit: "fix(ui): Consistent text truncation on project cards (UX-004)"

---

## BUG UX-005: Search Bar Spacing (P1 - MEDIUM)

**Location:** Top navigation bar
**File:** `app/dashboard/layout.tsx` or header component

**Problem:**
- Search bar and "New Project" button may overlap at 1024-1280px
- Insufficient padding between elements

**Fix Required:**
1. Find the header/top nav component
2. Add responsive gap/padding classes
3. Consider hiding search placeholder text at narrow widths
4. Ensure buttons don't overlap search input

**Expected Result:**
- Adequate spacing at all viewport widths
- No overlap between search and action buttons

Commit: "fix(ui): Improve search bar spacing at mid-width viewports (UX-005)"

---

## BUG UX-006: No Help/Docs Exposed (P1 - MEDIUM)

**Location:** Navigation/Header
**Problem:** No help documentation accessible

**Fix Required:**
1. Add a help icon button (QuestionMarkCircleIcon) to the header
2. Link to `/dashboard/help` or show a help modal
3. Create a basic help page at `app/dashboard/help/page.tsx` with:
   - Quick start guide
   - Keyboard shortcuts (Cmd+K for search)
   - Link to support email
   - FAQ accordion

**Expected Result:**
- "?" icon in header opens help
- Basic help page with useful info

Commit: "feat(ui): Add help page and header icon (UX-006)"

---

## Final Verification

After all fixes:

```bash
npx tsc --noEmit
```

Then report completion:

```bash
echo "CLI: BUGFIX-UX
STATUS: complete
FIXED: UX-001, UX-002, UX-003, UX-004, UX-005, UX-006
COMMIT: $(git rev-parse --short HEAD)
MESSAGE: All UI/UX bugs fixed" > /Users/nickbodkins/contractoros/.claude-coordination/bugfix-ux-$(date +%s).status
```

---

## Key Files to Check

```
app/dashboard/layout.tsx          # Main layout with sidebar
components/ui/Select.tsx          # Dropdown component
components/ui/Sidebar.tsx         # If exists
app/dashboard/projects/page.tsx   # Projects filters
```

## Testing Viewports

Test at these widths:
- 600px (mobile)
- 900px (tablet)
- 1024px (small desktop)
- 1280px (desktop)
- 1920px (wide)
