import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";

// Lazy load heavy pages to reduce initial bundle size
import {
  LazyTermsPage,
  LazyCategoriesPage,
  LazySubcategoriesPage,
  LazySubcategoryDetailPage,
  LazyTrendingPage,
  LazyDashboardPage,
  LazyFavoritesPage,
  LazyAdminPage,
  LazyAnalyticsPage,
  LazySettingsPage,
  LazyAIToolsPage,
  LazyProgressPage,
  LazyTermDetailPage,
  LazyLifetimePage,
  LazyProfilePage,
  LazyLandingPage,
  LazyAboutPage,
  LazyPrivacyPolicyPage,
  LazyTermsOfServicePage,
  LazyLearningPathsPage,
  LazyLearningPathDetailPage,
  LazyCodeExamplesPage
} from "@/components/lazy/LazyPages";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FirebaseLoginPage from "@/components/FirebaseLoginPage";
import PurchaseSuccess from "@/pages/PurchaseSuccess";
import SkipLinks from "@/components/accessibility/SkipLinks";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { useAuth } from "@/hooks/useAuth";
import { preloadOnIdle, preloadForAuthenticatedUser, preloadForAdmin } from "@/utils/preloadComponents";
import "@/utils/bundleAnalyzer"; // Initialize bundle analyzer
import { useEffect } from "react";

// Smart Term Detail component that chooses between enhanced and regular view
function SmartTermDetail() {
  return <LazyTermDetailPage />;
}

// Protected Route component that redirects to login
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
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
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Handle authenticated user redirect
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/app");
    }
  }, [isAuthenticated, isLoading, setLocation]);
  
  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Don't render anything while redirecting authenticated users
  if (isAuthenticated) {
    return null;
  }
  
  // New visitors see marketing page
  return <LazyLandingPage />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  // Preload components based on authentication status
  useEffect(() => {
    // Preload critical components on idle
    preloadOnIdle();

    if (isAuthenticated) {
      preloadForAuthenticatedUser();
      
      // Check if user is admin and preload admin components
      // This would typically be determined by user role
      // For now, we'll use a simple check or context
      const isAdmin = localStorage.getItem('userRole') === 'admin';
      if (isAdmin) {
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

  // Check if we're on the landing page route
  const isLandingPage = location === '/';

  return (
    <div className="flex flex-col min-h-screen">
      <SkipLinks />
      
      {/* Only show main header if NOT on landing page */}
      {!isLandingPage && <Header />}
      
      <main id="main-content" className="flex-grow" tabIndex={-1}>
        <Switch>
          <Route path="/" component={SmartLandingPage} />
          <Route path="/app" component={Home} />
          <Route path="/browse" component={Home} />
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
          <Route path="/terms" component={LazyTermsOfServicePage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      
      {/* Only show main footer if NOT on landing page */}
      {!isLandingPage && <Footer />}
      
      {/* Cookie Consent Banner - Show on all pages */}
      <CookieConsentBanner />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="ai-ml-glossary-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
