import { memo, useCallback } from 'react';

import type { Comment } from '@/types';
import { formatRelativeTime } from '@/utils/formatRelativeTime';
import { CommentStatusBadge } from './CommentStatusBadge';

interface CommentListItemProps {
  comment: Comment;
  onCommentClick: (comment: Comment) => void;
  onResolve?: (id: string) => void;
  onReopen?: (id: string) => void;
}

/**
 * Individual comment item in the comment list.
 * Shows author, relative timestamp, component ref (if anchored), and content.
 * Clickable only for anchored comments (navigates to component).
 * Includes Resolve/Reopen buttons for status management.
 *
 * Story 3.1: Comment Panel & List View
 * Story 3.4: Comment Status & Filtering
 *
 * Memoized to prevent unnecessary re-renders when other comments change.
 */
export const CommentListItem = memo(function CommentListItem({
  comment,
  onCommentClick,
  onResolve,
  onReopen,
}: CommentListItemProps) {
  const isAnchored = Boolean(comment.componentRef);
  const isResolved = comment.status === 'resolved';

  const handleClick = useCallback(() => {
    if (isAnchored && !isResolved) {
      onCommentClick(comment);
    }
  }, [isAnchored, isResolved, onCommentClick, comment]);

  const handleResolve = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onResolve?.(comment.id);
    },
    [comment.id, onResolve]
  );

  const handleReopen = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onReopen?.(comment.id);
    },
    [comment.id, onReopen]
  );

  return (
    <div
      className={`p-3 rounded-lg border border-gray-200 ${isResolved ? 'opacity-60' : ''} ${
        isAnchored && !isResolved ? 'cursor-pointer hover:bg-gray-50' : ''
      }`}
      onClick={isAnchored && !isResolved ? handleClick : undefined}
    >
      {/* Header: Author + Status + Timestamp */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{comment.author}</span>
          <CommentStatusBadge status={comment.status} />
        </div>
        <span className="text-xs text-gray-400">{formatRelativeTime(comment.createdAt)}</span>
      </div>

      {/* Anchor indicator */}
      <div className="text-xs text-gray-500 mb-2">
        {isAnchored ? <span>📍 {comment.componentRef}</span> : <span>📝 General</span>}
      </div>

      {/* Comment content with strikethrough if resolved */}
      <p className={`text-sm text-gray-700 ${isResolved ? 'line-through' : ''}`}>
        {comment.content}
      </p>

      {/* Action buttons */}
      <div className="mt-2 flex gap-2">
        {isResolved ? (
          <button
            onClick={handleReopen}
            className="text-xs text-blue-600 hover:text-blue-800"
            aria-label={`Reopen comment by ${comment.author}`}
          >
            Reopen
          </button>
        ) : (
          <button
            onClick={handleResolve}
            className="text-xs text-green-600 hover:text-green-800"
            aria-label={`Resolve comment by ${comment.author}`}
          >
            Resolve
          </button>
        )}
      </div>
    </div>
  );
});
