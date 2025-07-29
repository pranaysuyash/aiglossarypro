// server/routes/enhanced295Routes.ts
// API routes for the 295-column content generation system

import { Router } from 'express';
import { z } from 'zod';
import { enhanced295AIService } from '../services/enhancedAIContentService';
import { HIERARCHICAL_295_STRUCTURE, getColumnById, getMainSections } from '@aiglossarypro/shared/completeColumnStructure';
import { db } from '@aiglossarypro/database';
import { enhancedTerms, sectionItems, sections } from '@aiglossarypro/shared/enhancedSchema';
import { eq, and } from 'drizzle-orm';
import { log as logger } from '../utils/logger';

const router = Router();

// Schema validators
const generateSingleSchema = z.object({
  termId: z.string().uuid(),
  termName: z.string(),
  columnId: z.string(),
  mode: z.enum(['generate-only', 'generate-evaluate', 'full-pipeline']).default('full-pipeline'),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(50).max(4000).optional(),
  skipExisting: z.boolean().default(true)
});

const batchColumnSchema = z.object({
  columnId: z.string(),
  termIds: z.array(z.string().uuid()).optional(),
  mode: z.enum(['generate-only', 'generate-evaluate', 'full-pipeline']).default('full-pipeline'),
  model: z.string().optional(),
  qualityThreshold: z.number().min(1).max(10).default(7),
  batchSize: z.number().min(1).max(50).default(10),
  skipExisting: z.boolean().default(true)
});

const generateAllColumnsSchema = z.object({
  termId: z.string().uuid(),
  termName: z.string(),
  skipExisting: z.boolean().default(true),
  onlyEssential: z.boolean().default(false),
  onlyCategories: z.array(z.enum(['essential', 'important', 'supplementary', 'advanced'])).optional()
});

// Get the 295-column structure
router.get('/column-structure', async (req, res) => {
  try {
    const structure = HIERARCHICAL_295_STRUCTURE.map(col => ({
      id: col.id,
      name: col.name,
      displayName: col.displayName,
      path: col.path,
      section: col.section,
      category: col.category,
      priority: col.priority,
      estimatedTokens: col.estimatedTokens,
      contentType: col.contentType,
      isInteractive: col.isInteractive,
      order: col.order
    }));

    const sections = getMainSections();
    const stats = {
      totalColumns: HIERARCHICAL_295_STRUCTURE.length,
      byCategory: {
        essential: HIERARCHICAL_295_STRUCTURE.filter(c => c.category === 'essential').length,
        important: HIERARCHICAL_295_STRUCTURE.filter(c => c.category === 'important').length,
        supplementary: HIERARCHICAL_295_STRUCTURE.filter(c => c.category === 'supplementary').length,
        advanced: HIERARCHICAL_295_STRUCTURE.filter(c => c.category === 'advanced').length
      },
      bySection: sections.reduce((acc, section) => ({
        ...acc,
        [section]: HIERARCHICAL_295_STRUCTURE.filter(c => c.section === section).length
      }), {}),
      interactiveColumns: HIERARCHICAL_295_STRUCTURE.filter(c => c.isInteractive).length
    };

    res.json({
      success: true,
      structure,
      sections,
      stats
    });
  } catch (error) {
    logger.error('Error fetching column structure:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch column structure'
    });
  }
});

// Generate content for a single column
router.post('/generate-single', async (req, res) => {
  try {
    const params = generateSingleSchema.parse(req.body);
    
    const result = await enhanced295AIService.generateForColumn(params);
    
    res.json({
      success: result.success,
      result,
      column: getColumnById(params.columnId)
    });
  } catch (error) {
    logger.error('Single generation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Generation failed'
    });
  }
});

// Generate a specific column for multiple terms
router.post('/batch-column', async (req, res) => {
  try {
    const params = batchColumnSchema.parse(req.body);
    
    const result = await enhanced295AIService.generateColumnBatch(params);
    
    res.json({
      success: true,
      ...result,
      column: getColumnById(params.columnId)
    });
  } catch (error) {
    logger.error('Batch column generation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Batch generation failed'
    });
  }
});

