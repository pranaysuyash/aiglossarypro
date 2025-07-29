import { ArrowLeft, BookOpen, Code, ExternalLink, Play, Target } from 'lucide-react';
import { useState } from 'react';
import type React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { contentOutline } from '@/data/content-outline';
import type { ContentNode } from '@/types/content-structure';
import { HierarchicalNavigator } from './HierarchicalNavigator';

export const HierarchicalNavigatorDemo: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<ContentNode | null>(null);

  // Mock user progress data
  const mockUserProgress = {
    '1': { isCompleted: true, progress: 100, timeSpent: 300 },
    '1.0': { isCompleted: true, progress: 100, timeSpent: 120 },
    '1.1': { isCompleted: false, progress: 45, timeSpent: 180 },
    '2': { isCompleted: false, progress: 30, timeSpent: 150 },
    '2.0': { isCompleted: true, progress: 100, timeSpent: 90 },
  };

  const handleNodeClick = (path: string, node: ContentNode) => {
    setCurrentPath(path);
    setSelectedNode(node);
  };

  const handleBackToOverview = () => {
    setCurrentPath('');
    setSelectedNode(null);
  };

  const renderContentPreview = (node: ContentNode) => {
    const getIconForContent = () => {
      if (node.metadata?.isInteractive || node.contentType === 'interactive') {
        return <Play className="h-5 w-5 text-purple-500" />;
      }
      if (node.contentType === 'code') {
        return <Code className="h-5 w-5 text-green-500" />;
      }
      if (node.contentType === 'mermaid') {
        return <Target className="h-5 w-5 text-blue-500" />;
      }
      return <BookOpen className="h-5 w-5 text-gray-500" />;
    };

    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleBackToOverview}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                {getIconForContent()}
                <CardTitle className="text-lg">{node.name}</CardTitle>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {node.metadata?.priority && (
                <Badge variant={node.metadata.priority === 'high' ? 'default' : 'secondary'}>
                  {node.metadata.priority} priority
                </Badge>
              )}
              {node.metadata?.isInteractive && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  Interactive
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Content Type Info */}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Type: {node.contentType || 'standard'}</span>
              <span>Display: {node.metadata?.displayType || 'main'}</span>
              <span>Parse: {node.metadata?.parseType || 'structured'}</span>
            </div>

            {/* Content Preview */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              {node.content ? (
                <div className="prose prose-sm max-w-none">
                  <p>{node.content}</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-2">{getIconForContent()}</div>
                  <p>Content will be loaded here</p>
                  <p className="text-xs mt-2">
                    This {node.contentType || 'section'} would contain the actual content
                  </p>
                </div>
              )}
            </div>

            {/* Subsections Preview */}
            {node.subsections && node.subsections.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Subsections ({node.subsections.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {node.subsections.map((subsection, index) => (
                    <div
                      key={subsection.slug || index}
                      className="p-2 bg-white dark:bg-gray-700 rounded border hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                      onClick={() => handleNodeClick(`${currentPath}.${index}`, subsection)}
                    >
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">{subsection.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Elements */}
            {node.metadata?.isInteractive && (
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                  Interactive Element
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                  This section contains interactive content that helps you learn by doing.
                </p>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Launch Interactive Element
                </Button>
              </div>
            )}

            {/* Prerequisites */}
            {node.metadata?.prerequisites && node.metadata.prerequisites.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                  Prerequisites
                </h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  {node.metadata.prerequisites.map((prereq, index) => (
                    <li key={index}>• {prereq}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Topics */}
            {node.metadata?.relatedTopics && node.metadata.relatedTopics.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Related Topics
                </h4>
                <div className="flex flex-wrap gap-2">
                  {node.metadata.relatedTopics.map((topic, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-100 text-blue-700">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Hierarchical Content Navigation Demo</h1>
        <p className="text-gray-600 dark:text-gray-400">
          This demo shows the new hierarchical navigation system with 295 subsections organized into
          42 main sections.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <HierarchicalNavigator
            sections={contentOutline.sections}
            currentPath={currentPath}
            onNodeClick={handleNodeClick}
            userProgress={mockUserProgress}
            searchable
            collapsible
            showProgress
            showInteractiveElements
            className="sticky top-6"
          />
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2">
          {selectedNode ? (
            renderContentPreview(selectedNode)
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Welcome to the Enhanced Content Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    Select a section from the navigation to explore the hierarchical content
                    structure.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Key Improvements
                      </h3>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• Hierarchical nested structure</li>
                        <li>• Interactive element identification</li>
                        <li>• Progress tracking</li>
                        <li>• Search functionality</li>
                        <li>• Flexible display modes</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
                        Content Types
                      </h3>
                      <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                        <li>• Standard sections</li>
                        <li>• Interactive elements</li>
                        <li>• Code snippets</li>
                        <li>• Mermaid diagrams</li>
                        <li>• JSON data</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                      Structure Overview
                    </h3>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      The new structure organizes <strong>295 subsections</strong> into{' '}
                      <strong>42 main sections</strong>
                      with proper hierarchical relationships, making navigation more intuitive and
                      content discovery easier.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
