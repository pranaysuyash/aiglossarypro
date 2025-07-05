import type { Express } from "express";
import { db } from "../../db";
import { enhancedTerms, categories, aiContentVerification, users } from "../../../shared/enhancedSchema";
import { eq, and, or, like, gte, lte, desc, asc, sql, count } from "drizzle-orm";
import { mockIsAuthenticated } from "../../middleware/dev/mockAuth";
import { isUserAdmin } from "../../utils/authUtils";
import { log as logger } from "../../utils/logger";
import { aiService } from "../../aiService";

export function registerAdminTermsRoutes(app: Express): void {
  
  // Get terms with admin filters and enhanced data
  app.get('/api/admin/terms', mockIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const isAdmin = await isUserAdmin(userId);
      
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin privileges required'
        });
      }

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
        order = 'desc'
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
      const sortField = sort === 'name' ? enhancedTerms.name :
                       sort === 'category' ? enhancedTerms.category :
                       sort === 'verificationStatus' ? enhancedTerms.verificationStatus :
                       sort === 'qualityScore' ? enhancedTerms.qualityScore :
                       sort === 'createdAt' ? enhancedTerms.createdAt :
                       enhancedTerms.updatedAt;
      
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
          averageRating: enhancedTerms.averageRating
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
          pages: Math.ceil(Number(total) / limitNum)
        }
      });
    } catch (error) {
      logger.error('Error fetching admin terms:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch terms'
      });
    }
  });

  // Bulk update terms
  app.post('/api/admin/terms/bulk-update', mockIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const isAdmin = await isUserAdmin(userId);
      
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin privileges required'
        });
      }

      const { changes } = req.body;
      
      if (!Array.isArray(changes) || changes.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Changes array is required'
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
          verificationStatus
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
            updatedAt: new Date()
          })
          .where(eq(enhancedTerms.id, id));
        
        updatedCount++;
      }

      logger.info(`Bulk updated ${updatedCount} terms by user ${userId}`);
      
      res.json({
        success: true,
        message: `Successfully updated ${updatedCount} terms`,
        updatedCount
      });
    } catch (error) {
      logger.error('Error in bulk update:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Failed to update terms'
      });
    }
  });

  // Bulk verification status update
  app.post('/api/admin/terms/bulk-verify', mockIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const isAdmin = await isUserAdmin(userId);
      
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin privileges required'
        });
      }

      const { termIds, verified } = req.body;
      
      if (!Array.isArray(termIds) || termIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Term IDs array is required'
        });
      }

      const newStatus = verified ? 'verified' : 'unverified';
      
      // Update verification status for all selected terms
      await db
        .update(enhancedTerms)
        .set({
          verificationStatus: newStatus,
          updatedBy: userId,
          updatedAt: new Date()
        })
        .where(
          or(...termIds.map((id: string) => eq(enhancedTerms.id, id)))
        );

      logger.info(`Bulk ${newStatus} ${termIds.length} terms by user ${userId}`);
      
      res.json({
        success: true,
        message: `Successfully marked ${termIds.length} terms as ${newStatus}`,
        updatedCount: termIds.length
      });
    } catch (error) {
      logger.error('Error in bulk verification:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Failed to update verification status'
      });
    }
  });

  // AI-powered term quality analysis
  app.post('/api/admin/terms/quality-analysis', mockIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const isAdmin = await isUserAdmin(userId);
      
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin privileges required'
        });
      }

      const { termIds } = req.body;
      
      if (!Array.isArray(termIds) || termIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Term IDs array is required'
        });
      }

      // Get terms for analysis
      const terms = await db
        .select()
        .from(enhancedTerms)
        .where(
          or(...termIds.map((id: string) => eq(enhancedTerms.id, id)))
        );

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
              updatedAt: new Date()
            })
            .where(eq(enhancedTerms.id, term.id));
          
          analysisResults.push({
            termId: term.id,
            termName: term.name,
            qualityScore: qualityAnalysis.score,
            issues: qualityAnalysis.issues,
            suggestions: qualityAnalysis.suggestions
          });
        } catch (error) {
          logger.error(`Error analyzing term ${term.id}:`, { error: error instanceof Error ? error.message : String(error) });
          analysisResults.push({
            termId: term.id,
            termName: term.name,
            error: 'Analysis failed'
          });
        }
      }

      res.json({
        success: true,
        data: analysisResults
      });
    } catch (error) {
      logger.error('Error in quality analysis:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Failed to analyze term quality'
      });
    }
  });

  // Get term analytics and insights
  app.get('/api/admin/terms/analytics', mockIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const isAdmin = await isUserAdmin(userId);
      
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin privileges required'
        });
      }

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
          avgRating: sql<number>`avg(${enhancedTerms.averageRating})`
        })
        .from(enhancedTerms);

      // Get category breakdown
      const categoryStats = await db
        .select({
          category: enhancedTerms.category,
          count: count(),
          aiGenerated: sql<number>`count(*) filter (where ${enhancedTerms.aiGenerated} = true)`,
          verified: sql<number>`count(*) filter (where ${enhancedTerms.verificationStatus} = 'verified')`,
          avgQuality: sql<number>`avg(${enhancedTerms.qualityScore})`
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
          updatedAt: enhancedTerms.updatedAt
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
            avgRating: Math.round(Number(totalStats.avgRating || 0) * 10) / 10
          },
          categoryBreakdown: categoryStats.map(cat => ({
            category: cat.category,
            count: Number(cat.count),
            aiGenerated: Number(cat.aiGenerated),
            verified: Number(cat.verified),
            avgQuality: Math.round(Number(cat.avgQuality || 0) * 10) / 10
          })),
          recentActivity: recentTerms
        }
      });
    } catch (error) {
      logger.error('Error fetching term analytics:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch analytics'
      });
    }
  });

  // Export terms for external editing
  app.get('/api/admin/terms/export', mockIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const isAdmin = await isUserAdmin(userId);
      
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin privileges required'
        });
      }

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
          'ID', 'Name', 'Short Definition', 'Definition', 'Category', 'Subcategory',
          'Characteristics', 'Applications', 'Math Formulation', 'Related Terms',
          'AI Generated', 'Verification Status', 'Quality Score', 'Created At', 'Updated At'
        ];

        const csvRows = terms.map(term => [
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
          term.updatedAt?.toISOString() || ''
        ]);

        const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="terms-export-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else {
        // Return JSON
        res.json({
          success: true,
          data: terms,
          exportedAt: new Date().toISOString(),
          totalCount: terms.length
        });
      }
    } catch (error) {
      logger.error('Error exporting terms:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Failed to export terms'
      });
    }
  });
}

// Helper function to analyze term quality
async function analyzeTermQuality(term: any): Promise<{ score: number; issues: string[]; suggestions: string[] }> {
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