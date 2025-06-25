import { Switch, Route } from "wouter";
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
  LazyTrendingPage,
  LazyDashboardPage,
  LazyFavoritesPage,
  LazyAdminPage,
  LazyAnalyticsPage,
  LazySettingsPage,
  LazyAIToolsPage,
  LazyProgressPage,
  LazyTermDetailPage,
  LazyLifetimePage
} from "@/components/lazy/LazyPages";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginPage from "@/components/LoginPage";
import { useAuth } from "@/hooks/useAuth";
import { preloadOnIdle, preloadForAuthenticatedUser, preloadForAdmin } from "@/utils/preloadComponents";
import "@/utils/bundleAnalyzer"; // Initialize bundle analyzer
import { useEffect } from "react";

// Smart Term Detail component that chooses between enhanced and regular view
function SmartTermDetail() {
  return <LazyTermDetailPage />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Skip to content links for keyboard accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-foreground"
      >
        Skip to main content
      </a>
      <a 
        href="#navigation" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-40 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-foreground"
      >
        Skip to navigation
      </a>
      
      <Header />
      <main id="main-content" className="flex-grow" tabIndex={-1}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={LoginPage} />
          <Route path="/lifetime" component={LazyLifetimePage} />
          <Route path="/term/:id" component={SmartTermDetail} />
          <Route path="/terms" component={LazyTermsPage} />
          <Route path="/categories" component={LazyCategoriesPage} />
          <Route path="/trending" component={LazyTrendingPage} />
          <Route path="/dashboard">
            {isAuthenticated ? <LazyDashboardPage /> : <LoginPage />}
          </Route>
          <Route path="/favorites">
            {isAuthenticated ? <LazyFavoritesPage /> : <LoginPage />}
          </Route>
          <Route path="/admin">
            {isAuthenticated ? <LazyAdminPage /> : <LoginPage />}
          </Route>
          <Route path="/analytics">
            {isAuthenticated ? <LazyAnalyticsPage /> : <LoginPage />}
          </Route>
          <Route path="/settings">
            {isAuthenticated ? <LazySettingsPage /> : <LoginPage />}
          </Route>
          <Route path="/ai-tools">
            <LazyAIToolsPage />
          </Route>
          <Route path="/progress">
            {isAuthenticated ? <LazyProgressPage /> : <LoginPage />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
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
