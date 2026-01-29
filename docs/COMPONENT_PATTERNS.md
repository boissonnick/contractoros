# ContractorOS Component Patterns

> **Purpose:** UI component library reference and usage patterns.
> **Last Updated:** 2026-01-28

---

## UI Component Library

All shared components are in `apps/web/components/ui/` and exported from `index.ts`.

### Import Pattern
```typescript
import { Button, Card, Badge, EmptyState, Input } from '@/components/ui';
import { SkeletonCard, SkeletonList } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
```

---

## Core Components

### Button
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

// Usage
<Button variant="primary" onClick={handleSave}>
  <PlusIcon className="h-4 w-4 mr-2" />
  Add Item
</Button>

<Button variant="secondary" size="sm">
  Cancel
</Button>

<Button variant="danger" disabled={isLoading}>
  Delete
</Button>
```

### Card
```typescript
interface CardProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

// Usage
<Card className="p-6">
  <h3 className="font-semibold">Title</h3>
  <p className="text-gray-500">Content</p>
</Card>

// Clickable card
<Card
  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
  onClick={() => navigate()}
>
  Content
</Card>
```

### Badge
```typescript
interface BadgeProps {
  className?: string;
  children: React.ReactNode;
}

// Usage with color variants
const statusColors = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  inactive: 'bg-gray-100 text-gray-700',
};

<Badge className={statusColors[status]}>
  {statusLabel}
</Badge>
```

### EmptyState
```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Usage
<EmptyState
  icon={<UserGroupIcon className="h-full w-full" />}
  title="No clients yet"
  description="Add your first client to start tracking relationships."
  action={{
    label: 'Add Client',
    onClick: () => setShowAddModal(true),
  }}
/>
```

### Skeleton (Loading States)
```typescript
// Card skeleton
<SkeletonCard className="h-[200px]" />

// List skeleton
<SkeletonList count={5} />

// Inline skeleton
<div className="animate-pulse bg-gray-200 h-4 w-32 rounded" />
```

### Toast (Notifications)
```typescript
import { toast } from '@/components/ui/Toast';

// Success
toast.success('Client created successfully');

// Error
toast.error('Failed to save. Please try again.');

// Info
toast.info('Changes saved');

// Warning
toast.warning('This action cannot be undone');
```

---

## Form Components

### Input with Icon
```typescript
<div className="relative">
  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
  <input
    {...register('email')}
    type="email"
    placeholder="email@example.com"
    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
  />
</div>
```

### Select Dropdown
```typescript
<select
  {...register('status')}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
>
  {Object.entries(STATUS_LABELS).map(([value, label]) => (
    <option key={value} value={value}>{label}</option>
  ))}
</select>
```

### Textarea
```typescript
<textarea
  {...register('content')}
  rows={4}
  placeholder="Enter details..."
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
/>
```

### Radio Group
```typescript
<div className="flex gap-4">
  <label className="flex items-center gap-2 cursor-pointer">
    <input
      {...register('direction')}
      type="radio"
      value="outbound"
      className="text-brand-primary focus:ring-brand-primary"
    />
    <span className="text-sm">Outbound</span>
  </label>
  <label className="flex items-center gap-2 cursor-pointer">
    <input
      {...register('direction')}
      type="radio"
      value="inbound"
      className="text-brand-primary focus:ring-brand-primary"
    />
    <span className="text-sm">Inbound</span>
  </label>
</div>
```

### Error Display
```typescript
{errors.email && (
  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
)}
```

---

## Layout Patterns

### Page Header
```typescript
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">Page Title</h1>
    <p className="text-gray-500 mt-1">Page description</p>
  </div>
  <Button variant="primary" onClick={() => setShowModal(true)}>
    <PlusIcon className="h-4 w-4 mr-2" />
    Add Item
  </Button>
</div>
```

### Stats Row
```typescript
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <Card className="p-4">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-blue-100 rounded-lg">
        <ChartIcon className="h-5 w-5 text-blue-600" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{count}</p>
        <p className="text-xs text-gray-500">Label</p>
      </div>
    </div>
  </Card>
  {/* More stat cards */}
</div>
```

### Search + Filter Bar
```typescript
<div className="flex flex-col sm:flex-row gap-4">
  <div className="relative flex-1">
    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
    <input
      type="text"
      placeholder="Search..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
    />
  </div>
  <div className="flex items-center gap-2">
    <FunnelIcon className="h-5 w-5 text-gray-400" />
    <select
      value={filter}
      onChange={(e) => setFilter(e.target.value)}
      className="px-3 py-2 border border-gray-300 rounded-lg"
    >
      <option value="all">All</option>
      {/* Filter options */}
    </select>
  </div>
