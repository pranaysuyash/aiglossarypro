import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Search, X, Brain, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
}

interface SearchSuggestion {
  id: string;
  name: string;
  category?: string;
  type: 'term' | 'category';
}

export default function SearchBar({ 
  onSearch, 
  placeholder = "Search AI/ML terms...", 
  className,
  initialValue = ""
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [useAISearch, setUseAISearch] = useState(false);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions when query changes
  const { data: suggestions = [], isLoading } = useQuery<SearchSuggestion[]>({
    queryKey: [`/api/search/suggestions?q=${query}&limit=8`],
    enabled: query.length >= 2,
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  });

  useEffect(() => {
    setShowSuggestions(query.length >= 2 && Array.isArray(suggestions) && suggestions.length > 0);
    setSelectedIndex(-1);
  }, [suggestions, query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
  };

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'term') {
      // Navigate to term detail page
      navigate(`/term/${suggestion.id}`);
    } else if (suggestion.type === 'category') {
      // Search for terms in this category
      setQuery(suggestion.name);
      onSearch(suggestion.name);
    }
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const clearSearch = () => {
    setQuery("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    if (query.length >= 2 && Array.isArray(suggestions) && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) {
        setShowSuggestions(false);
      }
    }, 150);
  };

  // Regular search results
  const { data: searchResults } = useQuery({
    queryKey: ['/api/search', query],
    enabled: query.length > 1 && !useAISearch,
  });

  // AI search results
  const { data: aiSearchResults } = useQuery({
    queryKey: ['/api/ai/semantic-search', query],
    queryFn: async () => {
      const response = await fetch(`/api/ai/semantic-search?q=${encodeURIComponent(query)}&limit=8`);
      if (!response.ok) throw new Error('AI search failed');
      const result = await response.json();
      return result.success ? result.data.matches : [];
    },
    enabled: query.length > 1 && useAISearch,
  });

  const currentResults = useAISearch ? aiSearchResults : searchResults;

  const handleSelectTerm = (termId: string) => {
    navigate(`/term/${termId}`);
  };

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

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-64 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-3 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            Array.isArray(suggestions) && suggestions.map((suggestion: SearchSuggestion, index: number) => (
              <button
                key={`${suggestion.type}-${suggestion.id}`}
                onClick={() => handleSuggestionSelect(suggestion)}
                className={cn(
                  "w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0",
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

      <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <Input
              ref={inputRef}
              type="text"
              placeholder={useAISearch ? "AI-powered semantic search..." : "Search terms, definitions..."}
              className={`w-full pl-10 ${useAISearch ? 'pr-20' : 'pr-10'}`}
              onClick={() => setShowSuggestions(true)}
              onChange={handleInputChange}
            />
            {useAISearch ? (
              <Brain className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500" />
            ) : (
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            )}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              {useAISearch && (
                <Badge variant="secondary" className="text-xs">
                  AI
                </Badge>
              )}
              {query && (
                <button 
                  onClick={() => {
                    setQuery("");
                    if (inputRef.current) {
                      inputRef.current.value = "";
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[calc(100vw-2rem)] md:w-[500px]" align="start">
          <Command>
            <div className="flex items-center border-b px-3 py-2">
              <CommandInput 
                placeholder={useAISearch ? "AI-powered semantic search..." : "Search terms, definitions..."} 
                value={query} 
                onValueChange={setQuery}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUseAISearch(!useAISearch)}
                className="ml-2 flex items-center gap-1"
              >
                {useAISearch ? (
                  <>
                    <Brain className="h-4 w-4 text-blue-500" />
                    <span className="text-xs">AI</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    <span className="text-xs">Enable AI</span>
                  </>
                )}
              </Button>
            </div>
            <CommandList>
              <CommandEmpty>No results found</CommandEmpty>
              {currentResults && (
                <CommandGroup heading={useAISearch ? "AI Semantic Results" : "Terms"}>
                  {useAISearch ? (
                    // AI search results
                    currentResults.map((result: any) => (
                      <CommandItem 
                        key={result.termId} 
                        value={result.term.name}
                        onSelect={() => handleSelectTerm(result.termId)}
                      >
                        <div className="flex flex-col w-full">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{result.term.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(result.relevanceScore * 100)}% match
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {result.term.shortDefinition || result.term.definition.substring(0, 80) + '...'}
                          </span>
                          <span className="text-xs text-blue-600 mt-1 italic">
                            {result.explanation}
                          </span>
                        </div>
                      </CommandItem>
                    ))
                  ) : (
                    // Regular search results
                    currentResults.map((result: any) => (
                      <CommandItem 
                        key={result.id} 
                        value={result.name}
                        onSelect={() => handleSelectTerm(result.id)}
                      >
                        <div className="flex flex-col">
                          <span>{result.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {result.shortDefinition}
                          </span>
                        </div>
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
