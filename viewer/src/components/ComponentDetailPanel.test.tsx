import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ComponentDetailPanel } from './ComponentDetailPanel';
import type { Component } from '@/types';

describe('ComponentDetailPanel', () => {
  const fullComponent: Component = {
    ref: 'C12',
    value: '100uF',
    footprint: 'Capacitor_SMD:C_0805',
    posX: 150.5,
    posY: 75.2,
  };

  const minimalComponent: Component = {
    ref: 'GND1',
    posX: 0,
    posY: 0,
  };

  describe('rendering', () => {
    it('displays the panel header', () => {
      render(<ComponentDetailPanel component={fullComponent} onClose={vi.fn()} />);
      expect(screen.getByText('Component Details')).toBeInTheDocument();
    });

    it('displays all component fields when present', () => {
      render(<ComponentDetailPanel component={fullComponent} onClose={vi.fn()} />);

      // Reference
      expect(screen.getByText('Reference')).toBeInTheDocument();
      expect(screen.getByText('C12')).toBeInTheDocument();

      // Value
      expect(screen.getByText('Value')).toBeInTheDocument();
      expect(screen.getByText('100uF')).toBeInTheDocument();

      // Footprint
      expect(screen.getByText('Footprint')).toBeInTheDocument();
      expect(screen.getByText('Capacitor_SMD:C_0805')).toBeInTheDocument();

      // Position
      expect(screen.getByText('Position')).toBeInTheDocument();
      expect(screen.getByText('(150.50, 75.20)')).toBeInTheDocument();
    });

    it('handles component without optional fields', () => {
      render(<ComponentDetailPanel component={minimalComponent} onClose={vi.fn()} />);

      // Reference should be present
      expect(screen.getByText('Reference')).toBeInTheDocument();
      expect(screen.getByText('GND1')).toBeInTheDocument();

      // Position should be present
      expect(screen.getByText('Position')).toBeInTheDocument();
      expect(screen.getByText('(0.00, 0.00)')).toBeInTheDocument();

      // Value and Footprint labels should NOT be present
      expect(screen.queryByText('Value')).not.toBeInTheDocument();
      expect(screen.queryByText('Footprint')).not.toBeInTheDocument();
    });

    it('displays component with value but no footprint', () => {
      const componentWithValue: Component = {
        ref: 'R1',
        value: '10k',
        posX: 100,
        posY: 200,
      };
      render(<ComponentDetailPanel component={componentWithValue} onClose={vi.fn()} />);

      expect(screen.getByText('R1')).toBeInTheDocument();
      expect(screen.getByText('10k')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
      expect(screen.queryByText('Footprint')).not.toBeInTheDocument();
    });
  });

  describe('close button', () => {
    it('has a close button with accessible label', () => {
      render(<ComponentDetailPanel component={fullComponent} onClose={vi.fn()} />);
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<ComponentDetailPanel component={fullComponent} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('styling', () => {
    it('has fixed positioning for sidebar layout', () => {
      const { container } = render(
        <ComponentDetailPanel component={fullComponent} onClose={vi.fn()} />
      );
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('fixed');
      expect(panel).toHaveClass('right-0');
    });
  });
});
