import { Link } from "wouter";
import { ArrowLeft, Eye, Clock, Code, Zap, TestTube, Brain, Heart, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
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
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onToggleFavorite}
              disabled={favoriteLoading}
              className={favorite ? "text-accent-500" : "text-gray-400 hover:text-accent-500"}
            >
              <Heart className={favorite ? "fill-current" : ""} />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onCopyLink}
            >
              <Copy />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onShareMenuToggle(true)}
            >
              <Share2 />
            </Button>
            
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