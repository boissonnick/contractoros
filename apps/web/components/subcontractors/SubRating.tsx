"use client";

import React, { useState } from 'react';
import { SubAssignment } from '@/types';
import { Button, Textarea } from '@/components/ui';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

interface SubRatingProps {
  assignment: SubAssignment;
  onRate: (rating: number, comment?: string) => void;
}

export default function SubRating({ assignment, onRate }: SubRatingProps) {
  const [rating, setRating] = useState(assignment.rating || 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(assignment.ratingComment || '');
  const [editing, setEditing] = useState(!assignment.rating);

  if (!editing && assignment.rating) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-900">Rating</h4>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            star <= assignment.rating!
              ? <StarSolid key={star} className="h-5 w-5 text-yellow-400" />
              : <StarIcon key={star} className="h-5 w-5 text-gray-300" />
          ))}
          <span className="text-sm text-gray-600 ml-2">{assignment.rating}/5</span>
        </div>
        {assignment.ratingComment && (
          <p className="text-sm text-gray-600">{assignment.ratingComment}</p>
        )}
        <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit Rating</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-900">Rate Performance</h4>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(star)}
          >
            {star <= (hover || rating)
              ? <StarSolid className="h-7 w-7 text-yellow-400" />
              : <StarIcon className="h-7 w-7 text-gray-300" />
            }
          </button>
        ))}
      </div>
      <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional feedback..." rows={2} />
      <Button variant="primary" size="sm" onClick={() => { onRate(rating, comment || undefined); setEditing(false); }} disabled={rating === 0}>
        Submit Rating
      </Button>
    </div>
  );
}
