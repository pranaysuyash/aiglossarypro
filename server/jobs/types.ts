/**
 * Job Queue Type Definitions
 * Defines all job types, payloads, and results for the BullMQ job queue system
 */

export enum JobType {
  // Excel Import Jobs
  EXCEL_IMPORT = 'excel_import',
  EXCEL_PARSE = 'excel_parse',
  EXCEL_BATCH_IMPORT = 'excel_batch_import',
  
  // AI Processing Jobs
  AI_CONTENT_GENERATION = 'ai_content_generation',
  AI_CONTENT_PARSING = 'ai_content_parsing',
  AI_BATCH_PROCESSING = 'ai_batch_processing',
  
  // Database Jobs
  DB_BATCH_INSERT = 'db_batch_insert',
  DB_BATCH_UPDATE = 'db_batch_update',
  DB_CLEANUP = 'db_cleanup',
  DB_INDEX_OPTIMIZATION = 'db_index_optimization',
  
  // Email Jobs
  EMAIL_SEND = 'email_send',
  EMAIL_BATCH_SEND = 'email_batch_send',
  EMAIL_NEWSLETTER = 'email_newsletter',
  
  // Cache Jobs
  CACHE_WARM = 'cache_warm',
  CACHE_INVALIDATE = 'cache_invalidate',
  CACHE_PRECOMPUTE = 'cache_precompute',
  
  // Analytics Jobs
  ANALYTICS_AGGREGATE = 'analytics_aggregate',
  ANALYTICS_REPORT = 'analytics_report',
  
  // System Jobs
  SYSTEM_CLEANUP = 'system_cleanup',
  SYSTEM_BACKUP = 'system_backup',
}

// Job Priority Levels
export enum JobPriority {
  CRITICAL = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4,
}

// Job Status (extends BullMQ's built-in statuses)
export interface JobStatus {
  id: string;
  type: JobType;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';
  progress: number;
  data: any;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  attempts: number;
  maxAttempts: number;
}

// Base job data interface
export interface BaseJobData {
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

// Excel Import Job Types
export interface ExcelImportJobData extends BaseJobData {
  fileBuffer: Buffer;
  fileName: string;
  fileSize: number;
  importOptions: {
    mode: 'basic' | 'advanced' | 'streaming';
    enableAI: boolean;
    aiMode?: 'none' | 'basic' | 'full' | 'selective';
    batchSize?: number;
    checkpointEnabled?: boolean;
  };
}

export interface ExcelImportJobResult {
  termsImported: number;
  categoriesImported: number;
  sectionsProcessed: number;
  errors: Array<{ row: number; error: string }>;
  warnings: Array<{ row: number; warning: string }>;
  duration: number;
  checkpointId?: string;
}

// AI Processing Job Types
export interface AIContentGenerationJobData extends BaseJobData {
  termId: string;
  termName: string;
  sections: string[];
  model?: string;
  temperature?: number;
  maxRetries?: number;
}

export interface AIContentGenerationJobResult {
  termId: string;
  generatedSections: Record<string, any>;
  tokensUsed: number;
  cost: number;
  duration: number;
}

export interface AIBatchProcessingJobData extends BaseJobData {
  terms: Array<{
    id: string;
    name: string;
    currentData?: any;
  }>;
  sections: string[];
  batchSize: number;
  costLimit?: number;
}

// Database Job Types
export interface DBBatchInsertJobData extends BaseJobData {
  table: string;
  records: any[];
  conflictResolution?: 'ignore' | 'update' | 'error';
  batchSize?: number;
}

export interface DBBatchInsertJobResult {
  inserted: number;
  updated: number;
  failed: number;
  errors: Array<{ record: any; error: string }>;
  duration: number;
  [key: string]: unknown;
}

// Email Job Types
export interface EmailSendJobData extends BaseJobData {
  to: string | string[];
  subject: string;
  template: string;
  data: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
}

export interface EmailBatchSendJobData extends BaseJobData {
  recipients: Array<{
    email: string;
    data: Record<string, any>;
  }>;
  subject: string;
  template: string;
  batchSize?: number;
  delayBetweenBatches?: number;
}

// Cache Job Types
export interface CacheWarmJobData extends BaseJobData {
  keys: string[];
  ttl?: number;
  priority?: 'high' | 'normal' | 'low';
}

export interface CachePrecomputeJobData extends BaseJobData {
  computationType: 'search_results' | 'term_relationships' | 'user_recommendations' | 'analytics';
  parameters: Record<string, any>;
  ttl?: number;
}

// Analytics Job Types
export interface AnalyticsAggregateJobData extends BaseJobData {
  metric: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  dimensions?: string[];
  filters?: Record<string, any>;
}

// Job Options Interface
export interface JobOptions {
  priority?: JobPriority;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
  timeout?: number;
}

// Job Progress Update Interface
export interface JobProgressUpdate {
  progress: number;
  message?: string;
  stage?: string;
  details?: Record<string, any>;
}

// Queue Events Interface
export interface QueueEvents {
  onJobAdded?: (jobId: string, jobData: any) => void;
  onJobStarted?: (jobId: string) => void;
  onJobProgress?: (jobId: string, progress: JobProgressUpdate) => void;
  onJobCompleted?: (jobId: string, result: any) => void;
  onJobFailed?: (jobId: string, error: Error) => void;
  onJobStalled?: (jobId: string) => void;
  onJobRemoved?: (jobId: string) => void;
}

// Retry Policy Interface
export interface RetryPolicy {
  maxAttempts: number;
  backoffType: 'exponential' | 'fixed' | 'linear';
  backoffDelay: number;
  retryableErrors?: string[];
  nonRetryableErrors?: string[];
}

// Job Result Interface
export interface JobResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}