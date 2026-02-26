/**
 * DemoErrorBoundary Component
 * 
 * Error boundary for demo flow steps that catches component errors
 * and displays a fallback UI with the option to skip the problematic step.
 * 
 * Features:
 * - Catches and logs component errors
 * - Displays user-friendly error message
 * - Provides "Skip Step" button to continue demo
 * - Logs errors in development mode only
 */

import { Component, ErrorInfo, ReactNode } from 'react';

interface DemoErrorBoundaryProps {
  /** Child components to wrap with error boundary */
  children: ReactNode;
  /** Callback to skip to next step when error occurs */
  onSkipStep?: () => void;
  /** Step name for error logging */
  stepName?: string;
}

interface DemoErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The error that was caught */
  error: Error | null;
}

/**
 * Error boundary component for demo flow steps
 * 
 * Catches errors in child components and displays a fallback UI
 * that allows users to skip the problematic step and continue the demo.
 */
export class DemoErrorBoundary extends Component<
  DemoErrorBoundaryProps,
  DemoErrorBoundaryState
> {
  constructor(props: DemoErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): DemoErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error details (development mode only)
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.error('Demo Error Boundary caught an error:', {
        stepName: this.props.stepName,
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  /**
   * Handle skip button click
   */
  handleSkip = (): void => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
    });

    // Call skip callback if provided
    if (this.props.onSkipStep) {
      this.props.onSkipStep();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="max-w-md p-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error Message */}
            <h3 className="text-xl font-semibold text-white mb-2">
              Oops! Something went wrong
            </h3>
            <p className="text-white/70 mb-6">
              {this.props.stepName
                ? `There was an error displaying the "${this.props.stepName}" step.`
                : 'There was an error displaying this step.'}
            </p>

            {/* Skip Button */}
            {this.props.onSkipStep && (
              <button
                onClick={this.handleSkip}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all"
              >
                Skip This Step →
              </button>
            )}

            {/* Development Mode Error Details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-white/50 cursor-pointer hover:text-white/70">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 p-4 bg-black/20 rounded text-xs text-white/60 overflow-auto max-h-40">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
