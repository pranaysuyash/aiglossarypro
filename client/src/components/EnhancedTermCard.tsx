import { Brain, ChevronRight, Code, Copy, Eye, Heart, Play, Share2, TestTube } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import type { IEnhancedTerm, ITerm, ITermCardProps } from '@/interfaces/interfaces';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { getDifficultyColor, getProgressPercentage } from '@/utils/termUtils';
import AIContentFeedback from './AIContentFeedback';
import ShareMenu from './ShareMenu';

// Type guard to check if term is enhanced
const isEnhancedTerm = (term: IEnhancedTerm | ITerm): term is IEnhancedTerm => {
  return 'mainCategories' in term && 'difficultyLevel' in term;
};

const EnhancedTermCard = memo(function EnhancedTermCard({
  term,
  displayMode = 'default',
  showInteractive = true,
  userSettings,
  isFavorite = false,
}: ITermCardProps) {
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [favorite, setFavorite] = useState(isFavorite);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_isExpanded, _setIsExpanded] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const measureRender = () => performanceMonitor.mark('EnhancedTermCard_render');
  const [, navigate] = useLocation();

  const enhanced = isEnhancedTerm(term);

  // Memoize expensive calculations
  const termUrl = useMemo(() => `${window.location.origin}/term/${term.id}`, [term.id]);

  const featureIcons = useMemo(() => {
    if (!enhanced) {return [];}

    const features = [];
    if (term.hasCodeExamples)
      {features.push({ icon: Code, label: 'Code Examples', color: 'text-blue-500' });}
    if (term.hasInteractiveElements)
      {features.push({ icon: Play, label: 'Interactive', color: 'text-purple-500' });}
    if (term.hasCaseStudies)
      {features.push({ icon: TestTube, label: 'Case Studies', color: 'text-green-500' });}
    if (term.hasImplementation)
      {features.push({ icon: Brain, label: 'Implementation', color: 'text-orange-500' });}

    return features;
  }, [enhanced, term]);

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
      await apiRequest(favorite ? 'DELETE' : 'POST', `/api/favorites/${term.id}`);

      setFavorite(!favorite);
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });

      toast({
        title: favorite ? 'Removed from favorites' : 'Added to favorites',
        description: favorite
          ? `${term.name} has been removed from your favorites`
          : `${term.name} has been added to your favorites`,
      });
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to update favorites. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, favorite, term.id, term.name, toast]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(termUrl);
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
  }, [termUrl, toast]);

  const handleTermClick = useCallback(async () => {
    try {
      await apiRequest('POST', `/api/terms/${term.id}/view`, null);
    } catch (_error) {
      console.error('Failed to log term view', _error);
    }
  }, [term.id]);

  const handleNavigateToTerm = useCallback(() => {
    const termPath = `/term/${term.id}`;
    handleTermClick();
    navigate(termPath);
  }, [term.id, handleTermClick, navigate]);

  // Performance monitoring for render
  useEffect(() => {
    measureRender();
    performanceMonitor.trackCustomMetric('enhanced_term_card_render', performance.now());
  });

  const renderCompactCard = () => (
    <Card className="h-full transition-all duration-200 hover:shadow-md hover:-translate-y-1">
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1 truncate">{term.name}</h3>
            {enhanced && term.mainCategories.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {term.mainCategories[0]}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 flex-shrink-0 ml-2 ${favorite ? 'text-accent-500' : 'text-gray-400 hover:text-accent-500'}`}
            onClick={handleToggleFavorite}
            disabled={isSubmitting}
          >
            <Heart className={favorite ? 'fill-current' : ''} size={14} />
          </Button>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
          {enhanced ? term.shortDefinition || term.fullDefinition : term.shortDefinition}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {featureIcons.slice(0, 2).map((feature, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger>
                    <feature.icon className={`h-3 w-3 ${feature.color}`} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{feature.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6 px-2"
            onClick={handleNavigateToTerm}
          >
            View
          </Button>
        </div>
      </CardContent>
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handleNavigateToTerm}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleNavigateToTerm();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${term.name}`}
      />
    </Card>
  );

  const renderDetailedCard = () => (
    <Card className="h-full transition-all duration-200 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              {enhanced && term.difficultyLevel && (
                <Badge className={`text-xs ${getDifficultyColor(term.difficultyLevel)}`}>
                  {term.difficultyLevel}
                </Badge>
              )}
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <Eye className="h-3 w-3 mr-1" />
                {term.viewCount}
              </div>
            </div>
            <h3 className="font-bold text-lg mb-1 leading-tight">{term.name}</h3>
            {enhanced && term.mainCategories.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {term.mainCategories.slice(0, 3).map((category, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {category}
                  </Badge>
                ))}
                {term.mainCategories.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{term.mainCategories.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 flex-shrink-0 ml-2 ${favorite ? 'text-accent-500' : 'text-gray-400 hover:text-accent-500'}`}
            onClick={handleToggleFavorite}
            disabled={isSubmitting}
          >
            <Heart className={favorite ? 'fill-current' : ''} size={18} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="space-y-6">
          {/* AI Content Feedback - Show at top for AI-generated content */}
          {term.isAiGenerated && (
            <AIContentFeedback
              termId={term.id}
              termName={term.name}
              isAiGenerated
              verificationStatus={term.verificationStatus || 'unverified'}
              onFeedbackSubmitted={() => {
                // Optionally refresh term data or show updated status
                console.log('Feedback submitted for term:', term.name);
              }}
            />
          )}

          {/* Short Definition */}
          {term.shortDefinition && (
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
              <h3 className="font-semibold text-blue-900 mb-2">Quick Definition</h3>
              <p className="text-blue-800">{term.shortDefinition}</p>
            </div>
          )}

          {/* Main Definition */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Definition</h3>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed">{term.definition}</p>
            </div>
            {/* Section-specific feedback for definition */}
            {term.isAiGenerated && (
              <div className="mt-3">
                <AIContentFeedback
                  termId={term.id}
                  termName={term.name}
                  isAiGenerated
                  verificationStatus={term.verificationStatus || 'unverified'}
                  section="definition"
                  className="text-sm"
                />
              </div>
            )}
          </div>

          {/* Feature Icons */}
          {showInteractive && featureIcons.length > 0 && (
            <div className="flex items-center space-x-3 mb-4">
              {featureIcons.map((feature, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center space-x-1">
                        <feature.icon className={`h-4 w-4 ${feature.color}`} />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {feature.label}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{feature.label}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          )}

          {/* Progress Bar for User Level */}
          {userSettings && enhanced && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Difficulty Match</span>
                <span>{getProgressPercentage(userSettings, term)}%</span>
              </div>
              <Progress value={getProgressPercentage(userSettings, term)} className="h-2" />
            </div>
          )}

          {/* Keywords */}
          {enhanced && term.keywords && term.keywords.length > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium">Keywords: </span>
              <span>{term.keywords.slice(0, 5).join(', ')}</span>
              {term.keywords.length > 5 && '...'}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t border-gray-100 dark:border-gray-800 pt-3 pb-3 flex justify-between items-center">
        <Button
          variant="default"
          size="sm"
          onClick={handleNavigateToTerm}
          className="flex items-center space-x-1"
        >
          <span>Learn More</span>
          <ChevronRight size={14} />
        </Button>

        <div className="flex space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyLink}>
                  <Copy size={14} className="text-gray-500 dark:text-gray-400" />
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
                  <Share2 size={14} className="text-gray-500 dark:text-gray-400" />
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
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handleNavigateToTerm}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleNavigateToTerm();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${term.name}`}
      />
    </Card>
  );

  const renderDefaultCard = () => (
    <Card className="h-full flex flex-col transition-shadow hover:shadow-md">
      <CardContent className="p-4 flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {enhanced && term.mainCategories.length > 0 ? (
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300"
              >
                {term.mainCategories[0]}
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300"
              >
                {term.category}
              </Badge>
            )}
            {enhanced && term.difficultyLevel && (
              <Badge className={`text-xs ${getDifficultyColor(term.difficultyLevel)}`}>
                {term.difficultyLevel}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${favorite ? 'text-accent-500' : 'text-gray-400 hover:text-accent-500'}`}
            onClick={handleToggleFavorite}
            disabled={isSubmitting}
          >
            <Heart className={favorite ? 'fill-current' : ''} size={20} />
          </Button>
        </div>

        <h3 className="font-semibold text-lg mb-1">{term.name}</h3>

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-3">
          {enhanced ? term.shortDefinition || term.fullDefinition : term.shortDefinition}
        </p>

        {/* Feature indicators */}
        {showInteractive && featureIcons.length > 0 && (
          <div className="flex items-center space-x-2 mb-3">
            {featureIcons.slice(0, 4).map((feature, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger>
                    <feature.icon className={`h-4 w-4 ${feature.color}`} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{feature.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}

        {/* Application domains */}
        {enhanced && term.applicationDomains && term.applicationDomains.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span className="font-medium">Applications: </span>
            <span>{term.applicationDomains.slice(0, 3).join(', ')}</span>
            {term.applicationDomains.length > 3 && '...'}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t border-gray-100 dark:border-gray-800 p-3 flex justify-between items-center">
        <div
          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium cursor-pointer"
          onClick={handleNavigateToTerm}
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
            url={termUrl}
          />
        </div>
      </CardFooter>
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handleNavigateToTerm}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleNavigateToTerm();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${term.name}`}
      />
    </Card>
  );

  // Return appropriate card based on display mode
  switch (displayMode) {
    case 'compact':
      return renderCompactCard();
    case 'detailed':
      return renderDetailedCard();
    default:
      return renderDefaultCard();
  }
});

export default EnhancedTermCard;
