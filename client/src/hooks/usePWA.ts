/**
 * PWA Hook
 * Manages Progressive Web App functionality including service worker, installation, and offline capabilities
 */

import { useState, useEffect, useCallback } from 'react';

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  isUpdateAvailable: boolean;
  installPrompt: any;
  serviceWorkerRegistration: ServiceWorkerRegistration | null;
}

interface PWACapabilities {
  canInstall: boolean;
  canNotify: boolean;
  canSync: boolean;
  canShare: boolean;
  hasServiceWorker: boolean;
}

interface CacheInfo {
  staticCacheSize: number;
  dynamicCacheSize: number;
  totalCacheSize: number;
  lastUpdated: Date | null;
}

export const usePWA = () => {
  const [pwaState, setPWAState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOffline: !navigator.onLine,
    isUpdateAvailable: false,
    installPrompt: null,
    serviceWorkerRegistration: null,
  });

  const [capabilities, setCapabilities] = useState<PWACapabilities>({
    canInstall: false,
    canNotify: false,
    canSync: false,
    canShare: false,
    hasServiceWorker: 'serviceWorker' in navigator,
  });

  const [cacheInfo, setCacheInfo] = useState<CacheInfo>({
    staticCacheSize: 0,
    dynamicCacheSize: 0,
    totalCacheSize: 0,
    lastUpdated: null,
  });

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      setPWAState(prev => ({
        ...prev,
        serviceWorkerRegistration: registration,
      }));

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setPWAState(prev => ({
                ...prev,
                isUpdateAvailable: true,
              }));
            }
          });
        }
      });

      console.log('Service Worker registered successfully');
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }, []);

  // Install PWA
  const installPWA = useCallback(async () => {
    if (!pwaState.installPrompt) {
      console.log('No install prompt available');
      return false;
    }

    try {
      const result = await pwaState.installPrompt.prompt();
      const outcome = await result.userChoice;
      
      if (outcome === 'accepted') {
        setPWAState(prev => ({
          ...prev,
          isInstalled: true,
          isInstallable: false,
          installPrompt: null,
        }));
        
        // Track installation analytics
        if (window.gtag) {
          window.gtag('event', 'pwa_install', {
            event_category: 'PWA',
            event_label: 'User accepted installation',
          });
        }
        
        return true;
      } else {
        console.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Error during PWA installation:', error);
      return false;
    }
  }, [pwaState.installPrompt]);

  // Update service worker
  const updateServiceWorker = useCallback(async () => {
    if (!pwaState.serviceWorkerRegistration) {
      console.log('No service worker registration available');
      return false;
    }

    try {
      const registration = pwaState.serviceWorkerRegistration;
      const newWorker = registration.waiting;
      
      if (newWorker) {
        newWorker.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
        return true;
      } else {
        // Force update check
        await registration.update();
        return true;
      }
    } catch (error) {
      console.error('Error updating service worker:', error);
      return false;
    }
  }, [pwaState.serviceWorkerRegistration]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      setCapabilities(prev => ({
        ...prev,
        canNotify: granted,
      }));
      
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  // Share content using Web Share API
  const shareContent = useCallback(async (data: {
    title?: string;
    text?: string;
    url?: string;
  }) => {
    if (!capabilities.canShare) {
      // Fallback to copying URL
      if (data.url) {
        await navigator.clipboard.writeText(data.url);
        return true;
      }
      return false;
    }

    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      console.error('Error sharing content:', error);
      return false;
    }
  }, [capabilities.canShare]);

  // Get cache information
  const getCacheInfo = useCallback(async (): Promise<CacheInfo> => {
    if (!('caches' in window)) {
      return {
        staticCacheSize: 0,
        dynamicCacheSize: 0,
        totalCacheSize: 0,
        lastUpdated: null,
      };
    }

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      let staticSize = 0;
      let dynamicSize = 0;
      let lastUpdated: Date | null = null;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const arrayBuffer = await response.arrayBuffer();
            const size = arrayBuffer.byteLength;
            totalSize += size;
            
            if (cacheName.includes('static')) {
              staticSize += size;
            } else {
              dynamicSize += size;
            }
            
            const dateHeader = response.headers.get('date');
            if (dateHeader) {
              const responseDate = new Date(dateHeader);
              if (!lastUpdated || responseDate > lastUpdated) {
                lastUpdated = responseDate;
              }
            }
          }
        }
      }

      const info: CacheInfo = {
        staticCacheSize: staticSize,
        dynamicCacheSize: dynamicSize,
        totalCacheSize: totalSize,
        lastUpdated,
      };

      setCacheInfo(info);
      return info;
    } catch (error) {
      console.error('Error getting cache info:', error);
      return cacheInfo;
    }
  }, [cacheInfo]);

  // Clear all caches
  const clearCache = useCallback(async () => {
    if (!('caches' in window)) {
      return false;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      
      setCacheInfo({
        staticCacheSize: 0,
        dynamicCacheSize: 0,
        totalCacheSize: 0,
        lastUpdated: null,
      });
      
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }, []);

  // Format cache size for display
  const formatCacheSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  // Check if app is running in standalone mode
  const isStandaloneMode = useCallback(() => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }, []);

  // Initialize PWA functionality
  useEffect(() => {
    // Register service worker
    registerServiceWorker();

    // Check PWA capabilities
    setCapabilities({
      canInstall: 'beforeinstallprompt' in window,
      canNotify: 'Notification' in window && Notification.permission !== 'denied',
      canSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      canShare: 'share' in navigator,
      hasServiceWorker: 'serviceWorker' in navigator,
    });

    // Check if already installed
    setPWAState(prev => ({
      ...prev,
      isInstalled: isStandaloneMode(),
    }));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPWAState(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt: e,
      }));
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setPWAState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        installPrompt: null,
      }));
    };

    // Listen for online/offline events
    const handleOnline = () => {
      setPWAState(prev => ({ ...prev, isOffline: false }));
    };

    const handleOffline = () => {
      setPWAState(prev => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get initial cache info
    getCacheInfo();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [registerServiceWorker, isStandaloneMode, getCacheInfo]);

  return {
    // State
    ...pwaState,
    capabilities,
    cacheInfo,
    
    // Actions
    installPWA,
    updateServiceWorker,
    requestNotificationPermission,
    shareContent,
    getCacheInfo,
    clearCache,
    
    // Utilities
    formatCacheSize,
    isStandaloneMode,
  };
};

export default usePWA;