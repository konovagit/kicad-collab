import { useCallback } from 'react';

import type { Comment, Result } from '@/types';
import { useViewerStore } from '@/stores/viewerStore';

/**
 * Hook for managing comment submission
 * Provides access to add comment functionality from the store
 */
export function useAddComment() {
  const addComment = useViewerStore((s) => s.addComment);
  const isSubmitting = useViewerStore((s) => s.isAddingComment);
  const error = useViewerStore((s) => s.addCommentError);

  const submitComment = useCallback(
    async (content: string, componentRef: string): Promise<Result<Comment, Error>> => {
      return addComment(content, componentRef);
    },
    [addComment]
  );

  return {
    submitComment,
    isSubmitting,
    error,
  };
}
