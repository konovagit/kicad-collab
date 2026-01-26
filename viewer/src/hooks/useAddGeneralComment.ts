import { useCallback, useMemo } from 'react';

import { useViewerStore } from '@/stores/viewerStore';
import type { Comment, Result } from '@/types';

/**
 * Hook for adding general comments (not anchored to any component).
 *
 * Story 3.3: Add General Comment
 */
export function useAddGeneralComment() {
  const addGeneralComment = useViewerStore((s) => s.addGeneralComment);
  const isAddingComment = useViewerStore((s) => s.isAddingComment);
  const addCommentError = useViewerStore((s) => s.addCommentError);

  const submitGeneralComment = useCallback(
    async (content: string): Promise<Result<Comment, Error>> => {
      return addGeneralComment(content);
    },
    [addGeneralComment]
  );

  return useMemo(
    () => ({
      submitGeneralComment,
      isSubmitting: isAddingComment,
      error: addCommentError,
    }),
    [submitGeneralComment, isAddingComment, addCommentError]
  );
}
