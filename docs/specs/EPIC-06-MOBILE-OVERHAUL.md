# EPIC-06: Mobile Experience Overhaul (Sprint 63)

> **Status:** Spec
> **Owner:** Product Agent
> **Target:** Sprint 63

---

## 1. Objective
Transform ContractorOS from a responsive web app into a "Native-Quality" mobile web experience. Focus on navigation, touch targets, and role-based access to the Time Clock.

## 2. Key Features

### Feature A: Mobile Bottom Navigation
**User Story:** As any user on mobile, I want a persistent bottom navigation bar so I can quickly switch between my core tasks.

**Requirements:**
1.  **Visibility:** Visible only on mobile breakpoints (`md` and below).
2.  **Items:**
    *   **Home/Dashboard:** `HomeIcon`
    *   **Projects:** `BriefcaseIcon`
    *   **Schedule:** `CalendarIcon`
    *   **Time Clock:** `ClockIcon` (Visible to ALL users with `EMPLOYEE`, `PM`, `OWNER` roles).
    *   **More:** `Bars3Icon` (Opens Drawer).
3.  **Active State:** Highlight current route.
4.  **SafeArea:** Ensure compatibility with iOS Home Indicator.

### Feature B: Full-Screen "More" Drawer
**User Story:** As a user, I need to access the full menu without a cramped sidebar feel.

**Requirements:**
1.  **Trigger:** Tapping "More" in Bottom Nav.
2.  **UI Pattern:** Full-screen overlay (slide up or fade in).
3.  **Content:**
    *   Search Bar (Global Search).
    *   **Grouped Navigation** (Sales, Finance, Operations) as collapsible accordions.
    *   **Quick Actions:** "New Project", "New Client", "New Task".
    *   **Profile/Settings:** At the bottom.
4.  **Close:** "X" button top-right or swipe down.

### Feature C: Mobile Time Clock Polish
**Context:** Existing `apps/web/app/dashboard/time/page.tsx` is functional but needs integration.

**Requirements:**
1.  **Bottom Nav Integration:** Tapping "Time Clock" opens the Time Clock page.
2.  **Quick Action:** If user is *not* clocked in, the icon should perhaps have a subtle badge or indicator (optional v2).
3.  **Touch Targets:** Ensure Start/Stop buttons are 44px+ min height.

## 3. Technical Implementation

### Components
*   `components/layout/MobileBottomNav.tsx`
*   `components/layout/MobileNavigationDrawer.tsx`
*   `hooks/useMobileNav.ts` (State for drawer)

### Routing
*   Update `AppShell` to conditionally render `MobileBottomNav` on mobile and hide standard Sidebar on mobile.

## 4. Acceptance Criteria
*   [ ] Bottom Nav appears on iPhone/Android viewport.
*   [ ] "Time Clock" item navigates correctly.
*   [ ] "More" opens a full-screen drawer with all sidebar links.
*   [ ] No horizontal scrolling on main pages.
*   [ ] Tap targets pass Lighthouse "PWA" audit.
