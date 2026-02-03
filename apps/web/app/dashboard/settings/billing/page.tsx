"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { Card, Button, Badge, toast } from '@/components/ui';
import { Organization } from '@/types';
import {
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpCircleIcon,
  UserGroupIcon,
  FolderIcon,
  DocumentTextIcon,
  ChartBarIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ClockIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';

// Subscription plans
const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    interval: 'month',
    description: 'For solo contractors getting started',
    features: [
      { text: 'Up to 3 projects', included: true },
      { text: 'Up to 5 team members', included: true },
      { text: 'Basic invoicing', included: true },
      { text: 'Email support', included: true },
      { text: 'Client portal', included: false },
      { text: 'E-signatures', included: false },
      { text: 'SMS messaging', included: false },
      { text: 'Advanced reporting', included: false },
    ],
    limits: {
      projects: 3,
      teamMembers: 5,
      storage: 1, // GB
    },
    popular: false,
  },
  pro: {
    name: 'Professional',
    price: 49,
    interval: 'month',
    description: 'For growing contracting businesses',
    features: [
      { text: 'Unlimited projects', included: true },
      { text: 'Up to 20 team members', included: true },
      { text: 'Advanced invoicing', included: true },
      { text: 'Priority support', included: true },
      { text: 'Client portal', included: true },
      { text: 'E-signatures', included: true },
      { text: 'SMS messaging (100/mo)', included: true },
      { text: 'Basic reporting', included: true },
    ],
    limits: {
      projects: -1, // unlimited
      teamMembers: 20,
      storage: 25, // GB
    },
    popular: true,
  },
  enterprise: {
    name: 'Enterprise',
    price: 149,
    interval: 'month',
    description: 'For established construction companies',
    features: [
      { text: 'Unlimited projects', included: true },
      { text: 'Unlimited team members', included: true },
      { text: 'Custom invoicing', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'White-label portal', included: true },
      { text: 'Unlimited e-signatures', included: true },
      { text: 'Unlimited SMS', included: true },
      { text: 'Advanced analytics', included: true },
    ],
    limits: {
      projects: -1,
      teamMembers: -1,
      storage: 100, // GB
    },
    popular: false,
  },
};

type PlanKey = keyof typeof PLANS;

interface SubscriptionStatus {
  plan: PlanKey;
  status: 'active' | 'trial' | 'past_due' | 'canceled' | 'none';
  trialEndsAt?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}

interface Usage {
  projects: number;
  teamMembers: number;
  storage: number;
  smsThisMonth: number;
}

