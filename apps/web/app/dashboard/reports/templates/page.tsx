"use client";

import React from 'react';
import Link from 'next/link';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ScaleIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  ClipboardDocumentListIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type TemplateCategory = 'financial' | 'operational' | 'executive';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & {
      title?: string;
      titleId?: string;
    } & React.RefAttributes<SVGSVGElement>
  >;
  category: TemplateCategory;
  route: string;
  isNew?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Data                                                                      */
/* -------------------------------------------------------------------------- */

const CATEGORY_STYLES: Record<
  TemplateCategory,
  { bg: string; text: string; iconBg: string; badge: string }
> = {
  financial: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    iconBg: 'bg-green-100 text-green-600',
    badge: 'bg-green-100 text-green-700',
  },
  operational: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    iconBg: 'bg-purple-100 text-purple-600',
    badge: 'bg-purple-100 text-purple-700',
  },
  executive: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    iconBg: 'bg-blue-100 text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
  },
};

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  financial: 'Financial',
  operational: 'Operational',
  executive: 'Executive',
};

const TEMPLATES: ReportTemplate[] = [
  {
    id: 'monthly-pl',
    name: 'Monthly P&L',
    description: 'Profit & loss breakdown for the current month',
    icon: CurrencyDollarIcon,
    category: 'financial',
    route: '/dashboard/reports/financial',
  },
  {
    id: 'quarterly-pl',
    name: 'Quarterly P&L',
    description: 'Quarterly profit & loss summary with trends',
    icon: ChartBarIcon,
    category: 'financial',
    route: '/dashboard/reports/financial',
  },
  {
    id: 'ytd-pl',
    name: 'Year-to-Date P&L',
    description: 'Full year-to-date income statement',
    icon: DocumentTextIcon,
    category: 'financial',
    route: '/dashboard/reports/financial',
  },
  {
    id: 'balance-sheet',
    name: 'Balance Sheet',
    description: 'Point-in-time snapshot of assets, liabilities & equity',
    icon: ScaleIcon,
    category: 'financial',
    route: '/dashboard/reports/balance-sheet',
    isNew: true,
  },
  {
    id: 'cash-flow',
    name: 'Cash Flow Statement',
    description: 'Monthly cash inflows and outflows analysis',
    icon: BanknotesIcon,
    category: 'financial',
    route: '/dashboard/reports/cash-flow',
    isNew: true,
  },
  {
    id: 'project-profitability',
    name: 'Project Profitability',
    description: 'Revenue and cost analysis per project',
    icon: ArrowTrendingUpIcon,
    category: 'operational',
    route: '/dashboard/reports/financial',
  },
  {
    id: 'ar-aging',
    name: 'AR Aging Report',
    description: 'Outstanding invoice aging breakdown',
    icon: ClockIcon,
    category: 'financial',
    route: '/dashboard/reports/financial',
  },
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level KPIs and business health overview',
    icon: ClipboardDocumentListIcon,
    category: 'executive',
    route: '/dashboard/reports',
  },
];

/* -------------------------------------------------------------------------- */
/*  Template Card                                                             */
/* -------------------------------------------------------------------------- */

function TemplateCard({ template }: { template: ReportTemplate }) {
  const style = CATEGORY_STYLES[template.category];
  const Icon = template.icon;

  return (
    <Link
      href={template.route}
      className={cn(
        'group relative flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-5',
        'transition-all duration-150 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          style.iconBg
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-700">
            {template.name}
          </h3>
          {template.isNew && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
              New
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500 line-clamp-2">
          {template.description}
        </p>
        <span
          className={cn(
            'mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
            style.badge
          )}
        >
          {CATEGORY_LABELS[template.category]}
        </span>
      </div>

      {/* Arrow */}
      <ArrowRightIcon className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-blue-500" />
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function ReportTemplatesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          Report Templates
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Quick access to common financial and operational reports
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}
