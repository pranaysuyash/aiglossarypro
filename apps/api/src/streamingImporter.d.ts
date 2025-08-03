/**
 * Streaming Importer for Very Large JSON Files
 * Handles importing massive JSON files by streaming and parsing them incrementally
 */
interface StreamingImportOptions {
    batchSize?: number;
    skipExisting?: boolean;
    enableProgress?: boolean;
}
interface StreamingImportResult {
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
 * Import data using streaming to handle very large files
 */
export declare function streamingImportProcessedData(filePath: string, options?: StreamingImportOptions): Promise<StreamingImportResult>;
/**
 * Import the latest processed file using streaming
 */
export declare function streamingImportLatestProcessedFile(options?: StreamingImportOptions): Promise<StreamingImportResult>;
export {};
