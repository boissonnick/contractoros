"use client";

import React, { useState } from 'react';
import { TaskComment } from '@/types';
import { useTaskComments } from '@/lib/hooks/useTaskComments';
import { useAuth } from '@/lib/auth';
import { Button, Avatar } from '@/components/ui';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface TaskCommentsProps {
  taskId: string;
}

export default function TaskComments({ taskId }: TaskCommentsProps) {
  const { comments, loading, addComment, updateComment, deleteComment } = useTaskComments(taskId);
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await addComment(newComment.trim());
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      await updateComment(commentId, editContent.trim());
      setEditingId(null);
      setEditContent('');
    } catch (err) {
      console.error('Error updating comment:', err);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(commentId);
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const startEdit = (comment: TaskComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  if (loading) {
    return <div className="text-sm text-gray-400 py-4">Loading comments...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Comment list */}
      {comments.length === 0 && (
        <p className="text-sm text-gray-400">No comments yet.</p>
      )}

      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <Avatar
            name={comment.userName}
            src={comment.userAvatar}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">{comment.userName}</span>
              <span className="text-xs text-gray-400">
                {new Date(comment.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
              {comment.updatedAt && (
                <span className="text-xs text-gray-400">(edited)</span>
              )}
            </div>

            {editingId === comment.id ? (
              <div className="mt-1">
                <textarea
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleUpdate(comment.id);
                    }
                    if (e.key === 'Escape') {
                      setEditingId(null);
                    }
                  }}
                  autoFocus
                />
                <div className="flex gap-2 mt-1">
                  <Button size="sm" variant="primary" onClick={() => handleUpdate(comment.id)}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{comment.content}</p>
            )}

            {/* Actions (only for own comments) */}
            {user?.uid === comment.userId && editingId !== comment.id && (
              <div className="flex gap-2 mt-1">
                <button
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5"
                  onClick={() => startEdit(comment)}
                >
                  <PencilIcon className="h-3 w-3" /> Edit
                </button>
                <button
                  className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-0.5"
                  onClick={() => handleDelete(comment.id)}
                >
                  <TrashIcon className="h-3 w-3" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* New comment input */}
      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <div className="flex-1">
          <textarea
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="flex justify-end mt-1">
            <Button
              size="sm"
              variant="primary"
              onClick={handleSubmit}
              loading={submitting}
              disabled={!newComment.trim()}
            >
              Comment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
