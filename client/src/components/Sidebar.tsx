import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { ICategoryWithSubcategories, IUserProgress } from "@/interfaces/interfaces";
import { useAuth } from "@/hooks/useAuth";

export default function Sidebar() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<ICategoryWithSubcategories[]>({
    queryKey: ["/api/categories"],
    refetchOnWindowFocus: false,
  });

  // Expanded categories state
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Fetch user progress if authenticated
  const { data: userProgress } = useQuery<IUserProgress>({
    queryKey: ["/api/user/progress"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <aside className="md:w-64 lg:w-72 shrink-0">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sticky top-24">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="md:w-64 lg:w-72 shrink-0">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sticky top-24">
        <h2 className="font-medium text-lg mb-4">Categories</h2>
        
        {/* Navigation Tree */}
        <nav>
          <ul className="space-y-1">
            {Array.isArray(categories) && categories.map((category: ICategoryWithSubcategories) => (
              <li key={category.id}>
                <div 
                  className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => toggleCategory(category.id)}
                >
                  <span className="font-medium text-gray-700 dark:text-gray-300">{category.name}</span>
                  {expandedCategories[category.id] ? 
                    <ChevronUp className="h-4 w-4 text-gray-500" /> : 
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  }
                </div>
                
                {expandedCategories[category.id] && category.subcategories && (
                  <ul className="ml-4 mt-1 space-y-1">
                    {category.subcategories.map(subcategory => (
                      <li key={subcategory.id}>
                        <Link 
                          href={`/category/${subcategory.id}`}
                          className="block px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-600 dark:text-gray-400"
                        >
                          {subcategory.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
        
        <hr className="my-4 dark:border-gray-700" />
        
        {isAuthenticated && userProgress ? (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Your Progress</h3>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Terms learned</span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    {userProgress?.termsLearned || 0}/{userProgress?.totalTerms || 0}
                  </span>
                </div>
                <Progress 
                  value={userProgress ? (userProgress.termsLearned / userProgress.totalTerms) * 100 : 0} 
                  className="h-2"
                  aria-label={`Learning progress: ${userProgress?.termsLearned || 0} out of ${userProgress?.totalTerms || 0} terms learned`}
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Daily streak</span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{userProgress?.streak || 0} days</span>
                </div>
                <div className="flex space-x-1">
                  {userProgress?.lastWeekActivity?.map((activity: number, i: number) => (
                    <div 
                      key={i}
                      className="w-full bg-accent rounded"
                      style={{ 
                        height: activity ? `${Math.min(Math.max(activity, 2), 6) * 4}px` : '8px',
                        backgroundColor: activity ? undefined : '',
                        opacity: activity ? 1 : 0.2
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
              className="px-4 py-1 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm"
              onClick={() => navigate("/api/login")}
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
