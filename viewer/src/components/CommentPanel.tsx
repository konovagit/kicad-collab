import { useState, useCallback, useMemo } from 'react';

import { useComments } from '@/hooks/useComments';
import { useAddGeneralComment } from '@/hooks/useAddGeneralComment';
import { useCommentStatus } from '@/hooks/useCommentStatus';
import { useViewerStore } from '@/stores/viewerStore';
import { CommentListItem } from './CommentListItem';
import { CommentFilterDropdown } from './CommentFilterDropdown';
import { GeneralCommentForm } from './GeneralCommentForm';

/**
 * Panel displaying all comments for the schematic.
 * Shows comments in chronological order with empty, loading, and error states.
 * Positioned as a fixed sidebar on the right side.
 *
 * Story 3.1: Comment Panel & List View
 * Story 3.3: Add General Comment button and modal
 * Story 3.4: Comment Status & Filtering
 */
export function CommentPanel() {
  const { handleCommentClick, isLoading, error } = useComments();
  const { submitGeneralComment, isSubmitting, error: addCommentError } = useAddGeneralComment();
  const [isGeneralFormOpen, setIsGeneralFormOpen] = useState(false);

  // Filter state (Story 3.4)
  const commentFilter = useViewerStore((s) => s.commentFilter);
  const setCommentFilter = useViewerStore((s) => s.setCommentFilter);
  const comments = useViewerStore((s) => s.comments);

  // Comment status actions via hook (Story 3.4)
  const { resolveComment, reopenComment } = useCommentStatus();

  // Compute filtered comments and counts with useMemo to avoid infinite loops
  const filteredComments = useMemo(() => {
    if (commentFilter === 'all') return comments;
    return comments.filter((c) => c.status === commentFilter);
  }, [comments, commentFilter]);

  const counts = useMemo(
    () => ({
      total: comments.length,
      open: comments.filter((c) => c.status === 'open').length,
      resolved: comments.filter((c) => c.status === 'resolved').length,
    }),
    [comments]
  );

  const handleOpenGeneralCommentForm = useCallback(() => {
    setIsGeneralFormOpen(true);
  }, []);

  const handleCloseGeneralCommentForm = useCallback(() => {
    setIsGeneralFormOpen(false);
  }, []);

  const handleSubmitGeneralComment = useCallback(
    async (content: string) => {
      const result = await submitGeneralComment(content);
      if (result.ok) {
        setIsGeneralFormOpen(false);
      }
    },
    [submitGeneralComment]
  );

  // Shared header component with Add Comment button and filter
  const renderHeader = () => (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Comments</h2>
        <button
          onClick={handleOpenGeneralCommentForm}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1"
          aria-label="Add general comment"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Comment
        </button>
      </div>
      {/* Filter row with counts */}
      <div className="flex items-center justify-between">
        <CommentFilterDropdown
          currentFilter={commentFilter}
          onFilterChange={setCommentFilter}
          counts={counts}
        />
        <span className="text-xs text-gray-500">
          {counts.open} open · {counts.resolved} resolved
        </span>
      </div>
    </div>
  );

  // Handle backdrop click (close modal when clicking outside form)
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only close if clicking the backdrop itself, not the form
      if (e.target === e.currentTarget) {
        handleCloseGeneralCommentForm();
      }
    },
    [handleCloseGeneralCommentForm]
  );

  // Shared modal component
  const renderModal = () =>
    isGeneralFormOpen && (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleBackdropClick}
      >
        <GeneralCommentForm
          onSubmit={handleSubmitGeneralComment}
          onCancel={handleCloseGeneralCommentForm}
          isSubmitting={isSubmitting}
          error={addCommentError}
        />
      </div>
    );

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg border-l border-gray-200 flex flex-col">
        {renderHeader()}
        <div className="flex-1 flex items-center justify-center p-8 text-gray-500">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full mx-auto mb-4" />
            <p>Loading comments...</p>
          </div>
        </div>
        {renderModal()}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg border-l border-gray-200 flex flex-col">
        {renderHeader()}
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
        {renderModal()}
      </div>
    );
  }

  // Empty state - check both total comments and filtered comments
  if (comments.length === 0) {
    return (
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg border-l border-gray-200 flex flex-col">
        {renderHeader()}
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
        {renderModal()}
      </div>
    );
  }

  // Sort filtered comments by createdAt
  const sortedFilteredComments = [...filteredComments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Normal state with comments
  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg border-l border-gray-200 flex flex-col">
      {renderHeader()}

      {/* Comment list (scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sortedFilteredComments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No {commentFilter} comments</p>
          </div>
        ) : (
          sortedFilteredComments.map((comment) => (
            <CommentListItem
              key={comment.id}
              comment={comment}
              onCommentClick={handleCommentClick}
              onResolve={resolveComment}
              onReopen={reopenComment}
            />
          ))
        )}
      </div>

      {renderModal()}
    </div>
  );
}
