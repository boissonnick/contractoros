'use client';

import { useState } from 'react';
import {
  ChatBubbleLeftIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

interface ClientNote {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string;
  createdByName: string;
  isClient: boolean;
  addressed?: boolean;
  addressedAt?: Date;
  addressedBy?: string;
}

interface ClientNotesProps {
  notes: ClientNote[];
  currentUserId: string;
  isContractor?: boolean;
  onAddNote: (content: string) => Promise<void>;
  onEditNote?: (noteId: string, content: string) => Promise<void>;
  onDeleteNote?: (noteId: string) => Promise<void>;
  onMarkAddressed?: (noteId: string) => Promise<void>;
}

export function ClientNotes({
  notes,
  currentUserId,
  isContractor = false,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onMarkAddressed,
}: ClientNotesProps) {
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onAddNote(newNote.trim());
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (noteId: string) => {
    if (!editContent.trim() || !onEditNote) return;

    setSubmitting(true);
    try {
      await onEditNote(noteId, editContent.trim());
      setEditingNoteId(null);
      setEditContent('');
    } catch (error) {
      console.error('Error editing note:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!onDeleteNote) return;
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await onDeleteNote(noteId);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const startEditing = (note: ClientNote) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditContent('');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b">
        <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900">Notes & Questions</h3>
      </div>

      {/* Add Note Form */}
      <form onSubmit={handleSubmit} className="p-4 border-b bg-gray-50">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note or question..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={!newNote.trim() || submitting}
            className="flex items-center gap-1 px-4 py-2 text-sm text-white bg-brand-primary hover:opacity-90 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
            {submitting ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>

      {/* Notes List */}
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-8 text-center">
            <ChatBubbleLeftIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No notes yet</p>
            <p className="text-gray-400 text-xs mt-1">Add a note or question above</p>
          </div>
        ) : (
          notes
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((note) => {
              const isOwn = note.createdBy === currentUserId;
              const isEditing = editingNoteId === note.id;

              return (
                <div
                  key={note.id}
                  className={`p-4 ${note.addressed ? 'bg-green-50' : ''}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {note.createdByName}
                      </span>
                      <span className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
                        note.isClient
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {note.isClient ? 'Client' : 'Contractor'}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        {new Date(note.createdAt).toLocaleDateString()} at{' '}
                        {new Date(note.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {note.addressed && (
                        <span className="flex items-center gap-1 text-xs text-green-600 mr-2">
                          <CheckCircleSolidIcon className="h-4 w-4" />
                          Addressed
                        </span>
                      )}

                      {isOwn && !isEditing && (
                        <>
                          {onEditNote && (
                            <button
                              onClick={() => startEditing(note)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          )}
                          {onDeleteNote && (
                            <button
                              onClick={() => handleDelete(note.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}

                      {isContractor && note.isClient && !note.addressed && onMarkAddressed && (
                        <button
                          onClick={() => onMarkAddressed(note.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-green-700 bg-green-100 hover:bg-green-200 rounded transition-colors"
                          title="Mark as addressed"
                        >
                          <CheckCircleIcon className="h-3.5 w-3.5" />
                          Mark Addressed
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  {isEditing ? (
                    <div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleEdit(note.id)}
                          disabled={!editContent.trim() || submitting}
                          className="px-3 py-1.5 text-sm text-white bg-brand-primary hover:opacity-90 rounded disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                  )}

                  {/* Addressed info */}
                  {note.addressed && note.addressedAt && (
                    <p className="text-xs text-green-600 mt-2">
                      Addressed on {new Date(note.addressedAt).toLocaleDateString()}
                      {note.addressedBy && ` by ${note.addressedBy}`}
                    </p>
                  )}
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}

export default ClientNotes;
