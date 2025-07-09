/**
 * Touch-Optimized Scroll Component
 * Enhanced scrolling experience for mobile devices with momentum and smooth scrolling
 */

import type React from 'react';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

interface TouchScrollState {
  startY: number;
  startTime: number;
  lastY: number;
  lastTime: number;
  velocity: number;
  momentum: boolean;
}

interface TouchOptimizedScrollProps {
  children: ReactNode;
  className?: string;
  onScroll?: (scrollTop: number, scrollDirection: 'up' | 'down') => void;
  onScrollEnd?: () => void;
  enableMomentum?: boolean;
  bounceEffect?: boolean;
  pullToRefresh?: boolean;
  onPullToRefresh?: () => Promise<void>;
  refreshThreshold?: number;
  showScrollIndicator?: boolean;
  autoHideScrollbar?: boolean;
}

const TouchOptimizedScroll: React.FC<TouchOptimizedScrollProps> = ({
  children,
  className = '',
  onScroll,
  onScrollEnd,
  enableMomentum = true,
  bounceEffect = true,
  pullToRefresh = false,
  onPullToRefresh,
  refreshThreshold = 60,
  showScrollIndicator = true,
  autoHideScrollbar = true,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStateRef = useRef<TouchScrollState | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showScrollbar, setShowScrollbar] = useState(false);

  // Calculate scroll progress
  const updateScrollProgress = useCallback(() => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const maxScroll = scrollHeight - clientHeight;
    const progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;

    setScrollProgress(Math.min(100, Math.max(0, progress)));
  }, []);

  // Handle momentum scrolling
  const applyMomentum = useCallback(
    (velocity: number) => {
      if (!enableMomentum || !scrollRef.current || Math.abs(velocity) < 0.1) return;

      const element = scrollRef.current;
      const friction = 0.95;
      const minVelocity = 0.1;

      const momentum = () => {
        velocity *= friction;

        if (Math.abs(velocity) < minVelocity) {
          animationFrameRef.current = null;
          setIsScrolling(false);
          onScrollEnd?.();
          return;
        }

        element.scrollTop += velocity;
        updateScrollProgress();

        animationFrameRef.current = requestAnimationFrame(momentum);
      };

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(momentum);
    },
    [enableMomentum, onScrollEnd, updateScrollProgress]
  );

  // Touch start handler
  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (!scrollRef.current) return;

      const touch = event.touches[0];
      touchStateRef.current = {
        startY: touch.clientY,
        startTime: Date.now(),
        lastY: touch.clientY,
        lastTime: Date.now(),
        velocity: 0,
        momentum: false,
      };

      setIsScrolling(true);
      if (autoHideScrollbar) setShowScrollbar(true);

      // Cancel any ongoing momentum
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    },
    [autoHideScrollbar]
  );

  // Touch move handler
  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!touchStateRef.current || !scrollRef.current) return;

      const touch = event.touches[0];
      const currentTime = Date.now();
      const deltaY = touchStateRef.current.lastY - touch.clientY;
      const deltaTime = currentTime - touchStateRef.current.lastTime;

      // Calculate velocity
      if (deltaTime > 0) {
        touchStateRef.current.velocity = deltaY / deltaTime;
      }

      touchStateRef.current.lastY = touch.clientY;
      touchStateRef.current.lastTime = currentTime;

      // Handle pull to refresh
      if (pullToRefresh && !isRefreshing) {
        const { scrollTop } = scrollRef.current;
        const pullDelta = touch.clientY - touchStateRef.current.startY;

        if (scrollTop === 0 && pullDelta > 0) {
          event.preventDefault();
          const distance = Math.min(pullDelta * 0.4, refreshThreshold * 1.5);
          setPullDistance(distance);

          // Add visual feedback
          scrollRef.current.style.transform = `translateY(${distance * 0.3}px)`;
          return;
        }
      }

      // Normal scrolling
      scrollRef.current.scrollTop += deltaY;
      updateScrollProgress();

      // Determine scroll direction and notify
      if (onScroll) {
        const direction = deltaY > 0 ? 'down' : 'up';
        onScroll(scrollRef.current.scrollTop, direction);
      }
    },
    [pullToRefresh, isRefreshing, refreshThreshold, updateScrollProgress, onScroll]
  );

  // Touch end handler
  const handleTouchEnd = useCallback(
    async (event: TouchEvent) => {
      if (!touchStateRef.current || !scrollRef.current) return;

      const touch = event.changedTouches[0];
      const totalTime = Date.now() - touchStateRef.current.startTime;
      const totalDistance = Math.abs(touch.clientY - touchStateRef.current.startY);

      // Handle pull to refresh
      if (pullToRefresh && pullDistance >= refreshThreshold && onPullToRefresh && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onPullToRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
          scrollRef.current.style.transform = 'translateY(0)';
        }
      } else if (pullDistance > 0) {
        // Animate back to normal position
        setPullDistance(0);
        scrollRef.current.style.transform = 'translateY(0)';
        scrollRef.current.style.transition = 'transform 0.3s ease-out';
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.style.transition = '';
          }
        }, 300);
      }

      // Apply momentum if gesture was quick enough
      if (enableMomentum && totalTime < 300 && totalDistance > 20) {
        const velocity = touchStateRef.current.velocity * 10; // Scale velocity
        applyMomentum(velocity);
      } else {
        setIsScrolling(false);
        onScrollEnd?.();
      }

      // Auto-hide scrollbar
      if (autoHideScrollbar) {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
          setShowScrollbar(false);
        }, 1000);
      }

      touchStateRef.current = null;
    },
    [
      pullToRefresh,
      pullDistance,
      refreshThreshold,
      onPullToRefresh,
      isRefreshing,
      enableMomentum,
      applyMomentum,
      onScrollEnd,
      autoHideScrollbar,
    ]
  );

  // Regular scroll handler for non-touch events
  const handleScroll = useCallback(() => {
    updateScrollProgress();

    if (onScroll && scrollRef.current) {
      // We can't determine direction from regular scroll, so we'll use 'down' as default
      onScroll(scrollRef.current.scrollTop, 'down');
    }

    if (autoHideScrollbar) {
      setShowScrollbar(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setShowScrollbar(false);
      }, 1000);
    }
  }, [updateScrollProgress, onScroll, autoHideScrollbar]);

  // Set up event listeners
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    // Touch events
    const options: AddEventListenerOptions = { passive: false };
    element.addEventListener('touchstart', handleTouchStart, options);
    element.addEventListener('touchmove', handleTouchMove, options);
    element.addEventListener('touchend', handleTouchEnd, options);

    // Regular scroll events
    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('scroll', handleScroll);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleScroll]);

  // Initialize scroll progress
  useEffect(() => {
    updateScrollProgress();
  }, [updateScrollProgress]);

  return (
    <div className={cn('relative', className)}>
      {/* Pull to refresh indicator */}
      {pullToRefresh && pullDistance > 0 && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-all duration-200 z-10"
          style={{
            height: `${Math.min(pullDistance, refreshThreshold)}px`,
            opacity: Math.min(pullDistance / refreshThreshold, 1),
          }}
        >
          <div className="flex items-center space-x-2 py-2">
            {isRefreshing ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">Refreshing...</span>
              </>
            ) : pullDistance >= refreshThreshold ? (
              <>
                <div className="w-4 h-4 text-blue-600">↓</div>
                <span className="text-sm font-medium">Release to refresh</span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 text-blue-600">↓</div>
                <span className="text-sm font-medium">Pull to refresh</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className={cn(
          'overflow-y-auto',
          autoHideScrollbar && !showScrollbar && 'scrollbar-hide',
          bounceEffect && 'overscroll-y-bounce'
        )}
        style={{
          WebkitOverflowScrolling: 'touch', // iOS momentum scrolling
          scrollBehavior: enableMomentum ? 'auto' : 'smooth',
        }}
      >
        {children}
      </div>

      {/* Scroll indicator */}
      {showScrollIndicator && scrollProgress > 0 && (
        <div
          className={cn(
            'fixed right-2 top-1/2 transform -translate-y-1/2 w-1 bg-gray-200 dark:bg-gray-700 rounded-full transition-opacity duration-300 z-20',
            showScrollbar ? 'opacity-100' : 'opacity-0',
            'h-32'
          )}
        >
          <div
            className="w-full bg-blue-500 rounded-full transition-all duration-100"
            style={{
              height: `${scrollProgress}%`,
              transform: `translateY(${(scrollProgress / 100) * 100}%)`,
            }}
          />
        </div>
      )}

      {/* Scrolling indicator */}
      {isScrolling && (
        <div className="fixed top-4 right-4 bg-black/80 text-white rounded-full px-3 py-1 text-xs font-medium z-30 pointer-events-none">
          Scrolling
        </div>
      )}
    </div>
  );
};

export default TouchOptimizedScroll;
