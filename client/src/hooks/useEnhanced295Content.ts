// src/hooks/useEnhanced295Content.ts
// Hook to fetch and manage 295-column hierarchical content

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

interface ColumnDefinition {
  id: string;
  name: string;
  displayName: string;
  path: string;
  section: string;
  category: 'essential' | 'important' | 'supplementary' | 'advanced';
  priority: number;
  estimatedTokens: number;
  contentType: 'text' | 'markdown' | 'json' | 'array' | 'interactive';
  isInteractive: boolean;
  order: number;
}

interface ContentStatus {
  columnId: string;
  columnName: string;
  section: string;
  category: string;
  hasContent: boolean;
  contentType?: string;
  qualityScore?: number;
  isAIGenerated?: boolean;
  generatedAt?: string;
  wordCount?: number;
}

interface ContentStats {
  totalColumns: number;
  completedColumns: number;
  completionPercentage: number;
  byCategory: {
    essential: { total: number; completed: number };
    important: { total: number; completed: number };
    supplementary: { total: number; completed: number };
    advanced: { total: number; completed: number };
  };
}

interface HierarchicalContent {
  term: {
    id: string;
    name: string;
    shortDefinition?: string;
  };
  sections: any; // Complex nested structure
  stats: {
    totalColumns: number;
    populatedColumns: number;
    completionPercentage: number;
  };
}

interface GenerationProgress {
  type: 'progress' | 'complete' | 'error';
  progress?: number;
  currentColumn?: string;
  summary?: any;
  error?: string;
}

