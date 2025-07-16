/**
 * Optimized Search Service for AIGlossaryPro
 *
 * This service addresses the 3.5+ second search performance issue by implementing:
 * 1. PostgreSQL Full-Text Search with proper indexes
 * 2. Optimized query structure with minimal overhead
 * 3. Intelligent caching strategy
 * 4. Consistent sub-second performance across all query types
 */

import { and, asc, desc, eq, gte, ilike, sql } from 'drizzle-orm';
import { categories, terms } from '../shared/schema';
import { db } from './db';
import { cached } from './middleware/queryCache';

export interface OptimizedSearchOptions {
  query: string;
  page?: number;
  limit?: number;
  category?: string;
  sort?: 'relevance' | 'name' | 'popularity' | 'recent';
  includeDefinition?: boolean;
}

export interface OptimizedSearchResult {
  id: string;
  name: string;
  definition?: string;
  shortDefinition?: string;
  characteristics?: string[];
  references?: string[];
  category?: {
    id: string;
    name: string;
  };
  viewCount: number;
  relevanceScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OptimizedSearchResponse {
  results: OptimizedSearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  searchTime: number;
  query: string;
  hasMore?: boolean;
}

/**
 * High-performance search using PostgreSQL Full-Text Search
 * This function ensures consistent sub-second performance for all query types
 */
export async function optimizedSearch(
  options: OptimizedSearchOptions
): Promise<OptimizedSearchResponse> {
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
  const cacheKey = `optimized-search:${query}:${page}:${limit}:${category || 'all'}:${sort}:${includeDefinition}`;

  try {
    return await cached(
      cacheKey,
      async () => {
        // 1. Build optimized search query using PostgreSQL Full-Text Search
        const searchQuery = query.trim();

        // Use PostgreSQL Full-Text Search that matches our database index
        // Index: terms_name_shortdef_fts_idx ON terms USING GIN (to_tsvector('english', name || ' ' || COALESCE(short_definition, '')))
        const ftsCondition = sql`to_tsvector('english', ${terms.name} || ' ' || COALESCE(${terms.shortDefinition}, '')) @@ plainto_tsquery('english', ${searchQuery})`;

        // 2. Build WHERE conditions using FTS
        const whereConditions = [ftsCondition];

        if (category) {
          whereConditions.push(eq(categories.name, category));
        }

        // 3. Use ts_rank for accurate relevance scoring
        const relevanceScore = sql<number>`
          ts_rank(
            to_tsvector('english', ${terms.name} || ' ' || COALESCE(${terms.shortDefinition}, '')),
            plainto_tsquery('english', ${searchQuery})
          ) + (${terms.viewCount} * 0.01)
        `.as('relevance_score');

        // 4. Build optimized select fields
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

        // Include full definition only if requested (saves bandwidth)
        if (includeDefinition) {
          selectFields.definition = terms.definition;
        }

        // 5. Skip expensive count query for better performance
        // Instead, estimate total from the first page and use hasMore logic
        let total = 0;
        let hasMore = false;

        // 6. Execute main search query with optimizations
        let mainQuery = db
          .select(selectFields)
          .from(terms)
          .leftJoin(categories, eq(terms.categoryId, categories.id))
          .where(and(...whereConditions));

        // 7. Apply sorting
        switch (sort) {
          case 'relevance':
            mainQuery = mainQuery.orderBy(desc(relevanceScore), desc(terms.viewCount));
            break;
          case 'name':
            mainQuery = mainQuery.orderBy(asc(terms.name));
            break;
          case 'popularity':
            mainQuery = mainQuery.orderBy(desc(terms.viewCount), desc(relevanceScore));
            break;
          case 'recent':
            mainQuery = mainQuery.orderBy(desc(terms.updatedAt));
            break;
        }

        // 8. Apply pagination and fetch one extra record to check if there are more
        const results = await mainQuery.limit(limit + 1).offset(offset);

        // 9. Determine if there are more results and calculate total
        if (results.length > limit) {
          hasMore = true;
          results.pop(); // Remove the extra record
          // Estimate total based on current page
          total = (page - 1) * limit + results.length + 1; // +1 because we know there's at least one more
        } else {
          hasMore = false;
          total = (page - 1) * limit + results.length;
        }

        // 10. Transform results
        const searchResults: OptimizedSearchResult[] = results.map((result: any) => ({
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
        const totalPages = hasMore ? Math.ceil(total / limit) + 1 : Math.ceil(total / limit);

        return {
          results: searchResults,
          total,
          page,
          limit,
          totalPages,
          searchTime,
          query,
          hasMore,
        };
      },
      30 * 1000 // 30 seconds cache for search results
    );
  } catch (error) {
    console.error('Optimized search error:', error);
    throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fast autocomplete suggestions using indexed prefix matching
 */
export async function optimizedSearchSuggestions(
  query: string,
  limit = 10
): Promise<string[]> {
  if (!query || query.length < 2) {
    return [];
  }

  const cacheKey = `search-suggestions:${query}:${limit}`;

  return await cached(
    cacheKey,
    async () => {
      // Use prefix index for fast autocomplete
      const results = await db
        .select({ name: terms.name })
        .from(terms)
        .where(ilike(terms.name, `${query}%`))
        .orderBy(desc(terms.viewCount), asc(terms.name))
        .limit(limit);

      return results.map(r => r.name);
    },
    5 * 60 * 1000 // 5 minutes cache for suggestions
  );
}

/**
 * Get trending/popular search terms
 */
export async function getPopularSearchTerms(limit = 10): Promise<OptimizedSearchResult[]> {
  return await cached(
    `popular-search-terms:${limit}`,
    async () => {
      const results = await db
        .select({
          id: terms.id,
          name: terms.name,
          shortDefinition: terms.shortDefinition,
          viewCount: terms.viewCount,
          createdAt: terms.createdAt,
          updatedAt: terms.updatedAt,
          categoryId: categories.id,
          categoryName: categories.name,
        })
        .from(terms)
        .leftJoin(categories, eq(terms.categoryId, categories.id))
        .where(gte(terms.viewCount, 1))
        .orderBy(desc(terms.viewCount))
        .limit(limit);

      return results.map((result: any) => ({
        id: result.id,
        name: result.name,
        shortDefinition: result.shortDefinition || undefined,
        category: result.categoryId
          ? {
              id: result.categoryId,
              name: result.categoryName,
            }
          : undefined,
        viewCount: result.viewCount || 0,
        relevanceScore: 0,
        createdAt: result.createdAt || new Date(),
        updatedAt: result.updatedAt || new Date(),
      }));
    },
    15 * 60 * 1000 // 15 minutes cache
  );
}

/**
 * Create database indexes for optimal search performance
 */
export async function createSearchIndexes(): Promise<void> {
  try {
    console.log('Creating optimized search indexes...');

    const indexQueries = [
      // Core FTS index that matches our query pattern
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_name_shortdef_fts_idx 
       ON terms USING GIN(to_tsvector('english', name || ' ' || COALESCE(short_definition, '')))`,

      // Prefix search indexes for autocomplete
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_name_prefix_idx 
       ON terms (name text_pattern_ops)`,

      // Performance indexes for sorting
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_view_count_idx 
       ON terms (view_count DESC)`,

      `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_updated_at_idx 
       ON terms (updated_at DESC)`,

      `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_category_view_count_idx 
       ON terms (category_id, view_count DESC)`,

      // Composite search index
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_search_composite_idx 
       ON terms (category_id, view_count DESC, updated_at DESC)`,
    ];

    for (const indexQuery of indexQueries) {
      try {
        await db.execute(sql.raw(indexQuery));
        console.log(`✓ Created index: ${indexQuery.split(' ')[5]}`);
      } catch (error) {
        console.warn(
          `⚠ Index creation failed: ${error instanceof Error ? error.message : 'Unknown'}`
        );
      }
    }

    console.log('✅ Search indexes creation completed');
  } catch (error) {
    console.error('Failed to create search indexes:', error);
    throw error;
  }
}
