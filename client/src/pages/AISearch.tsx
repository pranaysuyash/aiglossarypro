/**
 * AI Search Page
 * Dedicated page for AI-powered semantic search functionality
 */

import {
  ArrowLeft,
  Brain,
  Lightbulb,
  Map,
  Network,
  Search,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useLocation } from 'wouter';
import AISemanticSearch from '../components/search/AISemanticSearch';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

interface SemanticSearchResult {
  id: string;
  name: string;
  definition?: string;
  shortDefinition?: string;
  category?: {
    id: string;
    name: string;
  };
  viewCount: number;
  relevanceScore: number;
  semanticSimilarity?: number;
  conceptRelationships?: string[];
  suggestedPrerequisites?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AISearchPage: React.FC = () => {
  const [, navigate] = useLocation();

  const handleResultSelect = (result: SemanticSearchResult) => {
    // Navigate to the term detail page
    navigate(`/term/${result.id}`);
  };

  const handleBackToHome = () => {
    navigate('/');
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
                  <Brain className="h-8 w-8 mr-3 text-blue-600" />
                  AI-Powered Search
                </h1>
                <p className="text-gray-600 mt-1">
                  Advanced semantic search with concept understanding and relationship mapping
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="default" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI Enhanced
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Beta
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Search Interface */}
          <div className="lg:col-span-3">
            <AISemanticSearch onResultSelect={handleResultSelect} className="w-full" />
          </div>

          {/* Sidebar - Features and Tips */}
          <div className="lg:col-span-1 space-y-6">
            {/* AI Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-blue-600" />
                  AI Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm">Semantic Understanding</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Understands concepts and relationships, not just keywords
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Network className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm">Concept Mapping</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Shows related concepts and prerequisite knowledge
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm">Adaptive Strategy</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Automatically chooses the best search approach
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Map className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm">Learning Paths</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Suggests learning prerequisites and next steps
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
                  Search Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Natural Language</h4>
                    <p className="text-xs text-gray-600">
                      Try: "What is transformer architecture?" or "How does attention work?"
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-1">Concepts vs Keywords</h4>
                    <p className="text-xs text-gray-600">
                      Search for concepts like "learning algorithms" instead of just "algorithm"
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-1">Use Filters</h4>
                    <p className="text-xs text-gray-600">
                      Apply category and complexity filters for more targeted results
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-1">Explore Relationships</h4>
                    <p className="text-xs text-gray-600">
                      Check related concepts and prerequisites for deeper learning
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => navigate('/learning-paths')}
                  >
                    <Map className="h-4 w-4 mr-2" />
                    Browse Learning Paths
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => navigate('/terms')}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Browse All Terms
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => navigate('/code-examples')}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Code Examples
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Beta Notice */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Brain className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Beta Feature</h4>
                    <p className="text-sm text-blue-800">
                      This AI search is continuously learning and improving. Your feedback helps us
                      enhance the search experience.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISearchPage;
