import { useSchematic } from '@/hooks/useSchematic';

/**
 * Main schematic viewer component.
 * Displays the SVG schematic with loading and error states.
 *
 * SVG is rendered inline (not as img) to allow future interactivity
 * with component elements via data-ref attributes.
 */
export function SchematicViewer() {
  const { svg, isLoadingSvg, loadError, reload } = useSchematic();

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

  // Success state - render SVG inline
  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100 p-4">
      <div
        className="max-w-full max-h-full overflow-auto bg-white rounded-lg shadow-lg"
        data-testid="schematic-container"
      >
        {/* SVG rendered inline for future interactivity with data-ref elements */}
        <div className="schematic-svg" dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    </div>
  );
}
