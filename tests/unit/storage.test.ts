/**
 * Database Storage Operations Tests
 *
 * Tests the core database operations and optimized storage methods.
 * Covers CRUD operations, bulk operations, and performance optimizations.
 */

import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../../server/db';
import { OptimizedStorage } from '../../server/optimizedStorage';
import { storage } from '../../server/storage';
import { categories, favorites, terms, users } from '../../shared/schema';

const testUser = {
  id: 'storage-test-user',
  email: 'storage-test@example.com',
  firstName: 'Storage',
  lastName: 'Test',
  isAdmin: false,
};

const testCategory = {
  name: 'Storage Test Category',
  description: 'Category for storage testing',
};

const testTerm = {
  name: 'Storage Test Term',
  definition: 'A term for testing storage operations',
  shortDefinition: 'Storage test term',
};

describe('Database Storage Operations', () => {
  let categoryId: string;
  let termId: string;
  let optimizedStorage: OptimizedStorage;

  beforeAll(async () => {
    // Initialize optimized storage
    optimizedStorage = new OptimizedStorage();

    // Clean up any existing test data
    await db.delete(users).where(eq(users.id, testUser.id));
    await db.delete(categories).where(eq(categories.name, testCategory.name));
    await db.delete(terms).where(eq(terms.name, testTerm.name));

    // Set up test data
    await db.insert(users).values(testUser);

    const [category] = await db.insert(categories).values(testCategory).returning();
    categoryId = category.id;

    const [term] = await db
      .insert(terms)
      .values({
        ...testTerm,
        categoryId: categoryId,
      })
      .returning();
    termId = term.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(favorites).where(eq(favorites.userId, testUser.id));
    await db.delete(terms).where(eq(terms.id, termId));
    await db.delete(categories).where(eq(categories.id, categoryId));
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  describe('User Operations', () => {
    it('should create and retrieve user', async () => {
      const newUser = await storage.upsertUser({
        id: 'test-user-create',
        email: 'create-test@example.com',
        firstName: 'Create',
        lastName: 'Test',
      });

      expect(newUser).toBeDefined();
      expect(newUser.email).toBe('create-test@example.com');

      const retrieved = await storage.getUser('test-user-create');
      expect(retrieved).toBeDefined();
      expect(retrieved?.firstName).toBe('Create');

      // Clean up
      await db.delete(users).where(eq(users.id, 'test-user-create'));
    });

    it('should update existing user on upsert', async () => {
      const updated = await storage.upsertUser({
        id: testUser.id,
        email: testUser.email,
        firstName: 'Updated',
        lastName: 'Name',
      });

      expect(updated.firstName).toBe('Updated');
      expect(updated.lastName).toBe('Name');

      // Restore original data
      await storage.upsertUser(testUser);
    });
  });

  describe('Term Operations', () => {
    it('should fetch terms with proper structure', async () => {
      const terms = await storage.getTerms({ limit: 10 });

      expect(Array.isArray(terms)).toBe(true);
      if (terms.length > 0) {
        const term = terms[0];
        expect(term).toHaveProperty('id');
        expect(term).toHaveProperty('name');
        expect(term).toHaveProperty('definition');
        expect(typeof term.name).toBe('string');
      }
    });

    it('should fetch specific term by ID', async () => {
      const term = await storage.getTerm(termId);

      expect(term).toBeDefined();
      expect(term?.name).toBe(testTerm.name);
      expect(term?.definition).toBe(testTerm.definition);
    });

    it('should return null for non-existent term', async () => {
      const nonExistentTerm = await storage.getTerm('non-existent-id');
      expect(nonExistentTerm).toBeNull();
    });

    it('should search terms by query', async () => {
      const results = await storage.searchTerms('storage');

      expect(Array.isArray(results)).toBe(true);
      // Should find our test term
      const foundTerm = results.find(t => t.name === testTerm.name);
      expect(foundTerm).toBeDefined();
    });
  });

  describe('Category Operations', () => {
    it('should fetch all categories', async () => {
      const categories = await storage.getCategories();

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);

      const testCat = categories.find(c => c.name === testCategory.name);
      expect(testCat).toBeDefined();
    });

    it('should fetch terms by category', async () => {
      const terms = await storage.getTermsByCategory(categoryId);

      expect(Array.isArray(terms)).toBe(true);
      const testTermInCategory = terms.find(t => t.name === testTerm.name);
      expect(testTermInCategory).toBeDefined();
    });
  });

  describe('Favorites Operations', () => {
    it('should add and remove favorites', async () => {
      // Add favorite
      await storage.addFavorite(testUser.id, termId);

      const favorites = await storage.getFavorites(testUser.id);
      expect(favorites.some(f => f.id === termId)).toBe(true);

      // Remove favorite
      await storage.removeFavorite(testUser.id, termId);

      const favoritesAfterRemoval = await storage.getFavorites(testUser.id);
      expect(favoritesAfterRemoval.some(f => f.id === termId)).toBe(false);
    });

    it('should handle duplicate favorite additions gracefully', async () => {
      // Add favorite twice
      await storage.addFavorite(testUser.id, termId);
      await storage.addFavorite(testUser.id, termId);

      const favorites = await storage.getFavorites(testUser.id);
      const favoriteCount = favorites.filter(f => f.id === termId).length;
      expect(favoriteCount).toBe(1); // Should only have one instance

      // Clean up
      await storage.removeFavorite(testUser.id, termId);
    });
  });

  describe('Optimized Storage Operations', () => {
    it('should use optimized queries for better performance', async () => {
      const startTime = Date.now();

      const terms = await optimizedStorage.getTermsOptimized({ limit: 20 });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500); // Should be fast
      expect(Array.isArray(terms)).toBe(true);
    });

    it('should cache frequently accessed data', async () => {
      // First call - should populate cache
      const firstCall = Date.now();
      await optimizedStorage.getCategoriesOptimized();
      const firstDuration = Date.now() - firstCall;

      // Second call - should use cache
      const secondCall = Date.now();
      await optimizedStorage.getCategoriesOptimized();
      const secondDuration = Date.now() - secondCall;

      // Second call should be significantly faster
      expect(secondDuration).toBeLessThan(firstDuration);
    });

    it('should handle bulk operations efficiently', async () => {
      const bulkTerms = Array.from({ length: 10 }, (_, i) => ({
        name: `Bulk Test Term ${i}`,
        definition: `Definition for bulk test term ${i}`,
        categoryId: categoryId,
      }));

      const startTime = Date.now();
      const results = await optimizedStorage.bulkCreateTerms(bulkTerms);
      const duration = Date.now() - startTime;

      expect(results.success).toBe(10);
      expect(results.failed).toBe(0);
      expect(duration).toBeLessThan(1000); // Should be efficient

      // Note: Bulk cleanup would need to be implemented separately
      // as the function doesn't return individual term IDs
    });
  });

  describe('Data Validation', () => {
    it('should validate user data before storage', async () => {
      const invalidUser = {
        id: 'invalid-user',
        email: 'invalid-email', // Invalid email format
        firstName: '',
        lastName: '',
      };

      await expect(storage.upsertUser(invalidUser)).rejects.toThrow();
    });

    it('should validate term data before storage', async () => {
      const invalidTerm = {
        name: '', // Empty name should fail
        definition: 'Valid definition',
        categoryId: categoryId,
      };

      await expect(storage.createTerm(invalidTerm)).rejects.toThrow();
    });
  });

  describe('Performance Metrics', () => {
    it('should track query performance', async () => {
      const metrics = await optimizedStorage.getPerformanceMetrics();

      expect(metrics).toHaveProperty('averageQueryTime');
      expect(metrics).toHaveProperty('cacheHitRate');
      expect(metrics).toHaveProperty('totalQueries');
      expect(typeof metrics.averageQueryTime).toBe('number');
    });

    it('should maintain performance under load', async () => {
      const promises = Array.from({ length: 50 }, () => storage.getTerms({ limit: 5 }));

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results.length).toBe(50);
      expect(duration).toBeLessThan(3000); // Should handle 50 concurrent requests under 3s
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock a database error
      const originalDb = (storage as any).db;
      (storage as any).db = {
        select: () => {
          throw new Error('Database connection failed');
        },
      };

      await expect(storage.getTerms({ limit: 10 })).rejects.toThrow('Database connection failed');

      // Restore original database
      (storage as any).db = originalDb;
    });

    it('should handle malformed queries safely', async () => {
      // Test with malformed input that could cause SQL injection
      const maliciousQuery = "'; DROP TABLE terms; --";

      const results = await storage.searchTerms(maliciousQuery);
      expect(Array.isArray(results)).toBe(true);

      // Verify terms table still exists
      const terms = await storage.getTerms({ limit: 1 });
      expect(Array.isArray(terms)).toBe(true);
    });
  });
});
