# Environment Variables Configuration

## Required Environment Variables for AWS App Runner

### 🔴 Critical (Application won't start without these)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Application environment | `production` | ✅ |
| `PORT` | Server port (must be 8080 for App Runner) | `8080` | ✅ |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` | ✅ |

### 🟡 Authentication & Security

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret for JWT token signing (min 32 chars) | `your-super-secret-jwt-key-here-min-32-chars` | ✅ |
| `SESSION_SECRET` | Express session secret (min 32 chars) | `your-session-secret-key-here-min-32-chars` | ✅ |
| `FIREBASE_PROJECT_ID` | Firebase project identifier | `aiglossary-a7199` | ✅* |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | `firebase-adminsdk-xxx@project.iam.gserviceaccount.com` | ✅* |
| `FIREBASE_PRIVATE_KEY_BASE64` | Base64 encoded Firebase private key | `LS0tLS1CRU...` | ✅* |

*Required if using Firebase authentication

### 🟢 Optional Services

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key for AI features | `sk-...` | ❌ |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | `sk-ant-...` | ❌ |
| `AWS_ACCESS_KEY_ID` | AWS credentials for S3 | `AKIA...` | ❌ |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `...` | ❌ |
| `AWS_REGION` | AWS region for services | `us-east-1` | ❌ |
| `S3_BUCKET_NAME` | S3 bucket for file storage | `aiglossarypro-uploads` | ❌ |
| `REDIS_URL` | Redis connection for caching | `redis://localhost:6379` | ❌ |
| `SENTRY_DSN` | Sentry error tracking | `https://xxx@xxx.ingest.sentry.io/xxx` | ❌ |

### 🔵 Email Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `EMAIL_FROM` | Default from email | `noreply@aiglossarypro.com` | ❌ |
| `SENDGRID_API_KEY` | SendGrid API key | `SG.xxx` | ❌ |
| `RESEND_API_KEY` | Resend API key (alternative) | `re_xxx` | ❌ |

### 🟣 Analytics & Monitoring

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `MIXPANEL_TOKEN` | Mixpanel analytics token | `xxx` | ❌ |
| `POSTHOG_API_KEY` | PostHog analytics key | `phc_xxx` | ❌ |
| `GOOGLE_ANALYTICS_ID` | Google Analytics ID | `G-XXXXXXX` | ❌ |

### 🟤 Application Settings

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `BASE_URL` | Application base URL | `https://your-app.awsapprunner.com` | ❌ |
| `CORS_ORIGIN` | Allowed CORS origins | `https://yourdomain.com` | ❌ |
| `MAX_REQUEST_SIZE` | Max request body size | `1048576` (1MB) | ❌ |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) | ❌ |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | ❌ |

## Setting Environment Variables in AWS App Runner

### Via AWS Console
1. Navigate to App Runner > Your Service > Configuration
2. Click "Edit" under Environment Variables
3. Add each variable as a key-value pair
4. Save and deploy

### Via AWS CLI
```bash
aws apprunner update-service \
  --service-arn "arn:aws:apprunner:region:account:service/service-name" \
  --source-configuration '{
    "ImageRepository": {
      "RuntimeEnvironmentVariables": {
        "NODE_ENV": "production",
        "PORT": "8080",
        "DATABASE_URL": "your-database-url"
      }
    }
  }'
```

### Via Infrastructure as Code (Terraform)
```hcl
resource "aws_apprunner_service" "api" {
  service_name = "aiglossarypro-api"
  
  source_configuration {
    image_repository {
      runtime_environment_variables = {
        NODE_ENV     = "production"
        PORT         = "8080"
        DATABASE_URL = var.database_url
      }
    }
  }
}
```

## Security Best Practices

1. **Never commit secrets to git**
   - Use `.env` files locally
   - Add `.env` to `.gitignore`

2. **Use AWS Secrets Manager for sensitive values**
   ```bash
   aws secretsmanager create-secret \
     --name aiglossarypro/prod/jwt-secret \
     --secret-string "your-secret-here"
   ```

3. **Rotate secrets regularly**
   - JWT_SECRET: Every 90 days
   - API keys: Every 180 days
   - Database passwords: Every 60 days

4. **Use least privilege principle**
   - Create specific IAM roles
   - Limit API key permissions
   - Use read-only database users where possible

## Encoding Firebase Private Key

The Firebase private key must be base64 encoded:

```bash
# 1. Get the private key from Firebase Console
# 2. Save it to a file (firebase-key.txt)
# 3. Encode it:
cat firebase-key.txt | base64 | tr -d '\n' > firebase-key-base64.txt

# 4. Copy the content and set as FIREBASE_PRIVATE_KEY_BASE64
```

## Troubleshooting

### Missing Environment Variable Errors
```
Error: Missing required environment variable: DATABASE_URL
```
**Solution:** Add the variable in App Runner configuration

### Invalid Format Errors
```
Error: Invalid DATABASE_URL format
```
**Solution:** Ensure proper format: `postgresql://user:pass@host:port/db`

### Authentication Failures
```
Error: Firebase initialization failed
```
**Solution:** Verify FIREBASE_* variables are set correctly

## Local Development

Create a `.env` file in the project root:
```env
NODE_ENV=development
PORT=8080
DATABASE_URL=postgresql://localhost:5432/aiglossary_dev
JWT_SECRET=development-secret-min-32-characters-long
SESSION_SECRET=development-session-secret-32-chars
```

Load in development:
```javascript
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
```