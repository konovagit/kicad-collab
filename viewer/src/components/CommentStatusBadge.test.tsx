import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CommentStatusBadge } from './CommentStatusBadge';

describe('CommentStatusBadge', () => {
  it('displays "Open" text for open status', () => {
    render(<CommentStatusBadge status="open" />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('displays "Resolved" text for resolved status', () => {
    render(<CommentStatusBadge status="resolved" />);
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('applies blue styling for open status', () => {
    const { container } = render(<CommentStatusBadge status="open" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('bg-blue-100');
    expect(badge).toHaveClass('text-blue-700');
  });

  it('applies green styling for resolved status', () => {
    const { container } = render(<CommentStatusBadge status="resolved" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-700');
  });
});
