/**
 * Lazy-loaded Enhanced Storage to prevent initialization failures
 */

import type { EnhancedStorage } from './enhancedStorage';

let _enhancedStorage: EnhancedStorage | null = null;

export const getEnhancedStorage = (): EnhancedStorage => {
  if (!_enhancedStorage) {
    try {
      const { EnhancedStorage } = require('./enhancedStorage');
      _enhancedStorage = new EnhancedStorage();
    } catch (error) {
      console.error('[EnhancedStorage] Failed to initialize:', error);
      // Return a mock object that won't crash the app
      _enhancedStorage = {
        setContext: () => {},
        requireAuth: () => { throw new Error('Storage not initialized'); },
        requireAdminAuth: () => { throw new Error('Storage not initialized'); },
        logFailedAuth: () => {},
      } as any;
    }
  }
  return _enhancedStorage!;
};

export const enhancedStorage = new Proxy({} as EnhancedStorage, {
  get(_target, prop) {
    const storage = getEnhancedStorage();
    return storage[prop as keyof EnhancedStorage];
  }
});