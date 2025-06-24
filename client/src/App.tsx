import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Lifetime from "@/pages/Lifetime";

import EnhancedTermDetail from "@/pages/EnhancedTermDetail";
import Terms from "@/pages/Terms";
import Categories from "@/pages/Categories";
import Trending from "@/pages/Trending";
import Dashboard from "@/pages/Dashboard";
import Favorites from "@/pages/Favorites";
import Admin from "@/pages/Admin";
import AnalyticsDashboard from "@/pages/AnalyticsDashboard";
import Settings from "@/pages/Settings";
import AITools from "@/pages/AITools";
import UserProgressDashboard from "@/pages/UserProgressDashboard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginPage from "@/components/LoginPage";
import { useAuth } from "@/hooks/useAuth";

// Smart Term Detail component that chooses between enhanced and regular view
function SmartTermDetail() {
  return <EnhancedTermDetail />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

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
          <Route path="/lifetime" component={Lifetime} />
          <Route path="/term/:id" component={SmartTermDetail} />
          <Route path="/terms" component={Terms} />
          <Route path="/categories" component={Categories} />
          <Route path="/trending" component={Trending} />
          <Route path="/dashboard">
            {isAuthenticated ? <Dashboard /> : <LoginPage />}
          </Route>
          <Route path="/favorites">
            {isAuthenticated ? <Favorites /> : <LoginPage />}
          </Route>
          <Route path="/admin">
            {isAuthenticated ? <Admin /> : <LoginPage />}
          </Route>
          <Route path="/analytics">
            {isAuthenticated ? <AnalyticsDashboard /> : <LoginPage />}
          </Route>
          <Route path="/settings">
            {isAuthenticated ? <Settings /> : <LoginPage />}
          </Route>
          <Route path="/ai-tools">
            <AITools />
          </Route>
          <Route path="/progress">
            {isAuthenticated ? <UserProgressDashboard /> : <LoginPage />}
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
