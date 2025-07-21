import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import SkipLinks from '@/components/accessibility/SkipLinks';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import FirebaseLoginPage from '@/components/FirebaseLoginPage';
import Footer from '@/components/Footer';
import GuestAwareTermDetail from '@/components/GuestAwareTermDetail';
import { GuestConversionFab } from '@/components/GuestPreviewBanner';
import Header from '@/components/Header';
import { ga4Analytics } from '@/lib/ga4Analytics';
// Lazy load heavy pages to reduce initial bundle size
import {
  LazyAboutPage,
  LazyAdminPage,
  LazyAISearchPage,
  LazyAIToolsPage,
  LazyAnalyticsPage,
  LazyCategoriesPage,
  LazyCodeExamplesPage,
  LazyDashboardPage,
  LazyDiscoveryPage,
  LazyFavoritesPage,
  LazyLearningPathDetailPage,
  LazyLearningPathsPage,
  LazyLifetimePage,
  LazyPrivacyPolicyPage,
  LazyProfilePage,
  LazyProgressPage,
  LazySettingsPage,
  LazySubcategoriesPage,
  LazySubcategoryDetailPage,
  LazySurpriseMePage,
  LazyTermsOfServicePage,
  LazyTermsPage,
  LazyThreeDVisualizationPage,
  LazyTrendingPage,
  LazySupportCenterPage,
} from '@/components/lazy/LazyPages';
import OfflineStatus from '@/components/OfflineStatus';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { useOnboarding } from '@/hooks/useOnboarding';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import { ThemeProvider } from '@/components/ThemeProvider';
import { StickyUrgencyBar, UrgencyBanner } from '@/components/UrgencyIndicators';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PageTransitionLoader } from '@/components/PageTransitionLoader';
import { useAuth } from '@/hooks/useAuth';
import Home from '@/pages/Home';
import NotFound from '@/pages/not-found';
import PurchaseSuccess from '@/pages/PurchaseSuccess';
import {
  checkPerformanceBudget,
  preloadCriticalAssets,
  reportWebVitals,
} from '@/utils/performance';
import {
  preloadForAdmin,
  preloadForAuthenticatedUser,
  preloadOnIdle,
} from '@/utils/preloadComponents';
import { queryClient } from './lib/queryClient';
import '@/utils/bundleAnalyzer'; // Initialize bundle analyzer
import { LandingPageGuard } from '@/components/LandingPageGuard';
import { initAnalytics } from '@/lib/analytics';
import { posthogExperiments } from '@/services/posthogExperiments';

// Smart Term Detail component that chooses between enhanced and regular view with guest support
function SmartTermDetail() {
  return <GuestAwareTermDetail />;
}

// Protected Route component that redirects to login
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}

