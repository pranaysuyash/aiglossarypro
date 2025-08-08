#!/usr/bin/env node
/**
 * Database performance indexes migration script
 * Applies all performance indexes to improve query speed
 */
declare function main(): Promise<void>;
export { main as applyIndexes };
