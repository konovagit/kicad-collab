import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { ReplyListItem } from './ReplyListItem';
import type { Comment } from '@/types';

// Sample reply for testing
const mockReply: Comment = {
  id: 'reply-001',
  author: 'Charlie',
  content: 'This is a reply',
  createdAt: '2026-01-23T10:00:00Z',
  status: 'open',
  parentId: 'parent-001',
};

describe('ReplyListItem', () => {
  beforeEach(() => {
    // Mock Date.now() to return a fixed timestamp for consistent relative time
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-23T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays author name', () => {
    render(<ReplyListItem reply={mockReply} />);
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('displays reply content', () => {
    render(<ReplyListItem reply={mockReply} />);
    expect(screen.getByText('This is a reply')).toBeInTheDocument();
  });

  it('displays relative timestamp', () => {
    render(<ReplyListItem reply={mockReply} />);
    // 2 hours ago from 12:00 to 10:00
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
  });

  it('displays CommentStatusBadge', () => {
    render(<ReplyListItem reply={mockReply} />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('shows Resolve button for open replies', () => {
    render(<ReplyListItem reply={mockReply} onResolve={vi.fn()} onReopen={vi.fn()} />);
    expect(screen.getByRole('button', { name: /resolve/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reopen/i })).not.toBeInTheDocument();
  });

  it('shows Reopen button for resolved replies', () => {
    const resolvedReply = { ...mockReply, status: 'resolved' as const };
    render(<ReplyListItem reply={resolvedReply} onResolve={vi.fn()} onReopen={vi.fn()} />);
    expect(screen.getByRole('button', { name: /reopen/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /resolve/i })).not.toBeInTheDocument();
  });

  it('calls onResolve with reply id when Resolve clicked', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const mockOnResolve = vi.fn();
    render(<ReplyListItem reply={mockReply} onResolve={mockOnResolve} onReopen={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /resolve/i }));
    expect(mockOnResolve).toHaveBeenCalledWith('reply-001');
  });

  it('calls onReopen with reply id when Reopen clicked', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const mockOnReopen = vi.fn();
    const resolvedReply = { ...mockReply, status: 'resolved' as const };
    render(<ReplyListItem reply={resolvedReply} onResolve={vi.fn()} onReopen={mockOnReopen} />);
    await user.click(screen.getByRole('button', { name: /reopen/i }));
    expect(mockOnReopen).toHaveBeenCalledWith('reply-001');
  });

  it('applies reduced opacity to resolved replies', () => {
    const resolvedReply = { ...mockReply, status: 'resolved' as const };
    const { container } = render(
      <ReplyListItem reply={resolvedReply} onResolve={vi.fn()} onReopen={vi.fn()} />
    );
    expect(container.firstChild).toHaveClass('opacity-60');
  });

  it('applies strikethrough to resolved reply content', () => {
    const resolvedReply = {
      ...mockReply,
      status: 'resolved' as const,
      content: 'Strikethrough test',
    };
    render(<ReplyListItem reply={resolvedReply} onResolve={vi.fn()} onReopen={vi.fn()} />);
    expect(screen.getByText('Strikethrough test')).toHaveClass('line-through');
  });
});
