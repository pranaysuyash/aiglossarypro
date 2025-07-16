# Technology Stack

## Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with Million.js optimization
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query + Context API
- **Icons**: Lucide React (tree-shaken)
- **3D Graphics**: Three.js with React Three Fiber
- **Performance**: Bundle size ~800KB with code splitting

## Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Firebase Auth with JWT sessions
- **AI Integration**: OpenAI GPT models
- **Caching**: Redis for performance optimization
- **File Storage**: AWS S3 integration
- **Email**: Multiple providers (Resend, AWS SES, Nodemailer)

## Development Tools
- **Package Manager**: npm
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint + Biome
- **Testing**: Vitest, Playwright, React Testing Library
- **Storybook**: Component development and documentation
- **Visual Testing**: Playwright with screenshot comparison

## Common Commands

### Development
```bash
npm run dev              # Start full development environment
npm run dev:client       # Frontend only (port 5173)
npm run dev:server       # Backend only (port 3001)
npm run dev:perf         # Development with React Scan performance monitoring
```

### Building & Testing
```bash
npm run build           # Production build
npm run build:analyze   # Build with bundle analysis
npm run test            # Run unit tests
npm run test:visual     # Run visual regression tests
npm run test:coverage   # Run tests with coverage report
```

### Database Operations
```bash
npm run db:push         # Push schema changes to database
npm run db:studio       # Open Drizzle Studio
npm run db:status       # Check database status
npm run import:aiml     # Import AI/ML terms data
```

### Content Management
```bash
npm run seed:terms      # Seed terms data
npm run validate:content # Validate content quality
npm run setup:content   # Complete content setup
npm run status:content  # Check content status
```

### Quality Assurance
```bash
npm run audit:all       # Run comprehensive audit suite
npm run audit:visual    # Visual regression testing
npm run audit:accessibility # Accessibility testing
npm run lint            # Code linting
npm run lint:fix        # Auto-fix linting issues
```

### Storybook
```bash
npm run storybook       # Start Storybook dev server (port 6006)
npm run build-storybook # Build Storybook for production
npm run stories:generate # Generate missing stories
```

## Environment Configuration
- Development: Uses Vite dev server with HMR
- Production: Static files served by Express
- Database: PostgreSQL with connection pooling
- Authentication: Firebase or JWT-based fallback
- Monitoring: Sentry for error tracking, PostHog for analytics