import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EditCommentForm } from './EditCommentForm';
import type { Comment } from '@/types';

describe('EditCommentForm', () => {
  const mockComment: Comment = {
    id: 'c1',
    author: 'Alice',
    content: 'Original content',
    createdAt: '2026-01-01T00:00:00Z',
    status: 'open',
  };
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with comment content pre-filled', () => {
    render(<EditCommentForm comment={mockComment} onSave={mockOnSave} onCancel={mockOnCancel} />);
    expect(screen.getByRole('textbox')).toHaveValue('Original content');
  });

  it('disables save button when content unchanged', () => {
    render(<EditCommentForm comment={mockComment} onSave={mockOnSave} onCancel={mockOnCancel} />);
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('enables save button when content changed', async () => {
    const user = userEvent.setup();
    render(<EditCommentForm comment={mockComment} onSave={mockOnSave} onCancel={mockOnCancel} />);
    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), 'New content');
    expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
  });

  it('calls onSave with new content on form submit', async () => {
    const user = userEvent.setup();
    render(<EditCommentForm comment={mockComment} onSave={mockOnSave} onCancel={mockOnCancel} />);
    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), 'New content');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(mockOnSave).toHaveBeenCalledWith('New content');
  });

  it('calls onCancel when Cancel clicked', async () => {
    const user = userEvent.setup();
    render(<EditCommentForm comment={mockComment} onSave={mockOnSave} onCancel={mockOnCancel} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('calls onCancel on Escape key', async () => {
    const user = userEvent.setup();
    render(<EditCommentForm comment={mockComment} onSave={mockOnSave} onCancel={mockOnCancel} />);
    await user.keyboard('{Escape}');
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('submits on Ctrl+Enter when content changed', async () => {
    const user = userEvent.setup();
    render(<EditCommentForm comment={mockComment} onSave={mockOnSave} onCancel={mockOnCancel} />);
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'New content{Control>}{Enter}{/Control}');
    expect(mockOnSave).toHaveBeenCalledWith('New content');
  });

  it('submits on Meta+Enter when content changed', async () => {
    const user = userEvent.setup();
    render(<EditCommentForm comment={mockComment} onSave={mockOnSave} onCancel={mockOnCancel} />);
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'New content{Meta>}{Enter}{/Meta}');
    expect(mockOnSave).toHaveBeenCalledWith('New content');
  });

  it('displays error message when error prop provided', () => {
    render(
      <EditCommentForm
        comment={mockComment}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        error="Failed to save"
      />
    );
    expect(screen.getByText('Failed to save')).toBeInTheDocument();
  });

  it('disables buttons when isSubmitting', () => {
    render(
      <EditCommentForm
        comment={mockComment}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isSubmitting
      />
    );
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('disables textarea when isSubmitting', () => {
    render(
      <EditCommentForm
        comment={mockComment}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isSubmitting
      />
    );
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('disables save button when content is empty', async () => {
    const user = userEvent.setup();
    render(<EditCommentForm comment={mockComment} onSave={mockOnSave} onCancel={mockOnCancel} />);
    await user.clear(screen.getByRole('textbox'));
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('does not call onSave when content is whitespace only', async () => {
    const user = userEvent.setup();
    render(<EditCommentForm comment={mockComment} onSave={mockOnSave} onCancel={mockOnCancel} />);
    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), '   ');
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });
});
