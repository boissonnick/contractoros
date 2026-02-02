'use client';

import React from 'react';

// ============================================================================
// TOUCH TARGET CONSTANTS
// ============================================================================

/**
 * Minimum touch target size per Apple HIG and Material Design guidelines
 * Apple: 44x44pt, Material: 48x48dp
 * Using 44px as our minimum for consistency
 */
export const MIN_TOUCH_TARGET = 44;

// ============================================================================
// TYPES
// ============================================================================

export interface TouchTargetProps {
  /** Children to render */
  children: React.ReactNode;
  /** Whether the touch target is a button (default: true) */
  asButton?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Accessible label */
  'aria-label'?: string;
}

export interface IconButtonProps {
  /** Icon component to render */
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** Click handler */
  onClick?: () => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  /** Disabled state */
  disabled?: boolean;
  /** Accessible label */
  label: string;
  /** Additional CSS classes */
  className?: string;
}

export interface ListItemButtonProps {
  /** Children to render */
  children: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Left icon/element */
  leftContent?: React.ReactNode;
  /** Right icon/element */
  rightContent?: React.ReactNode;
  /** Disabled state */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// TOUCH TARGET WRAPPER
// ============================================================================

/**
 * Wraps content to ensure minimum 44x44px touch target
 */
export function TouchTarget({
  children,
  asButton = true,
  onClick,
  className = '',
  disabled = false,
  'aria-label': ariaLabel,
}: TouchTargetProps) {
  const baseClasses = `
    min-w-[44px] min-h-[44px]
    flex items-center justify-center
    touch-manipulation
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  if (asButton) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`${baseClasses} ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={`${baseClasses} ${className}`}>
      {children}
    </div>
  );
}

// ============================================================================
// ICON BUTTON
// ============================================================================

const iconSizes = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-7 w-7',
};

const buttonVariants = {
  default: 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300',
  primary: 'bg-violet-100 text-violet-700 hover:bg-violet-200 active:bg-violet-300',
  danger: 'bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200',
};

/**
 * Icon button with guaranteed 44x44px touch target
 */
export function IconButton({
  icon: Icon,
  onClick,
  size = 'md',
  variant = 'default',
  disabled = false,
  label,
  className = '',
}: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`
        min-w-[44px] min-h-[44px]
        flex items-center justify-center
        rounded-full
        transition-colors
        touch-manipulation
        ${buttonVariants[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      <Icon className={iconSizes[size]} />
    </button>
  );
}

// ============================================================================
// LIST ITEM BUTTON
// ============================================================================

/**
 * List item with guaranteed touch target height
 */
export function ListItemButton({
  children,
  onClick,
  leftContent,
  rightContent,
  disabled = false,
  className = '',
}: ListItemButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full min-h-[48px] px-4 py-3
        flex items-center gap-3
        text-left
        transition-colors
        touch-manipulation
        hover:bg-gray-50 active:bg-gray-100
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {leftContent && (
        <div className="flex-shrink-0">
          {leftContent}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {children}
      </div>
      {rightContent && (
        <div className="flex-shrink-0">
          {rightContent}
        </div>
      )}
    </button>
  );
}

// ============================================================================
// ACTION BUTTON
// ============================================================================

export interface ActionButtonProps {
  /** Button text */
  children: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Full width */
  fullWidth?: boolean;
  /** Icon on the left */
  leftIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** Icon on the right */
  rightIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** Additional CSS classes */
  className?: string;
}

const actionButtonVariants = {
  primary: 'bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
};

const actionButtonSizes = {
  sm: 'min-h-[36px] px-3 text-sm',
  md: 'min-h-[44px] px-4 text-base',
  lg: 'min-h-[52px] px-6 text-lg',
};

/**
 * Action button with guaranteed touch target
 */
export function ActionButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
}: ActionButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-lg
        transition-colors
        touch-manipulation
        ${actionButtonVariants[variant]}
        ${actionButtonSizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {LeftIcon && <LeftIcon className="h-5 w-5" />}
          {children}
          {RightIcon && <RightIcon className="h-5 w-5" />}
        </>
      )}
    </button>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default TouchTarget;
