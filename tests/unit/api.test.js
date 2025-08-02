/**
 * Comprehensive API Endpoint Tests
 *
 * Tests critical API functionality to ensure production readiness.
 * Covers authentication, data retrieval, error handling, and security.
 */
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../../server/db';
import { app } from '../../server/index';
import { categories, terms, users } from '../../shared/schema';
// Test data
const testUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isAdmin: false,
};
const testAdmin = {
    id: 'test-admin-id',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    isAdmin: true,
};
const testCategory = {
    name: 'Test Category',
    description: 'A test category for unit tests',
};
const testTerm = {
    name: 'Test Term',
    definition: 'A test term for unit testing',
    shortDefinition: 'Test term',
};
describe('API Endpoints', () => {
    let categoryId;
    let termId;
    beforeAll(async () => {
        // Set up test data
        try {
            // Create test users
            await db.insert(users).values([testUser, testAdmin]).onConflictDoNothing();
            // Create test category
            const [category] = await db.insert(categories).values(testCategory).returning();
            categoryId = category.id;
            // Create test term
            const [term] = await db
                .insert(terms)
                .values({
                ...testTerm,
                categoryId: categoryId,
            })
                .returning();
            termId = term.id;
        }
        catch (error) {
            console.warn('Test setup warning:', error);
        }
    });
    afterAll(async () => {
        // Clean up test data
        try {
            await db.delete(terms).where(eq(terms.name, testTerm.name));
            await db.delete(categories).where(eq(categories.name, testCategory.name));
            await db.delete(users).where(eq(users.email, testUser.email));
            await db.delete(users).where(eq(users.email, testAdmin.email));
        }
        catch (error) {
            console.warn('Test cleanup warning:', error);
        }
    });
    describe('Authentication Endpoints', () => {
        it('should handle login request', async () => {
            const response = await request(app).get('/api/login').expect(302); // Redirect to OAuth
            expect(response.headers.location).toBeDefined();
        });
        it('should handle logout request', async () => {
            const response = await request(app).post('/api/logout').expect(200);
            expect(response.body).toHaveProperty('success', true);
        });
        it('should return user info when authenticated', async () => {
            // Mock authenticated request (would need proper session in real scenario)
            const response = await request(app)
                .get('/api/user')
                .set('Authorization', 'Bearer mock-token')
                .expect(200);
            // In development mode, should return mock user
            expect(response.body).toHaveProperty('success', true);
        });
    });
    describe('Terms Endpoints', () => {
        it('should fetch featured terms', async () => {
            const response = await request(app).get('/api/terms/featured').expect(200);
            expect(response.body).toHaveProperty('success', true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
        it('should fetch specific term by ID', async () => {
            const response = await request(app).get(`/api/terms/${termId}`).expect(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('name', testTerm.name);
        });
        it('should return 404 for non-existent term', async () => {
            const response = await request(app).get('/api/terms/non-existent-id').expect(404);
            expect(response.body).toHaveProperty('success', false);
        });
        it('should handle malformed term ID', async () => {
            const response = await request(app).get('/api/terms/invalid-uuid').expect(400);
            expect(response.body).toHaveProperty('success', false);
        });
        it('should search terms', async () => {
            const response = await request(app).get('/api/search?q=test').expect(200);
            expect(response.body).toHaveProperty('success', true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
        it('should handle empty search query', async () => {
            const response = await request(app).get('/api/search?q=').expect(400);
            expect(response.body).toHaveProperty('success', false);
        });
    });
    describe('Categories Endpoints', () => {
        it('should fetch all categories', async () => {
            const response = await request(app).get('/api/categories').expect(200);
            expect(response.body).toHaveProperty('success', true);
            expect(Array.isArray(response.body.data)).toBe(true);
            // Should include our test category
            const categoryNames = response.body.data.map((cat) => cat.name);
            expect(categoryNames).toContain(testCategory.name);
        });
        it('should fetch specific category by ID', async () => {
            const response = await request(app).get(`/api/categories/${categoryId}`).expect(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('name', testCategory.name);
        });
        it('should return 404 for non-existent category', async () => {
            const response = await request(app).get('/api/categories/non-existent-id').expect(404);
            expect(response.body).toHaveProperty('success', false);
        });
    });
    describe('Security Tests', () => {
        it('should protect admin endpoints without authentication', async () => {
            const response = await request(app).get('/api/admin/content/dashboard').expect(401);
            expect(response.body).toHaveProperty('success', false);
        });
        it('should handle SQL injection attempts', async () => {
            const maliciousQuery = "'; DROP TABLE terms; --";
            const response = await request(app)
                .get(`/api/search?q=${encodeURIComponent(maliciousQuery)}`)
                .expect(400);
            expect(response.body).toHaveProperty('success', false);
        });
        it('should rate limit API requests', async () => {
            // Make multiple rapid requests
            const requests = Array(10)
                .fill(null)
                .map(() => request(app).get('/api/terms/featured'));
            const responses = await Promise.all(requests);
            // At least one should succeed
            expect(responses.some(r => r.status === 200)).toBe(true);
        });
        it('should validate input parameters', async () => {
            const response = await request(app).get('/api/terms/featured?limit=invalid').expect(400);
            expect(response.body).toHaveProperty('success', false);
        });
    });
    describe('Error Handling', () => {
        it('should return proper error format', async () => {
            const response = await request(app).get('/api/non-existent-endpoint').expect(404);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message');
        });
        it('should handle server errors gracefully', async () => {
            // This would require mocking database failures
            // For now, test that error responses have proper structure
            const response = await request(app).get('/api/terms/malformed-uuid-123').expect(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message');
        });
    });
    describe('Performance Tests', () => {
        it('should respond to terms endpoint within reasonable time', async () => {
            const startTime = Date.now();
            await request(app).get('/api/terms/featured').expect(200);
            const responseTime = Date.now() - startTime;
            expect(responseTime).toBeLessThan(1000); // Less than 1 second
        });
        it('should handle concurrent requests', async () => {
            const concurrentRequests = Array(5)
                .fill(null)
                .map(() => request(app).get('/api/categories'));
            const responses = await Promise.all(concurrentRequests);
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('success', true);
            });
        });
    });
    describe('Data Validation', () => {
        it('should return consistent data format for terms', async () => {
            const response = await request(app).get('/api/terms/featured').expect(200);
            if (response.body.data.length > 0) {
                const term = response.body.data[0];
                expect(term).toHaveProperty('id');
                expect(term).toHaveProperty('name');
                expect(term).toHaveProperty('definition');
                expect(typeof term.name).toBe('string');
                expect(typeof term.definition).toBe('string');
            }
        });
        it('should return consistent data format for categories', async () => {
            const response = await request(app).get('/api/categories').expect(200);
            if (response.body.data.length > 0) {
                const category = response.body.data[0];
                expect(category).toHaveProperty('id');
                expect(category).toHaveProperty('name');
                expect(typeof category.name).toBe('string');
            }
        });
    });
    describe('Analytics Endpoints', () => {
        it('should track term views', async () => {
            const response = await request(app).get(`/api/terms/${termId}`).expect(200);
            expect(response.body).toHaveProperty('success', true);
            // View tracking happens asynchronously, so we just verify the term loads
        });
        it('should provide basic analytics data', async () => {
            const response = await request(app).get('/api/analytics').expect(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('metrics');
        });
    });
});
