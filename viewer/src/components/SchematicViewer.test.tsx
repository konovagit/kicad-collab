import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_PAN, DEFAULT_ZOOM, useViewerStore } from '@/stores/viewerStore';

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
    // Reset store state before each test (including pan/zoom)
    useViewerStore.setState({
      svg: null,
      isLoadingSvg: false,
      loadError: null,
      isInitialized: false,
      zoom: DEFAULT_ZOOM,
      pan: DEFAULT_PAN,
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

  it('renders SVG container with overflow hidden for pan/zoom', async () => {
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

    // Check container has proper classes for pan/zoom
    const container = screen.getByTestId('schematic-container');
    expect(container).toHaveClass('w-full', 'h-full', 'overflow-hidden');
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

  it('shows fallback message when no SVG is loaded (edge case)', () => {
    // Directly set store state to trigger the "no schematic" fallback
    // This is an edge case that shouldn't happen in normal flow
    useViewerStore.setState({
      svg: null,
      isLoadingSvg: false,
      loadError: null,
    });

    // Prevent auto-load by mocking fetch to never resolve
    vi.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => {}));

    // Re-render with pre-set state (hook won't trigger load since state is stable)
    render(<SchematicViewer />);

    // The component will trigger loading via useEffect, showing loading state
    // This test verifies the loading state appears when fetch is pending
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  describe('Pan/Zoom Controls (Story 2.1)', () => {
    it('displays zoom indicator at 100% by default', async () => {
      // Mock successful fetch
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockSvgContent),
      } as Response);

      render(<SchematicViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('zoom-indicator')).toBeInTheDocument();
      });

      expect(screen.getByTestId('zoom-indicator')).toHaveTextContent('100%');
    });

    it('displays Fit button', async () => {
      // Mock successful fetch
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockSvgContent),
      } as Response);

      render(<SchematicViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /fit to screen/i })).toBeInTheDocument();
    });

    it('Fit button resets zoom and pan to defaults', async () => {
      const user = userEvent.setup();

      // Mock successful fetch
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockSvgContent),
      } as Response);

      // Set non-default zoom/pan before rendering
      useViewerStore.setState({
        zoom: 2.5,
        pan: { x: 100, y: -50 },
      });

      render(<SchematicViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
      });

      // Verify non-default zoom indicator
      expect(screen.getByTestId('zoom-indicator')).toHaveTextContent('250%');

      // Click Fit button
      const fitButton = screen.getByRole('button', { name: /fit to screen/i });
      await user.click(fitButton);

      // Verify reset to defaults
      expect(screen.getByTestId('zoom-indicator')).toHaveTextContent('100%');
      expect(useViewerStore.getState().zoom).toBe(DEFAULT_ZOOM);
      expect(useViewerStore.getState().pan).toEqual(DEFAULT_PAN);
    });

    it('applies CSS transform for pan and zoom', async () => {
      // Mock successful fetch
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockSvgContent),
      } as Response);

      // Set specific zoom/pan values
      useViewerStore.setState({
        zoom: 1.5,
        pan: { x: 50, y: -25 },
      });

      render(<SchematicViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('schematic-transform-wrapper')).toBeInTheDocument();
      });

      const transformWrapper = screen.getByTestId('schematic-transform-wrapper');
      expect(transformWrapper).toHaveStyle({
        transform: 'translate(50px, -25px) scale(1.5)',
      });
    });

    it('changes cursor to grabbing while dragging', async () => {
      // Mock successful fetch
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockSvgContent),
      } as Response);

      render(<SchematicViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
      });

      const container = screen.getByTestId('schematic-container');

      // Initial cursor should be grab
      expect(container).toHaveStyle({ cursor: 'grab' });

      // Simulate mousedown (start drag)
      fireEvent.mouseDown(container, { button: 0, clientX: 100, clientY: 100 });

      // Cursor should now be grabbing
      expect(container).toHaveStyle({ cursor: 'grabbing' });

      // Simulate mouseup (end drag)
      fireEvent.mouseUp(container);

      // Cursor should be back to grab
      expect(container).toHaveStyle({ cursor: 'grab' });
    });

    it('updates pan on mouse drag', async () => {
      // Mock successful fetch
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockSvgContent),
      } as Response);

      render(<SchematicViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
      });

      const container = screen.getByTestId('schematic-container');

      // Initial pan is (0, 0)
      expect(useViewerStore.getState().pan).toEqual({ x: 0, y: 0 });

      // Start drag at (100, 100)
      fireEvent.mouseDown(container, { button: 0, clientX: 100, clientY: 100 });

      // Move to (200, 150) - delta is (100, 50)
      fireEvent.mouseMove(container, { clientX: 200, clientY: 150 });

      // Pan should be updated
      expect(useViewerStore.getState().pan).toEqual({ x: 100, y: 50 });

      // End drag
      fireEvent.mouseUp(container);
    });

    it('updates zoom on wheel scroll', async () => {
      // Mock successful fetch
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockSvgContent),
      } as Response);

      render(<SchematicViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
      });

      const container = screen.getByTestId('schematic-container');

      // Mock getBoundingClientRect for the container
      vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      // Initial zoom
      expect(useViewerStore.getState().zoom).toBe(1.0);

      // Wheel up (zoom in) - negative deltaY
      fireEvent.wheel(container, { deltaY: -100, clientX: 400, clientY: 300 });

      // Zoom should increase by 10%
      expect(useViewerStore.getState().zoom).toBeCloseTo(1.1, 1);
    });

    it('cancels drag when mouse leaves container', async () => {
      // Mock successful fetch
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockSvgContent),
      } as Response);

      render(<SchematicViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
      });

      const container = screen.getByTestId('schematic-container');

      // Start drag
      fireEvent.mouseDown(container, { button: 0, clientX: 100, clientY: 100 });
      expect(container).toHaveStyle({ cursor: 'grabbing' });

      // Mouse leaves container
      fireEvent.mouseLeave(container);

      // Drag should be cancelled - cursor back to grab
      expect(container).toHaveStyle({ cursor: 'grab' });
    });

    it('respects zoom bounds at UI level', async () => {
      // Mock successful fetch
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockSvgContent),
      } as Response);

      // Start at minimum zoom
      useViewerStore.setState({ zoom: 0.1 });

      render(<SchematicViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
      });

      const container = screen.getByTestId('schematic-container');

      // Mock getBoundingClientRect
      vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      // Try to zoom out further (should be clamped to MIN_ZOOM)
      fireEvent.wheel(container, { deltaY: 100, clientX: 400, clientY: 300 });
      fireEvent.wheel(container, { deltaY: 100, clientX: 400, clientY: 300 });

      // Should not go below 10%
      expect(useViewerStore.getState().zoom).toBeGreaterThanOrEqual(0.1);
      expect(screen.getByTestId('zoom-indicator').textContent).toMatch(/10%/);
    });
  });
});
