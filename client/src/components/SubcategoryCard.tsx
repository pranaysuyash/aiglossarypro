import { ArrowRight, BookOpen, Folder } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { ISubcategory } from '@/interfaces/interfaces';

interface SubcategoryCardProps {
  subcategory: ISubcategory;
  categoryName?: string;
  showCategoryName?: boolean;
  variant?: 'default' | 'compact';
}

const SubcategoryCard = memo(
  function SubcategoryCard({
    subcategory,
    categoryName,
    showCategoryName = false,
    variant = 'default',
  }: SubcategoryCardProps) {
    const displayTermCount = useMemo(() => subcategory.termCount ?? 0, [subcategory.termCount]);

    // Generate color based on subcategory name hash for consistent coloring
    const colorClass = useMemo(() => {
      const hash = subcategory.name.split('').reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);

      const colors = [
        'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
        'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
        'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
        'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300',
        'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
        'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300',
        'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300',
        'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300',
      ];

      return colors[Math.abs(hash) % colors.length];
    }, [subcategory.name]);

    // Memoize click handler
    const handleClick = useCallback(() => {
      window.location.href = `/subcategories/${subcategory.id}`;
    }, [subcategory.id]);

    if (variant === 'compact') {
      return (
        <div
          onClick={handleClick}
          className="cursor-pointer group"
          data-testid="subcategory-card-compact"
        >
          <Card className="h-full transition-all duration-200 hover:shadow-md border border-gray-100 dark:border-gray-800 hover:border-primary/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <div
                    className={`w-6 h-6 rounded ${colorClass} flex items-center justify-center flex-shrink-0`}
                  >
                    <Folder className="w-3 h-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">
                      {subcategory.name}
                    </h3>
                    {showCategoryName && categoryName && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {categoryName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {displayTermCount}
                  </Badge>
                  <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-primary transition-colors" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div onClick={handleClick} className="cursor-pointer group" data-testid="subcategory-card">
        <Card className="h-full transition-all duration-200 hover:shadow-lg border border-gray-100 dark:border-gray-800 hover:border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div
                className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}
              >
                <Folder className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors leading-tight">
                  {subcategory.name}
                </h3>

                {showCategoryName && categoryName && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">in {categoryName}</p>
                )}

                {subcategory.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                    {subcategory.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {displayTermCount} {displayTermCount === 1 ? 'term' : 'terms'}
                    </span>
                  </div>

                  <Link
                    href={`/subcategories/${subcategory.id}`}
                    className="text-sm text-primary hover:text-primary-dark font-medium flex items-center space-x-1 group-hover:translate-x-1 transition-transform"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>View Terms</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for performance optimization
    return (
      prevProps.subcategory.id === nextProps.subcategory.id &&
      prevProps.subcategory.name === nextProps.subcategory.name &&
      prevProps.subcategory.termCount === nextProps.subcategory.termCount &&
      prevProps.categoryName === nextProps.categoryName &&
      prevProps.showCategoryName === nextProps.showCategoryName &&
      prevProps.variant === nextProps.variant
    );
  }
);

export default SubcategoryCard;
