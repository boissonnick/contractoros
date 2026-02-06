'use client';

import React from 'react';
import { ReviewStats } from '@/types/review';
import { StarIcon } from '@heroicons/react/24/solid';

interface ReviewStatsCardProps {
  stats: ReviewStats;
}

export function ReviewStatsCard({ stats }: ReviewStatsCardProps) {
  const ratingDistribution = Object.entries(stats.ratingDistribution)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([rating, count]) => ({
      rating: Number(rating),
      count,
      percentage: stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0,
    }));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 tracking-tight">
            {stats.averageRating.toFixed(1)}
          </div>
          <div className="mt-1 flex justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                className={`h-5 w-5 ${
                  star <= Math.round(stats.averageRating)
                    ? 'text-yellow-400'
                    : 'text-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="mt-1 text-sm text-gray-500">{stats.totalReviews} reviews</p>
        </div>

        <div className="flex-1 space-y-2">
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center gap-2">
              <span className="w-8 text-sm text-gray-600">{rating}</span>
              <StarIcon className="h-4 w-4 text-yellow-400" />
              <div className="flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-yellow-400"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              <span className="w-8 text-right text-sm text-gray-500">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReviewStatsCard;
