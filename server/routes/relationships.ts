import type { Express, Request, Response } from "express";
import { db } from "../db";
import { 
  terms, 
  categories, 
  subcategories,
  termSubcategories
} from "../../shared/schema";
import {
  enhancedTerms,
  termRelationships 
} from "../../shared/enhancedSchema";
import { eq, sql, and, or, inArray } from "drizzle-orm";
import { log as logger } from "../utils/logger";
import { validateInput } from "../middleware/security";
import { z } from "zod";
import type { ApiResponse } from "../../shared/types";

// Validation schemas
const termRelationshipQuerySchema = z.object({
  depth: z.string().regex(/^\d+$/).transform(Number).default("2"),
  types: z.string().optional(),
  minStrength: z.string().regex(/^\d+$/).transform(Number).optional(),
  includeCategories: z.string().transform(val => val === 'true').optional()
});

const bulkRelationshipQuerySchema = z.object({
  termIds: z.array(z.string().uuid()).min(1).max(50),
  depth: z.number().min(1).max(3).default(1)
});

interface GraphNode {
  id: string;
  name: string;
  type: 'term' | 'category' | 'subcategory' | 'concept';
  category?: string;
  subcategory?: string;
  definition?: string;
  level?: number;
  viewCount?: number;
  hasImplementation?: boolean;
  hasInteractiveElements?: boolean;
  difficultyLevel?: string;
}

interface GraphLink {
  source: string;
  target: string;
  type: 'prerequisite' | 'related' | 'extends' | 'alternative' | 'belongs_to';
  strength: number;
}

