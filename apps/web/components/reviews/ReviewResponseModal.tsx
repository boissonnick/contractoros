'use client';

import React, { useState } from 'react';
import { FormModal } from '@/components/ui/FormModal';
import { useReview, useReviewResponseTemplates } from '@/lib/hooks/useReviews';
import { useAuth } from '@/lib/auth';
import { Review } from '@/types/review';
import { StarIcon } from '@heroicons/react/24/solid';

interface ReviewResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review;
  orgId: string;
}

export function ReviewResponseModal({
  isOpen,
  onClose,
  review,
  orgId,
}: ReviewResponseModalProps) {
  const { profile } = useAuth();
  const [responseText, setResponseText] = useState(review.responseText || '');
  const [loading, setLoading] = useState(false);

  const { respondToReview } = useReview(orgId, review.id);
  const { templates, incrementUsage } = useReviewResponseTemplates(orgId);

  // Filter templates by sentiment based on rating
  const suggestedTemplates = templates.filter((t) => {
    if (review.rating >= 4) return t.sentiment === 'positive';
    if (review.rating === 3) return t.sentiment === 'neutral';
    return t.sentiment === 'negative';
  });

  const handleTemplateSelect = async (templateId: string, body: string) => {
    setResponseText(body);
    await incrementUsage(templateId);
  };

  const handleSubmit = async () => {
    if (!responseText.trim() || !profile?.uid) return;

    setLoading(true);
    try {
      await respondToReview(responseText, profile.uid);
      onClose();
    } catch (err) {
      console.error('Failed to respond to review:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Respond to Review"
      loading={loading}
      onSubmit={handleSubmit}
      submitLabel="Post Response"
      disabled={!responseText.trim()}
    >
      <div className="space-y-4">
        {/* Review Preview */}
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{review.reviewerName}</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className={`h-4 w-4 ${
                    star <= review.rating ? 'text-yellow-400' : 'text-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          {review.reviewText && (
            <p className="mt-2 text-sm text-gray-600">{review.reviewText}</p>
          )}
        </div>

        {/* Template Suggestions */}
        {suggestedTemplates.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Quick Responses
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestedTemplates.slice(0, 3).map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateSelect(template.id, template.body)}
                  className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Response Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Your Response
          </label>
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-primary focus:ring-brand-primary"
            placeholder="Thank you for your feedback..."
            required
          />
        </div>
      </div>
    </FormModal>
  );
}

export default ReviewResponseModal;
