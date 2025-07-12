import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
export const LazySubcategories = lazy(() => import('@/pages/Subcategories'));
export const LazySubcategoryDetail = lazy(() => import('@/pages/SubcategoryDetail'));
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
export const LazyProfile = lazy(() => import('@/pages/Profile'));
export const LazyLandingPageComponent = lazy(() => import('@/pages/LandingPage'));
export const LazyLandingA = lazy(() => import('@/pages/LandingA'));
export const LazyAbout = lazy(() => import('@/pages/About'));
export const LazyLearningPaths = lazy(() => import('@/pages/LearningPaths'));
export const LazyLearningPathDetail = lazy(() => import('@/pages/LearningPathDetail'));
export const LazyCodeExamples = lazy(() => import('@/pages/CodeExamples'));
export const LazyDiscovery = lazy(() => import('@/pages/Discovery'));
export const LazySurpriseMe = lazy(() => import('@/pages/SurpriseMe'));
export const LazyPersonalizedHomepage = lazy(() => import('@/pages/PersonalizedHomepage'));
export const LazyAISearch = lazy(() => import('@/pages/AISearch'));
export const LazyThreeDVisualization = lazy(() => import('@/pages/3DVisualization'));

// Legal pages
export const LazyPrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
export const LazyTermsOfService = lazy(() => import('@/pages/TermsOfService'));

// HOC to wrap lazy pages with Suspense and ErrorBoundary
export function withLazyLoading<T extends object>(Component: React.ComponentType<T>) {
  return function LazyWrapper(props: T) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<PageSkeleton />}>
          <Component {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };
}

// Pre-wrapped components for immediate use
export const LazyTermsPage = withLazyLoading(LazyTerms);
export const LazyCategoriesPage = withLazyLoading(LazyCategories);
export const LazySubcategoriesPage = withLazyLoading(LazySubcategories);
export const LazySubcategoryDetailPage = withLazyLoading(LazySubcategoryDetail);
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
export const LazyProfilePage = withLazyLoading(LazyProfile);
export const LazyLandingPage = withLazyLoading(LazyLandingPageComponent);
export const LazyAboutPage = withLazyLoading(LazyAbout);

export const LazyLearningPathsPage = withLazyLoading(LazyLearningPaths);
export const LazyLearningPathDetailPage = withLazyLoading(LazyLearningPathDetail);
export const LazyCodeExamplesPage = withLazyLoading(LazyCodeExamples);
export const LazyDiscoveryPage = withLazyLoading(LazyDiscovery);
export const LazySurpriseMePage = withLazyLoading(LazySurpriseMe);
export const LazyPersonalizedHomepagePage = withLazyLoading(LazyPersonalizedHomepage);
export const LazyAISearchPage = withLazyLoading(LazyAISearch);
export const LazyThreeDVisualizationPage = withLazyLoading(LazyThreeDVisualization);

// Legal pages
export const LazyPrivacyPolicyPage = withLazyLoading(LazyPrivacyPolicy);
export const LazyTermsOfServicePage = withLazyLoading(LazyTermsOfService);
