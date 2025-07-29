import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { AIDefinitionImprover } from '@/components/AIDefinitionImprover';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import InteractiveElementsManager from '@/components/interactive/InteractiveElementsManager';
import { FreeUserUpgradeModal } from '@/components/modals/FreeUserUpgradeModal';
import ProgressTracker from '@/components/ProgressTracker';
import Sidebar from '@/components/Sidebar';
import { HierarchicalNavigator } from '@/components/sections/HierarchicalNavigator';
import SectionLayoutManager from '@/components/sections/SectionLayoutManager';
import RecommendedTerms from '@/components/term/RecommendedTerms';
import TermContentTabs from '@/components/term/TermContentTabs';
import TermHeader from '@/components/term/TermHeader';
import TermOverview from '@/components/term/TermOverview';
import TermRelationships from '@/components/term/TermRelationships';
import { Button } from '@/components/ui/button';
import { TermContentSkeleton, TermHeaderSkeleton } from '@/components/ui/skeleton';
import {
  AUTH_MESSAGES,
  CLIPBOARD_MESSAGES,
  ERROR_MESSAGES,
  FAVORITES_MESSAGES,
} from '@/constants/messages';
import { contentOutline } from '@/data/content-outline';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTermActions, useTermData } from '@/hooks/useTermData';
import { useUpgradeModalTrigger } from '@/hooks/useTermWithUpgrade';
import { apiRequest } from '@/lib/queryClient';

