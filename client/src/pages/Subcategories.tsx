import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import SubcategoryCard from "@/components/SubcategoryCard";
import CategoryHierarchy from "@/components/CategoryHierarchy";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ISubcategory, ICategory } from "@/interfaces/interfaces";
import { Search, FolderOpen, Filter, SortAsc, SortDesc, Loader2 } from "lucide-react";

export default function Subcategories() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "termCount">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategory, sortBy, sortOrder]);

  // Fetch categories for filter dropdown
  const { data: categories } = useQuery({
    queryKey: ["/api/categories?limit=500"],
    refetchOnWindowFocus: false,
  });

  // Fetch subcategories with filters
  const { data: subcategoriesData, isLoading: subcategoriesLoading } = useQuery({
    queryKey: [
      "/api/subcategories",
      {
        page,
        limit,
        search: searchTerm || undefined,
        categoryId: selectedCategory !== "all" ? selectedCategory : undefined,
        sort: sortBy,
        order: sortOrder,
      },
    ],
    refetchOnWindowFocus: false,
  });

  const subcategories = (subcategoriesData as any)?.data || [];
  const pagination = (subcategoriesData as any)?.pagination;

  // Create category lookup for showing category names
  const categoryLookup = (categories as ICategory[] || []).reduce((acc, cat) => {
    acc[cat.id] = cat.name;
    return acc;
  }, {} as Record<string, string>);

  // Filter and sort subcategories locally for immediate feedback
  const filteredSubcategories = subcategories.filter((subcategory: ISubcategory) => {
    const matchesSearch = !searchTerm || 
      subcategory.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
      subcategory.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedSubcategories = [...filteredSubcategories].sort((a: ISubcategory, b: ISubcategory) => {
    let comparison = 0;
    if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === "termCount") {
      comparison = (a.termCount || 0) - (b.termCount || 0);
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const breadcrumbItems = [
    { label: "Home", href: "/app" },
    { label: "Subcategories", isCurrentPage: true }
  ];

  const handleLoadMore = () => {
    if (pagination?.hasMore) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="container mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 xs:py-6">
      {/* Breadcrumb */}
      <CategoryHierarchy 
        items={breadcrumbItems}
        className="mb-4"
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Browse Subcategories
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Explore specialized topics within AI/ML categories
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {pagination?.total || sortedSubcategories.length} Subcategories
            </Badge>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search subcategories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {(categories as ICategory[] || []).map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Options */}
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(value: "name" | "termCount") => setSortBy(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="termCount">Term Count</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {(searchTerm || selectedCategory !== "all") && (
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm("")}
                  className="ml-1 hover:text-red-500"
                >
                  ×
                </button>
              </Badge>
            )}
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Category: {categoryLookup[selectedCategory] || selectedCategory}
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="ml-1 hover:text-red-500"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Subcategories Grid */}
      {subcategoriesLoading && page === 1 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <div className="animate-pulse">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedSubcategories.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
            {sortedSubcategories.map((subcategory: ISubcategory) => (
              <SubcategoryCard
                key={subcategory.id}
                subcategory={subcategory}
                categoryName={categoryLookup[subcategory.categoryId]}
                showCategoryName={selectedCategory === "all"}
              />
            ))}
          </div>

          {/* Load More Button */}
          {pagination?.hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleLoadMore}
                disabled={subcategoriesLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {subcategoriesLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Load More Subcategories
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No subcategories found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || selectedCategory !== "all"
                ? "Try adjusting your search criteria"
                : "No subcategories are available at the moment"
              }
            </p>
            {(searchTerm || selectedCategory !== "all") && (
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                >
                  Clear all filters
                </Button>
                <Link href="/categories">
                  <Button variant="outline">
                    Browse Categories
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistics */}
      {!subcategoriesLoading && sortedSubcategories.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {pagination?.total || sortedSubcategories.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Subcategories
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {sortedSubcategories.reduce((sum: number, sub: ISubcategory) => sum + (sub.termCount || 0), 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Terms
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {new Set(sortedSubcategories.map((sub: ISubcategory) => sub.categoryId)).size}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Categories Covered
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {sortedSubcategories.filter((sub: ISubcategory) => (sub.termCount || 0) > 0).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Active Subcategories
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}