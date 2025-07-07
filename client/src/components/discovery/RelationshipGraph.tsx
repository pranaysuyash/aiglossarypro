import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  GitBranch,
  Filter,
  Layers
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GraphNode {
  id: string;
  name: string;
  type: 'term' | 'category' | 'subcategory' | 'concept';
  category?: string;
  definition?: string;
  level?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'prerequisite' | 'related' | 'extends' | 'alternative' | 'belongs_to';
  strength: number;
}

interface RelationshipGraphProps {
  centralNodeId: string;
  nodes: GraphNode[];
  links: GraphLink[];
  onNodeClick?: (node: GraphNode) => void;
  onFilterChange?: (filters: FilterState) => void;
  selectedFilters?: FilterState;
  className?: string;
}

interface FilterState {
  relationshipTypes: string[];
  nodeTypes: string[];
  minStrength: number;
}

const DEFAULT_FILTERS: FilterState = {
  relationshipTypes: ['prerequisite', 'related', 'extends', 'alternative'],
  nodeTypes: ['term', 'category', 'subcategory'],
  minStrength: 3
};

export function RelationshipGraph({
  centralNodeId,
  nodes,
  links,
  onNodeClick,
  onFilterChange,
  selectedFilters = DEFAULT_FILTERS,
  className = ""
}: RelationshipGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const { toast } = useToast();

  // Color schemes for different node types
  const nodeColors = {
    term: '#3B82F6', // blue
    category: '#10B981', // green
    subcategory: '#8B5CF6', // purple
    concept: '#F59E0B' // yellow
  };

  // Color schemes for different link types
  const linkColors = {
    prerequisite: '#EF4444', // red
    related: '#3B82F6', // blue
    extends: '#10B981', // green
    alternative: '#8B5CF6', // purple
    belongs_to: '#6B7280' // gray
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Update dimensions based on container
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ 
          width: width || 800, 
          height: isFullscreen ? window.innerHeight - 100 : (height || 600)
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    // Filter data based on selected filters
    const filteredLinks = links.filter(link => 
      selectedFilters.relationshipTypes.includes(link.type) &&
      link.strength >= selectedFilters.minStrength
    );

    const connectedNodeIds = new Set<string>();
    filteredLinks.forEach(link => {
      connectedNodeIds.add(typeof link.source === 'string' ? link.source : link.source.id);
      connectedNodeIds.add(typeof link.target === 'string' ? link.target : link.target.id);
    });

    const filteredNodes = nodes.filter(node => 
      node.id === centralNodeId || 
      (connectedNodeIds.has(node.id) && selectedFilters.nodeTypes.includes(node.type))
    );

    // Create SVG elements
    const svg = d3.select(svgRef.current);
    const g = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    // Create force simulation
    const simulation = d3.forceSimulation<GraphNode>(filteredNodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(filteredLinks)
        .id(d => d.id)
        .distance(d => 100 / d.strength)
        .strength(d => d.strength / 10))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Add arrow markers for directed links
    const defs = svg.append('defs');
    Object.entries(linkColors).forEach(([type, color]) => {
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 25)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color);
    });

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(filteredLinks)
      .enter()
      .append('line')
      .attr('stroke', d => linkColors[d.type])
      .attr('stroke-opacity', d => 0.3 + (d.strength / 10) * 0.7)
      .attr('stroke-width', d => 1 + d.strength / 5)
      .attr('marker-end', d => `url(#arrow-${d.type})`);

    // Create link labels
    const linkLabel = g.append('g')
      .selectAll('text')
      .data(filteredLinks)
      .enter()
      .append('text')
      .attr('font-size', 10)
      .attr('fill', '#666')
      .attr('text-anchor', 'middle')
      .text(d => d.type);

    // Create nodes
    const node = g.append('g')
      .selectAll('g')
      .data(filteredNodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add circles for nodes
    node.append('circle')
      .attr('r', d => d.id === centralNodeId ? 25 : 20)
      .attr('fill', d => nodeColors[d.type])
      .attr('stroke', d => d.id === centralNodeId ? '#000' : '#fff')
      .attr('stroke-width', d => d.id === centralNodeId ? 3 : 2);

    // Add labels
    node.append('text')
      .attr('dy', 35)
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .attr('font-weight', d => d.id === centralNodeId ? 'bold' : 'normal')
      .text(d => d.name);

    // Add hover effects
    node.on('mouseenter', function(event, d) {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', d.id === centralNodeId ? 30 : 25);
      
      // Highlight connected links
      link.style('stroke-opacity', l => {
        const source = typeof l.source === 'object' ? l.source.id : l.source;
        const target = typeof l.target === 'object' ? l.target.id : l.target;
        return source === d.id || target === d.id ? 0.8 : 0.2;
      });
    })
    .on('mouseleave', function(event, d) {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', d.id === centralNodeId ? 25 : 20);
      
      link.style('stroke-opacity', l => 0.3 + (l.strength / 10) * 0.7);
    })
    .on('click', (event, d) => {
      onNodeClick?.(d);
    });

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);

      linkLabel
        .attr('x', d => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
        .attr('y', d => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      simulation.stop();
    };
  }, [nodes, links, centralNodeId, selectedFilters, dimensions, isFullscreen]);

  const handleZoom = (direction: 'in' | 'out') => {
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>();
    const newScale = direction === 'in' ? zoomLevel * 1.2 : zoomLevel / 1.2;
    
    svg.transition()
      .duration(300)
      .call(zoom.scaleTo, newScale);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Card className={`relative ${isFullscreen ? 'fixed inset-4 z-50' : ''} ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Concept Relationships
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleZoom('out')}
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleZoom('in')}
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={containerRef}
          className={`relative ${isFullscreen ? 'h-[calc(100vh-8rem)]' : 'h-[600px]'}`}
        >
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="w-full h-full"
          />
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg">
            <h4 className="text-sm font-semibold mb-2">Legend</h4>
            <div className="space-y-1">
              {Object.entries(linkColors).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-1" 
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs capitalize">{type.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Current zoom level */}
          <div className="absolute top-4 right-4">
            <Badge variant="secondary">
              {Math.round(zoomLevel * 100)}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}