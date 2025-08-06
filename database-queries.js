/**
 * Database Query Functions for AIGlossaryPro API
 * 
 * This module provides database query functions that can be used to replace
 * sample data in simple-api.js with real PostgreSQL data.
 * 
 * Prepared for easy integration without modifying simple-api.js directly.
 * 
 * Created: 2025-08-06
 */

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, desc, asc, ilike, and, sql } from 'drizzle-orm';
import * as schema from '@aiglossarypro/shared';

// Database connection setup
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

const db = drizzle({ client: pool, schema });

/**
 * Database Query Functions
 * These functions can be imported and used to replace sample data
 */

/**
 * Get all terms with pagination and filtering
 */
export async function getTermsFromDatabase(options = {}) {
  const {
    limit = 24,
    offset = 0,
    searchTerm = null,
    categoryId = null,
    sortBy = 'name',
    sortOrder = 'asc'
  } = options;

  try {
    let query = db
      .select({
        id: schema.terms.id,
        name: schema.terms.name,
        shortDefinition: schema.terms.shortDefinition,
        definition: schema.terms.definition,
        categoryId: schema.terms.categoryId,
        viewCount: schema.terms.viewCount,
        createdAt: schema.terms.createdAt,
        updatedAt: schema.terms.updatedAt,
        // Join category data
        category: {
          id: schema.categories.id,
          name: schema.categories.name
        }
      })
      .from(schema.terms)
      .leftJoin(schema.categories, eq(schema.terms.categoryId, schema.categories.id));

    // Add filters
    const conditions = [];
    
    if (searchTerm) {
      conditions.push(
        or(
          ilike(schema.terms.name, `%${searchTerm}%`),
          ilike(schema.terms.definition, `%${searchTerm}%`)
        )
      );
    }
    
    if (categoryId) {
      conditions.push(eq(schema.terms.categoryId, categoryId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Add sorting
    const sortColumn = schema.terms[sortBy] || schema.terms.name;
    query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

    // Add pagination
    query = query.limit(limit).offset(offset);

    const results = await query;
    
    // Get total count for pagination
    let countQuery = db
      .select({ count: sql`count(*)::int` })
      .from(schema.terms);

    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const totalResult = await countQuery;
    const total = totalResult[0]?.count || 0;

    return {
      terms: results.map(result => ({
        id: result.id,
        name: result.name,
        shortDefinition: result.shortDefinition,
        definition: result.definition,
        categoryId: result.categoryId,
        category: result.category?.name || null,
        viewCount: result.viewCount || 0,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      })),
      total
    };
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error(`Failed to fetch terms: ${error.message}`);
  }
}

/**
 * Get all categories with optional statistics
 */
export async function getCategoriesFromDatabase(options = {}) {
  const {
    limit = 100,
    offset = 0,
    includeTermCount = false,
    searchTerm = null
  } = options;

  try {
    let query;
    
    if (includeTermCount) {
      // Query with term count
      query = db
        .select({
          id: schema.categories.id,
          name: schema.categories.name,
          description: schema.categories.description,
          createdAt: schema.categories.createdAt,
          updatedAt: schema.categories.updatedAt,
          termCount: sql`count(${schema.terms.id})::int`.as('termCount')
        })
        .from(schema.categories)
        .leftJoin(schema.terms, eq(schema.categories.id, schema.terms.categoryId))
        .groupBy(schema.categories.id);
    } else {
      // Simple category query
      query = db
        .select({
          id: schema.categories.id,
          name: schema.categories.name,
          description: schema.categories.description,
          createdAt: schema.categories.createdAt,
          updatedAt: schema.categories.updatedAt
        })
        .from(schema.categories);
    }

    // Add search filter
    if (searchTerm) {
      query = query.where(
        or(
          ilike(schema.categories.name, `%${searchTerm}%`),
          ilike(schema.categories.description, `%${searchTerm}%`)
        )
      );
    }

    // Add ordering and pagination
    query = query.orderBy(asc(schema.categories.name)).limit(limit).offset(offset);

    const results = await query;

    // Get total count
    let countQuery = db
      .select({ count: sql`count(*)::int` })
      .from(schema.categories);

    if (searchTerm) {
      countQuery = countQuery.where(
        or(
          ilike(schema.categories.name, `%${searchTerm}%`),
          ilike(schema.categories.description, `%${searchTerm}%`)
        )
      );
    }

    const totalResult = await countQuery;
    const total = totalResult[0]?.count || 0;

    return {
      categories: results.map(result => ({
        id: result.id,
        name: result.name,
        description: result.description,
        termCount: result.termCount || 0,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      })),
      total
    };
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }
}

/**
 * Get a single term by ID
 */
export async function getTermById(id) {
  try {
    const result = await db
      .select({
        id: schema.terms.id,
        name: schema.terms.name,
        shortDefinition: schema.terms.shortDefinition,
        definition: schema.terms.definition,
        categoryId: schema.terms.categoryId,
        characteristics: schema.terms.characteristics,
        visualUrl: schema.terms.visualUrl,
        visualCaption: schema.terms.visualCaption,
        mathFormulation: schema.terms.mathFormulation,
        applications: schema.terms.applications,
        references: schema.terms.references,
        viewCount: schema.terms.viewCount,
        createdAt: schema.terms.createdAt,
        updatedAt: schema.terms.updatedAt,
        // Join category data
        category: {
          id: schema.categories.id,
          name: schema.categories.name
        }
      })
      .from(schema.terms)
      .leftJoin(schema.categories, eq(schema.terms.categoryId, schema.categories.id))
      .where(eq(schema.terms.id, id))
      .limit(1);

    if (!result.length) {
      return null;
    }

    const term = result[0];
    return {
      id: term.id,
      name: term.name,
      shortDefinition: term.shortDefinition,
      definition: term.definition,
      categoryId: term.categoryId,
      category: term.category?.name || null,
      characteristics: term.characteristics || [],
      visualUrl: term.visualUrl,
      visualCaption: term.visualCaption,
      mathFormulation: term.mathFormulation,
      applications: term.applications || {},
      references: term.references || [],
      viewCount: term.viewCount || 0,
      createdAt: term.createdAt,
      updatedAt: term.updatedAt
    };
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error(`Failed to fetch term: ${error.message}`);
  }
}

/**
 * Get a single category by ID
 */
export async function getCategoryById(id) {
  try {
    const result = await db
      .select({
        id: schema.categories.id,
        name: schema.categories.name,
        description: schema.categories.description,
        createdAt: schema.categories.createdAt,
        updatedAt: schema.categories.updatedAt
      })
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .limit(1);

    return result.length ? result[0] : null;
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error(`Failed to fetch category: ${error.message}`);
  }
}

/**
 * Get trending terms (based on view count)
 */
export async function getTrendingTerms(limit = 10) {
  try {
    const result = await db
      .select({
        id: schema.terms.id,
        name: schema.terms.name,
        shortDefinition: schema.terms.shortDefinition,
        definition: schema.terms.definition,
        categoryId: schema.terms.categoryId,
        viewCount: schema.terms.viewCount,
        createdAt: schema.terms.createdAt,
        // Join category data
        category: {
          id: schema.categories.id,
          name: schema.categories.name
        }
      })
      .from(schema.terms)
      .leftJoin(schema.categories, eq(schema.terms.categoryId, schema.categories.id))
      .orderBy(desc(schema.terms.viewCount))
      .limit(limit);

    return result.map(term => ({
      id: term.id,
      name: term.name,
      shortDefinition: term.shortDefinition,
      definition: term.definition,
      categoryId: term.categoryId,
      category: term.category?.name || null,
      viewCount: term.viewCount || 0,
      createdAt: term.createdAt
    }));
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error(`Failed to fetch trending terms: ${error.message}`);
  }
}

/**
 * Get recent terms (based on creation date)
 */
export async function getRecentTerms(limit = 10) {
  try {
    const result = await db
      .select({
        id: schema.terms.id,
        name: schema.terms.name,
        shortDefinition: schema.terms.shortDefinition,
        definition: schema.terms.definition,
        categoryId: schema.terms.categoryId,
        viewCount: schema.terms.viewCount,
        createdAt: schema.terms.createdAt,
        // Join category data
        category: {
          id: schema.categories.id,
          name: schema.categories.name
        }
      })
      .from(schema.terms)
      .leftJoin(schema.categories, eq(schema.terms.categoryId, schema.categories.id))
      .orderBy(desc(schema.terms.createdAt))
      .limit(limit);

    return result.map(term => ({
      id: term.id,
      name: term.name,
      shortDefinition: term.shortDefinition,
      definition: term.definition,
      categoryId: term.categoryId,
      category: term.category?.name || null,
      viewCount: term.viewCount || 0,
      createdAt: term.createdAt
    }));
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error(`Failed to fetch recent terms: ${error.message}`);
  }
}

/**
 * Search terms by query
 */
export async function searchTerms(searchQuery, options = {}) {
  const { limit = 20, offset = 0, categoryId = null } = options;

  try {
    let query = db
      .select({
        id: schema.terms.id,
        name: schema.terms.name,
        shortDefinition: schema.terms.shortDefinition,
        definition: schema.terms.definition,
        categoryId: schema.terms.categoryId,
        viewCount: schema.terms.viewCount,
        createdAt: schema.terms.createdAt,
        // Join category data
        category: {
          id: schema.categories.id,
          name: schema.categories.name
        }
      })
      .from(schema.terms)
      .leftJoin(schema.categories, eq(schema.terms.categoryId, schema.categories.id));

    // Add search conditions
    const conditions = [
      or(
        ilike(schema.terms.name, `%${searchQuery}%`),
        ilike(schema.terms.definition, `%${searchQuery}%`),
        ilike(schema.terms.shortDefinition, `%${searchQuery}%`)
      )
    ];

    if (categoryId) {
      conditions.push(eq(schema.terms.categoryId, categoryId));
    }

    query = query.where(and(...conditions));

    // Add ordering and pagination
    query = query.orderBy(desc(schema.terms.viewCount)).limit(limit).offset(offset);

    const results = await query;

    // Get total count for pagination
    let countQuery = db
      .select({ count: sql`count(*)::int` })
      .from(schema.terms)
      .where(and(...conditions));

    const totalResult = await countQuery;
    const total = totalResult[0]?.count || 0;

    return {
      data: results.map(result => ({
        id: result.id,
        name: result.name,
        shortDefinition: result.shortDefinition,
        definition: result.definition,
        categoryId: result.categoryId,
        category: result.category?.name || null,
        viewCount: result.viewCount || 0,
        createdAt: result.createdAt
      })),
      total
    };
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error(`Failed to search terms: ${error.message}`);
  }
}

/**
 * Test database connection
 */
export async function testDatabaseConnection() {
  try {
    const result = await db.select({ count: sql`1` }).limit(1);
    return { success: true, message: 'Database connection successful' };
  } catch (error) {
    return { 
      success: false, 
      message: `Database connection failed: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  try {
    const [termsCount, categoriesCount] = await Promise.all([
      db.select({ count: sql`count(*)::int` }).from(schema.terms),
      db.select({ count: sql`count(*)::int` }).from(schema.categories)
    ]);

    return {
      terms: termsCount[0]?.count || 0,
      categories: categoriesCount[0]?.count || 0,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to get database stats:', error);
    return {
      terms: 0,
      categories: 0,
      error: error.message,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Export default object with all functions
export default {
  getTermsFromDatabase,
  getCategoriesFromDatabase,
  getTermById,
  getCategoryById,
  getTrendingTerms,
  getRecentTerms,
  searchTerms,
  testDatabaseConnection,
  getDatabaseStats
};