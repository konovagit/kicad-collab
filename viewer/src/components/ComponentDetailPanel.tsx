import { useCallback } from 'react';

import type { Component } from '@/types';

interface ComponentDetailPanelProps {
  component: Component;
  onClose: () => void;
  onAddComment?: (componentRef: string) => void;
}

/**
 * Detail panel showing component information.
 * Displayed as a fixed sidebar on the right side of the viewport.
 * Responsive: Full-width bottom sheet on mobile, sidebar on larger screens.
 *
 * Story 2.4: Component Selection & Detail Panel
 */
export function ComponentDetailPanel({
  component,
  onClose,
  onAddComment,
}: ComponentDetailPanelProps) {
  const handleAddComment = useCallback(() => {
    if (onAddComment) {
      onAddComment(component.ref);
    }
  }, [onAddComment, component.ref]);

  return (
    <div
      className="fixed z-50 bg-white shadow-lg border-gray-200 overflow-y-auto
        right-0 bottom-0 left-0 h-auto max-h-[50vh] border-t p-4
        sm:left-auto sm:top-0 sm:h-full sm:max-h-full sm:w-72 sm:border-l sm:border-t-0"
    >
      {/* Header with close button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Component Details</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
          aria-label="Close panel"
          type="button"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Component data - values are from KiCad exports (trusted source).
          React JSX escapes text content, providing XSS protection.
          User-generated content (comments) requires explicit sanitization per project rules. */}
      <dl className="space-y-3">
        <div>
          <dt className="text-sm text-gray-500">Reference</dt>
          <dd className="font-medium">{component.ref}</dd>
        </div>

        {component.value && (
          <div>
            <dt className="text-sm text-gray-500">Value</dt>
            <dd className="font-medium">{component.value}</dd>
          </div>
        )}

        {component.footprint && (
          <div>
            <dt className="text-sm text-gray-500">Footprint</dt>
            <dd className="font-medium text-sm break-all">{component.footprint}</dd>
          </div>
        )}

        {component.posX !== undefined && component.posY !== undefined && (
          <div>
            <dt className="text-sm text-gray-500">Position</dt>
            <dd className="font-medium">
              ({component.posX.toFixed(2)}, {component.posY.toFixed(2)})
            </dd>
          </div>
        )}
      </dl>

      {/* Add Comment button (Story 3.2) */}
      {onAddComment && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleAddComment}
            className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
            type="button"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Add Comment
          </button>
        </div>
      )}
    </div>
  );
}
