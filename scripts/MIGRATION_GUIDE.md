# Hierarchical Migration Guide

This guide provides comprehensive instructions for migrating from the current flat section structure to the hierarchical structure based on the 42-section, 295-column architecture.

## Overview

The migration transforms your current flat section structure into a hierarchical one that supports:
- 42 main sections with nested subsections
- 295 total columns properly mapped to hierarchical structure
- Preserved user progress data
- Enhanced search and navigation capabilities
- Interactive element support

## Migration Scripts

### 1. `migrate-to-hierarchical.ts` - Main Migration Script

Transforms the flat structure to hierarchical structure.

**Features:**
- Maps current sections to 42-section hierarchical structure
- Preserves user progress data
- Creates backup tables automatically
- Supports batch processing to handle large datasets
- Comprehensive logging and error handling
- Dry-run mode for testing

**Usage:**
```bash
# Dry run (recommended first)
npx ts-node scripts/migrate-to-hierarchical.ts --dry-run

# Live migration with confirmation
npx ts-node scripts/migrate-to-hierarchical.ts

# Live migration without confirmation (automated)
npx ts-node scripts/migrate-to-hierarchical.ts --yes
```

**Key Operations:**
1. Validates current database state
2. Creates backup tables with timestamp
3. Reads current terms and flat sections
4. Maps to hierarchical structure using `complete_42_sections_config.ts`
5. Preserves user progress with path-based mapping
6. Updates enhanced_terms metadata
7. Updates search indexes
8. Generates detailed migration log

### 2. `rollback-hierarchical-migration.ts` - Rollback Script

Reverts the hierarchical migration back to flat structure.

**Features:**
- Restores from backup tables
- Creates safety backup of hierarchical state
- Comprehensive validation and integrity checks
- Support for specific backup timestamp selection

**Usage:**
```bash
# List available backups
npx ts-node scripts/rollback-hierarchical-migration.ts --list-backups

# Dry run rollback
npx ts-node scripts/rollback-hierarchical-migration.ts --dry-run

# Live rollback with confirmation
npx ts-node scripts/rollback-hierarchical-migration.ts

# Rollback to specific timestamp
npx ts-node scripts/rollback-hierarchical-migration.ts --timestamp=2024-01-01T10-30-00-000Z

# Automated rollback
npx ts-node scripts/rollback-hierarchical-migration.ts --yes
```

**Key Operations:**
1. Finds and validates backup tables
2. Creates safety backup of current hierarchical state
3. Restores sections, section_items, and user_progress from backups
4. Cleans up hierarchical structures (term_sections, etc.)
5. Reverts enhanced_terms metadata
6. Updates search indexes
7. Validates rollback integrity

### 3. `test-hierarchical-migration.ts` - Test Script

Tests migration with small dataset for validation.

**Features:**
- Creates test data or uses existing data
- Runs migration on limited dataset
- Validates results with detailed reporting
- Calculates data integrity scores
- Provides recommendations

**Usage:**
```bash
# Test with generated test data (3 terms, 5 sections each, 3 items per section)
npx ts-node scripts/test-hierarchical-migration.ts

# Test with existing data (first 5 terms)
npx ts-node scripts/test-hierarchical-migration.ts --use-existing --terms=5

# Custom test parameters
npx ts-node scripts/test-hierarchical-migration.ts --terms=2 --sections=8 --items=4

# Keep test data for inspection
npx ts-node scripts/test-hierarchical-migration.ts --no-cleanup
```

**Test Parameters:**
- `--use-existing`: Use existing terms instead of creating test data
- `--terms=N`: Number of terms to test (default: 3)
- `--sections=N`: Sections per term for test data (default: 5)
- `--items=N`: Items per section for test data (default: 3)
- `--no-cleanup`: Keep test data after test completion

## Migration Process

### Phase 1: Pre-Migration Planning

1. **Review Current State**
   ```bash
   # Check current database structure
   psql $DATABASE_URL -c "
   SELECT 
     COUNT(*) as term_count,
     (SELECT COUNT(*) FROM sections) as section_count,
     (SELECT COUNT(*) FROM section_items) as item_count,
     (SELECT COUNT(*) FROM user_progress) as progress_count
   FROM enhanced_terms;
   "
   ```

2. **Test Migration Logic**
   ```bash
   # Run test migration
   npx ts-node scripts/test-hierarchical-migration.ts
   
   # Review test report
   cat test-migration-report-*.json
   ```

3. **Dry Run Full Migration**
   ```bash
   npx ts-node scripts/migrate-to-hierarchical.ts --dry-run
   ```

