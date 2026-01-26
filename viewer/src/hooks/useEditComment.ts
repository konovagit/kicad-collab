import { useViewerStore } from '@/stores/viewerStore';
import type { Comment, Result } from '@/types';

/**
 * Hook for editing comments.
 * Returns editComment function and loading/error states from the store.
 *
 * Story 3.6: Edit & Delete Own Comments
 */
export function useEditComment() {
  const editComment = useViewerStore((s) => s.editComment);
  const isEditing = useViewerStore((s) => s.isEditingComment);
  const error = useViewerStore((s) => s.editCommentError);

  return {
    editComment: (id: string, content: string): Result<Comment, Error> => {
      return editComment(id, content);
    },
    isEditing,
    error,
  };
}
