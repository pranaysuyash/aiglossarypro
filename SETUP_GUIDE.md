# AI Glossary Pro - Complete Setup Guide

This guide covers local development setup, testing, and deployment options for the AI Glossary Pro application.

## Table of Contents

- [Local Development Setup](#local-development-setup)
- [Testing the Application](#testing-the-application)
- [Deployment Options](#deployment-options)
- [Environment Configuration](#environment-configuration)
- [Troubleshooting](#troubleshooting)
- [Feature Overview](#feature-overview)

## Local Development Setup

### Prerequisites

- **Node.js**: v18+ (tested with v23.11.0)
- **npm**: Latest version
- **Git**: For version control
- **Database**: PostgreSQL (we use Neon serverless)
- **AWS Account**: For S3 integration
- **OpenAI API Key**: For AI features

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/pranaysuyash/aiglossarypro.git
cd aiglossarypro

# Install dependencies
npm install
```

### Step 2: Environment Configuration

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Configure your `.env` file:**
   ```env
   # OpenAI API
   OPENAI_API_KEY=sk-proj-your-openai-api-key-here

   # Session
   SESSION_SECRET=your-secure-session-secret-here

   # Database (Neon PostgreSQL)
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   PGDATABASE=your_database_name
   PGHOST=your_database_host
   PGPORT=5432
   PGUSER=your_database_user
   PGPASSWORD=your_database_password

   # AWS S3 Configuration
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=your_s3_bucket_name

   # Application Settings
   NODE_ENV=development
   PORT=3001
   ```

### Step 3: Database Setup

The application uses Neon PostgreSQL with Drizzle ORM. The schema will be automatically applied when you start the application.

**Required Tables:**
- `users` - User profiles and authentication
- `categories` - Main categorization system
- `subcategories` - Hierarchical sub-categorization  
- `terms` - Core glossary entries (10,372+ AI/ML terms)
- `favorites` - User bookmarking system
- `user_progress` - Learning progress tracking
- `term_views` - Analytics and view tracking
- `user_settings` - User preferences

### Step 4: Start Development Server

```bash
# Start the development server
npm run dev
```

**Expected Output:**
```
🔧 Environment Configuration Status:
  - Node Environment: development
  - Server Port: 3001
  - Database: ✅ Configured
  - Session Secret: ✅ Configured
  - S3 Integration: ✅ Enabled
  - OpenAI Integration: ✅ Enabled
  - Replit Auth: ⚠️  Disabled (optional for local dev)

🚀 Server running on port 3001 in development mode
```

### Step 5: Access the Application

Visit **http://localhost:3001** in your browser.

## Testing the Application

### Manual Testing Checklist

1. **Frontend Loading:**
   - [ ] Application loads without errors
   - [ ] All components render properly
   - [ ] Navigation works correctly

2. **Database Connection:**
   - [ ] Terms load from database
   - [ ] Search functionality works
   - [ ] Categories display correctly

3. **AI Features:**
   - [ ] AI definition generation works
   - [ ] Semantic search returns results
   - [ ] Term suggestions load
   - [ ] Definition improvement functions

4. **S3 Integration:**
   - [ ] File upload interface loads
   - [ ] Excel file processing works
   - [ ] File management dashboard accessible

### API Endpoint Testing

```bash
# Test basic API endpoints
curl http://localhost:3001/api/categories
curl http://localhost:3001/api/terms/featured
curl http://localhost:3001/api/search?q=machine+learning

# Test AI endpoints (requires authentication)
curl -X POST http://localhost:3001/api/ai/generate-definition \
  -H "Content-Type: application/json" \
  -d '{"term": "neural network", "context": "machine learning"}'
```

## Deployment Options

### Option 1: Replit Deployment (Current - $20/month)

#### Method A: GitHub Integration (Recommended)

1. **Create New Replit Project:**
   - Go to [Replit](https://replit.com)
   - Click "Create Repl"
   - Select "Import from GitHub"
   - Enter repository URL: `https://github.com/pranaysuyash/aiglossarypro.git`

2. **Configure Environment Variables:**
   - Click the "Secrets" tab (lock icon in sidebar)
   - Add each variable from your `.env` file as individual secrets:
     ```
     OPENAI_API_KEY=your-key-here
     DATABASE_URL=your-db-url-here
     SESSION_SECRET=your-secret-here
     AWS_ACCESS_KEY_ID=your-aws-key
     AWS_SECRET_ACCESS_KEY=your-aws-secret
     S3_BUCKET_NAME=your-bucket-name
     AWS_REGION=us-east-1
     NODE_ENV=production
     ```

3. **Deploy:**
   - Replit will automatically detect the Node.js project
   - Click "Run" to start the application
   - The app will be available at your Replit URL

#### Method B: Upload Folder

1. **Prepare Project:**
   ```bash
   # Remove node_modules and build artifacts
   rm -rf node_modules dist .next
   
   # Create deployment archive
   zip -r aiglossary-pro.zip . -x "node_modules/*" "dist/*" ".git/*"
   ```

2. **Upload to Replit:**
   - Create new Repl → "Upload files"
   - Upload the zip file
   - Replit will extract and configure automatically

### Option 2: AWS App Runner ($18-45/month)

Perfect choice since you already use AWS App Runner for other projects.

#### Prerequisites
- AWS CLI configured
- Docker installed locally
- Existing AWS App Runner experience

#### Deployment Steps

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Create App Runner Configuration:**
   ```yaml
   # apprunner.yaml
   version: 1.0
   runtime: nodejs18
   build:
     commands:
       build:
         - npm ci
         - npm run build
   run:
     runtime-version: 18
     command: npm start
     network:
       port: 3000
       env: PORT
   ```

3. **Deploy via AWS Console:**
   - Go to AWS App Runner console
   - Create new service
   - Connect to GitHub repository
   - Configure build settings
   - Set environment variables
   - Deploy

**Cost Estimate:** $18-45/month depending on usage

### Option 3: Google Cloud Run ($9-25/month)

Most cost-effective option with excellent performance in India.

#### Deployment Steps

1. **Install Google Cloud SDK:**
   ```bash
   # Install gcloud CLI
   curl https://sdk.cloud.google.com | bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Create Cloud Run Service:**
   ```bash
   # Build and deploy
   gcloud run deploy aiglossary-pro \
     --source . \
     --platform managed \
     --region asia-south1 \
     --allow-unauthenticated \
     --set-env-vars NODE_ENV=production
   ```

3. **Set Environment Variables:**
   ```bash
   gcloud run services update aiglossary-pro \
     --set-env-vars OPENAI_API_KEY=your-key,DATABASE_URL=your-db-url \
     --region asia-south1
   ```

**Cost Estimate:** $9-25/month (pay-per-use pricing)

## Environment Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `SESSION_SECRET` | Secure session secret (32+ chars) | `your-super-secure-secret-key` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Server port | `3001` (dev), `3000` (prod) |

### Optional Variables (with graceful degradation)

| Variable | Description | Default Behavior |
|----------|-------------|------------------|
| `OPENAI_API_KEY` | OpenAI API access | AI features disabled |
| `AWS_ACCESS_KEY_ID` | AWS S3 access | S3 features disabled |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 secret | S3 features disabled |
| `S3_BUCKET_NAME` | S3 bucket name | File processing disabled |
| `REPLIT_CLIENT_ID` | Replit OAuth | Auth disabled (dev mode) |

### Feature Flags

The application automatically enables/disables features based on available configuration:

```typescript
const features = {
  s3Enabled: !!(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && S3_BUCKET_NAME),
  openaiEnabled: !!OPENAI_API_KEY,
  replitAuthEnabled: !!(REPLIT_DOMAINS && REPL_ID),
  isDevelopment: NODE_ENV === 'development'
};
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```
Error: DATABASE_URL must be set
```
**Solution:** Ensure `DATABASE_URL` is properly set in your `.env` file and the database is accessible.

#### 2. Port Already in Use
```
Error: listen EADDRINUSE :::3001
```
**Solution:** Change the port in `.env` file or kill the process using the port:
```bash
lsof -ti:3001 | xargs kill -9
```

#### 3. Node.js Version Issues
```
Error: listen ENOTSUP: operation not supported
```
**Solution:** Use Node.js v18 LTS instead of v23:
```bash
nvm install 18
nvm use 18
```

#### 4. Environment Variables Not Loading
**Solution:** Ensure dotenv is properly configured and `.env` file is in the root directory.

#### 5. S3 Access Denied
**Solution:** Verify AWS credentials have proper S3 permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:*"],
    "Resource": ["arn:aws:s3:::your-bucket/*"]
  }]
}
```

### Development Tips

1. **Enable Debug Logging:**
   ```bash
   DEBUG=* npm run dev
   ```

2. **Check Configuration Status:**
   The app logs configuration status on startup - check for any ⚠️  warnings.

3. **Test Database Connection:**
   ```bash
   # Test PostgreSQL connection
   psql $DATABASE_URL -c "SELECT version();"
   ```

4. **Monitor API Responses:**
   Use browser dev tools or Postman to monitor API calls and responses.

## Feature Overview

### Hybrid Architecture
- **Excel Data Source:** 10,372+ pre-loaded AI/ML terms from Excel files
- **AI Enhancements:** OpenAI-powered definition generation and improvements
- **Smart Search:** Both keyword and semantic search capabilities

### Core Features
- **Term Management:** Browse, search, and favorite AI/ML terms
- **User Profiles:** Progress tracking and personalization
- **AI Tools:** Definition generation, term suggestions, semantic search
- **File Processing:** Excel/CSV import with S3 integration
- **Analytics:** User activity and content usage insights

### AI-Powered Features
- **Definition Generation:** Create comprehensive term definitions
- **Semantic Search:** Find terms by meaning, not just keywords
- **Term Suggestions:** AI-recommended missing terms
- **Definition Improvement:** Enhance existing definitions
- **Smart Categorization:** Automatic term categorization

### Performance Optimizations
- **Caching:** Intelligent caching for AI responses and database queries
- **File Processing:** Multipart uploads and streaming for large files
- **Database:** Optimized queries with proper indexing
- **CDN Ready:** Static asset optimization for deployment

## Security Features

- **Environment Validation:** Startup checks for required configuration
- **Secure Sessions:** HTTP-only cookies with secure configuration
- **Input Validation:** Comprehensive API input validation
- **Rate Limiting:** API rate limiting for AI endpoints
- **Credential Protection:** Automatic redaction of sensitive data in logs

## Support

For issues or questions:
1. Check this documentation first
2. Review the deployment plans in `DEPLOYMENT_PLANS.md`
3. Check application logs for error details
4. Verify environment configuration using startup logs

---

**Last Updated:** December 2024  
**Version:** 2.0.0  
**License:** MIT