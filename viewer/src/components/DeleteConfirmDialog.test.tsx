import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DeleteConfirmDialog } from './DeleteConfirmDialog';

describe('DeleteConfirmDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not open', () => {
    const { container } = render(
      <DeleteConfirmDialog isOpen={false} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders dialog when open', () => {
    render(<DeleteConfirmDialog isOpen={true} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/delete comment/i)).toBeInTheDocument();
  });

  it('displays comment preview if provided', () => {
    render(
      <DeleteConfirmDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        commentPreview="My comment"
      />
    );
    expect(screen.getByText(/"My comment"/)).toBeInTheDocument();
  });

  it('truncates long comment preview to 50 chars', () => {
    const longComment = 'A'.repeat(100);
    render(
      <DeleteConfirmDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        commentPreview={longComment}
      />
    );
    const truncated = `"${'A'.repeat(50)}..."`;
    expect(screen.getByText(truncated)).toBeInTheDocument();
  });

  it('calls onConfirm when Delete clicked', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmDialog isOpen={true} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />);
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('calls onCancel when Cancel clicked', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmDialog isOpen={true} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('calls onCancel on Escape key', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmDialog isOpen={true} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />);
    await user.keyboard('{Escape}');
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('calls onCancel when clicking backdrop', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmDialog isOpen={true} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />);
    // The backdrop is the outermost element with role="dialog", click on it directly
    // We need to click on the element with the onClick handler (the first child under the portal)
    // The backdrop has the click handler so we need to click outside the inner dialog content
    const dialog = screen.getByRole('dialog');
    // Click directly on the backdrop (dialog element has the handler)
    await user.click(dialog);
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables Delete button when isDeleting', () => {
    render(
      <DeleteConfirmDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting
      />
    );
    expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();
  });

  it('disables Cancel button when isDeleting', () => {
    render(
      <DeleteConfirmDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting
      />
    );
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('has accessible dialog role and aria attributes', () => {
    render(<DeleteConfirmDialog isOpen={true} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'delete-dialog-title');
  });

  it('traps focus within dialog on Tab', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmDialog isOpen={true} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />);

    // Cancel button should be focused initially
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    const deleteButton = screen.getByRole('button', { name: /^delete$/i });
    expect(cancelButton).toHaveFocus();

    // Tab to Delete button
    await user.tab();
    expect(deleteButton).toHaveFocus();

    // Tab again should wrap to Cancel button (focus trap)
    await user.tab();
    expect(cancelButton).toHaveFocus();
  });

  it('traps focus within dialog on Shift+Tab', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmDialog isOpen={true} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />);

    // Cancel button should be focused initially
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    const deleteButton = screen.getByRole('button', { name: /^delete$/i });
    expect(cancelButton).toHaveFocus();

    // Shift+Tab should wrap to Delete button (focus trap)
    await user.tab({ shift: true });
    expect(deleteButton).toHaveFocus();
  });
});
