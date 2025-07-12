# AI/ML Glossary Pro - Deployment Guide

This guide provides comprehensive instructions for deploying the AI/ML Glossary Pro application, with a focus on database setup and optimization for large-scale data imports.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Migration Process](#migration-process)
- [Database Verification](#database-verification)
- [Bulk Import Optimization](#bulk-import-optimization)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon, Supabase, or self-hosted)
- Environment file (.env) configured
- 500MB+ free disk space for large data imports

## Environment Variables

### Required Environment Variables

Create a `.env` file in the project root with the following **mandatory** variables:

```bash
# MANDATORY - Database connection string
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Example connection strings:
# Neon: postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
# Supabase: postgresql://postgres.xxxx:pass@aws-0-us-east-1.pooler.supabase.com:5432/postgres
# Local: postgresql://postgres:password@localhost:5432/aimlglossary
```

### Optional Environment Variables

```bash
# Application settings
NODE_ENV=production
PORT=3000

# Authentication (if using social auth)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Session secret
SESSION_SECRET=your_secure_session_secret

# OpenAI API (for AI features)
OPENAI_API_KEY=your_openai_api_key

# AWS S3 (for media storage)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_bucket_name
```

## Database Setup

### Step 1: Create Database

If you haven't already created a database:

**For Neon:**
1. Sign up at https://neon.tech
2. Create a new project
3. Copy the connection string from the dashboard

**For Supabase:**
1. Sign up at https://supabase.com
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string (use the "Transaction" mode URL)

**For Self-hosted PostgreSQL:**
```sql
CREATE DATABASE aimlglossary;
```

### Step 2: Verify Database Connection

Run the database status check script:

```bash
npm run db:status
```

This will verify:
- Database connectivity
- Environment variable configuration
- Existing tables and their status
- Performance recommendations

Expected output for a new installation:
```
=== AI/ML Glossary Database Status Check ===

Database URL: ✓ Configured
Connection Status: ✓ Connected

⚠️  WARNINGS:
  - Table 'sessions' does not exist
  - Table 'users' does not exist
  [... more tables ...]

📊 TABLE STATUS:
────────────────────────────────────────────────────────────────────────────────
Table Name                    Exists    Rows           Indexes
────────────────────────────────────────────────────────────────────────────────
sessions                      ✗         -              -
users                         ✗         -              -
[... more tables ...]
```

## Migration Process

### Step 1: Push Schema to Database

Run the Drizzle migration to create all tables:

```bash
npm run db:push
```

This command:
- Creates all tables defined in the schema
- Sets up foreign key relationships
- Creates basic indexes

### Step 2: Apply Performance Indexes

For optimal performance, especially with large datasets:

```bash
# Apply standard performance indexes
npm run db:indexes

# Apply enhanced indexes for complex queries
npm run db:indexes-enhanced

# Apply search-specific indexes
npm run db:search-indexes
```

### Step 3: Verify Migration Success

Run the status check again to confirm all tables are created:

```bash
npm run db:status
```

You should see all tables with "✓" in the Exists column.

### Step 4: Initialize Category Hierarchy (Optional)

If your data uses hierarchical categories:

```bash
npm run db:category-hierarchy
```

## Database Verification

The `db:status` script provides comprehensive database verification:

### What It Checks

1. **Connection Status**
   - DATABASE_URL configuration
   - Database connectivity
   - Connection pool health

2. **Table Status**
   - All required tables exist
   - Row counts for each table
   - Index counts and coverage

3. **Performance Settings**
   - work_mem configuration
   - maintenance_work_mem settings
   - Critical index presence

4. **Bulk Import Readiness**
   - Database capacity
   - Optimization recommendations
   - Missing indexes that affect import speed

### Interpreting Results

**✅ PASSED**: All tables exist, connection is healthy
**⚠️  WARNINGS**: Non-critical issues (e.g., missing optional indexes)
**❌ FAILED**: Critical issues (e.g., no database connection)

## Bulk Import Optimization

For importing the 286MB dataset with 10,000+ terms:

### Pre-Import Optimizations

1. **Increase PostgreSQL Memory Settings**
   ```sql
   -- For the current session only
   SET work_mem = '32MB';
   SET maintenance_work_mem = '128MB';
   ```

2. **Temporarily Disable Foreign Key Checks** (if needed)
   ```sql
   SET session_replication_role = 'replica';
   -- Run your import
   SET session_replication_role = 'origin';
   ```

3. **Use CSV Streaming Import**
   ```bash
   # The application uses streaming for large files automatically
   # Files > 100MB are processed via CSV streaming
   ```

### Import Process

1. **Convert Excel to CSV** (if needed)
   ```bash
   # Use a tool like xlsx-cli or Excel itself
   xlsx-cli input.xlsx -o output.csv
   ```

2. **Run Optimized Import**
   ```bash
   npm run import:optimized -- --file path/to/your/data.csv
   ```

3. **Monitor Progress**
   - Check server logs for batch processing updates
   - Monitor database connections
   - Watch for memory usage

### Post-Import Optimization

1. **Update Statistics**
   ```sql
   ANALYZE enhanced_terms;
   ANALYZE term_sections;
   ```

2. **Vacuum Database** (if many updates occurred)
   ```sql
   VACUUM ANALYZE;
   ```

3. **Verify Import**
   ```bash
   npm run db:status
   ```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```
Error: Database connection failed: password authentication failed
```
**Solution**: Verify DATABASE_URL format and credentials

#### 2. Tables Don't Exist After Migration
```
Warning: Table 'enhanced_terms' does not exist
```
**Solution**: Run `npm run db:push` and check for errors

#### 3. Slow Bulk Imports
```
Import taking > 30 minutes for 10k terms
```
**Solutions**:
- Increase work_mem: `SET work_mem = '64MB';`
- Process in smaller batches
- Check network latency to database
- Use CSV streaming instead of Excel parsing

#### 4. Out of Memory During Import
```
FATAL: out of memory
```
**Solutions**:
- Reduce batch size in import script
- Increase server memory
- Use streaming import for large files

### Performance Benchmarks

Expected performance for 10,000 terms import:
- With indexes: 5-10 minutes
- Without indexes: 2-5 minutes (but slower queries later)
- With optimizations: 2-3 minutes

### Database Monitoring

Monitor key metrics during deployment:

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Slow queries
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Rollback Procedures

If you need to rollback:

### Drop All Tables
```sql
-- WARNING: This will delete all data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

### Restore from Backup
```bash
# If you have a backup
pg_restore -d aimlglossary backup.dump
```

## Production Checklist

Before going live:

- [ ] DATABASE_URL is set and verified
- [ ] All migrations completed successfully
- [ ] Performance indexes applied
- [ ] Database status check passes
- [ ] Bulk data imported successfully
- [ ] Application starts without errors
- [ ] Test queries perform within acceptable time
- [ ] Backup strategy implemented
- [ ] Monitoring configured

## Support

For deployment issues:
1. Run `npm run db:status` and save the output
2. Check application logs for detailed errors
3. Verify all environment variables are set
4. Consult PostgreSQL logs for database-specific issues

Remember: The database is the foundation of the application. Ensure it's properly configured before proceeding with the rest of the deployment.