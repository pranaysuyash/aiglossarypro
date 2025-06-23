/**
 * Enhanced Search Service with Full-Text Search Capabilities
 * Provides advanced search features including fuzzy matching, ranking, and filtering
 */

import { db } from './db';
import { terms, categories, subcategories, termSubcategories } from '../shared/schema';
import { eq, and, or, sql, ilike, desc, asc } from 'drizzle-orm';

export interface SearchOptions {
  query: string;
  page?: number;
  limit?: number;
  category?: string;
  subcategory?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  sort?: 'relevance' | 'name' | 'popularity' | 'recent';
  fuzzy?: boolean; // Enable fuzzy/similarity search
  threshold?: number; // Similarity threshold for fuzzy search (0.0 - 1.0)
}

export interface SearchResult {
  id: string;
  name: string;
  definition?: string;
  shortDefinition?: string;
  difficulty: string;
  tags?: string[];
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  subcategories?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  viewCount: number;
  relevanceScore?: number;
  similarityScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  searchTime: number;
  suggestions?: string[];
}

export class EnhancedSearchService {
  
  /**
   * Perform advanced search with full-text search and ranking
   */
  async search(options: SearchOptions): Promise<SearchResponse> {
    const startTime = Date.now();
    const {
      query,
      page = 1,
      limit = 20,
      category,
      subcategory,
      difficulty,
      tags,
      sort = 'relevance',
      fuzzy = false,
      threshold = 0.3
    } = options;

    try {
      let searchQuery = db
        .select({
          id: terms.id,
          name: terms.name,
          definition: terms.definition,
          shortDefinition: terms.shortDefinition,
          difficulty: terms.difficulty,
          tags: terms.tags,
          viewCount: terms.viewCount,
          createdAt: terms.createdAt,
          updatedAt: terms.updatedAt,
          categoryId: categories.id,
          categoryName: categories.name,
          categorySlug: categories.slug,
          // Calculate relevance score using PostgreSQL full-text search
          relevanceScore: fuzzy 
            ? sql<number>`similarity(${query}, ${terms.name})`
            : sql<number>`ts_rank_cd(to_tsvector('english', ${terms.name} || ' ' || COALESCE(${terms.definition}, '') || ' ' || COALESCE(${terms.shortDefinition}, '')), plainto_tsquery('english', ${query}))`
        })
        .from(terms)
        .leftJoin(categories, eq(terms.categoryId, categories.id));

      // Build WHERE conditions
      const conditions: any[] = [];

      if (fuzzy) {
        // Use trigram similarity for fuzzy search
        conditions.push(
          sql`similarity(${query}, ${terms.name}) > ${threshold}`
        );
      } else {
        // Use full-text search
        conditions.push(
          sql`to_tsvector('english', ${terms.name} || ' ' || COALESCE(${terms.definition}, '') || ' ' || COALESCE(${terms.shortDefinition}, '')) 
              @@ plainto_tsquery('english', ${query})`
        );
      }

      // Add filters
      if (category) {
        conditions.push(eq(categories.slug, category));
      }

      if (difficulty) {
        conditions.push(eq(terms.difficulty, difficulty));
      }

      if (tags && tags.length > 0) {
        // Search for any of the specified tags
        const tagConditions = tags.map(tag => 
          sql`${terms.tags} ? ${tag}`
        );
        conditions.push(or(...tagConditions));
      }

      // Apply WHERE conditions
      if (conditions.length > 0) {
        searchQuery = searchQuery.where(and(...conditions));
      }

      // Apply sorting
      switch (sort) {
        case 'relevance':
          searchQuery = searchQuery.orderBy(
            desc(sql`relevance_score`),
            desc(terms.viewCount),
            asc(terms.name)
          );
          break;
        case 'name':
          searchQuery = searchQuery.orderBy(asc(terms.name));
          break;
        case 'popularity':
          searchQuery = searchQuery.orderBy(desc(terms.viewCount), asc(terms.name));
          break;
        case 'recent':
          searchQuery = searchQuery.orderBy(desc(terms.createdAt));
          break;
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      searchQuery = searchQuery.limit(limit).offset(offset);

      // Execute search
      const searchResults = await searchQuery;

      // Get total count for pagination
      const totalQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(terms)
        .leftJoin(categories, eq(terms.categoryId, categories.id));

      if (conditions.length > 0) {
        totalQuery.where(and(...conditions));
      }

      const [{ count: total }] = await totalQuery;

      // Fetch subcategories for each result
      const resultsWithSubcategories: SearchResult[] = [];
      
      for (const result of searchResults) {
        const subcategoriesQuery = await db
          .select({
            id: subcategories.id,
            name: subcategories.name,
            slug: subcategories.slug
          })
          .from(subcategories)
          .innerJoin(termSubcategories, eq(subcategories.id, termSubcategories.subcategoryId))
          .where(eq(termSubcategories.termId, result.id));

        resultsWithSubcategories.push({
          id: result.id,
          name: result.name,
          definition: result.definition || undefined,
          shortDefinition: result.shortDefinition || undefined,
          difficulty: result.difficulty || 'beginner',
          tags: result.tags,
          category: result.categoryId ? {
            id: result.categoryId,
            name: result.categoryName!,
            slug: result.categorySlug!
          } : undefined,
          subcategories: subcategoriesQuery,
          viewCount: result.viewCount,
          relevanceScore: result.relevanceScore,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt
        });
      }

      const searchTime = Date.now() - startTime;
      const totalPages = Math.ceil(total / limit);

      return {
        results: resultsWithSubcategories,
        total,
        page,
        limit,
        totalPages,
        searchTime,
        suggestions: fuzzy ? await this.generateSuggestions(query) : undefined
      };

    } catch (error) {
      console.error('Search error:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async getSuggestions(query: string, limit: number = 10): Promise<string[]> {
    if (query.length < 2) return [];

    try {
      const suggestions = await db
        .select({
          name: terms.name,
          similarity: sql<number>`similarity(${query}, ${terms.name})`
        })
        .from(terms)
        .where(sql`similarity(${query}, ${terms.name}) > 0.2`)
        .orderBy(desc(sql`similarity`))
        .limit(limit);

      return suggestions.map(s => s.name);
    } catch (error) {
      console.error('Suggestions error:', error);
      return [];
    }
  }

  /**
   * Generate search suggestions for fuzzy search
   */
  private async generateSuggestions(query: string): Promise<string[]> {
    try {
      const suggestions = await db
        .select({
          name: terms.name,
          similarity: sql<number>`similarity(${query}, ${terms.name})`
        })
        .from(terms)
        .where(sql`similarity(${query}, ${terms.name}) > 0.1`)
        .orderBy(desc(sql`similarity`))
        .limit(5);

      return suggestions
        .filter(s => s.similarity > 0.2)
        .map(s => s.name);
    } catch (error) {
      console.warn('Could not generate suggestions:', error);
      return [];
    }
  }

  /**
   * Search categories with full-text search
   */
  async searchCategories(query: string, limit: number = 10): Promise<any[]> {
    try {
      return await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          description: categories.description,
          relevanceScore: sql<number>`ts_rank_cd(to_tsvector('english', ${categories.name} || ' ' || COALESCE(${categories.description}, '')), plainto_tsquery('english', ${query}))`
        })
        .from(categories)
        .where(
          sql`to_tsvector('english', ${categories.name} || ' ' || COALESCE(${categories.description}, '')) @@ plainto_tsquery('english', ${query})`
        )
        .orderBy(desc(sql`relevance_score`))
        .limit(limit);
    } catch (error) {
      console.error('Category search error:', error);
      return [];
    }
  }

  /**
   * Get search analytics and performance metrics
   */
  async getSearchAnalytics(): Promise<any> {
    try {
      const [indexUsage] = await db.execute(sql`
        SELECT 
          indexname,
          idx_tup_read,
          idx_tup_fetch,
          idx_blks_read,
          idx_blks_hit
        FROM pg_stat_user_indexes 
        WHERE indexname LIKE '%search%' OR indexname LIKE '%trgm%' OR indexname LIKE '%fulltext%'
        ORDER BY idx_tup_read DESC
      `);

      const [tableStats] = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables 
        WHERE tablename IN ('terms', 'categories', 'subcategories')
      `);

      return {
        indexUsage: indexUsage.rows,
        tableStats: tableStats.rows,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Analytics error:', error);
      return null;
    }
  }
}

// Export singleton instance
export const enhancedSearchService = new EnhancedSearchService();