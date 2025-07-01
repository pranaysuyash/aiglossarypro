import { useState, useEffect, useRef, memo, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { Search, X, Brain, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
  iconOnly?: boolean;
}

interface SearchSuggestion {
  id: string;
  name: string;
  category?: string;
  type: 'term' | 'category';
}

const SearchBar = memo(function SearchBar({ 
  onSearch, 
  placeholder = "Search AI/ML terms...", 
  className,
  initialValue = "",
  iconOnly = false
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [debouncedQuery, setDebouncedQuery] = useState(initialValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [useAISearch, setUseAISearch] = useState(false);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const listboxId = useMemo(() => "search-suggestions-listbox", []);

  // Debounce the query to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch suggestions when debounced query changes
  const { data: suggestions = [], isLoading } = useQuery<SearchSuggestion[]>({
    queryKey: [`/api/search/suggestions?q=${debouncedQuery}&limit=8`],
    enabled: debouncedQuery.length >= 2,
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  });

  useEffect(() => {
    setShowSuggestions(debouncedQuery.length >= 2 && Array.isArray(suggestions) && suggestions.length > 0);
    setSelectedIndex(-1);
  }, [suggestions, debouncedQuery]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < (suggestions?.length || 0) - 1 ? prev + 1 : -1
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > -1 ? prev - 1 : (suggestions?.length || 0) - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions && suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex]);

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  }, [query, onSearch]);

  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    if (suggestion.type === 'term') {
      navigate(`/term/${suggestion.id}`);
    } else if (suggestion.type === 'category') {
      setQuery(suggestion.name);
      onSearch(suggestion.name);
    }
    setShowSuggestions(false);
    setSelectedIndex(-1);
  }, [navigate, onSearch]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, []);

  const handleFocus = useCallback(() => {
    if (query.length >= 2 && Array.isArray(suggestions) && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [query.length, suggestions]);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) {
        setShowSuggestions(false);
      }
    }, 150);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSuggestions(prev => !prev);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // For icon-only mode on ultra-small screens
  if (iconOnly) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          // Focus the input in mobile search or open mobile search
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }}
        className="p-2 h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Search AI/ML terms"
      >
        <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </Button>
    );
  }

  return (
    <div id="search" className={cn("relative w-full max-w-md", className)}>
      <div className="relative">
        <Search 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" 
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="pl-10 pr-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          aria-label="Search AI/ML terms and definitions"
          aria-expanded={showSuggestions}
          aria-haspopup="listbox"
          aria-controls={showSuggestions ? listboxId : undefined}
          aria-activedescendant={
            selectedIndex >= 0 && suggestions?.[selectedIndex] 
              ? `suggestion-${suggestions[selectedIndex].type}-${suggestions[selectedIndex].id}`
              : undefined
          }
          role="combobox"
          autoComplete="off"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Clear search query"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          id={listboxId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-64 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-3 text-center text-gray-500" role="status" aria-live="polite">
              <div 
                className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary mx-auto"
                aria-hidden="true"
              ></div>
              <span className="sr-only">Loading search suggestions...</span>
            </div>
          ) : (
            Array.isArray(suggestions) && suggestions.map((suggestion: SearchSuggestion, index: number) => (
              <button
                key={`${suggestion.type}-${suggestion.id}`}
                id={`suggestion-${suggestion.type}-${suggestion.id}`}
                role="option"
                aria-selected={selectedIndex === index}
                onClick={() => handleSuggestionSelect(suggestion)}
                className={cn(
                  "w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700",
                  selectedIndex === index && "bg-gray-50 dark:bg-gray-700"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {suggestion.name}
                    </div>
                    {suggestion.category && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        in {suggestion.category}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {suggestion.type === 'term' ? (
                      <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded">
                        Term
                      </span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded">
                        Category
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* AI Search Toggle */}
      <div className="mt-2 flex items-center justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setUseAISearch(!useAISearch)}
          className="flex items-center gap-1 text-xs"
          aria-pressed={useAISearch}
          aria-label={`${useAISearch ? 'Disable' : 'Enable'} AI-powered semantic search`}
        >
          {useAISearch ? (
            <>
              <Brain className="h-3 w-3 text-blue-500" />
              <span>AI Search On</span>
            </>
          ) : (
            <>
              <Zap className="h-3 w-3" />
              <span>Enable AI Search</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
});

export default SearchBar;