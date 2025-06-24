import { useState, useCallback, memo } from "react";
import { Link } from "wouter";
import { Heart, Copy, Share2 } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { ITerm } from "@/interfaces/interfaces";
import ShareMenu from "./ShareMenu";

interface TermCardProps {
  term: ITerm;
  isFavorite?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
  showActions?: boolean;
}

const TermCard = memo(function TermCard({ 
  term, 
  isFavorite = false, 
  variant = 'default',
  showActions = true 
}: TermCardProps) {
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [favorite, setFavorite] = useState(isFavorite);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const handleToggleFavorite = useCallback(async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save favorites",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest(
        favorite ? "DELETE" : "POST", 
        `/api/favorites/${term.id}`, 
      );
      
      setFavorite(!favorite);
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      
      toast({
        title: favorite ? "Removed from favorites" : "Added to favorites",
        description: favorite 
          ? `${term.name} has been removed from your favorites` 
          : `${term.name} has been added to your favorites`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, favorite, term.id, term.name, toast]);

  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/term/${term.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Link has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy manually",
        variant: "destructive",
      });
    }
  }, [term.id, toast]);

  // Track term view
  const handleTermClick = useCallback(async () => {
    try {
      await apiRequest("POST", `/api/terms/${term.id}/view`, null);
    } catch (error) {
      // Silent fail - not critical for UX
      console.error("Failed to log term view", error);
    }
  }, [term.id]);

  // Minimal variant - just title and link
  if (variant === 'minimal') {
    return (
      <div className="p-2 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <div className="flex items-center justify-between">
          <div 
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium cursor-pointer flex-1"
            onClick={() => {
              handleTermClick();
              window.location.href = `/term/${term.id}`;
            }}
          >
            {term.name}
          </div>
          {showActions && (
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-6 w-6 ml-2 ${favorite ? 'text-accent-500' : 'text-gray-400 hover:text-accent-500'}`}
              onClick={handleToggleFavorite}
              disabled={isSubmitting}
            >
              <Heart className={favorite ? 'fill-current' : ''} size={14} />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Compact variant - condensed card
  if (variant === 'compact') {
    return (
      <Card className="h-full flex flex-col transition-shadow hover:shadow-md">
        <CardContent className="p-3 flex-1">
          <div className="flex items-start justify-between mb-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 text-xs">
              {term.category}
            </Badge>
            {showActions && (
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-6 w-6 ${favorite ? 'text-accent-500' : 'text-gray-400 hover:text-accent-500'}`}
                onClick={handleToggleFavorite}
                disabled={isSubmitting}
              >
                <Heart className={favorite ? 'fill-current' : ''} size={16} />
              </Button>
            )}
          </div>
          
          <h3 className="font-semibold text-base mb-1 line-clamp-2">{term.name}</h3>
          
          <p className="text-gray-600 dark:text-gray-400 text-xs mb-2 line-clamp-2">
            {term.shortDefinition}
          </p>
        </CardContent>
        
        <CardFooter className="border-t border-gray-100 dark:border-gray-800 p-2 flex justify-between items-center">
          <div
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-xs font-medium cursor-pointer"
            onClick={() => {
              handleTermClick();
              window.location.href = `/term/${term.id}`;
            }}
          >
            View
          </div>
          
          {showActions && (
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyLink}>
                <Copy size={12} className="text-gray-500 dark:text-gray-400" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6" 
                onClick={() => setIsShareMenuOpen(true)}
              >
                <Share2 size={12} className="text-gray-500 dark:text-gray-400" />
              </Button>
            </div>
          )}
        </CardFooter>
        
        <ShareMenu 
          isOpen={isShareMenuOpen} 
          onClose={() => setIsShareMenuOpen(false)}
          title={term.name}
          url={`${window.location.origin}/term/${term.id}`}
        />
      </Card>
    );
  }

  // Default variant - full card
  return (
    <Card className="h-full flex flex-col transition-shadow hover:shadow-md">
      <CardContent className="p-4 flex-1">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300">
            {term.category}
          </Badge>
          {showActions && (
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-8 w-8 ${favorite ? 'text-accent-500' : 'text-gray-400 hover:text-accent-500'}`}
              onClick={handleToggleFavorite}
              disabled={isSubmitting}
            >
              <Heart className={favorite ? 'fill-current' : ''} size={20} />
            </Button>
          )}
        </div>
        
        <h3 className="font-semibold text-lg mb-1">{term.name}</h3>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-3">
          {term.shortDefinition}
        </p>
        
        {term.subcategories && term.subcategories.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span className="font-medium">Categories: </span>
            <span>{term.subcategories.join(', ')}</span>
          </div>
        )}
      </CardContent>
      
      {showActions && (
        <CardFooter className="border-t border-gray-100 dark:border-gray-800 p-3 flex justify-between items-center">
          <div
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium cursor-pointer"
            onClick={() => {
              handleTermClick();
              window.location.href = `/term/${term.id}`;
            }}
          >
            Read more
          </div>
          
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyLink}>
                    <Copy size={16} className="text-gray-500 dark:text-gray-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy link</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8" 
                    onClick={() => setIsShareMenuOpen(true)}
                  >
                    <Share2 size={16} className="text-gray-500 dark:text-gray-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <ShareMenu 
              isOpen={isShareMenuOpen} 
              onClose={() => setIsShareMenuOpen(false)}
              title={term.name}
              url={`${window.location.origin}/term/${term.id}`}
            />
          </div>
        </CardFooter>
      )}
    </Card>
  );
});

export default TermCard;