// Smart Landing Page wrapper that redirects authenticated users to app
function SmartLandingPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Handle authenticated user redirect with better state management
  useEffect(() => {
    // Only check once when loading is complete
    if (!isLoading && !hasCheckedAuth) {
      setHasCheckedAuth(true);

      if (isAuthenticated) {
        // Determine the best landing page for authenticated users
        // Premium users go to app, free users might go to dashboard to see their progress
        const redirectPath = user?.lifetimeAccess ? '/app' : '/dashboard';

        // Small delay to ensure smooth transition
        setTimeout(() => {
          setLocation(redirectPath);
        }, 100);
      }
    }
  }, [isAuthenticated, isLoading, setLocation, hasCheckedAuth, user]);

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading your experience...</p>
        </div>
      </div>
    );
  }

  // Don't render landing page for authenticated users
  if (isAuthenticated && hasCheckedAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // New visitors see marketing page with A/B test
  return <LandingPageGuard />;
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location] = useLocation();

  // Initialize analytics, experiments, and performance monitoring
  useEffect(() => {
    // Initialize analytics (PostHog, GA4)
    initAnalytics();

    // Initialize PostHog experiments with user context
    const userProperties = {
      is_authenticated: isAuthenticated,
      user_type: isAuthenticated ? (user?.lifetimeAccess ? 'premium' : 'free') : 'guest',
      page_path: location,
      device_type:
        window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
      browser: navigator.userAgent.includes('Chrome')
        ? 'chrome'
        : navigator.userAgent.includes('Safari')
          ? 'safari'
          : navigator.userAgent.includes('Firefox')
            ? 'firefox'
            : 'other',
    };

    posthogExperiments.initialize(user?.uid, userProperties);

    // Initialize performance monitoring
    preloadCriticalAssets();

    // Report web vitals
    reportWebVitals(metric => {
      console.log('[Web Vitals]', metric);
      // Send to analytics if needed
      if (window.gtag) {
        window.gtag('event', metric.name, {
          value: Math.round(metric.value),
          metric_id: metric.id,
          metric_value: metric.value,
          metric_delta: metric.delta,
        });
      }
    });

    // Check performance budget in development
    if (import.meta.env.DEV) {
      setTimeout(() => {
        checkPerformanceBudget();
      }, 3000);
    }
  }, [isAuthenticated, user, location]);

  // Track page views with GA4
  useEffect(() => {
    // Track page view whenever location changes
    ga4Analytics.trackPageView(document.title, window.location.href);
  }, [location]);

  // Preload components based on authentication status
  useEffect(() => {
    // Preload critical components on idle
    preloadOnIdle();

    if (isAuthenticated) {
      preloadForAuthenticatedUser();

      // Check if user is admin via proper authentication and preload admin components
      if (user?.isAdmin) {
        preloadForAdmin();
      }
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if we're on the landing page route (including legacy route)
  const isLandingPage = location === '/' || location === '/landing';

  return (
    <div className="flex flex-col min-h-screen">
      <PageTransitionLoader />
      <SkipLinks />

      {/* Urgency banner - show on landing page only */}
      {isLandingPage && <UrgencyBanner />}

      {/* Only show main header if NOT on landing page */}
      {!isLandingPage && <Header />}

      <main id="main-content" className="flex-grow" tabIndex={-1}>
        <Switch>
          <Route path="/" component={SmartLandingPage} />
          <Route path="/app" component={Home} />
          <Route path="/browse" component={Home} />
          <Route path="/home" component={Home} />
          <Route path="/login" component={FirebaseLoginPage} />
          <Route path="/purchase-success" component={PurchaseSuccess} />
          <Route path="/lifetime" component={LazyLifetimePage} />
          <Route path="/term/:id" component={SmartTermDetail} />
          <Route path="/enhanced/terms/:id" component={SmartTermDetail} />
          <Route path="/category/:id" component={LazyCategoriesPage} />
          <Route path="/terms" component={LazyTermsPage} />
          <Route path="/categories" component={LazyCategoriesPage} />
          <Route path="/subcategories" component={LazySubcategoriesPage} />
          <Route path="/subcategories/:id" component={LazySubcategoryDetailPage} />
          <Route path="/categories/:categoryId/subcategories" component={LazySubcategoriesPage} />
          <Route path="/trending" component={LazyTrendingPage} />
          <Route path="/dashboard">
            <ProtectedRoute>
              <LazyDashboardPage />
            </ProtectedRoute>
          </Route>
          <Route path="/favorites">
            <ProtectedRoute>
              <LazyFavoritesPage />
            </ProtectedRoute>
          </Route>
          <Route path="/admin">
            <ProtectedRoute>
              <LazyAdminPage />
            </ProtectedRoute>
          </Route>
          <Route path="/analytics">
            <ProtectedRoute>
              <LazyAnalyticsPage />
            </ProtectedRoute>
          </Route>
          <Route path="/settings">
            <ProtectedRoute>
              <LazySettingsPage />
            </ProtectedRoute>
          </Route>
          <Route path="/ai-tools">
            <LazyAIToolsPage />
          </Route>
          <Route path="/learning-paths" component={LazyLearningPathsPage} />
          <Route path="/learning-paths/:id" component={LazyLearningPathDetailPage} />
          <Route path="/code-examples" component={LazyCodeExamplesPage} />
          <Route path="/ai-search" component={LazyAISearchPage} />
          <Route path="/3d-visualization" component={LazyThreeDVisualizationPage} />
          <Route path="/discovery" component={LazyDiscoveryPage} />
          <Route path="/discovery/:termId" component={LazyDiscoveryPage} />
          <Route path="/surprise-me" component={LazySurpriseMePage} />
          <Route path="/progress">
            <ProtectedRoute>
              <LazyProgressPage />
            </ProtectedRoute>
          </Route>
          <Route path="/profile">
            <ProtectedRoute>
              <LazyProfilePage />
            </ProtectedRoute>
          </Route>
          <Route path="/about" component={LazyAboutPage} />
          <Route path="/privacy" component={LazyPrivacyPolicyPage} />
          <Route path="/terms-of-service" component={LazyTermsOfServicePage} />
          <Route path="/support">
            <ProtectedRoute>
              <LazySupportCenterPage />
            </ProtectedRoute>
          </Route>
          {/* Legacy redirect for old landing page route */}
          <Route path="/landing" component={SmartLandingPage} />
          <Route component={NotFound} />
        </Switch>
      </main>

      {/* Only show main footer if NOT on landing page */}
      {!isLandingPage && <Footer />}

      {/* Cookie Consent Banner - Show on all pages */}
      <CookieConsentBanner />

      {/* Sticky urgency bar - show on landing page only */}
      {isLandingPage && <StickyUrgencyBar />}
    </div>
  );
}

function AppContent() {
  const { showOnboarding, completeOnboarding, dismissOnboarding, checkAndShowOnboarding } =
    useOnboarding();
  const { isAuthenticated } = useAuth();

  // Handle onboarding logic with proper authentication check
  useEffect(() => {
    const cleanup = checkAndShowOnboarding(isAuthenticated);
    return cleanup;
  }, [isAuthenticated, checkAndShowOnboarding]);

  return (
    <>
      <Toaster />
      <Router />
      <GuestConversionFab />
      <PWAInstallBanner />
      <OfflineStatus />
      <OnboardingTour
        isVisible={showOnboarding}
        onComplete={completeOnboarding}
        onDismiss={dismissOnboarding}
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="ai-ml-glossary-theme">
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
