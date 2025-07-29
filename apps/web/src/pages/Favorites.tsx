import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Search, SlidersHorizontal, Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import TermCard from '@/components/TermCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import PageBreadcrumb from '@/components/ui/page-breadcrumb';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import type { ICategory, ITerm } from '@/interfaces/interfaces';

export default function Favorites() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'alphabetical' | 'recent' | 'views'>('recent');

  // Fetch user's favorite terms
  const {
    data: favorites,
    isLoading,
    error: favoritesError,
  } = useQuery<ITerm[]>({
    queryKey: ['/api/favorites'],
    enabled: isAuthenticated,
  });

  // Fetch categories for filtering
  const { data: categories, error: categoriesError } = useQuery<ICategory[]>({
    queryKey: ['/api/categories'],
    enabled: isAuthenticated,
  });

  // Apply filters and search
  const filteredFavorites = favorites?.filter((term: ITerm) => {
    const matchesSearch =
      term.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (term.shortDefinition?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = !categoryFilter || term.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Apply sorting
  const sortedFavorites = filteredFavorites ? [...filteredFavorites] : [];
  if (sortOrder === 'alphabetical') {
    sortedFavorites.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortOrder === 'recent') {
    sortedFavorites.sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });
  } else if (sortOrder === 'views') {
    sortedFavorites.sort((a, b) => b.viewCount - a.viewCount);
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">
              Please sign in to view and manage your favorite terms.
            </p>
            <div className="flex justify-center">
              <Button onClick={() => (window.location.href = '/login')}>Sign In</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle errors
  if (favoritesError || categoriesError) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">
              {favoritesError ? 'Failed to load favorites.' : 'Failed to load categories.'}
            </p>
            <div className="flex justify-center">
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <PageBreadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'My Favorites', isCurrentPage: true },
        ]}
        className="mb-6"
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Star className="mr-2 h-6 w-6 text-accent" />
          My Favorites
          {!isLoading && favorites && (
            <span className="ml-2 text-lg font-normal text-gray-500 dark:text-gray-400">
              ({favorites.length})
            </span>
          )}
        </h1>

        <Link href="/dashboard">
          <a className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center">
            Back to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search favorites..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        <div className="flex gap-2">
          <Select
            value={categoryFilter || 'all'}
            onValueChange={value => setCategoryFilter(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories &&
                categories.length > 0 &&
                categories.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Sort</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className={sortOrder === 'recent' ? 'font-medium' : ''}
                onClick={() => setSortOrder('recent')}
              >
                Recently Added
              </DropdownMenuItem>
              <DropdownMenuItem
                className={sortOrder === 'alphabetical' ? 'font-medium' : ''}
                onClick={() => setSortOrder('alphabetical')}
              >
                Alphabetical
              </DropdownMenuItem>
              <DropdownMenuItem
                className={sortOrder === 'views' ? 'font-medium' : ''}
                onClick={() => setSortOrder('views')}
              >
                Most Viewed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Favorites list */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card
              key={`skeleton-${i}`}
              className="h-56 animate-pulse bg-gray-200 dark:bg-gray-700"
            ></Card>
          ))}
        </div>
      ) : sortedFavorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedFavorites.map((term: ITerm) => (
            <TermCard key={term.id} term={term} isFavorite />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          {searchQuery || categoryFilter ? (
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No favorites match your search criteria.
            </p>
          ) : (
            <>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                You haven't favorited any terms yet.
              </p>
              <Link href="/">
                <a className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center">
                  Browse Terms <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Link>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
