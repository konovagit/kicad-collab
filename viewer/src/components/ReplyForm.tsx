import { useCallback, useEffect, useRef, useState } from 'react';

interface ReplyFormProps {
  parentId: string;
  onSubmit: (content: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

/**
 * Inline form for replying to a comment.
 * Shows textarea with Submit and Cancel buttons.
 * Supports keyboard shortcuts: Escape to cancel, Ctrl/Cmd+Enter to submit.
 *
 * Story 3.5: Comment Threading (Replies)
 */
export function ReplyForm({
  parentId,
  onSubmit,
  onCancel,
  isSubmitting = false,
  error,
}: ReplyFormProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
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
      if (content.trim() && !isSubmitting) {
        onSubmit(content.trim());
      }
    },
    [content, isSubmitting, onSubmit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (content.trim() && !isSubmitting) {
          onSubmit(content.trim());
        }
      }
    },
    [content, isSubmitting, onSubmit]
  );

  const handleCancel = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onCancel();
    },
    [onCancel]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-2" data-parent-id={parentId}>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write a reply..."
        className="w-full p-2 text-sm border border-gray-300 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows={2}
        disabled={isSubmitting}
        aria-label="Reply content"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={handleCancel}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Sending...' : 'Reply'}
        </button>
      </div>
    </form>
  );
}
