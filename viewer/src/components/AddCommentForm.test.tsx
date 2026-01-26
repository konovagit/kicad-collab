import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AddCommentForm } from './AddCommentForm';
import { useViewerStore } from '@/stores/viewerStore';

describe('AddCommentForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset store state
    useViewerStore.setState({
      authorName: 'Test User',
      isAddingComment: false,
      addCommentError: null,
    });
  });

  it('displays component ref in header', () => {
    render(
      <AddCommentForm
        componentRef="C12"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    );
    expect(screen.getByText(/Commenting on/)).toBeInTheDocument();
    expect(screen.getByText('C12')).toBeInTheDocument();
  });

  it('shows author input when authorName not set', () => {
    useViewerStore.setState({ authorName: null });
    render(
      <AddCommentForm
        componentRef="C12"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    );
    expect(screen.getByPlaceholderText(/enter your name/i)).toBeInTheDocument();
  });

  it('hides author input when authorName is set', () => {
    render(
      <AddCommentForm
        componentRef="C12"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    );
    expect(screen.queryByPlaceholderText(/enter your name/i)).not.toBeInTheDocument();
  });

  it('auto-focuses textarea on mount', () => {
    render(
      <AddCommentForm
        componentRef="C12"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    );
    expect(screen.getByPlaceholderText(/write your comment/i)).toHaveFocus();
  });

  it('calls onSubmit with content when submitted', async () => {
    const user = userEvent.setup();
    render(
      <AddCommentForm
        componentRef="C12"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    );
    await user.type(screen.getByPlaceholderText(/write your comment/i), 'My comment');
    await user.click(screen.getByRole('button', { name: /add comment/i }));
    expect(mockOnSubmit).toHaveBeenCalledWith('My comment');
  });

  it('trims content whitespace before submit', async () => {
    const user = userEvent.setup();
    render(
      <AddCommentForm
        componentRef="C12"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    );
    await user.type(screen.getByPlaceholderText(/write your comment/i), '  My comment  ');
    await user.click(screen.getByRole('button', { name: /add comment/i }));
    expect(mockOnSubmit).toHaveBeenCalledWith('My comment');
  });

  it('calls onCancel when Cancel clicked', async () => {
    const user = userEvent.setup();
    render(
      <AddCommentForm
        componentRef="C12"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    );
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('calls onCancel when Escape pressed', async () => {
    const user = userEvent.setup();
    render(
      <AddCommentForm
        componentRef="C12"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    );
    await user.keyboard('{Escape}');
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables submit when content is empty', () => {
    render(
      <AddCommentForm
        componentRef="C12"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    );
    expect(screen.getByRole('button', { name: /add comment/i })).toBeDisabled();
  });

  it('disables submit when isSubmitting is true', async () => {
    const user = userEvent.setup();
    render(
      <AddCommentForm
        componentRef="C12"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={true}
      />
    );
    await user.type(screen.getByPlaceholderText(/write your comment/i), 'Content');
    expect(screen.getByRole('button', { name: /adding/i })).toBeDisabled();
  });

  it('shows "Adding..." text when submitting', () => {
    render(
      <AddCommentForm
        componentRef="C12"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={true}
      />
    );
    expect(screen.getByRole('button', { name: /adding/i })).toBeInTheDocument();
  });

  it('disables cancel button when submitting', () => {
    render(
      <AddCommentForm
        componentRef="C12"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={true}
      />
    );
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('saves author name to store when first time submission', async () => {
    const user = userEvent.setup();
    useViewerStore.setState({ authorName: null });

    render(
      <AddCommentForm
        componentRef="C12"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    );

    await user.type(screen.getByPlaceholderText(/enter your name/i), 'Alice');
    await user.type(screen.getByPlaceholderText(/write your comment/i), 'Test comment');
    await user.click(screen.getByRole('button', { name: /add comment/i }));

    expect(useViewerStore.getState().authorName).toBe('Alice');
    expect(mockOnSubmit).toHaveBeenCalledWith('Test comment');
  });

  it('disables submit when author name is empty and not set in store', () => {
    useViewerStore.setState({ authorName: null });
    render(
      <AddCommentForm
        componentRef="C12"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    );

    // Type content but not author name
    const textarea = screen.getByPlaceholderText(/write your comment/i);
    textarea.focus();

    expect(screen.getByRole('button', { name: /add comment/i })).toBeDisabled();
  });

  it('enables submit when content and author name are provided', async () => {
    const user = userEvent.setup();
    useViewerStore.setState({ authorName: null });

    render(
      <AddCommentForm
        componentRef="C12"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    );

    await user.type(screen.getByPlaceholderText(/enter your name/i), 'Alice');
    await user.type(screen.getByPlaceholderText(/write your comment/i), 'Test comment');

    expect(screen.getByRole('button', { name: /add comment/i })).not.toBeDisabled();
  });

  describe('accessibility', () => {
    it('has aria-describedby hint for author name input', () => {
      useViewerStore.setState({ authorName: null });
      render(
        <AddCommentForm
          componentRef="C12"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      const authorInput = screen.getByPlaceholderText(/enter your name/i);
      expect(authorInput).toHaveAttribute('aria-describedby', 'author-name-hint');
      expect(screen.getByText(/saved for future comments/i)).toBeInTheDocument();
    });

    it('has accessible label for comment textarea', () => {
      render(
        <AddCommentForm
          componentRef="C12"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      const textarea = screen.getByPlaceholderText(/write your comment/i);
      expect(textarea).toHaveAttribute('id', 'comment-content');
      // Screen reader only label exists
      expect(screen.getByText('Comment')).toHaveClass('sr-only');
    });
  });
});
