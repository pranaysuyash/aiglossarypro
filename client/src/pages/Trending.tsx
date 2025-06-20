import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import TermCard from "@/components/TermCard";
import { Badge } from "@/components/ui/badge";
import { ITerm } from "@/interfaces/interfaces";
import { TrendingUp, Calendar, Eye } from "lucide-react";

export default function Trending() {
  // Fetch trending terms (most viewed)
  const { data: trendingTerms, isLoading: trendingLoading } = useQuery({
    queryKey: ["/api/terms/trending"],
    refetchOnWindowFocus: false,
  });

  // Fetch recently added terms
  const { data: recentTerms, isLoading: recentLoading } = useQuery({
    queryKey: ["/api/terms/recent"],
    refetchOnWindowFocus: false,
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Trending</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              Trending Terms
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Discover the most popular and recently added AI/ML concepts
            </p>
          </div>
        </div>
      </div>

      {/* Most Viewed Terms */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Eye className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Most Viewed
          </h2>
          <Badge variant="secondary">
            Popular this week
          </Badge>
        </div>
        
        {trendingLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <div className="animate-pulse">
                  <div className="flex justify-between mb-2">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-5"></div>
                  </div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
                  <div className="space-y-2 mb-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (trendingTerms as ITerm[] || []).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(trendingTerms as ITerm[]).slice(0, 6).map((term, index) => (
              <div key={term.id} className="relative">
                <TermCard
                  term={term}
                  isFavorite={false}
                />
                {/* Trending badge */}
                <div className="absolute -top-2 -right-2">
                  <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
                    #{index + 1}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No trending data available
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start exploring terms to see trending content here
            </p>
          </div>
        )}
      </div>

      {/* Recently Added Terms */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Recently Added
          </h2>
          <Badge variant="secondary">
            New this month
          </Badge>
        </div>
        
        {recentLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
                  <div className="space-y-2 mb-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (recentTerms as ITerm[] || []).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(recentTerms as ITerm[]).slice(0, 6).map((term) => (
              <div key={term.id} className="relative">
                <TermCard
                  term={term}
                  isFavorite={false}
                />
                {/* New badge */}
                <div className="absolute -top-2 -right-2">
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                    NEW
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No recent terms
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              New terms will appear here when they are added
            </p>
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900 dark:to-primary-800 rounded-lg p-8 text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Explore More Terms
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Discover our complete collection of AI/ML terms and concepts
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/terms">
            <button className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors">
              Browse All Terms
            </button>
          </Link>
          <Link href="/categories">
            <button className="bg-white text-primary border border-primary px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Browse Categories
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}