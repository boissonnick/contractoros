# Animation Guidelines

**Author:** CLI 4 (Research Worker)
**Date:** 2026-02-02
**Status:** Draft
**Sprint:** 39
**Issue:** #28 (FEB-008, FEB-009, FEB-010, FEB-045)

---

## Executive Summary

This document establishes animation standards for ContractorOS to ensure a consistent, professional, and accessible user experience. Our platform serves construction professionals in field conditions where distracting animations waste time and battery life.

The core philosophy: **Animations should guide, not distract.** Every animation must serve a purpose—providing feedback, indicating state changes, or improving perceived performance. Animations that loop continuously, bounce excessively, or draw attention without purpose are prohibited.

This guide addresses audit findings (FEB-008, FEB-009, FEB-010, FEB-045) identifying distracting bounce animations and establishes standards for future development.

---

## Animation Philosophy

### Core Principles

1. **Purposeful** — Every animation must serve a functional purpose
2. **Subtle** — Animations should enhance, not dominate the interface
3. **Fast** — Keep durations short (150-300ms for most interactions)
4. **Consistent** — Use the same animation patterns across similar interactions
5. **Accessible** — Respect user preferences for reduced motion

### When to Animate

| Use Case | Purpose | Duration |
|----------|---------|----------|
| Page transitions | Indicate navigation | 200-300ms |
| Modal open/close | Draw attention, provide context | 200-300ms |
| Loading states | Indicate progress | Continuous (subtle) |
| Form feedback | Confirm actions | 150-200ms |
| Hover states | Indicate interactivity | 150ms |
| State changes | Show data updates | 200ms |

### When NOT to Animate

- Static content that doesn't change
- Icons that serve as labels (not indicators)
- Empty states (static is fine)
- Background elements
- Decorative elements

---

## Approved Animations

### Entrance Animations

```css
/* Fade In - Default for most elements */
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}

/* Slide Up - For modals, cards entering from bottom */
.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

/* Slide Down - For dropdowns, notifications */
.animate-slide-down {
  animation: slideDown 0.3s ease-out;
}

/* Scale In - For tooltips, popovers */
.animate-scale-in {
  animation: scaleIn 0.2s ease-out;
}

/* Slide In Right - For drawers, sidebars */
.animate-slide-in-right {
  animation: slideInRight 0.3s ease-out;
}

/* Bottom Sheet - For mobile modals */
.animate-bottom-sheet {
  animation: bottomSheet 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
```

### Tailwind Utility Classes

| Class | Use Case | Duration |
|-------|----------|----------|
| `animate-fade-in` | General entrance | 200ms |
| `animate-slide-up` | Modals, toast notifications | 300ms |
| `animate-slide-down` | Dropdowns, menus | 300ms |
| `animate-scale-in` | Tooltips, success icons | 200ms |
| `animate-pulse` | Loading skeletons ONLY | Continuous |
| `animate-spin` | Loading spinners ONLY | Continuous |

### Transition Classes

```css
/* Standard transition for interactive elements */
.transition-all {
  transition-property: all;
  transition-timing-function: ease-out;
  transition-duration: 200ms;
}

/* For color/opacity changes */
.transition-colors {
  transition-property: color, background-color, border-color;
  transition-duration: 150ms;
}

/* For transform-based animations */
.transition-transform {
  transition-property: transform;
  transition-duration: 200ms;
}
```

### Staggered Animations

For lists or groups of items entering the screen:

```tsx
// Good: Staggered entrance for lists
<div className="animate-in fade-in duration-500">
  {items.map((item, index) => (
    <div
      key={item.id}
      className="animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {item.content}
    </div>
  ))}
</div>
```

