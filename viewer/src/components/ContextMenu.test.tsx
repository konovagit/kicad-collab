import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ContextMenu } from './ContextMenu';

describe('ContextMenu', () => {
  const mockOnAddComment = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders at specified position', () => {
    render(
      <ContextMenu
        position={{ x: 100, y: 200 }}
        componentRef="C12"
        onAddComment={mockOnAddComment}
        onClose={mockOnClose}
      />
    );
    const menu = screen.getByRole('menu');
    expect(menu).toHaveStyle({ left: '100px', top: '200px' });
  });

  it('displays Add Comment option', () => {
    render(
      <ContextMenu
        position={{ x: 100, y: 200 }}
        componentRef="C12"
        onAddComment={mockOnAddComment}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByRole('menuitem', { name: /add comment/i })).toBeInTheDocument();
  });

  it('calls onAddComment and onClose when Add Comment clicked', async () => {
    const user = userEvent.setup();
    render(
      <ContextMenu
        position={{ x: 100, y: 200 }}
        componentRef="C12"
        onAddComment={mockOnAddComment}
        onClose={mockOnClose}
      />
    );
    await user.click(screen.getByRole('menuitem', { name: /add comment/i }));
    expect(mockOnAddComment).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <ContextMenu
          position={{ x: 100, y: 200 }}
          componentRef="C12"
          onAddComment={mockOnAddComment}
          onClose={mockOnClose}
        />
      </div>
    );
    await user.click(screen.getByTestId('outside'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape pressed', async () => {
    const user = userEvent.setup();
    render(
      <ContextMenu
        position={{ x: 100, y: 200 }}
        componentRef="C12"
        onAddComment={mockOnAddComment}
        onClose={mockOnClose}
      />
    );
    await user.keyboard('{Escape}');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('has correct aria label with component ref', () => {
    render(
      <ContextMenu
        position={{ x: 100, y: 200 }}
        componentRef="R5"
        onAddComment={mockOnAddComment}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByRole('menu')).toHaveAttribute('aria-label', 'Context menu for R5');
  });

  it('has fixed positioning', () => {
    render(
      <ContextMenu
        position={{ x: 100, y: 200 }}
        componentRef="C12"
        onAddComment={mockOnAddComment}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByRole('menu')).toHaveClass('fixed');
  });

  it('has high z-index for visibility', () => {
    render(
      <ContextMenu
        position={{ x: 100, y: 200 }}
        componentRef="C12"
        onAddComment={mockOnAddComment}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByRole('menu')).toHaveClass('z-50');
  });
});
