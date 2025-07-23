import { memo, useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveRegion } from '@/components/accessibility/LiveRegion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { CheckCircle, Copy, Folder, FolderOpen, Heart, Share2 } from '@/components/ui/icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { ITerm } from '@/interfaces/interfaces';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import type { BaseComponentProps } from '@/types/common-props';
import { sanitizeHTML } from '@/utils/sanitize';
import ShareMenu from './ShareMenu';

interface TermCardProps extends BaseComponentProps {
  term: ITerm & {
    highlightedName?: string;
    highlightedDefinition?: string;
    searchQuery?: string;
  };
  isFavorite?: boolean;
  isLearned?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
  showActions?: boolean;
  showCategoryInfo?: boolean;
  compact?: boolean;
  onTermClick?: (termId: string) => void;
  onFavoriteToggle?: (termId: string, isFavorite: boolean) => void;
  onLearnedToggle?: (termId: string, isLearned: boolean) => void;
}

// Helper component for rendering highlighted text safely
const HighlightedText = memo(
  ({ text, htmlText, className = '' }: { text: string; htmlText?: string; className?: string }) => {
    if (htmlText && htmlText !== text) {
      return (
        <span
          className={cn('search-highlighted', className)}
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(htmlText) }}
        />
      );
    }
    return <span className={className}>{text}</span>;
  }
);

// Helper component for rendering category and subcategory badges
const CategoryBadges = memo(({ term, variant }: { term: ITerm; variant: string }) => {
  const badgeSize = variant === 'compact' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex flex-wrap gap-1">
      {/* Main Category Badge */}
      <Link to={`/category/${term.categoryId}`}>
        <Badge
          variant="secondary"
          className={`bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 ${badgeSize} cursor-pointer transition-colors`}
        >
          <FolderOpen className="w-3 h-3 mr-1" />
          {term.category}
        </Badge>
      </Link>

      {/* Subcategory Badges */}
      {term.subcategoryIds && term.subcategoryIds.length > 0 && (
        <>
          {term.subcategoryIds
            .slice(0, variant === 'compact' ? 1 : 2)
            .map((subcategoryId, index) => {
              const subcategoryName = term.subcategories?.[index] || `Subcategory ${index + 1}`;
              return (
                <Link key={subcategoryId} to={`/subcategories/${subcategoryId}`}>
                  <Badge
                    variant="outline"
                    className={`text-gray-600 hover:text-primary hover:border-primary dark:text-gray-400 ${badgeSize} cursor-pointer transition-colors`}
                  >
                    <Folder className="w-3 h-3 mr-1" />
                    {subcategoryName}
                  </Badge>
                </Link>
              );
            })}
          {term.subcategoryIds.length > (variant === 'compact' ? 1 : 2) && (
            <Badge variant="outline" className={`text-gray-500 ${badgeSize}`}>
              +{term.subcategoryIds.length - (variant === 'compact' ? 1 : 2)} more
            </Badge>
          )}
        </>
      )}
    </div>
  );
});

