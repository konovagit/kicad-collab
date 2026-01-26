import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { ReplyForm } from './ReplyForm';

describe('ReplyForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders textarea and buttons', () => {
    render(<ReplyForm parentId="1" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    expect(screen.getByRole('textbox', { name: /reply content/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reply/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('disables submit button when content is empty', () => {
    render(<ReplyForm parentId="1" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    expect(screen.getByRole('button', { name: /reply/i })).toBeDisabled();
  });

  it('enables submit button when content is entered', async () => {
    const user = userEvent.setup();
    render(<ReplyForm parentId="1" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await user.type(screen.getByRole('textbox'), 'My reply');
    expect(screen.getByRole('button', { name: /reply/i })).toBeEnabled();
  });

  it('calls onSubmit with trimmed content', async () => {
    const user = userEvent.setup();
    render(<ReplyForm parentId="1" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await user.type(screen.getByRole('textbox'), '  My reply  ');
    await user.click(screen.getByRole('button', { name: /reply/i }));
    expect(mockOnSubmit).toHaveBeenCalledWith('My reply');
  });

  it('calls onCancel when Cancel clicked', async () => {
    const user = userEvent.setup();
    render(<ReplyForm parentId="1" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('calls onCancel on Escape key', async () => {
    const user = userEvent.setup();
    render(<ReplyForm parentId="1" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await user.keyboard('{Escape}');
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('submits on Ctrl+Enter', async () => {
    const user = userEvent.setup();
    render(<ReplyForm parentId="1" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'My reply');
    await user.type(textarea, '{Control>}{Enter}{/Control}');
    expect(mockOnSubmit).toHaveBeenCalledWith('My reply');
  });

  it('submits on Cmd+Enter (macOS)', async () => {
    const user = userEvent.setup();
    render(<ReplyForm parentId="1" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'My reply');
    await user.type(textarea, '{Meta>}{Enter}{/Meta}');
    expect(mockOnSubmit).toHaveBeenCalledWith('My reply');
  });

  it('displays error message when error prop provided', () => {
    render(
      <ReplyForm
        parentId="1"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        error="Failed to add reply"
      />
    );
    expect(screen.getByText('Failed to add reply')).toBeInTheDocument();
  });

  it('disables submit button when isSubmitting is true', async () => {
    const user = userEvent.setup();
    render(
      <ReplyForm parentId="1" onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={true} />
    );
    await user.type(screen.getByRole('textbox'), 'My reply');
    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
  });

  it('disables textarea when isSubmitting is true', () => {
    render(
      <ReplyForm parentId="1" onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={true} />
    );
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('focuses textarea on mount', () => {
    render(<ReplyForm parentId="1" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('does not submit when content is whitespace only', async () => {
    const user = userEvent.setup();
    render(<ReplyForm parentId="1" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await user.type(screen.getByRole('textbox'), '   ');
    expect(screen.getByRole('button', { name: /reply/i })).toBeDisabled();
  });
});