// Generate all 295 columns for a term
router.post('/generate-all-columns', async (req, res) => {
  try {
    const params = generateAllColumnsSchema.parse(req.body);
    
    // Stream progress updates
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const result = await enhanced295AIService.generateAllColumnsForTerm(
      params.termId,
      params.termName,
      {
        skipExisting: params.skipExisting,
        onlyEssential: params.onlyEssential,
        onlyCategories: params.onlyCategories,
        progressCallback: (progress, currentColumn) => {
          res.write(`data: ${JSON.stringify({ 
            type: 'progress', 
            progress, 
            currentColumn 
          })}\n\n`);
        }
      }
    );

    // Send final results
    res.write(`data: ${JSON.stringify({ 
      type: 'complete', 
      summary: result.summary,
      resultCount: result.results.size 
    })}\n\n`);
    
    res.end();
  } catch (error) {
    logger.error('Generate all columns error:', error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      error: error instanceof Error ? error.message : 'Generation failed' 
    })}\n\n`);
    res.end();
  }
});

// Get content status for a term
router.get('/term/:termId/content-status', async (req, res) => {
  try {
    const { termId } = req.params;
    
    // Get all content for this term
    const termContent = await db.query.sectionItems.findMany({
      where: eq(sectionItems.termId, termId),
      with: {
        section: true
      }
    });

    // Create a map of what columns have content
    const contentMap = new Map(
      termContent.map(item => [item.columnId, {
        hasContent: true,
        contentType: item.contentType,
        qualityScore: item.qualityScore,
        isAIGenerated: item.isAIGenerated,
        generatedAt: item.metadata?.generatedAt,
        wordCount: item.content?.split(' ').length || 0
      }])
    );

    // Build status for all 295 columns
    const columnStatus = HIERARCHICAL_295_STRUCTURE.map(col => ({
      columnId: col.id,
      columnName: col.displayName,
      section: col.section,
      category: col.category,
      hasContent: contentMap.has(col.id),
      ...(contentMap.get(col.id) || {})
    }));

    // Calculate completion stats
    const stats = {
      totalColumns: HIERARCHICAL_295_STRUCTURE.length,
      completedColumns: contentMap.size,
      completionPercentage: (contentMap.size / HIERARCHICAL_295_STRUCTURE.length) * 100,
      byCategory: {
        essential: {
          total: HIERARCHICAL_295_STRUCTURE.filter(c => c.category === 'essential').length,
          completed: columnStatus.filter(c => c.category === 'essential' && c.hasContent).length
        },
        important: {
          total: HIERARCHICAL_295_STRUCTURE.filter(c => c.category === 'important').length,
          completed: columnStatus.filter(c => c.category === 'important' && c.hasContent).length
        },
        supplementary: {
          total: HIERARCHICAL_295_STRUCTURE.filter(c => c.category === 'supplementary').length,
          completed: columnStatus.filter(c => c.category === 'supplementary' && c.hasContent).length
        },
        advanced: {
          total: HIERARCHICAL_295_STRUCTURE.filter(c => c.category === 'advanced').length,
          completed: columnStatus.filter(c => c.category === 'advanced' && c.hasContent).length
        }
      }
    };

    res.json({
      success: true,
      termId,
      columnStatus,
      stats
    });
  } catch (error) {
    logger.error('Error fetching content status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content status'
    });
  }
});

// Get hierarchical content for a term
router.get('/term/:termId/hierarchical-content', async (req, res) => {
  try {
    const { termId } = req.params;
    
    // Get term details
    const term = await db.query.enhancedTerms.findFirst({
      where: eq(enhancedTerms.id, termId)
    });

    if (!term) {
      return res.status(404).json({
        success: false,
        error: 'Term not found'
      });
    }

    // Get all content for this term
    const termContent = await db.query.sectionItems.findMany({
      where: eq(sectionItems.termId, termId),
      with: {
        section: true
      }
    });

    // Build hierarchical structure
    const contentMap = new Map(
      termContent.map(item => [item.columnId, item])
    );

    const hierarchicalContent: any = {
      term: {
        id: term.id,
        name: term.name,
        shortDefinition: term.shortDefinition
      },
      sections: {}
    };

    // Organize content by sections
    for (const column of HIERARCHICAL_295_STRUCTURE) {
      const sectionPath = column.path.split('.');
      let current = hierarchicalContent.sections;
      
      // Build nested structure
      for (let i = 0; i < sectionPath.length - 1; i++) {
        const part = sectionPath[i];
        if (!current[part]) {
          current[part] = {
            name: part,
            displayName: part.charAt(0).toUpperCase() + part.slice(1).replace(/_/g, ' '),
            subsections: {}
          };
        }
        current = current[part].subsections;
      }
      
      // Add content at the leaf
      const leafName = sectionPath[sectionPath.length - 1];
      const content = contentMap.get(column.id);
      
      current[leafName] = {
        columnId: column.id,
        displayName: column.displayName,
        category: column.category,
        contentType: column.contentType,
        isInteractive: column.isInteractive,
        hasContent: !!content,
        content: content?.content || null,
        metadata: content ? {
          qualityScore: content.qualityScore,
          isAIGenerated: content.isAIGenerated,
          generatedAt: content.metadata?.generatedAt,
          model: content.metadata?.model
        } : null
      };
    }

    res.json({
      success: true,
      hierarchicalContent,
      stats: {
        totalColumns: HIERARCHICAL_295_STRUCTURE.length,
        populatedColumns: termContent.length,
        completionPercentage: (termContent.length / HIERARCHICAL_295_STRUCTURE.length) * 100
      }
    });
  } catch (error) {
    logger.error('Error fetching hierarchical content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hierarchical content'
    });
  }
});

// Delete content for a specific column
router.delete('/term/:termId/column/:columnId', async (req, res) => {
  try {
    const { termId, columnId } = req.params;
    
    await db.delete(sectionItems).where(
      and(
        eq(sectionItems.termId, termId),
        eq(sectionItems.columnId, columnId)
      )
    );

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete content'
    });
  }
});

export default router;