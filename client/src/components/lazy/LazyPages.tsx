import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Page Loading Skeleton
const PageSkeleton = () => (
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  </div>
);

// Lazy load heavy page components
export const LazyTerms = lazy(() => import('@/pages/Terms'));
export const LazyCategories = lazy(() => import('@/pages/Categories'));
export const LazyTrending = lazy(() => import('@/pages/Trending'));
export const LazyDashboard = lazy(() => import('@/pages/Dashboard'));
export const LazyFavorites = lazy(() => import('@/pages/Favorites'));
export const LazyAdmin = lazy(() => import('@/pages/Admin'));
export const LazyAnalyticsDashboard = lazy(() => import('@/pages/AnalyticsDashboard'));
export const LazySettings = lazy(() => import('@/pages/Settings'));
export const LazyAITools = lazy(() => import('@/pages/AITools'));
export const LazyUserProgressDashboard = lazy(() => import('@/pages/UserProgressDashboard'));
export const LazyEnhancedTermDetail = lazy(() => import('@/pages/EnhancedTermDetail'));
export const LazyLifetime = lazy(() => import('@/pages/Lifetime'));

// HOC to wrap lazy pages with Suspense
export function withLazyLoading<T extends object>(Component: React.ComponentType<T>) {
  return function LazyWrapper(props: T) {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Pre-wrapped components for immediate use
export const LazyTermsPage = withLazyLoading(LazyTerms);
export const LazyCategoriesPage = withLazyLoading(LazyCategories);
export const LazyTrendingPage = withLazyLoading(LazyTrending);
export const LazyDashboardPage = withLazyLoading(LazyDashboard);
export const LazyFavoritesPage = withLazyLoading(LazyFavorites);
export const LazyAdminPage = withLazyLoading(LazyAdmin);
export const LazyAnalyticsPage = withLazyLoading(LazyAnalyticsDashboard);
export const LazySettingsPage = withLazyLoading(LazySettings);
export const LazyAIToolsPage = withLazyLoading(LazyAITools);
export const LazyProgressPage = withLazyLoading(LazyUserProgressDashboard);
export const LazyTermDetailPage = withLazyLoading(LazyEnhancedTermDetail);
export const LazyLifetimePage = withLazyLoading(LazyLifetime);