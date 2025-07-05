# Job Queue System Setup Guide

This guide explains how to set up and use the comprehensive job queue system in AIGlossaryPro using BullMQ and Redis.

## Prerequisites

### 1. Redis Server

The job queue system requires Redis for storing job data and managing queues.

#### Option A: Local Redis (Development)
```bash
# macOS (using Homebrew)
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Windows (using Docker)
docker run -d -p 6379:6379 redis:alpine
```

#### Option B: Redis Cloud (Production)
- Use Redis Cloud, AWS ElastiCache, or similar managed Redis service
- Get the connection URL and credentials

### 2. Environment Configuration

Add these variables to your `.env` file:

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password  # Optional for local development
REDIS_DB=1                          # Use DB 1 for job queues
REDIS_URL=redis://localhost:6379    # Alternative to individual settings
REDIS_ENABLED=true                  # Set to true to enable Redis

# Email Configuration (for job notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@aiglossarypro.com
```

## Job Types Supported

The system supports the following job types:

### 1. Excel Import Jobs
- **Type**: `EXCEL_IMPORT`
- **Purpose**: Handle long-running Excel file imports (3-4 minutes)
- **Features**: Progress tracking, checkpointing, error recovery

### 2. AI Content Processing
- **Type**: `AI_CONTENT_GENERATION`
- **Purpose**: Generate AI content for terms using OpenAI
- **Features**: Token tracking, cost monitoring, retry logic

### 3. Database Operations
- **Type**: `DB_BATCH_INSERT`
- **Purpose**: Handle large batch database operations
- **Features**: Conflict resolution, progress tracking

### 4. Email Notifications
- **Type**: `EMAIL_SEND`
- **Purpose**: Send emails with templates and attachments
- **Features**: Template processing, retry logic

### 5. Cache Management
- **Type**: `CACHE_WARM`, `CACHE_PRECOMPUTE`
- **Purpose**: Warm caches and precompute expensive operations
- **Features**: Priority-based processing

### 6. Analytics
- **Type**: `ANALYTICS_AGGREGATE`
- **Purpose**: Generate analytics reports and aggregations
- **Features**: Time-range processing, metric calculation

## API Usage Examples

### 1. Create Excel Import Job

```javascript
// For large files (>5MB) or when ?async=true
const response = await fetch('/api/admin/import?async=true', {
  method: 'POST',
  body: formData,  // FormData with file
});

const result = await response.json();
console.log('Job ID:', result.data.jobId);
```

### 2. Check Job Status

```javascript
const jobStatus = await fetch(`/api/jobs/excel_import/${jobId}`);
const status = await jobStatus.json();

console.log('Progress:', status.data.progress);
console.log('State:', status.data.state);
```

### 3. Create AI Content Generation Job

```javascript
const aiJob = await fetch('/api/jobs/ai-content', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    termId: 'term-123',
    termName: 'Machine Learning',
    sections: ['Practical Examples', 'Best Practices', 'Code Examples'],
    model: 'gpt-4-turbo-preview',
    priority: 2
  })
});
```

### 4. Create Cache Warm Job

```javascript
const cacheJob = await fetch('/api/jobs/cache-warm', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    keys: ['search:machine learning', 'enhanced_term:ml-001'],
    ttl: 3600,
    priority: 4
  })
});
```

## Admin Operations

### Queue Management

```javascript
// Get all queue statistics
const stats = await fetch('/api/jobs/queues/stats');

// Pause a queue
await fetch('/api/jobs/queues/excel_import/pause', { method: 'POST' });

// Resume a queue
await fetch('/api/jobs/queues/excel_import/resume', { method: 'POST' });

