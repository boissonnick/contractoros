// UI Components Export
export { default as Button } from './Button';
export type { ButtonProps } from './Button';

export { default as Input, Textarea, Select } from './Input';
export type { InputProps, TextareaProps, SelectProps } from './Input';

export { default as Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, StatCard } from './Card';
export type { CardProps, StatCardProps } from './Card';

export { default as Badge, StatusBadge, PriorityBadge } from './Badge';
export type { BadgeProps, StatusType, PriorityType } from './Badge';

export { default as Avatar, AvatarGroup } from './Avatar';
export type { AvatarProps, AvatarGroupProps } from './Avatar';

export { default as EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';
export {
  NoProjectsEmpty,
  NoTasksEmpty,
  NoTeamMembersEmpty,
  NoTimeEntriesEmpty,
  NoPhotosEmpty,
  NoScheduleEmpty,
  NoInvoicesEmpty,
  NoMessagesEmpty,
  NoResultsEmpty,
} from './EmptyState';

export { default as AppShell } from './AppShell';

export { default as ComingSoon } from './ComingSoon';

export { ToastProvider, Toaster, useToast, toast } from './Toast';

export { default as FirestoreError } from './FirestoreError';

export { default as ConfirmDialog, useConfirmDialog } from './ConfirmDialog';
export type { ConfirmDialogProps } from './ConfirmDialog';

export { default as BaseModal, useModal, useModalDirtyState, BaseModalWithDirtyState } from './BaseModal';
export type { BaseModalProps, BaseModalWithDirtyStateProps, UseModalDirtyStateOptions } from './BaseModal';

export { FormInput, FormTextarea, FormSelect, FormCheckbox, FormSection, FormError, FormFieldWrapper } from './FormField';

export { default as Pagination, CompactPagination } from './Pagination';
export type { PaginationProps } from './Pagination';

export {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  TableEmpty,
  TableLoading,
  ResponsiveTableWrapper,
  MobileTableCard,
  MobileTableRow,
} from './Table';
export type { ColumnPriority } from './Table';

export {
  default as Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonProjectCard,
  SkeletonTaskCard,
  SkeletonKanbanColumn,
  SkeletonDashboard,
  SkeletonList,
} from './Skeleton';

export { default as BuildIndicator } from './BuildIndicator';
export { default as SidebarDevTools } from './SidebarDevTools';

// Page layout components
export { default as PageHeader } from './PageHeader';
export type { PageHeaderProps, BreadcrumbItem } from './PageHeader';

export { default as StatsGrid } from './StatsGrid';
export type { StatsGridProps, StatItem } from './StatsGrid';

export { default as FilterBar, useFilterBar } from './FilterBar';
export type { FilterBarProps, FilterConfig, FilterOption } from './FilterBar';

export { default as FormModal, useFormModal } from './FormModal';
export type { FormModalProps } from './FormModal';

// Form components
export { Select as SelectNew } from './Select';
export type { SelectProps as SelectNewProps, SelectOption } from './Select';

export { default as DatePicker, DateRangePicker } from './DatePicker';
export type { DatePickerProps, DateRangePickerProps } from './DatePicker';

export { default as TagInput } from './TagInput';
export type { TagInputProps } from './TagInput';

export { default as Checkbox, CheckboxGroup } from './Checkbox';
export type { CheckboxProps, CheckboxGroupProps, CheckboxGroupOption } from './Checkbox';

// Mobile-optimized components
export { MobileCard, MobileCardList, ResponsiveDataView } from './MobileCard';
export {
  MobileFormSection,
  MobileFormField,
  MobileInput,
  MobileTextarea,
  MobileSelect,
  MobileButton,
  MobileActionBar,
  MobileBottomSheet,
} from './MobileForm';
export {
  MobileBottomNav,
  MobileHeader,
  MobileDrawer,
  MobilePageHeader,
  MobileFAB,
  MobilePullToRefresh,
} from './MobileNav';
export { MobileStats, MobileKPI, MobileStatBar } from './MobileStats';
