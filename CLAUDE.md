# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

### Development
```bash
npm run dev              # Start development server with auto-login as dev@example.com
npm run db:push          # Push database schema changes to PostgreSQL
npm run db:studio        # Open Drizzle Studio for database management
npm run db:indexes       # Apply performance indexes for optimized queries
npm run import:optimized # Import large datasets with optimized batch processing

### Error Handling and Monitoring
```bash
# Monitor application health and errors
GET /api/monitoring/health        # System health check
GET /api/monitoring/errors        # Recent error logs (admin)
GET /api/monitoring/database      # Database performance metrics
GET /api/monitoring/metrics       # Application metrics

# User feedback and suggestions
POST /api/feedback/term/:termId   # Submit feedback for specific term
POST /api/feedback/general        # Submit general feedback or term requests
GET /api/feedback                 # Get feedback for admin review

# Automatic cross-references and term linking  
POST /api/cross-reference/process # Process text for automatic term links
GET /api/cross-reference/term/:id # Get cross-references for a term
PUT /api/cross-reference/term/:id/update-links # Update term with automatic links
```

### Testing
```bash
npm test                 # Run all tests with Vitest
npm run test:unit        # Run unit tests only
npm run test:component   # Run component tests only
npm run test:visual      # Run Playwright visual regression tests
npm run test:coverage    # Run tests with coverage report
npm run test:all         # Run all test suites sequentially
```

### Building and Production
```bash
npm run build            # Build client (Vite) and server (ESBuild) for production
npm run start            # Start production server (requires NODE_ENV=production)
npm run check            # Run TypeScript type checking
```

### Component Development
```bash
npm run storybook        # Start Storybook on port 6006
npm run build-storybook  # Build static Storybook
```

## High-Level Architecture

### Dual Authentication System
The application implements a sophisticated dual authentication system that automatically switches based on environment:

- **Development Mode** (`NODE_ENV=development`): Uses mock authentication with automatic login as `dev@example.com` (admin user). No OAuth setup required.
- **Production Mode** (`NODE_ENV=production`): Uses full Replit OAuth integration with real user accounts.

The authentication middleware is selected dynamically in `server/routes/auth.ts`:
```typescript
const authMiddleware = features.replitAuthEnabled ? isAuthenticated : mockIsAuthenticated;
```

### Database Architecture
The application uses a two-tier schema system:

1. **Base Schema** (`shared/schema.ts`): Standard tables for users, terms, categories, favorites, etc.
2. **Enhanced Schema** (`shared/enhancedSchema.ts`): Advanced 42-section architecture for complex AI/ML terms with:
   - `termSections` table for flexible content sections
   - `enhancedTerms` table with AI-enhanced features
   - Support for interactive elements, media, and structured data

### API Architecture
- **RESTful API** under `/api/` with modular route organization
- **Smart Caching**: Uses `memoizee` for performance optimization
- **Batch Processing**: Supports chunked data imports for large datasets
- **Performance Monitoring**: Built-in middleware tracks API response times

Key API modules:
- `auth.ts`: Authentication and user management
- `terms.ts`: Term CRUD operations and search
- `categories.ts`: Category management
- `admin.ts`: Admin functions including Excel import/export
- `ai.ts`: AI content generation and enhancement

### Frontend Architecture
- **React 18** with TypeScript and Vite for fast development
- **Component Library**: Uses shadcn/ui components with Tailwind CSS
- **Data Fetching**: React Query with smart caching and refetching
- **State Management**: React hooks and context for global state
- **Routing**: React Router DOM v7 with nested routes

Key frontend patterns:
- All API calls go through `client/src/lib/api.ts` utility
- Components are organized by feature in `client/src/components/`
- Pages follow route structure in `client/src/pages/`
- Shared types in `shared/types.ts` ensure type safety across client/server

### Performance Optimizations
Recent performance improvements reduced API response times from 170+ seconds to <1 second by:
- Eliminating N+1 query problems in database operations
- Implementing smart caching with memoization
- Adding database indexes on frequently queried fields
- Optimizing React component re-renders

#### Large Dataset Import Optimizations
For handling large datasets (10k+ terms), the application includes optimized import tools:
- **Bulk Inserts**: Insert 100+ records in single SQL operations instead of individual inserts
- **Transaction Batching**: Group operations in transactions to reduce database overhead
- **Memory Management**: Stream processing and garbage collection for large files
- **Concurrent Processing**: Parallel operation processing with configurable limits
- **Progress Monitoring**: Real-time progress tracking and performance metrics

Usage examples:
```bash
# Standard optimized import
npm run import:optimized data/large-glossary.json

# High-performance import for massive datasets
npm run import:optimized data/huge-dataset.json --batch-size 2000 --bulk-insert-size 200

# Memory-conscious import for constrained environments
npm run import:optimized data/terms.json --no-transactions --max-concurrent 2
```

### File Storage and Processing
- **Excel/CSV Processing**: Python scripts in `server/python/` for data import
- **AWS S3 Integration**: Optional file storage for media and exports
- **Google Drive API**: Optional integration for document management
- **Chunked Uploads**: Support for large file processing

## Critical Implementation Notes

### Environment Variables
Required:
- `DATABASE_URL`: PostgreSQL connection string (Neon)
- `SESSION_SECRET`: Session encryption key
- `NODE_ENV`: Controls authentication mode (development/production)

Optional:
- `AWS_*`: S3 configuration for file storage
- `OPENAI_API_KEY`: For AI content features
- `GOOGLE_*`: Google Drive integration

### Database Migrations
The application uses Drizzle ORM with push-based migrations. Schema changes should be made in `shared/schema.ts` or `shared/enhancedSchema.ts`, then applied with `npm run db:push`.

### Error Handling
- All API routes return standardized `ApiResponse<T>` format
- Frontend displays errors using toast notifications
- Authentication errors automatically redirect to appropriate pages

### Security Considerations
- CSRF protection enabled in production
- Session-based authentication with secure cookies
- Input validation using Zod schemas
- SQL injection prevention through Drizzle ORM

## Common Development Tasks

### Running a Single Test
```bash
# Run a specific test file
npx vitest run tests/unit/api.test.ts

# Run tests matching a pattern
npx vitest run -t "authentication"

# Run tests in watch mode for a specific file
npx vitest tests/component/TermCard.test.tsx
```

### Debugging Database Issues
```bash
# Open database studio to inspect data
npm run db:studio

# Check database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM terms;"
```

### Adding New API Endpoints
1. Create route handler in `server/routes/`
2. Register in `server/routes/index.ts`
3. Add TypeScript types to `shared/types.ts`
4. Update API client in `client/src/lib/api.ts`

### Component Development Workflow
1. Create component in `client/src/components/`
2. Add Storybook story in `stories/`
3. Write component tests in `tests/component/`
4. Use in pages under `client/src/pages/`