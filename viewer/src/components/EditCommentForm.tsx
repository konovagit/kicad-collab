import { useCallback, useEffect, useRef, useState } from 'react';

import type { Comment } from '@/types';

interface EditCommentFormProps {
  comment: Comment;
  onSave: (content: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

/**
 * Form for editing an existing comment.
 * Pre-fills with existing content and supports keyboard shortcuts.
 *
 * Story 3.6: Edit & Delete Own Comments
 */
export function EditCommentForm({
  comment,
  onSave,
  onCancel,
  isSubmitting = false,
  error,
}: EditCommentFormProps) {
  const [content, setContent] = useState(comment.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on mount and select all text
  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, []);

  // Escape to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = content.trim();
      if (trimmed && trimmed !== comment.content && !isSubmitting) {
        onSave(trimmed);
      }
    },
    [content, comment.content, isSubmitting, onSave]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const trimmed = content.trim();
        if (trimmed && trimmed !== comment.content && !isSubmitting) {
          onSave(trimmed);
        }
      }
    },
    [content, comment.content, isSubmitting, onSave]
  );

  const isUnchanged = content.trim() === comment.content;

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full p-2 text-sm border border-gray-300 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows={3}
        disabled={isSubmitting}
        aria-label="Edit comment content"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!content.trim() || isUnchanged || isSubmitting}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
