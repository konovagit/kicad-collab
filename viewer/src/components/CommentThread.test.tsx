import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { CommentThread } from './CommentThread';
import { useViewerStore } from '@/stores/viewerStore';
import type { Comment } from '@/types';

// Sample root comment for testing
const mockRootComment: Comment = {
  id: 'root-001',
  author: 'Alice',
  content: 'This is the parent comment',
  createdAt: '2026-01-23T10:00:00Z',
  componentRef: 'C12',
  status: 'open',
};

// Sample replies
const mockReplies: Comment[] = [
  {
    id: 'reply-001',
    author: 'Bob',
    content: 'First reply',
    createdAt: '2026-01-23T11:00:00Z',
    status: 'open',
    parentId: 'root-001',
  },
  {
    id: 'reply-002',
    author: 'Charlie',
    content: 'Second reply',
    createdAt: '2026-01-23T12:00:00Z',
    status: 'open',
    parentId: 'root-001',
  },
];

describe('CommentThread', () => {
  const mockOnCommentClick = vi.fn();
  const mockOnResolve = vi.fn();
  const mockOnReopen = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-23T14:00:00Z'));
    vi.clearAllMocks();
    // Reset store to initial state with the root comment
    useViewerStore.setState({
      comments: [mockRootComment],
      authorName: 'TestUser',
      isAddingComment: false,
      addCommentError: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the parent comment', () => {
    render(
      <CommentThread
        comment={mockRootComment}
        onCommentClick={mockOnCommentClick}
        onResolve={mockOnResolve}
        onReopen={mockOnReopen}
      />
    );
    expect(screen.getByText('This is the parent comment')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders Reply button on parent comment', () => {
    render(
      <CommentThread
        comment={mockRootComment}
        onCommentClick={mockOnCommentClick}
        onResolve={mockOnResolve}
        onReopen={mockOnReopen}
      />
    );
    expect(screen.getByRole('button', { name: /reply/i })).toBeInTheDocument();
  });

  it('shows reply form when Reply is clicked', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(
      <CommentThread
        comment={mockRootComment}
        onCommentClick={mockOnCommentClick}
        onResolve={mockOnResolve}
        onReopen={mockOnReopen}
      />
    );
    await user.click(screen.getByRole('button', { name: /reply/i }));
    expect(screen.getByRole('textbox', { name: /reply content/i })).toBeInTheDocument();
  });

  it('hides reply form when Cancel is clicked', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(
      <CommentThread
        comment={mockRootComment}
        onCommentClick={mockOnCommentClick}
        onResolve={mockOnResolve}
        onReopen={mockOnReopen}
      />
    );
    // Open reply form
    await user.click(screen.getByRole('button', { name: /reply/i }));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    // Cancel
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('renders replies when they exist', () => {
    useViewerStore.setState({
      comments: [mockRootComment, ...mockReplies],
      authorName: 'TestUser',
    });
    render(
      <CommentThread
        comment={mockRootComment}
        onCommentClick={mockOnCommentClick}
        onResolve={mockOnResolve}
        onReopen={mockOnReopen}
      />
    );
    expect(screen.getByText('First reply')).toBeInTheDocument();
    expect(screen.getByText('Second reply')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('renders replies in chronological order', () => {
    useViewerStore.setState({
      comments: [mockRootComment, ...mockReplies],
      authorName: 'TestUser',
    });
    render(
      <CommentThread
        comment={mockRootComment}
        onCommentClick={mockOnCommentClick}
        onResolve={mockOnResolve}
        onReopen={mockOnReopen}
      />
    );
    const replies = screen.getAllByText(/reply$/);
    expect(replies[0].textContent).toContain('First reply');
    expect(replies[1].textContent).toContain('Second reply');
  });

  it('calls onResolve when resolving parent comment', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(
      <CommentThread
        comment={mockRootComment}
        onCommentClick={mockOnCommentClick}
        onResolve={mockOnResolve}
        onReopen={mockOnReopen}
      />
    );
    await user.click(screen.getByRole('button', { name: /resolve comment/i }));
    expect(mockOnResolve).toHaveBeenCalledWith('root-001');
  });

  it('calls onResolve when resolving a reply', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    useViewerStore.setState({
      comments: [mockRootComment, mockReplies[0]],
      authorName: 'TestUser',
    });
    render(
      <CommentThread
        comment={mockRootComment}
        onCommentClick={mockOnCommentClick}
        onResolve={mockOnResolve}
        onReopen={mockOnReopen}
      />
    );
    // Find the resolve button in the reply (second one)
    const resolveButtons = screen.getAllByRole('button', { name: /resolve/i });
    await user.click(resolveButtons[1]); // Second resolve button is for the reply
    expect(mockOnResolve).toHaveBeenCalledWith('reply-001');
  });

  it('submits reply and closes form on success', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(
      <CommentThread
        comment={mockRootComment}
        onCommentClick={mockOnCommentClick}
        onResolve={mockOnResolve}
        onReopen={mockOnReopen}
      />
    );
    // Open reply form
    await user.click(screen.getByRole('button', { name: /reply/i }));
    // Type reply
    await user.type(screen.getByRole('textbox'), 'My new reply');
    // Submit
    await user.click(screen.getByRole('button', { name: /^reply$/i }));
    // Form should close and new reply should appear
    await waitFor(() => {
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
    expect(screen.getByText('My new reply')).toBeInTheDocument();
  });

  it('does not render replies if there are none', () => {
    render(
      <CommentThread
        comment={mockRootComment}
        onCommentClick={mockOnCommentClick}
        onResolve={mockOnResolve}
        onReopen={mockOnReopen}
      />
    );
    // Only the parent comment content should be present
    expect(screen.getByText('This is the parent comment')).toBeInTheDocument();
    // No reply content
    expect(screen.queryByText('First reply')).not.toBeInTheDocument();
  });

  describe('edit/delete functionality (Story 3.6)', () => {
    it('shows Edit button for own comments', () => {
      useViewerStore.setState({
        comments: [mockRootComment],
        authorName: 'Alice', // Same as comment author
      });
      render(
        <CommentThread
          comment={mockRootComment}
          onCommentClick={mockOnCommentClick}
          onResolve={mockOnResolve}
          onReopen={mockOnReopen}
        />
      );
      expect(screen.getByRole('button', { name: /edit comment/i })).toBeInTheDocument();
    });

    it('shows Delete button for own comments', () => {
      useViewerStore.setState({
        comments: [mockRootComment],
        authorName: 'Alice',
      });
      render(
        <CommentThread
          comment={mockRootComment}
          onCommentClick={mockOnCommentClick}
          onResolve={mockOnResolve}
          onReopen={mockOnReopen}
        />
      );
      expect(screen.getByRole('button', { name: /delete comment/i })).toBeInTheDocument();
    });

    it('shows EditCommentForm when Edit is clicked on parent comment', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      useViewerStore.setState({
        comments: [mockRootComment],
        authorName: 'Alice',
      });
      render(
        <CommentThread
          comment={mockRootComment}
          onCommentClick={mockOnCommentClick}
          onResolve={mockOnResolve}
          onReopen={mockOnReopen}
        />
      );

      await user.click(screen.getByRole('button', { name: /edit comment/i }));

      // EditCommentForm should now be visible with textarea
      expect(screen.getByRole('textbox', { name: /edit comment content/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveValue('This is the parent comment');
    });

    it('hides EditCommentForm and restores comment when Cancel is clicked', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      useViewerStore.setState({
        comments: [mockRootComment],
        authorName: 'Alice',
      });
      render(
        <CommentThread
          comment={mockRootComment}
          onCommentClick={mockOnCommentClick}
          onResolve={mockOnResolve}
          onReopen={mockOnReopen}
        />
      );

      // Enter edit mode
      await user.click(screen.getByRole('button', { name: /edit comment/i }));
      expect(screen.getByRole('textbox')).toBeInTheDocument();

      // Cancel edit
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Should show original comment again
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByText('This is the parent comment')).toBeInTheDocument();
    });

    it('updates comment content in store when edit is saved', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      useViewerStore.setState({
        comments: [mockRootComment],
        authorName: 'Alice',
      });
      render(
        <CommentThread
          comment={mockRootComment}
          onCommentClick={mockOnCommentClick}
          onResolve={mockOnResolve}
          onReopen={mockOnReopen}
        />
      );

      // Enter edit mode
      await user.click(screen.getByRole('button', { name: /edit comment/i }));

      // Change content
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Updated parent comment');

      // Save
      await user.click(screen.getByRole('button', { name: /save/i }));

      // Edit form should close (no textbox)
      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });

      // Store should have updated content
      const updatedComment = useViewerStore.getState().comments.find((c) => c.id === 'root-001');
      expect(updatedComment?.content).toBe('Updated parent comment');
      expect(updatedComment?.updatedAt).toBeDefined();
    });

    it('shows DeleteConfirmDialog when Delete is clicked', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      useViewerStore.setState({
        comments: [mockRootComment],
        authorName: 'Alice',
      });
      render(
        <CommentThread
          comment={mockRootComment}
          onCommentClick={mockOnCommentClick}
          onResolve={mockOnResolve}
          onReopen={mockOnReopen}
        />
      );

      await user.click(screen.getByRole('button', { name: /delete comment/i }));

      // Dialog should be visible
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/delete comment\?/i)).toBeInTheDocument();
    });

    it('closes DeleteConfirmDialog when Cancel is clicked', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      useViewerStore.setState({
        comments: [mockRootComment],
        authorName: 'Alice',
      });
      render(
        <CommentThread
          comment={mockRootComment}
          onCommentClick={mockOnCommentClick}
          onResolve={mockOnResolve}
          onReopen={mockOnReopen}
        />
      );

      // Open delete dialog
      await user.click(screen.getByRole('button', { name: /delete comment/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Cancel
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Dialog should be closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shows EditCommentForm when Edit is clicked on reply', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      useViewerStore.setState({
        comments: [mockRootComment, mockReplies[0]],
        authorName: 'Bob', // Same as reply author
      });
      render(
        <CommentThread
          comment={mockRootComment}
          onCommentClick={mockOnCommentClick}
          onResolve={mockOnResolve}
          onReopen={mockOnReopen}
        />
      );

      // Click edit on reply (Bob's reply)
      await user.click(screen.getByRole('button', { name: /edit reply/i }));

      // EditCommentForm should show with reply content
      expect(screen.getByRole('textbox')).toHaveValue('First reply');
    });

    it('shows comment preview in delete dialog', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      useViewerStore.setState({
        comments: [mockRootComment],
        authorName: 'Alice',
      });
      render(
        <CommentThread
          comment={mockRootComment}
          onCommentClick={mockOnCommentClick}
          onResolve={mockOnResolve}
          onReopen={mockOnReopen}
        />
      );

      await user.click(screen.getByRole('button', { name: /delete comment/i }));

      // Should show preview of comment being deleted
      expect(screen.getByText(/"This is the parent comment"/)).toBeInTheDocument();
    });
  });
});
