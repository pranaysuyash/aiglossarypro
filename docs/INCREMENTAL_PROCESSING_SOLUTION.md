# Incremental Processing Solution for Large Excel Files

## Overview

This document outlines the solution for processing aiml.xlsx (and other large Excel files) without timeouts and implementing incremental updates to avoid reprocessing everything.

## Current Issues

### 1. Timeout Problems
- Processing 10,000+ terms takes too long in a single operation
- Database transactions timeout with large batch inserts
- Memory usage spikes with full file loading
- No progress visibility during long operations

### 2. Reprocessing Inefficiency
- Every import reprocesses all data from scratch
- No change detection for unchanged terms
- Duplicate processing of existing data
- No way to add new terms without full reimport

## Proposed Solutions

### 1. Chunked Processing with State Management

```typescript
interface ProcessingState {
  fileHash: string;
  totalRows: number;
  processedRows: number;
  lastProcessedRow: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt: Date;
  updatedAt: Date;
  errors: ProcessingError[];
}

class IncrementalProcessor {
  private state: ProcessingState;
  private chunkSize = 100; // Process 100 rows at a time
  
  async processExcelFile(filePath: string): Promise<void> {
    // Load or create processing state
    this.state = await this.loadProcessingState(filePath);
    
    // Resume from last processed row
    const startRow = this.state.lastProcessedRow + 1;
    
    // Process in chunks
    while (this.state.processedRows < this.state.totalRows) {
      await this.processChunk(filePath, startRow, this.chunkSize);
      
      // Update state after each chunk
      await this.saveProcessingState();
      
      // Allow other operations between chunks
      await this.delay(100);
    }
  }
}
```

### 2. Change Detection System

```typescript
interface TermChangeDetector {
  // Compare term data to detect changes
  async detectChanges(newTerm: any, existingTerm: any): Promise<ChangeResult> {
    const changes: string[] = [];
    
    // Check each field for changes
    if (newTerm.definition !== existingTerm.definition) {
      changes.push('definition');
    }
    if (newTerm.category !== existingTerm.category) {
      changes.push('category');
    }
    // ... check other fields
    
    return {
      hasChanges: changes.length > 0,
      changedFields: changes,
      changeScore: this.calculateChangeScore(changes)
    };
  }
}
```

### 3. Smart Import Strategy

```typescript
class SmartImporter {
  async importWithIncrementalUpdates(filePath: string): Promise<ImportResult> {
    const processor = new ExcelProcessor();
    const detector = new ChangeDetector();
    
    // 1. Quick scan for new/modified content
    const quickScan = await processor.quickScan(filePath);
    
    // 2. Identify what needs processing
    const toProcess = {
      newTerms: [],
      modifiedTerms: [],
      unchangedTerms: []
    };
    
    for (const row of quickScan.rows) {
      const existingTerm = await this.findExistingTerm(row.name);
      
      if (!existingTerm) {
        toProcess.newTerms.push(row);
      } else {
        const changes = await detector.detectChanges(row, existingTerm);
        if (changes.hasChanges) {
          toProcess.modifiedTerms.push({ row, changes });
        } else {
          toProcess.unchangedTerms.push(row);
        }
      }
    }
    
    // 3. Process only what's needed
    await this.processNewTerms(toProcess.newTerms);
    await this.updateModifiedTerms(toProcess.modifiedTerms);
    
    return {
      processed: toProcess.newTerms.length + toProcess.modifiedTerms.length,
      skipped: toProcess.unchangedTerms.length,
      total: quickScan.rows.length
    };
  }
}
```

## Implementation Strategy

### Phase 1: Chunked Processing (Immediate)

#### 1.1 Create Processing Queue Table
```sql
CREATE TABLE processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path VARCHAR(500) NOT NULL,
  file_hash VARCHAR(64) NOT NULL,
  total_rows INTEGER,
  processed_rows INTEGER DEFAULT 0,
  last_processed_row INTEGER DEFAULT 0,
  chunk_size INTEGER DEFAULT 100,
  status VARCHAR(20) DEFAULT 'pending',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_processing_queue_status ON processing_queue(status);
CREATE INDEX idx_processing_queue_file ON processing_queue(file_path, file_hash);
```

