import { render, screen, waitFor, act } from '@testing-library/react';
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

// Sample comments for testing
const mockComments = [
  {
    id: 'comment-001',
    author: 'Alice',
    content: 'Test comment',
    createdAt: '2026-01-23T10:00:00Z',
    componentRef: 'R1',
    status: 'open',
  },
  {
    id: 'comment-002',
    author: 'Bob',
    content: 'General comment',
    createdAt: '2026-01-23T11:00:00Z',
    status: 'open',
  },
];

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
      // Story 3.1 state
      comments: [],
      isLoadingComments: false,
      loadCommentsError: null,
      selectedRef: null,
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

  describe('Comment Panel Integration (Story 3.1)', () => {
    it('loads comments on app initialization', async () => {
      // Mock SVG fetch
      vi.spyOn(global, 'fetch').mockImplementation((url) => {
        if ((url as string).includes('schematic')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(mockSvgContent),
          } as Response);
        }
        // Mock comments fetch
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockComments),
        } as Response);
      });

      render(<App />);

      // Wait for comments to load
      await waitFor(() => {
        const state = useViewerStore.getState();
        expect(state.comments).toHaveLength(2);
      });
    });

    it('displays comment panel when no component is selected', async () => {
      // Mock fetch to return both SVG and comments
      vi.spyOn(global, 'fetch').mockImplementation((url) => {
        if ((url as string).includes('schematic')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(mockSvgContent),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockComments),
        } as Response);
      });

      render(<App />);

      // Wait for app to initialize
      await waitFor(() => {
        expect(screen.getByTestId('schematic-container')).toBeInTheDocument();
      });

      // Comment panel should be visible
      await waitFor(() => {
        expect(screen.getByText('Comments')).toBeInTheDocument();
      });
    });

    it('displays comments in the panel', async () => {
      // Mock fetch
      vi.spyOn(global, 'fetch').mockImplementation((url) => {
        if ((url as string).includes('schematic')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(mockSvgContent),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockComments),
        } as Response);
      });

      render(<App />);

      // Wait for comments to appear
      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
      });
    });

    it('hides comment panel when component is selected', async () => {
      // Mock fetch
      vi.spyOn(global, 'fetch').mockImplementation((url) => {
        if ((url as string).includes('schematic')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(mockSvgContent),
          } as Response);
        }
        if ((url as string).includes('components')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve([
                { ref: 'R1', value: '10k', footprint: 'Resistor', posX: 100, posY: 100 },
              ]),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockComments),
        } as Response);
      });

      render(<App />);

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByText('Comments')).toBeInTheDocument();
      });

      // Select a component - ComponentDetailPanel should replace CommentPanel
      // We need to set both selectedRef AND componentIndex
      const componentIndex = new Map([
        ['R1', { ref: 'R1', value: '10k', footprint: 'Resistor', posX: 100, posY: 100 }],
      ]);
      act(() => {
        useViewerStore.setState({ selectedRef: 'R1', componentIndex });
      });

      // Check that ComponentDetailPanel is shown (via its unique heading)
      await waitFor(() => {
        expect(screen.getByText('Component Details')).toBeInTheDocument();
      });
    });

    it('shows empty state when no comments exist', async () => {
      // Mock fetch to return empty comments
      vi.spyOn(global, 'fetch').mockImplementation((url) => {
        if ((url as string).includes('schematic')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(mockSvgContent),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response);
      });

      render(<App />);

      // Wait for empty state message
      await waitFor(() => {
        expect(screen.getByText('No comments yet')).toBeInTheDocument();
      });
    });
  });
});
