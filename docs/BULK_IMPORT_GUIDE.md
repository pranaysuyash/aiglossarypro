# AI Glossary Pro - Bulk Import Guide

This guide explains how to import large datasets (10,000+ terms) into the AI Glossary Pro application.

## Overview

The bulk import system provides a robust, scalable solution for importing AI/ML terms from CSV or JSON files with the following features:

- **Streaming Processing**: Handles large CSV files without loading everything into memory
- **Batch Processing**: Configurable batch sizes for optimal performance
- **Progress Tracking**: Real-time progress updates and ETA calculations
- **Error Recovery**: Automatic retry logic for transient failures
- **Duplicate Detection**: Skips existing terms to avoid conflicts
- **Data Validation**: Validates term data before import
- **Incremental Import**: Resume interrupted imports from specific row
- **Detailed Reporting**: Comprehensive import statistics and error logs

## Quick Start

### 1. Convert Excel to CSV (if needed)

If your data is in Excel format, first convert it to CSV:

```bash
# Check available conversion methods
npx tsx scripts/convert-excel-to-csv.ts

# Convert specific file
npx tsx scripts/convert-excel-to-csv.ts data/aiml.xlsx data/aiml.csv

# Install Node.js converter
npx tsx scripts/convert-excel-to-csv.ts --install-node
```

### 2. Import CSV Data

```bash
# Basic import
npx tsx scripts/import-bulk-terms.ts --source data/aiml.csv --format csv

# Import with custom batch size
npx tsx scripts/import-bulk-terms.ts --source data/aiml.csv --batch-size 200

# Dry run to preview
npx tsx scripts/import-bulk-terms.ts --source data/aiml.csv --dry-run --verbose

# Import first 1000 rows
npx tsx scripts/import-bulk-terms.ts --source data/aiml.csv --max-rows 1000
```

### 3. Import JSON Data

```bash
# Import JSON file
npx tsx scripts/import-bulk-terms.ts --source data/terms.json --format json
```

## Data Formats

### CSV Format

The importer supports multiple CSV structures:

#### Simple Format
```csv
Term,Definition,Category,Prerequisites,Related Terms
Machine Learning,"A method of data analysis...","AI","Statistics,Programming","Deep Learning,Neural Networks"
```

#### Extended Format (295 columns)
The importer automatically detects and processes the 295-column format from the original Excel files, mapping columns to appropriate sections.

### JSON Format

#### Array of Terms
```json
[
  {
    "term_name": "Machine Learning",
    "basic_definition": "A method of data analysis...",
    "main_categories": ["Artificial Intelligence"],
    "sub_categories": ["Supervised Learning"],
    "prerequisites": ["Statistics", "Programming"],
    "related_terms": ["Deep Learning", "Neural Networks"]
  }
]
```

#### Object with Terms Array
```json
{
  "terms": [
    {
      "term_name": "Neural Network",
      "basic_definition": "A computing system...",
      "sections": {
        "Introduction": {
          "Definition": "..."
        }
      }
    }
  ]
}
```

## Command Line Options

```bash
npx tsx scripts/import-bulk-terms.ts [options]

Options:
  --source <path>         Path to CSV or JSON file (required)
  --format <type>         File format: csv or json (default: csv)
  --batch-size <n>        Terms per batch (default: 100)
  --max-concurrent <n>    Max concurrent imports (default: 5)
  --skip-duplicates       Skip existing terms (default: true)
  --no-skip-duplicates    Import duplicate terms
  --validate              Validate data (default: true)
  --no-validate           Skip validation
  --dry-run               Preview without importing
  --verbose               Show detailed progress
  --resume-from <n>       Resume from row number (CSV only)
  --max-rows <n>          Limit rows to process
  --error-log <path>      Save error log to file
  --help, -h              Show help message
```

## Performance Optimization

### Batch Size
- Default: 100 terms per batch
- Increase for faster processing: `--batch-size 200`
- Decrease if experiencing memory issues: `--batch-size 50`

### Concurrent Processing
- Default: 5 concurrent imports
- Increase for faster imports: `--max-concurrent 10`
- Decrease for stability: `--max-concurrent 3`

### Memory Management
- The importer automatically triggers garbage collection when memory usage exceeds 1GB
- For very large files (>100MB), the streaming processor prevents memory overflow

## Error Handling

