import { and, asc, count, desc, eq, gte, like, lte, or, sql } from 'drizzle-orm';
import type { Express } from 'express';
import { enhancedTerms } from '../../../shared/enhancedSchema';
import { aiService } from '../../aiService';
import { db } from '../../db';
import { authenticateFirebaseToken, requireFirebaseAdmin } from '../../middleware/firebaseAuth';
import { log as logger } from '../../utils/logger';

export function registerAdminTermsRoutes(app: Express): void {
  /**
   * @openapi
   * /api/admin/terms:
   *   get:
   *     tags:
   *       - Admin Terms
   *     summary: Get terms with admin filters and enhanced data
   *     description: Retrieve terms with advanced filtering, sorting, and pagination for admin interface
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search terms by name or definition
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: Filter by category
   *       - in: query
   *         name: verificationStatus
   *         schema:
   *           type: string
   *           enum: [all, verified, unverified, flagged]
   *         description: Filter by verification status
   *       - in: query
   *         name: aiGenerated
   *         schema:
   *           type: string
   *           enum: [all, true, false]
   *         description: Filter by AI generation status
   *       - in: query
   *         name: minQuality
   *         schema:
   *           type: string
   *         description: Minimum quality score
   *       - in: query
   *         name: maxQuality
   *         schema:
   *           type: string
   *         description: Maximum quality score
   *       - in: query
   *         name: page
   *         schema:
   *           type: string
   *           default: "1"
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: string
   *           default: "50"
   *         description: Items per page
   *       - in: query
   *         name: sort
   *         schema:
   *           type: string
   *           enum: [name, category, verificationStatus, qualityScore, createdAt, updatedAt]
   *         description: Sort field
   *       - in: query
   *         name: order
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: "desc"
   *         description: Sort order
   *     responses:
   *       200:
   *         description: Terms retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/AdminTerm'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: number
   *                     limit:
   *                       type: number
   *                     total:
   *                       type: number
   *                     pages:
   *                       type: number
   *       403:
   *         description: Admin privileges required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get(
    '/api/admin/terms',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: any, res) => {
      try {
        const _userId = req.user.id;

        const {
          search = '',
          category = '',
          verificationStatus = 'all',
          aiGenerated = 'all',
          qualityRange = '',
          minQuality = '0',
          maxQuality = '100',
          page = '1',
          limit = '50',
          sort = 'updatedAt',
          order = 'desc',
        } = req.query;

        // Build query conditions
        const conditions = [];

        if (search) {
          conditions.push(
            or(
              like(enhancedTerms.name, `%${search}%`),
              like(enhancedTerms.shortDefinition, `%${search}%`),
              like(enhancedTerms.definition, `%${search}%`)
            )
          );
        }

        if (category && category !== 'all') {
          conditions.push(eq(enhancedTerms.category, category));
        }

        if (verificationStatus && verificationStatus !== 'all') {
          // Join with verification table if needed
          if (verificationStatus === 'verified') {
            conditions.push(eq(enhancedTerms.verificationStatus, 'verified'));
          } else if (verificationStatus === 'unverified') {
            conditions.push(eq(enhancedTerms.verificationStatus, 'unverified'));
          } else if (verificationStatus === 'flagged') {
            conditions.push(eq(enhancedTerms.verificationStatus, 'flagged'));
          }
        }

        if (aiGenerated && aiGenerated !== 'all') {
          conditions.push(eq(enhancedTerms.aiGenerated, aiGenerated === 'true'));
        }

        // Quality score filtering
        if (minQuality !== '0' || maxQuality !== '100') {
          conditions.push(
            and(
              gte(enhancedTerms.qualityScore, parseInt(minQuality)),
              lte(enhancedTerms.qualityScore, parseInt(maxQuality))
            )
          );
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // Sort configuration
        const sortField =
          sort === 'name'
            ? enhancedTerms.name
            : sort === 'category'
              ? enhancedTerms.category
              : sort === 'verificationStatus'
                ? enhancedTerms.verificationStatus
                : sort === 'qualityScore'
                  ? enhancedTerms.qualityScore
                  : sort === 'createdAt'
                    ? enhancedTerms.createdAt
                    : enhancedTerms.updatedAt;

        const orderBy = order === 'asc' ? asc(sortField) : desc(sortField);

        // Get total count
        const [{ total }] = await db
          .select({ total: count() })
          .from(enhancedTerms)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

        // Get terms with enhanced data
        const terms = await db
          .select({
            id: enhancedTerms.id,
            name: enhancedTerms.name,
            shortDefinition: enhancedTerms.shortDefinition,
            definition: enhancedTerms.definition,
            category: enhancedTerms.category,
            subcategory: enhancedTerms.subcategory,
            characteristics: enhancedTerms.characteristics,
            applications: enhancedTerms.applications,
            mathFormulation: enhancedTerms.mathFormulation,
            relatedTerms: enhancedTerms.relatedTerms,
            aiGenerated: enhancedTerms.aiGenerated,
            verificationStatus: enhancedTerms.verificationStatus,
            qualityScore: enhancedTerms.qualityScore,
            createdAt: enhancedTerms.createdAt,
            updatedAt: enhancedTerms.updatedAt,
            // Additional admin fields
            createdBy: enhancedTerms.createdBy,
            updatedBy: enhancedTerms.updatedBy,
            reviewCount: enhancedTerms.reviewCount,
            averageRating: enhancedTerms.averageRating,
          })
          .from(enhancedTerms)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(orderBy)
          .limit(limitNum)
          .offset(offset);

        res.json({
          success: true,
          data: terms,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: Number(total),
            pages: Math.ceil(Number(total) / limitNum),
          },
        });
      } catch (error) {
        logger.error('Error fetching admin terms:', {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({
          success: false,
          error: 'Failed to fetch terms',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/admin/terms/bulk-update:
   *   post:
   *     tags:
   *       - Admin Terms
   *     summary: Bulk update terms
   *     description: Update multiple terms in a single operation with comprehensive data changes
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               changes:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     name:
   *                       type: string
   *                     shortDefinition:
   *                       type: string
   *                     definition:
   *                       type: string
   *                     category:
   *                       type: string
   *                     subcategory:
   *                       type: string
   *                     characteristics:
   *                       type: array
   *                       items:
   *                         type: string
   *                     applications:
   *                       type: array
   *                       items:
   *                         type: object
   *                     mathFormulation:
   *                       type: string
   *                     relatedTerms:
   *                       type: array
   *                       items:
   *                         type: string
   *                     verificationStatus:
   *                       type: string
   *                       enum: [verified, unverified, flagged]
   *                   required:
   *                     - id
   *               example:
   *                 changes:
   *                   - id: "term123"
   *                     name: "Updated Term Name"
   *                     verificationStatus: "verified"
   *     responses:
   *       200:
   *         description: Terms updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Successfully updated 5 terms"
   *                 updatedCount:
   *                   type: number
   *                   example: 5
   *       400:
   *         description: Invalid request - changes array required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Admin privileges required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.post(
    '/api/admin/terms/bulk-update',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: any, res) => {
      try {
        const userId = req.user.id;

        const { changes } = req.body;

        if (!Array.isArray(changes) || changes.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Changes array is required',
          });
        }

        let updatedCount = 0;

        // Process each update
        for (const change of changes) {
          const {
            id,
            name,
            shortDefinition,
            definition,
            category,
            subcategory,
            characteristics,
            applications,
            mathFormulation,
            relatedTerms,
            verificationStatus,
          } = change;

          await db
            .update(enhancedTerms)
            .set({
              name,
              shortDefinition,
              definition,
              category,
              subcategory,
              characteristics,
              applications,
              mathFormulation,
              relatedTerms,
              verificationStatus,
              updatedBy: userId,
              updatedAt: new Date(),
            })
            .where(eq(enhancedTerms.id, id));

          updatedCount++;
        }

        logger.info(`Bulk updated ${updatedCount} terms by user ${userId}`);

        res.json({
          success: true,
          message: `Successfully updated ${updatedCount} terms`,
          updatedCount,
        });
      } catch (error) {
        logger.error('Error in bulk update:', {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({
          success: false,
          error: 'Failed to update terms',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/admin/terms/bulk-verify:
   *   post:
   *     tags:
   *       - Admin Terms
   *     summary: Bulk verification status update
   *     description: Update verification status for multiple terms simultaneously
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               termIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of term IDs to update
   *               verified:
   *                 type: boolean
   *                 description: Whether to mark terms as verified or unverified
   *             required:
   *               - termIds
   *               - verified
   *             example:
   *               termIds: ["term123", "term456", "term789"]
   *               verified: true
   *     responses:
   *       200:
   *         description: Verification status updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Successfully marked 3 terms as verified"
   *                 updatedCount:
   *                   type: number
   *                   example: 3
   *       400:
   *         description: Invalid request - term IDs array required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Admin privileges required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.post(
    '/api/admin/terms/bulk-verify',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: any, res) => {
      try {
        const userId = req.user.id;

        const { termIds, verified } = req.body;

        if (!Array.isArray(termIds) || termIds.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Term IDs array is required',
          });
        }

        const newStatus = verified ? 'verified' : 'unverified';

        // Update verification status for all selected terms
        await db
          .update(enhancedTerms)
          .set({
            verificationStatus: newStatus,
            updatedBy: userId,
            updatedAt: new Date(),
          })
          .where(or(...termIds.map((id: string) => eq(enhancedTerms.id, id))));

        logger.info(`Bulk ${newStatus} ${termIds.length} terms by user ${userId}`);

        res.json({
          success: true,
          message: `Successfully marked ${termIds.length} terms as ${newStatus}`,
          updatedCount: termIds.length,
        });
      } catch (error) {
        logger.error('Error in bulk verification:', {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({
          success: false,
          error: 'Failed to update verification status',
        });
      }
    }
  );

  // AI-powered term quality analysis
  app.post(
    '/api/admin/terms/quality-analysis',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: any, res) => {
      try {
        const _userId = req.user.id;

        const { termIds } = req.body;

        if (!Array.isArray(termIds) || termIds.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Term IDs array is required',
          });
        }

        // Get terms for analysis
        const terms = await db
          .select()
          .from(enhancedTerms)
          .where(or(...termIds.map((id: string) => eq(enhancedTerms.id, id))));

        const analysisResults = [];

        for (const term of terms) {
          try {
            // Analyze term quality using AI
            const qualityAnalysis = await analyzeTermQuality(term);

            // Update quality score
            await db
              .update(enhancedTerms)
              .set({
                qualityScore: qualityAnalysis.score,
                updatedAt: new Date(),
              })
              .where(eq(enhancedTerms.id, term.id));

            analysisResults.push({
              termId: term.id,
              termName: term.name,
              qualityScore: qualityAnalysis.score,
              issues: qualityAnalysis.issues,
              suggestions: qualityAnalysis.suggestions,
            });
          } catch (error) {
            logger.error(`Error analyzing term ${term.id}:`, {
              error: error instanceof Error ? error.message : String(error),
            });
            analysisResults.push({
              termId: term.id,
              termName: term.name,
              error: 'Analysis failed',
            });
          }
        }

        res.json({
          success: true,
          data: analysisResults,
        });
      } catch (error) {
        logger.error('Error in quality analysis:', {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({
          success: false,
          error: 'Failed to analyze term quality',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/admin/terms/analytics:
   *   get:
   *     tags:
   *       - Admin Terms
   *     summary: Get term analytics and insights
   *     description: Retrieve comprehensive analytics and insights about terms including statistics, breakdowns, and trends
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Analytics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     overview:
   *                       type: object
   *                       properties:
   *                         totalTerms:
   *                           type: number
   *                           example: 1250
   *                         aiGenerated:
   *                           type: number
   *                           example: 450
   *                         verified:
   *                           type: number
   *                           example: 800
   *                         unverified:
   *                           type: number
   *                           example: 350
   *                         flagged:
   *                           type: number
   *                           example: 100
   *                         highQuality:
   *                           type: number
   *                           example: 500
   *                         mediumQuality:
   *                           type: number
   *                           example: 600
   *                         lowQuality:
   *                           type: number
   *                           example: 150
   *                         avgQualityScore:
   *                           type: number
   *                           example: 72.5
   *                         avgRating:
   *                           type: number
   *                           example: 4.2
   *                     categoryBreakdown:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           category:
   *                             type: string
   *                           count:
   *                             type: number
   *                           aiGenerated:
   *                             type: number
   *                           verified:
   *                             type: number
   *                           avgQuality:
   *                             type: number
   *                     recentActivity:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           name:
   *                             type: string
   *                           category:
   *                             type: string
   *                           aiGenerated:
   *                             type: boolean
   *                           verificationStatus:
   *                             type: string
   *                           qualityScore:
   *                             type: number
   *                           createdAt:
   *                             type: string
   *                             format: date-time
   *                           updatedAt:
   *                             type: string
   *                             format: date-time
   *       403:
   *         description: Admin privileges required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get(
    '/api/admin/terms/analytics',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: any, res) => {
      try {
        const _userId = req.user.id;

        // Get comprehensive term analytics
        const [totalStats] = await db
          .select({
            totalTerms: count(),
            aiGenerated: sql<number>`count(*) filter (where ${enhancedTerms.aiGenerated} = true)`,
            verified: sql<number>`count(*) filter (where ${enhancedTerms.verificationStatus} = 'verified')`,
            unverified: sql<number>`count(*) filter (where ${enhancedTerms.verificationStatus} = 'unverified')`,
            flagged: sql<number>`count(*) filter (where ${enhancedTerms.verificationStatus} = 'flagged')`,
            highQuality: sql<number>`count(*) filter (where ${enhancedTerms.qualityScore} >= 80)`,
            mediumQuality: sql<number>`count(*) filter (where ${enhancedTerms.qualityScore} >= 60 and ${enhancedTerms.qualityScore} < 80)`,
            lowQuality: sql<number>`count(*) filter (where ${enhancedTerms.qualityScore} < 60)`,
            avgQualityScore: sql<number>`avg(${enhancedTerms.qualityScore})`,
            avgRating: sql<number>`avg(${enhancedTerms.averageRating})`,
          })
          .from(enhancedTerms);

        // Get category breakdown
        const categoryStats = await db
          .select({
            category: enhancedTerms.category,
            count: count(),
            aiGenerated: sql<number>`count(*) filter (where ${enhancedTerms.aiGenerated} = true)`,
            verified: sql<number>`count(*) filter (where ${enhancedTerms.verificationStatus} = 'verified')`,
            avgQuality: sql<number>`avg(${enhancedTerms.qualityScore})`,
          })
          .from(enhancedTerms)
          .groupBy(enhancedTerms.category)
          .orderBy(desc(count()));

        // Get recent activity
        const recentTerms = await db
          .select({
            id: enhancedTerms.id,
            name: enhancedTerms.name,
            category: enhancedTerms.category,
            aiGenerated: enhancedTerms.aiGenerated,
            verificationStatus: enhancedTerms.verificationStatus,
            qualityScore: enhancedTerms.qualityScore,
            createdAt: enhancedTerms.createdAt,
            updatedAt: enhancedTerms.updatedAt,
          })
          .from(enhancedTerms)
          .orderBy(desc(enhancedTerms.updatedAt))
          .limit(10);

        res.json({
          success: true,
          data: {
            overview: {
              totalTerms: Number(totalStats.totalTerms),
              aiGenerated: Number(totalStats.aiGenerated),
              verified: Number(totalStats.verified),
              unverified: Number(totalStats.unverified),
              flagged: Number(totalStats.flagged),
              highQuality: Number(totalStats.highQuality),
              mediumQuality: Number(totalStats.mediumQuality),
              lowQuality: Number(totalStats.lowQuality),
              avgQualityScore: Math.round(Number(totalStats.avgQualityScore || 0) * 10) / 10,
              avgRating: Math.round(Number(totalStats.avgRating || 0) * 10) / 10,
            },
            categoryBreakdown: categoryStats.map((cat) => ({
              category: cat.category,
              count: Number(cat.count),
              aiGenerated: Number(cat.aiGenerated),
              verified: Number(cat.verified),
              avgQuality: Math.round(Number(cat.avgQuality || 0) * 10) / 10,
            })),
            recentActivity: recentTerms,
          },
        });
      } catch (error) {
        logger.error('Error fetching term analytics:', {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({
          success: false,
          error: 'Failed to fetch analytics',
        });
      }
    }
  );

  // Export terms for external editing
  app.get(
    '/api/admin/terms/export',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: any, res) => {
      try {
        const _userId = req.user.id;

        const { format = 'csv', category = '', status = '' } = req.query;

        // Build query conditions
        const conditions = [];
        if (category && category !== 'all') {
          conditions.push(eq(enhancedTerms.category, category));
        }
        if (status && status !== 'all') {
          conditions.push(eq(enhancedTerms.verificationStatus, status));
        }

        // Get terms for export
        const terms = await db
          .select()
          .from(enhancedTerms)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(enhancedTerms.name);

        if (format === 'csv') {
          // Generate CSV
          const csvHeaders = [
            'ID',
            'Name',
            'Short Definition',
            'Definition',
            'Category',
            'Subcategory',
            'Characteristics',
            'Applications',
            'Math Formulation',
            'Related Terms',
            'AI Generated',
            'Verification Status',
            'Quality Score',
            'Created At',
            'Updated At',
          ];

          const csvRows = terms.map((term) => [
            term.id,
            `"${term.name}"`,
            `"${term.shortDefinition || ''}"`,
            `"${term.definition || ''}"`,
            `"${term.category || ''}"`,
            `"${term.subcategory || ''}"`,
            `"${Array.isArray(term.characteristics) ? term.characteristics.join('; ') : ''}"`,
            `"${Array.isArray(term.applications) ? term.applications.map((app: any) => `${app.name}: ${app.description}`).join('; ') : ''}"`,
            `"${term.mathFormulation || ''}"`,
            `"${Array.isArray(term.relatedTerms) ? term.relatedTerms.join('; ') : ''}"`,
            term.aiGenerated ? 'Yes' : 'No',
            term.verificationStatus || '',
            term.qualityScore || '',
            term.createdAt?.toISOString() || '',
            term.updatedAt?.toISOString() || '',
          ]);

          const csvContent = [csvHeaders.join(','), ...csvRows.map((row) => row.join(','))].join(
            '\n'
          );

          res.setHeader('Content-Type', 'text/csv');
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="terms-export-${new Date().toISOString().split('T')[0]}.csv"`
          );
          res.send(csvContent);
        } else {
          // Return JSON
          res.json({
            success: true,
            data: terms,
            exportedAt: new Date().toISOString(),
            totalCount: terms.length,
          });
        }
      } catch (error) {
        logger.error('Error exporting terms:', {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({
          success: false,
          error: 'Failed to export terms',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/admin/terms/create-single:
   *   post:
   *     tags:
   *       - Admin Terms
   *     summary: Create single term with AI assistance
   *     description: Create a new term with optional AI-powered content generation for enhanced definitions and metadata
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: The name of the term
   *               shortDefinition:
   *                 type: string
   *                 description: A brief definition of the term
   *               definition:
   *                 type: string
   *                 description: A detailed definition of the term
   *               category:
   *                 type: string
   *                 description: The category the term belongs to
   *               useAI:
   *                 type: boolean
   *                 description: Whether to use AI for content generation
   *                 default: false
   *             required:
   *               - name
   *               - category
   *             example:
   *               name: "Neural Network"
   *               category: "Machine Learning"
   *               useAI: true
   *     responses:
   *       200:
   *         description: Term created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   description: The created term with all generated content
   *                   additionalProperties: true
   *                 message:
   *                   type: string
   *                   example: "Successfully created term \"Neural Network\" with AI enhancement"
   *       400:
   *         description: Invalid request - name and category required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Admin privileges required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.post(
    '/api/admin/terms/create-single',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: any, res) => {
      try {
        const userId = req.user.id;

        const { name, shortDefinition, definition, category, useAI } = req.body;

        if (!name || !category) {
          return res.status(400).json({
            success: false,
            error: 'Name and category are required',
          });
        }

        // Generate a unique ID for the term
        const termId = `term_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create base term object
        let termData: any = {
          id: termId,
          name,
          shortDefinition: shortDefinition || `A concise definition of ${name}`,
          definition: definition || `${name} is a term in ${category} that...`,
          category,
          subcategory: '',
          characteristics: [],
          applications: [],
          advantages: [],
          disadvantages: [],
          examples: [],
          prerequisites: [],
          mathFormulation: '',
          relatedTerms: [],
          aiGenerated: useAI,
          verificationStatus: 'unverified',
          qualityScore: 50,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // If AI is enabled, generate additional content
        if (useAI) {
          try {
            logger.info(`Generating AI content for term: ${name}`);

            // Generate comprehensive content using AI
            const aiContent = await aiService.generateTermContent(name, category, {
              definition: definition || undefined,
              shortDefinition: shortDefinition || undefined,
              sections: [
                'definition',
                'examples',
                'applications',
                'advantages',
                'disadvantages',
                'prerequisites',
                'characteristics',
                'related_terms',
              ],
            });

            // Merge AI content with base term
            if (aiContent) {
              termData = {
                ...termData,
                definition: aiContent.definition || termData.definition,
                shortDefinition: aiContent.shortDefinition || termData.shortDefinition,
                examples: aiContent.examples || [],
                applications: aiContent.applications || [],
                advantages: aiContent.advantages || [],
                disadvantages: aiContent.disadvantages || [],
                prerequisites: aiContent.prerequisites || [],
                characteristics: aiContent.characteristics || [],
                relatedTerms: aiContent.relatedTerms || [],
                qualityScore: 75, // Higher quality score for AI-enhanced content
              };
            }
          } catch (aiError) {
            logger.error('Error generating AI content:', {
              error: aiError instanceof Error ? aiError.message : String(aiError),
            });
            // Continue with basic term creation even if AI fails
          }
        }

        // Insert the term into database
        await db.insert(enhancedTerms).values(termData);

        logger.info(`Created single term: ${name} (${termId}) by user ${userId}`);

        res.json({
          success: true,
          data: termData,
          message: `Successfully created term "${name}"${useAI ? ' with AI enhancement' : ''}`,
        });
      } catch (error) {
        logger.error('Error creating single term:', {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({
          success: false,
          error: 'Failed to create term',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/admin/terms/{termId}:
   *   delete:
   *     tags:
   *       - Admin Terms
   *     summary: Delete term
   *     description: Permanently delete a term from the system
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: termId
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the term to delete
   *     responses:
   *       200:
   *         description: Term deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Term deleted successfully"
   *       403:
   *         description: Admin privileges required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.delete(
    '/api/admin/terms/:termId',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: any, res) => {
      try {
        const userId = req.user.id;

        const { termId } = req.params;

        await db.delete(enhancedTerms).where(eq(enhancedTerms.id, termId));

        logger.info(`Deleted term ${termId} by user ${userId}`);

        res.json({
          success: true,
          message: 'Term deleted successfully',
        });
      } catch (error) {
        logger.error('Error deleting term:', {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({
          success: false,
          error: 'Failed to delete term',
        });
      }
    }
  );
}

// Helper function to analyze term quality
async function analyzeTermQuality(
  term: any
): Promise<{ score: number; issues: string[]; suggestions: string[] }> {
  const issues = [];
  const suggestions = [];
  let score = 100;

  // Check definition length
  if (!term.definition || term.definition.length < 50) {
    issues.push('Definition too short');
    suggestions.push('Expand the definition with more detailed explanation');
    score -= 20;
  }

  // Check short definition
  if (!term.shortDefinition || term.shortDefinition.length < 10) {
    issues.push('Short definition missing or too brief');
    suggestions.push('Add a concise short definition');
    score -= 15;
  }

  // Check characteristics
  if (!term.characteristics || term.characteristics.length === 0) {
    issues.push('No key characteristics listed');
    suggestions.push('Add key characteristics of this term');
    score -= 10;
  }

  // Check applications
  if (!term.applications || term.applications.length === 0) {
    issues.push('No applications or use cases provided');
    suggestions.push('Add practical applications or use cases');
    score -= 10;
  }

  // Check for AI-generated content that needs verification
  if (term.aiGenerated && term.verificationStatus !== 'verified') {
    issues.push('AI-generated content needs expert verification');
    suggestions.push('Review and verify AI-generated content for accuracy');
    score -= 5;
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  return { score, issues, suggestions };
}
