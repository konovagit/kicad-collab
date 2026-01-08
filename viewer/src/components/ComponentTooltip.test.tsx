import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Component } from '@/types';

import { ComponentTooltip } from './ComponentTooltip';

describe('ComponentTooltip', () => {
  const basePosition = { x: 100, y: 100 };

  it('displays component ref', () => {
    const component: Component = {
      ref: 'R1',
      value: '10k',
      footprint: 'Resistor_SMD:R_0805',
      posX: 130,
      posY: 110,
    };

    render(<ComponentTooltip component={component} position={basePosition} />);

    expect(screen.getByText('R1')).toBeInTheDocument();
  });

  it('displays component value after ref', () => {
    const component: Component = {
      ref: 'R1',
      value: '10k',
      footprint: 'Resistor_SMD:R_0805',
      posX: 130,
      posY: 110,
    };

    render(<ComponentTooltip component={component} position={basePosition} />);

    expect(screen.getByText('R1')).toBeInTheDocument();
    expect(screen.getByText(/- 10k/)).toBeInTheDocument();
  });

  it('handles component without value', () => {
    const component: Component = {
      ref: 'GND1',
      footprint: 'Symbol:GND',
      posX: 100,
      posY: 200,
    };

    render(<ComponentTooltip component={component} position={basePosition} />);

    expect(screen.getByText('GND1')).toBeInTheDocument();
    // Should not show the dash or value
    expect(screen.queryByText(/-/)).not.toBeInTheDocument();
  });

  it('positions tooltip at cursor position with offset', () => {
    const component: Component = {
      ref: 'R1',
      value: '10k',
      footprint: 'Resistor_SMD:R_0805',
      posX: 130,
      posY: 110,
    };
    const position = { x: 200, y: 300 };

    render(<ComponentTooltip component={component} position={position} />);

    const tooltip = screen.getByTestId('component-tooltip');
    // Offset is 12px from cursor
    expect(tooltip).toHaveStyle({ left: '212px', top: '312px' });
  });

  it('has pointer-events-none to not interfere with hover', () => {
    const component: Component = {
      ref: 'R1',
      value: '10k',
      footprint: 'Resistor_SMD:R_0805',
      posX: 130,
      posY: 110,
    };

    render(<ComponentTooltip component={component} position={basePosition} />);

    const tooltip = screen.getByTestId('component-tooltip');
    expect(tooltip).toHaveClass('pointer-events-none');
  });

  it('has fixed positioning', () => {
    const component: Component = {
      ref: 'R1',
      value: '10k',
      footprint: 'Resistor_SMD:R_0805',
      posX: 130,
      posY: 110,
    };

    render(<ComponentTooltip component={component} position={basePosition} />);

    const tooltip = screen.getByTestId('component-tooltip');
    expect(tooltip).toHaveClass('fixed');
  });

  it('has high z-index for visibility', () => {
    const component: Component = {
      ref: 'R1',
      value: '10k',
      footprint: 'Resistor_SMD:R_0805',
      posX: 130,
      posY: 110,
    };

    render(<ComponentTooltip component={component} position={basePosition} />);

    const tooltip = screen.getByTestId('component-tooltip');
    expect(tooltip).toHaveClass('z-50');
  });
});
