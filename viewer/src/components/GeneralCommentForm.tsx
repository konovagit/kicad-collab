import { useState, useRef, useEffect, useCallback } from 'react';

import { useViewerStore } from '@/stores/viewerStore';

interface GeneralCommentFormProps {
  onSubmit: (content: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

/**
 * Form for adding general comments that are not anchored to any component.
 * Similar to AddCommentForm but without componentRef.
 *
 * Story 3.3: Add General Comment
 */
export function GeneralCommentForm({
  onSubmit,
  onCancel,
  isSubmitting,
  error,
}: GeneralCommentFormProps) {
  const authorName = useViewerStore((s) => s.authorName);
  const setAuthorName = useViewerStore((s) => s.setAuthorName);
  const [content, setContent] = useState('');
  const [localAuthor, setLocalAuthor] = useState(authorName || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Handle Escape key to cancel
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
      if (!content.trim()) return;

      // Save author name if first time
      if (!authorName && localAuthor.trim()) {
        setAuthorName(localAuthor.trim());
      }

      onSubmit(content.trim());
    },
    [content, authorName, localAuthor, setAuthorName, onSubmit]
  );

  const canSubmit = content.trim().length > 0 && (authorName || localAuthor.trim());

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-4 w-80">
      {/* Header - clearly indicates GENERAL comment */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          General Comment
        </h3>
        <p className="text-xs text-gray-500 mt-1">This comment is not attached to any component</p>
      </div>

      {/* Author name input (only if not set) */}
      {!authorName && (
        <div className="mb-4">
          <label htmlFor="general-author-name" className="block text-xs text-gray-500 mb-1">
            Your name
          </label>
          <input
            id="general-author-name"
            type="text"
            value={localAuthor}
            onChange={(e) => setLocalAuthor(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            placeholder="Enter your name"
            aria-describedby="author-name-hint"
          />
          <span id="author-name-hint" className="sr-only">
            Saved for future comments
          </span>
        </div>
      )}

      {/* Comment textarea */}
      <div className="mb-4">
        <label htmlFor="general-comment-content" className="sr-only">
          Comment content
        </label>
        <textarea
          id="general-comment-content"
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
          rows={4}
          placeholder="Write your general comment..."
        />
      </div>

      {/* Error message */}
      {error && (
        <div
          className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Adding...' : 'Add Comment'}
        </button>
      </div>
    </form>
  );
}
