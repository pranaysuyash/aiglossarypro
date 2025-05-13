import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ProgressTrackerProps {
  termId: string;
  isLearned: boolean;
}

export default function ProgressTracker({ termId, isLearned: initialIsLearned }: ProgressTrackerProps) {
  const [isLearned, setIsLearned] = useState(initialIsLearned);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const handleMarkAsLearned = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to track your progress",
        variant: "destructive",
      });
      window.location.href = "/api/login";
      return;
    }

    setIsLoading(true);
    
    try {
      await apiRequest(
        isLearned ? "DELETE" : "POST", 
        `/api/progress/${termId}`, 
      );
      
      setIsLearned(!isLearned);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/user/progress'] });
      
      toast({
        title: isLearned ? "Progress updated" : "Marked as learned",
        description: isLearned 
          ? "This term has been removed from your learned list" 
          : "This term has been added to your learned list",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
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
            <h3 className="font-medium text-gray-800 dark:text-gray-200">Track your progress</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isLearned 
                ? "You've marked this term as learned" 
                : "Mark this term as learned to track your progress"}
            </p>
          </div>
        </div>
        
        <Button
          variant={isLearned ? "outline" : "default"}
          onClick={handleMarkAsLearned}
          disabled={isLoading}
          className={isLearned ? "border-green-500 text-green-600" : ""}
        >
          {isLoading ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
              Processing...
            </span>
          ) : (
            isLearned ? "Mark as unlearned" : "Mark as learned"
          )}
        </Button>
      </div>
    </div>
  );
}
