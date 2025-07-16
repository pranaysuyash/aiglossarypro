import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  Brain,
  Loader2,
  RefreshCw,
  Settings,
  Trash2,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../hooks/use-toast';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';

interface AIStatusData {
  status: string;
  cache: {
    keys: number;
    stats: {
      hits: number;
      misses: number;
      vsize: number;
    };
  };
  rateLimit: {
    requestsLastMinute: number;
    requestsLastHour: number;
    requestsLastDay: number;
    limits: {
      maxRequestsPerMinute: number;
      maxRequestsPerHour: number;
      maxRequestsPerDay: number;
    };
  };
  timestamp: string;
}

interface ContentSuggestionsData {
  totalTerms: number;
  totalCategories: number;
  suggestions: {
    term: string;
    shortDefinition: string;
    category: string;
    reason: string;
  }[];
  recommendations: {
    type: string;
    message: string;
  }[];
}

export function AIAdminDashboard() {
  const [_isClearingCache, _setIsClearingCache] = useState(false);
  const { toast } = useToast();
  const _queryClient = useQueryClient();

  // Fetch AI service status
  const {
    data: aiStatus,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useQuery<AIStatusData>({
    queryKey: ['ai-status'],
    queryFn: async () => {
      const response = await fetch('/api/ai/status');
      if (!response.ok) {throw new Error('Failed to fetch AI status');}
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch content suggestions
  const { data: suggestions, isLoading: suggestionsLoading } = useQuery<ContentSuggestionsData>({
    queryKey: ['ai-content-suggestions'],
    queryFn: async () => {
      const response = await fetch('/api/ai/content-suggestions');
      if (!response.ok) {throw new Error('Failed to fetch content suggestions');}
      const result = await response.json();
      return result.data;
    },
  });

  // Clear cache mutation
  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai/cache', {
        method: 'DELETE',
      });
      if (!response.ok) {throw new Error('Failed to clear cache');}
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'AI cache cleared successfully',
      });
      refetchStatus();
    },
    onError: error => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error?.message : 'Failed to clear cache',
        variant: 'destructive',
      });
    },
  });

  const clearCache = () => {
    clearCacheMutation.mutate();
  };

  const calculateCacheHitRate = () => {
    if (!aiStatus?.cache.stats) {return 0;}
    const { hits, misses } = aiStatus.cache.stats;
    const total = hits + misses;
    return total > 0 ? Math.round((hits / total) * 100) : 0;
  };

  const getRateLimitProgress = (current: number, max: number) => {
    return Math.round((current / max) * 100);
  };

  const getRateLimitColor = (percentage: number) => {
    if (percentage >= 80) {return 'text-red-600';}
    if (percentage >= 60) {return 'text-yellow-600';}
    return 'text-green-600';
  };

  if (statusLoading && suggestionsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-500" />
            AI System Management
          </h2>
          <p className="text-gray-600">Monitor and manage AI-powered features</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchStatus()} disabled={statusLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${statusLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Status</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${aiStatus?.status === 'operational' ? 'bg-green-500' : 'bg-red-500'}`}
              ></div>
              {aiStatus?.status || 'Unknown'}
            </div>
            <p className="text-xs text-muted-foreground">
              Last updated:{' '}
              {aiStatus?.timestamp ? new Date(aiStatus.timestamp).toLocaleString() : 'Never'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Performance</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateCacheHitRate()}%</div>
            <p className="text-xs text-muted-foreground">
              Hit rate ({aiStatus?.cache.keys || 0} cached items)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Coverage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suggestions?.totalTerms || 0}</div>
            <p className="text-xs text-muted-foreground">
              Terms across {suggestions?.totalCategories || 0} categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rate Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            API Rate Limits
          </CardTitle>
          <CardDescription>Current usage against OpenAI API rate limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiStatus?.rateLimit && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Requests per minute</span>
                  <span
                    className={getRateLimitColor(
                      getRateLimitProgress(
                        aiStatus.rateLimit.requestsLastMinute,
                        aiStatus.rateLimit.limits.maxRequestsPerMinute
                      )
                    )}
                  >
                    {aiStatus.rateLimit.requestsLastMinute} /{' '}
                    {aiStatus.rateLimit.limits.maxRequestsPerMinute}
                  </span>
                </div>
                <Progress
                  value={getRateLimitProgress(
                    aiStatus.rateLimit.requestsLastMinute,
                    aiStatus.rateLimit.limits.maxRequestsPerMinute
                  )}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Requests per hour</span>
                  <span
                    className={getRateLimitColor(
                      getRateLimitProgress(
                        aiStatus.rateLimit.requestsLastHour,
                        aiStatus.rateLimit.limits.maxRequestsPerHour
                      )
                    )}
                  >
                    {aiStatus.rateLimit.requestsLastHour} /{' '}
                    {aiStatus.rateLimit.limits.maxRequestsPerHour}
                  </span>
                </div>
                <Progress
                  value={getRateLimitProgress(
                    aiStatus.rateLimit.requestsLastHour,
                    aiStatus.rateLimit.limits.maxRequestsPerHour
                  )}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Requests per day</span>
                  <span
                    className={getRateLimitColor(
                      getRateLimitProgress(
                        aiStatus.rateLimit.requestsLastDay,
                        aiStatus.rateLimit.limits.maxRequestsPerDay
                      )
                    )}
                  >
                    {aiStatus.rateLimit.requestsLastDay} /{' '}
                    {aiStatus.rateLimit.limits.maxRequestsPerDay}
                  </span>
                </div>
                <Progress
                  value={getRateLimitProgress(
                    aiStatus.rateLimit.requestsLastDay,
                    aiStatus.rateLimit.limits.maxRequestsPerDay
                  )}
                  className="h-2"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Content Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Content Recommendations</CardTitle>
          <CardDescription>AI-powered suggestions for improving your glossary</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestions?.recommendations?.map((rec, index) => (
            <div key={index} className="p-4 bg-blue-50 rounded-md">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="text-xs">
                  {rec.type}
                </Badge>
                <p className="text-sm text-blue-800 flex-1">{rec.message}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Management Actions</CardTitle>
          <CardDescription>Administrative controls for the AI system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline" onClick={clearCache} disabled={clearCacheMutation.isPending}>
              {clearCacheMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear AI Cache
                </>
              )}
            </Button>

            <Button variant="outline" disabled>
              <Settings className="mr-2 h-4 w-4" />
              AI Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Suggestions Preview */}
      {suggestions?.suggestions && suggestions.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Term Suggestions</CardTitle>
            <CardDescription>Recent AI-generated term suggestions for your review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.suggestions.slice(0, 3).map((suggestion, index) => (
                <div key={index} className="p-3 border rounded-md">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{suggestion.term}</h4>
                      <p className="text-sm text-gray-600 mt-1">{suggestion.shortDefinition}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {suggestion.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AIAdminDashboard;