**Rules for staggered animations:**
- Maximum delay: 300ms (don't make users wait)
- Increment: 50-100ms between items
- Maximum items to stagger: 5-6 (after that, show all at once)

---

## Forbidden Animations

### Never Use These

| Animation | Why It's Prohibited | Alternative |
|-----------|---------------------|-------------|
| `animate-bounce` | Distracting, implies urgency incorrectly | Static icon or single pulse |
| Continuous pulse on static content | Draws attention unnecessarily | No animation |
| Infinite rotation (except loading) | Distracting, wastes resources | Static or loading spinner |
| Shake/wobble | Aggressive, poor UX | Subtle highlight or border color |
| Flashing/blinking | Accessibility concern, annoying | Solid state indicator |

### Specific Prohibitions from Audit

| Issue | Location | Current | Fix |
|-------|----------|---------|-----|
| FEB-008 | Pending Estimates icon | Bouncing | Static or badge count |
| FEB-009 | Empty state folder icon | Bouncing | Static icon |
| FEB-045 | Daily Logs icon | Animated | Static icon |

### Exception: Loading Indicators

Continuous animations are ONLY allowed for loading states:

```tsx
// Approved: Loading spinner
<div className="animate-spin h-4 w-4 border-2 border-brand-primary border-t-transparent rounded-full" />

// Approved: Skeleton loading
<div className="animate-pulse bg-gray-200 h-4 w-full rounded" />

// Approved: Typing indicator (3 dots)
<div className="flex gap-1">
  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
</div>
// Note: This is the ONE exception for bounce - typing indicators only
```

---

## Implementation Patterns

### Button States

```tsx
// Good: Subtle hover transition
<button className="
  bg-brand-primary text-white
  transition-all duration-200
  hover:opacity-90
  focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary
">
  Save Changes
</button>

// Good: Loading state with spinner
<button disabled className="opacity-50">
  <svg className="animate-spin h-4 w-4 mr-2" />
  Saving...
</button>
```

### Modal Animations

```tsx
// Good: Fade overlay + slide content
<div className="fixed inset-0 bg-black/50 animate-fade-in">
  <div className="bg-white rounded-xl animate-slide-up">
    {/* Modal content */}
  </div>
</div>
```

### Card Hover States

```tsx
// Good: Subtle shadow on hover
<div className="
  bg-white rounded-xl border border-gray-200
  transition-shadow duration-200
  hover:shadow-md
">
  {/* Card content */}
</div>

// Bad: Scale transform on hover (too dramatic)
<div className="hover:scale-105"> {/* Don't do this */}
```

### Empty States

```tsx
// Good: Static icon, fade-in text
<EmptyState
  icon={<FolderIcon className="h-12 w-12 text-gray-300" />}  // Static!
  title="No projects yet"
  description="Create your first project to get started."
/>

// Bad: Bouncing icon
<EmptyState
  icon={<FolderIcon className="h-12 w-12 text-gray-300 animate-bounce" />}  // Never!
/>
```

### Notification/Badge Indicators

```tsx
// Good: Static badge with color
<span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white">
  3
</span>

// Good: Single pulse on new notification (then static)
<span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-pulse">
  {/* Pulse once, then remove animation class */}
</span>

// Bad: Continuous bounce
<span className="animate-bounce">3</span>  // Never!
```

### Swipe Gestures (Mobile)

```tsx
// Good: Transform follows finger, snaps back
<div
  className={isSwiping ? '' : 'transition-transform duration-200'}
  style={{ transform: `translateX(${translateX}px)` }}
>
  {/* Swipeable content */}
</div>
```

---

## Accessibility

### Reduced Motion Support

Always respect the user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Implementation in Components

```tsx
// Check for reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Conditionally apply animations
<div className={prefersReducedMotion ? '' : 'animate-slide-up'}>
  {/* Content */}
</div>
```

### Tailwind Plugin (Recommended)

Add to `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      // ... existing config
    },
  },
  plugins: [
    // Reduced motion variant
    plugin(function({ addVariant }) {
      addVariant('motion-safe', '@media (prefers-reduced-motion: no-preference)');
      addVariant('motion-reduce', '@media (prefers-reduced-motion: reduce)');
    }),
  ],
};
```

Usage:
```html
<div class="motion-safe:animate-slide-up motion-reduce:opacity-100">
```

---

## Timing Guidelines

### Duration Reference

| Animation Type | Duration | Easing |
|----------------|----------|--------|
| Micro-interactions (hover, focus) | 100-150ms | ease-out |
| State changes | 150-200ms | ease-out |
| Entrances/Exits | 200-300ms | ease-out |
| Page transitions | 250-350ms | ease-in-out |
| Complex sequences | 300-500ms | cubic-bezier |

### Easing Functions

```css
/* Standard easing - most interactions */
transition-timing-function: ease-out;

/* For elements entering */
transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);

/* For elements exiting */
transition-timing-function: ease-in;

/* For continuous motion */
transition-timing-function: linear;
```

---

## Code Review Checklist

When reviewing PRs with animations:

- [ ] Does the animation serve a clear purpose?
- [ ] Is the duration appropriate (not too slow)?
- [ ] Does it respect `prefers-reduced-motion`?
- [ ] Is it using approved animation types?
- [ ] Are continuous animations limited to loading states?
- [ ] No bounce animations (except typing indicators)?
- [ ] No pulse on static content?
- [ ] Consistent with existing patterns?

---

## Migration Guide

### Fixing Existing Violations

1. **Search for bounce animations:**
   ```bash
   grep -r "animate-bounce" apps/web/
   ```

2. **Review each instance:**
   - Loading indicators → Keep (approved exception)
   - Empty state icons → Remove animation
   - Notification badges → Remove, use static color
   - Action indicators → Remove or replace with single fade

3. **Replace pattern:**
   ```tsx
   // Before (bad)
   <Icon className="animate-bounce" />

   // After (good)
   <Icon className="text-gray-400" />
   // or for emphasis:
   <Icon className="text-brand-primary" />
   ```

---

## Examples

### Good Animation Usage

```tsx
// 1. Modal entrance
<Dialog className="animate-in fade-in zoom-in-95 duration-200">

// 2. Dropdown menu
<Menu className="animate-in slide-in-from-top-2 duration-150">

// 3. Toast notification
<Toast className="animate-in slide-in-from-bottom-4 duration-300">

// 4. Loading skeleton
<Skeleton className="animate-pulse bg-gray-200" />

// 5. Button loading state
<Button loading>
  <Spinner className="animate-spin" />
  Saving...
</Button>
```

### Bad Animation Usage

```tsx
// 1. Bouncing empty state icon
<FolderIcon className="animate-bounce" />  // NO

// 2. Pulsing static badge
<Badge className="animate-pulse">New</Badge>  // NO

// 3. Spinning decorative icon
<StarIcon className="animate-spin" />  // NO

// 4. Dramatic scale on hover
<Card className="hover:scale-110" />  // NO

// 5. Long animation duration
<Modal className="animate-slide-up duration-1000" />  // NO (too slow)
```

---

## Open Questions

- [ ] Should we add a motion preferences toggle in user settings (beyond browser setting)?
- [ ] Define animation behavior for native mobile app (if/when built)
- [ ] Consider performance budget for animations on low-end devices

---

## References

- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Tailwind CSS Animation](https://tailwindcss.com/docs/animation)
- [Material Design Motion](https://m3.material.io/styles/motion/overview)
- [Apple Human Interface Guidelines - Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- [WCAG 2.1 - Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