export default function BillingSettingsPage() {
  const { profile } = useAuth();
  const [org, setOrg] = useState<Partial<Organization> | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    plan: 'free',
    status: 'none',
  });
  const [usage, setUsage] = useState<Usage>({
    projects: 0,
    teamMembers: 0,
    storage: 0,
    smsThisMonth: 0,
  });

  const isOwner = profile?.role === 'OWNER';

  // Load organization and subscription data
  useEffect(() => {
    if (!profile?.orgId) return;

    async function loadData() {
      try {
        const orgSnap = await getDoc(doc(db, 'organizations', profile!.orgId));
        if (orgSnap.exists()) {
          const data = orgSnap.data();
          setOrg({ id: orgSnap.id, ...data } as Partial<Organization>);

          // Mock subscription data (in production, this would come from Stripe)
          setSubscription({
            plan: (data.subscription?.plan as PlanKey) || 'free',
            status: data.subscription?.status || 'active',
            trialEndsAt: data.subscription?.trialEndsAt?.toDate(),
            currentPeriodEnd: data.subscription?.currentPeriodEnd?.toDate() || addDays(new Date(), 30),
            cancelAtPeriodEnd: data.subscription?.cancelAtPeriodEnd || false,
          });

          // Mock usage data
          setUsage({
            projects: data.usage?.projects || 2,
            teamMembers: data.usage?.teamMembers || 3,
            storage: data.usage?.storage || 0.5,
            smsThisMonth: data.usage?.smsThisMonth || 15,
          });
        }
      } catch (err) {
        console.error('Error loading billing data:', err);
        toast.error('Failed to load billing information');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [profile?.orgId]);

  const currentPlan = PLANS[subscription.plan];
  const currentLimits = currentPlan.limits;

  const getUsagePercent = (current: number, limit: number) => {
    if (limit === -1) return 0; // unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const isNearLimit = (current: number, limit: number) => {
    if (limit === -1) return false;
    return current >= limit * 0.8;
  };

  const isAtLimit = (current: number, limit: number) => {
    if (limit === -1) return false;
    return current >= limit;
  };

  const handleUpgrade = (plan: PlanKey) => {
    if (!isOwner) {
      toast.error('Only organization owners can manage billing');
      return;
    }
    // In production, this would redirect to Stripe Checkout
    toast.info(`Upgrade to ${PLANS[plan].name} plan - Coming soon!`);
  };

  const handleManageBilling = () => {
    if (!isOwner) {
      toast.error('Only organization owners can manage billing');
      return;
    }
    // In production, this would redirect to Stripe Customer Portal
    toast.info('Billing portal - Coming soon!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Billing & Subscription</h2>
        <p className="text-sm text-gray-500">
          Manage your subscription plan and billing information.
        </p>
      </div>

      {/* Current Plan */}
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={cn(
              'p-3 rounded-xl',
              subscription.plan === 'free' ? 'bg-gray-100' :
              subscription.plan === 'pro' ? 'bg-blue-100' : 'bg-purple-100'
            )}>
              <SparklesIcon className={cn(
                'h-6 w-6',
                subscription.plan === 'free' ? 'text-gray-600' :
                subscription.plan === 'pro' ? 'text-blue-600' : 'text-purple-600'
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">{currentPlan.name} Plan</h3>
                {subscription.status === 'active' && (
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                )}
                {subscription.status === 'trial' && (
                  <Badge className="bg-blue-100 text-blue-800">Trial</Badge>
                )}
                {subscription.status === 'past_due' && (
                  <Badge className="bg-red-100 text-red-800">Past Due</Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">{currentPlan.description}</p>
              {subscription.currentPeriodEnd && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <ClockIcon className="h-3 w-3" />
                  {subscription.cancelAtPeriodEnd
                    ? `Cancels on ${format(subscription.currentPeriodEnd, 'MMM d, yyyy')}`
                    : `Renews on ${format(subscription.currentPeriodEnd, 'MMM d, yyyy')}`}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              ${currentPlan.price}
              <span className="text-sm font-normal text-gray-500">/{currentPlan.interval}</span>
            </p>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleManageBilling}
              >
                <CreditCardIcon className="h-4 w-4 mr-1" />
                Manage Billing
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Usage Stats */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Current Usage</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Projects */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FolderIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Projects</span>
              </div>
              {isNearLimit(usage.projects, currentLimits.projects) && (
                <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {usage.projects}
              <span className="text-sm font-normal text-gray-500">
                /{currentLimits.projects === -1 ? '∞' : currentLimits.projects}
              </span>
            </p>
            {currentLimits.projects !== -1 && (
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    isAtLimit(usage.projects, currentLimits.projects) ? 'bg-red-500' :
                    isNearLimit(usage.projects, currentLimits.projects) ? 'bg-amber-500' : 'bg-blue-500'
                  )}
                  style={{ width: `${getUsagePercent(usage.projects, currentLimits.projects)}%` }}
                />
              </div>
            )}
          </div>

          {/* Team Members */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <UserGroupIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Team Members</span>
              </div>
              {isNearLimit(usage.teamMembers, currentLimits.teamMembers) && (
                <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {usage.teamMembers}
              <span className="text-sm font-normal text-gray-500">
                /{currentLimits.teamMembers === -1 ? '∞' : currentLimits.teamMembers}
              </span>
            </p>
            {currentLimits.teamMembers !== -1 && (
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    isAtLimit(usage.teamMembers, currentLimits.teamMembers) ? 'bg-red-500' :
                    isNearLimit(usage.teamMembers, currentLimits.teamMembers) ? 'bg-amber-500' : 'bg-blue-500'
                  )}
                  style={{ width: `${getUsagePercent(usage.teamMembers, currentLimits.teamMembers)}%` }}
                />
              </div>
            )}
          </div>

          {/* Storage */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ChartBarIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Storage</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {usage.storage.toFixed(1)}
              <span className="text-sm font-normal text-gray-500"> GB/{currentLimits.storage} GB</span>
            </p>
            <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full',
                  isAtLimit(usage.storage, currentLimits.storage) ? 'bg-red-500' :
                  isNearLimit(usage.storage, currentLimits.storage) ? 'bg-amber-500' : 'bg-blue-500'
                )}
                style={{ width: `${getUsagePercent(usage.storage, currentLimits.storage)}%` }}
              />
            </div>
          </div>

          {/* SMS */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">SMS This Month</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {usage.smsThisMonth}
              <span className="text-sm font-normal text-gray-500">
                /{subscription.plan === 'free' ? '0' : subscription.plan === 'pro' ? '100' : '∞'}
              </span>
            </p>
          </div>
        </div>
      </Card>

      {/* Upgrade Section */}
      {subscription.plan !== 'enterprise' && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Available Plans</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).map(([key, plan]) => {
              const isCurrent = key === subscription.plan;
              const isUpgrade = PLANS[key].price > currentPlan.price;

              return (
                <Card
                  key={key}
                  className={cn(
                    'p-5 relative',
                    isCurrent && 'ring-2 ring-blue-500',
                    plan.popular && 'border-blue-200 bg-blue-50/30'
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 bg-brand-primary text-white text-xs font-medium rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      ${plan.price}
                      <span className="text-sm font-normal text-gray-500">/{plan.interval}</span>
                    </p>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        {feature.included ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-gray-300 flex-shrink-0" />
                        )}
                        <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : isUpgrade ? (
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => handleUpgrade(key)}
                      disabled={!isOwner}
                    >
                      <ArrowUpCircleIcon className="h-4 w-4 mr-1" />
                      Upgrade
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Downgrade
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Owner Notice */}
      {!isOwner && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Limited Access</p>
              <p className="text-sm text-amber-700 mt-1">
                Billing management is restricted to organization owners.
                Contact the owner to make changes to your subscription.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Payment History</h3>
          {isOwner && (
            <Button variant="ghost" size="sm" onClick={handleManageBilling}>
              View All
            </Button>
          )}
        </div>
        <div className="text-center py-8 text-gray-500">
          <InformationCircleIcon className="h-8 w-8 mx-auto text-gray-300 mb-2" />
          <p className="text-sm">No payment history available</p>
          <p className="text-xs text-gray-400 mt-1">
            Payment records will appear here once billing is set up
          </p>
        </div>
      </Card>
    </div>
  );
}
