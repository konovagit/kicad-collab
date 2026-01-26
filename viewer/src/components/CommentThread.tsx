import { useCallback, useMemo, useState } from 'react';

import type { Comment } from '@/types';
import { useViewerStore } from '@/stores/viewerStore';
import { CommentListItem } from './CommentListItem';
import { ReplyForm } from './ReplyForm';
import { ReplyListItem } from './ReplyListItem';

interface CommentThreadProps {
  comment: Comment;
  onCommentClick: (comment: Comment) => void;
  onResolve: (id: string) => void;
  onReopen: (id: string) => void;
}

/**
 * Displays a comment thread: parent comment with its replies.
 * Handles the reply form visibility and submission.
 *
 * Story 3.5: Comment Threading (Replies)
 */
export function CommentThread({
  comment,
  onCommentClick,
  onResolve,
  onReopen,
}: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const addReply = useViewerStore((s) => s.addReply);
  const isSubmitting = useViewerStore((s) => s.isAddingComment);
  const addCommentError = useViewerStore((s) => s.addCommentError);
  const comments = useViewerStore((s) => s.comments);

  // Select replies for this comment, sorted chronologically
  const replies = useMemo(() => {
    return comments
      .filter((c) => c.parentId === comment.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [comments, comment.id]);

  const handleReplySubmit = useCallback(
    async (content: string) => {
      const result = await addReply(comment.id, content);
      if (result.ok) {
        setIsReplying(false);
      }
    },
    [addReply, comment.id]
  );

  const handleReplyCancel = useCallback(() => {
    setIsReplying(false);
  }, []);

  const handleReplyClick = useCallback(() => {
    setIsReplying(true);
  }, []);

  return (
    <div className="space-y-2">
      {/* Parent comment with Reply button */}
      <CommentListItem
        comment={comment}
        onCommentClick={onCommentClick}
        onResolve={onResolve}
        onReopen={onReopen}
        onReply={handleReplyClick}
      />

      {/* Reply form (when active) */}
      {isReplying && (
        <div className="ml-6">
          <ReplyForm
            parentId={comment.id}
            onSubmit={handleReplySubmit}
            onCancel={handleReplyCancel}
            isSubmitting={isSubmitting}
            error={addCommentError}
          />
        </div>
      )}

      {/* Replies list - indented */}
      {replies.length > 0 && (
        <div className="ml-6 space-y-2">
          {replies.map((reply) => (
            <ReplyListItem key={reply.id} reply={reply} onResolve={onResolve} onReopen={onReopen} />
          ))}
        </div>
      )}
    </div>
  );
}
