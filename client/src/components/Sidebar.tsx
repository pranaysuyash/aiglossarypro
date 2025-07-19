import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Folder,
  FolderOpen,
  Home,
  TrendingUp,
  HelpCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import type {
  ICategory,
  ISubcategory,
  IUserProgress,
} from '@/interfaces/interfaces';

export default function Sidebar() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();


  // Fetch categories from API
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories?limit=100'],
    refetchOnWindowFocus: false,
  });

  // Fetch some subcategories to show in navigation
  const { data: subcategoriesData, isLoading: subcategoriesLoading } = useQuery({
    queryKey: ['/api/subcategories?limit=50'],
    refetchOnWindowFocus: false,
  });

  const categories = (categoriesData as any)?.data || [];
  const topSubcategories = ((subcategoriesData as any)?.data || []).slice(0, 10);

  // Expanded categories state
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Fetch user progress if authenticated
  const { data: userProgress } = useQuery<IUserProgress>({
    queryKey: ['/api/user/progress'],
    enabled: isAuthenticated,
  });

  // Render skeleton loader while loading
  const renderCategorySkeleton = () => (
    <div className="space-y-1">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="px-3 py-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
          {i % 2 === 0 && (
            <div className="ml-4 space-y-1 mt-2">
              <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded animate-pulse w-4/5"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <aside className="hidden md:block md:w-64 lg:w-72 shrink-0">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sticky top-24 space-y-4">
        {/* Quick Navigation */}
        <div>
          <h2 className="font-medium text-lg mb-3" id="quick-access-heading">
            Quick Access
          </h2>
          <nav className="space-y-1" aria-labelledby="quick-access-heading">
            <Link href="/app">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start min-h-[40px] text-left"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
            <Link href="/categories">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start min-h-[40px] text-left"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                All Categories
              </Button>
            </Link>
            <Link href="/subcategories">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start min-h-[40px] text-left"
              >
                <Folder className="w-4 h-4 mr-2" />
                All Subcategories
              </Button>
            </Link>
            <Link href="/terms">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start min-h-[40px] text-left"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Terms
              </Button>
            </Link>
            <Link href="/trending">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start min-h-[40px] text-left"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Trending
              </Button>
            </Link>
            <Link href="/support">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start min-h-[40px] text-left"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Support
              </Button>
            </Link>
          </nav>
        </div>

        <hr className="dark:border-gray-700" />

        {/* Categories Navigation */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-700 dark:text-gray-300" id="categories-heading">
              Categories
            </h3>
            <Link href="/categories">
              <Button variant="ghost" size="sm" className="text-xs">
                View All
              </Button>
            </Link>
          </div>

          <nav aria-labelledby="categories-heading">
            {categoriesLoading ? (
              renderCategorySkeleton()
            ) : (
              <ul className="space-y-1">
                {Array.isArray(categories) && categories.length > 0 ? (
                  categories.slice(0, 5).map((category: ICategory) => (
                    <li key={category.id}>
                      <div
                        className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => toggleCategory(category.id)}
                      >
                        <Link href={`/category/${category.id}`} className="flex-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                            {category.name}
                          </span>
                        </Link>
                        {(category as any).subcategoryCount > 0 &&
                          (expandedCategories[category.id] ? (
                            <ChevronUp className="h-3 w-3 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-3 w-3 text-gray-500" />
                          ))}
                      </div>

                    {expandedCategories[category.id] && (
                      <div className="ml-4 mt-1 space-y-1">
                        <Link href={`/categories/${category.id}/subcategories`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs min-h-[36px] text-left"
                          >
                            <Folder className="w-3 h-3 mr-2" />
                            View Subcategories
                          </Button>
                        </Link>
                      </div>
                    )}
                  </li>
                ))
                ) : (
                  <div className="px-3 py-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No categories available</p>
                  </div>
                )}
              </ul>
            )}
          </nav>
        </div>

        {topSubcategories.length > 0 && (
          <>
            <hr className="dark:border-gray-700" />

            {/* Popular Subcategories */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3
                  className="font-medium text-gray-700 dark:text-gray-300"
                  id="popular-topics-heading"
                >
                  Popular Topics
                </h3>
                <Link href="/subcategories">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View All
                  </Button>
                </Link>
              </div>

              <nav className="space-y-1" aria-labelledby="popular-topics-heading">
                {topSubcategories.map((subcategory: ISubcategory) => (
                  <Link key={subcategory.id} href={`/subcategories/${subcategory.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs min-h-[36px] text-left"
                    >
                      <Folder className="w-3 h-3 mr-2" />
                      <span className="truncate">{subcategory.name}</span>
                    </Button>
                  </Link>
                ))}
              </nav>
            </div>
          </>
        )}

        <hr className="dark:border-gray-700" />

        {isAuthenticated && userProgress ? (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700 dark:text-gray-300" id="progress-heading">
              Your Progress
            </h3>
            <div className="space-y-2" aria-labelledby="progress-heading">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400" id="terms-learned-label">
                    Terms learned
                  </span>
                  <span
                    className="text-gray-800 dark:text-gray-200 font-medium"
                    id="terms-learned-count"
                  >
                    {userProgress?.termsLearned || 0}/{userProgress?.totalTerms || 0}
                  </span>
                </div>
                <Progress
                  value={
                    userProgress ? (userProgress.termsLearned / userProgress.totalTerms) * 100 : 0
                  }
                  className="h-2"
                  aria-labelledby="terms-learned-label"
                  aria-describedby="terms-learned-count"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400" id="daily-streak-label">
                    Daily streak
                  </span>
                  <span
                    className="text-gray-800 dark:text-gray-200 font-medium"
                    id="daily-streak-count"
                    aria-labelledby="daily-streak-label"
                  >
                    {userProgress?.streak || 0} days
                  </span>
                </div>
                <div
                  className="flex space-x-1"
                  role="img"
                  aria-label="Activity chart showing learning activity for the past week"
                >
                  {userProgress?.lastWeekActivity?.map((activity: number, i: number) => (
                    <div
                      key={i}
                      className="w-full bg-accent rounded"
                      style={{
                        height: activity ? `${Math.min(Math.max(activity, 2), 6) * 4}px` : '8px',
                        backgroundColor: activity ? undefined : '',
                        opacity: activity ? 1 : 0.2,
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Sign in to track your learning progress
            </p>
            <button
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm min-h-[36px]"
              onClick={() => navigate('/login')}
              aria-label="Sign in to track your learning progress"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
