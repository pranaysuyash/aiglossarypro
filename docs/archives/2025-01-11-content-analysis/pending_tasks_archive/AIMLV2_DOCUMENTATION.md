# aimlv2.py - Comprehensive Documentation

## Overview

`aimlv2.py` is a robust, production-grade Python script designed to populate an AI/ML glossary Excel file using the OpenAI API. It processes 10,372+ terms across 295 content dimensions with parallel processing, checkpoint recovery, and comprehensive error handling.

## Key Features

### 🚀 Performance Optimizations
- **Parallel Processing**: 25 concurrent workers for API calls
- **Batch Processing**: Groups API calls into batches of 75 (25 workers × 3)
- **Smart Queuing**: Identifies and processes only missing cells
- **Progress Tracking**: Real-time progress bars and detailed logging

### 🛡️ Reliability & Safety
- **Checkpoint System**: Automatically saves progress and resumes from interruptions
- **Atomic File Operations**: Uses temporary files to prevent data corruption
- **Backup Validation**: Validates Excel file integrity before processing
- **Error Recovery**: Multiple retry attempts with exponential backoff

### 📊 Current Status
- **Total Terms**: 10,372 AI/ML terms
- **Completion**: 61.6% complete (6,390 terms fully processed)
- **Remaining**: 3,982 terms pending processing
- **Data Points**: 3,059,740 total cells (10,372 × 295)

## Architecture

### Core Components

#### 1. Configuration Management
```python
EXCEL_FILE = "aiml.xlsx"           # Primary data file
CHECKPOINT_FILE = "checkpoint.json" # Progress tracking
MAX_WORKERS = 25                   # Concurrent API calls
BATCH_SIZE = 75                    # Cells per batch
PRIMARY_MODEL = "gpt-4.1-nano"     # Main OpenAI model
FALLBACK_MODEL = "gpt-3.5-turbo"   # Backup model
```

#### 2. Safety Systems
- **File Integrity Validation**: `assert_valid_xlsx()` checks ZIP structure
- **Atomic Writes**: `safe_save_workbook()` prevents corruption
- **Checkpoint Reconciliation**: Removes stale entries for empty cells

#### 3. API Management
- **Intelligent Prompting**: Constructs context-aware prompts for each term/section
- **Retry Logic**: 3 attempts with different models and exponential backoff
- **Timeout Handling**: 60-second request timeout with proper error handling
- **Content Validation**: Ensures minimum content length (10+ characters)

#### 4. Processing Pipeline
1. **Initialization**: Load workbook, headers, and checkpoint data
2. **Task Discovery**: Scan for missing cells, skip completed ones
3. **Batch Processing**: Process cells in parallel batches
4. **Result Integration**: Update Excel file and checkpoint atomically
5. **Progress Persistence**: Save after each batch completion

## Technical Implementation

### Data Structures

#### Checkpoint Format
```json
{
  "2-5": true,    # Row 2, Column 5 completed
  "2-6": true,    # Row 2, Column 6 completed
  "3-7": true     # Row 3, Column 7 completed
}
```

#### Task Queue Format
```python
[(row, col, term, section), ...]  # List of tuples for processing
```

### API Integration

#### Prompt Construction
```python
def construct_prompt(term: str, section: str) -> str:
    return (
        f'You are an AI/ML educational content assistant. '
        f'For the term "{term}", please write only the content for this section:\n\n'
        f'"{section}"\n\n'
        "Do not include any extra headings or formatting—just the prose, "
        "concise enough to fit in one spreadsheet cell."
    )
```

#### Error Handling Strategy
1. **Primary Model**: Attempt with `gpt-4.1-nano`
2. **Retry Logic**: Up to 3 attempts with increasing delays
3. **Fallback Model**: Switch to `gpt-3.5-turbo` on final attempt
4. **Graceful Degradation**: Log failures but continue processing

### Concurrency Model

#### ThreadPoolExecutor Implementation
```python
with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
    futures = {
        pool.submit(call_openai_api, term, section, row, col): (row, col)
        for row, col, term, section in batch
    }
    for fut in as_completed(futures):
        # Process results as they complete
```

## Usage Guide

### Command Line Interface

```bash
# Standard processing (top-down)
python aimlv2.py

# Bottom-up processing (reverse order)
python aimlv2.py --mode bottomup

# Reset progress and start fresh
python aimlv2.py --reset-checkpoint

# Custom configuration
python aimlv2.py --workers 10 --batch-size 30 --file custom.xlsx
```

### Available Arguments
- `--mode`: `topdown` (default) or `bottomup`
- `--reset-checkpoint`: Clear all progress and restart
- `--workers`: Override concurrent worker count
- `--batch-size`: Override batch processing size
- `--file`: Specify alternative Excel file