### Automatic Retry
The importer automatically retries failed imports for:
- Network timeouts
- Database connection errors
- Temporary failures

### Error Logging
Save detailed error logs for debugging:
```bash
npx tsx scripts/import-bulk-terms.ts --source data/aiml.csv --error-log import-errors.json
```

### Resume Interrupted Imports
If an import is interrupted, resume from a specific row:
```bash
npx tsx scripts/import-bulk-terms.ts --source data/aiml.csv --resume-from 5000
```

## Validation Rules

Terms are validated before import:
- **Required**: Term name and definition
- **Term name**: Max 200 characters
- **Definition**: Minimum 10 characters
- **Categories**: At least one main category required

Skip validation if you trust your data:
```bash
npx tsx scripts/import-bulk-terms.ts --source data/aiml.csv --no-validate
```

## Import Statistics

The importer provides detailed statistics:
- Total rows processed
- Successfully imported terms
- Skipped duplicates
- Validation errors
- Import errors
- Categories created
- Sections created
- Processing speed (terms/sec)
- Peak memory usage
- Estimated time remaining

## Best Practices

1. **Test First**: Always do a dry run or limited import first
   ```bash
   npx tsx scripts/import-bulk-terms.ts --source data/aiml.csv --dry-run --max-rows 100
   ```

2. **Monitor Progress**: Use verbose mode for detailed feedback
   ```bash
   npx tsx scripts/import-bulk-terms.ts --source data/aiml.csv --verbose
   ```

3. **Handle Large Files**: For files >10,000 rows, use appropriate batch sizes
   ```bash
   npx tsx scripts/import-bulk-terms.ts --source data/large.csv --batch-size 250
   ```

4. **Save Error Logs**: Always save error logs for large imports
   ```bash
   npx tsx scripts/import-bulk-terms.ts --source data/aiml.csv --error-log errors.json
   ```

## Troubleshooting

### Out of Memory Errors
- Reduce batch size: `--batch-size 50`
- Process in chunks: `--max-rows 5000`

### Slow Performance
- Increase batch size: `--batch-size 200`
- Increase concurrency: `--max-concurrent 10`

### Database Errors
- Check database connection
- Reduce concurrency: `--max-concurrent 3`
- Enable verbose mode for details

### Invalid Data
- Review validation errors in logs
- Use `--no-validate` to skip validation
- Clean data before import

## Data Preparation Tips

1. **Clean Data**: Remove empty rows and invalid characters
2. **Consistent Formatting**: Ensure consistent column names
3. **UTF-8 Encoding**: Save CSV files with UTF-8 encoding
4. **Category Names**: Use consistent category naming
5. **Arrays**: Use comma, semicolon, or pipe delimiters for array fields

## Example Workflows

### Import Complete Dataset
```bash
# Convert Excel to CSV
npx tsx scripts/convert-excel-to-csv.ts data/aiml.xlsx data/aiml.csv

# Test with first 100 rows
npx tsx scripts/import-bulk-terms.ts --source data/aiml.csv --max-rows 100 --verbose

# Import full dataset
npx tsx scripts/import-bulk-terms.ts --source data/aiml.csv --batch-size 200 --error-log import-errors.json
```

### Incremental Import
```bash
# Import first batch
npx tsx scripts/import-bulk-terms.ts --source data/aiml.csv --max-rows 5000

# Import next batch
npx tsx scripts/import-bulk-terms.ts --source data/aiml.csv --resume-from 5001 --max-rows 10000
```

### Debug Failed Import
```bash
# Dry run with verbose output
npx tsx scripts/import-bulk-terms.ts --source data/problem.csv --dry-run --verbose --max-rows 10

# Import without validation
npx tsx scripts/import-bulk-terms.ts --source data/problem.csv --no-validate --error-log debug.json
```

## Integration with Enhanced Storage

The bulk importer integrates with the enhanced storage system to:
- Create enhanced terms with full metadata
- Generate term sections from CSV columns
- Set up proper categorization
- Track import analytics
- Maintain data relationships

## Next Steps

After successful import:
1. Verify imported terms in the application
2. Review error logs for any issues
3. Test search functionality
4. Check category assignments
5. Validate term relationships

## Support

For issues or questions:
1. Check error logs for specific errors
2. Review this guide for troubleshooting
3. Run with `--verbose` for detailed output
4. Use `--dry-run` to test without importing