import { useEffect, useState, useTransition } from 'react';
import { useLocation } from 'wouter';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function PageTransitionLoader() {
  const [location] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previousLocation, setPreviousLocation] = useState(location);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Detect route change
    if (location !== previousLocation) {
      // Only show loader for actual navigation, not for initial load
      if (previousLocation !== location) {
        setIsLoading(true);
        setProgress(0);
        
        // Much shorter duration - 200ms instead of 800ms
        const duration = 200;
        const startTime = Date.now();
        
        const updateProgress = () => {
          const elapsed = Date.now() - startTime;
          const newProgress = Math.min((elapsed / duration) * 100, 100);
          
          setProgress(newProgress);
          
          if (newProgress < 100) {
            requestAnimationFrame(updateProgress);
          } else {
            // Complete immediately without additional delay
            setIsLoading(false);
            setPreviousLocation(location);
          }
        };
        
        // Use React's startTransition for non-urgent update
        startTransition(() => {
          requestAnimationFrame(updateProgress);
        });
      } else {
        setPreviousLocation(location);
      }
    }
  }, [location, previousLocation]);

  // Don't show loader for very quick transitions (< 100ms)
  const [showLoader, setShowLoader] = useState(false);
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowLoader(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowLoader(false);
    }
  }, [isLoading]);

  if (!showLoader || !isLoading) {return null;}

  return (
    <div className="fixed top-0 left-0 right-0 z-[100]">
      <Progress 
        value={progress} 
        className="h-0.5 rounded-none" // Thinner progress bar
        indicatorClassName="bg-primary transition-transform duration-200 ease-out" // Faster transition
      />
    </div>
  );
}

// Hook to manually trigger page transition loading
export function usePageTransition() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const startPageTransition = (callback?: () => void) => {
    setIsLoading(true);
    
    // Use React's concurrent features
    startTransition(() => {
      callback?.();
      // Auto-complete after a short timeout as fallback
      setTimeout(() => setIsLoading(false), 300);
    });
  };

  const endTransition = () => {
    setIsLoading(false);
  };

  return { 
    isLoading: isLoading || isPending, 
    startTransition: startPageTransition, 
    endTransition 
  };
}

// Optimized skeleton loader with CSS containment
export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div 
      className={cn("animate-pulse space-y-4", className)}
      style={{ contain: 'layout style paint' }} // CSS containment for better performance
    >
      {/* Header skeleton */}
      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg will-change-auto" />
      
      {/* Content skeleton */}
      <div className="space-y-3">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
      </div>
      
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
    </div>
  );
}