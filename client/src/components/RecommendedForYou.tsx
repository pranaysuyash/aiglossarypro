/**
 * Recommended For You Widget
 * Personalized content recommendations based on user behavior analysis
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Target, 
  BookOpen, 
  TrendingUp, 
  Compass, 
  ChevronRight, 
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';

interface PersonalizedRecommendation {
  type: 'term' | 'category' | 'learning_path' | 'trending';
  id: string;
  title: string;
  description: string;
  relevanceScore: number;
  reason: string;
  metadata: Record<string, any>;
}

interface RecommendedForYouProps {
  limit?: number;
  type?: 'all' | 'term' | 'category' | 'learning_path' | 'trending';
  showHeader?: boolean;
  className?: string;
  onRecommendationClick?: (recommendation: PersonalizedRecommendation) => void;
}

const RecommendedForYou: React.FC<RecommendedForYouProps> = ({
  limit = 5,
  type = 'all',
  showHeader = true,
  className = '',
  onRecommendationClick
}) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['personalized-recommendations', type, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        type,
        limit: limit.toString()
      });
      
      const response = await fetch(`/api/personalized/recommendations?${params}`);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error('Failed to fetch recommendations');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if (error.message === 'Authentication required') return false;
      return failureCount < 2;
    }
  });

  const recommendations: PersonalizedRecommendation[] = data?.data || [];
  const filteredRecommendations = recommendations.filter(rec => !dismissedIds.has(rec.id));

  const handleRecommendationClick = (recommendation: PersonalizedRecommendation) => {
    if (onRecommendationClick) {
      onRecommendationClick(recommendation);
    } else {
      const path = recommendation.type === 'term' ? '/term' : 
                  recommendation.type === 'learning_path' ? '/learning-paths' :
                  recommendation.type === 'category' ? '/category' : '/trending';
      window.open(`${path}/${recommendation.id}`, '_blank');
    }
  };

  const handleFeedback = async (recommendationId: string, isPositive: boolean) => {
    try {
      await fetch('/api/personalized/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendationId,
          feedback: isPositive ? 'positive' : 'negative',
          rating: isPositive ? 5 : 1,
          action: 'feedback_click'
        })
      });
      
      setFeedbackGiven(prev => new Set(prev).add(recommendationId));
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleDismiss = (recommendationId: string) => {
    setDismissedIds(prev => new Set(prev).add(recommendationId));
    handleFeedback(recommendationId, false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'term': return <BookOpen className="w-4 h-4" />;
      case 'learning_path': return <Target className="w-4 h-4" />;
      case 'category': return <Compass className="w-4 h-4" />;
      case 'trending': return <TrendingUp className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'term': return 'bg-blue-100 text-blue-700';
      case 'learning_path': return 'bg-purple-100 text-purple-700';
      case 'category': return 'bg-green-100 text-green-700';
      case 'trending': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRelevanceColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Recommended For You
            </CardTitle>
            <CardDescription>Personalized content based on your interests</CardDescription>
          </CardHeader>
        )}
        <CardContent className={!showHeader ? 'pt-6' : ''}>
          <div className="space-y-4">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || recommendations.length === 0) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Recommended For You
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={!showHeader ? 'pt-6' : ''}>
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {data?.message === 'Authentication required' 
                ? 'Sign in to get personalized recommendations'
                : 'No recommendations available yet'}
            </p>
            <Button size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                Recommended For You
              </CardTitle>
              <CardDescription>
                Based on your learning patterns and interests
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={!showHeader ? 'pt-6' : ''}>
        {filteredRecommendations.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500">All recommendations dismissed</p>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-2"
              onClick={() => setDismissedIds(new Set())}
            >
              Show All Again
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecommendations.map((recommendation, index) => (
              <div
                key={recommendation.id}
                className="group relative flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                {/* Type Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(recommendation.type)}`}>
                  {getTypeIcon(recommendation.type)}
                </div>
                
                {/* Content */}
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => handleRecommendationClick(recommendation)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                        {recommendation.title}
                      </h4>
                      <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                        {recommendation.description}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {recommendation.reason}
                        </Badge>
                        <Badge className={`text-xs px-1 py-0 ${getRelevanceColor(recommendation.relevanceScore)}`}>
                          {Math.round(recommendation.relevanceScore)}% match
                        </Badge>
                      </div>
                    </div>
                    
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 ml-2" />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!feedbackGiven.has(recommendation.id) ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFeedback(recommendation.id, true);
                        }}
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFeedback(recommendation.id, false);
                        }}
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </Button>
                    </>
                  ) : (
                    <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      Thanks!
                    </div>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss(recommendation.id);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Footer */}
        {filteredRecommendations.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {data?.metadata ? `Based on ${data.metadata.userProfile.skillLevel} level` : 'Personalized for you'}
              </span>
              <Button 
                variant="link" 
                size="sm" 
                className="text-xs p-0 h-auto"
                onClick={() => window.open('/personalized', '_blank')}
              >
                View All
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendedForYou;