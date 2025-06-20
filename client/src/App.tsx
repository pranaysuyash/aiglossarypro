import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import TermDetail from "@/pages/TermDetail";
import Dashboard from "@/pages/Dashboard";
import Favorites from "@/pages/Favorites";
import Admin from "@/pages/Admin";
import AnalyticsDashboard from "@/pages/AnalyticsDashboard";
import Settings from "@/pages/Settings";
import AITools from "@/pages/AITools";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";

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
      <Header />
      <div className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/term/:id" component={TermDetail} />
          <Route path="/dashboard">
            {isAuthenticated ? <Dashboard /> : <Home />}
          </Route>
          <Route path="/favorites">
            {isAuthenticated ? <Favorites /> : <Home />}
          </Route>
          <Route path="/admin">
            {isAuthenticated ? <Admin /> : <Home />}
          </Route>
          <Route path="/analytics">
            {isAuthenticated ? <AnalyticsDashboard /> : <Home />}
          </Route>
          <Route path="/settings">
            {isAuthenticated ? <Settings /> : <Home />}
          </Route>
          <Route path="/ai-tools">
            <AITools />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </div>
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