export function registerRelationshipRoutes(app: Express): void {
  /**
   * Get relationships for a specific term with depth traversal
   */
  app.get('/api/terms/:termId/relationships', 
    validateInput({ params: z.object({ termId: z.string().uuid() }) }),
    async (req: Request, res: Response) => {
      try {
        const { termId } = req.params;
        const { depth, types, minStrength, includeCategories } = termRelationshipQuerySchema.parse(req.query);
        
        const relationshipTypes = types ? types.split(',') : ['prerequisite', 'related', 'extends', 'alternative'];
        const strengthThreshold = minStrength || 0;

        // Get the central term
        const centralTerm = await db.query.terms.findFirst({
          where: eq(terms.id, termId),
          with: {
            category: true
          }
        });

        if (!centralTerm) {
          return res.status(404).json({
            success: false,
            error: "Term not found"
          });
        }

        const nodes: GraphNode[] = [];
        const links: GraphLink[] = [];
        const processedNodeIds = new Set<string>();
        const nodesToProcess: Array<{ id: string, level: number }> = [{ id: termId, level: 0 }];

        // Add central term as node
        nodes.push({
          id: centralTerm.id,
          name: centralTerm.name,
          type: 'term',
          category: centralTerm.category?.name,
          definition: centralTerm.shortDefinition || centralTerm.definition,
          level: 0,
          viewCount: centralTerm.viewCount
        });
        processedNodeIds.add(centralTerm.id);

        // Process relationships by depth
        while (nodesToProcess.length > 0) {
          const { id: currentTermId, level } = nodesToProcess.shift()!;
          
          if (level >= depth) continue;

          // Get relationships where current term is source
          const outgoingRelationships = await db.query.termRelationships.findMany({
            where: and(
              eq(termRelationships.fromTermId, currentTermId),
              inArray(termRelationships.relationshipType, relationshipTypes),
              sql`${termRelationships.strength} >= ${strengthThreshold}`
            )
          });

          // Get relationships where current term is target
          const incomingRelationships = await db.query.termRelationships.findMany({
            where: and(
              eq(termRelationships.toTermId, currentTermId),
              inArray(termRelationships.relationshipType, relationshipTypes),
              sql`${termRelationships.strength} >= ${strengthThreshold}`
            )
          });

          // Process outgoing relationships
          for (const rel of outgoingRelationships) {
            if (!processedNodeIds.has(rel.toTermId)) {
              const relatedTerm = await db.query.terms.findFirst({
                where: eq(terms.id, rel.toTermId),
                with: {
                  category: true
                }
              });

              if (relatedTerm) {
                nodes.push({
                  id: relatedTerm.id,
                  name: relatedTerm.name,
                  type: 'term',
                  category: relatedTerm.category?.name,
                  definition: relatedTerm.shortDefinition || relatedTerm.definition,
                  level: level + 1,
                  viewCount: relatedTerm.viewCount
                });
                processedNodeIds.add(relatedTerm.id);
                nodesToProcess.push({ id: relatedTerm.id, level: level + 1 });
              }
            }

            links.push({
              source: currentTermId,
              target: rel.toTermId,
              type: rel.relationshipType as GraphLink['type'],
              strength: rel.strength
            });
          }

          // Process incoming relationships
          for (const rel of incomingRelationships) {
            if (!processedNodeIds.has(rel.fromTermId)) {
              const relatedTerm = await db.query.terms.findFirst({
                where: eq(terms.id, rel.fromTermId),
                with: {
                  category: true
                }
              });

              if (relatedTerm) {
                nodes.push({
                  id: relatedTerm.id,
                  name: relatedTerm.name,
                  type: 'term',
                  category: relatedTerm.category?.name,
                  definition: relatedTerm.shortDefinition || relatedTerm.definition,
                  level: level + 1,
                  viewCount: relatedTerm.viewCount
                });
                processedNodeIds.add(relatedTerm.id);
                nodesToProcess.push({ id: relatedTerm.id, level: level + 1 });
              }
            }

            // For incoming relationships, we still add the link but in the correct direction
            links.push({
              source: rel.fromTermId,
              target: currentTermId,
              type: rel.relationshipType as GraphLink['type'],
              strength: rel.strength
            });
          }
        }

        // Include categories if requested
        let allCategories: string[] = [];
        let allSubcategories: string[] = [];
        
        if (includeCategories) {
          // Add category nodes and links
          const categoryIds = new Set(nodes.map(n => n.category).filter(Boolean));
          
          for (const categoryName of categoryIds) {
            const category = await db.query.categories.findFirst({
              where: eq(categories.name, categoryName)
            });
            
            if (category && !processedNodeIds.has(category.id)) {
              nodes.push({
                id: category.id,
                name: category.name,
                type: 'category',
                description: category.description
              });
              processedNodeIds.add(category.id);
            }
            
            // Add belongs_to links from terms to categories
            nodes.filter(n => n.type === 'term' && n.category === categoryName).forEach(termNode => {
              if (category) {
                links.push({
                  source: termNode.id,
                  target: category.id,
                  type: 'belongs_to',
                  strength: 10
                });
              }
            });
          }
        }

        // Get all unique categories and subcategories for filtering
        const categoriesResult = await db.query.categories.findMany();
        allCategories = categoriesResult.map(c => c.name);
        
        const subcategoriesResult = await db.query.subcategories.findMany();
        allSubcategories = subcategoriesResult.map(s => s.name);

        const response: ApiResponse<{
          nodes: GraphNode[];
          relationships: GraphLink[];
          categories: string[];
          subcategories: string[];
        }> = {
          success: true,
          data: {
            nodes,
            relationships: links,
            categories: allCategories,
            subcategories: allSubcategories
          }
        };

        res.json(response);
      } catch (error) {
        logger.error('Error fetching term relationships:', error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch term relationships"
        });
      }
    }
  );

  /**
   * Get bulk relationships for multiple terms (optimized for large graphs)
   */
  app.post('/api/relationships/bulk',
    validateInput({ body: bulkRelationshipQuerySchema }),
    async (req: Request, res: Response) => {
      try {
        const { termIds, depth } = req.body;

        // Fetch all terms
        const termsData = await db.query.terms.findMany({
          where: inArray(terms.id, termIds),
          with: {
            category: true
          }
        });

        if (termsData.length === 0) {
          return res.status(404).json({
            success: false,
            error: "No terms found"
          });
        }

        // Fetch all relationships between these terms
        const relationships = await db.query.termRelationships.findMany({
          where: or(
            and(
              inArray(termRelationships.fromTermId, termIds),
              inArray(termRelationships.toTermId, termIds)
            )
          )
        });

        // Convert to graph format
        const nodes: GraphNode[] = termsData.map(term => ({
          id: term.id,
          name: term.name,
          type: 'term',
          category: term.category?.name,
          definition: term.shortDefinition || term.definition,
          viewCount: term.viewCount
        }));

        const links: GraphLink[] = relationships.map(rel => ({
          source: rel.fromTermId,
          target: rel.toTermId,
          type: rel.relationshipType as GraphLink['type'],
          strength: rel.strength
        }));

        res.json({
          success: true,
          data: { nodes, relationships: links }
        });
      } catch (error) {
        logger.error('Error fetching bulk relationships:', error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch bulk relationships"
        });
      }
    }
  );

  /**
   * Get relationship statistics for analytics
   */
  app.get('/api/relationships/stats', async (req: Request, res: Response) => {
    try {
      // Get relationship type distribution
      const typeDistribution = await db
        .select({
          type: termRelationships.relationshipType,
          count: sql<number>`count(*)`.as('count')
        })
        .from(termRelationships)
        .groupBy(termRelationships.relationshipType);

      // Get most connected terms
      const mostConnected = await db
        .select({
          termId: terms.id,
          termName: terms.name,
          connectionCount: sql<number>`
            (SELECT COUNT(*) FROM ${termRelationships} 
             WHERE ${termRelationships.fromTermId} = ${terms.id} 
             OR ${termRelationships.toTermId} = ${terms.id})
          `.as('connectionCount')
        })
        .from(terms)
        .orderBy(sql`connectionCount DESC`)
        .limit(10);

      // Get relationship strength distribution
      const strengthDistribution = await db
        .select({
          strengthRange: sql<string>`
            CASE 
              WHEN ${termRelationships.strength} <= 3 THEN 'weak'
              WHEN ${termRelationships.strength} <= 7 THEN 'moderate'
              ELSE 'strong'
            END
          `.as('strengthRange'),
          count: sql<number>`count(*)`.as('count')
        })
        .from(termRelationships)
        .groupBy(sql`strengthRange`);

      res.json({
        success: true,
        data: {
          typeDistribution,
          mostConnected,
          strengthDistribution,
          totalRelationships: await db.select({ count: sql<number>`count(*)` }).from(termRelationships).then(r => r[0].count),
          totalTermsWithRelationships: await db.select({ 
            count: sql<number>`count(DISTINCT term_id)` 
          }).from(
            sql`(SELECT ${termRelationships.fromTermId} as term_id FROM ${termRelationships}
                 UNION
                 SELECT ${termRelationships.toTermId} as term_id FROM ${termRelationships}) as connected_terms`
          ).then(r => r[0].count)
        }
      });
    } catch (error) {
      logger.error('Error fetching relationship statistics:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch relationship statistics"
      });
    }
  });

  /**
   * Create or update term relationships
   */
  app.post('/api/terms/:termId/relationships',
    validateInput({
      params: z.object({ termId: z.string().uuid() }),
      body: z.object({
        relationships: z.array(z.object({
          toTermId: z.string().uuid(),
          type: z.enum(['prerequisite', 'related', 'extends', 'alternative']),
          strength: z.number().min(1).max(10)
        }))
      })
    }),
    async (req: Request, res: Response) => {
      try {
        const { termId } = req.params;
        const { relationships } = req.body;

        // Verify term exists
        const term = await db.query.terms.findFirst({
          where: eq(terms.id, termId)
        });

        if (!term) {
          return res.status(404).json({
            success: false,
            error: "Term not found"
          });
        }

        // Insert relationships
        const insertData = relationships.map(rel => ({
          fromTermId: termId,
          toTermId: rel.toTermId,
          relationshipType: rel.type,
          strength: rel.strength
        }));

        await db.insert(termRelationships).values(insertData).onConflictDoUpdate({
          target: [termRelationships.fromTermId, termRelationships.toTermId, termRelationships.relationshipType],
          set: {
            strength: sql`excluded.strength`
          }
        });

        res.json({
          success: true,
          data: { created: relationships.length }
        });
      } catch (error) {
        logger.error('Error creating term relationships:', error);
        res.status(500).json({
          success: false,
          error: "Failed to create term relationships"
        });
      }
    }
  );
}