### Monitoring and Logging

#### Log Levels and Outputs
- **INFO**: Progress updates, batch completions, configuration
- **WARNING**: Retry attempts, corrupted checkpoints, short content
- **ERROR**: API failures, file operations, thread exceptions

#### Log File Location
- Primary: `ai_content_generator.log` (persistent)
- Console: Real-time output with timestamps
- Progress: Visual progress bar via `tqdm`

## Performance Characteristics

### Processing Rates
- **API Throughput**: ~25 requests/second (limited by worker count)
- **Batch Completion**: 75 cells per batch (~3 minutes per batch)
- **Daily Capacity**: ~21,600 API calls (limited by OpenAI quotas)
- **Estimated Total Time**: 6-12 hours for complete processing

### Resource Usage
- **Memory**: ~50MB for Excel file loading
- **Network**: Dependent on OpenAI API response times
- **Disk I/O**: Minimal (atomic writes only)
- **CPU**: Low (I/O bound workload)

## Error Handling and Recovery

### Common Scenarios

#### 1. Network Interruptions
- **Detection**: Timeout exceptions, connection errors
- **Recovery**: Automatic retry with exponential backoff
- **Persistence**: Progress saved after each batch

#### 2. API Quota Limits
- **Detection**: Rate limit error codes
- **Recovery**: Automatic retry with increased delays
- **Monitoring**: Log warnings for quota approaching

#### 3. File Corruption
- **Prevention**: ZIP validation before processing
- **Detection**: BadZipFile exceptions
- **Recovery**: Error message with manual intervention guidance

#### 4. System Interruptions
- **Detection**: KeyboardInterrupt, system shutdown
- **Recovery**: Graceful shutdown with progress preservation
- **Restart**: Automatic resume from last checkpoint

### Data Integrity Measures

#### Atomic Operations
```python
def safe_save_workbook(wb: openpyxl.Workbook, target_path: str):
    tmp_path = target_path + ".tmp"
    wb.save(tmp_path)
    os.replace(tmp_path, target_path)  # Atomic on most filesystems
```

#### Checkpoint Validation
```python
def reconcile_checkpoint(ws, checkpoint):
    # Remove checkpoint entries for cells that are actually empty
    # Prevents false "completion" states
```

## Security Considerations

### API Key Management
- **Current**: Hardcoded in script (development)
- **Recommendation**: Use environment variables for production
- **Best Practice**: Implement key rotation and access logging

### Data Protection
- **Backup Strategy**: Timestamped Excel backups preserved
- **Corruption Prevention**: Atomic writes and integrity validation
- **Access Control**: File system permissions (not implemented)

## Future Enhancements

### Performance Improvements
1. **Dynamic Batching**: Adjust batch size based on API response times
2. **Intelligent Retry**: Exponential backoff with jitter
3. **Rate Limit Awareness**: Proactive throttling based on quota usage
4. **Streaming Updates**: Real-time Excel file updates

### Feature Additions
1. **Multi-Model Support**: Rotate between different OpenAI models
2. **Content Validation**: Quality checks for generated content
3. **Partial Resumes**: Resume from specific terms or sections
4. **Parallel File Processing**: Handle multiple Excel files simultaneously

### Monitoring and Observability
1. **Metrics Collection**: API usage, error rates, processing times
2. **Real-time Dashboard**: Web interface for monitoring progress
3. **Alerting System**: Notifications for failures or completions
4. **Performance Analytics**: Historical processing statistics

## Troubleshooting Guide

### Common Issues

#### 1. "Corrupt member" Error
- **Cause**: Excel file corruption
- **Solution**: Open in Excel and "Save As" to repair

#### 2. API Key Invalid
- **Cause**: Expired or incorrect OpenAI API key
- **Solution**: Update API key in script line 41

#### 3. Checkpoint Corruption
- **Cause**: Improper shutdown during checkpoint save
- **Solution**: Script automatically backs up and recreates

#### 4. Memory Issues
- **Cause**: Large Excel file size
- **Solution**: Increase system memory or reduce batch size

### Debug Mode
Enable detailed logging by modifying:
```python
logging.basicConfig(level=logging.DEBUG)
```

## Integration Points

### Dependencies
- **openpyxl**: Excel file manipulation
- **openai**: API client library
- **tqdm**: Progress bar visualization
- **concurrent.futures**: Parallel processing

### File Relationships
- **Input**: `aiml.xlsx` (primary data)
- **State**: `checkpoint.json` (progress tracking)
- **Output**: Updated `aiml.xlsx` (in-place modification)
- **Logs**: `ai_content_generator.log` (persistent logging)

### External Services
- **OpenAI API**: Content generation
- **File System**: Data persistence and backup
- **Operating System**: Process management and signal handling