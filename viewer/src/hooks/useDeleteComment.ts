import { useViewerStore } from '@/stores/viewerStore';
import type { Result } from '@/types';

/**
 * Hook for deleting comments.
 * Returns deleteComment function and loading/error states from the store.
 *
 * Story 3.6: Edit & Delete Own Comments
 */
export function useDeleteComment() {
  const deleteComment = useViewerStore((s) => s.deleteComment);
  const isDeleting = useViewerStore((s) => s.isDeletingComment);
  const error = useViewerStore((s) => s.deleteCommentError);

  return {
    deleteComment: (id: string): Result<void, Error> => {
      return deleteComment(id);
    },
    isDeleting,
    error,
  };
}
