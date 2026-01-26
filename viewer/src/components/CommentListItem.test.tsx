import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { CommentListItem } from './CommentListItem';
import type { Comment } from '@/types';

// Sample comments for testing
const mockAnchoredComment: Comment = {
  id: 'comment-001',
  author: 'Alice',
  content: 'Check this capacitor value',
  createdAt: '2026-01-23T10:00:00Z',
  componentRef: 'C12',
  status: 'open',
};

const mockGeneralComment: Comment = {
  id: 'comment-002',
  author: 'Bob',
  content: 'Overall looks good',
  createdAt: '2026-01-23T11:00:00Z',
  status: 'open',
};

describe('CommentListItem', () => {
  beforeEach(() => {
    // Mock Date.now() to return a fixed timestamp for consistent relative time
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-23T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays author name', () => {
    render(<CommentListItem comment={mockAnchoredComment} onCommentClick={vi.fn()} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('displays comment content', () => {
    render(<CommentListItem comment={mockAnchoredComment} onCommentClick={vi.fn()} />);
    expect(screen.getByText('Check this capacitor value')).toBeInTheDocument();
  });

  it('displays relative timestamp', () => {
    render(<CommentListItem comment={mockAnchoredComment} onCommentClick={vi.fn()} />);
    // 2 hours ago from 12:00 to 10:00
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
  });

  it('displays component ref with pin icon for anchored comments', () => {
    render(<CommentListItem comment={mockAnchoredComment} onCommentClick={vi.fn()} />);
    expect(screen.getByText(/📍/)).toBeInTheDocument();
    expect(screen.getByText(/C12/)).toBeInTheDocument();
  });

  it('displays "General" label with note icon for non-anchored comments', () => {
    render(<CommentListItem comment={mockGeneralComment} onCommentClick={vi.fn()} />);
    expect(screen.getByText(/📝/)).toBeInTheDocument();
    expect(screen.getByText(/General/)).toBeInTheDocument();
  });

  it('calls onCommentClick with comment for anchored comments when clicked', async () => {
    // Use real timers for user interaction tests
    vi.useRealTimers();
    const user = userEvent.setup();
    const onCommentClick = vi.fn();
    const { container } = render(
      <CommentListItem comment={mockAnchoredComment} onCommentClick={onCommentClick} />
    );

    // Click the root element (first child of container)
    await user.click(container.firstChild as Element);
    expect(onCommentClick).toHaveBeenCalledTimes(1);
    expect(onCommentClick).toHaveBeenCalledWith(mockAnchoredComment);
  });

  it('does not call onCommentClick for general comments when clicked', async () => {
    // Use real timers for user interaction tests
    vi.useRealTimers();
    const user = userEvent.setup();
    const onCommentClick = vi.fn();
    const { container } = render(
      <CommentListItem comment={mockGeneralComment} onCommentClick={onCommentClick} />
    );

    // Click the root element
    await user.click(container.firstChild as Element);
    expect(onCommentClick).not.toHaveBeenCalled();
  });

  it('has pointer cursor for anchored comments', () => {
    const { container } = render(
      <CommentListItem comment={mockAnchoredComment} onCommentClick={vi.fn()} />
    );
    // Root element should have cursor-pointer class
    expect(container.firstChild).toHaveClass('cursor-pointer');
  });

  it('does not have pointer cursor for general comments', () => {
    const { container } = render(
      <CommentListItem comment={mockGeneralComment} onCommentClick={vi.fn()} />
    );
    // Root element should not have cursor-pointer class
    expect(container.firstChild).not.toHaveClass('cursor-pointer');
  });

  describe('resolve/reopen buttons (Story 3.4)', () => {
    const mockOnResolve = vi.fn();
    const mockOnReopen = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('shows Resolve button for open comments', () => {
      render(
        <CommentListItem
          comment={mockAnchoredComment}
          onCommentClick={vi.fn()}
          onResolve={mockOnResolve}
          onReopen={mockOnReopen}
        />
      );
      expect(screen.getByRole('button', { name: /resolve/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /reopen/i })).not.toBeInTheDocument();
    });

    it('shows Reopen button for resolved comments', () => {
      const resolvedComment = { ...mockAnchoredComment, status: 'resolved' as const };
      render(
        <CommentListItem
          comment={resolvedComment}
          onCommentClick={vi.fn()}
          onResolve={mockOnResolve}
          onReopen={mockOnReopen}
        />
      );
      expect(screen.getByRole('button', { name: /reopen/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /resolve/i })).not.toBeInTheDocument();
    });

    it('calls onResolve with comment id when Resolve clicked', async () => {
      // Use real timers for user interaction
      vi.useRealTimers();
      const user = userEvent.setup();
      render(
        <CommentListItem
          comment={mockAnchoredComment}
          onCommentClick={vi.fn()}
          onResolve={mockOnResolve}
          onReopen={mockOnReopen}
        />
      );
      await user.click(screen.getByRole('button', { name: /resolve/i }));
      expect(mockOnResolve).toHaveBeenCalledWith('comment-001');
    });

    it('calls onReopen with comment id when Reopen clicked', async () => {
      // Use real timers for user interaction
      vi.useRealTimers();
      const user = userEvent.setup();
      const resolvedComment = { ...mockAnchoredComment, status: 'resolved' as const };
      render(
        <CommentListItem
          comment={resolvedComment}
          onCommentClick={vi.fn()}
          onResolve={mockOnResolve}
          onReopen={mockOnReopen}
        />
      );
      await user.click(screen.getByRole('button', { name: /reopen/i }));
      expect(mockOnReopen).toHaveBeenCalledWith('comment-001');
    });

    it('does not trigger onCommentClick when Resolve button is clicked', async () => {
      // Use real timers for user interaction
      vi.useRealTimers();
      const user = userEvent.setup();
      const onCommentClick = vi.fn();
      render(
        <CommentListItem
          comment={mockAnchoredComment}
          onCommentClick={onCommentClick}
          onResolve={mockOnResolve}
          onReopen={mockOnReopen}
        />
      );
      await user.click(screen.getByRole('button', { name: /resolve/i }));
      expect(onCommentClick).not.toHaveBeenCalled();
    });

    it('does not trigger onCommentClick when Reopen button is clicked', async () => {
      // Use real timers for user interaction
      vi.useRealTimers();
      const user = userEvent.setup();
      const onCommentClick = vi.fn();
      const resolvedComment = { ...mockAnchoredComment, status: 'resolved' as const };
      render(
        <CommentListItem
          comment={resolvedComment}
          onCommentClick={onCommentClick}
          onResolve={mockOnResolve}
          onReopen={mockOnReopen}
        />
      );
      await user.click(screen.getByRole('button', { name: /reopen/i }));
      expect(onCommentClick).not.toHaveBeenCalled();
    });

    it('applies reduced opacity to resolved comments', () => {
      const resolvedComment = { ...mockAnchoredComment, status: 'resolved' as const };
      const { container } = render(
        <CommentListItem
          comment={resolvedComment}
          onCommentClick={vi.fn()}
          onResolve={mockOnResolve}
          onReopen={mockOnReopen}
        />
      );
      expect(container.firstChild).toHaveClass('opacity-60');
    });

    it('applies strikethrough to resolved comment content', () => {
      const resolvedComment = {
        ...mockAnchoredComment,
        status: 'resolved' as const,
        content: 'Test content for strikethrough',
      };
      render(
        <CommentListItem
          comment={resolvedComment}
          onCommentClick={vi.fn()}
          onResolve={mockOnResolve}
          onReopen={mockOnReopen}
        />
      );
      expect(screen.getByText('Test content for strikethrough')).toHaveClass('line-through');
    });
  });

  describe('reply button (Story 3.5)', () => {
    const mockOnReply = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('shows Reply button when onReply prop is provided and comment is open', () => {
      render(
        <CommentListItem
          comment={mockAnchoredComment}
          onCommentClick={vi.fn()}
          onReply={mockOnReply}
        />
      );
      expect(screen.getByRole('button', { name: /reply/i })).toBeInTheDocument();
    });

    it('does not show Reply button when onReply prop is not provided', () => {
      render(<CommentListItem comment={mockAnchoredComment} onCommentClick={vi.fn()} />);
      expect(screen.queryByRole('button', { name: /reply/i })).not.toBeInTheDocument();
    });

    it('does not show Reply button for resolved comments', () => {
      const resolvedComment = { ...mockAnchoredComment, status: 'resolved' as const };
      render(
        <CommentListItem comment={resolvedComment} onCommentClick={vi.fn()} onReply={mockOnReply} />
      );
      expect(screen.queryByRole('button', { name: /reply/i })).not.toBeInTheDocument();
    });

    it('calls onReply when Reply button is clicked', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(
        <CommentListItem
          comment={mockAnchoredComment}
          onCommentClick={vi.fn()}
          onReply={mockOnReply}
        />
      );
      await user.click(screen.getByRole('button', { name: /reply/i }));
      expect(mockOnReply).toHaveBeenCalledTimes(1);
    });

    it('does not trigger onCommentClick when Reply button is clicked', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const onCommentClick = vi.fn();
      render(
        <CommentListItem
          comment={mockAnchoredComment}
          onCommentClick={onCommentClick}
          onReply={mockOnReply}
        />
      );
      await user.click(screen.getByRole('button', { name: /reply/i }));
      expect(onCommentClick).not.toHaveBeenCalled();
    });
  });

  describe('edit/delete buttons (Story 3.6)', () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('shows Edit button when currentUserName matches comment author', () => {
      render(
        <CommentListItem
          comment={mockAnchoredComment}
          onCommentClick={vi.fn()}
          onEdit={mockOnEdit}
          currentUserName="Alice"
        />
      );
      expect(screen.getByRole('button', { name: /edit comment/i })).toBeInTheDocument();
    });

    it('shows Delete button when currentUserName matches comment author', () => {
      render(
        <CommentListItem
          comment={mockAnchoredComment}
          onCommentClick={vi.fn()}
          onDelete={mockOnDelete}
          currentUserName="Alice"
        />
      );
      expect(screen.getByRole('button', { name: /delete comment/i })).toBeInTheDocument();
    });

    it('does not show Edit button when currentUserName does not match author', () => {
      render(
        <CommentListItem
          comment={mockAnchoredComment}
          onCommentClick={vi.fn()}
          onEdit={mockOnEdit}
          currentUserName="Bob"
        />
      );
      expect(screen.queryByRole('button', { name: /edit comment/i })).not.toBeInTheDocument();
    });

    it('does not show Delete button when currentUserName does not match author', () => {
      render(
        <CommentListItem
          comment={mockAnchoredComment}
          onCommentClick={vi.fn()}
          onDelete={mockOnDelete}
          currentUserName="Bob"
        />
      );
      expect(screen.queryByRole('button', { name: /delete comment/i })).not.toBeInTheDocument();
    });

    it('does not show Edit/Delete when currentUserName is undefined', () => {
      render(
        <CommentListItem
          comment={mockAnchoredComment}
          onCommentClick={vi.fn()}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.queryByRole('button', { name: /edit comment/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete comment/i })).not.toBeInTheDocument();
    });

    it('calls onEdit when Edit button is clicked', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(
        <CommentListItem
          comment={mockAnchoredComment}
          onCommentClick={vi.fn()}
          onEdit={mockOnEdit}
          currentUserName="Alice"
        />
      );
      await user.click(screen.getByRole('button', { name: /edit comment/i }));
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('calls onDelete when Delete button is clicked', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(
        <CommentListItem
          comment={mockAnchoredComment}
          onCommentClick={vi.fn()}
          onDelete={mockOnDelete}
          currentUserName="Alice"
        />
      );
      await user.click(screen.getByRole('button', { name: /delete comment/i }));
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('shows "(edited)" indicator when comment has updatedAt', () => {
      const editedComment = {
        ...mockAnchoredComment,
        updatedAt: '2026-01-23T14:00:00Z',
      };
      render(<CommentListItem comment={editedComment} onCommentClick={vi.fn()} />);
      expect(screen.getByText('(edited)')).toBeInTheDocument();
    });

    it('does not show "(edited)" indicator when comment has no updatedAt', () => {
      render(<CommentListItem comment={mockAnchoredComment} onCommentClick={vi.fn()} />);
      expect(screen.queryByText('(edited)')).not.toBeInTheDocument();
    });

    it('does not trigger onCommentClick when Edit button is clicked', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const onCommentClick = vi.fn();
      render(
        <CommentListItem
          comment={mockAnchoredComment}
          onCommentClick={onCommentClick}
          onEdit={mockOnEdit}
          currentUserName="Alice"
        />
      );
      await user.click(screen.getByRole('button', { name: /edit comment/i }));
      expect(onCommentClick).not.toHaveBeenCalled();
    });

    it('shows Edit/Delete buttons for own resolved comments', () => {
      const resolvedComment = { ...mockAnchoredComment, status: 'resolved' as const };
      render(
        <CommentListItem
          comment={resolvedComment}
          onCommentClick={vi.fn()}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserName="Alice"
        />
      );
      expect(screen.getByRole('button', { name: /edit comment/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete comment/i })).toBeInTheDocument();
    });
  });
});
