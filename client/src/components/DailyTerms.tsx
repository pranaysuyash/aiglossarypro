/**
 * Daily Terms Component
 *
 * Displays "Today's 50 Terms" with intelligent categorization, filtering,
 * and interactive learning features.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  BookOpen,
  Calendar,
  Clock,
  Code,
  Filter,
  Grid,
  List,
  RefreshCw,
  Target,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import type { ITerm } from '../../../shared/types';

interface DailyTermsResponse {
  date: string;
  terms: ITerm[];
  metadata: {
    algorithm_version: string;
    selection_criteria: any;
    distribution: {
      difficulty: Record<string, number>;
      category: Record<string, number>;
      quality: {
        withImplementation: number;
        withCodeExamples: number;
        withInteractiveElements: number;
        averageDefinitionLength: number;
      };
    };
    generated_at: string;
  };
}

interface FilterState {
  difficulty: string[];
  category: string[];
  hasCodeExamples: boolean | null;
  hasInteractiveElements: boolean | null;
  searchQuery: string;
}

const DailyTerms: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<FilterState>({
    difficulty: [],
    category: [],
    hasCodeExamples: null,
    hasInteractiveElements: null,
    searchQuery: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();

  // Fetch today's terms
  const {
    data: dailyTermsData,
    isLoading,
    error,
    refetch,
  } = useQuery<DailyTermsResponse>({
    queryKey: ['dailyTerms', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const dateParam = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/daily-terms?date=${dateParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch daily terms');
      }
      const result = await response.json();
      return result.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
  });

  // Filter terms based on current filters
  const filteredTerms = useMemo(() => {
    if (!dailyTermsData?.terms) {return [];}

    return dailyTermsData.terms.filter(term => {
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch =
          term.name.toLowerCase().includes(query) ||
          term.definition?.toLowerCase().includes(query) ||
          term.shortDefinition?.toLowerCase().includes(query);
        if (!matchesSearch) {return false;}
      }

      // Difficulty filter
      if (filters.difficulty.length > 0) {
        const termDifficulty = (term as any).difficultyLevel || 'intermediate';
        if (!filters.difficulty.includes(termDifficulty)) {return false;}
      }

      // Category filter
      if (filters.category.length > 0) {
        if (!filters.category.includes(term.category || 'General')) {return false;}
      }

      // Code examples filter
      if (filters.hasCodeExamples !== null) {
        const hasCode = (term as any).hasCodeExamples || false;
        if (filters.hasCodeExamples !== hasCode) {return false;}
      }

      // Interactive elements filter
      if (filters.hasInteractiveElements !== null) {
        const hasInteractive = (term as any).hasInteractiveElements || false;
        if (filters.hasInteractiveElements !== hasInteractive) {return false;}
      }

      return true;
    });
  }, [dailyTermsData?.terms, filters]);

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    if (!dailyTermsData?.terms) {return { difficulties: [], categories: [] };}

    const difficulties = [
      ...new Set(dailyTermsData.terms.map(term => (term as any).difficultyLevel || 'intermediate')),
    ];

    const categories = [...new Set(dailyTermsData.terms.map(term => term.category || 'General'))];

    return {
      difficulties: difficulties.sort(),
      categories: categories.sort(),
    };
  }, [dailyTermsData?.terms]);

  const handleRefresh = async () => {
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['dailyTerms'] });
  };

  const clearFilters = () => {
    setFilters({
      difficulty: [],
      category: [],
      hasCodeExamples: null,
      hasInteractiveElements: null,
      searchQuery: '',
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-blue-100 text-blue-800',
      advanced: 'bg-orange-100 text-orange-800',
      expert: 'bg-red-100 text-red-800',
    };
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDistribution = (distribution: Record<string, number>) => {
    return Object.entries(distribution)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Daily Terms</h3>
          <p className="text-red-600 mb-4">
            {error instanceof Error ? error?.message : 'An unexpected error occurred'}
          </p>
          <button
            onClick={handleRefresh}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Today's AI/ML Terms</h1>
            <p className="text-gray-600">
              {dailyTermsData
                ? `${dailyTermsData.terms.length} intelligently selected terms`
                : 'Loading...'}{' '}
              for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Date Selector */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={e => setSelectedDate(new Date(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {dailyTermsData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Total Terms</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-1">{dailyTermsData.terms.length}</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Code className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">With Code</span>
              </div>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {dailyTermsData.metadata.distribution.quality.withCodeExamples}
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Interactive</span>
              </div>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {dailyTermsData.metadata.distribution.quality.withInteractiveElements}
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Generated</span>
              </div>
              <p className="text-sm font-medium text-orange-900 mt-1">
                {format(new Date(dailyTermsData.metadata.generated_at), 'HH:mm')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search terms..."
            value={filters.searchQuery}
            onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64"
          />

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 border border-gray-300 rounded-md px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {(filters.difficulty.length > 0 ||
              filters.category.length > 0 ||
              filters.hasCodeExamples !== null ||
              filters.hasInteractiveElements !== null) && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                {filters.difficulty.length +
                  filters.category.length +
                  (filters.hasCodeExamples !== null ? 1 : 0) +
                  (filters.hasInteractiveElements !== null ? 1 : 0)}
              </span>
            )}
          </button>

          {(filters.difficulty.length > 0 ||
            filters.category.length > 0 ||
            filters.hasCodeExamples !== null ||
            filters.hasInteractiveElements !== null ||
            filters.searchQuery) && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <div className="space-y-2">
                {filterOptions.difficulties.map(difficulty => (
                  <label key={difficulty} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.difficulty.includes(difficulty)}
                      onChange={e => {
                        if (e.target.checked) {
                          setFilters(prev => ({
                            ...prev,
                            difficulty: [...prev.difficulty, difficulty],
                          }));
                        } else {
                          setFilters(prev => ({
                            ...prev,
                            difficulty: prev.difficulty.filter(d => d !== difficulty),
                          }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(difficulty)}`}
                    >
                      {difficulty}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {filterOptions.categories.map(category => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.category.includes(category)}
                      onChange={e => {
                        if (e.target.checked) {
                          setFilters(prev => ({
                            ...prev,
                            category: [...prev.category, category],
                          }));
                        } else {
                          setFilters(prev => ({
                            ...prev,
                            category: prev.category.filter(c => c !== category),
                          }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Content Type Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Features
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasCodeExamples === true}
                    onChange={e => {
                      setFilters(prev => ({
                        ...prev,
                        hasCodeExamples: e.target.checked ? true : null,
                      }));
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">Has Code Examples</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasInteractiveElements === true}
                    onChange={e => {
                      setFilters(prev => ({
                        ...prev,
                        hasInteractiveElements: e.target.checked ? true : null,
                      }));
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">Has Interactive Elements</span>
                </label>
              </div>
            </div>

            {/* Quick Stats */}
            {dailyTermsData && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Distribution</label>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>
                    Difficulty:{' '}
                    {formatDistribution(dailyTermsData.metadata.distribution.difficulty)}
                  </div>
                  <div>Algorithm: v{dailyTermsData.metadata.algorithm_version}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {filteredTerms.length} of {dailyTermsData?.terms.length || 0} terms
        </p>
      </div>

      {/* Terms Display */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredTerms.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No terms found</h3>
          <p className="text-gray-600 mb-4">
            {filters.searchQuery || filters.difficulty.length > 0 || filters.category.length > 0
              ? 'Try adjusting your filters or search query.'
              : 'No daily terms available for this date.'}
          </p>
          {(filters.searchQuery ||
            filters.difficulty.length > 0 ||
            filters.category.length > 0) && (
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-4'
          }
        >
          {filteredTerms.map(term => (
            <TermCard key={term.id} term={term} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
};

// Term Card Component
interface TermCardProps {
  term: ITerm;
  viewMode: 'grid' | 'list';
}

const TermCard: React.FC<TermCardProps> = ({ term, viewMode }) => {
  const difficulty = (term as any).difficultyLevel || 'intermediate';
  const hasCodeExamples = (term as any).hasCodeExamples || false;
  const hasInteractiveElements = (term as any).hasInteractiveElements || false;

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-blue-100 text-blue-800',
      advanced: 'bg-orange-100 text-orange-800',
      expert: 'bg-red-100 text-red-800',
    };
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                {term.name}
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(difficulty)}`}>
                {difficulty}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
              {term.shortDefinition || `${term.definition?.substring(0, 150)  }...`}
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>{term.category}</span>
              {hasCodeExamples && (
                <span className="flex items-center space-x-1">
                  <Code className="w-3 h-3" />
                  <span>Code</span>
                </span>
              )}
              {hasInteractiveElements && (
                <span className="flex items-center space-x-1">
                  <Zap className="w-3 h-3" />
                  <span>Interactive</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-2">
          {term.name}
        </h3>
        <span
          className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(difficulty)} ml-2 flex-shrink-0`}
        >
          {difficulty}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-3 line-clamp-3">
        {term.shortDefinition || `${term.definition?.substring(0, 120)  }...`}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{term.category}</span>
        <div className="flex items-center space-x-2">
          {hasCodeExamples && (
            <span title="Has code examples">
              <Code className="w-4 h-4 text-green-600" />
            </span>
          )}
          {hasInteractiveElements && (
            <span title="Has interactive elements">
              <Zap className="w-4 h-4 text-purple-600" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyTerms;
