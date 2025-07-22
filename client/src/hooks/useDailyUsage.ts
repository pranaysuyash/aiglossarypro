import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

interface DailyUsageData {
  todayViews: number;
  dailyLimit: number;
  remainingViews: number;
  isInGracePeriod: boolean;
  gracePeriodDaysLeft: number;
  resetTime: string;
  percentageUsed: number;
}

export function useDailyUsage() {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dailyUsage', user?.id],
    queryFn: async (): Promise<DailyUsageData> => {
      const response = await fetch('/api/user/daily-usage', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch daily usage');
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!user, // Only run if user is authenticated
    refetchInterval: false, // Disable automatic refetching to prevent loops
    refetchOnWindowFocus: false, // Disable window focus refetching
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
  });

  const shouldShowWarning = data && !data.isInGracePeriod && data.percentageUsed >= 80;

  return {
    usage: data,
    isLoading,
    error,
    refetch,
    shouldShowWarning,
  };
}
