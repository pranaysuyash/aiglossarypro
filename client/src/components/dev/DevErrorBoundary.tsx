import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import ErrorOverlay from './ErrorOverlay';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class DevErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console for debugging
    console.group('🚨 Development Error Boundary');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // In development, also log to any error tracking service
    if (process.env.NODE_ENV === 'development') {
      // Enhanced error logging for development
      const enhancedError = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      console.table(enhancedError);
    }
  }

  handleCloseOverlay = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // In development, show the enhanced error overlay
      if (process.env.NODE_ENV === 'development') {
        const errorInfo = {
          message: this.state.error.message,
          stack: this.state.error.stack,
          filename: this.state.error.stack?.match(/\((.+?):\d+:\d+\)/)?.[1],
          lineno: parseInt(this.state.error.stack?.match(/:(\d+):\d+\)/)?.[1] || '0'),
          colno: parseInt(this.state.error.stack?.match(/:\d+:(\d+)\)/)?.[1] || '0'),
          source: this.state.errorInfo?.componentStack,
        };

        return (
          <>
            {this.props.children}
            <ErrorOverlay error={errorInfo} onClose={this.handleCloseOverlay} />
          </>
        );
      }

      // In production, show fallback UI or custom error component
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
              <p className="text-gray-600 mb-6">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default DevErrorBoundary;
