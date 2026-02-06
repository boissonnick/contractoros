'use client';

import React from 'react';
import { Review, REVIEW_PLATFORM_LABELS } from '@/types/review';
import { StarIcon } from '@heroicons/react/24/solid';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface ReviewCardProps {
  review: Review;
  onRespond?: () => void;
}

export function ReviewCard({ review, onRespond }: ReviewCardProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {review.reviewerPhotoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={review.reviewerPhotoUrl}
              alt={review.reviewerName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 font-medium">
              {review.reviewerName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 tracking-tight">{review.reviewerName}</span>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {REVIEW_PLATFORM_LABELS[review.platform]}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              {renderStars(review.rating)}
              <span className="text-sm text-gray-500">
                {new Date(review.reviewDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        {!review.responseText && onRespond && (
          <button
            onClick={onRespond}
            className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
            Respond
          </button>
        )}
      </div>

      {review.reviewText && (
        <p className="mt-3 text-sm text-gray-700">{review.reviewText}</p>
      )}

      {review.responseText && (
        <div className="mt-4 rounded-lg bg-gray-50 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
            Your Response
          </div>
          <p className="mt-1 text-sm text-gray-600">{review.responseText}</p>
          {review.respondedAt && (
            <p className="mt-2 text-xs text-gray-400">
              Responded {new Date(review.respondedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default ReviewCard;
