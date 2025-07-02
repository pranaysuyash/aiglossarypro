import { Link } from "wouter";
import { ArrowLeft, Eye, Clock, Code, Zap, TestTube, Brain, Heart, Copy, Share2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ShareMenu from "@/components/ShareMenu";
import { IEnhancedTerm, ITerm, IEnhancedUserSettings } from "@/interfaces/interfaces";
import { 
  getDifficultyColor, 
  getProgressPercentage, 
  formatDate, 
  formatViewCount,
  isEnhancedTerm,
  getMainCategories,
  getDifficultyLevel,
  getShortDefinition
} from "@/utils/termUtils";

interface TermHeaderProps {
  term: IEnhancedTerm | ITerm;
  isEnhanced: boolean;
  userSettings?: IEnhancedUserSettings;
  favorite?: boolean;
  favoriteLoading: boolean;
  shareMenuOpen: boolean;
  onToggleFavorite: () => void;
  onCopyLink: () => void;
  onShareMenuToggle: (open: boolean) => void;
}


// Utility function to calculate reading time
const calculateReadingTime = (text: string): number => {
  const wordsPerMinute = 200; // Average reading speed
  const words = text.trim().split(/\s+/).length;
  const readingTime = Math.ceil(words / wordsPerMinute);
  return readingTime < 1 ? 1 : readingTime;
};

export default function TermHeader({
  term,
  isEnhanced,
  userSettings,
  favorite,
  favoriteLoading,
  shareMenuOpen,
  onToggleFavorite,
  onCopyLink,
  onShareMenuToggle
}: TermHeaderProps) {
  const enhancedTerm = isEnhancedTerm(term) ? term : null;
  const progressPercentage = getProgressPercentage(userSettings, term);
  const mainCategories = getMainCategories(term);
  const difficultyLevel = getDifficultyLevel(term);
  const shortDefinition = getShortDefinition(term);
  
  // Calculate reading time based on term content
  const totalContent = [
    term?.definition,
    enhancedTerm?.fullDefinition,
    enhancedTerm?.sections?.map(s => JSON.stringify(s.sectionData)).join(' ')
  ].filter(Boolean).join(' ');
  const readingTime = calculateReadingTime(totalContent);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
      <div className="p-6">
        {/* Back Navigation */}
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/categories">Categories</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {mainCategories.length > 0 && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/categories?filter=${encodeURIComponent(mainCategories[0])}`}>
                      {mainCategories[0]}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {term?.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Term Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1 min-w-0">
            {/* Badges and metadata */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {difficultyLevel && (
                <Badge className={getDifficultyColor(difficultyLevel)}>
                  {difficultyLevel}
                </Badge>
              )}
              {/* Reading Time Badge - More Prominent */}
              <Badge 
                variant="outline" 
                className="bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 font-medium px-3 py-1"
              >
                <BookOpen className="h-3 w-3 mr-1.5" />
                {readingTime} min read
              </Badge>
              {mainCategories.slice(0, 3).map((category: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {category}
                </Badge>
              ))}
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Eye className="h-4 w-4 mr-1" />
                {formatViewCount(term?.viewCount)}
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4 mr-1" />
                {formatDate(term?.updatedAt?.toString())}
              </div>
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
              {term?.name}
            </h1>

            {shortDefinition && (
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                {shortDefinition}
              </p>
            )}

            {/* Feature indicators */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {enhancedTerm?.hasCodeExamples && (
                <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                  <Code className="h-4 w-4 mr-1" />
                  Code Examples
                </div>
              )}
              {enhancedTerm?.hasInteractiveElements && (
                <div className="flex items-center text-sm text-purple-600 dark:text-purple-400">
                  <Zap className="h-4 w-4 mr-1" />
                  Interactive
                </div>
              )}
              {enhancedTerm?.hasCaseStudies && (
                <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                  <TestTube className="h-4 w-4 mr-1" />
                  Case Studies
                </div>
              )}
              {enhancedTerm?.hasImplementation && (
                <div className="flex items-center text-sm text-orange-600 dark:text-orange-400">
                  <Brain className="h-4 w-4 mr-1" />
                  Implementation
                </div>
              )}
            </div>

            {/* User progress */}
            {userSettings && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Difficulty Match for {userSettings.experienceLevel}</span>
                  <span>{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={onToggleFavorite}
                    disabled={favoriteLoading}
                    className={favorite ? "text-accent-500" : "text-gray-400 hover:text-accent-500"}
                    aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart className={favorite ? "fill-current" : ""} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{favorite ? "Remove from favorites" : "Add to favorites"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={onCopyLink}
                    aria-label="Copy link to this term"
                  >
                    <Copy />
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
                    onClick={() => onShareMenuToggle(true)}
                    aria-label="Share this term"
                  >
                    <Share2 />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share term</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <ShareMenu 
              isOpen={shareMenuOpen} 
              onClose={() => onShareMenuToggle(false)}
              title={enhancedTerm?.name || term?.name || 'AI/ML Term'}
              url={window.location.href}
            />
          </div>
        </div>

        {/* Keywords */}
        {enhancedTerm?.keywords && enhancedTerm.keywords.length > 0 && (
          <div className="border-t pt-4 mt-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium">Keywords: </span>
              {enhancedTerm.keywords.slice(0, 10).join(', ')}
              {enhancedTerm.keywords.length > 10 && '...'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}