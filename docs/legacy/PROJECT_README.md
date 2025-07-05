# AI/ML Glossary Pro

A comprehensive, production-ready glossary platform for AI/ML terms with 42-section detailed content structure, advanced search, and analytics.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon, Supabase, or self-hosted)

### Environment Setup

**MANDATORY**: Create a `.env` file with your database connection:

```bash
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

### Installation

```bash
# Install dependencies
npm install

# Setup database (creates all tables)
npm run db:push

# Apply performance indexes
npm run db:indexes

# Start development server
npm run dev
```

## 📖 Documentation

For comprehensive setup, deployment, and configuration instructions, see:

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide with database setup
- **[docs/](./docs/)** - Full documentation library

## 🏗️ Architecture

- **Backend**: Express.js with TypeScript, Drizzle ORM
- **Frontend**: React with Vite, Tailwind CSS
- **Database**: PostgreSQL with enhanced storage layer
- **Features**: 42-section content structure, advanced Excel parsing, analytics

## 🔑 Key Features

- ✅ **42-Section Content Structure** - Comprehensive AI/ML term coverage
- ✅ **Advanced Excel Parser** - Processes 295-column files with row-wise efficiency  
- ✅ **Enhanced Search** - Full-text search with relevance scoring
- ✅ **Admin Dashboard** - File upload, import management, analytics
- ✅ **Production Ready** - Security, caching, error handling, monitoring

## 🛠️ Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Database management
npm run db:status    # Check database status
npm run db:push      # Apply schema changes
npm run db:indexes   # Add performance indexes
```

## 📊 Production Ready

The system is production-ready with:
- Environment-based configuration (dev/prod)
- Host binding (0.0.0.0 for production)
- Static asset alignment (Vite → Express)
- Security middleware and admin RBAC
- Analytics and monitoring
- Error handling and logging

For deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).