#### 1.2 Implement Chunked Processor
```typescript
export class ChunkedExcelProcessor {
  private queue: ProcessingQueue;
  
  async processFile(filePath: string, options: ProcessingOptions = {}) {
    // 1. Create or resume queue entry
    const queueEntry = await this.queue.createOrResume(filePath);
    
    // 2. Convert Excel to CSV for streaming
    const csvPath = await this.convertToCSV(filePath);
    
    // 3. Process in chunks
    const stream = createReadStream(csvPath);
    const parser = stream.pipe(parse({ 
      from_line: queueEntry.last_processed_row + 1,
      to_line: queueEntry.last_processed_row + options.chunkSize 
    }));
    
    for await (const chunk of parser) {
      await this.processChunk(chunk);
      await this.queue.updateProgress(queueEntry.id, chunk.length);
      
      // Check for timeout
      if (this.isApproachingTimeout()) {
        await this.queue.pause(queueEntry.id);
        break;
      }
    }
  }
  
  private isApproachingTimeout(): boolean {
    const elapsed = Date.now() - this.startTime;
    return elapsed > (this.maxRuntime * 0.8); // 80% of max runtime
  }
}
```

### Phase 2: Change Detection (Short-term)

#### 2.1 Create Term Hash Table
```sql
CREATE TABLE term_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id UUID REFERENCES terms(id),
  term_name VARCHAR(500) NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  field_hashes JSONB, -- Individual field hashes
  last_checked TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(term_id)
);

CREATE INDEX idx_term_hashes_name ON term_hashes(term_name);
CREATE INDEX idx_term_hashes_content ON term_hashes(content_hash);
```

#### 2.2 Implement Hash-based Change Detection
```typescript
export class HashBasedChangeDetector {
  async detectChanges(newData: TermData): Promise<ChangeResult> {
    // Generate hash for new data
    const newHash = this.generateHash(newData);
    
    // Find existing hash
    const existingHash = await this.findTermHash(newData.name);
    
    if (!existingHash) {
      return { isNew: true, hasChanges: false };
    }
    
    if (existingHash.content_hash === newHash) {
      return { isNew: false, hasChanges: false };
    }
    
    // Detailed field comparison
    const changedFields = await this.compareFieldHashes(
      newData,
      existingHash.field_hashes
    );
    
    return {
      isNew: false,
      hasChanges: true,
      changedFields,
      previousHash: existingHash.content_hash,
      newHash
    };
  }
  
  private generateHash(data: any): string {
    const normalized = this.normalizeData(data);
    return crypto.createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex');
  }
}
```

### Phase 3: Incremental Updates (Medium-term)

#### 3.1 Create Update Log Table
```sql
CREATE TABLE import_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_session_id UUID NOT NULL,
  term_id UUID,
  term_name VARCHAR(500),
  action VARCHAR(20), -- 'create', 'update', 'skip', 'error'
  changed_fields TEXT[],
  previous_hash VARCHAR(64),
  new_hash VARCHAR(64),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_import_updates_session ON import_updates(import_session_id);
CREATE INDEX idx_import_updates_action ON import_updates(action);
```

