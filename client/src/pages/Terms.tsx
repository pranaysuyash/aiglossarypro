import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import TermCard from "@/components/TermCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ITerm, ICategory } from "@/interfaces/interfaces";
import { Search, Filter, Grid, List } from "lucide-react";

export default function Terms() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const termsPerPage = 12;

  // Fetch all terms
  const { data: terms, isLoading: termsLoading } = useQuery({
    queryKey: ["/api/terms"],
    refetchOnWindowFocus: false,
  });

  // Fetch categories for filter
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    refetchOnWindowFocus: false,
  });

  // Filter terms based on search and category
  const filteredTerms = (terms as ITerm[] || []).filter((term) => {
    const matchesSearch = term.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         term.definition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || 
                           term.subcategories?.some(sub => sub.category?.id === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTerms.length / termsPerPage);
  const startIndex = (currentPage - 1) * termsPerPage;
  const paginatedTerms = filteredTerms.slice(startIndex, startIndex + termsPerPage);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">All Terms</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              All Terms
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Browse our comprehensive collection of AI/ML terms and concepts
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search terms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Category Filter */}
          <div className="md:w-64">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {(categories as ICategory[] || []).map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Clear Filters */}
          {(searchTerm || selectedCategory) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
        
        {/* Results count */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredTerms.length} of {(terms as ITerm[] || []).length} terms
          </p>
          
          {/* Active filters */}
          <div className="flex items-center gap-2">
            {searchTerm && (
              <Badge variant="secondary">
                Search: "{searchTerm}"
              </Badge>
            )}
            {selectedCategory && (
              <Badge variant="secondary">
                Category: {(categories as ICategory[] || []).find(c => c.id === selectedCategory)?.name}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Terms Grid/List */}
      {termsLoading ? (
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
      ) : filteredTerms.length > 0 ? (
        <>
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
            : "space-y-4 mb-8"
          }>
            {paginatedTerms.map((term) => (
              <TermCard
                key={term.id}
                term={term}
                isFavorite={false}
                viewMode={viewMode}
              />
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No terms found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Try adjusting your search criteria or filters
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
                setCurrentPage(1);
              }}
            >
              Clear all filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}