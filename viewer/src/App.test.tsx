import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('renders the app title', () => {
    render(<App />);
    expect(screen.getByText('KiCad Collab Viewer')).toBeInTheDocument();
  });

  it('renders the development status message', () => {
    render(<App />);
    expect(screen.getByText('Development environment ready')).toBeInTheDocument();
  });
});
