import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function PageTransitionLoader() {
  const [location] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previousLocation, setPreviousLocation] = useState(location);

  useEffect(() => {
    // Detect route change
    if (location !== previousLocation) {
      setIsLoading(true);
      setProgress(0);
      
      // Simulate progress
      const startTime = Date.now();
      const duration = 800; // 800ms total duration
      
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / duration) * 100, 100);
        
        setProgress(newProgress);
        
        if (newProgress < 100) {
          requestAnimationFrame(updateProgress);
        } else {
          // Complete the transition
          setTimeout(() => {
            setIsLoading(false);
            setPreviousLocation(location);
          }, 100);
        }
      };
      
      requestAnimationFrame(updateProgress);
    }
  }, [location, previousLocation]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100]">
      <Progress 
        value={progress} 
        className="h-1 rounded-none"
        indicatorClassName="bg-primary transition-all duration-300 ease-out"
      />
      <div className="absolute top-0 right-0 h-1 w-20 bg-gradient-to-l from-primary/50 to-transparent animate-pulse" />
    </div>
  );
}

// Hook to manually trigger page transition loading
export function usePageTransition() {
  const [isLoading, setIsLoading] = useState(false);

  const startTransition = () => {
    setIsLoading(true);
    // Auto-complete after a timeout as fallback
    setTimeout(() => setIsLoading(false), 1000);
  };

  const endTransition = () => {
    setIsLoading(false);
  };

  return { isLoading, startTransition, endTransition };
}

// Skeleton loader for page content
export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse space-y-4", className)}>
      {/* Header skeleton */}
      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      
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