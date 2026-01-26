import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { CommentPanel } from './CommentPanel';
import { useViewerStore } from '@/stores/viewerStore';
import type { Comment } from '@/types';

// Sample comments for testing
const mockComments: Comment[] = [
  {
    id: 'comment-001',
    author: 'Alice',
    content: 'Check this capacitor value',
    createdAt: '2026-01-23T10:00:00Z',
    componentRef: 'C1',
    status: 'open',
  },
  {
    id: 'comment-002',
    author: 'Bob',
    content: 'Overall looks good',
    createdAt: '2026-01-23T11:00:00Z',
    status: 'open',
  },
  {
    id: 'comment-003',
    author: 'Carol',
    content: 'First comment',
    createdAt: '2026-01-23T09:00:00Z',
    componentRef: 'R1',
    status: 'open',
  },
];

describe('CommentPanel', () => {
  beforeEach(() => {
    // Mock Date.now() for consistent relative time
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-23T12:00:00Z'));

    // Reset store to initial state
    useViewerStore.setState({
      comments: [],
      isLoadingComments: false,
      loadCommentsError: null,
      selectedRef: null,
      commentFilter: 'all',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays empty state when no comments', () => {
    render(<CommentPanel />);
    expect(screen.getByText('No comments yet')).toBeInTheDocument();
  });

  it('displays "Comments" header', () => {
    useViewerStore.getState().setComments(mockComments);
    render(<CommentPanel />);
    expect(screen.getByText('Comments')).toBeInTheDocument();
  });

  it('displays comments in chronological order (oldest first)', () => {
    useViewerStore.getState().setComments(mockComments);

    render(<CommentPanel />);

    // Get all author names
    const authorElements = screen.getAllByText(/Alice|Bob|Carol/);

    // Carol (09:00) should be first, Alice (10:00) second, Bob (11:00) last
    expect(authorElements[0]).toHaveTextContent('Carol');
    expect(authorElements[1]).toHaveTextContent('Alice');
    expect(authorElements[2]).toHaveTextContent('Bob');
  });

  it('displays loading state while comments are loading', () => {
    useViewerStore.setState({ isLoadingComments: true });
    render(<CommentPanel />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays error state if comments fail to load', () => {
    useViewerStore.setState({ loadCommentsError: 'Network error' });
    render(<CommentPanel />);
    expect(screen.getByText('Error loading comments')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('clicking anchored comment selects component and pans to it', async () => {
    // Use real timers for user interaction tests
    vi.useRealTimers();
    const user = userEvent.setup();
    useViewerStore.getState().setComments(mockComments);

    // Set up component index so navigation can find the component
    const componentIndex = new Map([
      ['R1', { ref: 'R1', value: '10k', footprint: 'Resistor', posX: 200, posY: 150 }],
    ]);
    useViewerStore.setState({ componentIndex });

    render(<CommentPanel />);

    // Find Carol's comment by content and get its parent container (CommentListItem root)
    const carolContentElement = screen.getByText('First comment');
    // Navigate up to find the CommentListItem root (div with cursor-pointer class)
    const commentItem = carolContentElement.closest('.cursor-pointer');
    await user.click(commentItem as Element);

    // Component should be selected
    expect(useViewerStore.getState().selectedRef).toBe('R1');
    // Pan should be updated to center the component
    const pan = useViewerStore.getState().pan;
    expect(pan.x).not.toBe(0);
    expect(pan.y).not.toBe(0);
  });

  it('renders all comments from the store', () => {
    useViewerStore.getState().setComments(mockComments);
    render(<CommentPanel />);

    expect(screen.getByText('Check this capacitor value')).toBeInTheDocument();
    expect(screen.getByText('Overall looks good')).toBeInTheDocument();
    expect(screen.getByText('First comment')).toBeInTheDocument();
  });

  it('displays relative timestamps for comments', () => {
    useViewerStore.getState().setComments(mockComments);
    render(<CommentPanel />);

    // 3 hours ago for Carol (09:00 -> 12:00)
    expect(screen.getByText('3 hours ago')).toBeInTheDocument();
    // 2 hours ago for Alice (10:00 -> 12:00)
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    // 1 hour ago for Bob (11:00 -> 12:00)
    expect(screen.getByText('1 hour ago')).toBeInTheDocument();
  });

  it('displays component refs for anchored comments', () => {
    useViewerStore.getState().setComments(mockComments);
    render(<CommentPanel />);

    expect(screen.getByText(/📍 C1/)).toBeInTheDocument();
    expect(screen.getByText(/📍 R1/)).toBeInTheDocument();
  });

  it('displays General label for non-anchored comments', () => {
    useViewerStore.getState().setComments(mockComments);
    render(<CommentPanel />);

    expect(screen.getByText(/📝 General/)).toBeInTheDocument();
  });

  describe('Add General Comment button (Story 3.3)', () => {
    it('renders Add Comment button in header', () => {
      render(<CommentPanel />);
      expect(screen.getByRole('button', { name: /add.*comment/i })).toBeInTheDocument();
    });

    it('opens GeneralCommentForm when button clicked', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<CommentPanel />);
      await user.click(screen.getByRole('button', { name: /add.*comment/i }));
      expect(screen.getByText(/not attached to any component/i)).toBeInTheDocument();
    });

    it('closes form when Cancel clicked', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<CommentPanel />);
      await user.click(screen.getByRole('button', { name: /add.*comment/i }));
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByText(/not attached to any component/i)).not.toBeInTheDocument();
    });

    it('adds general comment to list on submit', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      useViewerStore.setState({ authorName: 'Alice', comments: [] });

      render(<CommentPanel />);
      await user.click(screen.getByRole('button', { name: /add.*comment/i }));
      await user.type(screen.getByPlaceholderText(/general comment/i), 'Overall looks good');

      // Click the submit button (inside the modal, which is "Add Comment")
      const submitButtons = screen.getAllByRole('button', { name: /add comment/i });
      await user.click(submitButtons[submitButtons.length - 1]); // The last one is the submit button

      // Wait for comment to appear in list
      await waitFor(() => {
        expect(screen.getByText('Overall looks good')).toBeInTheDocument();
      });
    });

    it('closes form after successful submit', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      useViewerStore.setState({ authorName: 'Alice', comments: [] });

      render(<CommentPanel />);
      await user.click(screen.getByRole('button', { name: /add.*comment/i }));
      await user.type(screen.getByPlaceholderText(/general comment/i), 'Feedback');

      const submitButtons = screen.getAllByRole('button', { name: /add comment/i });
      await user.click(submitButtons[submitButtons.length - 1]);

      await waitFor(() => {
        expect(screen.queryByText(/not attached to any component/i)).not.toBeInTheDocument();
      });
    });

    it('has accessible aria-label on button', () => {
      render(<CommentPanel />);
      expect(screen.getByRole('button', { name: /add.*comment/i })).toHaveAccessibleName();
    });

    it('closes form when clicking modal backdrop', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<CommentPanel />);
      await user.click(screen.getByRole('button', { name: /add.*comment/i }));

      // Find the backdrop (the outer div with bg-black class)
      const backdrop = screen.getByText(/not attached to any component/i).closest('.fixed.inset-0');
      // Click on the backdrop itself (not the form)
      await user.click(backdrop as Element);

      expect(screen.queryByText(/not attached to any component/i)).not.toBeInTheDocument();
    });
  });

  describe('Comment filtering (Story 3.4)', () => {
    const mixedComments: Comment[] = [
      {
        id: 'c1',
        author: 'Alice',
        content: 'Open comment 1',
        createdAt: '2026-01-23T09:00:00Z',
        status: 'open',
      },
      {
        id: 'c2',
        author: 'Bob',
        content: 'Resolved comment',
        createdAt: '2026-01-23T10:00:00Z',
        status: 'resolved',
      },
      {
        id: 'c3',
        author: 'Carol',
        content: 'Open comment 2',
        createdAt: '2026-01-23T11:00:00Z',
        status: 'open',
      },
    ];

    it('displays filter dropdown in header', () => {
      useViewerStore.setState({ comments: mixedComments });
      render(<CommentPanel />);
      expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
    });

    it('displays comment counts in header', () => {
      useViewerStore.setState({ comments: mixedComments });
      render(<CommentPanel />);
      expect(screen.getByText(/2 open/i)).toBeInTheDocument();
      expect(screen.getByText(/1 resolved/i)).toBeInTheDocument();
    });

    it('filters comments when Open filter is selected', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      useViewerStore.setState({ comments: mixedComments });
      render(<CommentPanel />);

      // Click filter dropdown
      await user.click(screen.getByRole('button', { name: /all/i }));
      // Select Open filter
      await user.click(screen.getByRole('option', { name: /open/i }));

      // Should show only open comments
      expect(screen.getByText('Open comment 1')).toBeInTheDocument();
      expect(screen.getByText('Open comment 2')).toBeInTheDocument();
      expect(screen.queryByText('Resolved comment')).not.toBeInTheDocument();
    });

    it('filters comments when Resolved filter is selected', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      useViewerStore.setState({ comments: mixedComments });
      render(<CommentPanel />);

      // Click filter dropdown
      await user.click(screen.getByRole('button', { name: /all/i }));
      // Select Resolved filter
      await user.click(screen.getByRole('option', { name: /resolved/i }));

      // Should show only resolved comments
      expect(screen.getByText('Resolved comment')).toBeInTheDocument();
      expect(screen.queryByText('Open comment 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Open comment 2')).not.toBeInTheDocument();
    });

    it('shows all comments when All filter is selected', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      useViewerStore.setState({ comments: mixedComments, commentFilter: 'open' });
      render(<CommentPanel />);

      // Filter should currently be "Open"
      expect(screen.getByRole('button', { name: /open/i })).toBeInTheDocument();

      // Click filter dropdown and select All
      await user.click(screen.getByRole('button', { name: /open/i }));
      await user.click(screen.getByRole('option', { name: /all/i }));

      // Should show all comments
      expect(screen.getByText('Open comment 1')).toBeInTheDocument();
      expect(screen.getByText('Open comment 2')).toBeInTheDocument();
      expect(screen.getByText('Resolved comment')).toBeInTheDocument();
    });

    it('displays Resolve button for open comments', () => {
      useViewerStore.setState({ comments: mixedComments });
      render(<CommentPanel />);
      // Should have 2 Resolve buttons (for 2 open comments)
      const resolveButtons = screen.getAllByRole('button', { name: /resolve/i });
      expect(resolveButtons).toHaveLength(2);
    });

    it('displays Reopen button for resolved comments', () => {
      useViewerStore.setState({ comments: mixedComments });
      render(<CommentPanel />);
      expect(screen.getByRole('button', { name: /reopen/i })).toBeInTheDocument();
    });
  });

  describe('Comment threading (Story 3.5)', () => {
    const commentsWithReplies: Comment[] = [
      {
        id: 'root-1',
        author: 'Alice',
        content: 'Root comment 1',
        createdAt: '2026-01-23T09:00:00Z',
        status: 'open',
        componentRef: 'C1',
      },
      {
        id: 'reply-1',
        author: 'Bob',
        content: 'Reply to root 1',
        createdAt: '2026-01-23T10:00:00Z',
        status: 'open',
        parentId: 'root-1',
      },
      {
        id: 'root-2',
        author: 'Carol',
        content: 'Root comment 2',
        createdAt: '2026-01-23T11:00:00Z',
        status: 'open',
      },
    ];

    it('displays Reply button on root comments', () => {
      useViewerStore.setState({
        comments: commentsWithReplies,
        authorName: 'TestUser',
        commentFilter: 'all',
      });
      render(<CommentPanel />);
      // Should have 2 Reply buttons (for 2 root comments)
      // Buttons have aria-label like "Reply to comment by Alice"
      const replyButtons = screen.getAllByRole('button', { name: /reply to comment/i });
      expect(replyButtons).toHaveLength(2);
    });

    it('displays replies nested under their parent comment', () => {
      useViewerStore.setState({ comments: commentsWithReplies, authorName: 'TestUser' });
      render(<CommentPanel />);
      expect(screen.getByText('Root comment 1')).toBeInTheDocument();
      expect(screen.getByText('Reply to root 1')).toBeInTheDocument();
    });

    it('counts only root comments in header', () => {
      useViewerStore.setState({ comments: commentsWithReplies, authorName: 'TestUser' });
      render(<CommentPanel />);
      // Should count 2 root comments, not the reply
      expect(screen.getByText(/2 open/i)).toBeInTheDocument();
    });

    it('filters show only root comments matching filter', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const mixedWithReplies: Comment[] = [
        {
          id: 'root-open',
          author: 'Alice',
          content: 'Open root',
          createdAt: '2026-01-23T09:00:00Z',
          status: 'open',
        },
        {
          id: 'root-resolved',
          author: 'Bob',
          content: 'Resolved root',
          createdAt: '2026-01-23T10:00:00Z',
          status: 'resolved',
        },
        {
          id: 'reply-to-open',
          author: 'Carol',
          content: 'Reply to open',
          createdAt: '2026-01-23T11:00:00Z',
          status: 'open',
          parentId: 'root-open',
        },
      ];
      useViewerStore.setState({ comments: mixedWithReplies, authorName: 'TestUser' });
      render(<CommentPanel />);

      // Filter to resolved
      await user.click(screen.getByRole('button', { name: /all/i }));
      await user.click(screen.getByRole('option', { name: /resolved/i }));

      // Should show only resolved root comment
      expect(screen.getByText('Resolved root')).toBeInTheDocument();
      expect(screen.queryByText('Open root')).not.toBeInTheDocument();
      expect(screen.queryByText('Reply to open')).not.toBeInTheDocument();
    });

    it('opens reply form when Reply button is clicked', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      useViewerStore.setState({ comments: commentsWithReplies, authorName: 'TestUser' });
      render(<CommentPanel />);

      // Click first Reply button
      const replyButtons = screen.getAllByRole('button', { name: /reply/i });
      await user.click(replyButtons[0]);

      // Reply form should appear
      expect(screen.getByRole('textbox', { name: /reply content/i })).toBeInTheDocument();
    });

    it('submits reply and shows it in thread', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      useViewerStore.setState({
        comments: [commentsWithReplies[0], commentsWithReplies[2]], // Just root comments
        authorName: 'TestUser',
      });
      render(<CommentPanel />);

      // Click first Reply button
      const replyButtons = screen.getAllByRole('button', { name: /reply/i });
      await user.click(replyButtons[0]);

      // Type reply
      await user.type(screen.getByRole('textbox'), 'New reply content');

      // Submit
      await user.click(screen.getByRole('button', { name: /^reply$/i }));

      // Wait for reply to appear
      await waitFor(() => {
        expect(screen.getByText('New reply content')).toBeInTheDocument();
      });
    });
  });
});
