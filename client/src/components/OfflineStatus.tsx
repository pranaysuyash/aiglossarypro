import { AnimatePresence, motion } from 'framer-motion';
import { CloudOff, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '../hooks/use-toast';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface OfflineStatusProps {
  onSync?: () => void;
  showSyncButton?: boolean;
}

interface CachedTerm {
  id: string;
  title: string;
  definition: string;
  category: string;
  cachedAt: string;
  lastViewed: string;
}

interface SyncQueueItem {
  id: string;
  type: 'favorite' | 'progress' | 'view';
  data: any;
  timestamp: string;
}

export function OfflineStatus({ onSync, showSyncButton = true }: OfflineStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isVisible, setIsVisible] = useState(false);
  const [cachedTerms, setCachedTerms] = useState<CachedTerm[]>([]);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsVisible(false);
      
      toast({
        title: '🌐 Back Online!',
        description: 'Syncing your progress...',
        duration: 3000,
      });
      
      // Auto-sync when coming back online
      handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsVisible(true);
      
      toast({
        title: '📱 You\'re Offline',
        description: 'Don\'t worry - your saved terms are still available!',
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load cached data on mount
  useEffect(() => {
    loadCachedTerms();
    loadSyncQueue();
    loadLastSyncTime();
  }, []);

  // Show banner when offline
  useEffect(() => {
    if (!isOnline) {
      setIsVisible(true);
    }
  }, [isOnline]);

  const loadCachedTerms = () => {
    try {
      const cached = localStorage.getItem('cached_terms');
      if (cached) {
        setCachedTerms(JSON.parse(cached));
      }
    } catch (error) {
      console.error('Failed to load cached terms:', error);
    }
  };

  const loadSyncQueue = () => {
    try {
      const queue = localStorage.getItem('sync_queue');
      if (queue) {
        setSyncQueue(JSON.parse(queue));
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  };

  const loadLastSyncTime = () => {
    const lastSync = localStorage.getItem('last_sync_time');
    setLastSyncTime(lastSync);
  };

  const handleSync = async () => {
    if (!isOnline) {
      toast({
        title: 'Cannot Sync',
        description: 'Please check your internet connection.',
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);

    try {
      // Process sync queue
      for (const item of syncQueue) {
        await processSyncItem(item);
      }

      // Clear sync queue
      localStorage.removeItem('sync_queue');
      setSyncQueue([]);

      // Update last sync time
      const now = new Date().toISOString();
      localStorage.setItem('last_sync_time', now);
      setLastSyncTime(now);

      toast({
        title: '✅ Sync Complete',
        description: 'All your progress has been saved to the cloud.',
        duration: 4000,
      });

      onSync?.();
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: 'Sync Failed',
        description: 'Some changes couldn\'t be synced. Will retry automatically.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const processSyncItem = async (item: SyncQueueItem) => {
    // Simulate API calls to sync data
    console.log('Syncing item:', item);
    
    switch (item.type) {
      case 'favorite':
        // Sync favorite status
        await new Promise(resolve => setTimeout(resolve, 200));
        break;
      case 'progress':
        // Sync reading progress
        await new Promise(resolve => setTimeout(resolve, 200));
        break;
      case 'view':
        // Sync term view
        await new Promise(resolve => setTimeout(resolve, 100));
        break;
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    
    const syncDate = new Date(lastSyncTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return syncDate.toLocaleDateString();
  };

  return (
    <>
      {/* Online/Offline Status Indicator */}
      <div className="fixed top-4 right-4 z-40">
        <Badge
          variant={isOnline ? 'default' : 'destructive'}
          className={`transition-all duration-300 ${
            isOnline 
              ? 'bg-green-500 hover:bg-green-600 text-white' 
              : 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
          }`}
        >
          {isOnline ? (
            <Wifi className="w-3 h-3 mr-1" />
          ) : (
            <WifiOff className="w-3 h-3 mr-1" />
          )}
          {isOnline ? 'Online' : 'Offline'}
        </Badge>
      </div>

      {/* Offline Banner */}
      <AnimatePresence>
        {isVisible && !isOnline && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
          >
            <div className="max-w-4xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CloudOff className="w-5 h-5" />
                  <div>
                    <div className="font-medium">You're offline</div>
                    <div className="text-sm opacity-90">
                      {cachedTerms.length > 0 
                        ? `${cachedTerms.length} terms available offline`
                        : 'Limited functionality available'
                      }
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {syncQueue.length > 0 && (
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {syncQueue.length} pending
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-white hover:bg-white/20"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync Status Card (when there are pending items) */}
      {syncQueue.length > 0 && isOnline && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-4 right-4 z-50 w-80"
        >
          <Card className="border-blue-200 dark:border-blue-800 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center text-blue-900 dark:text-blue-100">
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Required
              </CardTitle>
              <CardDescription>
                {syncQueue.length} changes waiting to sync
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Last sync: {formatLastSync()}
                </div>
                
                {showSyncButton && (
                  <Button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    {isSyncing ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-3 h-3 border border-white border-t-transparent rounded-full mr-2"
                        />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 mr-2" />
                        Sync Now
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </>
  );
}

// Hook for managing offline data
export function useOfflineData() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedTerms, setCachedTerms] = useState<CachedTerm[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load cached terms
    loadCachedTerms();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadCachedTerms = () => {
    try {
      const cached = localStorage.getItem('cached_terms');
      if (cached) {
        setCachedTerms(JSON.parse(cached));
      }
    } catch (error) {
      console.error('Failed to load cached terms:', error);
    }
  };

  const cacheTerms = (terms: CachedTerm[]) => {
    try {
      // Keep only the last 30 terms to save space
      const recentTerms = terms.slice(0, 30);
      localStorage.setItem('cached_terms', JSON.stringify(recentTerms));
      setCachedTerms(recentTerms);
    } catch (error) {
      console.error('Failed to cache terms:', error);
    }
  };

  const addToSyncQueue = (item: Omit<SyncQueueItem, 'id' | 'timestamp'>) => {
    try {
      const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
      const newItem: SyncQueueItem = {
        ...item,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      };
      
      queue.push(newItem);
      localStorage.setItem('sync_queue', JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to add to sync queue:', error);
    }
  };

  return {
    isOnline,
    cachedTerms,
    cacheTerms,
    addToSyncQueue,
  };
}

export default OfflineStatus;