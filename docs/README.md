# AI Glossary Pro

> Comprehensive AI/ML terminology platform with dual authentication system for development and production environments.

## 🚨 DEPLOYMENT STATUS (June 2025)

**🔴 Critical Blockers Identified - Not Production Ready**

### Key Issues Identified (Immediate Action Required):
- **Data Loading Failure**: Glossary content is not loading into the app due to caching/processing bugs (0 terms imported). This is the #1 showstopper.
- **TypeScript Compilation Errors**: Hundreds of TypeScript errors, specifically in admin routes, blocking clean compilation and stability.
- **Incomplete Enhanced Storage**: The new `enhancedStorage` layer is unfinished, leading to non-functional features (e.g., recently viewed terms, admin stats).
- **Authentication & Admin Security**: Auth is not production-ready (mock auth in dev, untested Replit OAuth, insecure admin access control).
- **Frontend/UI Integration Gaps**: Admin UI features (e.g., local file upload) lack backend implementation, leading to broken functionality.

### Progress Summary:
- ✅ Core REST API endpoints for glossary content (terms, categories, search) are designed and mostly functional with `optimizedStorage`.
- ✅ Basic user features (favorites, progress tracking) have defined endpoints and database schema support.
- ✅ Frontend component library (Radix UI, React Query) is in place, with Storybook for isolated development.
- ✅ S3 integration is partially working for file listing and processing.

**See `docs/GEMINI_ACTION_PLAN_FOR_CLAUDE.md` for a detailed breakdown of tasks to address these blockers.**
**See `docs/CODEBASE_IMPROVEMENTS_REVIEW.md` for Gemini's independent codebase review findings.**

## 🚀 Quick Start

### Local Development
```bash
git clone <repository>
cd AIGlossaryPro
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```
**→ Open http://127.0.0.1:3001** (auto-login as development user)

### Production Deployment
```bash
# Ensure production environment variables are set
npm run build
npm start
```

## 📚 Documentation Index

### 🔐 Authentication System
- **[LOCAL_DEV_GUIDE.md](./LOCAL_DEV_GUIDE.md)** - Setup guide for local development
- **[AUTH_QUICK_REFERENCE.md](./AUTH_QUICK_REFERENCE.md)** - Quick troubleshooting & commands
- **[Authentication Architecture](./AUTH_ARCHITECTURE_DOCUMENTATION.md)** - Complete technical documentation
- **[AUTH_INCIDENT_PLAYBOOK.md](./AUTH_INCIDENT_PLAYBOOK.md)** - Incident response procedures

### 📖 Additional Documentation
- **[API_ENDPOINTS_SUMMARY.md](./API_ENDPOINTS_SUMMARY.md)** - API documentation
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Initial project setup
- **[DEPLOYMENT_PLANS.md](./DEPLOYMENT_PLANS.md)** - Deployment strategies

## 🏗️ Architecture Overview

### Authentication System
The application uses a **dual authentication system**:

| Environment | Authentication | User Session |
|-------------|----------------|--------------|
| **Development** | Mock Auth | `dev@example.com` (auto-login) |
| **Production** | Replit OAuth | Real user accounts |

**Automatic Detection**: The system automatically detects the environment and switches authentication modes.

### Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript  
- **Database**: PostgreSQL (Neon)
- **Authentication**: Replit OAuth / Mock Auth
- **Storage**: AWS S3 (optional)
- **AI**: OpenAI API (optional)

## 🔧 Development

### Environment Setup
```bash
# Required environment variables
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-here
NODE_ENV=development

# Optional (for production features)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
OPENAI_API_KEY=...
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run check        # TypeScript type checking
npm run db:push      # Push database schema changes
npm run db:studio    # Open database studio

# Testing
npm test             # Run all tests
npm run test:unit    # Unit tests only
npm run test:component # Component tests only
npm run test:visual  # Playwright visual tests
npm run test:all     # All test suites

# Visual Development
npm run storybook    # Start Storybook (component development)
npm run build-storybook # Build static Storybook
```

### Development Features
- 🔓 **Auto-login** as development user
- 🛠️ **Hot reload** for code changes
- 📊 **Admin panel** access (dev user has admin rights)
- 🗂️ **Database seeding** with sample data
- 🔄 **Mock authentication** (no OAuth required)
- 🎨 **Storybook integration** for component development
- 🧪 **Visual testing** with Playwright
- ♿ **Accessibility testing** with automated checks

## 🚨 Troubleshooting

### Common Issues

| Issue | Quick Fix |
|-------|-----------|
| Blank page / 401 errors | Check [AUTH_QUICK_REFERENCE.md](./AUTH_QUICK_REFERENCE.md) |
| "t.map is not a function" | Clear browser cache, restart server |
| **No React app loading** | **Verify Vite dev server is running** |
| Database connection | Verify `DATABASE_URL` in .env |
| Port conflicts | Check if port 3001 is available |

### Emergency Commands
```bash
# Reset authentication
rm -rf node_modules && npm install
NODE_ENV=development npm run dev

# Database reset
npm run db:push

# Clear all cache
rm -rf dist/ && rm -rf cache/
```

## 🔒 Security & Authentication

### Development Mode
- ✅ **Safe for local development**
- ✅ **Mock authentication only**
- ✅ **No real user data exposure**
- ⚠️ **Never deploy mock auth to production**

### Production Mode
- 🔐 **Real OAuth flow with Replit**
- 🔒 **Session-based authentication**
- 🛡️ **CSRF protection**
- 🌐 **HTTPS enforcement**

