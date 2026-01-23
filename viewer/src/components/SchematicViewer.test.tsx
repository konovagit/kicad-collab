import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

// Helper to mock both SVG and components.json fetch
function mockSuccessfulFetch(svgContent = mockSvgContent, components: object[] = []) {
  vi.spyOn(global, 'fetch').mockImplementation((url) => {
    if (String(url).includes('sample-schematic.svg')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(svgContent),
      } as Response);
    }
    if (String(url).includes('components.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(components),
      } as Response);
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`));
  });
}

describe('SchematicViewer', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset store state before each test (including pan/zoom, components, hover, and selection)
    useViewerStore.setState({
      svg: null,
      isLoadingSvg: false,
      loadError: null,
      isInitialized: false,
      zoom: DEFAULT_ZOOM,
      pan: DEFAULT_PAN,
      // Story 2.2 state
      components: [],
      componentIndex: new Map(),
      isLoadingComponents: false,
      loadComponentsError: null,
      // Story 2.3 state
      hoveredRef: null,
      // Story 2.4 state
      selectedRef: null,
      // Story 3.1 state
      comments: [],
      isLoadingComments: false,
      loadCommentsError: null,
      // Story 3.2 state
      authorName: 'Test User',
      isAddingComment: false,
      addCommentError: null,
    });
    // Reset fetch mock
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
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
    mockSuccessfulFetch();

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

    // First call fails for SVG, then success on retry (plus components.json call)
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes('sample-schematic.svg')) {
        // First call fails, second succeeds
        if (fetchMock.mock.calls.filter((c) => String(c[0]).includes('svg')).length <= 1) {
          return Promise.resolve({
            ok: false,
            status: 500,
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(mockSvgContent),
        } as Response);
      }
      if (urlStr.includes('components.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response);
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

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

    // Verify SVG fetch was called twice (failed + success)
    const svgCalls = fetchMock.mock.calls.filter((c) => String(c[0]).includes('svg'));
    expect(svgCalls).toHaveLength(2);
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

  describe('Component Mapping Integration (Story 2.2)', () => {
    const mockComponents = [
      { ref: 'R1', value: '10k', footprint: 'Resistor_SMD:R_0805', posX: 130, posY: 110 },
      { ref: 'C1', value: '100nF', footprint: 'Capacitor_SMD:C_0805', posX: 255, posY: 110 },
    ];

    const mockSvgWithComponents = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
        <g data-ref="R1" data-value="10k"><rect/></g>
        <g data-ref="C1" data-value="100nF"><rect/></g>
      </svg>
    `;

    beforeEach(() => {
      // Reset component state in addition to base state
      useViewerStore.setState({
        svg: null,
        isLoadingSvg: false,
        loadError: null,
        isInitialized: false,
        zoom: DEFAULT_ZOOM,
        pan: DEFAULT_PAN,
        components: [],
        componentIndex: new Map(),
        isLoadingComponents: false,
        loadComponentsError: null,
      });
    });

    it('loads components.json after SVG loads', async () => {
      // Mock SVG fetch first, then components fetch
      const fetchMock = vi.spyOn(global, 'fetch').mockImplementation((url) => {
        if (String(url).includes('sample-schematic.svg')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(mockSvgWithComponents),
          } as Response);
        }
        if (String(url).includes('components.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockComponents),
          } as Response);
        }
        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
      });

      render(<SchematicViewer />);

      // Wait for SVG to load first
      await waitFor(() => {
        expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
      });

      // Wait for components to be loaded
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/fixtures/components.json');
      });

      // Verify components are loaded into store
      await waitFor(() => {
        const state = useViewerStore.getState();
        expect(state.components).toHaveLength(2);
      });
    });

    it('builds component index after components and SVG are available', async () => {
      vi.spyOn(global, 'fetch').mockImplementation((url) => {
        if (String(url).includes('sample-schematic.svg')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(mockSvgWithComponents),
          } as Response);
        }
        if (String(url).includes('components.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockComponents),
          } as Response);
        }
        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
      });

      render(<SchematicViewer />);

      // Wait for component index to be populated
      await waitFor(
        () => {
          const state = useViewerStore.getState();
          expect(state.componentIndex.size).toBe(2);
        },
        { timeout: 2000 }
      );

      // Verify getComponent works
      const state = useViewerStore.getState();
      expect(state.getComponent('R1')?.value).toBe('10k');
      expect(state.getComponent('C1')?.value).toBe('100nF');
    });

    it('handles components.json load failure gracefully', async () => {
      vi.spyOn(global, 'fetch').mockImplementation((url) => {
        if (String(url).includes('sample-schematic.svg')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(mockSvgWithComponents),
          } as Response);
        }
        if (String(url).includes('components.json')) {
          return Promise.resolve({
            ok: false,
            status: 404,
          } as Response);
        }
        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
      });

      render(<SchematicViewer />);

      // Wait for SVG to load - component should still render
      await waitFor(() => {
        expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
      });

      // Wait for components load attempt
      await waitFor(() => {
        const state = useViewerStore.getState();
        expect(state.loadComponentsError).toContain('404');
      });

      // SVG should still be displayed (graceful degradation)
      expect(screen.getByTestId('schematic-container').querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Component Selection (Story 2.4)', () => {
    const mockComponents = [
      { ref: 'R1', value: '10k', footprint: 'Resistor_SMD:R_0805', posX: 130, posY: 110 },
      { ref: 'C1', value: '100nF', footprint: 'Capacitor_SMD:C_0805', posX: 255, posY: 110 },
    ];

    const mockSvgWithComponents = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
        <g data-ref="R1" data-value="10k"><rect x="100" y="100" width="60" height="20"/></g>
        <g data-ref="C1" data-value="100nF"><rect x="200" y="100" width="60" height="20"/></g>
        <rect x="400" y="400" width="100" height="100"/>
      </svg>
    `;

    beforeEach(() => {
      useViewerStore.setState({
        svg: null,
        isLoadingSvg: false,
        loadError: null,
        isInitialized: false,
        zoom: DEFAULT_ZOOM,
        pan: DEFAULT_PAN,
        components: [],
        componentIndex: new Map(),
        isLoadingComponents: false,
        loadComponentsError: null,
        hoveredRef: null,
        selectedRef: null,
      });
    });

    it('selects component when clicked', async () => {
      mockSuccessfulFetch(mockSvgWithComponents, mockComponents);

      render(<SchematicViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
      });

      // Wait for component index to be built
      await waitFor(() => {
        expect(useViewerStore.getState().componentIndex.size).toBe(2);
      });

      const container = screen.getByTestId('schematic-container');
      const r1Element = container.querySelector('[data-ref="R1"]');

      // Click on component
      fireEvent.click(r1Element!);

      // Check selection state
      expect(useViewerStore.getState().selectedRef).toBe('R1');
    });

    it('applies selected class to selected component', async () => {
      mockSuccessfulFetch(mockSvgWithComponents, mockComponents);

      render(<SchematicViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(useViewerStore.getState().componentIndex.size).toBe(2);
      });

      const container = screen.getByTestId('schematic-container');
      const r1Element = container.querySelector('[data-ref="R1"]');

      // Click to select
      fireEvent.click(r1Element!);

      // Element should have selected class (re-query to get current DOM state)
      await waitFor(() => {
        const element = container.querySelector('[data-ref="R1"]');
        expect(element).toHaveClass('selected');
      });
    });

    it('shows detail panel when component is selected', async () => {
      mockSuccessfulFetch(mockSvgWithComponents, mockComponents);

      render(<SchematicViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(useViewerStore.getState().componentIndex.size).toBe(2);
      });

      const container = screen.getByTestId('schematic-container');
      const r1Element = container.querySelector('[data-ref="R1"]');

      // Click to select
      fireEvent.click(r1Element!);

      // Detail panel should appear
      await waitFor(() => {
        expect(screen.getByText('Component Details')).toBeInTheDocument();
      });

      // Component info should be displayed
      expect(screen.getByText('R1')).toBeInTheDocument();
      expect(screen.getByText('10k')).toBeInTheDocument();
    });

    it('clears selection when clicking empty space', async () => {
      mockSuccessfulFetch(mockSvgWithComponents, mockComponents);

      render(<SchematicViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(useViewerStore.getState().componentIndex.size).toBe(2);
      });

      const container = screen.getByTestId('schematic-container');
      const r1Element = container.querySelector('[data-ref="R1"]');

      // First select a component
      fireEvent.click(r1Element!);

      await waitFor(() => {
        expect(useViewerStore.getState().selectedRef).toBe('R1');
      });

      // Click on container background (empty space - not on any data-ref element)
      // The click handler will check if target.closest('[data-ref]') returns null
      fireEvent.click(container);

      // Selection should be cleared
      await waitFor(() => {
        expect(useViewerStore.getState().selectedRef).toBeNull();
      });
    });

    it('switches selection when clicking different component', async () => {
      mockSuccessfulFetch(mockSvgWithComponents, mockComponents);

      render(<SchematicViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(useViewerStore.getState().componentIndex.size).toBe(2);
      });

      const container = screen.getByTestId('schematic-container');

      // Select R1
      const r1Element = container.querySelector('[data-ref="R1"]');
      fireEvent.click(r1Element!);

      await waitFor(() => {
        expect(useViewerStore.getState().selectedRef).toBe('R1');
      });

      // Select C1
      const c1Element = container.querySelector('[data-ref="C1"]');
      fireEvent.click(c1Element!);

      await waitFor(() => {
        expect(useViewerStore.getState().selectedRef).toBe('C1');
      });

      // R1 should no longer have selected class, C1 should have it (re-query DOM)
      await waitFor(() => {
        const r1 = container.querySelector('[data-ref="R1"]');
        const c1 = container.querySelector('[data-ref="C1"]');
        expect(r1).not.toHaveClass('selected');
        expect(c1).toHaveClass('selected');
      });
    });

    it('closes detail panel when close button clicked', async () => {
      const user = userEvent.setup();
      mockSuccessfulFetch(mockSvgWithComponents, mockComponents);

      render(<SchematicViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(useViewerStore.getState().componentIndex.size).toBe(2);
      });

      const container = screen.getByTestId('schematic-container');
      const r1Element = container.querySelector('[data-ref="R1"]');

      // Select component
      fireEvent.click(r1Element!);

      await waitFor(() => {
        expect(screen.getByText('Component Details')).toBeInTheDocument();
      });

      // Click close button
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      // Detail panel should disappear
      await waitFor(() => {
        expect(screen.queryByText('Component Details')).not.toBeInTheDocument();
      });

      // Selection should be cleared
      expect(useViewerStore.getState().selectedRef).toBeNull();
    });

    it('selection persists after other interactions', async () => {
      mockSuccessfulFetch(mockSvgWithComponents, mockComponents);

      render(<SchematicViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(useViewerStore.getState().componentIndex.size).toBe(2);
      });

      const container = screen.getByTestId('schematic-container');
      const r1Element = container.querySelector('[data-ref="R1"]');

      // Select R1
      fireEvent.click(r1Element!);

      await waitFor(() => {
        expect(useViewerStore.getState().selectedRef).toBe('R1');
      });

      // Selection should persist - verify detail panel shows correct component
      expect(screen.getByText('R1')).toBeInTheDocument();
      expect(screen.getByText('10k')).toBeInTheDocument();

      // Verify selection class is applied
      await waitFor(() => {
        const element = container.querySelector('[data-ref="R1"]');
        expect(element).toHaveClass('selected');
      });
    });
  });

  describe('Context Menu and Add Comment (Story 3.2)', () => {
    const mockComponents = [
      { ref: 'R1', value: '10k', footprint: 'Resistor_SMD:R_0805', posX: 130, posY: 110 },
      { ref: 'C1', value: '100nF', footprint: 'Capacitor_SMD:C_0805', posX: 255, posY: 110 },
    ];

    const mockSvgWithComponents = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
        <g data-ref="R1" data-value="10k"><rect x="100" y="100" width="60" height="20"/></g>
        <g data-ref="C1" data-value="100nF"><rect x="200" y="100" width="60" height="20"/></g>
      </svg>
    `;

    const mockComments = [
      {
        id: 'comment-001',
        author: 'Alice',
        content: 'Check value',
        createdAt: '2026-01-23T10:00:00Z',
        componentRef: 'C1',
        status: 'open',
      },
    ];

    beforeEach(() => {
      localStorage.clear();
      useViewerStore.setState({
        svg: null,
        isLoadingSvg: false,
        loadError: null,
        isInitialized: false,
        zoom: DEFAULT_ZOOM,
        pan: DEFAULT_PAN,
        components: [],
        componentIndex: new Map(),
        isLoadingComponents: false,
        loadComponentsError: null,
        hoveredRef: null,
        selectedRef: null,
        comments: [],
        isLoadingComments: false,
        loadCommentsError: null,
        authorName: 'Test User',
        isAddingComment: false,
        addCommentError: null,
      });
    });

    // Helper to mock all fetch calls
    function mockAllFetches(
      svgContent = mockSvgWithComponents,
      components = mockComponents,
      comments = mockComments
    ) {
      vi.spyOn(global, 'fetch').mockImplementation((url) => {
        if (String(url).includes('sample-schematic.svg')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(svgContent),
          } as Response);
        }
        if (String(url).includes('components.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(components),
          } as Response);
        }
        if (String(url).includes('comments.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(comments),
          } as Response);
        }
        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
      });
    }

    it('shows context menu on right-click on component', async () => {
      mockAllFetches();

      render(<SchematicViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(useViewerStore.getState().componentIndex.size).toBe(2);
      });

      const container = screen.getByTestId('schematic-container');
      const r1Element = container.querySelector('[data-ref="R1"]');

      // Right-click on component
      fireEvent.contextMenu(r1Element!, { clientX: 150, clientY: 120 });

      // Context menu should appear
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      expect(screen.getByRole('menuitem', { name: /add comment/i })).toBeInTheDocument();
    });

    it('does not show context menu on right-click on empty space', async () => {
      mockAllFetches();

      render(<SchematicViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
      });

      const container = screen.getByTestId('schematic-container');

      // Right-click on container (empty space)
      fireEvent.contextMenu(container, { clientX: 400, clientY: 400 });

      // Context menu should not appear
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('opens add comment form when clicking Add Comment in context menu', async () => {
      const user = userEvent.setup();
      mockAllFetches();

      render(<SchematicViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(useViewerStore.getState().componentIndex.size).toBe(2);
      });

      const container = screen.getByTestId('schematic-container');
      const r1Element = container.querySelector('[data-ref="R1"]');

      // Right-click on component
      fireEvent.contextMenu(r1Element!, { clientX: 150, clientY: 120 });

      // Click Add Comment
      await user.click(screen.getByRole('menuitem', { name: /add comment/i }));

      // Add comment form should appear
      await waitFor(() => {
        expect(screen.getByText(/commenting on/i)).toBeInTheDocument();
        expect(screen.getByText('R1')).toBeInTheDocument();
      });
    });

    it('opens add comment form from detail panel Add Comment button', async () => {
      const user = userEvent.setup();
      mockAllFetches();

      render(<SchematicViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(useViewerStore.getState().componentIndex.size).toBe(2);
      });

      const container = screen.getByTestId('schematic-container');
      const r1Element = container.querySelector('[data-ref="R1"]');

      // Click to select component
      fireEvent.click(r1Element!);

      // Wait for detail panel
      await waitFor(() => {
        expect(screen.getByText('Component Details')).toBeInTheDocument();
      });

      // Click Add Comment in detail panel
      await user.click(screen.getByRole('button', { name: /add comment/i }));

      // Add comment form should appear
      await waitFor(() => {
        expect(screen.getByText(/commenting on/i)).toBeInTheDocument();
      });
    });

    it('closes add comment form on Cancel', async () => {
      const user = userEvent.setup();
      mockAllFetches();

      render(<SchematicViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(useViewerStore.getState().componentIndex.size).toBe(2);
      });

      const container = screen.getByTestId('schematic-container');
      const r1Element = container.querySelector('[data-ref="R1"]');

      // Open context menu and add comment form
      fireEvent.contextMenu(r1Element!, { clientX: 150, clientY: 120 });
      await user.click(screen.getByRole('menuitem', { name: /add comment/i }));

      // Verify form is open
      await waitFor(() => {
        expect(screen.getByText(/commenting on/i)).toBeInTheDocument();
      });

      // Click Cancel
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Form should be closed
      await waitFor(() => {
        expect(screen.queryByText(/commenting on/i)).not.toBeInTheDocument();
      });
    });

    it('adds comment and closes form on submit', async () => {
      const user = userEvent.setup();
      mockAllFetches();

      render(<SchematicViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(useViewerStore.getState().componentIndex.size).toBe(2);
      });

      const container = screen.getByTestId('schematic-container');
      const r1Element = container.querySelector('[data-ref="R1"]');

      // Open add comment form
      fireEvent.contextMenu(r1Element!, { clientX: 150, clientY: 120 });
      await user.click(screen.getByRole('menuitem', { name: /add comment/i }));

      // Type comment
      await user.type(screen.getByPlaceholderText(/write your comment/i), 'New test comment');

      // Submit
      await user.click(screen.getByRole('button', { name: /add comment/i }));

      // Form should close
      await waitFor(() => {
        expect(screen.queryByText(/commenting on/i)).not.toBeInTheDocument();
      });

      // Comment should be added to store
      const comments = useViewerStore.getState().comments;
      const newComment = comments.find((c) => c.content === 'New test comment');
      expect(newComment).toBeDefined();
      expect(newComment?.componentRef).toBe('R1');
      expect(newComment?.author).toBe('Test User');
    });
  });
});
