import { useEffect, useState } from 'react';
import type { BackgroundType } from '@/components/landing/backgrounds';

interface ABTestConfig {
  enabled: boolean;
  variants: BackgroundType[];
  sessionKey: string;
  cycleInterval?: number; // in milliseconds
}

const DEFAULT_CONFIG: ABTestConfig = {
  enabled: true,
  variants: ['neural', 'code', 'geometric', 'default'],
  sessionKey: 'hero_background_variant',
  cycleInterval: 30000, // 30 seconds
};

// Check if browser supports advanced features
const isBrowserSupported = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check for Canvas support
  const canvas = document.createElement('canvas');
  const canvasSupported = !!canvas.getContext?.('2d');

  // Check for requestAnimationFrame
  const rafSupported = !!(
    window.requestAnimationFrame || (window as any).webkitRequestAnimationFrame
  );

  // Check for modern JavaScript features
  const modernJSSupported = !!(
    typeof Promise !== 'undefined' &&
    typeof Symbol !== 'undefined' &&
    typeof Array.prototype.includes === 'function' &&
    typeof Object.assign === 'function'
  );

  // Check device capabilities for mobile optimization
  const isMobile = window.innerWidth < 768;
  const isLowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;

  // Use fallback on low-power mobile devices
  if (isMobile && isLowPower) {
    return false;
  }

  return canvasSupported && rafSupported && modernJSSupported;
};

export function useBackgroundABTest(config: Partial<ABTestConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [currentVariant, setCurrentVariant] = useState<BackgroundType>(finalConfig.variants[0]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !finalConfig.enabled) return;

    // Check browser compatibility
    const browserSupported = isBrowserSupported();

    // If browser doesn't support advanced features, use fallback
    if (!browserSupported) {
      setCurrentVariant('fallback');
      return;
    }

    // Check if user has a stored variant from this session
    const storedVariant = sessionStorage.getItem(finalConfig.sessionKey);
    if (storedVariant && finalConfig.variants.includes(storedVariant as BackgroundType)) {
      setCurrentVariant(storedVariant as BackgroundType);
    } else {
      // Assign random variant and store it
      const randomVariant =
        finalConfig.variants[Math.floor(Math.random() * finalConfig.variants.length)];
      setCurrentVariant(randomVariant);
      sessionStorage.setItem(finalConfig.sessionKey, randomVariant);
    }

    // Optional: Set up cycling through variants (for testing purposes)
    if (finalConfig.cycleInterval && process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        setCurrentVariant((prev) => {
          const currentIndex = finalConfig.variants.indexOf(prev);
          const nextIndex = (currentIndex + 1) % finalConfig.variants.length;
          const nextVariant = finalConfig.variants[nextIndex];
          sessionStorage.setItem(finalConfig.sessionKey, nextVariant);
          return nextVariant;
        });
      }, finalConfig.cycleInterval);

      return () => clearInterval(interval);
    }
  }, [isClient, finalConfig]);

  const setVariant = (variant: BackgroundType) => {
    if (finalConfig.variants.includes(variant)) {
      setCurrentVariant(variant);
      sessionStorage.setItem(finalConfig.sessionKey, variant);
    }
  };

  const trackInteraction = (action: string) => {
    // Track analytics for A/B testing
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'hero_background_interaction', {
        event_category: 'ab_test',
        event_label: currentVariant,
        action: action,
        custom_map: {
          background_variant: currentVariant,
        },
      });
    }

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`AB Test - Background: ${currentVariant}, Action: ${action}`);
    }
  };

  return {
    currentVariant,
    setVariant,
    trackInteraction,
    isClient,
    variants: finalConfig.variants,
    enabled: finalConfig.enabled,
  };
}
