
> rest-express@1.0.0 dev:smart
> node scripts/dev-start.js


============================================================
[36m  🚀 AI Glossary Pro - Smart Development Startup[0m
============================================================

============================================================
[36m  🧹 Cleanup Phase[0m
============================================================
[34mℹ️  Cleaning up orphaned development processes...[0m
[32m✅ Cleanup completed[0m
[34mℹ️  Checking for processes on port 3001...[0m
[34mℹ️  Port 3001 is available[0m
[34mℹ️  Checking for processes on port 5173...[0m
[34mℹ️  Port 5173 is available[0m

============================================================
[36m  🔧 Starting Backend Server[0m
============================================================
[34mℹ️  Starting server on port 3001...[0m
[34mℹ️  Waiting for backend server to be ready...[0m
[34m[dev:server][0m > rest-express@1.0.0 dev:server
[34m[dev:server][0m > NODE_ENV=development NODE_OPTIONS='--max-old-space-size=4096' tsx server/index.ts
[34m[dev:server][0m [32minfo[39m: ✅ Loaded 6 default prompt templates {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:49"}
[34m[dev:server][0m [32minfo[39m: ✅ Loaded 4 triplet prompt templates {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:49"}
[34m[dev:server][0m [32minfo[39m: Created new budget: Default Monthly Budget ($2000) {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [Redis] Using mock Redis client as fallback
[34m[dev:server][0m [32minfo[39m: Notification service initialized {"emailEnabled":false,"environment":"development","service":"ai-glossary-pro","slackEnabled":false,"timestamp":"2025-07-10 15:01:50","webhookEnabled":false}
[34m[dev:server][0m [32minfo[39m: Notification service initialized {"emailEnabled":false,"environment":"development","service":"ai-glossary-pro","slackEnabled":false,"timestamp":"2025-07-10 15:01:50","webhookEnabled":false}
[34m[dev:server][0m ⚠️ Feedback schema initialization moved to Phase 2 storage layer
[34m[dev:server][0m [32minfo[39m: Initialized 6 evaluation templates {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m FIREBASE_PROJECT_ID: aiglossarypro
[34m[dev:server][0m FIREBASE_CLIENT_EMAIL: firebase-adminsdk-fbsvc@aiglossarypro.iam.gserviceaccount.com
[34m[dev:server][0m FIREBASE_PRIVATE_KEY_BASE64: set
[34m[dev:server][0m 🔍 Server Startup - Firebase Environment Check:
[34m[dev:server][0m - FIREBASE_PROJECT_ID: ✅ Set
[34m[dev:server][0m - FIREBASE_CLIENT_EMAIL: ✅ Set
[34m[dev:server][0m - FIREBASE_PRIVATE_KEY_BASE64: ✅ Set
[34m[dev:server][0m - Firebase Auth Enabled: ✅ TRUE
[34m[dev:server][0m Sentry disabled in development environment
[34m[dev:server][0m 🔧 Environment Configuration Status:
[34m[dev:server][0m   - Node Environment: development
[34m[dev:server][0m   - Server Port: 3001
[34m[dev:server][0m   - Database: ✅ Configured
[34m[dev:server][0m   - Session Secret: ✅ Configured
[34m[dev:server][0m   - S3 Integration: ✅ Enabled
[34m[dev:server][0m     - Region: ap-south-1
[34m[dev:server][0m     - Bucket: aimlglossary
[34m[dev:server][0m     - Access Key: AKIA************HPCS
[34m[dev:server][0m   - OpenAI Integration: ✅ Enabled
[34m[dev:server][0m     - API Key: sk-p************************************************************************************************************************************************************FJkA
[34m[dev:server][0m   - Google Drive Integration: ⚠️  Disabled
[34m[dev:server][0m [32minfo[39m: ✅ Firebase authentication setup complete (Google, GitHub, Email/Password) {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m ✅ S3 client initialized with region: ap-south-1
[34m[dev:server][0m [32minfo[39m: ✅ S3 client initialized {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: 🔧 Setting up application routes... {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: 📊 Performance monitoring enabled {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: 📝 Registering core API routes... {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Subcategory routes registered - 21,993 subcategories now accessible {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Section routes registered - 42-section content API now available {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Adaptive search routes registered - AI-powered semantic search now available {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: User progress routes registered {"component":"UserProgressRoute","environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Progress tracking routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Progress tracking routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: 📋 Registering modular admin routes... {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: 📝 Admin user management routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: 🔧 Admin maintenance routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Admin content management routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: 📊 Admin monitoring routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: 📧 Registering admin newsletter routes... {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Admin newsletter routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: 📊 Admin job management routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ AI generation routes registered at /api/admin/ai {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Column batch processing routes registered at /api/admin/column-batch {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Content editing routes registered at /api/admin/content-editing {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Enhanced terms routes registered at /api/admin {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Safety routes registered at /api/admin/safety {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ All admin routes registered successfully {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Monitoring routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Feedback routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Cross-reference routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Analytics routes registered successfully {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Analytics routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Personalization routes registered successfully {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Personalization routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Relationship discovery routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Media management routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Media routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: SEO optimization routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ SEO routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Content accessibility routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Gumroad monetization routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Early bird pricing routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Newsletter and contact routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ A/B testing routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Quality Evaluation routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ S3 routes mounted {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m ✅ Enhanced API routes registered successfully
[34m[dev:server][0m ✅ Enhanced demo routes registered successfully
[34m[dev:server][0m [32minfo[39m: ✅ Enhanced routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Cache management routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Cache analytics routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Job management routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Job management routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Learning Paths routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Code Examples routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Trending Analytics routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Personalized Homepage routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Engagement Tracking routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Surprise Discovery routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Adaptive Content routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Predictive Analytics routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m 📚 Swagger UI available at /api/docs
[34m[dev:server][0m [32minfo[39m: 📚 API documentation setup complete {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ All routes registered successfully {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Created default monthly budget {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ API routes registered {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m 📚 Swagger UI available at /api/docs
[34m[dev:server][0m [32minfo[39m: ✅ Swagger API documentation available at /api/docs {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[31m[dev:server][0m CRITICAL CACHE ALERT: Hit rate (0.0%) is below threshold (50%)
[31m[dev:server][0m CRITICAL CACHE ALERT: Cache efficiency (0.0%) is below threshold (70%)
[34m[dev:server][0m Triggering emergency cache warming...
[34m[dev:server][0m [32minfo[39m: 🔧 Setting up Vite dev server for development... {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Loaded 160 cached AI results {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m Re-optimizing dependencies because vite config has changed
[34m[dev:server][0m [32minfo[39m: ✅ Vite dev server setup complete {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Redis connection established for job queues {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Queue initialized: ai-content-generation {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Queue initialized: ai-batch-processing {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Queue initialized: column-batch-processing {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Queue initialized: column-batch-estimation {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Queue initialized: column-batch-monitoring {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Queue initialized: column-batch-cleanup {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Queue initialized: db-batch-insert {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Queue initialized: email-send {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Queue initialized: cache-warm {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Queue initialized: cache-precompute {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Queue initialized: analytics-aggregate {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Worker initialized for: ai-content-generation {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Worker initialized for: ai-batch-processing {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Worker initialized for: column-batch-processing {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Worker initialized for: column-batch-estimation {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Worker initialized for: column-batch-monitoring {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Worker initialized for: column-batch-cleanup {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Worker initialized for: db-batch-insert {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Worker initialized for: email-send {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Worker initialized for: cache-warm {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Worker initialized for: cache-precompute {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Worker initialized for: analytics-aggregate {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: Job queue manager initialized successfully {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: ✅ Job queue system initialized {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m 📊 Analytics middleware initialized
[34m[dev:server][0m [32minfo[39m: ✅ Cache monitoring system initialized {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: 🚀 Server ready. Use admin endpoint for Excel data processing. {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: 🚀 Server running on http://127.0.0.1:3001 in development mode {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: 🔍 Server address: {"address":"127.0.0.1","family":"IPv4","port":3001} {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: 🛡️  Error handling and monitoring enabled {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:50"}
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/health {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/health","requestId":"2b781111-6e32-4b8e-8164-100f33ac154b","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:51","type":"api_request","userAgent":"node"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/health {"duration":9,"environment":"development","label":"GET /api/health","requestId":"2b781111-6e32-4b8e-8164-100f33ac154b","responseSize":120,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:51","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/health 200 (9ms) {"duration":9,"environment":"development","method":"GET","path":"/api/health","requestId":"2b781111-6e32-4b8e-8164-100f33ac154b","responseSize":120,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:51","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: Health Check: /api/health {"duration":9,"environment":"development","label":"Health Check: /api/health","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:51","type":"performance"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/health {"duration":10,"environment":"development","label":"GET /api/health","requestId":"2b781111-6e32-4b8e-8164-100f33ac154b","responseSize":120,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:51","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/health 200 (10ms) {"duration":10,"environment":"development","method":"GET","path":"/api/health","requestId":"2b781111-6e32-4b8e-8164-100f33ac154b","responseSize":120,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:51","type":"api_response"}
[32m✅ Backend server is ready![0m

============================================================
[36m  🎨 Starting Frontend Server[0m
============================================================
[34mℹ️  Starting client on port 5173...[0m
[34mℹ️  Waiting for frontend server to be ready...[0m
[34m[dev:server][0m [32minfo[39m: GET /api/health 200 in 8ms :: {"success":true,"status":"healthy","timestamp":"2… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:51"}
[34m[dev:server][0m 📊 GET /api/health - 8ms
[34m[dev:client][0m > rest-express@1.0.0 dev:client
[34m[dev:client][0m > vite
[34m[dev:client][0m   VITE v5.4.19  ready in 379 ms
[34m[dev:client][0m   ➜  Local:   http://localhost:5173/
[34m[dev:client][0m   ➜  Network: use --host to expose
[34m[dev:client][0m   ➜  press h + enter to show help
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/auth/user {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/auth/user","referer":"http://localhost:5173/app","requestId":"918251e2-6191-4fdd-b726-e4f4b32785a7","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:51","type":"api_request","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
[31m[dev:server][0m Get user error: ReferenceError: require is not defined
[31m[dev:server][0m     at <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/firebaseAuth.ts:398:19)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[31m[dev:server][0m     at next (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/route.js:149:13)
[31m[dev:server][0m     at Route.dispatch (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/route.js:119:3)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[31m[dev:server][0m     at /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:284:15
[31m[dev:server][0m     at Function.process_params (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:346:12)
[31m[dev:server][0m     at next (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:280:10)
[31m[dev:server][0m     at responseLoggingMiddleware (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/responseLogging.ts:41:3)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/auth/user {"duration":3,"environment":"development","label":"GET /api/auth/user","requestId":"918251e2-6191-4fdd-b726-e4f4b32785a7","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:01:51","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/auth/user 401 (3ms) {"duration":3,"environment":"development","method":"GET","path":"/api/auth/user","requestId":"918251e2-6191-4fdd-b726-e4f4b32785a7","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:01:51","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/auth/user {"duration":3,"environment":"development","label":"GET /api/auth/user","requestId":"918251e2-6191-4fdd-b726-e4f4b32785a7","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:01:51","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/auth/user 401 (3ms) {"duration":3,"environment":"development","method":"GET","path":"/api/auth/user","requestId":"918251e2-6191-4fdd-b726-e4f4b32785a7","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:01:51","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/auth/user 401 in 3ms :: {"success":false,"message":"Authentication req… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:51"}
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/categories {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/categories","queryParams":{"limit":"100"},"referer":"http://localhost:5173/app","requestId":"058e3d22-364d-48f6-95aa-434c017bc0f5","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:51","type":"api_request","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
[34m[dev:server][0m [DEBUG] getCategoriesOptimized called with: {
[34m[dev:server][0m   fields: [ 'id', 'name', 'description', 'termCount' ],
[34m[dev:server][0m   needsTermCount: true,
[34m[dev:server][0m   includeStats: false
[34m[dev:server][0m }
[31m[dev:server][0m [OptimizedStorage] Skipping termCount due to schema mismatch (categories.id: integer, terms.category_id: uuid)
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/subcategories {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/subcategories","queryParams":{"limit":"50"},"referer":"http://localhost:5173/app","requestId":"01cae7f3-75cd-4c39-9b4d-eca64e1dc3d1","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:51","type":"api_request","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/categories {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/categories","referer":"http://localhost:5173/app","requestId":"d0b38357-4752-4eab-a4ae-757f1eefb55b","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:51","type":"api_request","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
[34m[dev:server][0m [DEBUG] getCategoriesOptimized called with: {
[34m[dev:server][0m   fields: [ 'id', 'name', 'description', 'termCount' ],
[34m[dev:server][0m   needsTermCount: true,
[34m[dev:server][0m   includeStats: false
[34m[dev:server][0m }
[31m[dev:server][0m [OptimizedStorage] Skipping termCount due to schema mismatch (categories.id: integer, terms.category_id: uuid)
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/terms/featured {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/terms/featured","referer":"http://localhost:5173/app","requestId":"85ce5290-cb23-4702-8f7b-811b6a653211","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:51","type":"api_request","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/auth/user {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/auth/user","referer":"http://localhost:5173/app","requestId":"3fa80585-0f09-481f-829b-b781374194f4","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:51","type":"api_request","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
[31m[dev:server][0m Get user error: ReferenceError: require is not defined
[31m[dev:server][0m     at <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/firebaseAuth.ts:398:19)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[31m[dev:server][0m     at next (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/route.js:149:13)
[31m[dev:server][0m     at Route.dispatch (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/route.js:119:3)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[31m[dev:server][0m     at /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:284:15
[31m[dev:server][0m     at Function.process_params (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:346:12)
[31m[dev:server][0m     at next (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:280:10)
[31m[dev:server][0m     at responseLoggingMiddleware (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/responseLogging.ts:41:3)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/auth/user {"duration":1,"environment":"development","label":"GET /api/auth/user","requestId":"3fa80585-0f09-481f-829b-b781374194f4","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:01:51","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/auth/user 401 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/auth/user","requestId":"3fa80585-0f09-481f-829b-b781374194f4","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:01:51","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/auth/user {"duration":1,"environment":"development","label":"GET /api/auth/user","requestId":"3fa80585-0f09-481f-829b-b781374194f4","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:01:51","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/auth/user 401 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/auth/user","requestId":"3fa80585-0f09-481f-829b-b781374194f4","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:01:51","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/auth/user 401 in 1ms :: {"success":false,"message":"Authentication req… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:51"}
[34m[dev:client][0m   ⚡ Million.js 3.1.11
[34m[dev:client][0m   - Tip:     use // million-ignore for errors
[34m[dev:client][0m   - Hotline: https://million.dev/hotline
[32m✅ Frontend server is ready![0m

============================================================
[36m  🎉 Development Environment Ready[0m
============================================================
[32m✅ Frontend: http://localhost:5173[0m
[32m✅ Backend:  http://localhost:3001[0m
[32m✅ API Docs: http://localhost:3001/api/docs[0m
[34mℹ️  Press Ctrl+C to stop all servers[0m
[34m[dev:server][0m [32minfo[39m: Media files table initialized {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:52"}
[34m[dev:server][0m ✅ Rate limiting table initialized
[31m[dev:server][0m [QueryCache] Query failed for key: popular:week DrizzleQueryError: Failed query: select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."view_count", "categories"."name", "categories"."id", "terms"."definition", ARRAY_AGG(DISTINCT "subcategories"."name") FILTER (WHERE "subcategories"."name" IS NOT NULL) from "terms" left join "categories" on "terms"."category_id" = "categories"."id" left join "term_subcategories" on "terms"."id" = "term_subcategories"."term_id" left join "subcategories" on "term_subcategories"."subcategory_id" = "subcategories"."id" group by "terms"."id", "categories"."id", "categories"."name" order by "terms"."view_count" desc limit $1
[31m[dev:server][0m params: 20
[31m[dev:server][0m     at NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:74:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m     ... 2 lines matching cause stack trace ...
[31m[dev:server][0m     at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/terms.ts:261:25) {
[31m[dev:server][0m   query: 'select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."view_count", "categories"."name", "categories"."id", "terms"."definition", ARRAY_AGG(DISTINCT "subcategories"."name") FILTER (WHERE "subcategories"."name" IS NOT NULL) from "terms" left join "categories" on "terms"."category_id" = "categories"."id" left join "term_subcategories" on "terms"."id" = "term_subcategories"."term_id" left join "subcategories" on "term_subcategories"."subcategory_id" = "subcategories"."id" group by "terms"."id", "categories"."id", "categories"."name" order by "terms"."view_count" desc limit $1',
[31m[dev:server][0m   params: [ 20 ],
[31m[dev:server][0m   cause: error: operator does not exist: uuid = integer
[31m[dev:server][0m       at file:///Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/@neondatabase/serverless/index.mjs:1345:74
[31m[dev:server][0m       at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:153:11)
[31m[dev:server][0m       at async NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:72:12)
[31m[dev:server][0m       at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedStorage.ts:267:25)
[31m[dev:server][0m       at async cached (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:235:20)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/terms.ts:261:25) {
[31m[dev:server][0m     length: 200,
[31m[dev:server][0m     severity: 'ERROR',
[31m[dev:server][0m     code: '42883',
[31m[dev:server][0m     detail: undefined,
[31m[dev:server][0m     hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
[31m[dev:server][0m     position: '304',
[31m[dev:server][0m     internalPosition: undefined,
[31m[dev:server][0m     internalQuery: undefined,
[31m[dev:server][0m     where: undefined,
[31m[dev:server][0m     schema: undefined,
[31m[dev:server][0m     table: undefined,
[31m[dev:server][0m     column: undefined,
[31m[dev:server][0m     dataType: undefined,
[31m[dev:server][0m     constraint: undefined,
[31m[dev:server][0m     file: 'parse_oper.c',
[31m[dev:server][0m     line: '647',
[31m[dev:server][0m     routine: 'op_error'
[31m[dev:server][0m   }
[31m[dev:server][0m }
[34m[dev:server][0m [33mwarn[39m: Featured terms query failed, returning empty result {"environment":"development","error":"Failed query: select \"terms\".\"id\", \"terms\".\"name\", \"terms\".\"short_definition\", \"terms\".\"view_count\", \"categories\".\"name\", \"categories\".\"id\", \"terms\".\"definition\", ARRAY_AGG(DISTINCT \"subcategories\".\"name\") FILTER (WHERE \"subcategories\".\"name\" IS NOT NULL) from \"terms\" left join \"categories\" on \"terms\".\"category_id\" = \"categories\".\"id\" left join \"term_subcategories\" on \"terms\".\"id\" = \"term_subcategories\".\"term_id\" left join \"subcategories\" on \"term_subcategories\".\"subcategory_id\" = \"subcategories\".\"id\" group by \"terms\".\"id\", \"categories\".\"id\", \"categories\".\"name\" order by \"terms\".\"view_count\" desc limit $1\nparams: 20","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:53"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms/featured {"duration":1586,"environment":"development","label":"GET /api/terms/featured","requestId":"85ce5290-cb23-4702-8f7b-811b6a653211","responseSize":122,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:53","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms/featured 200 (1586ms) {"duration":1586,"environment":"development","method":"GET","path":"/api/terms/featured","requestId":"85ce5290-cb23-4702-8f7b-811b6a653211","responseSize":122,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:53","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms/featured {"duration":1587,"environment":"development","label":"GET /api/terms/featured","requestId":"85ce5290-cb23-4702-8f7b-811b6a653211","responseSize":122,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:53","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms/featured 200 (1587ms) {"duration":1587,"environment":"development","method":"GET","path":"/api/terms/featured","requestId":"85ce5290-cb23-4702-8f7b-811b6a653211","responseSize":122,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:53","type":"api_response"}
[34m[dev:server][0m [33mwarn[39m: Slow request detected: GET /api/terms/featured {"duration":1587.278875,"environment":"development","requestId":"85ce5290-cb23-4702-8f7b-811b6a653211","service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:53"}
[34m[dev:server][0m [32minfo[39m: GET /api/terms/featured 200 in 1587ms :: {"success":true,"data":[],"message":"N… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:53"}
[31m[dev:server][0m 🐌 Slow query detected: GET /api/terms/featured - 1587ms
[34m[dev:server][0m 📊 GET /api/terms/featured - 1587ms
[34m[dev:client][0m  ⚡ <SkipLinks> now renders ~100% faster
[34m[dev:client][0m  ⚡ <Footer> now renders ~61% faster
[34m[dev:client][0m  ⚡ <Header> now renders ~23% faster
[34m[dev:client][0m  ⚡ <Home> now renders ~41% faster
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/categories {"duration":1850,"environment":"development","label":"GET /api/categories","requestId":"058e3d22-364d-48f6-95aa-434c017bc0f5","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:53","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/categories 200 (1850ms) {"duration":1850,"environment":"development","method":"GET","path":"/api/categories","requestId":"058e3d22-364d-48f6-95aa-434c017bc0f5","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:53","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/categories {"duration":1851,"environment":"development","label":"GET /api/categories","requestId":"058e3d22-364d-48f6-95aa-434c017bc0f5","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:53","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/categories 200 (1851ms) {"duration":1851,"environment":"development","method":"GET","path":"/api/categories","requestId":"058e3d22-364d-48f6-95aa-434c017bc0f5","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:53","type":"api_response"}
[34m[dev:server][0m [33mwarn[39m: Slow request detected: GET /api/categories {"duration":1851.217125,"environment":"development","requestId":"058e3d22-364d-48f6-95aa-434c017bc0f5","service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:53"}
[34m[dev:server][0m [32minfo[39m: GET /api/categories 200 in 1851ms :: {"success":true,"data":[],"pagination":{"p… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:53"}
[31m[dev:server][0m 🐌 Slow query detected: GET /api/categories - 1851ms
[34m[dev:server][0m 📊 GET /api/categories - 1851ms
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/categories {"duration":1877,"environment":"development","label":"GET /api/categories","requestId":"d0b38357-4752-4eab-a4ae-757f1eefb55b","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:53","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/categories 200 (1877ms) {"duration":1877,"environment":"development","method":"GET","path":"/api/categories","requestId":"d0b38357-4752-4eab-a4ae-757f1eefb55b","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:53","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/categories {"duration":1877,"environment":"development","label":"GET /api/categories","requestId":"d0b38357-4752-4eab-a4ae-757f1eefb55b","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:53","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/categories 200 (1877ms) {"duration":1877,"environment":"development","method":"GET","path":"/api/categories","requestId":"d0b38357-4752-4eab-a4ae-757f1eefb55b","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:53","type":"api_response"}
[34m[dev:server][0m [33mwarn[39m: Slow request detected: GET /api/categories {"duration":1877.266667,"environment":"development","requestId":"d0b38357-4752-4eab-a4ae-757f1eefb55b","service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:53"}
[34m[dev:server][0m [32minfo[39m: GET /api/categories 200 in 1877ms :: {"success":true,"data":[],"pagination":{"p… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:53"}
[34m[dev:server][0m 📊 GET /api/categories - 1877ms
[31m[dev:server][0m 🐌 Slow query detected: GET /api/categories - 1877ms
[34m[dev:client][0m  ⚡ <Sidebar> now renders ~29% faster
[34m[dev:client][0m  ⚡ <HighlightedText> now renders ~67% faster
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/subcategories {"duration":1926,"environment":"development","label":"GET /api/subcategories","requestId":"01cae7f3-75cd-4c39-9b4d-eca64e1dc3d1","responseSize":99,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:53","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/subcategories 200 (1926ms) {"duration":1926,"environment":"development","method":"GET","path":"/api/subcategories","requestId":"01cae7f3-75cd-4c39-9b4d-eca64e1dc3d1","responseSize":99,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:53","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/subcategories {"duration":1926,"environment":"development","label":"GET /api/subcategories","requestId":"01cae7f3-75cd-4c39-9b4d-eca64e1dc3d1","responseSize":99,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:53","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/subcategories 200 (1926ms) {"duration":1926,"environment":"development","method":"GET","path":"/api/subcategories","requestId":"01cae7f3-75cd-4c39-9b4d-eca64e1dc3d1","responseSize":99,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:53","type":"api_response"}
[34m[dev:server][0m [33mwarn[39m: Slow request detected: GET /api/subcategories {"duration":1926.342709,"environment":"development","requestId":"01cae7f3-75cd-4c39-9b4d-eca64e1dc3d1","service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:53"}
[34m[dev:server][0m [32minfo[39m: GET /api/subcategories 200 in 1926ms :: {"success":true,"data":[],"pagination":… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:53"}
[34m[dev:server][0m 📊 GET /api/subcategories - 1926ms
[31m[dev:server][0m 🐌 Slow query detected: GET /api/subcategories - 1926ms
[34m[dev:client][0m  🎁 Million Wrapped: https://million.dev/wrapped/09c1deda05ba132b2a68383a45a2c86a
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/health {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/health","requestId":"81bffdc6-96c4-468f-b4e5-355adb20fd5e","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:59","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/health {"duration":7,"environment":"development","label":"GET /api/health","requestId":"81bffdc6-96c4-468f-b4e5-355adb20fd5e","responseSize":120,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:59","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/health 200 (7ms) {"duration":7,"environment":"development","method":"GET","path":"/api/health","requestId":"81bffdc6-96c4-468f-b4e5-355adb20fd5e","responseSize":120,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:59","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: Health Check: /api/health {"duration":7,"environment":"development","label":"Health Check: /api/health","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:59","type":"performance"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/health {"duration":7,"environment":"development","label":"GET /api/health","requestId":"81bffdc6-96c4-468f-b4e5-355adb20fd5e","responseSize":120,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:59","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/health 200 (7ms) {"duration":7,"environment":"development","method":"GET","path":"/api/health","requestId":"81bffdc6-96c4-468f-b4e5-355adb20fd5e","responseSize":120,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:59","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/health 200 in 6ms :: {"success":true,"status":"healthy","timestamp":"2… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:59"}
[34m[dev:server][0m 📊 GET /api/health - 6ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/health {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/health","requestId":"bb8d7a07-a573-4526-b8e3-1cff028c3d02","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:59","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/health {"duration":2,"environment":"development","label":"GET /api/health","requestId":"bb8d7a07-a573-4526-b8e3-1cff028c3d02","responseSize":120,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:59","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/health 200 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/health","requestId":"bb8d7a07-a573-4526-b8e3-1cff028c3d02","responseSize":120,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:59","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: Health Check: /api/health {"duration":2,"environment":"development","label":"Health Check: /api/health","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:59","type":"performance"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/health {"duration":2,"environment":"development","label":"GET /api/health","requestId":"bb8d7a07-a573-4526-b8e3-1cff028c3d02","responseSize":120,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:59","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/health 200 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/health","requestId":"bb8d7a07-a573-4526-b8e3-1cff028c3d02","responseSize":120,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:01:59","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/health 200 in 1ms :: {"success":true,"status":"healthy","timestamp":"2… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:01:59"}
[34m[dev:server][0m 📊 GET /api/health - 2ms
[34m[dev:server][0m [32minfo[39m: API Request: POST /api/auth/register {"bodySize":72,"environment":"development","ip":"127.0.0.1","method":"POST","path":"/api/auth/register","requestId":"aca2db88-5736-483d-9da2-f09a29cb207e","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:00","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: POST /api/auth/register {"duration":1,"environment":"development","label":"POST /api/auth/register","requestId":"aca2db88-5736-483d-9da2-f09a29cb207e","responseSize":234,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: POST /api/auth/register 200 (1ms) {"duration":1,"environment":"development","method":"POST","path":"/api/auth/register","requestId":"aca2db88-5736-483d-9da2-f09a29cb207e","responseSize":234,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: POST /api/auth/register {"duration":1,"environment":"development","label":"POST /api/auth/register","requestId":"aca2db88-5736-483d-9da2-f09a29cb207e","responseSize":234,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: POST /api/auth/register 200 (1ms) {"duration":1,"environment":"development","method":"POST","path":"/api/auth/register","requestId":"aca2db88-5736-483d-9da2-f09a29cb207e","responseSize":234,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: POST /api/auth/register 200 in 1ms :: {"success":false,"message":"Please use Fi… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:00"}
[34m[dev:server][0m [32minfo[39m: API Request: POST /api/auth/register {"bodySize":72,"environment":"development","ip":"127.0.0.1","method":"POST","path":"/api/auth/register","requestId":"d8069943-b233-4cd2-9894-d66da22de3bc","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:00","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: POST /api/auth/register {"duration":1,"environment":"development","label":"POST /api/auth/register","requestId":"d8069943-b233-4cd2-9894-d66da22de3bc","responseSize":234,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: POST /api/auth/register 200 (1ms) {"duration":1,"environment":"development","method":"POST","path":"/api/auth/register","requestId":"d8069943-b233-4cd2-9894-d66da22de3bc","responseSize":234,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: POST /api/auth/register {"duration":1,"environment":"development","label":"POST /api/auth/register","requestId":"d8069943-b233-4cd2-9894-d66da22de3bc","responseSize":234,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: POST /api/auth/register 200 (1ms) {"duration":1,"environment":"development","method":"POST","path":"/api/auth/register","requestId":"d8069943-b233-4cd2-9894-d66da22de3bc","responseSize":234,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: POST /api/auth/register 200 in 1ms :: {"success":false,"message":"Please use Fi… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:00"}
[34m[dev:server][0m [32minfo[39m: API Request: POST /api/auth/login {"bodySize":53,"environment":"development","ip":"127.0.0.1","method":"POST","path":"/api/auth/login","requestId":"1077e67f-3969-459d-baeb-a25cb27bad04","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:00","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: POST /api/auth/login {"duration":0,"environment":"development","label":"POST /api/auth/login","requestId":"1077e67f-3969-459d-baeb-a25cb27bad04","responseSize":231,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: POST /api/auth/login 200 (0ms) {"duration":0,"environment":"development","method":"POST","path":"/api/auth/login","requestId":"1077e67f-3969-459d-baeb-a25cb27bad04","responseSize":231,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: POST /api/auth/login {"duration":1,"environment":"development","label":"POST /api/auth/login","requestId":"1077e67f-3969-459d-baeb-a25cb27bad04","responseSize":231,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: POST /api/auth/login 200 (1ms) {"duration":1,"environment":"development","method":"POST","path":"/api/auth/login","requestId":"1077e67f-3969-459d-baeb-a25cb27bad04","responseSize":231,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: POST /api/auth/login 200 in 1ms :: {"success":false,"message":"Please use Fireb… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:00"}
[34m[dev:server][0m [32minfo[39m: API Request: POST /api/auth/login {"bodySize":53,"environment":"development","ip":"127.0.0.1","method":"POST","path":"/api/auth/login","requestId":"85d9c9d5-d086-4f44-8a20-d7b8cba066a9","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:00","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: POST /api/auth/login {"duration":1,"environment":"development","label":"POST /api/auth/login","requestId":"85d9c9d5-d086-4f44-8a20-d7b8cba066a9","responseSize":231,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: POST /api/auth/login 200 (1ms) {"duration":1,"environment":"development","method":"POST","path":"/api/auth/login","requestId":"85d9c9d5-d086-4f44-8a20-d7b8cba066a9","responseSize":231,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: POST /api/auth/login {"duration":2,"environment":"development","label":"POST /api/auth/login","requestId":"85d9c9d5-d086-4f44-8a20-d7b8cba066a9","responseSize":231,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: POST /api/auth/login 200 (2ms) {"duration":2,"environment":"development","method":"POST","path":"/api/auth/login","requestId":"85d9c9d5-d086-4f44-8a20-d7b8cba066a9","responseSize":231,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: POST /api/auth/login 200 in 1ms :: {"success":false,"message":"Please use Fireb… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:00"}
[34m[dev:server][0m [32minfo[39m: API Request: POST /api/auth/login {"bodySize":53,"environment":"development","ip":"127.0.0.1","method":"POST","path":"/api/auth/login","requestId":"bded5e27-f915-41f9-95c6-992ad14bf512","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:00","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: POST /api/auth/login {"duration":1,"environment":"development","label":"POST /api/auth/login","requestId":"bded5e27-f915-41f9-95c6-992ad14bf512","responseSize":231,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: POST /api/auth/login 200 (1ms) {"duration":1,"environment":"development","method":"POST","path":"/api/auth/login","requestId":"bded5e27-f915-41f9-95c6-992ad14bf512","responseSize":231,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: POST /api/auth/login {"duration":1,"environment":"development","label":"POST /api/auth/login","requestId":"bded5e27-f915-41f9-95c6-992ad14bf512","responseSize":231,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: POST /api/auth/login 200 (1ms) {"duration":1,"environment":"development","method":"POST","path":"/api/auth/login","requestId":"bded5e27-f915-41f9-95c6-992ad14bf512","responseSize":231,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: POST /api/auth/login 200 in 1ms :: {"success":false,"message":"Please use Fireb… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:00"}
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/terms {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/terms","requestId":"e9881abb-cdb2-4d2a-9d27-d5cfb8fcb3a2","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:00","type":"api_request","userAgent":"curl/8.7.1"}
[31m[dev:server][0m [QueryCache] Query failed for key: all-terms:24:0:all:all:name:asc:id,name,shortDefinition,definition,viewCount,categoryId,category DrizzleQueryError: Failed query: select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."definition", "terms"."category_id", "terms"."view_count", "categories"."name" from "terms" left join "categories" on "terms"."category_id" = "categories"."id" order by "terms"."name" asc limit $1
[31m[dev:server][0m params: 24
[31m[dev:server][0m     at NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:74:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m     ... 3 lines matching cause stack trace ...
[31m[dev:server][0m     at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/terms.ts:151:18) {
[31m[dev:server][0m   query: 'select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."definition", "terms"."category_id", "terms"."view_count", "categories"."name" from "terms" left join "categories" on "terms"."category_id" = "categories"."id" order by "terms"."name" asc limit $1',
[31m[dev:server][0m   params: [ 24 ],
[31m[dev:server][0m   cause: error: operator does not exist: uuid = integer
[31m[dev:server][0m       at file:///Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/@neondatabase/serverless/index.mjs:1345:74
[31m[dev:server][0m       at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:153:11)
[31m[dev:server][0m       at async NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:72:12)
[31m[dev:server][0m       at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedStorage.ts:1219:16)
[31m[dev:server][0m       at async cached (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:235:20)
[31m[dev:server][0m       at async OptimizedStorage.getAllTerms (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedStorage.ts:1165:23)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/terms.ts:151:18) {
[31m[dev:server][0m     length: 200,
[31m[dev:server][0m     severity: 'ERROR',
[31m[dev:server][0m     code: '42883',
[31m[dev:server][0m     detail: undefined,
[31m[dev:server][0m     hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
[31m[dev:server][0m     position: '214',
[31m[dev:server][0m     internalPosition: undefined,
[31m[dev:server][0m     internalQuery: undefined,
[31m[dev:server][0m     where: undefined,
[31m[dev:server][0m     schema: undefined,
[31m[dev:server][0m     table: undefined,
[31m[dev:server][0m     column: undefined,
[31m[dev:server][0m     dataType: undefined,
[31m[dev:server][0m     constraint: undefined,
[31m[dev:server][0m     file: 'parse_oper.c',
[31m[dev:server][0m     line: '647',
[31m[dev:server][0m     routine: 'op_error'
[31m[dev:server][0m   }
[31m[dev:server][0m }
[34m[dev:server][0m [33mwarn[39m: Database query failed, returning empty result {"environment":"development","error":"Failed query: select \"terms\".\"id\", \"terms\".\"name\", \"terms\".\"short_definition\", \"terms\".\"definition\", \"terms\".\"category_id\", \"terms\".\"view_count\", \"categories\".\"name\" from \"terms\" left join \"categories\" on \"terms\".\"category_id\" = \"categories\".\"id\" order by \"terms\".\"name\" asc limit $1\nparams: 24","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:00"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms {"duration":284,"environment":"development","label":"GET /api/terms","requestId":"e9881abb-cdb2-4d2a-9d27-d5cfb8fcb3a2","responseSize":306,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms 200 (284ms) {"duration":284,"environment":"development","method":"GET","path":"/api/terms","requestId":"e9881abb-cdb2-4d2a-9d27-d5cfb8fcb3a2","responseSize":306,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms {"duration":285,"environment":"development","label":"GET /api/terms","requestId":"e9881abb-cdb2-4d2a-9d27-d5cfb8fcb3a2","responseSize":306,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms 200 (285ms) {"duration":285,"environment":"development","method":"GET","path":"/api/terms","requestId":"e9881abb-cdb2-4d2a-9d27-d5cfb8fcb3a2","responseSize":306,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/terms 200 in 285ms :: {"success":true,"data":[],"total":0,"page":1,"li… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:00"}
[34m[dev:server][0m 📊 GET /api/terms - 285ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/terms {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/terms","requestId":"9cc057d8-c13a-4d5e-ac8a-8ebf05421b8a","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:00","type":"api_request","userAgent":"curl/8.7.1"}
[31m[dev:server][0m [QueryCache] Query failed for key: all-terms:24:0:all:all:name:asc:id,name,shortDefinition,definition,viewCount,categoryId,category DrizzleQueryError: Failed query: select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."definition", "terms"."category_id", "terms"."view_count", "categories"."name" from "terms" left join "categories" on "terms"."category_id" = "categories"."id" order by "terms"."name" asc limit $1
[31m[dev:server][0m params: 24
[31m[dev:server][0m     at NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:74:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m     ... 3 lines matching cause stack trace ...
[31m[dev:server][0m     at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/terms.ts:151:18) {
[31m[dev:server][0m   query: 'select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."definition", "terms"."category_id", "terms"."view_count", "categories"."name" from "terms" left join "categories" on "terms"."category_id" = "categories"."id" order by "terms"."name" asc limit $1',
[31m[dev:server][0m   params: [ 24 ],
[31m[dev:server][0m   cause: error: operator does not exist: uuid = integer
[31m[dev:server][0m       at file:///Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/@neondatabase/serverless/index.mjs:1345:74
[31m[dev:server][0m       at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:153:11)
[31m[dev:server][0m       at async NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:72:12)
[31m[dev:server][0m       at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedStorage.ts:1219:16)
[31m[dev:server][0m       at async cached (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:235:20)
[31m[dev:server][0m       at async OptimizedStorage.getAllTerms (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedStorage.ts:1165:23)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/terms.ts:151:18) {
[31m[dev:server][0m     length: 200,
[31m[dev:server][0m     severity: 'ERROR',
[31m[dev:server][0m     code: '42883',
[31m[dev:server][0m     detail: undefined,
[31m[dev:server][0m     hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
[31m[dev:server][0m     position: '214',
[31m[dev:server][0m     internalPosition: undefined,
[31m[dev:server][0m     internalQuery: undefined,
[31m[dev:server][0m     where: undefined,
[31m[dev:server][0m     schema: undefined,
[31m[dev:server][0m     table: undefined,
[31m[dev:server][0m     column: undefined,
[31m[dev:server][0m     dataType: undefined,
[31m[dev:server][0m     constraint: undefined,
[31m[dev:server][0m     file: 'parse_oper.c',
[31m[dev:server][0m     line: '647',
[31m[dev:server][0m     routine: 'op_error'
[31m[dev:server][0m   }
[31m[dev:server][0m }
[34m[dev:server][0m [33mwarn[39m: Database query failed, returning empty result {"environment":"development","error":"Failed query: select \"terms\".\"id\", \"terms\".\"name\", \"terms\".\"short_definition\", \"terms\".\"definition\", \"terms\".\"category_id\", \"terms\".\"view_count\", \"categories\".\"name\" from \"terms\" left join \"categories\" on \"terms\".\"category_id\" = \"categories\".\"id\" order by \"terms\".\"name\" asc limit $1\nparams: 24","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:00"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms {"duration":276,"environment":"development","label":"GET /api/terms","requestId":"9cc057d8-c13a-4d5e-ac8a-8ebf05421b8a","responseSize":306,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms 200 (276ms) {"duration":276,"environment":"development","method":"GET","path":"/api/terms","requestId":"9cc057d8-c13a-4d5e-ac8a-8ebf05421b8a","responseSize":306,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms {"duration":277,"environment":"development","label":"GET /api/terms","requestId":"9cc057d8-c13a-4d5e-ac8a-8ebf05421b8a","responseSize":306,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms 200 (277ms) {"duration":277,"environment":"development","method":"GET","path":"/api/terms","requestId":"9cc057d8-c13a-4d5e-ac8a-8ebf05421b8a","responseSize":306,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:00","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/terms 200 in 276ms :: {"success":true,"data":[],"total":0,"page":1,"li… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:00"}
[34m[dev:server][0m 📊 GET /api/terms - 276ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/terms {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/terms","queryParams":{"limit":"5"},"requestId":"70ca2539-b9d1-455e-bf1b-f0b7e14bb23d","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:00","type":"api_request","userAgent":"curl/8.7.1"}
[31m[dev:server][0m [QueryCache] Query failed for key: all-terms:5:0:all:all:name:asc:id,name,shortDefinition,definition,viewCount,categoryId,category DrizzleQueryError: Failed query: select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."definition", "terms"."category_id", "terms"."view_count", "categories"."name" from "terms" left join "categories" on "terms"."category_id" = "categories"."id" order by "terms"."name" asc limit $1
[31m[dev:server][0m params: 5
[31m[dev:server][0m     at NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:74:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m     ... 3 lines matching cause stack trace ...
[31m[dev:server][0m     at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/terms.ts:151:18) {
[31m[dev:server][0m   query: 'select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."definition", "terms"."category_id", "terms"."view_count", "categories"."name" from "terms" left join "categories" on "terms"."category_id" = "categories"."id" order by "terms"."name" asc limit $1',
[31m[dev:server][0m   params: [ 5 ],
[31m[dev:server][0m   cause: error: operator does not exist: uuid = integer
[31m[dev:server][0m       at file:///Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/@neondatabase/serverless/index.mjs:1345:74
[31m[dev:server][0m       at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:153:11)
[31m[dev:server][0m       at async NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:72:12)
[31m[dev:server][0m       at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedStorage.ts:1219:16)
[31m[dev:server][0m       at async cached (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:235:20)
[31m[dev:server][0m       at async OptimizedStorage.getAllTerms (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedStorage.ts:1165:23)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/terms.ts:151:18) {
[31m[dev:server][0m     length: 200,
[31m[dev:server][0m     severity: 'ERROR',
[31m[dev:server][0m     code: '42883',
[31m[dev:server][0m     detail: undefined,
[31m[dev:server][0m     hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
[31m[dev:server][0m     position: '214',
[31m[dev:server][0m     internalPosition: undefined,
[31m[dev:server][0m     internalQuery: undefined,
[31m[dev:server][0m     where: undefined,
[31m[dev:server][0m     schema: undefined,
[31m[dev:server][0m     table: undefined,
[31m[dev:server][0m     column: undefined,
[31m[dev:server][0m     dataType: undefined,
[31m[dev:server][0m     constraint: undefined,
[31m[dev:server][0m     file: 'parse_oper.c',
[31m[dev:server][0m     line: '647',
[31m[dev:server][0m     routine: 'op_error'
[31m[dev:server][0m   }
[31m[dev:server][0m }
[34m[dev:server][0m [33mwarn[39m: Database query failed, returning empty result {"environment":"development","error":"Failed query: select \"terms\".\"id\", \"terms\".\"name\", \"terms\".\"short_definition\", \"terms\".\"definition\", \"terms\".\"category_id\", \"terms\".\"view_count\", \"categories\".\"name\" from \"terms\" left join \"categories\" on \"terms\".\"category_id\" = \"categories\".\"id\" order by \"terms\".\"name\" asc limit $1\nparams: 5","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:01"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms {"duration":274,"environment":"development","label":"GET /api/terms","requestId":"70ca2539-b9d1-455e-bf1b-f0b7e14bb23d","responseSize":304,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:01","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms 200 (274ms) {"duration":274,"environment":"development","method":"GET","path":"/api/terms","requestId":"70ca2539-b9d1-455e-bf1b-f0b7e14bb23d","responseSize":304,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:01","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms {"duration":275,"environment":"development","label":"GET /api/terms","requestId":"70ca2539-b9d1-455e-bf1b-f0b7e14bb23d","responseSize":304,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:01","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms 200 (275ms) {"duration":275,"environment":"development","method":"GET","path":"/api/terms","requestId":"70ca2539-b9d1-455e-bf1b-f0b7e14bb23d","responseSize":304,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:01","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/terms 200 in 274ms :: {"success":true,"data":[],"total":0,"page":1,"li… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:01"}
[34m[dev:server][0m 📊 GET /api/terms - 275ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/terms {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/terms","queryParams":{"limit":"5"},"requestId":"73842b88-046e-4db9-a6b3-382f0056b036","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:01","type":"api_request","userAgent":"curl/8.7.1"}
[31m[dev:server][0m [QueryCache] Query failed for key: all-terms:5:0:all:all:name:asc:id,name,shortDefinition,definition,viewCount,categoryId,category DrizzleQueryError: Failed query: select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."definition", "terms"."category_id", "terms"."view_count", "categories"."name" from "terms" left join "categories" on "terms"."category_id" = "categories"."id" order by "terms"."name" asc limit $1
[31m[dev:server][0m params: 5
[31m[dev:server][0m     at NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:74:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m     ... 3 lines matching cause stack trace ...
[31m[dev:server][0m     at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/terms.ts:151:18) {
[31m[dev:server][0m   query: 'select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."definition", "terms"."category_id", "terms"."view_count", "categories"."name" from "terms" left join "categories" on "terms"."category_id" = "categories"."id" order by "terms"."name" asc limit $1',
[31m[dev:server][0m   params: [ 5 ],
[31m[dev:server][0m   cause: error: operator does not exist: uuid = integer
[31m[dev:server][0m       at file:///Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/@neondatabase/serverless/index.mjs:1345:74
[31m[dev:server][0m       at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:153:11)
[31m[dev:server][0m       at async NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:72:12)
[31m[dev:server][0m       at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedStorage.ts:1219:16)
[31m[dev:server][0m       at async cached (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:235:20)
[31m[dev:server][0m       at async OptimizedStorage.getAllTerms (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedStorage.ts:1165:23)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/terms.ts:151:18) {
[31m[dev:server][0m     length: 200,
[31m[dev:server][0m     severity: 'ERROR',
[31m[dev:server][0m     code: '42883',
[31m[dev:server][0m     detail: undefined,
[31m[dev:server][0m     hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
[31m[dev:server][0m     position: '214',
[31m[dev:server][0m     internalPosition: undefined,
[31m[dev:server][0m     internalQuery: undefined,
[31m[dev:server][0m     where: undefined,
[31m[dev:server][0m     schema: undefined,
[31m[dev:server][0m     table: undefined,
[31m[dev:server][0m     column: undefined,
[31m[dev:server][0m     dataType: undefined,
[31m[dev:server][0m     constraint: undefined,
[31m[dev:server][0m     file: 'parse_oper.c',
[31m[dev:server][0m     line: '647',
[31m[dev:server][0m     routine: 'op_error'
[31m[dev:server][0m   }
[31m[dev:server][0m }
[34m[dev:server][0m [33mwarn[39m: Database query failed, returning empty result {"environment":"development","error":"Failed query: select \"terms\".\"id\", \"terms\".\"name\", \"terms\".\"short_definition\", \"terms\".\"definition\", \"terms\".\"category_id\", \"terms\".\"view_count\", \"categories\".\"name\" from \"terms\" left join \"categories\" on \"terms\".\"category_id\" = \"categories\".\"id\" order by \"terms\".\"name\" asc limit $1\nparams: 5","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:01"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms {"duration":265,"environment":"development","label":"GET /api/terms","requestId":"73842b88-046e-4db9-a6b3-382f0056b036","responseSize":304,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:01","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms 200 (265ms) {"duration":265,"environment":"development","method":"GET","path":"/api/terms","requestId":"73842b88-046e-4db9-a6b3-382f0056b036","responseSize":304,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:01","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms {"duration":265,"environment":"development","label":"GET /api/terms","requestId":"73842b88-046e-4db9-a6b3-382f0056b036","responseSize":304,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:01","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms 200 (265ms) {"duration":265,"environment":"development","method":"GET","path":"/api/terms","requestId":"73842b88-046e-4db9-a6b3-382f0056b036","responseSize":304,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:01","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/terms 200 in 265ms :: {"success":true,"data":[],"total":0,"page":1,"li… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:01"}
[34m[dev:server][0m 📊 GET /api/terms - 265ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/terms/1 {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/terms/1","requestId":"c7d2cfa9-f15f-4afa-b954-98f79ee8651f","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:01","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms/1 {"duration":2,"environment":"development","label":"GET /api/terms/1","requestId":"c7d2cfa9-f15f-4afa-b954-98f79ee8651f","responseSize":34,"service":"ai-glossary-pro","statusCode":400,"timestamp":"2025-07-10 15:02:01","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms/1 400 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/terms/1","requestId":"c7d2cfa9-f15f-4afa-b954-98f79ee8651f","responseSize":34,"service":"ai-glossary-pro","statusCode":400,"timestamp":"2025-07-10 15:02:01","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms/1 {"duration":4,"environment":"development","label":"GET /api/terms/1","requestId":"c7d2cfa9-f15f-4afa-b954-98f79ee8651f","responseSize":34,"service":"ai-glossary-pro","statusCode":400,"timestamp":"2025-07-10 15:02:01","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms/1 400 (4ms) {"duration":4,"environment":"development","method":"GET","path":"/api/terms/1","requestId":"c7d2cfa9-f15f-4afa-b954-98f79ee8651f","responseSize":34,"service":"ai-glossary-pro","statusCode":400,"timestamp":"2025-07-10 15:02:01","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/terms/1 400 in 5ms :: {"error":"Invalid term ID format"} {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:01"}
[34m[dev:server][0m 📊 GET /api/terms/1 - 5ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/terms/1 {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/terms/1","requestId":"06e54ebe-cc73-44a2-bed2-28da9d413b54","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:01","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms/1 {"duration":2,"environment":"development","label":"GET /api/terms/1","requestId":"06e54ebe-cc73-44a2-bed2-28da9d413b54","responseSize":34,"service":"ai-glossary-pro","statusCode":400,"timestamp":"2025-07-10 15:02:01","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms/1 400 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/terms/1","requestId":"06e54ebe-cc73-44a2-bed2-28da9d413b54","responseSize":34,"service":"ai-glossary-pro","statusCode":400,"timestamp":"2025-07-10 15:02:01","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms/1 {"duration":2,"environment":"development","label":"GET /api/terms/1","requestId":"06e54ebe-cc73-44a2-bed2-28da9d413b54","responseSize":34,"service":"ai-glossary-pro","statusCode":400,"timestamp":"2025-07-10 15:02:01","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms/1 400 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/terms/1","requestId":"06e54ebe-cc73-44a2-bed2-28da9d413b54","responseSize":34,"service":"ai-glossary-pro","statusCode":400,"timestamp":"2025-07-10 15:02:01","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/terms/1 400 in 1ms :: {"error":"Invalid term ID format"} {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:01"}
[34m[dev:server][0m 📊 GET /api/terms/1 - 1ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/terms/search {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/terms/search","queryParams":{"q":"machine"},"requestId":"ac642389-27f0-42dc-9231-8198f91e5d5b","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:01","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms/search {"duration":592,"environment":"development","label":"GET /api/terms/search","requestId":"ac642389-27f0-42dc-9231-8198f91e5d5b","responseSize":74,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:01","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms/search 200 (592ms) {"duration":592,"environment":"development","method":"GET","path":"/api/terms/search","requestId":"ac642389-27f0-42dc-9231-8198f91e5d5b","responseSize":74,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:01","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms/search {"duration":592,"environment":"development","label":"GET /api/terms/search","requestId":"ac642389-27f0-42dc-9231-8198f91e5d5b","responseSize":74,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:01","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms/search 200 (592ms) {"duration":592,"environment":"development","method":"GET","path":"/api/terms/search","requestId":"ac642389-27f0-42dc-9231-8198f91e5d5b","responseSize":74,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:01","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/terms/search 200 in 593ms :: {"success":true,"data":[],"total":"0","pa… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:01"}
[34m[dev:server][0m 📊 GET /api/terms/search - 593ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/terms/search {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/terms/search","queryParams":{"q":"machine"},"requestId":"a341e4c1-8964-455c-bfb5-d0952614a745","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:01","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms/search {"duration":1,"environment":"development","label":"GET /api/terms/search","requestId":"a341e4c1-8964-455c-bfb5-d0952614a745","responseSize":74,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:01","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms/search 200 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/terms/search","requestId":"a341e4c1-8964-455c-bfb5-d0952614a745","responseSize":74,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:01","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms/search {"duration":2,"environment":"development","label":"GET /api/terms/search","requestId":"a341e4c1-8964-455c-bfb5-d0952614a745","responseSize":74,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:02","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms/search 200 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/terms/search","requestId":"a341e4c1-8964-455c-bfb5-d0952614a745","responseSize":74,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:02","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/terms/search 200 in 1ms :: {"success":true,"data":[],"total":"0","page… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:02"}
[34m[dev:server][0m 📊 GET /api/terms/search - 1ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/categories {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/categories","requestId":"1118f736-102a-420b-9d58-6290aa8303e3","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:02","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/categories {"duration":1,"environment":"development","label":"GET /api/categories","requestId":"1118f736-102a-420b-9d58-6290aa8303e3","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:02","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/categories 200 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/categories","requestId":"1118f736-102a-420b-9d58-6290aa8303e3","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:02","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/categories {"duration":1,"environment":"development","label":"GET /api/categories","requestId":"1118f736-102a-420b-9d58-6290aa8303e3","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:02","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/categories 200 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/categories","requestId":"1118f736-102a-420b-9d58-6290aa8303e3","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:02","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/categories 200 in 1ms :: {"success":true,"data":[],"pagination":{"page… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:02"}
[34m[dev:server][0m 📊 GET /api/categories - 1ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/categories {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/categories","requestId":"01292bb9-10a4-4026-892e-b5f84af7c2ac","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:02","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/categories {"duration":1,"environment":"development","label":"GET /api/categories","requestId":"01292bb9-10a4-4026-892e-b5f84af7c2ac","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:02","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/categories 200 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/categories","requestId":"01292bb9-10a4-4026-892e-b5f84af7c2ac","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:02","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/categories {"duration":1,"environment":"development","label":"GET /api/categories","requestId":"01292bb9-10a4-4026-892e-b5f84af7c2ac","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:02","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/categories 200 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/categories","requestId":"01292bb9-10a4-4026-892e-b5f84af7c2ac","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:02","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/categories 200 in 0ms :: {"success":true,"data":[],"pagination":{"page… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:02"}
[34m[dev:server][0m 📊 GET /api/categories - 0ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/categories/1 {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/categories/1","requestId":"5625967a-a618-49bf-adaf-d9946668b65d","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:02","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/categories/1 {"duration":298,"environment":"development","label":"GET /api/categories/1","requestId":"5625967a-a618-49bf-adaf-d9946668b65d","responseSize":48,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:02","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/categories/1 404 (298ms) {"duration":298,"environment":"development","method":"GET","path":"/api/categories/1","requestId":"5625967a-a618-49bf-adaf-d9946668b65d","responseSize":48,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:02","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/categories/1 {"duration":299,"environment":"development","label":"GET /api/categories/1","requestId":"5625967a-a618-49bf-adaf-d9946668b65d","responseSize":48,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:02","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/categories/1 404 (299ms) {"duration":299,"environment":"development","method":"GET","path":"/api/categories/1","requestId":"5625967a-a618-49bf-adaf-d9946668b65d","responseSize":48,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:02","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/categories/1 404 in 298ms :: {"success":false,"message":"Category not … {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:02"}
[34m[dev:server][0m 📊 GET /api/categories/1 - 298ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/categories/1 {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/categories/1","requestId":"85a1c94e-aff1-4d73-a103-73ae5a31b5d7","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:02","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/categories/1 {"duration":1,"environment":"development","label":"GET /api/categories/1","requestId":"85a1c94e-aff1-4d73-a103-73ae5a31b5d7","responseSize":48,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:02","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/categories/1 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/categories/1","requestId":"85a1c94e-aff1-4d73-a103-73ae5a31b5d7","responseSize":48,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:02","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/categories/1 {"duration":1,"environment":"development","label":"GET /api/categories/1","requestId":"85a1c94e-aff1-4d73-a103-73ae5a31b5d7","responseSize":48,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:02","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/categories/1 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/categories/1","requestId":"85a1c94e-aff1-4d73-a103-73ae5a31b5d7","responseSize":48,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:02","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/categories/1 404 in 0ms :: {"success":false,"message":"Category not fo… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:02"}
[34m[dev:server][0m 📊 GET /api/categories/1 - 0ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/categories/1/terms {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/categories/1/terms","requestId":"8075b9ca-2445-458c-8e35-67e02d0e9a4f","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:02","type":"api_request","userAgent":"curl/8.7.1"}
[31m[dev:server][0m [QueryCache] Query failed for key: terms:cat:1:page:1:0:50:name:asc:id,name,shortDefinition,viewCount DrizzleQueryError: Failed query: select count(*) from "terms" where "terms"."category_id" = $1
[31m[dev:server][0m params: 1
[31m[dev:server][0m     at NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:74:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m     ... 2 lines matching cause stack trace ...
[31m[dev:server][0m     at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/categories.ts:157:18) {
[31m[dev:server][0m   query: 'select count(*) from "terms" where "terms"."category_id" = $1',
[31m[dev:server][0m   params: [ '1' ],
[31m[dev:server][0m   cause: error: invalid input syntax for type uuid: "1"
[31m[dev:server][0m       at file:///Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/@neondatabase/serverless/index.mjs:1345:74
[31m[dev:server][0m       at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:153:11)
[31m[dev:server][0m       at async NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:72:12)
[31m[dev:server][0m       at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedStorage.ts:790:29)
[31m[dev:server][0m       at async cached (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:235:20)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/categories.ts:157:18) {
[31m[dev:server][0m     length: 133,
[31m[dev:server][0m     severity: 'ERROR',
[31m[dev:server][0m     code: '22P02',
[31m[dev:server][0m     detail: undefined,
[31m[dev:server][0m     hint: undefined,
[31m[dev:server][0m     position: undefined,
[31m[dev:server][0m     internalPosition: undefined,
[31m[dev:server][0m     internalQuery: undefined,
[31m[dev:server][0m     where: "unnamed portal parameter $1 = '...'",
[31m[dev:server][0m     schema: undefined,
[31m[dev:server][0m     table: undefined,
[31m[dev:server][0m     column: undefined,
[31m[dev:server][0m     dataType: undefined,
[31m[dev:server][0m     constraint: undefined,
[31m[dev:server][0m     file: 'uuid.c',
[31m[dev:server][0m     line: '133',
[31m[dev:server][0m     routine: 'string_to_uuid'
[31m[dev:server][0m   }
[31m[dev:server][0m }
[34m[dev:server][0m [33mwarn[39m: Database query failed for terms by category {"categoryId":"1","component":"CategoryRoutes","environment":"development","error":{"cause":{"code":"22P02","file":"uuid.c","length":133,"line":"133","name":"error","routine":"string_to_uuid","severity":"ERROR","where":"unnamed portal parameter $1 = '...'"},"params":["1"],"query":"select count(*) from \"terms\" where \"terms\".\"category_id\" = $1"},"query":"getTermsByCategory","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:02"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/categories/1/terms {"duration":255,"environment":"development","label":"GET /api/categories/1/terms","requestId":"8075b9ca-2445-458c-8e35-67e02d0e9a4f","responseSize":72,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:02","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/categories/1/terms 200 (255ms) {"duration":255,"environment":"development","method":"GET","path":"/api/categories/1/terms","requestId":"8075b9ca-2445-458c-8e35-67e02d0e9a4f","responseSize":72,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:02","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/categories/1/terms {"duration":255,"environment":"development","label":"GET /api/categories/1/terms","requestId":"8075b9ca-2445-458c-8e35-67e02d0e9a4f","responseSize":72,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:02","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/categories/1/terms 200 (255ms) {"duration":255,"environment":"development","method":"GET","path":"/api/categories/1/terms","requestId":"8075b9ca-2445-458c-8e35-67e02d0e9a4f","responseSize":72,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:02","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/categories/1/terms 200 in 255ms :: {"success":true,"data":[],"total":0… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:02"}
[34m[dev:server][0m 📊 GET /api/categories/1/terms - 255ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/categories/1/terms {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/categories/1/terms","requestId":"19f40076-bfdd-49d9-8b78-fcbf34bc57bc","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:02","type":"api_request","userAgent":"curl/8.7.1"}
[31m[dev:server][0m [QueryCache] Query failed for key: terms:cat:1:page:1:0:50:name:asc:id,name,shortDefinition,viewCount DrizzleQueryError: Failed query: select count(*) from "terms" where "terms"."category_id" = $1
[31m[dev:server][0m params: 1
[31m[dev:server][0m     at NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:74:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m     ... 2 lines matching cause stack trace ...
[31m[dev:server][0m     at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/categories.ts:157:18) {
[31m[dev:server][0m   query: 'select count(*) from "terms" where "terms"."category_id" = $1',
[31m[dev:server][0m   params: [ '1' ],
[31m[dev:server][0m   cause: error: invalid input syntax for type uuid: "1"
[31m[dev:server][0m       at file:///Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/@neondatabase/serverless/index.mjs:1345:74
[31m[dev:server][0m       at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:153:11)
[31m[dev:server][0m       at async NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:72:12)
[31m[dev:server][0m       at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedStorage.ts:790:29)
[31m[dev:server][0m       at async cached (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:235:20)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/categories.ts:157:18) {
[31m[dev:server][0m     length: 133,
[31m[dev:server][0m     severity: 'ERROR',
[31m[dev:server][0m     code: '22P02',
[31m[dev:server][0m     detail: undefined,
[31m[dev:server][0m     hint: undefined,
[31m[dev:server][0m     position: undefined,
[31m[dev:server][0m     internalPosition: undefined,
[31m[dev:server][0m     internalQuery: undefined,
[31m[dev:server][0m     where: "unnamed portal parameter $1 = '...'",
[31m[dev:server][0m     schema: undefined,
[31m[dev:server][0m     table: undefined,
[31m[dev:server][0m     column: undefined,
[31m[dev:server][0m     dataType: undefined,
[31m[dev:server][0m     constraint: undefined,
[31m[dev:server][0m     file: 'uuid.c',
[31m[dev:server][0m     line: '133',
[31m[dev:server][0m     routine: 'string_to_uuid'
[31m[dev:server][0m   }
[31m[dev:server][0m }
[34m[dev:server][0m [33mwarn[39m: Database query failed for terms by category {"categoryId":"1","component":"CategoryRoutes","environment":"development","error":{"cause":{"code":"22P02","file":"uuid.c","length":133,"line":"133","name":"error","routine":"string_to_uuid","severity":"ERROR","where":"unnamed portal parameter $1 = '...'"},"params":["1"],"query":"select count(*) from \"terms\" where \"terms\".\"category_id\" = $1"},"query":"getTermsByCategory","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:04"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/categories/1/terms {"duration":1676,"environment":"development","label":"GET /api/categories/1/terms","requestId":"19f40076-bfdd-49d9-8b78-fcbf34bc57bc","responseSize":72,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:04","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/categories/1/terms 200 (1676ms) {"duration":1676,"environment":"development","method":"GET","path":"/api/categories/1/terms","requestId":"19f40076-bfdd-49d9-8b78-fcbf34bc57bc","responseSize":72,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:04","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/categories/1/terms {"duration":1676,"environment":"development","label":"GET /api/categories/1/terms","requestId":"19f40076-bfdd-49d9-8b78-fcbf34bc57bc","responseSize":72,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:04","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/categories/1/terms 200 (1676ms) {"duration":1676,"environment":"development","method":"GET","path":"/api/categories/1/terms","requestId":"19f40076-bfdd-49d9-8b78-fcbf34bc57bc","responseSize":72,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:04","type":"api_response"}
[34m[dev:server][0m [33mwarn[39m: Slow request detected: GET /api/categories/1/terms {"duration":1675.697792,"environment":"development","requestId":"19f40076-bfdd-49d9-8b78-fcbf34bc57bc","service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:04"}
[34m[dev:server][0m [32minfo[39m: GET /api/categories/1/terms 200 in 1676ms :: {"success":true,"data":[],"total":… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:04"}
[31m[dev:server][0m 🐌 Slow query detected: GET /api/categories/1/terms - 1676ms
[34m[dev:server][0m 📊 GET /api/categories/1/terms - 1676ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/subcategories {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/subcategories","requestId":"1141dc93-7c77-44b4-8489-3f8ffe3726df","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:04","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/subcategories {"duration":1869,"environment":"development","label":"GET /api/subcategories","requestId":"1141dc93-7c77-44b4-8489-3f8ffe3726df","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:06","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/subcategories 200 (1869ms) {"duration":1869,"environment":"development","method":"GET","path":"/api/subcategories","requestId":"1141dc93-7c77-44b4-8489-3f8ffe3726df","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:06","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/subcategories {"duration":1870,"environment":"development","label":"GET /api/subcategories","requestId":"1141dc93-7c77-44b4-8489-3f8ffe3726df","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:06","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/subcategories 200 (1870ms) {"duration":1870,"environment":"development","method":"GET","path":"/api/subcategories","requestId":"1141dc93-7c77-44b4-8489-3f8ffe3726df","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:06","type":"api_response"}
[34m[dev:server][0m [33mwarn[39m: Slow request detected: GET /api/subcategories {"duration":1869.925209,"environment":"development","requestId":"1141dc93-7c77-44b4-8489-3f8ffe3726df","service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:06"}
[34m[dev:server][0m [32minfo[39m: GET /api/subcategories 200 in 1869ms :: {"success":true,"data":[],"pagination":… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:06"}
[31m[dev:server][0m 🐌 Slow query detected: GET /api/subcategories - 1869ms
[34m[dev:server][0m 📊 GET /api/subcategories - 1869ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/subcategories {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/subcategories","requestId":"cea3bee1-f86e-4180-9023-ab408216804c","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:06","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/subcategories {"duration":545,"environment":"development","label":"GET /api/subcategories","requestId":"cea3bee1-f86e-4180-9023-ab408216804c","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:06","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/subcategories 200 (545ms) {"duration":545,"environment":"development","method":"GET","path":"/api/subcategories","requestId":"cea3bee1-f86e-4180-9023-ab408216804c","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:06","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/subcategories {"duration":546,"environment":"development","label":"GET /api/subcategories","requestId":"cea3bee1-f86e-4180-9023-ab408216804c","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:06","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/subcategories 200 (546ms) {"duration":546,"environment":"development","method":"GET","path":"/api/subcategories","requestId":"cea3bee1-f86e-4180-9023-ab408216804c","responseSize":100,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:06","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/subcategories 200 in 545ms :: {"success":true,"data":[],"pagination":{… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:06"}
[34m[dev:server][0m 📊 GET /api/subcategories - 546ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/subcategories/by-category/1 {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/subcategories/by-category/1","requestId":"1dc73b27-f9a0-4fdc-98a4-3aec11c577e3","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:06","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/subcategories/by-category/1 {"duration":5,"environment":"development","label":"GET /api/subcategories/by-category/1","requestId":"1dc73b27-f9a0-4fdc-98a4-3aec11c577e3","responseSize":141,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:06","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/subcategories/by-category/1 404 (5ms) {"duration":5,"environment":"development","method":"GET","path":"/api/subcategories/by-category/1","requestId":"1dc73b27-f9a0-4fdc-98a4-3aec11c577e3","responseSize":141,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:06","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/subcategories/by-category/1 {"duration":6,"environment":"development","label":"GET /api/subcategories/by-category/1","requestId":"1dc73b27-f9a0-4fdc-98a4-3aec11c577e3","responseSize":141,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:06","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/subcategories/by-category/1 404 (6ms) {"duration":6,"environment":"development","method":"GET","path":"/api/subcategories/by-category/1","requestId":"1dc73b27-f9a0-4fdc-98a4-3aec11c577e3","responseSize":141,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:06","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/subcategories/by-category/1 404 in 5ms :: {"success":false,"message":"… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:06"}
[34m[dev:server][0m 📊 GET /api/subcategories/by-category/1 - 5ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/subcategories/by-category/1 {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/subcategories/by-category/1","requestId":"5ce29574-7b35-4045-8e7d-ad2e1b90c33e","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:06","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/subcategories/by-category/1 {"duration":2,"environment":"development","label":"GET /api/subcategories/by-category/1","requestId":"5ce29574-7b35-4045-8e7d-ad2e1b90c33e","responseSize":141,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:06","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/subcategories/by-category/1 404 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/subcategories/by-category/1","requestId":"5ce29574-7b35-4045-8e7d-ad2e1b90c33e","responseSize":141,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:06","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/subcategories/by-category/1 {"duration":3,"environment":"development","label":"GET /api/subcategories/by-category/1","requestId":"5ce29574-7b35-4045-8e7d-ad2e1b90c33e","responseSize":141,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:06","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/subcategories/by-category/1 404 (3ms) {"duration":3,"environment":"development","method":"GET","path":"/api/subcategories/by-category/1","requestId":"5ce29574-7b35-4045-8e7d-ad2e1b90c33e","responseSize":141,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:06","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/subcategories/by-category/1 404 in 2ms :: {"success":false,"message":"… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:06"}
[34m[dev:server][0m 📊 GET /api/subcategories/by-category/1 - 2ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/search {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/search","queryParams":{"q":"neural"},"requestId":"21a48811-06f7-4426-ade4-475f474d2da0","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:06","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m Search query: neural
[31m[dev:server][0m [QueryCache] Query failed for key: optimized-search:neural:1:20:all:relevance:true DrizzleQueryError: Failed query: select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."characteristics", "terms"."references", "terms"."view_count", "terms"."created_at", "terms"."updated_at", "categories"."id", "categories"."name", 
[31m[dev:server][0m           ts_rank(
[31m[dev:server][0m             to_tsvector('english', "terms"."name" || ' ' || COALESCE("terms"."short_definition", '')),
[31m[dev:server][0m             plainto_tsquery('english', $1)
[31m[dev:server][0m           ) + ("terms"."view_count" * 0.01)
[31m[dev:server][0m          as "relevance_score", "terms"."definition" from "terms" left join "categories" on "terms"."category_id" = "categories"."id" where to_tsvector('english', "terms"."name" || ' ' || COALESCE("terms"."short_definition", '')) @@ plainto_tsquery('english', $2) order by "relevance_score" desc, "terms"."view_count" desc limit $3
[31m[dev:server][0m params: neural,neural,21
[31m[dev:server][0m     at NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:74:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m     ... 3 lines matching cause stack trace ...
[31m[dev:server][0m     at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/search.ts:54:32) {
[31m[dev:server][0m   query: 'select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."characteristics", "terms"."references", "terms"."view_count", "terms"."created_at", "terms"."updated_at", "categories"."id", "categories"."name", \n' +
[31m[dev:server][0m     '          ts_rank(\n' +
[31m[dev:server][0m     `            to_tsvector('english', "terms"."name" || ' ' || COALESCE("terms"."short_definition", '')),\n` +
[31m[dev:server][0m     "            plainto_tsquery('english', $1)\n" +
[31m[dev:server][0m     '          ) + ("terms"."view_count" * 0.01)\n' +
[31m[dev:server][0m     `         as "relevance_score", "terms"."definition" from "terms" left join "categories" on "terms"."category_id" = "categories"."id" where to_tsvector('english', "terms"."name" || ' ' || COALESCE("terms"."short_definition", '')) @@ plainto_tsquery('english', $2) order by "relevance_score" desc, "terms"."view_count" desc limit $3`,
[31m[dev:server][0m   params: [ 'neural', 'neural', 21 ],
[31m[dev:server][0m   cause: error: operator does not exist: uuid = integer
[31m[dev:server][0m       at file:///Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/@neondatabase/serverless/index.mjs:1345:74
[31m[dev:server][0m       at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:153:11)
[31m[dev:server][0m       at async NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:72:12)
[31m[dev:server][0m       at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedSearchService.ts:149:25)
[31m[dev:server][0m       at async cached (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:235:20)
[31m[dev:server][0m       at async optimizedSearch (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedSearchService.ts:75:12)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/search.ts:54:32) {
[31m[dev:server][0m     length: 200,
[31m[dev:server][0m     severity: 'ERROR',
[31m[dev:server][0m     code: '42883',
[31m[dev:server][0m     detail: undefined,
[31m[dev:server][0m     hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
[31m[dev:server][0m     position: '544',
[31m[dev:server][0m     internalPosition: undefined,
[31m[dev:server][0m     internalQuery: undefined,
[31m[dev:server][0m     where: undefined,
[31m[dev:server][0m     schema: undefined,
[31m[dev:server][0m     table: undefined,
[31m[dev:server][0m     column: undefined,
[31m[dev:server][0m     dataType: undefined,
[31m[dev:server][0m     constraint: undefined,
[31m[dev:server][0m     file: 'parse_oper.c',
[31m[dev:server][0m     line: '647',
[31m[dev:server][0m     routine: 'op_error'
[31m[dev:server][0m   }
[31m[dev:server][0m }
[31m[dev:server][0m Optimized search error: DrizzleQueryError: Failed query: select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."characteristics", "terms"."references", "terms"."view_count", "terms"."created_at", "terms"."updated_at", "categories"."id", "categories"."name", 
[31m[dev:server][0m           ts_rank(
[31m[dev:server][0m             to_tsvector('english', "terms"."name" || ' ' || COALESCE("terms"."short_definition", '')),
[31m[dev:server][0m             plainto_tsquery('english', $1)
[31m[dev:server][0m           ) + ("terms"."view_count" * 0.01)
[31m[dev:server][0m          as "relevance_score", "terms"."definition" from "terms" left join "categories" on "terms"."category_id" = "categories"."id" where to_tsvector('english', "terms"."name" || ' ' || COALESCE("terms"."short_definition", '')) @@ plainto_tsquery('english', $2) order by "relevance_score" desc, "terms"."view_count" desc limit $3
[31m[dev:server][0m params: neural,neural,21
[31m[dev:server][0m     at NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:74:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m     ... 3 lines matching cause stack trace ...
[31m[dev:server][0m     at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/search.ts:54:32) {
[31m[dev:server][0m   query: 'select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."characteristics", "terms"."references", "terms"."view_count", "terms"."created_at", "terms"."updated_at", "categories"."id", "categories"."name", \n' +
[31m[dev:server][0m     '          ts_rank(\n' +
[31m[dev:server][0m     `            to_tsvector('english', "terms"."name" || ' ' || COALESCE("terms"."short_definition", '')),\n` +
[31m[dev:server][0m     "            plainto_tsquery('english', $1)\n" +
[31m[dev:server][0m     '          ) + ("terms"."view_count" * 0.01)\n' +
[31m[dev:server][0m     `         as "relevance_score", "terms"."definition" from "terms" left join "categories" on "terms"."category_id" = "categories"."id" where to_tsvector('english', "terms"."name" || ' ' || COALESCE("terms"."short_definition", '')) @@ plainto_tsquery('english', $2) order by "relevance_score" desc, "terms"."view_count" desc limit $3`,
[31m[dev:server][0m   params: [ 'neural', 'neural', 21 ],
[31m[dev:server][0m   cause: error: operator does not exist: uuid = integer
[31m[dev:server][0m       at file:///Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/@neondatabase/serverless/index.mjs:1345:74
[31m[dev:server][0m       at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:153:11)
[31m[dev:server][0m       at async NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:72:12)
[31m[dev:server][0m       at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedSearchService.ts:149:25)
[31m[dev:server][0m       at async cached (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:235:20)
[31m[dev:server][0m       at async optimizedSearch (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedSearchService.ts:75:12)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/search.ts:54:32) {
[31m[dev:server][0m     length: 200,
[31m[dev:server][0m     severity: 'ERROR',
[31m[dev:server][0m     code: '42883',
[31m[dev:server][0m     detail: undefined,
[31m[dev:server][0m     hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
[31m[dev:server][0m     position: '544',
[31m[dev:server][0m     internalPosition: undefined,
[31m[dev:server][0m     internalQuery: undefined,
[31m[dev:server][0m     where: undefined,
[31m[dev:server][0m     schema: undefined,
[31m[dev:server][0m     table: undefined,
[31m[dev:server][0m     column: undefined,
[31m[dev:server][0m     dataType: undefined,
[31m[dev:server][0m     constraint: undefined,
[31m[dev:server][0m     file: 'parse_oper.c',
[31m[dev:server][0m     line: '647',
[31m[dev:server][0m     routine: 'op_error'
[31m[dev:server][0m   }
[31m[dev:server][0m }
[31m[dev:server][0m Error performing search: Error: Search failed: Failed query: select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."characteristics", "terms"."references", "terms"."view_count", "terms"."created_at", "terms"."updated_at", "categories"."id", "categories"."name", 
[31m[dev:server][0m           ts_rank(
[31m[dev:server][0m             to_tsvector('english', "terms"."name" || ' ' || COALESCE("terms"."short_definition", '')),
[31m[dev:server][0m             plainto_tsquery('english', $1)
[31m[dev:server][0m           ) + ("terms"."view_count" * 0.01)
[31m[dev:server][0m          as "relevance_score", "terms"."definition" from "terms" left join "categories" on "terms"."category_id" = "categories"."id" where to_tsvector('english', "terms"."name" || ' ' || COALESCE("terms"."short_definition", '')) @@ plainto_tsquery('english', $2) order by "relevance_score" desc, "terms"."view_count" desc limit $3
[31m[dev:server][0m params: neural,neural,21
[31m[dev:server][0m     at optimizedSearch (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedSearchService.ts:200:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/search.ts:54:32)
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/search {"duration":278,"environment":"development","label":"GET /api/search","requestId":"21a48811-06f7-4426-ade4-475f474d2da0","responseSize":958,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:07","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/search 500 (278ms) {"duration":278,"environment":"development","method":"GET","path":"/api/search","requestId":"21a48811-06f7-4426-ade4-475f474d2da0","responseSize":958,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:07","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/search {"duration":278,"environment":"development","label":"GET /api/search","requestId":"21a48811-06f7-4426-ade4-475f474d2da0","responseSize":958,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:07","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/search 500 (278ms) {"duration":278,"environment":"development","method":"GET","path":"/api/search","requestId":"21a48811-06f7-4426-ade4-475f474d2da0","responseSize":958,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:07","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/search 500 in 279ms :: {"success":false,"message":"Search failed","err… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:07"}
[34m[dev:server][0m 📊 GET /api/search - 279ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/search {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/search","queryParams":{"q":"neural"},"requestId":"a307eda7-8b73-43c2-aafb-2bf9b1667d84","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:07","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m Search query: neural
[31m[dev:server][0m [QueryCache] Query failed for key: optimized-search:neural:1:20:all:relevance:true DrizzleQueryError: Failed query: select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."characteristics", "terms"."references", "terms"."view_count", "terms"."created_at", "terms"."updated_at", "categories"."id", "categories"."name", 
[31m[dev:server][0m           ts_rank(
[31m[dev:server][0m             to_tsvector('english', "terms"."name" || ' ' || COALESCE("terms"."short_definition", '')),
[31m[dev:server][0m             plainto_tsquery('english', $1)
[31m[dev:server][0m           ) + ("terms"."view_count" * 0.01)
[31m[dev:server][0m          as "relevance_score", "terms"."definition" from "terms" left join "categories" on "terms"."category_id" = "categories"."id" where to_tsvector('english', "terms"."name" || ' ' || COALESCE("terms"."short_definition", '')) @@ plainto_tsquery('english', $2) order by "relevance_score" desc, "terms"."view_count" desc limit $3
[31m[dev:server][0m params: neural,neural,21
[31m[dev:server][0m     at NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:74:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m     ... 3 lines matching cause stack trace ...
[31m[dev:server][0m     at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/search.ts:54:32) {
[31m[dev:server][0m   query: 'select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."characteristics", "terms"."references", "terms"."view_count", "terms"."created_at", "terms"."updated_at", "categories"."id", "categories"."name", \n' +
[31m[dev:server][0m     '          ts_rank(\n' +
[31m[dev:server][0m     `            to_tsvector('english', "terms"."name" || ' ' || COALESCE("terms"."short_definition", '')),\n` +
[31m[dev:server][0m     "            plainto_tsquery('english', $1)\n" +
[31m[dev:server][0m     '          ) + ("terms"."view_count" * 0.01)\n' +
[31m[dev:server][0m     `         as "relevance_score", "terms"."definition" from "terms" left join "categories" on "terms"."category_id" = "categories"."id" where to_tsvector('english', "terms"."name" || ' ' || COALESCE("terms"."short_definition", '')) @@ plainto_tsquery('english', $2) order by "relevance_score" desc, "terms"."view_count" desc limit $3`,
[31m[dev:server][0m   params: [ 'neural', 'neural', 21 ],
[31m[dev:server][0m   cause: error: operator does not exist: uuid = integer
[31m[dev:server][0m       at file:///Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/@neondatabase/serverless/index.mjs:1345:74
[31m[dev:server][0m       at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:153:11)
[31m[dev:server][0m       at async NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:72:12)
[31m[dev:server][0m       at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedSearchService.ts:149:25)
[31m[dev:server][0m       at async cached (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:235:20)
[31m[dev:server][0m       at async optimizedSearch (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedSearchService.ts:75:12)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/search.ts:54:32) {
[31m[dev:server][0m     length: 200,
[31m[dev:server][0m     severity: 'ERROR',
[31m[dev:server][0m     code: '42883',
[31m[dev:server][0m     detail: undefined,
[31m[dev:server][0m     hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
[31m[dev:server][0m     position: '544',
[31m[dev:server][0m     internalPosition: undefined,
[31m[dev:server][0m     internalQuery: undefined,
[31m[dev:server][0m     where: undefined,
[31m[dev:server][0m     schema: undefined,
[31m[dev:server][0m     table: undefined,
[31m[dev:server][0m     column: undefined,
[31m[dev:server][0m     dataType: undefined,
[31m[dev:server][0m     constraint: undefined,
[31m[dev:server][0m     file: 'parse_oper.c',
[31m[dev:server][0m     line: '647',
[31m[dev:server][0m     routine: 'op_error'
[31m[dev:server][0m   }
[31m[dev:server][0m }
[31m[dev:server][0m Optimized search error: DrizzleQueryError: Failed query: select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."characteristics", "terms"."references", "terms"."view_count", "terms"."created_at", "terms"."updated_at", "categories"."id", "categories"."name", 
[31m[dev:server][0m           ts_rank(
[31m[dev:server][0m             to_tsvector('english', "terms"."name" || ' ' || COALESCE("terms"."short_definition", '')),
[31m[dev:server][0m             plainto_tsquery('english', $1)
[31m[dev:server][0m           ) + ("terms"."view_count" * 0.01)
[31m[dev:server][0m          as "relevance_score", "terms"."definition" from "terms" left join "categories" on "terms"."category_id" = "categories"."id" where to_tsvector('english', "terms"."name" || ' ' || COALESCE("terms"."short_definition", '')) @@ plainto_tsquery('english', $2) order by "relevance_score" desc, "terms"."view_count" desc limit $3
[31m[dev:server][0m params: neural,neural,21
[31m[dev:server][0m     at NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:74:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m     ... 3 lines matching cause stack trace ...
[31m[dev:server][0m     at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/search.ts:54:32) {
[31m[dev:server][0m   query: 'select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."characteristics", "terms"."references", "terms"."view_count", "terms"."created_at", "terms"."updated_at", "categories"."id", "categories"."name", \n' +
[31m[dev:server][0m     '          ts_rank(\n' +
[31m[dev:server][0m     `            to_tsvector('english', "terms"."name" || ' ' || COALESCE("terms"."short_definition", '')),\n` +
[31m[dev:server][0m     "            plainto_tsquery('english', $1)\n" +
[31m[dev:server][0m     '          ) + ("terms"."view_count" * 0.01)\n' +
[31m[dev:server][0m     `         as "relevance_score", "terms"."definition" from "terms" left join "categories" on "terms"."category_id" = "categories"."id" where to_tsvector('english', "terms"."name" || ' ' || COALESCE("terms"."short_definition", '')) @@ plainto_tsquery('english', $2) order by "relevance_score" desc, "terms"."view_count" desc limit $3`,
[31m[dev:server][0m   params: [ 'neural', 'neural', 21 ],
[31m[dev:server][0m   cause: error: operator does not exist: uuid = integer
[31m[dev:server][0m       at file:///Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/@neondatabase/serverless/index.mjs:1345:74
[31m[dev:server][0m       at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:153:11)
[31m[dev:server][0m       at async NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:72:12)
[31m[dev:server][0m       at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedSearchService.ts:149:25)
[31m[dev:server][0m       at async cached (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:235:20)
[31m[dev:server][0m       at async optimizedSearch (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedSearchService.ts:75:12)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/search.ts:54:32) {
[31m[dev:server][0m     length: 200,
[31m[dev:server][0m     severity: 'ERROR',
[31m[dev:server][0m     code: '42883',
[31m[dev:server][0m     detail: undefined,
[31m[dev:server][0m     hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
[31m[dev:server][0m     position: '544',
[31m[dev:server][0m     internalPosition: undefined,
[31m[dev:server][0m     internalQuery: undefined,
[31m[dev:server][0m     where: undefined,
[31m[dev:server][0m     schema: undefined,
[31m[dev:server][0m     table: undefined,
[31m[dev:server][0m     column: undefined,
[31m[dev:server][0m     dataType: undefined,
[31m[dev:server][0m     constraint: undefined,
[31m[dev:server][0m     file: 'parse_oper.c',
[31m[dev:server][0m     line: '647',
[31m[dev:server][0m     routine: 'op_error'
[31m[dev:server][0m   }
[31m[dev:server][0m }
[31m[dev:server][0m Error performing search: Error: Search failed: Failed query: select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."characteristics", "terms"."references", "terms"."view_count", "terms"."created_at", "terms"."updated_at", "categories"."id", "categories"."name", 
[31m[dev:server][0m           ts_rank(
[31m[dev:server][0m             to_tsvector('english', "terms"."name" || ' ' || COALESCE("terms"."short_definition", '')),
[31m[dev:server][0m             plainto_tsquery('english', $1)
[31m[dev:server][0m           ) + ("terms"."view_count" * 0.01)
[31m[dev:server][0m          as "relevance_score", "terms"."definition" from "terms" left join "categories" on "terms"."category_id" = "categories"."id" where to_tsvector('english', "terms"."name" || ' ' || COALESCE("terms"."short_definition", '')) @@ plainto_tsquery('english', $2) order by "relevance_score" desc, "terms"."view_count" desc limit $3
[31m[dev:server][0m params: neural,neural,21
[31m[dev:server][0m     at optimizedSearch (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedSearchService.ts:200:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/search.ts:54:32)
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/search {"duration":1255,"environment":"development","label":"GET /api/search","requestId":"a307eda7-8b73-43c2-aafb-2bf9b1667d84","responseSize":958,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:08","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/search 500 (1255ms) {"duration":1255,"environment":"development","method":"GET","path":"/api/search","requestId":"a307eda7-8b73-43c2-aafb-2bf9b1667d84","responseSize":958,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:08","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/search {"duration":1256,"environment":"development","label":"GET /api/search","requestId":"a307eda7-8b73-43c2-aafb-2bf9b1667d84","responseSize":958,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:08","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/search 500 (1256ms) {"duration":1256,"environment":"development","method":"GET","path":"/api/search","requestId":"a307eda7-8b73-43c2-aafb-2bf9b1667d84","responseSize":958,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:08","type":"api_response"}
[34m[dev:server][0m [33mwarn[39m: Slow request detected: GET /api/search {"duration":1255.809375,"environment":"development","requestId":"a307eda7-8b73-43c2-aafb-2bf9b1667d84","service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:08"}
[34m[dev:server][0m [32minfo[39m: GET /api/search 500 in 1255ms :: {"success":false,"message":"Search failed","er… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:08"}
[34m[dev:server][0m 📊 GET /api/search - 1255ms
[31m[dev:server][0m 🐌 Slow query detected: GET /api/search - 1255ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/search/advanced {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/search/advanced","queryParams":{"q":"deep"},"requestId":"0d4ccfc7-8af8-4ed0-bc5e-b1978ffe15db","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:08","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/search/advanced {"duration":1,"environment":"development","label":"GET /api/search/advanced","requestId":"0d4ccfc7-8af8-4ed0-bc5e-b1978ffe15db","responseSize":129,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/search/advanced 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/search/advanced","requestId":"0d4ccfc7-8af8-4ed0-bc5e-b1978ffe15db","responseSize":129,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/search/advanced {"duration":2,"environment":"development","label":"GET /api/search/advanced","requestId":"0d4ccfc7-8af8-4ed0-bc5e-b1978ffe15db","responseSize":129,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/search/advanced 404 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/search/advanced","requestId":"0d4ccfc7-8af8-4ed0-bc5e-b1978ffe15db","responseSize":129,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/search/advanced 404 in 1ms :: {"success":false,"message":"Route not fo… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:08"}
[34m[dev:server][0m 📊 GET /api/search/advanced - 1ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/search/advanced {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/search/advanced","queryParams":{"q":"deep"},"requestId":"3319a2cc-2d95-436a-b457-ddf8ba14aadd","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:08","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/search/advanced {"duration":2,"environment":"development","label":"GET /api/search/advanced","requestId":"3319a2cc-2d95-436a-b457-ddf8ba14aadd","responseSize":129,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/search/advanced 404 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/search/advanced","requestId":"3319a2cc-2d95-436a-b457-ddf8ba14aadd","responseSize":129,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/search/advanced {"duration":2,"environment":"development","label":"GET /api/search/advanced","requestId":"3319a2cc-2d95-436a-b457-ddf8ba14aadd","responseSize":129,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/search/advanced 404 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/search/advanced","requestId":"3319a2cc-2d95-436a-b457-ddf8ba14aadd","responseSize":129,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/search/advanced 404 in 1ms :: {"success":false,"message":"Route not fo… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:08"}
[34m[dev:server][0m 📊 GET /api/search/advanced - 1ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/adaptive-search {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/adaptive-search","queryParams":{"q":"AI models"},"requestId":"9788a0d0-201f-4826-9e55-b562559905c5","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:08","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/adaptive-search {"duration":1,"environment":"development","label":"GET /api/adaptive-search","requestId":"9788a0d0-201f-4826-9e55-b562559905c5","responseSize":107,"service":"ai-glossary-pro","statusCode":400,"timestamp":"2025-07-10 15:02:08","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/adaptive-search 400 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/adaptive-search","requestId":"9788a0d0-201f-4826-9e55-b562559905c5","responseSize":107,"service":"ai-glossary-pro","statusCode":400,"timestamp":"2025-07-10 15:02:08","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/adaptive-search {"duration":1,"environment":"development","label":"GET /api/adaptive-search","requestId":"9788a0d0-201f-4826-9e55-b562559905c5","responseSize":107,"service":"ai-glossary-pro","statusCode":400,"timestamp":"2025-07-10 15:02:08","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/adaptive-search 400 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/adaptive-search","requestId":"9788a0d0-201f-4826-9e55-b562559905c5","responseSize":107,"service":"ai-glossary-pro","statusCode":400,"timestamp":"2025-07-10 15:02:08","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/adaptive-search 400 in 1ms :: {"success":false,"error":"Search query i… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:08"}
[34m[dev:server][0m 📊 GET /api/adaptive-search - 1ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/adaptive-search {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/adaptive-search","queryParams":{"q":"AI models"},"requestId":"3899ae3f-c470-46db-8641-d2c1bf9aca9b","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:08","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/adaptive-search {"duration":1,"environment":"development","label":"GET /api/adaptive-search","requestId":"3899ae3f-c470-46db-8641-d2c1bf9aca9b","responseSize":107,"service":"ai-glossary-pro","statusCode":400,"timestamp":"2025-07-10 15:02:08","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/adaptive-search 400 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/adaptive-search","requestId":"3899ae3f-c470-46db-8641-d2c1bf9aca9b","responseSize":107,"service":"ai-glossary-pro","statusCode":400,"timestamp":"2025-07-10 15:02:08","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/adaptive-search {"duration":2,"environment":"development","label":"GET /api/adaptive-search","requestId":"3899ae3f-c470-46db-8641-d2c1bf9aca9b","responseSize":107,"service":"ai-glossary-pro","statusCode":400,"timestamp":"2025-07-10 15:02:08","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/adaptive-search 400 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/adaptive-search","requestId":"3899ae3f-c470-46db-8641-d2c1bf9aca9b","responseSize":107,"service":"ai-glossary-pro","statusCode":400,"timestamp":"2025-07-10 15:02:08","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/adaptive-search 400 in 1ms :: {"success":false,"error":"Search query i… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:08"}
[34m[dev:server][0m 📊 GET /api/adaptive-search - 1ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/personalization/recommendations {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/personalization/recommendations","requestId":"7d817fd6-c952-4980-a1f7-0c4c188bd63b","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:08","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/personalization/recommendations {"duration":2,"environment":"development","label":"GET /api/personalization/recommendations","requestId":"7d817fd6-c952-4980-a1f7-0c4c188bd63b","responseSize":145,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/personalization/recommendations 404 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/personalization/recommendations","requestId":"7d817fd6-c952-4980-a1f7-0c4c188bd63b","responseSize":145,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/personalization/recommendations {"duration":2,"environment":"development","label":"GET /api/personalization/recommendations","requestId":"7d817fd6-c952-4980-a1f7-0c4c188bd63b","responseSize":145,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/personalization/recommendations 404 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/personalization/recommendations","requestId":"7d817fd6-c952-4980-a1f7-0c4c188bd63b","responseSize":145,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/personalization/recommendations 404 in 2ms :: {"success":false,"messag… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:08"}
[34m[dev:server][0m 📊 GET /api/personalization/recommendations - 2ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/personalization/recommendations {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/personalization/recommendations","requestId":"50ebcdcd-3e44-4e88-ba57-63e0d0e2f3e7","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:08","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/personalization/recommendations {"duration":1,"environment":"development","label":"GET /api/personalization/recommendations","requestId":"50ebcdcd-3e44-4e88-ba57-63e0d0e2f3e7","responseSize":145,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/personalization/recommendations 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/personalization/recommendations","requestId":"50ebcdcd-3e44-4e88-ba57-63e0d0e2f3e7","responseSize":145,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/personalization/recommendations {"duration":2,"environment":"development","label":"GET /api/personalization/recommendations","requestId":"50ebcdcd-3e44-4e88-ba57-63e0d0e2f3e7","responseSize":145,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/personalization/recommendations 404 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/personalization/recommendations","requestId":"50ebcdcd-3e44-4e88-ba57-63e0d0e2f3e7","responseSize":145,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/personalization/recommendations 404 in 1ms :: {"success":false,"messag… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:08"}
[34m[dev:server][0m 📊 GET /api/personalization/recommendations - 1ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/personalization/learning-path {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/personalization/learning-path","requestId":"8c64dfcb-e1eb-466b-9bdb-f774405f8baa","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:08","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/personalization/learning-path {"duration":2,"environment":"development","label":"GET /api/personalization/learning-path","requestId":"8c64dfcb-e1eb-466b-9bdb-f774405f8baa","responseSize":143,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/personalization/learning-path 404 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/personalization/learning-path","requestId":"8c64dfcb-e1eb-466b-9bdb-f774405f8baa","responseSize":143,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/personalization/learning-path {"duration":2,"environment":"development","label":"GET /api/personalization/learning-path","requestId":"8c64dfcb-e1eb-466b-9bdb-f774405f8baa","responseSize":143,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/personalization/learning-path 404 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/personalization/learning-path","requestId":"8c64dfcb-e1eb-466b-9bdb-f774405f8baa","responseSize":143,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/personalization/learning-path 404 in 1ms :: {"success":false,"message"… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:08"}
[34m[dev:server][0m 📊 GET /api/personalization/learning-path - 1ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/personalization/learning-path {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/personalization/learning-path","requestId":"e285e749-99a5-403d-80fd-04d5efe5f8a1","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:08","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/personalization/learning-path {"duration":1,"environment":"development","label":"GET /api/personalization/learning-path","requestId":"e285e749-99a5-403d-80fd-04d5efe5f8a1","responseSize":143,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/personalization/learning-path 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/personalization/learning-path","requestId":"e285e749-99a5-403d-80fd-04d5efe5f8a1","responseSize":143,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/personalization/learning-path {"duration":1,"environment":"development","label":"GET /api/personalization/learning-path","requestId":"e285e749-99a5-403d-80fd-04d5efe5f8a1","responseSize":143,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/personalization/learning-path 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/personalization/learning-path","requestId":"e285e749-99a5-403d-80fd-04d5efe5f8a1","responseSize":143,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:08","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/personalization/learning-path 404 in 1ms :: {"success":false,"message"… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:08"}
[34m[dev:server][0m 📊 GET /api/personalization/learning-path - 1ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/analytics/popular-terms {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/analytics/popular-terms","requestId":"fe40a368-6022-4102-b1ef-8414bf4cc6af","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:08","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/auth/user {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/auth/user","referer":"http://localhost:5173/app","requestId":"330efef4-5ac9-4be7-a487-99be4118c33d","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:09","type":"api_request","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
[31m[dev:server][0m Get user error: ReferenceError: require is not defined
[31m[dev:server][0m     at <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/firebaseAuth.ts:398:19)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[31m[dev:server][0m     at next (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/route.js:149:13)
[31m[dev:server][0m     at Route.dispatch (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/route.js:119:3)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[31m[dev:server][0m     at /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:284:15
[31m[dev:server][0m     at Function.process_params (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:346:12)
[31m[dev:server][0m     at next (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:280:10)
[31m[dev:server][0m     at responseLoggingMiddleware (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/responseLogging.ts:41:3)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/auth/user {"duration":4,"environment":"development","label":"GET /api/auth/user","requestId":"330efef4-5ac9-4be7-a487-99be4118c33d","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:09","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/auth/user 401 (4ms) {"duration":4,"environment":"development","method":"GET","path":"/api/auth/user","requestId":"330efef4-5ac9-4be7-a487-99be4118c33d","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:09","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/auth/user {"duration":4,"environment":"development","label":"GET /api/auth/user","requestId":"330efef4-5ac9-4be7-a487-99be4118c33d","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:09","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/auth/user 401 (4ms) {"duration":4,"environment":"development","method":"GET","path":"/api/auth/user","requestId":"330efef4-5ac9-4be7-a487-99be4118c33d","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:09","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/auth/user 401 in 6ms :: {"success":false,"message":"Authentication req… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:09"}
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/auth/user {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/auth/user","referer":"http://localhost:5173/app","requestId":"53edbda4-9403-42e9-a404-8db3763af5c9","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:09","type":"api_request","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
[31m[dev:server][0m Get user error: ReferenceError: require is not defined
[31m[dev:server][0m     at <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/firebaseAuth.ts:398:19)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[31m[dev:server][0m     at next (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/route.js:149:13)
[31m[dev:server][0m     at Route.dispatch (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/route.js:119:3)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[31m[dev:server][0m     at /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:284:15
[31m[dev:server][0m     at Function.process_params (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:346:12)
[31m[dev:server][0m     at next (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:280:10)
[31m[dev:server][0m     at responseLoggingMiddleware (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/responseLogging.ts:41:3)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/auth/user {"duration":0,"environment":"development","label":"GET /api/auth/user","requestId":"53edbda4-9403-42e9-a404-8db3763af5c9","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:09","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/auth/user 401 (0ms) {"duration":0,"environment":"development","method":"GET","path":"/api/auth/user","requestId":"53edbda4-9403-42e9-a404-8db3763af5c9","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:09","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/auth/user {"duration":0,"environment":"development","label":"GET /api/auth/user","requestId":"53edbda4-9403-42e9-a404-8db3763af5c9","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:09","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/auth/user 401 (0ms) {"duration":0,"environment":"development","method":"GET","path":"/api/auth/user","requestId":"53edbda4-9403-42e9-a404-8db3763af5c9","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:09","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/auth/user 401 in 1ms :: {"success":false,"message":"Authentication req… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:09"}
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/terms/featured {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/terms/featured","referer":"http://localhost:5173/app","requestId":"e6f039a9-b369-4b14-b537-3a9eaecd85e0","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:09","type":"api_request","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/analytics/popular-terms {"duration":1544,"environment":"development","label":"GET /api/analytics/popular-terms","requestId":"fe40a368-6022-4102-b1ef-8414bf4cc6af","responseSize":97,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:10","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/analytics/popular-terms 200 (1544ms) {"duration":1544,"environment":"development","method":"GET","path":"/api/analytics/popular-terms","requestId":"fe40a368-6022-4102-b1ef-8414bf4cc6af","responseSize":97,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:10","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/analytics/popular-terms {"duration":1544,"environment":"development","label":"GET /api/analytics/popular-terms","requestId":"fe40a368-6022-4102-b1ef-8414bf4cc6af","responseSize":97,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:10","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/analytics/popular-terms 200 (1544ms) {"duration":1544,"environment":"development","method":"GET","path":"/api/analytics/popular-terms","requestId":"fe40a368-6022-4102-b1ef-8414bf4cc6af","responseSize":97,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:10","type":"api_response"}
[34m[dev:server][0m [33mwarn[39m: Slow request detected: GET /api/analytics/popular-terms {"duration":1544.838959,"environment":"development","requestId":"fe40a368-6022-4102-b1ef-8414bf4cc6af","service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:10"}
[34m[dev:server][0m [32minfo[39m: GET /api/analytics/popular-terms 200 in 1544ms :: {"success":true,"data":{"term… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:10"}
[34m[dev:server][0m 📊 GET /api/analytics/popular-terms - 1544ms
[31m[dev:server][0m 🐌 Slow query detected: GET /api/analytics/popular-terms - 1544ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/analytics/popular-terms {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/analytics/popular-terms","requestId":"0e2f82cd-f543-47de-b1c2-a8606ba1a29a","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:10","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/analytics/popular-terms {"duration":254,"environment":"development","label":"GET /api/analytics/popular-terms","requestId":"0e2f82cd-f543-47de-b1c2-a8606ba1a29a","responseSize":97,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:10","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/analytics/popular-terms 200 (254ms) {"duration":254,"environment":"development","method":"GET","path":"/api/analytics/popular-terms","requestId":"0e2f82cd-f543-47de-b1c2-a8606ba1a29a","responseSize":97,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:10","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/analytics/popular-terms {"duration":254,"environment":"development","label":"GET /api/analytics/popular-terms","requestId":"0e2f82cd-f543-47de-b1c2-a8606ba1a29a","responseSize":97,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:10","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/analytics/popular-terms 200 (254ms) {"duration":254,"environment":"development","method":"GET","path":"/api/analytics/popular-terms","requestId":"0e2f82cd-f543-47de-b1c2-a8606ba1a29a","responseSize":97,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:10","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/analytics/popular-terms 200 in 255ms :: {"success":true,"data":{"terms… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:10"}
[34m[dev:server][0m 📊 GET /api/analytics/popular-terms - 255ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/analytics/trending {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/analytics/trending","requestId":"db1b3135-42d6-4816-8cf8-aa53146ae4a6","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:10","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/analytics/trending {"duration":272,"environment":"development","label":"GET /api/analytics/trending","requestId":"db1b3135-42d6-4816-8cf8-aa53146ae4a6","responseSize":101,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:10","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/analytics/trending 200 (272ms) {"duration":272,"environment":"development","method":"GET","path":"/api/analytics/trending","requestId":"db1b3135-42d6-4816-8cf8-aa53146ae4a6","responseSize":101,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:10","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/analytics/trending {"duration":273,"environment":"development","label":"GET /api/analytics/trending","requestId":"db1b3135-42d6-4816-8cf8-aa53146ae4a6","responseSize":101,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:10","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/analytics/trending 200 (273ms) {"duration":273,"environment":"development","method":"GET","path":"/api/analytics/trending","requestId":"db1b3135-42d6-4816-8cf8-aa53146ae4a6","responseSize":101,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:10","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/analytics/trending 200 in 274ms :: {"success":true,"data":{"topics":[]… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:10"}
[34m[dev:server][0m 📊 GET /api/analytics/trending - 274ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/analytics/trending {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/analytics/trending","requestId":"aa06e241-681f-47f4-94b9-d86f554c8979","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:10","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:client][0m  ⚡ <Terms> now renders ~33% faster
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/analytics/trending {"duration":253,"environment":"development","label":"GET /api/analytics/trending","requestId":"aa06e241-681f-47f4-94b9-d86f554c8979","responseSize":101,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:11","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/analytics/trending 200 (253ms) {"duration":253,"environment":"development","method":"GET","path":"/api/analytics/trending","requestId":"aa06e241-681f-47f4-94b9-d86f554c8979","responseSize":101,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:11","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/analytics/trending {"duration":254,"environment":"development","label":"GET /api/analytics/trending","requestId":"aa06e241-681f-47f4-94b9-d86f554c8979","responseSize":101,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:11","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/analytics/trending 200 (254ms) {"duration":254,"environment":"development","method":"GET","path":"/api/analytics/trending","requestId":"aa06e241-681f-47f4-94b9-d86f554c8979","responseSize":101,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:11","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/analytics/trending 200 in 254ms :: {"success":true,"data":{"topics":[]… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:11"}
[34m[dev:server][0m 📊 GET /api/analytics/trending - 254ms
[34m[dev:client][0m  ⚡ <Categories> now renders ~15% faster
[34m[dev:server][0m [32minfo[39m: API Request: POST /api/feedback {"bodySize":76,"environment":"development","ip":"127.0.0.1","method":"POST","path":"/api/feedback","requestId":"d489d0f7-45e5-4f81-ba34-731d001afc72","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:11","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: POST /api/feedback {"duration":1,"environment":"development","label":"POST /api/feedback","requestId":"d489d0f7-45e5-4f81-ba34-731d001afc72","responseSize":123,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:11","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: POST /api/feedback 404 (1ms) {"duration":1,"environment":"development","method":"POST","path":"/api/feedback","requestId":"d489d0f7-45e5-4f81-ba34-731d001afc72","responseSize":123,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:11","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: POST /api/feedback {"duration":2,"environment":"development","label":"POST /api/feedback","requestId":"d489d0f7-45e5-4f81-ba34-731d001afc72","responseSize":123,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:11","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: POST /api/feedback 404 (2ms) {"duration":2,"environment":"development","method":"POST","path":"/api/feedback","requestId":"d489d0f7-45e5-4f81-ba34-731d001afc72","responseSize":123,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:11","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: POST /api/feedback 404 in 1ms :: {"success":false,"message":"Route not found","… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:11"}
[34m[dev:server][0m 📊 POST /api/feedback - 1ms
[34m[dev:server][0m [32minfo[39m: API Request: POST /api/feedback {"bodySize":76,"environment":"development","ip":"127.0.0.1","method":"POST","path":"/api/feedback","requestId":"6644dadd-4b89-4024-9079-d1f527536264","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:11","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: POST /api/feedback {"duration":1,"environment":"development","label":"POST /api/feedback","requestId":"6644dadd-4b89-4024-9079-d1f527536264","responseSize":123,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:11","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: POST /api/feedback 404 (1ms) {"duration":1,"environment":"development","method":"POST","path":"/api/feedback","requestId":"6644dadd-4b89-4024-9079-d1f527536264","responseSize":123,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:11","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: POST /api/feedback {"duration":1,"environment":"development","label":"POST /api/feedback","requestId":"6644dadd-4b89-4024-9079-d1f527536264","responseSize":123,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:11","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: POST /api/feedback 404 (1ms) {"duration":1,"environment":"development","method":"POST","path":"/api/feedback","requestId":"6644dadd-4b89-4024-9079-d1f527536264","responseSize":123,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:11","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: POST /api/feedback 404 in 1ms :: {"success":false,"message":"Route not found","… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:11"}
[34m[dev:server][0m 📊 POST /api/feedback - 1ms
[34m[dev:client][0m  ⚡ <EnhancedTermDetail> now renders ~19% faster
[34m[dev:server][0m [32minfo[39m: API Request: POST /api/newsletter/subscribe {"bodySize":59,"environment":"development","ip":"127.0.0.1","method":"POST","path":"/api/newsletter/subscribe","requestId":"28660c50-5639-4dd4-9379-3d5c84cb40b9","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:11","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:client][0m  ⚡ <SurpriseMe> now renders ~20% faster
[34m[dev:client][0m  ⚡ <AIDefinitionImprover> now renders ~44% faster
[34m[dev:client][0m  ⚡ <SectionLayoutManager> now renders ~17% faster
[34m[dev:client][0m  ⚡ <ProgressTracker> now renders ~27% faster
[31m[dev:server][0m [QueryCache] Query failed for key: popular:week DrizzleQueryError: Failed query: select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."view_count", "categories"."name", "categories"."id", "terms"."definition", ARRAY_AGG(DISTINCT "subcategories"."name") FILTER (WHERE "subcategories"."name" IS NOT NULL) from "terms" left join "categories" on "terms"."category_id" = "categories"."id" left join "term_subcategories" on "terms"."id" = "term_subcategories"."term_id" left join "subcategories" on "term_subcategories"."subcategory_id" = "subcategories"."id" group by "terms"."id", "categories"."id", "categories"."name" order by "terms"."view_count" desc limit $1
[31m[dev:server][0m params: 20
[31m[dev:server][0m     at NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:74:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m     ... 2 lines matching cause stack trace ...
[31m[dev:server][0m     at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/terms.ts:261:25) {
[31m[dev:server][0m   query: 'select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."view_count", "categories"."name", "categories"."id", "terms"."definition", ARRAY_AGG(DISTINCT "subcategories"."name") FILTER (WHERE "subcategories"."name" IS NOT NULL) from "terms" left join "categories" on "terms"."category_id" = "categories"."id" left join "term_subcategories" on "terms"."id" = "term_subcategories"."term_id" left join "subcategories" on "term_subcategories"."subcategory_id" = "subcategories"."id" group by "terms"."id", "categories"."id", "categories"."name" order by "terms"."view_count" desc limit $1',
[31m[dev:server][0m   params: [ 20 ],
[31m[dev:server][0m   cause: error: operator does not exist: uuid = integer
[31m[dev:server][0m       at file:///Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/@neondatabase/serverless/index.mjs:1345:74
[31m[dev:server][0m       at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:153:11)
[31m[dev:server][0m       at async NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:72:12)
[31m[dev:server][0m       at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedStorage.ts:267:25)
[31m[dev:server][0m       at async cached (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:235:20)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/terms.ts:261:25) {
[31m[dev:server][0m     length: 200,
[31m[dev:server][0m     severity: 'ERROR',
[31m[dev:server][0m     code: '42883',
[31m[dev:server][0m     detail: undefined,
[31m[dev:server][0m     hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
[31m[dev:server][0m     position: '304',
[31m[dev:server][0m     internalPosition: undefined,
[31m[dev:server][0m     internalQuery: undefined,
[31m[dev:server][0m     where: undefined,
[31m[dev:server][0m     schema: undefined,
[31m[dev:server][0m     table: undefined,
[31m[dev:server][0m     column: undefined,
[31m[dev:server][0m     dataType: undefined,
[31m[dev:server][0m     constraint: undefined,
[31m[dev:server][0m     file: 'parse_oper.c',
[31m[dev:server][0m     line: '647',
[31m[dev:server][0m     routine: 'op_error'
[31m[dev:server][0m   }
[31m[dev:server][0m }
[34m[dev:server][0m [33mwarn[39m: Featured terms query failed, returning empty result {"environment":"development","error":"Failed query: select \"terms\".\"id\", \"terms\".\"name\", \"terms\".\"short_definition\", \"terms\".\"view_count\", \"categories\".\"name\", \"categories\".\"id\", \"terms\".\"definition\", ARRAY_AGG(DISTINCT \"subcategories\".\"name\") FILTER (WHERE \"subcategories\".\"name\" IS NOT NULL) from \"terms\" left join \"categories\" on \"terms\".\"category_id\" = \"categories\".\"id\" left join \"term_subcategories\" on \"terms\".\"id\" = \"term_subcategories\".\"term_id\" left join \"subcategories\" on \"term_subcategories\".\"subcategory_id\" = \"subcategories\".\"id\" group by \"terms\".\"id\", \"categories\".\"id\", \"categories\".\"name\" order by \"terms\".\"view_count\" desc limit $1\nparams: 20","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:11"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms/featured {"duration":1610,"environment":"development","label":"GET /api/terms/featured","requestId":"e6f039a9-b369-4b14-b537-3a9eaecd85e0","responseSize":122,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:11","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms/featured 200 (1610ms) {"duration":1610,"environment":"development","method":"GET","path":"/api/terms/featured","requestId":"e6f039a9-b369-4b14-b537-3a9eaecd85e0","responseSize":122,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:11","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms/featured {"duration":1610,"environment":"development","label":"GET /api/terms/featured","requestId":"e6f039a9-b369-4b14-b537-3a9eaecd85e0","responseSize":122,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:11","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms/featured 200 (1610ms) {"duration":1610,"environment":"development","method":"GET","path":"/api/terms/featured","requestId":"e6f039a9-b369-4b14-b537-3a9eaecd85e0","responseSize":122,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:11","type":"api_response"}
[34m[dev:server][0m [33mwarn[39m: Slow request detected: GET /api/terms/featured {"duration":1610.519333,"environment":"development","requestId":"e6f039a9-b369-4b14-b537-3a9eaecd85e0","service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:11"}
[34m[dev:server][0m [32minfo[39m: GET /api/terms/featured 200 in 1611ms :: {"success":true,"data":[],"message":"N… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:11"}
[31m[dev:server][0m 🐌 Slow query detected: GET /api/terms/featured - 1611ms
[34m[dev:server][0m 📊 GET /api/terms/featured - 1611ms
[34m[dev:client][0m  ⚡ <RecommendedTerms> now renders ~43% faster
[34m[dev:client][0m  ⚡ <TermOverview> now renders ~25% faster
[34m[dev:client][0m  ⚡ <BreadcrumbEllipsis> now renders ~67% faster
[34m[dev:server][0m [32minfo[39m: New newsletter subscription: newsletter@example.com (en) {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13"}
[34m[dev:server][0m [32minfo[39m: Performance: POST /api/newsletter/subscribe {"duration":1902,"environment":"development","label":"POST /api/newsletter/subscribe","requestId":"28660c50-5639-4dd4-9379-3d5c84cb40b9","responseSize":71,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:13","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: POST /subscribe 200 (1902ms) {"duration":1902,"environment":"development","method":"POST","path":"/subscribe","requestId":"28660c50-5639-4dd4-9379-3d5c84cb40b9","responseSize":71,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:13","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: POST /api/newsletter/subscribe {"duration":1902,"environment":"development","label":"POST /api/newsletter/subscribe","requestId":"28660c50-5639-4dd4-9379-3d5c84cb40b9","responseSize":71,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:13","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: POST /subscribe 200 (1902ms) {"duration":1902,"environment":"development","method":"POST","path":"/subscribe","requestId":"28660c50-5639-4dd4-9379-3d5c84cb40b9","responseSize":71,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:13","type":"api_response"}
[34m[dev:server][0m [33mwarn[39m: Slow request detected: POST /subscribe {"duration":1902.213833,"environment":"development","requestId":"28660c50-5639-4dd4-9379-3d5c84cb40b9","service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:13"}
[34m[dev:server][0m [32minfo[39m: POST /api/newsletter/subscribe 200 in 1902ms :: {"success":true,"message":"Succ… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13"}
[31m[dev:server][0m 🐌 Slow query detected: POST /subscribe - 1903ms
[34m[dev:server][0m [32minfo[39m: API Request: POST /api/newsletter/subscribe {"bodySize":59,"environment":"development","ip":"127.0.0.1","method":"POST","path":"/api/newsletter/subscribe","requestId":"2f1fd3e9-12a6-4a1c-9be9-630cf66cc549","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: POST /api/newsletter/subscribe {"duration":269,"environment":"development","label":"POST /api/newsletter/subscribe","requestId":"2f1fd3e9-12a6-4a1c-9be9-630cf66cc549","responseSize":80,"service":"ai-glossary-pro","statusCode":400,"timestamp":"2025-07-10 15:02:13","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: POST /subscribe 400 (269ms) {"duration":269,"environment":"development","method":"POST","path":"/subscribe","requestId":"2f1fd3e9-12a6-4a1c-9be9-630cf66cc549","responseSize":80,"service":"ai-glossary-pro","statusCode":400,"timestamp":"2025-07-10 15:02:13","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: POST /api/newsletter/subscribe {"duration":269,"environment":"development","label":"POST /api/newsletter/subscribe","requestId":"2f1fd3e9-12a6-4a1c-9be9-630cf66cc549","responseSize":80,"service":"ai-glossary-pro","statusCode":400,"timestamp":"2025-07-10 15:02:13","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: POST /subscribe 400 (269ms) {"duration":269,"environment":"development","method":"POST","path":"/subscribe","requestId":"2f1fd3e9-12a6-4a1c-9be9-630cf66cc549","responseSize":80,"service":"ai-glossary-pro","statusCode":400,"timestamp":"2025-07-10 15:02:13","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: POST /api/newsletter/subscribe 400 in 270ms :: {"success":false,"message":"This… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13"}
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/cache/stats {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/cache/stats","requestId":"df3a459c-796b-4bbc-b05f-ac1d26fd1612","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/cache/stats {"duration":3,"environment":"development","label":"GET /api/cache/stats","requestId":"df3a459c-796b-4bbc-b05f-ac1d26fd1612","responseSize":125,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/cache/stats 404 (3ms) {"duration":3,"environment":"development","method":"GET","path":"/api/cache/stats","requestId":"df3a459c-796b-4bbc-b05f-ac1d26fd1612","responseSize":125,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/cache/stats {"duration":3,"environment":"development","label":"GET /api/cache/stats","requestId":"df3a459c-796b-4bbc-b05f-ac1d26fd1612","responseSize":125,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/cache/stats 404 (3ms) {"duration":3,"environment":"development","method":"GET","path":"/api/cache/stats","requestId":"df3a459c-796b-4bbc-b05f-ac1d26fd1612","responseSize":125,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/cache/stats 404 in 2ms :: {"success":false,"message":"Route not found"… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13"}
[34m[dev:server][0m 📊 GET /api/cache/stats - 2ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/cache/stats {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/cache/stats","requestId":"535fbc5d-412d-4b0b-a36e-ec216021962d","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/cache/stats {"duration":2,"environment":"development","label":"GET /api/cache/stats","requestId":"535fbc5d-412d-4b0b-a36e-ec216021962d","responseSize":125,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/cache/stats 404 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/cache/stats","requestId":"535fbc5d-412d-4b0b-a36e-ec216021962d","responseSize":125,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/cache/stats {"duration":2,"environment":"development","label":"GET /api/cache/stats","requestId":"535fbc5d-412d-4b0b-a36e-ec216021962d","responseSize":125,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/cache/stats 404 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/cache/stats","requestId":"535fbc5d-412d-4b0b-a36e-ec216021962d","responseSize":125,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/cache/stats 404 in 1ms :: {"success":false,"message":"Route not found"… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13"}
[34m[dev:server][0m 📊 GET /api/cache/stats - 2ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/cache-analytics {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/cache-analytics","requestId":"04accebb-a906-41c2-b0af-8e4a7151e5fd","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/cache-analytics {"duration":1,"environment":"development","label":"GET /api/cache-analytics","requestId":"04accebb-a906-41c2-b0af-8e4a7151e5fd","responseSize":129,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/cache-analytics 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/cache-analytics","requestId":"04accebb-a906-41c2-b0af-8e4a7151e5fd","responseSize":129,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/cache-analytics {"duration":1,"environment":"development","label":"GET /api/cache-analytics","requestId":"04accebb-a906-41c2-b0af-8e4a7151e5fd","responseSize":129,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/cache-analytics 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/cache-analytics","requestId":"04accebb-a906-41c2-b0af-8e4a7151e5fd","responseSize":129,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/cache-analytics 404 in 2ms :: {"success":false,"message":"Route not fo… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13"}
[34m[dev:server][0m 📊 GET /api/cache-analytics - 2ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/cache-analytics {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/cache-analytics","requestId":"05357741-1515-4737-8017-9943c0616a8a","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/cache-analytics {"duration":2,"environment":"development","label":"GET /api/cache-analytics","requestId":"05357741-1515-4737-8017-9943c0616a8a","responseSize":129,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/cache-analytics 404 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/cache-analytics","requestId":"05357741-1515-4737-8017-9943c0616a8a","responseSize":129,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/cache-analytics {"duration":2,"environment":"development","label":"GET /api/cache-analytics","requestId":"05357741-1515-4737-8017-9943c0616a8a","responseSize":129,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/cache-analytics 404 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/cache-analytics","requestId":"05357741-1515-4737-8017-9943c0616a8a","responseSize":129,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/cache-analytics 404 in 1ms :: {"success":false,"message":"Route not fo… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13"}
[34m[dev:server][0m 📊 GET /api/cache-analytics - 1ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/seo/sitemap {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/seo/sitemap","requestId":"98aec224-db29-4f03-b7e5-adb4c13b8654","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/seo/sitemap {"duration":2,"environment":"development","label":"GET /api/seo/sitemap","requestId":"98aec224-db29-4f03-b7e5-adb4c13b8654","responseSize":125,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/seo/sitemap 404 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/seo/sitemap","requestId":"98aec224-db29-4f03-b7e5-adb4c13b8654","responseSize":125,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/seo/sitemap {"duration":2,"environment":"development","label":"GET /api/seo/sitemap","requestId":"98aec224-db29-4f03-b7e5-adb4c13b8654","responseSize":125,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/seo/sitemap 404 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/seo/sitemap","requestId":"98aec224-db29-4f03-b7e5-adb4c13b8654","responseSize":125,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/seo/sitemap 404 in 1ms :: {"success":false,"message":"Route not found"… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13"}
[34m[dev:server][0m 📊 GET /api/seo/sitemap - 1ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/seo/sitemap {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/seo/sitemap","requestId":"3005f8b7-da12-47a0-ab9d-17c82ecfa317","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/seo/sitemap {"duration":1,"environment":"development","label":"GET /api/seo/sitemap","requestId":"3005f8b7-da12-47a0-ab9d-17c82ecfa317","responseSize":125,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/seo/sitemap 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/seo/sitemap","requestId":"3005f8b7-da12-47a0-ab9d-17c82ecfa317","responseSize":125,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/seo/sitemap {"duration":1,"environment":"development","label":"GET /api/seo/sitemap","requestId":"3005f8b7-da12-47a0-ab9d-17c82ecfa317","responseSize":125,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/seo/sitemap 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/seo/sitemap","requestId":"3005f8b7-da12-47a0-ab9d-17c82ecfa317","responseSize":125,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:13","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/seo/sitemap 404 in 1ms :: {"success":false,"message":"Route not found"… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13"}
[34m[dev:server][0m 📊 GET /api/seo/sitemap - 1ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/seo/meta/term/1 {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/seo/meta/term/1","requestId":"f378473b-8485-4986-9e7e-a7bb220859a3","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/auth/user {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/auth/user","referer":"http://localhost:5173/app","requestId":"0584021e-1588-4ff1-9aba-c17067a26cd9","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13","type":"api_request","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
[31m[dev:server][0m Get user error: ReferenceError: require is not defined
[31m[dev:server][0m     at <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/firebaseAuth.ts:398:19)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[31m[dev:server][0m     at next (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/route.js:149:13)
[31m[dev:server][0m     at Route.dispatch (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/route.js:119:3)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[31m[dev:server][0m     at /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:284:15
[31m[dev:server][0m     at Function.process_params (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:346:12)
[31m[dev:server][0m     at next (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:280:10)
[31m[dev:server][0m     at responseLoggingMiddleware (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/responseLogging.ts:41:3)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/auth/user {"duration":2,"environment":"development","label":"GET /api/auth/user","requestId":"0584021e-1588-4ff1-9aba-c17067a26cd9","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:13","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/auth/user 401 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/auth/user","requestId":"0584021e-1588-4ff1-9aba-c17067a26cd9","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:13","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/auth/user {"duration":2,"environment":"development","label":"GET /api/auth/user","requestId":"0584021e-1588-4ff1-9aba-c17067a26cd9","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:13","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/auth/user 401 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/auth/user","requestId":"0584021e-1588-4ff1-9aba-c17067a26cd9","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:13","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/auth/user 401 in 1ms :: {"success":false,"message":"Authentication req… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13"}
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/auth/user {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/auth/user","referer":"http://localhost:5173/app","requestId":"efa4998b-c2c0-4842-9d1a-045e84ad86f8","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13","type":"api_request","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
[31m[dev:server][0m Get user error: ReferenceError: require is not defined
[31m[dev:server][0m     at <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/firebaseAuth.ts:398:19)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[31m[dev:server][0m     at next (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/route.js:149:13)
[31m[dev:server][0m     at Route.dispatch (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/route.js:119:3)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[31m[dev:server][0m     at /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:284:15
[31m[dev:server][0m     at Function.process_params (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:346:12)
[31m[dev:server][0m     at next (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:280:10)
[31m[dev:server][0m     at responseLoggingMiddleware (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/responseLogging.ts:41:3)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/auth/user {"duration":1,"environment":"development","label":"GET /api/auth/user","requestId":"efa4998b-c2c0-4842-9d1a-045e84ad86f8","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:13","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/auth/user 401 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/auth/user","requestId":"efa4998b-c2c0-4842-9d1a-045e84ad86f8","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:13","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/auth/user {"duration":2,"environment":"development","label":"GET /api/auth/user","requestId":"efa4998b-c2c0-4842-9d1a-045e84ad86f8","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:13","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/auth/user 401 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/auth/user","requestId":"efa4998b-c2c0-4842-9d1a-045e84ad86f8","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:13","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/auth/user 401 in 1ms :: {"success":false,"message":"Authentication req… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13"}
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/terms/featured {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/terms/featured","referer":"http://localhost:5173/app","requestId":"95183d70-7e8f-4611-b78d-e8d50c3b664d","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13","type":"api_request","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
[34m[dev:server][0m [31merror[39m: SEO meta generation error: {"environment":"development","error":"Failed query: select \"terms\".\"id\", \"terms\".\"name\", \"terms\".\"definition\", \"terms\".\"short_definition\", \"terms\".\"characteristics\", \"terms\".\"visual_url\", \"terms\".\"category_id\", \"categories\".\"name\", \"terms\".\"updated_at\" from \"terms\" left join \"categories\" on \"terms\".\"category_id\" = \"categories\".\"id\" where \"terms\".\"id\" = $1 limit $2\nparams: 1,1","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/seo/meta/term/1 {"duration":270,"environment":"development","label":"GET /api/seo/meta/term/1","requestId":"f378473b-8485-4986-9e7e-a7bb220859a3","responseSize":59,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:13","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /meta/term/1 500 (270ms) {"duration":270,"environment":"development","method":"GET","path":"/meta/term/1","requestId":"f378473b-8485-4986-9e7e-a7bb220859a3","responseSize":59,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:13","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/seo/meta/term/1 {"duration":271,"environment":"development","label":"GET /api/seo/meta/term/1","requestId":"f378473b-8485-4986-9e7e-a7bb220859a3","responseSize":59,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:13","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /meta/term/1 500 (271ms) {"duration":271,"environment":"development","method":"GET","path":"/meta/term/1","requestId":"f378473b-8485-4986-9e7e-a7bb220859a3","responseSize":59,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:13","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/seo/meta/term/1 500 in 271ms :: {"success":false,"error":"Failed to ge… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13"}
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/seo/meta/term/1 {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/seo/meta/term/1","requestId":"9499e805-b0ad-44d5-b4e7-e2496a7f514d","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:13","type":"api_request","userAgent":"curl/8.7.1"}
[31m[dev:server][0m [QueryCache] Query failed for key: popular:week DrizzleQueryError: Failed query: select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."view_count", "categories"."name", "categories"."id", "terms"."definition", ARRAY_AGG(DISTINCT "subcategories"."name") FILTER (WHERE "subcategories"."name" IS NOT NULL) from "terms" left join "categories" on "terms"."category_id" = "categories"."id" left join "term_subcategories" on "terms"."id" = "term_subcategories"."term_id" left join "subcategories" on "term_subcategories"."subcategory_id" = "subcategories"."id" group by "terms"."id", "categories"."id", "categories"."name" order by "terms"."view_count" desc limit $1
[31m[dev:server][0m params: 20
[31m[dev:server][0m     at NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:74:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m     ... 2 lines matching cause stack trace ...
[31m[dev:server][0m     at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/terms.ts:261:25) {
[31m[dev:server][0m   query: 'select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."view_count", "categories"."name", "categories"."id", "terms"."definition", ARRAY_AGG(DISTINCT "subcategories"."name") FILTER (WHERE "subcategories"."name" IS NOT NULL) from "terms" left join "categories" on "terms"."category_id" = "categories"."id" left join "term_subcategories" on "terms"."id" = "term_subcategories"."term_id" left join "subcategories" on "term_subcategories"."subcategory_id" = "subcategories"."id" group by "terms"."id", "categories"."id", "categories"."name" order by "terms"."view_count" desc limit $1',
[31m[dev:server][0m   params: [ 20 ],
[31m[dev:server][0m   cause: error: operator does not exist: uuid = integer
[31m[dev:server][0m       at file:///Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/@neondatabase/serverless/index.mjs:1345:74
[31m[dev:server][0m       at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:153:11)
[31m[dev:server][0m       at async NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:72:12)
[31m[dev:server][0m       at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedStorage.ts:267:25)
[31m[dev:server][0m       at async cached (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:235:20)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/terms.ts:261:25) {
[31m[dev:server][0m     length: 200,
[31m[dev:server][0m     severity: 'ERROR',
[31m[dev:server][0m     code: '42883',
[31m[dev:server][0m     detail: undefined,
[31m[dev:server][0m     hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
[31m[dev:server][0m     position: '304',
[31m[dev:server][0m     internalPosition: undefined,
[31m[dev:server][0m     internalQuery: undefined,
[31m[dev:server][0m     where: undefined,
[31m[dev:server][0m     schema: undefined,
[31m[dev:server][0m     table: undefined,
[31m[dev:server][0m     column: undefined,
[31m[dev:server][0m     dataType: undefined,
[31m[dev:server][0m     constraint: undefined,
[31m[dev:server][0m     file: 'parse_oper.c',
[31m[dev:server][0m     line: '647',
[31m[dev:server][0m     routine: 'op_error'
[31m[dev:server][0m   }
[31m[dev:server][0m }
[34m[dev:server][0m [33mwarn[39m: Featured terms query failed, returning empty result {"environment":"development","error":"Failed query: select \"terms\".\"id\", \"terms\".\"name\", \"terms\".\"short_definition\", \"terms\".\"view_count\", \"categories\".\"name\", \"categories\".\"id\", \"terms\".\"definition\", ARRAY_AGG(DISTINCT \"subcategories\".\"name\") FILTER (WHERE \"subcategories\".\"name\" IS NOT NULL) from \"terms\" left join \"categories\" on \"terms\".\"category_id\" = \"categories\".\"id\" left join \"term_subcategories\" on \"terms\".\"id\" = \"term_subcategories\".\"term_id\" left join \"subcategories\" on \"term_subcategories\".\"subcategory_id\" = \"subcategories\".\"id\" group by \"terms\".\"id\", \"categories\".\"id\", \"categories\".\"name\" order by \"terms\".\"view_count\" desc limit $1\nparams: 20","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:15"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms/featured {"duration":1561,"environment":"development","label":"GET /api/terms/featured","requestId":"95183d70-7e8f-4611-b78d-e8d50c3b664d","responseSize":122,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:15","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms/featured 200 (1561ms) {"duration":1561,"environment":"development","method":"GET","path":"/api/terms/featured","requestId":"95183d70-7e8f-4611-b78d-e8d50c3b664d","responseSize":122,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:15","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms/featured {"duration":1561,"environment":"development","label":"GET /api/terms/featured","requestId":"95183d70-7e8f-4611-b78d-e8d50c3b664d","responseSize":122,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:15","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms/featured 200 (1561ms) {"duration":1561,"environment":"development","method":"GET","path":"/api/terms/featured","requestId":"95183d70-7e8f-4611-b78d-e8d50c3b664d","responseSize":122,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:15","type":"api_response"}
[34m[dev:server][0m [33mwarn[39m: Slow request detected: GET /api/terms/featured {"duration":1561.398125,"environment":"development","requestId":"95183d70-7e8f-4611-b78d-e8d50c3b664d","service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:15"}
[34m[dev:server][0m [32minfo[39m: GET /api/terms/featured 200 in 1561ms :: {"success":true,"data":[],"message":"N… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:15"}
[34m[dev:server][0m 📊 GET /api/terms/featured - 1561ms
[31m[dev:server][0m 🐌 Slow query detected: GET /api/terms/featured - 1561ms
[34m[dev:server][0m [31merror[39m: SEO meta generation error: {"environment":"development","error":"Failed query: select \"terms\".\"id\", \"terms\".\"name\", \"terms\".\"definition\", \"terms\".\"short_definition\", \"terms\".\"characteristics\", \"terms\".\"visual_url\", \"terms\".\"category_id\", \"categories\".\"name\", \"terms\".\"updated_at\" from \"terms\" left join \"categories\" on \"terms\".\"category_id\" = \"categories\".\"id\" where \"terms\".\"id\" = $1 limit $2\nparams: 1,1","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:15"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/seo/meta/term/1 {"duration":1600,"environment":"development","label":"GET /api/seo/meta/term/1","requestId":"9499e805-b0ad-44d5-b4e7-e2496a7f514d","responseSize":59,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:15","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /meta/term/1 500 (1600ms) {"duration":1600,"environment":"development","method":"GET","path":"/meta/term/1","requestId":"9499e805-b0ad-44d5-b4e7-e2496a7f514d","responseSize":59,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:15","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/seo/meta/term/1 {"duration":1601,"environment":"development","label":"GET /api/seo/meta/term/1","requestId":"9499e805-b0ad-44d5-b4e7-e2496a7f514d","responseSize":59,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:15","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /meta/term/1 500 (1601ms) {"duration":1601,"environment":"development","method":"GET","path":"/meta/term/1","requestId":"9499e805-b0ad-44d5-b4e7-e2496a7f514d","responseSize":59,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:15","type":"api_response"}
[34m[dev:server][0m [33mwarn[39m: Slow request detected: GET /meta/term/1 {"duration":1600.810417,"environment":"development","requestId":"9499e805-b0ad-44d5-b4e7-e2496a7f514d","service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:15"}
[34m[dev:server][0m [32minfo[39m: GET /api/seo/meta/term/1 500 in 1600ms :: {"success":false,"error":"Failed to g… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:15"}
[31m[dev:server][0m 🐌 Slow query detected: GET /meta/term/1 - 1600ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/content/export {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/content/export","queryParams":{"format":"json"},"requestId":"5deeaba2-742a-426c-aceb-0e6d43a251e3","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:15","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/content/export {"duration":1,"environment":"development","label":"GET /api/content/export","requestId":"5deeaba2-742a-426c-aceb-0e6d43a251e3","responseSize":128,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:15","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/content/export 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/content/export","requestId":"5deeaba2-742a-426c-aceb-0e6d43a251e3","responseSize":128,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:15","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/content/export {"duration":1,"environment":"development","label":"GET /api/content/export","requestId":"5deeaba2-742a-426c-aceb-0e6d43a251e3","responseSize":128,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:15","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/content/export 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/content/export","requestId":"5deeaba2-742a-426c-aceb-0e6d43a251e3","responseSize":128,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:15","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/content/export 404 in 2ms :: {"success":false,"message":"Route not fou… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:15"}
[34m[dev:server][0m 📊 GET /api/content/export - 2ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/content/export {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/content/export","queryParams":{"format":"json"},"requestId":"93b3189e-ac1c-45e9-a115-b311cf7e422a","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:15","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/content/export {"duration":2,"environment":"development","label":"GET /api/content/export","requestId":"93b3189e-ac1c-45e9-a115-b311cf7e422a","responseSize":128,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:15","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/content/export 404 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/content/export","requestId":"93b3189e-ac1c-45e9-a115-b311cf7e422a","responseSize":128,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:15","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/content/export {"duration":2,"environment":"development","label":"GET /api/content/export","requestId":"93b3189e-ac1c-45e9-a115-b311cf7e422a","responseSize":128,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:15","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/content/export 404 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/content/export","requestId":"93b3189e-ac1c-45e9-a115-b311cf7e422a","responseSize":128,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:15","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/content/export 404 in 1ms :: {"success":false,"message":"Route not fou… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:15"}
[34m[dev:server][0m 📊 GET /api/content/export - 1ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/content/stats {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/content/stats","requestId":"35e68ec2-94bd-42e3-842d-4e8ce769f2e8","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:15","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/content/stats {"duration":1,"environment":"development","label":"GET /api/content/stats","requestId":"35e68ec2-94bd-42e3-842d-4e8ce769f2e8","responseSize":127,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:15","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/content/stats 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/content/stats","requestId":"35e68ec2-94bd-42e3-842d-4e8ce769f2e8","responseSize":127,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:15","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/content/stats {"duration":2,"environment":"development","label":"GET /api/content/stats","requestId":"35e68ec2-94bd-42e3-842d-4e8ce769f2e8","responseSize":127,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:15","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/content/stats 404 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/content/stats","requestId":"35e68ec2-94bd-42e3-842d-4e8ce769f2e8","responseSize":127,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:15","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/content/stats 404 in 1ms :: {"success":false,"message":"Route not foun… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:15"}
[34m[dev:server][0m 📊 GET /api/content/stats - 1ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/content/stats {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/content/stats","requestId":"d59d67ca-4c24-46e0-9b77-92931e52e30b","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:15","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/content/stats {"duration":1,"environment":"development","label":"GET /api/content/stats","requestId":"d59d67ca-4c24-46e0-9b77-92931e52e30b","responseSize":127,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:15","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/content/stats 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/content/stats","requestId":"d59d67ca-4c24-46e0-9b77-92931e52e30b","responseSize":127,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:15","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/content/stats {"duration":1,"environment":"development","label":"GET /api/content/stats","requestId":"d59d67ca-4c24-46e0-9b77-92931e52e30b","responseSize":127,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:15","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/content/stats 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/content/stats","requestId":"d59d67ca-4c24-46e0-9b77-92931e52e30b","responseSize":127,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:15","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/content/stats 404 in 0ms :: {"success":false,"message":"Route not foun… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:15"}
[34m[dev:server][0m 📊 GET /api/content/stats - 0ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/learning-paths {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/learning-paths","requestId":"1108af7c-d410-4231-8242-7b8905f8e959","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:15","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/learning-paths {"duration":1798,"environment":"development","label":"GET /api/learning-paths","requestId":"1108af7c-d410-4231-8242-7b8905f8e959","responseSize":3160,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:17","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/learning-paths 200 (1798ms) {"duration":1798,"environment":"development","method":"GET","path":"/api/learning-paths","requestId":"1108af7c-d410-4231-8242-7b8905f8e959","responseSize":3160,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:17","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/learning-paths {"duration":1798,"environment":"development","label":"GET /api/learning-paths","requestId":"1108af7c-d410-4231-8242-7b8905f8e959","responseSize":3160,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:17","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/learning-paths 200 (1798ms) {"duration":1798,"environment":"development","method":"GET","path":"/api/learning-paths","requestId":"1108af7c-d410-4231-8242-7b8905f8e959","responseSize":3160,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:17","type":"api_response"}
[34m[dev:server][0m [33mwarn[39m: Slow request detected: GET /api/learning-paths {"duration":1799.137458,"environment":"development","requestId":"1108af7c-d410-4231-8242-7b8905f8e959","service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:17"}
[34m[dev:server][0m [32minfo[39m: GET /api/learning-paths 200 in 1800ms :: {"success":true,"data":[{"id":"57e51c1… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:17"}
[31m[dev:server][0m 🐌 Slow query detected: GET /api/learning-paths - 1800ms
[34m[dev:server][0m 📊 GET /api/learning-paths - 1800ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/learning-paths {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/learning-paths","requestId":"3d5f3fbb-55c7-4bc9-a5f7-f0d648da77f0","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:17","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/auth/user {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/auth/user","referer":"http://localhost:5173/app","requestId":"3f477e79-fec4-4b6b-a48d-0d3dd2521d7b","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:17","type":"api_request","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
[31m[dev:server][0m Get user error: ReferenceError: require is not defined
[31m[dev:server][0m     at <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/firebaseAuth.ts:398:19)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[31m[dev:server][0m     at next (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/route.js:149:13)
[31m[dev:server][0m     at Route.dispatch (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/route.js:119:3)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[31m[dev:server][0m     at /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:284:15
[31m[dev:server][0m     at Function.process_params (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:346:12)
[31m[dev:server][0m     at next (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:280:10)
[31m[dev:server][0m     at responseLoggingMiddleware (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/responseLogging.ts:41:3)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/auth/user {"duration":1,"environment":"development","label":"GET /api/auth/user","requestId":"3f477e79-fec4-4b6b-a48d-0d3dd2521d7b","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:17","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/auth/user 401 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/auth/user","requestId":"3f477e79-fec4-4b6b-a48d-0d3dd2521d7b","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:17","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/auth/user {"duration":1,"environment":"development","label":"GET /api/auth/user","requestId":"3f477e79-fec4-4b6b-a48d-0d3dd2521d7b","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:17","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/auth/user 401 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/auth/user","requestId":"3f477e79-fec4-4b6b-a48d-0d3dd2521d7b","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:17","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/auth/user 401 in 6ms :: {"success":false,"message":"Authentication req… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:17"}
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/auth/user {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/auth/user","referer":"http://localhost:5173/app","requestId":"577e0048-f021-4b75-a360-253b63d26c3e","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:17","type":"api_request","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
[31m[dev:server][0m Get user error: ReferenceError: require is not defined
[31m[dev:server][0m     at <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/firebaseAuth.ts:398:19)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[31m[dev:server][0m     at next (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/route.js:149:13)
[31m[dev:server][0m     at Route.dispatch (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/route.js:119:3)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[31m[dev:server][0m     at /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:284:15
[31m[dev:server][0m     at Function.process_params (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:346:12)
[31m[dev:server][0m     at next (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:280:10)
[31m[dev:server][0m     at responseLoggingMiddleware (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/responseLogging.ts:41:3)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/auth/user {"duration":2,"environment":"development","label":"GET /api/auth/user","requestId":"577e0048-f021-4b75-a360-253b63d26c3e","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:17","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/auth/user 401 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/auth/user","requestId":"577e0048-f021-4b75-a360-253b63d26c3e","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:17","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/auth/user {"duration":2,"environment":"development","label":"GET /api/auth/user","requestId":"577e0048-f021-4b75-a360-253b63d26c3e","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:17","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/auth/user 401 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/auth/user","requestId":"577e0048-f021-4b75-a360-253b63d26c3e","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:17","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/auth/user 401 in 1ms :: {"success":false,"message":"Authentication req… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:17"}
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/terms/featured {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/terms/featured","referer":"http://localhost:5173/app","requestId":"c849e8b8-38b3-4c53-b968-dc65c4c0bbdd","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:17","type":"api_request","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/learning-paths {"duration":509,"environment":"development","label":"GET /api/learning-paths","requestId":"3d5f3fbb-55c7-4bc9-a5f7-f0d648da77f0","responseSize":3160,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:17","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/learning-paths 200 (509ms) {"duration":509,"environment":"development","method":"GET","path":"/api/learning-paths","requestId":"3d5f3fbb-55c7-4bc9-a5f7-f0d648da77f0","responseSize":3160,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:17","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/learning-paths {"duration":511,"environment":"development","label":"GET /api/learning-paths","requestId":"3d5f3fbb-55c7-4bc9-a5f7-f0d648da77f0","responseSize":3160,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:17","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/learning-paths 200 (511ms) {"duration":511,"environment":"development","method":"GET","path":"/api/learning-paths","requestId":"3d5f3fbb-55c7-4bc9-a5f7-f0d648da77f0","responseSize":3160,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:17","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/learning-paths 200 in 511ms :: {"success":true,"data":[{"id":"57e51c17… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:17"}
[34m[dev:server][0m 📊 GET /api/learning-paths - 511ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/learning-paths/beginner {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/learning-paths/beginner","requestId":"65a00aa2-9ce7-4c19-b633-78c7c08ee15c","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:17","type":"api_request","userAgent":"curl/8.7.1"}
[31m[dev:server][0m Get learning path error: DrizzleQueryError: Failed query: select "id", "name", "description", "difficulty_level", "estimated_duration", "category_id", "prerequisites", "learning_objectives", "created_by", "is_official", "is_published", "view_count", "completion_count", "rating", "created_at", "updated_at" from "learning_paths" where "learning_paths"."id" = $1 limit $2
[31m[dev:server][0m params: beginner,1
[31m[dev:server][0m     at NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:74:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m     at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/learningPaths.ts:129:20) {
[31m[dev:server][0m   query: 'select "id", "name", "description", "difficulty_level", "estimated_duration", "category_id", "prerequisites", "learning_objectives", "created_by", "is_official", "is_published", "view_count", "completion_count", "rating", "created_at", "updated_at" from "learning_paths" where "learning_paths"."id" = $1 limit $2',
[31m[dev:server][0m   params: [ 'beginner', 1 ],
[31m[dev:server][0m   cause: error: invalid input syntax for type uuid: "beginner"
[31m[dev:server][0m       at file:///Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/@neondatabase/serverless/index.mjs:1345:74
[31m[dev:server][0m       at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:153:11)
[31m[dev:server][0m       at async NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:72:12)
[31m[dev:server][0m       at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/learningPaths.ts:129:20) {
[31m[dev:server][0m     length: 140,
[31m[dev:server][0m     severity: 'ERROR',
[31m[dev:server][0m     code: '22P02',
[31m[dev:server][0m     detail: undefined,
[31m[dev:server][0m     hint: undefined,
[31m[dev:server][0m     position: undefined,
[31m[dev:server][0m     internalPosition: undefined,
[31m[dev:server][0m     internalQuery: undefined,
[31m[dev:server][0m     where: "unnamed portal parameter $1 = '...'",
[31m[dev:server][0m     schema: undefined,
[31m[dev:server][0m     table: undefined,
[31m[dev:server][0m     column: undefined,
[31m[dev:server][0m     dataType: undefined,
[31m[dev:server][0m     constraint: undefined,
[31m[dev:server][0m     file: 'uuid.c',
[31m[dev:server][0m     line: '133',
[31m[dev:server][0m     routine: 'string_to_uuid'
[31m[dev:server][0m   }
[31m[dev:server][0m }
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/learning-paths/beginner {"duration":255,"environment":"development","label":"GET /api/learning-paths/beginner","requestId":"65a00aa2-9ce7-4c19-b633-78c7c08ee15c","responseSize":516,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:18","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/learning-paths/beginner 500 (255ms) {"duration":255,"environment":"development","method":"GET","path":"/api/learning-paths/beginner","requestId":"65a00aa2-9ce7-4c19-b633-78c7c08ee15c","responseSize":516,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:18","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/learning-paths/beginner {"duration":255,"environment":"development","label":"GET /api/learning-paths/beginner","requestId":"65a00aa2-9ce7-4c19-b633-78c7c08ee15c","responseSize":516,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:18","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/learning-paths/beginner 500 (255ms) {"duration":255,"environment":"development","method":"GET","path":"/api/learning-paths/beginner","requestId":"65a00aa2-9ce7-4c19-b633-78c7c08ee15c","responseSize":516,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:18","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/learning-paths/beginner 500 in 255ms :: {"success":false,"error":"DATA… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:18"}
[34m[dev:server][0m 📊 GET /api/learning-paths/beginner - 255ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/learning-paths/beginner {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/learning-paths/beginner","requestId":"a80f0c9b-8c94-44b8-a534-c5c91d250171","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:18","type":"api_request","userAgent":"curl/8.7.1"}
[31m[dev:server][0m Get learning path error: DrizzleQueryError: Failed query: select "id", "name", "description", "difficulty_level", "estimated_duration", "category_id", "prerequisites", "learning_objectives", "created_by", "is_official", "is_published", "view_count", "completion_count", "rating", "created_at", "updated_at" from "learning_paths" where "learning_paths"."id" = $1 limit $2
[31m[dev:server][0m params: beginner,1
[31m[dev:server][0m     at NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:74:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m     at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/learningPaths.ts:129:20) {
[31m[dev:server][0m   query: 'select "id", "name", "description", "difficulty_level", "estimated_duration", "category_id", "prerequisites", "learning_objectives", "created_by", "is_official", "is_published", "view_count", "completion_count", "rating", "created_at", "updated_at" from "learning_paths" where "learning_paths"."id" = $1 limit $2',
[31m[dev:server][0m   params: [ 'beginner', 1 ],
[31m[dev:server][0m   cause: error: invalid input syntax for type uuid: "beginner"
[31m[dev:server][0m       at file:///Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/@neondatabase/serverless/index.mjs:1345:74
[31m[dev:server][0m       at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:153:11)
[31m[dev:server][0m       at async NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:72:12)
[31m[dev:server][0m       at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/learningPaths.ts:129:20) {
[31m[dev:server][0m     length: 140,
[31m[dev:server][0m     severity: 'ERROR',
[31m[dev:server][0m     code: '22P02',
[31m[dev:server][0m     detail: undefined,
[31m[dev:server][0m     hint: undefined,
[31m[dev:server][0m     position: undefined,
[31m[dev:server][0m     internalPosition: undefined,
[31m[dev:server][0m     internalQuery: undefined,
[31m[dev:server][0m     where: "unnamed portal parameter $1 = '...'",
[31m[dev:server][0m     schema: undefined,
[31m[dev:server][0m     table: undefined,
[31m[dev:server][0m     column: undefined,
[31m[dev:server][0m     dataType: undefined,
[31m[dev:server][0m     constraint: undefined,
[31m[dev:server][0m     file: 'uuid.c',
[31m[dev:server][0m     line: '133',
[31m[dev:server][0m     routine: 'string_to_uuid'
[31m[dev:server][0m   }
[31m[dev:server][0m }
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/learning-paths/beginner {"duration":991,"environment":"development","label":"GET /api/learning-paths/beginner","requestId":"a80f0c9b-8c94-44b8-a534-c5c91d250171","responseSize":516,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/learning-paths/beginner 500 (991ms) {"duration":991,"environment":"development","method":"GET","path":"/api/learning-paths/beginner","requestId":"a80f0c9b-8c94-44b8-a534-c5c91d250171","responseSize":516,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/learning-paths/beginner {"duration":992,"environment":"development","label":"GET /api/learning-paths/beginner","requestId":"a80f0c9b-8c94-44b8-a534-c5c91d250171","responseSize":516,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/learning-paths/beginner 500 (992ms) {"duration":992,"environment":"development","method":"GET","path":"/api/learning-paths/beginner","requestId":"a80f0c9b-8c94-44b8-a534-c5c91d250171","responseSize":516,"service":"ai-glossary-pro","statusCode":500,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/learning-paths/beginner 500 in 993ms :: {"success":false,"error":"DATA… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19"}
[34m[dev:server][0m 📊 GET /api/learning-paths/beginner - 993ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/code-examples/term/1 {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/code-examples/term/1","requestId":"a8265cf9-b6c8-47fd-9e12-6ee88dc3000f","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/code-examples/term/1 {"duration":2,"environment":"development","label":"GET /api/code-examples/term/1","requestId":"a8265cf9-b6c8-47fd-9e12-6ee88dc3000f","responseSize":134,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/code-examples/term/1 404 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/code-examples/term/1","requestId":"a8265cf9-b6c8-47fd-9e12-6ee88dc3000f","responseSize":134,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/code-examples/term/1 {"duration":2,"environment":"development","label":"GET /api/code-examples/term/1","requestId":"a8265cf9-b6c8-47fd-9e12-6ee88dc3000f","responseSize":134,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/code-examples/term/1 404 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/code-examples/term/1","requestId":"a8265cf9-b6c8-47fd-9e12-6ee88dc3000f","responseSize":134,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/code-examples/term/1 404 in 1ms :: {"success":false,"message":"Route n… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19"}
[34m[dev:server][0m 📊 GET /api/code-examples/term/1 - 1ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/code-examples/term/1 {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/code-examples/term/1","requestId":"1060caf4-d513-4a6d-915c-1104c771c821","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/code-examples/term/1 {"duration":0,"environment":"development","label":"GET /api/code-examples/term/1","requestId":"1060caf4-d513-4a6d-915c-1104c771c821","responseSize":134,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/code-examples/term/1 404 (0ms) {"duration":0,"environment":"development","method":"GET","path":"/api/code-examples/term/1","requestId":"1060caf4-d513-4a6d-915c-1104c771c821","responseSize":134,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/code-examples/term/1 {"duration":1,"environment":"development","label":"GET /api/code-examples/term/1","requestId":"1060caf4-d513-4a6d-915c-1104c771c821","responseSize":134,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/code-examples/term/1 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/code-examples/term/1","requestId":"1060caf4-d513-4a6d-915c-1104c771c821","responseSize":134,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/code-examples/term/1 404 in 1ms :: {"success":false,"message":"Route n… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19"}
[34m[dev:server][0m 📊 GET /api/code-examples/term/1 - 1ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/relationships/term/1 {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/relationships/term/1","requestId":"c3474e06-f404-4210-b528-85fa8e40eab1","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/relationships/term/1 {"duration":1,"environment":"development","label":"GET /api/relationships/term/1","requestId":"c3474e06-f404-4210-b528-85fa8e40eab1","responseSize":134,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/relationships/term/1 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/relationships/term/1","requestId":"c3474e06-f404-4210-b528-85fa8e40eab1","responseSize":134,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/relationships/term/1 {"duration":2,"environment":"development","label":"GET /api/relationships/term/1","requestId":"c3474e06-f404-4210-b528-85fa8e40eab1","responseSize":134,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/relationships/term/1 404 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/relationships/term/1","requestId":"c3474e06-f404-4210-b528-85fa8e40eab1","responseSize":134,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/relationships/term/1 404 in 1ms :: {"success":false,"message":"Route n… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19"}
[34m[dev:server][0m 📊 GET /api/relationships/term/1 - 1ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/relationships/term/1 {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/relationships/term/1","requestId":"e9c0fd91-7b3c-4e7f-804b-1979d353e8e5","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/relationships/term/1 {"duration":1,"environment":"development","label":"GET /api/relationships/term/1","requestId":"e9c0fd91-7b3c-4e7f-804b-1979d353e8e5","responseSize":134,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/relationships/term/1 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/relationships/term/1","requestId":"e9c0fd91-7b3c-4e7f-804b-1979d353e8e5","responseSize":134,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/relationships/term/1 {"duration":1,"environment":"development","label":"GET /api/relationships/term/1","requestId":"e9c0fd91-7b3c-4e7f-804b-1979d353e8e5","responseSize":134,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/relationships/term/1 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/relationships/term/1","requestId":"e9c0fd91-7b3c-4e7f-804b-1979d353e8e5","responseSize":134,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/relationships/term/1 404 in 1ms :: {"success":false,"message":"Route n… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19"}
[34m[dev:server][0m 📊 GET /api/relationships/term/1 - 2ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/relationships/graph {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/relationships/graph","requestId":"74c75c20-4946-42e1-9a00-ba18dd05dbf5","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/relationships/graph {"duration":1,"environment":"development","label":"GET /api/relationships/graph","requestId":"74c75c20-4946-42e1-9a00-ba18dd05dbf5","responseSize":133,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/relationships/graph 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/relationships/graph","requestId":"74c75c20-4946-42e1-9a00-ba18dd05dbf5","responseSize":133,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/relationships/graph {"duration":2,"environment":"development","label":"GET /api/relationships/graph","requestId":"74c75c20-4946-42e1-9a00-ba18dd05dbf5","responseSize":133,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/relationships/graph 404 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/relationships/graph","requestId":"74c75c20-4946-42e1-9a00-ba18dd05dbf5","responseSize":133,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/relationships/graph 404 in 1ms :: {"success":false,"message":"Route no… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19"}
[34m[dev:server][0m 📊 GET /api/relationships/graph - 1ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/relationships/graph {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/relationships/graph","requestId":"a85c1e58-5a0a-460a-b7e2-7b26d3aecbda","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/relationships/graph {"duration":1,"environment":"development","label":"GET /api/relationships/graph","requestId":"a85c1e58-5a0a-460a-b7e2-7b26d3aecbda","responseSize":133,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/relationships/graph 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/relationships/graph","requestId":"a85c1e58-5a0a-460a-b7e2-7b26d3aecbda","responseSize":133,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/relationships/graph {"duration":1,"environment":"development","label":"GET /api/relationships/graph","requestId":"a85c1e58-5a0a-460a-b7e2-7b26d3aecbda","responseSize":133,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/relationships/graph 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/relationships/graph","requestId":"a85c1e58-5a0a-460a-b7e2-7b26d3aecbda","responseSize":133,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/relationships/graph 404 in 2ms :: {"success":false,"message":"Route no… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19"}
[34m[dev:server][0m 📊 GET /api/relationships/graph - 2ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/media/term/1 {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/media/term/1","requestId":"39e5be75-6677-4452-9b88-eb2538011459","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/media/term/1 {"duration":1,"environment":"development","label":"GET /api/media/term/1","requestId":"39e5be75-6677-4452-9b88-eb2538011459","responseSize":126,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/media/term/1 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/media/term/1","requestId":"39e5be75-6677-4452-9b88-eb2538011459","responseSize":126,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/media/term/1 {"duration":1,"environment":"development","label":"GET /api/media/term/1","requestId":"39e5be75-6677-4452-9b88-eb2538011459","responseSize":126,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/media/term/1 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/media/term/1","requestId":"39e5be75-6677-4452-9b88-eb2538011459","responseSize":126,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/media/term/1 404 in 1ms :: {"success":false,"message":"Route not found… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19"}
[34m[dev:server][0m 📊 GET /api/media/term/1 - 1ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/media/term/1 {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/media/term/1","requestId":"39080578-b27b-4364-a1a5-37accfd66f56","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/media/term/1 {"duration":1,"environment":"development","label":"GET /api/media/term/1","requestId":"39080578-b27b-4364-a1a5-37accfd66f56","responseSize":126,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/media/term/1 404 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/media/term/1","requestId":"39080578-b27b-4364-a1a5-37accfd66f56","responseSize":126,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/media/term/1 {"duration":2,"environment":"development","label":"GET /api/media/term/1","requestId":"39080578-b27b-4364-a1a5-37accfd66f56","responseSize":126,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/media/term/1 404 (2ms) {"duration":2,"environment":"development","method":"GET","path":"/api/media/term/1","requestId":"39080578-b27b-4364-a1a5-37accfd66f56","responseSize":126,"service":"ai-glossary-pro","statusCode":404,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/media/term/1 404 in 1ms :: {"success":false,"message":"Route not found… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19"}
[34m[dev:server][0m 📊 GET /api/media/term/1 - 1ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/admin/stats {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/admin/stats","requestId":"554c136b-da07-4de5-969f-b7a07596761b","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/admin/stats {"duration":1,"environment":"development","label":"GET /api/admin/stats","requestId":"554c136b-da07-4de5-969f-b7a07596761b","responseSize":62,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/admin/stats 401 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/admin/stats","requestId":"554c136b-da07-4de5-969f-b7a07596761b","responseSize":62,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/admin/stats {"duration":1,"environment":"development","label":"GET /api/admin/stats","requestId":"554c136b-da07-4de5-969f-b7a07596761b","responseSize":62,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/admin/stats 401 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/admin/stats","requestId":"554c136b-da07-4de5-969f-b7a07596761b","responseSize":62,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/admin/stats 401 in 1ms :: {"success":false,"message":"No authenticatio… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19"}
[34m[dev:server][0m 📊 GET /api/admin/stats - 1ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/admin/stats {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/admin/stats","requestId":"16ed2d81-054c-4488-8660-500bc68973a8","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/admin/stats {"duration":1,"environment":"development","label":"GET /api/admin/stats","requestId":"16ed2d81-054c-4488-8660-500bc68973a8","responseSize":62,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/admin/stats 401 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/admin/stats","requestId":"16ed2d81-054c-4488-8660-500bc68973a8","responseSize":62,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/admin/stats {"duration":1,"environment":"development","label":"GET /api/admin/stats","requestId":"16ed2d81-054c-4488-8660-500bc68973a8","responseSize":62,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/admin/stats 401 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/admin/stats","requestId":"16ed2d81-054c-4488-8660-500bc68973a8","responseSize":62,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/admin/stats 401 in 0ms :: {"success":false,"message":"No authenticatio… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19"}
[34m[dev:server][0m 📊 GET /api/admin/stats - 0ms
[31m[dev:server][0m [QueryCache] Query failed for key: popular:week DrizzleQueryError: Failed query: select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."view_count", "categories"."name", "categories"."id", "terms"."definition", ARRAY_AGG(DISTINCT "subcategories"."name") FILTER (WHERE "subcategories"."name" IS NOT NULL) from "terms" left join "categories" on "terms"."category_id" = "categories"."id" left join "term_subcategories" on "terms"."id" = "term_subcategories"."term_id" left join "subcategories" on "term_subcategories"."subcategory_id" = "subcategories"."id" group by "terms"."id", "categories"."id", "categories"."name" order by "terms"."view_count" desc limit $1
[31m[dev:server][0m params: 20
[31m[dev:server][0m     at NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:74:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m     ... 2 lines matching cause stack trace ...
[31m[dev:server][0m     at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/terms.ts:261:25) {
[31m[dev:server][0m   query: 'select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."view_count", "categories"."name", "categories"."id", "terms"."definition", ARRAY_AGG(DISTINCT "subcategories"."name") FILTER (WHERE "subcategories"."name" IS NOT NULL) from "terms" left join "categories" on "terms"."category_id" = "categories"."id" left join "term_subcategories" on "terms"."id" = "term_subcategories"."term_id" left join "subcategories" on "term_subcategories"."subcategory_id" = "subcategories"."id" group by "terms"."id", "categories"."id", "categories"."name" order by "terms"."view_count" desc limit $1',
[31m[dev:server][0m   params: [ 20 ],
[31m[dev:server][0m   cause: error: operator does not exist: uuid = integer
[31m[dev:server][0m       at file:///Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/@neondatabase/serverless/index.mjs:1345:74
[31m[dev:server][0m       at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:153:11)
[31m[dev:server][0m       at async NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:72:12)
[31m[dev:server][0m       at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedStorage.ts:267:25)
[31m[dev:server][0m       at async cached (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:235:20)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/terms.ts:261:25) {
[31m[dev:server][0m     length: 200,
[31m[dev:server][0m     severity: 'ERROR',
[31m[dev:server][0m     code: '42883',
[31m[dev:server][0m     detail: undefined,
[31m[dev:server][0m     hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
[31m[dev:server][0m     position: '304',
[31m[dev:server][0m     internalPosition: undefined,
[31m[dev:server][0m     internalQuery: undefined,
[31m[dev:server][0m     where: undefined,
[31m[dev:server][0m     schema: undefined,
[31m[dev:server][0m     table: undefined,
[31m[dev:server][0m     column: undefined,
[31m[dev:server][0m     dataType: undefined,
[31m[dev:server][0m     constraint: undefined,
[31m[dev:server][0m     file: 'parse_oper.c',
[31m[dev:server][0m     line: '647',
[31m[dev:server][0m     routine: 'op_error'
[31m[dev:server][0m   }
[31m[dev:server][0m }
[34m[dev:server][0m [33mwarn[39m: Featured terms query failed, returning empty result {"environment":"development","error":"Failed query: select \"terms\".\"id\", \"terms\".\"name\", \"terms\".\"short_definition\", \"terms\".\"view_count\", \"categories\".\"name\", \"categories\".\"id\", \"terms\".\"definition\", ARRAY_AGG(DISTINCT \"subcategories\".\"name\") FILTER (WHERE \"subcategories\".\"name\" IS NOT NULL) from \"terms\" left join \"categories\" on \"terms\".\"category_id\" = \"categories\".\"id\" left join \"term_subcategories\" on \"terms\".\"id\" = \"term_subcategories\".\"term_id\" left join \"subcategories\" on \"term_subcategories\".\"subcategory_id\" = \"subcategories\".\"id\" group by \"terms\".\"id\", \"categories\".\"id\", \"categories\".\"name\" order by \"terms\".\"view_count\" desc limit $1\nparams: 20","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms/featured {"duration":1563,"environment":"development","label":"GET /api/terms/featured","requestId":"c849e8b8-38b3-4c53-b968-dc65c4c0bbdd","responseSize":122,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms/featured 200 (1563ms) {"duration":1563,"environment":"development","method":"GET","path":"/api/terms/featured","requestId":"c849e8b8-38b3-4c53-b968-dc65c4c0bbdd","responseSize":122,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms/featured {"duration":1563,"environment":"development","label":"GET /api/terms/featured","requestId":"c849e8b8-38b3-4c53-b968-dc65c4c0bbdd","responseSize":122,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms/featured 200 (1563ms) {"duration":1563,"environment":"development","method":"GET","path":"/api/terms/featured","requestId":"c849e8b8-38b3-4c53-b968-dc65c4c0bbdd","responseSize":122,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [33mwarn[39m: Slow request detected: GET /api/terms/featured {"duration":1562.678083,"environment":"development","requestId":"c849e8b8-38b3-4c53-b968-dc65c4c0bbdd","service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:02:19"}
[34m[dev:server][0m [32minfo[39m: GET /api/terms/featured 200 in 1562ms :: {"success":true,"data":[],"message":"N… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19"}
[31m[dev:server][0m 🐌 Slow query detected: GET /api/terms/featured - 1562ms
[34m[dev:server][0m 📊 GET /api/terms/featured - 1562ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/admin/users {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/admin/users","requestId":"f6e76142-08f1-47a3-88cf-ae41d4fe7c36","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/admin/users {"duration":1,"environment":"development","label":"GET /api/admin/users","requestId":"f6e76142-08f1-47a3-88cf-ae41d4fe7c36","responseSize":62,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/admin/users 401 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/admin/users","requestId":"f6e76142-08f1-47a3-88cf-ae41d4fe7c36","responseSize":62,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/admin/users {"duration":1,"environment":"development","label":"GET /api/admin/users","requestId":"f6e76142-08f1-47a3-88cf-ae41d4fe7c36","responseSize":62,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/admin/users 401 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/admin/users","requestId":"f6e76142-08f1-47a3-88cf-ae41d4fe7c36","responseSize":62,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/admin/users 401 in 1ms :: {"success":false,"message":"No authenticatio… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19"}
[34m[dev:server][0m 📊 GET /api/admin/users - 0ms
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/admin/users {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/admin/users","requestId":"51c885cb-e096-4fea-9cc4-eea450c0d695","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19","type":"api_request","userAgent":"curl/8.7.1"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/admin/users {"duration":1,"environment":"development","label":"GET /api/admin/users","requestId":"51c885cb-e096-4fea-9cc4-eea450c0d695","responseSize":62,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/admin/users 401 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/admin/users","requestId":"51c885cb-e096-4fea-9cc4-eea450c0d695","responseSize":62,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/admin/users {"duration":1,"environment":"development","label":"GET /api/admin/users","requestId":"51c885cb-e096-4fea-9cc4-eea450c0d695","responseSize":62,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:19","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/admin/users 401 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/admin/users","requestId":"51c885cb-e096-4fea-9cc4-eea450c0d695","responseSize":62,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:02:19","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/admin/users 401 in 0ms :: {"success":false,"message":"No authenticatio… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:02:19"}
[34m[dev:server][0m 📊 GET /api/admin/users - 0ms
[31m[dev:server][0m Cache Alert [critical]: Hit rate (25.0%) is below threshold (50%)
[31m[dev:server][0m CRITICAL CACHE ALERT: Hit rate (25.0%) is below threshold (50%)
[31m[dev:server][0m Cache Alert [critical]: Cache efficiency (25.0%) is below threshold (70%)
[31m[dev:server][0m CRITICAL CACHE ALERT: Cache efficiency (25.0%) is below threshold (70%)
[34m[dev:server][0m Triggering emergency cache warming...
[34m[dev:server][0m Cache Action: warm-cache - Hit rate (25.0%) is below threshold (50%)
[34m[dev:server][0m 🔥 Starting comprehensive cache warming...
[34m[dev:server][0m 🔥 Warming popular terms cache...
[34m[dev:server][0m 🔥 Warming category tree cache...
[34m[dev:server][0m 🔥 Warming frequent term queries...
[31m[dev:server][0m ❌ Cache warming failed: DrizzleQueryError: Failed query: select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."view_count" from "terms" left join "categories" on "terms"."category_id" = "categories"."id" order by "terms"."view_count" desc limit $1
[31m[dev:server][0m params: 20
[31m[dev:server][0m     at NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:74:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m     ... 2 lines matching cause stack trace ...
[31m[dev:server][0m     at async Object.warmAll (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:410:7) {
[31m[dev:server][0m   query: 'select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."view_count" from "terms" left join "categories" on "terms"."category_id" = "categories"."id" order by "terms"."view_count" desc limit $1',
[31m[dev:server][0m   params: [ 20 ],
[31m[dev:server][0m   cause: error: operator does not exist: uuid = integer
[31m[dev:server][0m       at file:///Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/@neondatabase/serverless/index.mjs:1345:74
[31m[dev:server][0m       at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:153:11)
[31m[dev:server][0m       at async NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:72:12)
[31m[dev:server][0m       at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m       at async Object.warmFrequentTermQueries (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:388:22)
[31m[dev:server][0m       at async Promise.all (index 2)
[31m[dev:server][0m       at async Object.warmAll (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:410:7) {
[31m[dev:server][0m     length: 200,
[31m[dev:server][0m     severity: 'ERROR',
[31m[dev:server][0m     code: '42883',
[31m[dev:server][0m     detail: undefined,
[31m[dev:server][0m     hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
[31m[dev:server][0m     position: '148',
[31m[dev:server][0m     internalPosition: undefined,
[31m[dev:server][0m     internalQuery: undefined,
[31m[dev:server][0m     where: undefined,
[31m[dev:server][0m     schema: undefined,
[31m[dev:server][0m     table: undefined,
[31m[dev:server][0m     column: undefined,
[31m[dev:server][0m     dataType: undefined,
[31m[dev:server][0m     constraint: undefined,
[31m[dev:server][0m     file: 'parse_oper.c',
[31m[dev:server][0m     line: '647',
[31m[dev:server][0m     routine: 'op_error'
[31m[dev:server][0m   }
[31m[dev:server][0m }
[31m[dev:server][0m Cache Alert [critical]: Hit rate (25.0%) is below threshold (50%)
[31m[dev:server][0m CRITICAL CACHE ALERT: Hit rate (25.0%) is below threshold (50%)
[31m[dev:server][0m Cache Alert [critical]: Cache efficiency (25.0%) is below threshold (70%)
[31m[dev:server][0m CRITICAL CACHE ALERT: Cache efficiency (25.0%) is below threshold (70%)
[34m[dev:server][0m Triggering emergency cache warming...
[34m[dev:server][0m Cache Action: warm-cache - Hit rate (25.0%) is below threshold (50%)
[34m[dev:server][0m 🔥 Starting comprehensive cache warming...
[34m[dev:server][0m 🔥 Warming popular terms cache...
[34m[dev:server][0m 🔥 Warming frequent term queries...
[34m[dev:server][0m 🔥 Warming category tree cache...
[31m[dev:server][0m ❌ Cache warming failed: DrizzleQueryError: Failed query: select "categories"."id", "categories"."name", "categories"."description", count("terms"."id")::int from "categories" left join "terms" on "terms"."category_id" = "categories"."id" group by "categories"."id", "categories"."name", "categories"."description" order by "categories"."name"
[31m[dev:server][0m params: 
[31m[dev:server][0m     at NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:74:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m     ... 2 lines matching cause stack trace ...
[31m[dev:server][0m     at async Object.warmAll (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:410:7) {
[31m[dev:server][0m   query: 'select "categories"."id", "categories"."name", "categories"."description", count("terms"."id")::int from "categories" left join "terms" on "terms"."category_id" = "categories"."id" group by "categories"."id", "categories"."name", "categories"."description" order by "categories"."name"',
[31m[dev:server][0m   params: [],
[31m[dev:server][0m   cause: error: operator does not exist: uuid = integer
[31m[dev:server][0m       at file:///Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/@neondatabase/serverless/index.mjs:1345:74
[31m[dev:server][0m       at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:153:11)
[31m[dev:server][0m       at async NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:72:12)
[31m[dev:server][0m       at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m       at async Object.warmCategoryTree (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:337:26)
[31m[dev:server][0m       at async Promise.all (index 1)
[31m[dev:server][0m       at async Object.warmAll (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:410:7) {
[31m[dev:server][0m     length: 200,
[31m[dev:server][0m     severity: 'ERROR',
[31m[dev:server][0m     code: '42883',
[31m[dev:server][0m     detail: undefined,
[31m[dev:server][0m     hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
[31m[dev:server][0m     position: '162',
[31m[dev:server][0m     internalPosition: undefined,
[31m[dev:server][0m     internalQuery: undefined,
[31m[dev:server][0m     where: undefined,
[31m[dev:server][0m     schema: undefined,
[31m[dev:server][0m     table: undefined,
[31m[dev:server][0m     column: undefined,
[31m[dev:server][0m     dataType: undefined,
[31m[dev:server][0m     constraint: undefined,
[31m[dev:server][0m     file: 'parse_oper.c',
[31m[dev:server][0m     line: '647',
[31m[dev:server][0m     routine: 'op_error'
[31m[dev:server][0m   }
[31m[dev:server][0m }
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/auth/user {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/auth/user","referer":"http://localhost:5173/app","requestId":"5954c2e5-daf8-4a98-890d-9e8300ea053f","service":"ai-glossary-pro","timestamp":"2025-07-10 15:04:00","type":"api_request","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
[31m[dev:server][0m Get user error: ReferenceError: require is not defined
[31m[dev:server][0m     at <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/firebaseAuth.ts:398:19)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[31m[dev:server][0m     at next (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/route.js:149:13)
[31m[dev:server][0m     at Route.dispatch (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/route.js:119:3)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[31m[dev:server][0m     at /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:284:15
[31m[dev:server][0m     at Function.process_params (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:346:12)
[31m[dev:server][0m     at next (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:280:10)
[31m[dev:server][0m     at responseLoggingMiddleware (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/responseLogging.ts:41:3)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/auth/user {"duration":1,"environment":"development","label":"GET /api/auth/user","requestId":"5954c2e5-daf8-4a98-890d-9e8300ea053f","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:04:00","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/auth/user 401 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/auth/user","requestId":"5954c2e5-daf8-4a98-890d-9e8300ea053f","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:04:00","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/auth/user {"duration":1,"environment":"development","label":"GET /api/auth/user","requestId":"5954c2e5-daf8-4a98-890d-9e8300ea053f","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:04:00","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/auth/user 401 (1ms) {"duration":1,"environment":"development","method":"GET","path":"/api/auth/user","requestId":"5954c2e5-daf8-4a98-890d-9e8300ea053f","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:04:00","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/auth/user 401 in 1ms :: {"success":false,"message":"Authentication req… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:04:00"}
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/auth/user {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/auth/user","referer":"http://localhost:5173/app","requestId":"92ecf02a-42b3-44cc-a54d-2131e4fc2a84","service":"ai-glossary-pro","timestamp":"2025-07-10 15:04:00","type":"api_request","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
[31m[dev:server][0m Get user error: ReferenceError: require is not defined
[31m[dev:server][0m     at <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/firebaseAuth.ts:398:19)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[31m[dev:server][0m     at next (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/route.js:149:13)
[31m[dev:server][0m     at Route.dispatch (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/route.js:119:3)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[31m[dev:server][0m     at /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:284:15
[31m[dev:server][0m     at Function.process_params (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:346:12)
[31m[dev:server][0m     at next (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/index.js:280:10)
[31m[dev:server][0m     at responseLoggingMiddleware (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/responseLogging.ts:41:3)
[31m[dev:server][0m     at Layer.handle [as handle_request] (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/express/lib/router/layer.js:95:5)
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/auth/user {"duration":0,"environment":"development","label":"GET /api/auth/user","requestId":"92ecf02a-42b3-44cc-a54d-2131e4fc2a84","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:04:00","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/auth/user 401 (0ms) {"duration":0,"environment":"development","method":"GET","path":"/api/auth/user","requestId":"92ecf02a-42b3-44cc-a54d-2131e4fc2a84","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:04:00","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/auth/user {"duration":0,"environment":"development","label":"GET /api/auth/user","requestId":"92ecf02a-42b3-44cc-a54d-2131e4fc2a84","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:04:00","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/auth/user 401 (0ms) {"duration":0,"environment":"development","method":"GET","path":"/api/auth/user","requestId":"92ecf02a-42b3-44cc-a54d-2131e4fc2a84","responseSize":106,"service":"ai-glossary-pro","statusCode":401,"timestamp":"2025-07-10 15:04:00","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/auth/user 401 in 1ms :: {"success":false,"message":"Authentication req… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:04:00"}
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/terms/featured {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/terms/featured","referer":"http://localhost:5173/app","requestId":"4cb7df73-8daa-4a66-a47f-9fd7262f11c4","service":"ai-glossary-pro","timestamp":"2025-07-10 15:04:00","type":"api_request","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
[31m[dev:server][0m [QueryCache] Query failed for key: popular:week DrizzleQueryError: Failed query: select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."view_count", "categories"."name", "categories"."id", "terms"."definition", ARRAY_AGG(DISTINCT "subcategories"."name") FILTER (WHERE "subcategories"."name" IS NOT NULL) from "terms" left join "categories" on "terms"."category_id" = "categories"."id" left join "term_subcategories" on "terms"."id" = "term_subcategories"."term_id" left join "subcategories" on "term_subcategories"."subcategory_id" = "subcategories"."id" group by "terms"."id", "categories"."id", "categories"."name" order by "terms"."view_count" desc limit $1
[31m[dev:server][0m params: 20
[31m[dev:server][0m     at NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:74:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m     ... 2 lines matching cause stack trace ...
[31m[dev:server][0m     at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/terms.ts:261:25) {
[31m[dev:server][0m   query: 'select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."view_count", "categories"."name", "categories"."id", "terms"."definition", ARRAY_AGG(DISTINCT "subcategories"."name") FILTER (WHERE "subcategories"."name" IS NOT NULL) from "terms" left join "categories" on "terms"."category_id" = "categories"."id" left join "term_subcategories" on "terms"."id" = "term_subcategories"."term_id" left join "subcategories" on "term_subcategories"."subcategory_id" = "subcategories"."id" group by "terms"."id", "categories"."id", "categories"."name" order by "terms"."view_count" desc limit $1',
[31m[dev:server][0m   params: [ 20 ],
[31m[dev:server][0m   cause: error: operator does not exist: uuid = integer
[31m[dev:server][0m       at file:///Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/@neondatabase/serverless/index.mjs:1345:74
[31m[dev:server][0m       at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:153:11)
[31m[dev:server][0m       at async NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:72:12)
[31m[dev:server][0m       at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/optimizedStorage.ts:267:25)
[31m[dev:server][0m       at async cached (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:235:20)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/terms.ts:261:25) {
[31m[dev:server][0m     length: 200,
[31m[dev:server][0m     severity: 'ERROR',
[31m[dev:server][0m     code: '42883',
[31m[dev:server][0m     detail: undefined,
[31m[dev:server][0m     hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
[31m[dev:server][0m     position: '304',
[31m[dev:server][0m     internalPosition: undefined,
[31m[dev:server][0m     internalQuery: undefined,
[31m[dev:server][0m     where: undefined,
[31m[dev:server][0m     schema: undefined,
[31m[dev:server][0m     table: undefined,
[31m[dev:server][0m     column: undefined,
[31m[dev:server][0m     dataType: undefined,
[31m[dev:server][0m     constraint: undefined,
[31m[dev:server][0m     file: 'parse_oper.c',
[31m[dev:server][0m     line: '647',
[31m[dev:server][0m     routine: 'op_error'
[31m[dev:server][0m   }
[31m[dev:server][0m }
[34m[dev:server][0m [33mwarn[39m: Featured terms query failed, returning empty result {"environment":"development","error":"Failed query: select \"terms\".\"id\", \"terms\".\"name\", \"terms\".\"short_definition\", \"terms\".\"view_count\", \"categories\".\"name\", \"categories\".\"id\", \"terms\".\"definition\", ARRAY_AGG(DISTINCT \"subcategories\".\"name\") FILTER (WHERE \"subcategories\".\"name\" IS NOT NULL) from \"terms\" left join \"categories\" on \"terms\".\"category_id\" = \"categories\".\"id\" left join \"term_subcategories\" on \"terms\".\"id\" = \"term_subcategories\".\"term_id\" left join \"subcategories\" on \"term_subcategories\".\"subcategory_id\" = \"subcategories\".\"id\" group by \"terms\".\"id\", \"categories\".\"id\", \"categories\".\"name\" order by \"terms\".\"view_count\" desc limit $1\nparams: 20","service":"ai-glossary-pro","timestamp":"2025-07-10 15:04:00"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms/featured {"duration":261,"environment":"development","label":"GET /api/terms/featured","requestId":"4cb7df73-8daa-4a66-a47f-9fd7262f11c4","responseSize":122,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:04:00","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms/featured 200 (261ms) {"duration":261,"environment":"development","method":"GET","path":"/api/terms/featured","requestId":"4cb7df73-8daa-4a66-a47f-9fd7262f11c4","responseSize":122,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:04:00","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/terms/featured {"duration":261,"environment":"development","label":"GET /api/terms/featured","requestId":"4cb7df73-8daa-4a66-a47f-9fd7262f11c4","responseSize":122,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:04:00","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/terms/featured 200 (261ms) {"duration":261,"environment":"development","method":"GET","path":"/api/terms/featured","requestId":"4cb7df73-8daa-4a66-a47f-9fd7262f11c4","responseSize":122,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:04:00","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/terms/featured 200 in 261ms :: {"success":true,"data":[],"message":"No… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:04:00"}
[34m[dev:server][0m 📊 GET /api/terms/featured - 261ms
[31m[dev:server][0m Cache Alert [critical]: Hit rate (24.0%) is below threshold (50%)
[31m[dev:server][0m CRITICAL CACHE ALERT: Hit rate (24.0%) is below threshold (50%)
[31m[dev:server][0m Cache Alert [critical]: Cache efficiency (24.0%) is below threshold (70%)
[31m[dev:server][0m CRITICAL CACHE ALERT: Cache efficiency (24.0%) is below threshold (70%)
[34m[dev:server][0m Triggering emergency cache warming...
[34m[dev:server][0m Cache Action: warm-cache - Hit rate (24.0%) is below threshold (50%)
[34m[dev:server][0m 🔥 Starting comprehensive cache warming...
[34m[dev:server][0m 🔥 Warming popular terms cache...
[34m[dev:server][0m 🔥 Warming category tree cache...
[34m[dev:server][0m 🔥 Warming frequent term queries...
[31m[dev:server][0m ❌ Cache warming failed: DrizzleQueryError: Failed query: select "categories"."id", "categories"."name", "categories"."description", count("terms"."id")::int from "categories" left join "terms" on "terms"."category_id" = "categories"."id" group by "categories"."id", "categories"."name", "categories"."description" order by "categories"."name"
[31m[dev:server][0m params: 
[31m[dev:server][0m     at NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:74:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m     ... 2 lines matching cause stack trace ...
[31m[dev:server][0m     at async Object.warmAll (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:410:7) {
[31m[dev:server][0m   query: 'select "categories"."id", "categories"."name", "categories"."description", count("terms"."id")::int from "categories" left join "terms" on "terms"."category_id" = "categories"."id" group by "categories"."id", "categories"."name", "categories"."description" order by "categories"."name"',
[31m[dev:server][0m   params: [],
[31m[dev:server][0m   cause: error: operator does not exist: uuid = integer
[31m[dev:server][0m       at file:///Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/@neondatabase/serverless/index.mjs:1345:74
[31m[dev:server][0m       at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:153:11)
[31m[dev:server][0m       at async NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:72:12)
[31m[dev:server][0m       at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m       at async Object.warmCategoryTree (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:337:26)
[31m[dev:server][0m       at async Promise.all (index 1)
[31m[dev:server][0m       at async Object.warmAll (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:410:7) {
[31m[dev:server][0m     length: 200,
[31m[dev:server][0m     severity: 'ERROR',
[31m[dev:server][0m     code: '42883',
[31m[dev:server][0m     detail: undefined,
[31m[dev:server][0m     hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
[31m[dev:server][0m     position: '162',
[31m[dev:server][0m     internalPosition: undefined,
[31m[dev:server][0m     internalQuery: undefined,
[31m[dev:server][0m     where: undefined,
[31m[dev:server][0m     schema: undefined,
[31m[dev:server][0m     table: undefined,
[31m[dev:server][0m     column: undefined,
[31m[dev:server][0m     dataType: undefined,
[31m[dev:server][0m     constraint: undefined,
[31m[dev:server][0m     file: 'parse_oper.c',
[31m[dev:server][0m     line: '647',
[31m[dev:server][0m     routine: 'op_error'
[31m[dev:server][0m   }
[31m[dev:server][0m }
[31m[dev:server][0m Cache Alert [critical]: Hit rate (24.0%) is below threshold (50%)
[31m[dev:server][0m CRITICAL CACHE ALERT: Hit rate (24.0%) is below threshold (50%)
[31m[dev:server][0m Cache Alert [critical]: Cache efficiency (24.0%) is below threshold (70%)
[31m[dev:server][0m CRITICAL CACHE ALERT: Cache efficiency (24.0%) is below threshold (70%)
[34m[dev:server][0m Triggering emergency cache warming...
[34m[dev:server][0m Cache Action: warm-cache - Hit rate (24.0%) is below threshold (50%)
[34m[dev:server][0m 🔥 Starting comprehensive cache warming...
[34m[dev:server][0m 🔥 Warming category tree cache...
[34m[dev:server][0m 🔥 Warming popular terms cache...
[34m[dev:server][0m 🔥 Warming frequent term queries...
[31m[dev:server][0m ❌ Cache warming failed: DrizzleQueryError: Failed query: select "categories"."id", "categories"."name", "categories"."description", count("terms"."id")::int from "categories" left join "terms" on "terms"."category_id" = "categories"."id" group by "categories"."id", "categories"."name", "categories"."description" order by "categories"."name"
[31m[dev:server][0m params: 
[31m[dev:server][0m     at NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:74:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m     ... 2 lines matching cause stack trace ...
[31m[dev:server][0m     at async Object.warmAll (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:410:7) {
[31m[dev:server][0m   query: 'select "categories"."id", "categories"."name", "categories"."description", count("terms"."id")::int from "categories" left join "terms" on "terms"."category_id" = "categories"."id" group by "categories"."id", "categories"."name", "categories"."description" order by "categories"."name"',
[31m[dev:server][0m   params: [],
[31m[dev:server][0m   cause: error: operator does not exist: uuid = integer
[31m[dev:server][0m       at file:///Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/@neondatabase/serverless/index.mjs:1345:74
[31m[dev:server][0m       at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:153:11)
[31m[dev:server][0m       at async NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:72:12)
[31m[dev:server][0m       at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m       at async Object.warmCategoryTree (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:337:26)
[31m[dev:server][0m       at async Promise.all (index 1)
[31m[dev:server][0m       at async Object.warmAll (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:410:7) {
[31m[dev:server][0m     length: 200,
[31m[dev:server][0m     severity: 'ERROR',
[31m[dev:server][0m     code: '42883',
[31m[dev:server][0m     detail: undefined,
[31m[dev:server][0m     hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
[31m[dev:server][0m     position: '162',
[31m[dev:server][0m     internalPosition: undefined,
[31m[dev:server][0m     internalQuery: undefined,
[31m[dev:server][0m     where: undefined,
[31m[dev:server][0m     schema: undefined,
[31m[dev:server][0m     table: undefined,
[31m[dev:server][0m     column: undefined,
[31m[dev:server][0m     dataType: undefined,
[31m[dev:server][0m     constraint: undefined,
[31m[dev:server][0m     file: 'parse_oper.c',
[31m[dev:server][0m     line: '647',
[31m[dev:server][0m     routine: 'op_error'
[31m[dev:server][0m   }
[31m[dev:server][0m }
[31m[dev:server][0m Cache Alert [critical]: Hit rate (24.0%) is below threshold (50%)
[31m[dev:server][0m CRITICAL CACHE ALERT: Hit rate (24.0%) is below threshold (50%)
[31m[dev:server][0m Cache Alert [critical]: Cache efficiency (24.0%) is below threshold (70%)
[31m[dev:server][0m CRITICAL CACHE ALERT: Cache efficiency (24.0%) is below threshold (70%)
[34m[dev:server][0m Triggering emergency cache warming...
[34m[dev:server][0m Cache Action: warm-cache - Hit rate (24.0%) is below threshold (50%)
[34m[dev:server][0m 🔥 Starting comprehensive cache warming...
[34m[dev:server][0m 🔥 Warming popular terms cache...
[34m[dev:server][0m 🔥 Warming category tree cache...
[34m[dev:server][0m 🔥 Warming frequent term queries...
[34m[dev:server][0m [32minfo[39m: Saved 160 AI results to cache {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:06:50"}
[31m[dev:server][0m ❌ Cache warming failed: DrizzleQueryError: Failed query: select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."view_count" from "terms" left join "categories" on "terms"."category_id" = "categories"."id" order by "terms"."view_count" desc limit $1
[31m[dev:server][0m params: 20
[31m[dev:server][0m     at NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:74:11)
[31m[dev:server][0m     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m     at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m     ... 2 lines matching cause stack trace ...
[31m[dev:server][0m     at async Object.warmAll (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:410:7) {
[31m[dev:server][0m   query: 'select "terms"."id", "terms"."name", "terms"."short_definition", "terms"."view_count" from "terms" left join "categories" on "terms"."category_id" = "categories"."id" order by "terms"."view_count" desc limit $1',
[31m[dev:server][0m   params: [ 20 ],
[31m[dev:server][0m   cause: error: operator does not exist: uuid = integer
[31m[dev:server][0m       at file:///Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/@neondatabase/serverless/index.mjs:1345:74
[31m[dev:server][0m       at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[31m[dev:server][0m       at async <anonymous> (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:153:11)
[31m[dev:server][0m       at async NeonPreparedQuery.queryWithCache (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/pg-core/session.ts:72:12)
[31m[dev:server][0m       at async NeonPreparedQuery.execute (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/node_modules/src/neon-serverless/session.ts:152:18)
[31m[dev:server][0m       at async Object.warmFrequentTermQueries (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:388:22)
[31m[dev:server][0m       at async Promise.all (index 2)
[31m[dev:server][0m       at async Object.warmAll (/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/middleware/queryCache.ts:410:7) {
[31m[dev:server][0m     length: 200,
[31m[dev:server][0m     severity: 'ERROR',
[31m[dev:server][0m     code: '42883',
[31m[dev:server][0m     detail: undefined,
[31m[dev:server][0m     hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
[31m[dev:server][0m     position: '148',
[31m[dev:server][0m     internalPosition: undefined,
[31m[dev:server][0m     internalQuery: undefined,
[31m[dev:server][0m     where: undefined,
[31m[dev:server][0m     schema: undefined,
[31m[dev:server][0m     table: undefined,
[31m[dev:server][0m     column: undefined,
[31m[dev:server][0m     dataType: undefined,
[31m[dev:server][0m     constraint: undefined,
[31m[dev:server][0m     file: 'parse_oper.c',
[31m[dev:server][0m     line: '647',
[31m[dev:server][0m     routine: 'op_error'
[31m[dev:server][0m   }
[31m[dev:server][0m }
[34m[dev:server][0m [32minfo[39m: API Request: GET /api/early-bird-status {"environment":"development","ip":"127.0.0.1","method":"GET","path":"/api/early-bird-status","referer":"http://localhost:5173/","requestId":"6e8617f8-4a49-4f09-8a07-9dffb1355b29","service":"ai-glossary-pro","timestamp":"2025-07-10 15:06:52","type":"api_request","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/early-bird-status {"duration":273,"environment":"development","label":"GET /api/early-bird-status","requestId":"6e8617f8-4a49-4f09-8a07-9dffb1355b29","responseSize":276,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:06:52","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/early-bird-status 200 (273ms) {"duration":273,"environment":"development","method":"GET","path":"/api/early-bird-status","requestId":"6e8617f8-4a49-4f09-8a07-9dffb1355b29","responseSize":276,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:06:52","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: Performance: GET /api/early-bird-status {"duration":273,"environment":"development","label":"GET /api/early-bird-status","requestId":"6e8617f8-4a49-4f09-8a07-9dffb1355b29","responseSize":276,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:06:52","type":"performance"}
[34m[dev:server][0m [32minfo[39m: API Response: GET /api/early-bird-status 200 (273ms) {"duration":273,"environment":"development","method":"GET","path":"/api/early-bird-status","requestId":"6e8617f8-4a49-4f09-8a07-9dffb1355b29","responseSize":276,"service":"ai-glossary-pro","statusCode":200,"timestamp":"2025-07-10 15:06:52","type":"api_response"}
[34m[dev:server][0m [32minfo[39m: GET /api/early-bird-status 200 in 273ms :: {"success":true,"data":{"totalRegist… {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:06:52"}
[34m[dev:server][0m 📊 GET /api/early-bird-status - 273ms

============================================================
[36m  🔄 Shutting Down Development Servers[0m
============================================================
[34mℹ️  Terminating frontend server...[0m
[34mℹ️  Terminating backend server...[0m
[34m[dev:server][0m 🔄 Graceful shutdown initiated...
[34m[dev:server][0m 🔄 Shutting down job queue system...
[34m[dev:server][0m [32minfo[39m: Shutting down job queue manager... {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Worker for ai_content_generation closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Worker for ai_batch_processing closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Worker for column_batch_processing closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Worker for column_batch_estimation closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Worker for column_batch_monitoring closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Worker for column_batch_cleanup closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Worker for db_batch_insert closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Worker for email_send closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Worker for cache_warm closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Worker for cache_precompute closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Worker for analytics_aggregate closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Queue events for ai_content_generation closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Queue events for ai_batch_processing closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Queue events for column_batch_processing closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Queue events for column_batch_estimation closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Queue events for column_batch_monitoring closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Queue events for column_batch_cleanup closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Queue events for db_batch_insert closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Queue events for email_send closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Queue events for cache_warm closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Queue events for cache_precompute closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Queue events for analytics_aggregate closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Queue ai_content_generation closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Queue ai_batch_processing closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Queue column_batch_processing closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Queue column_batch_estimation closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Queue column_batch_monitoring closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Queue column_batch_cleanup closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Queue db_batch_insert closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Queue email_send closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Queue cache_warm closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Queue cache_precompute closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Queue analytics_aggregate closed {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m [32minfo[39m: Job queue manager shutdown complete {"environment":"development","service":"ai-glossary-pro","timestamp":"2025-07-10 15:07:06"}
[34m[dev:server][0m ✅ Job queue system shutdown complete
[34m[dev:server][0m ✅ HTTP server closed
[34m[dev:server][0m 💾 Saving final error logs...
[32m✅ Development servers stopped[0m
