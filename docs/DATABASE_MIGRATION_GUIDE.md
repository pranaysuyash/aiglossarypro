# Database Migration Guide

## Overview
This guide provides comprehensive instructions for database setup, migrations, and optimization for the AI/ML Glossary Pro application. It covers initial deployment, schema migrations, bulk data imports, and performance optimization for production environments.

## Table of Contents
- [Environment Setup](#environment-setup)
- [Initial Database Setup](#initial-database-setup)
- [Migration Process](#migration-process)
- [Database Verification](#database-verification)
- [Bulk Import Optimization](#bulk-import-optimization)
- [Enhanced Schema Migration](#enhanced-schema-migration)
- [Troubleshooting](#troubleshooting)

## Environment Setup

### Required Environment Variables

**MANDATORY**: The application will fail to start without these:

```bash
# Database connection string (PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Example connection strings:
# Neon: postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
# Supabase: postgresql://postgres.xxxx:pass@aws-0-us-east-1.pooler.supabase.com:5432/postgres
# Local: postgresql://postgres:password@localhost:5432/aimlglossary
```

### Verifying Environment

Before proceeding, verify your database configuration:

```bash
# Check database status and connectivity
npm run db:status
```

This command will:
- Verify DATABASE_URL is configured
- Test database connectivity
- List all tables and their status
- Provide optimization recommendations

## Initial Database Setup

### Step 1: Create Database

**For managed services (Neon, Supabase):**
- Database is created automatically when you provision the service
- Copy the connection string from your provider's dashboard

**For self-hosted PostgreSQL:**
```sql
CREATE DATABASE aimlglossary;
```

### Step 2: Run Initial Migration

```bash
# Push all schemas to database
npm run db:push
```

This creates all tables defined in:
- `shared/schema.ts` - Core application tables
- `shared/enhancedSchema.ts` - Enhanced features tables

### Step 3: Apply Performance Indexes

```bash
# Apply all performance optimizations
npm run db:indexes
npm run db:indexes-enhanced
npm run db:search-indexes
```

### Step 4: Verify Setup

```bash
# Confirm all tables and indexes are created
npm run db:status
```

Expected output:
```
📊 TABLE STATUS:
────────────────────────────────────────────────────────────────────────────────
Table Name                    Exists    Rows           Indexes
────────────────────────────────────────────────────────────────────────────────
sessions                      ✓         0              2 indexes
users                         ✓         0              2 indexes
[... all tables should show ✓ ...]

✅ Database check PASSED
```

## Migration Process

### Running Migrations

```bash
# For schema changes
npm run db:push

# For production migrations with version control
drizzle-kit generate:pg
drizzle-kit push:pg
```

### Migration Best Practices

1. **Always backup before migrations:**
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Check current state:**
   ```bash
   npm run db:status > pre_migration_status.txt
   ```

3. **Apply migrations in order:**
   - Schema changes first
   - Data migrations second
   - Index creation last

4. **Verify after migration:**
   ```bash
   npm run db:status
   ```

## Database Verification

The `db:status` script provides comprehensive verification:

### What It Checks

1. **Connection Health**
   - DATABASE_URL configuration
   - Connection pool status
   - Query execution capability

2. **Schema Integrity**
   - All 21 expected tables
   - Row counts per table
   - Index coverage

3. **Performance Settings**
   - work_mem (recommended: 16MB+)
   - maintenance_work_mem (recommended: 64MB+)
   - Critical index presence

4. **Bulk Import Readiness**
   - Table capacity
   - Index optimization
   - Memory settings

### Running Verification

```bash
# Full database status check
npm run db:status

# Open visual database browser
npm run db:studio
```

## Bulk Import Optimization

For importing large datasets (10,000+ terms, 286MB+ files):

### Pre-Import Setup

1. **Optimize PostgreSQL settings:**
   ```sql
   -- Increase memory for current session
   SET work_mem = '32MB';
   SET maintenance_work_mem = '128MB';
   
   -- For very large imports
   SET synchronous_commit = 'off';
   SET checkpoint_completion_target = 0.9;
   ```

2. **Prepare data:**
   - Convert Excel to CSV for files > 100MB
   - Use streaming import for large files
   - Split into batches of 1000-5000 records

3. **Disable constraints temporarily (if needed):**
   ```sql
   -- Disable foreign key checks
   SET session_replication_role = 'replica';
   -- Run import
   SET session_replication_role = 'origin';
   ```

### Import Process

```bash
# For optimized import
npm run import:optimized -- --file data.csv

# Monitor progress
tail -f logs/import.log
```

### Post-Import Optimization

1. **Update table statistics:**
   ```sql
   ANALYZE enhanced_terms;
   ANALYZE term_sections;
   VACUUM ANALYZE;
   ```

2. **Rebuild indexes if needed:**
   ```sql
   REINDEX TABLE enhanced_terms;
   ```

3. **Verify data integrity:**
   ```bash
   npm run db:status
   ```

### Performance Benchmarks

- 10,000 terms: 2-5 minutes (optimized)
- 50,000 terms: 10-15 minutes
- 100,000+ terms: 20-30 minutes

## Enhanced Schema Migration

The enhanced schema adds sophisticated data structures for advanced features:

## Migration Summary

### What Was Changed
1. **Updated Schema Configuration**: Modified `drizzle.config.ts` and `server/db.ts` to use `enhancedSchema.ts`
2. **Enhanced Database Structure**: Added 7 new tables for complex term management
3. **Preserved Existing Data**: All existing tables and data remain intact
4. **Updated Imports**: All server files now import from `@shared/enhancedSchema`

### New Tables Added

#### 1. `enhanced_terms`
**Purpose**: Advanced term storage with rich categorization and metadata
**Key Features**:
- Complex categorization (main categories, subcategories, application domains)
- Search optimization (search text, keywords)
- Interactive features flags
- Analytics tracking (view count, last viewed)
- Parse metadata for version control

#### 2. `term_sections`
**Purpose**: Stores structured content from the 42-section framework
**Key Features**:
- Section-based content organization
- Flexible display types (card, sidebar, main, modal, metadata)
- Priority-based ordering
- Interactive section support

#### 3. `interactive_elements`
**Purpose**: Manages interactive content components
**Key Features**:
- Multiple element types (mermaid, quiz, demo, code)
- Flexible element data storage via JSONB
- Display ordering and activation controls

#### 4. `term_relationships`
**Purpose**: Defines connections between terms
**Key Features**:
- Multiple relationship types (prerequisite, related, extends, alternative)
- Relationship strength scoring (1-10)
- Bidirectional relationship support

#### 5. `display_configs`
**Purpose**: Customizable layouts per term
**Key Features**:
- Multiple configuration types (card, detail, mobile)
- Flexible layout definitions via JSONB
- Default configuration support

#### 6. `enhanced_user_settings`
**Purpose**: Advanced user personalization
**Key Features**:
- Experience level adaptation
- Section visibility preferences
- Content type preferences (math, code, interactive)
- UI customization (compact mode, dark mode)

#### 7. `content_analytics`
**Purpose**: Content performance tracking
**Key Features**:
- Engagement metrics (views, time spent, interactions)
- Quality metrics (ratings, helpfulness votes)
- Section-level analytics

## Migration Process

### Files Modified
- `/drizzle.config.ts` - Updated schema path
- `/server/db.ts` - Updated import path
- `/server/storage.ts` - Updated import path
- `/server/importCleanData.ts` - Updated import path
- `/server/pythonProcessor.ts` - Updated import path
- `/server/quickSeed.ts` - Updated import path
- `/server/manualImport.ts` - Updated import path
- `/server/excelStreamer.ts` - Updated import path
- `/server/excelParser.ts` - Updated import path
- `/server/seed.ts` - Updated import path

### Migration Files Created
- `/migrations/0000_exotic_nick_fury.sql` - Full schema generation (reference only)
- `/migrations/0001_add_enhanced_tables.sql` - Safe incremental migration

## Running the Migration

### Step 1: Apply the Migration
```bash
# Run the custom migration (safer approach)
psql $DATABASE_URL -f migrations/0001_add_enhanced_tables.sql

# OR use Drizzle Kit (only if starting fresh)
npx drizzle-kit push:pg
```

### Step 2: Verify Migration
```sql
-- Check if new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'enhanced_terms', 'term_sections', 'interactive_elements', 
  'term_relationships', 'display_configs', 'enhanced_user_settings', 
  'content_analytics'
);

-- Verify indexes were created
SELECT indexname FROM pg_indexes 
WHERE tablename IN (
  'enhanced_terms', 'term_sections', 'interactive_elements', 
  'term_relationships', 'display_configs', 'content_analytics'
);
```

## Performance Optimizations

### Indexes Added
- **enhanced_terms**: name, slug, difficulty_level, main_categories, search_text
- **term_sections**: (term_id, section_name), display_type
- **interactive_elements**: term_id, element_type
- **term_relationships**: from_term_id, to_term_id, relationship_type
- **display_configs**: (term_id, config_type)
- **content_analytics**: term_id, section_name

### Query Optimization Features
- Full-text search support via `search_text` column
- Array-based categorization for efficient filtering
- JSONB storage for flexible content structure
- Foreign key constraints for data integrity

## Data Migration Strategy

### Existing Data Preservation
- All original tables remain unchanged
- No data loss or modification
- Backward compatibility maintained

### Future Data Population
The enhanced tables will be populated through:
1. **AI-powered content parsing** - Extract structured data from existing terms
2. **User interaction tracking** - Populate analytics tables
3. **Administrative configuration** - Set up display configs and relationships

## Schema Compatibility

### Original Schema Support
The enhanced schema maintains full compatibility with the original schema by:
- Re-exporting all original tables
- Preserving original table structures
- Maintaining existing relationships

### Type Safety
All TypeScript types are maintained and enhanced:
- Original types remain available
- New enhanced types added
- Validation schemas provided via Zod

## Rollback Plan

If rollback is needed:
1. **Revert configuration files**:
   ```bash
   # Revert drizzle.config.ts
   git checkout HEAD~1 -- drizzle.config.ts
   
   # Revert db.ts and other imports
   git checkout HEAD~1 -- server/db.ts
   # ... repeat for other files
   ```

2. **Drop enhanced tables** (if necessary):
   ```sql
   DROP TABLE IF EXISTS content_analytics CASCADE;
   DROP TABLE IF EXISTS enhanced_user_settings CASCADE;
   DROP TABLE IF EXISTS display_configs CASCADE;
   DROP TABLE IF EXISTS term_relationships CASCADE;
   DROP TABLE IF EXISTS interactive_elements CASCADE;
   DROP TABLE IF EXISTS term_sections CASCADE;
   DROP TABLE IF EXISTS enhanced_terms CASCADE;
   ```

## Next Steps

### Data Population
1. Implement enhanced term parser to populate `enhanced_terms`
2. Extract section data to populate `term_sections`
3. Configure basic relationships in `term_relationships`

### Feature Development
1. Update frontend to utilize enhanced schema
2. Implement analytics tracking
3. Build personalization features
4. Create admin interface for content management

### Monitoring
1. Monitor query performance with new indexes
2. Track database size growth
3. Optimize queries based on usage patterns

## Troubleshooting

### Common Issues

#### Database Connection Failed
```
Error: Database connection failed: password authentication failed
```
**Solutions:**
- Verify DATABASE_URL format
- Check credentials and SSL mode
- Ensure database server is accessible

#### Migration Errors
```
Error: relation "table_name" already exists
```
**Solutions:**
- Database state out of sync
- Use `db:studio` to inspect actual schema
- Drop and recreate if safe

#### Slow Imports
```
Import taking > 30 minutes for 10k records
```
**Solutions:**
- Increase work_mem: `SET work_mem = '64MB';`
- Check network latency
- Use CSV streaming instead of Excel
- Process in smaller batches

#### Out of Memory
```
FATAL: out of memory
```
**Solutions:**
- Reduce batch size
- Increase server memory
- Use streaming imports

### Debug Commands

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Find slow queries
SELECT query, state, wait_event_type, wait_event
FROM pg_stat_activity 
WHERE state = 'active';

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## Production Checklist

Before deploying to production:

- [ ] DATABASE_URL configured and tested
- [ ] All migrations applied successfully
- [ ] Performance indexes created
- [ ] Database status check passes
- [ ] Bulk data imported (if applicable)
- [ ] Query performance acceptable
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Documentation updated

## Support

For database issues:
1. Run `npm run db:status` and save output
2. Check application logs for errors
3. Review PostgreSQL logs
4. Verify all environment variables
5. Contact development team with diagnostics

## Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Tuning_Your_PostgreSQL_Server)
- [Neon Documentation](https://neon.tech/docs/introduction)
- [Supabase Documentation](https://supabase.com/docs)