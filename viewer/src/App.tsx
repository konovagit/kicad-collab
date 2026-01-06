import { Component, type ReactNode } from 'react';

import { SchematicViewer } from '@/components/SchematicViewer';

import './index.css';

/**
 * Error boundary to catch rendering errors and show graceful fallback
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen flex items-center justify-center bg-gray-100" role="alert">
          <div className="text-center max-w-md p-6">
            <div className="text-red-500 text-5xl mb-4">⚠</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              type="button"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Root application component
 * Wraps the SchematicViewer in an error boundary for graceful error handling
 */
export function App() {
  return (
    <ErrorBoundary>
      <SchematicViewer />
    </ErrorBoundary>
  );
}
