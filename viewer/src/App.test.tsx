import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useViewerStore } from '@/stores/viewerStore';

import { App } from './App';

// Sample SVG content for testing
const mockSvgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <title>Test Schematic</title>
  <g data-ref="R1" data-value="10k">
    <rect x="100" y="100" width="60" height="20"/>
  </g>
</svg>
`;

describe('App', () => {
  beforeEach(() => {
    // Reset store state before each test
    useViewerStore.setState({
      svg: null,
      isLoadingSvg: false,
      loadError: null,
      isInitialized: false,
      // Story 2.3 state
      hoveredRef: null,
    });
    // Reset fetch mock
    vi.restoreAllMocks();
  });

  it('renders the SchematicViewer component', async () => {
    // Mock successful fetch
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockSvgContent),
    } as Response);

    render(<App />);

    // Wait for SVG to load
    await waitFor(() => {
      expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
    });

    // SVG should be rendered
    const container = screen.getByTestId('schematic-container');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    // Mock fetch to never resolve
    vi.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => {}));

    render(<App />);

    // Should show loading state
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state when SVG fails to load', async () => {
    // Mock failed fetch
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    render(<App />);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText(/unable to load schematic/i)).toBeInTheDocument();
  });

  it('renders SVG with data-ref attributes for component interaction', async () => {
    // Mock successful fetch
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockSvgContent),
    } as Response);

    render(<App />);

    // Wait for SVG to load
    await waitFor(() => {
      expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
    });

    // data-ref attributes should be preserved for future component interaction
    const container = screen.getByTestId('schematic-container');
    expect(container.querySelector('[data-ref="R1"]')).toBeInTheDocument();
  });
});
