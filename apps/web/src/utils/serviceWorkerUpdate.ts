// Force update service worker
export async function forceUpdateServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      // Unregister all service workers
      for (const registration of registrations) {
        await registration.unregister();
        console.log('Service worker unregistered:', registration.scope);
      }
      
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }
      
      // Re-register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker re-registered:', registration);
      
      // Force update
      await registration.update();
      
      return true;
    } catch (error) {
      console.error('Failed to update service worker:', error);
      return false;
    }
  }
  return false;
}