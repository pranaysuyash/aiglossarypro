import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Share2, Heart, BookOpen, Clock, Lightbulb, Eye, Code, Zap, TestTube, Brain, Settings, Star, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import ShareMenu from "@/components/ShareMenu";
import SectionLayoutManager from "@/components/sections/SectionLayoutManager";
import InteractiveElementsManager from "@/components/interactive/InteractiveElementsManager";
import TermCard from "@/components/TermCard";
import { AIDefinitionImprover } from "@/components/AIDefinitionImprover";
import ProgressTracker from "@/components/ProgressTracker";
import { 
  IEnhancedTerm, 
  ITerm, 
  ITermSection, 
  IInteractiveElement, 
  IEnhancedUserSettings
} from "@/interfaces/interfaces";

export default function EnhancedTermDetail() {
  const [, params] = useRoute("/enhanced/terms/:id");
  const id = params?.id;
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Try enhanced term first
  const { data: enhancedTerm, isLoading: termLoading } = useQuery<IEnhancedTerm>({
    queryKey: [`/api/enhanced/terms/${id}`],
    refetchOnWindowFocus: false,
    retry: false,
  });
  
  // Fallback to regular term if enhanced fails
  const { data: regularTerm, isLoading: regularLoading } = useQuery<ITerm>({
    queryKey: [`/api/terms/${id}`],
    refetchOnWindowFocus: false,
    enabled: !enhancedTerm && !termLoading,
  });
  
  // Use enhanced data if available, otherwise regular term data
  const term = enhancedTerm || regularTerm;
  const isEnhanced = !!enhancedTerm;
  
  // Fetch term sections (only if enhanced)
  const { data: sections = [], isLoading: sectionsLoading } = useQuery<ITermSection[]>({
    queryKey: [`/api/terms/${id}/sections`],
    refetchOnWindowFocus: false,
    enabled: isEnhanced,
  });
  
  // Fetch interactive elements (only if enhanced)
  const { data: interactiveElements = [], isLoading: elementsLoading } = useQuery<IInteractiveElement[]>({
    queryKey: [`/api/enhanced/terms/${id}/interactive`],
    refetchOnWindowFocus: false,
    enabled: isEnhanced,
  });
  
  // Fetch term relationships (only if enhanced)
  const { data: relationships = [] } = useQuery<ITerm[]>({
    queryKey: [`/api/enhanced/terms/${id}/relationships`],
    refetchOnWindowFocus: false,
    enabled: isEnhanced,
  });
  
  // Fetch recommended terms (try enhanced first, fallback to regular)
  const { data: recommended = [] } = useQuery<ITerm[]>({
    queryKey: isEnhanced ? [`/api/enhanced/terms/${id}/recommended`] : [`/api/terms/${id}/recommended`],
    refetchOnWindowFocus: false,
  });
  
  // Fetch user settings
  const { data: userSettings } = useQuery<IEnhancedUserSettings>({
    queryKey: [`/api/user/enhanced-settings`],
    enabled: isAuthenticated,
  });
  
  // Check if term is in user's favorites
  const { data: favorite, isLoading: favoriteLoading } = useQuery<boolean>({
    queryKey: [`/api/favorites/${id}`],
    enabled: isAuthenticated,
  });
  
  // Check if term is marked as learned
  const { data: learned, isLoading: learnedLoading } = useQuery<boolean>({
    queryKey: [`/api/progress/${id}`],
    enabled: isAuthenticated,
  });

  // Track view on component mount
  useEffect(() => {
    const trackView = async () => {
      try {
        await apiRequest("POST", `/api/enhanced/terms/${id}/view`, null);
      } catch (error) {
        console.error("Failed to log term view", error);
      }
    };
    
    if (id) {
      trackView();
    }
  }, [id]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save favorites",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest(
        favorite ? "DELETE" : "POST", 
        `/api/favorites/${id}`, 
      );
      
      toast({
        title: favorite ? "Removed from favorites" : "Added to favorites",
        description: favorite 
          ? `${term?.name} has been removed from your favorites` 
          : `${term?.name} has been added to your favorites`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyLink = async () => {
    const url = window.location.href;
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
  };

  const handleSectionInteraction = (sectionId: string, interactionType: string, data?: any) => {
    // Track section interactions for analytics
    apiRequest('POST', `/api/enhanced/sections/${sectionId}/interaction`, {
      type: interactionType,
      data
    }).catch(console.error);
  };

  const getDifficultyColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'advanced': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'expert': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getProgressPercentage = () => {
    if (!userSettings || !term) return 0;
    
    const userLevel = (userSettings as any)?.experienceLevel || 'intermediate';
    const termLevel = (term as any)?.difficultyLevel?.toLowerCase() || 'intermediate';
    
    const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const userIndex = levels.indexOf(userLevel);
    const termIndex = levels.indexOf(termLevel);
    
    if (userIndex >= termIndex) return 100;
    if (userIndex === termIndex - 1) return 75;
    if (userIndex === termIndex - 2) return 50;
    return 25;
  };

  if (termLoading || regularLoading || (isEnhanced && (sectionsLoading || elementsLoading))) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <Sidebar />
          <main className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6 animate-pulse">
              <div className="p-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
                <div className="space-y-2 mb-4">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-1/6"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
                
                <div className="space-y-4 my-8">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/5 mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!term) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <Sidebar />
          <main className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
              <h1 className="text-2xl font-bold mb-4">Term Not Found</h1>
              <p className="mb-6">The term you're looking for doesn't exist or has been removed.</p>
              <Link href="/">
                <Button>Return to Home</Button>
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <Sidebar />
        
        <main className="flex-1 min-w-0">
          {/* Header Card */}
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
                  {term && (term as any).mainCategories && (term as any).mainCategories.length > 0 && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link href={`/categories?filter=${encodeURIComponent((term as any).mainCategories[0])}`}>
                            {(term as any).mainCategories[0]}
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
                    {isEnhanced && (term as any).difficultyLevel && (
                      <Badge className={getDifficultyColor((term as any).difficultyLevel)}>
                        {(term as any).difficultyLevel}
                      </Badge>
                    )}
                    {isEnhanced && (term as any).mainCategories && (term as any).mainCategories.slice(0, 3).map((category: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Eye className="h-4 w-4 mr-1" />
                      {term?.viewCount || 0}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-1" />
                      {term?.updatedAt ? new Date(term.updatedAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>

                  <h1 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                    {term?.name}
                  </h1>

                  {isEnhanced && (term as any).shortDefinition && (
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                      {(term as any).shortDefinition}
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
                        <span>{getProgressPercentage()}%</span>
                      </div>
                      <Progress value={getProgressPercentage()} className="h-2" />
                    </div>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={toggleFavorite}
                    disabled={favoriteLoading}
                    className={favorite ? "text-accent-500" : "text-gray-400 hover:text-accent-500"}
                  >
                    <Heart className={favorite ? "fill-current" : ""} />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={copyLink}
                  >
                    <Copy />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShareMenuOpen(true)}
                  >
                    <Share2 />
                  </Button>
                  
                  <ShareMenu 
                    isOpen={shareMenuOpen} 
                    onClose={() => setShareMenuOpen(false)}
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

          {/* Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
              <TabsTrigger value="overview" className="flex items-center space-x-1">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="sections" className="flex items-center space-x-1">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Sections</span>
              </TabsTrigger>
              <TabsTrigger value="interactive" className="flex items-center space-x-1">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Interactive</span>
              </TabsTrigger>
              <TabsTrigger value="relationships" className="flex items-center space-x-1">
                <Lightbulb className="h-4 w-4" />
                <span className="hidden sm:inline">Related</span>
              </TabsTrigger>
              {isAuthenticated && (
                <TabsTrigger value="ai-tools" className="flex items-center space-x-1">
                  <Brain className="h-4 w-4" />
                  <span className="hidden sm:inline">AI Tools</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="progress" className="flex items-center space-x-1">
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">Progress</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Definition</h2>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {enhancedTerm?.fullDefinition || term?.definition}
                  </p>
                </div>

                {/* Application domains */}
                {enhancedTerm?.applicationDomains && enhancedTerm.applicationDomains.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-3">Application Domains</h3>
                    <div className="flex flex-wrap gap-2">
                      {enhancedTerm.applicationDomains.map((domain, index) => (
                        <Badge key={index} variant="outline">
                          {domain}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Techniques */}
                {enhancedTerm?.techniques && enhancedTerm.techniques.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-3">Related Techniques</h3>
                    <div className="flex flex-wrap gap-2">
                      {enhancedTerm.techniques.map((technique, index) => (
                        <Badge key={index} variant="secondary">
                          {technique}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="sections" className="mt-6">
              <SectionLayoutManager
                sections={sections || []}
                userSettings={userSettings}
                onInteraction={handleSectionInteraction}
              />
            </TabsContent>

            <TabsContent value="interactive" className="mt-6">
              <InteractiveElementsManager
                elements={interactiveElements || []}
                onInteraction={(elementId, type, data) => {
                  apiRequest('POST', `/api/enhanced/interactive/${elementId}/interaction`, {
                    type,
                    data
                  }).catch(console.error);
                }}
              />
            </TabsContent>

            <TabsContent value="relationships" className="mt-6">
              {relationships && relationships.length > 0 ? (
                <div className="space-y-6">
                  {['prerequisite', 'related', 'extends', 'alternative'].map(relType => {
                    const relatedTerms = relationships.filter((rel: any) => rel.relationshipType === relType);
                    if (relatedTerms.length === 0) return null;

                    return (
                      <div key={relType}>
                        <h3 className="text-lg font-semibold mb-3 capitalize">
                          {relType === 'prerequisite' ? 'Prerequisites' : 
                           relType === 'extends' ? 'Extends' :
                           relType === 'alternative' ? 'Alternatives' : 'Related Terms'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {relatedTerms.map((rel: any) => (
                            <div key={rel.id} className="p-4 border rounded-lg">
                              <Link href={`/term/${rel.toTerm?.id || rel.toTermId || rel.id}`}>
                                <a className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
                                  {rel.toTerm?.name || rel.name || 'Unknown Term'}
                                </a>
                              </Link>
                              {rel.strength && (
                                <div className="text-sm text-gray-500 mt-1">
                                  Strength: {rel.strength}/10
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No related terms found</p>
                </div>
              )}
            </TabsContent>

            {isAuthenticated && (
              <TabsContent value="ai-tools" className="mt-6">
                <AIDefinitionImprover 
                  term={enhancedTerm || term}
                  onImprovementApplied={() => {
                    window.location.reload();
                  }}
                />
              </TabsContent>
            )}

            <TabsContent value="progress" className="mt-6">
              {!learnedLoading && id && (
                <ProgressTracker termId={id} isLearned={!!learned} />
              )}
            </TabsContent>
          </Tabs>
          
          {/* Recommended Section */}
          {recommended && recommended.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recommended for You</h2>
                <Link href="/recommendations">
                  <a className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium">
                    See all
                  </a>
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommended.map((recTerm: any) => (
                  <TermCard
                    key={recTerm.id}
                    term={recTerm}
                    variant="compact"
                    isFavorite={recTerm.isFavorite}
                  />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}