import React, { useState, useEffect, useCallback } from 'react';
import { RelationshipGraph } from './RelationshipGraph';
import { DynamicFilterPanel, DynamicFilter } from './DynamicFilterPanel';
import { AISemanticSearch } from '../AISemanticSearch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';
import {
  Network,
  Search,
  Filter,
  Sparkles,
  Info,
  ChevronRight,
  Loader2,
  Map,
  GitBranch
} from 'lucide-react';

interface ConceptDiscoveryProps {
  initialTermId?: string;
  className?: string;
}

interface GraphData {
  nodes: any[];
  links: any[];
  categories: string[];
  subcategories: string[];
}

const DEFAULT_FILTERS: DynamicFilter = {
  relationshipTypes: ['prerequisite', 'related', 'extends', 'alternative'],
  relationshipStrength: [3, 10],
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
  edgeStyle: 'curved'
};

export function ConceptDiscovery({ 
  initialTermId,
  className = "" 
}: ConceptDiscoveryProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [selectedTermId, setSelectedTermId] = useState<string | null>(initialTermId || null);
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
    categories: [],
    subcategories: []
  });
  const [filters, setFilters] = useState<DynamicFilter>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'graph' | 'search' | 'map'>('graph');
  const [filterStats, setFilterStats] = useState({
    totalNodes: 0,
    totalRelationships: 0,
    filteredNodes: 0,
    filteredRelationships: 0
  });

  // Fetch relationship data
  const fetchRelationshipData = useCallback(async (termId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/terms/${termId}/relationships?depth=${filters.depth}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch relationships');
      }

      const data = await response.json();
      
      if (data.success) {
        setGraphData({
          nodes: data.data.nodes || [],
          links: data.data.relationships || [],
          categories: data.data.categories || [],
          subcategories: data.data.subcategories || []
        });
        
        // Update stats
        setFilterStats({
          totalNodes: data.data.nodes?.length || 0,
          totalRelationships: data.data.relationships?.length || 0,
          filteredNodes: data.data.nodes?.length || 0,
          filteredRelationships: data.data.relationships?.length || 0
        });
      }
    } catch (error) {
      console.error('Error fetching relationships:', error);
      toast({
        title: "Error",
        description: "Failed to load relationship data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters.depth, toast]);

  // Fetch initial data if term ID is provided
  useEffect(() => {
    if (selectedTermId) {
      fetchRelationshipData(selectedTermId);
    }
  }, [selectedTermId, fetchRelationshipData]);

  // Handle node click in graph
  const handleNodeClick = (node: any) => {
    if (node.type === 'term') {
      setSelectedTermId(node.id);
      // Optionally navigate to term detail
      // setLocation(`/term/${node.id}`);
    }
  };

  // Handle search result selection
  const handleSearchResultClick = (termId: string) => {
    setSelectedTermId(termId);
    setActiveTab('graph');
  };

  // Apply filters and update stats
  useEffect(() => {
    if (!graphData.nodes.length) return;

    // Apply filters to calculate new stats
    const filteredLinks = graphData.links.filter(link => 
      filters.relationshipTypes.includes(link.type) &&
      link.strength >= filters.relationshipStrength[0] &&
      link.strength <= filters.relationshipStrength[1]
    );

    const connectedNodeIds = new Set<string>();
    filteredLinks.forEach(link => {
      connectedNodeIds.add(link.source);
      connectedNodeIds.add(link.target);
    });

    const filteredNodes = graphData.nodes.filter(node => {
      // Apply node type filter
      if (!filters.nodeTypes.includes(node.type)) return false;
      
      // Apply category filter
      if (filters.categories.length > 0 && node.category) {
        if (!filters.categories.includes(node.category)) return false;
      }
      
      // Apply search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!node.name.toLowerCase().includes(query)) return false;
      }
      
      // Apply connection filter
      if (!filters.showOrphans && !connectedNodeIds.has(node.id) && node.id !== selectedTermId) {
        return false;
      }
      
      return true;
    });

    setFilterStats({
      totalNodes: graphData.nodes.length,
      totalRelationships: graphData.links.length,
      filteredNodes: filteredNodes.length,
      filteredRelationships: filteredLinks.length
    });
  }, [filters, graphData, selectedTermId]);

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <Network className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-600 mb-2">
        No Term Selected
      </h3>
      <p className="text-gray-500 mb-6">
        Search for a term or select one from the glossary to explore its relationships
      </p>
      <Button
        variant="outline"
        onClick={() => setActiveTab('search')}
      >
        <Search className="h-4 w-4 mr-2" />
        Search Terms
      </Button>
    </div>
  );

  const renderConceptMap = () => (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Concept map shows a hierarchical view of all AI/ML concepts organized by category and learning paths.
        </AlertDescription>
      </Alert>
      
      {/* Placeholder for future concept map implementation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {graphData.categories.map(category => (
          <Card key={category} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {graphData.nodes
                  .filter(node => node.category === category && node.type === 'term')
                  .slice(0, 5)
                  .map(node => (
                    <div
                      key={node.id}
                      className="flex items-center justify-between cursor-pointer hover:text-blue-600"
                      onClick={() => {
                        setSelectedTermId(node.id);
                        setActiveTab('graph');
                      }}
                    >
                      <span className="text-sm">{node.name}</span>
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  ))}
              </div>
              {graphData.nodes.filter(node => node.category === category).length > 5 && (
                <p className="text-xs text-gray-500 mt-2">
                  +{graphData.nodes.filter(node => node.category === category).length - 5} more
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="h-6 w-6" />
            Concept Discovery
          </h1>
          <p className="text-gray-500">
            Explore relationships between AI/ML concepts through interactive visualization
          </p>
        </div>
        {selectedTermId && (
          <Button
            variant="outline"
            asChild
          >
            <Link href={`/term/${selectedTermId}`}>
              View Term Details
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filter Panel */}
        <div className="lg:col-span-1">
          <DynamicFilterPanel
            filters={filters}
            onFilterChange={setFilters}
            availableCategories={graphData.categories}
            availableSubcategories={graphData.subcategories}
            currentStats={filterStats}
            className="sticky top-4"
          />
        </div>

        {/* Visualization Area */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="graph" className="flex items-center gap-2">
                <Network className="h-4 w-4" />
                Relationship Graph
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Semantic Search
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                Concept Map
              </TabsTrigger>
            </TabsList>

            <TabsContent value="graph" className="mt-4">
              {isLoading ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </CardContent>
                </Card>
              ) : selectedTermId && graphData.nodes.length > 0 ? (
                <RelationshipGraph
                  centralNodeId={selectedTermId}
                  nodes={graphData.nodes}
                  links={graphData.links}
                  onNodeClick={handleNodeClick}
                  selectedFilters={{
                    relationshipTypes: filters.relationshipTypes,
                    nodeTypes: filters.nodeTypes,
                    minStrength: filters.relationshipStrength[0]
                  }}
                />
              ) : (
                <Card>
                  <CardContent className="py-12">
                    {renderEmptyState()}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="search" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI-Powered Semantic Search
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AISemanticSearch
                    placeholder="Search for concepts using natural language..."
                    onResultClick={handleSearchResultClick}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="map" className="mt-4">
              {renderConceptMap()}
            </TabsContent>
          </Tabs>

          {/* Insights Panel */}
          {selectedTermId && filterStats.filteredNodes > 0 && (
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Discovery Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Connected Terms</p>
                    <p className="text-2xl font-semibold">{filterStats.filteredNodes - 1}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Relationships</p>
                    <p className="text-2xl font-semibold">{filterStats.filteredRelationships}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Categories</p>
                    <p className="text-2xl font-semibold">
                      {new Set(graphData.nodes.map(n => n.category)).size}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Depth</p>
                    <p className="text-2xl font-semibold">{filters.depth} levels</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}