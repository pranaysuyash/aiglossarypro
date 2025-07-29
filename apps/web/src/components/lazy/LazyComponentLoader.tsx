/**
 * Lazy component loader with optimized loading states and error handling
 * Provides a consistent interface for lazy loading heavy components
 */

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ComponentType, ReactNode, Suspense, lazy } from 'react';

interface LazyLoadOptions {
    loadingMessage?: string;
    loadingDescription?: string;
    errorTitle?: string;
    minLoadingTime?: number; // Minimum loading time to prevent flash
    preloadOnHover?: boolean;
    retryAttempts?: number;
}

interface LazyComponentProps {
    component: () => Promise<{ default: ComponentType<any> }>;
    options?: LazyLoadOptions;
    fallback?: ReactNode;
    children?: ReactNode;
}

// Default loading component
function DefaultLoading({ message, description }: { message?: string; description?: string }) {
    return (
        <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-sm text-gray-600">
                    {message || 'Loading component...'}
                </p>
                {description && (
                    <p className="mt-1 text-xs text-gray-500">{description}</p>
                )}
            </div>
        </div>
    );
}

// Default error component
function DefaultError({
    error,
    retry,
    title = 'Failed to load component'
}: {
    error: Error;
    retry: () => void;
    title?: string;
}) {
    return (
        <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center max-w-md">
                <div className="text-red-500 mb-4">
                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 mb-4">
                    {error.message || 'An unexpected error occurred.'}
                </p>
                <button
                    onClick={retry}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}

// Enhanced lazy component loader
export function LazyComponentLoader({
    component,
    options = {},
    fallback,
    children
}: LazyComponentProps) {
    const {
        loadingMessage,
        loadingDescription,
        errorTitle,
        minLoadingTime = 300,
    } = options;

    // Create lazy component with minimum loading time
    const LazyComponent = lazy(async () => {
        const [componentModule] = await Promise.all([
            component(),
            new Promise(resolve => setTimeout(resolve, minLoadingTime))
        ]);
        return componentModule;
    });

    const loadingComponent = fallback || (
        <DefaultLoading message={loadingMessage} description={loadingDescription} />
    );

    return (
        <ErrorBoundary
            fallback={(error, retry) => (
                <DefaultError error={error} retry={retry} title={errorTitle} />
            )}
            onError={(error) => {
                console.error('Lazy component error:', error);

                // Report to analytics
                if (window.gtag) {
                    window.gtag('event', 'exception', {
                        description: `Lazy component error: ${error.message}`,
                        fatal: false,
                    });
                }
            }}
        >
            <Suspense fallback={loadingComponent}>
                <LazyComponent>{children}</LazyComponent>
            </Suspense>
        </ErrorBoundary>
    );
}

// Specific lazy loaders for heavy components

// 3D Visualization components
export const Lazy3DVisualization = () => (
    <LazyComponentLoader
        component={() => import('@/components/3d/ThreeDVisualization')}
        options={{
            loadingMessage: 'Loading 3D visualization...',
            loadingDescription: 'Initializing Three.js and WebGL components',
            errorTitle: 'Failed to load 3D visualization',
            minLoadingTime: 500,
        }}
    />
);

// Chart components
export const LazyChartDashboard = () => (
    <LazyComponentLoader
        component={() => import('@/components/charts/ChartDashboard')}
        options={{
            loadingMessage: 'Loading charts...',
            loadingDescription: 'Preparing data visualization components',
            errorTitle: 'Failed to load charts',
        }}
    />
);

// Code editor components
export const LazyCodeEditor = () => (
    <LazyComponentLoader
        component={() => import('@/components/editor/CodeEditor')}
        options={{
            loadingMessage: 'Loading code editor...',
            loadingDescription: 'Initializing syntax highlighting and editor features',
            errorTitle: 'Failed to load code editor',
        }}
    />
);

// Diagram components
export const LazyDiagramViewer = () => (
    <LazyComponentLoader
        component={() => import('@/components/diagrams/DiagramViewer')}
        options={{
            loadingMessage: 'Loading diagram viewer...',
            loadingDescription: 'Preparing Mermaid and diagram rendering',
            errorTitle: 'Failed to load diagram viewer',
        }}
    />
);

// Math rendering components
export const LazyMathRenderer = () => (
    <LazyComponentLoader
        component={() => import('@/components/math/MathRenderer')}
        options={{
            loadingMessage: 'Loading math renderer...',
            loadingDescription: 'Initializing KaTeX for mathematical expressions',
            errorTitle: 'Failed to load math renderer',
        }}
    />
);

// Preloading utilities
class ComponentPreloader {
    private preloadedComponents = new Set<string>();

    preload(componentName: string, loader: () => Promise<unknown>) {
        if (this.preloadedComponents.has(componentName)) {
            return;
        }

        this.preloadedComponents.add(componentName);

        // Preload with low priority
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                loader().catch(error => {
                    console.warn(`Failed to preload ${componentName}:`, error);
                    this.preloadedComponents.delete(componentName);
                });
            });
        } else {
            setTimeout(() => {
                loader().catch(error => {
                    console.warn(`Failed to preload ${componentName}:`, error);
                    this.preloadedComponents.delete(componentName);
                });
            }, 100);
        }
    }

    preloadAll() {
        // Preload all heavy components during idle time
        this.preload('3d', () => import('@/components/3d/ThreeDVisualization'));
        this.preload('charts', () => import('@/components/charts/ChartDashboard'));
        this.preload('editor', () => import('@/components/editor/CodeEditor'));
        this.preload('diagrams', () => import('@/components/diagrams/DiagramViewer'));
        this.preload('math', () => import('@/components/math/MathRenderer'));
        this.preload('admin', () => import('@/components/admin/AdminDashboard'));
    }

    isPreloaded(componentName: string): boolean {
        return this.preloadedComponents.has(componentName);
    }
}

export const componentPreloader = new ComponentPreloader();

// Hook for component preloading
export function useComponentPreloader() {
    const preload = (componentName: string, loader: () => Promise<unknown>) => {
        componentPreloader.preload(componentName, loader);
    };

    const preloadAll = () => {
        componentPreloader.preloadAll();
    };

    return { preload, preloadAll };
}

// Higher-order component for adding preloading on hover
export function withPreloadOnHover<P extends object>(
    WrappedComponent: ComponentType<P>,
    preloadFn: () => void
) {
    return function PreloadOnHoverComponent(props: P) {
        const handleMouseEnter = () => {
            preloadFn();
        };

        return (
            <div onMouseEnter={handleMouseEnter}>
                <WrappedComponent {...props} />
            </div>
        );
    };
}