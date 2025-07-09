import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../db';
import { sections, sectionItems, enhancedTerms } from '../../../shared/enhancedSchema';
import { eq, and } from 'drizzle-orm';
import { authenticateToken } from '../../middleware/adminAuth';
import { log } from '../../utils/logger';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Schema for content update
const updateContentSchema = z.object({
  termId: z.string().uuid(),
  sectionName: z.string(),
  content: z.string(),
  metadata: z.object({
    editedBy: z.string().optional(),
    editedAt: z.string().optional(),
    isManualEdit: z.boolean().default(true),
    previousContent: z.string().optional(),
  }).optional()
});

/**
 * Update content for a specific term section
 */
router.put('/content/:termId/:sectionName', async (req, res) => {
  try {
    const { termId, sectionName } = req.params;
    const { content, metadata } = updateContentSchema.parse({
      ...req.body,
      termId,
      sectionName
    });

    // Verify term exists
    const term = await db.select()
      .from(enhancedTerms)
      .where(eq(enhancedTerms.id, termId))
      .limit(1);

    if (term.length === 0) {
      return res.status(404).json({ error: 'Term not found' });
    }

    // Get or create section
    let section = await db.select()
      .from(sections)
      .where(and(
        eq(sections.termId, termId),
        eq(sections.name, sectionName)
      ))
      .limit(1);

    let sectionId: number;
    
    if (section.length === 0) {
      // Create section if it doesn't exist
      const newSection = await db.insert(sections)
        .values({
          termId,
          name: sectionName,
          displayOrder: 0,
          isCompleted: true
        })
        .returning();
      sectionId = newSection[0].id;
    } else {
      sectionId = section[0].id;
    }

    // Check if section item exists
    const existingItem = await db.select()
      .from(sectionItems)
      .where(and(
        eq(sectionItems.sectionId, sectionId),
        eq(sectionItems.label, sectionName)
      ))
      .limit(1);

    // Prepare metadata
    const updatedMetadata = {
      ...(existingItem[0]?.metadata as any || {}),
      ...metadata,
      editedBy: req.user?.email || 'admin',
      editedAt: new Date().toISOString(),
      isManualEdit: true,
      editHistory: [
        ...(existingItem[0]?.metadata?.editHistory || []),
        {
          editedBy: req.user?.email || 'admin',
          editedAt: new Date().toISOString(),
          previousContent: existingItem[0]?.content || '',
          action: 'manual_edit'
        }
      ].slice(-10) // Keep last 10 edits
    };

    if (existingItem.length > 0) {
      // Update existing item
      await db.update(sectionItems)
        .set({
          content,
          metadata: updatedMetadata,
          isAiGenerated: false, // Mark as manually edited
          verificationStatus: 'verified', // Manual edits are considered verified
          updatedAt: new Date()
        })
        .where(eq(sectionItems.id, existingItem[0].id));
    } else {
      // Create new item
      await db.insert(sectionItems)
        .values({
          sectionId,
          label: sectionName,
          content,
          contentType: 'markdown',
          displayOrder: 0,
          isAiGenerated: false,
          verificationStatus: 'verified',
          metadata: updatedMetadata
        });
    }

    log.info('Content updated successfully', {
      termId,
      sectionName,
      editedBy: req.user?.email,
      contentLength: content.length
    });

    res.json({
      success: true,
      message: 'Content updated successfully',
      metadata: updatedMetadata
    });

  } catch (error) {
    log.error('Error updating content:', {
      error: error instanceof Error ? error.message : String(error),
      termId: req.params.termId,
      sectionName: req.params.sectionName
    });
    
    res.status(500).json({
      error: 'Failed to update content',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get content history for a section
 */
router.get('/content/:termId/:sectionName/history', async (req, res) => {
  try {
    const { termId, sectionName } = req.params;

    // Get section
    const section = await db.select()
      .from(sections)
      .where(and(
        eq(sections.termId, termId),
        eq(sections.name, sectionName)
      ))
      .limit(1);

    if (section.length === 0) {
      return res.status(404).json({ error: 'Section not found' });
    }

    // Get section item with history
    const sectionItem = await db.select()
      .from(sectionItems)
      .where(and(
        eq(sectionItems.sectionId, section[0].id),
        eq(sectionItems.label, sectionName)
      ))
      .limit(1);

    if (sectionItem.length === 0) {
      return res.json({ history: [] });
    }

    const metadata = sectionItem[0].metadata as any || {};
    const history = metadata.editHistory || [];

    res.json({
      history,
      currentContent: sectionItem[0].content,
      isAiGenerated: sectionItem[0].isAiGenerated,
      verificationStatus: sectionItem[0].verificationStatus
    });

  } catch (error) {
    log.error('Error getting content history:', {
      error: error instanceof Error ? error.message : String(error),
      termId: req.params.termId,
      sectionName: req.params.sectionName
    });
    
    res.status(500).json({
      error: 'Failed to get content history'
    });
  }
});

/**
 * Bulk update content status (e.g., mark as verified)
 */
router.post('/content/bulk-update-status', async (req, res) => {
  try {
    const { termIds, sectionNames, status } = z.object({
      termIds: z.array(z.string().uuid()).optional(),
      sectionNames: z.array(z.string()).optional(),
      status: z.enum(['verified', 'needs_review', 'rejected'])
    }).parse(req.body);

    let updatedCount = 0;

    // Build query conditions
    if (termIds && termIds.length > 0) {
      for (const termId of termIds) {
        const sectionsToUpdate = await db.select()
          .from(sections)
          .where(eq(sections.termId, termId));

        for (const section of sectionsToUpdate) {
          const result = await db.update(sectionItems)
            .set({
              verificationStatus: status,
              metadata: {
                ...((await db.select()
                  .from(sectionItems)
                  .where(eq(sectionItems.sectionId, section.id))
                  .limit(1))[0]?.metadata as any || {}),
                statusUpdatedBy: req.user?.email || 'admin',
                statusUpdatedAt: new Date().toISOString()
              }
            })
            .where(eq(sectionItems.sectionId, section.id));
          
          updatedCount++;
        }
      }
    }

    log.info('Bulk status update completed', {
      updatedCount,
      status,
      updatedBy: req.user?.email
    });

    res.json({
      success: true,
      updatedCount,
      message: `Updated ${updatedCount} sections to ${status}`
    });

  } catch (error) {
    log.error('Error in bulk status update:', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      error: 'Failed to update content status'
    });
  }
});

export default router;