import type { Component } from '@/types';

interface TooltipPosition {
  x: number;
  y: number;
}

interface ComponentTooltipProps {
  component: Component;
  position: TooltipPosition;
}

/**
 * Tooltip component that displays component info near the cursor.
 * Story 2.3: Component Hover Highlight
 *
 * Uses fixed positioning with offset from cursor.
 * Uses pointer-events-none to not interfere with hover detection.
 */
export function ComponentTooltip({ component, position }: ComponentTooltipProps) {
  const OFFSET = 12; // pixels from cursor

  return (
    <div
      className="fixed pointer-events-none z-50 px-3 py-1.5 bg-gray-900/95 text-white text-sm rounded-lg shadow-lg"
      style={{
        left: position.x + OFFSET,
        top: position.y + OFFSET,
      }}
      data-testid="component-tooltip"
    >
      <span className="font-medium">{component.ref}</span>
      {component.value && <span className="text-gray-300"> - {component.value}</span>}
    </div>
  );
}
