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

export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [useAISearch, setUseAISearch] = useState(false);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search query
  const debouncedSearch = debounce((value: string) => {
    setSearchQuery(value);
  }, 300);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  // Regular search results
  const { data: searchResults } = useQuery({
    queryKey: ['/api/search', searchQuery],
    enabled: searchQuery.length > 1 && !useAISearch,
  });

  // AI search results
  const { data: aiSearchResults } = useQuery({
    queryKey: ['/api/ai/semantic-search', searchQuery],
    queryFn: async () => {
      const response = await fetch(`/api/ai/semantic-search?q=${encodeURIComponent(searchQuery)}&limit=8`);
      if (!response.ok) throw new Error('AI search failed');
      const result = await response.json();
      return result.success ? result.data.matches : [];
    },
    enabled: searchQuery.length > 1 && useAISearch,
  });

  const currentResults = useAISearch ? aiSearchResults : searchResults;

  const handleSelectTerm = (termId: string) => {
    setOpen(false);
    navigate(`/term/${termId}`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <Input
              ref={inputRef}
              type="text"
              placeholder={useAISearch ? "AI-powered semantic search..." : "Search terms, definitions..."}
              className={`w-full pl-10 ${useAISearch ? 'pr-20' : 'pr-10'}`}
              onClick={() => setOpen(true)}
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
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery("");
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
                value={searchQuery} 
                onValueChange={setSearchQuery}
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
