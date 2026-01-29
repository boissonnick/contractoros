"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { Card, Button } from '@/components/ui';
import {
  Squares2X2Icon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  ArrowRightIcon,
  PlusIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface TemplateCategory {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  bgColor: string;
}

const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    key: 'phase',
    label: 'Phase Templates',
    description: 'Define construction phases for different project types',
    icon: Squares2X2Icon,
    href: '/dashboard/settings',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    key: 'sow',
    label: 'SOW Templates',
    description: 'Scope of work templates with line items and estimates',
    icon: DocumentTextIcon,
    href: '/dashboard/settings/sow-templates',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    key: 'sms',
    label: 'SMS Templates',
    description: 'Reusable text message templates for client communication',
    icon: ChatBubbleLeftRightIcon,
    href: '/dashboard/settings/sms-templates',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    key: 'email',
    label: 'Email Templates',
    description: 'Email templates for automated notifications and communications',
    icon: EnvelopeIcon,
    href: '/dashboard/settings/email-templates',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
  },
];

interface TemplateCounts {
  phase: number;
  sow: number;
  sms: number;
  email: number;
}

interface RecentTemplate {
  id: string;
  name: string;
  type: string;
  typeLabel: string;
  updatedAt?: Date;
  isDefault?: boolean;
}

export default function TemplatesHubPage() {
  const { profile } = useAuth();
  const [counts, setCounts] = useState<TemplateCounts>({
    phase: 0,
    sow: 0,
    sms: 0,
    email: 0,
  });
  const [recentTemplates, setRecentTemplates] = useState<RecentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = profile?.orgId;

  // Load template counts and recent templates
  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        // Load phase templates
        const phaseSnap = await getDocs(
          collection(db, 'organizations', orgId, 'phaseTemplates')
        );
        const phaseTemplates = phaseSnap.docs.map((d) => ({
          id: d.id,
          name: d.data().name || 'Untitled',
          type: 'phase',
          typeLabel: 'Phase',
          updatedAt: d.data().updatedAt?.toDate() || d.data().createdAt?.toDate(),
          isDefault: d.data().isDefault,
        }));

        // Load SOW templates
        const sowSnap = await getDocs(
          query(collection(db, 'sowTemplates'), where('orgId', '==', orgId))
        );
        const sowTemplates = sowSnap.docs.map((d) => ({
          id: d.id,
          name: d.data().name || 'Untitled',
          type: 'sow',
          typeLabel: 'SOW',
          updatedAt: d.data().updatedAt?.toDate() || d.data().createdAt?.toDate(),
          isDefault: d.data().isDefault,
        }));

        // Load SMS templates
        const smsSnap = await getDocs(
          query(collection(db, 'smsTemplates'), where('orgId', '==', orgId))
        );
        const smsTemplates = smsSnap.docs.map((d) => ({
          id: d.id,
          name: d.data().name || 'Untitled',
          type: 'sms',
          typeLabel: 'SMS',
          updatedAt: d.data().updatedAt?.toDate() || d.data().createdAt?.toDate(),
          isDefault: d.data().isDefault,
        }));

        // Load email templates (if collection exists)
        let emailTemplates: RecentTemplate[] = [];
        try {
          const emailSnap = await getDocs(
            query(collection(db, 'emailTemplates'), where('orgId', '==', orgId))
          );
          emailTemplates = emailSnap.docs.map((d) => ({
            id: d.id,
            name: d.data().name || 'Untitled',
            type: 'email',
            typeLabel: 'Email',
            updatedAt: d.data().updatedAt?.toDate() || d.data().createdAt?.toDate(),
            isDefault: d.data().isDefault,
          }));
        } catch {
          // Email templates collection might not exist yet
        }

        // Set counts
        setCounts({
          phase: phaseTemplates.length,
          sow: sowTemplates.length,
          sms: smsTemplates.length,
          email: emailTemplates.length,
        });

        // Combine and sort by most recent
        const allTemplates = [
          ...phaseTemplates,
          ...sowTemplates,
          ...smsTemplates,
          ...emailTemplates,
        ]
          .filter((t) => t.updatedAt)
          .sort((a, b) => {
            if (!a.updatedAt || !b.updatedAt) return 0;
            return b.updatedAt.getTime() - a.updatedAt.getTime();
          })
          .slice(0, 8);

        setRecentTemplates(allTemplates);
      } catch (err) {
        console.error('Error loading template data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orgId]);

  const getTypeColor = (type: string) => {
    const category = TEMPLATE_CATEGORIES.find((c) => c.key === type);
    return category?.color || 'text-gray-600';
  };

  const getTypeHref = (type: string) => {
    const category = TEMPLATE_CATEGORIES.find((c) => c.key === type);
    return category?.href || '/dashboard/settings/templates';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const totalTemplates = counts.phase + counts.sow + counts.sms + counts.email;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Templates</h2>
        <p className="text-sm text-gray-500">
          Manage all your reusable templates in one place. {totalTemplates} total templates.
        </p>
      </div>

      {/* Template Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATE_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const count = counts[category.key as keyof TemplateCounts] || 0;

          return (
            <Link key={category.key} href={category.href}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer h-full">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg ${category.bgColor}`}>
                    <Icon className={`h-5 w-5 ${category.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{category.label}</h3>
                      <span className="text-sm font-medium text-gray-500">{count}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end text-sm">
                  <span className={`${category.color} flex items-center gap-1 font-medium`}>
                    Manage
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/settings">
          <Button variant="outline" size="sm">
            <PlusIcon className="h-4 w-4 mr-1.5" />
            New Phase Template
          </Button>
        </Link>
        <Link href="/dashboard/settings/sow-templates">
          <Button variant="outline" size="sm">
            <PlusIcon className="h-4 w-4 mr-1.5" />
            New SOW Template
          </Button>
        </Link>
        <Link href="/dashboard/settings/sms-templates">
          <Button variant="outline" size="sm">
            <PlusIcon className="h-4 w-4 mr-1.5" />
            New SMS Template
          </Button>
        </Link>
        <Link href="/dashboard/settings/email-templates">
          <Button variant="outline" size="sm">
            <PlusIcon className="h-4 w-4 mr-1.5" />
            New Email Template
          </Button>
        </Link>
      </div>

      {/* Recently Modified Templates */}
      {recentTemplates.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ClockIcon className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-700">Recently Modified</h3>
          </div>
          <Card className="divide-y divide-gray-100">
            {recentTemplates.map((template) => (
              <Link
                key={`${template.type}-${template.id}`}
                href={getTypeHref(template.type)}
                className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      template.type === 'phase'
                        ? 'bg-blue-100 text-blue-700'
                        : template.type === 'sow'
                        ? 'bg-purple-100 text-purple-700'
                        : template.type === 'sms'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {template.typeLabel}
                  </span>
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {template.name}
                  </span>
                  {template.isDefault && (
                    <StarIconSolid className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {template.updatedAt && (
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(template.updatedAt)}
                    </span>
                  )}
                  <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </Card>
        </div>
      )}

      {/* Empty State */}
      {totalTemplates === 0 && (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DocumentTextIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Templates help you work faster by reusing common project phases, scopes of work,
            messages, and pricing.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/dashboard/settings">
              <Button variant="primary">
                <PlusIcon className="h-4 w-4 mr-1.5" />
                Create Phase Template
              </Button>
            </Link>
            <Link href="/dashboard/settings/sow-templates">
              <Button variant="outline">
                <PlusIcon className="h-4 w-4 mr-1.5" />
                Create SOW Template
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}
