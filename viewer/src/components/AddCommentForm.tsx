import { useCallback, useEffect, useRef, useState } from 'react';

import { useViewerStore } from '@/stores/viewerStore';

interface AddCommentFormProps {
  componentRef: string;
  onSubmit: (content: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function AddCommentForm({
  componentRef,
  onSubmit,
  onCancel,
  isSubmitting,
}: AddCommentFormProps) {
  const authorName = useViewerStore((s) => s.authorName);
  const setAuthorName = useViewerStore((s) => s.setAuthorName);
  const [content, setContent] = useState('');
  const [localAuthor, setLocalAuthor] = useState(authorName || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  }, []);

  const handleAuthorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalAuthor(e.target.value);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!content.trim()) return;

      // Save author name if this is first time
      if (!authorName && localAuthor.trim()) {
        setAuthorName(localAuthor.trim());
      }

      onSubmit(content.trim());
    },
    [content, authorName, localAuthor, setAuthorName, onSubmit]
  );

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const canSubmit = content.trim().length > 0 && (authorName || localAuthor.trim());

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-4 w-80">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700">
          Commenting on <span className="text-blue-600">{componentRef}</span>
        </h3>
      </div>

      {/* Author name input (only if not set) */}
      {!authorName && (
        <div className="mb-4">
          <label htmlFor="author-name" className="block text-xs text-gray-500 mb-1">
            Your name
          </label>
          <input
            id="author-name"
            type="text"
            value={localAuthor}
            onChange={handleAuthorChange}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            placeholder="Enter your name"
          />
        </div>
      )}

      {/* Comment textarea */}
      <div className="mb-4">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
          rows={4}
          placeholder="Write your comment..."
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={handleCancel}
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
