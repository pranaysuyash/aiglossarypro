import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Compass,
  Lightbulb,
  Link2,
  RefreshCw,
  Share,
  Shuffle,
  Sparkles,
  Target,
  ThumbsDown,
  ThumbsUp,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useSurpriseAnalytics } from '@/hooks/useSurpriseAnalytics';
import type { ITerm } from '@/interfaces/interfaces';

interface DiscoveryMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: string;
  surpriseLevel: string;
}

interface SurpriseResult {
  term: ITerm;
  surpriseReason: string;
  confidenceScore: number;
  discoveryMode: string;
  algorithmVersion: string;
  connectionPath?: string[];
  metadata: {
    categoryName?: string;
    difficultyLevel?: string;
    isPopular?: boolean;
    isUnexplored?: boolean;
    connectionStrength?: number;
  };
}

interface SurpriseMeProps {
  currentTermId?: string;
  maxResults?: number;
  showModeSelector?: boolean;
  compact?: boolean;
  onTermSelect?: (term: ITerm) => void;
}

const modeIcons = {
  random_adventure: <Shuffle className="w-5 h-5" />,
  guided_discovery: <Compass className="w-5 h-5" />,
  challenge_mode: <Target className="w-5 h-5" />,
  connection_quest: <Link2 className="w-5 h-5" />,
};

