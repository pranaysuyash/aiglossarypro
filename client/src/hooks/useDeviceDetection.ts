/**
 * Device Detection Hook
 * Comprehensive device and capability detection for responsive design
 */

import { useState, useEffect, useCallback } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isChrome: boolean;
  isSafari: boolean;
  isFirefox: boolean;
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  orientation: 'portrait' | 'landscape';
  hasNotchSupport: boolean;
  supportsHaptic: boolean;
  supportsWebGL: boolean;
  supportsServiceWorker: boolean;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  devicePixelRatio: number;
  viewportHeight: number;
  viewportWidth: number;
  safeAreaInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

const getScreenSize = (width: number): DeviceInfo['screenSize'] => {
  if (width < 480) return 'xs';
  if (width < 640) return 'sm';
  if (width < 768) return 'md';
  if (width < 1024) return 'lg';
  if (width < 1280) return 'xl';
  return '2xl';
};

const getUserAgent = (): string => {
  return typeof navigator !== 'undefined' ? navigator.userAgent : '';
};

const getConnectionType = (): DeviceInfo['connectionType'] => {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return 'unknown';
  }

  const connection = (navigator as any).connection;
  if (!connection) return 'unknown';

  const type = connection.effectiveType || connection.type;
  
  if (type === 'wifi') return 'wifi';
  if (['cellular', '2g', '3g', '4g', '5g'].includes(type)) return 'cellular';
  if (type === 'ethernet') return 'ethernet';
  
  return 'unknown';
};

const getSafeAreaInsets = (): DeviceInfo['safeAreaInsets'] => {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const computedStyle = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0', 10),
    right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0', 10),
    bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
    left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0', 10),
  };
};

const detectDevice = (): DeviceInfo => {
  if (typeof window === 'undefined') {
    // Server-side defaults
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTouchDevice: false,
      isIOS: false,
      isAndroid: false,
      isChrome: false,
      isSafari: false,
      isFirefox: false,
      screenSize: 'lg',
      orientation: 'landscape',
      hasNotchSupport: false,
      supportsHaptic: false,
      supportsWebGL: false,
      supportsServiceWorker: false,
      connectionType: 'unknown',
      devicePixelRatio: 1,
      viewportHeight: 768,
      viewportWidth: 1024,
      safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 }
    };
  }

  const userAgent = getUserAgent();
  const { innerWidth, innerHeight } = window;
  
  // Device type detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || innerWidth < 768;
  const isTablet = /iPad|Android.*(?!Mobile)/i.test(userAgent) || (innerWidth >= 768 && innerWidth < 1024);
  const isDesktop = !isMobile && !isTablet;
  
  // Touch detection
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // OS detection
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  
  // Browser detection
  const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isFirefox = /Firefox/.test(userAgent);
  
  // Screen properties
  const screenSize = getScreenSize(innerWidth);
  const orientation = innerHeight > innerWidth ? 'portrait' : 'landscape';
  
  // Feature detection
  const hasNotchSupport = isIOS && CSS.supports('padding-top: env(safe-area-inset-top)');
  const supportsHaptic = 'vibrate' in navigator;
  const supportsWebGL = (() => {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  })();
  const supportsServiceWorker = 'serviceWorker' in navigator;
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    isIOS,
    isAndroid,
    isChrome,
    isSafari,
    isFirefox,
    screenSize,
    orientation,
    hasNotchSupport,
    supportsHaptic,
    supportsWebGL,
    supportsServiceWorker,
    connectionType: getConnectionType(),
    devicePixelRatio: window.devicePixelRatio || 1,
    viewportHeight: innerHeight,
    viewportWidth: innerWidth,
    safeAreaInsets: getSafeAreaInsets()
  };
};

export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(detectDevice);

  const updateDeviceInfo = useCallback(() => {
    setDeviceInfo(detectDevice());
  }, []);

  useEffect(() => {
    // Update on resize and orientation change
    const handleResize = () => {
      updateDeviceInfo();
    };

    const handleOrientationChange = () => {
      // Delay to ensure proper viewport update
      setTimeout(updateDeviceInfo, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Also listen for media query changes
    const mediaQueries = [
      window.matchMedia('(max-width: 479px)'),
      window.matchMedia('(max-width: 639px)'),
      window.matchMedia('(max-width: 767px)'),
      window.matchMedia('(max-width: 1023px)'),
      window.matchMedia('(max-width: 1279px)'),
    ];

    const handleMediaChange = () => {
      updateDeviceInfo();
    };

    mediaQueries.forEach(mq => {
      if (mq.addEventListener) {
        mq.addEventListener('change', handleMediaChange);
      } else {
        // Fallback for older browsers
        mq.addListener(handleMediaChange);
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      
      mediaQueries.forEach(mq => {
        if (mq.removeEventListener) {
          mq.removeEventListener('change', handleMediaChange);
        } else {
          mq.removeListener(handleMediaChange);
        }
      });
    };
  }, [updateDeviceInfo]);

  // Utility functions
  const isBreakpoint = useCallback((breakpoint: DeviceInfo['screenSize']) => {
    const breakpointValues = {
      xs: 0,
      sm: 480,
      md: 640,
      lg: 768,
      xl: 1024,
      '2xl': 1280
    };
    
    return deviceInfo.viewportWidth >= breakpointValues[breakpoint];
  }, [deviceInfo.viewportWidth]);

  const canUseFeature = useCallback((feature: keyof Pick<DeviceInfo, 'supportsHaptic' | 'supportsWebGL' | 'supportsServiceWorker'>) => {
    return deviceInfo[feature];
  }, [deviceInfo]);

  const getOptimalImageSize = useCallback(() => {
    const { viewportWidth, devicePixelRatio } = deviceInfo;
    const baseWidth = Math.min(viewportWidth, 1200);
    return Math.round(baseWidth * devicePixelRatio);
  }, [deviceInfo]);

  const shouldUseNativeScroll = useCallback(() => {
    // Use native scroll on iOS for better performance
    return deviceInfo.isIOS || !deviceInfo.isTouchDevice;
  }, [deviceInfo.isIOS, deviceInfo.isTouchDevice]);

  const getConnectionQuality = useCallback(() => {
    const { connectionType } = deviceInfo;
    
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
      return 'good';
    }

    const connection = (navigator as any).connection;
    if (!connection) return 'good';

    const effectiveType = connection.effectiveType;
    
    if (effectiveType === '4g' || connectionType === 'wifi' || connectionType === 'ethernet') {
      return 'good';
    } else if (effectiveType === '3g') {
      return 'moderate';
    } else {
      return 'poor';
    }
  }, [deviceInfo.connectionType]);

  return {
    ...deviceInfo,
    isBreakpoint,
    canUseFeature,
    getOptimalImageSize,
    shouldUseNativeScroll,
    getConnectionQuality,
    refresh: updateDeviceInfo
  };
};