import { useQuery } from '@tanstack/react-query';
import { Lightbulb, Loader2, Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../hooks/use-toast';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface TermSuggestion {
  term: string;
  shortDefinition: string;
  category: string;
  reason: string;
}

interface AITermSuggestionsProps {
  onSuggestionSelect?: (suggestion: TermSuggestion) => void;
  focusCategory?: string;
  className?: string | undefined;
}

export function AITermSuggestions({
  onSuggestionSelect,
  focusCategory = '',
  className = '',
}: AITermSuggestionsProps) {
  const [selectedCategory, setSelectedCategory] = useState(focusCategory);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<TermSuggestion[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const { toast } = useToast();

  // Fetch available categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) {throw new Error('Failed to fetch categories');}
      return response.json();
    },
  });

  const generateSuggestions = async () => {
    setIsGenerating(true);
    setHasGenerated(true);

    try {
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      params.append('limit', '6');

      const response = await fetch(`/api/ai/term-suggestions?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate suggestions');
      }

      const result = await response.json();

      if (result.success) {
        setSuggestions(result.data.suggestions || []);
        toast({
          title: 'Success',
          description: `Generated ${result.data.suggestions?.length || 0} term suggestions!`,
        });
      } else {
        throw new Error(result.error || 'Failed to generate suggestions');
      }
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error?.message : 'Failed to generate suggestions',
        variant: 'destructive',
      });
      setSuggestions([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestionSelect = (suggestion: TermSuggestion) => {
    onSuggestionSelect?.(suggestion);
    toast({
      title: 'Suggestion Selected',
      description: `Selected "${suggestion.term}" for further processing.`,
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Term Suggestions
          </CardTitle>
          <CardDescription>
            Get AI-powered suggestions for important terms to add to your glossary
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Focus Category (Optional)</label>
              <Select
                value={selectedCategory || 'all'}
                onValueChange={value => setSelectedCategory(value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name} ({cat.termCount} terms)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generateSuggestions} disabled={isGenerating} className="flex-shrink-0">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : hasGenerated ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </>
              ) : (
                <>
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Generate Suggestions
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasGenerated && !isGenerating && suggestions.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No suggestions generated.</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting the category filter or try again.
            </p>
          </CardContent>
        </Card>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Suggested Terms {selectedCategory && `for ${selectedCategory}`}
            </h3>
            <Badge variant="secondary">
              {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {suggestions.map((suggestion, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{suggestion.term}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {suggestion.category}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className="flex-shrink-0 ml-2"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Select
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">{suggestion.shortDefinition}</p>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-md">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Why this term matters: </span>
                        {suggestion.reason}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="text-center py-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Want to see more suggestions?</p>
              <Button variant="outline" onClick={generateSuggestions} disabled={isGenerating}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate New Suggestions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
