/**
 * 3D Visualization Page
 * Dedicated page for 3D knowledge graph and other interactive visualizations
 */

import {
  ArrowLeft,
  Box,
  Brain,
  Eye,
  Info,
  Lightbulb,
  Map,
  Network,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import ThreeDKnowledgeGraph from '../components/visualization/3DKnowledgeGraph';

interface GraphNode {
  id: string;
  name: string;
  category: string;
  position: [number, number, number];
  connections: string[];
  complexity: number;
  popularity: number;
  isCore: boolean;
  color: string;
  size: number;
}

const ThreeDVisualizationPage: React.FC = () => {
  const [, navigate] = useLocation();
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleNodeSelect = (node: GraphNode) => {
    setSelectedNode(node);
  };

  const handleViewTerm = () => {
    if (selectedNode) {
      navigate(`/term/${selectedNode.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToHome}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>

              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Box className="h-8 w-8 mr-3 text-blue-600" />
                  3D Knowledge Visualization
                </h1>
                <p className="text-gray-600 mt-1">
                  Interactive 3D exploration of AI/ML concepts and their interconnections
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="default" className="flex items-center gap-1">
                <Network className="h-3 w-3" />
                Interactive
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                3D WebGL
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="knowledge-graph" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="knowledge-graph" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Knowledge Graph
            </TabsTrigger>
            <TabsTrigger value="concept-map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Concept Map
            </TabsTrigger>
            <TabsTrigger value="learning-paths" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Learning Paths
            </TabsTrigger>
          </TabsList>

          {/* Knowledge Graph Tab */}
          <TabsContent value="knowledge-graph" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Visualization */}
              <div className="lg:col-span-3">
                <ThreeDKnowledgeGraph onNodeSelect={handleNodeSelect} className="w-full" />
              </div>

              {/* Information Panel */}
              <div className="lg:col-span-1 space-y-6">
                {/* Selected Node Info */}
                {selectedNode && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Brain className="h-5 w-5 mr-2 text-blue-600" />
                        Selected Concept
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg">{selectedNode.name}</h3>
                          <p className="text-sm text-gray-600">{selectedNode.category}</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Complexity:</span>
                            <Badge
                              variant={
                                selectedNode.complexity > 7
                                  ? 'destructive'
                                  : selectedNode.complexity > 4
                                    ? 'default'
                                    : 'secondary'
                              }
                            >
                              {selectedNode.complexity}/10
                            </Badge>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Popularity:</span>
                            <Badge variant="outline">{Math.round(selectedNode.popularity)}%</Badge>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Type:</span>
                            <Badge variant={selectedNode.isCore ? 'default' : 'secondary'}>
                              {selectedNode.isCore ? 'Core Concept' : 'Specialized'}
                            </Badge>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Connections:</span>
                            <Badge variant="outline">{selectedNode.connections.length} links</Badge>
                          </div>
                        </div>

                        <Button onClick={handleViewTerm} className="w-full" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Instructions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Info className="h-5 w-5 mr-2 text-green-600" />
                      How to Navigate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <strong>Click</strong> on any sphere to select a concept and see its
                          connections
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <strong>Drag</strong> to rotate the view and explore from different angles
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <strong>Scroll</strong> to zoom in and out for closer inspection
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <strong>Hover</strong> over concepts to see quick information
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Legend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
                      Visual Legend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div>
                        <strong>Node Shapes:</strong>
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span>Regular concepts</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 bg-blue-500"
                              style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
                            ></div>
                            <span>Core concepts</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <strong>Connection Types:</strong>
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-0.5 bg-red-500"></div>
                            <span>Prerequisites</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-0.5 bg-green-500"></div>
                            <span>Related concepts</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-0.5 bg-blue-500"></div>
                            <span>Advanced topics</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-0.5 bg-yellow-500"></div>
                            <span>Applications</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <strong>Complexity Indicators:</strong>
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>High complexity (7+ difficulty)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Info */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <Zap className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">WebGL Acceleration</h4>
                        <p className="text-sm text-blue-800">
                          This 3D visualization uses WebGL for hardware-accelerated rendering,
                          supporting thousands of nodes with smooth 60fps performance.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Concept Map Tab - Placeholder */}
          <TabsContent value="concept-map" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Map className="h-5 w-5 mr-2" />
                  Concept Map Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Map className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Concept Map Coming Soon
                  </h3>
                  <p className="text-gray-600 mb-4">
                    2D hierarchical visualization of concept relationships and learning
                    progressions.
                  </p>
                  <Badge variant="secondary">In Development</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Learning Paths Tab - Placeholder */}
          <TabsContent value="learning-paths" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Learning Path Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    3D Learning Paths Coming Soon
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Interactive 3D visualization of personalized learning journeys and skill
                    progression.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="secondary">In Development</Badge>
                    <Button variant="outline" size="sm" onClick={() => navigate('/learning-paths')}>
                      View 2D Learning Paths
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ThreeDVisualizationPage;
