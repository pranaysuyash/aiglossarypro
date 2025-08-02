import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Component, ErrorInfo, ReactNode } from 'react';
// import { createReactError, errorManager, type EnhancedError } from '@aiglossarypro/shared'; // TODO: Fix shared package import

// Temporary fallback until shared package is fixed
interface EnhancedError extends Error {
  type: string;
  severity: string;
  context: any;
  userMessage?: string;
}
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  errorBoundaryName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  enhancedError?: EnhancedError;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Create enhanced error with React context
    // const enhancedError = createReactError(error, errorInfo, { // TODO: Fix shared package import
    //   errorBoundary: this.props.errorBoundaryName || 'ErrorBoundary',
    //   url: window.location.href,
    //   userAgent: navigator.userAgent,
    // });

    const enhancedError: EnhancedError = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      type: 'system',
      severity: 'high',
      context: {
        errorBoundary: this.props.errorBoundaryName || 'ErrorBoundary',
        url: window.location.href,
        userAgent: navigator.userAgent,
      }
    };

    this.setState({
      errorInfo,
      enhancedError
    });

    // Handle through centralized error manager
    // errorManager.handleError(enhancedError); // TODO: Fix shared package import
    console.error('Error caught by boundary:', enhancedError);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-red-900">Something went wrong</CardTitle>
              <CardDescription>
                {this.state.enhancedError?.userMessage || 'We encountered an unexpected error. Please try refreshing the page.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={this.handleRetry}
                className="w-full"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>

              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4 p-3 bg-gray-50 rounded-md text-sm">
                  <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                    Error Details (Development)
                  </summary>
                  <pre className="whitespace-pre-wrap text-xs text-gray-600 overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    if (errorInfo) {
      // React error with component stack
      // const enhancedError = createReactError(error, errorInfo, { // TODO: Fix shared package import
      //   url: window.location.href,
      //   userAgent: navigator.userAgent,
      // });
      // errorManager.handleError(enhancedError);
      console.error('React error in hook:', error, errorInfo);
    } else {
      // Generic error
      // errorManager.handleError(error); // TODO: Fix shared package import
      console.error('Generic error in hook:', error);
    }
  };
}