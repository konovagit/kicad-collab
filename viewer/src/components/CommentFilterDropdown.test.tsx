import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { CommentFilterDropdown } from './CommentFilterDropdown';

describe('CommentFilterDropdown', () => {
  const defaultCounts = { total: 5, open: 3, resolved: 2 };
  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays current filter label on button', () => {
    render(
      <CommentFilterDropdown
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
        counts={defaultCounts}
      />
    );
    expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
  });

  it('displays "Open" when filter is open', () => {
    render(
      <CommentFilterDropdown
        currentFilter="open"
        onFilterChange={mockOnFilterChange}
        counts={defaultCounts}
      />
    );
    expect(screen.getByRole('button', { name: /open/i })).toBeInTheDocument();
  });

  it('displays "Resolved" when filter is resolved', () => {
    render(
      <CommentFilterDropdown
        currentFilter="resolved"
        onFilterChange={mockOnFilterChange}
        counts={defaultCounts}
      />
    );
    expect(screen.getByRole('button', { name: /resolved/i })).toBeInTheDocument();
  });

  it('opens dropdown when button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CommentFilterDropdown
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
        counts={defaultCounts}
      />
    );

    // Dropdown should not be visible initially
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    // Click button to open dropdown
    await user.click(screen.getByRole('button'));

    // Dropdown should now be visible
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('shows all three options in dropdown', async () => {
    const user = userEvent.setup();
    render(
      <CommentFilterDropdown
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
        counts={defaultCounts}
      />
    );

    await user.click(screen.getByRole('button'));

    // All three options should be visible
    expect(screen.getByRole('option', { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /open/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /resolved/i })).toBeInTheDocument();
  });

  it('calls onFilterChange when option is selected', async () => {
    const user = userEvent.setup();
    render(
      <CommentFilterDropdown
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
        counts={defaultCounts}
      />
    );

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByRole('option', { name: /open/i }));

    expect(mockOnFilterChange).toHaveBeenCalledWith('open');
  });

  it('closes dropdown after selecting option', async () => {
    const user = userEvent.setup();
    render(
      <CommentFilterDropdown
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
        counts={defaultCounts}
      />
    );

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: /resolved/i }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes dropdown on Escape key', async () => {
    const user = userEvent.setup();
    render(
      <CommentFilterDropdown
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
        counts={defaultCounts}
      />
    );

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <CommentFilterDropdown
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
          counts={defaultCounts}
        />
        <button data-testid="outside-element">Outside</button>
      </div>
    );

    // Open dropdown
    await user.click(screen.getByRole('button', { name: /all/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Click outside the dropdown
    await user.click(screen.getByTestId('outside-element'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
