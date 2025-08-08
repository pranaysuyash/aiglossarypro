/**
 * Test script for AI content generation functionality
 * Run this to verify the end-to-end implementation
 */
declare function testAIContentGeneration(): Promise<{
    success: boolean;
    results: {
        templatesLoaded: number;
        singleGeneration: boolean;
        bulkGeneration: boolean;
        regeneration: boolean;
        testTerm: string;
        testTermId: string;
    };
    error?: undefined;
} | {
    success: boolean;
    error: string;
    results?: undefined;
}>;
declare function testComponents(): Promise<{
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: string;
}>;
export { testAIContentGeneration, testComponents };
