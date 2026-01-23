import { useCallback, useEffect, useRef } from 'react';

interface ContextMenuProps {
  position: { x: number; y: number };
  componentRef: string;
  onAddComment: () => void;
  onClose: () => void;
}

export function ContextMenu({ position, componentRef, onAddComment, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleAddComment = useCallback(() => {
    onAddComment();
    onClose();
  }, [onAddComment, onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-50"
      style={{ left: position.x, top: position.y }}
      role="menu"
      aria-label={`Context menu for ${componentRef}`}
    >
      <button
        onClick={handleAddComment}
        className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
        role="menuitem"
      >
        {/* Comment icon (inline SVG) */}
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
  );
}