export const useEnhanced295Content = (termId: string, termName?: string) => {
  const queryClient = useQueryClient();
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [columnContents, setColumnContents] = useState<Record<string, string>>({});

  const fetchColumnContent = useQuery({
    queryKey: ['column-content', termId, 'placeholder'], // Placeholder for columnId
    queryFn: async ({ queryKey }) => {
      const [_, termId, columnId] = queryKey;
      const response = await api.get(`/api/enhanced-295/term/${termId}/column/${columnId}`);
      return response.data.content;
    },
    enabled: false, // Disabled by default, enabled when needed
    staleTime: Infinity, // Content doesn't change often
    cacheTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
    onSuccess: (data, { queryKey }) => {
      const [_, __, columnId] = queryKey;
      setColumnContents(prev => ({ ...prev, [columnId]: data }));
    },
    onError: (error: any) => {
      toast.error(`Failed to fetch column content: ${error.message}`);
    }
  });

  // Fetch column structure
  const { data: columnStructure, isLoading: structureLoading } = useQuery({
    queryKey: ['column-structure'],
    queryFn: async () => {
      const response = await api.get('/api/enhanced-295/column-structure');
      return response.data;
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  // Fetch content status for the term
  const { 
    data: contentStatus, 
    isLoading: statusLoading,
    refetch: refetchStatus
  } = useQuery({
    queryKey: ['term-content-status', termId],
    queryFn: async () => {
      const response = await api.get(`/api/enhanced-295/term/${termId}/content-status`);
      return response.data;
    },
    enabled: !!termId,
  });

  

  // Generate content for a single column
  const generateSingleColumn = useMutation({
    mutationFn: async ({ columnId, mode = 'full-pipeline' }: { 
      columnId: string; 
      mode?: 'generate-only' | 'generate-evaluate' | 'full-pipeline';
    }) => {
      if (!termName) throw new Error('Term name is required for generation');
      
      const response = await api.post('/api/enhanced-295/generate-single', {
        termId,
        termName,
        columnId,
        mode,
        skipExisting: false
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Content generated for ${data.column?.displayName || 'column'}`);
        // Invalidate queries to refresh content
        queryClient.invalidateQueries({ queryKey: ['term-content-status', termId] });
        queryClient.invalidateQueries({ queryKey: ['term-hierarchical-content', termId] });
      } else {
        toast.error(`Failed to generate content: ${data.error}`);
      }
    },
    onError: (error: any) => {
      toast.error(`Generation error: ${error.message}`);
    }
  });

  // Generate all columns for the term
  const generateAllColumns = useCallback(async (options?: {
    onlyEssential?: boolean;
    onlyCategories?: string[];
  }) => {
    if (!termName) {
      toast.error('Term name is required for generation');
      return;
    }

    try {
      const eventSource = new EventSource(
        `/api/enhanced-295/generate-all-columns?${new URLSearchParams({
          termId,
          termName,
          skipExisting: 'true',
          onlyEssential: options?.onlyEssential ? 'true' : 'false',
          ...(options?.onlyCategories ? { onlyCategories: options.onlyCategories.join(',') } : {})
        })}`
      );

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setGenerationProgress(data);

        if (data.type === 'complete') {
          eventSource.close();
          toast.success('Content generation completed!');
          // Refresh content
          refetchStatus();
          refetchContent();
        } else if (data.type === 'error') {
          eventSource.close();
          toast.error(`Generation error: ${data.error}`);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        toast.error('Connection lost during generation');
        setGenerationProgress(null);
      };

      return () => eventSource.close();
    } catch (error: any) {
      toast.error(`Failed to start generation: ${error.message}`);
    }
  }, [termId, termName, refetchStatus, refetchContent]);

  // Batch generate a specific column for multiple terms
  const batchGenerateColumn = useMutation({
    mutationFn: async ({ 
      columnId, 
      termIds,
      mode = 'full-pipeline' 
    }: { 
      columnId: string; 
      termIds?: string[];
      mode?: 'generate-only' | 'generate-evaluate' | 'full-pipeline';
    }) => {
      const response = await api.post('/api/enhanced-295/batch-column', {
        columnId,
        termIds,
        mode,
        skipExisting: true
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(
        `Batch generation completed: ${data.summary.successCount} successful, ${data.summary.failureCount} failed`
      );
    },
    onError: (error: any) => {
      toast.error(`Batch generation error: ${error.message}`);
    }
  });

  // Delete content for a column
  const deleteColumnContent = useMutation({
    mutationFn: async (columnId: string) => {
      const response = await api.delete(
        `/api/enhanced-295/term/${termId}/column/${columnId}`
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Content deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['term-content-status', termId] });
      queryClient.invalidateQueries({ queryKey: ['term-hierarchical-content', termId] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete content: ${error.message}`);
    }
  });

  // Calculate detailed stats
  const detailedStats = contentStatus ? {
    ...contentStatus.stats,
    essentialCompletion: contentStatus.stats.byCategory.essential.completed / 
                         contentStatus.stats.byCategory.essential.total * 100,
    importantCompletion: contentStatus.stats.byCategory.important.completed / 
                         contentStatus.stats.byCategory.important.total * 100,
    missingEssentials: contentStatus.columnStatus
      .filter((col: ContentStatus) => col.category === 'essential' && !col.hasContent)
      .map((col: ContentStatus) => col.columnName),
    recentlyGenerated: contentStatus.columnStatus
      .filter((col: ContentStatus) => col.generatedAt)
      .sort((a: ContentStatus, b: ContentStatus) => 
        new Date(b.generatedAt!).getTime() - new Date(a.generatedAt!).getTime()
      )
      .slice(0, 5)
  } : null;

  return {
    // Data
    columnStructure,
    contentStatus,
    columnContents,
    detailedStats,
    
    // Loading states
    isLoading: structureLoading || statusLoading,
    structureLoading,
    statusLoading,
    
    // Mutations
    generateSingleColumn,
    generateAllColumns,
    batchGenerateColumn,
    deleteColumnContent,
    fetchColumnContent,
    
    // Progress tracking
    generationProgress,
    isGenerating: generationProgress !== null && generationProgress.type === 'progress',
    
    // Refresh functions
    refetchStatus,
    refetchContent: () => {
      queryClient.invalidateQueries({ queryKey: ['column-content'] });
      refetchStatus();
    },
  };
};

// Hook to manage column prompt templates
export const useColumnPrompts = () => {
  const queryClient = useQueryClient();

  // Fetch available prompts
  const { data: prompts, isLoading } = useQuery({
    queryKey: ['column-prompts'],
    queryFn: async () => {
      const response = await api.get('/api/admin/prompts/column-templates');
      return response.data;
    }
  });

  // Update prompt template
  const updatePrompt = useMutation({
    mutationFn: async ({ 
      columnId, 
      promptType, 
      content 
    }: { 
      columnId: string; 
      promptType: 'generative' | 'evaluative' | 'improvement';
      content: string;
    }) => {
      const response = await api.put(`/api/admin/prompts/column-templates/${columnId}`, {
        [promptType]: content
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Prompt template updated successfully');
      queryClient.invalidateQueries({ queryKey: ['column-prompts'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to update prompt: ${error.message}`);
    }
  });

  return {
    prompts,
    isLoading,
    updatePrompt
  };
};