/**
 * Job Processors Index
 * Exports all job processors for the job queue system
 */

export { aiContentGenerationProcessor } from './aiContentGenerationProcessor';
export { aiBatchProcessingProcessor } from './aiBatchProcessingProcessor';
export { dbBatchInsertProcessor } from './dbBatchInsertProcessor';
export { emailSendProcessor } from './emailSendProcessor';
export { cacheWarmProcessor } from './cacheWarmProcessor';
export { cachePrecomputeProcessor } from './cachePrecomputeProcessor';
export { analyticsAggregateProcessor } from './analyticsAggregateProcessor';

// Phase 2: Column Batch Processing Processors
export { columnBatchProcessingProcessor } from './columnBatchProcessingProcessor';
export { columnBatchEstimationProcessor } from './columnBatchEstimationProcessor';
export { columnBatchMonitoringProcessor } from './columnBatchMonitoringProcessor';
export { columnBatchCleanupProcessor } from './columnBatchCleanupProcessor';

// Phase 3: Quality Evaluation Processor
export { processQualityEvaluationJob } from './qualityEvaluationProcessor';