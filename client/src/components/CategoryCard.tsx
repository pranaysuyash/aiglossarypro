import { memo, useMemo, useCallback } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Lightbulb, MessageSquare, Eye, Smile, Calculator, Folder, BookOpen, ArrowRight } from "lucide-react";
import { ICategory } from "@/interfaces/interfaces";

interface CategoryCardProps {
  category: ICategory;
  termCount?: number;
  subcategoryCount?: number;
  showSubcategoryActions?: boolean;
}

// Map category names to icons
const categoryIcons: Record<string, React.ReactNode> = {
  "Machine Learning Basics": <Brain className="h-6 w-6" />,
  "Deep Learning": <Lightbulb className="h-6 w-6" />,
  "Natural Language Processing": <MessageSquare className="h-6 w-6" />,
  "Computer Vision": <Eye className="h-6 w-6" />,
  "Reinforcement Learning": <Smile className="h-6 w-6" />,
  "Mathematics for ML": <Calculator className="h-6 w-6" />,
};

// Map category names to background colors
const categoryColors: Record<string, string> = {
  "Machine Learning Basics": "bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300",
  "Deep Learning": "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
  "Natural Language Processing": "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
  "Computer Vision": "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
  "Reinforcement Learning": "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300",
  "Mathematics for ML": "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
};

const CategoryCard = memo(function CategoryCard({ 
  category, 
  termCount,
  subcategoryCount,
  showSubcategoryActions = true
}: CategoryCardProps) {
  // Memoize icon rendering
  const icon = useMemo(() => 
    categoryIcons[category.name] || <Brain className="h-6 w-6" />, 
    [category.name]
  );
  
  // Memoize color class calculation
  const colorClass = useMemo(() => 
    categoryColors[category.name] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    [category.name]
  );
  
  const displayTermCount = useMemo(() => 
    termCount ?? category.termCount ?? 0,
    [termCount, category.termCount]
  );

  const displaySubcategoryCount = useMemo(() => 
    subcategoryCount ?? category.subcategories?.length ?? 0,
    [subcategoryCount, category.subcategories?.length]
  );

  // Memoize click handler
  const handleClick = useCallback(() => {
    window.location.href = `/category/${category.id}`;
  }, [category.id]);

  return (
    <Card className="h-full transition-all duration-200 hover:shadow-lg border border-gray-100 dark:border-gray-800 group">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start space-x-3 mb-4">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
            <div className="w-6 h-6 sm:w-7 sm:h-7">
              {icon}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors leading-tight">
              {category.name}
            </h3>
            
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span>{displayTermCount} terms</span>
              </div>
              {displaySubcategoryCount > 0 && (
                <div className="flex items-center gap-1">
                  <Folder className="w-3 h-3" />
                  <span className="hidden sm:inline">{displaySubcategoryCount} subcategories</span>
                  <span className="sm:hidden">{displaySubcategoryCount} sub</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href={`/category/${category.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full justify-center min-h-[40px]">
              <BookOpen className="w-4 h-4 mr-2" />
              View Terms
            </Button>
          </Link>
          
          {showSubcategoryActions && displaySubcategoryCount > 0 && (
            <Link href={`/categories/${category.id}/subcategories`} className="sm:flex-shrink-0">
              <Button variant="ghost" size="sm" className="w-full sm:w-auto flex items-center justify-center gap-1 min-h-[40px]">
                <Folder className="w-4 h-4" />
                <span className="hidden xs:inline">Subcategories</span>
                <span className="xs:hidden">Sub</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for complex props
  return prevProps.category.id === nextProps.category.id &&
         prevProps.category.name === nextProps.category.name &&
         prevProps.termCount === nextProps.termCount &&
         prevProps.subcategoryCount === nextProps.subcategoryCount &&
         prevProps.showSubcategoryActions === nextProps.showSubcategoryActions;
});

export default CategoryCard;
