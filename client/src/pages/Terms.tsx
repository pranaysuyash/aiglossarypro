import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import TermCard from '../components/TermCard';
import SearchBar from '../components/SearchBar';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { TermCardSkeleton } from '@/components/ui/skeleton';
import { useLiveRegion } from '@/components/accessibility/LiveRegion';
import type {
  IEnhancedTerm,
  ApiResponse,
  PaginatedResponse,
} from '../interfaces/interfaces';

interface TermsApiResponse extends PaginatedResponse<IEnhancedTerm> {
  success: boolean;
  pagination?: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface CategoriesApiResponse extends ApiResponse<any[]> {}

export function Terms() {
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'viewCount' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { announce } = useLiveRegion();

  const TERMS_PER_PAGE = 24;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch categories for filtering with increased limit
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories?limit=500');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data: ApiResponse<any[]> = await response.json();
      return data;
    },
  });

  // Fetch terms with server-side pagination (try enhanced search first, fallback to basic)
  const { data: enhancedTermsData, isError: enhancedError } = useQuery({
    queryKey: [
      'enhanced-terms',
      currentPage,
      debouncedSearch,
      selectedCategory,
      sortBy,
      sortOrder,
    ],
    queryFn: async (): Promise<TermsApiResponse> => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: TERMS_PER_PAGE.toString(),
        sort: sortBy,
        order: sortOrder,
      });

      if (debouncedSearch) {
        params.append('query', debouncedSearch);
      }

      if (selectedCategory) {
        params.append('categories', selectedCategory);
      }

      const response = await fetch(`/api/enhanced/search?${params}`);
      if (!response.ok) throw new Error('Enhanced search failed');

      const data = await response.json();
      // Transform enhanced search response to match expected format
      return {
        success: true,
        data: data.terms || [],
        total: data.total || 0,
        page: data.pagination?.currentPage || currentPage,
        limit: data.pagination?.itemsPerPage || TERMS_PER_PAGE,
        hasMore: data.pagination?.hasMore || false,
        pagination: data.pagination,
      };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: false,
  });

  const {
    data: basicTermsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      'terms',
      currentPage,
      debouncedSearch,
      selectedCategory,
      sortBy,
      sortOrder,
    ],
    queryFn: async (): Promise<TermsApiResponse> => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: TERMS_PER_PAGE.toString(),
        sort: sortBy,
        order: sortOrder,
      });

      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      if (selectedCategory) {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/terms?${params}`);
      if (!response.ok) throw new Error('Failed to fetch terms');

      return response.json();
    },
    enabled: !enhancedTermsData || enhancedError,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const termsData = enhancedTermsData || basicTermsData;

  const terms = termsData?.data || [];
  const total = termsData?.total || 0;
  const totalPages = Math.ceil(total / TERMS_PER_PAGE);

  // Announce search results to screen readers
  useEffect(() => {
    if (!isLoading && termsData) {
      const filterInfo = [];
      if (debouncedSearch) filterInfo.push(`search "${debouncedSearch}"`);
      if (selectedCategory) filterInfo.push(`category filter`);

      const filterText =
        filterInfo.length > 0 ? ` with ${filterInfo.join(' and ')}` : '';
      const pageText =
        totalPages > 1 ? ` on page ${currentPage} of ${totalPages}` : '';

      if (terms.length === 0) {
        announce(`No terms found${filterText}`, 'polite');
      } else {
        announce(
          `Found ${total} term${
            total !== 1 ? 's' : ''
          }${filterText}${pageText}`,
          'polite'
        );
      }
    }
  }, [
    isLoading,
    terms.length,
    total,
    debouncedSearch,
    selectedCategory,
    currentPage,
    totalPages,
    announce,
  ]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleCategoryChange = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId === 'all' ? '' : categoryId);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback(
    (newSortBy: string) => {
      if (newSortBy === sortBy) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setSortBy(newSortBy as 'name' | 'viewCount' | 'createdAt');
        setSortOrder('asc');
      }
      setCurrentPage(1);
    },
    [sortBy, sortOrder]
  );

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('');
    setSortBy('name');
    setSortOrder('asc');
    setCurrentPage(1);
  }, []);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const categories = categoriesData?.data || [];
  const activeFiltersCount = [searchQuery, selectedCategory].filter(
    Boolean
  ).length;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error loading terms. Please try again.</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          AI Glossary Terms
        </h1>
        <p className="text-gray-600">
          Explore our comprehensive collection of AI and machine learning terms
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search terms..."
              initialValue={searchQuery}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="category-select"
                    className="block text-sm font-medium mb-2"
                  >
                    Category
                  </label>
                  <Select
                    value={selectedCategory || 'all'}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger id="category-select">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label
                    htmlFor="sort-by-select"
                    className="block text-sm font-medium mb-2"
                  >
                    Sort by
                  </label>
                  <Select
                    value={sortBy}
                    onValueChange={(value) => handleSortChange(value)}
                  >
                    <SelectTrigger id="sort-by-select">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="viewCount">Views</SelectItem>
                      <SelectItem value="createdAt">Newest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={clearFilters} variant="ghost">
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Terms Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: TERMS_PER_PAGE }).map((_, index) => (
            <TermCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {terms.map((term) => (
              <TermCard
                key={term.id}
                term={term}
                onTermClick={() => setLocation(`/term/${term.slug}`)}
              />
            ))}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-2">Previous</span>
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <span className="mr-2">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Terms;