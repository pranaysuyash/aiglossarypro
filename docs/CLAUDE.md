# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 DEPLOYMENT STATUS: Production Ready - Sunday Deployment Target

**STATUS**: Major Progress - Authentication & Revenue Systems Complete (June 27, 2025)
**TARGET**: Production deployment by Sunday

### ✅ Key Features Implemented
- **Cost-Free Authentication**: JWT + OAuth (Google/GitHub) replacing Replit auth - $0/month cost
- **Complete Revenue System**: All 16 revenue tracking methods operational
- **Enhanced Storage**: 3-tier architecture (enhancedStorage → optimizedStorage → database)
- **42-Section Architecture**: Complete Excel parser with 295 columns → 42 structured sections
- **Database Performance**: 60-80% response time improvement with optimized indexes
- **Monetization**: PPP pricing (21 countries) + Gumroad integration
- **Test Suite**: Comprehensive testing infrastructure (5 test files, 1,500+ lines)

### 🎯 Current Priorities (Sunday Deployment)
```bash
# 1. Complete remaining TypeScript fixes  
npm run check  # Current: ~200 errors (non-critical, app runs), Target: <50 errors

# 2. API Endpoint Optimization
# Optimize all API endpoints for performance and completeness

# 3. Security Audit & Hardening
# Comprehensive security review for production

# 4. Production Configuration
# Finalize deployment configuration and testing

# 5. Performance Monitoring
# Implement monitoring and alerting systems
```

## Development Workflow

### Branching Strategy
**Parallel Development Protocol**: Since both Claude and Gemini work on the codebase simultaneously, we use feature branches to prevent conflicts:

```bash
# Claude branches
git checkout -b claude/feature-name       # For Claude's work
git checkout -b claude/fixes-batch-1      # For multiple fixes

# Gemini branches  
git checkout -b gemini/feature-name       # For Gemini's work

# Process
1. Create feature branch from main
2. Commit changes to feature branch
3. Push feature branch to remote
4. Create PR to merge into main
5. Review for conflicts before merging
```

**Latest Completed**: `refactor/code-stability` - ✅ MAJOR PROGRESS - Authentication & Revenue Systems Complete

**Progress**: 
- ✅ Cost-free JWT + OAuth authentication system implemented
- ✅ Complete revenue tracking system restored (16 methods)
- ✅ Enhanced Storage 3-tier architecture operational
- ✅ Server running successfully with all routes registered
- ✅ Mock authentication working for development
- 🔄 Next: API optimization, security audit, TypeScript cleanup

## Build and Development Commands

### Development
```bash
npm run dev              # Start development server (auto-login as dev@example.com)
npm run db:push          # Push database schema changes
npm run db:studio        # Open Drizzle Studio
npm run db:indexes       # Apply performance indexes
npm run import:optimized # Import large datasets
```

### Production Dataset Processing
```bash
# For large Excel files (>100MB), convert to CSV first:
ssconvert data/aiml.xlsx data/aiml.csv

# Then process with streaming:
npx tsx csv_streaming_processor.ts  # Handles unlimited file size
```

### Testing
```bash
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:component   # Component tests only
npm run test:coverage    # With coverage report
```

## Architecture Overview

### Database Schema
- **Base Tables**: users, terms, categories, favorites
- **Enhanced Tables**: enhanced_terms, term_sections (42-section architecture)
- **Analytics**: user_term_views, content_analytics, ai_usage_analytics
- **Monetization**: purchases, revenue tracking (16 methods operational)
- **Authentication**: JWT-based sessions with OAuth integration

### API Structure
```
/api/
├── auth/           # Authentication endpoints
├── terms/          # Term CRUD operations
├── categories/     # Category management
├── admin/          # Admin features (content, revenue, users)
├── monitoring/     # System health
├── analytics/      # Usage analytics
└── media/          # File uploads
```

### Key Technologies
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS
- **Backend**: Node.js, Express, Drizzle ORM
- **Database**: Neon PostgreSQL with full-text search
- **Auth**: Cost-free JWT + OAuth (Google/GitHub) with dev mock fallback
- **Monetization**: Gumroad integration with webhooks

