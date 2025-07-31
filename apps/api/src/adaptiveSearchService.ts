/**
 * Adaptive Search Service for AIGlossaryPro
 *
 * This service implements intelligent query strategies based on query characteristics
 * to ensure consistent performance across all search types.
 */

import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { categories, terms } from '@aiglossarypro/shared/schema';
import { db } from '@aiglossarypro/database';
import { cached } from './middleware/queryCache';

import logger from './utils/logger';

interface SearchResult {
  id: string;
  name: string;
  definition?: string;
  shortDefinition?: string;
  characteristics?: any;
  references?: any;
  categoryId?: string;
  categoryName?: string;
  viewCount?: number;
  relevanceScore?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SearchStrategy {
  name: string;
  condition: any;
  relevanceScore: any;
  estimatedMatches?: number;
}

export interface AdaptiveSearchOptions {
  query: string;
  page?: number;
  limit?: number;
  category?: string;
  sort?: 'relevance' | 'name' | 'popularity' | 'recent';
  includeDefinition?: boolean;
}

/**
 * Analyzes query characteristics to determine the best search strategy
 */
async function analyzeQuery(query: string): Promise<{
  strategy: 'fts' | 'prefix' | 'exact' | 'trigram';
  estimatedMatches: number;
  isGeneric: boolean;
}> {
  const lowerQuery = query.trim().toLowerCase();

  // Quick heuristics for common generic terms
  const genericTerms = ['learning', 'data', 'model', 'algorithm', 'system', 'method', 'approach'];
  const isGeneric = genericTerms.some(term => lowerQuery.includes(term));

  // For very short queries, use prefix matching
  if (lowerQuery.length <= 3) {
    return { strategy: 'prefix', estimatedMatches: 100, isGeneric: false };
  }

  // For generic terms, estimate high match count
  if (isGeneric) {
    return { strategy: 'fts', estimatedMatches: 500, isGeneric: true };
  }

  // For specific terms, use trigram matching
  return { strategy: 'trigram', estimatedMatches: 50, isGeneric: false };
}

/**
 * High-performance adaptive search with intelligent strategy selection
 */
export async function adaptiveSearch(options: AdaptiveSearchOptions): Promise<unknown> {
  const startTime = Date.now();

  const {
    query,
    page = 1,
    limit = 20,
    category,
    sort = 'relevance',
    includeDefinition = false,
  } = options;

  const offset = (page - 1) * limit;
  const cacheKey = `adaptive-search:${query}:${page}:${limit}:${category || 'all'}:${sort}:${includeDefinition}`;

  try {
    return await cached(
      cacheKey,
      async () => {
        const searchQuery = query.trim();
        const queryAnalysis = await analyzeQuery(searchQuery);

        // Choose strategy based on query analysis
        let searchCondition: any;
        let relevanceScore: any;

        if (queryAnalysis.isGeneric && queryAnalysis.estimatedMatches > 200) {
          // For generic terms with many matches, use stricter matching
          // Strategy 1: Prioritize exact and prefix matches
          searchCondition = or(
            eq(sql`LOWER(${terms.name})`, searchQuery.toLowerCase()),
            ilike(terms.name, `${searchQuery}%`),
            sql`to_tsvector('english', ${terms.name}) @@ plainto_tsquery('english', ${searchQuery})`
          );

          relevanceScore = sql<number>`
            CASE 
              WHEN LOWER(${terms.name}) = ${searchQuery.toLowerCase()} THEN 100.0
              WHEN ${terms.name} ILIKE ${`${searchQuery}%`} THEN 50.0
              WHEN to_tsvector('english', ${terms.name}) @@ plainto_tsquery('english', ${searchQuery}) THEN 25.0
              ELSE 1.0
            END + (${terms.viewCount} * 0.1)
          `.as('relevance_score');
        } else if (queryAnalysis.strategy === 'fts') {
          // Use full-text search for medium complexity
          searchCondition = sql`
            to_tsvector('english', ${terms.name} || ' ' || COALESCE(${terms.shortDefinition}, '')) 
            @@ plainto_tsquery('english', ${searchQuery})
          `;

          relevanceScore = sql<number>`
            ts_rank(
              to_tsvector('english', ${terms.name} || ' ' || COALESCE(${terms.shortDefinition}, '')),
              plainto_tsquery('english', ${searchQuery})
            ) * 10.0 + (${terms.viewCount} * 0.01)
          `.as('relevance_score');
        } else {
          // Use trigram matching for specific terms
          searchCondition = or(
            ilike(terms.name, `%${searchQuery}%`),
            ilike(terms.shortDefinition, `%${searchQuery}%`)
          );

          relevanceScore = sql<number>`
            CASE 
              WHEN ${terms.name} ILIKE ${searchQuery} THEN 10.0
              WHEN ${terms.name} ILIKE ${`${searchQuery}%`} THEN 8.0
              WHEN ${terms.name} ILIKE ${`%${searchQuery}%`} THEN 6.0
              WHEN ${terms.shortDefinition} ILIKE ${`%${searchQuery}%`} THEN 4.0
              ELSE 1.0
            END + (${terms.viewCount} * 0.01)
          `.as('relevance_score');
        }

        // Build WHERE conditions
        const whereConditions = [searchCondition];

        if (category) {
          whereConditions.push(eq(categories.name, category));
        }

        // For generic queries, add a minimum relevance threshold
        if (queryAnalysis.isGeneric) {
          // This will be applied after the initial query
        }

        // Build select fields
        const selectFields: any = {
          id: terms.id,
          name: terms.name,
          shortDefinition: terms.shortDefinition,
          characteristics: terms.characteristics,
          references: terms.references,
          viewCount: terms.viewCount,
          createdAt: terms.createdAt,
          updatedAt: terms.updatedAt,
          categoryId: categories.id,
          categoryName: categories.name,
          relevanceScore,
        };

        if (includeDefinition) {
          selectFields.definition = terms.definition;
        }

        // For generic queries, use a two-phase approach
        let results;
        let total = 0;
        let hasMore = false;

        if (queryAnalysis.isGeneric && queryAnalysis.estimatedMatches > 200) {
          // Phase 1: Get top results with high relevance
          const topResults = await db
            .select(selectFields)
            .from(terms)
            .leftJoin(categories, eq(terms.categoryId, categories.id))
            .where(and(...whereConditions))
            .orderBy(desc(relevanceScore))
            .limit(limit * 3); // Get 3x limit to filter

          // Phase 2: Filter by minimum relevance score
          const minRelevance = 5.0;
          const filteredResults = topResults
            .filter((r: any) => Number(r.relevanceScore) >= minRelevance)
            .slice(offset, offset + limit + 1);

          results = filteredResults;
          hasMore = filteredResults.length > limit;
          if (hasMore) {results.pop();}

          total = Math.min(topResults.length, 100); // Cap total for performance
        } else {
          // Standard query for specific terms - build the complete query
          let mainQuery;
          const baseQuery = db
            .select(selectFields)
            .from(terms)
            .leftJoin(categories, eq(terms.categoryId, categories.id))
            .where(and(...whereConditions));

          // Apply sorting
          switch (sort) {
            case 'relevance':
              mainQuery = baseQuery.orderBy(desc(relevanceScore), desc(terms.viewCount));
              break;
            case 'name':
              mainQuery = baseQuery.orderBy(asc(terms.name));
              break;
            case 'popularity':
              mainQuery = baseQuery.orderBy(desc(terms.viewCount), desc(relevanceScore));
              break;
            case 'recent':
              mainQuery = baseQuery.orderBy(desc(terms.updatedAt));
              break;
            default:
              mainQuery = baseQuery.orderBy(desc(relevanceScore), desc(terms.viewCount));
              break;
          }

          results = await mainQuery.limit(limit + 1).offset(offset);

          hasMore = results.length > limit;
          if (hasMore) {results.pop();}
          total = (page - 1) * limit + results.length + (hasMore ? 1 : 0);
        }

        // Transform results
        const searchResults = results.map((result: SearchResult) => ({
          id: result.id,
          name: result.name,
          definition: result.definition || undefined,
          shortDefinition: result.shortDefinition || undefined,
          characteristics: result.characteristics || undefined,
          references: result.references || undefined,
          category: result.categoryId
            ? {
                id: result.categoryId,
                name: result.categoryName,
              }
            : undefined,
          viewCount: result.viewCount || 0,
          relevanceScore: Number(result.relevanceScore) || 0,
          createdAt: result.createdAt || new Date(),
          updatedAt: result.updatedAt || new Date(),
        }));

        const searchTime = Date.now() - startTime;
        const totalPages = Math.ceil(total / limit);

        return {
          results: searchResults,
          total,
          page,
          limit,
          totalPages,
          searchTime,
          query,
          hasMore,
          strategy: queryAnalysis.strategy,
          isGeneric: queryAnalysis.isGeneric,
        };
      },
      30 * 1000 // 30 seconds cache
    );
  } catch (error) {
    logger.error('Adaptive search error:', error);
    throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Pre-warm cache for common queries
 */
export async function preWarmSearchCache(): Promise<void> {
  const commonQueries = [
    'machine learning',
    'neural network',
    'deep learning',
    'artificial intelligence',
    'data science',
    'algorithm',
  ];

  logger.info('Pre-warming search cache...');

  for (const query of commonQueries) {
    try {
      await adaptiveSearch({ query, limit: 20 });
      logger.info(`✓ Cached: ${query}`);
    } catch (error) {
      logger.error(`✗ Failed to cache ${query}:`, error);
    }
  }
}

export { analyzeQuery };
