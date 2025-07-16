/**
 * Knowledge Graph Page
 * Dedicated page for exploring AI/ML concepts in 3D
 */

import {
  BookOpen,
  Compass,
  Download,
  Fullscreen,
  HelpCircle,
  Info,
  Network,
  Share2,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import Enhanced3DKnowledgeGraph from '../components/visualization/Enhanced3DKnowledgeGraph';
import { toast } from '../hooks/use-toast';

const KnowledgeGraphPage: React.FC = () => {
  const { termId } = useParams();
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    const url = window.location.href;
    const title = '3D Knowledge Graph - AI/ML Glossary Pro';
    const text = 'Explore AI/ML concepts in an interactive 3D visualization';

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        // User cancelled or share failed
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied!',
        description: 'The graph link has been copied to your clipboard.',
      });
    }
  };

  // Handle export (screenshot)
  const handleExport = () => {
    // This would need to be implemented with canvas capture
    toast({
      title: 'Export feature',
      description: 'Graph export will be available soon!',
    });
  };

  // Handle term selection
  const handleTermSelect = (selectedTermId: string) => {
    navigate(`/knowledge-graph/${selectedTermId}`);
  };

  return (
    <>
      <Helmet>
        <title>3D Knowledge Graph - AI/ML Glossary Pro</title>
        <meta
          name="description"
          content="Explore AI and Machine Learning concepts in an interactive 3D knowledge graph. Visualize relationships between terms and discover learning paths."
        />
        <meta property="og:title" content="3D Knowledge Graph - AI/ML Glossary Pro" />
        <meta
          property="og:description"
          content="Interactive 3D visualization of AI/ML concepts and their relationships"
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                  ← Back
                </Button>
                <div>
                  <h1 className="text-2xl font-bold flex items-center">
                    <Network className="h-6 w-6 mr-2 text-blue-600" />
                    3D Knowledge Graph
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Interactive visualization of AI/ML concept relationships
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowInfo(true)}
                  title="About this graph"
                >
                  <Info className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowHelp(true)}
                  title="Help"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleShare} title="Share">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleExport} title="Export">
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  <Fullscreen className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          <Tabs defaultValue="graph" className="space-y-4">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="graph">
                <Network className="h-4 w-4 mr-2" />
                Graph
              </TabsTrigger>
              <TabsTrigger value="guide">
                <BookOpen className="h-4 w-4 mr-2" />
                Guide
              </TabsTrigger>
              <TabsTrigger value="explore">
                <Compass className="h-4 w-4 mr-2" />
                Explore
              </TabsTrigger>
            </TabsList>

            <TabsContent value="graph" className="space-y-4">
              <Enhanced3DKnowledgeGraph initialTermId={termId} onTermSelect={handleTermSelect} />
            </TabsContent>

            <TabsContent value="guide" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>How to Use the Knowledge Graph</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Navigation</h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Click and drag to rotate the graph</li>
                      <li>• Scroll to zoom in/out</li>
                      <li>• Right-click and drag to pan</li>
                      <li>• Click on nodes to select and center</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Understanding the Visualization</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        <span>Machine Learning concepts</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span>Deep Learning concepts</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                        <span>NLP concepts</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <span>Computer Vision concepts</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Connection Types</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-0.5 bg-red-500"></div>
                        <span>Prerequisite relationship</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-0.5 bg-green-500"></div>
                        <span>Related concepts</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-0.5 bg-blue-500"></div>
                        <span>Advanced extension</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-0.5 bg-yellow-500"></div>
                        <span>Practical application</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="explore" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate('/knowledge-graph/neural-networks')}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">Neural Networks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">Explore the foundation of deep learning</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="secondary">Core Concept</Badge>
                      <Badge>High Connectivity</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate('/knowledge-graph/transformers')}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">Transformers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">State-of-the-art architecture for NLP</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="secondary">Advanced</Badge>
                      <Badge>Trending</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate('/knowledge-graph/machine-learning')}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">Machine Learning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">The complete ML ecosystem</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="secondary">Fundamental</Badge>
                      <Badge>Comprehensive</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts & Tips</DialogTitle>
            <DialogDescription>Master the 3D Knowledge Graph navigation</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Keyboard Navigation</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded">→/D</kbd>
                  <span>Next node</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded">←/A</kbd>
                  <span>Previous node</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded">↑/W</kbd>
                  <span>Connected node</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded">↓/S</kbd>
                  <span>Parent node</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded">Enter</kbd>
                  <span>Select node</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded">Esc</kbd>
                  <span>Reset view</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Mouse Controls</h4>
              <div className="space-y-1 text-sm">
                <div>• Left click + drag: Rotate view</div>
                <div>• Right click + drag: Pan view</div>
                <div>• Scroll: Zoom in/out</div>
                <div>• Click node: Select and focus</div>
                <div>• Double click: Center on node</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Pro Tips</h4>
              <div className="space-y-1 text-sm">
                <div>• Use filters to focus on specific topics</div>
                <div>• Adjust depth to see more connections</div>
                <div>• Try different layouts for new perspectives</div>
                <div>• Click node details to learn more</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Info Dialog */}
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>About the Knowledge Graph</DialogTitle>
            <DialogDescription>
              Understanding AI/ML concepts through visualization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">
              This interactive 3D knowledge graph visualizes the relationships between AI and
              Machine Learning concepts, helping you understand how different topics connect and
              build upon each other.
            </p>

            <div>
              <h4 className="font-medium mb-2">Key Features</h4>
              <ul className="space-y-1 text-sm list-disc list-inside">
                <li>Real-time 3D visualization of concept relationships</li>
                <li>Interactive navigation and exploration</li>
                <li>Intelligent layout algorithms</li>
                <li>Depth-based relationship traversal</li>
                <li>Category and complexity filtering</li>
                <li>Learning path discovery</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Data Sources</h4>
              <p className="text-sm">
                The graph is built from our comprehensive database of AI/ML terms, with
                relationships curated by experts and validated through community feedback.
              </p>
            </div>

            <div className="pt-2">
              <Button className="w-full" onClick={() => navigate('/about')}>
                Learn More About AI Glossary Pro
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default KnowledgeGraphPage;
