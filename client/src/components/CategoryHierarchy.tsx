import { BookOpen, ChevronRight, Folder, FolderOpen, Home } from 'lucide-react';
import { memo } from 'react';
import { Link } from 'wouter';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  isCurrentPage?: boolean;
}

interface CategoryHierarchyProps {
  items: BreadcrumbItem[];
  className?: string;
  showIcons?: boolean;
  variant?: 'default' | 'compact';
}

const CategoryHierarchy = memo(function CategoryHierarchy({
  items,
  className = '',
  showIcons = true,
  variant = 'default',
}: CategoryHierarchyProps) {
  // Default icons based on common breadcrumb patterns
  const getDefaultIcon = (index: number, item: BreadcrumbItem) => {
    if (item.icon) return item.icon;

    if (index === 0) return <Home className="w-4 h-4" />;
    if (item.label.toLowerCase().includes('categories')) return <FolderOpen className="w-4 h-4" />;
    if (
      item.label.toLowerCase().includes('subcategories') ||
      item.label.toLowerCase().includes('subcategory')
    )
      return <Folder className="w-4 h-4" />;
    if (item.label.toLowerCase().includes('term')) return <BookOpen className="w-4 h-4" />;

    return <Folder className="w-4 h-4" />;
  };

  if (variant === 'compact') {
    return (
      <nav className={`text-sm ${className}`} aria-label="Breadcrumb">
        <ol className="flex items-center space-x-1">
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && <ChevronRight className="w-3 h-3 text-gray-400 mx-1" />}
              {item.isCurrentPage ? (
                <span className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href || '#'}
                  className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors truncate max-w-[150px]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  }

  return (
    <nav className={`${className}`} aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center space-x-2 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />}

            {item.isCurrentPage ? (
              <div className="flex items-center space-x-2">
                {showIcons && <span className="text-primary">{getDefaultIcon(index, item)}</span>}
                <span className="text-gray-900 dark:text-white font-medium">{item.label}</span>
              </div>
            ) : (
              <Link
                href={item.href || '#'}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors group"
              >
                {showIcons && (
                  <span className="group-hover:text-primary transition-colors">
                    {getDefaultIcon(index, item)}
                  </span>
                )}
                <span className="group-hover:text-primary transition-colors">{item.label}</span>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
});

// Convenience function to create common breadcrumb patterns
export const createCategoryBreadcrumb = (
  categoryName?: string,
  subcategoryName?: string,
  termName?: string,
  categoryId?: string,
  subcategoryId?: string
): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [{ label: 'Home', href: '/app' }];

  if (categoryName) {
    items.push({ label: 'Categories', href: '/categories' });
    items.push({
      label: categoryName,
      href: categoryId ? `/category/${categoryId}` : undefined,
      isCurrentPage: !subcategoryName && !termName,
    });

    if (subcategoryName) {
      items.push({
        label: 'Subcategories',
        href: categoryId ? `/categories/${categoryId}/subcategories` : '/subcategories',
      });
      items.push({
        label: subcategoryName,
        href: subcategoryId ? `/subcategories/${subcategoryId}` : undefined,
        isCurrentPage: !termName,
      });

      if (termName) {
        items.push({
          label: termName,
          isCurrentPage: true,
        });
      }
    }
  } else if (subcategoryName) {
    items.push({ label: 'Subcategories', href: '/subcategories' });
    items.push({
      label: subcategoryName,
      href: subcategoryId ? `/subcategories/${subcategoryId}` : undefined,
      isCurrentPage: !termName,
    });

    if (termName) {
      items.push({
        label: termName,
        isCurrentPage: true,
      });
    }
  }

  return items;
};

export default CategoryHierarchy;
