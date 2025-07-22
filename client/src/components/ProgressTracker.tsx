import { Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PROGRESS_LABELS, PROGRESS_MESSAGES } from '@/constants/messages';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface ProgressTrackerProps {
  termId: string;
  isLearned: boolean;
}

export default function ProgressTracker({
  termId,
  isLearned: initialIsLearned,
}: ProgressTrackerProps) {
  const [isLearned, setIsLearned] = useState(initialIsLearned);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const handleMarkAsLearned = async () => {
    if (!isAuthenticated) {
      toast({
        ...PROGRESS_MESSAGES.AUTH_REQUIRED,
        variant: 'destructive',
      });
      window.location.href = '/login';
      return;
    }

    setIsLoading(true);

    try {
      await apiRequest(isLearned ? 'DELETE' : 'POST', `/api/progress/${termId}`);

      setIsLearned(!isLearned);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/user/progress'] });

      toast(isLearned ? PROGRESS_MESSAGES.UPDATED : PROGRESS_MESSAGES.MARKED_LEARNED);
    } catch (_error) {
      toast({
        ...PROGRESS_MESSAGES.ERROR,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-b-lg border-t border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="mr-3">
            <Check className={`h-5 w-5 ${isLearned ? 'text-green-500' : 'text-gray-400'}`} />
          </div>
          <div>
            <h3 className="font-medium text-gray-800 dark:text-gray-200">
              {PROGRESS_LABELS.TRACK_PROGRESS}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isLearned ? PROGRESS_LABELS.MARKED_AS_LEARNED : PROGRESS_LABELS.MARK_TO_TRACK}
            </p>
          </div>
        </div>

        <Button
          variant={isLearned ? 'outline' : 'default'}
          onClick={handleMarkAsLearned}
          disabled={isLoading}
          className={isLearned ? 'border-green-500 text-green-600' : ''}
        >
          {isLoading ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
              {PROGRESS_LABELS.PROCESSING}
            </span>
          ) : isLearned ? (
            PROGRESS_LABELS.MARK_UNLEARNED
          ) : (
            PROGRESS_LABELS.MARK_LEARNED
          )}
        </Button>
      </div>
    </div>
  );
}
