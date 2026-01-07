import { useCallback, useState } from 'react';

import { MAX_ZOOM, MIN_ZOOM, useViewerStore } from '@/stores/viewerStore';

/**
 * Hook for pan/zoom functionality on schematic viewer.
 * Provides event handlers for wheel (zoom) and mouse (pan) events.
 *
 * Uses CSS transform on wrapper (not SVG viewBox) for GPU-accelerated rendering.
 */
export function usePanZoom() {
  // Use specific selectors to prevent unnecessary re-renders
  const zoom = useViewerStore((s) => s.zoom);
  const pan = useViewerStore((s) => s.pan);
  const setZoom = useViewerStore((s) => s.setZoom);
  const setPan = useViewerStore((s) => s.setPan);
  const resetView = useViewerStore((s) => s.resetView);

  // Local drag state (not in global store since it's transient)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  /**
   * Handle mouse wheel for zoom centered on cursor position.
   * Zoom amount is 10% per scroll step.
   */
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();

      const rect = e.currentTarget.getBoundingClientRect();

      // Cursor position relative to container
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      // Calculate new zoom (10% per scroll step)
      const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(Math.max(zoom * zoomDelta, MIN_ZOOM), MAX_ZOOM);

      // Adjust pan to keep cursor position stable during zoom
      const scale = newZoom / zoom;
      const newPanX = cursorX - (cursorX - pan.x) * scale;
      const newPanY = cursorY - (cursorY - pan.y) * scale;

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    },
    [zoom, pan, setZoom, setPan]
  );

  /**
   * Start dragging on mouse down (left click only).
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only handle left click
      if (e.button !== 0) return;

      setIsDragging(true);
      setDragStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      });
    },
    [pan]
  );

  /**
   * Update pan position during drag.
   */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging) return;

      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart, setPan]
  );

  /**
   * End dragging on mouse up.
   */
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Cancel drag if mouse leaves the container.
   */
  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return {
    // State
    zoom,
    pan,
    isDragging,

    // Event handlers
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,

    // Actions
    resetView,
  };
}
