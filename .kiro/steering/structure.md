# Project Structure

## Root Directory Organization

```
├── client/                 # Frontend React application
│   ├── src/               # React source code
│   ├── public/            # Static assets
│   └── index.html         # HTML entry point
├── server/                # Backend Express application
│   ├── routes/            # API route handlers
│   ├── middleware/        # Express middleware
│   ├── utils/             # Server utilities
│   └── index.ts           # Server entry point
├── shared/                # Shared code between client/server
│   └── schema.ts          # Database schema definitions
├── scripts/               # Build and utility scripts
├── docs/                  # Project documentation
├── tests/                 # Test files
├── stories/               # Storybook stories
├── migrations/            # Database migrations
└── data/                  # Data files and imports
```

## Key Directories

### Frontend (`client/src/`)
- `components/` - Reusable React components
- `pages/` - Route-level page components
- `hooks/` - Custom React hooks
- `lib/` - Frontend utilities and configurations
- `styles/` - CSS and styling files
- `types/` - TypeScript type definitions

### Backend (`server/`)
- `routes/` - Express route handlers organized by feature
- `middleware/` - Authentication, security, logging middleware
- `utils/` - Server-side utilities (logging, error handling)
- `jobs/` - Background job processing
- `monitoring/` - Performance and health monitoring

### Shared (`shared/`)
- `schema.ts` - Drizzle ORM database schema with all table definitions
- Type definitions shared between frontend and backend

### Scripts (`scripts/`)
- Content management and data import scripts
- Testing and audit automation
- Performance analysis tools
- Database maintenance utilities

### Documentation (`docs/`)
- Comprehensive project documentation
- Setup guides and API documentation
- Architecture and design decisions
- Performance and security reports

## File Naming Conventions

### Components
- PascalCase for component files: `TermCard.tsx`
- camelCase for utility files: `apiClient.ts`
- kebab-case for CSS modules: `term-card.module.css`

### API Routes
- RESTful naming: `/api/terms`, `/api/users`
- Nested resources: `/api/terms/:id/sections`
- Admin routes: `/api/admin/content`

### Database Tables
- snake_case for table names: `user_profiles`, `learning_paths`
- Consistent naming patterns for relationships
- Proper indexing for performance

## Import Path Aliases

```typescript
// Configured in tsconfig.json and vite.config.ts
"@/*": ["./client/src/*"]     # Frontend components and utilities
"@shared/*": ["./shared/*"]   # Shared types and schemas
"@assets/*": ["./attached_assets/*"] # Static assets
```

## Configuration Files

### Build & Development
- `vite.config.ts` - Vite build configuration with optimizations
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `biome.json` - Code formatting and linting

### Testing
- `vitest.config.ts` - Unit test configuration
- `playwright.config.js` - E2E test configuration
- `cypress.config.ts` - Alternative E2E testing

### Deployment
- `Dockerfile` - Container configuration
- `docker-compose.*.yml` - Multi-environment Docker setup
- `.env.example` - Environment variable template

## Data Flow Architecture

### Client-Server Communication
- REST API endpoints for data operations
- WebSocket connections for real-time features
- React Query for client-side caching and state management

### Database Layer
- Drizzle ORM for type-safe database operations
- PostgreSQL with optimized indexes
- Redis for caching frequently accessed data

### Authentication Flow
- Firebase Auth for user management
- JWT tokens for API authentication
- Role-based access control (guest/free/premium/admin)

## Development Workflow

### Feature Development
1. Create feature branch from `main`
2. Implement changes in appropriate directories
3. Add tests and Storybook stories
4. Update documentation as needed
5. Run quality checks before PR

### Code Organization Principles
- Separation of concerns between client/server
- Shared types and schemas for consistency
- Modular component architecture
- Comprehensive error handling and logging
- Performance optimization at build time