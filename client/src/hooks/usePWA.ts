/**
 * PWA Hook
 * Manages Progressive Web App functionality including service worker, installation, and offline capabilities
 */

import { useState, useEffect, useCallback } from 'react';
import serviceWorkerManager from '../utils/serviceWorkerRegistration';

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

  // Register service worker (now handled by serviceWorkerManager)
  const registerServiceWorker = useCallback(async () => {
    // Service worker registration is handled by serviceWorkerManager
    return null;
  }, []);

  // Install PWA
  const installPWA = useCallback(async () => {
    const success = await serviceWorkerManager.installPWA();
    
    if (success) {
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
    }
    
    return success;
  }, []);

  // Update service worker
  const updateServiceWorker = useCallback(async () => {
    await serviceWorkerManager.updateServiceWorker();
    
    setPWAState(prev => ({
      ...prev,
      isUpdateAvailable: false,
    }));
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    const granted = await serviceWorkerManager.requestNotificationPermission();
    
    setCapabilities(prev => ({
      ...prev,
      canNotify: granted,
    }));
    
    return granted;
  }, []);

  // Share content using Web Share API
  const shareContent = useCallback(async (data: {
    title?: string;
    text?: string;
    url?: string;
  }) => {
    return await serviceWorkerManager.shareContent({
      title: data.title || '',
      text: data.text || '',
      url: data.url || ''
    });
  }, []);

  // Get cache information
  const getCacheInfo = useCallback(async (): Promise<CacheInfo> => {
    const info = await serviceWorkerManager.getCacheInfo();
    
    const formattedInfo: CacheInfo = {
      staticCacheSize: info.staticCacheSize,
      dynamicCacheSize: info.dynamicCacheSize,
      totalCacheSize: info.totalCacheSize,
      lastUpdated: info.lastUpdated,
    };
    
    setCacheInfo(formattedInfo);
    return formattedInfo;
  }, []);

  // Clear all caches
  const clearCache = useCallback(async () => {
    const success = await serviceWorkerManager.clearCache();
    
    if (success) {
      setCacheInfo({
        staticCacheSize: 0,
        dynamicCacheSize: 0,
        totalCacheSize: 0,
        lastUpdated: null,
      });
    }
    
    return success;
  }, []);

  // Format cache size for display
  const formatCacheSize = useCallback((bytes: number): string => {
    return serviceWorkerManager.formatCacheSize(bytes);
  }, []);

  // Check if app is running in standalone mode
  const isStandaloneMode = useCallback(() => {
    return serviceWorkerManager.isStandaloneMode();
  }, []);

  // Initialize PWA functionality
  useEffect(() => {
    // Set up capabilities using serviceWorkerManager
    const capabilities = serviceWorkerManager.getCapabilities();
    setCapabilities(capabilities);

    // Set initial state
    setPWAState(prev => ({
      ...prev,
      isInstalled: serviceWorkerManager.isInstalled,
      isInstallable: serviceWorkerManager.isInstallable,
      isOffline: serviceWorkerManager.isOffline,
      isUpdateAvailable: serviceWorkerManager.isUpdateAvailable,
      serviceWorkerRegistration: null, // Managed by serviceWorkerManager
    }));

    // Set up event listeners with serviceWorkerManager
    const handleOnline = () => {
      setPWAState(prev => ({ ...prev, isOffline: false }));
    };

    const handleOffline = () => {
      setPWAState(prev => ({ ...prev, isOffline: true }));
    };

    const handleUpdateAvailable = () => {
      setPWAState(prev => ({ ...prev, isUpdateAvailable: true }));
    };

    const handleInstallPrompt = () => {
      setPWAState(prev => ({ ...prev, isInstallable: true }));
    };

    // Register event listeners
    serviceWorkerManager.onOnline(handleOnline);
    serviceWorkerManager.onOffline(handleOffline);
    serviceWorkerManager.onUpdateAvailable(handleUpdateAvailable);
    serviceWorkerManager.onInstallPrompt(handleInstallPrompt);

    // Get initial cache info
    getCacheInfo();

    // No cleanup needed as serviceWorkerManager handles its own event listeners
  }, [getCacheInfo]);

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