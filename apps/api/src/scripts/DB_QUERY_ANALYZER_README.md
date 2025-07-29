# Database Query Analyzer

A comprehensive tool for analyzing PostgreSQL database performance in the AI/ML Glossary application.

## Features

- **Table Statistics Analysis**: Row counts, existing indexes, and missing index recommendations
- **Query Performance Analysis**: EXPLAIN ANALYZE for common query patterns
- **Execution Plan Analysis**: Identifies sequential scans, nested loops, and cache hit ratios
- **Connection Pool Monitoring**: Tracks active, idle, and long-running queries
- **Missing Index Detection**: Identifies foreign keys without indexes
- **Performance Recommendations**: Provides actionable suggestions for optimization

## Usage

```bash
# Run the analyzer
npm run db:analyze

# Or run directly
tsx server/scripts/analyze-db-queries.ts
```

## What it Analyzes

### 1. Table Statistics
- Row counts for all tables
- Existing indexes per table
- Missing indexes, especially on foreign keys

### 2. Common Query Patterns
- User lookup by email
- Terms by category with pagination
- User activity tracking with date ranges
- Full-text search on terms

### 3. Performance Metrics
- Query execution time
- Sequential scan detection
- Cache hit ratios
- Buffer usage statistics

### 4. Connection Pool Health
- Active vs idle connections
- Long-running queries (>5 minutes)
- Connection distribution

## Output Format

The analyzer generates a comprehensive report with:

1. **Table Statistics**: Overview of all tables with row counts and index information
2. **High Priority Issues**: Queries requiring immediate attention
3. **Medium Priority Issues**: Queries that could benefit from optimization
4. **Missing Index Recommendations**: Specific indexes that should be created
5. **Summary Statistics**: Overall health metrics

## Thresholds

- **Slow Query**: >100ms execution time
- **Critical**: >500ms execution time
- **Large Table**: >1000 rows (for missing index recommendations)
- **Low Cache Hit**: <90% cache hit ratio

## Next Steps After Analysis

1. **Create Missing Indexes**: Use the recommendations to create indexes on foreign keys and frequently queried columns
2. **Optimize Slow Queries**: Review queries marked as high priority and consider query rewrites
3. **Monitor Connection Pool**: Adjust pool size based on usage patterns
4. **Regular Analysis**: Run this tool periodically, especially after schema changes

## Integration with CI/CD

Consider adding this to your deployment pipeline:

```yaml
- name: Analyze Database Performance
  run: npm run db:analyze
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Extending the Analyzer

To add new query patterns to analyze, edit the `analyzeCommonQueries()` method in the script:

```typescript
{
  name: 'Your Query Description',
  query: sql`SELECT * FROM your_table WHERE condition = value`,
  expectedIndex: 'column_name'
}
```