### Phase 2: Migration Execution

1. **Create Database Backup** (Optional but recommended)
   ```bash
   pg_dump $DATABASE_URL > backup-before-hierarchical-migration.sql
   ```

2. **Run Migration**
   ```bash
   npx ts-node scripts/migrate-to-hierarchical.ts
   ```

3. **Verify Results**
   ```bash
   # Check migration log
   cat migration-log-*.json
   
   # Verify database state
   psql $DATABASE_URL -c "
   SELECT 
     COUNT(*) as term_count,
     (SELECT COUNT(*) FROM term_sections) as hierarchical_sections,
     (SELECT COUNT(*) FROM user_progress) as progress_count
   FROM enhanced_terms;
   "
   ```

### Phase 3: Post-Migration Validation

1. **Test Application Functionality**
   - Verify term display works correctly
   - Check navigation functions properly
   - Validate user progress is preserved
   - Test search functionality

2. **Performance Testing**
   - Monitor query performance
   - Check memory usage
   - Validate caching behavior

3. **User Acceptance Testing**
   - Test with real user accounts
   - Verify all features work as expected
   - Check for any data inconsistencies

## Hierarchical Structure Mapping

### 42 Main Sections

The migration maps your current sections to these 42 standardized sections:

1. **Term** - Basic term information
2. **Introduction** (8 subsections including categories)
3. **Prerequisites** (6 subsections with interactive tutorials)
4. **Theoretical Concepts** (7 subsections with mathematical visualizations)
5. **How It Works** (6 subsections with flowcharts)
6. **Variants or Extensions** (6 subsections with comparison charts)
7. **Applications** (6 subsections with case studies)
8. **Implementation** (13 subsections with nested challenges)
9. **Evaluation and Metrics** (7 subsections with calculators)
10. **Advantages and Disadvantages** (4 subsections)
11. **Ethics and Responsible AI** (8 subsections with scenarios)
12. **Historical Context** (11 subsections with timeline)
13. **Illustration or Diagram** (5 subsections with interactive visuals)
14. **Related Concepts** (10 subsections with concept maps)
15. **Case Studies** (7 subsections with walkthroughs)
16. **Interviews with Experts** (7 subsections)
17. **Hands-on Tutorials** (7 subsections with live code)
18. **Interactive Elements** (7 subsections)
19. **Industry Insights** (7 subsections)
20. **Common Challenges and Pitfalls** (5 subsections)
21. **Real-world Datasets and Benchmarks** (7 subsections)
22. **Tools and Frameworks** (5 subsections)
23. **Did You Know?** (6 subsections)
24. **Quick Quiz** (4 subsections)
25. **Further Reading** (7 subsections)
26. **Project Suggestions** (4 subsections)
27. **Recommended Websites and Courses** (5 subsections)
28. **Collaboration and Community** (4 subsections)
29. **Research Papers** (7 subsections)
30. **Career Guidance** (6 subsections)
31. **Future Directions** (7 subsections)
32. **Glossary** (8 subsections)
33. **FAQs** (5 subsections)
34. **Tags and Keywords** (6 subsections)
35. **Appendices** (4 subsections)
36. **Index** (3 subsections)
37. **References** (4 subsections)
38. **Conclusion** (4 subsections)
39. **Metadata** (7 subsections)
40. **Best Practices** (3 subsections)
41. **Security Considerations** (3 subsections)
42. **Optimization Techniques** (3 subsections)

### Content Mapping Strategy

1. **Exact Match**: Sections with identical names are mapped directly
2. **Fuzzy Match**: Sections with similar names are mapped using similarity algorithms
3. **Content Analysis**: Section content is analyzed to determine best hierarchical placement
4. **Default Placement**: Unmapped sections are placed in appropriate default locations
5. **Interactive Detection**: Interactive elements are automatically identified and flagged

## User Progress Preservation

### Progress Mapping Strategy

1. **Path-Based Mapping**: User progress is mapped using hierarchical paths
2. **Section Correlation**: Original section IDs are correlated with new hierarchical sections
3. **Completion Status**: Completion percentages and timestamps are preserved
4. **User Context**: All user-specific progress data is maintained

### Progress Data Structure

Before Migration:
```sql
user_progress (user_id, term_id, section_id, status, completion_percentage)
```

After Migration:
```sql
user_progress (user_id, term_id, section_path, status, completion_percentage)
```

## Database Schema Changes

### New Tables

