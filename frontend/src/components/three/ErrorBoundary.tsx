import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ThreeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ThreeJS Error Boundary caught an error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[300px] bg-gradient-to-br from-navy-900 to-navy-800 rounded-xl text-center p-8">
          <div className="text-cyan-400 mb-4">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="text-white text-xl font-semibold mb-2">3D Scene Unavailable</h3>
          <p className="text-slate-400 text-sm mb-4">
            Your browser may not support WebGL or an error occurred loading the 3D scene.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm transition-colors"
          >
            Try Again
          </button>
          {(import.meta as any).env?.DEV && this.state.error && (
            <details className="mt-4 text-left">
              <summary className="text-slate-500 text-xs cursor-pointer">Error Details</summary>
              <pre className="text-red-400 text-xs mt-2 p-2 bg-black/30 rounded overflow-auto max-w-sm">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ThreeErrorBoundary;
