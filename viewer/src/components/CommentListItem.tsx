import { memo, useCallback } from 'react';

import type { Comment } from '@/types';
import { formatRelativeTime } from '@/utils/formatRelativeTime';

interface CommentListItemProps {
  comment: Comment;
  onCommentClick: (comment: Comment) => void;
}

/**
 * Individual comment item in the comment list.
 * Shows author, relative timestamp, component ref (if anchored), and content.
 * Clickable only for anchored comments (navigates to component).
 *
 * Story 3.1: Comment Panel & List View
 *
 * Memoized to prevent unnecessary re-renders when other comments change.
 */
export const CommentListItem = memo(function CommentListItem({
  comment,
  onCommentClick,
}: CommentListItemProps) {
  const isAnchored = Boolean(comment.componentRef);

  const handleClick = useCallback(() => {
    if (isAnchored) {
      onCommentClick(comment);
    }
  }, [isAnchored, onCommentClick, comment]);

  return (
    <div
      className={`p-3 rounded-lg border border-gray-200 ${
        isAnchored ? 'cursor-pointer hover:bg-gray-50' : ''
      }`}
      onClick={isAnchored ? handleClick : undefined}
    >
      {/* Header: Author + Timestamp */}
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium text-sm">{comment.author}</span>
        <span className="text-xs text-gray-400">{formatRelativeTime(comment.createdAt)}</span>
      </div>

      {/* Anchor indicator */}
      <div className="text-xs text-gray-500 mb-2">
        {isAnchored ? <span>📍 {comment.componentRef}</span> : <span>📝 General</span>}
      </div>

      {/* Comment content */}
      <p className="text-sm text-gray-700">{comment.content}</p>
    </div>
  );
});
