#!/usr/bin/env tsx
/**
 * Enhanced Database Performance Indexes
 *
 * Additional indexes for enhanced schema and fixes for failed indexes.
 * Focus on analytics, AI features, and content management optimization.
 */
interface IndexDefinition {
    name: string;
    description: string;
    sql: string;
    estimatedImprovement: string;
}
declare const ENHANCED_INDEXES: IndexDefinition[];
export declare function applyEnhancedIndexes(): Promise<void>;
export { ENHANCED_INDEXES };
