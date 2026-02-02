# UI Patterns Guide

This document defines the standard UI patterns used across the ContractorOS dashboard. All dashboard pages should follow these patterns for consistency.

---

## Table of Contents

1. [Page Structure](#page-structure)
2. [Components](#components)
3. [Mobile Patterns](#mobile-patterns)
4. [Color System](#color-system)
5. [Spacing Tokens](#spacing-tokens)
6. [Typography](#typography)
7. [Accessibility](#accessibility)

---

## Page Structure

### Standard List Page Layout

All list pages (projects, clients, invoices, etc.) should follow this structure:

```tsx
<div className="p-4 md:p-6 space-y-4 md:space-y-6">
  {/* Desktop Header */}
  <div className="hidden md:block">
    <PageHeader
      title="Page Title"
      description="Brief description of the page"
      actions={<Button>Primary Action</Button>}
    />
  </div>

  {/* Mobile Header */}
  <div className="md:hidden">
    <h1 className="text-xl font-bold text-gray-900">Page Title</h1>
    <p className="text-xs text-gray-500">Short description</p>
  </div>

  {/* Stats Cards (optional) */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
    {/* StatCard components */}
  </div>

  {/* Filters */}
  <div className="flex flex-col sm:flex-row gap-4">
    {/* Search input and filter dropdowns */}
  </div>

  {/* Content List */}
  {loading ? (
    <SkeletonList count={5} />
  ) : items.length === 0 ? (
    <EmptyState
      icon={<Icon />}
      title="No items yet"
      description="Create your first item"
      action={{ label: 'Create', onClick: handleCreate }}
    />
  ) : (
    <div className="space-y-3">
      {/* List items */}
    </div>
  )}

  {/* Pagination (if applicable) */}
  {/* Mobile FAB */}
  <button
    onClick={handleCreate}
    className="md:hidden fixed right-4 bottom-20 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg"
    aria-label="Create"
  >
    <PlusIcon className="h-6 w-6" />
  </button>
</div>
```

### Detail Page Layout

```tsx
<div className="p-4 md:p-6 space-y-4 md:space-y-6">
  <PageHeader
    title="Item Name"
    backButton={{ href: '/dashboard/items', label: 'Back to Items' }}
    actions={
      <>
        <Button variant="secondary" onClick={handleEdit}>Edit</Button>
        <Button variant="danger" onClick={handleDelete}>Delete</Button>
      </>
    }
  />

  {/* Detail content */}
</div>
```

---

## Components

### PageHeader

Use for all page headers. Provides consistent title, description, breadcrumbs, and actions.

```tsx
import { PageHeader } from '@/components/ui';

<PageHeader
  title="Page Title"
  description="Optional description"
  actions={<Button>Action</Button>}
  breadcrumbs={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Current Page' },
  ]}
  backButton={{ href: '/dashboard', label: 'Back' }}
/>
```

### Button Variants

| Variant | Use Case |
|---------|----------|
| `primary` | Primary actions (Create, Save, Submit) |
| `secondary` | Secondary actions (Cancel, Edit) |
| `outline` | Tertiary actions, toggles |
| `ghost` | Subtle actions, icon buttons |
| `danger` | Destructive actions (Delete) |

```tsx
<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="outline">Archive</Button>
<Button variant="ghost">More</Button>
<Button variant="danger">Delete</Button>
```

### Loading States

Always use Skeleton components for loading states:

```tsx
import { Skeleton, SkeletonList, SkeletonTable, SkeletonCard } from '@/components/ui/Skeleton';

// For lists
{loading && <SkeletonList count={5} />}

// For tables
{loading && <SkeletonTable rows={5} columns={4} />}

// For custom layouts
{loading && (
  <div className="space-y-4">
    <Skeleton className="h-32 rounded-xl" />
    <Skeleton className="h-32 rounded-xl" />
  </div>
)}
```

### Empty States

Use the EmptyState component consistently:

```tsx
import { EmptyState } from '@/components/ui';

<EmptyState
  icon={<FolderIcon className="h-full w-full" />}
  title="No items yet"
  description="Create your first item to get started"
  action={{
    label: 'Create Item',
    onClick: () => setShowModal(true),
  }}
/>
```

Pre-configured empty states available:
- `NoProjectsEmpty`
- `NoTasksEmpty`
- `NoTeamMembersEmpty`
- `NoTimeEntriesEmpty`
- `NoPhotosEmpty`
- `NoInvoicesEmpty`
- `NoResultsEmpty`

### Badges

```tsx
import { Badge, StatusBadge, PriorityBadge } from '@/components/ui/Badge';

// Generic badge
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Overdue</Badge>

// Pre-configured status badge
<StatusBadge status="active" />
<StatusBadge status="pending" />
<StatusBadge status="completed" />

// Priority badge
<PriorityBadge priority="high" />
<PriorityBadge priority="medium" />
<PriorityBadge priority="low" />
```

### Cards

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

<Card className="p-4">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Modals

```tsx
import { FormModal, ConfirmDialog } from '@/components/ui';

// For forms
<FormModal
  isOpen={isOpen}
  onClose={onClose}
  title="Create Item"
  onSubmit={handleSubmit}
  submitLabel="Create"
  loading={isSubmitting}
>
  {/* Form fields */}
</FormModal>

// For confirmations
<ConfirmDialog
  isOpen={isOpen}
  onClose={onClose}
  onConfirm={handleDelete}
  title="Delete Item"
  message="Are you sure? This cannot be undone."
  variant="danger"
  confirmLabel="Delete"
/>
```

---

## Mobile Patterns

### Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | Small tablets |
| `md` | 768px | Primary mobile/desktop breakpoint |
| `lg` | 1024px | Larger tablets, small laptops |
| `xl` | 1280px | Desktops |

### Mobile Header Pattern

```tsx
{/* Desktop Header */}
<div className="hidden md:block">
  <PageHeader ... />
</div>

{/* Mobile Header */}
<div className="md:hidden">
  <h1 className="text-xl font-bold text-gray-900">Title</h1>
  <p className="text-xs text-gray-500">Description</p>
</div>
```

### Mobile Floating Action Button (FAB)

Every list page should have a FAB for the primary create action:

```tsx
<button
  onClick={handleCreate}
  className="md:hidden fixed right-4 bottom-20 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center transition-all z-30"
  aria-label="Create Item"
>
  <PlusIcon className="h-6 w-6" />
</button>
```

- Position: `right-4 bottom-20` (above bottom navigation)
- Size: `w-14 h-14` (56px, meets touch target requirements)
- Z-index: `z-30` (above content, below modals)

### Touch Targets

All interactive elements must meet minimum touch target size:

```tsx
// Minimum 44px for mobile
className="min-h-[44px] min-w-[44px]"

// For buttons
className="px-4 py-2 min-h-[44px]"
```

### Mobile Stats (Horizontal Scroll)

```tsx
<div className="md:hidden flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
  {stats.map(stat => (
    <div className="flex-shrink-0 bg-white rounded-xl border p-3 min-w-[120px]">
      {/* Stat content */}
    </div>
  ))}
</div>
```

### Mobile Filter Chips

```tsx
<div className="md:hidden flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
  {filters.map(filter => (
    <button
      className={cn(
        'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap min-h-[40px]',
        active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
      )}
    >
      {filter.label}
    </button>
  ))}
</div>
```

---

## Color System

### Brand Colors

```css
--brand-primary: #2563eb;  /* blue-600 */
--brand-primary-dark: #1d4ed8;  /* blue-700 */
```

### Semantic Colors

| Purpose | Color Class | Hex |
|---------|-------------|-----|
| Success | `text-green-600`, `bg-green-100` | #16a34a, #dcfce7 |
| Warning | `text-amber-600`, `bg-amber-100` | #d97706, #fef3c7 |
| Danger | `text-red-600`, `bg-red-100` | #dc2626, #fee2e2 |
| Info | `text-blue-600`, `bg-blue-100` | #2563eb, #dbeafe |

### Status Colors

| Status | Background | Text |
|--------|------------|------|
| Active | `bg-green-100` | `text-green-700` |
| Pending | `bg-yellow-100` | `text-yellow-700` |
| Draft | `bg-gray-100` | `text-gray-700` |
| Completed | `bg-purple-100` | `text-purple-700` |
| Cancelled | `bg-red-100` | `text-red-700` |
| Overdue | `bg-red-100` | `text-red-700` |

---

## Spacing Tokens

### Page Padding

```tsx
className="p-4 md:p-6"  // 16px mobile, 24px desktop
```

### Section Spacing

```tsx
className="space-y-4 md:space-y-6"  // 16px mobile, 24px desktop
```

### Card Padding

```tsx
className="p-3 md:p-4"  // 12px mobile, 16px desktop
```

### Grid Gaps

```tsx
className="gap-3 md:gap-4"  // 12px mobile, 16px desktop
```

---

## Typography

### Headings

| Element | Class | Size |
|---------|-------|------|
| Page Title (Desktop) | `text-2xl font-bold` | 24px |
| Page Title (Mobile) | `text-xl font-bold` | 20px |
| Section Title | `text-lg font-semibold` | 18px |
| Card Title | `text-base font-medium` | 16px |
| Description (Desktop) | `text-sm text-gray-500` | 14px |
| Description (Mobile) | `text-xs text-gray-500` | 12px |

### Text Colors

```tsx
className="text-gray-900"  // Primary text
className="text-gray-700"  // Secondary text
className="text-gray-500"  // Muted text
className="text-gray-400"  // Disabled/placeholder text
```

---

## Accessibility

### Required Patterns

1. **ARIA Labels**: All icon-only buttons must have `aria-label`
   ```tsx
   <button aria-label="Add item">
     <PlusIcon />
   </button>
   ```

2. **Focus Indicators**: Use ring utilities for focus states
   ```tsx
   className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
   ```

3. **Color Contrast**: Ensure 4.5:1 minimum contrast ratio for text

4. **Keyboard Navigation**: All interactive elements must be keyboard accessible

5. **Screen Reader Text**: Hide decorative elements
   ```tsx
   <span className="sr-only">Loading...</span>
   ```

### Icon Usage

Always use Heroicons outline style for consistency:

```tsx
import { PlusIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// Standard icon sizes
className="h-4 w-4"  // Small (buttons, badges)
className="h-5 w-5"  // Medium (inputs, filters)
className="h-6 w-6"  // Large (FAB, empty states)
className="h-12 w-12"  // XL (empty state illustrations)
```

---

## Checklist for New Pages

When creating a new dashboard page, ensure:

- [ ] Uses `PageHeader` for desktop header
- [ ] Has separate mobile header with smaller typography
- [ ] Uses `SkeletonList` or appropriate skeleton for loading state
- [ ] Uses `EmptyState` component for empty state
- [ ] Has mobile FAB for primary create action (if applicable)
- [ ] Stats grid uses `grid-cols-2 md:grid-cols-4`
- [ ] Padding uses `p-4 md:p-6`
- [ ] Spacing uses `space-y-4 md:space-y-6`
- [ ] All buttons use consistent variants
- [ ] All icons are from Heroicons outline set
- [ ] Touch targets are minimum 44px on mobile
- [ ] Has proper ARIA labels for accessibility

---

## Component Index

All UI components are exported from `@/components/ui`:

### Layout
- `PageHeader` - Standard page headers
- `AppShell` - Main layout wrapper

### Data Display
- `Card`, `StatCard` - Card containers
- `Table`, `MobileTableRow` - Data tables
- `Badge`, `StatusBadge`, `PriorityBadge` - Badges
- `Avatar`, `AvatarGroup` - User avatars

### Inputs
- `Button` - Action buttons
- `Input`, `Textarea` - Text inputs
- `Select` - Dropdowns
- `Checkbox`, `CheckboxGroup` - Checkboxes
- `DatePicker`, `DateRangePicker` - Date inputs
- `TagInput` - Tag/chip input
- `AddressAutocomplete` - Address input

### Feedback
- `Skeleton`, `SkeletonList`, `SkeletonTable` - Loading states
- `EmptyState` - Empty state placeholders
- `Toast`, `toast` - Notifications
- `FirestoreError` - Error display

### Overlays
- `BaseModal` - Base modal
- `FormModal` - Form modal
- `ConfirmDialog` - Confirmation dialogs

### Navigation
- `FilterBar` - Search and filters
- `Pagination` - Pagination controls

### Mobile
- `MobileCard`, `MobileCardList` - Mobile cards
- `MobileStats` - Mobile stat display
- `MobileFAB` - Floating action button
- `MobileBottomNav` - Bottom navigation
