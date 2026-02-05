# Phase 6 Scoping Questionnaire

> **Purpose:** Confirm requirements for Mobile Navigation (RS-01) and BI Dashboards (RS-03) before Sprint 63/65 kickoff.
> **Role:** Product Manager Agent
> **Status:** Waiting for User Input

---

## 📱 Topic 1: Mobile Navigation (Sprint 63)

**Context:** RS-01 recommends a "Bottom Nav" pattern for mobile with 5 key items.

**Q1.1: Mobile Bottom Bar Items**
The research recommends: `Dashboard`, `Projects`, `Schedule`, `Time Clock`, `More`.
*   **Question:** Is "Time Clock" critical enough to take a top-level slot for *all* users (Owners vs Employees), or should we make this configurable by role?

**Q1.2: "More" Menu Structure**
*   **Question:** When tapping "More", do you prefer a **full-screen drawer** (like Linear mobile) or a **slide-out sidebar** (classic hamburger)?
    *   *Recommendation:* Full-screen drawer is more modern and easier to tap.

**Q1.3: "Swipe" Gestures**
*   **Question:** Should we implement swipe actions on list items (e.g., Swipe Left to Delete/Archive)? If so, are there specific destructive actions we should protect?

---

## 📊 Topic 2: BI Dashboards (Sprint 65)

**Context:** RS-03 outlines 5 major dashboards. We need to prioritize the *first* one to build.

**Q2.1: Day 1 Dashboard**
*   **Question:** Which dashboard is the absolute highest priority for your current users?
    *   A) **Company Overview** (Revenue, Active Projects, Pipeline) - *Executive View*
    *   B) **Project Profitability** (Budget vs Actual per project) - *Project Manager View*
    *   C) **Cash Flow** (AR Aging, Forecast) - *CFO/Owner View*

**Q2.2: Visualization Library**
*   **Question:** The research mentions Recharts. Do you have a preference for chart style?
    *   A) **Minimalist/Clean** (Monochromatic, simple lines) - *Modern SaaS feel*
    *   B) **Data-Dense** (Grid lines, detailed axes) - *Excel-like precision*

---

## 💰 Topic 3: Job Costing (Sprint 64)

**Context:** Job Costing is the engine for the BI dashboards.

**Q3.1: Overhead Allocation**
*   **Question:** How should we handle "Overhead" (Topic RS-03 1.6 mentions Burden Rate)?
    *   A) **Simple % Markup:** Apply a flat % to all labor/materials.
    *   B) **Hourly Burden:** Define specific burden rates per employee.
    *   C) **Manual Entry:** Just track overhead as a separate line item, don't auto-calculate.

---

## 📝 Next Steps
Once you answer these questions, I will:
1.  Generate the **Sprint 63 Spec (Mobile)**.
2.  Update the **Phase 6 Roadmap** with your priorities.
3.  "Spin up" the Dev Agent (me) to start coding Sprint 63.
