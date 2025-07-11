import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Copy, Heart, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'wouter';
import { StructuredData, SEOMeta } from '@/components/SEO/StructuredData';
import { AIDefinitionImprover } from '@/components/AIDefinitionImprover';
import { FreeTierGate } from '@/components/FreeTierGate';
import ProgressTracker from '@/components/ProgressTracker';
import ShareMenu from '@/components/ShareMenu';
import Sidebar from '@/components/Sidebar';
import { HierarchicalNavigator } from '@/components/sections/HierarchicalNavigator';
import TermCard from '@/components/TermCard';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { contentOutline } from '@/data/content-outline';
import { useToast } from '@/hooks/use-toast';
import { useAccess } from '@/hooks/useAccess';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { sanitizeHTML, sanitizeMathHTML } from '@/utils/sanitize';

export default function TermDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { accessStatus, isFreeTier } = useAccess();
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  // Add CSS for section highlighting
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .highlight-section {
        background: linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
        border-left: 4px solid #3b82f6;
        padding-left: 16px;
        margin-left: -20px;
        border-radius: 8px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
      }
      .dark .highlight-section {
        background: linear-gradient(90deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Function to handle section navigation
  const handleSectionNavigation = (path: string, node: any) => {
    console.log('Navigated to:', path, node);

    // Generate section ID from path and node
    const sectionId = generateSectionId(path, node);

    // Scroll to the specific section
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });

      // Add visual highlight
      element.classList.add('highlight-section');
      setTimeout(() => {
        element.classList.remove('highlight-section');
      }, 2000);

      toast({
        title: 'Navigated to section',
        description: `Jumped to: ${node.title || node.name}`,
      });
    } else {
      toast({
        title: 'Section not found',
        description: "This section may not be loaded yet or doesn't exist.",
        variant: 'destructive',
      });
    }
  };

  // Generate consistent section ID from path and node
  const generateSectionId = (path: string, node: any) => {
    const baseName = (node.title || node.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `section-${path.replace(/\./g, '-')}-${baseName}`;
  };

  // Fetch term details
  const { data: term, isLoading } = useQuery({
    queryKey: [`/api/terms/${id}`],
    refetchOnWindowFocus: false,
  }) as { data: any; isLoading: boolean };

  // Fetch recommended terms
  const { data: recommended } = useQuery({
    queryKey: [`/api/terms/${id}/recommended`],
    refetchOnWindowFocus: false,
  });

  // Check if term is in user's favorites
  const { data: favorite, isLoading: favoriteLoading } = useQuery({
    queryKey: [`/api/favorites/${id}`],
    enabled: isAuthenticated,
  });

  // Check if term is marked as learned
  const { data: learned, isLoading: learnedLoading } = useQuery({
    queryKey: [`/api/progress/${id}`],
    enabled: isAuthenticated,
  });

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to save favorites',
        variant: 'destructive',
      });
      return;
    }

    try {
      await apiRequest(favorite ? 'DELETE' : 'POST', `/api/favorites/${id}`);

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
    }
  };

  const copyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
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
  };

  // Track view on component mount
  useState(() => {
    const trackView = async () => {
      try {
        await apiRequest('POST', `/api/terms/${id}/view`, null);
      } catch (error) {
        // Silent fail - not critical for UX
        console.error('Failed to log term view', error);
      }
    };

    trackView();
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6">
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
        <div className="flex flex-col md:flex-row gap-6">
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
    <>
      {/* SEO Meta Tags */}
      <SEOMeta 
        title={`${term.name} - AI/ML Glossary`}
        description={term.definition}
        keywords={term.tags || [term.name, 'AI', 'ML', 'artificial intelligence', 'machine learning']}
        canonical={`${window.location.origin}/term/${term.id}`}
        ogType="article"
      />
      
      {/* Structured Data */}
      <StructuredData 
        term={term}
        type="term"
      />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        <Sidebar />

        <main className="flex-1">
          {/* Free Tier Banner */}
          {isAuthenticated && isFreeTier && accessStatus && (
            <UpgradePrompt variant="banner" className="mb-4" />
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
            <div className="p-6">
              {/* Breadcrumb */}
              <Breadcrumb className="mb-4 text-sm">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/category/${term.categoryId}`}>{term.category}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{term.name}</span>
                </BreadcrumbItem>
              </Breadcrumb>

              {/* Term Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {term.subcategories?.map((subcategory: any, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className={
                          index % 2 === 0
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        }
                      >
                        {subcategory}
                      </Badge>
                    ))}
                  </div>
                  <h1 className="text-3xl font-bold mb-2">{term.name}</h1>
                  <p className="text-gray-500 dark:text-gray-400">Last updated: {term.updatedAt}</p>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFavorite}
                    disabled={favoriteLoading}
                    className={favorite ? 'text-accent-500' : 'text-gray-400 hover:text-accent-500'}
                    aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart className={favorite ? 'fill-current' : ''} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyLink}
                    aria-label="Copy link to clipboard"
                  >
                    <Copy />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShareMenuOpen(true)}
                    aria-label="Share this term"
                  >
                    <Share2 />
                  </Button>

                  <ShareMenu
                    isOpen={shareMenuOpen}
                    onClose={() => setShareMenuOpen(false)}
                    title={term.name}
                    url={window.location.href}
                  />
                </div>
              </div>

              {/* Definition */}
              <div id="section-0-0-definition" className="mb-8 scroll-mt-20">
                <h2 className="text-xl font-semibold mb-3">Definition</h2>

                {/* Check if this is a preview version */}
                {term.isPreview ? (
                  <div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                      {term.definition}
                    </p>
                    
                    {/* Different messaging for auth required vs upgrade required */}
                    {term.requiresUpgrade ? (
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                              Daily limit reached
                            </h3>
                            <p className="text-orange-700 dark:text-orange-300 text-sm">
                              You've viewed {term.limitInfo?.dailyLimit || 50} terms today. 
                              Upgrade for unlimited access or try again tomorrow.
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => (window.location.href = '/upgrade')}
                              className="bg-orange-600 hover:bg-orange-700 text-white"
                            >
                              Upgrade Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                              Sign in to view full definition
                            </h3>
                            <p className="text-blue-700 dark:text-blue-300 text-sm">
                              {term.previewMessage || 'Get unlimited access to complete definitions, examples, and more features.'}
                            </p>
                          </div>
                          <Button
                            onClick={() => (window.location.href = '/login')}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Sign In
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <FreeTierGate termId={id}>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {term.definition}
                    </p>
                  </FreeTierGate>
                )}
              </div>

              {/* Hierarchical Navigation for 42 Sections + 295 Subsections */}
              {!term.isPreview && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Content Navigation</h2>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
                    <HierarchicalNavigator
                      sections={contentOutline.sections}
                      onNodeClick={handleSectionNavigation}
                      searchable={true}
                      collapsible={true}
                      showProgress={true}
                      showInteractiveElements={true}
                      currentPath={id ? `0.0` : undefined}
                      className="p-4"
                    />
                  </div>
                </div>
              )}

              {/* Key Characteristics */}
              {!term.isPreview && term.characteristics && term.characteristics.length > 0 && (
                <FreeTierGate termId={id}>
                  <div id="section-1-0-key-characteristics" className="mb-8 scroll-mt-20">
                    <h2 className="text-xl font-semibold mb-3">Key Characteristics</h2>
                    <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                      {term.characteristics.map((characteristic: string, index: number) => (
                        <li
                          key={index}
                          dangerouslySetInnerHTML={{ __html: sanitizeHTML(characteristic) }}
                        />
                      ))}
                    </ul>
                  </div>
                </FreeTierGate>
              )}

              {/* Types */}
              {!term.isPreview && term.types && term.types.length > 0 && (
                <FreeTierGate termId={id}>
                  <div id="section-2-0-types" className="mb-8 scroll-mt-20">
                    <h2 className="text-xl font-semibold mb-3">Types of {term.name}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {term.types.map((type: any, index: number) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                          <h3 className="font-medium text-lg mb-2">{type.name}</h3>
                          <p className="text-gray-700 dark:text-gray-300 text-sm">
                            {type.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </FreeTierGate>
              )}

              {/* Visual Representation */}
              {term.visualUrl && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-3">Visual Representation</h2>
                  <OptimizedImage
                    src={term.visualUrl}
                    alt={`${term.name} diagram`}
                    className="rounded-lg shadow-sm w-full h-auto object-cover mb-2"
                    lazy={false}
                    priority
                  />
                  {term.visualCaption && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center">
                      {term.visualCaption}
                    </p>
                  )}
                </div>
              )}

              {/* Mathematical Foundation */}
              {term.mathFormulation && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-3">Mathematical Foundation</h2>
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-lg font-mono text-sm">
                    <div
                      dangerouslySetInnerHTML={{ __html: sanitizeMathHTML(term.mathFormulation) }}
                    />
                  </div>
                </div>
              )}

              {/* Applications */}
              {term.applications && term.applications.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-3">Applications</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {term.applications.map((app: any, index: number) => (
                      <div
                        key={index}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        {app.icon && (
                          <div
                            className="mb-2"
                            dangerouslySetInnerHTML={{ __html: sanitizeHTML(app.icon) }}
                          />
                        )}
                        <h3 className="font-medium mb-1">{app.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {app.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Terms */}
              {term.relatedTerms && term.relatedTerms.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">Related Terms</h2>
                  <div className="flex flex-wrap gap-2">
                    {term.relatedTerms.map((relatedTerm: any) => (
                      <Link key={relatedTerm.id} href={`/term/${relatedTerm.id}`}>
                        <a className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300 transition">
                          {relatedTerm.name}
                        </a>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* References */}
              {term.references && term.references.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">References</h2>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {term.references.map((reference: string, index: number) => {
                      // Clean up the reference by removing href="#" stubs and extracting actual URLs
                      const cleanReference = reference
                        .replace(/href="#"/g, '')
                        .replace(/<a[^>]*href="#"[^>]*>/g, '')
                        .replace(/<\/a>/g, '');

                      // Extract URL from reference if it contains a valid link
                      const urlMatch = cleanReference.match(/https?:\/\/[^\s<>"']+/);
                      const hasUrl = urlMatch?.[0];

                      // Extract text content, removing HTML tags for display
                      const textContent = cleanReference.replace(/<[^>]*>/g, '').trim();

                      return (
                        <li key={index}>
                          {hasUrl ? (
                            <a
                              href={hasUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:underline dark:text-primary-400"
                            >
                              {textContent}
                            </a>
                          ) : (
                            <span className="text-gray-700 dark:text-gray-300">{textContent}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Progress Tracker */}
            {!learnedLoading && <ProgressTracker termId={id!} isLearned={!!learned} />}
          </div>

          {/* AI Definition Improver - Only for authenticated users */}
          {isAuthenticated && term && (
            <div className="mb-8">
              <AIDefinitionImprover
                term={term as any}
                onImprovementApplied={(_improvedTerm) => {
                  // Optionally refresh the term data or update local state
                  window.location.reload();
                }}
              />
            </div>
          )}

          {/* Recommended Section */}
          {recommended && Array.isArray(recommended) && recommended.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recommended for You</h2>
                <Link href="/recommendations">
                  <a className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium">
                    See all
                  </a>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(recommended as any[]).map((recTerm: any) => (
                  <TermCard key={recTerm.id} term={recTerm} isFavorite={recTerm.isFavorite} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
    </>
  );
}
