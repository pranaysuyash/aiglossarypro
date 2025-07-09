import { and, eq, sql } from 'drizzle-orm';
import { Router } from 'express';
import { enhancedTerms, sectionItems, sections } from '../../../shared/enhancedSchema';
import { db } from '../../db';
import { authenticateToken } from '../../middleware/adminAuth';
import { log } from '../../utils/logger';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

/**
 * Get enhanced terms with search and pagination
 */
router.get('/enhanced-terms', async (req, res) => {
  try {
    const { search, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let query = db.select().from(enhancedTerms);

    if (search) {
      query = query.where(
        sql`${enhancedTerms.name} ILIKE ${`%${search}%`} OR ${enhancedTerms.shortDefinition} ILIKE ${`%${search}%`}`
      );
    }

    const terms = await query.orderBy(enhancedTerms.name).limit(limitNum).offset(offset);

    res.json(terms);
  } catch (error) {
    log.error('Error fetching enhanced terms:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to fetch terms' });
  }
});

/**
 * Get content metrics
 */
router.get('/content-metrics', async (_req, res) => {
  try {
    // Get total terms
    const totalTermsResult = await db.select({ count: sql<number>`count(*)` }).from(enhancedTerms);
    const totalTerms = Number(totalTermsResult[0]?.count || 0);

    // Get terms with content
    const termsWithContentResult = await db
      .select({ count: sql<number>`count(DISTINCT ${sections.termId})` })
      .from(sections)
      .innerJoin(sectionItems, eq(sections.id, sectionItems.sectionId))
      .where(sql`${sectionItems.content} IS NOT NULL AND ${sectionItems.content} != ''`);
    const termsWithContent = Number(termsWithContentResult[0]?.count || 0);

    // Get total sections generated
    const sectionsGeneratedResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(sectionItems)
      .where(
        and(
          eq(sectionItems.isAiGenerated, true),
          sql`${sectionItems.content} IS NOT NULL AND ${sectionItems.content} != ''`
        )
      );
    const sectionsGenerated = Number(sectionsGeneratedResult[0]?.count || 0);

    // Get average quality score (mock for now)
    const averageQualityScore = 7.5; // TODO: Calculate from actual quality scores

    res.json({
      totalTerms,
      termsWithContent,
      sectionsGenerated,
      averageQualityScore,
      lastGeneratedAt: new Date().toISOString(),
    });
  } catch (error) {
    log.error('Error fetching content metrics:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

/**
 * Get sections for a specific term
 */
router.get('/terms/:termId/sections', async (req, res) => {
  try {
    const { termId } = req.params;

    const termSections = await db
      .select()
      .from(sections)
      .where(eq(sections.termId, termId))
      .orderBy(sections.displayOrder);

    res.json(termSections);
  } catch (error) {
    log.error('Error fetching term sections:', {
      error: error instanceof Error ? error.message : String(error),
      termId: req.params.termId,
    });
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

/**
 * Get content for a specific section
 */
router.get('/terms/:termId/sections/:sectionName/content', async (req, res) => {
  try {
    const { termId, sectionName } = req.params;

    // Get section
    const section = await db
      .select()
      .from(sections)
      .where(and(eq(sections.termId, termId), eq(sections.name, sectionName)))
      .limit(1);

    if (section.length === 0) {
      return res.status(404).json({ error: 'Section not found' });
    }

    // Get section item
    const sectionItem = await db
      .select()
      .from(sectionItems)
      .where(and(eq(sectionItems.sectionId, section[0].id), eq(sectionItems.label, sectionName)))
      .limit(1);

    if (sectionItem.length === 0) {
      return res.status(404).json({ error: 'No content found' });
    }

    const item = sectionItem[0];
    const metadata = (item.metadata as any) || {};

    res.json({
      content: item.content,
      isAiGenerated: item.isAiGenerated,
      verificationStatus: item.verificationStatus,
      qualityScore: metadata.qualityScore,
      metadata: {
        ...metadata,
        lastEditedAt: item.updatedAt,
        contentType: item.contentType,
      },
    });
  } catch (error) {
    log.error('Error fetching section content:', {
      error: error instanceof Error ? error.message : String(error),
      termId: req.params.termId,
      sectionName: req.params.sectionName,
    });
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

export default router;
