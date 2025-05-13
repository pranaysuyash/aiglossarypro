import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
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

  // Search results
  const { data: searchResults } = useQuery({
    queryKey: ['/api/search', searchQuery],
    enabled: searchQuery.length > 1,
  });

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
              placeholder="Search terms, definitions..."
              className="w-full pl-10"
              onClick={() => setOpen(true)}
              onChange={handleInputChange}
            />
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            {searchQuery && (
              <button 
                onClick={() => {
                  setSearchQuery("");
                  if (inputRef.current) {
                    inputRef.current.value = "";
                  }
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[calc(100vw-2rem)] md:w-[500px]" align="start">
          <Command>
            <CommandInput 
              placeholder="Search terms, definitions..." 
              value={searchQuery} 
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No results found</CommandEmpty>
              {searchResults && (
                <CommandGroup heading="Terms">
                  {searchResults.map((result: any) => (
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
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
