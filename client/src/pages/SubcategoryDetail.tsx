import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, FolderOpen, Loader2, Search, SortAsc, SortDesc } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'wouter';
import CategoryHierarchy, { createCategoryBreadcrumb } from '@/components/CategoryHierarchy';
import TermCard from '@/components/TermCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ITerm } from '@/interfaces/interfaces';

export default function SubcategoryDetail() {
  const { id } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'viewCount'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit] = useState(24);

  // Fetch subcategory details
  const { data: subcategory, isLoading: subcategoryLoading } = useQuery({
    queryKey: [`/api/subcategories/${id}`],
    enabled: Boolean(id),
    refetchOnWindowFocus: false,
  });

  // Fetch terms for this subcategory
  const { data: termsData, isLoading: termsLoading } = useQuery({
    queryKey: [
      `/api/subcategories/${id}/terms`,
      {
        page,
        limit,
        sort: sortBy,
        order: sortOrder,
        search: searchTerm || undefined,
      },
    ],
    enabled: Boolean(id),
    refetchOnWindowFocus: false,
  });

  // Fetch category details for breadcrumb
  const { data: categoryData } = useQuery({
    queryKey: [`/api/categories/${(subcategory as any)?.data?.categoryId}`],
    enabled: Boolean((subcategory as any)?.data?.categoryId),
    refetchOnWindowFocus: false,
  });

  const subcategoryData = (subcategory as any)?.data;
  const categoryInfo = (categoryData as any)?.data;
  const terms = (termsData as any)?.data || [];
  const totalTerms = (termsData as any)?.total || 0;
  const hasMore = (termsData as any)?.hasMore || false;

  // Filter terms locally for immediate feedback
  const filteredTerms = terms.filter((term: ITerm) => {
    if (!searchTerm) return true;
    return (
      term.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.definition?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Sort terms
  const sortedTerms = [...filteredTerms].sort((a: ITerm, b: ITerm) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'viewCount') {
      comparison = (a.viewCount || 0) - (b.viewCount || 0);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Create breadcrumb items
  const breadcrumbItems = createCategoryBreadcrumb(
    categoryInfo?.name,
    subcategoryData?.name,
    undefined,
    categoryInfo?.id,
    subcategoryData?.id
  );

  const handleLoadMore = () => {
    if (hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  // Loading state
  if (subcategoryLoading) {
    return (
      <div className="container mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 xs:py-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!subcategoryData) {
    return (
      <div className="container mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 xs:py-6">
        <div className="text-center py-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Subcategory not found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The subcategory you're looking for doesn't exist or has been moved.
            </p>
            <div className="space-x-2">
              <Link href="/subcategories">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Browse Subcategories
                </Button>
              </Link>
              <Link href="/categories">
                <Button variant="outline">Browse Categories</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 xs:py-6">
      {/* Breadcrumb */}
      <CategoryHierarchy items={breadcrumbItems} className="mb-4" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/subcategories">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Subcategories
            </Button>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {subcategoryData.name}
            </h1>

            {categoryInfo && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-gray-500 dark:text-gray-400">in</span>
                <Link href={`/category/${categoryInfo.id}`}>
                  <Badge variant="secondary" className="hover:bg-primary/10 cursor-pointer">
                    {categoryInfo.name}
                  </Badge>
                </Link>
              </div>
            )}

            {subcategoryData.description && (
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {subcategoryData.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {totalTerms} {totalTerms === 1 ? 'Term' : 'Terms'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Search and Sort Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search terms in this subcategory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort Options */}
          <div className="flex gap-2">
            <Select
              value={sortBy}
              onValueChange={(value: 'name' | 'viewCount') => setSortBy(value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="viewCount">View Count</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Active Search */}
        {searchTerm && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: "{searchTerm}"
              <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-red-500">
                ×
              </button>
            </Badge>
          </div>
        )}
      </div>

      {/* Terms Grid */}
      {termsLoading && page === 1 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6"
            >
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedTerms.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
            {sortedTerms.map((term: ITerm) => (
              <TermCard key={term.id} term={term} variant="compact" />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleLoadMore}
                disabled={termsLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {termsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Load More Terms
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No terms found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm
                ? 'Try adjusting your search term or browse other subcategories'
                : "This subcategory doesn't have any terms yet"}
            </p>
            <div className="space-x-2">
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Clear search
                </Button>
              )}
              <Link href="/subcategories">
                <Button variant="outline">Browse Subcategories</Button>
              </Link>
              {categoryInfo && (
                <Link href={`/category/${categoryInfo.id}`}>
                  <Button variant="outline">View Category</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Related Navigation */}
      {sortedTerms.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Explore More</h3>
          <div className="flex flex-wrap gap-2">
            <Link href="/subcategories">
              <Button variant="outline" size="sm">
                <FolderOpen className="w-4 h-4 mr-2" />
                All Subcategories
              </Button>
            </Link>
            {categoryInfo && (
              <Link href={`/category/${categoryInfo.id}`}>
                <Button variant="outline" size="sm">
                  <BookOpen className="w-4 h-4 mr-2" />
                  {categoryInfo.name} Category
                </Button>
              </Link>
            )}
            <Link href="/categories">
              <Button variant="outline" size="sm">
                Browse Categories
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
