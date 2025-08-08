/**
 * Database Cleanup Script: Remove Invalid Categories
 *
 * This script identifies and removes categories that are actually terms,
 * metadata, or other invalid data that was incorrectly stored as categories.
 */
interface CleanupStats {
    invalidCategoriesFound: number;
    invalidCategoriesRemoved: number;
    invalidSubcategoriesRemoved: number;
    termsReassigned: number;
    errors: string[];
}
declare function identifyInvalidCategories(): Promise<string[]>;
declare function cleanupInvalidCategories(): Promise<CleanupStats>;
export { cleanupInvalidCategories, identifyInvalidCategories };