export default function EnhancedTermDetail() {
  // Support both route patterns: /term/:id and /enhanced/terms/:id
  const [_matchBasic, paramsBasic] = useRoute('/term/:id');
  const [_matchEnhanced, paramsEnhanced] = useRoute('/enhanced/terms/:id');

  const id = paramsBasic?.id || paramsEnhanced?.id;
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Check for upgrade scenarios
  const { showUpgradeModal, setShowUpgradeModal, upgradeReason, dailyLimit, upgradeMessage } =
    useUpgradeModalTrigger(id, isAuthenticated);

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
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Use custom hook for data fetching
  const {
    term,
    isEnhanced,
    sections,
    interactiveElements,
    relationships,
    recommended,
    userSettings,
    favorite,
    favoriteLoading,
    learned,
    learnedLoading,
    isLoading,
  } = useTermData(id, isAuthenticated);

  // Use custom hook for actions
  const { trackView, handleSectionInteraction, handleInteractiveElementInteraction } =
    useTermActions(id, isAuthenticated);

  // Track view on component mount
  useEffect(() => {
    if (id) {
      trackView();
    }
  }, [id, trackView]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      toast({
        ...AUTH_MESSAGES.REQUIRED,
        variant: 'destructive',
      });
      return;
    }

    try {
      await apiRequest(favorite ? 'DELETE' : 'POST', `/api/favorites/${id}`);

      // Invalidate the favorites query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${id}`] });

      toast(
        favorite
          ? FAVORITES_MESSAGES.REMOVED(term?.name || 'Term')
          : FAVORITES_MESSAGES.ADDED(term?.name || 'Term')
      );
    } catch (_error) {
      toast({
        ...FAVORITES_MESSAGES.ERROR,
        variant: 'destructive',
      });
    }
  };

  const copyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast(CLIPBOARD_MESSAGES.SUCCESS);
    } catch (_error) {
      toast({
        ...CLIPBOARD_MESSAGES.ERROR,
        variant: 'destructive',
      });
    }
  };

  const handleAIImprovementApplied = () => {
    // Invalidate term queries to refetch updated data
    queryClient.invalidateQueries({ queryKey: [`/api/enhanced/terms/${id}`] });
    queryClient.invalidateQueries({ queryKey: [`/api/terms/${id}`] });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <Sidebar />
          <main className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6 p-6">
              <TermHeaderSkeleton />
              <div className="mt-8">
                <TermContentSkeleton />
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
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-2xl">🔍</span>
              </div>
              <h1 className="text-2xl font-bold mb-4">{ERROR_MESSAGES.TERM_NOT_FOUND.title}</h1>
              <p className="text-muted-foreground mb-2">
                {ERROR_MESSAGES.TERM_NOT_FOUND.description}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                {ERROR_MESSAGES.TERM_NOT_FOUND.action}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/terms">
                  <Button variant="outline">Browse All Terms</Button>
                </Link>
                <Link href="/categories">
                  <Button variant="outline">View Categories</Button>
                </Link>
                <Link href="/">
                  <Button>Return to Home</Button>
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <Sidebar />

          <main className="flex-1 min-w-0">
            {/* Term Header */}
            <TermHeader
              term={term}
              isEnhanced={isEnhanced}
              userSettings={userSettings}
              favorite={favorite}
              favoriteLoading={favoriteLoading}
              shareMenuOpen={shareMenuOpen}
              onToggleFavorite={toggleFavorite}
              onCopyLink={copyLink}
              onShareMenuToggle={setShareMenuOpen}
            />

            {/* Preview Mode Upgrade Prompt */}
            {(term as any)?.isPreview && (term as any)?.requiresUpgrade && (
              <div className="mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xl">🔒</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Preview Mode - Daily Limit Reached
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        You're viewing a preview of this definition. You've reached your daily limit
                        of free term views. Upgrade to get unlimited access to all {10372} AI/ML
                        definitions.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={() =>
                            window.open('https://gumroad.com/l/aiml-glossary-pro', '_blank')
                          }
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          Upgrade to Lifetime Access - $179 (was $249)
                        </Button>
                        <Button variant="outline" className="text-gray-600 dark:text-gray-300">
                          Try Again Tomorrow
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                        One-time payment • Regional pricing available • 7-day money-back guarantee
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content Tabs */}
            <TermContentTabs
              term={term}
              isEnhanced={isEnhanced}
              isAuthenticated={isAuthenticated}
              activeTab={activeTab}
              sections={sections}
              interactiveElements={interactiveElements}
              relationships={relationships}
              userSettings={userSettings}
              learned={learned}
              learnedLoading={learnedLoading}
              termId={id}
              onTabChange={setActiveTab}
              onSectionInteraction={handleSectionInteraction}
              onInteractiveElementInteraction={handleInteractiveElementInteraction}
              onAIImprovementApplied={handleAIImprovementApplied}
              overviewComponent={<TermOverview term={term} isEnhanced={isEnhanced} />}
              sectionsComponent={
                <div className="space-y-6">
                  {/* Hierarchical Navigation for 42 Sections + 295 Subsections */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
                    <HierarchicalNavigator
                      sections={contentOutline.sections}
                      onNodeClick={handleSectionNavigation}
                      searchable
                      collapsible
                      showProgress
                      showInteractiveElements
                      currentPath={id ? `0.0` : undefined}
                      className="p-4"
                    />
                  </div>

                  {/* Legacy Section Layout Manager */}
                  <SectionLayoutManager
                    sections={sections || []}
                    userSettings={userSettings}
                    onInteraction={handleSectionInteraction}
                  />
                </div>
              }
              interactiveComponent={
                <InteractiveElementsManager
                  elements={interactiveElements || []}
                  onInteraction={handleInteractiveElementInteraction}
                />
              }
              relationshipsComponent={<TermRelationships relationships={relationships} />}
              aiToolsComponent={
                <AIDefinitionImprover
                  term={term}
                  onImprovementApplied={handleAIImprovementApplied}
                />
              }
              progressComponent={<ProgressTracker termId={id!} isLearned={!!learned} />}
            />

            {/* Recommended Section */}
            <RecommendedTerms recommended={recommended} />
          </main>
        </div>
      </div>

      {/* Free User Upgrade Modal */}
      <FreeUserUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={() => {
          window.location.href = '/lifetime';
        }}
        viewsUsed={dailyLimit || 50} // Show as reached limit
        dailyLimit={dailyLimit || 50}
        isTrialUser={upgradeReason === 'trial_period'}
        daysInTrial={upgradeReason === 'trial_period' ? 3 : 0} // Placeholder, could be calculated
      />
    </ErrorBoundary>
  );
}
