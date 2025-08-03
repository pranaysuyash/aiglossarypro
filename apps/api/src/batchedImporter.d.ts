/**
 * Batched Importer for Large Datasets
 * Handles importing large JSON files by processing them in chunks to avoid memory issues
 */
interface ImportOptions {
    batchSize?: number;
    skipExisting?: boolean;
    enableProgress?: boolean;
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
}
/**
 * Import data in smaller, manageable batches
 */
export declare function batchedImportProcessedData(filePath: string, options?: ImportOptions): Promise<ImportResult>;
/**
 * Import the latest processed file using batching
 */
export declare function importLatestProcessedFile(options?: ImportOptions): Promise<ImportResult>;
export {};
