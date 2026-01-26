import { memo, useCallback } from 'react';

import type { Comment } from '@/types';
import { formatRelativeTime } from '@/utils/formatRelativeTime';
import { CommentStatusBadge } from './CommentStatusBadge';

interface ReplyListItemProps {
  reply: Comment;
  onResolve?: (id: string) => void;
  onReopen?: (id: string) => void;
  onEdit?: () => void; // Story 3.6: Edit own reply
  onDelete?: () => void; // Story 3.6: Delete own reply
  currentUserName?: string; // Story 3.6: For author check
}

/**
 * Individual reply item displayed under a parent comment.
 * Shows author, timestamp, content with visual indentation.
 * Includes Resolve/Reopen buttons for status management.
 *
 * Story 3.5: Comment Threading (Replies)
 *
 * Memoized to prevent unnecessary re-renders.
 */
export const ReplyListItem = memo(function ReplyListItem({
  reply,
  onResolve,
  onReopen,
  onEdit,
  onDelete,
  currentUserName,
}: ReplyListItemProps) {
  const isResolved = reply.status === 'resolved';
  const isOwnReply = currentUserName && currentUserName === reply.author;
  const hasBeenEdited = Boolean(reply.updatedAt);

  const handleResolve = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onResolve?.(reply.id);
    },
    [reply.id, onResolve]
  );

  const handleReopen = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onReopen?.(reply.id);
    },
    [reply.id, onReopen]
  );

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit?.();
    },
    [onEdit]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.();
    },
    [onDelete]
  );

  return (
    <div
      className={`p-2 rounded border border-gray-100 bg-gray-50 ${isResolved ? 'opacity-60' : ''}`}
    >
      {/* Header: Author + Status + Timestamp */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-xs">{reply.author}</span>
          <CommentStatusBadge status={reply.status} />
        </div>
        <span className="text-xs text-gray-400">
          {formatRelativeTime(reply.createdAt)}
          {hasBeenEdited && <span className="ml-1">(edited)</span>}
        </span>
      </div>

      {/* Reply content with strikethrough if resolved */}
      <p className={`text-sm text-gray-700 ${isResolved ? 'line-through' : ''}`}>{reply.content}</p>

      {/* Action buttons */}
      <div className="mt-1 flex gap-2">
        {isResolved ? (
          <button
            onClick={handleReopen}
            className="text-xs text-blue-600 hover:text-blue-800"
            aria-label={`Reopen reply by ${reply.author}`}
          >
            Reopen
          </button>
        ) : (
          <button
            onClick={handleResolve}
            className="text-xs text-green-600 hover:text-green-800"
            aria-label={`Resolve reply by ${reply.author}`}
          >
            Resolve
          </button>
        )}
        {/* Edit/Delete always available for own replies */}
        {isOwnReply && onEdit && (
          <button
            onClick={handleEdit}
            className="text-xs text-gray-600 hover:text-gray-800"
            aria-label={`Edit reply by ${reply.author}`}
          >
            Edit
          </button>
        )}
        {isOwnReply && onDelete && (
          <button
            onClick={handleDelete}
            className="text-xs text-red-600 hover:text-red-800"
            aria-label={`Delete reply by ${reply.author}`}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
});
