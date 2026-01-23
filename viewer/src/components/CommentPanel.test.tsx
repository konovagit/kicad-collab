import { render, screen } from '@testing-library/react';
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
});