// Clean old jobs
await fetch('/api/jobs/queues/excel_import/clean', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grace: 3600000,  // 1 hour
    limit: 1000,
    status: 'completed'
  })
});
```

### Cancel Jobs

```javascript
// Cancel a specific job
await fetch(`/api/jobs/excel_import/${jobId}`, { method: 'DELETE' });
```

## Job Progress Tracking

Jobs emit progress updates that can be monitored:

```javascript
// Poll for job progress
async function trackJobProgress(jobType, jobId) {
  const pollInterval = setInterval(async () => {
    const response = await fetch(`/api/jobs/${jobType}/${jobId}`);
    const job = await response.json();
    
    if (job.data.state === 'completed') {
      console.log('Job completed!', job.data.result);
      clearInterval(pollInterval);
    } else if (job.data.state === 'failed') {
      console.error('Job failed:', job.data.failedReason);
      clearInterval(pollInterval);
    } else {
      console.log(`Progress: ${job.data.progress}%`);
    }
  }, 2000);
}
```

## Error Handling and Retry Policies

The system includes comprehensive error handling:

### Retry Policies
- **Excel Import**: 3 attempts with exponential backoff
- **AI Generation**: 3 attempts with 10-second delays
- **Database Operations**: 3 attempts with fixed 5-second delays
- **Email Send**: 3 attempts with exponential backoff

### Error Categories
- Retryable errors (network issues, temporary failures)
- Non-retryable errors (validation errors, auth failures)

### Checkpointing
For long-running jobs (like Excel imports), the system uses checkpointing:

```javascript
// Jobs can be resumed from checkpoints after failures
const importJob = await jobQueue.addExcelImportJob({
  // ... job data
  importOptions: {
    checkpointEnabled: true,  // Enable checkpointing
    batchSize: 50            // Process in batches
  }
});
```

## Performance Tuning

### Concurrency Settings
Each job type has optimized concurrency settings:

- **Excel Import**: 2 concurrent jobs (I/O intensive)
- **AI Generation**: 10 concurrent jobs (API rate limited)
- **Database Operations**: 5 concurrent jobs (DB connection limited)
- **Email Send**: 10 concurrent jobs (SMTP rate limited)

### Rate Limiting
- AI jobs: 50 requests per minute
- Email jobs: 100 emails per minute

### Queue Priorities
1. **Critical**: System-critical operations
2. **High**: User-facing operations
3. **Normal**: Standard background tasks
4. **Low**: Maintenance and cleanup tasks

## Monitoring and Metrics

### Queue Statistics
Monitor queue health through the admin API:

```javascript
const queueStats = await fetch('/api/jobs/queues/stats');
// Returns: waiting, active, completed, failed, delayed counts
```

### Job Events
The system emits events for:
- Job added to queue
- Job started processing
- Job progress updates
- Job completed/failed

### Logging
All job activities are logged with structured logging:
- Job creation and status changes
- Error details and stack traces
- Performance metrics

## Best Practices

### 1. Job Design
- Keep jobs idempotent (safe to retry)
- Use appropriate batch sizes
- Include enough context for error debugging

### 2. Error Handling
- Use specific error types for different failure scenarios
- Include retry policies appropriate for the operation
- Log detailed error information

### 3. Performance
- Choose appropriate concurrency levels
- Use job priorities effectively
- Monitor queue depths and processing times

### 4. Monitoring
- Set up alerts for failed jobs
- Monitor queue backlogs
- Track job completion times

## Development vs Production

### Development
- Uses mock Redis client if Redis is not available
- All features work without Redis (jobs execute synchronously)
- Detailed error logging and debugging

### Production
- Requires actual Redis server
- All operations are asynchronous through job queues
- Structured logging and monitoring

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:6379
   ```
   - Ensure Redis server is running
   - Check REDIS_HOST and REDIS_PORT settings

2. **Jobs Stuck in Waiting State**
   - Check worker processes are running
   - Verify Redis connectivity
   - Check queue pause status

3. **High Memory Usage**
   - Clean old completed/failed jobs regularly
   - Adjust removeOnComplete/removeOnFail settings
   - Monitor Redis memory usage

4. **Email Jobs Failing**
   - Verify SMTP credentials
   - Check email template validity
   - Monitor SMTP rate limits

### Debug Commands

```bash
# Check Redis connection
redis-cli ping

# Monitor Redis in real-time
redis-cli monitor

# Check job queue keys
redis-cli keys "bull:*"

# View specific queue
redis-cli llen "bull:excel-import:waiting"
```

## Integration Examples

### Excel Import with Job Queue

```javascript
// Original synchronous import
app.post('/api/admin/import', upload.single('file'), async (req, res) => {
  // For large files, use job queue
  if (req.file.size > 5 * 1024 * 1024) {
    const jobId = await jobQueue.addExcelImportJob({
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      // ... other options
    });
    
    return res.json({
      success: true,
      data: { jobId, async: true }
    });
  }
  
  // Small files processed synchronously
  // ... existing logic
});
```

### AI Content Generation Pipeline

```javascript
// Batch AI processing for multiple terms
async function generateContentForTerms(termIds, sections) {
  const jobId = await jobQueueManager.addJob(JobType.AI_BATCH_PROCESSING, {
    terms: termIds.map(id => ({ id, name: `Term ${id}` })),
    sections,
    batchSize: 10,
    costLimit: 50.00  // $50 limit
  });
  
  return jobId;
}
```

This job queue system provides a robust foundation for handling all long-running operations in AIGlossaryPro with proper monitoring, error handling, and scalability.