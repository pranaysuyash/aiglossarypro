/**
 * 3D Knowledge Graph Component
 * Interactive 3D visualization of AI/ML concepts and their relationships using Three.js
 */

import { Html, OrbitControls, Text } from '@react-three/drei';
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { Info, Network, Pause, Play, RotateCcw, Settings } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';

// Extend Three.js for custom materials
extend({ THREE });

interface GraphNode {
  id: string;
  name: string;
  category: string;
  position: [number, number, number];
  connections: string[];
  complexity: number; // 1-10 scale
  popularity: number; // view count normalized
  isCore: boolean;
  color: string;
  size: number;
}

interface GraphEdge {
  source: string;
  target: string;
  strength: number; // 0-1 connection strength
  type: 'prerequisite' | 'related' | 'advanced' | 'application';
}

interface ThreeDKnowledgeGraphProps {
  className?: string | undefined;
  onNodeSelect?: (node: GraphNode) => void;
  initialNodes?: GraphNode[];
  initialEdges?: GraphEdge[];
}

// Node Component
function Node({
  node,
  isSelected,
  isHighlighted,
  onHover,
  onClick,
}: {
  node: GraphNode;
  isSelected: boolean;
  isHighlighted: boolean;
  onHover: (node: GraphNode | null) => void;
  onClick: (node: GraphNode) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(state => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = node.position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;

      // Rotation based on node type
      if (node.isCore) {
        meshRef.current.rotation.y += 0.01;
      }

      // Scale based on interaction
      const targetScale = isSelected ? 1.5 : hovered ? 1.2 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  const nodeColor = useMemo(() => {
    if (isSelected) {return '#3b82f6';} // Blue for selected
    if (isHighlighted) {return '#10b981';} // Green for highlighted
    if (hovered) {return '#f59e0b';} // Yellow for hovered
    return node.color;
  }, [isSelected, isHighlighted, hovered, node.color]);

  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        onClick={() => onClick(node)}
        onPointerOver={() => {
          setHovered(true);
          onHover(node);
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover(null);
        }}
      >
        {node.isCore ? (
          <icosahedronGeometry args={[node.size]} />
        ) : (
          <sphereGeometry args={[node.size]} />
        )}
        <meshStandardMaterial
          color={nodeColor}
          transparent
          opacity={0.8}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Node label */}
      <Text
        position={[0, node.size + 0.5, 0]}
        fontSize={0.3}
        color={isSelected ? '#3b82f6' : '#374151'}
        anchorX="center"
        anchorY="middle"
        maxWidth={2}
      >
        {node.name}
      </Text>

      {/* Complexity indicator */}
      {node.complexity > 7 && (
        <mesh position={[node.size + 0.2, node.size + 0.2, 0]}>
          <sphereGeometry args={[0.1]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      )}

      {/* Info popup on hover */}
      {hovered && (
        <Html distanceFactor={10}>
          <div className="bg-white p-2 rounded shadow-lg border text-xs max-w-48">
            <div className="font-semibold">{node.name}</div>
            <div className="text-gray-600">Category: {node.category}</div>
            <div className="text-gray-600">Complexity: {node.complexity}/10</div>
            <div className="text-gray-600">Popularity: {Math.round(node.popularity)}%</div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Connection Line Component
function ConnectionLine({
  start,
  end,
  strength,
  type,
  isActive,
}: {
  start: [number, number, number];
  end: [number, number, number];
  strength: number;
  type: string;
  isActive: boolean;
}) {
  const lineRef = useRef<THREE.Line>(null);

  const points = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(
        (start[0] + end[0]) / 2,
        Math.max(start[1], end[1]) + 1,
        (start[2] + end[2]) / 2
      ),
      new THREE.Vector3(...end)
    );
    return curve.getPoints(50);
  }, [start, end]);

  const lineColor = useMemo(() => {
    const colors = {
      prerequisite: '#ef4444', // Red
      related: '#10b981', // Green
      advanced: '#3b82f6', // Blue
      application: '#f59e0b', // Yellow
    };
    return colors[type as keyof typeof colors] || '#6b7280';
  }, [type]);

  useFrame(() => {
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      material.opacity = isActive ? strength * 0.8 : strength * 0.3;
    }
  });

  return (
    <line ref={lineRef as any}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={lineColor} transparent linewidth={strength * 3} />
    </line>
  );
}

// Main 3D Scene Component
function Scene({
  nodes,
  edges,
  selectedNode,
  highlightedNodes,
  onNodeSelect,
  showConnections,
  animationSpeed,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNode: GraphNode | null;
  highlightedNodes: Set<string>;
  onNodeSelect: (node: GraphNode) => void;
  showConnections: boolean;
  animationSpeed: number;
}) {
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const { camera } = useThree();

  // Auto-rotate camera
  useFrame(state => {
    if (animationSpeed > 0) {
      camera.position.x = Math.cos(state.clock.elapsedTime * animationSpeed * 0.1) * 15;
      camera.position.z = Math.sin(state.clock.elapsedTime * animationSpeed * 0.1) * 15;
      camera.lookAt(0, 0, 0);
    }
  });

  const activeConnections = useMemo(() => {
    if (!showConnections) {return [];}

    if (selectedNode) {
      return edges.filter(
        edge => edge.source === selectedNode.id || edge.target === selectedNode.id
      );
    }

    if (hoveredNode) {
      return edges.filter(edge => edge.source === hoveredNode.id || edge.target === hoveredNode.id);
    }

    return edges;
  }, [edges, selectedNode, hoveredNode, showConnections]);

  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      {/* Nodes */}
      {nodes.map(node => (
        <Node
          key={node.id}
          node={node}
          isSelected={selectedNode?.id === node.id}
          isHighlighted={highlightedNodes.has(node.id)}
          onHover={setHoveredNode}
          onClick={onNodeSelect}
        />
      ))}

      {/* Connections */}
      {activeConnections.map(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        if (!sourceNode || !targetNode) {return null;}

        return (
          <ConnectionLine
            key={`${edge.source}-${edge.target}`}
            start={sourceNode.position}
            end={targetNode.position}
            strength={edge.strength}
            type={edge.type}
            isActive={
              selectedNode?.id === edge.source ||
              selectedNode?.id === edge.target ||
              hoveredNode?.id === edge.source ||
              hoveredNode?.id === edge.target
            }
          />
        );
      })}

      {/* Controls */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={5}
        maxDistance={50}
      />
    </>
  );
}

