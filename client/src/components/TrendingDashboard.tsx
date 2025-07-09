/**
 * Trending Terms Dashboard Component
 * Real-time analytics and trending content discovery
 */

import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Bookmark,
  Clock,
  Eye,
  Filter,
  Minus,
  RefreshCw,
  Share2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface TrendingTerm {
  id: string;
  name: string;
  shortDefinition: string;
  categoryName: string;
  viewCount: number;
  recentViews: number;
  velocityScore: number;
  engagementScore: number;
  trendDirection: 'up' | 'down' | 'stable';
  percentageChange: number;
  averageTimeSpent: number;
  shareCount: number;
  bookmarkCount: number;
}

interface TrendingFilters {
  timeRange: 'hour' | 'day' | 'week' | 'month';
  trendType: 'velocity' | 'engagement' | 'emerging' | 'popular';
  category?: string;
}

interface TrendingAnalytics {
  totalTrendingTerms: number;
  averageVelocityScore: number;
  topCategories: Array<{ categoryId: string; name: string; trendingCount: number }>;
  trendingChangeFromPrevious: number;
}

const TrendingDashboard: React.FC = () => {
  const [filters, setFilters] = useState<TrendingFilters>({
    timeRange: 'day',
    trendType: 'popular',
  });

  // Fetch trending terms
  const {
    data: trendingData,
    isLoading: termsLoading,
    refetch: refetchTerms,
  } = useQuery({
    queryKey: ['trending-terms', filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        timeRange: filters.timeRange,
        trendType: filters.trendType,
        ...(filters.category && { category: filters.category }),
        limit: '20',
      });

      const response = await fetch(`/api/trending/terms?${params}`);
      if (!response.ok) throw new Error('Failed to fetch trending terms');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch trending analytics
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['trending-analytics', filters.timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/trending/analytics?timeRange=${filters.timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch trending analytics');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch trending categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['trending-categories', filters.timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/trending/categories?timeRange=${filters.timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch trending categories');
      return response.json();
    },
    refetchInterval: 60000,
  });

  const trendingTerms: TrendingTerm[] = trendingData?.data || [];
  const analytics: TrendingAnalytics = analyticsData?.data || {
    totalTrendingTerms: 0,
    averageVelocityScore: 0,
    topCategories: [],
    trendingChangeFromPrevious: 0,
  };

  const formatTimeSpent = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.round(seconds / 60)}m`;
  };

  const formatPercentage = (value: number): string => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (direction: string): string => {
    switch (direction) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trending Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Real-time insights into content popularity and engagement
          </p>
        </div>
        <Button
          onClick={() => refetchTerms()}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Range</label>
              <Select
                value={filters.timeRange}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, timeRange: value as any }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hour">Last Hour</SelectItem>
                  <SelectItem value="day">Last Day</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Trend Type</label>
              <Select
                value={filters.trendType}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, trendType: value as any }))
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="velocity">Fastest Growing</SelectItem>
                  <SelectItem value="engagement">High Engagement</SelectItem>
                  <SelectItem value="emerging">Emerging Content</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Trending</p>
                <p className="text-2xl font-bold">{analytics.totalTrendingTerms}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Velocity</p>
                <p className="text-2xl font-bold">{analytics.averageVelocityScore.toFixed(1)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Top Categories</p>
                <p className="text-2xl font-bold">{analytics.topCategories.length}</p>
              </div>
              <Filter className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Change</p>
                <p className="text-2xl font-bold">
                  {formatPercentage(analytics.trendingChangeFromPrevious)}
                </p>
              </div>
              {getTrendIcon(
                analytics.trendingChangeFromPrevious > 0
                  ? 'up'
                  : analytics.trendingChangeFromPrevious < 0
                    ? 'down'
                    : 'stable'
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="terms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="terms">Trending Terms</TabsTrigger>
          <TabsTrigger value="categories">Trending Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="terms">
          <Card>
            <CardHeader>
              <CardTitle>Trending Terms</CardTitle>
              <CardDescription>
                {filters.trendType === 'popular' && 'Most viewed terms in the selected time period'}
                {filters.trendType === 'velocity' && 'Terms with the fastest growth rate'}
                {filters.trendType === 'engagement' && 'Terms with highest user engagement'}
                {filters.trendType === 'emerging' && 'New terms gaining rapid traction'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {termsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 h-20 rounded-lg" />
                  ))}
                </div>
              ) : trendingTerms.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No trending terms found for the selected filters.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trendingTerms.map((term, index) => (
                    <div
                      key={term.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => window.open(`/term/${term.id}`, '_blank')}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                            <h3 className="font-semibold text-lg">{term.name}</h3>
                            <Badge variant="outline">{term.categoryName}</Badge>
                            <Badge className={getTrendColor(term.trendDirection)}>
                              {getTrendIcon(term.trendDirection)}
                              {formatPercentage(term.percentageChange)}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-3">{term.shortDefinition}</p>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {term.recentViews} views
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatTimeSpent(term.averageTimeSpent)} avg
                            </div>
                            <div className="flex items-center gap-1">
                              <Share2 className="w-4 h-4" />
                              {term.shareCount} shares
                            </div>
                            <div className="flex items-center gap-1">
                              <Bookmark className="w-4 h-4" />
                              {term.bookmarkCount} saves
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round(term.engagementScore)}
                          </div>
                          <div className="text-xs text-gray-500">Engagement Score</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Trending Categories</CardTitle>
              <CardDescription>
                Categories with the most engagement in the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {categoriesData?.data?.map((category: any, index: number) => (
                    <div
                      key={category.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                            <h3 className="font-semibold">{category.name}</h3>
                          </div>
                          <p className="text-gray-600 text-sm">{category.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">{category.viewCount}</div>
                          <div className="text-xs text-gray-500">Total Views</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrendingDashboard;
