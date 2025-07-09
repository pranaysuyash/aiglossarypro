import { useEffect } from 'react';
import { useGA4 } from '@/types/analytics';

interface ScrollDepthTrackerProps {
  /** Whether to track scroll depth globally or for specific sections */
  scope?: 'global' | 'section';
  /** Section identifier if tracking specific section */
  sectionId?: string;
  /** Custom milestones to track (default: [25, 50, 75, 90, 100]) */
  milestones?: number[];
  /** Throttle delay in milliseconds to avoid excessive tracking */
  throttleDelay?: number;
}

export default function ScrollDepthTracker({
  scope = 'global',
  sectionId,
  milestones = [25, 50, 75, 90, 100],
  throttleDelay = 100,
}: ScrollDepthTrackerProps) {
  const { trackScrollDepth } = useGA4();

  useEffect(() => {
    let maxScroll = 0;
    let timeoutId: NodeJS.Timeout;
    const trackedMilestones = new Set<number>();

    const handleScroll = () => {
      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Throttle scroll events
      timeoutId = setTimeout(() => {
        let scrollPercentage: number;

        if (scope === 'global') {
          // Global page scroll tracking
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          scrollPercentage = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        } else if (scope === 'section' && sectionId) {
          // Section-specific scroll tracking
          const sectionElement = document.getElementById(sectionId);
          if (!sectionElement) return;

          const sectionTop = sectionElement.offsetTop;
          const sectionHeight = sectionElement.offsetHeight;
          const scrollTop = window.scrollY;
          const windowHeight = window.innerHeight;

          // Calculate how much of the section is visible
          const visibleTop = Math.max(0, scrollTop - sectionTop);
          const visibleBottom = Math.min(sectionHeight, scrollTop + windowHeight - sectionTop);
          const visibleHeight = Math.max(0, visibleBottom - visibleTop);

          scrollPercentage = sectionHeight > 0 ? (visibleHeight / sectionHeight) * 100 : 0;
        } else {
          return;
        }

        // Update max scroll if higher
        if (scrollPercentage > maxScroll) {
          maxScroll = scrollPercentage;

          // Check for milestone achievements
          for (const milestone of milestones) {
            if (maxScroll >= milestone && !trackedMilestones.has(milestone)) {
              trackedMilestones.add(milestone);

              // Track the milestone
              trackScrollDepth(milestone);

              // Optional: Log for debugging
              if (import.meta.env.NODE_ENV === 'development') {
                console.log(
                  `Scroll depth milestone reached: ${milestone}% ${scope === 'section' ? `(section: ${sectionId})` : '(global)'}`
                );
              }
            }
          }
        }
      }, throttleDelay);
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial check for already visible content
    handleScroll();

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [scope, sectionId, milestones, throttleDelay, trackScrollDepth]);

  return null; // This component doesn't render anything
}

// Hook for programmatic scroll depth tracking
export function useScrollDepthTracking(
  scope: 'global' | 'section' = 'global',
  sectionId?: string,
  milestones: number[] = [25, 50, 75, 90, 100]
) {
  const { trackScrollDepth } = useGA4();

  const trackCurrentScrollDepth = () => {
    let scrollPercentage: number;

    if (scope === 'global') {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollPercentage = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    } else if (scope === 'section' && sectionId) {
      const sectionElement = document.getElementById(sectionId);
      if (!sectionElement) return 0;

      const sectionTop = sectionElement.offsetTop;
      const sectionHeight = sectionElement.offsetHeight;
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;

      const visibleTop = Math.max(0, scrollTop - sectionTop);
      const visibleBottom = Math.min(sectionHeight, scrollTop + windowHeight - sectionTop);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);

      scrollPercentage = sectionHeight > 0 ? (visibleHeight / sectionHeight) * 100 : 0;
    } else {
      return 0;
    }

    // Find the highest milestone reached
    const reachedMilestone = milestones
      .filter((milestone) => scrollPercentage >= milestone)
      .sort((a, b) => b - a)[0];

    if (reachedMilestone) {
      trackScrollDepth(reachedMilestone);
    }

    return scrollPercentage;
  };

  return {
    trackCurrentScrollDepth,
    getCurrentScrollPercentage: () => {
      if (scope === 'global') {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        return docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      } else if (scope === 'section' && sectionId) {
        const sectionElement = document.getElementById(sectionId);
        if (!sectionElement) return 0;

        const sectionTop = sectionElement.offsetTop;
        const sectionHeight = sectionElement.offsetHeight;
        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;

        const visibleTop = Math.max(0, scrollTop - sectionTop);
        const visibleBottom = Math.min(sectionHeight, scrollTop + windowHeight - sectionTop);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);

        return sectionHeight > 0 ? (visibleHeight / sectionHeight) * 100 : 0;
      }
      return 0;
    },
  };
}
