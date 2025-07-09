import {
  Brain,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Search,
  Sliders,
  SortAsc,
  SortDesc,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { IAdvancedSearchProps, ISearchFilters } from '@/interfaces/interfaces';

export default function AdvancedSearch({
  onSearch,
  initialFilters = {},
  availableFilters,
}: IAdvancedSearchProps) {
  const [filters, setFilters] = useState<ISearchFilters>(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['categories']));
  const [useAISearch, setUseAISearch] = useState(false);

  useEffect(() => {
    // Trigger search when filters change (debounced)
    const timeoutId = setTimeout(() => {
      onSearch(filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, onSearch]);

  const updateFilter = (key: keyof ISearchFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateArrayFilter = (key: keyof ISearchFilters, value: string, checked: boolean) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = checked
      ? [...currentArray, value]
      : currentArray.filter((item) => item !== value);

    updateFilter(key, newArray.length > 0 ? newArray : undefined);
  };

  const clearFilters = () => {
    setFilters({ query: filters.query }); // Keep only the search query
  };

  const getActiveFilterCount = () => {
    const activeFilters = Object.entries(filters).filter(([key, value]) => {
      if (key === 'query') return false;
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== '';
    });
    return activeFilters.length;
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const renderCheckboxGroup = (
    title: string,
    items: string[],
    filterKey: keyof ISearchFilters,
    sectionKey: string
  ) => {
    const selectedItems = (filters[filterKey] as string[]) || [];
    const isExpanded = expandedSections.has(sectionKey);

    return (
      <Collapsible open={isExpanded} onOpenChange={() => toggleSection(sectionKey)}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">{title}</span>
            {selectedItems.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {selectedItems.length}
              </Badge>
            )}
          </div>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pl-4 pr-2 pb-2 space-y-2 max-h-48 overflow-y-auto">
            {items.map((item) => (
              <div key={item} className="flex items-center space-x-2">
                <Checkbox
                  id={`${filterKey}-${item}`}
                  checked={selectedItems.includes(item)}
                  onCheckedChange={(checked) =>
                    updateArrayFilter(filterKey, item, checked as boolean)
                  }
                />
                <Label htmlFor={`${filterKey}-${item}`} className="text-sm cursor-pointer flex-1">
                  {item}
                </Label>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const renderFeatureToggles = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="has-implementation" className="text-sm">
          Has Implementation
        </Label>
        <Switch
          id="has-implementation"
          checked={filters.hasImplementation || false}
          onCheckedChange={(checked) => updateFilter('hasImplementation', checked || undefined)}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="has-interactive" className="text-sm">
          Interactive Elements
        </Label>
        <Switch
          id="has-interactive"
          checked={filters.hasInteractiveElements || false}
          onCheckedChange={(checked) =>
            updateFilter('hasInteractiveElements', checked || undefined)
          }
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="has-case-studies" className="text-sm">
          Case Studies
        </Label>
        <Switch
          id="has-case-studies"
          checked={filters.hasCaseStudies || false}
          onCheckedChange={(checked) => updateFilter('hasCaseStudies', checked || undefined)}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="has-code" className="text-sm">
          Code Examples
        </Label>
        <Switch
          id="has-code"
          checked={filters.hasCodeExamples || false}
          onCheckedChange={(checked) => updateFilter('hasCodeExamples', checked || undefined)}
        />
      </div>
    </div>
  );

  const renderSortingControls = () => (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Sort By</Label>
        <Select
          value={filters.sortBy || 'relevance'}
          onValueChange={(value) => updateFilter('sortBy', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="updated">Last Updated</SelectItem>
            <SelectItem value="popularity">Popularity</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant={filters.sortOrder === 'asc' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => updateFilter('sortOrder', 'asc')}
        >
          <SortAsc className="h-4 w-4 mr-1" />
          Ascending
        </Button>
        <Button
          variant={filters.sortOrder === 'desc' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => updateFilter('sortOrder', 'desc')}
        >
          <SortDesc className="h-4 w-4 mr-1" />
          Descending
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Advanced Search</span>
            {useAISearch && (
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              >
                <Brain className="h-3 w-3 mr-1" />
                AI
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUseAISearch(!useAISearch)}
              className="flex items-center space-x-1"
            >
              <Brain className="h-4 w-4" />
              <span className="text-xs">AI Search</span>
            </Button>
            {getActiveFilterCount() > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="flex items-center space-x-1"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="text-xs">Clear</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-1"
            >
              <Sliders className="h-4 w-4" />
              <span className="text-xs">{isExpanded ? 'Simple' : 'Advanced'}</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={
              useAISearch ? 'AI-powered semantic search...' : 'Search terms, definitions...'
            }
            value={filters.query || ''}
            onChange={(e) => updateFilter('query', e.target.value)}
            className="pl-10"
          />
          {useAISearch && (
            <Brain className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
          )}
        </div>

        {/* Active Filters */}
        {getActiveFilterCount() > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              if (key === 'query' || !value) return null;

              if (Array.isArray(value) && value.length > 0) {
                return value.map((item) => (
                  <Badge key={`${key}-${item}`} variant="secondary" className="text-xs">
                    {item}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={() => updateArrayFilter(key as keyof ISearchFilters, item, false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ));
              }

              if (typeof value === 'boolean' && value) {
                return (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={() => updateFilter(key as keyof ISearchFilters, undefined)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              }

              return null;
            })}
          </div>
        )}

        {/* Advanced Filters */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent className="space-y-4">
            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Categories */}
              <div className="space-y-3">
                {renderCheckboxGroup(
                  'Categories',
                  availableFilters.categories,
                  'categories',
                  'categories'
                )}
              </div>

              {/* Subcategories */}
              <div className="space-y-3">
                {renderCheckboxGroup(
                  'Subcategories',
                  availableFilters.subcategories,
                  'subcategories',
                  'subcategories'
                )}
              </div>

              {/* Application Domains */}
              <div className="space-y-3">
                {renderCheckboxGroup(
                  'Application Domains',
                  availableFilters.applicationDomains,
                  'applicationDomains',
                  'applicationDomains'
                )}
              </div>

              {/* Techniques */}
              <div className="space-y-3">
                {renderCheckboxGroup(
                  'Techniques',
                  availableFilters.techniques,
                  'techniques',
                  'techniques'
                )}
              </div>

              {/* Difficulty Levels */}
              <div className="space-y-3">
                {renderCheckboxGroup(
                  'Difficulty Level',
                  ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
                  'difficultyLevels',
                  'difficultyLevels'
                )}
              </div>

              {/* Feature Toggles */}
              <div className="space-y-3">
                <div className="font-medium text-sm mb-3">Features</div>
                {renderFeatureToggles()}
              </div>
            </div>

            <Separator />

            {/* Sorting Controls */}
            <div className="max-w-md">{renderSortingControls()}</div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
