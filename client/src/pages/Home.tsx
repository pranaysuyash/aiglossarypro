import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'wouter';
import CategoryCard from '@/components/CategoryCard';
import GoogleAd from '@/components/ads/GoogleAd';
import Sidebar from '@/components/Sidebar';
import TermCard from '@/components/TermCard';
import { Button } from '@/components/ui/button';
import { CategoryCardSkeleton, TermCardSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useAdPlacement } from '@/hooks/useAdSense';
import type { ICategory, ITerm } from '@/interfaces/interfaces';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { adSlot: homepageAdSlot, canShowAd: canShowHomepageAd } = useAdPlacement('homepage');

  // Fetch featured categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    refetchOnWindowFocus: false,
  });

  // Fetch featured terms
  const { data: featuredTerms, isLoading: termsLoading } = useQuery({
    queryKey: ['/api/terms/featured'],
    refetchOnWindowFocus: false,
  });

  // Fetch recently viewed terms if authenticated
  const { data: recentlyViewed, isLoading: recentlyViewedLoading } = useQuery({
    queryKey: ['/api/terms/recently-viewed'],
    enabled: isAuthenticated,
  });

  // Fetch favorites for badges
  const { data: favorites } = useQuery({
    queryKey: ['/api/favorites'],
    enabled: isAuthenticated,
  });

  // Optimize favorites map computation with useMemo
  const currentFavoritesMap = useMemo(() => {
    if (!favorites || !Array.isArray(favorites)) return {};
    return (favorites as ITerm[]).reduce((acc: Record<string, boolean>, term: ITerm) => {
      acc[term.id] = true;
      return acc;
    }, {});
  }, [favorites]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <Sidebar />

        <main className="flex-1">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-sm mb-6 p-4 sm:p-6 text-white">
            <h1 className="text-xl sm:text-2xl font-bold mb-2">AI/ML Glossary</h1>
            <p className="max-w-2xl text-sm sm:text-base">
              Your comprehensive dictionary of artificial intelligence, machine learning, and deep
              learning terminology. Browse definitions, learn concepts, and track your progress.
            </p>
            <div className="mt-4 flex flex-col xs:flex-row flex-wrap gap-3">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button
                    variant="secondary"
                    className="bg-white text-primary-600 hover:bg-gray-50"
                  >
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Go to dashboard
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={() => (window.location.href = '/login')}
                  className="bg-white text-primary-600 hover:bg-gray-50"
                >
                  Sign in to track progress
                </Button>
              )}
              <Link href="/trending">
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-primary-600 transition-colors"
                >
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Trending terms
                </Button>
              </Link>
            </div>
          </div>

          {/* Term Categories */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Browse by Category</h2>
              <Link
                href="/categories"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
              >
                View all
              </Link>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {categoriesLoading ? (
                // Skeleton loading for categories
                Array.from({ length: 6 }).map((_, i) => (
                  <CategoryCardSkeleton key={`cat-skeleton-${i}`} />
                ))
              ) : Array.isArray(categories) && categories.length > 0 ? (
                categories
                  .slice(0, 6)
                  .map((category: ICategory) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      termCount={category.termCount || 0}
                    />
                  ))
              ) : (
                <div className="col-span-full text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400">
                    No categories found. Check back later!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Homepage Ad */}
          {canShowHomepageAd && homepageAdSlot && (
            <div className="mb-8">
              <GoogleAd
                slot={homepageAdSlot}
                format="rectangle"
                responsive={true}
                className="flex justify-center"
              />
            </div>
          )}

          {/* Featured Terms */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Featured Terms</h2>
              <Link
                href="/terms"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
              >
                Browse all terms
              </Link>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-fr">
              {termsLoading ? (
                // Skeleton loading for terms
                Array.from({ length: 3 }).map((_, i) => (
                  <TermCardSkeleton key={`term-skeleton-${i}`} />
                ))
              ) : Array.isArray(featuredTerms) && featuredTerms.length > 0 ? (
                featuredTerms.map((term: ITerm) => (
                  <TermCard
                    key={term.id}
                    term={term}
                    isFavorite={isAuthenticated ? !!currentFavoritesMap[term.id] : false}
                  />
                ))
              ) : (
                <div className="col-span-full text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400">
                    No featured terms available at the moment.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recently Viewed - Only show if authenticated */}
          {isAuthenticated && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recently Viewed</h2>
                <Link
                  href="/history"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                >
                  View all history
                </Link>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                {recentlyViewedLoading ? (
                  // Skeleton loading for recently viewed
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={`recent-skeleton-${i}`} className="p-4">
                        <div className="flex justify-between items-center animate-pulse">
                          <div className="space-y-2 flex-1">
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                          </div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : Array.isArray(recentlyViewed) && recentlyViewed.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {recentlyViewed.map((term: ITerm) => (
                      <div
                        key={term.id}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition flex justify-between items-center"
                      >
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200">
                            {term.name}
                          </h4>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Viewed {term.relativeTime || 'recently'}
                          </div>
                        </div>
                        <Link
                          href={`/term/${term.id}`}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                        >
                          View
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      You haven't viewed any terms yet. Start exploring the glossary!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
