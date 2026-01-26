import { useCallback, useMemo, useState } from 'react';

import type { Comment } from '@/types';
import { useViewerStore } from '@/stores/viewerStore';
import { useReplyToComment } from '@/hooks/useReplyToComment';
import { useEditComment } from '@/hooks/useEditComment';
import { useDeleteComment } from '@/hooks/useDeleteComment';
import { CommentListItem } from './CommentListItem';
import { ReplyForm } from './ReplyForm';
import { ReplyListItem } from './ReplyListItem';
import { EditCommentForm } from './EditCommentForm';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

interface CommentThreadProps {
  comment: Comment;
  onCommentClick: (comment: Comment) => void;
  onResolve: (id: string) => void;
  onReopen: (id: string) => void;
}

/**
 * Displays a comment thread: parent comment with its replies.
 * Handles the reply form visibility and submission.
 * Uses useReplyToComment hook for reply submission.
 * Supports edit/delete of own comments/replies.
 *
 * Story 3.5: Comment Threading (Replies)
 * Story 3.6: Edit & Delete Own Comments
 */
export function CommentThread({
  comment,
  onCommentClick,
  onResolve,
  onReopen,
}: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { addReply, isSubmitting, error: addCommentError } = useReplyToComment();
  const { editComment, isEditing, error: editError } = useEditComment();
  const { deleteComment, isDeleting } = useDeleteComment();

  const comments = useViewerStore((s) => s.comments);
  const authorName = useViewerStore((s) => s.authorName);

  // Select replies for this comment, sorted chronologically
  // Must use useMemo to prevent infinite re-renders (selector returns new array each call)
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

  // Handle edit
  const handleEditSave = useCallback(
    (id: string, content: string) => {
      const result = editComment(id, content);
      if (result.ok) {
        setEditingId(null);
      }
    },
    [editComment]
  );

  const handleEditCancel = useCallback(() => {
    setEditingId(null);
  }, []);

  // Handle delete
  const handleConfirmDelete = useCallback(() => {
    if (!deletingId) return;
    const result = deleteComment(deletingId);
    if (result.ok) {
      setDeletingId(null);
    }
  }, [deletingId, deleteComment]);

  const handleCancelDelete = useCallback(() => {
    setDeletingId(null);
  }, []);

  // Find the comment to delete for preview
  const commentToDelete = useMemo(() => {
    if (!deletingId) return null;
    if (deletingId === comment.id) return comment;
    return replies.find((r) => r.id === deletingId) ?? null;
  }, [deletingId, comment, replies]);

  return (
    <div className="space-y-2">
      {/* Parent comment - show edit form or regular display */}
      {editingId === comment.id ? (
        <EditCommentForm
          comment={comment}
          onSave={(content) => handleEditSave(comment.id, content)}
          onCancel={handleEditCancel}
          isSubmitting={isEditing}
          error={editError}
        />
      ) : (
        <CommentListItem
          comment={comment}
          onCommentClick={onCommentClick}
          onResolve={onResolve}
          onReopen={onReopen}
          onReply={handleReplyClick}
          onEdit={() => setEditingId(comment.id)}
          onDelete={() => setDeletingId(comment.id)}
          currentUserName={authorName ?? undefined}
        />
      )}

      {/* Reply form (when active and not editing) */}
      {isReplying && editingId === null && (
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
          {replies.map((reply) =>
            editingId === reply.id ? (
              <EditCommentForm
                key={reply.id}
                comment={reply}
                onSave={(content) => handleEditSave(reply.id, content)}
                onCancel={handleEditCancel}
                isSubmitting={isEditing}
                error={editError}
              />
            ) : (
              <ReplyListItem
                key={reply.id}
                reply={reply}
                onResolve={onResolve}
                onReopen={onReopen}
                onEdit={() => setEditingId(reply.id)}
                onDelete={() => setDeletingId(reply.id)}
                currentUserName={authorName ?? undefined}
              />
            )
          )}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        isOpen={deletingId !== null}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
        commentPreview={commentToDelete?.content}
      />
    </div>
  );
}
