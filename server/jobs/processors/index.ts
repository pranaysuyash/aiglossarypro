/**
 * Job Processors Index
 * Exports all job processors for the job queue system
 */

export { aiBatchProcessingProcessor } from './aiBatchProcessingProcessor';
export { aiContentGenerationProcessor } from './aiContentGenerationProcessor';
export { analyticsAggregateProcessor } from './analyticsAggregateProcessor';
export { cachePrecomputeProcessor } from './cachePrecomputeProcessor';
export { cacheWarmProcessor } from './cacheWarmProcessor';
export { columnBatchCleanupProcessor } from './columnBatchCleanupProcessor';
export { columnBatchEstimationProcessor } from './columnBatchEstimationProcessor';
export { columnBatchMonitoringProcessor } from './columnBatchMonitoringProcessor';
// Phase 2: Column Batch Processing Processors
export { columnBatchProcessingProcessor } from './columnBatchProcessingProcessor';
export { dbBatchInsertProcessor } from './dbBatchInsertProcessor';
export { emailSendProcessor } from './emailSendProcessor';

// Phase 3: Quality Evaluation Processor
export { processQualityEvaluationJob } from './qualityEvaluationProcessor';
