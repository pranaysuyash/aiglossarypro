import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import SectionLayoutManager from "@/components/sections/SectionLayoutManager";
import InteractiveElementsManager from "@/components/interactive/InteractiveElementsManager";
import { AIDefinitionImprover } from "@/components/AIDefinitionImprover";
import ProgressTracker from "@/components/ProgressTracker";
import TermHeader from "@/components/term/TermHeader";
import TermContentTabs from "@/components/term/TermContentTabs";
import TermOverview from "@/components/term/TermOverview";
import TermRelationships from "@/components/term/TermRelationships";
import RecommendedTerms from "@/components/term/RecommendedTerms";
import { useTermData, useTermActions } from "@/hooks/useTermData";
import { useQueryClient } from "@tanstack/react-query";

export default function EnhancedTermDetail() {
  const [, params] = useRoute("/enhanced/terms/:id");
  const id = params?.id;
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
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
  const {
    trackView,
    handleSectionInteraction,
    handleInteractiveElementInteraction,
  } = useTermActions(id, isAuthenticated);

  // Track view on component mount
  useEffect(() => {
    if (id) {
      trackView();
    }
  }, [id, trackView]);

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
      
      // Invalidate the favorites query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${id}`] });
      
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
              <SectionLayoutManager
                sections={sections || []}
                userSettings={userSettings}
                onInteraction={handleSectionInteraction}
              />
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
            progressComponent={
              <ProgressTracker termId={id!} isLearned={!!learned} />
            }
          />
          
          {/* Recommended Section */}
          <RecommendedTerms recommended={recommended} />
        </main>
      </div>
    </div>
  );
}