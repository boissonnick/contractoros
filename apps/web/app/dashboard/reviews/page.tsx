'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/ui/PageHeader';
import { StatsGrid } from '@/components/ui/StatsGrid';
import { FilterBar } from '@/components/ui/FilterBar';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ReviewRequestModal } from '@/components/reviews/ReviewRequestModal';
import { ReviewResponseModal } from '@/components/reviews/ReviewResponseModal';
import { AutomationRuleForm } from '@/components/reviews/AutomationRuleForm';
import { useReviews, useReviewRequests, useReviewAutomationRules } from '@/lib/hooks/useReviews';
import { useGoogleBusiness } from '@/lib/hooks/useGoogleBusiness';
import {
  Review,
  ReviewPlatform,
  REVIEW_PLATFORM_LABELS,
} from '@/types/review';
import {
  StarIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  Cog6ToothIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

type TabId = 'reviews' | 'requests' | 'automation' | 'settings';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'reviews', label: 'Reviews', icon: StarIcon },
  { id: 'requests', label: 'Requests', icon: PaperAirplaneIcon },
  { id: 'automation', label: 'Automation', icon: Cog6ToothIcon },
  { id: 'settings', label: 'Connections', icon: LinkIcon },
];

export default function ReviewsPage() {
  const { profile } = useAuth();
  const orgId = profile?.orgId || '';

  const [activeTab, setActiveTab] = useState<TabId>('reviews');
  const [platformFilter, setPlatformFilter] = useState<ReviewPlatform | ''>('');
  const [ratingFilter, setRatingFilter] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Request modal state
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Response modal state
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);

  // Automation form state
  const [showAutomationForm, setShowAutomationForm] = useState(false);

  // Data hooks
  const {
    reviews,
    loading: reviewsLoading,
    stats,
  } = useReviews({
    orgId,
    platform: platformFilter || undefined,
    minRating: ratingFilter ? ratingFilter : undefined,
  });

  const {
    requests,
    loading: requestsLoading,
    stats: requestStats,
  } = useReviewRequests({ orgId });

  const {
    rules,
    loading: rulesLoading,
    createRule,
    toggleRule,
    deleteRule,
  } = useReviewAutomationRules(orgId);

  const { isConnected, primaryConnection } = useGoogleBusiness(orgId);

  // Filter reviews by search query
  const filteredReviews = reviews.filter((review) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      review.reviewerName.toLowerCase().includes(query) ||
      review.reviewText?.toLowerCase().includes(query)
    );
  });

  // Role guard - only OWNER and PM can access
  if (profile?.role !== 'OWNER' && profile?.role !== 'PM') {
    return (
      <div className="p-8">
        <EmptyState
          icon={<StarIcon className="h-full w-full" />}
          title="Access Restricted"
          description="You don't have permission to view this page."
        />
      </div>
    );
  }

  const handleRespondClick = (review: Review) => {
    setSelectedReview(review);
    setShowResponseModal(true);
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Reviews"
        description="Monitor your online reputation and request reviews from happy clients"
        actions={
          <button
            onClick={() => setShowRequestModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
            Request Review
          </button>
        }
      />

      {/* Stats Grid */}
      {stats && (
        <StatsGrid
          stats={[
            {
              label: 'Average Rating',
              value: stats.averageRating.toFixed(1),
              icon: StarIconSolid,
              iconColor: 'text-yellow-500',
              description: `${stats.totalReviews} total reviews`,
            },
            {
              label: 'This Month',
              value: stats.reviewsThisMonth,
              icon: StarIcon,
              change: stats.reviewsLastMonth > 0
                ? {
                    value: Math.round(((stats.reviewsThisMonth - stats.reviewsLastMonth) / stats.reviewsLastMonth) * 100),
                    trend: stats.reviewsThisMonth >= stats.reviewsLastMonth ? 'up' : 'down',
                  }
                : undefined,
            },
            {
              label: 'Response Rate',
              value: `${stats.responseRate.toFixed(0)}%`,
              icon: ChatBubbleLeftRightIcon,
              description: stats.averageResponseTime > 0 ? `Avg ${stats.averageResponseTime.toFixed(0)}h response time` : undefined,
            },
            {
              label: 'Requests Sent',
              value: requestStats?.totalSent || 0,
              icon: PaperAirplaneIcon,
              description: requestStats ? `${requestStats.conversionRate.toFixed(0)}% conversion rate` : undefined,
            },
          ]}
        />
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {/* Filters */}
          <FilterBar
            searchPlaceholder="Search reviews..."
            searchValue={searchQuery}
            onSearch={setSearchQuery}
            filters={[
              {
                key: 'platform',
                label: 'Platform',
                options: [
                  { label: 'All Platforms', value: '' },
                  ...Object.entries(REVIEW_PLATFORM_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  })),
                ],
              },
              {
                key: 'rating',
                label: 'Rating',
                options: [
                  { label: 'All Ratings', value: '' },
                  { label: '5 Stars', value: '5' },
                  { label: '4+ Stars', value: '4' },
                  { label: '3+ Stars', value: '3' },
                  { label: '1-2 Stars', value: '1' },
                ],
              },
            ]}
            filterValues={{ platform: platformFilter, rating: String(ratingFilter) }}
            onFilterChange={(key, value) => {
              if (key === 'platform') {
                setPlatformFilter(value as ReviewPlatform | '');
              } else if (key === 'rating') {
                setRatingFilter(value ? Number(value) : '');
              }
            }}
          />

          {/* Reviews List */}
          {reviewsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : filteredReviews.length === 0 ? (
            <EmptyState
              icon={<StarIcon className="h-full w-full" />}
              title="No reviews yet"
              description="Connect your Google Business Profile or add reviews manually to get started."
            />
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onRespond={() => handleRespondClick(review)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-4">
          {requestsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={<PaperAirplaneIcon className="h-full w-full" />}
              title="No review requests sent"
              description="Send your first review request to start collecting feedback."
              action={{
                label: 'Send Request',
                onClick: () => setShowRequestModal(true),
              }}
            />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Channel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Sent
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {request.recipientName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {request.channel === 'sms' ? 'SMS' : 'Email'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            request.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : request.status === 'clicked'
                              ? 'bg-blue-100 text-blue-800'
                              : request.status === 'sent'
                              ? 'bg-yellow-100 text-yellow-800'
                              : request.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {request.sentAt
                          ? new Date(request.sentAt).toLocaleDateString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'automation' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAutomationForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90"
            >
              Create Rule
            </button>
          </div>

          {rulesLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : rules.length === 0 ? (
            <EmptyState
              icon={<Cog6ToothIcon className="h-full w-full" />}
              title="No automation rules"
              description="Create rules to automatically request reviews after project completion or invoice payment."
              action={{
                label: 'Create Rule',
                onClick: () => setShowAutomationForm(true),
              }}
            />
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div>
                    <h3 className="font-medium text-gray-900 tracking-tight">{rule.name}</h3>
                    <p className="text-sm text-gray-500">
                      Trigger: {rule.trigger} | Delay: {rule.delayDays} days | Channel:{' '}
                      {rule.channel}
                    </p>
                    <p className="text-xs text-gray-400">
                      {rule.requestsSent} sent | {rule.reviewsReceived} reviews received
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(e) => toggleRule(rule.id, e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-primary/20"></div>
                    </label>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Google Business Connection */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <svg className="h-6 w-6 text-blue-600" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 tracking-tight">Google Business Profile</h3>
                  <p className="text-sm text-gray-500">
                    {isConnected
                      ? `Connected to ${primaryConnection?.locationName}`
                      : 'Connect to sync reviews automatically'}
                  </p>
                </div>
              </div>
              {isConnected ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                  Connected
                </span>
              ) : (
                <a
                  href={`/api/integrations/google-business/authorize?orgId=${orgId}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Connect
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ReviewRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        orgId={orgId}
      />

      {selectedReview && (
        <ReviewResponseModal
          isOpen={showResponseModal}
          onClose={() => {
            setShowResponseModal(false);
            setSelectedReview(null);
          }}
          review={selectedReview}
          orgId={orgId}
        />
      )}

      {showAutomationForm && (
        <AutomationRuleForm
          isOpen={showAutomationForm}
          onClose={() => setShowAutomationForm(false)}
          onSubmit={createRule}
          orgId={orgId}
        />
      )}
    </div>
  );
}
