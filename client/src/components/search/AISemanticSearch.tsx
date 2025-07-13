/**
 * AI Semantic Search Component
 * Advanced search interface that leverages the adaptive search backend
 */

import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowUpDown,
  BarChart,
  Brain,
  Clock,
  Filter,
  Lightbulb,
  Map,
  Network,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { GoogleAd } from '../ads/GoogleAd';
import { useAdPlacement } from '../../hooks/useAdSense';

interface SemanticSearchResult {
  id: string;
  name: string;
  definition?: string;
  shortDefinition?: string;
  category?: {
    id: string;
    name: string;
  };
  viewCount: number;
  relevanceScore: number;
  semanticSimilarity?: number;
  conceptRelationships?: string[];
  suggestedPrerequisites?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface SearchStrategy {
  strategy: 'fts' | 'prefix' | 'exact' | 'trigram';
  isGeneric: boolean;
  estimatedMatches?: number;
}

interface SemanticSearchResponse {
  results: SemanticSearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  searchTime: number;
  query: string;
  hasMore: boolean;
  strategy: string;
  isGeneric: boolean;
}

interface AISemanticSearchProps {
  className?: string;
  onResultSelect?: (result: SemanticSearchResult) => void;
}

const AISemanticSearch: React.FC<AISemanticSearchProps> = ({ className = '', onResultSelect }) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'basic' | 'semantic' | 'advanced'>('semantic');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Advanced search options
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'relevance' | 'name' | 'popularity' | 'recent'>('relevance');
  const [includeDefinition, setIncludeDefinition] = useState(true);
  const [minRelevanceScore, setMinRelevanceScore] = useState([5]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1); // Reset page when query changes
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // AI Semantic Search Query
  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
  } = useQuery<SemanticSearchResponse>({
    queryKey: [
      'adaptive-search',
      debouncedQuery,
      page,
      selectedCategories,
      sortBy,
      includeDefinition,
      searchMode,
    ],
    queryFn: async () => {
      if (!debouncedQuery.trim()) {
        return {
          results: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
          searchTime: 0,
          query: '',
          hasMore: false,
          strategy: 'none',
          isGeneric: false,
        };
      }

      const searchParams = new URLSearchParams({
        query: debouncedQuery,
        page: page.toString(),
        limit: '20',
        sort: sortBy,
        includeDefinition: includeDefinition.toString(),
      });

      if (selectedCategories.length > 0) {
        searchParams.append('category', selectedCategories[0]); // API supports single category
      }

      const response = await fetch(`/api/adaptive-search?${searchParams}`);

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const result = await response.json();
      return result.data || result;
    },
    enabled: debouncedQuery.length >= 2,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  // Categories for filtering
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
    staleTime: 300000, // 5 minutes
  });

  // Search suggestions
  const { data: suggestions = [] } = useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return [];

      const response = await fetch(
        `/api/search/suggestions?q=${encodeURIComponent(debouncedQuery)}&limit=5`
      );
      if (!response.ok) return [];

      return response.json();
    },
    enabled: debouncedQuery.length >= 2 && debouncedQuery.length < 10,
    staleTime: 60000,
  });

  const _handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    setPage(1);
  }, []);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setQuery(suggestion);
  }, []);

  const handleResultClick = useCallback(
    (result: SemanticSearchResult) => {
      if (onResultSelect) {
        onResultSelect(result);
      }
    },
    [onResultSelect]
  );

  const handleCategoryToggle = useCallback((categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
    setSortBy('relevance');
    setMinRelevanceScore([5]);
    setPage(1);
  }, []);

  const loadMoreResults = useCallback(() => {
    if (searchResults?.hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [searchResults?.hasMore]);

  // Memoized search strategy info
  const searchInfo = useMemo(() => {
    if (!searchResults) return null;

    return {
      strategy: searchResults.strategy,
      isGeneric: searchResults.isGeneric,
      searchTime: searchResults.searchTime,
      totalResults: searchResults.total,
    };
  }, [searchResults]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="h-6 w-6 mr-2 text-blue-600" />
            AI Semantic Search
          </h2>
          <p className="text-gray-600">
            Intelligent search with concept understanding and relationship mapping
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={searchMode === 'semantic' ? 'default' : 'secondary'}>
            <Sparkles className="h-3 w-3 mr-1" />
            {searchMode === 'semantic' ? 'AI Active' : 'Basic Search'}
          </Badge>
        </div>
      </div>

      {/* Search Input */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Main Search Bar */}
            <div className="relative">
              <Label htmlFor="semantic-search-input" className="sr-only">
                Search AI/ML concepts with natural language
              </Label>
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                aria-hidden="true"
              />
              <Input
                id="semantic-search-input"
                type="text"
                placeholder="Search AI/ML concepts with natural language..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-12 text-lg"
                autoFocus
                aria-describedby="search-instructions"
                aria-autocomplete="list"
                role="searchbox"
                aria-expanded={!!searchResults && searchResults.results.length > 0}
                aria-label="AI semantic search input"
              />
              <div id="search-instructions" className="sr-only">
                Enter search terms to find AI and machine learning concepts. Use natural language
                for best results.
                {searchResults && `Found ${searchResults.total} results`}
              </div>
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  aria-label="Clear search query"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </Button>
              )}
            </div>

            {/* Search Mode Toggle */}
            <div className="flex items-center gap-2">
              <Label htmlFor="search-mode" className="text-sm font-medium">
                Search Mode:
              </Label>
              <Tabs value={searchMode} onValueChange={(value: any) => setSearchMode(value)}>
                <TabsList className="grid w-auto grid-cols-3">
                  <TabsTrigger value="basic" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Basic
                  </TabsTrigger>
                  <TabsTrigger value="semantic" className="text-xs">
                    <Brain className="h-3 w-3 mr-1" />
                    AI Semantic
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="text-xs">
                    <Target className="h-3 w-3 mr-1" />
                    Advanced
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className="ml-auto"
              >
                <Filter className="h-3 w-3 mr-1" />
                Filters
              </Button>
            </div>

            {/* Search Suggestions */}
            {suggestions.length > 0 && query.length > 0 && query.length < 10 && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">Suggestions:</Label>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion: any, index: number) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion.name)}
                      className="text-xs"
                    >
                      {suggestion.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {isAdvancedOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Categories */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Categories</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.map((category: any) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() => handleCategoryToggle(category.id)}
                      />
                      <Label htmlFor={`category-${category.id}`} className="text-sm cursor-pointer">
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Sort By</Label>
                <div className="space-y-2">
                  {[
                    { value: 'relevance', label: 'Relevance', icon: Target },
                    { value: 'popularity', label: 'Popularity', icon: TrendingUp },
                    { value: 'recent', label: 'Most Recent', icon: Clock },
                    { value: 'name', label: 'Alphabetical', icon: ArrowUpDown },
                  ].map(({ value, label, icon: Icon }) => (
                    <div key={value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`sort-${value}`}
                        checked={sortBy === value}
                        onCheckedChange={() => setSortBy(value as any)}
                      />
                      <Label
                        htmlFor={`sort-${value}`}
                        className="text-sm cursor-pointer flex items-center"
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Options</Label>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-definition"
                      checked={includeDefinition}
                      onCheckedChange={(checked) => setIncludeDefinition(!!checked)}
                    />
                    <Label htmlFor="include-definition" className="text-sm cursor-pointer">
                      Include full definitions
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">
                      Minimum Relevance Score: {minRelevanceScore[0]}
                    </Label>
                    <Slider
                      value={minRelevanceScore}
                      onValueChange={setMinRelevanceScore}
                      max={20}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button onClick={() => setIsAdvancedOpen(false)}>Apply Filters</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {debouncedQuery.length >= 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Search Results
                {searchResults && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    {searchResults.total} results in {searchResults.searchTime}ms
                  </span>
                )}
              </CardTitle>

              {searchInfo && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Strategy: {searchInfo.strategy.toUpperCase()}
                  </Badge>
                  {searchInfo.isGeneric && (
                    <Badge variant="secondary" className="text-xs">
                      <Lightbulb className="h-3 w-3 mr-1" />
                      Generic Query
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">Search failed. Please try again.</p>
                <Button variant="outline" onClick={() => refetch()} className="mt-2">
                  Retry Search
                </Button>
              </div>
            ) : searchResults?.results.length === 0 ? (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No results found for "{debouncedQuery}"</p>
                <p className="text-sm text-gray-500 mt-2">
                  Try adjusting your search terms or filters
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults?.results.map((result, index) => (
                  <>
                    <div
                      key={result.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleResultClick(result)}
                    >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 hover:text-blue-600">
                            {result.name}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            Score: {result.relevanceScore.toFixed(1)}
                          </Badge>
                        </div>

                        <p className="text-gray-600 text-sm mb-2">
                          {result.shortDefinition || `${result.definition?.substring(0, 200)}...`}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {result.category && (
                            <span className="flex items-center">
                              <Map className="h-3 w-3 mr-1" />
                              {result.category.name}
                            </span>
                          )}
                          <span className="flex items-center">
                            <BarChart className="h-3 w-3 mr-1" />
                            {result.viewCount} views
                          </span>
                          {result.semanticSimilarity && (
                            <span className="flex items-center">
                              <Network className="h-3 w-3 mr-1" />
                              {(result.semanticSimilarity * 100).toFixed(0)}% similar
                            </span>
                          )}
                        </div>

                        {/* Concept Relationships */}
                        {result.conceptRelationships && result.conceptRelationships.length > 0 && (
                          <div className="mt-2">
                            <Label className="text-xs text-gray-500">Related concepts:</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {result.conceptRelationships.slice(0, 3).map((concept, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {concept}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                    </div>
                    </div>
                    {/* Show ad every 8th result for free users */}
                    {index > 0 && (index + 1) % 8 === 0 && useAdPlacement({ location: 'search_results' }).canShowAd && (
                      <GoogleAd
                        slot={import.meta.env.VITE_AD_SLOT_SEARCH_RESULTS || ''}
                        format="horizontal"
                        className="my-6"
                      />
                    )}
                  </>
                ))}

                {/* Load More Button */}
                {searchResults?.hasMore && (
                  <div className="text-center pt-4">
                    <Button variant="outline" onClick={loadMoreResults} disabled={isLoading}>
                      Load More Results
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AISemanticSearch;
