import { useEffect, useRef } from 'react';
import { useGA4 } from '@/types/analytics';

interface SectionViewTrackerProps {
  /** Unique identifier for the section */
  sectionName: string;
  /** Position/order of the section on the page */
  sectionPosition?: number;
  /** Children to render (optional - can be used as wrapper or standalone) */
  children?: React.ReactNode;
  /** CSS class name for the wrapper element */
  className?: string;
  /** Threshold for intersection (0-1, default 0.5 = 50% visible) */
  threshold?: number;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Whether to track only once or multiple times */
  trackOnce?: boolean;
}

export default function SectionViewTracker({
  sectionName,
  sectionPosition = 0,
  children,
  className,
  threshold = 0.5,
  rootMargin = '0px',
  trackOnce = true
}: SectionViewTrackerProps) {
  const { trackSectionView } = useGA4();
  const elementRef = useRef<HTMLDivElement>(null);
  const hasTracked = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Track section view if not already tracked (when trackOnce is true)
            if (!trackOnce || !hasTracked.current) {
              trackSectionView(sectionName, sectionPosition);
              hasTracked.current = true;
              
              if (import.meta.env.NODE_ENV === 'development') {
                console.log(`Section view tracked: ${sectionName} (position: ${sectionPosition})`);
              }
            }
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [sectionName, sectionPosition, threshold, rootMargin, trackOnce, trackSectionView]);

  // If children are provided, render as wrapper
  if (children) {
    return (
      <div ref={elementRef} className={className}>
        {children}
      </div>
    );
  }

  // If no children, render as invisible tracker element
  return (
    <div 
      ref={elementRef} 
      className={`invisible absolute ${className || ''}`}
      aria-hidden="true"
    />
  );
}

// Hook for programmatic section view tracking
export function useSectionViewTracking() {
  const { trackSectionView } = useGA4();

  const trackManualSectionView = (sectionName: string, position?: number) => {
    trackSectionView(sectionName, position);
    
    if (import.meta.env.NODE_ENV === 'development') {
      console.log(`Manual section view tracked: ${sectionName} (position: ${position || 0})`);
    }
  };

  const createSectionObserver = (
    sectionName: string,
    position: number = 0,
    options: {
      threshold?: number;
      rootMargin?: string;
      trackOnce?: boolean;
    } = {}
  ) => {
    const { 
      threshold = 0.5, 
      rootMargin = '0px', 
      trackOnce = true 
    } = options;
    
    let hasTracked = false;

    return new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!trackOnce || !hasTracked) {
              trackSectionView(sectionName, position);
              hasTracked = true;
              
              if (import.meta.env.NODE_ENV === 'development') {
                console.log(`Section view tracked: ${sectionName} (position: ${position})`);
              }
            }
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );
  };

  return {
    trackManualSectionView,
    createSectionObserver
  };
}

// Higher-order component for adding section tracking to any component
export function withSectionTracking<T extends {}>(
  WrappedComponent: React.ComponentType<T>,
  sectionName: string,
  sectionPosition?: number,
  trackerOptions?: {
    threshold?: number;
    rootMargin?: string;
    trackOnce?: boolean;
  }
) {
  return function SectionTrackedComponent(props: T) {
    return (
      <SectionViewTracker
        sectionName={sectionName}
        sectionPosition={sectionPosition}
        {...trackerOptions}
      >
        <WrappedComponent {...props} />
      </SectionViewTracker>
    );
  };
}