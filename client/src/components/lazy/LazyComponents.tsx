import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Component Loading Skeletons
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  </div>
);

const SearchSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-full" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  </div>
);

const AdminSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-8 w-1/4" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  </div>
);

// Lazy load heavy components
export const LazyAIFeedbackDashboard = lazy(() => import('@/components/AIFeedbackDashboard'));
export const LazyAIAdminDashboard = lazy(() => import('@/components/AIAdminDashboard'));
export const LazyAdvancedSearch = lazy(() => import('@/components/search/AdvancedSearch'));
export const LazyVirtualizedTermList = lazy(() => import('@/components/VirtualizedTermList'));
export const LazyS3FileManagerDashboard = lazy(() => import('@/components/S3FileManagerDashboard'));
export const LazyInteractiveElementsManager = lazy(() => import('@/components/interactive/InteractiveElementsManager'));
export const LazyUserPersonalizationSettings = lazy(() => import('@/components/settings/UserPersonalizationSettings'));
export const LazyMobileOptimizedLayout = lazy(() => import('@/components/mobile/MobileOptimizedLayout'));

// Analytics components
export const LazyAnalyticsChart = lazy(() => import('@/components/lazy/LazyChart'));

// HOCs for different component types
export function withDashboardLoading<T extends object>(Component: React.ComponentType<T>) {
  return function LazyDashboardWrapper(props: T) {
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

export function withSearchLoading<T extends object>(Component: React.ComponentType<T>) {
  return function LazySearchWrapper(props: T) {
    return (
      <Suspense fallback={<SearchSkeleton />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

export function withAdminLoading<T extends object>(Component: React.ComponentType<T>) {
  return function LazyAdminWrapper(props: T) {
    return (
      <Suspense fallback={<AdminSkeleton />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Pre-wrapped components
export const LazyAIFeedbackDashboardWrapped = withDashboardLoading(LazyAIFeedbackDashboard);
export const LazyAIAdminDashboardWrapped = withAdminLoading(LazyAIAdminDashboard);
export const LazyAdvancedSearchWrapped = withSearchLoading(LazyAdvancedSearch);
export const LazyVirtualizedTermListWrapped = withSearchLoading(LazyVirtualizedTermList);
export const LazyS3FileManagerDashboardWrapped = withAdminLoading(LazyS3FileManagerDashboard);
export const LazyInteractiveElementsManagerWrapped = withAdminLoading(LazyInteractiveElementsManager);
export const LazyUserPersonalizationSettingsWrapped = withDashboardLoading(LazyUserPersonalizationSettings);