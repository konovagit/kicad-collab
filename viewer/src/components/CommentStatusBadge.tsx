import type { CommentStatus } from '@/types';

interface CommentStatusBadgeProps {
  status: CommentStatus;
}

/**
 * Badge displaying comment status with appropriate styling.
 * Open: Blue badge
 * Resolved: Green badge with checkmark icon
 *
 * Story 3.4: Comment Status & Filtering
 */
export function CommentStatusBadge({ status }: CommentStatusBadgeProps) {
  if (status === 'resolved') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Resolved
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700">
      Open
    </span>
  );
}
