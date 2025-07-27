/**
 * Enhanced 3D Knowledge Graph Component
 * Real-time interactive 3D visualization with live data integration
 */

import { Filter, Layers, Maximize2, Search, ZoomIn, ZoomOut } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from '../../hooks/use-toast';
import { type GraphEdge, type GraphNode, graphDataService } from '../../services/graphDataService';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Skeleton } from '../ui/skeleton';
import { Slider } from '../ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import ThreeDKnowledgeGraph from './3DKnowledgeGraph';

interface Enhanced3DKnowledgeGraphProps {
  initialTermId?: string;
  className?: string | undefined;
  onTermSelect?: (termId: string) => void;
}

const Enhanced3DKnowledgeGraph: React.FC<Enhanced3DKnowledgeGraphProps> = ({
  initialTermId,
  className = '',
  onTermSelect,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [depth, setDepth] = useState([2]);
  const [layoutAlgorithm, setLayoutAlgorithm] = useState<
    'force-directed' | 'hierarchical' | 'circular'
  >('force-directed');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [minComplexity, setMinComplexity] = useState([1]);
  const [minPopularity, setMinPopularity] = useState([0]);
  const [showStats, setShowStats] = useState(true);

  // Load graph data
  const loadGraphData = useCallback(
    async (termId?: string, searchDepth?: number) => {
      try {
        setLoading(true);
        setError(null);

        let graphData;

        if (termId) {
          // Load specific term relationships
          const apiData = await graphDataService.fetchTermRelationships(
            termId,
            searchDepth || depth[0],
            true
          );

          graphData = graphDataService.transformToGraphFormat(apiData, {
            algorithm: layoutAlgorithm,
            dimensions: { width: 20, height: 20, depth: 20 },
          });
        } else {
          // Load popular terms for initial view
          const popularTermIds = await fetchPopularTermIds();
          const apiData = await graphDataService.fetchBulkRelationships(
            popularTermIds,
            searchDepth || depth[0]
          );

          graphData = graphDataService.transformToGraphFormat(apiData, {
            algorithm: layoutAlgorithm,
            dimensions: { width: 25, height: 25, depth: 25 },
          });
        }

        setNodes(graphData.nodes);
        setEdges(graphData.edges);

        // Update URL params
        if (termId) {
          setSearchParams({ termId, depth: String(searchDepth || depth[0]) });
        }
      } catch (err) {
        console.error('Error loading graph data:', err);
        setError('Failed to load graph data. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to load graph data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [depth, layoutAlgorithm, setSearchParams]
  );

  // Fetch popular term IDs (mock implementation - should call actual API)
  const fetchPopularTermIds = async (): Promise<string[]> => {
    // In a real implementation, this would fetch from /api/terms/popular
    // For now, return empty array to trigger sample data
    return [];
  };

  // Initial load
  useEffect(() => {
    const termId = searchParams.get('termId') || initialTermId;
    const depthParam = searchParams.get('depth');

    if (depthParam) {
      setDepth([parseInt(depthParam)]);
    }

    loadGraphData(termId);
  }, [initialTermId, searchParams, loadGraphData]);

  // Handle node selection
  const handleNodeSelect = useCallback(
    (node: GraphNode) => {
      setSelectedNode(node);

      if (onTermSelect) {
        onTermSelect(node.id);
      }

      // Optionally reload graph centered on selected node
      if (node.id !== searchParams.get('termId')) {
        loadGraphData(node.id, depth[0]);
      }
    },
    [depth, searchParams, loadGraphData, onTermSelect]
  );

  // Search functionality
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {return;}

    const foundNode = nodes.find(node =>
      node.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (foundNode) {
      setSelectedNode(foundNode);
      // Focus camera on node (would need to expose camera controls)
    } else {
      toast({
        title: 'Not found',
        description: `No term matching "${searchQuery}" found in the current graph.`,
      });
    }
  }, [searchQuery, nodes]);

  // Filter nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      if (filterCategory !== 'all' && node.category !== filterCategory) {return false;}
      if (node.complexity < minComplexity[0]) {return false;}
      if (node.popularity < minPopularity[0]) {return false;}
      return true;
    });
  }, [nodes, filterCategory, minComplexity, minPopularity]);

  // Filter edges
  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    return edges.filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target));
  }, [edges, filteredNodes]);

  // Get categories
  const categories = useMemo(() => {
    const cats = new Set(nodes.map(n => n.category));
    return Array.from(cats).sort();
  }, [nodes]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (nodes.length === 0) {return null;}

    const avgComplexity = nodes.reduce((sum, n) => sum + n.complexity, 0) / nodes.length;
    const avgPopularity = nodes.reduce((sum, n) => sum + n.popularity, 0) / nodes.length;
    const coreNodes = nodes.filter(n => n.isCore).length;
    const totalConnections = edges.length;

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      avgComplexity: avgComplexity.toFixed(1),
      avgPopularity: avgPopularity.toFixed(0),
      coreNodes,
      avgConnections: (totalConnections / nodes.length).toFixed(1),
    };
  }, [nodes, edges]);

  // Loading state
  if (loading && nodes.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Controls Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex gap-2 flex-1 min-w-64">
              <Input
                placeholder="Search terms in graph..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Layout Algorithm */}
            <Select value={layoutAlgorithm} onValueChange={(v: any) => setLayoutAlgorithm(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="force-directed">Force Directed</SelectItem>
                <SelectItem value="hierarchical">Hierarchical</SelectItem>
                <SelectItem value="circular">Circular</SelectItem>
              </SelectContent>
            </Select>

            {/* Depth Control */}
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Depth:</span>
              <Badge variant="secondary">{depth[0]}</Badge>
              <Slider
                value={depth}
                onValueChange={setDepth}
                min={1}
                max={4}
                step={1}
                className="w-20"
              />
            </div>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadGraphData(searchParams.get('termId') || undefined)}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* 3D Graph */}
        <div className="xl:col-span-3">
          <ThreeDKnowledgeGraph
            initialNodes={filteredNodes}
            initialEdges={filteredEdges}
            onNodeSelect={handleNodeSelect}
            className="h-[600px]"
          />
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Filter */}
              <div>
                <label className="text-xs font-medium mb-1 block">Category</label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Complexity Filter */}
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Min Complexity: {minComplexity[0]}
                </label>
                <Slider
                  value={minComplexity}
                  onValueChange={setMinComplexity}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>

              {/* Popularity Filter */}
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Min Popularity: {minPopularity[0]}%
                </label>
                <Slider
                  value={minPopularity}
                  onValueChange={setMinPopularity}
                  min={0}
                  max={100}
                  step={10}
                />
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          {showStats && stats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Graph Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Total Nodes:</span>
                    <Badge variant="outline">{stats.totalNodes}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Edges:</span>
                    <Badge variant="outline">{stats.totalEdges}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Core Concepts:</span>
                    <Badge variant="outline">{stats.coreNodes}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Complexity:</span>
                    <Badge variant="outline">{stats.avgComplexity}/10</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Popularity:</span>
                    <Badge variant="outline">{stats.avgPopularity}%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Connections:</span>
                    <Badge variant="outline">{stats.avgConnections}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected Node Details */}
          {selectedNode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Selected Term</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">{selectedNode.name}</h4>
                    <p className="text-xs text-gray-600">{selectedNode.category}</p>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Complexity:</span>
                      <Badge variant={selectedNode.complexity > 7 ? 'destructive' : 'default'}>
                        {selectedNode.complexity}/10
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Popularity:</span>
                      <Badge variant="secondary">{selectedNode.popularity}%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Connections:</span>
                      <Badge variant="outline">{selectedNode.connections.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <Badge variant={selectedNode.isCore ? 'default' : 'secondary'}>
                        {selectedNode.isCore ? 'Core Concept' : 'Regular'}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => (window.location.href = `/terms/${selectedNode.id}`)}
                  >
                    View Full Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Enhanced3DKnowledgeGraph;