// Main Component
const ThreeDKnowledgeGraph: React.FC<ThreeDKnowledgeGraphProps> = ({
  className = '',
  onNodeSelect,
  initialNodes = [],
  initialEdges = [],
}) => {
  const [nodes, setNodes] = useState<GraphNode[]>(initialNodes);
  const [edges, setEdges] = useState<GraphEdge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [showConnections, setShowConnections] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState([1]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [filterByCategory, setFilterByCategory] = useState<string[]>([]);
  const [focusedNodeIndex, setFocusedNodeIndex] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Generate sample nodes if none provided
  useEffect(() => {
    if (initialNodes.length === 0) {
      generateSampleGraph();
    }
  }, [initialNodes]);

  const generateSampleGraph = () => {
    const _categories = [
      { name: 'Machine Learning', color: '#3b82f6' },
      { name: 'Deep Learning', color: '#10b981' },
      { name: 'Natural Language Processing', color: '#f59e0b' },
      { name: 'Computer Vision', color: '#ef4444' },
      { name: 'Reinforcement Learning', color: '#8b5cf6' },
    ];

    const sampleNodes: GraphNode[] = [
      // Core concepts
      {
        id: '1',
        name: 'Artificial Intelligence',
        category: 'Machine Learning',
        position: [0, 0, 0],
        connections: ['2', '3', '4'],
        complexity: 3,
        popularity: 95,
        isCore: true,
        color: '#3b82f6',
        size: 1,
      },
      {
        id: '2',
        name: 'Machine Learning',
        category: 'Machine Learning',
        position: [-3, 2, 1],
        connections: ['1', '5', '6'],
        complexity: 5,
        popularity: 90,
        isCore: true,
        color: '#3b82f6',
        size: 0.8,
      },
      {
        id: '3',
        name: 'Deep Learning',
        category: 'Deep Learning',
        position: [3, 2, -1],
        connections: ['1', '7', '8'],
        complexity: 7,
        popularity: 85,
        isCore: true,
        color: '#10b981',
        size: 0.8,
      },

      // ML subconcepts
      {
        id: '5',
        name: 'Supervised Learning',
        category: 'Machine Learning',
        position: [-5, 1, 2],
        connections: ['2', '9'],
        complexity: 4,
        popularity: 80,
        isCore: false,
        color: '#3b82f6',
        size: 0.6,
      },
      {
        id: '6',
        name: 'Unsupervised Learning',
        category: 'Machine Learning',
        position: [-5, 3, 0],
        connections: ['2', '10'],
        complexity: 5,
        popularity: 70,
        isCore: false,
        color: '#3b82f6',
        size: 0.6,
      },

      // DL subconcepts
      {
        id: '7',
        name: 'Neural Networks',
        category: 'Deep Learning',
        position: [1, 4, -2],
        connections: ['3', '11'],
        complexity: 6,
        popularity: 85,
        isCore: false,
        color: '#10b981',
        size: 0.6,
      },
      {
        id: '8',
        name: 'Transformers',
        category: 'Deep Learning',
        position: [5, 1, -3],
        connections: ['3', '12'],
        complexity: 9,
        popularity: 75,
        isCore: false,
        color: '#10b981',
        size: 0.6,
      },

      // Applications
      {
        id: '9',
        name: 'Classification',
        category: 'Machine Learning',
        position: [-7, -1, 3],
        connections: ['5'],
        complexity: 3,
        popularity: 85,
        isCore: false,
        color: '#f59e0b',
        size: 0.5,
      },
      {
        id: '10',
        name: 'Clustering',
        category: 'Machine Learning',
        position: [-7, 5, -1],
        connections: ['6'],
        complexity: 4,
        popularity: 65,
        isCore: false,
        color: '#f59e0b',
        size: 0.5,
      },
      {
        id: '11',
        name: 'Backpropagation',
        category: 'Deep Learning',
        position: [0, 6, -4],
        connections: ['7'],
        complexity: 8,
        popularity: 60,
        isCore: false,
        color: '#ef4444',
        size: 0.5,
      },
      {
        id: '12',
        name: 'Attention Mechanism',
        category: 'Deep Learning',
        position: [7, -1, -5],
        connections: ['8'],
        complexity: 9,
        popularity: 70,
        isCore: false,
        color: '#ef4444',
        size: 0.5,
      },
    ];

    const sampleEdges: GraphEdge[] = [
      { source: '1', target: '2', strength: 0.9, type: 'prerequisite' },
      { source: '1', target: '3', strength: 0.8, type: 'advanced' },
      { source: '2', target: '5', strength: 0.7, type: 'related' },
      { source: '2', target: '6', strength: 0.7, type: 'related' },
      { source: '3', target: '7', strength: 0.8, type: 'prerequisite' },
      { source: '3', target: '8', strength: 0.9, type: 'advanced' },
      { source: '5', target: '9', strength: 0.6, type: 'application' },
      { source: '6', target: '10', strength: 0.6, type: 'application' },
      { source: '7', target: '11', strength: 0.7, type: 'related' },
      { source: '8', target: '12', strength: 0.9, type: 'prerequisite' },
    ];

    setNodes(sampleNodes);
    setEdges(sampleEdges);
  };

  const handleNodeSelect = useCallback(
    (node: GraphNode) => {
      setSelectedNode(node);

      // Highlight connected nodes
      const connectedIds = new Set(node.connections);
      setHighlightedNodes(connectedIds);

      if (onNodeSelect) {
        onNodeSelect(node);
      }
    },
    [onNodeSelect]
  );

  const resetView = () => {
    setSelectedNode(null);
    setHighlightedNodes(new Set());
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!canvasRef.current?.contains(document.activeElement)) {return;}

      const visibleNodes = filteredNodes;
      if (visibleNodes.length === 0) {return;}

      switch (event.key) {
        case 'ArrowRight':
        case 'd':
        case 'D':
          event.preventDefault();
          setFocusedNodeIndex(prev => (prev + 1) % visibleNodes.length);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          event.preventDefault();
          setFocusedNodeIndex(prev => (prev - 1 + visibleNodes.length) % visibleNodes.length);
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          event.preventDefault();
          // Navigate to connected nodes
          if (selectedNode) {
            const connectedNodes = visibleNodes.filter(node =>
              selectedNode.connections.includes(node.id)
            );
            if (connectedNodes.length > 0) {
              setFocusedNodeIndex(visibleNodes.indexOf(connectedNodes[0]));
            }
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          event.preventDefault();
          // Navigate to parent nodes (nodes that connect to current)
          if (selectedNode) {
            const parentNodes = visibleNodes.filter(node =>
              node.connections.includes(selectedNode.id)
            );
            if (parentNodes.length > 0) {
              setFocusedNodeIndex(visibleNodes.indexOf(parentNodes[0]));
            }
          }
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (visibleNodes[focusedNodeIndex]) {
            handleNodeSelect(visibleNodes[focusedNodeIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          resetView();
          break;
        case '?':
          event.preventDefault();
          // Show keyboard shortcuts help
          alert(`Keyboard Shortcuts:
→ / D: Next node
← / A: Previous node  
↑ / W: Connected node
↓ / S: Parent node
Enter/Space: Select node
Escape: Reset view
?: Show this help`);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedNodeIndex, selectedNode, handleNodeSelect, resetView]);

  // Update selected node when focus changes
  useEffect(() => {
    if (filteredNodes[focusedNodeIndex] && filteredNodes[focusedNodeIndex] !== selectedNode) {
      const focusedNode = filteredNodes[focusedNodeIndex];
      setHighlightedNodes(new Set([focusedNode.id]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedNodeIndex, selectedNode]);

  const filteredNodes = useMemo(() => {
    if (filterByCategory.length === 0) {return nodes;}
    return nodes.filter(node => filterByCategory.includes(node.category));
  }, [nodes, filterByCategory]);

  const categories = useMemo(() => {
    return [...new Set(nodes.map(node => node.category))];
  }, [nodes]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center">
            <Network className="h-5 w-5 mr-2 text-blue-600" />
            3D Knowledge Graph
          </h3>
          <p className="text-sm text-gray-600">
            Interactive 3D visualization of AI/ML concept relationships
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowControls(!showControls)}
            aria-label={`${showControls ? 'Hide' : 'Show'} control panel`}
            aria-expanded={showControls}
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetView}
            aria-label="Reset view and clear selection"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 3D Canvas */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <div
                ref={canvasRef}
                className="h-96 w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden"
                role="application"
                aria-label="3D Knowledge Graph - Interactive visualization of AI/ML concepts. Use arrow keys or WASD to navigate, Enter/Space to select, Escape to reset, ? for help"
                aria-describedby="graph-instructions"
                onFocus={() => {
                  // Ensure focused node is visible when canvas gets focus
                  if (filteredNodes[focusedNodeIndex]) {
                    setHighlightedNodes(new Set([filteredNodes[focusedNodeIndex].id]));
                  }
                }}
              >
                <div id="graph-instructions" className="sr-only">
                  Use keyboard navigation: Arrow keys or WASD to move between nodes, Enter or Space
                  to select a node, Escape to reset view, Question mark for help.{' '}
                  {selectedNode ? `Currently selected: ${selectedNode.name}` : 'No node selected'}
                  {filteredNodes[focusedNodeIndex]
                    ? `, Currently focused: ${filteredNodes[focusedNodeIndex].name}`
                    : ''}
                </div>
                <Canvas
                  camera={{ position: [0, 0, 15], fov: 75 }}
                  style={{ width: '100%', height: '100%' }}
                >
                  <Scene
                    nodes={filteredNodes}
                    edges={edges}
                    selectedNode={selectedNode}
                    highlightedNodes={highlightedNodes}
                    onNodeSelect={handleNodeSelect}
                    showConnections={showConnections}
                    animationSpeed={isPlaying ? animationSpeed[0] : 0}
                  />
                </Canvas>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls Panel */}
        {showControls && (
          <div className="lg:col-span-1 space-y-4">
            {/* Animation Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Animation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                    aria-label={`${isPlaying ? 'Pause' : 'Play'} camera animation`}
                    aria-pressed={isPlaying}
                  >
                    {isPlaying ? (
                      <Pause className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <Play className="h-3 w-3" aria-hidden="true" />
                    )}
                  </Button>
                  <span className="text-xs text-gray-600" aria-live="polite">
                    {isPlaying ? 'Playing' : 'Paused'}
                  </span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="animation-speed" className="text-xs">
                    Speed: {animationSpeed[0]}x
                  </Label>
                  <Slider
                    id="animation-speed"
                    value={animationSpeed}
                    onValueChange={setAnimationSpeed}
                    max={3}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                    aria-label="Animation speed control"
                    aria-valuemin={0.1}
                    aria-valuemax={3}
                    aria-valuenow={animationSpeed[0]}
                    aria-valuetext={`${animationSpeed[0]}x speed`}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Display Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Display</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-connections"
                    checked={showConnections}
                    onCheckedChange={checked => setShowConnections(!!checked)}
                  />
                  <Label htmlFor="show-connections" className="text-xs">
                    Show connections
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Category Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map(category => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={filterByCategory.includes(category)}
                      onCheckedChange={checked => {
                        if (checked) {
                          setFilterByCategory([...filterByCategory, category]);
                        } else {
                          setFilterByCategory(filterByCategory.filter(c => c !== category));
                        }
                      }}
                    />
                    <Label htmlFor={`category-${category}`} className="text-xs">
                      {category}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Node Info */}
            {selectedNode && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Info className="h-4 w-4 mr-1" />
                    Node Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <div className="font-medium text-sm">{selectedNode.name}</div>
                    <div className="text-xs text-gray-600">{selectedNode.category}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Complexity:</span>
                      <Badge variant="outline">{selectedNode.complexity}/10</Badge>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Popularity:</span>
                      <Badge variant="outline">{Math.round(selectedNode.popularity)}%</Badge>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Type:</span>
                      <Badge variant={selectedNode.isCore ? 'default' : 'secondary'}>
                        {selectedNode.isCore ? 'Core' : 'Concept'}
                      </Badge>
                    </div>
                  </div>

                  {selectedNode.connections.length > 0 && (
                    <div>
                      <div className="text-xs font-medium mb-1">Connected to:</div>
                      <div className="text-xs text-gray-600">
                        {selectedNode.connections.length} concept(s)
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreeDKnowledgeGraph;