#### 3.2 Implement Incremental Importer
```typescript
export class IncrementalImporter {
  async import(filePath: string, options: ImportOptions = {}) {
    const session = await this.createImportSession(filePath);
    const detector = new HashBasedChangeDetector();
    
    // Quick scan to identify changes
    console.log('🔍 Scanning for changes...');
    const changes = await this.scanForChanges(filePath, detector);
    
    console.log(`📊 Import Analysis:
      - New terms: ${changes.new.length}
      - Modified terms: ${changes.modified.length}
      - Unchanged terms: ${changes.unchanged.length}
    `);
    
    // Process based on options
    if (options.skipUnchanged !== false) {
      console.log('⏭️  Skipping unchanged terms');
    }
    
    // Process new terms
    if (changes.new.length > 0) {
      await this.processNewTerms(changes.new, session.id);
    }
    
    // Process modified terms
    if (changes.modified.length > 0 && options.updateExisting !== false) {
      await this.processModifiedTerms(changes.modified, session.id);
    }
    
    // Log skipped terms
    if (changes.unchanged.length > 0) {
      await this.logSkippedTerms(changes.unchanged, session.id);
    }
    
    return this.generateImportReport(session.id);
  }
}
```

## Usage Examples

### 1. Initial Full Import
```typescript
const importer = new IncrementalImporter();
await importer.import('./data/aiml.xlsx', {
  chunkSize: 500,
  updateExisting: true,
  skipUnchanged: false, // Process everything on first import
  maxRuntime: 300000 // 5 minutes
});
```

### 2. Incremental Update
```typescript
// Only process new and modified terms
await importer.import('./data/aiml.xlsx', {
  chunkSize: 200,
  updateExisting: true,
  skipUnchanged: true, // Skip unchanged terms
  onlyNewTerms: false
});
```

### 3. Add New Terms Only
```typescript
// Only add new terms, don't update existing
await importer.import('./data/aiml_new_terms.xlsx', {
  chunkSize: 100,
  updateExisting: false, // Don't update existing
  skipUnchanged: true,
  onlyNewTerms: true // Only process new terms
});
```

### 4. Resume Interrupted Import
```typescript
const processor = new ChunkedExcelProcessor();
// Automatically resumes from last processed row
await processor.processFile('./data/aiml.xlsx', {
  resumeOnError: true,
  maxRetries: 3
});
```

## Benefits

### 1. No More Timeouts
- Process in manageable chunks
- Pause and resume capability
- Progress tracking and visibility
- Graceful handling of interruptions

### 2. Efficient Updates
- Only process what's changed
- Skip unchanged content
- Faster incremental imports
- Reduced database load

### 3. Better Resource Usage
- Streaming instead of loading entire file
- Controlled memory usage
- Parallel processing capability
- Background processing option

### 4. Reliability
- Resume from failures
- Detailed error tracking
- Rollback capability
- Import history and auditing

## Monitoring and Management

### 1. Progress Monitoring
```typescript
// Get current import status
const status = await importer.getImportStatus(sessionId);
console.log(`Progress: ${status.processed}/${status.total} (${status.percentage}%)`);
```

### 2. Import History
```typescript
// View recent imports
const history = await importer.getImportHistory({
  limit: 10,
  includeStats: true
});
```

### 3. Error Recovery
```typescript
// Retry failed imports
const failedImports = await importer.getFailedImports();
for (const failed of failedImports) {
  await importer.retryImport(failed.sessionId);
}
```

## Configuration

### Environment Variables
```env
# Processing configuration
IMPORT_CHUNK_SIZE=200
IMPORT_MAX_RUNTIME=300000
IMPORT_ENABLE_RESUME=true
IMPORT_HASH_ALGORITHM=sha256

# Change detection
CHANGE_DETECTION_ENABLED=true
CHANGE_DETECTION_FIELDS=name,definition,category,examples
CHANGE_DETECTION_THRESHOLD=0.1

# Performance
IMPORT_PARALLEL_CHUNKS=2
IMPORT_MEMORY_LIMIT=512MB
```

## Conclusion

This incremental processing system solves both the timeout issue and the reprocessing inefficiency. It provides a robust, scalable solution for handling large Excel imports with the ability to:

1. Process files of any size without timeouts
2. Only update what has changed
3. Resume from interruptions
4. Track progress and history
5. Handle errors gracefully

The system is designed to be implemented in phases, with immediate benefits from Phase 1 (chunked processing) and increasing efficiency as additional phases are implemented.