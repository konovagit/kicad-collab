import { useCallback, useMemo } from 'react';

import { useViewerStore } from '@/stores/viewerStore';

/**
 * Hook for managing comment status (resolve/reopen).
 * Provides memoized callbacks for status changes.
 *
 * Story 3.4: Comment Status & Filtering
 */
export function useCommentStatus() {
  const resolveCommentAction = useViewerStore((s) => s.resolveComment);
  const reopenCommentAction = useViewerStore((s) => s.reopenComment);

  const resolveComment = useCallback(
    (id: string) => {
      resolveCommentAction(id);
    },
    [resolveCommentAction]
  );

  const reopenComment = useCallback(
    (id: string) => {
      reopenCommentAction(id);
    },
    [reopenCommentAction]
  );

  return useMemo(
    () => ({
      resolveComment,
      reopenComment,
    }),
    [resolveComment, reopenComment]
  );
}