**⚠️ Important**: The system automatically switches between modes based on environment variables. No manual configuration needed.

## 📊 Features

### Core Features
- 📖 **AI/ML Glossary** with 1000+ terms
- 🔍 **Advanced Search** with filters
- ⭐ **Favorites System** for users
- 📈 **Progress Tracking** for learning
- 🏷️ **Category Management** with subcategories
- 📱 **Responsive Design** for all devices

### Admin Features
- 📊 **Analytics Dashboard**
- 📁 **Excel Import/Export**
- 👥 **User Management**
- 🤖 **AI Content Generation**
- ⚙️ **System Configuration**
- 📈 **Performance Monitoring**

### Advanced Features
- 🤖 **OpenAI Integration** for content enhancement
- ☁️ **AWS S3 Integration** for file storage
- 📊 **Real-time Analytics** with charts
- 🔄 **Automated Content Processing**
- 🎯 **Smart Recommendations**

## 🚀 Deployment

### Environments

| Environment | URL | Auth Method | Database |
|-------------|-----|-------------|----------|
| Development | localhost:3001 | Mock Auth | Local/Dev DB |
| Staging | staging.replit.app | Replit OAuth | Staging DB |
| Production | app.replit.app | Replit OAuth | Production DB |

### Deployment Process
1. **Code Review** & merge to main
2. **Environment Check** (see [DEPLOYMENT_PLANS.md](./DEPLOYMENT_PLANS.md))
3. **Database Migration** if needed
4. **Deploy** to target environment
5. **Verification** using health checks
6. **Monitor** for issues

### Health Checks
```bash
# Application health
curl https://your-app.replit.app/api/health

# Authentication health  
curl https://your-app.replit.app/api/auth/user

# Database health
curl https://your-app.replit.app/api/admin/stats
```

## 🤝 Contributing

### For Developers
1. **Read** [LOCAL_DEV_GUIDE.md](./LOCAL_DEV_GUIDE.md) for setup
2. **Follow** authentication patterns in existing code
3. **Test** both development and production auth modes
4. **Update** documentation when making auth changes

### For Agents/AI Assistants
1. **Authentication Issues**: Start with [AUTH_QUICK_REFERENCE.md](./AUTH_QUICK_REFERENCE.md)
2. **Architecture Questions**: Reference [Authentication Architecture](./AUTH_ARCHITECTURE_DOCUMENTATION.md)
3. **Incidents**: Follow [AUTH_INCIDENT_PLAYBOOK.md](./AUTH_INCIDENT_PLAYBOOK.md)
4. **New Features**: Maintain dual auth pattern

### Code Standards
- 📝 **TypeScript** for all new code
- 🧪 **Tests** for authentication changes
- 📚 **Documentation** for new auth features
- 🔒 **Security** review for auth modifications

## 📞 Support

### Getting Help

| Issue Type | Resource | Response Time |
|------------|----------|---------------|
| **Setup/Development** | [LOCAL_DEV_GUIDE.md](./LOCAL_DEV_GUIDE.md) | Self-service |
| **Quick Fixes** | [AUTH_QUICK_REFERENCE.md](./AUTH_QUICK_REFERENCE.md) | Self-service |
| **Incidents** | [AUTH_INCIDENT_PLAYBOOK.md](./AUTH_INCIDENT_PLAYBOOK.md) | Immediate |
| **Architecture** | [Authentication Architecture](./AUTH_ARCHITECTURE_DOCUMENTATION.md) | Reference |

### Escalation Path
1. **Documentation** (this README + guides)
2. **Team Lead** (for development questions)
3. **DevOps** (for infrastructure issues)
4. **Technical Director** (for major incidents)

## 📋 Project Status

### ✅ Completed
- [x] Core REST API endpoints for glossary content (terms, categories, search) - *Design & basic functionality*
- [x] Basic user features (favorites, progress tracking) - *Endpoints defined, schema supported*
- [x] Frontend component library - *Building blocks in place, Storybook setup*
- [x] S3 integration - *Partial functionality for file listing/processing*

### 🔄 In Progress
- [ ] **Data Loading & Content Availability (CRITICAL)**
- [ ] **TypeScript Compilation Errors & Code Stability (CRITICAL)**
- [ ] **Enhanced Storage Integration (CRITICAL)**
- [ ] **Authentication & Admin Security (HIGH RISK)**
- [ ] **Frontend/UI Integration Gaps (HIGH RISK)**
- [ ] Advanced AI features
- [ ] Performance optimizations
- [ ] Additional auth providers
- [ ] Enhanced monitoring

### 📅 Planned
- [ ] Multi-tenant support
- [ ] Mobile application
- [ ] API versioning
- [ ] Advanced analytics

---

## 📝 Recent Changes

### June 22, 2025 - Authentication System Overhaul
- ✅ **Fixed**: Blank page and 401 errors in local development
- ✅ **Added**: Dual authentication system (mock + real)
- ✅ **CRITICAL**: Fixed Vite dev server setup in development mode
- ✅ **Created**: Comprehensive documentation suite
- ✅ **Implemented**: Incident response procedures
- ✅ **Enhanced**: Developer experience for local setup

**Impact**: Developers can now run the application locally without Replit authentication setup, and the React frontend properly loads.

---

## 🏷️ Version Information

- **Version**: 2.0.0
- **Node.js**: >= 18.0.0
- **Database**: PostgreSQL 14+
- **Authentication**: Replit OAuth + Mock Auth
- **Last Updated**: June 22, 2025

---

*For questions about this project, consult the documentation links above or contact the development team.*
