/**
 * Column Batch Processing Test Suite - Phase 2 Enhanced Content Generation System
 *
 * Comprehensive test suite for validating batch processing functionality,
 * safety controls, cost management, and system reliability.
 */
export declare const testHelpers: {
    createTestOperation: (options?: Partial<any>) => Promise<any>;
    waitForOperationCompletion: (operationId: string, timeout?: number) => Promise<any>;
    generateMockTerms: (count: number) => {
        id: string;
        name: string;
        definition: string;
        category: string;
    }[];
};
export default testHelpers;
