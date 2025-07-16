/**
 * Service Worker Registration and Management
 * Handles PWA functionality, offline capabilities, and app updates
 */

interface ServiceWorkerCapabilities {
  hasServiceWorker: boolean;
  canInstall: boolean;
  canNotify: boolean;
  canShare: boolean;
  canSync: boolean;
}

interface CacheInfo {
  totalCacheSize: number;
  staticCacheSize: number;
  dynamicCacheSize: number;
  lastUpdated: Date;
}

interface PWAInstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class ServiceWorkerManager {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private deferredPrompt: PWAInstallEvent | null = null;
  private isOnline = navigator.onLine;
  private updateAvailable = false;
  private installPromptAvailable = false;

  // Event listeners
  private onlineListeners: (() => void)[] = [];
  private offlineListeners: (() => void)[] = [];
  private updateListeners: (() => void)[] = [];
  private installListeners: (() => void)[] = [];

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.log('Service workers not supported');
      return;
    }

    try {
      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      console.log('Service Worker registered successfully:', this.swRegistration);

      // Check for updates
      this.swRegistration.addEventListener('updatefound', () => {
        this.handleUpdateFound();
      });

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      // Check for waiting service worker
      if (this.swRegistration.waiting) {
        this.updateAvailable = true;
        this.notifyUpdateListeners();
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }

    // Setup event listeners
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.onlineListeners.forEach(listener => listener());
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.offlineListeners.forEach(listener => listener());
    });

    // PWA install prompt
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      this.deferredPrompt = event as PWAInstallEvent;
      this.installPromptAvailable = true;
      this.notifyInstallListeners();
    });

    // App installed
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.installPromptAvailable = false;
      console.log('PWA installed successfully');
    });
  }

  private handleUpdateFound() {
    if (!this.swRegistration) {return;}

    const newWorker = this.swRegistration.installing;
    if (!newWorker) {return;}

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // New update available
          this.updateAvailable = true;
          this.notifyUpdateListeners();
        } else {
          // First install
          console.log('Service Worker installed for the first time');
        }
      }
    });
  }

  // Public methods
  public async installPWA(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('PWA install prompt not available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA install');
        this.deferredPrompt = null;
        this.installPromptAvailable = false;
        return true;
      } 
        console.log('User dismissed PWA install');
        return false;
      
    } catch (error) {
      console.error('PWA install failed:', error);
      return false;
    }
  }

  public async updateServiceWorker(): Promise<void> {
    if (!this.swRegistration?.waiting) {
      console.log('No service worker update available');
      return;
    }

    try {
      // Send message to waiting service worker to skip waiting
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Update will be applied when controller changes
      this.updateAvailable = false;
    } catch (error) {
      console.error('Service Worker update failed:', error);
    }
  }

  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Notification permission request failed:', error);
      return false;
    }
  }

  public async shareContent(shareData: {
    title: string;
    text: string;
    url: string;
  }): Promise<boolean> {
    if (!navigator.share) {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        console.log('URL copied to clipboard');
        return true;
      } catch (error) {
        console.error('Share failed:', error);
        return false;
      }
    }

    try {
      await navigator.share(shareData);
      return true;
    } catch (error) {
      console.error('Share failed:', error);
      return false;
    }
  }

  public async getCacheInfo(): Promise<CacheInfo> {
    return new Promise(resolve => {
      if (!this.swRegistration) {
        resolve({
          totalCacheSize: 0,
          staticCacheSize: 0,
          dynamicCacheSize: 0,
          lastUpdated: new Date(),
        });
        return;
      }

      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = event => {
        resolve(event.data);
      };

      this.swRegistration.active?.postMessage({ type: 'CACHE_INFO' }, [messageChannel.port2]);

      // Timeout fallback
      setTimeout(() => {
        resolve({
          totalCacheSize: 0,
          staticCacheSize: 0,
          dynamicCacheSize: 0,
          lastUpdated: new Date(),
        });
      }, 5000);
    });
  }

  public async clearCache(): Promise<boolean> {
    return new Promise(resolve => {
      if (!this.swRegistration) {
        resolve(false);
        return;
      }

      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = event => {
        resolve(event.data.success);
      };

      this.swRegistration.active?.postMessage({ type: 'CLEAR_CACHE' }, [messageChannel.port2]);

      // Timeout fallback
      setTimeout(() => {
        resolve(false);
      }, 10000);
    });
  }

  public getCapabilities(): ServiceWorkerCapabilities {
    return {
      hasServiceWorker: !!this.swRegistration,
      canInstall: this.installPromptAvailable,
      canNotify: 'Notification' in window,
      canShare: 'share' in navigator,
      canSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    };
  }

  public isStandaloneMode(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  }

  public formatCacheSize(bytes: number): string {
    if (bytes === 0) {return '0 B';}

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  }

  public async queueAction(type: string, data: Record<string, unknown>): Promise<void> {
    try {
      const request = indexedDB.open('ai-glossary-queue', 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('actions')) {
          db.createObjectStore('actions', { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['actions'], 'readwrite');
        const store = transaction.objectStore('actions');

        store.add({
          type,
          data,
          timestamp: Date.now(),
        });
      };
    } catch (error) {
      console.error('Failed to queue action:', error);
    }
  }

  // Event listener management
  public onOnline(listener: () => void): void {
    this.onlineListeners.push(listener);
  }

  public onOffline(listener: () => void): void {
    this.offlineListeners.push(listener);
  }

  public onUpdateAvailable(listener: () => void): void {
    this.updateListeners.push(listener);
  }

  public onInstallPrompt(listener: () => void): void {
    this.installListeners.push(listener);
  }

  private notifyUpdateListeners(): void {
    this.updateListeners.forEach(listener => listener());
  }

  private notifyInstallListeners(): void {
    this.installListeners.forEach(listener => listener());
  }

  /**
   * Check content freshness and refresh if needed
   */
  public async checkContentFreshness(): Promise<void> {
    if (!this.swRegistration?.active) {
      return;
    }

    try {
      this.swRegistration.active.postMessage({ type: 'CHECK_CONTENT_FRESHNESS' });
    } catch (error) {
      console.error('Failed to check content freshness:', error);
    }
  }

  /**
   * Force refresh pre-cached content
   */
  public async forceRefreshContent(): Promise<number> {
    if (!this.swRegistration?.active) {
      return 0;
    }

    try {
      return new Promise(resolve => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = event => {
          if (event.data.type === 'REFRESH_COMPLETE') {
            resolve(event.data.count || 0);
          }
        };

        this.swRegistration?.active?.postMessage({ type: 'FORCE_REFRESH_CONTENT' }, [
          messageChannel.port2,
        ]);

        // Timeout after 30 seconds
        setTimeout(() => resolve(0), 30000);
      });
    } catch (error) {
      console.error('Failed to force refresh content:', error);
      return 0;
    }
  }

  // Getters
  public get isOffline(): boolean {
    return !this.isOnline;
  }

  public get isUpdateAvailable(): boolean {
    return this.updateAvailable;
  }

  public get isInstallable(): boolean {
    return this.installPromptAvailable;
  }

  public get isInstalled(): boolean {
    return this.isStandaloneMode();
  }
}

// Global instance
const serviceWorkerManager = new ServiceWorkerManager();

export default serviceWorkerManager;
export type { ServiceWorkerCapabilities, CacheInfo, PWAInstallEvent };
