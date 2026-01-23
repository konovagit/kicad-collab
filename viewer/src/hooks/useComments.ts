import { useCallback, useMemo } from 'react';

import { useViewerStore } from '@/stores/viewerStore';
import type { Comment } from '@/types';

// Width of the side panel (w-80 = 320px)
const PANEL_WIDTH = 320;

/**
 * Hook for accessing and managing comment state.
 * Provides sorted comments (chronological) and comment click handling.
 *
 * Story 3.1: Comment Panel & List View
 */
export function useComments() {
  // Use Zustand selectors to prevent unnecessary re-renders
  const comments = useViewerStore((s) => s.comments);
  const isLoading = useViewerStore((s) => s.isLoadingComments);
  const error = useViewerStore((s) => s.loadCommentsError);
  const selectComponent = useViewerStore((s) => s.selectComponent);
  const getComponent = useViewerStore((s) => s.getComponent);
  const setPan = useViewerStore((s) => s.setPan);
  const zoom = useViewerStore((s) => s.zoom);

  // Sort comments by createdAt ascending (oldest first)
  const sortedComments = useMemo(() => {
    return [...comments].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [comments]);

  // Handle comment click - navigate to and highlight anchored component
  const handleCommentClick = useCallback(
    (comment: Comment) => {
      if (comment.componentRef) {
        // Select the component (highlights it)
        selectComponent(comment.componentRef);

        // Navigate to center the component on screen
        const component = getComponent(comment.componentRef);
        if (component && component.posX !== undefined && component.posY !== undefined) {
          // Calculate visible viewport dimensions (accounting for side panel)
          const viewportWidth = window.innerWidth - PANEL_WIDTH;
          const viewportHeight = window.innerHeight;

          // Calculate pan to center component in visible viewport
          const newPan = {
            x: viewportWidth / 2 - component.posX * zoom,
            y: viewportHeight / 2 - component.posY * zoom,
          };

          setPan(newPan);
        }
      }
      // General comments (no componentRef) do nothing on click
    },
    [selectComponent, getComponent, setPan, zoom]
  );

  return {
    sortedComments,
    handleCommentClick,
    isLoading,
    error,
  };
}
