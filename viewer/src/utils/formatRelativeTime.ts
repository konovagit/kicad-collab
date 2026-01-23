/**
 * Formats a date string as a human-readable relative time.
 * Uses Intl.RelativeTimeFormat for localized output.
 *
 * Examples:
 * - "just now" (< 60 seconds)
 * - "5 minutes ago"
 * - "2 hours ago"
 * - "3 days ago"
 * - "Jun 15, 2025" (> 30 days)
 *
 * Story 3.1: Comment Panel & List View
 *
 * @param dateString - ISO 8601 date string
 * @returns Human-readable relative time string
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);

  // Handle invalid dates
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Handle future dates gracefully
  if (diffMs < 0) {
    return 'in the future';
  }

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  // Less than 60 seconds
  if (diffSeconds < 60) {
    return 'just now';
  }

  // Less than 60 minutes
  if (diffMinutes < 60) {
    return rtf.format(-diffMinutes, 'minute');
  }

  // Less than 24 hours
  if (diffHours < 24) {
    return rtf.format(-diffHours, 'hour');
  }

  // Less than 30 days
  if (diffDays < 30) {
    return rtf.format(-diffDays, 'day');
  }

  // Fallback to absolute date for very old comments
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
