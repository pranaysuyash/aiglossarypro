# Getting Started - AI/ML Glossary Pro Enhancement

## 🚀 Quick Start Guide

### Prerequisites Check
- [ ] **Replit Project**: Ensure `AIGlossaryPro` is accessible and running
- [ ] **Main Data**: Verify `/Users/pranay/Projects/AIMLGlossary/aiml.xlsx` exists (10,372 terms × 295 columns)
- [ ] **Active Process**: Confirm `aimlv2.py` status (should be 61.7% complete, processing remaining terms)
- [ ] **Database Access**: Ensure PostgreSQL connection is working
- [ ] **Development Environment**: Node.js, Python, and necessary dependencies installed

### Immediate Actions (First 15 Minutes)

#### 1. Environment Setup
```bash
# Navigate to project directory
cd /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro

# Verify all documentation is present
ls docs/
# Should show: AIMLV2_DOCUMENTATION.md, WEBSITE_ARCHITECTURE.md, 
#              REPLIT_INTEGRATION_PLAN.md, PROJECT_OVERVIEW.md, etc.

# Check current project status
npm run dev  # Verify existing Replit project works
```

#### 2. Database Backup (Critical First Step)
```bash
# Create backup before any changes
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Or if using Replit database
# Navigate to Database tab and export/backup current schema
```

#### 3. Review Current State
```bash
# Check main Excel file status
ls -la /Users/pranay/Projects/AIMLGlossary/aiml.xlsx
# Should show large file (50MB+)

# Check if aimlv2.py is currently running
ps aux | grep aimlv2.py
# If running, note the process ID - DO NOT INTERRUPT
```

## 📋 Development Workflow

### Phase 1 Start (Database Enhancement)
1. **Read** `docs/REPLIT_INTEGRATION_PLAN.md` completely
2. **Follow** `TODO.md` Phase 1 checklist
3. **Create** database backup (critical safety step)
4. **Begin** schema enhancement with new tables

### Session Management
```bash
# At start of each session:
cd /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro
git status  # Check for any uncommitted changes
npm run dev  # Verify project is working

# Check TODO.md for last completed task
grep -n "✅\|☑️" TODO.md | tail -5  # See recent completions
```

### Key Commands

#### Development
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run db:push     # Push schema changes to database
npm run check       # TypeScript type checking
```

#### Database Operations
```bash
# Schema changes
npm run db:push

# Generate migration
npx drizzle-kit generate:pg

# Check database status
npx drizzle-kit introspect:pg
```

#### Python Processing
```bash
# Test Excel processor (when ready)
cd server/python
python excel_hierarchical_processor.py --input "../../../aiml.xlsx" --output "test_output.json"

# Process sample data first
python excel_hierarchical_processor.py --input "sample.xlsx" --output "sample_output.json" --max-rows 10
```

## 🎯 Key Milestones

### Milestone 1: Enhanced Database (Week 1)
- [ ] Database backup completed
- [ ] New tables created (term_content_sections, content_structure)
- [ ] Schema migrations successful
- [ ] Test data inserted and verified

### Milestone 2: Excel Processing (Week 1-2)
- [ ] Hierarchical processor created
- [ ] Sample data processed successfully
- [ ] Full Excel file processed (10,372 terms)
- [ ] Data imported to database

### Milestone 3: Enhanced Frontend (Week 3)
- [ ] Tabbed term interface implemented
- [ ] Hierarchical navigation created
- [ ] Content type rendering working
- [ ] Mobile experience optimized

### Milestone 4: Integration Complete (Week 4)
- [ ] All features working with new data structure
- [ ] Performance optimized
- [ ] Testing completed
- [ ] Ready for production deployment

## 🔧 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check database connection
echo $DATABASE_URL
# Should show valid PostgreSQL connection string

# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

#### Excel File Access
```bash
# Verify Excel file
file /Users/pranay/Projects/AIMLGlossary/aiml.xlsx
# Should show: Microsoft Excel 2007+

# Check file permissions
ls -la /Users/pranay/Projects/AIMLGlossary/aiml.xlsx
# Should show read permissions for current user
```

#### aimlv2.py Process
```bash
# Check if process is running
ps aux | grep aimlv2.py

# If stuck, check log file
tail -f /Users/pranay/Projects/AIMLGlossary/ai_content_generator.log

# Check checkpoint status
cat /Users/pranay/Projects/AIMLGlossary/checkpoint.json | jq 'keys | length'
# Shows number of completed cells
```

### Emergency Procedures

#### Database Issues
```bash
# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# Reset to clean state
npm run db:push --force
```

#### Process Conflicts
```bash
# If accidentally interrupt aimlv2.py
cd /Users/pranay/Projects/AIMLGlossary
python aimlv2.py  # Will resume from checkpoint
```

## 📚 Essential Reading Order

1. **This file** (`GETTING_STARTED.md`) - Overview and immediate actions
2. **`docs/PROJECT_OVERVIEW.md`** - Complete project context
3. **`TODO.md`** - Detailed implementation checklist
4. **`docs/REPLIT_INTEGRATION_PLAN.md`** - Technical architecture details
5. **`docs/WEBSITE_ARCHITECTURE.md`** - Frontend design specifications

## 🎯 Success Indicators

### After Each Session
- [ ] No existing functionality broken
- [ ] Progress documented in TODO.md
- [ ] Database remains stable
- [ ] `aimlv2.py` process undisturbed (if running)
- [ ] All changes committed to version control

### Project Completion
- [ ] 10,372 terms accessible via hierarchical interface
- [ ] 295 content dimensions properly organized
- [ ] All existing features preserved and enhanced
- [ ] Performance meets or exceeds current standards
- [ ] User experience significantly improved

## 🚨 Critical Warnings

1. **DO NOT** interrupt `aimlv2.py` while it's processing content
2. **ALWAYS** backup database before schema changes
3. **NEVER** modify `/Users/pranay/Projects/AIMLGlossary/aiml.xlsx` directly
4. **TEST** each phase thoroughly before proceeding to next
5. **MAINTAIN** all existing user data and preferences

---

**Ready to begin?** Start with `TODO.md` Phase 1.1 - Database backup and proceed systematically through each phase. The comprehensive documentation in `docs/` folder provides all the context needed for successful implementation.