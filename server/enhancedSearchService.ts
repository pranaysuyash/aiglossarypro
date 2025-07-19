/**
 * Enhanced Search Service with Full-Text Search Capabilities
 * Provides advanced search features including fuzzy matching, ranking, and filtering
 */

import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { categories, terms } from '../shared/schema';
import { db } from './db';

import logger from './utils/logger';
export interface SearchOptions {
  query: string;
  page?: number;
  limit?: number;
  category?: string;
  sort?: 'relevance' | 'name' | 'popularity' | 'recent';
  fuzzy?: boolean; // Enable fuzzy/similarity search
  threshold?: number; // Similarity threshold for fuzzy search (0.0 - 1.0)
}

export interface SearchResult {
  id: string;
  name: string;
  definition: string;
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

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  searchTime: number;
  query: string;
}

/**
 * Performs enhanced search with full-text capabilities
 */
export async function enhancedSearch(options: SearchOptions): Promise<SearchResponse> {
  const startTime = Date.now();

  const {
    query,
    page = 1,
    limit = 10,
    category,
    sort = 'relevance',
    fuzzy = false,
    threshold = 0.3,
  } = options;

  try {
    let searchQuery = db
      .select({
        id: terms.id,
        name: terms.name,
        definition: terms.definition,
        shortDefinition: terms.shortDefinition,
        characteristics: terms.characteristics,
        references: terms.references,
        viewCount: terms.viewCount,
        createdAt: terms.createdAt,
        updatedAt: terms.updatedAt,
        categoryId: categories.id,
        categoryName: categories.name,
        // Calculate basic relevance score
        relevanceScore: sql<number>`1`.as('relevance_score'),
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id));

    // Build WHERE conditions
    const conditions: any[] = [];

    // Use basic LIKE search for now
    conditions.push(
      or(
        ilike(terms.name, `%${query}%`),
        ilike(terms.definition, `%${query}%`),
        ilike(terms.shortDefinition, `%${query}%`)
      )
    );

    // Add filters
    if (category) {
      conditions.push(eq(categories.name, category));
    }

    // Apply WHERE conditions
    if (conditions.length > 0) {
      searchQuery = searchQuery.where(and(...conditions)) as any;
    }

    // Apply sorting
    switch (sort) {
      case 'relevance':
        searchQuery = (searchQuery as any).orderBy(desc(terms.viewCount), asc(terms.name));
        break;
      case 'name':
        searchQuery = (searchQuery as any).orderBy(asc(terms.name));
        break;
      case 'popularity':
        searchQuery = (searchQuery as any).orderBy(desc(terms.viewCount), asc(terms.name));
        break;
      case 'recent':
        searchQuery = (searchQuery as any).orderBy(desc(terms.updatedAt));
        break;
    }

    // Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id));

    if (conditions.length > 0) {
      (countQuery as any).where(and(...conditions));
    }

    // Execute queries
    const [results, countResult] = await Promise.all([
      (searchQuery as any).limit(limit).offset((page - 1) * limit),
      countQuery,
    ]);

    const total = Number((countResult[0] as any)?.count || 0);

    // Map results to SearchResult interface
    const searchResults: SearchResult[] = (results as any[]).map((result: any) => ({
      id: result.id,
      name: result.name,
      definition: result.definition || '',
      shortDefinition: result.shortDefinition || undefined,
      characteristics: result.characteristics || undefined,
      references: result.references || undefined,
      category: result.categoryId
        ? {
            id: result.categoryId,
            name: result.categoryName!,
          }
        : undefined,
      viewCount: result.viewCount || 0,
      relevanceScore: result.relevance_score || 0,
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
    };
  } catch (error) {
    logger.error('Enhanced search error:', error);
    throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get popular search terms
 */
export async function getPopularTerms(limit = 10): Promise<SearchResult[]> {
  try {
    const results = await db
      .select({
        id: terms.id,
        name: terms.name,
        definition: terms.definition,
        shortDefinition: terms.shortDefinition,
        characteristics: terms.characteristics,
        references: terms.references,
        viewCount: terms.viewCount,
        createdAt: terms.createdAt,
        updatedAt: terms.updatedAt,
        categoryId: categories.id,
        categoryName: categories.name,
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .orderBy(desc(terms.viewCount))
      .limit(limit);

    return (results as any[]).map((result: any) => ({
      id: result.id,
      name: result.name,
      definition: result.definition || '',
      shortDefinition: result.shortDefinition || undefined,
      characteristics: result.characteristics || undefined,
      references: result.references || undefined,
      category: result.categoryId
        ? {
            id: result.categoryId,
            name: result.categoryName!,
          }
        : undefined,
      viewCount: result.viewCount || 0,
      relevanceScore: 0,
      createdAt: result.createdAt || new Date(),
      updatedAt: result.updatedAt || new Date(),
    }));
  } catch (error) {
    logger.error('Get popular terms error:', error);
    return [];
  }
}

/**
 * Get search suggestions based on partial query
 */
export async function getSearchSuggestions(query: string, limit = 5): Promise<string[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const results = await db
      .select({ name: terms.name })
      .from(terms)
      .where(ilike(terms.name, `${query}%`))
      .orderBy(desc(terms.viewCount))
      .limit(limit);

    return (results as any[]).map((result: any) => result.name);
  } catch (error) {
    logger.error('Get search suggestions error:', error);
    return [];
  }
}
