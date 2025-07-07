/**
 * Trending Widget Component
 * Compact trending terms display for homepage and sidebar
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Eye, ExternalLink, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';

interface TrendingTerm {
  id: string;
  name: string;
  shortDefinition: string;
  categoryName: string;
  recentViews: number;
  trendDirection: 'up' | 'down' | 'stable';
  percentageChange: number;
}

interface TrendingWidgetProps {
  timeRange?: 'hour' | 'day' | 'week';
  trendType?: 'velocity' | 'engagement' | 'emerging' | 'popular';
  limit?: number;
  showHeader?: boolean;
  className?: string;
  onTermClick?: (termId: string) => void;
}

const TrendingWidget: React.FC<TrendingWidgetProps> = ({
  timeRange = 'day',
  trendType = 'popular',
  limit = 5,
  showHeader = true,
  className = '',
  onTermClick
}) => {
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['trending-widget', timeRange, trendType, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        timeRange,
        trendType,
        limit: limit.toString()
      });
      
      const response = await fetch(`/api/trending/terms?${params}`);
      if (!response.ok) throw new Error('Failed to fetch trending terms');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000 // Consider data stale after 30 seconds
  });

  const trendingTerms: TrendingTerm[] = data?.data || [];

  const handleRefresh = async () => {
    await refetch();
    setLastRefresh(new Date());
  };

  const handleTermClick = (termId: string) => {
    if (onTermClick) {
      onTermClick(termId);
    } else {
      window.open(`/term/${termId}`, '_blank');
    }
  };

  const getTrendIcon = (direction: string, change: number) => {
    if (direction === 'up') {
      return <TrendingUp className="w-3 h-3 text-green-500" />;
    } else if (direction === 'down') {
      return <TrendingDown className="w-3 h-3 text-red-500" />;
    }
    return null;
  };

  const formatPercentage = (value: number): string => {
    return `${value > 0 ? '+' : ''}${value.toFixed(0)}%`;
  };

  const getTrendTypeLabel = (type: string): string => {
    switch (type) {
      case 'velocity': return 'Fastest Growing';
      case 'engagement': return 'Most Engaging';
      case 'emerging': return 'Emerging';
      case 'popular': return 'Popular';
      default: return 'Trending';
    }
  };

  const getTimeRangeLabel = (range: string): string => {
    switch (range) {
      case 'hour': return 'Last Hour';
      case 'day': return 'Today';
      case 'week': return 'This Week';
      default: return 'Recent';
    }
  };

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                {getTrendTypeLabel(trendType)}
              </CardTitle>
              <CardDescription>{getTimeRangeLabel(timeRange)}</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isFetching}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={showHeader ? 'pt-0' : ''}>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="w-6 h-6 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="w-8 h-4" />
              </div>
            ))}
          </div>
        ) : trendingTerms.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500">No trending terms found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trendingTerms.map((term, index) => (
              <div
                key={term.id}
                className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                onClick={() => handleTermClick(term.id)}
              >
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate group-hover:text-blue-600 transition-colors">
                      {term.name}
                    </h4>
                    <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                  
                  <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                    {term.shortDefinition}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {term.categoryName}
                    </Badge>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Eye className="w-3 h-3" />
                      {term.recentViews}
                    </div>
                    
                    {term.trendDirection !== 'stable' && (
                      <div className="flex items-center gap-1">
                        {getTrendIcon(term.trendDirection, term.percentageChange)}
                        <span className={`text-xs ${
                          term.trendDirection === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatPercentage(term.percentageChange)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Updated {lastRefresh.toLocaleTimeString()}</span>
            <Button 
              variant="link" 
              size="sm" 
              className="text-xs p-0 h-auto"
              onClick={() => window.open('/trending', '_blank')}
            >
              View All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendingWidget;