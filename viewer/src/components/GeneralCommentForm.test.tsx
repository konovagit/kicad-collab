import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { GeneralCommentForm } from './GeneralCommentForm';
import { useViewerStore } from '@/stores/viewerStore';

describe('GeneralCommentForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useViewerStore.setState({
      authorName: 'Test User',
      isAddingComment: false,
      addCommentError: null,
    });
  });

  it('displays "General Comment" in header', () => {
    render(
      <GeneralCommentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />
    );
    expect(screen.getByText(/General Comment/i)).toBeInTheDocument();
  });

  it('does NOT display component reference', () => {
    render(
      <GeneralCommentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />
    );
    expect(screen.queryByText(/Commenting on/i)).not.toBeInTheDocument();
  });

  it('shows explanation that comment is not attached to component', () => {
    render(
      <GeneralCommentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />
    );
    expect(screen.getByText(/not attached to any component/i)).toBeInTheDocument();
  });

  it('shows author input when authorName not set', () => {
    useViewerStore.setState({ authorName: null });
    render(
      <GeneralCommentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />
    );
    expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument();
  });

  it('hides author input when authorName is set', () => {
    render(
      <GeneralCommentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />
    );
    expect(screen.queryByPlaceholderText(/your name/i)).not.toBeInTheDocument();
  });

  it('auto-focuses textarea on mount', () => {
    render(
      <GeneralCommentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />
    );
    expect(screen.getByPlaceholderText(/general comment/i)).toHaveFocus();
  });

  it('calls onSubmit with content when submitted', async () => {
    const user = userEvent.setup();
    render(
      <GeneralCommentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />
    );
    await user.type(screen.getByPlaceholderText(/general comment/i), 'My feedback');
    await user.click(screen.getByRole('button', { name: /add comment/i }));
    expect(mockOnSubmit).toHaveBeenCalledWith('My feedback');
  });

  it('calls onCancel when Cancel clicked', async () => {
    const user = userEvent.setup();
    render(
      <GeneralCommentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />
    );
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('calls onCancel when Escape pressed', async () => {
    const user = userEvent.setup();
    render(
      <GeneralCommentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />
    );
    await user.keyboard('{Escape}');
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables submit when content is empty', () => {
    render(
      <GeneralCommentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />
    );
    expect(screen.getByRole('button', { name: /add comment/i })).toBeDisabled();
  });

  it('disables submit when isSubmitting is true', async () => {
    const user = userEvent.setup();
    render(
      <GeneralCommentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={true} />
    );
    await user.type(screen.getByPlaceholderText(/general comment/i), 'Content');
    expect(screen.getByRole('button', { name: /adding/i })).toBeDisabled();
  });

  it('trims content before submission', async () => {
    const user = userEvent.setup();
    render(
      <GeneralCommentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />
    );
    await user.type(screen.getByPlaceholderText(/general comment/i), '  Trimmed content  ');
    await user.click(screen.getByRole('button', { name: /add comment/i }));
    expect(mockOnSubmit).toHaveBeenCalledWith('Trimmed content');
  });

  it('displays error message when error prop is provided', () => {
    render(
      <GeneralCommentForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
        error="Failed to add comment"
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to add comment');
  });

  it('does not display error when error prop is null', () => {
    render(
      <GeneralCommentForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
        error={null}
      />
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
