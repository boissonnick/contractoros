"use client";

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  href?: string;
  onClick?: () => void;
}

export default function Card({
  children,
  className,
  padding = 'md',
  hover = false,
  href,
  onClick,
}: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const baseStyles = cn(
    'bg-white rounded-2xl border border-gray-100 shadow-[var(--shadow-card)]',
    paddingStyles[padding],
    hover && 'hover:shadow-[var(--shadow-soft)] hover:border-gray-200 transition-all duration-200 cursor-pointer',
    className
  );

  if (href) {
    return (
      <Link href={href} className={baseStyles}>
        {children}
      </Link>
    );
  }

  if (onClick) {
    return (
      <div onClick={onClick} className={baseStyles} role="button" tabIndex={0}>
        {children}
      </div>
    );
  }

  return <div className={baseStyles}>{children}</div>;
}

// Card Header
export function CardHeader({
  children,
  className,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Card Title
export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn('text-lg font-semibold text-gray-900 font-heading tracking-tight', className)}>
      {children}
    </h3>
  );
}

// Card Description
export function CardDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn('text-sm text-gray-500 mt-1', className)}>
      {children}
    </p>
  );
}

// Card Content
export function CardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('', className)}>{children}</div>;
}

// Card Footer
export function CardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-gray-100', className)}>
      {children}
    </div>
  );
}

// Stat Card - for dashboard stats
export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  href?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  href,
  color = 'blue',
}: StatCardProps) {
  const iconColorOnly = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    gray: 'text-gray-600',
  };

  const gradientStyles = {
    blue: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/50',
    green: 'bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200/50',
    yellow: 'bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-200/50',
    red: 'bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-200/50',
    purple: 'bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200/50',
    gray: 'bg-gradient-to-br from-gray-500/10 to-gray-600/5 border-gray-200/50',
  };

  const content = (
    <div className="group transition-all duration-300 hover:shadow-lg hover:shadow-brand-500/5">
      <Card hover={!!href} className={cn("relative overflow-hidden", gradientStyles[color])}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 font-heading">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 font-heading tracking-tight">{value}</p>
            {trend && (
              <p
                className={cn(
                  'mt-2 text-sm font-medium',
                  trend.positive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.positive ? '↑' : '↓'} {trend.value}
              </p>
            )}
          </div>
          {icon && (
            <div className={cn('p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5', iconColorOnly[color])}>
              {icon}
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
