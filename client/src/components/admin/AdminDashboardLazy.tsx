/**
 * Lazy-loaded Admin Dashboard wrapper
 * Implements code splitting and loading states for the admin dashboard
 */

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Suspense, lazy } from 'react';

// Lazy load the admin dashboard and its heavy dependencies
const AdminDashboard = lazy(() =>
    import('./AdminDashboard')
);

// Lazy load performance analytics dashboard
const PerformanceAnalyticsDashboard = lazy(() =>
    import('./PerformanceAnalyticsDashboard').then(module => ({
        default: module.PerformanceAnalyticsDashboard
    }))
);

// Loading component for admin dashboard
function AdminDashboardLoading() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-sm text-gray-600">Loading admin dashboard...</p>
                <p className="mt-1 text-xs text-gray-500">
                    This may take a moment as we load the analytics components
                </p>
            </div>
        </div>
    );
}

// Error fallback for admin dashboard
function AdminDashboardError({ error, retry }: { error: Error; retry: () => void }) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
                <div className="text-red-500 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Failed to load admin dashboard
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    {error.message || 'An unexpected error occurred while loading the dashboard.'}
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

// Main lazy-loaded admin dashboard component
export function AdminDashboardLazy() {
    return (
        <ErrorBoundary
            fallback={AdminDashboardError}
            onError={(error) => {
                console.error('Admin dashboard error:', error);
                // Report to monitoring service
                if (window.gtag) {
                    window.gtag('event', 'exception', {
                        description: `Admin dashboard error: ${error.message}`,
                        fatal: false,
                    });
                }
            }}
        >
            <Suspense fallback={<AdminDashboardLoading />}>
                <AdminDashboard />
            </Suspense>
        </ErrorBoundary>
    );
}

// Performance analytics dashboard with lazy loading
export function PerformanceAnalyticsDashboardLazy() {
    return (
        <ErrorBoundary
            fallback={AdminDashboardError}
            onError={(error) => {
                console.error('Performance analytics error:', error);
            }}
        >
            <Suspense fallback={<AdminDashboardLoading />}>
                <PerformanceAnalyticsDashboard />
            </Suspense>
        </ErrorBoundary>
    );
}

// Preload function for better UX
export function preloadAdminDashboard() {
    // Preload the admin dashboard when user hovers over admin link
    import('./AdminDashboard');
    import('./PerformanceAnalyticsDashboard');
}

// Hook for preloading on user interaction
export function useAdminDashboardPreload() {
    const preload = () => {
        preloadAdminDashboard();
    };

    return { preload };
}