/**
 * Adaptive Learning Dashboard
 * Displays personalized learning recommendations and organization based on user patterns
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  BookOpen,
  Brain,
  ChevronRight,
  Clock,
  Star,
  Target,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface LearningPattern {
  userId: string;
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
  learningStyle: 'sequential' | 'exploratory' | 'project-based' | 'reference';
  sessionLength: 'short' | 'medium' | 'long';
  contentPreferences: {
    conceptual: number;
    practical: number;
    visual: number;
    depth: number;
  };
  categoryAffinities: Array<{
    categoryId: string;
    categoryName: string;
    affinityScore: number;
    masteryLevel: number;
  }>;
}

interface AdaptiveRecommendation {
  termId: string;
  termName: string;
  categoryName: string;
  recommendationScore: number;
  recommendationType: 'next_logical' | 'fill_gap' | 'explore_new' | 'review_weak';
  reasoning: string;
  estimatedDifficulty: number;
  estimatedEngagement: number;
  adaptations: {
    contentFormat: 'overview' | 'detailed' | 'example-focused' | 'visual';
    presentationStyle: 'linear' | 'modular' | 'interactive';
    supportLevel: 'minimal' | 'guided' | 'intensive';
  };
}

interface LearningInsights {
  userId: string;
  overallProgress: number;
  strengthAreas: string[];
  improvementAreas: string[];
  recommendedNextSteps: AdaptiveRecommendation[];
  learningVelocity: number;
  retentionRate: number;
  engagementTrends: Array<{
    date: string;
    engagementScore: number;
    focusAreas: string[];
  }>;
}

const AdaptiveLearning: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [_feedbackType, setFeedbackType] = useState<'too_easy' | 'too_hard' | 'just_right' | null>(
    null
  );
  const queryClient = useQueryClient();

  // Fetch learning patterns
  const { data: patterns, isLoading: patternsLoading } = useQuery<{
    success: boolean;
    data: LearningPattern;
  }>({
    queryKey: ['adaptiveLearningPatterns'],
    queryFn: async () => {
      const response = await fetch('/api/adaptive/learning-patterns');
      if (!response.ok) throw new Error('Failed to fetch learning patterns');
      return response.json();
    },
  });

  // Fetch recommendations
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery<{
    success: boolean;
    data: AdaptiveRecommendation[];
  }>({
    queryKey: ['adaptiveRecommendations'],
    queryFn: async () => {
      const response = await fetch('/api/adaptive/recommendations?count=15');
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      return response.json();
    },
  });

  // Fetch learning insights
  const { data: insights, isLoading: insightsLoading } = useQuery<{
    success: boolean;
    data: LearningInsights;
  }>({
    queryKey: ['learningInsights'],
    queryFn: async () => {
      const response = await fetch('/api/adaptive/learning-insights');
      if (!response.ok) throw new Error('Failed to fetch learning insights');
      return response.json();
    },
  });

  // Submit feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: async (feedback: {
      feedbackType: string;
      difficultyAdjustment?: number;
      paceAdjustment?: number;
    }) => {
      const response = await fetch('/api/adaptive/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback),
      });
      if (!response.ok) throw new Error('Failed to submit feedback');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adaptiveLearningPatterns'] });
      queryClient.invalidateQueries({ queryKey: ['adaptiveRecommendations'] });
      setFeedbackType(null);
    },
  });

  const handleFeedback = (type: 'too_easy' | 'too_hard' | 'just_right') => {
    const adjustments = {
      too_easy: { difficultyAdjustment: 0.2 },
      too_hard: { difficultyAdjustment: -0.2 },
      just_right: {},
    };

    feedbackMutation.mutate({
      feedbackType: type,
      ...adjustments[type],
    });
  };

  const getRecommendationTypeIcon = (type: AdaptiveRecommendation['recommendationType']) => {
    switch (type) {
      case 'next_logical':
        return <ChevronRight className="h-4 w-4" />;
      case 'fill_gap':
        return <Target className="h-4 w-4" />;
      case 'explore_new':
        return <Zap className="h-4 w-4" />;
      case 'review_weak':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getRecommendationTypeColor = (type: AdaptiveRecommendation['recommendationType']) => {
    switch (type) {
      case 'next_logical':
        return 'bg-blue-100 text-blue-800';
      case 'fill_gap':
        return 'bg-orange-100 text-orange-800';
      case 'explore_new':
        return 'bg-green-100 text-green-800';
      case 'review_weak':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isLoading = patternsLoading || recommendationsLoading || insightsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your learning patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="h-6 w-6 mr-2 text-blue-600" />
            Adaptive Learning
          </h2>
          <p className="text-gray-600">Personalized learning experience powered by AI</p>
        </div>

        {/* Feedback Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">How's the difficulty?</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFeedback('too_easy')}
            className="flex items-center gap-1"
          >
            <ThumbsDown className="h-3 w-3" />
            Too Easy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFeedback('just_right')}
            className="flex items-center gap-1"
          >
            <Star className="h-3 w-3" />
            Just Right
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFeedback('too_hard')}
            className="flex items-center gap-1"
          >
            <ThumbsUp className="h-3 w-3" />
            Too Hard
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="patterns">Learning Style</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {insights?.data && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.round(insights.data.overallProgress * 100)}%
                      </p>
                    </div>
                  </div>
                  <Progress value={insights.data.overallProgress * 100} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Learning Velocity</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {insights.data.learningVelocity.toFixed(1)}
                      </p>
                      <p className="text-xs text-gray-500">terms/week</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Target className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Retention Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.round(insights.data.retentionRate * 100)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Strong Areas</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {insights.data.strengthAreas.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Recommendations */}
          {recommendations?.data && (
            <Card>
              <CardHeader>
                <CardTitle>Recommended for You</CardTitle>
                <p className="text-sm text-gray-600">
                  Personalized recommendations based on your learning patterns
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.data.slice(0, 6).map((rec) => (
                    <div
                      key={rec.termId}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{rec.termName}</h4>
                        <Badge
                          variant="secondary"
                          className={getRecommendationTypeColor(rec.recommendationType)}
                        >
                          {getRecommendationTypeIcon(rec.recommendationType)}
                          <span className="ml-1 capitalize">
                            {rec.recommendationType.replace('_', ' ')}
                          </span>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.categoryName}</p>
                      <p className="text-xs text-gray-500 mb-3">{rec.reasoning}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Difficulty:</span>
                          <Progress value={rec.estimatedDifficulty * 100} className="w-12 h-2" />
                        </div>
                        <Button size="sm" variant="outline">
                          Learn
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Adaptive Recommendations</CardTitle>
              <p className="text-sm text-gray-600">
                AI-powered recommendations tailored to your learning style and progress
              </p>
            </CardHeader>
            <CardContent>
              {recommendations?.data ? (
                <div className="space-y-4">
                  {recommendations.data.map((rec) => (
                    <div key={rec.termId} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-lg">{rec.termName}</h4>
                          <p className="text-sm text-gray-600">{rec.categoryName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={getRecommendationTypeColor(rec.recommendationType)}
                          >
                            {getRecommendationTypeIcon(rec.recommendationType)}
                            <span className="ml-1 capitalize">
                              {rec.recommendationType.replace('_', ' ')}
                            </span>
                          </Badge>
                          <span className="text-sm font-medium">
                            {Math.round(rec.recommendationScore * 100)}%
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-3">{rec.reasoning}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <span className="text-xs text-gray-500">Difficulty</span>
                          <Progress value={rec.estimatedDifficulty * 100} className="mt-1" />
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Engagement</span>
                          <Progress value={rec.estimatedEngagement * 100} className="mt-1" />
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Format</span>
                          <p className="text-sm capitalize">{rec.adaptations.contentFormat}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Support</span>
                          <p className="text-sm capitalize">{rec.adaptations.supportLevel}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            Estimated time: {Math.round(rec.estimatedDifficulty * 20 + 5)} minutes
                          </span>
                        </div>
                        <Button>Start Learning</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No recommendations available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learning Patterns Tab */}
        <TabsContent value="patterns" className="space-y-6">
          {patterns?.data && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Your Learning Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Preferred Difficulty</h4>
                      <Badge variant="outline" className="capitalize">
                        {patterns.data.preferredDifficulty}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Learning Style</h4>
                      <Badge variant="outline" className="capitalize">
                        {patterns.data.learningStyle.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Session Length</h4>
                      <Badge variant="outline" className="capitalize">
                        {patterns.data.sessionLength}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(patterns.data.contentPreferences).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm capitalize">{key}</span>
                          <span className="text-sm">{Math.round(value * 100)}%</span>
                        </div>
                        <Progress value={value * 100} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category Affinities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {patterns.data.categoryAffinities.map((category) => (
                      <div key={category.categoryId} className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{category.categoryName}</h4>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex-1">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Interest</span>
                                <span>{Math.round(category.affinityScore * 100)}%</span>
                              </div>
                              <Progress value={category.affinityScore * 100} />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Mastery</span>
                                <span>{Math.round(category.masteryLevel * 100)}%</span>
                              </div>
                              <Progress value={category.masteryLevel * 100} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {insights?.data && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Strength Areas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {insights.data.strengthAreas.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {insights.data.strengthAreas.map((area, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-green-100 text-green-800"
                          >
                            {area}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">Continue learning to identify your strengths</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Improvement Areas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {insights.data.improvementAreas.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {insights.data.improvementAreas.map((area, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-orange-100 text-orange-800"
                          >
                            {area}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">You're doing great across all areas!</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Engagement Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insights.data.engagementTrends.slice(-7).map((trend, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{new Date(trend.date).toLocaleDateString()}</span>
                        <div className="flex items-center gap-2 flex-1 ml-4">
                          <Progress value={trend.engagementScore * 100} className="flex-1" />
                          <span className="text-sm">
                            {Math.round(trend.engagementScore * 100)}%
                          </span>
                        </div>
                        <div className="flex gap-1 ml-4">
                          {trend.focusAreas.map((area, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdaptiveLearning;
