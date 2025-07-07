/**
 * Mobile Layout Wrapper
 * Comprehensive mobile-optimized layout with enhanced touch interactions
 */

import React, { ReactNode, useEffect } from 'react';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import MobileNavigation from './MobileNavigation';
import TouchOptimizedScroll from './TouchOptimizedScroll';
import { cn } from '../../lib/utils';

interface MobileLayoutWrapperProps {
  children: ReactNode;
  className?: string;
  enableMobileNav?: boolean;
  enableTouchScroll?: boolean;
  enablePullToRefresh?: boolean;
  onPullToRefresh?: () => Promise<void>;
  showGestureHints?: boolean;
  fullHeight?: boolean;
}

const MobileLayoutWrapper: React.FC<MobileLayoutWrapperProps> = ({
  children,
  className = '',
  enableMobileNav = true,
  enableTouchScroll = true,
  enablePullToRefresh = false,
  onPullToRefresh,
  showGestureHints = true,
  fullHeight = true
}) => {
  const device = useDeviceDetection();

  // Apply mobile-specific CSS custom properties
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    // Set device-specific CSS variables
    root.style.setProperty('--viewport-width', `${device.viewportWidth}px`);
    root.style.setProperty('--viewport-height', `${device.viewportHeight}px`);
    root.style.setProperty('--device-pixel-ratio', device.devicePixelRatio.toString());
    root.style.setProperty('--safe-area-inset-top', `${device.safeAreaInsets.top}px`);
    root.style.setProperty('--safe-area-inset-right', `${device.safeAreaInsets.right}px`);
    root.style.setProperty('--safe-area-inset-bottom', `${device.safeAreaInsets.bottom}px`);
    root.style.setProperty('--safe-area-inset-left', `${device.safeAreaInsets.left}px`);

    // Add device-specific classes to body
    const body = document.body;
    body.classList.toggle('is-mobile', device.isMobile);
    body.classList.toggle('is-tablet', device.isTablet);
    body.classList.toggle('is-desktop', device.isDesktop);
    body.classList.toggle('is-touch-device', device.isTouchDevice);
    body.classList.toggle('is-ios', device.isIOS);
    body.classList.toggle('is-android', device.isAndroid);
    body.classList.toggle('has-notch', device.hasNotchSupport);
    body.classList.toggle(`screen-${device.screenSize}`, true);
    body.classList.toggle(`orientation-${device.orientation}`, true);

    // Set viewport meta tag for mobile
    if (device.isMobile) {
      let viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        document.head.appendChild(viewport);
      }
      
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover'
      );

      // Prevent zoom on input focus (iOS)
      if (device.isIOS) {
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
          input.addEventListener('focus', () => {
            viewport!.setAttribute('content', 
              'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover'
            );
          });
        });
      }
    }

    // Optimize for touch devices
    if (device.isTouchDevice) {
      root.style.setProperty('--touch-action', 'manipulation');
      body.style.touchAction = 'manipulation';
    }

    return () => {
      // Cleanup device classes
      body.classList.remove(
        'is-mobile', 'is-tablet', 'is-desktop', 'is-touch-device',
        'is-ios', 'is-android', 'has-notch',
        `screen-${device.screenSize}`, `orientation-${device.orientation}`
      );
    };
  }, [device]);

  // Handle scroll behavior based on device capabilities
  const handleScroll = (scrollTop: number, direction: 'up' | 'down') => {
    // Hide/show mobile navigation based on scroll direction
    if (device.isMobile && enableMobileNav) {
      const nav = document.querySelector('[data-mobile-nav]');
      if (nav) {
        if (direction === 'down' && scrollTop > 100) {
          nav.classList.add('translate-y-full');
        } else if (direction === 'up' || scrollTop < 100) {
          nav.classList.remove('translate-y-full');
        }
      }
    }
  };

  // Determine if we should use mobile layout
  const useMobileLayout = device.isMobile || device.isTablet;

  // Content wrapper classes
  const contentClasses = cn(
    'relative',
    fullHeight && 'min-h-screen',
    useMobileLayout && [
      'safe-area-padding',
      enableMobileNav && 'pb-16', // Account for bottom navigation
      device.hasNotchSupport && 'pt-safe',
    ],
    !useMobileLayout && 'min-h-screen',
    className
  );

  // Render mobile layout
  if (useMobileLayout) {
    const content = enableTouchScroll ? (
      <TouchOptimizedScroll
        className={cn("flex-1", fullHeight && "h-full")}
        onScroll={handleScroll}
        enableMomentum={!device.shouldUseNativeScroll()}
        bounceEffect={device.isIOS}
        pullToRefresh={enablePullToRefresh}
        onPullToRefresh={onPullToRefresh}
        showScrollIndicator={device.isMobile}
        autoHideScrollbar={true}
      >
        <div className={contentClasses}>
          {children}
        </div>
      </TouchOptimizedScroll>
    ) : (
      <div className={cn(contentClasses, "overflow-auto")}>
        {children}
      </div>
    );

    return (
      <div className={cn(
        "flex flex-col",
        fullHeight && "h-screen max-h-screen",
        "bg-white dark:bg-gray-900"
      )}>
        {content}
        
        {enableMobileNav && (
          <MobileNavigation 
            className="transition-transform duration-300 ease-in-out"
            data-mobile-nav
            showGestureHints={showGestureHints}
          />
        )}
      </div>
    );
  }

  // Render desktop layout
  return (
    <div className={contentClasses}>
      {children}
    </div>
  );
};

export default MobileLayoutWrapper;

// CSS to be added to global styles
export const mobileLayoutStyles = `
  /* Safe area support */
  .safe-area-padding {
    padding-top: env(safe-area-inset-top);
    padding-right: env(safe-area-inset-right);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
  }

  .pt-safe {
    padding-top: max(1rem, env(safe-area-inset-top));
  }

  .pb-safe {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }

  .pl-safe {
    padding-left: max(1rem, env(safe-area-inset-left));
  }

  .pr-safe {
    padding-right: max(1rem, env(safe-area-inset-right));
  }

  /* Touch optimizations */
  .is-touch-device {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .is-touch-device input,
  .is-touch-device textarea,
  .is-touch-device select {
    -webkit-user-select: auto;
  }

  /* iOS specific */
  .is-ios {
    -webkit-overflow-scrolling: touch;
  }

  .is-ios input[type="text"],
  .is-ios input[type="email"],
  .is-ios input[type="password"],
  .is-ios textarea {
    font-size: 16px; /* Prevent zoom on focus */
  }

  /* Scrollbar hiding */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  /* Bounce effect for iOS */
  .overscroll-y-bounce {
    overscroll-behavior-y: auto;
  }

  /* Mobile navigation transitions */
  [data-mobile-nav] {
    transition: transform 0.3s ease-in-out;
  }

  /* Responsive font scaling */
  @media (max-width: 640px) {
    html {
      font-size: 14px;
    }
  }

  @media (max-width: 480px) {
    html {
      font-size: 13px;
    }
  }

  /* High DPI displays */
  @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    .high-dpi-optimized {
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* Dark mode optimizations for mobile */
  @media (prefers-color-scheme: dark) {
    .is-mobile {
      color-scheme: dark;
    }
  }
`;