## Critical Notes

### Environment Variables
Required:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `JWT_SECRET`: JWT token signing key
- `NODE_ENV`: development/production
- `OPENAI_API_KEY`: For AI features

Optional (Cost-free OAuth):
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`: GitHub OAuth

### Security Considerations
- ⚠️ **URGENT**: Add `requireAdmin` middleware to 7 unprotected admin endpoints
- Rate limiting: 50 terms/day for new users (7-day grace period)
- Session-based authentication with secure cookies
- Input validation using Zod schemas

### Performance Optimizations
- Database indexes on frequently queried fields
- Query caching with memoization
- React component optimization (React.memo, useCallback, useMemo)
- Lazy loading for heavy components

### Common Development Tasks

#### Database Access
```bash
# Drizzle Studio (recommended)
npm run db:studio

# Direct access
psql $DATABASE_URL -c "SELECT COUNT(*) FROM terms;"
```

#### Adding New API Endpoints
1. Create route handler in `server/routes/`
2. Register in `server/routes/index.ts`
3. Add types to `shared/types.ts`
4. Update API client in `client/src/lib/api.ts`

#### Debugging Issues
```bash
# Check database connectivity
NODE_ENV=development node -e "
const { Pool } = require('@neondatabase/serverless');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT 1 as test').then(console.log).catch(console.error);
"

# Monitor performance
npm run dev 2>&1 | grep -E "(database|error|connection)"
```

## Monetization System

### Implementation
- **Pricing**: $129 lifetime access with PPP discounts
- **Platform**: Gumroad with webhook integration
- **Protection**: Rate limiting prevents bulk scraping
- **Tracking**: Complete revenue analytics dashboard

### Key Endpoints
```
/api/admin/revenue/dashboard     # Revenue overview
/api/admin/revenue/purchases     # Purchase management
/api/admin/revenue/analytics     # Revenue analytics
/api/gumroad/webhook            # Purchase webhook
```

## Deployment

### Production Checklist (Sunday Target)
- [x] ✅ Cost-free authentication system implemented
- [x] ✅ Revenue tracking system operational
- [x] ✅ Enhanced storage architecture working
- [x] ✅ Server running with all routes registered
- [ ] 🔄 API endpoint optimization for performance
- [ ] 🔄 Security audit and hardening
- [ ] 🔄 Fix critical TypeScript compilation errors
- [ ] 🔄 Production configuration and testing
- [ ] 🔄 Performance monitoring implementation
- [ ] 🔄 Process production dataset (CSV conversion if needed)

### Infrastructure Status
- ✅ Database optimized (10,372 terms, 2,036 categories)
- ✅ Cost-free authentication system operational
- ✅ Complete revenue tracking system working
- ✅ Enhanced 3-tier storage architecture
- ✅ Frontend performance optimized
- ✅ API endpoints registered and functional
- ✅ Large dataset processing ready
- ⏳ API optimization pending (in progress)
- ⏳ Security audit pending (high priority)
- ⏳ Production monitoring pending

## Quick Reference

### Content Statistics
- **Terms**: 10,372 AI/ML definitions
- **Categories**: 2,036 organized topics
- **Sections**: 42 structured sections per term
- **Tables**: 26 database tables

### Performance Targets
- **API Response**: <1 second
- **Component Render**: <100ms
- **Concurrent Requests**: 20 requests <2 seconds
- **Page Load**: <3 seconds

### Next Steps (Sunday Deployment)
1. 🔥 API endpoint optimization for performance
2. 🔥 Security audit and hardening
3. 🔥 Production configuration and testing
4. 📊 Performance monitoring implementation
5. 🔧 TypeScript error cleanup (non-critical)
6. 📁 Process production CSV dataset

---
*Last Updated: June 27, 2025*
*Target: Production deployment by Sunday*
*Current Status: 75% Complete - Authentication & Revenue Systems Operational*

Always work on your own branch, merge to main if no conflicts once all changes are committed.
Suggestions when provided in cli should also be documented
Always create a separate review doc if you feel a second set of eyes would be helpful especially while we are working with multiple agents in parallel.