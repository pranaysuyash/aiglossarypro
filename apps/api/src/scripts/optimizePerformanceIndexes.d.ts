#!/usr/bin/env tsx
/**
 * Performance Index Optimization Script
 *
 * This script creates database indexes specifically optimized for the
 * performance improvements implemented in the API endpoints.
 */
declare function createPerformanceIndexes(): Promise<({
    name: string;
    status: string;
    error?: undefined;
} | {
    name: string;
    status: string;
    error: string;
})[]>;
export { createPerformanceIndexes };
