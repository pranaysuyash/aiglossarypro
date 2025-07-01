import { memo, useMemo, useCallback } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Lightbulb, MessageSquare, Eye, Smile, Calculator } from "lucide-react";
import { ICategory } from "@/interfaces/interfaces";

interface CategoryCardProps {
  category: ICategory;
  termCount?: number;
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

const CategoryCard = memo(function CategoryCard({ category, termCount }: CategoryCardProps) {
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

  // Memoize click handler
  const handleClick = useCallback(() => {
    window.location.href = `/category/${category.id}`;
  }, [category.id]);

  return (
    <div 
      onClick={handleClick}
      className="cursor-pointer"
      data-testid="category-card"
    >
        <Card className="h-full transition-shadow hover:shadow-md border border-gray-100 dark:border-gray-800 min-w-0">
          <CardContent className="p-3 xs:p-4">
            <div className="flex items-start w-full min-w-0">
              <div className={`w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-lg ${colorClass} flex items-center justify-center mr-2 xs:mr-3 flex-shrink-0`}>
                <div className="w-3 h-3 xs:w-4 xs:h-4 sm:w-6 sm:h-6">
                  {icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition truncate text-xs xs:text-sm sm:text-base leading-tight">
                  {category.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 xs:mt-1 truncate">{displayTermCount} terms</p>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for complex props
  return prevProps.category.id === nextProps.category.id &&
         prevProps.category.name === nextProps.category.name &&
         prevProps.termCount === nextProps.termCount;
});

export default CategoryCard;
