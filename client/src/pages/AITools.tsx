import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Lightbulb, Brain, Search, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import { AIDefinitionGenerator } from "@/components/AIDefinitionGenerator";
import { AITermSuggestions } from "@/components/AITermSuggestions";
import { AISemanticSearch } from "@/components/AISemanticSearch";
import { useAuth } from "@/hooks/useAuth";
import { Link } from 'wouter';

export default function AIToolsPage() {
  const { isAuthenticated, user } = useAuth();
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <Sidebar />
          <main className="flex-1">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Brain className="h-6 w-6 text-blue-500" />
                  AI-Powered Tools
                </CardTitle>
                <CardDescription>
                  Access advanced AI features for glossary management
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12">
                <p className="text-gray-600 mb-6">
                  Please sign in to access AI-powered tools and features.
                </p>
                <Link href="/auth">
                  <a className="text-primary-600 hover:text-primary-700 font-medium">
                    Sign In
                  </a>
                </Link>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  const handleSuggestionSelect = (suggestion: any) => {
    setSelectedSuggestion(suggestion);
    // Switch to definition generator tab and populate it
    // The definition generator will be pre-filled with the suggestion
  };

  const handleDefinitionGenerated = (definition: any) => {
    // Handle when a definition is generated
    console.log('Definition generated:', definition);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        <Sidebar />
        
        <main className="flex-1">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Brain className="h-6 w-6 text-blue-500" />
              <h1 className="text-2xl font-bold">AI-Powered Tools</h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Beta
              </Badge>
            </div>
            <p className="text-gray-600">
              Enhance your glossary with intelligent AI-powered features for content creation and management.
            </p>
          </div>

          <Tabs defaultValue="search" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">AI Search</span>
              </TabsTrigger>
              <TabsTrigger value="generator" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Generator</span>
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                <span className="hidden sm:inline">Suggestions</span>
              </TabsTrigger>
              <TabsTrigger value="batch" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">Batch Tools</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-blue-500" />
                    AI Semantic Search
                  </CardTitle>
                  <CardDescription>
                    Search for terms using natural language and semantic understanding, not just keyword matching.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AISemanticSearch 
                    placeholder="Search with AI understanding (e.g., 'algorithms that learn from data')"
                    onResultClick={(termId) => {
                      // Navigate to term
                      window.open(`/term/${termId}`, '_blank');
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How AI Search Works</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-medium">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Semantic Understanding</h4>
                        <p className="text-gray-600">AI analyzes the meaning and context of your query, not just keywords.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-medium">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Relevance Scoring</h4>
                        <p className="text-gray-600">Results are ranked by conceptual relevance and relationships.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-medium">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Explanation</h4>
                        <p className="text-gray-600">AI explains why each result is relevant to your query.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="generator" className="space-y-6">
              <AIDefinitionGenerator
                onDefinitionGenerated={handleDefinitionGenerated}
                initialTerm={selectedSuggestion?.term || ''}
                initialCategory={selectedSuggestion?.category || ''}
              />
              
              {selectedSuggestion && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-blue-800">Pre-filled from Suggestion</CardTitle>
                    <CardDescription className="text-blue-600">
                      Generated from AI term suggestion: "{selectedSuggestion.term}"
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-6">
              <AITermSuggestions
                onSuggestionSelect={handleSuggestionSelect}
              />

              <Card>
                <CardHeader>
                  <CardTitle>About AI Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <p className="text-gray-600">
                      Our AI analyzes your existing glossary to identify important terms that might be missing. 
                      Suggestions are based on:
                    </p>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        Current gaps in your glossary coverage
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        Trending AI/ML concepts and technologies
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        Fundamental concepts that complement existing terms
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        Mathematical foundations and practical applications
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="batch" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    Batch AI Operations
                  </CardTitle>
                  <CardDescription>
                    Perform AI operations on multiple terms at once (Admin only)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(user as any)?.email === 'admin@example.com' ? (
                    <div className="space-y-6">
                      {/* Batch Categorization */}
                      <div className="p-6 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Brain className="h-5 w-5 text-purple-500" />
                          <h3 className="font-medium">Batch Categorization</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Automatically categorize multiple terms using AI analysis. Select up to 50 terms for AI-powered categorization.
                        </p>
                        <div className="space-y-3">
                          <Button 
                            onClick={() => {
                              // Navigate to admin panel with batch categorization
                              window.location.href = '/admin?tab=batch-categorize';
                            }}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Start Batch Categorization
                          </Button>
                          <div className="text-xs text-gray-500">
                            • Analyzes term definitions and suggests appropriate categories<br/>
                            • Processes up to 50 terms at once<br/>
                            • Uses GPT-4o-mini for intelligent categorization
                          </div>
                        </div>
                      </div>
                      
                      {/* Definition Enhancement */}
                      <div className="p-6 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="h-5 w-5 text-green-500" />
                          <h3 className="font-medium">Definition Enhancement</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Improve multiple term definitions simultaneously with AI assistance. Choose enhancement type and target audience.
                        </p>
                        <div className="space-y-3">
                          <Button 
                            onClick={() => {
                              // Navigate to admin panel with definition enhancement
                              window.location.href = '/admin?tab=batch-enhance';
                            }}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Start Definition Enhancement
                          </Button>
                          <div className="text-xs text-gray-500">
                            • Improves clarity and technical depth<br/>
                            • Processes up to 20 terms at once<br/>
                            • Customizable enhancement options
                          </div>
                        </div>
                      </div>

                      {/* Batch Status */}
                      <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <h4 className="font-medium text-blue-800">Processing Info</h4>
                        </div>
                        <p className="text-sm text-blue-700">
                          Batch operations are processed immediately. Large batches may take several minutes due to AI API rate limits.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">
                        Batch operations are only available to administrators.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}