</div>
```

### Tab Navigation
```typescript
type TabType = 'overview' | 'details' | 'history';

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <HomeIcon className="h-4 w-4" /> },
  { id: 'details', label: 'Details', icon: <ListIcon className="h-4 w-4" /> },
  { id: 'history', label: 'History', icon: <ClockIcon className="h-4 w-4" /> },
];

// Render
<div className="border-b border-gray-200">
  <nav className="flex gap-4">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={cn(
          "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
          activeTab === tab.id
            ? "border-brand-primary text-brand-primary"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        )}
      >
        {tab.icon}
        {tab.label}
      </button>
    ))}
  </nav>
</div>
```

---

## Modal Patterns

### Standard Modal Structure
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MyModal({ isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Modal Title</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Form fields or content */}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Save
          </Button>
        </div>
      </Card>
    </div>
  );
}
```

### Multi-Step Modal (Wizard)
```typescript
const [step, setStep] = useState(1);
const totalSteps = 3;

// Progress indicator
<div className="px-4 pt-4">
  <div className="flex items-center gap-2">
    {[1, 2, 3].map((s) => (
      <div
        key={s}
        className={`h-2 flex-1 rounded-full ${
          step >= s ? 'bg-brand-primary' : 'bg-gray-200'
        }`}
      />
    ))}
  </div>
  <p className="text-xs text-gray-500 mt-2">
    Step {step} of {totalSteps}: {stepLabels[step]}
  </p>
</div>

// Navigation
<div className="flex items-center justify-between pt-4 border-t">
  <Button
    variant="secondary"
    onClick={() => step > 1 ? setStep(step - 1) : onClose()}
  >
    {step > 1 ? 'Back' : 'Cancel'}
  </Button>
  {step < totalSteps ? (
    <Button variant="primary" onClick={() => setStep(step + 1)}>
      Continue
    </Button>
  ) : (
    <Button variant="primary" onClick={handleSubmit}>
      Create
    </Button>
  )}
</div>
```

---

## List Item Patterns

### Clickable Card Row
```typescript
<Card
  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
  onClick={onClick}
>
  <div className="flex items-start justify-between">
    <div className="flex-1 min-w-0">
      {/* Status badge */}
      <div className="flex items-center gap-2 mb-1">
        <Badge className={statusColors[item.status]}>
          {STATUS_LABELS[item.status]}
        </Badge>
      </div>

      {/* Title */}
      <h3 className="font-medium text-gray-900">{item.name}</h3>

      {/* Meta info */}
      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <CalendarIcon className="h-4 w-4" />
          {formatDate(item.createdAt)}
        </span>
      </div>
    </div>

    <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
  </div>
</Card>
```

---

## Icon Usage

We use Heroicons (outline variant by default):
```typescript
import {
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  // ... etc
} from '@heroicons/react/24/outline';
```

Standard sizes:
- In buttons: `h-4 w-4`
- Standalone: `h-5 w-5`
- Large/emphasis: `h-6 w-6`
- In stat cards: `h-5 w-5`

---

## Color Palette

### Status Colors
```typescript
const statusColors = {
  // Success/Active
  active: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  signed: 'bg-green-100 text-green-700',

  // Warning/Pending
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  potential: 'bg-blue-100 text-blue-700',

  // Neutral/Past
  past: 'bg-gray-100 text-gray-700',
  draft: 'bg-gray-100 text-gray-700',

  // Error/Inactive
  inactive: 'bg-red-100 text-red-700',
  cancelled: 'bg-red-100 text-red-700',
  declined: 'bg-red-100 text-red-700',
};
```

### Brand Colors (CSS Variables)
```css
/* Set dynamically from org settings */
--brand-primary: #2563eb;
--brand-secondary: #1e40af;
```

Usage:
```typescript
className="text-brand-primary"
className="bg-brand-primary"
className="border-brand-primary"
className="focus:ring-brand-primary"
```

---

## Responsive Patterns

### Mobile-First Columns
```typescript
// 1 col mobile, 2 cols tablet, 4 cols desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
```

### Stack to Row
```typescript
// Stack on mobile, row on larger screens
<div className="flex flex-col sm:flex-row gap-4">
```

### Hidden on Mobile
```typescript
<span className="hidden sm:inline">Full text</span>
<span className="sm:hidden">Short</span>
```

---

## Utility Classes

### Common Tailwind Patterns
```typescript
// Truncate text
className="truncate"

// Line clamp (requires plugin or custom)
className="line-clamp-2"

// Transition
className="transition-all duration-200"
className="hover:shadow-md transition-shadow"

// Focus ring
className="focus:ring-2 focus:ring-brand-primary focus:border-transparent"

// Disabled state
className="disabled:opacity-50 disabled:cursor-not-allowed"
```

### cn() Utility
```typescript
import { cn } from '@/lib/utils';

// Conditional classes
<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  variant === 'primary' && "variant-classes"
)}>
```
