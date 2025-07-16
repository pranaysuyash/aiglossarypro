import { Brain, ExternalLink, Loader2, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useToast } from '../hooks/use-toast';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';

interface SemanticSearchResult {
  termId: string;
  relevanceScore: number;
  explanation: string;
  term: {
    id: string;
    name: string;
    shortDefinition: string;
    definition: string;
    category: string;
  };
}

interface AISemanticSearchProps {
  placeholder?: string;
  onResultClick?: (termId: string) => void;
  className?: string | undefined;
}

export function AISemanticSearch({
  placeholder = 'Search with AI-powered semantic understanding...',
  onResultClick,
  className = '',
}: AISemanticSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {return;}

      setIsSearching(true);
      setHasSearched(true);

      try {
        const response = await fetch(
          `/api/ai/semantic-search?q=${encodeURIComponent(searchQuery)}&limit=8`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Search failed');
        }

        const result = await response.json();

        if (result.success) {
          setResults(result.data.matches || []);
        } else {
          throw new Error(result.error || 'Search failed');
        }
      } catch (error: any) {
        console.error('Semantic search error:', error);
        toast({
          title: 'Search Error',
          description:
            error instanceof Error ? error?.message : 'Failed to perform semantic search',
          variant: 'destructive',
        });
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [toast]
  );

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  const handleResultClick = (termId: string) => {
    onResultClick?.(termId);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) {return 'bg-green-100 text-green-800';}
    if (score >= 0.6) {return 'bg-yellow-100 text-yellow-800';}
    return 'bg-gray-100 text-gray-800';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) {return 'High Relevance';}
    if (score >= 0.6) {return 'Medium Relevance';}
    return 'Low Relevance';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <Brain className="h-4 w-4 text-blue-500" />
          )}
        </div>
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-10 pr-4"
          disabled={isSearching}
        />
        {query && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Badge variant="secondary" className="text-xs">
              AI Semantic
            </Badge>
          </div>
        )}
      </div>

      {hasSearched && !isSearching && (
        <div className="text-sm text-gray-500">
          {results.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p>No semantically related terms found.</p>
              <p className="text-xs mt-1">Try different keywords or concepts.</p>
            </div>
          ) : (
            <p>
              Found {results.length} semantically related term{results.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {results.map(result => (
          <Card key={result.termId} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/term/${result.termId}`}
                      className="font-semibold text-blue-600 hover:text-blue-800"
                      onClick={() => handleResultClick(result.termId)}
                    >
                      {result.term.name}
                    </Link>
                    <ExternalLink className="h-3 w-3 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {result.term.shortDefinition ||
                      `${result.term.definition.substring(0, 120)}...`}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {result.term.category}
                    </Badge>
                    <Badge className={`text-xs ${getScoreColor(result.relevanceScore)}`}>
                      {getScoreLabel(result.relevanceScore)} (
                      {Math.round(result.relevanceScore * 100)}%)
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">AI Relevance: </span>
                  {result.explanation}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {query && !hasSearched && !isSearching && (
        <div className="text-center py-4">
          <Button onClick={() => performSearch(query)} variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Search Semantically
          </Button>
        </div>
      )}
    </div>
  );
}
