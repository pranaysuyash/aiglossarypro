/**
 * Unified BroadcastChannel and tabId manager
 * Prevents duplicate listeners and tabId mismatches
 */

let channel: BroadcastChannel | undefined;
let myTabId: string;

export function getAuthChannel(): BroadcastChannel | null {
  if (!channel && typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel('auth_state');
  }
  return channel ?? null;
}

export function getTabId(): string {
  if (!myTabId) {
    myTabId = crypto.randomUUID();
  }
  return myTabId;
}

export function closeAuthChannel(): void {
  if (channel) {
    channel.close();
    channel = undefined;
  }
}

// Ensure we only close on unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', closeAuthChannel);
  
  // Reset deduplicator on auth events from other tabs
  const channel = getAuthChannel();
  if (channel) {
    channel.addEventListener('message', (event) => {
      if (event.data?.type === 'login') {
        // Import dynamically to avoid circular dependencies
        import('./authQueryDeduplicator').then(({ authQueryDeduplicator }) => {
          authQueryDeduplicator.resetConsecutiveQueries();
        });
        
        // Also invalidate queries to refresh auth state
        import('@tanstack/react-query').then(({ useQueryClient }) => {
          const queryClient = useQueryClient();
          queryClient.invalidateQueries();
        });
      }
    });
  }
}