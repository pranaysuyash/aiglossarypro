/**
 * Application Integration Tests
 *
 * Tests the complete application flow including user authentication,
 * data flow, and end-to-end functionality.
 */

import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../../server/db';
import { app } from '../../server/index';
import { categories, favorites, terms, users } from '../../shared/schema';

// Test data for integration tests
const testUser = {
  id: 'integration-test-user',
  email: 'integration@example.com',
  firstName: 'Integration',
  lastName: 'Test',
  isAdmin: false,
};

const testAdmin = {
  id: 'integration-test-admin',
  email: 'admin-integration@example.com',
  firstName: 'Admin',
  lastName: 'Test',
  isAdmin: true,
};

const testCategory = {
  name: 'Integration Test Category',
  description: 'Category for integration testing',
};

const testTerm = {
  name: 'Integration Test Term',
  definition: 'A term for integration testing',
  shortDefinition: 'Integration test',
};

describe('Application Integration Tests', () => {
  let categoryId: string;
  let termId: string;
  let agent: any;

  beforeAll(async () => {
    // Clean up any existing test data
    await db.delete(favorites).where(eq(favorites.userId, testUser.id));
    await db.delete(terms).where(eq(terms.name, testTerm.name));
    await db.delete(categories).where(eq(categories.name, testCategory.name));
    await db.delete(users).where(eq(users.id, testUser.id));
    await db.delete(users).where(eq(users.id, testAdmin.id));

    // Set up test data
    await db.insert(users).values([testUser, testAdmin]);

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

    // Create persistent agent for session management
    agent = request.agent(app);
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(favorites).where(eq(favorites.userId, testUser.id));
    await db.delete(terms).where(eq(terms.id, termId));
    await db.delete(categories).where(eq(categories.id, categoryId));
    await db.delete(users).where(eq(users.id, testUser.id));
    await db.delete(users).where(eq(users.id, testAdmin.id));
  });

  describe('Authentication Flow', () => {
    it('should handle complete login flow', async () => {
      // Test login redirect
      const loginResponse = await agent.get('/api/login').expect(302);

      expect(loginResponse.headers.location).toBeDefined();

      // In development mode, should be able to access user endpoint
      const userResponse = await agent.get('/api/user').expect(200);

      expect(userResponse.body.success).toBe(true);
      expect(userResponse.body.data).toHaveProperty('email');
    });

    it('should maintain session across requests', async () => {
      // Make multiple requests with the same agent
      const responses = await Promise.all([
        agent.get('/api/user'),
        agent.get('/api/terms/featured'),
        agent.get('/api/categories'),
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should handle logout properly', async () => {
      const logoutResponse = await agent.post('/api/logout').expect(200);

      expect(logoutResponse.body.success).toBe(true);
    });
  });

  describe('Content Retrieval Flow', () => {
    it('should fetch and display terms correctly', async () => {
      const response = await agent.get('/api/terms/featured').expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      if (response.body.data.length > 0) {
        const term = response.body.data[0];
        expect(term).toHaveProperty('id');
        expect(term).toHaveProperty('name');
        expect(term).toHaveProperty('definition');
      }
    });

    it('should fetch specific term with all related data', async () => {
      const response = await agent.get(`/api/terms/${termId}`).expect(200);

      expect(response.body.success).toBe(true);
      const term = response.body.data;
      expect(term.name).toBe(testTerm.name);
      expect(term.definition).toBe(testTerm.definition);
      expect(term).toHaveProperty('categoryName');
    });

    it('should search terms and return relevant results', async () => {
      const response = await agent.get('/api/search?q=integration').expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // Should find our test term
      const foundTerm = response.body.data.find((t: any) => t.name === testTerm.name);
      expect(foundTerm).toBeDefined();
    });

    it('should fetch categories with term counts', async () => {
      const response = await agent.get('/api/categories').expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      const testCat = response.body.data.find((c: any) => c.name === testCategory.name);
      expect(testCat).toBeDefined();
      expect(testCat.termCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('User Interaction Flow', () => {
    it('should handle favorites workflow end-to-end', async () => {
      // Add favorite
      const addResponse = await agent.post(`/api/favorites/${termId}`).expect(200);

      expect(addResponse.body.success).toBe(true);

      // Verify favorite was added
      const favoritesResponse = await agent.get('/api/favorites').expect(200);

      expect(favoritesResponse.body.success).toBe(true);
      const favorites = favoritesResponse.body.data;
      expect(favorites.some((f: any) => f.id === termId)).toBe(true);

      // Remove favorite
      const removeResponse = await agent.delete(`/api/favorites/${termId}`).expect(200);

      expect(removeResponse.body.success).toBe(true);

      // Verify favorite was removed
      const favoritesAfterRemoval = await agent.get('/api/favorites').expect(200);

      const updatedFavorites = favoritesAfterRemoval.body.data;
      expect(updatedFavorites.some((f: any) => f.id === termId)).toBe(false);
    });

    it('should track user analytics correctly', async () => {
      // View a term (should increment analytics)
      await agent.get(`/api/terms/${termId}`).expect(200);

      // Check analytics
      const analyticsResponse = await agent.get('/api/analytics').expect(200);

      expect(analyticsResponse.body.success).toBe(true);
      expect(analyticsResponse.body.data).toHaveProperty('metrics');
    });
  });

  describe('Admin Functionality Integration', () => {
    it('should protect admin endpoints properly', async () => {
      // Non-admin user should be denied
      const response = await agent.get('/api/admin/content/dashboard').expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should allow admin access in development mode', async () => {
      if (process.env.NODE_ENV === 'development') {
        const response = await agent.get('/api/admin/content/dashboard').expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('stats');
      }
    });

    it('should handle admin content management', async () => {
      if (process.env.NODE_ENV === 'development') {
        // Test admin term management
        const response = await agent.get('/api/admin/content/terms?limit=10').expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.terms)).toBe(true);
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle non-existent resources gracefully', async () => {
      const response = await agent.get('/api/terms/non-existent-id').expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    it('should validate input parameters', async () => {
      const response = await agent.get('/api/search?q=').expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle malformed requests', async () => {
      const response = await agent.post('/api/favorites/invalid-id').expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance Integration', () => {
    it('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now();

      const requests = Array.from({ length: 20 }, () => agent.get('/api/terms/featured'));

      const responses = await Promise.all(requests);
      const duration = Date.now() - startTime;

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      expect(duration).toBeLessThan(2000); // Should handle 20 requests under 2s
    });

    it('should maintain performance with search queries', async () => {
      const searchQueries = ['machine', 'learning', 'neural', 'data', 'algorithm'];

      const startTime = Date.now();
      const searchPromises = searchQueries.map(query => agent.get(`/api/search?q=${query}`));

      const responses = await Promise.all(searchPromises);
      const duration = Date.now() - startTime;

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      expect(duration).toBeLessThan(1500); // Multiple searches should be fast
    });
  });

  describe('Data Consistency Integration', () => {
    it('should maintain data consistency across operations', async () => {
      // Get initial category count
      const initialResponse = await agent.get('/api/categories').expect(200);

      const initialCategoryCount = initialResponse.body.data.length;

      // Create new category (if admin)
      if (process.env.NODE_ENV === 'development') {
        const newCategory = {
          name: 'Test Consistency Category',
          description: 'For testing data consistency',
        };

        const createResponse = await agent
          .post('/api/admin/content/categories')
          .send(newCategory)
          .expect(200);

        expect(createResponse.body.success).toBe(true);

        // Verify category count increased
        const updatedResponse = await agent.get('/api/categories').expect(200);

        expect(updatedResponse.body.data.length).toBe(initialCategoryCount + 1);

        // Clean up
        const createdCategoryId = createResponse.body.data.id;
        await agent.delete(`/api/admin/content/categories/${createdCategoryId}`).expect(200);
      }
    });

    it('should handle transaction rollbacks properly', async () => {
      // Test that failed operations don't leave partial data
      const invalidData = {
        name: '', // Invalid empty name
        definition: 'Valid definition',
      };

      const response = await agent.post('/api/admin/content/terms').send(invalidData).expect(400);

      expect(response.body.success).toBe(false);

      // Verify no partial data was created
      const termsResponse = await agent.get('/api/search?q=Valid definition').expect(200);

      const foundTerms = termsResponse.body.data.filter(
        (t: any) => t.definition === 'Valid definition'
      );
      expect(foundTerms.length).toBe(0);
    });
  });

  describe('API Response Format Consistency', () => {
    it('should return consistent response format across all endpoints', async () => {
      const endpoints = ['/api/terms/featured', '/api/categories', '/api/user', '/api/analytics'];

      for (const endpoint of endpoints) {
        const response = await agent.get(endpoint);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('data');
        expect(typeof response.body.success).toBe('boolean');
      }
    });

    it('should return consistent error format', async () => {
      const errorEndpoints = [
        '/api/terms/invalid-id',
        '/api/categories/invalid-id',
        '/api/search?q=',
        '/api/favorites/invalid-id',
      ];

      for (const endpoint of errorEndpoints) {
        const response = await agent.get(endpoint);

        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message');
        expect(typeof response.body.message).toBe('string');
      }
    });
  });
});
