import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface ProgressTrackingOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  silentFailure?: boolean;
}

interface UseProgressTrackingReturn {
  trackTermInteraction: (
    termId: string,
    sectionsViewed?: string[],
    timeSpentSeconds?: number,
    options?: ProgressTrackingOptions
  ) => Promise<void>;
  toggleBookmark: (
    termId: string,
    isBookmarked: boolean,
    options?: ProgressTrackingOptions
  ) => Promise<{ success: boolean; bookmarkCount?: number }>;
  isLoading: boolean;
}

export function useProgressTracking(): UseProgressTrackingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const trackTermInteraction = useCallback(async (
    termId: string,
    sectionsViewed: string[] = [],
    timeSpentSeconds: number = 0,
    options: ProgressTrackingOptions = {}
  ) => {
    if (!user) {
      return; // Skip tracking for unauthenticated users
    }

    const { onSuccess, onError, silentFailure = true } = options;

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/progress/track-interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          termId,
          sectionsViewed,
          timeSpentSeconds
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      onSuccess?.();
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      
      if (!silentFailure) {
        toast({
          title: "Error",
          description: "Failed to track your progress. Please try again.",
          variant: "destructive",
        });
      }

      onError?.(errorObj);
      
      // Log error for debugging but don't interrupt user experience
      console.warn('Failed to track term interaction:', errorObj);
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const toggleBookmark = useCallback(async (
    termId: string,
    isBookmarked: boolean,
    options: ProgressTrackingOptions = {}
  ): Promise<{ success: boolean; bookmarkCount?: number }> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to bookmark terms",
        variant: "destructive",
      });
      return { success: false };
    }

    const { onSuccess, onError, silentFailure = false } = options;

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/progress/bookmark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          termId,
          isBookmarked
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        const actionText = isBookmarked ? "Added to bookmarks" : "Removed from bookmarks";
        
        toast({
          title: actionText,
          description: isBookmarked 
            ? "Term has been bookmarked successfully" 
            : "Term has been removed from bookmarks",
        });

        onSuccess?.();
        return { success: true, bookmarkCount: data.bookmarkCount };
      } else {
        throw new Error(data.message || 'Failed to toggle bookmark');
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      
      if (!silentFailure) {
        toast({
          title: "Error",
          description: errorObj.message || "Failed to update bookmark. Please try again.",
          variant: "destructive",
        });
      }

      onError?.(errorObj);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  return {
    trackTermInteraction,
    toggleBookmark,
    isLoading
  };
}

export default useProgressTracking;