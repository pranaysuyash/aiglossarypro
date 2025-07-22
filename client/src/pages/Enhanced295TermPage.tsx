// src/pages/Enhanced295TermPage.tsx
// Example page component showing how to use the 295-column content display

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Settings, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Enhanced295ContentDisplay } from '@/components/Enhanced295ContentDisplay';
import { useEnhanced295Content } from '@/hooks/useEnhanced295Content';
import { useTermData } from '@/hooks/useTermData';
import { useAuth } from '@/hooks/useAuth';

export const Enhanced295TermPage: React.FC = () => {
  const { termId } = useParams<{ termId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generateOptions, setGenerateOptions] = useState({
    onlyEssential: false,
    categories: [] as string[]
  });

  // Fetch term basic info
  const { data: term, isLoading: termLoading } = useTermData(termId!);

  // Fetch 295-column content
  const {
    contentStatus,
    detailedStats,
    isLoading,
    generateSingleColumn,
    generateAllColumns,
    deleteColumnContent,
    generationProgress,
    isGenerating,
    refetchContent,
    columnContents,
    fetchColumnContent
  } = useEnhanced295Content(termId!, term?.name);

  // Handle content generation for a single column
  const handleGenerateContent = async (columnId: string) => {
    await generateSingleColumn.mutateAsync({ columnId });
  };

  // Handle bulk generation
  const handleBulkGenerate = async () => {
    setShowGenerateDialog(false);
    await generateAllColumns({
      onlyEssential: generateOptions.onlyEssential,
      onlyCategories: generateOptions.categories.length > 0 ? generateOptions.categories : undefined
    });
  };

  // Handle content editing (placeholder)
  const handleEditContent = (columnId: string, content: string) => {
    console.log('Edit content:', columnId, content);
    // TODO: Implement content editing
  };

  if (termLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!term) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Term not found or content not available.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{term.name}</h1>
            {term.shortDefinition && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {term.shortDefinition}
              </p>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => refetchContent()}
              disabled={isGenerating}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowGenerateDialog(true)}
              disabled={isGenerating}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Content
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        )}
      </div>

      {/* Generation Progress */}
      {isGenerating && generationProgress && (
        <Card>
          <CardHeader>
            <CardTitle>Generating Content...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{generationProgress.progress?.toFixed(1)}%</span>
                </div>
                <Progress value={generationProgress.progress || 0} />
              </div>
              {generationProgress.currentColumn && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Currently generating: {generationProgress.currentColumn}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      {detailedStats && (
        <Card>
          <CardHeader>
            <CardTitle>Content Coverage Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Essential Content</h3>
                <div className="space-y-2">
                  <Progress 
                    value={detailedStats.essentialCompletion} 
                    className="h-2"
                  />
                  <p className="text-sm text-gray-600">
                    {detailedStats.essentialCompletion.toFixed(1)}% complete
                  </p>
                  {detailedStats.missingEssentials.length > 0 && (
                    <div className="text-xs text-red-600">
                      Missing: {detailedStats.missingEssentials.slice(0, 3).join(', ')}
                      {detailedStats.missingEssentials.length > 3 && 
                        ` +${detailedStats.missingEssentials.length - 3} more`}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Important Content</h3>
                <div className="space-y-2">
                  <Progress 
                    value={detailedStats.importantCompletion} 
                    className="h-2"
                  />
                  <p className="text-sm text-gray-600">
                    {detailedStats.importantCompletion.toFixed(1)}% complete
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Recently Generated</h3>
                <div className="space-y-1">
                  {detailedStats.recentlyGenerated.slice(0, 3).map((item: any) => (
                    <div key={item.columnId} className="text-sm">
                      <Badge variant="outline" className="text-xs">
                        {item.columnName}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Display */}
      <Enhanced295ContentDisplay
        termId={termId!}
        termName={term.name}
        columnContents={columnContents}
        fetchColumnContent={fetchColumnContent.refetch}
        columnStructure={columnStructure}
        contentStatus={contentStatus}
        stats={contentStatus?.stats || { 
          totalColumns: 295, 
          populatedColumns: 0, 
          completionPercentage: 0 
        }}
        onGenerateContent={isAdmin ? handleGenerateContent : undefined}
        onEditContent={isAdmin ? handleEditContent : undefined}
        isAdmin={isAdmin}
      />

      {/* Generate Content Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Content</DialogTitle>
            <DialogDescription>
              Choose which content to generate for {term.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="essential-only"
                checked={generateOptions.onlyEssential}
                onChange={(e) => setGenerateOptions({
                  ...generateOptions,
                  onlyEssential: e.target.checked
                })}
              />
              <label htmlFor="essential-only">
                Generate essential content only
              </label>
            </div>

            <div>
              <label className="text-sm font-medium">
                Or select specific categories:
              </label>
              <div className="mt-2 space-y-2">
                {['essential', 'important', 'supplementary', 'advanced'].map(category => (
                  <div key={category} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={category}
                      checked={generateOptions.categories.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setGenerateOptions({
                            onlyEssential: false,
                            categories: [...generateOptions.categories, category]
                          });
                        } else {
                          setGenerateOptions({
                            ...generateOptions,
                            categories: generateOptions.categories.filter(c => c !== category)
                          });
                        }
                      }}
                    />
                    <label htmlFor={category} className="capitalize">
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Alert>
              <AlertDescription>
                This will generate AI content for the selected sections. 
                The process may take several minutes depending on the amount of content.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkGenerate}>
              <Sparkles className="h-4 w-4 mr-2" />
              Start Generation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};