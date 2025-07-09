/**
 * Enhanced Mobile Gesture Navigation Hook
 * Provides touch-optimized navigation and gesture recognition for mobile devices
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  velocity: number;
  distance: number;
  duration: number;
}

interface GestureSettings {
  swipeThreshold: number;
  velocityThreshold: number;
  maxSwipeTime: number;
  enableHaptic: boolean;
  enableSwipeNavigation: boolean;
}

const DEFAULT_SETTINGS: GestureSettings = {
  swipeThreshold: 50, // Minimum distance for swipe detection
  velocityThreshold: 0.5, // Minimum velocity for swipe
  maxSwipeTime: 500, // Maximum time for swipe gesture (ms)
  enableHaptic: true,
  enableSwipeNavigation: true,
};

export const useGestureNavigation = (settings: Partial<GestureSettings> = {}) => {
  const [, setLocation] = useLocation();
  const [isGestureActive, setIsGestureActive] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<SwipeGesture | null>(null);

  const config = { ...DEFAULT_SETTINGS, ...settings };

  const touchStartRef = useRef<TouchPoint | null>(null);
  const touchEndRef = useRef<TouchPoint | null>(null);
  const gestureHistory = useRef<SwipeGesture[]>([]);

  // Haptic feedback utility
  const triggerHaptic = useCallback(
    (type: 'light' | 'medium' | 'heavy' = 'light') => {
      if (!config.enableHaptic || !('vibrate' in navigator)) return;

      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30, 10, 30],
      };

      navigator.vibrate(patterns[type]);
    },
    [config.enableHaptic]
  );

  // Calculate gesture properties
  const calculateGesture = useCallback(
    (start: TouchPoint, end: TouchPoint): SwipeGesture | null => {
      const deltaX = end.x - start.x;
      const deltaY = end.y - start.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const duration = end.timestamp - start.timestamp;
      const velocity = distance / duration;

      // Check if gesture meets thresholds
      if (
        distance < config.swipeThreshold ||
        velocity < config.velocityThreshold ||
        duration > config.maxSwipeTime
      ) {
        return null;
      }

      // Determine direction
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      let direction: SwipeGesture['direction'];
      if (absDeltaX > absDeltaY) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      return {
        direction,
        velocity,
        distance,
        duration,
      };
    },
    [config.swipeThreshold, config.velocityThreshold, config.maxSwipeTime]
  );

  // Handle navigation based on gestures
  const handleSwipeNavigation = useCallback(
    (gesture: SwipeGesture) => {
      if (!config.enableSwipeNavigation) return;

      const currentPath = window.location.pathname;

      // Define navigation patterns
      const navigationMap: Record<
        string,
        { left?: string; right?: string; up?: string; down?: string }
      > = {
        '/': {
          right: '/categories',
          down: '/trending',
        },
        '/categories': {
          left: '/',
          right: '/learning-paths',
          down: '/surprise-me',
        },
        '/learning-paths': {
          left: '/categories',
          right: '/code-examples',
          down: '/dashboard',
        },
        '/code-examples': {
          left: '/learning-paths',
          down: '/favorites',
        },
        '/trending': {
          up: '/',
          down: '/surprise-me',
        },
        '/surprise-me': {
          up: '/trending',
          down: '/discovery',
        },
      };

      const currentNavigation = navigationMap[currentPath];
      const targetPath = currentNavigation?.[gesture.direction];

      if (targetPath) {
        triggerHaptic('medium');
        setLocation(targetPath);

        // Track gesture navigation analytics
        if (typeof window !== 'undefined' && 'gtag' in window) {
          (window as any).gtag('event', 'gesture_navigation', {
            gesture_direction: gesture.direction,
            from_path: currentPath,
            to_path: targetPath,
            gesture_velocity: gesture.velocity,
            gesture_distance: gesture.distance,
          });
        }
      }
    },
    [config.enableSwipeNavigation, setLocation, triggerHaptic]
  );

  // Touch event handlers
  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (event.touches.length !== 1) return; // Only handle single touch

      const touch = event.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      };

      setIsGestureActive(true);
      triggerHaptic('light');
    },
    [triggerHaptic]
  );

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!touchStartRef.current || event.touches.length !== 1) return;

    // Prevent default scrolling for horizontal swipes
    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    if (deltaX > deltaY && deltaX > 20) {
      event.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (!touchStartRef.current || event.changedTouches.length !== 1) return;

      const touch = event.changedTouches[0];
      touchEndRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      };

      const gesture = calculateGesture(touchStartRef.current, touchEndRef.current);

      if (gesture) {
        setCurrentGesture(gesture);
        gestureHistory.current.push(gesture);

        // Keep only last 10 gestures in history
        if (gestureHistory.current.length > 10) {
          gestureHistory.current = gestureHistory.current.slice(-10);
        }

        handleSwipeNavigation(gesture);
      }

      setIsGestureActive(false);
      touchStartRef.current = null;
      touchEndRef.current = null;
    },
    [calculateGesture, handleSwipeNavigation]
  );

  // Set up event listeners
  useEffect(() => {
    if (!('ontouchstart' in window)) return; // Not a touch device

    const options: AddEventListenerOptions = { passive: false };

    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, options);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Gesture pattern recognition
  const getGesturePattern = useCallback(() => {
    const recentGestures = gestureHistory.current.slice(-3);
    if (recentGestures.length < 2) return null;

    // Detect common patterns
    const directions = recentGestures.map((g) => g.direction);

    if (directions.every((d) => d === 'left')) return 'swipe_left_sequence';
    if (directions.every((d) => d === 'right')) return 'swipe_right_sequence';
    if (directions.join('') === 'updown' || directions.join('') === 'downup')
      return 'shake_vertical';
    if (directions.join('') === 'leftright' || directions.join('') === 'rightleft')
      return 'shake_horizontal';

    return null;
  }, []);

  // Gesture statistics
  const getGestureStats = useCallback(() => {
    const gestures = gestureHistory.current;
    if (gestures.length === 0) return null;

    const avgVelocity = gestures.reduce((sum, g) => sum + g.velocity, 0) / gestures.length;
    const avgDistance = gestures.reduce((sum, g) => sum + g.distance, 0) / gestures.length;
    const directionCounts = gestures.reduce(
      (counts, g) => {
        counts[g.direction] = (counts[g.direction] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>
    );

    return {
      totalGestures: gestures.length,
      averageVelocity: avgVelocity,
      averageDistance: avgDistance,
      directionCounts,
      mostCommonDirection: Object.entries(directionCounts).sort(
        ([, a], [, b]) => b - a
      )[0]?.[0] as SwipeGesture['direction'],
    };
  }, []);

  return {
    isGestureActive,
    currentGesture,
    gestureHistory: gestureHistory.current,
    getGesturePattern,
    getGestureStats,
    triggerHaptic,
    settings: config,
  };
};
