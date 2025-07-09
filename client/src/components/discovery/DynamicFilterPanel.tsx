import {
  Activity,
  ChevronDown,
  ChevronRight,
  Filter,
  Layers,
  Network,
  RotateCcw,
  Sparkles,
  Target,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

export interface DynamicFilter {
  // Relationship filters
  relationshipTypes: string[];
  relationshipStrength: [number, number]; // min, max

  // Node filters
  nodeTypes: string[];
  categories: string[];
  subcategories: string[];
  difficultyLevels: string[];

  // Content filters
  hasImplementation: boolean | null;
  hasInteractiveElements: boolean | null;
  hasCaseStudies: boolean | null;
  hasCodeExamples: boolean | null;

  // Discovery filters
  searchQuery: string;
  depth: number; // How many levels of relationships to show
  showOrphans: boolean; // Show unconnected nodes

  // Visual filters
  layoutType: 'force' | 'hierarchical' | 'radial' | 'circular';
  nodeSize: 'uniform' | 'by-importance' | 'by-connections';
  edgeStyle: 'straight' | 'curved' | 'bundled';
}

interface DynamicFilterPanelProps {
  filters: DynamicFilter;
  onFilterChange: (filters: DynamicFilter) => void;
  availableCategories: string[];
  availableSubcategories: string[];
  className?: string;

  // Analytics data for showing impact
  currentStats?: {
    totalNodes: number;
    totalRelationships: number;
    filteredNodes: number;
    filteredRelationships: number;
  };
}

const DEFAULT_FILTERS: DynamicFilter = {
  relationshipTypes: ['prerequisite', 'related', 'extends', 'alternative'],
  relationshipStrength: [0, 10],
  nodeTypes: ['term', 'category', 'subcategory'],
  categories: [],
  subcategories: [],
  difficultyLevels: [],
  hasImplementation: null,
  hasInteractiveElements: null,
  hasCaseStudies: null,
  hasCodeExamples: null,
  searchQuery: '',
  depth: 2,
  showOrphans: false,
  layoutType: 'force',
  nodeSize: 'uniform',
  edgeStyle: 'curved',
};

export function DynamicFilterPanel({
  filters = DEFAULT_FILTERS,
  onFilterChange,
  availableCategories,
  availableSubcategories,
  currentStats,
  className = '',
}: DynamicFilterPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['relationships', 'nodes'])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updateFilter = <K extends keyof DynamicFilter>(key: K, value: DynamicFilter[K]) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const updateArrayFilter = (key: keyof DynamicFilter, value: string, checked: boolean) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = checked
      ? [...currentArray, value]
      : currentArray.filter((item) => item !== value);

    updateFilter(key as any, newArray);
  };

  const resetFilters = () => {
    onFilterChange(DEFAULT_FILTERS);
  };

  const getActiveFilterCount = () => {
    let count = 0;

    // Count array filters
    ['categories', 'subcategories', 'difficultyLevels'].forEach((key) => {
      count += (filters[key as keyof DynamicFilter] as string[]).length;
    });

    // Count boolean filters
    ['hasImplementation', 'hasInteractiveElements', 'hasCaseStudies', 'hasCodeExamples'].forEach(
      (key) => {
        if (filters[key as keyof DynamicFilter] !== null) count++;
      }
    );

    // Count other filters
    if (filters.searchQuery) count++;
    if (filters.depth !== DEFAULT_FILTERS.depth) count++;
    if (filters.showOrphans !== DEFAULT_FILTERS.showOrphans) count++;

    return count;
  };

  const renderImpactBadge = () => {
    if (!currentStats) return null;

    const _percentageNodes = Math.round(
      (currentStats.filteredNodes / currentStats.totalNodes) * 100
    );
    const _percentageRelationships = Math.round(
      (currentStats.filteredRelationships / currentStats.totalRelationships) * 100
    );

    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          <Activity className="h-3 w-3 mr-1" />
          {currentStats.filteredNodes}/{currentStats.totalNodes} nodes
        </Badge>
        <Badge variant="outline" className="text-xs">
          <Network className="h-3 w-3 mr-1" />
          {currentStats.filteredRelationships}/{currentStats.totalRelationships} links
        </Badge>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Dynamic Filters
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary">{getActiveFilterCount()}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {renderImpactBadge()}
            {getActiveFilterCount() > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm font-medium">
            Search Terms
          </Label>
          <Input
            id="search"
            placeholder="Filter by term name..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            className="h-9"
          />
        </div>

        {/* Relationship Filters */}
        <Collapsible
          open={expandedSections.has('relationships')}
          onOpenChange={() => toggleSection('relationships')}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              <span className="font-medium text-sm">Relationships</span>
            </div>
            {expandedSections.has('relationships') ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            {/* Relationship Types */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Types</Label>
              <div className="space-y-2">
                {['prerequisite', 'related', 'extends', 'alternative'].map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`rel-${type}`}
                      checked={filters.relationshipTypes.includes(type)}
                      onCheckedChange={(checked) =>
                        updateArrayFilter('relationshipTypes', type, checked as boolean)
                      }
                    />
                    <Label htmlFor={`rel-${type}`} className="text-sm capitalize cursor-pointer">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Relationship Strength */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Strength</Label>
                <span className="text-xs text-gray-500">
                  {filters.relationshipStrength[0]} - {filters.relationshipStrength[1]}
                </span>
              </div>
              <Slider
                value={filters.relationshipStrength}
                onValueChange={(value) =>
                  updateFilter('relationshipStrength', value as [number, number])
                }
                min={0}
                max={10}
                step={1}
                className="py-1"
              />
            </div>

            {/* Depth */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Depth</Label>
                <span className="text-xs text-gray-500">
                  {filters.depth} level{filters.depth !== 1 ? 's' : ''}
                </span>
              </div>
              <Slider
                value={[filters.depth]}
                onValueChange={(value) => updateFilter('depth', value[0])}
                min={1}
                max={4}
                step={1}
                className="py-1"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Node Filters */}
        <Collapsible
          open={expandedSections.has('nodes')}
          onOpenChange={() => toggleSection('nodes')}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="font-medium text-sm">Nodes</span>
            </div>
            {expandedSections.has('nodes') ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            {/* Node Types */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Types</Label>
              <div className="space-y-2">
                {['term', 'category', 'subcategory'].map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`node-${type}`}
                      checked={filters.nodeTypes.includes(type)}
                      onCheckedChange={(checked) =>
                        updateArrayFilter('nodeTypes', type, checked as boolean)
                      }
                    />
                    <Label htmlFor={`node-${type}`} className="text-sm capitalize cursor-pointer">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            {availableCategories.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Categories</Label>
                <ScrollArea className="h-32">
                  <div className="space-y-2 pr-3">
                    {availableCategories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cat-${category}`}
                          checked={filters.categories.includes(category)}
                          onCheckedChange={(checked) =>
                            updateArrayFilter('categories', category, checked as boolean)
                          }
                        />
                        <Label htmlFor={`cat-${category}`} className="text-sm cursor-pointer">
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Difficulty Levels */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Difficulty</Label>
              <div className="space-y-2">
                {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((level) => (
                  <div key={level} className="flex items-center space-x-2">
                    <Checkbox
                      id={`diff-${level}`}
                      checked={filters.difficultyLevels.includes(level)}
                      onCheckedChange={(checked) =>
                        updateArrayFilter('difficultyLevels', level, checked as boolean)
                      }
                    />
                    <Label htmlFor={`diff-${level}`} className="text-sm cursor-pointer">
                      {level}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Content Features */}
        <Collapsible
          open={expandedSections.has('features')}
          onOpenChange={() => toggleSection('features')}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium text-sm">Content Features</span>
            </div>
            {expandedSections.has('features') ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="space-y-3">
              {[
                { key: 'hasImplementation', label: 'Has Implementation' },
                { key: 'hasInteractiveElements', label: 'Interactive Elements' },
                { key: 'hasCaseStudies', label: 'Case Studies' },
                { key: 'hasCodeExamples', label: 'Code Examples' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key} className="text-sm cursor-pointer">
                    {label}
                  </Label>
                  <Switch
                    id={key}
                    checked={filters[key as keyof DynamicFilter] === true}
                    onCheckedChange={(checked) => updateFilter(key as any, checked ? true : null)}
                  />
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Visualization Settings */}
        <Collapsible
          open={expandedSections.has('visualization')}
          onOpenChange={() => toggleSection('visualization')}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="font-medium text-sm">Visualization</span>
            </div>
            {expandedSections.has('visualization') ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            {/* Layout Type */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Layout</Label>
              <Select
                value={filters.layoutType}
                onValueChange={(value: any) => updateFilter('layoutType', value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="force">Force-directed</SelectItem>
                  <SelectItem value="hierarchical">Hierarchical</SelectItem>
                  <SelectItem value="radial">Radial</SelectItem>
                  <SelectItem value="circular">Circular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Node Size */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Node Size</Label>
              <Select
                value={filters.nodeSize}
                onValueChange={(value: any) => updateFilter('nodeSize', value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uniform">Uniform</SelectItem>
                  <SelectItem value="by-importance">By Importance</SelectItem>
                  <SelectItem value="by-connections">By Connections</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Show Orphans */}
            <div className="flex items-center justify-between">
              <Label htmlFor="show-orphans" className="text-sm cursor-pointer">
                Show Unconnected
              </Label>
              <Switch
                id="show-orphans"
                checked={filters.showOrphans}
                onCheckedChange={(checked) => updateFilter('showOrphans', checked)}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
