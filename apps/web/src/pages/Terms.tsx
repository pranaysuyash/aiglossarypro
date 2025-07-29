import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useLiveRegion } from '@/components/accessibility/LiveRegion';
import SurpriseMe from '@/components/SurpriseMe';
import { TermCardSkeleton } from '@/components/ui/skeleton';
import { GoogleAd } from '../components/ads/GoogleAd';
import SearchBar from '../components/SearchBar';
import TermCard from '../components/TermCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useAuth } from '../hooks/useAuth';
import type { ApiResponse, IEnhancedTerm, PaginatedResponse } from '../interfaces/interfaces';

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
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'viewCount' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [onlyWithVisuals, setOnlyWithVisuals] = useState(false);
  const [onlyWithMath, setOnlyWithMath] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { announce } = useLiveRegion();
  const { isAuthenticated, user } = useAuth();

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
      if (!response.ok) {throw new Error('Failed to fetch categories');}
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
      selectedDifficulty,
      sortBy,
      sortOrder,
      onlyWithVisuals,
      onlyWithMath,
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

      if (selectedDifficulty) {
        params.append('difficulty', selectedDifficulty);
      }

      if (onlyWithVisuals) {
        params.append('hasVisuals', 'true');
      }

      if (onlyWithMath) {
        params.append('hasMath', 'true');
      }

      const response = await fetch(`/api/enhanced/search?${params}`);
      if (!response.ok) {throw new Error('Enhanced search failed');}

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
      selectedDifficulty,
      sortBy,
      sortOrder,
      onlyWithVisuals,
      onlyWithMath,
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

      if (selectedDifficulty) {
        params.append('difficulty', selectedDifficulty);
      }

      if (onlyWithVisuals) {
        params.append('hasVisuals', 'true');
      }

      if (onlyWithMath) {
        params.append('hasMath', 'true');
      }

      const response = await fetch(`/api/terms?${params}`);
      if (!response.ok) {throw new Error('Failed to fetch terms');}

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
      if (debouncedSearch) {filterInfo.push(`search "${debouncedSearch}"`);}
      if (selectedCategory) {filterInfo.push(`category filter`);}

      const filterText = filterInfo.length > 0 ? ` with ${filterInfo.join(' and ')}` : '';
      const pageText = totalPages > 1 ? ` on page ${currentPage} of ${totalPages}` : '';

      if (terms.length === 0) {
        announce(`No terms found${filterText}`, 'polite');
      } else {
        announce(`Found ${total} term${total !== 1 ? 's' : ''}${filterText}${pageText}`, 'polite');
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
    termsData,
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
    setSelectedDifficulty('');
    setSortBy('name');
    setSortOrder('asc');
    setOnlyWithVisuals(false);
    setOnlyWithMath(false);
    setCurrentPage(1);
  }, []);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSurpriseTermSelect = useCallback(
    (term: any) => {
      setLocation(`/terms/${term.id}`);
    },
    [setLocation]
  );

  const categories = categoriesData?.data || [];
  const activeFiltersCount = [
    searchQuery,
    selectedCategory,
    selectedDifficulty,
    onlyWithVisuals && 'hasVisuals',
    onlyWithMath && 'hasMath',
  ].filter(Boolean).length;

  // Function to render terms grid with ads interspersed
  const renderTermsWithAds = () => {
    const items: React.ReactNode[] = [];
    const isPremiumUser = user?.subscriptionTier === 'premium';
    const shouldShowAds = !isPremiumUser; // Show ads for guest and free users

    terms.forEach((term, index) => {
      // Add term card
      items.push(
        <TermCard key={term.id} term={term} onTermClick={() => setLocation(`/term/${term.slug}`)} />
      );

      // Add ad after every 8 terms (but not for premium users)
      if (shouldShowAds && (index + 1) % 8 === 0 && index < terms.length - 1) {
        items.push(
          <div key={`ad-${index}`} className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
            <GoogleAd
              slot="8765432109"
              format="horizontal"
              responsive
              className="w-full h-24 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200"
            />
          </div>
        );
      }
    });

    return items;
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error loading terms. Please try again.</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Glossary Terms</h1>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="category-select" className="block text-sm font-medium mb-2">
                    Category
                  </label>
                  <Select value={selectedCategory || 'all'} onValueChange={handleCategoryChange}>
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
                  <label htmlFor="difficulty-select" className="block text-sm font-medium mb-2">
                    Difficulty Level
                  </label>
                  <Select
                    value={selectedDifficulty || 'all'}
                    onValueChange={value => setSelectedDifficulty(value === 'all' ? '' : value)}
                  >
                    <SelectTrigger id="difficulty-select">
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="sort-by-select" className="block text-sm font-medium mb-2">
                    Sort by
                  </label>
                  <Select value={sortBy} onValueChange={value => handleSortChange(value)}>
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
                  <Button onClick={clearFilters} variant="ghost" className="w-full">
                    Clear Filters
                  </Button>
                </div>
              </div>

              {/* Additional filter checkboxes */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlyWithVisuals}
                      onChange={e => setOnlyWithVisuals(e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Only terms with visuals
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlyWithMath}
                      onChange={e => setOnlyWithMath(e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Only terms with math formulations
                    </span>
                  </label>
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
      ) : terms.length === 0 ? (
        /* Empty State with Surprise Me */
        <div className="text-center py-12">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              {debouncedSearch
                ? `No terms found for "${debouncedSearch}"`
                : selectedCategory
                  ? 'No terms found in this category'
                  : 'No terms found with current filters'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {debouncedSearch
                ? 'Try adjusting your search terms or discover something unexpected!'
                : 'Try removing some filters or let us surprise you with a random discovery!'}
            </p>

            {/* Surprise Me Fallback */}
            <div className="max-w-md mx-auto">
              <SurpriseMe
                compact
                showModeSelector={false}
                maxResults={3}
                onTermSelect={handleSurpriseTermSelect}
              />
            </div>

            {/* Clear Filters Option */}
            {activeFiltersCount > 0 && (
              <div className="mt-6">
                <Button variant="outline" onClick={clearFilters} className="mr-4">
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {renderTermsWithAds()}
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
