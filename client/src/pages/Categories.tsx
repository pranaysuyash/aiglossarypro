import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import CategoryCard from "@/components/CategoryCard";
import TermCard from "@/components/TermCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ICategory, ITerm } from "@/interfaces/interfaces";
import { Search, FolderOpen, ChevronRight } from "lucide-react";

export default function Categories() {
  const { id } = useParams();
  const [searchTerm, setSearchTerm] = useState("");

  // If we have an ID, this is a specific category page
  const isSpecificCategory = Boolean(id);

  // Fetch all categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
    refetchOnWindowFocus: false,
  });

  // Fetch specific category details if this is a category page
  const { data: categoryDetails, isLoading: categoryLoading } = useQuery({
    queryKey: [`/api/categories/${id}`],
    enabled: isSpecificCategory,
    refetchOnWindowFocus: false,
  });

  // Fetch terms for specific category
  const { data: categoryTerms, isLoading: termsLoading } = useQuery({
    queryKey: [`/api/categories/${id}/terms`],
    enabled: isSpecificCategory,
    refetchOnWindowFocus: false,
  });

  // Filter categories based on search
  const filteredCategories = (categories as ICategory[] || []).filter((category) => {
    return category.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Sort categories by term count (descending) and then by name
  const sortedCategories = filteredCategories.sort((a, b) => {
    const countA = a.termCount || 0;
    const countB = b.termCount || 0;
    if (countA !== countB) {
      return countB - countA; // Higher count first
    }
    return a.name.localeCompare(b.name); // Alphabetical for same count
  });

  // If this is a specific category page, show category details and terms
  if (isSpecificCategory) {
    return (
      <div className="container mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 xs:py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/categories" className="hover:text-primary">Categories</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">
            {categoryLoading ? "Loading..." : ((categoryDetails as any)?.name || "Category")}
          </span>
        </div>

        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {categoryLoading ? "Loading Category..." : ((categoryDetails as any)?.name || "Category Not Found")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {categoryLoading ? "Loading description..." : ((categoryDetails as any)?.description || "Explore terms in this category")}
          </p>
          <div className="mt-4">
            <Badge variant="secondary">
              {termsLoading ? "Loading..." : `${(categoryTerms as ITerm[] || []).length} Terms`}
            </Badge>
          </div>
        </div>

        {/* Terms Grid */}
        {termsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
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
        ) : (categoryTerms as ITerm[] || []).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
            {(categoryTerms as ITerm[]).map((term) => (
              <TermCard
                key={term.id}
                term={term}
                variant="compact"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No terms found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This category doesn't have any terms yet.
              </p>
              <Link 
                href="/categories"
                className="text-primary hover:text-primary-dark font-medium"
              >
                Browse all categories
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 xs:py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Categories</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Browse by Category
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Explore AI/ML concepts organized by topic areas
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {filteredCategories.length} Categories
            </Badge>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {searchTerm && (
          <div className="mt-2">
            <Badge variant="secondary">
              Search: "{searchTerm}"
            </Badge>
          </div>
        )}
      </div>

      {/* Categories Grid */}
      {categoriesLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
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
      ) : sortedCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
          {sortedCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No categories found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm 
                ? "Try adjusting your search term"
                : "No categories are available at the moment"
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-primary hover:text-primary-dark font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        </div>
      )}

      {/* Statistics */}
      {!categoriesLoading && sortedCategories.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {sortedCategories.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Categories
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {sortedCategories.reduce((sum, cat) => sum + (cat.termCount || 0), 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Terms
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {sortedCategories.filter(cat => (cat.termCount || 0) > 0).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Active Categories
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {sortedCategories.reduce((sum, cat) => sum + (cat.subcategories?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Subcategories
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}