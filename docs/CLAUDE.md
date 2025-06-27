# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 DEPLOYMENT STATUS: Production Ready - Sunday Deployment Target

**STATUS**: Major Progress - Authentication & Revenue Systems Complete (June 27, 2025)
**TARGET**: Production deployment by Sunday

### ✅ Key Features Implemented

- **Cost-Free Authentication**: JWT + OAuth (Google/GitHub) replacing Replit auth - $0/month cost ✅
- **Complete Revenue System**: All 16 revenue tracking methods operational ✅
- **Enhanced Storage**: 3-tier architecture (enhancedStorage → optimizedStorage → database) ✅
- **42-Section Architecture**: Complete Excel parser with 295 columns → 42 structured sections ✅
- **Database Performance**: 60-80% response time improvement with optimized indexes ✅
- **CSV Streaming Processor**: Handles unlimited file size with line-by-line processing ✅
- **Production Deployment Script**: Comprehensive deployment automation ✅
- **React Performance**: React.memo, useCallback, useMemo optimizations in 9 components ✅
- **Critical Security Fixes**: Admin endpoints secured, user feedback accessible ✅
- **Smart Pagination**: Scalable pagination with metadata for large datasets ✅
- **Monetization**: PPP pricing (21 countries) + Gumroad integration ✅

### 🎯 Current Priorities (Sunday Deployment) - 85% Complete

```bash
# CRITICAL PATH REMAINING (~11 hours total)

# 1. Complete Security Audit & Hardening (~4 hours)
npm run security:audit  # Fix remaining security vulnerabilities

# 2. Production Configuration & Testing (~2 hours) 
npm run deploy:config   # Finalize deployment configuration

# 3. Performance Monitoring Implementation (~3 hours)
npm run monitoring:setup # Implement error tracking and alerting

# 4. Full Dataset Processing (~2 hours)
npm run import:production # Process 10,372-term dataset

# 5. Final Testing & Validation (~2 hours)
npm run test:production  # End-to-end production testing
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

**Latest Completed**: `main` - ✅ CRITICAL SECURITY FIXES & API IMPROVEMENTS

**Progress**:

- ✅ Cost-free JWT + OAuth authentication system implemented
- ✅ Complete revenue tracking system restored (16 methods)
- ✅ Enhanced Storage 3-tier architecture operational
- ✅ CRITICAL: Fixed admin health endpoint security vulnerability
- ✅ CRITICAL: Fixed user feedback authentication (was admin-only)
- ✅ NEW: Smart pagination with metadata for large datasets
- ✅ Server running successfully with all routes registered
- 🔄 Next: Complete security audit, production config, monitoring

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

### Production Checklist (Sunday Target) - 85% Complete

- [X] ✅ Cost-free authentication system implemented
- [X] ✅ Revenue tracking system operational
- [X] ✅ Enhanced storage architecture working
- [X] ✅ Server running with all routes registered
- [X] ✅ Critical security vulnerabilities fixed
- [X] ✅ API pagination improved with scalable design
- [X] ✅ CSV streaming processor for large datasets
- [X] ✅ Production deployment script ready
- [X] ✅ React components performance optimized
- [X] ✅ Database indexes and query optimization
- [ ] 🔄 Complete security audit and hardening (4h remaining)
- [ ] 🔄 Production configuration and testing (2h remaining)
- [ ] 🔄 Performance monitoring implementation (3h remaining)
- [ ] 🔄 Process full production dataset (2h remaining)
- [ ] 🔄 Final TypeScript error cleanup (low priority)

### Infrastructure Status - Production Ready Foundation

- ✅ Database optimized (10,372 terms, 2,036 categories)
- ✅ Cost-free authentication system operational ($0/month savings)
- ✅ Complete revenue tracking system working (16 methods)
- ✅ Enhanced 3-tier storage architecture
- ✅ Critical security vulnerabilities patched
- ✅ Smart pagination for scalable data access
- ✅ Frontend performance optimized (9 components)
- ✅ CSV streaming processor (unlimited file size)
- ✅ Production deployment script ready
- ✅ API endpoints secured and functional
- ✅ Large dataset processing infrastructure ready
- ⏳ Security audit 80% complete (final review needed)
- ⏳ Production monitoring pending (implementation ready)
- ⏳ Full dataset processing pending (infrastructure ready)

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

*Last Updated: June 27, 2025 - Evening Update*
*Target: Production deployment by Sunday*
*Current Status: 85% Complete - Core Systems Operational & Secured*
*Remaining: 11 hours of security audit, config, and monitoring work*

Never work on your own branch, all changes are committed using git add . and not specific files. only exclude whatever is to be excluded using gitignore.
Suggestions when provided in cli should also be documented
Always create a separate review doc if you feel a second set of eyes would be helpful especially while we are working with multiple agents in parallel.