export default function SurpriseMe({
  currentTermId,
  maxResults = 3,
  showModeSelector = true,
  compact = false,
  onTermSelect,
}: SurpriseMeProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const _queryClient = useQueryClient();
  const analytics = useSurpriseAnalytics();

  const [selectedMode, setSelectedMode] = useState<string>('guided_discovery');
  const [isRevealing, setIsRevealing] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [_feedbackTermId, setFeedbackTermId] = useState<string>('');

  // Get available discovery modes
  const { data: modes } = useQuery<{ success: boolean; modes: DiscoveryMode[] }>({
    queryKey: ['/api/surprise-discovery/modes'],
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Get user's discovery preferences
  const { data: preferences } = useQuery({
    queryKey: ['/api/surprise-discovery/preferences'],
    enabled: isAuthenticated,
  });

  // Main surprise discovery mutation
  const surpriseDiscoveryMutation = useMutation({
    mutationFn: async ({ mode, currentTermId }: { mode: string; currentTermId?: string }) => {
      const params = new URLSearchParams({
        mode,
        maxResults: maxResults.toString(),
        excludeRecentlyViewed: 'true',
      });

      if (currentTermId) {
        params.append('currentTermId', currentTermId);
      }

      const response = await fetch(`/api/surprise-discovery?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to get surprise discoveries');
      }

      return response.json();
    },
    onSuccess: async data => {
      setCurrentSessionId(data.sessionId);

      // Track each discovery
      if (data.results && data.results.length > 0) {
        for (const result of data.results) {
          await analytics.trackDiscovery(
            data.sessionId,
            data.mode,
            result.term.id,
            result.surpriseReason,
            result.confidenceScore,
            result.metadata
          );
        }
      }

      toast({
        title: 'Surprise!',
        description: `Discovered ${data.results.length} amazing terms for you!`,
      });
    },
    onError: _error => {
      toast({
        title: 'Discovery Failed',
        description: "Couldn't fetch surprises right now. Try again!",
        variant: 'destructive',
      });
    },
  });

  // Feedback mutation
  const _feedbackMutation = useMutation({
    mutationFn: async ({
      sessionId,
      termId,
      surpriseRating,
      relevanceRating,
    }: {
      sessionId: string;
      termId: string;
      surpriseRating: number;
      relevanceRating: number;
    }) => {
      const response = await fetch('/api/surprise-discovery/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sessionId,
          termId,
          surpriseRating,
          relevanceRating,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Thanks for your feedback!',
        description: 'Your input helps us improve future discoveries.',
      });
      setFeedbackTermId('');
    },
  });

  const handleSurpriseMe = async () => {
    setIsRevealing(true);

    try {
      await surpriseDiscoveryMutation.mutateAsync({
        mode: selectedMode,
        currentTermId,
      });
    } finally {
      // Add a small delay for animation effect
      setTimeout(() => setIsRevealing(false), 800);
    }
  };

  const handleFeedback = async (
    result: SurpriseResult,
    surpriseRating: number,
    relevanceRating: number
  ) => {
    if (currentSessionId) {
      // Track feedback via analytics
      await analytics.trackFeedback(
        currentSessionId,
        result.discoveryMode,
        result.term.id,
        result.surpriseReason,
        result.confidenceScore,
        { surpriseRating, relevanceRating },
        result.metadata
      );
    }
  };

  const handleShare = async (term: ITerm, result?: SurpriseResult) => {
    const shareMethod =
      navigator.share && typeof navigator.share === 'function' ? 'native' : 'clipboard';

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out this AI/ML term: ${term.name}`,
          text: term.shortDefinition || `${term.definition.substring(0, 100)}...`,
          url: `${window.location.origin}/terms/${term.id}`,
        });
      } catch (_error) {
        // User cancelled share, that's ok
        return;
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(
        `${term.name}: ${term.shortDefinition || term.definition.substring(0, 100)}... ${window.location.origin}/terms/${term.id}`
      );
      toast({
        title: 'Copied to clipboard!',
        description: 'Share this interesting discovery with others.',
      });
    }

    // Track the share event
    if (result && currentSessionId) {
      await analytics.trackShare(
        currentSessionId,
        result.discoveryMode,
        term.id,
        result.surpriseReason,
        result.confidenceScore,
        shareMethod,
        result.metadata
      );
    }
  };

  const results = surpriseDiscoveryMutation.data?.results || [];

  if (compact) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <CardTitle className="text-lg">Surprise Me</CardTitle>
            </div>
            <Button
              size="sm"
              onClick={handleSurpriseMe}
              disabled={surpriseDiscoveryMutation.isPending || isRevealing}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {surpriseDiscoveryMutation.isPending || isRevealing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {results.length > 0 && (
          <CardContent>
            <div className="space-y-3">
              {results.slice(0, 1).map((result: SurpriseResult, index: number) => (
                <div
                  key={index}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 ${
                    isRevealing ? 'animate-in slide-in-from-top-2' : ''
                  }`}
                  onClick={async () => {
                    // Track term click
                    if (currentSessionId) {
                      await analytics.trackTermClick(
                        currentSessionId,
                        result.discoveryMode,
                        result.term.id,
                        result.surpriseReason,
                        result.confidenceScore,
                        result.metadata
                      );
                    }
                    onTermSelect?.(result.term);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{result.term.name}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {result.surpriseReason}
                      </p>
                      {result.metadata.categoryName && (
                        <Badge variant="outline" className="text-xs mt-2">
                          {result.metadata.categoryName}
                        </Badge>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Surprise Me!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Discover amazing AI/ML concepts you never knew existed
            </p>
          </div>
        </div>
      </div>

      {/* Discovery Modes */}
      {showModeSelector && modes?.modes && (
        <Tabs value={selectedMode} onValueChange={setSelectedMode} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            {modes.modes.map(mode => (
              <TabsTrigger
                key={mode.id}
                value={mode.id}
                className="flex items-center space-x-2"
                onClick={() => {
                  if (mode.id !== selectedMode) {
                    analytics.trackModePreference(mode.id, 'user_selection');
                  }
                }}
              >
                {modeIcons[mode.id as keyof typeof modeIcons]}
                <span className="hidden sm:inline">{mode.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {modes.modes.map(mode => (
            <TabsContent key={mode.id} value={mode.id} className="mt-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{mode.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {mode.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {mode.difficulty}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <Zap className="w-3 h-3" />
                          <span className="text-xs">{mode.surpriseLevel} surprise</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={handleSurpriseMe}
                      disabled={surpriseDiscoveryMutation.isPending || isRevealing}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      {surpriseDiscoveryMutation.isPending || isRevealing ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Discovering...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Surprise Me!
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              <span>Your Discoveries</span>
            </h3>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {results.length} terms found
            </Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {results.map((result: SurpriseResult, index: number) => (
              <Card
                key={index}
                className={`relative overflow-hidden transition-all duration-500 transform ${
                  isRevealing
                    ? `animate-in slide-in-from-bottom-4 duration-${300 + index * 100}`
                    : 'hover:scale-105 hover:shadow-lg'
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <span>{result.term.name}</span>
                        {result.metadata.isUnexplored && (
                          <Badge variant="outline" className="text-xs">
                            Hidden Gem
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">{result.surpriseReason}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(result.term, result)}
                        className="h-8 w-8 p-0"
                      >
                        <Share className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Confidence Score */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Surprise Level</span>
                      <span className="font-medium">{result.confidenceScore}%</span>
                    </div>
                    <Progress value={result.confidenceScore} className="h-2" />
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                    {result.term.shortDefinition ||
                      `${result.term.definition.substring(0, 150)}...`}
                  </p>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {result.metadata.categoryName && (
                      <Badge variant="outline" className="text-xs">
                        {result.metadata.categoryName}
                      </Badge>
                    )}
                    {result.metadata.difficultyLevel && (
                      <Badge variant="outline" className="text-xs">
                        {result.metadata.difficultyLevel}
                      </Badge>
                    )}
                    {result.metadata.isPopular && (
                      <Badge variant="outline" className="text-xs bg-blue-50">
                        Popular
                      </Badge>
                    )}
                  </div>

                  {/* Connection Path */}
                  {result.connectionPath && result.connectionPath.length > 1 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Connected to:</p>
                      <div className="flex items-center space-x-1 text-xs">
                        {result.connectionPath.map((term, idx) => (
                          <React.Fragment key={idx}>
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                              {term}
                            </span>
                            {idx < (result.connectionPath?.length || 0) - 1 && (
                              <ArrowRight className="w-3 h-3 text-gray-400" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button
                      className="w-full"
                      onClick={async () => {
                        // Track term click
                        if (currentSessionId) {
                          await analytics.trackTermClick(
                            currentSessionId,
                            result.discoveryMode,
                            result.term.id,
                            result.surpriseReason,
                            result.confidenceScore,
                            result.metadata
                          );
                        }
                        onTermSelect?.(result.term);
                      }}
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Explore This Term
                    </Button>

                    {/* Feedback */}
                    {isAuthenticated && currentSessionId && (
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-xs text-gray-500">Was this surprising?</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleFeedback(result, 5, 4)}
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleFeedback(result, 2, 3)}
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Get More Button */}
          <div className="text-center mt-6">
            <Button
              variant="outline"
              onClick={handleSurpriseMe}
              disabled={surpriseDiscoveryMutation.isPending || isRevealing}
              className="bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Get More Surprises
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!surpriseDiscoveryMutation.isPending && results.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Ready for Adventure?</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Click "Surprise Me!" to discover amazing AI/ML concepts tailored just for you.
                </p>
                <Button
                  onClick={handleSurpriseMe}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Exploring
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {surpriseDiscoveryMutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Oops! We couldn't fetch any surprises right now. Please try again in a moment.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
