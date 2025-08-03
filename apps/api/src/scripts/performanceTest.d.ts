#!/usr/bin/env tsx
/**
 * Performance Test Script
 *
 * Tests the performance improvements implemented for the API endpoints
 * to validate response time improvements and payload size reductions.
 */
interface PerformanceResult {
    endpoint: string;
    operation: string;
    duration: number;
    payloadSize: number;
    resultCount: number;
    cacheHit?: boolean;
}
declare function runPerformanceTests(): Promise<PerformanceResult[]>;
export { runPerformanceTests };
