/**
 * Personalized Dashboard Component
 * AI-powered adaptive homepage with personalized content sections
 */

import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  BookOpen,
  Brain,
  ChevronRight,
  Clock,
  Compass,
  RefreshCw,
  Settings,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import type React from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface UserProfile {
  userId: string;
  interests: CategoryInterest[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  learningStyle: 'visual' | 'theoretical' | 'practical' | 'mixed';
  activityLevel: 'low' | 'moderate' | 'high';
  preferredContentTypes: string[];
  recentTopics: string[];
  engagementScore: number;
  lastUpdated: string;
}

interface CategoryInterest {
  categoryId: string;
  categoryName: string;
  interestScore: number;
  timeSpent: number;
  recentActivity: number;
}

interface PersonalizedRecommendation {
  type: 'term' | 'category' | 'learning_path' | 'trending';
  id: string;
  title: string;
  description: string;
  relevanceScore: number;
  reason: string;
  metadata: Record<string, any>;
}

interface PersonalizedHomepageData {
  userProfile: UserProfile;
  recommendations: PersonalizedRecommendation[];
  personalizedSections: {
    recentActivity: unknown[];
    recommendedForYou: PersonalizedRecommendation[];
    continuelearning: unknown[];
    exploreNew: PersonalizedRecommendation[];
    trending: PersonalizedRecommendation[];
  };
  adaptiveNavigation: {
    priorityCategories: string[];
    suggestedPaths: string[];
    recentTopics: string[];
  };
}

const PersonalizedDashboard: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);

  // Fetch personalized homepage data
  const {
    data: homepageData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['personalized-homepage'],
    queryFn: async () => {
      const response = await fetch('/api/personalized/homepage');
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error('Failed to fetch personalized data');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if (error?.message === 'Authentication required') {return false;}
      return failureCount < 2;
    },
  });

  const personalizedData: PersonalizedHomepageData = homepageData?.data;
  const userProfile = personalizedData?.userProfile;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800';
      case 'advanced':
        return 'bg-purple-100 text-purple-800';
      case 'expert':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityLevelIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <Activity className="w-4 h-4 text-green-500" />;
      case 'moderate':
        return <Activity className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <Activity className="w-4 h-4 text-gray-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!personalizedData) {
    return (
      <div className="text-center py-12">
        <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">
          Creating Your Personalized Experience
        </h3>
        <p className="text-gray-500 mb-4">
          We're analyzing your learning patterns to customize your dashboard.
        </p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome Back!</h1>
          <p className="text-gray-600 mt-2">Your personalized AI/ML learning dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* User Profile Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Skill Level</p>
                <Badge className={getSkillLevelColor(userProfile.skillLevel)}>
                  {userProfile.skillLevel}
                </Badge>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Learning Style</p>
                <p className="text-lg font-bold capitalize">{userProfile.learningStyle}</p>
              </div>
              <Brain className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activity Level</p>
                <div className="flex items-center gap-2">
                  {getActivityLevelIcon(userProfile.activityLevel)}
                  <span className="capitalize">{userProfile.activityLevel}</span>
                </div>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Engagement</p>
                <div className="space-y-1">
                  <p className="text-lg font-bold">{userProfile.engagementScore}/100</p>
                  <Progress value={userProfile.engagementScore} className="h-2" />
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">For You</TabsTrigger>
          <TabsTrigger value="continue">Continue Learning</TabsTrigger>
          <TabsTrigger value="explore">Explore New</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Recommended For You
              </CardTitle>
              <CardDescription>Based on your interests and learning patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {personalizedData.personalizedSections.recommendedForYou.map((rec, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => window.open(`/${rec.type}/${rec.id}`, '_blank')}
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      {rec.type === 'term' && <BookOpen className="w-5 h-5 text-blue-600" />}
                      {rec.type === 'learning_path' && <Target className="w-5 h-5 text-blue-600" />}
                      {rec.type === 'category' && <Compass className="w-5 h-5 text-blue-600" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900">{rec.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{rec.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {rec.reason}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(rec.relevanceScore)}% match
                        </Badge>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="continue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Continue Learning
              </CardTitle>
              <CardDescription>Pick up where you left off</CardDescription>
            </CardHeader>
            <CardContent>
              {personalizedData.personalizedSections.continuelearning.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No learning paths in progress</p>
                  <Button className="mt-4" onClick={() => window.open('/learning-paths', '_blank')}>
                    Browse Learning Paths
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {personalizedData.personalizedSections.continuelearning.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => window.open(`/learning-paths/${item.pathId}`, '_blank')}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.pathName}</h4>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span>{item.completionPercentage}%</span>
                          </div>
                          <Progress value={item.completionPercentage} className="h-2" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Last accessed: {new Date(item.lastAccessed).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="explore" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Compass className="w-5 h-5" />
                Explore New Topics
              </CardTitle>
              <CardDescription>Discover areas outside your usual interests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {personalizedData.personalizedSections.exploreNew.map((rec, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => window.open(`/${rec.type}/${rec.id}`, '_blank')}
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Compass className="w-5 h-5 text-green-600" />
                    </div>

                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{rec.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{rec.description}</p>
                      <Badge variant="outline" className="text-xs mt-2">
                        New territory
                      </Badge>
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Interest Areas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Interest Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userProfile.interests.slice(0, 5).map((interest, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{interest.categoryName}</span>
                        <span>{Math.round(interest.interestScore)}</span>
                      </div>
                      <Progress value={interest.interestScore} className="h-2 mt-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {userProfile.recentTopics.map((topic, index) => (
                    <Badge key={index} variant="outline" className="mr-2 mb-2">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PersonalizedDashboard;
