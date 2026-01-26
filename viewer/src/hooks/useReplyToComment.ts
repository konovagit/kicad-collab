import { useCallback } from 'react';

import { useViewerStore } from '@/stores/viewerStore';
import type { Comment, Result } from '@/types';

/**
 * Hook for adding replies to comments.
 * Wraps the store's addReply action with loading/error state.
 *
 * Story 3.5: Comment Threading (Replies)
 */
export function useReplyToComment() {
  const storeAddReply = useViewerStore((s) => s.addReply);
  const isSubmitting = useViewerStore((s) => s.isAddingComment);
  const error = useViewerStore((s) => s.addCommentError);

  const addReply = useCallback(
    async (parentId: string, content: string): Promise<Result<Comment, Error>> => {
      return storeAddReply(parentId, content);
    },
    [storeAddReply]
  );

  return {
    addReply,
    isSubmitting,
    error,
  };
}
