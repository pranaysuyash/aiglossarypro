/**
 * Job Queue Type Definitions
 * Defines all job types, payloads, and results for the BullMQ job queue system
 */

export enum JobType {
  // AI Processing Jobs
  AI_CONTENT_GENERATION = 'ai_content_generation',
  AI_CONTENT_PARSING = 'ai_content_parsing',
  AI_BATCH_PROCESSING = 'ai_batch_processing',
  
  // Phase 2: Column Batch Processing Jobs
  COLUMN_BATCH_PROCESSING = 'column_batch_processing',
  COLUMN_BATCH_ESTIMATION = 'column_batch_estimation',
  COLUMN_BATCH_MONITORING = 'column_batch_monitoring',
  COLUMN_BATCH_CLEANUP = 'column_batch_cleanup',
  
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
  
  // Admin Jobs
  BULK_TERM_UPDATE = 'bulk_term_update',
  DATA_EXPORT = 'data_export',
  CACHE_CLEANUP = 'cache_cleanup',
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

// Phase 2: Column Batch Processing Job Types
export interface ColumnBatchProcessingJobData extends BaseJobData {
  operationId: string;
  sectionName: string;
  termIds: string[];
  batchConfiguration: {
    batchSize: number;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    regenerateExisting?: boolean;
    pauseOnError?: boolean;
    maxConcurrentBatches?: number;
  };
  costLimits?: {
    maxTotalCost?: number;
    maxCostPerTerm?: number;
    warningThreshold?: number;
  };
  notificationOptions?: {
    emailOnCompletion?: boolean;
    webhookUrl?: string;
    notifyOnMilestones?: number[];
  };
}

export interface ColumnBatchProcessingJobResult {
  operationId: string;
  sectionName: string;
  totalTerms: number;
  processedTerms: number;
  failedTerms: number;
  skippedTerms: number;
  totalCost: number;
  totalTokens: number;
  processingTime: number;
  subJobIds: string[];
  costBreakdown: {
    [model: string]: {
      tokens: number;
      cost: number;
      requests: number;
    };
  };
  qualityMetrics?: {
    averageContentLength: number;
    contentQualityScore?: number;
  };
  errors: Array<{
    termId: string;
    termName: string;
    error: string;
    timestamp: Date;
    retryCount: number;
  }>;
}

export interface ColumnBatchEstimationJobData extends BaseJobData {
  sectionName: string;
  termIds?: string[];
  categories?: string[];
  filterOptions?: {
    hasContent?: boolean;
    isAiGenerated?: boolean;
    verificationStatus?: 'verified' | 'unverified' | 'needs_review';
    lastUpdatedBefore?: Date;
    lastUpdatedAfter?: Date;
  };
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ColumnBatchEstimationJobResult {
  sectionName: string;
  totalTerms: number;
  estimatedCost: number;
  estimatedTokens: number;
  estimatedProcessingTime: number;
  costBreakdown: {
    [model: string]: {
      tokensPerTerm: number;
      costPerTerm: number;
      totalCost: number;
    };
  };
  recommendations: string[];
  confidence: 'high' | 'medium' | 'low';
  basedOn: string;
}

export interface ColumnBatchMonitoringJobData extends BaseJobData {
  operationIds: string[];
  checkInterval?: number;
  alertThresholds?: {
    staleTimeMinutes: number;
    costWarningThreshold: number;
    errorRateThreshold: number;
  };
}

export interface ColumnBatchMonitoringJobResult {
  monitoredOperations: number;
  activeOperations: number;
  completedOperations: number;
  failedOperations: number;
  alertsTriggered: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  recommendations: string[];
}

export interface ColumnBatchCleanupJobData extends BaseJobData {
  maxAge?: number; // Days to keep completed operations
  maxOperations?: number; // Maximum number of operations to keep
  cleanupTypes?: Array<'completed' | 'failed' | 'cancelled'>;
}

export interface ColumnBatchCleanupJobResult {
  operationsRemoved: number;
  alertsRemoved: number;
  spaceFreed: number; // Bytes
  errors: string[];
}

// Enhanced Progress Tracking for Column Batch Operations
export interface ColumnBatchProgressUpdate extends JobProgressUpdate {
  operationId: string;
  currentBatch?: number;
  totalBatches?: number;
  processedTerms?: number;
  totalTerms?: number;
  currentCost?: number;
  estimatedCost?: number;
  averageTimePerTerm?: number;
  estimatedCompletion?: Date;
  recentErrors?: Array<{
    termId: string;
    error: string;
    timestamp: Date;
  }>;
}

// Batch Operation Status Tracking
export interface BatchOperationStatus {
  operationId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: ColumnBatchProgressUpdate;
  timing: {
    startedAt?: Date;
    estimatedCompletion?: Date;
    actualCompletion?: Date;
    pausedAt?: Date;
    lastActivity?: Date;
  };
  costs: {
    estimatedCost: number;
    actualCost: number;
    budgetUsed: number;
    costPerTerm: number;
  };
  subJobs: Array<{
    jobId: string;
    termId: string;
    termName: string;
    status: string;
    cost?: number;
    tokens?: number;
    error?: string;
  }>;
}