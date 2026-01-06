import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useViewerStore } from '@/stores/viewerStore';

import { SchematicViewer } from './SchematicViewer';

// Sample SVG content for testing
const mockSvgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <title>Test Schematic</title>
  <g data-ref="R1" data-value="10k">
    <rect x="100" y="100" width="60" height="20"/>
  </g>
</svg>
`;

describe('SchematicViewer', () => {
  beforeEach(() => {
    // Reset store state before each test
    useViewerStore.setState({
      svg: null,
      isLoadingSvg: false,
      loadError: null,
      isInitialized: false,
    });
    // Reset fetch mock
    vi.restoreAllMocks();
  });

  it('displays loading state while fetching SVG', async () => {
    // Mock fetch to never resolve (simulate slow loading)
    vi.spyOn(global, 'fetch').mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<SchematicViewer />);

    // Should show loading state
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/loading schematic/i)).toBeInTheDocument();
  });

  it('displays the schematic SVG when loaded successfully', async () => {
    // Mock successful fetch
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockSvgContent),
    } as Response);

    render(<SchematicViewer />);

    // Wait for SVG to load
    await waitFor(() => {
      expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
    });

    // SVG content should be rendered inline
    const container = screen.getByTestId('schematic-container');
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelector('[data-ref="R1"]')).toBeInTheDocument();
  });

  it('shows error message when SVG fails to load with HTTP error', async () => {
    // Mock failed fetch with HTTP error
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    render(<SchematicViewer />);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText(/unable to load schematic/i)).toBeInTheDocument();
    expect(screen.getByText(/http 404/i)).toBeInTheDocument();
  });

  it('shows error message when fetch throws network error', async () => {
    // Mock network error
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    render(<SchematicViewer />);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText(/unable to load schematic/i)).toBeInTheDocument();
    expect(screen.getByText(/network error/i)).toBeInTheDocument();
  });

  it('provides actionable error guidance', async () => {
    // Mock failed fetch
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    render(<SchematicViewer />);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Check for actionable guidance
    expect(screen.getByText(/please check that/i)).toBeInTheDocument();
    expect(screen.getByText(/the schematic file exists/i)).toBeInTheDocument();
    expect(screen.getByText(/valid svg format/i)).toBeInTheDocument();
  });

  it('has retry button that reloads the schematic', async () => {
    const user = userEvent.setup();

    // First call fails, second succeeds
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockSvgContent),
      } as Response);

    render(<SchematicViewer />);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    // Wait for SVG to load
    await waitFor(() => {
      expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('renders SVG container with proper styling classes', async () => {
    // Mock successful fetch
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockSvgContent),
    } as Response);

    render(<SchematicViewer />);

    // Wait for SVG to load
    await waitFor(() => {
      expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
    });

    // Check container has proper classes
    const container = screen.getByTestId('schematic-container');
    expect(container).toHaveClass('max-w-full', 'max-h-full', 'overflow-auto');
  });

  it('SVG has data-ref attributes preserved for component interaction', async () => {
    // Mock successful fetch
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockSvgContent),
    } as Response);

    render(<SchematicViewer />);

    // Wait for SVG to load
    await waitFor(() => {
      expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
    });

    // Check data-ref attributes are preserved (critical for Epic 2)
    const container = screen.getByTestId('schematic-container');
    const componentElement = container.querySelector('[data-ref="R1"]');
    expect(componentElement).toBeInTheDocument();
    expect(componentElement).toHaveAttribute('data-value', '10k');
  });
});