1. **term_sections**: Hierarchical section data
   ```sql
   CREATE TABLE term_sections (
     id UUID PRIMARY KEY,
     term_id UUID REFERENCES enhanced_terms(id),
     section_name VARCHAR(100),
     section_data JSONB,
     display_type VARCHAR(20),
     priority INTEGER,
     is_interactive BOOLEAN,
     path VARCHAR(255),
     parent_path VARCHAR(255),
     depth INTEGER
   );
   ```

### Modified Tables

1. **enhanced_terms**: Updated metadata fields
   - `has_interactive_elements`
   - `has_code_examples`
   - `has_case_studies`
   - `parse_version`

2. **user_progress**: Updated to use hierarchical paths
   - `section_id` → `section_path`

## Backup and Recovery

### Automatic Backups

The migration script automatically creates backup tables:
- `sections_backup_TIMESTAMP`
- `section_items_backup_TIMESTAMP`
- `user_progress_backup_TIMESTAMP`

### Manual Backup

```bash
# Full database backup
pg_dump $DATABASE_URL > full-backup-$(date +%Y%m%d_%H%M%S).sql

# Table-specific backups
pg_dump $DATABASE_URL -t sections -t section_items -t user_progress > tables-backup-$(date +%Y%m%d_%H%M%S).sql
```

### Recovery Options

1. **Rollback Script**: Use provided rollback script for automated recovery
2. **Manual Restoration**: Restore from backup tables manually
3. **Full Database Restore**: Restore from complete database backup

## Troubleshooting

### Common Issues

1. **Migration Fails with Foreign Key Errors**
   - Check for orphaned records in section_items
   - Validate term_id references in sections table
   - Run integrity check before migration

2. **User Progress Data Loss**
   - Verify backup tables exist
   - Check section mapping logic
   - Use rollback script if necessary

3. **Performance Issues After Migration**
   - Run ANALYZE on new tables
   - Check index creation
   - Verify query optimization

4. **Interactive Elements Not Detected**
   - Check metadata parsing logic
   - Verify content type detection
   - Review interactive element criteria

### Error Resolution

1. **Check Migration Log**
   ```bash
   cat migration-log-*.json | jq '.logs[] | select(.type == "error")'
   ```

2. **Validate Database State**
   ```bash
   npx ts-node scripts/validate-migration.ts
   ```

3. **Run Rollback if Necessary**
   ```bash
   npx ts-node scripts/rollback-hierarchical-migration.ts
   ```

## Performance Considerations

### Optimization Strategies

1. **Batch Processing**: Migration processes data in configurable batches
2. **Index Optimization**: New indexes are created for hierarchical queries
3. **Query Caching**: Updated cache strategies for hierarchical data
4. **Memory Management**: Efficient memory usage during migration

### Monitoring

1. **Migration Progress**: Real-time progress reporting
2. **Resource Usage**: Monitor CPU and memory during migration
3. **Database Performance**: Track query performance before and after
4. **Error Tracking**: Comprehensive error logging and reporting

## Best Practices

### Before Migration

1. **Test Thoroughly**: Use test script with representative data
2. **Backup Everything**: Create comprehensive backups
3. **Schedule Downtime**: Plan for potential application downtime
4. **Notify Users**: Inform users of scheduled maintenance

### During Migration

1. **Monitor Progress**: Watch migration logs in real-time
2. **Check Resource Usage**: Monitor server performance
3. **Be Ready to Rollback**: Have rollback plan ready
4. **Document Issues**: Record any problems encountered

### After Migration

1. **Validate Results**: Thoroughly test all functionality
2. **Monitor Performance**: Watch for performance regressions
3. **Update Documentation**: Update API and user documentation
4. **Clean Up**: Remove old backup tables after validation

## Support and Maintenance

### Migration Support

- Review migration logs for issues
- Use test scripts for validation
- Implement rollback procedures if needed
- Monitor application performance

### Long-term Maintenance

- Regular backup of hierarchical structure
- Performance monitoring and optimization
- User feedback collection and analysis
- Continuous improvement of hierarchical organization

## Conclusion

This migration system provides a robust, tested approach to transforming your flat section structure into a hierarchical one. The comprehensive toolset includes:

- **Safe Migration**: Automatic backups and rollback capabilities
- **Thorough Testing**: Comprehensive test suite with validation
- **Data Preservation**: Complete preservation of user progress and content
- **Performance Optimization**: Efficient processing and indexing
- **Comprehensive Logging**: Detailed logging for troubleshooting and auditing

Follow this guide carefully, test thoroughly, and you'll have a successful migration to the new hierarchical structure that will greatly enhance your application's content organization and user experience.