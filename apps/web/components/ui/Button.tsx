"use client";

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      icon,
      iconPosition = 'left',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-gradient-to-b from-brand-600 to-brand-700 text-white hover:from-brand-500 hover:to-brand-600 hover:shadow-lg hover:shadow-brand-500/30 hover:-translate-y-0.5 active:translate-y-0 focus:ring-brand-primary shadow-md shadow-brand-900/10 border border-brand-800/20',
      secondary: 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all',
      outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50/50 hover:border-gray-400 focus:ring-brand-primary',
      ghost: 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-900',
      danger: 'bg-gradient-to-b from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 shadow-md shadow-red-500/20 hover:-translate-y-0.5 border border-red-800/20',
    };

    // Mobile-first sizes with minimum touch target of 44px on touch devices
    const sizes = {
      sm: 'px-3 py-2 text-sm gap-1.5 min-h-[36px] sm:min-h-0',
      md: 'px-4 py-2.5 text-sm gap-2 min-h-[44px] sm:min-h-[40px]',
      lg: 'px-6 py-3 text-base gap-2 min-h-[48px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
            {children}
            {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