const TermCard = memo(function TermCard({
  term,
  isFavorite = false,
  isLearned = false,
  variant = 'default',
  showActions = true,
  showCategoryInfo = true,
  compact = false,
  className,
  id,
  children,
  onTermClick,
  onFavoriteToggle,
  onLearnedToggle,
}: TermCardProps) {
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [favorite, setFavorite] = useState(isFavorite);
  const [learned, setLearned] = useState(isLearned);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { announce } = useLiveRegion();

  // Memoize expensive calculations
  const termUrl = useMemo(() => `${window.location.origin}/term/${term.id}`, [term.id]);
  const truncatedDefinition = useMemo(
    () => term.shortDefinition?.substring(0, 200) || '',
    [term.shortDefinition]
  );
  const _subcategoriesText = useMemo(
    () => term.subcategories?.join(', ') || '',
    [term.subcategories]
  );

  // Track term interaction when card is clicked
  const handleTermClick = useCallback(async () => {
    if (isAuthenticated) {
      try {
        // Track term interaction for progress tracking
        await apiRequest('POST', '/api/progress/track-interaction', {
          termId: term.id,
          sectionsViewed: ['overview'], // Card view counts as overview section
          timeSpentSeconds: 5, // Estimate for card view
        });
      } catch (error: any) {
        // Silent fail - don't interrupt user experience
        console.warn('Failed to track term interaction:', error);
      }
    }

    // Call the provided click handler
    onTermClick?.(term.id);
  }, [isAuthenticated, term.id, onTermClick]);

  const handleToggleFavorite = useCallback(async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to save favorites',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Use the new bookmark API for progress tracking
      await apiRequest('POST', '/api/progress/bookmark', {
        termId: term.id,
        isBookmarked: !favorite,
      });

      const newFavoriteState = !favorite;
      setFavorite(newFavoriteState);
      onFavoriteToggle?.(term.id, newFavoriteState);
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress/stats'] });

      const actionText = newFavoriteState ? 'Added to bookmarks' : 'Removed from bookmarks';
      announce(`${term.name} ${actionText.toLowerCase()}`, 'polite');

      toast({
        title: actionText,
        description: newFavoriteState
          ? `${term.name} has been bookmarked`
          : `${term.name} has been removed from bookmarks`,
      });
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to update bookmark. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, favorite, term.id, term.name, toast, onFavoriteToggle, announce]);

  const handleToggleLearned = useCallback(async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to track your progress',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest(learned ? 'DELETE' : 'POST', `/api/progress/${term.id}`);

      const newLearnedState = !learned;
      setLearned(newLearnedState);
      onLearnedToggle?.(term.id, newLearnedState);
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });

      const actionText = newLearnedState ? 'Marked as learned' : 'Removed from learned';
      announce(`${term.name} ${actionText.toLowerCase()}`, 'polite');

      toast({
        title: actionText,
        description: newLearnedState
          ? `${term.name} has been added to your learned terms`
          : `${term.name} has been removed from your learned terms`,
      });
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to update progress. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, learned, term.id, term.name, toast, onLearnedToggle, announce]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(termUrl);
      announce(`Link copied for ${term.name}`, 'polite');
      toast({
        title: 'Link copied',
        description: 'Link has been copied to clipboard',
      });
    } catch (_error) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again or copy manually',
        variant: 'destructive',
      });
    }
  }, [termUrl, toast, announce, term.name]);

  // Track term view
  const _handleTermViewClick = useCallback(async () => {
    try {
      await apiRequest('POST', `/api/terms/${term.id}/view`, null);
      onTermClick?.(term.id);
    } catch (error: any) {
      // Silent fail - not critical for UX
      console.error('Failed to log term view', error);
    }
  }, [term.id, onTermClick]);

  // Minimal variant - just title and link
  if (variant === 'minimal') {
    return (
      <div
        id={id}
        className={cn(
          'p-2 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
          className
        )}
        data-testid="term-card"
      >
        <div className="flex items-center justify-between">
          <Link
            href={`/term/${term.id}`}
            onClick={handleTermClick}
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium flex-1"
          >
            <HighlightedText text={term.name} htmlText={term.highlightedName} />
          </Link>
          {showActions && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ml-2 ${favorite ? 'text-accent-500' : 'text-gray-400 dark:text-gray-300 hover:text-accent-500'}`}
              onClick={handleToggleFavorite}
              disabled={isSubmitting}
            >
              <Heart className={favorite ? 'fill-current' : ''} size={16} />
            </Button>
          )}
        </div>
        {children}
      </div>
    );
  }

  // Compact variant - condensed card
  if (variant === 'compact') {
    return (
      <Card
        id={id}
        className={cn('h-full flex flex-col transition-shadow hover:shadow-md', className)}
        data-testid="term-card"
      >
        <CardContent className="p-4 flex-1">
          <div className="flex items-start justify-between mb-2">
            {showCategoryInfo ? (
              <CategoryBadges term={term} variant={variant} />
            ) : (
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 text-xs"
              >
                {term.category}
              </Badge>
            )}
            {showActions && (
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ml-2 flex-shrink-0 ${favorite ? 'text-accent-500' : 'text-gray-400 dark:text-gray-300 hover:text-accent-500'}`}
                onClick={handleToggleFavorite}
                disabled={isSubmitting}
              >
                <Heart className={favorite ? 'fill-current' : ''} size={18} />
              </Button>
            )}
          </div>

          <h3 className="font-semibold text-base sm:text-lg mb-1 line-clamp-2">
            <HighlightedText text={term.name} htmlText={term.highlightedName} />
          </h3>

          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
            <HighlightedText text={truncatedDefinition} htmlText={term.highlightedDefinition} />
          </p>
        </CardContent>

        <CardFooter className="border-t border-gray-100 dark:border-gray-800 p-2 flex justify-between items-center">
          <Link
            href={`/term/${term.id}`}
            onClick={handleTermClick}
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-xs font-medium"
          >
            View
          </Link>

          {showActions && (
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyLink}>
                <Copy size={12} className="text-gray-500 dark:text-gray-300" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsShareMenuOpen(true)}
              >
                <Share2 size={12} className="text-gray-500 dark:text-gray-300" />
              </Button>
            </div>
          )}
        </CardFooter>

        <ShareMenu
          isOpen={isShareMenuOpen}
          onClose={() => setIsShareMenuOpen(false)}
          title={term.name}
          url={termUrl}
        />
        {children}
      </Card>
    );
  }

  // Default variant - full card
  return (
    <Card
      id={id}
      className={cn(
        'h-full flex flex-col transition-shadow hover:shadow-md min-h-[280px]',
        className
      )}
      data-testid="term-card"
    >
      <CardContent className="p-4 flex-1">
        <div className="flex items-start justify-between mb-3">
          {showCategoryInfo ? (
            <div className="flex-1 mr-2">
              <CategoryBadges term={term} variant={variant} />
            </div>
          ) : (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300"
            >
              {term.category}
            </Badge>
          )}

          {showActions && (
            <div className="flex items-center flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${learned ? 'text-green-500' : 'text-gray-400 dark:text-gray-300 hover:text-green-500'}`}
                onClick={handleToggleLearned}
                disabled={isSubmitting}
                aria-label={learned ? 'Mark as unlearned' : 'Mark as learned'}
              >
                <CheckCircle className={learned ? 'fill-current' : ''} size={20} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${favorite ? 'text-accent-500' : 'text-gray-400 dark:text-gray-300 hover:text-accent-500'}`}
                onClick={handleToggleFavorite}
                disabled={isSubmitting}
                aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={favorite ? 'fill-current' : ''} size={20} />
              </Button>
            </div>
          )}
        </div>

        <h3 className="font-semibold text-lg mb-2">
          <HighlightedText text={term.name} htmlText={term.highlightedName} />
        </h3>

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-4 flex-1">
          <HighlightedText text={truncatedDefinition} htmlText={term.highlightedDefinition} />
        </p>
      </CardContent>

      {showActions && (
        <CardFooter className="border-t border-gray-100 dark:border-gray-800 p-3 flex justify-between items-center">
          <Link
            href={`/term/${term.id}`}
            onClick={handleTermClick}
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
          >
            Read more
          </Link>

          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleCopyLink}
                    aria-label="Copy link"
                  >
                    <Copy size={16} className="text-gray-500 dark:text-gray-300" />
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
                    aria-label="Share"
                  >
                    <Share2 size={16} className="text-gray-500 dark:text-gray-300" />
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
              url={termUrl}
            />
          </div>
        </CardFooter>
      )}
      {children}
    </Card>
  );
});

export default TermCard;
