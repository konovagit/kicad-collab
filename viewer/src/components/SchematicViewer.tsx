import { useCallback, useEffect, useRef, useState } from 'react';

import { useComponentMapping } from '@/hooks/useComponentMapping';
import { useComponentHover } from '@/hooks/useComponentHover';
import { usePanZoom } from '@/hooks/usePanZoom';
import { useSchematic } from '@/hooks/useSchematic';
import { useViewerStore } from '@/stores/viewerStore';

import { ComponentTooltip } from './ComponentTooltip';

/**
 * Main schematic viewer component.
 * Displays the SVG schematic with loading and error states.
 * Supports pan (drag) and zoom (scroll) interactions.
 *
 * SVG is rendered inline (not as img) to allow future interactivity
 * with component elements via data-ref attributes.
 *
 * Uses CSS transform on wrapper div (not SVG viewBox) for GPU-accelerated rendering.
 *
 * Story 2.2: Integrates component mapping for SVG element to component data linking.
 */
export function SchematicViewer() {
  const { svg, isLoadingSvg, loadError, reload } = useSchematic();
  const {
    zoom,
    pan,
    isDragging,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave: handlePanZoomMouseLeave,
    resetView,
  } = usePanZoom();

  // Story 2.2: Component mapping - loads components.json and builds index
  // The hook handles loading after SVG is available and logs warnings in dev mode
  useComponentMapping();

  // Story 2.3: Component hover state management
  const { hoveredRef, handleMouseEnter, handleMouseLeave: clearHover } = useComponentHover();
  const getComponent = useViewerStore((s) => s.getComponent);

  // Track mouse position for tooltip
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Ref to the SVG container for DOM manipulation
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // Story 2.3: Apply/remove .hovered class when hoveredRef changes
  useEffect(() => {
    if (!svgContainerRef.current) return;

    // Remove previous highlight
    const prevHighlighted = svgContainerRef.current.querySelector('.hovered');
    if (prevHighlighted) {
      prevHighlighted.classList.remove('hovered');
    }

    // Add highlight to current hovered element
    if (hoveredRef) {
      const element = svgContainerRef.current.querySelector(`[data-ref="${hoveredRef}"]`);
      if (element) {
        element.classList.add('hovered');
      }
    }
  }, [hoveredRef]);

  // Story 2.3: Event delegation for hover detection
  const handleSvgMouseOver = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as Element;
      const componentEl = target.closest('[data-ref]');

      if (componentEl) {
        const ref = componentEl.getAttribute('data-ref');
        if (ref && ref !== hoveredRef) {
          handleMouseEnter(ref);
        }
      }
    },
    [hoveredRef, handleMouseEnter]
  );

  const handleSvgMouseOut = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as Element;
      const relatedTarget = e.relatedTarget as Element | null;

      // Only clear if leaving all data-ref elements
      if (target.closest('[data-ref]') && !relatedTarget?.closest('[data-ref]')) {
        clearHover();
      }
    },
    [clearHover]
  );

  // Track mouse position for tooltip
  const handleSvgMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Update mouse position for tooltip
      setMousePosition({ x: e.clientX, y: e.clientY });

      // Also call pan/zoom mouse move handler
      handleMouseMove(e);
    },
    [handleMouseMove]
  );

  // Combined mouse leave handler for pan/zoom and hover
  const handleContainerMouseLeave = useCallback(() => {
    handlePanZoomMouseLeave();
    clearHover();
  }, [handlePanZoomMouseLeave, clearHover]);

  // Get hovered component data for tooltip
  const hoveredComponent = hoveredRef ? getComponent(hoveredRef) : null;

  // Loading state
  if (isLoadingSvg) {
    return (
      <div
        className="w-full h-screen flex items-center justify-center bg-gray-100"
        role="status"
        aria-label="Loading schematic"
      >
        <div className="text-center">
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"
            role="progressbar"
          />
          <p className="mt-4 text-gray-600">Loading schematic...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div
        className="w-full h-screen flex items-center justify-center bg-gray-100"
        role="alert"
        aria-label="Error loading schematic"
      >
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 text-5xl mb-4">⚠</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Schematic</h2>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <div className="text-sm text-gray-500 mb-4">
            <p>Please check that:</p>
            <ul className="list-disc list-inside mt-2 text-left">
              <li>The schematic file exists in the expected location</li>
              <li>The file is a valid SVG format</li>
              <li>You have permission to access the file</li>
            </ul>
          </div>
          <button
            onClick={() => reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            type="button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No SVG yet (should not happen in normal flow)
  if (!svg) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">No schematic loaded</p>
      </div>
    );
  }

  // Success state - render SVG inline with pan/zoom support
  return (
    <div className="relative w-full h-screen bg-gray-100 overflow-hidden">
      {/* Pan/Zoom container - captures all mouse events */}
      <div
        className="w-full h-full overflow-hidden"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        data-testid="schematic-container"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleSvgMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleContainerMouseLeave}
        onMouseOver={handleSvgMouseOver}
        onMouseOut={handleSvgMouseOut}
      >
        {/* Transform wrapper - applies pan and zoom via CSS transform */}
        <div
          className="transform-gpu origin-top-left w-full h-full flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
          data-testid="schematic-transform-wrapper"
        >
          {/* SVG rendered inline for future interactivity with data-ref elements */}
          <div
            ref={svgContainerRef}
            className="schematic-svg bg-white rounded-lg shadow-lg p-4"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      </div>

      {/* Component tooltip (Story 2.3) */}
      {hoveredComponent && (
        <ComponentTooltip component={hoveredComponent} position={mousePosition} />
      )}

      {/* Zoom controls overlay */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/90 rounded-lg shadow-md px-3 py-2">
        <span
          className="text-sm text-gray-600 min-w-[3rem] text-center"
          data-testid="zoom-indicator"
        >
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={resetView}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          type="button"
          aria-label="Fit to screen"
        >
          Fit
        </button>
      </div>
    </div>
  );
}
