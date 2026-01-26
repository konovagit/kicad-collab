import { useCallback, useEffect, useRef } from 'react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
  commentPreview?: string;
}

/**
 * Confirmation dialog for deleting a comment.
 * Shows a modal overlay with warning text and action buttons.
 * Implements focus trap to keep keyboard navigation within dialog.
 *
 * Story 3.6: Edit & Delete Own Comments
 */
export function DeleteConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  isDeleting = false,
  commentPreview,
}: DeleteConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap handler - keeps focus within dialog
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }

      // Focus trap: Tab cycles between Cancel and Delete buttons
      if (e.key === 'Tab') {
        const focusableElements = [cancelButtonRef.current, deleteButtonRef.current].filter(
          (el): el is HTMLButtonElement => el !== null && !el.disabled
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift+Tab: if on first element, go to last
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: if on last element, go to first
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [onCancel]
  );

  // Set up event listener and initial focus
  useEffect(() => {
    if (!isOpen) return;

    // Focus the cancel button (safer default)
    cancelButtonRef.current?.focus();

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // Click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  const truncatedPreview =
    commentPreview && commentPreview.length > 50
      ? commentPreview.substring(0, 50) + '...'
      : commentPreview;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div ref={dialogRef} className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 id="delete-dialog-title" className="text-lg font-semibold mb-2">
          Delete Comment?
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          This action cannot be undone. The comment and all its replies will be permanently deleted.
        </p>
        {truncatedPreview && (
          <div className="bg-gray-100 p-2 rounded text-sm text-gray-700 mb-4 italic">
            "{truncatedPreview}"
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            ref={deleteButtonRef}
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
