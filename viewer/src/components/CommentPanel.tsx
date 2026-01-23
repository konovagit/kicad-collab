import { useComments } from '@/hooks/useComments';
import { CommentListItem } from './CommentListItem';

/**
 * Panel displaying all comments for the schematic.
 * Shows comments in chronological order with empty, loading, and error states.
 * Positioned as a fixed sidebar on the right side.
 *
 * Story 3.1: Comment Panel & List View
 */
export function CommentPanel() {
  const { sortedComments, handleCommentClick, isLoading, error } = useComments();

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Comments</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 text-gray-500">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full mx-auto mb-4" />
            <p>Loading comments...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Comments</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 text-red-500">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-red-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="font-medium">Error loading comments</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (sortedComments.length === 0) {
    return (
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Comments</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 text-gray-500">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p>No comments yet</p>
          </div>
        </div>
      </div>
    );
  }

  // Normal state with comments
  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Comments</h2>
      </div>

      {/* Comment list (scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sortedComments.map((comment) => (
          <CommentListItem key={comment.id} comment={comment} onCommentClick={handleCommentClick} />
        ))}
      </div>
    </div>
  );
}
