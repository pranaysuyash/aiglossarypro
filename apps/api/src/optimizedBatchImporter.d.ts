/**
 * Optimized Batched Importer for Large Datasets
 * Enhanced version with bulk inserts, transactions, and better memory management
 */
interface OptimizedImportOptions {
    batchSize?: number;
    bulkInsertSize?: number;
    skipExisting?: boolean;
    enableProgress?: boolean;
    useTransactions?: boolean;
    maxConcurrentOperations?: number;
}
interface ImportResult {
    success: boolean;
    imported: {
        categories: number;
        subcategories: number;
        terms: number;
    };
    errors: string[];
    duration: number;
    performance: {
        categoriesPerSecond: number;
        termsPerSecond: number;
        memoryUsage: NodeJS.MemoryUsage;
    };
}
export declare class OptimizedBatchImporter {
    private options;
    constructor(options?: OptimizedImportOptions);
    /**
     * Main import function with performance optimizations
     */
    importFromFile(filePath: string): Promise<ImportResult>;
    /**
     * Stream-based JSON loading for large files
     */
    private loadDataStreaming;
    /**
     * Bulk import categories with optimized insertions
     */
    private bulkImportCategories;
    /**
     * Bulk import subcategories with optimized insertions
     */
    private bulkImportSubcategories;
    /**
     * Bulk import terms with optimized insertions and relationship handling
     */
    private bulkImportTerms;
}
export declare function optimizedImportFromFile(filePath: string, options?: OptimizedImportOptions): Promise<ImportResult>;
export {};
